import { Mulberry32 } from '../prng';

export function generateWordsText(
  wordList: readonly string[],
  count: number,
  seed: number,
  punctuation: boolean = false,
  numbers: boolean = false
): string {
  if (wordList.length === 0) return '';
  const prng = new Mulberry32(seed);
  const selected: string[] = [];

  for (let i = 0; i < count; i++) {
    let word: string;

    if (numbers && prng.next() < 0.15) {
      word = String(prng.nextInt(1, 9999));
    } else {
      word = prng.pick(wordList);
    }

    if (punctuation && prng.next() < 0.2) {
      const punct = prng.pick([',', '.', '!', '?', ';', ':']);
      word = `${word}${punct}`;
    }

    selected.push(word);
  }

  return selected.join(' ');
}
