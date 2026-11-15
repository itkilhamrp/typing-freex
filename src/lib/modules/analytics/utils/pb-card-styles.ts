/**
 * Pure visual style calculation helpers for Personal Best Evolution Cards.
 * Zero Svelte, DOM, or reactive store dependencies (UNIX Rule of Separation).
 */

const polygonCache: Record<string, string> = {};
const borderGradientCache: Record<string, string> = {};

/**
 * Asymmetrical, Non-Proportional 6-sided Polygon Silhouette generator:
 * Unique across EVERY mode (Normal, Expert, Master) AND evolves on EVERY single tier (0 to 10).
 */
export function getCardPolygon(
  difficulty: string | null | undefined,
  tier: number,
): string {
  const diffKey = difficulty ?? "normal";
  const t = Math.max(0, Math.min(10, tier ?? 0));
  const cacheKey = `${diffKey}:${t}`;
  const cached = polygonCache[cacheKey];
  if (cached) return cached;

  let result: string;
  if (difficulty === "master") {
    const topApexX = 52 + t;
    const rightWingY = Math.round(6 + t * 0.7);
    const rightBottomY = Math.round(6 + t * 0.7);
    const bottomSpearX = 44 - t;
    const leftBottomY = Math.round(7 + t * 0.6);
    const leftShoulderY = Math.round(7 + t * 0.7);
    result = `polygon(${topApexX}% 0%, 100% ${rightWingY}px, 100% calc(100% - ${rightBottomY}px), ${bottomSpearX}% 100%, 0% calc(100% - ${leftBottomY}px), 0% ${leftShoulderY}px)`;
  } else if (difficulty === "expert") {
    const topLeftChamfer = Math.round(7 + t * 0.7);
    const rightBottomY = Math.round(7 + t * 0.6);
    const bottomOffset = 48 + t;
    const leftBottomY = Math.round(6 + t * 0.7);
    const leftWaistY = Math.round(8 + t * 0.6);
    result = `polygon(${topLeftChamfer}px 0%, 100% 0%, 100% calc(100% - ${rightBottomY}px), ${bottomOffset}% 100%, 0% calc(100% - ${leftBottomY}px), 0% ${leftWaistY}px)`;
  } else {
    const topChamferRight = Math.round(7 + t * 0.7);
    const topChamferRightY = Math.round(7 + t * 0.7);
    const bottomChamferRightY = Math.round(6 + t * 0.6);
    const bottomChamferRightX = Math.round(7 + t * 0.7);
    const bottomLeftNotchY = Math.round(7 + t * 0.6);
    result = `polygon(0% 0%, calc(100% - ${topChamferRight}px) 0%, 100% ${topChamferRightY}px, 100% calc(100% - ${bottomChamferRightY}px), calc(100% - ${bottomChamferRightX}px) 100%, 0% calc(100% - ${bottomLeftNotchY}px))`;
  }

  polygonCache[cacheKey] = result;
  return result;
}

const MASTER_BORDER_GRADIENTS: Record<number, string> = {
  10: "linear-gradient(to bottom, #fde68a, #f43f5e, #67e8f9)",
  9: "linear-gradient(to bottom, #fcd34d, #ef4444, #fb7185)",
  8: "linear-gradient(to bottom, #fb7185, #ef4444, #9333ea)",
  7: "linear-gradient(to bottom, #f87171, #fbbf24, #e11d48)",
  6: "linear-gradient(to bottom, #fb7185, #f59e0b, #dc2626)",
  5: "linear-gradient(to bottom, #f87171, #ffffff, #dc2626)",
  4: "linear-gradient(to bottom, #f87171, #f43f5e, #b91c1c)",
  3: "linear-gradient(to bottom, #ef4444, #e11d48, #991b1b)",
  2: "linear-gradient(to bottom, #dc2626, #b91c1c, #7f1d1d)",
  1: "linear-gradient(to bottom, rgba(220,38,38,0.7), rgba(127,29,29,0.5))",
};

const EXPERT_BORDER_GRADIENTS: Record<number, string> = {
  10: "linear-gradient(to bottom, #fef9c3, #fcd34d, #6ee7b7)",
  9: "linear-gradient(to bottom, #fef08a, #fbbf24, #fb923c)",
  8: "linear-gradient(to bottom, #fde68a, #facc15, #f97316)",
  7: "linear-gradient(to bottom, #fcd34d, #fb923c, #ca8a04)",
  6: "linear-gradient(to bottom, #facc15, #f97316, #d97706)",
  5: "linear-gradient(to bottom, #fbbf24, #ffffff, #d97706)",
  4: "linear-gradient(to bottom, #fbbf24, #facc15, #b45309)",
  3: "linear-gradient(to bottom, #f59e0b, #d97706, #92400e)",
  2: "linear-gradient(to bottom, #d97706, #b45309, #78350f)",
  1: "linear-gradient(to bottom, rgba(217,119,6,0.7), rgba(120,53,15,0.5))",
};

