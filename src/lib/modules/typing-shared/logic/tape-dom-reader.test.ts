import { describe, it, expect } from "vitest";
import { readTapeMeasurement } from "./tape-dom-reader";
import { TAPE_LINE_PADDING_Y } from "./tape-sync";

describe("readTapeMeasurement", () => {
  it("returns deterministic fallback metrics when active word element is undefined", () => {
    const viewport = document.createElement("div");
    const track = document.createElement("div");
    const stream = document.createElement("div");
    viewport.appendChild(track);
    track.appendChild(stream);

    const m = readTapeMeasurement(undefined, stream, track, viewport, 0);
    expect(m.wordTrackLeft).toBe(0);
    expect(m.charTrackLeft).toBe(0);
    expect(m.charTrackTop).toBe(TAPE_LINE_PADDING_Y);
    expect(m.lineTrackTop).toBe(0);
    expect(m.isOverflow).toBe(false);
  });

  it("extracts word, character, and data-tape-line offsets relative to track and detects overflow", () => {
    const viewport = document.createElement("div");
    const track = document.createElement("div");
    const stream = document.createElement("div");
    const line1 = document.createElement("div");
    line1.setAttribute("data-tape-line", "1");

    const word = document.createElement("span");
    const char0 = document.createElement("span");
    const char1 = document.createElement("span");

    word.appendChild(char0);
    word.appendChild(char1);
    line1.appendChild(word);
    stream.appendChild(line1);
    track.appendChild(stream);
    viewport.appendChild(track);

    Object.defineProperty(viewport, "clientWidth", { value: 900 });
    Object.defineProperty(line1, "offsetTop", { value: 74 });
    Object.defineProperty(line1, "offsetParent", { value: track });
    Object.defineProperty(word, "offsetLeft", { value: 450 });
    Object.defineProperty(word, "offsetTop", { value: 7 });
    Object.defineProperty(word, "offsetWidth", { value: 36 });
    Object.defineProperty(word, "offsetParent", { value: line1 });
    Object.defineProperty(char1, "offsetLeft", { value: 18 });
    Object.defineProperty(char1, "offsetTop", { value: 0 });
    Object.defineProperty(char1, "offsetWidth", { value: 18 });
    Object.defineProperty(char1, "offsetHeight", { value: 28 });
    Object.defineProperty(char1, "offsetParent", { value: word });

    // In-bounds character (index 1 of 2 chars)
    const inBounds = readTapeMeasurement(word, stream, track, viewport, 1);
    expect(inBounds.viewportWidth).toBe(900);
    expect(inBounds.lineTrackTop).toBe(74);
    expect(inBounds.wordTrackLeft).toBe(450);
    expect(inBounds.charTrackLeft).toBe(468); // 450 + 18
    expect(inBounds.charTrackTop).toBe(81); // 74 + 7 + 0
    expect(inBounds.isOverflow).toBe(false);

    // Overflow character (index 2 >= 2 chars)
    const overflow = readTapeMeasurement(word, stream, track, viewport, 2);
    expect(overflow.isOverflow).toBe(true);
    expect(overflow.charWidth).toBe(18);
  });
});

