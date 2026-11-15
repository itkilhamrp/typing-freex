/**
 * Quote Loader — Auto-discovers and normalizes quote JSON files.
 *
 * Uses Vite's `import.meta.glob` with `eager: true` to resolve all quote
 * files at build time driven by `/content-packs/quotes/_list.json`.
 * Each JSON file is a plain array of `{ text, source }`.
 * The loader auto-computes `length` from `text.length` and generates
 * deterministic `id` values, eliminating redundant metadata from content files.
 *
 * @module quote-loader
 * @version 2.0.1
 */

import type { QuoteItem } from '@/core/typing-engine/generators/quote';
import quotesManifest from '../../../content-packs/quotes/_list.json';
import techManifest from '../../../content-packs/tech/_list.json';

/** Raw shape of a single quote entry in content JSON files. */
interface RawQuote {
  text: string;
  source: string;
}

export interface QuoteManifestEntry {
  readonly code: string;
  readonly folder: string;
  readonly file?: string;
  readonly name: string;
  readonly nativeName: string;
  readonly flag: string;
  readonly aliases?: readonly string[];
  readonly category?: 'quote' | 'tech';
}

export interface QuoteLanguageEntry {
  readonly code: string;
  readonly name: string;
  readonly nativeName: string;
  readonly flag: string;
  readonly count: number;
  readonly folder?: string;
  readonly file?: string;
  readonly aliases?: readonly string[];
  readonly category: 'quote' | 'tech';
}

/**
 * Eagerly import all quote & tech JSON files dynamically at build time.
 * Glob pattern matches:
 * - content-packs/quotes/<folder>/<category>/<file>.json
 * - content-packs/tech/<folder>/<category>/<file>.json
 */
const quoteFilesGlob: Record<string, RawQuote[]> = import.meta.glob<RawQuote[]>(
  '../../../content-packs/quotes/*/**/*.json',
  { eager: true, import: 'default' },
);

const techFilesGlob: Record<string, RawQuote[]> = import.meta.glob<RawQuote[]>(
  '../../../content-packs/tech/*/**/*.json',
  { eager: true, import: 'default' },
);

const allFilesGlob: Record<string, RawQuote[]> = {
  ...quoteFilesGlob,
  ...techFilesGlob,
};

// Group file paths by uppercase language folder name (e.g., "EN", "ID", "TECH", "CODE")
const filesByFolder = new Map<string, string[]>();

