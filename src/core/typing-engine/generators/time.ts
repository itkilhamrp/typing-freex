import { generateWordsText } from './words';

/**
 * For Time mode, generates an initial buffer of words (e.g. 100 words),
 * which can be extended lazily as the user approaches the end.
 */
export function generateTimeText(
  wordList: readonly string[],
  timeSeconds: number,
  seed: number,
  punctuation: boolean = false,
  numbers: boolean = false
): string {
  // Approximate words needed based on a fast typist (e.g. 180 WPM max ceiling)
  // 60 seconds -> ~180 words, 30s -> ~90 words, 15s -> ~50 words.
  const estimatedWords = Math.max(60, Math.ceil((timeSeconds / 60) * 160));
  return generateWordsText(wordList, estimatedWords, seed, punctuation, numbers);
}
