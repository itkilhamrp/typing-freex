import { describe, it, expect } from "vitest";
import { computeTapeLayout, TAPE_LINE_PADDING_Y, type TapeMeasurement } from "./tape-sync";

describe("computeTapeLayout", () => {
  // Simulates initial test state (● READY): Word 0 at targetVisualX (50% = 400px) due to padding-left: 50%
  const initialMeasurement: TapeMeasurement = {
    wordTrackLeft: 400,
    wordWidth: 60,
    charTrackLeft: 400,
    charTrackTop: 6,
    charWidth: 12,
    charHeight: 28,
    isOverflow: false,
    viewportWidth: 800,
    streamLineHeight: 36,
    firstWordHeight: 32,
    lineTrackTop: 0,
  };

  it("calculates initial READY state with Word 0 aligned to Caret in center (scrollX = 0)", () => {
    // targetVisualX = 50% of 800 = 400
    // charXInTrack = 400 (starts at 50% due to padding-left: 50%)
    // scrollX = Math.max(0, 400 - 400) = 0
    // caretX = 400 (rock-solid, viewport-relative)
    const layout = computeTapeLayout(initialMeasurement, "letter", 50);

    expect(layout.caretX).toBe(400);
    expect(layout.scrollX).toBe(0);
    expect(layout.scrollY).toBe(0);
    expect(layout.caretH).toBe(24); // Math.round(28 * 0.85) = 24
    expect(layout.caretY).toBe(8); // 6 + (28 - 24) / 2 = 8
    expect(layout.caretW).toBe(12);
    expect(layout.viewportHeight).toBe(50); // 36 + 14 = 50
  });

  it("scrolls smoothly to the left as characters are typed in letter mode", () => {
    // Typed 2nd character ('u' in "dunia") at offset 414px
    const secondChar: TapeMeasurement = {
      ...initialMeasurement,
      charTrackLeft: 414,
    };

    const layout = computeTapeLayout(secondChar, "letter", 50);
    expect(layout.caretX).toBe(400); // Caret remains anchored at center
    expect(layout.scrollX).toBe(14); // Track scrolls left by 14px (translateX(-14px))
  });

  it("anchors active word at targetVisualX and moves caret across letters in word mode", () => {
    // Word 0 at 400px, 3rd character at 424px
    const inWordChar: TapeMeasurement = {
      ...initialMeasurement,
      charTrackLeft: 424,
    };

    const layout = computeTapeLayout(inWordChar, "word", 50);
    expect(layout.scrollX).toBe(0); // Word 0 is at targetVisualX (400 - 400 = 0)
    expect(layout.caretX).toBe(424); // Caret moves to 424px across the active word
  });

  it("shifts track smoothly when advancing to the next word in word mode", () => {
    // Advanced to Word 1 at track offset 480px, first char at 480px
    const nextWord: TapeMeasurement = {
      ...initialMeasurement,
      wordTrackLeft: 480,
      charTrackLeft: 480,
    };

    const layout = computeTapeLayout(nextWord, "word", 50);
    expect(layout.scrollX).toBe(80); // 480 - 400 = 80px scroll
    expect(layout.caretX).toBe(400); // Caret aligns to the start of Word 1 at targetVisualX (400)
  });

  it("honors various tapeMargin percentages consistently", () => {
    // Margin 25%: targetVisualX = 200px, initial char at 200px
    const m25Measurement: TapeMeasurement = {
      ...initialMeasurement,
      wordTrackLeft: 200,
      charTrackLeft: 200,
    };
    const m25 = computeTapeLayout(m25Measurement, "letter", 25);
    expect(m25.caretX).toBe(200);
    expect(m25.scrollX).toBe(0);

    // Margin 75%: targetVisualX = 600px, initial char at 600px
    const m75Measurement: TapeMeasurement = {
      ...initialMeasurement,
      wordTrackLeft: 600,
      charTrackLeft: 600,
    };
    const m75 = computeTapeLayout(m75Measurement, "letter", 75);
    expect(m75.caretX).toBe(600);
    expect(m75.scrollX).toBe(0);
  });

  it("advances caret position past the last character on overflow", () => {
    const overflowMeasurement: TapeMeasurement = {
      ...initialMeasurement,
      charTrackLeft: 456, // Last char of Word 0
      isOverflow: true,
    };

    // charXInTrack = 456 + 12 = 468
    // In letter mode, caret is fixed at 400, scroll updates to 468 - 400 = 68
    const letterLayout = computeTapeLayout(overflowMeasurement, "letter", 50);
    expect(letterLayout.caretX).toBe(400);
    expect(letterLayout.scrollX).toBe(68);

    // In word mode, caret moves to 468
    const wordLayout = computeTapeLayout(overflowMeasurement, "word", 50);
    expect(wordLayout.caretX).toBe(468);
  });

  it("uses fallback height when streamLineHeight is 0", () => {
    const fallbackMeasurement: TapeMeasurement = {
      ...initialMeasurement,
      streamLineHeight: 0,
      firstWordHeight: 40,
    };

    const layout = computeTapeLayout(fallbackMeasurement, "letter", 50);
    expect(layout.viewportHeight).toBe(54); // 40 + 14
  });

  it("computes scrollY and viewport-relative caretY on subsequent multi-line tape lines", () => {
    // Line 1 starts at lineTrackTop = 46px, char sits at charTrackTop = 52px (6px inside line 1)
    const secondLineMeasurement: TapeMeasurement = {
      ...initialMeasurement,
      lineTrackTop: 46,
      charTrackTop: 52,
      wordTrackLeft: 400,
      charTrackLeft: 400,
    };

    const layout = computeTapeLayout(secondLineMeasurement, "letter", 50);
    expect(layout.scrollY).toBe(46);
    expect(layout.scrollX).toBe(0);
    expect(layout.caretX).toBe(400);
    // caretY = (52 - 46) + (28 - 24) / 2 = 6 + 2 = 8 (stable across lines!)
    expect(layout.caretY).toBe(8);
  });

  it("maintains identical viewport-relative caretY across multiple vertical line transitions", () => {
    const line0 = computeTapeLayout(
      { ...initialMeasurement, lineTrackTop: 0, charTrackTop: 6 },
      "letter",
      50,
    );
    const line1 = computeTapeLayout(
      { ...initialMeasurement, lineTrackTop: 46, charTrackTop: 52 },
      "letter",
      50,
    );
    const line2 = computeTapeLayout(
      { ...initialMeasurement, lineTrackTop: 92, charTrackTop: 98 },
      "letter",
      50,
    );

    expect(line0.scrollY).toBe(0);
    expect(line1.scrollY).toBe(46);
    expect(line2.scrollY).toBe(92);

    expect(line0.caretY).toBe(8);
    expect(line1.caretY).toBe(8);
    expect(line2.caretY).toBe(8);
  });

  it("enforces symmetric vertical padding parity between TAPE_LINE_PADDING_Y and viewportHeight", () => {
    expect(TAPE_LINE_PADDING_Y).toBe(7);
    const layout = computeTapeLayout(initialMeasurement, "letter", 50);
    // viewportHeight must equal singleLineHeight (36) + 2 * TAPE_LINE_PADDING_Y (14) = 50
    expect(layout.viewportHeight).toBe(
      initialMeasurement.streamLineHeight + TAPE_LINE_PADDING_Y * 2,
    );
  });
});
