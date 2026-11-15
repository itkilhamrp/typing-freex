/**
 * Achievement Store (Svelte 5 Runes)
 * Reactive store for achievements, advancements, tracking state, and trophy showcase.
 * Split into modular domain stores adhering to UNIX philosophy.
 */

import {
  achievementApi,
  advancementApi,
  trackingStateApi,
  trophyShowcaseApi,
} from '@/core/ipc/client';
import { SvelteMap, SvelteDate } from 'svelte/reactivity';
import type {
  AchievementDto,
  AdvancementDto,
  TrackingStateEntry,
  AchievementSeedDto,
  AdvancementSeedDto,
  AchievementUpdateDto,
  AdvancementUpdateDto,
  TrackingStateUpdateDto,
  TrophyShowcaseDto,
} from '@/core/ipc/contracts';
import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementDefinition,
  type UnlockedAchievement,
} from '@/core/achievements';

export interface AchievementItemProgress {
  achievement_id: string;
  category: string;
  current_value: number;
  target_value: number;
  tier: number;
  unlocked: boolean;
  unlocked_at: string | null;
  updated_at: string;
}

export interface AchievementItem {
  definition: AchievementDefinition;
  progress: AchievementItemProgress;
  isUnlocked: boolean;
  currentTier: number;
  itemType: 'achievement' | 'advancement';
}

const achievementsMap = new SvelteMap<string, AchievementDto>();
const advancementsMap = new SvelteMap<string, AdvancementDto>();
const trackingStateMap = new SvelteMap<string, TrackingStateEntry>();

let showcaseSlots = $state<TrophyShowcaseDto[]>([
  { slot: 1, item_id: null, item_type: null, pinned_at: null },
  { slot: 2, item_id: null, item_type: null, pinned_at: null },
  { slot: 3, item_id: null, item_type: null, pinned_at: null },
  { slot: 4, item_id: null, item_type: null, pinned_at: null },
  { slot: 5, item_id: null, item_type: null, pinned_at: null },
  { slot: 6, item_id: null, item_type: null, pinned_at: null },
  { slot: 7, item_id: null, item_type: null, pinned_at: null },
]);

let toastQueue = $state<UnlockedAchievement[]>([]);
let isLoading = $state<boolean>(false);
let isLoaded = $state<boolean>(false);
let loadPromise: Promise<void> | null = null;

