/**
 * Calculates Accuracy Percentage (§5.3 — FR-MET-003)
 * Formula: (correct_keystrokes / character_producing_keystrokes) * 100
 * Keystroke-level: a mistake later corrected by backspace still counts against accuracy.
 */
export function calculateAccuracy(
  correctKeystrokes: number,
  characterProducingKeystrokes: number
): number {
  if (characterProducingKeystrokes <= 0) return 100;
  const ratio = correctKeystrokes / characterProducingKeystrokes;
  const clamped = Math.max(0, Math.min(1, ratio));
  return Math.round(clamped * 10000) / 100;
}
