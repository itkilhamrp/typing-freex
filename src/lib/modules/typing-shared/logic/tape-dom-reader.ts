/**
 * Tape Mode DOM Measurement Reader
 *
 * Isolated DOM inspection module that extracts normalized layout metrics
 * into a pure `TapeMeasurement` data structure for `tape-sync.ts`.
 * Adheres to UNIX philosophy: single responsibility (DOM read stage of the tape pipeline),
 * decoupled from normal-mode layout logic and pure math calculations.
 */

import { getOffsetRelativeTo } from "./dom-measurement";
import { TAPE_LINE_PADDING_Y, type TapeMeasurement } from "./tape-sync";

/**
 * Reads DOM coordinates and dimensions for the active word, active character,
 * and active `[data-tape-line]` container relative to the scrolling track.
 */
export function readTapeMeasurement(
  word: HTMLElement | undefined,
  streamEl: HTMLElement,
  trackEl: HTMLElement,
  viewportEl: HTMLElement,
  currCharIdx: number,
  cachedStreamLineHeight?: number | null,
): TapeMeasurement {
  const viewportWidth = viewportEl.clientWidth;
  const lineEl = word?.closest("[data-tape-line]") as HTMLElement | null;
  let streamLineHeight =
    cachedStreamLineHeight !== undefined &&
    cachedStreamLineHeight !== null &&
    cachedStreamLineHeight > 0
      ? cachedStreamLineHeight
      : 0;
  if (streamLineHeight <= 0) {
    const compTarget = lineEl ?? streamEl;
    const compStyle =
      typeof window !== "undefined" ? window.getComputedStyle(compTarget) : null;
    const parsedLH = compStyle ? parseFloat(compStyle.lineHeight) : NaN;
    streamLineHeight = !isNaN(parsedLH) && parsedLH > 0 ? parsedLH : 0;
  }

  const firstLineEl = streamEl.children[0] as HTMLElement | undefined;
  const firstWordEl = (
    firstLineEl?.hasAttribute("data-tape-line")
      ? firstLineEl.children[0]
      : firstLineEl
  ) as HTMLElement | undefined;
  const firstWordHeight = firstWordEl?.offsetHeight ?? 32;

  if (!word) {
    return {
      wordTrackLeft: 0,
      wordWidth: 0,
      charTrackLeft: 0,
      charTrackTop: TAPE_LINE_PADDING_Y,
      charWidth: 14,
      charHeight: 28,
      isOverflow: false,
      viewportWidth,
      streamLineHeight,
      firstWordHeight,
      lineTrackTop: 0,
    };
  }

  const n = word.children.length;
  const i = currCharIdx;
  const el = (word.children[Math.min(i, Math.max(0, n - 1))] ??
    word) as HTMLElement;

  const wordOffset = getOffsetRelativeTo(word, trackEl);
  const charOffset = getOffsetRelativeTo(el, trackEl);
  const lineTrackTop = lineEl ? getOffsetRelativeTo(lineEl, trackEl).top : 0;
  const isOverflow = i >= n && n > 0;

  return {
    wordTrackLeft: wordOffset.left,
    wordWidth: word.offsetWidth,
    charTrackLeft: charOffset.left,
    charTrackTop: charOffset.top,
    charWidth: el.offsetWidth,
    charHeight: el.offsetHeight,
    isOverflow,
    viewportWidth,
    streamLineHeight,
    firstWordHeight,
    lineTrackTop,
  };
}

