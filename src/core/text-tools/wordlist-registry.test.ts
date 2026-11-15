import { describe, it, expect } from 'vitest';
import {
  getAvailableLanguages,
  getWordlist,
  resolveLanguageId,
  hasWordlist,
  getLanguageByCode,
  getLanguageDisplayName,
} from './wordlist-registry';

describe('wordlist-registry', () => {
  it('loads available languages from manifest', () => {
    const languages = getAvailableLanguages();
    expect(languages.length).toBeGreaterThanOrEqual(2);

    const english = languages.find((l) => l.code === 'english');
    expect(english).toBeDefined();
    expect(english?.variants.length).toBeGreaterThanOrEqual(1);

    const indonesian = languages.find((l) => l.code === 'indonesian');
    expect(indonesian).toBeDefined();
    expect(indonesian?.variants.length).toBeGreaterThanOrEqual(1);
  });

  it('resolves aliases correctly', () => {
    expect(resolveLanguageId('en')).toBe('english_1k');
    expect(resolveLanguageId('id')).toBe('indonesian_1k');
    expect(resolveLanguageId('english')).toBe('english');
    expect(resolveLanguageId('english_1k')).toBe('english_1k');
    expect(resolveLanguageId('indonesian')).toBe('indonesian');
    expect(resolveLanguageId('indonesian_1k')).toBe('indonesian_1k');
  });

  it('returns valid wordlists for known languages and aliases', () => {
    const enWords = getWordlist('en');
    expect(enWords.length).toBeGreaterThan(0);
    expect(enWords.includes('the')).toBe(true);
    expect(Object.isFrozen(enWords)).toBe(true);

    const idWords = getWordlist('id');
    expect(idWords.length).toBeGreaterThan(0);
    expect(idWords.includes('yang')).toBe(true);
    expect(Object.isFrozen(idWords)).toBe(true);
  });

  it('loads specific variants like english (200) and english_1k', () => {
    const enBase = getWordlist('english');
    expect(enBase.length).toBeGreaterThan(0);

    const en1k = getWordlist('english_1k');
    expect(en1k.length).toBeGreaterThanOrEqual(enBase.length);
  });

  it('loads other languages like afrikaans and code_javascript', () => {
    const afrikaans = getWordlist('afrikaans');
    expect(afrikaans.length).toBeGreaterThan(0);
    expect(afrikaans.includes('die')).toBe(true);

    const js = getWordlist('code_javascript');
    expect(js.length).toBeGreaterThan(0);
    expect(js.includes('function')).toBe(true);
  });

  it('checks presence using hasWordlist()', () => {
    expect(hasWordlist('en')).toBe(true);
    expect(hasWordlist('english_1k')).toBe(true);
    expect(hasWordlist('indonesian')).toBe(true);
    expect(hasWordlist('non_existent_lang_12345')).toBe(true); // resolves to default fallback english_1k
  });

  it('finds language entry with getLanguageByCode()', () => {
    const lang = getLanguageByCode('indonesian');
    expect(lang).toBeDefined();
    expect(lang?.name).toBe('Indonesian');

    const byAlias = getLanguageByCode('id');
    expect(byAlias).toBeDefined();
    expect(byAlias?.code).toBe('indonesian');

    const byVariant = getLanguageByCode('english_1k');
    expect(byVariant).toBeDefined();
    expect(byVariant?.code).toBe('english');

    // Unknown languages should return undefined and NOT falsely match English
    expect(getLanguageByCode('docker')).toBeUndefined();
    expect(getLanguageByCode('unknown_lang_999')).toBeUndefined();
  });

  it('resolves display names for both wordlists and quotes via getLanguageDisplayName()', () => {
    // Wordlist variants
    expect(getLanguageDisplayName('english_1k')).toBe('English 1k');
    expect(getLanguageDisplayName('english')).toBe('English');
    expect(getLanguageDisplayName('en')).toBe('English');
    expect(getLanguageDisplayName('id')).toBe('Bahasa Indonesia');

    // Quote packs
    expect(getLanguageDisplayName('docker')).toBe('Docker');
    expect(getLanguageDisplayName('podman')).toBe('Podman');
    expect(getLanguageDisplayName('php')).toBe('PHP');
    expect(getLanguageDisplayName('rust')).toBe('Rust');
    expect(getLanguageDisplayName('gnu_linux')).toBe('GNU/Linux CLI');
    expect(getLanguageDisplayName('tech')).toBe('Code & Tech (All)');

    // Fallbacks
    expect(getLanguageDisplayName(null)).toBe('');
    expect(getLanguageDisplayName('')).toBe('');

    // RANDOM support
    expect(getLanguageDisplayName('random')).toBe('RANDOM');
    expect(getLanguageDisplayName('RANDOM')).toBe('RANDOM');
  });

  it('supports RANDOM wordlist selection and resolution', () => {
    expect(resolveLanguageId('random')).toBe('random');
    expect(resolveLanguageId('RANDOM')).toBe('random');
    expect(hasWordlist('random')).toBe(true);

    const randomWords = getWordlist('random');
    expect(randomWords.length).toBeGreaterThan(0);
    expect(Object.isFrozen(randomWords)).toBe(true);
  });
});
