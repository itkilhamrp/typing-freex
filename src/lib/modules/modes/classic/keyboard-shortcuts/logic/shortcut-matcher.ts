/**
 * Pure-function shortcut matcher for Classic Mode.
 * Zero Svelte, DOM, or framework imports.
 */

import type {
  ShortcutContext,
  ShortcutDefinition,
  ShortcutKeys,
  ShortcutMatch,
} from './shortcut-types.js';

export interface MinimalKeyboardEvent {
  readonly key: string;
  readonly code: string;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
}

/**
 * Match a keyboard event against the shortcut registry for the active context.
 * Pure function: no side effects, no DOM access.
 */
export function matchShortcut(
  event: MinimalKeyboardEvent,
  registry: readonly ShortcutDefinition[],
  activeContext: ShortcutContext,
): ShortcutMatch | null {
  for (const def of registry) {
    if (def.displayOnly) continue;
    if (!isContextActive(def.context, activeContext)) continue;
    if (keysMatch(event, def.keys)) {
      return { id: def.id, definition: def };
    }
  }
  return null;
}

function isContextActive(
  required: ShortcutContext,
  current: ShortcutContext,
): boolean {
  if (required === 'global') return true;
  return required === current;
}

function keysMatch(event: MinimalKeyboardEvent, keys: ShortcutKeys): boolean {
  if (Boolean(keys.ctrl) !== (event.ctrlKey || event.metaKey)) return false;
  if (Boolean(keys.shift) !== event.shiftKey) return false;
  if (Boolean(keys.alt) !== event.altKey) return false;

  const eventKey =
    event.key.length === 1 ? event.key.toUpperCase() : event.key;
  const defKey = keys.key.length === 1 ? keys.key.toUpperCase() : keys.key;

  if (eventKey === defKey) return true;
  if (keys.code && event.code === keys.code) return true;

  return false;
}

/**
 * Format a ShortcutKeys object into human-readable key tokens for <kbd> rendering.
 * Pure function.
 */
export function formatShortcutKeyTokens(keys: ShortcutKeys): string[] {
  if (keys.sequenceKeys && keys.sequenceKeys.length > 0) {
    return [...keys.sequenceKeys];
  }

  const tokens: string[] = [];
  if (keys.ctrl) tokens.push('Ctrl');
  if (keys.alt) tokens.push('Alt');
  if (keys.shift) tokens.push('Shift');
  if (keys.meta) tokens.push('Meta');

  if (keys.key === 'Escape') {
    tokens.push('Esc');
  } else if (keys.key === ' ') {
    tokens.push('Space');
  } else if (keys.key.length === 1) {
    tokens.push(keys.key.toUpperCase());
  } else {
    tokens.push(keys.key);
  }

  return tokens;
}
