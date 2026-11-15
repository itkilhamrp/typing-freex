import { describe, it, expect } from 'vitest';
import { evaluateAchievements, type EvaluationContext } from './achievement-engine';
import type { AchievementProgressDto } from '../ipc/contracts';

describe('Achievement Engine', () => {
  const baseContext: EvaluationContext = {
    wpm: 65,
    rawWpm: 70,
    accuracy: 96,
    consistency: 85,
    durationSeconds: 30,
    mode: 'time',
    modeVariant: '30',
    language: 'english',
    isPersonalBest: false,
    completedAt: '2026-10-20T12:00:00.000Z',
  };

  it('unlocks first test and speed tier for 65 wpm (Tier 4 / Silver 1)', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    const result = evaluateAchievements(baseContext, currentProgress);

    const firstTestUnlock = result.newUnlocks.find((u) => u.achievementId === 'first_test');
    expect(firstTestUnlock).toBeDefined();

    const speedTierUnlock = result.newUnlocks.find((u) => u.achievementId === 'speed_tier');
    expect(speedTierUnlock).toBeDefined();
    expect(speedTierUnlock?.tier).toBe(4); // 65 >= 65 (tier 4: Silver 1)

    const testsCompletedUpdate = result.updates.find((u) => u.achievement_id === 'tests_completed');
    expect(testsCompletedUpdate?.current_value).toBe(1);
  });

  it('triggers perfect_test advancement when accuracy is 100', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    const ctx = { ...baseContext, accuracy: 100 };
    const result = evaluateAchievements(ctx, currentProgress);

    const perfectUnlock = result.newUnlocks.find((u) => u.achievementId === 'perfect_test');
    expect(perfectUnlock).toBeDefined();
  });

  it('triggers speed_demon when wpm >= 120 (Tier 9 / Gold 3)', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    const ctx = { ...baseContext, wpm: 125 };
    const result = evaluateAchievements(ctx, currentProgress);

    const demonUnlock = result.newUnlocks.find((u) => u.achievementId === 'speed_demon');
    expect(demonUnlock).toBeDefined();
    expect(demonUnlock?.tier).toBe(9);
  });

  it('triggers burst_speed when rawWpm >= 75 (Tier 4 / Silver 1)', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    const ctx = { ...baseContext, rawWpm: 76 };
    const result = evaluateAchievements(ctx, currentProgress);

    const burstUnlock = result.newUnlocks.find((u) => u.achievementId === 'burst_speed');
    expect(burstUnlock).toBeDefined();
    expect(burstUnlock?.tier).toBe(4);
  });

  it('triggers night_owl between 00:00 and 04:00', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    const now = new Date();
    now.setHours(2, 30, 0, 0);
    const ctx = { ...baseContext, completedAt: now.toISOString() };
    const result = evaluateAchievements(ctx, currentProgress);

    const owlUnlock = result.newUnlocks.find((u) => u.achievementId === 'night_owl');
    expect(owlUnlock).toBeDefined();
  });

  it('does not award competitive speed, accuracy, or PB achievements in zen mode but awards zen feats', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    const ctx: EvaluationContext = {
      ...baseContext,
      mode: 'zen',
      wpm: 120,
      accuracy: 100,
      durationSeconds: 185,
    };
    const result = evaluateAchievements(ctx, currentProgress);

    // Zen mode must not earn competitive speed, accuracy combo, or PB achievements
    const speedUnlock = result.newUnlocks.find((u) => u.achievementId === 'speed_tier');
    expect(speedUnlock).toBeUndefined();
    const demonUnlock = result.newUnlocks.find((u) => u.achievementId === 'speed_demon');
    expect(demonUnlock).toBeUndefined();
    const pbUnlock = result.newUnlocks.find((u) => u.achievementId === 'first_pb');
    expect(pbUnlock).toBeUndefined();
    const comboUnlock = result.newUnlocks.find((u) => u.achievementId === 'speed_accuracy_combo');
    expect(comboUnlock).toBeUndefined();

    // Zen mode MUST earn zen-specific advancements when requirements are met
    const zenMasterUnlock = result.newUnlocks.find((u) => u.achievementId === 'zen_master');
    expect(zenMasterUnlock).toBeDefined();
    const zenFlowUnlock = result.newUnlocks.find((u) => u.achievementId === 'zen_flow');
    expect(zenFlowUnlock).toBeDefined();
  });

  it('returns empty updates and unlocks when failedByDifficulty is true (expert/master mode failures)', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    const ctx: EvaluationContext = {
      ...baseContext,
      failedByDifficulty: true,
      wpm: 120,
      accuracy: 95,
    };
    const result = evaluateAchievements(ctx, currentProgress);
    expect(result.updates).toEqual([]);
    expect(result.newUnlocks).toEqual([]);
  });

  it('returns empty updates and unlocks when isCompleted is false', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    const ctx: EvaluationContext = {
      ...baseContext,
      isCompleted: false,
      wpm: 80,
    };
    const result = evaluateAchievements(ctx, currentProgress);
    expect(result.updates).toEqual([]);
    expect(result.newUnlocks).toEqual([]);
  });

  it('independently tracks personal best and pb_breaker even when ctx.isPersonalBest is false', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    // First test in words mode: 70 WPM
    const ctx1: EvaluationContext = {
      ...baseContext,
      mode: 'words',
      modeVariant: '25',
      wpm: 70,
      isPersonalBest: false, // simulated history filter skipping IPC PB
    };
    const res1 = evaluateAchievements(ctx1, currentProgress);
    const pbUnlock1 = res1.newUnlocks.find((u) => u.achievementId === 'first_pb');
    expect(pbUnlock1).toBeDefined();

    for (const u of res1.updates) {
      currentProgress.set(u.achievement_id, {
        achievement_id: u.achievement_id,
        category: 'achievement',
        current_value: u.current_value,
        target_value: 0,
        unlocked: u.unlocked,
        unlocked_at: u.unlocked_at,
        tier: u.tier,
        updated_at: '2026-10-20T12:00:00.000Z',
      });
    }

    // Second test with higher WPM: 85 WPM
    const ctx2: EvaluationContext = {
      ...baseContext,
      mode: 'words',
      modeVariant: '25',
      wpm: 85,
      isPersonalBest: false,
    };
    const res2 = evaluateAchievements(ctx2, currentProgress);
    const pbBreakerUpdate = res2.updates.find((u) => u.achievement_id === 'pb_breaker');
    expect(pbBreakerUpdate).toBeDefined();
    expect(pbBreakerUpdate?.current_value).toBe(2);
  });

  it('triggers flow_state advancement when accuracy >= 98 and consistency >= 90 (Tier 7 / Gold 1)', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    const ctx: EvaluationContext = {
      ...baseContext,
      accuracy: 99,
      consistency: 92,
    };
    const result = evaluateAchievements(ctx, currentProgress);
    const flowUnlock = result.newUnlocks.find((u) => u.achievementId === 'flow_state');
    expect(flowUnlock).toBeDefined();
    expect(flowUnlock?.tier).toBe(7);
  });

  it('tracks chars_typed from character producing keystrokes', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    const ctx: EvaluationContext = {
      ...baseContext,
      correctChars: 120,
      incorrectChars: 5,
      totalKeystrokes: 130,
      characterProducingKeystrokes: 125,
    };
    const result = evaluateAchievements(ctx, currentProgress);
    const charUpdate = result.updates.find((u) => u.achievement_id === 'chars_typed');
    expect(charUpdate).toBeDefined();
    expect(charUpdate?.current_value).toBe(125);
  });

  it('progresses speed_climber when user improves WPM in consecutive tests', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    const ctx1 = { ...baseContext, wpm: 50 };
    let res = evaluateAchievements(ctx1, currentProgress);
    for (const u of res.updates) {
      currentProgress.set(u.achievement_id, {
        achievement_id: u.achievement_id,
        category: 'advancement',
        current_value: u.current_value,
        target_value: 0,
        unlocked: u.unlocked,
        unlocked_at: u.unlocked_at,
        tier: u.tier,
        updated_at: '2026-10-20T12:00:00.000Z',
      });
    }

    const ctx2 = { ...baseContext, wpm: 60 };
    res = evaluateAchievements(ctx2, currentProgress);
    const climberUnlock = res.newUnlocks.find((u) => u.achievementId === 'speed_climber');
    expect(climberUnlock).toBeDefined();
  });

  it('tracks tech_sessions and quote_sessions correctly', () => {
    const currentProgress = new Map<string, AchievementProgressDto>();
    // Tech session
    const techRes = evaluateAchievements({ ...baseContext, mode: 'tech', durationSeconds: 15 }, currentProgress);
    const techUpd = techRes.updates.find((u) => u.achievement_id === 'tech_sessions');
    expect(techUpd).toBeDefined();
    expect(techUpd?.current_value).toBe(1);

    // Quote session
    const quoteRes = evaluateAchievements({ ...baseContext, mode: 'quote', durationSeconds: 20 }, currentProgress);
    const quoteUpd = quoteRes.updates.find((u) => u.achievement_id === 'quote_sessions');
    expect(quoteUpd).toBeDefined();
    expect(quoteUpd?.current_value).toBe(1);
  });

  describe('New Advancement Missions', () => {
    it('unlocks double_digits when wpm >= 99', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx = { ...baseContext, wpm: 102 };
      const res = evaluateAchievements(ctx, currentProgress);

      const unlock = res.newUnlocks.find((u) => u.achievementId === 'double_digits');
      expect(unlock).toBeDefined();
    });

    it('unlocks velocity_king for 140+ WPM on 60s Time test', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        mode: 'time',
        modeVariant: '60',
        durationSeconds: 60,
        wpm: 145,
      };
      const res = evaluateAchievements(ctx, currentProgress);

      const unlock = res.newUnlocks.find((u) => u.achievementId === 'velocity_king');
      expect(unlock).toBeDefined();
    });

    it('unlocks untouchable for 100% accuracy on 30s+ with 80+ WPM', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        durationSeconds: 30,
        accuracy: 100,
        wpm: 85,
      };
      const res = evaluateAchievements(ctx, currentProgress);

      const unlock = res.newUnlocks.find((u) => u.achievementId === 'untouchable');
      expect(unlock).toBeDefined();
    });

    it('unlocks surgical_strike in tech mode with 99%+ accuracy', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        mode: 'tech',
        accuracy: 99.5,
      };
      const res = evaluateAchievements(ctx, currentProgress);

      const unlock = res.newUnlocks.find((u) => u.achievementId === 'surgical_strike');
      expect(unlock).toBeDefined();
    });

    it('unlocks triple_threat when reaching 80+ WPM, 95%+ accuracy, and 90%+ consistency', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        wpm: 88,
        accuracy: 97,
        consistency: 92,
      };
      const res = evaluateAchievements(ctx, currentProgress);

      const unlock = res.newUnlocks.find((u) => u.achievementId === 'triple_threat');
      expect(unlock).toBeDefined();
    });

    it('unlocks raw_power when rawWpm >= 200', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        rawWpm: 205,
      };
      const res = evaluateAchievements(ctx, currentProgress);

      const unlock = res.newUnlocks.find((u) => u.achievementId === 'raw_power');
      expect(unlock).toBeDefined();
    });

    it('zen_flow unlocks without requiring accuracy (e.g. accuracy = 80)', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        mode: 'zen',
        wpm: 45,
        accuracy: 80,
        durationSeconds: 65,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const unlock = res.newUnlocks.find((u) => u.achievementId === 'zen_flow');
      expect(unlock).toBeDefined();
    });

    it('custom mode tests shorter than 30s do not increment wordlist_explorer', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        mode: 'custom',
        durationSeconds: 10,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const update = res.updates.find((u) => u.achievement_id === 'wordlist_explorer');
      expect(update).toBeUndefined();
    });

    it('custom mode legitimate tests of >= 30s do increment wordlist_explorer', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        mode: 'custom',
        durationSeconds: 35,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const update = res.updates.find((u) => u.achievement_id === 'wordlist_explorer');
      expect(update).toBeDefined();
      expect(update?.current_value).toBe(1);
    });

    it('custom mode does not advance languages_explored', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        mode: 'custom',
        language: 'english',
        durationSeconds: 40,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const update = res.updates.find((u) => u.achievement_id === 'languages_explored');
      expect(update).toBeUndefined();
    });

    it('unlocks sprint_master in time 15s with 80+ WPM', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        mode: 'time',
        modeVariant: '15',
        wpm: 85,
        durationSeconds: 15,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const unlock = res.newUnlocks.find((u) => u.achievementId === 'sprint_master');
      expect(unlock).toBeDefined();
    });

    it('unlocks code_speed in tech mode with 80+ WPM', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        mode: 'tech',
        wpm: 82,
        durationSeconds: 20,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const unlock = res.newUnlocks.find((u) => u.achievementId === 'code_speed');
      expect(unlock).toBeDefined();
    });

    it('unlocks quote_precision in quote mode with 100% accuracy and min 15s duration', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        mode: 'quote',
        accuracy: 100,
        durationSeconds: 18,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const unlock = res.newUnlocks.find((u) => u.achievementId === 'quote_precision');
      expect(unlock).toBeDefined();
    });

    it('unlocks endurance_speed in time 120s with 100+ WPM', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        mode: 'time',
        modeVariant: '120',
        wpm: 105,
        durationSeconds: 120,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const unlock = res.newUnlocks.find((u) => u.achievementId === 'endurance_speed');
      expect(unlock).toBeDefined();
    });

    it('unlocks burst_legend in time 15s with 160+ WPM', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        mode: 'time',
        modeVariant: '15',
        wpm: 165,
        durationSeconds: 15,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const unlock = res.newUnlocks.find((u) => u.achievementId === 'burst_legend');
      expect(unlock).toBeDefined();
    });

    it('unlocks apex_predator with 220+ WPM', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        wpm: 225,
        durationSeconds: 60,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const unlock = res.newUnlocks.find((u) => u.achievementId === 'apex_predator');
      expect(unlock).toBeDefined();
    });

    it('unlocks keyboard_warrior when today keystrokes exceed 10,000', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      currentProgress.set('_state_today_keys_date', {
        achievement_id: '_state_today_keys_date',
        category: 'achievement',
        current_value: 20261020,
        target_value: 0,
        unlocked: false,
        unlocked_at: null,
        tier: 0,
        updated_at: '2026-10-20T12:00:00.000Z',
      });
      currentProgress.set('_state_today_keys_count', {
        achievement_id: '_state_today_keys_count',
        category: 'achievement',
        current_value: 9900,
        target_value: 0,
        unlocked: false,
        unlocked_at: null,
        tier: 0,
        updated_at: '2026-10-20T12:00:00.000Z',
      });
      const ctx: EvaluationContext = {
        ...baseContext,
        totalKeystrokes: 150,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const unlock = res.newUnlocks.find((u) => u.achievementId === 'keyboard_warrior');
      expect(unlock).toBeDefined();
    });

    it('unlocks zen_enlightenment in zen mode with 600s+ duration', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        mode: 'zen',
        durationSeconds: 605,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const unlock = res.newUnlocks.find((u) => u.achievementId === 'zen_enlightenment');
      expect(unlock).toBeDefined();
    });

    it('unlocks heroic_ascension when any achievement reaches tier 21+', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        wpm: 225, // reaches tier 21 on speed_tier
        durationSeconds: 30,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      const unlock = res.newUnlocks.find((u) => u.achievementId === 'heroic_ascension');
      expect(unlock).toBeDefined();
    });

    it('unlocks elite_heroic_ascension, master_ascension, elite_master_ascension, and grandmaster_ascension sequentially', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      // Tier 26: Elite Heroic
      const res26 = evaluateAchievements({ ...baseContext, wpm: 255 }, currentProgress);
      expect(res26.newUnlocks.some((u) => u.achievementId === 'elite_heroic_ascension')).toBe(true);

      // Tier 31: Master
      const res31 = evaluateAchievements({ ...baseContext, wpm: 275 }, currentProgress);
      expect(res31.newUnlocks.some((u) => u.achievementId === 'master_ascension')).toBe(true);

      // Tier 36: Elite Master
      const res36 = evaluateAchievements({ ...baseContext, wpm: 295 }, currentProgress);
      expect(res36.newUnlocks.some((u) => u.achievementId === 'elite_master_ascension')).toBe(true);

      // Tier 41: Grandmaster
      const res41 = evaluateAchievements({ ...baseContext, wpm: 315 }, currentProgress);
      expect(res41.newUnlocks.some((u) => u.achievementId === 'grandmaster_ascension')).toBe(true);
    });

    it('unlocks perfectionist_run only after 5 consecutive 100% tests across different modes', () => {
      const progress = new Map<string, AchievementProgressDto>();
      const modes = ['time', 'words', 'quote', 'tech', 'time'];

      for (let i = 0; i < modes.length; i++) {
        const mode = modes[i] ?? 'time';
        const ctx: EvaluationContext = {
          ...baseContext,
          mode,
          accuracy: 100,
          durationSeconds: 15,
        };
        const res = evaluateAchievements(ctx, progress);
        for (const u of res.updates) {
          progress.set(u.achievement_id, {
            achievement_id: u.achievement_id,
            category: 'advancement',
            current_value: u.current_value,
            target_value: 0,
            unlocked: u.unlocked,
            unlocked_at: u.unlocked_at,
            tier: u.tier,
            updated_at: '2026-10-20T12:00:00.000Z',
          });
        }
        if (i === 4) {
          expect(res.newUnlocks.some((u) => u.achievementId === 'perfectionist_run')).toBe(true);
        } else {
          expect(res.newUnlocks.some((u) => u.achievementId === 'perfectionist_run')).toBe(false);
        }
      }
    });

    it('resets perfectionist_run streak when a test has < 100% accuracy', () => {
      const progress = new Map<string, AchievementProgressDto>();
      // 3 perfect tests
      for (const mode of ['time', 'words', 'quote']) {
        const res = evaluateAchievements({ ...baseContext, mode, accuracy: 100 }, progress);
        for (const u of res.updates) {
          progress.set(u.achievement_id, {
            achievement_id: u.achievement_id,
            category: 'advancement',
            current_value: u.current_value,
            target_value: 0,
            unlocked: u.unlocked,
            unlocked_at: u.unlocked_at,
            tier: u.tier,
            updated_at: '2026-10-20T12:00:00.000Z',
          });
        }
      }
      expect(progress.get('_state_perf_run_streak')?.current_value).toBe(3);

      // 1 imperfect test (98%)
      const resImperfect = evaluateAchievements({ ...baseContext, mode: 'tech', accuracy: 98 }, progress);
      for (const u of resImperfect.updates) {
        progress.set(u.achievement_id, {
          achievement_id: u.achievement_id,
          category: 'advancement',
          current_value: u.current_value,
          target_value: 0,
          unlocked: u.unlocked,
          unlocked_at: u.unlocked_at,
          tier: u.tier,
          updated_at: '2026-10-20T12:00:00.000Z',
        });
      }
      expect(progress.get('_state_perf_run_streak')?.current_value).toBe(0);
    });

    it('unlocks tech_completionist when user completes both INFRA and CODE sub-modes', () => {
      const progress = new Map<string, AchievementProgressDto>();
      // 1. INFRA
      const res1 = evaluateAchievements(
        { ...baseContext, mode: 'tech', modeVariant: 'docker-infra' },
        progress,
      );
      for (const u of res1.updates) {
        progress.set(u.achievement_id, {
          achievement_id: u.achievement_id,
          category: 'advancement',
          current_value: u.current_value,
          target_value: 0,
          unlocked: u.unlocked,
          unlocked_at: u.unlocked_at,
          tier: u.tier,
          updated_at: '2026-10-20T12:00:00.000Z',
        });
      }
      expect(res1.newUnlocks.some((u) => u.achievementId === 'tech_completionist')).toBe(false);

      // 2. CODE
      const res2 = evaluateAchievements(
        { ...baseContext, mode: 'tech', modeVariant: 'typescript-code' },
        progress,
      );
      expect(res2.newUnlocks.some((u) => u.achievementId === 'tech_completionist')).toBe(true);
    });

    it('unlocks tier_explorer when user explores 200, 1k, and 5k word tiers in Words mode', () => {
      const progress = new Map<string, AchievementProgressDto>();
      let unlockedOnFinalVariant = false;
      for (const variant of ['common-200', 'english-1000', 'english-5000']) {
        const res = evaluateAchievements(
          { ...baseContext, mode: 'words', modeVariant: variant },
          progress,
        );
        if (res.newUnlocks.some((u) => u.achievementId === 'tier_explorer')) {
          unlockedOnFinalVariant = true;
        }
        for (const u of res.updates) {
          progress.set(u.achievement_id, {
            achievement_id: u.achievement_id,
            category: 'advancement',
            current_value: u.current_value,
            target_value: 0,
            unlocked: u.unlocked,
            unlocked_at: u.unlocked_at,
            tier: u.tier,
            updated_at: '2026-10-20T12:00:00.000Z',
          });
        }
      }
      expect(unlockedOnFinalVariant).toBe(true);
      expect(progress.get('tier_explorer')?.unlocked).toBe(true);
    });

    it('unlocks comeback_streak when user returns after 3+ days and achieves personal best', () => {
      const progress = new Map<string, AchievementProgressDto>();
      // Last active 4 days ago
      progress.set('_state_streak_last_date', {
        achievement_id: '_state_streak_last_date',
        category: 'achievement',
        current_value: 20261016, // Oct 16, today is Oct 20
        target_value: 0,
        unlocked: false,
        unlocked_at: null,
        tier: 0,
        updated_at: '2026-10-16T12:00:00.000Z',
      });
      // Prior PB was 70
      progress.set('_state_pb_time_30', {
        achievement_id: '_state_pb_time_30',
        category: 'achievement',
        current_value: 70,
        target_value: 0,
        unlocked: false,
        unlocked_at: null,
        tier: 0,
        updated_at: '2026-10-16T12:00:00.000Z',
      });

      const ctx: EvaluationContext = {
        ...baseContext,
        wpm: 85, // New PB!
        completedAt: '2026-10-20T12:00:00.000Z',
      };
      const res = evaluateAchievements(ctx, progress);
      expect(res.newUnlocks.some((u) => u.achievementId === 'comeback_streak')).toBe(true);
    });

    it('unlocks flawless_marathon for 60s+ test with 100% accuracy and 80+ WPM', () => {
      const currentProgress = new Map<string, AchievementProgressDto>();
      const ctx: EvaluationContext = {
        ...baseContext,
        durationSeconds: 65,
        accuracy: 100,
        wpm: 85,
      };
      const res = evaluateAchievements(ctx, currentProgress);
      expect(res.newUnlocks.some((u) => u.achievementId === 'flawless_marathon')).toBe(true);
    });

    it('unlocks grand_polyglot when user explores 15 different natural languages', () => {
      const progress = new Map<string, AchievementProgressDto>();
      const langs = [
        'english', 'indonesian', 'spanish', 'french', 'german',
        'italian', 'japanese', 'chinese', 'korean', 'russian',
        'portuguese', 'dutch', 'polish', 'swedish', 'turkish',
      ];
      let unlockedOn15th = false;
      for (const language of langs) {
        const res = evaluateAchievements(
          { ...baseContext, mode: 'words', language },
          progress,
        );
        if (res.newUnlocks.some((u) => u.achievementId === 'grand_polyglot')) {
          unlockedOn15th = true;
        }
        for (const u of res.updates) {
          progress.set(u.achievement_id, {
            achievement_id: u.achievement_id,
            category: 'achievement',
            current_value: u.current_value,
            target_value: 0,
            unlocked: u.unlocked,
            unlocked_at: u.unlocked_at,
            tier: u.tier,
            updated_at: '2026-10-20T12:00:00.000Z',
          });
        }
      }
      expect(progress.get('languages_explored')?.current_value).toBe(15);
      expect(unlockedOn15th).toBe(true);
      expect(progress.get('grand_polyglot')?.unlocked).toBe(true);
    });

    it('progresses consistency_volume when consistency >= 85%', () => {
      const progress = new Map<string, AchievementProgressDto>();
      const res1 = evaluateAchievements({ ...baseContext, consistency: 88 }, progress);
      const unlock1 = res1.newUnlocks.find((u) => u.achievementId === 'consistency_volume');
      expect(unlock1).toBeDefined();
      expect(unlock1?.tier).toBe(1);

      for (const u of res1.updates) {
        progress.set(u.achievement_id, {
          achievement_id: u.achievement_id,
          category: 'achievement',
          current_value: u.current_value,
          target_value: 0,
          unlocked: u.unlocked,
          unlocked_at: u.unlocked_at,
          tier: u.tier,
          updated_at: '2026-10-20T12:00:00.000Z',
        });
      }

      const res2 = evaluateAchievements({ ...baseContext, consistency: 80 }, progress);
      const upd2 = res2.updates.find((u) => u.achievement_id === 'consistency_volume');
      expect(upd2).toBeUndefined();
    });

    it('expert and master missions only progress in respective difficulty and when test is not failed', () => {
      const progress = new Map<string, AchievementProgressDto>();

      // Normal mode: expert_wins and master_wins do NOT increment
      const normalRes = evaluateAchievements({ ...baseContext, difficulty: 'normal', wpm: 90, accuracy: 99 }, progress);
      expect(normalRes.updates.find((u) => u.achievement_id === 'expert_wins')).toBeUndefined();
      expect(normalRes.updates.find((u) => u.achievement_id === 'master_wins')).toBeUndefined();

      // Expert mode: expert_wins and expert_speed progress when successful
      const expertRes = evaluateAchievements({ ...baseContext, difficulty: 'expert', wpm: 85, accuracy: 98 }, progress);
      const expertWinsUpd = expertRes.updates.find((u) => u.achievement_id === 'expert_wins');
      expect(expertWinsUpd).toBeDefined();
      expect(expertWinsUpd?.current_value).toBe(1);
      const expertSpeedUpd = expertRes.updates.find((u) => u.achievement_id === 'expert_speed');
      expect(expertSpeedUpd).toBeDefined();
      expect(expertSpeedUpd?.current_value).toBe(1);

      // Master mode: master_wins and master_speed (with 0 errors) progress
      const masterRes = evaluateAchievements({ ...baseContext, difficulty: 'master', wpm: 65, accuracy: 100, incorrectChars: 0 }, progress);
      const masterWinsUpd = masterRes.updates.find((u) => u.achievement_id === 'master_wins');
      expect(masterWinsUpd).toBeDefined();
      expect(masterWinsUpd?.current_value).toBe(1);
      const masterSpeedUpd = masterRes.updates.find((u) => u.achievement_id === 'master_speed');
      expect(masterSpeedUpd).toBeDefined();
      expect(masterSpeedUpd?.current_value).toBe(1);

      // Master mode with errors: master_speed does NOT progress
      const masterErrRes = evaluateAchievements({ ...baseContext, difficulty: 'master', wpm: 65, accuracy: 95, incorrectChars: 2 }, progress);
      expect(masterErrRes.updates.find((u) => u.achievement_id === 'master_speed')).toBeUndefined();

      // Failed test (failedByDifficulty: true): nothing progresses
      const failedRes = evaluateAchievements({ ...baseContext, difficulty: 'expert', failedByDifficulty: true }, progress);
      expect(failedRes.updates).toEqual([]);
    });
  });

  describe('Anti-exploit & Mode Eligibility Protection', () => {
    it('zen mode does not increment tests_completed, words_typed, chars_typed, or sessions_per_day', () => {
      const progress = new Map<string, AchievementProgressDto>();
      const zenCtx: EvaluationContext = {
        ...baseContext,
        mode: 'zen',
        modeVariant: 'free',
        durationSeconds: 120,
        wpm: 60,
      };

      const result = evaluateAchievements(zenCtx, progress);

      expect(result.updates.find((u) => u.achievement_id === 'tests_completed')).toBeUndefined();
      expect(result.updates.find((u) => u.achievement_id === 'words_typed')).toBeUndefined();
      expect(result.updates.find((u) => u.achievement_id === 'chars_typed')).toBeUndefined();
      expect(result.updates.find((u) => u.achievement_id === 'sessions_per_day')).toBeUndefined();
      expect(result.updates.find((u) => u.achievement_id === 'total_active_days')).toBeUndefined();
    });

    it('custom mode tests shorter than 5 seconds do not increment volume or endurance stats', () => {
      const progress = new Map<string, AchievementProgressDto>();
      const shortCustomCtx: EvaluationContext = {
        ...baseContext,
        mode: 'custom',
        modeVariant: 'text',
        durationSeconds: 2,
        wpm: 120,
      };

      const result = evaluateAchievements(shortCustomCtx, progress);

      expect(result.updates.find((u) => u.achievement_id === 'tests_completed')).toBeUndefined();
      expect(result.updates.find((u) => u.achievement_id === 'words_typed')).toBeUndefined();
      expect(result.updates.find((u) => u.achievement_id === 'chars_typed')).toBeUndefined();
      expect(result.updates.find((u) => u.achievement_id === 'sessions_per_day')).toBeUndefined();
      expect(result.updates.find((u) => u.achievement_id === 'total_active_days')).toBeUndefined();
    });

    it('legitimate competitive test (words mode >= 5s) advances volume stats', () => {
      const progress = new Map<string, AchievementProgressDto>();
      const legitCtx: EvaluationContext = {
        ...baseContext,
        mode: 'words',
        modeVariant: '25',
        durationSeconds: 20,
        wpm: 75,
      };

      const result = evaluateAchievements(legitCtx, progress);

      const testsUpd = result.updates.find((u) => u.achievement_id === 'tests_completed');
      expect(testsUpd).toBeDefined();
      expect(testsUpd?.current_value).toBe(1);

      const wordsUpd = result.updates.find((u) => u.achievement_id === 'words_typed');
      expect(wordsUpd).toBeDefined();
      expect(wordsUpd?.current_value).toBeGreaterThan(0);
    });
  });

  describe('Modular Table Outputs (Achievements vs Advancements vs TrackingState)', () => {
    it('strictly separates outputs across the 3 domains', () => {
      const achMap = new Map();
      const advMap = new Map();
      const stateMap = new Map();

      const result = evaluateAchievements(baseContext, achMap, advMap, stateMap);

      // 1. achievementUpdates must only contain progressive multi-tier achievements
      expect(result.achievementUpdates.length).toBeGreaterThan(0);
      for (const u of result.achievementUpdates) {
        expect(u.achievement_id.startsWith('_state_')).toBe(false);
        expect(u).toHaveProperty('current_value');
        expect(u).toHaveProperty('target_value');
        expect(u).toHaveProperty('tier');
      }

      // 2. advancementUpdates must only contain one-shot feats
      expect(result.advancementUpdates.length).toBeGreaterThan(0);
      for (const u of result.advancementUpdates) {
        expect(u.advancement_id.startsWith('_state_')).toBe(false);
        expect(u).toHaveProperty('unlocked');
      }

      // 3. stateUpdates must only contain _state_ keys
      expect(result.stateUpdates.length).toBeGreaterThan(0);
      for (const s of result.stateUpdates) {
        expect(s.key.startsWith('_state_')).toBe(true);
        expect(s).toHaveProperty('value');
      }
    });
  });
});



