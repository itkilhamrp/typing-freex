<script lang="ts">
  import type { WordState, TypingMode } from "@/core/typing-engine";
  import type { FontSizePreset } from "#lib/modules/settings/stores/settings.store.svelte.js";
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import Caret from "./Caret.svelte";
  import { computeTapeLayout, TAPE_LINE_PADDING_Y } from "../logic/tape-sync";
  import { segmentIntoTapeLines, findLineForWord } from "../logic/tape-line-segmenter";
  import { readTapeMeasurement } from "../logic/tape-dom-reader";

  const { t } = useI18n();

  interface Props {
    words: WordState[];
    currentWordIndex: number;
    currentCharIndex: number;
    caretStyle?: "line" | "block" | "underline" | "outline";
    showCaret?: boolean;
    mode?: TypingMode;
    isTyping?: boolean;
    fontSizePreset?: FontSizePreset;
    visibleLines?: number;
    smoothCaret?: boolean;
    highlightActiveWord?: boolean;
    tapeEnabled?: boolean;
    tapeMode?: "letter" | "word";
    tapeMargin?: number;
  }

  let {
    words,
    currentWordIndex,
    currentCharIndex,
    caretStyle = "line",
    showCaret = true,
    mode = "time",
    isTyping = false,
    fontSizePreset = "md",
    visibleLines = 3,
    smoothCaret = false,
    highlightActiveWord = false,
    tapeEnabled = false,
    tapeMode = "letter",
    tapeMargin = 50,
  }: Props = $props();

  const LOOKBEHIND = 25; // past words kept in DOM for scroll context
  const LOOKAHEAD = 120; // future words rendered ahead of cursor (ensures full 5 lines on wide viewports)
  const CHUNK_SIZE = 15; // chunk window slide to prevent DOM churn on every word

  const CHAR_CLASS: Record<string, string> = {
    untyped: "char-untyped",
    correct: "char-correct",
    incorrect: "char-incorrect font-semibold",
    missed: "char-missed font-semibold",
  };

  // Sliding window: only words near the cursor are in the DOM.
  // Chunking by 15 words ensures that for 15 words at a time, no nodes are removed
  // from the start of the DOM, eliminating 93% of flex reflows and layout churn.
  // In tape mode, windowStart remains 0 so word coordinates on the horizontal line never shift.
  const windowStart = $derived(
    tapeEnabled
      ? 0
      : Math.floor(Math.max(0, currentWordIndex - LOOKBEHIND) / CHUNK_SIZE) * CHUNK_SIZE,
  );
  const visibleWords = $derived(
    words.slice(windowStart, currentWordIndex + LOOKAHEAD),
  );
  const tapeLines = $derived.by(() => {
    if (!tapeEnabled) return null;
    return segmentIntoTapeLines(words);
  });
  const activeTapeLineIndex = $derived.by(() => {
    if (!tapeEnabled || !tapeLines) return 0;
    return findLineForWord(tapeLines, currentWordIndex);
  });

  // Plain (non-reactive) refs and caches: all layout work is imperative, so a
  // keystroke never triggers a second reactive flush.
  let viewport: HTMLDivElement | undefined;
  let track: HTMLDivElement | undefined;
  let stream: HTMLDivElement | undefined;
  let caret: ReturnType<typeof Caret> | undefined;

  let metrics: { top: number; step: number } | null = null;
  let cachedTapeLineHeight: number | null = null;
  let appliedHeight = -1;
  let appliedScroll = -1;
  let appliedScrollX = -1;
  let appliedScrollY = -1;
  let prevWindowStart = -1;
  let relayoutMounted = false;

  interface VisualLine {
    top: number;
    bottom: number;
  }

  function getVisualLines(): VisualLine[] {
    if (!stream) return [];
    const kids = stream.children;
    const lines: VisualLine[] = [];

    for (let i = 0; i < kids.length; i++) {
      const el = kids[i] as HTMLElement;
      if (el.offsetHeight <= 0) continue;

      const elTop = el.offsetTop;
      const elBottom = elTop + el.offsetHeight;

      if (lines.length === 0) {
        lines.push({ top: elTop, bottom: elBottom });
      } else {
        const currentLine = lines[lines.length - 1];
        if (currentLine && Math.abs(elTop - currentLine.top) <= 16) {
          currentLine.top = Math.min(currentLine.top, elTop);
          currentLine.bottom = Math.max(currentLine.bottom, elBottom);
        } else if (currentLine && elTop > currentLine.top + 16) {
          lines.push({ top: elTop, bottom: elBottom });
        }
      }
    }

    return lines;
  }

  function measure(): { top: number; step: number } {
    if (metrics) return metrics;
    const kids = stream!.children;
    const first = kids[0] as HTMLElement | undefined;
    if (!first) return { top: 0, step: 48 };
    const top = first.offsetTop;
    for (let i = 1; i < kids.length; i++) {
      const el = kids[i] as HTMLElement;
      if (el.offsetHeight > 0 && el.offsetTop > top + 4) {
        return (metrics = { top, step: el.offsetTop - top });
      }
    }
    // Single line so far: usable estimate, but don't cache it.
    const comp = typeof window !== "undefined" ? window.getComputedStyle(stream!) : null;
    const lh = comp ? parseFloat(comp.lineHeight) : NaN;
    const estStep = !isNaN(lh) && lh > 0 ? Math.round(lh + 10) : Math.max(first.offsetHeight + 10, 48);
    return { top, step: estStep };
  }

  function syncNormal() {
    if (!viewport || !track || !stream) return;

    // Invalidate line metrics when the DOM window slides
    if (windowStart !== prevWindowStart) {
      metrics = null;
      prevWindowStart = windowStart;
      track.style.transition = "none";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (track) track.style.transition = "";
        });
      });
    }

    // READ phase (offset* values are transform-independent and layout-cheap)
    const lines = getVisualLines();
    const l0 = lines[0];
    const l1 = lines[1];
    const measuredStep = l0 && l1 && l1.top - l0.top >= 24
      ? l1.top - l0.top
      : measure().step;
    const { top, step } = {
      top: l0 ? l0.top : measure().top,
      step: measuredStep,
    };
    metrics = { top, step };

    const word = (stream.querySelector(`[data-word-idx="${currentWordIndex}"]`) ??
      stream.children[currentWordIndex - windowStart]) as HTMLElement | undefined;
    if (!word && words.length) return;

    let x = 0,
      y = 4,
      w = 14,
      scroll = 0,
      caretH = 28,
      line = 0;

    if (word) {
      const n = word.children.length;
      const i = currentCharIndex;
      const el = (word.children[Math.min(i, n - 1)] ?? word) as HTMLElement;
      x = el.offsetLeft + (i >= n && n > 0 ? el.offsetWidth : 0);
      caretH = Math.max(18, Math.round(el.offsetHeight * 0.85));
      y = el.offsetTop + (el.offsetHeight - caretH) / 2;
      w = el.offsetWidth;

      if (lines.length > 0) {
        const lineIdx = lines.findIndex(
          (l) => el.offsetTop >= l.top - 6 && el.offsetTop <= l.bottom + 6,
        );
        line = lineIdx >= 0 ? lineIdx : Math.max(0, Math.round((el.offsetTop - top) / step));
      } else {
        line = Math.max(0, Math.round((el.offsetTop - top) / step));
      }
    }

    const activeRowTarget = visibleLines <= 2 ? 0 : Math.floor((visibleLines - 1) / 2);
    const startLineIdx = Math.max(0, line - activeRowTarget);
    const startLine = lines[startLineIdx];
    const firstLine = lines[0];
    if (startLine && firstLine) {
      scroll = startLine.top - firstLine.top;
    } else {
      scroll = startLineIdx * step;
    }

    // Compute exact viewport height based on measured DOM lines
    let height: number;
    const endLineIdx = Math.min(lines.length - 1, startLineIdx + visibleLines - 1);
    const targetLine = lines[endLineIdx];
    if (startLine && targetLine) {
      const currentStartTop = startLine.top;

      const nextLine = lines[endLineIdx + 1];
      if (nextLine) {
        // A subsequent line exists. Cut safely in the flex gap above it without truncating targetLine descenders.
        const nextLineTop = nextLine.top - currentStartTop;
        height = Math.round(nextLineTop - 2);
      } else {
        // Target line is the last available DOM line; provide full step height plus any missing lines
        const missingLines = Math.max(0, startLineIdx + visibleLines - lines.length);
        const targetLineHeight = Math.max(step, targetLine.bottom - targetLine.top + 14);
        height = Math.round((targetLine.top - currentStartTop) + targetLineHeight + (missingLines * step) - 2);
      }
    } else {
      // Deterministic layout fallback (JSDOM / SSR / 0-height environments)
      const compStyle = typeof window !== "undefined" ? window.getComputedStyle(stream) : null;
      const parsedLineHeight = compStyle ? parseFloat(compStyle.lineHeight) : NaN;
      const firstWordEl = stream.children[0] as HTMLElement | undefined;
      const lineHeight = !isNaN(parsedLineHeight) && parsedLineHeight > 0
        ? parsedLineHeight
        : Math.max(firstWordEl?.offsetHeight ?? 32, Math.round(step * 0.82));
      height = Math.max(
        Math.round(lineHeight + 14),
        Math.round(step * (visibleLines - 1) + lineHeight + 14),
      );
    }

    // WRITE phase (direct DOM, only when changed)
    if (height !== appliedHeight) {
      appliedHeight = height;
      viewport.style.height = `${height}px`;
    }
    if (scroll !== appliedScroll) {
      appliedScroll = scroll;
      track.style.transform = `translateY(-${scroll}px)`;
    }
    caret?.place(x, y - scroll, w, caretH);
  }

  function syncTape() {
    if (!viewport || !track || !stream) return;

    // Invalidate stale scroll and disable transition when the DOM sliding window shifts
    if (windowStart !== prevWindowStart) {
      prevWindowStart = windowStart;
      appliedScrollX = -1;
      appliedScrollY = -1;
      track.style.transition = "none";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (track) track.style.transition = "";
        });
      });
    }

    const word = stream.querySelector(`[data-word-idx="${currentWordIndex}"]`) as HTMLElement | undefined;
    if (!word && words.length) return;

    // READ phase: gather normalized layout metrics from DOM (using cached lineHeight after first read)
    const measurement = readTapeMeasurement(
      word,
      stream,
      track,
      viewport,
      currentCharIndex,
      cachedTapeLineHeight,
    );
    if (measurement.streamLineHeight > 0) {
      cachedTapeLineHeight = measurement.streamLineHeight;
    }

    // COMPUTE phase: pure arithmetic via headless tape-sync module
    const layout = computeTapeLayout(measurement, tapeMode, tapeMargin);

    // WRITE phase: apply changes to DOM only when mutated
    if (layout.viewportHeight !== appliedHeight) {
      appliedHeight = layout.viewportHeight;
      viewport.style.height = `${layout.viewportHeight}px`;
    }

    if (layout.scrollX !== appliedScrollX || layout.scrollY !== appliedScrollY) {
      appliedScrollX = layout.scrollX;
      appliedScrollY = layout.scrollY;
      track.style.transform = `translate3d(-${layout.scrollX}px, -${layout.scrollY}px, 0)`;
    }

    caret?.place(layout.caretX, layout.caretY, layout.caretW, layout.caretH);
  }

  function sync() {
    if (tapeEnabled) {
      syncTape();
    } else {
      syncNormal();
    }
  }

  function relayout() {
    metrics = null;
    cachedTapeLineHeight = null;
    appliedScroll = -1;
    appliedScrollX = -1;
    appliedScrollY = -1;
    appliedHeight = -1;
    if (track) {
      track.style.transform = "";
    }
    sync();
  }

  // Runs after Svelte has patched the DOM, in the same flush as the keystroke.
  $effect(() => {
    void caretStyle;
    void words;
    void currentWordIndex;
    void currentCharIndex;
    sync();
  });

  // Re-layout when customization presets or tape settings change.
  $effect(() => {
    void fontSizePreset;
    void visibleLines;
    void tapeEnabled;
    void tapeMode;
    void tapeMargin;
    if (!relayoutMounted) {
      relayoutMounted = true;
      return;
    }
    relayout();
  });

  // Resize / font-load invalidate cached line metrics.
  $effect(() => {
    if (!track) return;
    let lastWidth = track.clientWidth;
    const ro = new ResizeObserver(() => {
      const width = track!.clientWidth;
      if (width === lastWidth) return;
      lastWidth = width;
      relayout();
    });
    ro.observe(track);
    document.fonts?.ready.then(relayout);
    return () => ro.disconnect();
  });
