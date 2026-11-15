/**
 * Official Monkeytype Sound Pack Registry
 * Mapped 1:1 to monkeytype/frontend/src/ts/constants/sounds.ts and static/sounds/ WAV assets.
 * Pure Data Layer — zero Svelte, DOM, or reactive state dependencies.
 */

import type { SoundPackDef, TimeWarningSeconds } from '../types/sound-types.js';

export const CLICK_PACKS: readonly SoundPackDef[] = [
  // Row 1 (Monkeytype IDs 1..5)
  { id: 'click', label: 'settings.sound.packClick', category: 'click', sourceType: 'sample', variants: 3, basePath: '/sounds/click1' },
  { id: 'beep', label: 'settings.sound.packBeep', category: 'click', sourceType: 'sample', variants: 3, basePath: '/sounds/click2' },
  { id: 'pop', label: 'settings.sound.packPop', category: 'click', sourceType: 'sample', variants: 3, basePath: '/sounds/click3' },
  { id: 'nk-creams', label: 'settings.sound.packNkCreams', category: 'click', sourceType: 'sample', variants: 6, basePath: '/sounds/click4' },
  { id: 'typewriter', label: 'settings.sound.packTypewriter', category: 'click', sourceType: 'sample', variants: 6, basePath: '/sounds/click5' },

  // Row 2 (Monkeytype IDs 6..11)
  { id: 'osu', label: 'settings.sound.packOsu', category: 'click', sourceType: 'sample', variants: 3, basePath: '/sounds/click6' },
  { id: 'hitmarker', label: 'settings.sound.packHitmarker', category: 'click', sourceType: 'sample', variants: 3, basePath: '/sounds/click7' },
  { id: 'sine', label: 'settings.sound.packSine', category: 'click', sourceType: 'synthesized', variants: 8 },
  { id: 'sawtooth', label: 'settings.sound.packSawtooth', category: 'click', sourceType: 'synthesized', variants: 8 },
  { id: 'square', label: 'settings.sound.packSquare', category: 'click', sourceType: 'synthesized', variants: 8 },
  { id: 'triangle', label: 'settings.sound.packTriangle', category: 'click', sourceType: 'synthesized', variants: 8 },

  // Row 3 (Monkeytype IDs 12..17)
  { id: 'pentatonic', label: 'settings.sound.packPentatonic', category: 'click', sourceType: 'sequence', variants: 10 },
  { id: 'wholetone', label: 'settings.sound.packWholetone', category: 'click', sourceType: 'sequence', variants: 12 },
  { id: 'fist-fight', label: 'settings.sound.packFistFight', category: 'click', sourceType: 'sample', variants: 8, basePath: '/sounds/click14' },
  { id: 'rubber-keys', label: 'settings.sound.packRubberKeys', category: 'click', sourceType: 'sample', variants: 5, basePath: '/sounds/click15' },
  { id: 'fart', label: 'settings.sound.packFart', category: 'click', sourceType: 'sample', variants: 8, basePath: '/sounds/click16' },
  { id: 'akko-lavenders', label: 'settings.sound.packAkkoLavenders', category: 'click', sourceType: 'sample', variants: 10, basePath: '/sounds/click17' },

  // Row 4 (Monkeytype IDs 18..23 — Mechanical Switches)
  { id: 'cherrymx-black-abs', label: 'settings.sound.packCherryBlackAbs', category: 'click', sourceType: 'sample', variants: 10, basePath: '/sounds/click18' },
  { id: 'cherrymx-black-pbt', label: 'settings.sound.packCherryBlackPbt', category: 'click', sourceType: 'sample', variants: 10, basePath: '/sounds/click19' },
  { id: 'cherrymx-blue-abs', label: 'settings.sound.packCherryBlueAbs', category: 'click', sourceType: 'sample', variants: 10, basePath: '/sounds/click20' },
  { id: 'cherrymx-blue-pbt', label: 'settings.sound.packCherryBluePbt', category: 'click', sourceType: 'sample', variants: 10, basePath: '/sounds/click21' },
  { id: 'cherrymx-brown-pbt', label: 'settings.sound.packCherryBrownPbt', category: 'click', sourceType: 'sample', variants: 10, basePath: '/sounds/click22' },
  { id: 'kalih-box-white', label: 'settings.sound.packKalihBoxWhite', category: 'click', sourceType: 'sample', variants: 10, basePath: '/sounds/click23' },

  // Row 5 (Monkeytype IDs 24..26 — Mechanical Switches cont.)
  { id: 'razer-green', label: 'settings.sound.packRazerGreen', category: 'click', sourceType: 'sample', variants: 10, basePath: '/sounds/click24' },
  { id: 'tealios-v2', label: 'settings.sound.packTealiosV2', category: 'click', sourceType: 'sample', variants: 10, basePath: '/sounds/click25' },
  { id: 'trust-gxt', label: 'settings.sound.packTrustGxt', category: 'click', sourceType: 'sample', variants: 10, basePath: '/sounds/click26' },
];

export const ERROR_PACKS: readonly SoundPackDef[] = [
  { id: 'error-damage', label: 'settings.sound.errorDamage', category: 'error', sourceType: 'sample', variants: 1, basePath: '/sounds/error1' },
  { id: 'error-triangle', label: 'settings.sound.errorTriangle', category: 'error', sourceType: 'sample', variants: 1, basePath: '/sounds/error2' },
  { id: 'error-square', label: 'settings.sound.errorSquare', category: 'error', sourceType: 'sample', variants: 1, basePath: '/sounds/error3' },
  { id: 'error-missed-punch', label: 'settings.sound.errorMissedPunch', category: 'error', sourceType: 'sample', variants: 2, basePath: '/sounds/error4' },
];

export const TIME_WARNING_SOUND_URL = '/sounds/timeWarning.wav';

export const TIME_WARNING_OPTIONS: ReadonlyArray<{
  readonly seconds: TimeWarningSeconds;
  readonly labelKey: string;
}> = [
  { seconds: 1, labelKey: 'settings.sound.warning1s' },
  { seconds: 3, labelKey: 'settings.sound.warning3s' },
  { seconds: 5, labelKey: 'settings.sound.warning5s' },
  { seconds: 10, labelKey: 'settings.sound.warning10s' },
];

const clickPackMap = new Map<string, SoundPackDef>(CLICK_PACKS.map((p) => [p.id, p]));
const errorPackMap = new Map<string, SoundPackDef>(ERROR_PACKS.map((p) => [p.id, p]));

export function getClickPackById(id: string): SoundPackDef | undefined {
  return clickPackMap.get(id);
}

export function getErrorPackById(id: string): SoundPackDef | undefined {
  return errorPackMap.get(id);
}

export function getAllClickPacks(): readonly SoundPackDef[] {
  return CLICK_PACKS;
}

export function getAllErrorPacks(): readonly SoundPackDef[] {
  return ERROR_PACKS;
}

export function isValidClickPackId(id: string): boolean {
  return clickPackMap.has(id);
}

export function isValidErrorPackId(id: string): boolean {
  return errorPackMap.has(id);
}
