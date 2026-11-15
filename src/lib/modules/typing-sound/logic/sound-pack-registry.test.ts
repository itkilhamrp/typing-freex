import { describe, it, expect } from 'vitest';
import {
  CLICK_PACKS,
  ERROR_PACKS,
  TIME_WARNING_OPTIONS,
  getClickPackById,
  getErrorPackById,
  getAllClickPacks,
  getAllErrorPacks,
  isValidClickPackId,
  isValidErrorPackId,
} from './sound-pack-registry';

describe('sound-pack-registry', () => {
  it('registers all Monkeytype click packs with unique IDs and valid variant counts', () => {
    const ids = new Set<string>();
    for (const pack of CLICK_PACKS) {
      expect(ids.has(pack.id)).toBe(false);
      ids.add(pack.id);
      expect(pack.variants).toBeGreaterThanOrEqual(1);
      expect(pack.category).toBe('click');
      expect(pack.label).toMatch(/^settings\.sound\./);
    }
    expect(CLICK_PACKS.length).toBeGreaterThanOrEqual(25);
  });

  it('registers error packs and time warning options', () => {
    expect(ERROR_PACKS.length).toBe(4);
    expect(TIME_WARNING_OPTIONS.map((o) => o.seconds)).toEqual([1, 3, 5, 10]);
  });

  it('lookup helpers resolve valid packs and return undefined for unknown IDs', () => {
    expect(getClickPackById('nk-creams')?.id).toBe('nk-creams');
    expect(getClickPackById('cherrymx-blue-pbt')?.id).toBe('cherrymx-blue-pbt');
    expect(getClickPackById('unknown')).toBeUndefined();

    expect(getErrorPackById('error-damage')?.id).toBe('error-damage');
    expect(getErrorPackById('unknown')).toBeUndefined();

    expect(isValidClickPackId('tealios-v2')).toBe(true);
    expect(isValidErrorPackId('error-square')).toBe(true);
    expect(getAllClickPacks()).toBe(CLICK_PACKS);
    expect(getAllErrorPacks()).toBe(ERROR_PACKS);
  });
});