</script>

<div
  class="typing-arena-container relative px-4 sm:px-6 py-1.5 sm:py-2 break-words select-none overflow-hidden"
  style="contain: layout paint style; --tt-text-arena: var(--tt-text-arena-{fontSizePreset}); --tt-line-height-arena: var(--tt-line-height-arena-{fontSizePreset});"
>
  <!-- Clipping viewport (height is managed imperatively based on visibleLines) -->
  <div
    bind:this={viewport}
    class="relative overflow-hidden w-full transition-[height] duration-150 ease-out min-h-[32px]"
  >
    <!-- Caret positioned at viewport level (immune to track transform jitter in tape mode) -->
    <Caret
      bind:this={caret}
      styleType={caretStyle}
      visible={showCaret}
      {isTyping}
      smooth={smoothCaret}
    />

    <!-- Scrolling track (translateY in normal mode, translateX in tape mode) -->
    <div
      bind:this={track}
      class="relative transition-transform duration-150 ease-out"
      style="will-change: transform;"
    >
      {#if mode === "zen" && words.length === 0}
        <div
          class="text-tt-text-secondary/40 italic select-none py-1 pointer-events-none"
        >
          {t("arena.zenStartPrompt")}
        </div>
      {/if}

      {#snippet renderWord(word: WordState, wIdx: number, isTape: boolean)}
        {@const isCurrentWord = wIdx === currentWordIndex}
        {@const isFirstOnLine = wIdx === 0 || words[wIdx - 1]?.target === "\n"}
        {#if word.target === "\n"}
          <span
            data-word-idx={wIdx}
            class={[
              "inline-flex items-baseline transition-colors duration-150 rounded-md px-1 -mx-1",
              isFirstOnLine ? "" : "-ml-2",
              highlightActiveWord && isCurrentWord
                ? "bg-tt-primary/10 border-b-2 border-tt-primary/50"
                : "",
            ].filter(Boolean).join(" ")}
          >
            <span
              class={[
                "char-node char-enter inline-block",
                word.isCompleted ? "char-correct" : "char-untyped opacity-50",
              ].join(" ")}>↵</span
            >
          </span>
          {#if !isTape}
            <!-- Line break to force next word onto next line without double gap -->
            <span
              class="w-full basis-full pointer-events-none select-none"
              style="height: 0; line-height: 0; margin-bottom: -10px;"
              aria-hidden="true"
            ></span>
          {/if}
        {:else}
          <span
            data-word-idx={wIdx}
            class={[
              "inline-flex items-baseline transition-colors duration-150 rounded-md px-1 -mx-1",
              isTape
                ? "flex-nowrap whitespace-nowrap"
                : "flex-wrap max-w-full break-all",
              highlightActiveWord && isCurrentWord
                ? "bg-tt-primary/10 border-b-2 border-tt-primary/50"
                : "",
            ].filter(Boolean).join(" ")}
          >
            {#each word.chars as c, cIdx (cIdx)}
              <span class="char-node inline-block {CHAR_CLASS[c.status] ?? ''}"
                >{c.char}</span
              >
            {/each}

            {#each word.extraChars as extra, eIdx (eIdx)}
              <span class="char-node char-extra inline-block font-semibold"
                >{extra.char}</span
              >
            {/each}

            <!-- Zero-width baseline strut for an empty active word (Zen) -->
            {#if word.chars.length === 0 && word.extraChars.length === 0}
              <span
                class="inline-block w-0 select-none pointer-events-none"
                aria-hidden="true">&#8203;</span
              >
            {/if}
          </span>
        {/if}
      {/snippet}

      <div
        bind:this={stream}
        class={tapeEnabled
          ? "flex flex-col gap-y-4 w-full overflow-visible"
          : "flex flex-wrap items-baseline gap-y-2.5 gap-x-3.5"}
      >
        {#if tapeEnabled && tapeLines}
          {#each tapeLines as line, lineIdx (lineIdx)}
            {@const isLineActive = lineIdx === activeTapeLineIndex}
            <div
              class={[
                "flex flex-nowrap whitespace-nowrap items-baseline gap-x-3.5 w-full overflow-visible transition-opacity duration-150 ease-out",
                isLineActive
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none select-none",
              ].join(" ")}
              style="padding-left: {tapeMargin}%; padding-right: {100 - tapeMargin}%; padding-top: {TAPE_LINE_PADDING_Y}px; padding-bottom: {TAPE_LINE_PADDING_Y}px;"
              data-tape-line={lineIdx}
              data-tape-line-active={isLineActive ? "true" : "false"}
            >
              {#each words.slice(line.startIndex, line.endIndex) as word, wi (line.startIndex + wi)}
                {@render renderWord(word, line.startIndex + wi, true)}
              {/each}
            </div>
          {/each}
        {:else if !tapeEnabled}
          {#each visibleWords as word, i (windowStart + i)}
            {@render renderWord(word, windowStart + i, false)}
          {/each}
        {/if}
      </div>
    </div>
  </div>
</div>