for (const path of Object.keys(allFilesGlob).sort()) {
  if (path.endsWith('_list.json')) continue;
  const match = path.match(/\/content-packs\/(?:quotes|tech)\/([^/]+)\//i);
  const matchedFolder = match?.[1];
  if (!matchedFolder) continue;
  const folder = matchedFolder.toUpperCase();
  const list = filesByFolder.get(folder) ?? [];
  list.push(path);
  filesByFolder.set(folder, list);
}

// Maps of quotes indexed by canonical code and aliases
const quotesByCode = new Map<string, readonly QuoteItem[]>();
const quotesByAlias = new Map<string, readonly QuoteItem[]>();

const manifestEntries: readonly QuoteManifestEntry[] = [
  ...(quotesManifest as QuoteManifestEntry[]),
  ...(techManifest as QuoteManifestEntry[]),
];

for (const entry of manifestEntries) {
  const folderKey = entry.folder.toUpperCase();
  const filePaths = filesByFolder.get(folderKey) ?? [];
  const items: QuoteItem[] = [];
  const langPrefix = entry.code.slice(0, 2).toLowerCase();

  for (const path of filePaths) {
    if (entry.file && !path.endsWith(`/${entry.file}`)) continue;
    const rawList = allFilesGlob[path];
    if (!Array.isArray(rawList)) continue;

    for (const raw of rawList) {
      if (!raw || !raw.text || !raw.source) continue;
      const text = raw.text.trim();
      const source = raw.source.trim();
      if (!text || !source) continue;

      items.push({
        id: `${langPrefix}-${items.length}`,
        text,
        source,
        length: text.length,
      });
    }
  }

  const frozenItems = Object.freeze(items);
  quotesByCode.set(entry.code.toLowerCase(), frozenItems);

  // Register in aliases map
  quotesByAlias.set(entry.code.toLowerCase(), frozenItems);
  if (!entry.file) {
    quotesByAlias.set(entry.folder.toLowerCase(), frozenItems);
  }
  if (entry.aliases) {
    for (const alias of entry.aliases) {
      quotesByAlias.set(alias.toLowerCase(), frozenItems);
    }
  }
}

/** Master list of available quote languages dynamically derived from _list.json */
export const AVAILABLE_QUOTE_LANGUAGES: readonly QuoteLanguageEntry[] = Object.freeze(
  manifestEntries.map((entry) => {
    const count = quotesByCode.get(entry.code.toLowerCase())?.length ?? 0;
    const category: 'quote' | 'tech' =
      entry.category ??
      (entry.folder.toUpperCase() === 'INFRA' ||
        entry.folder.toUpperCase() === 'TECH' ||
        entry.folder.toUpperCase() === 'CODE'
        ? 'tech'
        : 'quote');
    return Object.freeze({
      code: entry.code,
      name: entry.name,
      nativeName: entry.nativeName,
      flag: entry.flag,
      count,
      folder: entry.folder,
      file: entry.file,
      aliases: Object.freeze(entry.aliases ?? []),
      category,
    });
  })
);

/**
 * Returns all available quote languages with their normalized counts.
 */
export function getAvailableQuoteLanguages(): readonly QuoteLanguageEntry[] {
  return AVAILABLE_QUOTE_LANGUAGES;
}

/**
 * Returns only literary/language quote languages (for Quote mode).
 */
export function getQuoteOnlyLanguages(): readonly QuoteLanguageEntry[] {
  return AVAILABLE_QUOTE_LANGUAGES.filter((e) => e.category === 'quote');
}

/**
 * Returns only tech/code languages (for Tech mode).
 */
export function getTechLanguages(): readonly QuoteLanguageEntry[] {
  return AVAILABLE_QUOTE_LANGUAGES.filter((e) => e.category === 'tech');
}

let allQuotesCache: readonly QuoteItem[] | null = null;
let allTechQuotesCache: readonly QuoteItem[] | null = null;

/**
 * Returns quotes from a literary/language pool across all quote packs for RANDOM mode.
 * Strictly isolates and excludes all tech and code entries.
 */
export function getRandomQuotes(): readonly QuoteItem[] {
  if (!allQuotesCache) {
    const list: QuoteItem[] = [];
    for (const entry of AVAILABLE_QUOTE_LANGUAGES) {
      if (entry.category === 'tech') continue;
      const packQuotes = quotesByCode.get(entry.code.toLowerCase());
      if (packQuotes) {
        list.push(...packQuotes);
      }
    }
    allQuotesCache = Object.freeze(list.length > 0 ? list : (quotesByCode.get('english') ?? []));
  }
  return allQuotesCache;
}

/**
 * Returns tech quotes from a comprehensive pool across all tech/code packs for RANDOM tech mode.
 */
export function getRandomTechQuotes(): readonly QuoteItem[] {
  if (!allTechQuotesCache) {
    const list: QuoteItem[] = [];
    for (const entry of AVAILABLE_QUOTE_LANGUAGES) {
      if (entry.category !== 'tech') continue;
      // Skip umbrella aggregations to avoid duplicating quotes in random pool
      if (entry.code.toLowerCase() === 'tech' || entry.code.toLowerCase() === 'code') continue;
      const packQuotes = quotesByCode.get(entry.code.toLowerCase());
      if (packQuotes) {
        list.push(...packQuotes);
      }
    }
    allTechQuotesCache = Object.freeze(list.length > 0 ? list : (quotesByCode.get('tech') ?? []));
  }
  return allTechQuotesCache;
}

/**
 * Resolves quotes for any given language code, folder name, or alias.
 */
export function getQuotesForLanguage(codeOrAlias?: string | null): readonly QuoteItem[] {
  if (!codeOrAlias) return quotesByCode.get('english') ?? [];
  const norm = codeOrAlias.trim().toLowerCase();
  if (norm === 'random') {
    return getRandomQuotes();
  }
  return quotesByAlias.get(norm) ?? quotesByCode.get('english') ?? [];
}

/**
 * Resolves quotes for tech mode (default fallback is tech umbrella instead of english).
 */
export function getTechQuotesForLanguage(codeOrAlias?: string | null): readonly QuoteItem[] {
  if (!codeOrAlias) return quotesByCode.get('tech') ?? [];
  const norm = codeOrAlias.trim().toLowerCase();
  if (norm === 'random') {
    return getRandomTechQuotes();
  }
  return quotesByAlias.get(norm) ?? quotesByCode.get('tech') ?? [];
}

/**
 * Resolves a language code or alias to its canonical quote language code.
 */
export function resolveQuoteLanguageCode(codeOrAlias?: string | null, fallbackCode: string = 'english'): string {
  if (!codeOrAlias) return fallbackCode;
  const norm = codeOrAlias.trim().toLowerCase();
  if (norm === 'random') return 'random';
  for (const entry of AVAILABLE_QUOTE_LANGUAGES) {
    if (entry.code.toLowerCase() === norm) return entry.code;
    if (entry.folder?.toLowerCase() === norm && !entry.file) return entry.code;
    if (entry.aliases?.some((a) => a.toLowerCase() === norm)) return entry.code;
  }
  return fallbackCode;
}

/**
 * Resolves a tech code or alias to its canonical tech language code.
 */
export function resolveTechLanguageCode(codeOrAlias?: string | null): string {
  return resolveQuoteLanguageCode(codeOrAlias, 'tech');
}

/**
 * Resolves a quote language entry by its code, folder name, or alias.
 */
export function getQuoteLanguageByCode(codeOrAlias?: string | null): QuoteLanguageEntry | undefined {
  if (!codeOrAlias) return undefined;
  const norm = codeOrAlias.trim().toLowerCase();
  if (norm === 'random') {
    return {
      code: 'random',
      name: 'RANDOM',
      nativeName: 'Random Quotes',
      flag: '🎲',
      count: 0,
      aliases: ['random'],
      category: 'quote',
    };
  }
  for (const entry of AVAILABLE_QUOTE_LANGUAGES) {
    if (entry.code.toLowerCase() === norm) return entry;
    if (entry.folder?.toLowerCase() === norm && !entry.file) return entry;
    if (entry.aliases?.some((a) => a.toLowerCase() === norm)) return entry;
  }
  return undefined;
}

/**
 * Returns user-facing display name for a quote language code or alias.
 * Examples: "docker" -> "Docker", "gnu_linux" -> "GNU/Linux CLI", "tech" -> "Code & Tech (All)".
 */
export function getQuoteLanguageDisplayName(codeOrAlias?: string | null): string {
  if (!codeOrAlias) return 'English';
  const norm = codeOrAlias.trim().toLowerCase();
  if (norm === 'random') return 'RANDOM';
  const entry = getQuoteLanguageByCode(codeOrAlias);
  if (entry) return entry.name;
  return codeOrAlias;
}

/** Backwards-compatible legacy exports */
export const enQuotes: readonly QuoteItem[] = quotesByCode.get('english') ?? [];
export const idQuotes: readonly QuoteItem[] = quotesByCode.get('indonesian') ?? [];