export async function loadAchievements(force = false): Promise<void> {
  if (isLoaded && !force) return;
  if (loadPromise && !force) return loadPromise;

  if (force) {
    isLoaded = false;
    achievementsMap.clear();
    advancementsMap.clear();
    trackingStateMap.clear();
    showcaseSlots = [
      { slot: 1, item_id: null, item_type: null, pinned_at: null },
      { slot: 2, item_id: null, item_type: null, pinned_at: null },
      { slot: 3, item_id: null, item_type: null, pinned_at: null },
      { slot: 4, item_id: null, item_type: null, pinned_at: null },
      { slot: 5, item_id: null, item_type: null, pinned_at: null },
      { slot: 6, item_id: null, item_type: null, pinned_at: null },
      { slot: 7, item_id: null, item_type: null, pinned_at: null },
    ];
    toastQueue = [];
  }

  loadPromise = (async () => {
    isLoading = true;
    try {
      // 1. Seed definitions in parallel if first load or forced
      if (!isLoaded || force) {
        const achievementSeeds: AchievementSeedDto[] = [];
        const advancementSeeds: AdvancementSeedDto[] = [];

        for (const def of ACHIEVEMENT_DEFINITIONS) {
          if (def.category === 'achievement') {
            achievementSeeds.push({
              achievement_id: def.id,
              category: def.category,
              target_value: def.tiers[def.tiers.length - 1]?.target ?? 1,
              tier: 0,
            });
          } else {
            advancementSeeds.push({
              advancement_id: def.id,
              category: def.category,
              rank: def.tiers[0]?.tier ?? 1,
            });
          }
        }

        await Promise.all([
          achievementApi.seed(achievementSeeds),
          advancementApi.seed(advancementSeeds),
        ]);
      }

      // 2. Fetch all separated domains in parallel
      const [achList, advList, stateList, showcase] = await Promise.all([
        achievementApi.list(),
        advancementApi.list(),
        trackingStateApi.load(),
        trophyShowcaseApi.get(),
      ]);

      // 3. Populate reactive SvelteMaps in place to preserve subscriptions
      if (force) {
        achievementsMap.clear();
        advancementsMap.clear();
        trackingStateMap.clear();
      }
      for (const item of achList) {
        achievementsMap.set(item.achievement_id, item);
      }
      for (const item of advList) {
        advancementsMap.set(item.advancement_id, item);
      }
      for (const item of stateList) {
        trackingStateMap.set(item.key, item);
      }

      if (showcase && showcase.length > 0) {
        showcaseSlots = showcase;
      }
      isLoaded = true;
    } catch (err) {
      console.error('Failed to load achievements & advancements:', err);
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export interface BatchUpdatePayload {
  achievementUpdates?: AchievementUpdateDto[];
  advancementUpdates?: AdvancementUpdateDto[];
  stateUpdates?: TrackingStateUpdateDto[];
  updates?: Array<{
    achievement_id: string;
    current_value: number;
    unlocked: boolean;
    unlocked_at: string | null;
    tier: number;
  }>;
}

export function applyAchievementUpdates(
  payloadOrUpdates: BatchUpdatePayload | AchievementUpdateDto[],
  unlocks?: UnlockedAchievement[],
): void {
  const now = new SvelteDate().toISOString();

  let achUpdates: AchievementUpdateDto[] = [];
  let advUpdates: AdvancementUpdateDto[] = [];
  let stateUpdates: TrackingStateUpdateDto[] = [];
  let directUnlocks: UnlockedAchievement[] = unlocks ?? [];

  if (Array.isArray(payloadOrUpdates)) {
    // Legacy call signature
    for (const u of payloadOrUpdates) {
      if (u.achievement_id.startsWith('_state_')) {
        stateUpdates.push({ key: u.achievement_id, value: u.current_value });
      } else {
        const existingAch = achievementsMap.get(u.achievement_id);
        if (existingAch) {
          achUpdates.push(u);
        } else {
          advUpdates.push({
            advancement_id: u.achievement_id,
            unlocked: u.unlocked,
            unlocked_at: u.unlocked_at,
          });
        }
      }
    }
  } else {
    achUpdates = payloadOrUpdates.achievementUpdates ?? [];
    advUpdates = payloadOrUpdates.advancementUpdates ?? [];
    stateUpdates = payloadOrUpdates.stateUpdates ?? [];
    if (!unlocks && 'newUnlocks' in payloadOrUpdates) {
      directUnlocks = (payloadOrUpdates as { newUnlocks?: UnlockedAchievement[] }).newUnlocks ?? [];
    }
  }

  // Update achievements map
  for (const u of achUpdates) {
    const existing = achievementsMap.get(u.achievement_id);
    if (existing) {
      achievementsMap.set(u.achievement_id, {
        ...existing,
        current_value: u.current_value,
        target_value: u.target_value ?? existing.target_value,
        unlocked: u.unlocked,
        unlocked_at: u.unlocked_at ?? existing.unlocked_at,
        tier: u.tier,
        updated_at: now,
      });
    }
  }

  // Update advancements map
  for (const u of advUpdates) {
    const existing = advancementsMap.get(u.advancement_id);
    if (existing) {
      advancementsMap.set(u.advancement_id, {
        ...existing,
        unlocked: u.unlocked,
        unlocked_at: u.unlocked_at ?? existing.unlocked_at,
        updated_at: now,
      });
    }
  }

  // Update tracking state map
  for (const s of stateUpdates) {
    trackingStateMap.set(s.key, {
      key: s.key,
      value: s.value,
      updated_at: now,
    });
  }

  if (directUnlocks.length > 0) {
    toastQueue = [...toastQueue, ...directUnlocks];
  }
}

export function dequeueToast(): UnlockedAchievement | null {
  if (toastQueue.length === 0) return null;
  const [first, ...rest] = toastQueue;
  toastQueue = rest;
  return first ?? null;
}

export async function setTrophyShowcase(
  slot: number,
  itemId: string | null,
  itemType?: 'achievement' | 'advancement' | null,
): Promise<void> {
  let resolvedType: 'achievement' | 'advancement' | null = itemType ?? null;

  if (itemId && !resolvedType) {
    if (achievementsMap.has(itemId)) {
      resolvedType = 'achievement';
    } else if (advancementsMap.has(itemId)) {
      resolvedType = 'advancement';
    }
  }

  if (itemId && resolvedType) {
    if (resolvedType === 'achievement') {
      const ach = achievementsMap.get(itemId);
      if (!ach || (!ach.unlocked && ach.tier <= 0)) return;
    } else if (resolvedType === 'advancement') {
      const adv = advancementsMap.get(itemId);
      if (!adv || !adv.unlocked) return;
    }
  }

  try {
    await trophyShowcaseApi.set(slot, itemId, resolvedType);
    const updated = await trophyShowcaseApi.get();
    showcaseSlots = updated;
  } catch (err) {
    console.error('Failed to set trophy showcase:', err);
  }
}

export function useAchievementStore() {
  const items = $derived.by<AchievementItem[]>(() => {
    return ACHIEVEMENT_DEFINITIONS.map((def) => {
      const isAch = def.category === 'achievement';
      if (isAch) {
        const ach = achievementsMap.get(def.id) ?? {
          achievement_id: def.id,
          category: def.category,
          current_value: 0,
          target_value: def.tiers[def.tiers.length - 1]?.target ?? 1,
          tier: 0,
          unlocked: false,
          unlocked_at: null,
          updated_at: '',
        };
        return {
          definition: def,
          progress: ach,
          isUnlocked: ach.unlocked || ach.tier > 0,
          currentTier: ach.tier,
          itemType: 'achievement',
        };
      } else {
        const adv = advancementsMap.get(def.id) ?? {
          advancement_id: def.id,
          category: def.category,
          rank: def.tiers[0]?.tier ?? 1,
          unlocked: false,
          unlocked_at: null,
          updated_at: '',
        };
        return {
          definition: def,
          progress: {
            achievement_id: adv.advancement_id,
            category: adv.category,
            current_value: adv.unlocked ? 1 : 0,
            target_value: 1,
            tier: adv.rank,
            unlocked: adv.unlocked,
            unlocked_at: adv.unlocked_at,
            updated_at: adv.updated_at,
          },
          isUnlocked: adv.unlocked,
          currentTier: adv.rank,
          itemType: 'advancement',
        };
      }
    });
  });

  const unlockedCount = $derived.by(() => {
    return items.filter((item) => item.isUnlocked).length;
  });

  const totalCount = $derived(ACHIEVEMENT_DEFINITIONS.length);

  const completionPercent = $derived.by(() => {
    if (totalCount === 0) return 0;
    return Math.round((unlockedCount / totalCount) * 100);
  });

  const latestUnlock = $derived.by<AchievementItem | null>(() => {
    const unlocked = items.filter((i) => i.progress.unlocked_at);
    if (unlocked.length === 0) return null;
    const sorted = [...unlocked].sort((a, b) => {
      const ta = new SvelteDate(a.progress.unlocked_at ?? 0).getTime();
      const tb = new SvelteDate(b.progress.unlocked_at ?? 0).getTime();
      return tb - ta;
    });
    return sorted[0] ?? null;
  });

  const showcaseItems = $derived.by(() => {
    return showcaseSlots.map((slot) => {
      if (!slot.item_id) return { slot: slot.slot, item: null };
      const found = items.find((i) => i.definition.id === slot.item_id);
      return { slot: slot.slot, item: found ?? null };
    });
  });

  return {
    get achievements() {
      return achievementsMap;
    },
    get advancements() {
      return advancementsMap;
    },
    get trackingState() {
      return trackingStateMap;
    },
    get showcaseSlots() {
      return showcaseSlots;
    },
    get toastQueue() {
      return toastQueue;
    },
    get isLoading() {
      return isLoading;
    },
    get isLoaded() {
      return isLoaded;
    },
    get items() {
      return items;
    },
    get unlockedCount() {
      return unlockedCount;
    },
    get totalCount() {
      return totalCount;
    },
    get completionPercent() {
      return completionPercent;
    },
    get latestUnlock() {
      return latestUnlock;
    },
    get showcaseItems() {
      return showcaseItems;
    },
    loadAll: loadAchievements,
    applyUpdates: applyAchievementUpdates,
    dequeueToast,
    setShowcase: setTrophyShowcase,
  };
}