const NORMAL_BORDER_GRADIENTS: Record<number, string> = {
  10: "linear-gradient(to bottom, #ccfbf1, #67e8f9, #c4b5fd)",
  9: "linear-gradient(to bottom, #a5f3fc, #5eead4, #818cf8)",
  8: "linear-gradient(to bottom, #67e8f9, #2dd4bf, #3b82f6)",
  7: "linear-gradient(to bottom, #5eead4, #22d3ee, #0d9488)",
  6: "linear-gradient(to bottom, #22d3ee, #14b8a6, #059669)",
  5: "linear-gradient(to bottom, #2dd4bf, #ffffff, #0d9488)",
  4: "linear-gradient(to bottom, #2dd4bf, #06b6d4, #0f766e)",
  3: "linear-gradient(to bottom, #14b8a6, #059669, #115e59)",
  2: "linear-gradient(to bottom, #0d9488, #0f766e, #134e4a)",
  1: "linear-gradient(to bottom, rgba(13,148,136,0.7), rgba(15,118,110,0.5))",
};

/**
 * Direct CSS linear-gradient values to keep CSS bundle budget minimal and zero-lag.
 */
export function getCardBorderGradient(
  difficulty: string | null | undefined,
  tier: number,
): string {
  const diffKey = difficulty ?? "normal";
  const cacheKey = `${diffKey}:${tier}`;
  const cached = borderGradientCache[cacheKey];
  if (cached) return cached;

  let result: string;
  if (difficulty === "master") {
    result =
      MASTER_BORDER_GRADIENTS[tier] ??
      "linear-gradient(to bottom, rgba(127,29,29,0.4), rgba(69,10,10,0.3))";
  } else if (difficulty === "expert") {
    result =
      EXPERT_BORDER_GRADIENTS[tier] ??
      "linear-gradient(to bottom, rgba(120,53,15,0.4), rgba(69,26,3,0.3))";
  } else {
    result =
      NORMAL_BORDER_GRADIENTS[tier] ??
      "linear-gradient(to bottom, rgba(51,65,85,0.4), rgba(15,23,42,0.4))";
  }

  borderGradientCache[cacheKey] = result;
  return result;
}

export function getGlowColor(
  difficulty: string | null | undefined,
  tier: number,
): string {
  if (difficulty === "master") {
    if (tier >= 10) return "rgba(239, 68, 68, 0.85)";
    if (tier >= 8) return "rgba(239, 68, 68, 0.6)";
    if (tier >= 6) return "rgba(239, 68, 68, 0.42)";
    if (tier >= 4) return "rgba(239, 68, 68, 0.28)";
    if (tier >= 2) return "rgba(239, 68, 68, 0.16)";
    if (tier >= 1) return "rgba(239, 68, 68, 0.1)";
    return "rgba(0, 0, 0, 0.08)";
  }
  if (difficulty === "expert") {
    if (tier >= 10) return "rgba(245, 158, 11, 0.8)";
    if (tier >= 8) return "rgba(245, 158, 11, 0.58)";
    if (tier >= 6) return "rgba(245, 158, 11, 0.42)";
    if (tier >= 4) return "rgba(245, 158, 11, 0.28)";
    if (tier >= 2) return "rgba(245, 158, 11, 0.16)";
    if (tier >= 1) return "rgba(245, 158, 11, 0.1)";
    return "rgba(0, 0, 0, 0.08)";
  }
  if (tier >= 10) return "rgba(20, 184, 166, 0.78)";
  if (tier >= 8) return "rgba(20, 184, 166, 0.56)";
  if (tier >= 6) return "rgba(20, 184, 166, 0.4)";
  if (tier >= 4) return "rgba(20, 184, 166, 0.26)";
  if (tier >= 2) return "rgba(20, 184, 166, 0.14)";
  if (tier >= 1) return "rgba(20, 184, 166, 0.08)";
  return "rgba(0, 0, 0, 0.06)";
}

export function getRailColor(
  difficulty: string | null | undefined,
  tier: number,
): string {
  if (difficulty === "master") {
    return tier >= 1
      ? "bg-gradient-to-r from-red-500 via-red-400/80 to-transparent"
      : "bg-transparent";
  }
  if (difficulty === "expert") {
    return tier >= 1
      ? "bg-gradient-to-r from-amber-500 via-amber-400/80 to-transparent"
      : "bg-transparent";
  }
  if (tier >= 1) {
    return "bg-gradient-to-r from-teal-500 via-teal-400/80 to-transparent";
  }
  return "bg-transparent";
}

export function getSpeedColor(
  difficulty: string | null | undefined,
  tier: number,
): string {
  if (difficulty === "master") {
    if (tier >= 9) {
      return "text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-rose-300";
    }
    if (tier >= 5) return "text-red-500 dark:text-red-400";
    return "text-red-600 dark:text-red-400";
  }
  if (difficulty === "expert") {
    if (tier >= 9) {
      return "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-orange-400";
    }
    if (tier >= 5) return "text-amber-600 dark:text-amber-400";
    return "text-amber-600 dark:text-amber-400";
  }
  if (tier >= 9) {
    return "text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-200 to-indigo-300";
  }
  if (tier >= 4) return "text-teal-600 dark:text-teal-400";
  return "text-tt-text";
}

