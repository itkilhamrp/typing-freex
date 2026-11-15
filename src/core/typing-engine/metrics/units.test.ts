import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { toUnit, formatSpeed, CHARS_PER_WORD } from './units';

describe('Speed Units (§5.10)', () => {
  it('converts WPM to WPM without scaling', () => {
    expect(toUnit(60, 'wpm')).toBe(60);
  });

  it('converts WPM to CPM exactly by multiplying by 5', () => {
    expect(toUnit(60, 'cpm')).toBe(300);
    expect(toUnit(12.5, 'cpm')).toBe(62.5);
  });

  it('satisfies property test: cpm is always 5 * wpm for any non-negative number', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 500, noNaN: true }), (wpm) => {
        const cpm = toUnit(wpm, 'cpm');
        const expected = Math.round(wpm * CHARS_PER_WORD * 100) / 100;
        return Math.abs(cpm - expected) < 1e-5;
      })
    );
  });

  it('formats speed with correct suffix and formatting', () => {
    expect(formatSpeed(60, 'wpm')).toBe('60 WPM');
    expect(formatSpeed(60, 'cpm')).toBe('300 CPM');
  });
});
