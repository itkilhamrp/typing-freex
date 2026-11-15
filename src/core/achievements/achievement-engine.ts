/**
 * Achievement Evaluation Engine
 * Pure TypeScript evaluation engine for Typing FreeX achievements and advancements.
 * Zero side effects, zero async, 100% unit-testable.
 */

import {
  getAchievementDefinition,
  type AchievementCategory,
  type AchievementTier,
  type TrophyShape,
  type AdvancementShape,
} from './achievement-registry';
import type {
  AchievementDto,
  AchievementProgressDto,
  AchievementUpdateDto,
  AdvancementDto,
  AdvancementUpdateDto,
  TrackingStateEntry,
  TrackingStateUpdateDto,
} from '../ipc/contracts';

export interface EvaluationContext {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number | null;
  durationSeconds: number;
  mode: string;
  modeVariant: string;
  language: string;
  isPersonalBest: boolean;
  completedAt: string; // ISO string
  correctChars?: number;
  incorrectChars?: number;
  totalKeystrokes?: number;
  characterProducingKeystrokes?: number;
  wordCount?: number;
  failedByDifficulty?: boolean;
  isCompleted?: boolean;
  difficulty?: 'normal' | 'expert' | 'master';
}

export interface UnlockedAchievement {
  achievementId: string;
  tier: AchievementTier;
  category: AchievementCategory;
  labelKey: string;
  descKey: string;
  icon: string;
  trophyShape: TrophyShape;
  advancementShape?: AdvancementShape;
}

export interface EvaluationResult {
  achievementUpdates: AchievementUpdateDto[];
  advancementUpdates: AdvancementUpdateDto[];
  stateUpdates: TrackingStateUpdateDto[];
  newUnlocks: UnlockedAchievement[];
  /** Legacy flattened updates array for test suite and backward compatibility */
  updates: Array<{
    achievement_id: string;
    current_value: number;
    unlocked: boolean;
    unlocked_at: string | null;
    tier: number;
  }>;
}

const MODE_BITS: Record<string, number> = {
  time: 1 << 0,
  words: 1 << 1,
  quote: 1 << 2,
  tech: 1 << 3,
  custom: 1 << 4,
  zen: 1 << 5,
};

function parseYmd(dateStr: string): { y: number; m: number; d: number; ymdInt: number } {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const ymdInt = y * 10000 + m * 100 + day;
  return { y, m, d: day, ymdInt };
}

function daysDiff(ymd1: number, ymd2: number): number {
  const y1 = Math.floor(ymd1 / 10000);
  const m1 = Math.floor((ymd1 % 10000) / 100) - 1;
  const d1 = ymd1 % 100;

  const y2 = Math.floor(ymd2 / 10000);
  const m2 = Math.floor((ymd2 % 10000) / 100) - 1;
  const d2 = ymd2 % 100;

  const date1 = Date.UTC(y1, m1, d1);
  const date2 = Date.UTC(y2, m2, d2);
  return Math.round((date2 - date1) / (1000 * 60 * 60 * 24));
}

