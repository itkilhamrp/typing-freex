/**
 * Headless pure-function filter engine for the Settings search pipeline.
 * Zero DOM, Svelte, or store dependencies — strictly follows UNIX Rule of Separation.
 */

import type { SettingsItemDef, SettingsSectionDef } from './settings-registry.js';

export interface SettingsFilterResult {
  /** Set of matching setting item IDs */
  readonly matchedItemIds: ReadonlySet<string>;
  /** Set of section IDs that have at least one matching item */
  readonly visibleSectionIds: ReadonlySet<string>;
  /** True when the search query yields zero matching items */
  readonly isEmpty: boolean;
}

/**
 * Filters settings items and determines visible sections based on a search query.
 * Multi-word queries use logical AND matching across translated labels, descriptions,
 * section titles, and static keywords.
 *
 * @param query - Raw user search input
 * @param items - Declarative settings item definitions
 * @param sections - Declarative settings section definitions
 * @param t - Translation lookup function
 * @returns Deterministic filter result with matched item and section sets
 */
export function filterSettings(
  query: string,
  items: readonly SettingsItemDef[],
  sections: readonly SettingsSectionDef[],
  t: (key: string) => string,
): SettingsFilterResult {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return {
      matchedItemIds: new Set(items.map((item) => item.id)),
      visibleSectionIds: new Set(sections.map((sec) => sec.id)),
      isEmpty: false,
    };
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const sectionTitleMap = new Map<string, string>();
  for (const sec of sections) {
    sectionTitleMap.set(sec.id, t(sec.titleKey).toLowerCase());
  }

  const matchedItemIds = new Set<string>();
  const visibleSectionIds = new Set<string>();

  for (const item of items) {
    const labelText = t(item.labelKey).toLowerCase();
    const descText = t(item.descKey).toLowerCase();
    const sectionText = sectionTitleMap.get(item.sectionId) ?? '';
    const keywordsText = item.keywords ? item.keywords.join(' ').toLowerCase() : '';

    const haystack = `${labelText} ${descText} ${sectionText} ${keywordsText}`;
    const isMatch = tokens.every((token) => haystack.includes(token));

    if (isMatch) {
      matchedItemIds.add(item.id);
      visibleSectionIds.add(item.sectionId);
    }
  }

  return {
    matchedItemIds,
    visibleSectionIds,
    isEmpty: matchedItemIds.size === 0,
  };
}

