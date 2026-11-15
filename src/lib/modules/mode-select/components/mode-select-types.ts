/**
 * mode-select-types.ts
 * Pure type definitions for Mode Select module.
 * Zero runtime. Zero framework dependencies.
 */

import type { AsciiMode } from './ascii-art-data';

/** Static configuration for a single game mode ribbon */
export interface ModeConfig {
  /** Unique mode key used for routing & i18n lookup */
  readonly key: string;
  /** AsciiArtCanvas mode identifier */
  readonly asciiMode: AsciiMode;
  /** i18n namespace prefix (e.g. 'modeSelect.classic') */
  readonly i18nPrefix: string;
  /** Whether mode is currently playable */
  readonly available: boolean;
  /** CSS accent color value (CSS variable reference) */
  readonly accentVar: string;
  /** Horizontal stagger alignment & chevron direction: 'left' (docked left, points right) or 'right' (docked right, points left) */
  readonly stagger: 'left' | 'right';
}

/** Visual focus state for a ribbon */
export type RibbonFocusState = 'idle' | 'focused' | 'flash';

