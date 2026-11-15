/**
 * Pure type definitions for the Classic Mode Keyboard Shortcuts system.
 * Zero runtime dependencies, zero DOM/Svelte imports.
 */

/** Shortcut category for grouping in the help popup */
export type ShortcutCategory = 'navigation' | 'arena' | 'typing' | 'result' | 'app';

/** Context in which a shortcut is active */
export type ShortcutContext =
  | 'global'        // All Classic Mode routes when not typing
  | 'arena-idle'    // Arena route when not typing
  | 'arena-typing'  // Arena route while typing (existing, display-only)
  | 'result'        // Result page (existing, display-only)
  | 'app';          // Entire app (existing, display-only)

/** Key combination representation */
export interface ShortcutKeys {
  readonly key: string;
  readonly code?: string;
  readonly ctrl?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
  readonly meta?: boolean;
  readonly sequenceKeys?: readonly string[];
}

/** Single shortcut definition */
export interface ShortcutDefinition {
  readonly id: string;
  readonly keys: ShortcutKeys;
  readonly i18nKey: string;
  readonly category: ShortcutCategory;
  readonly context: ShortcutContext;
  readonly displayOnly?: boolean;
}

/** Result returned when a keyboard event matches a shortcut definition */
export interface ShortcutMatch {
  readonly id: string;
  readonly definition: ShortcutDefinition;
}
