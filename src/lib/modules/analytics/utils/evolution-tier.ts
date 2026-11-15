/**
 * @file evolution-tier.ts
 * @description Progression engine for Personal Best keycap evolution tiers (Tiers 0 to 10).
 * Implements rigorous, highly challenging thresholds across all difficulty modes:
 * - Normal: Base Tier 0 (< 30 WPM or < 80% Acc), Tier 1 (30 WPM / 80% Acc), up to Tier 10 (165 WPM / 99% Acc).
 * - Expert: Base Tier 0 (< 40 WPM or < 85% Acc), Tier 1 (40 WPM / 85% Acc), up to Tier 10 (175 WPM / 99.5% Acc).
 * - Master: Base Tier 0 (< 40 WPM), Tier 1 (40 WPM / 100% Acc), up to Tier 10 (220 WPM / 100% Acc).
 * Pure mathematical functions, zero dependencies, zero allocation, sub-microsecond execution.
 */

export type DifficultyMode = "normal" | "expert" | "master";

export interface TierThreshold {
  tier: number;
  minWpm: number;
  minAccuracy: number;
}

export const TIER_THRESHOLDS_NORMAL: readonly TierThreshold[] = [
  { tier: 10, minWpm: 165, minAccuracy: 99 },
  { tier: 9, minWpm: 150, minAccuracy: 98 },
  { tier: 8, minWpm: 135, minAccuracy: 97 },
  { tier: 7, minWpm: 120, minAccuracy: 96 },
  { tier: 6, minWpm: 105, minAccuracy: 94 },
  { tier: 5, minWpm: 90, minAccuracy: 92 },
  { tier: 4, minWpm: 75, minAccuracy: 90 },
  { tier: 3, minWpm: 60, minAccuracy: 88 },
  { tier: 2, minWpm: 45, minAccuracy: 85 },
  { tier: 1, minWpm: 30, minAccuracy: 80 },
  { tier: 0, minWpm: 0, minAccuracy: 0 },
] as const;

export const TIER_THRESHOLDS_EXPERT: readonly TierThreshold[] = [
  { tier: 10, minWpm: 175, minAccuracy: 99.5 },
  { tier: 9, minWpm: 160, minAccuracy: 99 },
  { tier: 8, minWpm: 145, minAccuracy: 98 },
  { tier: 7, minWpm: 130, minAccuracy: 97 },
  { tier: 6, minWpm: 115, minAccuracy: 96 },
  { tier: 5, minWpm: 100, minAccuracy: 95 },
  { tier: 4, minWpm: 85, minAccuracy: 94 },
  { tier: 3, minWpm: 70, minAccuracy: 92 },
  { tier: 2, minWpm: 55, minAccuracy: 90 },
  { tier: 1, minWpm: 40, minAccuracy: 85 },
  { tier: 0, minWpm: 0, minAccuracy: 0 },
] as const;

export const TIER_THRESHOLDS_MASTER: readonly TierThreshold[] = [
  { tier: 10, minWpm: 220, minAccuracy: 100 },
  { tier: 9, minWpm: 200, minAccuracy: 100 },
  { tier: 8, minWpm: 180, minAccuracy: 100 },
  { tier: 7, minWpm: 160, minAccuracy: 100 },
  { tier: 6, minWpm: 140, minAccuracy: 100 },
  { tier: 5, minWpm: 120, minAccuracy: 100 },
  { tier: 4, minWpm: 100, minAccuracy: 100 },
  { tier: 3, minWpm: 80, minAccuracy: 100 },
  { tier: 2, minWpm: 60, minAccuracy: 100 },
  { tier: 1, minWpm: 40, minAccuracy: 100 },
  { tier: 0, minWpm: 0, minAccuracy: 100 },
] as const;

/**
 * Computes the evolution tier (0 to 10) for a given performance record.
 * Typing below Tier 1 thresholds remains strictly at Tier 0.
 *
 * @param difficulty - Active difficulty mode ("normal", "expert", "master" or undefined)
 * @param wpm - Typing speed in Words Per Minute
 * @param accuracy - Typing accuracy percentage (0 to 100)
 * @returns Evolution tier integer between 0 and 10
 */
export function getEvolutionTier(
  difficulty: string | null | undefined,
  wpm: number,
  accuracy: number,
): number {
  const safeWpm =
    wpm === Number.POSITIVE_INFINITY
      ? 9999
      : Number.isFinite(wpm)
        ? Math.max(0, wpm)
        : 0;
  const safeAcc =
    accuracy === Number.POSITIVE_INFINITY
      ? 100
      : Number.isFinite(accuracy)
        ? Math.max(0, Math.min(100, accuracy))
        : 0;

  if (difficulty === "master") {
    // Master mode: Accuracy is strictly 100% by game design; progression is pure speed
    for (const t of TIER_THRESHOLDS_MASTER) {
      if (safeWpm >= t.minWpm) {
        return t.tier;
      }
    }
    return 0;
  }

  if (difficulty === "expert") {
    // Expert mode: Both speed and rigorous accuracy discipline required
    for (const t of TIER_THRESHOLDS_EXPERT) {
      if (safeWpm >= t.minWpm && safeAcc >= t.minAccuracy) {
        return t.tier;
      }
    }
    return 0;
  }

  // Normal mode (default)
  for (const t of TIER_THRESHOLDS_NORMAL) {
    if (safeWpm >= t.minWpm && safeAcc >= t.minAccuracy) {
      return t.tier;
    }
  }
  return 0;
}

/**
 * Retrieves the minimum threshold parameters for a specific difficulty and tier.
 */
export function getTierThreshold(
  difficulty: string | null | undefined,
  tier: number,
): TierThreshold {
  const clampedTier = Math.max(0, Math.min(10, Math.round(tier ?? 0)));

  let list: readonly TierThreshold[];
  if (difficulty === "master") {
    list = TIER_THRESHOLDS_MASTER;
  } else if (difficulty === "expert") {
    list = TIER_THRESHOLDS_EXPERT;
  } else {
    list = TIER_THRESHOLDS_NORMAL;
  }

  const found = list.find((t) => t.tier === clampedTier);
  return found ?? { tier: 0, minWpm: 0, minAccuracy: 0 };
}
