/**
 * Tape Mode Line Segmentation Module
 *
 * Headless pure-function module for segmenting word streams into logical horizontal lines
 * split at newline sentinels (`target === '\n'`).
 * Strictly adheres to UNIX philosophy: single responsibility, pure computation,
 * zero DOM/framework dependencies, and 100% testable in any runtime.
 */

export interface TapeLine {
  /** Inclusive start index in the words array */
  readonly startIndex: number;
  /** Exclusive end index in the words array */
  readonly endIndex: number;
}

/**
 * Segments words into logical lines by splitting at newline sentinels (`target === '\n'`).
 * Words with `target === '\n'` act as line terminators and are included as the final element
 * of the line they terminate.
 *
 * @example
 * // words: ["hello", "world", "\n", "foo", "bar"]
 * // -> [{ startIndex: 0, endIndex: 3 }, { startIndex: 3, endIndex: 5 }]
 */
export function segmentIntoTapeLines(
  words: ReadonlyArray<{ readonly target: string }>,
): TapeLine[] {
  const n = words.length;
  if (n === 0) return [];

  const lines: TapeLine[] = [];
  let lineStart = 0;

  for (let i = 0; i < n; i++) {
    if (words[i]?.target === "\n") {
      lines.push({ startIndex: lineStart, endIndex: i + 1 });
      lineStart = i + 1;
    }
  }

  if (lineStart < n) {
    lines.push({ startIndex: lineStart, endIndex: n });
  }

  return lines;
}

/**
 * Binary search lookup: finds which logical line a given word index belongs to.
 * Returns the 0-based line index, or 0 if not found / out of bounds.
 */
export function findLineForWord(
  lines: ReadonlyArray<TapeLine>,
  wordIndex: number,
): number {
  if (lines.length === 0 || wordIndex < 0) return 0;

  let low = 0;
  let high = lines.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const line = lines[mid]!;

    if (wordIndex < line.startIndex) {
      high = mid - 1;
    } else if (wordIndex >= line.endIndex) {
      low = mid + 1;
    } else {
      return mid;
    }
  }

  return 0;
}

