import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  calculateNetWpm,
  calculateRawWpm,
  calculateAccuracy,
  calculateConsistency,
  calculateLatencyStats,
} from './index';

describe('Typing Metrics Suite (FR-MET-*)', () => {
  describe('WPM and Raw WPM', () => {
    it('calculates correct net WPM with 5 chars/word normalization', () => {
      expect(calculateNetWpm(250, 60)).toBe(50);
      expect(calculateNetWpm(300, 30)).toBe(120);
      expect(calculateNetWpm(0, 60)).toBe(0);
      expect(calculateNetWpm(100, 0)).toBe(0);
    });

    it('calculates raw WPM including errors', () => {
      expect(calculateRawWpm(300, 60)).toBe(60);
      expect(calculateRawWpm(0, 30)).toBe(0);
    });

    it('satisfies invariant: rawWpm >= netWpm whenever totalKeystrokes >= correctChars', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 2000 }),
          fc.integer({ min: 0, max: 2000 }),
          fc.float({ min: 1, max: 300, noNaN: true }),
          (correct, extraOrErrors, seconds) => {
            const total = correct + extraOrErrors;
            const net = calculateNetWpm(correct, seconds);
            const raw = calculateRawWpm(total, seconds);
            return raw >= net - 1e-5;
          }
        )
      );
    });
  });

  describe('Accuracy', () => {
    it('calculates percentage accurately', () => {
      expect(calculateAccuracy(90, 100)).toBe(90);
      expect(calculateAccuracy(100, 100)).toBe(100);
      expect(calculateAccuracy(0, 0)).toBe(100);
      expect(calculateAccuracy(0, 50)).toBe(0);
    });

    it('satisfies property: accuracy is always within [0, 100]', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 1000 }),
          (correct, total) => {
            const acc = calculateAccuracy(correct, total);
            return acc >= 0 && acc <= 100;
          }
        )
      );
    });
  });

  describe('Consistency (§5.3)', () => {
    it('returns null if fewer than 3 seconds elapsed', () => {
      expect(calculateConsistency([])).toBeNull();
      expect(calculateConsistency([50])).toBeNull();
      expect(calculateConsistency([50, 50])).toBeNull();
    });

    it('returns 100 for perfectly identical speeds', () => {
      expect(calculateConsistency([60, 60, 60, 60])).toBe(100);
    });

    it('returns lower consistency for volatile speeds', () => {
      const stable = calculateConsistency([60, 62, 59, 61, 60]);
      const erratic = calculateConsistency([20, 90, 30, 85, 40]);

      expect(stable).not.toBeNull();
      expect(erratic).not.toBeNull();
      expect(stable!).toBeGreaterThan(erratic!);
    });

    it('satisfies property: consistency is within [0, 100] when n >= 3', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 0, max: 250, noNaN: true }), { minLength: 3, maxLength: 60 }),
          (series) => {
            const cons = calculateConsistency(series);
            return cons !== null && cons >= 0 && cons <= 100;
          }
        )
      );
    });
  });

  describe('Latency (§5.3)', () => {
    it('computes mean, median, p95, and pause counts correctly', () => {
      // Keystrokes at 1000ms, 1100ms (delta 100), 1200ms (delta 100), 1350ms (delta 150), 4000ms (pause > 2000)
      const timestamps = [1000, 1100, 1200, 1350, 4000];
      const stats = calculateLatencyStats(timestamps);

      expect(stats.pausesCount).toBe(1); // the 4000 - 1350 = 2650ms gap
      expect(stats.meanMs).toBeCloseTo((100 + 100 + 150) / 3, 1);
      expect(stats.medianMs).toBe(100);
      expect(stats.p95Ms).toBe(150);
    });
  });
});
