import { CHARS_PER_WORD } from './units';

/**
 * Calculates Net Words Per Minute (§5.3 — FR-MET-001)
 * Formula: ((correct_word_chars + correct_spaces) / 5) / (T_active_seconds / 60)
 */
export function calculateNetWpm(
  correctCharsAndSpaces: number,
  activeSeconds: number
): number {
  if (activeSeconds <= 0) return 0;
  const minutes = activeSeconds / 60;
  const words = correctCharsAndSpaces / CHARS_PER_WORD;
  const wpm = words / minutes;
  return Math.max(0, Math.round(wpm * 100) / 100);
}
