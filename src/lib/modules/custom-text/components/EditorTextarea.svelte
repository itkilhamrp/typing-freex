<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { TextT as PhTextT } from 'phosphor-svelte';
  import { i18n } from '#lib/shared/stores/i18n.svelte.js';
  import {
    readMirrorLineHeights,
    readTextareaMetrics,
  } from '../logic/gutter-dom-reader';
  import {
    calculateGutterLinesFromHeights,
    calculateMirrorWidth,
    type GutterItem,
  } from '../logic/gutter-measurer';

  interface Props {
    body: string;
    lineCount: number;
    charCount: number;
    maxChars?: number;
  }

  let {
    body = $bindable(),
    lineCount,
    charCount,
    maxChars = 50000,
  }: Props = $props();

  const t = i18n.t;

  let textareaEl = $state<HTMLTextAreaElement | null>(null);
  let gutterEl = $state<HTMLDivElement | null>(null);
  let mirrorEl = $state<HTMLDivElement | null>(null);
  let mirrorWidth = $state(500);
  let activeLineNumber = $state(1);
  let resizeObserver: ResizeObserver | null = null;
  let updateScheduled = false;

  let gutterLines = $state<GutterItem[]>([
    { lineNum: 1, isWrap: false },
  ]);

  let logicalLines = $derived(body.length > 0 ? body.split('\n') : ['']);

  function syncScroll() {
    if (textareaEl && gutterEl) {
      gutterEl.scrollTop = textareaEl.scrollTop;
    }
  }

  function handleGutterWheel(e: WheelEvent) {
    if (textareaEl) {
      textareaEl.scrollTop += e.deltaY;
    }
  }

  function updateCursorLine() {
    if (!textareaEl) return;
    const pos = textareaEl.selectionStart ?? 0;
    const before = body.slice(0, pos);
    let line = 1;
    for (let i = 0; i < before.length; i++) {
      if (before.charCodeAt(i) === 10) line++;
    }
    activeLineNumber = line;
  }

  function scheduleGutterUpdate() {
    if (updateScheduled) return;
    updateScheduled = true;
    requestAnimationFrame(() => {
      updateScheduled = false;
      measureAndSync();
    });
  }

  function measureAndSync() {
    if (!textareaEl) return;
    const metrics = readTextareaMetrics(textareaEl);
    const w = metrics
      ? calculateMirrorWidth(metrics.clientWidth, metrics.paddingLeft, metrics.paddingRight)
      : 500;
    if (w > 0 && Math.abs(w - mirrorWidth) > 1) {
      mirrorWidth = w;
      requestAnimationFrame(doMeasure);
    } else {
      doMeasure();
    }
  }

  function doMeasure() {
    const heights = readMirrorLineHeights(mirrorEl);
    gutterLines = calculateGutterLinesFromHeights(heights, 24);
  }

  $effect(() => {
    // Re-measure whenever body changes or mirrorWidth changes
    void body;
    void mirrorWidth;
    scheduleGutterUpdate();
  });

  function handleTextareaInput() {
    syncScroll();
    updateCursorLine();
    scheduleGutterUpdate();
  }

  onMount(() => {
    if (textareaEl) {
      resizeObserver = new ResizeObserver(() => {
        measureAndSync();
        syncScroll();
      });
      resizeObserver.observe(textareaEl);
    }

    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        scheduleGutterUpdate();
      });
    }

    scheduleGutterUpdate();
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  });
</script>

<div class="space-y-2 [contain:layout_style]">
  <div class="flex items-center justify-between text-xs text-tt-text-secondary font-medium px-1">
    <span class="flex items-center gap-1.5">
      <PhTextT class="w-3.5 h-3.5 text-tt-text-secondary" />
      <span>{t('customText.bodyLabel')}</span>
    </span>
    <span
      class="font-mono text-3xs px-2 py-0.5 rounded-md bg-tt-surface-2 border border-tt-separator {charCount > maxChars - 1000 ? 'text-ios-red font-bold' : 'text-tt-text-secondary'}"
    >
      {t('customText.charsLimit', { current: charCount.toLocaleString(), max: maxChars.toLocaleString() })}
    </span>
  </div>

  <div class="relative flex h-[520px] sm:h-[560px] rounded-2xl bg-tt-surface border border-tt-separator overflow-hidden shadow-inner focus-within:border-tt-primary focus-within:ring-2 focus-within:ring-tt-primary/15 transition-all">
    <!-- Line Number Gutter -->
    <div
      bind:this={gutterEl}
      class="shrink-0 pt-4 pb-4 bg-tt-surface-2/60 border-r border-tt-separator/40 select-none overflow-hidden h-full"
      aria-hidden="true"
      style="min-width: {Math.max(3.25, (String(lineCount).length + 1.5) * 0.65)}rem;"
      onwheel={handleGutterWheel}
    >
      {#each gutterLines as item, i (i)}
        <div
          class="flex items-center justify-end px-2.5 text-xs font-mono select-none tabular-nums {item.lineNum === activeLineNumber && !item.isWrap
            ? 'bg-tt-surface-3/80 dark:bg-white/10 text-tt-text font-bold'
            : item.lineNum === activeLineNumber && item.isWrap
              ? 'bg-tt-surface-3/30 dark:bg-white/5 text-tt-text-secondary/50'
              : 'text-tt-text-secondary/60'}"
          style="height: 24px; line-height: 24px;"
        >
          {#if item.isWrap}
            <span class="text-tt-text-secondary/40 text-[11px] leading-none select-none font-mono">↳</span>
          {:else}
            <span>{item.lineNum}</span>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Textarea -->
    <textarea
      bind:value={body}
      bind:this={textareaEl}
      spellcheck="false"
      autocapitalize="off"
      placeholder={t('customText.bodyPlaceholder')}
      class="flex-1 p-4 text-sm font-mono leading-6 focus:outline-none resize-none text-tt-text placeholder:text-tt-text-tertiary bg-transparent h-full overflow-y-auto"
      style="line-height: 24px; word-break: break-word; overflow-wrap: break-word;"
      oninput={handleTextareaInput}
      onscroll={syncScroll}
      onclick={updateCursorLine}
      onkeyup={updateCursorLine}
      onselect={updateCursorLine}
    ></textarea>
  </div>

  <!-- Hidden Mirror Element for exact line-wrap measurement -->
  <div
    bind:this={mirrorEl}
    aria-hidden="true"
    class="pointer-events-none opacity-0 invisible fixed -left-[9999px] top-0 overflow-hidden font-mono text-sm leading-6"
    style="width: {mirrorWidth}px; box-sizing: content-box; line-height: 24px; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap;"
  >
    {#each logicalLines as line, idx (idx)}
      <div style="min-height: 24px; line-height: 24px; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap;">
        {line.length > 0 ? line : '\u200B'}
      </div>
    {/each}
  </div>
</div>

