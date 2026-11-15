import { describe, it, expect } from 'vitest';
import { Mulberry32 } from './prng';

describe('Mulberry32 PRNG (FR-TYP-01)', () => {
  it('produces deterministic output given identical seeds', () => {
    const prng1 = new Mulberry32(12345);
    const prng2 = new Mulberry32(12345);

    const seq1 = [prng1.next(), prng1.next(), prng1.next()];
    const seq2 = [prng2.next(), prng2.next(), prng2.next()];

    expect(seq1).toEqual(seq2);
  });

  it('generates integers within specified bounds', () => {
    const prng = new Mulberry32(999);
    for (let i = 0; i < 50; i++) {
      const val = prng.nextInt(10, 20);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThanOrEqual(20);
    }
  });
});