export function evaluateAchievements(
  ctx: EvaluationContext,
  currentAchievements: Map<string, AchievementDto | AchievementProgressDto>,
  currentAdvancements?: Map<string, AdvancementDto>,
  currentState?: Map<string, TrackingStateEntry>,
): EvaluationResult {
  // Incomplete tests and failed-by-difficulty tests (master/expert mode failures)
  // must NEVER evaluate achievements or update progress
  if (ctx.failedByDifficulty || ctx.isCompleted === false) {
    return {
      achievementUpdates: [],
      advancementUpdates: [],
      stateUpdates: [],
      newUnlocks: [],
      updates: [],
    };
  }

  // Standard competitive modes: Time, Words, Quote, Tech
  // (Prevents short trivial custom text farming of competitive speed & accuracy feats)
  const difficulty = ctx.difficulty ?? 'normal';
  const isExpert = difficulty === 'expert';
  const isMaster = difficulty === 'master';
  const isStandardCompetitive =
    ctx.mode === 'time' || ctx.mode === 'words' || ctx.mode === 'quote' || ctx.mode === 'tech';
  const isCustomMode = ctx.mode === 'custom';
  const isZenMode = ctx.mode === 'zen';
  const isLegitimateCompetitiveTest = isStandardCompetitive && ctx.durationSeconds >= 5;

  const achievementUpdates: AchievementUpdateDto[] = [];
  const advancementUpdates: AdvancementUpdateDto[] = [];
  const stateUpdates: TrackingStateUpdateDto[] = [];
  const updates: Array<{
    achievement_id: string;
    current_value: number;
    unlocked: boolean;
    unlocked_at: string | null;
    tier: number;
  }> = [];
  const newUnlocks: UnlockedAchievement[] = [];
  const now = ctx.completedAt;
  const effectiveWordCount =
    ctx.wordCount ?? Math.max(1, Math.round((ctx.wpm * ctx.durationSeconds) / 60));

  // Internal normalized storage maps
  const achMap = new Map<
    string,
    { current_value: number; target_value: number; tier: number; unlocked: boolean; unlocked_at: string | null }
  >();
  const advMap = new Map<string, { rank: number; unlocked: boolean; unlocked_at: string | null }>();
  const stateMap = new Map<string, number>();

  if (!currentAdvancements && !currentState) {
    // Backward compatibility when caller passes a single combined Map
    for (const [key, val] of currentAchievements.entries()) {
      if (key.startsWith('_state_')) {
        stateMap.set(key, val.current_value);
      } else {
        const def = getAchievementDefinition(key);
        if (def?.category === 'achievement') {
          achMap.set(key, {
            current_value: val.current_value,
            target_value: (val as AchievementDto).target_value ?? 1,
            tier: val.tier,
            unlocked: val.unlocked,
            unlocked_at: val.unlocked_at,
          });
        } else {
          advMap.set(key, {
            rank: val.tier,
            unlocked: val.unlocked,
            unlocked_at: val.unlocked_at,
          });
        }
      }
    }
  } else {
    for (const [k, v] of currentAchievements.entries()) {
      achMap.set(k, {
        current_value: v.current_value,
        target_value: (v as AchievementDto).target_value ?? 1,
        tier: v.tier,
        unlocked: v.unlocked,
        unlocked_at: v.unlocked_at,
      });
    }
    if (currentAdvancements) {
      for (const [k, v] of currentAdvancements.entries()) {
        advMap.set(k, {
          rank: v.rank,
          unlocked: v.unlocked,
          unlocked_at: v.unlocked_at,
        });
      }
    }
    if (currentState) {
      for (const [k, v] of currentState.entries()) {
        stateMap.set(k, v.value);
      }
    }
  }

  // Unified record accessor
  const getRecord = (
    id: string,
  ): { current_value: number; tier: number; unlocked: boolean; unlocked_at: string | null } | undefined => {
    if (id.startsWith('_state_')) {
      const val = stateMap.get(id);
      return val !== undefined
        ? { current_value: val, tier: 0, unlocked: val > 0, unlocked_at: null }
        : undefined;
    }
    const ach = achMap.get(id);
    if (ach) return ach;
    const adv = advMap.get(id);
    if (adv) {
      return {
        current_value: adv.unlocked ? 1 : 0,
        tier: adv.rank,
        unlocked: adv.unlocked,
        unlocked_at: adv.unlocked_at,
      };
    }
    return undefined;
  };

  const pushUpdate = (item: {
    achievement_id: string;
    current_value: number;
    unlocked: boolean;
    unlocked_at: string | null;
    tier: number;
  }) => {
    updates.push(item);
    if (item.achievement_id.startsWith('_state_')) {
      stateUpdates.push({ key: item.achievement_id, value: item.current_value });
      stateMap.set(item.achievement_id, item.current_value);
    }
  };

  // Helper to record an update and check for tier/unlock upgrade
  const processMultiTier = (id: string, proposedValue: number) => {
    const def = getAchievementDefinition(id);
    if (!def) return;
    if (def.eligibleModes && !def.eligibleModes.includes(ctx.mode)) {
      return;
    }
    if (def.minDuration && ctx.durationSeconds < def.minDuration) {
      return;
    }
    if (def.minWordCount && effectiveWordCount < def.minWordCount) {
      return;
    }
    const existing = getRecord(id);
    const prevTier = (existing?.tier ?? 0) as AchievementTier;
    const prevValue = existing?.current_value ?? 0;
    const newValue = Math.max(prevValue, proposedValue);

    // Determine highest tier reached (strictly sequential verification)
    let highestTierReached: AchievementTier = 0;
    let unlockedTierDef = def.tiers[0];
    for (let i = 0; i < def.tiers.length; i++) {
      const t = def.tiers[i];
      if (!t) break;
      if (newValue >= t.target) {
        const allPriorSatisfied = def.tiers.slice(0, i).every((pt) => newValue >= pt.target);
        if (allPriorSatisfied) {
          highestTierReached = t.tier;
          unlockedTierDef = t;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    const lastTier = def.tiers[def.tiers.length - 1];
    const isFullyUnlocked = lastTier ? highestTierReached >= lastTier.tier : false;
    const isNewTier = highestTierReached > prevTier;

    if (newValue !== prevValue || isNewTier) {
      const isUnlocked = isFullyUnlocked || highestTierReached > 0;
      const targetVal = unlockedTierDef?.target ?? def.tiers[def.tiers.length - 1]?.target ?? 1;

      achievementUpdates.push({
        achievement_id: id,
        current_value: newValue,
        target_value: targetVal,
        tier: highestTierReached,
        unlocked: isUnlocked,
        unlocked_at: isNewTier ? now : existing?.unlocked_at ?? null,
      });

      pushUpdate({
        achievement_id: id,
        current_value: newValue,
        unlocked: isUnlocked,
        unlocked_at: isNewTier ? now : existing?.unlocked_at ?? null,
        tier: highestTierReached,
      });

      if (isNewTier && highestTierReached > 0 && unlockedTierDef) {
        newUnlocks.push({
          achievementId: id,
          tier: highestTierReached,
          category: def.category,
          labelKey: unlockedTierDef.labelKey,
          descKey: unlockedTierDef.descKey,
          icon: def.icon,
          trophyShape: def.trophyShape,
          advancementShape: def.advancementShape,
        });
      }
    }
  };

  const processAdvancement = (id: string, triggered: boolean, targetCount = 1) => {
    const def = getAchievementDefinition(id);
    if (!def) return;
    if (def.eligibleModes && !def.eligibleModes.includes(ctx.mode)) {
      return;
    }
    if (def.minDuration && ctx.durationSeconds < def.minDuration) {
      return;
    }
    if (def.minWordCount && effectiveWordCount < def.minWordCount) {
      return;
    }
    const existing = getRecord(id);
    if (existing?.unlocked) return; // Already unlocked

    const prevValue = existing?.current_value ?? 0;
    let newValue = prevValue;
    if (triggered) {
      newValue = targetCount === 1 ? 1 : prevValue + 1;
    }

    const isUnlocked = newValue >= targetCount;
    const tierDef = def.tiers[0];
    if ((newValue !== prevValue || isUnlocked) && tierDef) {
      advancementUpdates.push({
        advancement_id: id,
        unlocked: isUnlocked,
        unlocked_at: isUnlocked ? now : null,
      });

      pushUpdate({
        achievement_id: id,
        current_value: newValue,
        unlocked: isUnlocked,
        unlocked_at: isUnlocked ? now : null,
        tier: isUnlocked ? tierDef.tier : 0,
      });

      if (isUnlocked) {
        newUnlocks.push({
          achievementId: id,
          tier: tierDef.tier,
          category: def.category,
          labelKey: tierDef.labelKey,
          descKey: tierDef.descKey,
          icon: def.icon,
          trophyShape: def.trophyShape,
          advancementShape: def.advancementShape,
        });
      }
    }
  };

  // 1. SPEED GROUP (Standard competitive modes only: Time, Words, Quote, Tech)
  if (isLegitimateCompetitiveTest) {
    processMultiTier('speed_tier', Math.round(ctx.wpm));
    processMultiTier('raw_speed_tier', Math.round(ctx.rawWpm));
    processAdvancement('speed_demon', ctx.wpm >= 120);
    processAdvancement('supersonic', ctx.wpm >= 150);
    processAdvancement('hypersonic', ctx.wpm >= 175);
    processAdvancement('light_speed', ctx.wpm >= 200);
    processAdvancement('burst_speed', ctx.rawWpm >= 75 || ctx.wpm >= 70);
    processAdvancement('double_digits', ctx.wpm >= 99);
    processAdvancement(
      'velocity_king',
      ctx.wpm >= 140 &&
        ctx.mode === 'time' &&
        (ctx.durationSeconds >= 58 || ctx.modeVariant === '60' || parseInt(ctx.modeVariant, 10) >= 60),
    );
    processAdvancement('warp_speed', ctx.wpm >= 160);
    processAdvancement('raw_power', ctx.rawWpm >= 200);

    const isTime15 = ctx.mode === 'time' && (ctx.modeVariant === '15' || parseInt(ctx.modeVariant, 10) === 15);
    processAdvancement('sprint_master', isTime15 && ctx.wpm >= 80);
    processAdvancement('burst_legend', isTime15 && ctx.wpm >= 160);
    processAdvancement('endurance_speed', ctx.mode === 'time' && ctx.durationSeconds >= 120 && ctx.wpm >= 100);
    processAdvancement('code_speed', ctx.mode === 'tech' && ctx.wpm >= 80);
    processAdvancement('apex_predator', ctx.wpm >= 220);

    // Speed Endurance: cumulative speed points
    const prevSpeedPts = getRecord('speed_endurance')?.current_value ?? 0;
    processMultiTier('speed_endurance', prevSpeedPts + Math.round(ctx.wpm));

    // Expert Speed: tests with WPM >= 80 in Expert difficulty
    if (isExpert && ctx.wpm >= 80) {
      const prevExpertSpeed = getRecord('expert_speed')?.current_value ?? 0;
      processMultiTier('expert_speed', prevExpertSpeed + 1);
    }

    // Master Speed: tests with WPM >= 60 in Master difficulty with zero mistakes
    const hasZeroMistakes = (ctx.incorrectChars === undefined || ctx.incorrectChars === 0) && ctx.accuracy === 100;
    if (isMaster && ctx.wpm >= 60 && hasZeroMistakes) {
      const prevMasterSpeed = getRecord('master_speed')?.current_value ?? 0;
      processMultiTier('master_speed', prevMasterSpeed + 1);
    }

    // Speed climber: improve WPM by 5+ from previous test
    const prevLastWpm = getRecord('_state_last_wpm')?.current_value ?? 0;
    if (prevLastWpm > 0) {
      processAdvancement('speed_climber', ctx.wpm >= prevLastWpm + 5);
    }
    pushUpdate({
      achievement_id: '_state_last_wpm',
      current_value: Math.round(ctx.wpm),
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
  }

  // 2. ACCURACY GROUP (Standard competitive modes only)
  if (isLegitimateCompetitiveTest) {
    // Accuracy Volume: cumulative tests with accuracy >= 95%
    if (ctx.accuracy >= 95) {
      const prevAccVol = getRecord('accuracy_volume')?.current_value ?? 0;
      processMultiTier('accuracy_volume', prevAccVol + 1);
    }

    // Expert Precision: tests with accuracy >= 98% in Expert difficulty
    if (isExpert && ctx.accuracy >= 98) {
      const prevExpertPrec = getRecord('expert_precision')?.current_value ?? 0;
      processMultiTier('expert_precision', prevExpertPrec + 1);
    }

    processAdvancement('perfect_test', ctx.accuracy === 100);
    processAdvancement('laser_focus', ctx.accuracy >= 99 && ctx.wpm >= 80);
    processAdvancement('clean_sweep', ctx.accuracy === 100 && ctx.durationSeconds >= 60);
    processAdvancement(
      'untouchable',
      ctx.accuracy === 100 && ctx.durationSeconds >= 30 && ctx.wpm >= 80,
    );
    processAdvancement(
      'surgical_strike',
      ctx.mode === 'tech' && ctx.accuracy >= 99 && ctx.durationSeconds >= 5,
    );
    processAdvancement(
      'quote_precision',
      ctx.mode === 'quote' && ctx.accuracy === 100 && ctx.durationSeconds >= 15,
    );
    processAdvancement(
      'flawless_marathon',
      ctx.durationSeconds >= 60 && ctx.accuracy === 100 && ctx.wpm >= 80,
    );

    // Perfectionist run: 5 consecutive tests with 100% accuracy across different modes
    const prevPerfStreak = getRecord('_state_perf_run_streak')?.current_value ?? 0;
    const prevPerfModes = getRecord('_state_perf_run_modes')?.current_value ?? 0;
    const modeBit = MODE_BITS[ctx.mode] ?? 0;
    let newPerfStreak = 0;
    let newPerfModes = 0;
    if (ctx.accuracy === 100) {
      newPerfStreak = prevPerfStreak + 1;
      newPerfModes = prevPerfModes | modeBit;
    }
    pushUpdate({
      achievement_id: '_state_perf_run_streak',
      current_value: newPerfStreak,
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
    pushUpdate({
      achievement_id: '_state_perf_run_modes',
      current_value: newPerfModes,
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
    const distinctModesCount = (newPerfModes.toString(2).match(/1/g) || []).length;
    processAdvancement('perfectionist_run', newPerfStreak >= 5 && distinctModesCount >= 2);

    // Perfect streak tracking
    const prevPerfectStreak = getRecord('_state_perfect_streak')?.current_value ?? 0;
    const currentPerfectStreak = ctx.accuracy === 100 ? prevPerfectStreak + 1 : 0;
    pushUpdate({
      achievement_id: '_state_perfect_streak',
      current_value: currentPerfectStreak,
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
    const maxPerfectStreak = Math.max(
      getRecord('perfect_streak')?.current_value ?? 0,
      currentPerfectStreak,
    );
    processMultiTier('perfect_streak', maxPerfectStreak);
    processAdvancement('bullseye', currentPerfectStreak >= 3);

    // Flawless 50 and Eagle Eye (Words 100+)
    const wordsVariantInt = parseInt(ctx.modeVariant, 10);
    const isWords50Plus = ctx.mode === 'words' && !isNaN(wordsVariantInt) && wordsVariantInt >= 50;
    processAdvancement('flawless_50', ctx.accuracy === 100 && isWords50Plus);

    const isWords100Plus = ctx.mode === 'words' && !isNaN(wordsVariantInt) && wordsVariantInt >= 100;
    processAdvancement('eagle_eye', isWords100Plus && ctx.accuracy >= 98);

    // Sniper
    processAdvancement('sniper', ctx.accuracy === 100 && ctx.wpm >= 80);

    // Error recovery (finished with >= 95% accuracy despite some errors)
    const hadErrors = (ctx.incorrectChars ?? 0) >= 2 || (ctx.accuracy < 100 && ctx.accuracy >= 95);
    processAdvancement('error_recovery', hadErrors && ctx.accuracy >= 95);

    // Zero backspace (test without backspaces)
    const isZeroBackspace =
      ctx.totalKeystrokes !== undefined && ctx.characterProducingKeystrokes !== undefined
        ? ctx.totalKeystrokes === ctx.characterProducingKeystrokes && ctx.accuracy >= 98
        : ctx.accuracy === 100;
    processAdvancement('zero_backspace', isZeroBackspace);
  }

  // 3. ENDURANCE GROUP
  const { ymdInt: todayYmd } = parseYmd(ctx.completedAt);

  // Tests completed: counts standard competitive modes (Time, Words, Quote, Tech) with legitimate duration
  const prevTests = getRecord('tests_completed')?.current_value ?? 0;
  let newTests = prevTests;
  if (isLegitimateCompetitiveTest) {
    newTests = prevTests + 1;
    processMultiTier('tests_completed', newTests);
  }

  // Volume metrics (words, chars, time): legitimate competitive tests only (prevents zen/custom abuse)
  if (isLegitimateCompetitiveTest) {
    const estimatedWords = Math.max(1, Math.round((ctx.wpm * ctx.durationSeconds) / 60));
    const prevWords = getRecord('words_typed')?.current_value ?? 0;
    processMultiTier('words_typed', prevWords + estimatedWords);

    const estimatedChars = ctx.characterProducingKeystrokes ?? ctx.correctChars ?? estimatedWords * 5;
    const prevChars = getRecord('chars_typed')?.current_value ?? 0;
    processMultiTier('chars_typed', prevChars + estimatedChars);

    const prevTime = getRecord('time_spent')?.current_value ?? 0;
    processMultiTier('time_spent', prevTime + Math.round(ctx.durationSeconds));

    // Cumulative words today tracking
    const prevTodayWordsDate = getRecord('_state_today_words_date')?.current_value ?? 0;
    const prevTodayWords = getRecord('_state_today_words_count')?.current_value ?? 0;
    let currentTodayWords = estimatedWords;
    if (prevTodayWordsDate === todayYmd) {
      currentTodayWords = prevTodayWords + estimatedWords;
    }
    pushUpdate({
      achievement_id: '_state_today_words_date',
      current_value: todayYmd,
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
    pushUpdate({
      achievement_id: '_state_today_words_count',
      current_value: currentTodayWords,
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
    processAdvancement('thousand_words', currentTodayWords >= 1000);
  }

  // Sessions per day tracking (legitimate competitive tests only)
  if (isLegitimateCompetitiveTest) {
    const lastSessionYmd = getRecord('_state_today_sessions_date')?.current_value ?? 0;
    const prevTodaySessions = getRecord('_state_today_sessions_count')?.current_value ?? 0;
    let currentTodaySessions = 1;
    if (lastSessionYmd === todayYmd) {
      currentTodaySessions = prevTodaySessions + 1;
    }
    pushUpdate({
      achievement_id: '_state_today_sessions_date',
      current_value: todayYmd,
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
    pushUpdate({
      achievement_id: '_state_today_sessions_count',
      current_value: currentTodaySessions,
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
    processMultiTier('sessions_per_day', currentTodaySessions);
    processAdvancement('night_shift', currentTodaySessions >= 10);
    processAdvancement('relentless', currentTodaySessions >= 25);
    processAdvancement('iron_will', ctx.durationSeconds >= 120);
  }

  const wordsVariantInt = parseInt(ctx.modeVariant, 10);
  const isWords100Plus = ctx.mode === 'words' && !isNaN(wordsVariantInt) && wordsVariantInt >= 100;
  processAdvancement('marathon_runner', isWords100Plus);
  processAdvancement('iron_fingers', isLegitimateCompetitiveTest && ctx.durationSeconds >= 300);
  processAdvancement('session_marathon', isLegitimateCompetitiveTest && ctx.durationSeconds >= 600);
  processAdvancement('zen_master', isZenMode && ctx.durationSeconds >= 180);
  processAdvancement('zen_flow', isZenMode && ctx.durationSeconds >= 60 && ctx.wpm >= 30);
  processAdvancement('zen_warrior', isZenMode && ctx.durationSeconds >= 180, 5);
  processAdvancement('zen_enlightenment', isZenMode && ctx.durationSeconds >= 600);

  // Master Endurance: tests with duration >= 30s in Master difficulty
  if (isMaster && isLegitimateCompetitiveTest && ctx.durationSeconds >= 30) {
    const prevMasterEnd = getRecord('master_endurance')?.current_value ?? 0;
    processMultiTier('master_endurance', prevMasterEnd + 1);
  }

  // Keyboard warrior: 10,000 keystrokes today
  const prevTodayKeysDate = getRecord('_state_today_keys_date')?.current_value ?? 0;
  const prevTodayKeys = getRecord('_state_today_keys_count')?.current_value ?? 0;
  const sessionKeys = ctx.totalKeystrokes ?? ctx.characterProducingKeystrokes ?? ctx.durationSeconds * 5;
  let currentTodayKeys = sessionKeys;
  if (prevTodayKeysDate === todayYmd) {
    currentTodayKeys = prevTodayKeys + sessionKeys;
  }
  pushUpdate({
    achievement_id: '_state_today_keys_date',
    current_value: todayYmd,
    unlocked: false,
    unlocked_at: null,
    tier: 0,
  });
  pushUpdate({
    achievement_id: '_state_today_keys_count',
    current_value: currentTodayKeys,
    unlocked: false,
    unlocked_at: null,
    tier: 0,
  });
  processAdvancement('keyboard_warrior', currentTodayKeys >= 10000);

  // 4. CONSISTENCY GROUP (Standard competitive modes only)
  if (isStandardCompetitive && ctx.consistency !== null && ctx.consistency !== undefined) {
    // Consistency Volume: cumulative tests with consistency >= 85%
    if (ctx.consistency >= 85) {
      const prevConsVol = getRecord('consistency_volume')?.current_value ?? 0;
      processMultiTier('consistency_volume', prevConsVol + 1);
    }
    processAdvancement('steady_hands', ctx.consistency >= 90);
    processAdvancement('metronome', ctx.consistency >= 95 && ctx.accuracy >= 98);
    processAdvancement('rhythm_keeper', ctx.consistency >= 92 && ctx.wpm >= 80);
    processAdvancement('machine_precision', ctx.consistency >= 95 && ctx.wpm >= 90);

    // Consistency streak (5x >= 85%)
    const prevConsistencyStreak = getRecord('_state_consistency_streak')?.current_value ?? 0;
    const currentConsistencyStreak = ctx.consistency >= 85 ? prevConsistencyStreak + 1 : 0;
    pushUpdate({
      achievement_id: '_state_consistency_streak',
      current_value: currentConsistencyStreak,
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
    processAdvancement('steady_climb', currentConsistencyStreak >= 5);

    // Clockwork mind (5x with WPM variance <= 5)
    const prevClockworkStreak = getRecord('_state_clockwork_streak')?.current_value ?? 0;
    const lastClockworkWpm = getRecord('_state_last_clockwork_wpm')?.current_value ?? 0;
    let currentClockworkStreak = 1;
    if (lastClockworkWpm > 0 && Math.abs(ctx.wpm - lastClockworkWpm) <= 5) {
      currentClockworkStreak = prevClockworkStreak + 1;
    }
    pushUpdate({
      achievement_id: '_state_clockwork_streak',
      current_value: currentClockworkStreak,
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
    pushUpdate({
      achievement_id: '_state_last_clockwork_wpm',
      current_value: Math.round(ctx.wpm),
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
    processAdvancement('clockwork', currentClockworkStreak >= 5);
  }

  // Consistent accuracy streak (>= 95%) in standard competitive modes
  if (isStandardCompetitive) {
    const prevHighAccStreak = getRecord('_state_high_acc_streak')?.current_value ?? 0;
    const currentHighAccStreak = ctx.accuracy >= 95 ? prevHighAccStreak + 1 : 0;
    pushUpdate({
      achievement_id: '_state_high_acc_streak',
      current_value: currentHighAccStreak,
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
    const maxHighAccStreak = Math.max(
      getRecord('consistent_accuracy')?.current_value ?? 0,
      currentHighAccStreak,
    );
    processMultiTier('consistent_accuracy', maxHighAccStreak);
  }

  // 5. EXPLORATION GROUP
  const modeBit = MODE_BITS[ctx.mode] ?? 0;
  const prevModeMask = getRecord('_state_modes_mask')?.current_value ?? 0;
  const newModeMask = prevModeMask | modeBit;
  if (newModeMask !== prevModeMask) {
    pushUpdate({
      achievement_id: '_state_modes_mask',
      current_value: newModeMask,
      unlocked: false,
      unlocked_at: null,
      tier: 0,
    });
  }

  // Languages explored (excludes custom mode to prevent farming)
  let currentLangCount = getRecord('languages_explored')?.current_value ?? 0;
  const cleanLang = ctx.language.trim().toLowerCase();
  if (cleanLang && cleanLang !== 'custom' && cleanLang !== 'none' && ctx.mode !== 'custom') {
    const langKey = `_state_lang_${cleanLang}`;
    if (!getRecord(langKey)?.unlocked) {
      pushUpdate({
        achievement_id: langKey,
        current_value: 1,
        unlocked: true,
        unlocked_at: now,
        tier: 1,
      });
      currentLangCount += 1;
    }
  }
  processMultiTier('languages_explored', currentLangCount);
  processAdvancement('polyglot', currentLangCount >= 3);
  processAdvancement('world_traveler', currentLangCount >= 5);

  // Tech languages (code_polyglot) & sub-modes (infra vs code)
  if (ctx.mode === 'tech') {
    let currentTechLangCount = getRecord('code_polyglot')?.current_value ?? 0;
    if (cleanLang) {
      const techLangKey = `_state_tech_lang_${cleanLang}`;
      if (!getRecord(techLangKey)?.unlocked) {
        pushUpdate({
          achievement_id: techLangKey,
          current_value: 1,
          unlocked: true,
          unlocked_at: now,
          tier: 1,
        });
        currentTechLangCount += 1;
      }
    }
    processMultiTier('code_polyglot', currentTechLangCount);

    const isTechInfra =
      ctx.modeVariant.toLowerCase().includes('infra') ||
      ctx.modeVariant.toLowerCase().includes('docker') ||
      ctx.modeVariant.toLowerCase().includes('git') ||
      ctx.modeVariant.toLowerCase().includes('k8s') ||
      ctx.modeVariant.toLowerCase().includes('linux') ||
      ctx.modeVariant.toLowerCase().includes('bash') ||
      ctx.modeVariant.toLowerCase().includes('nginx');
    const isTechCode = !isTechInfra;

    processAdvancement('infra_explorer', isTechInfra, 5);
    processAdvancement('code_warrior', isTechCode, 10);

    if (isTechInfra) {
      pushUpdate({ achievement_id: '_state_tech_infra_done', current_value: 1, unlocked: true, unlocked_at: now, tier: 1 });
    }
    if (isTechCode) {
      pushUpdate({ achievement_id: '_state_tech_code_done', current_value: 1, unlocked: true, unlocked_at: now, tier: 1 });
    }
    const hasInfra = isTechInfra || (getRecord('_state_tech_infra_done')?.unlocked ?? false);
    const hasCode = isTechCode || (getRecord('_state_tech_code_done')?.unlocked ?? false);
    processAdvancement('tech_completionist', hasInfra && hasCode);
  }

  // Words mode tier exploration (200, 1k, 5k)
  if (ctx.mode === 'words') {
    const variantStr = ctx.modeVariant.toLowerCase();
    if (variantStr.includes('200') || variantStr.includes('common')) {
      pushUpdate({ achievement_id: '_state_words_tier_200', current_value: 1, unlocked: true, unlocked_at: now, tier: 1 });
    }
    if (variantStr.includes('1000') || variantStr.includes('1k')) {
      pushUpdate({ achievement_id: '_state_words_tier_1k', current_value: 1, unlocked: true, unlocked_at: now, tier: 1 });
    }
    if (variantStr.includes('5000') || variantStr.includes('5k')) {
      pushUpdate({ achievement_id: '_state_words_tier_5k', current_value: 1, unlocked: true, unlocked_at: now, tier: 1 });
    }
    const has200 = variantStr.includes('200') || (getRecord('_state_words_tier_200')?.unlocked ?? false);
    const has1k = variantStr.includes('1k') || variantStr.includes('1000') || (getRecord('_state_words_tier_1k')?.unlocked ?? false);
    const has5k = variantStr.includes('5k') || variantStr.includes('5000') || (getRecord('_state_words_tier_5k')?.unlocked ?? false);
    processAdvancement('tier_explorer', has200 && has1k && has5k);
  }

  processAdvancement('grand_polyglot', currentLangCount >= 15);

  // Wordlist explorer (quote, tech, or legitimate custom tests of >= 30s)
  const isLegitCustomWordlist = ctx.mode === 'custom' && ctx.durationSeconds >= 30;
  if (ctx.mode === 'quote' || ctx.mode === 'tech' || isLegitCustomWordlist) {
    const prevExplored = getRecord('wordlist_explorer')?.current_value ?? 0;
    processMultiTier('wordlist_explorer', prevExplored + 1);
  }

  // Tech Sessions: completed tech mode sessions (>= 5s)
  if (ctx.mode === 'tech' && ctx.durationSeconds >= 5) {
    const prevTechSessions = getRecord('tech_sessions')?.current_value ?? 0;
    processMultiTier('tech_sessions', prevTechSessions + 1);
  }

  // Quote Sessions: completed quote mode sessions (>= 5s)
  if (ctx.mode === 'quote' && ctx.durationSeconds >= 5) {
    const prevQuoteSessions = getRecord('quote_sessions')?.current_value ?? 0;
    processMultiTier('quote_sessions', prevQuoteSessions + 1);
  }

  // Mode Master tracking: 10 tests in each standard mode (Time, Words, Quote, Tech)
  const prevTimeCount = getRecord('_state_mode_time_count')?.current_value ?? 0;
  const prevWordsCount = getRecord('_state_mode_words_count')?.current_value ?? 0;
  const prevQuoteCount = getRecord('_state_mode_quote_count')?.current_value ?? 0;
  const prevTechCount = getRecord('_state_mode_tech_count')?.current_value ?? 0;

  const newTimeCount = ctx.mode === 'time' ? prevTimeCount + 1 : prevTimeCount;
  const newWordsCount = ctx.mode === 'words' ? prevWordsCount + 1 : prevWordsCount;
  const newQuoteCount = ctx.mode === 'quote' ? prevQuoteCount + 1 : prevQuoteCount;
  const newTechCount = ctx.mode === 'tech' ? prevTechCount + 1 : prevTechCount;

  if (ctx.mode === 'time') pushUpdate({ achievement_id: '_state_mode_time_count', current_value: newTimeCount, unlocked: false, unlocked_at: null, tier: 0 });
  if (ctx.mode === 'words') pushUpdate({ achievement_id: '_state_mode_words_count', current_value: newWordsCount, unlocked: false, unlocked_at: null, tier: 0 });
  if (ctx.mode === 'quote') pushUpdate({ achievement_id: '_state_mode_quote_count', current_value: newQuoteCount, unlocked: false, unlocked_at: null, tier: 0 });
  if (ctx.mode === 'tech') pushUpdate({ achievement_id: '_state_mode_tech_count', current_value: newTechCount, unlocked: false, unlocked_at: null, tier: 0 });

  processAdvancement('mode_master', newTimeCount >= 10 && newWordsCount >= 10 && newQuoteCount >= 10 && newTechCount >= 10);

  processAdvancement('quote_connoisseur', ctx.mode === 'quote', 10);
  processAdvancement('quote_collector', ctx.mode === 'quote', 25);
  processAdvancement('tech_guru', ctx.mode === 'tech', 10);
  processAdvancement('custom_crafter', isCustomMode);
  processAdvancement(
    'custom_artisan',
    isCustomMode && ctx.durationSeconds >= 20 && ctx.accuracy >= 98 && ctx.wpm >= 50,
  );

  // 6. MILESTONES GROUP
  if (isStandardCompetitive || isCustomMode) {
    processAdvancement('first_test', true);
  }

  let isSessionPersonalBest = false;
  if (isStandardCompetitive) {
    const pbKey = `_state_pb_${ctx.mode}_${ctx.modeVariant}`;
    const prevBestWpm = getRecord(pbKey)?.current_value ?? 0;
    isSessionPersonalBest = ctx.isPersonalBest || (ctx.wpm > prevBestWpm && Math.round(ctx.wpm) > 0);

    if (isSessionPersonalBest && Math.round(ctx.wpm) > prevBestWpm) {
      pushUpdate({
        achievement_id: pbKey,
        current_value: Math.round(ctx.wpm),
        unlocked: false,
        unlocked_at: null,
        tier: 0,
      });
    }

    processAdvancement('first_pb', isSessionPersonalBest);

    if (isSessionPersonalBest) {
      const prevPbs = getRecord('pb_breaker')?.current_value ?? 0;
      processMultiTier('pb_breaker', prevPbs + 1);

      const pbModeKey = `_state_pb_mode_${ctx.mode}`;
      if (!getRecord(pbModeKey)?.unlocked) {
        pushUpdate({
          achievement_id: pbModeKey,
          current_value: 1,
          unlocked: true,
          unlocked_at: now,
          tier: 1,
        });
      }
    }

    const pbModesCount =
      (getRecord('_state_pb_mode_time')?.unlocked || (isSessionPersonalBest && ctx.mode === 'time') ? 1 : 0) +
      (getRecord('_state_pb_mode_words')?.unlocked || (isSessionPersonalBest && ctx.mode === 'words') ? 1 : 0) +
      (getRecord('_state_pb_mode_quote')?.unlocked || (isSessionPersonalBest && ctx.mode === 'quote') ? 1 : 0) +
      (getRecord('_state_pb_mode_tech')?.unlocked || (isSessionPersonalBest && ctx.mode === 'tech') ? 1 : 0);
    processAdvancement('pb_hunter', pbModesCount >= 3);
  }

  // Daily streak (advanced by legitimate competitive tests only)
  const lastStreakYmd = getRecord('_state_streak_last_date')?.current_value ?? 0;
  const prevDailyStreak = getRecord('_state_current_streak')?.current_value ?? 0;
  let newDailyStreak = prevDailyStreak;

  if (isLegitimateCompetitiveTest) {
    if (lastStreakYmd === 0) {
      newDailyStreak = 1;
    } else {
      const diff = daysDiff(lastStreakYmd, todayYmd);
      if (diff === 1) {
        newDailyStreak = prevDailyStreak + 1;
      } else if (diff > 1) {
        newDailyStreak = 1;
      }
    }

    if (lastStreakYmd !== todayYmd || newDailyStreak !== prevDailyStreak) {
      pushUpdate({
        achievement_id: '_state_streak_last_date',
        current_value: todayYmd,
        unlocked: false,
        unlocked_at: null,
        tier: 0,
      });
      pushUpdate({
        achievement_id: '_state_current_streak',
        current_value: newDailyStreak,
        unlocked: false,
        unlocked_at: null,
        tier: 0,
      });
    }
    // Total active days tracking (cumulative, non-consecutive days with completed test)
    const lastActiveDayYmd = getRecord('_state_active_day_last_date')?.current_value ?? 0;
    let currentTotalActiveDays = getRecord('total_active_days')?.current_value ?? 0;
    if (lastActiveDayYmd !== todayYmd) {
      currentTotalActiveDays += 1;
      pushUpdate({
        achievement_id: '_state_active_day_last_date',
        current_value: todayYmd,
        unlocked: false,
        unlocked_at: null,
        tier: 0,
      });
      processMultiTier('total_active_days', currentTotalActiveDays);
    }
  }

  // Comeback streak: return after 3+ days hiatus and hit PB
  const streakDaysDiff = lastStreakYmd > 0 ? daysDiff(lastStreakYmd, todayYmd) : 0;
  if (isSessionPersonalBest && streakDaysDiff >= 3) {
    processAdvancement('comeback_streak', true);
  }

  processAdvancement('weekly_warrior', newDailyStreak >= 7);
  processAdvancement('diamond_hands', newDailyStreak >= 14);
  processAdvancement('monthly_master', newDailyStreak >= 30);
  processAdvancement('centurion', newTests >= 100);
  processAdvancement('veteran', newTests >= 500);
  processAdvancement('grandmaster', newTests >= 1000);

  // 7. SPECIAL GROUP
  // Expert & Master wins evaluation (competitive legitimate tests only)
  if (isLegitimateCompetitiveTest) {
    if (isExpert) {
      const prevExpertWins = getRecord('expert_wins')?.current_value ?? 0;
      processMultiTier('expert_wins', prevExpertWins + 1);
    } else if (isMaster) {
      const prevMasterWins = getRecord('master_wins')?.current_value ?? 0;
      processMultiTier('master_wins', prevMasterWins + 1);
    }
  }

  const dateObj = new Date(ctx.completedAt);
  const hour = dateObj.getHours();
  const dayOfWeek = dateObj.getDay();

  processAdvancement('night_owl', hour >= 0 && hour < 4);
  processAdvancement('midnight_grind', hour >= 0 && hour < 3, 5);
  processAdvancement('early_bird', hour >= 5 && hour < 7);
  processAdvancement('golden_hour', hour >= 5 && hour < 6 && ctx.wpm >= 60);
  processAdvancement('lunch_break', hour >= 12 && hour < 13);
  processAdvancement('weekend_warrior', dayOfWeek === 0 || dayOfWeek === 6);
  processAdvancement('flow_state', ctx.accuracy >= 98 && (ctx.consistency ?? 0) >= 90);
  processAdvancement(
    'triple_threat',
    ctx.wpm >= 80 && ctx.accuracy >= 95 && ctx.consistency !== null && ctx.consistency >= 90,
  );

  // Speed and accuracy combo (Competitive standard modes only)
  if (isStandardCompetitive) {
    processAdvancement('speed_accuracy_combo', ctx.wpm >= 100 && ctx.accuracy === 100);
    processAdvancement(
      'the_perfectionist',
      ctx.wpm >= 120 && ctx.accuracy === 100 && (ctx.consistency ?? 0) >= 90,
    );

    // Comeback kid: PB after 20+ tests without PB
    const prevSincePb = getRecord('_state_tests_since_pb')?.current_value ?? 0;
    if (isSessionPersonalBest) {
      processAdvancement('comeback_kid', prevSincePb >= 20);
      pushUpdate({
        achievement_id: '_state_tests_since_pb',
        current_value: 0,
        unlocked: false,
        unlocked_at: null,
        tier: 0,
      });
    } else {
      pushUpdate({
        achievement_id: '_state_tests_since_pb',
        current_value: prevSincePb + 1,
        unlocked: false,
        unlocked_at: null,
        tier: 0,
      });
    }

    // Improvement arc: WPM is 10+ higher than baseline after 20 tests
    const prevBaseline = getRecord('_state_baseline_wpm')?.current_value ?? 0;
    if (newTests >= 10 && prevBaseline === 0) {
      pushUpdate({
        achievement_id: '_state_baseline_wpm',
        current_value: Math.round(ctx.wpm),
        unlocked: false,
        unlocked_at: null,
        tier: 0,
      });
    } else if (newTests >= 20 && prevBaseline > 0) {
      processAdvancement('improvement_arc', ctx.wpm >= prevBaseline + 10);
    }
  }

  // Check Rank Ascensions
  const highestTierOverall = Math.max(
    0,
    ...updates.map((u) => u.tier),
    ...Array.from(achMap.values()).map((r) => r.tier),
    ...Array.from(advMap.values()).map((r) => r.rank),
  );
  processAdvancement('heroic_ascension', highestTierOverall >= 21);
  processAdvancement('elite_heroic_ascension', highestTierOverall >= 26);
  processAdvancement('master_ascension', highestTierOverall >= 31);
  processAdvancement('elite_master_ascension', highestTierOverall >= 36);
  processAdvancement('grandmaster_ascension', highestTierOverall >= 41);

  return {
    achievementUpdates,
    advancementUpdates,
    stateUpdates,
    newUnlocks,
    updates,
  };
}
