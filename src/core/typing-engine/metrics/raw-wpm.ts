import { CHARS_PER_WORD } from './units';

/**
 * Calculates Raw Words Per Minute (§5.3 — FR-MET-002)
 * Formula: (character_producing_keystrokes / 5) / (T_active_seconds / 60)
 * Counts all character-producing keypresses (correct or incorrect), excluding control keys.
 */
export function calculateRawWpm(
  characterProducingKeystrokes: number,
  activeSeconds: number
): number {
  if (activeSeconds <= 0) return 0;
  const minutes = activeSeconds / 60;
  const words = characterProducingKeystrokes / CHARS_PER_WORD;
  const rawWpm = words / minutes;
  return Math.max(0, Math.round(rawWpm * 100) / 100);
}
