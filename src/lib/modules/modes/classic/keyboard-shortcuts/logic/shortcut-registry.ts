/**
 * Static registry of all Classic Mode keyboard shortcuts.
 * Pure data module — zero Svelte, DOM, or framework imports.
 */

import type { ShortcutDefinition } from './shortcut-types.js';

export const CLASSIC_SHORTCUTS: readonly ShortcutDefinition[] = [
  // === Navigation (global across Classic Mode routes when idle) ===
  {
    id: 'help.toggle',
    keys: { key: 'F1' },
    i18nKey: 'shortcuts.help',
    category: 'navigation',
    context: 'global',
  },
  {
    id: 'help.toggle.alt',
    keys: { key: '/', code: 'Slash', ctrl: true },
    i18nKey: 'shortcuts.help',
    category: 'navigation',
    context: 'global',
  },
  {
    id: 'nav.arena',
    keys: { key: '1', code: 'Digit1', ctrl: true },
    i18nKey: 'shortcuts.navArena',
    category: 'navigation',
    context: 'global',
  },
  {
    id: 'nav.customText',
    keys: { key: '2', code: 'Digit2', ctrl: true },
    i18nKey: 'shortcuts.navCustomText',
    category: 'navigation',
    context: 'global',
  },
  {
    id: 'nav.analytics',
    keys: { key: '3', code: 'Digit3', ctrl: true },
    i18nKey: 'shortcuts.navAnalytics',
    category: 'navigation',
    context: 'global',
  },
  {
    id: 'nav.history',
    keys: { key: '4', code: 'Digit4', ctrl: true },
    i18nKey: 'shortcuts.navHistory',
    category: 'navigation',
    context: 'global',
  },
  {
    id: 'nav.profiles',
    keys: { key: '5', code: 'Digit5', ctrl: true },
    i18nKey: 'shortcuts.navProfiles',
    category: 'navigation',
    context: 'global',
  },
  {
    id: 'nav.settings',
    keys: { key: '6', code: 'Digit6', ctrl: true },
    i18nKey: 'shortcuts.navSettings',
    category: 'navigation',
    context: 'global',
  },

  // === Arena controls (arena page, idle only) ===
  {
    id: 'arena.cycleMode',
    keys: { key: 'M', code: 'KeyM', alt: true },
    i18nKey: 'shortcuts.cycleMode',
    category: 'arena',
    context: 'arena-idle',
  },
  {
    id: 'arena.cycleDifficulty',
    keys: { key: 'D', code: 'KeyD', alt: true },
    i18nKey: 'shortcuts.cycleDifficulty',
    category: 'arena',
    context: 'arena-idle',
  },
  {
    id: 'arena.toggleHandGuide',
    keys: { key: 'H', code: 'KeyH', ctrl: true, shift: true },
    i18nKey: 'shortcuts.toggleHandGuide',
    category: 'arena',
    context: 'arena-idle',
  },
  {
    id: 'arena.toggleKeymap',
    keys: { key: 'K', code: 'KeyK', ctrl: true, shift: true },
    i18nKey: 'shortcuts.toggleKeymap',
    category: 'arena',
    context: 'arena-idle',
  },
  {
    id: 'arena.toggleTape',
    keys: { key: 'T', code: 'KeyT', ctrl: true, shift: true },
    i18nKey: 'shortcuts.toggleTape',
    category: 'arena',
    context: 'arena-idle',
  },
  {
    id: 'arena.toggleLiveStats',
    keys: { key: 'S', code: 'KeyS', ctrl: true, shift: true },
    i18nKey: 'shortcuts.toggleLiveStats',
    category: 'arena',
    context: 'arena-idle',
  },
  {
    id: 'arena.togglePunctuation',
    keys: { key: 'P', code: 'KeyP', ctrl: true, shift: true },
    i18nKey: 'shortcuts.togglePunctuation',
    category: 'arena',
    context: 'arena-idle',
  },
  {
    id: 'arena.toggleNumbers',
    keys: { key: 'N', code: 'KeyN', ctrl: true, shift: true },
    i18nKey: 'shortcuts.toggleNumbers',
    category: 'arena',
    context: 'arena-idle',
  },

  // === Display-only (existing shortcuts handled by their dedicated modules) ===
  {
    id: 'arena.restart',
    keys: { key: 'Tab', sequenceKeys: ['Tab', 'Enter'] },
    i18nKey: 'shortcuts.restart',
    category: 'typing',
    context: 'arena-typing',
    displayOnly: true,
  },
  {
    id: 'arena.escape',
    keys: { key: 'Escape' },
    i18nKey: 'shortcuts.escape',
    category: 'typing',
    context: 'arena-typing',
    displayOnly: true,
  },
  {
    id: 'arena.endZen',
    keys: { key: 'Enter', shift: true },
    i18nKey: 'shortcuts.endZen',
    category: 'typing',
    context: 'arena-typing',
    displayOnly: true,
  },
  {
    id: 'result.nextTest',
    keys: { key: 'Enter', ctrl: true },
    i18nKey: 'shortcuts.nextTest',
    category: 'result',
    context: 'result',
    displayOnly: true,
  },
  {
    id: 'app.fullscreen',
    keys: { key: 'F11' },
    i18nKey: 'shortcuts.fullscreen',
    category: 'app',
    context: 'app',
    displayOnly: true,
  },
] as const;

/** Actionable shortcut IDs triggered by the controller (excludes display-only) */
export const ACTIONABLE_IDS: readonly string[] = CLASSIC_SHORTCUTS
  .filter((s) => !s.displayOnly)
  .map((s) => s.id);
