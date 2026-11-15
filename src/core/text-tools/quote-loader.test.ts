import { describe, it, expect } from 'vitest';
import {
  getAvailableQuoteLanguages,
  getQuotesForLanguage,
  resolveQuoteLanguageCode,
  getQuoteLanguageByCode,
  getQuoteLanguageDisplayName,
  getQuoteOnlyLanguages,
  getTechLanguages,
  getRandomQuotes,
  getRandomTechQuotes,
  getTechQuotesForLanguage,
  resolveTechLanguageCode,
} from './quote-loader';

describe('Quote Loader - Multi-Pack & Tech Isolation', () => {
  it('discovers all languages and specialized tech content packs from _list.json', () => {
    const languages = getAvailableQuoteLanguages();
    const codes = languages.map((l) => l.code);

    expect(codes).toContain('english');
    expect(codes).toContain('indonesian');
    expect(codes).toContain('tech');
    expect(codes).toContain('docker');
    expect(codes).toContain('podman');
    expect(codes).toContain('javascript');
    expect(codes).toContain('javascript_1k');
    expect(codes).toContain('typescript');
    expect(codes).toContain('rust');
    expect(codes).toContain('go');
    expect(codes).toContain('python');
    expect(codes).toContain('php');
    expect(codes).toContain('bash');
    expect(codes).toContain('java');
    expect(codes).toContain('c');
    expect(codes).toContain('cpp');
    expect(codes).toContain('sql_mariadb');
    expect(codes).toContain('sql_sqlite');
    expect(codes).toContain('sql_postgresql');
    expect(codes).toContain('gnu_linux');
    expect(codes).toContain('git');
  });

  it('strictly isolates English quotes from Docker snippets', () => {
    const enQuotes = getQuotesForLanguage('english');
    expect(enQuotes.length).toBeGreaterThan(0);

    const hasDockerInEnglish = enQuotes.some(
      (q) => q.text.includes('FROM ') || q.source.toLowerCase().includes('docker')
    );
    expect(hasDockerInEnglish).toBe(false);
  });

  it('loads isolated Docker quotes when requesting docker code or alias', () => {
    const dockerQuotes = getQuotesForLanguage('docker');
    expect(dockerQuotes.length).toBeGreaterThanOrEqual(10);
    expect(dockerQuotes.every((q) => q.source.toLowerCase().includes('docker'))).toBe(true);

    const aliasQuotes = getQuotesForLanguage('dockerfile');
    expect(aliasQuotes.length).toBeGreaterThanOrEqual(10);
  });

  it('loads isolated Podman quotes with rootless / quadlet snippets', () => {
    const podmanQuotes = getQuotesForLanguage('podman');
    expect(podmanQuotes.length).toBeGreaterThanOrEqual(10);
    expect(podmanQuotes.some((q) => q.text.includes('podman') || q.text.includes('Quadlet'))).toBe(true);
  });

  it('loads isolated Rust quotes with syntax constructs', () => {
    const rustQuotes = getQuotesForLanguage('rust');
    expect(rustQuotes.length).toBeGreaterThanOrEqual(10);
    expect(rustQuotes.some((q) => q.text.includes('fn main()') || q.text.includes('tokio::select!'))).toBe(true);
  });

  it('loads isolated GNU/Linux CLI quotes with coreutils history honoring', () => {
    const gnuQuotes = getQuotesForLanguage('gnu_linux');
    expect(gnuQuotes.length).toBeGreaterThanOrEqual(10);
    expect(gnuQuotes.some((q) => q.source.includes('GNU/Linux CLI'))).toBe(true);
  });

  it('loads isolated NGINX infrastructure quotes', () => {
    const nginxQuotes = getQuotesForLanguage('nginx');
    expect(nginxQuotes.length).toBeGreaterThanOrEqual(10);
    expect(nginxQuotes.some((q) => q.source.includes('NGINX'))).toBe(true);
  });

  it('loads aggregated tech quotes under the umbrella tech code', () => {
    const allTech = getQuotesForLanguage('tech');
    // Dynamic tech content packs: at least 18 files with >= 10 quotes each
    expect(allTech.length).toBeGreaterThanOrEqual(180);
  });

  it('resolves canonical quote language codes for aliases', () => {
    expect(resolveQuoteLanguageCode('dockerfile')).toBe('docker');
    expect(resolveQuoteLanguageCode('container')).toBe('docker');
    expect(resolveQuoteLanguageCode('podman')).toBe('podman');
    expect(resolveQuoteLanguageCode('rs')).toBe('rust');
    expect(resolveQuoteLanguageCode('golang')).toBe('go');
    expect(resolveQuoteLanguageCode('py')).toBe('python');
    expect(resolveQuoteLanguageCode('linux')).toBe('gnu_linux');
    expect(resolveQuoteLanguageCode('vcs')).toBe('git');
    expect(resolveQuoteLanguageCode('non_existent')).toBe('english');
  });

  it('resolves quote language display names dynamically without hardcoding', () => {
    expect(getQuoteLanguageDisplayName('docker')).toBe('Docker');
    expect(getQuoteLanguageDisplayName('dockerfile')).toBe('Docker');
    expect(getQuoteLanguageDisplayName('podman')).toBe('Podman');
    expect(getQuoteLanguageDisplayName('php')).toBe('PHP');
    expect(getQuoteLanguageDisplayName('rust')).toBe('Rust');
    expect(getQuoteLanguageDisplayName('rs')).toBe('Rust');
    expect(getQuoteLanguageDisplayName('gnu_linux')).toBe('GNU/Linux CLI');
    expect(getQuoteLanguageDisplayName('sql_mariadb')).toBe('MariaDB SQL');
    expect(getQuoteLanguageDisplayName('tech')).toBe('Code & Tech (All)');
    expect(getQuoteLanguageDisplayName('english')).toBe('English');
    expect(getQuoteLanguageDisplayName('indonesian')).toBe('Indonesian');
    expect(getQuoteLanguageDisplayName(null)).toBe('English');
  });

  it('finds quote language entry via getQuoteLanguageByCode', () => {
    const dockerEntry = getQuoteLanguageByCode('docker');
    expect(dockerEntry).toBeDefined();
    expect(dockerEntry?.name).toBe('Docker');
    expect(dockerEntry?.flag).toBe('🐳');

    const phpEntry = getQuoteLanguageByCode('code_php');
    expect(phpEntry).toBeDefined();
    expect(phpEntry?.name).toBe('PHP');

    expect(getQuoteLanguageByCode('unknown_xyz')).toBeUndefined();
  });

  it('supports RANDOM quote language resolution and loading', () => {
    expect(resolveQuoteLanguageCode('random')).toBe('random');
    expect(resolveQuoteLanguageCode('RANDOM')).toBe('random');
    expect(getQuoteLanguageDisplayName('random')).toBe('RANDOM');
    expect(getQuoteLanguageDisplayName('RANDOM')).toBe('RANDOM');

    const randomEntry = getQuoteLanguageByCode('random');
    expect(randomEntry).toBeDefined();
    expect(randomEntry?.name).toBe('RANDOM');
    expect(randomEntry?.flag).toBe('🎲');

    const randomQuotes = getQuotesForLanguage('random');
    expect(randomQuotes.length).toBeGreaterThan(0);
  });

  it('discovers and loads expanded world languages and code packs', () => {
    const spanish = getQuotesForLanguage('spanish');
    expect(spanish.length).toBeGreaterThan(0);
    expect(getQuoteLanguageDisplayName('spanish')).toBe('Spanish');

    const french = getQuotesForLanguage('french');
    expect(french.length).toBeGreaterThan(0);
    expect(getQuoteLanguageDisplayName('french')).toBe('French');

    const german = getQuotesForLanguage('german');
    expect(german.length).toBeGreaterThan(0);

    const japanese = getQuotesForLanguage('japanese_romaji');
    expect(japanese.length).toBeGreaterThan(0);

    const latin = getQuotesForLanguage('latin');
    expect(latin.length).toBeGreaterThan(0);

    const python1k = getQuotesForLanguage('python_1k');
    expect(python1k.length).toBe(10);

    const rust1k = getQuotesForLanguage('rust_1k');
    expect(rust1k.length).toBe(10);

    const kotlin = getQuotesForLanguage('kotlin');
    expect(kotlin.length).toBeGreaterThanOrEqual(10);

    const swift = getQuotesForLanguage('swift');
    expect(swift.length).toBeGreaterThanOrEqual(10);

    const codeAll = getQuotesForLanguage('code');
    expect(codeAll.length).toBeGreaterThanOrEqual(100);
  });

  it('strictly filters literary quote languages via getQuoteOnlyLanguages()', () => {
    const quoteOnly = getQuoteOnlyLanguages();
    const codes = quoteOnly.map((e) => e.code);

    expect(quoteOnly.every((e) => e.category === 'quote')).toBe(true);
    expect(quoteOnly.length).toBe(17);
    expect(codes).toContain('english');
    expect(codes).toContain('indonesian');
    expect(codes).toContain('french');
    expect(codes).toContain('latin');

    // Must NOT contain removed tier variants (1k/5k) or tech/code items
    expect(codes).not.toContain('english_1k');
    expect(codes).not.toContain('english_5k');
    expect(codes).not.toContain('indonesian_1k');
    expect(codes).not.toContain('indonesian_5k');
    expect(codes).not.toContain('tech');
    expect(codes).not.toContain('code');
    expect(codes).not.toContain('docker');
    expect(codes).not.toContain('podman');
    expect(codes).not.toContain('python_1k');
    expect(codes).not.toContain('rust_1k');
  });

  it('strictly filters tech/code languages via getTechLanguages()', () => {
    const techOnly = getTechLanguages();
    const codes = techOnly.map((e) => e.code);

    expect(techOnly.every((e) => e.category === 'tech')).toBe(true);
    expect(codes).toContain('tech');
    expect(codes).toContain('code');
    expect(codes).toContain('docker');
    expect(codes).toContain('podman');
    expect(codes).toContain('nginx');
    expect(codes).toContain('rust');
    expect(codes).toContain('python_1k');
    expect(codes).toContain('c_1k');
    expect(codes).toContain('sql_mariadb');

    // Must NOT contain literary quote items
    expect(codes).not.toContain('english');
    expect(codes).not.toContain('indonesian');
    expect(codes).not.toContain('spanish');
    expect(codes).not.toContain('french');
  });

  it('ensures getRandomQuotes() strictly excludes all tech items', () => {
    const randomQuotes = getRandomQuotes();
    expect(randomQuotes.length).toBeGreaterThan(0);

    // No Docker snippets or tech sources
    const hasDocker = randomQuotes.some(
      (q) => q.text.includes('FROM ') || q.source.toLowerCase().includes('docker')
    );
    expect(hasDocker).toBe(false);

    const hasPodman = randomQuotes.some(
      (q) => q.source.toLowerCase().includes('podman')
    );
    expect(hasPodman).toBe(false);
  });

  it('supports getRandomTechQuotes() and getTechQuotesForLanguage()', () => {
    const randomTech = getRandomTechQuotes();
    expect(randomTech.length).toBeGreaterThan(0);

    // getTechQuotesForLanguage defaults to tech umbrella
    const defaultTech = getTechQuotesForLanguage(null);
    expect(defaultTech.length).toBeGreaterThanOrEqual(180);

    // getTechQuotesForLanguage resolves specific tech
    const dockerTech = getTechQuotesForLanguage('docker');
    expect(dockerTech.length).toBeGreaterThanOrEqual(10);

    // getTechQuotesForLanguage resolves random
    const randomViaHelper = getTechQuotesForLanguage('random');
    expect(randomViaHelper.length).toBe(randomTech.length);
  });

  it('resolves canonical tech codes with default fallback to tech', () => {
    expect(resolveTechLanguageCode('dockerfile')).toBe('docker');
    expect(resolveTechLanguageCode('random')).toBe('random');
    expect(resolveTechLanguageCode('non_existent')).toBe('tech');
    expect(resolveTechLanguageCode(null)).toBe('tech');
  });
});

