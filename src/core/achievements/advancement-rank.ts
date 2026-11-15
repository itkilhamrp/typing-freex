/**
 * Advancement Rank System
 * Pure TypeScript, zero external dependencies.
 * Advancements are one-time feats/missions with distinct rarity ranks (Common -> Mythic)
 * instead of tiered progression (Bronze I -> Grandmaster).
 */

export type AdvancementRank =
  | 'locked'
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export interface AdvancementRankMeta {
  name: AdvancementRank;
  tierNumber: number;
  labelKey: string;
  fillColor: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
}

export function getAdvancementRankMeta(tier: number): AdvancementRankMeta {
  if (tier <= 0) {
    return {
      name: 'locked',
      tierNumber: 0,
      labelKey: 'achievements.rank.locked',
      fillColor: '#64748b',
      accentColor: '#94a3b8',
      gradientFrom: '#334155',
      gradientTo: '#475569',
      glowColor: 'rgba(100, 116, 139, 0.2)',
    };
  }

  // Common: 1 - 3
  if (tier >= 1 && tier <= 3) {
    return {
      name: 'common',
      tierNumber: tier,
      labelKey: 'achievements.rank.common',
      fillColor: '#64748b',
      accentColor: '#94a3b8',
      gradientFrom: '#475569',
      gradientTo: '#64748b',
      glowColor: 'rgba(148, 163, 184, 0.3)',
    };
  }

  // Uncommon: 4 - 6 (Teal / Cyan)
  if (tier >= 4 && tier <= 6) {
    return {
      name: 'uncommon',
      tierNumber: tier,
      labelKey: 'achievements.rank.uncommon',
      fillColor: '#0d9488',
      accentColor: '#2dd4bf',
      gradientFrom: '#115e59',
      gradientTo: '#14b8a6',
      glowColor: 'rgba(45, 212, 191, 0.35)',
    };
  }

  // Rare: 7 - 9 (Sapphire / Cobalt / Electric Blue)
  if (tier >= 7 && tier <= 9) {
    return {
      name: 'rare',
      tierNumber: tier,
      labelKey: 'achievements.rank.rare',
      fillColor: '#2563eb',
      accentColor: '#60a5fa',
      gradientFrom: '#1e40af',
      gradientTo: '#3b82f6',
      glowColor: 'rgba(96, 165, 250, 0.4)',
    };
  }

  // Epic: 10 - 12 (Amethyst / Violet / Royal Purple)
  if (tier >= 10 && tier <= 12) {
    return {
      name: 'epic',
      tierNumber: tier,
      labelKey: 'achievements.rank.epic',
      fillColor: '#9333ea',
      accentColor: '#c084fc',
      gradientFrom: '#6b21a8',
      gradientTo: '#a855f7',
      glowColor: 'rgba(192, 132, 252, 0.45)',
    };
  }

  // Legendary: 13 - 17 (Amber / Radiant Sun / Gold Flare)
  if (tier >= 13 && tier <= 17) {
    return {
      name: 'legendary',
      tierNumber: tier,
      labelKey: 'achievements.rank.legendary',
      fillColor: '#d97706',
      accentColor: '#fde047',
      gradientFrom: '#b45309',
      gradientTo: '#f59e0b',
      glowColor: 'rgba(253, 224, 71, 0.5)',
    };
  }

  // Mythic: 18+ (Ruby / Crimson / Prismatic Rose)
  return {
    name: 'mythic',
    tierNumber: tier,
    labelKey: 'achievements.rank.mythic',
    fillColor: '#e11d48',
    accentColor: '#fb7185',
    gradientFrom: '#9f1239',
    gradientTo: '#f43f5e',
    glowColor: 'rgba(251, 113, 133, 0.55)',
  };
}

export function formatAdvancementDisplay(
  tier: number,
  t: (key: string) => string,
): { title: string; badge: string } {
  const meta = getAdvancementRankMeta(tier);
  const title = t(meta.labelKey);
  return {
    title,
    badge: title,
  };
}
