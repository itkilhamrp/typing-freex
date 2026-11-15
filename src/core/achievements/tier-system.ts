/**
 * Tier System
 * Handles multi-tier calculation, metadata lookup, and styling tokens for Typing FreeX achievements.
 * Pure TypeScript, zero external dependencies.
 * Inspired by modern competitive gaming tier rank structures (e.g. Free Fire).
 */

export type TierName =
  | 'locked'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'heroic'
  | 'eliteHeroic'
  | 'master'
  | 'eliteMaster'
  | 'grandmaster';

export function toRomanNumeral(num: number): string {
  if (num <= 0) return '';
  const romanMap: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let res = '';
  let n = num;
  for (const [val, roman] of romanMap) {
    while (n >= val) {
      res += roman;
      n -= val;
    }
  }
  return res;
}

export interface TierMeta {
  name: TierName;
  level: number;
  romanLevel: string;
  starCount: number;
  overflowCount: number;
  isStarRank: boolean;
  tierNumber: number;
  labelKey: string;
  tierTitleKey: string;
  fillColor: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
}

export function getTierMeta(tier: number): TierMeta {
  if (tier <= 0) {
    return {
      name: 'locked',
      level: 0,
      romanLevel: '',
      starCount: 0,
      overflowCount: 0,
      isStarRank: false,
      tierNumber: 0,
      labelKey: 'achievements.tier.locked',
      tierTitleKey: 'achievements.tier.locked',
      fillColor: '#64748b',
      accentColor: '#94a3b8',
      gradientFrom: '#334155',
      gradientTo: '#475569',
    };
  }

  // Bronze: Tiers 1–3 (Sub-ranks I, II, III)
  if (tier >= 1 && tier <= 3) {
    const level = tier; // 1, 2, 3
    return {
      name: 'bronze',
      level,
      romanLevel: toRomanNumeral(level),
      starCount: 0,
      overflowCount: 0,
      isStarRank: false,
      tierNumber: tier,
      labelKey: 'achievements.tier.bronze',
      tierTitleKey: 'achievements.tier.bronze',
      fillColor: '#b45309',
      accentColor: '#f59e0b',
      gradientFrom: '#78350f',
      gradientTo: '#d97706',
    };
  }

  // Silver: Tiers 4–6 (Sub-ranks I, II, III)
  if (tier >= 4 && tier <= 6) {
    const level = tier - 3; // 1, 2, 3
    return {
      name: 'silver',
      level,
      romanLevel: toRomanNumeral(level),
      starCount: 0,
      overflowCount: 0,
      isStarRank: false,
      tierNumber: tier,
      labelKey: 'achievements.tier.silver',
      tierTitleKey: 'achievements.tier.silver',
      fillColor: '#64748b',
      accentColor: '#cbd5e1',
      gradientFrom: '#334155',
      gradientTo: '#94a3b8',
    };
  }

  // Gold: Tiers 7–10 (Sub-ranks I, II, III, IV)
  if (tier >= 7 && tier <= 10) {
    const level = tier - 6; // 1, 2, 3, 4
    return {
      name: 'gold',
      level,
      romanLevel: toRomanNumeral(level),
      starCount: 0,
      overflowCount: 0,
      isStarRank: false,
      tierNumber: tier,
      labelKey: 'achievements.tier.gold',
      tierTitleKey: 'achievements.tier.gold',
      fillColor: '#d97706',
      accentColor: '#fde047',
      gradientFrom: '#b45309',
      gradientTo: '#facc15',
    };
  }

  // Platinum: Tiers 11–15 (Sub-ranks I, II, III, IV, V)
  if (tier >= 11 && tier <= 15) {
    const level = tier - 10; // 1, 2, 3, 4, 5
    return {
      name: 'platinum',
      level,
      romanLevel: toRomanNumeral(level),
      starCount: 0,
      overflowCount: 0,
      isStarRank: false,
      tierNumber: tier,
      labelKey: 'achievements.tier.platinum',
      tierTitleKey: 'achievements.tier.platinum',
      fillColor: '#0284c7',
      accentColor: '#7dd3fc',
      gradientFrom: '#0369a1',
      gradientTo: '#38bdf8',
    };
  }

  // Diamond: Tiers 16–20 (Sub-ranks I, II, III, IV, V)
  if (tier >= 16 && tier <= 20) {
    const level = tier - 15; // 1, 2, 3, 4, 5
    return {
      name: 'diamond',
      level,
      romanLevel: toRomanNumeral(level),
      starCount: 0,
      overflowCount: 0,
      isStarRank: false,
      tierNumber: tier,
      labelKey: 'achievements.tier.diamond',
      tierTitleKey: 'achievements.tier.diamond',
      fillColor: '#0891b2',
      accentColor: '#22d3ee',
      gradientFrom: '#0e7490',
      gradientTo: '#06b6d4',
    };
  }

  // Heroic: Tiers 21–25 (Star-based system: 1★ to 5★)
  if (tier >= 21 && tier <= 25) {
    const level = tier - 20; // 1, 2, 3, 4, 5
    return {
      name: 'heroic',
      level,
      romanLevel: toRomanNumeral(level),
      starCount: level,
      overflowCount: 0,
      isStarRank: true,
      tierNumber: tier,
      labelKey: 'achievements.tier.heroic',
      tierTitleKey: 'achievements.tier.heroic',
      fillColor: '#ea580c',
      accentColor: '#fb923c',
      gradientFrom: '#c2410c',
      gradientTo: '#f97316',
    };
  }

  // Elite Heroic: Tiers 26–30 (Star-based system: 1★ to 5★)
  if (tier >= 26 && tier <= 30) {
    const level = tier - 25; // 1, 2, 3, 4, 5
    return {
      name: 'eliteHeroic',
      level,
      romanLevel: toRomanNumeral(level),
      starCount: level,
      overflowCount: 0,
      isStarRank: true,
      tierNumber: tier,
      labelKey: 'achievements.tier.eliteHeroic',
      tierTitleKey: 'achievements.tier.eliteHeroic',
      fillColor: '#059669',
      accentColor: '#34d399',
      gradientFrom: '#047857',
      gradientTo: '#10b981',
    };
  }

  // Master: Tiers 31–35 (Top tier competitive: 1★ to 5★)
  if (tier >= 31 && tier <= 35) {
    const level = tier - 30; // 1, 2, 3, 4, 5
    return {
      name: 'master',
      level,
      romanLevel: toRomanNumeral(level),
      starCount: level,
      overflowCount: 0,
      isStarRank: true,
      tierNumber: tier,
      labelKey: 'achievements.tier.master',
      tierTitleKey: 'achievements.tier.master',
      fillColor: '#7e22ce',
      accentColor: '#c084fc',
      gradientFrom: '#6b21a8',
      gradientTo: '#a855f7',
    };
  }

  // Elite Master: Tiers 36–40 (Pinnacle readiness: 1★ to 5★)
  if (tier >= 36 && tier <= 40) {
    const level = tier - 35; // 1, 2, 3, 4, 5
    return {
      name: 'eliteMaster',
      level,
      romanLevel: toRomanNumeral(level),
      starCount: level,
      overflowCount: 0,
      isStarRank: true,
      tierNumber: tier,
      labelKey: 'achievements.tier.eliteMaster',
      tierTitleKey: 'achievements.tier.eliteMaster',
      fillColor: '#b91c1c',
      accentColor: '#f87171',
      gradientFrom: '#991b1b',
      gradientTo: '#ef4444',
    };
  }

  // Grandmaster: Tiers 41–45+ (Supreme rank, apex point threshold)
  const gmLevel = Math.max(1, tier - 40);
  const starCount = Math.min(5, gmLevel);
  const overflowCount = Math.max(0, gmLevel - 5);
  return {
    name: 'grandmaster',
    level: gmLevel,
    romanLevel: toRomanNumeral(Math.min(5, gmLevel)),
    starCount,
    overflowCount,
    isStarRank: true,
    tierNumber: tier,
    labelKey: 'achievements.tier.grandmaster',
    tierTitleKey: 'achievements.tier.grandmaster',
    fillColor: '#d97706',
    accentColor: '#fef08a',
    gradientFrom: '#b45309',
    gradientTo: '#f43f5e',
  };
}

