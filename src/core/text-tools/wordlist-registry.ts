/**
 * Wordlist Registry — Auto-discovers, normalizes, and caches wordlists.
 *
 * Uses Vite's `import.meta.glob` with `eager: true` to resolve all wordlist packs
 * at build time. Maintains a master registry of languages with aliases and variants.
 *
 * @module wordlist-registry
 */

import { loadWordlist, type WordlistPack } from './wordlist-loader';
import { getQuoteLanguageByCode } from './quote-loader';
import listManifest from '../../../content-packs/wordlists/languages/_list.json';

export interface WordlistVariant {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly file: string;
}

export interface LanguageEntry {
  readonly code: string;
  readonly name: string;
  readonly nativeName: string;
  readonly flag: string;
  readonly variants: readonly WordlistVariant[];
  readonly default: string;
}

/** Eagerly import all wordlist pack JSON files at build time */
const packsGlob: Record<string, WordlistPack> = import.meta.glob<WordlistPack>(
  '../../../content-packs/wordlists/languages/*/*.json',
  { eager: true, import: 'default' }
);

/** Master list of available languages loaded from manifest */
export const AVAILABLE_LANGUAGES: readonly LanguageEntry[] = Object.freeze(
  (listManifest as LanguageEntry[]).map((entry) =>
    Object.freeze({
      ...entry,
      variants: Object.freeze(entry.variants.map((v) => Object.freeze({ ...v }))),
    })
  )
);

/** Internal cache of decoded word arrays by pack ID or filename */
const wordlistCache = new Map<string, readonly string[]>();

/** Raw pack index populated at load; decoded lazily on first getWordlist() read */
const rawPackIndex = new Map<string, WordlistPack>();

/** Backward compatibility aliases for legacy 2-letter codes */
const LEGACY_ALIASES: Record<string, string> = {
  en: 'english_1k',
  id: 'indonesian_1k',
};

// Index all globbed packs synchronously by metadata without eager string splitting
for (const [path, pack] of Object.entries(packsGlob)) {
  if (!pack || !pack.id) continue;
  rawPackIndex.set(pack.id, pack);

  // Also index by filename (e.g., "english.json" or "english_1k.json")
  const fileName = path.split('/').pop();
  if (fileName) {
    rawPackIndex.set(fileName, pack);
  }
}

function getOrDecodePack(id: string): readonly string[] | undefined {
  const cached = wordlistCache.get(id);
  if (cached) return cached;
  const pack = rawPackIndex.get(id);
  if (!pack) return undefined;
  const words = loadWordlist(pack);
  wordlistCache.set(pack.id, words);
  wordlistCache.set(id, words);
  return words;
}

/**
 * Resolves a language code, variant ID, or alias to a canonical variant ID.
 * Prioritizes exact variant IDs first, then legacy aliases, then language defaults.
 */
export function resolveLanguageId(idOrCode: string): string {
  const normalized = idOrCode.trim().toLowerCase();

  if (normalized === 'random') {
    return 'random';
  }

  // 1. Check if it matches a known variant ID directly
  if (rawPackIndex.has(normalized)) {
    return normalized;
  }

  // 2. Check legacy short code aliases (e.g. 'en', 'id')
  if (LEGACY_ALIASES[normalized]) {
    return LEGACY_ALIASES[normalized];
  }

  // 3. Check if it matches a language code in the registry
  const lang = AVAILABLE_LANGUAGES.find(
    (l) => l.code.toLowerCase() === normalized
  );
  if (lang) {
    return lang.default;
  }

  // Default fallback
  return 'english_1k';
}

/**
 * Checks if a wordlist exists for the given ID, code, or alias.
 */
export function hasWordlist(idOrCode: string): boolean {
  if (idOrCode.trim().toLowerCase() === 'random') return true;
  const canonical = resolveLanguageId(idOrCode);
  return rawPackIndex.has(canonical);
}

/**
 * Returns a randomly selected wordlist from all available language variants.
 */
export function getRandomWordlist(): readonly string[] {
  const variants: string[] = [];
  for (const lang of AVAILABLE_LANGUAGES) {
    for (const v of lang.variants) {
      if (rawPackIndex.has(v.id)) {
        variants.push(v.id);
      }
    }
  }
  if (variants.length === 0) {
    return getOrDecodePack('english_1k') || Object.freeze([]);
  }
  const index = Math.floor(Math.random() * variants.length);
  const picked = variants[index];
  if (!picked) {
    return getOrDecodePack('english_1k') || Object.freeze([]);
  }
  return getOrDecodePack(picked) || Object.freeze([]);
}

/**
 * Returns a decoded, frozen word array for the given language code, variant ID, or alias.
 * Synchronous with lazy first-access decoding. Falls back to English 1k if not found.
 */
export function getWordlist(idOrCode: string): readonly string[] {
  const normalized = idOrCode.trim().toLowerCase();
  if (normalized === 'random') {
    return getRandomWordlist();
  }

  const canonical = resolveLanguageId(idOrCode);
  const cached = getOrDecodePack(canonical);
  if (cached && cached.length > 0) {
    return cached;
  }

  // Fallback to English 1k or first available pack
  const fallback = getOrDecodePack('english_1k') || getOrDecodePack('english');
  if (fallback && fallback.length > 0) {
    return fallback;
  }

  // If even fallback is empty (e.g. mock test environment), return empty frozen array
  return Object.freeze([]);
}

/**
 * Returns all available languages in the registry.
 */
export function getAvailableLanguages(): readonly LanguageEntry[] {
  return AVAILABLE_LANGUAGES;
}

/**
 * Finds a language entry by its code, variant ID, or alias.
 */
export function getLanguageByCode(codeOrId: string): LanguageEntry | undefined {
  const normalized = codeOrId.trim().toLowerCase();

  // 1. Direct match on code
  const exact = AVAILABLE_LANGUAGES.find((l) => l.code.toLowerCase() === normalized);
  if (exact) return exact;

  // 2. Direct match on legacy aliases
  if (LEGACY_ALIASES[normalized]) {
    const aliasTarget = LEGACY_ALIASES[normalized];
    return AVAILABLE_LANGUAGES.find((l) =>
      l.variants.some((v) => v.id.toLowerCase() === aliasTarget)
    );
  }

  // 3. Match on variant ID
  return AVAILABLE_LANGUAGES.find((l) =>
    l.variants.some((v) => v.id.toLowerCase() === normalized)
  );
}

/**
 * Returns a user-friendly display name for a language, quote pack, or variant ID.
 * Examples: "english_1k" -> "English 1k", "english" -> "English", "id" -> "Bahasa Indonesia", "docker" -> "Docker".
 */
export function getLanguageDisplayName(codeOrId?: string | null): string {
  if (!codeOrId) return '';
  const normalized = codeOrId.trim().toLowerCase();

  if (normalized === 'random') return 'RANDOM';
  if (normalized === 'en') return 'English';
  if (normalized === 'id') return 'Bahasa Indonesia';

  // 1. Check quote languages first
  const quoteLang = getQuoteLanguageByCode(normalized);
  if (quoteLang) {
    return quoteLang.name;
  }

  // 2. Check wordlist languages and variants
  const lang = getLanguageByCode(normalized);
  if (lang) {
    const variant = lang.variants.find((v) => v.id.toLowerCase() === normalized);
    return variant ? variant.name : lang.name;
  }

  return codeOrId;
}

