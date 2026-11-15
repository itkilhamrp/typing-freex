import { describe, it, expect } from 'vitest';
import {
  getTierMeta,
  formatTierDisplay,
  toRomanNumeral,
  formatMissionDescription,
  getMissionEligibleModes,
} from './tier-system';

describe('tier-system', () => {
  describe('toRomanNumeral', () => {
    it('converts numbers to Roman numerals correctly', () => {
      expect(toRomanNumeral(0)).toBe('');
      expect(toRomanNumeral(1)).toBe('I');
      expect(toRomanNumeral(2)).toBe('II');
      expect(toRomanNumeral(3)).toBe('III');
      expect(toRomanNumeral(4)).toBe('IV');
      expect(toRomanNumeral(5)).toBe('V');
    });
  });

  describe('getTierMeta: 10-Rank System (Free Fire-inspired)', () => {
    it('handles locked tier (<= 0)', () => {
      const meta = getTierMeta(0);
      expect(meta.name).toBe('locked');
      expect(meta.isStarRank).toBe(false);
      expect(meta.level).toBe(0);
    });

    it('maps Bronze tiers (1–3)', () => {
      const t1 = getTierMeta(1);
      expect(t1.name).toBe('bronze');
      expect(t1.level).toBe(1);
      expect(t1.romanLevel).toBe('I');
      expect(t1.isStarRank).toBe(false);

      const t3 = getTierMeta(3);
      expect(t3.name).toBe('bronze');
      expect(t3.level).toBe(3);
      expect(t3.romanLevel).toBe('III');
    });

    it('maps Silver tiers (4–6)', () => {
      const t4 = getTierMeta(4);
      expect(t4.name).toBe('silver');
      expect(t4.level).toBe(1);
      expect(t4.romanLevel).toBe('I');

      const t6 = getTierMeta(6);
      expect(t6.name).toBe('silver');
      expect(t6.level).toBe(3);
      expect(t6.romanLevel).toBe('III');
    });

    it('maps Gold tiers (7–10)', () => {
      const t7 = getTierMeta(7);
      expect(t7.name).toBe('gold');
      expect(t7.level).toBe(1);
      expect(t7.romanLevel).toBe('I');

      const t10 = getTierMeta(10);
      expect(t10.name).toBe('gold');
      expect(t10.level).toBe(4);
      expect(t10.romanLevel).toBe('IV');
    });

    it('maps Platinum tiers (11–15)', () => {
      const t11 = getTierMeta(11);
      expect(t11.name).toBe('platinum');
      expect(t11.level).toBe(1);
      expect(t11.romanLevel).toBe('I');

      const t15 = getTierMeta(15);
      expect(t15.name).toBe('platinum');
      expect(t15.level).toBe(5);
      expect(t15.romanLevel).toBe('V');
    });

    it('maps Diamond tiers (16–20)', () => {
      const t16 = getTierMeta(16);
      expect(t16.name).toBe('diamond');
      expect(t16.level).toBe(1);
      expect(t16.romanLevel).toBe('I');

      const t20 = getTierMeta(20);
      expect(t20.name).toBe('diamond');
      expect(t20.level).toBe(5);
      expect(t20.romanLevel).toBe('V');
    });

    it('maps Heroic tiers (21–25) with star ranking', () => {
      const t21 = getTierMeta(21);
      expect(t21.name).toBe('heroic');
      expect(t21.level).toBe(1);
      expect(t21.starCount).toBe(1);
      expect(t21.isStarRank).toBe(true);

      const t25 = getTierMeta(25);
      expect(t25.name).toBe('heroic');
      expect(t25.level).toBe(5);
      expect(t25.starCount).toBe(5);
      expect(t25.isStarRank).toBe(true);
    });

    it('maps Elite Heroic tiers (26–30) with star ranking', () => {
      const t26 = getTierMeta(26);
      expect(t26.name).toBe('eliteHeroic');
      expect(t26.level).toBe(1);
      expect(t26.starCount).toBe(1);
      expect(t26.isStarRank).toBe(true);

      const t30 = getTierMeta(30);
      expect(t30.name).toBe('eliteHeroic');
      expect(t30.level).toBe(5);
      expect(t30.starCount).toBe(5);
      expect(t30.isStarRank).toBe(true);
    });

    it('maps Master tiers (31–35) with star ranking', () => {
      const t31 = getTierMeta(31);
      expect(t31.name).toBe('master');
      expect(t31.level).toBe(1);
      expect(t31.starCount).toBe(1);
      expect(t31.isStarRank).toBe(true);

      const t35 = getTierMeta(35);
      expect(t35.name).toBe('master');
      expect(t35.level).toBe(5);
      expect(t35.starCount).toBe(5);
    });

    it('maps Elite Master tiers (36–40) with star ranking', () => {
      const t36 = getTierMeta(36);
      expect(t36.name).toBe('eliteMaster');
      expect(t36.level).toBe(1);
      expect(t36.starCount).toBe(1);
      expect(t36.isStarRank).toBe(true);

      const t40 = getTierMeta(40);
      expect(t40.name).toBe('eliteMaster');
      expect(t40.level).toBe(5);
      expect(t40.starCount).toBe(5);
    });

    it('maps Grandmaster tiers (41+) with star ranking and endless overflow', () => {
      const t41 = getTierMeta(41);
      expect(t41.name).toBe('grandmaster');
      expect(t41.level).toBe(1);
      expect(t41.starCount).toBe(1);
      expect(t41.overflowCount).toBe(0);
      expect(t41.isStarRank).toBe(true);

      const t45 = getTierMeta(45);
      expect(t45.name).toBe('grandmaster');
      expect(t45.level).toBe(5);
      expect(t45.starCount).toBe(5);
      expect(t45.overflowCount).toBe(0);
      expect(t45.isStarRank).toBe(true);

      const t46 = getTierMeta(46);
      expect(t46.name).toBe('grandmaster');
      expect(t46.level).toBe(6);
      expect(t46.starCount).toBe(5);
      expect(t46.overflowCount).toBe(1);
      expect(t46.isStarRank).toBe(true);

      const t50 = getTierMeta(50);
      expect(t50.name).toBe('grandmaster');
      expect(t50.level).toBe(10);
      expect(t50.starCount).toBe(5);
      expect(t50.overflowCount).toBe(5);
      expect(t50.isStarRank).toBe(true);
    });
  });

  describe('formatTierDisplay', () => {
    const mockT = (key: string) => {
      const map: Record<string, string> = {
        'achievements.tier.locked': 'Locked',
        'achievements.tier.bronze': 'Bronze',
        'achievements.tier.silver': 'Silver',
        'achievements.tier.gold': 'Gold',
        'achievements.tier.platinum': 'Platinum',
        'achievements.tier.diamond': 'Diamond',
        'achievements.tier.heroic': 'Heroic',
        'achievements.tier.eliteHeroic': 'Elite Heroic',
        'achievements.tier.master': 'Master',
        'achievements.tier.eliteMaster': 'Elite Master',
        'achievements.tier.grandmaster': 'Grandmaster',
      };
      return map[key] ?? key;
    };

    it('formats Roman tier display correctly', () => {
      const bronze2 = formatTierDisplay(2, mockT);
      expect(bronze2.title).toBe('Bronze II');
      expect(bronze2.badge).toBe('Bronze II');

      const dia3 = formatTierDisplay(18, mockT);
      expect(dia3.title).toBe('Diamond III');
      expect(dia3.badge).toBe('Diamond III');
    });

    it('formats Star tier display correctly for Heroic and beyond', () => {
      const heroic3 = formatTierDisplay(23, mockT);
      expect(heroic3.title).toBe('Heroic ★★★');
      expect(heroic3.badge).toBe('Heroic 3★');

      const gm5 = formatTierDisplay(45, mockT);
      expect(gm5.title).toBe('Grandmaster ★★★★★');
      expect(gm5.badge).toBe('Grandmaster 5★');

      const gmPlus1 = formatTierDisplay(46, mockT);
      expect(gmPlus1.title).toBe('Grandmaster ★★★★★ +1');
      expect(gmPlus1.badge).toBe('Grandmaster 5★ +1');

      const gmPlus5 = formatTierDisplay(50, mockT);
      expect(gmPlus5.title).toBe('Grandmaster ★★★★★ +5');
      expect(gmPlus5.badge).toBe('Grandmaster 5★ +5');
    });
  });

  describe('formatMissionDescription', () => {
    it('keeps original description when unit is wpm', () => {
      const desc = 'Reach 30 WPM in a typing test';
      expect(formatMissionDescription(desc, 'wpm')).toBe('Reach 30 WPM in a typing test');
    });

    it('converts simple WPM to CPM (1 WPM = 5 CPM)', () => {
      expect(formatMissionDescription('Reach 30 WPM in a typing test', 'cpm')).toBe(
        'Reach 150 CPM in a typing test',
      );
      expect(formatMissionDescription('Complete a test at 120+ WPM', 'cpm')).toBe(
        'Complete a test at 600+ CPM',
      );
    });

    it('converts Raw WPM to Raw CPM', () => {
      expect(formatMissionDescription('Hit 40 Raw WPM in any session', 'cpm')).toBe(
        'Hit 200 Raw CPM in any session',
      );
      expect(formatMissionDescription('Achieve 200+ Raw WPM in any typing test', 'cpm')).toBe(
        'Achieve 1000+ Raw CPM in any typing test',
      );
    });

    it('converts Indonesian descriptions seamlessly', () => {
      expect(formatMissionDescription('Capai 30 WPM dalam satu tes mengetik', 'cpm')).toBe(
        'Capai 150 CPM dalam satu tes mengetik',
      );
      expect(formatMissionDescription('Tembus 40 Raw WPM dalam satu sesi', 'cpm')).toBe(
        'Tembus 200 Raw CPM dalam satu sesi',
      );
    });

    it('converts variance and relative speed descriptions', () => {
      expect(formatMissionDescription('Complete 5 consecutive tests with WPM variance within 5', 'cpm')).toBe(
        'Complete 5 consecutive tests with CPM variance within 25',
      );
      expect(formatMissionDescription('Improve WPM by 5+ in a test compared to previous', 'cpm')).toBe(
        'Improve CPM by 25+ in a test compared to previous',
      );
    });
  });

  describe('getMissionEligibleModes', () => {
    it('returns explicit eligibleModes if present', () => {
      expect(getMissionEligibleModes({ eligibleModes: ['time', 'words'], group: 'speed' })).toEqual([
        'time',
        'words',
      ]);
    });

    it('defaults speed, accuracy, consistency to competitive modes', () => {
      expect(getMissionEligibleModes({ group: 'speed' })).toEqual([
        'time',
        'words',
        'quote',
        'tech',
      ]);
      expect(getMissionEligibleModes({ group: 'accuracy' })).toEqual([
        'time',
        'words',
        'quote',
        'tech',
      ]);
      expect(getMissionEligibleModes({ group: 'consistency' })).toEqual([
        'time',
        'words',
        'quote',
        'tech',
      ]);
    });

    it('defaults other groups to specific competitive modes instead of all', () => {
      expect(getMissionEligibleModes({ group: 'milestones' })).toEqual([
        'time',
        'words',
        'quote',
        'tech',
      ]);
      expect(getMissionEligibleModes({ group: 'endurance' })).toEqual([
        'time',
        'words',
        'quote',
        'tech',
      ]);
    });
  });
});