export function formatTierDisplay(
  tier: number,
  t: (key: string) => string,
): { title: string; badge: string } {
  const meta = getTierMeta(tier);
  if (meta.name === 'locked') {
    return {
      title: t(meta.tierTitleKey),
      badge: t(meta.tierTitleKey),
    };
  }

  const baseTitle = t(meta.tierTitleKey);
  if (meta.isStarRank) {
    const stars = '★'.repeat(meta.starCount);
    if (meta.overflowCount > 0) {
      return {
        title: `${baseTitle} ${stars} +${meta.overflowCount}`,
        badge: `${baseTitle} 5★ +${meta.overflowCount}`,
      };
    }
    return {
      title: `${baseTitle} ${stars}`,
      badge: `${baseTitle} ${meta.starCount}★`,
    };
  }

  return {
    title: `${baseTitle} ${meta.romanLevel}`,
    badge: `${baseTitle} ${meta.romanLevel}`,
  };
}

export type SpeedUnit = 'wpm' | 'cpm';

/**
 * Formats a mission description dynamically based on the active speed unit.
 * When speedUnit is 'cpm', converts WPM values to CPM (1 WPM = 5 CPM).
 * Works seamlessly with both English and Indonesian descriptions.
 */
export function formatMissionDescription(
  desc: string,
  speedUnit: SpeedUnit = 'wpm',
): string {
  if (speedUnit !== 'cpm' || !desc) {
    return desc;
  }

  // 1. "WPM variance within (\d+)"
  let formatted = desc.replace(
    /\bWPM\s+variance\s+within\s+(\d+)\b/gi,
    (_, num) => `CPM variance within ${parseInt(num, 10) * 5}`,
  );

  // 2. Relative speed improvements: "Improve/Raise WPM by (\d+)" or "Tingkatkan WPM sebesar (\d+)"
  formatted = formatted.replace(
    /\b(Improve|Raise your|Tingkatkan)\s+(?:your\s+)?WPM\s+(?:by|sebesar|sebanyak)\s+(\d+)(\+)?/gi,
    (_, verb, num, plus) => {
      const val = parseInt(num, 10) * 5;
      const sign = plus ?? '';
      const isId = verb.toLowerCase() === 'tingkatkan';
      return `${verb} CPM ${isId ? 'sebesar' : 'by'} ${val}${sign}`;
    },
  );

  // 3. Main pattern: (\d+)(\+)?\s*(Raw\s+|Mentah\s+)?WPM
  formatted = formatted.replace(
    /(\d+)(\+)?\s*(Raw\s+|Mentah\s+)?WPM\b/g,
    (_, num, plus, prefix) => {
      const val = parseInt(num, 10) * 5;
      const plusSign = plus ?? '';
      const rawPrefix = prefix ?? '';
      return `${val}${plusSign} ${rawPrefix}CPM`;
    },
  );

  // 4. Any leftover standalone "WPM"
  formatted = formatted.replace(/\bWPM\b/g, 'CPM');

  return formatted;
}

/**
 * Resolves the canonical list of eligible modes for a mission definition.
 * Never returns generic 'all', ensuring specific, legitimate modes are always indicated.
 */
export function getMissionEligibleModes(def: {
  eligibleModes?: readonly string[] | string[];
  group: string;
}): string[] {
  if (def.eligibleModes && def.eligibleModes.length > 0) {
    return [...def.eligibleModes];
  }
  // Standard competitive modes fallback (prevents non-legitimate/cheating modes)
  return ['time', 'words', 'quote', 'tech'];
}


