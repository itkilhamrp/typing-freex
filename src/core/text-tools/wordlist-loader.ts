export interface WordlistPack {
  id: string;
  name: string;
  version: string;
  language: string;
  type: string;
  items?: readonly string[];
  packed?: string;
}

/**
 * Extracts a word array from either `packed` (\n-delimited string) or `items` array.
 * Caches decoded array if beneficial, trims whitespace and filters out blank lines.
 */
export function loadWordlist(pack: WordlistPack): readonly string[] {
  if (typeof pack.packed === 'string') {
    return Object.freeze(
      pack.packed
        .split('\n')
        .map((w) => w.trim())
        .filter((w) => w.length > 0)
    );
  }
  if (Array.isArray(pack.items)) {
    return Object.freeze(pack.items);
  }
  return Object.freeze([]);
}
