import { describe, it, expect } from 'vitest';
import { loadWordlist, type WordlistPack } from './wordlist-loader';

describe('loadWordlist', () => {
  it('decodes packed newline-delimited words into frozen array', () => {
    const pack: WordlistPack = {
      id: 'test-pack',
      name: 'Test Pack',
      version: '1.0.0',
      language: 'en',
      type: 'wordlist',
      packed: 'apple\nbanana\ncherry\n\ndate\n',
    };

    const words = loadWordlist(pack);
    expect(words).toEqual(['apple', 'banana', 'cherry', 'date']);
    expect(Object.isFrozen(words)).toBe(true);
  });

  it('falls back to items array if packed is not provided', () => {
    const pack: WordlistPack = {
      id: 'test-pack',
      name: 'Test Pack',
      version: '1.0.0',
      language: 'en',
      type: 'wordlist',
      items: ['alpha', 'beta', 'gamma'],
    };

    const words = loadWordlist(pack);
    expect(words).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('returns empty array when neither packed nor items exists', () => {
    const pack: WordlistPack = {
      id: 'empty-pack',
      name: 'Empty Pack',
      version: '1.0.0',
      language: 'en',
      type: 'wordlist',
    };

    const words = loadWordlist(pack);
    expect(words).toEqual([]);
  });
});
