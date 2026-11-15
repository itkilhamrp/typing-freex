/**
 * Tape Mode Layout Calculation Module
 *
 * Headless pure-function calculations for horizontal tape typing mode.
 * Strictly adheres to UNIX philosophy: single responsibility, pure arithmetic,
 * zero DOM/framework dependencies, and 100% testable in any runtime.
 */

/**
 * Canonical vertical breathing room (in pixels) applied to both top and bottom
 * of each `<div data-tape-line>` element.
 * Ensures 1:1 parity between a single tape line's DOM height (`singleLineHeight + 2 * TAPE_LINE_PADDING_Y`)
 * and the clipping viewport height (`viewportHeight`), preventing adjacent lines from bleeding into view
 * while preserving space for descenders, wavy error underlines, and active word borders.
 */
export const TAPE_LINE_PADDING_Y = 7;

export interface TapeMeasurement {
  wordTrackLeft: number;
  wordWidth: number;
  charTrackLeft: number;
  charTrackTop: number;
  charWidth: number;
  charHeight: number;
  isOverflow: boolean;
  viewportWidth: number;
  streamLineHeight: number;
  firstWordHeight: number;
  lineTrackTop: number;
}

export interface TapeLayout {
  caretX: number;
  caretY: number;
  caretW: number;
  caretH: number;
  scrollX: number;
  scrollY: number;
  viewportHeight: number;
}

/**
 * Computes exact caret coordinates, dimensions, viewport height, and dual-axis track scroll.
 * Guarantees 100% parity with Monkeytype tape mode:
 * - Words start with dynamic padding (padding-left: ${tapeMargin}%) per line so the first word of every line is centered.
 * - "letter" mode: Caret is stationary at targetVisualX (viewport-relative), track scrolls continuously per key.
 * - "word" mode: Word is anchored at targetVisualX, caret advances across the active word.
 * - scrollX is non-negative (>= 0), smoothly translating the track left as typing progresses on the active line.
 * - scrollY is non-negative (>= 0), smoothly shifting the track vertically when advancing across newline boundaries.
 */
export function computeTapeLayout(
  m: TapeMeasurement,
  tapeMode: "letter" | "word",
  tapeMargin: number,
): TapeLayout {
  const extraOffset = m.isOverflow ? m.charWidth : 0;
  const charXInTrack = m.charTrackLeft + extraOffset;
  const caretH = Math.max(18, Math.round(m.charHeight * 0.85));
  const scrollY = Math.max(0, Math.round(m.lineTrackTop));
  const caretY = (m.charTrackTop - scrollY) + (m.charHeight - caretH) / 2;
  const caretW = m.charWidth;

  const singleLineHeight =
    m.streamLineHeight > 0
      ? m.streamLineHeight
      : Math.max(m.firstWordHeight, 32);
  const viewportHeight = Math.round(singleLineHeight + TAPE_LINE_PADDING_Y * 2);

  const clampedMargin = Math.max(0, Math.min(100, tapeMargin));
  const targetVisualX = (clampedMargin / 100) * m.viewportWidth;

  const scrollX =
    tapeMode === "word"
      ? Math.max(0, Math.round(m.wordTrackLeft - targetVisualX))
      : Math.max(0, Math.round(charXInTrack - targetVisualX));

  const caretX =
    tapeMode === "word"
      ? charXInTrack - scrollX
      : targetVisualX;

  return {
    caretX,
    caretY,
    caretW,
    caretH,
    scrollX,
    scrollY,
    viewportHeight,
  };
}
