import { describe, it, expect } from "vitest";
import { segmentIntoTapeLines, findLineForWord } from "./tape-line-segmenter";

function w(...targets: string[]) {
  return targets.map((target) => ({ target }));
}

describe("segmentIntoTapeLines", () => {
  it("returns empty array for empty input", () => {
    expect(segmentIntoTapeLines([])).toEqual([]);
  });

  it("returns a single line covering all words when no newlines exist", () => {
    const words = w("hello", "world", "typing", "freex");
    expect(segmentIntoTapeLines(words)).toEqual([
      { startIndex: 0, endIndex: 4 },
    ]);
  });

  it("returns a single line when the only newline is at the very end", () => {
    const words = w("hello", "world", "\n");
    expect(segmentIntoTapeLines(words)).toEqual([
      { startIndex: 0, endIndex: 3 },
    ]);
  });

  it("splits into 2 lines when a single newline is in the middle", () => {
    const words = w("hello", "world", "\n", "foo", "bar");
    expect(segmentIntoTapeLines(words)).toEqual([
      { startIndex: 0, endIndex: 3 },
      { startIndex: 3, endIndex: 5 },
    ]);
  });

  it("splits into multiple lines across multiple newlines", () => {
    const words = w("line1", "\n", "line2a", "line2b", "\n", "line3");
    expect(segmentIntoTapeLines(words)).toEqual([
      { startIndex: 0, endIndex: 2 },
      { startIndex: 2, endIndex: 5 },
      { startIndex: 5, endIndex: 6 },
    ]);
  });

  it("handles consecutive newlines as individual single-sentinel lines", () => {
    const words = w("first", "\n", "\n", "after_blank");
    expect(segmentIntoTapeLines(words)).toEqual([
      { startIndex: 0, endIndex: 2 },
      { startIndex: 2, endIndex: 3 },
      { startIndex: 3, endIndex: 4 },
    ]);
  });

  it("handles a newline at index 0", () => {
    const words = w("\n", "second", "line");
    expect(segmentIntoTapeLines(words)).toEqual([
      { startIndex: 0, endIndex: 1 },
      { startIndex: 1, endIndex: 3 },
    ]);
  });
});

describe("findLineForWord", () => {
  const lines = segmentIntoTapeLines(
    w("a", "b", "\n", "c", "d", "e", "\n", "f"),
  );
  // Line 0: [0, 3) -> indices 0, 1, 2 ('\n')
  // Line 1: [3, 7) -> indices 3, 4, 5, 6 ('\n')
  // Line 2: [7, 8) -> index 7

  it("finds the correct line index for words across multiple lines", () => {
    expect(findLineForWord(lines, 0)).toBe(0);
    expect(findLineForWord(lines, 1)).toBe(0);
    expect(findLineForWord(lines, 3)).toBe(1);
    expect(findLineForWord(lines, 5)).toBe(1);
    expect(findLineForWord(lines, 7)).toBe(2);
  });

  it("places newline sentinel on the line it terminates, and next word on next line", () => {
    expect(findLineForWord(lines, 2)).toBe(0); // '\n' terminating line 0
    expect(findLineForWord(lines, 3)).toBe(1); // first word of line 1
    expect(findLineForWord(lines, 6)).toBe(1); // '\n' terminating line 1
    expect(findLineForWord(lines, 7)).toBe(2); // first word of line 2
  });

  it("returns 0 safely for out-of-range or empty inputs", () => {
    expect(findLineForWord([], 0)).toBe(0);
    expect(findLineForWord(lines, -1)).toBe(0);
    expect(findLineForWord(lines, 999)).toBe(0);
  });
});

