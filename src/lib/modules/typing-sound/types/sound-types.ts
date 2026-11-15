/**
 * Canonical TypeScript Contracts for the Typing Sound System.
 * Pure Data Layer — zero Svelte, DOM, or reactive state dependencies.
 */

export type SoundSourceType = 'sample' | 'synthesized' | 'sequence';

export type SoundCategory = 'click' | 'error' | 'warning';

export type TimeWarningSeconds = 0 | 1 | 3 | 5 | 10;

export interface SoundPackDef {
  /** Canonical pack identifier */
  readonly id: string;
  /** Localization key for display label */
  readonly label: string;
  /** Sound category */
  readonly category: SoundCategory;
  /** Playback mechanism ('sample' uses random pool, 'synthesized' single tone, 'sequence' scale notes) */
  readonly sourceType: SoundSourceType;
  /** Number of distinct variations in the pack */
  readonly variants: number;
  /** Optional static asset base path (falls back to 32-bit physical synthesis if offline/absent) */
  readonly basePath?: string;
}

export interface SoundSettings {
  readonly enabled: boolean;
  readonly clickPack: string;
  readonly errorPack: string;
  readonly warningSeconds: TimeWarningSeconds;
  readonly volume: number;
}

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: false,
  clickPack: 'nk-creams',
  errorPack: 'error-damage',
  warningSeconds: 0,
  volume: 0.5,
} as const;

