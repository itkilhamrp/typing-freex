<script lang="ts">
  /**
   * Visual Keyboard Layout (Keymap) Component (§5.12.4)
   * Orchestrates 7 Physical Style Geometries via modular layout renderers,
   * preserving CSS isolation and zero-latency imperative pulse(code, isCorrect).
   */

  import type { KeyboardLayoutDef, KeyDef } from '@/core/hand-guide';
  import {
    type KeymapMode,
    type KeymapStyle,
    type KeymapLegendStyle,
    type KeymapShowKeys,
    getGeometryInfo,
    buildKeymapRows,
    calculateRowOffset,
    resolveKeyLegend,
  } from '@/core/keymap';
  import KeymapStenoLayout from './KeymapStenoLayout.svelte';
  import KeymapAliceLayout from './KeymapAliceLayout.svelte';
  import KeymapSplitLayout from './KeymapSplitLayout.svelte';
  import KeymapStandardLayout from './KeymapStandardLayout.svelte';

  interface Props {
    layout: KeyboardLayoutDef;
    mode?: KeymapMode;
    style?: KeymapStyle;
    legendStyle?: KeymapLegendStyle;
    showKeys?: KeymapShowKeys;
    size?: number;
    activeKeyCode?: string | null;
    activeKeyCorrect?: boolean;
    nextKeyCode?: string | null;
    isShiftActive?: boolean;
  }

  let {
    layout,
    mode = 'static',
    style = 'staggered',
    legendStyle = 'lowercase',
    showKeys = 'full',
    size = 1.0,
    activeKeyCode = null,
    activeKeyCorrect = true,
    nextKeyCode = null,
    isShiftActive = false,
  }: Props = $props();

  const geom = $derived(getGeometryInfo(style));
  const normalRows = $derived(buildKeymapRows(layout, style, showKeys));
  const spaceOffsetU = $derived(calculateRowOffset(4, style, showKeys));
  const spaceLegend = $derived(
    legendStyle === 'blank'
      ? ''
      : (layout.id === 'qwerty-us' ? 'default' : (layout.name?.toLowerCase() || 'default'))
  );
  const backquoteKey = $derived(layout.keys.find((k) => k.code === 'Backquote'));
  const backslashKey = $derived(layout.keys.find((k) => k.code === 'Backslash'));
  const bracketLeftKey = $derived(layout.keys.find((k) => k.code === 'BracketLeft'));
  const quoteKey = $derived(layout.keys.find((k) => k.code === 'Quote'));

  function keyStateClass(code: string): string {
    if (mode === 'off' || mode === 'static') return '';

    if (mode === 'react' && activeKeyCode === code) {
      return activeKeyCorrect ? 'is-react-correct' : 'is-react-error';
    }

    if (mode === 'next' && nextKeyCode === code) {
      return 'is-next';
    }

    if (isShiftActive && (code === 'ShiftLeft' || code === 'ShiftRight')) {
      return 'is-shift-active';
    }

    return '';
  }

  function stenoKeyStateClass(codes: readonly string[]): string {
    for (const code of codes) {
      const cls = keyStateClass(code);
      if (cls) return cls;
    }
    return '';
  }

  function getLegend(key: KeyDef): string {
    return resolveKeyLegend(key, legendStyle, isShiftActive);
  }

  let rootEl = $state<HTMLDivElement | undefined>();
  let keyElementsCache: Record<string, HTMLElement[]> | null = null;
  let activeElements: HTMLElement[] = [];
  let releaseTimer: ReturnType<typeof setTimeout> | null = null;

  function clearActivePulse() {
    if (releaseTimer) {
      clearTimeout(releaseTimer);
      releaseTimer = null;
    }
    for (let i = 0; i < activeElements.length; i++) {
      activeElements[i]!.removeAttribute('data-react');
    }
    activeElements = [];
  }

  // Invalidate DOM cache when geometry props change
  $effect(() => {
    void layout;
    void style;
    void showKeys;
    void mode;
    keyElementsCache = null;
  });

  $effect(() => {
    return () => {
      clearActivePulse();
      keyElementsCache = null;
    };
  });

  function getTargetElements(code: string): HTMLElement[] | undefined {
    if (!keyElementsCache && rootEl) {
      const cache: Record<string, HTMLElement[]> = {};
      const addCode = (c: string, el: HTMLElement) => {
        if (!c) return;
        const list = cache[c];
        if (list) {
          if (!list.includes(el)) list.push(el);
        } else {
          cache[c] = [el];
        }
      };
      const keys = rootEl.querySelectorAll<HTMLElement>('[data-code], [data-codes]');
      for (let i = 0; i < keys.length; i++) {
        const el = keys[i]!;
        const c = el.getAttribute('data-code');
        if (c) addCode(c, el);
        const codesAttr = el.getAttribute('data-codes');
        if (codesAttr) {
          const parts = codesAttr.split(/\s+/);
          for (let j = 0; j < parts.length; j++) {
            addCode(parts[j]!, el);
          }
        }
      }
      keyElementsCache = cache;
    }
    return keyElementsCache ? keyElementsCache[code] : undefined;
  }

  /**
   * Imperative zero-latency pulse for react mode.
   * Directly sets data-react="ok" or "err" on pre-indexed DOM elements,
   * bypassing Svelte 5 reactive schedule and avoiding multi-key re-renders.
   */
  export function pulse(code: string, isCorrect: boolean) {
    clearActivePulse();
    const targets = getTargetElements(code);
    if (!targets || targets.length === 0) return;

    const attrValue = isCorrect ? 'ok' : 'err';
    for (let i = 0; i < targets.length; i++) {
      targets[i]!.setAttribute('data-react', attrValue);
    }
    activeElements = targets;

    releaseTimer = setTimeout(() => {
      for (let i = 0; i < activeElements.length; i++) {
        activeElements[i]!.removeAttribute('data-react');
      }
      activeElements = [];
      releaseTimer = null;
    }, 75);
  }
</script>

{#if mode !== 'off'}
  <div
    bind:this={rootEl}
    class="keymap-root flex flex-col items-center justify-center select-none pointer-events-none font-mono"
    style:--km-scale={size}
    style:--km-unit="calc(26px * var(--km-scale))"
    style:--km-gap="calc(3px * var(--km-scale))"
    style:--km-radius="calc(4px * var(--km-scale))"
    style:--km-font="calc(10.5px * var(--km-scale))"
    style:--km-mod-font="calc(9px * var(--km-scale))"
    aria-hidden="true"
  >
    {#if style === 'steno' || style === 'steno_matrix'}
      <KeymapStenoLayout
        {style}
        {geom}
        {legendStyle}
        {isShiftActive}
        {keyStateClass}
        {stenoKeyStateClass}
      />
    {:else if geom.isAlice}
      <KeymapAliceLayout
        {geom}
        {normalRows}
        {showKeys}
        {spaceLegend}
        {backquoteKey}
        {backslashKey}
        {keyStateClass}
        {getLegend}
      />
    {:else if style === 'split' || style === 'split_matrix'}
      <KeymapSplitLayout
        {style}
        {geom}
        {normalRows}
        {showKeys}
        {spaceLegend}
        {backquoteKey}
        {backslashKey}
        {bracketLeftKey}
        {quoteKey}
        {keyStateClass}
        {getLegend}
      />
    {:else}
      <KeymapStandardLayout
        style={style === 'matrix' ? 'matrix' : 'staggered'}
        {normalRows}
        {showKeys}
        {spaceOffsetU}
        {spaceLegend}
        {backquoteKey}
        {bracketLeftKey}
        {quoteKey}
        {keyStateClass}
        {getLegend}
      />
    {/if}
  </div>
{/if}

<style>
  .keymap-root {
    contain: layout style;
  }

  .keymap-root :global(.keymap-key) {
    position: relative;
    width: var(--km-unit);
    height: var(--km-unit);
    border-radius: var(--km-radius);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--tt-surface-2);
    border: 1px solid var(--tt-separator, rgba(120, 120, 120, 0.25));
    color: var(--tt-text-secondary);
    font-size: var(--km-font);
    line-height: 1;
    box-sizing: border-box;
    transition: background-color 40ms ease-out, color 40ms ease-out, border-color 40ms ease-out;
  }

  .keymap-root :global(.keymap-homing-bar) {
    position: absolute;
    bottom: calc(4px * var(--km-scale));
    left: 50%;
    transform: translateX(-50%);
    width: 28%;
    height: calc(1.5px * var(--km-scale));
    min-height: 1.5px;
    border-radius: 1px;
    background-color: currentColor;
    opacity: 0.6;
    pointer-events: none;
  }

  .keymap-root :global(.keymap-space-label) {
    font-size: var(--km-mod-font);
    opacity: 0.6;
    line-height: 1;
    letter-spacing: 0.02em;
    pointer-events: none;
  }

  .keymap-root :global(.keymap-key-mod) {
    font-size: var(--km-mod-font);
    opacity: 0.85;
  }

  .keymap-root :global(.keymap-space-reset) {
    position: absolute;
    bottom: calc(3px * var(--km-scale));
    left: calc(6px * var(--km-scale));
    font-size: calc(8px * var(--km-scale));
    opacity: 0.55;
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }

  /* Alice outer modifiers counter-rotated to maintain exact 0deg horizontal orientation */
  .keymap-root :global(.keymap-key-unrotated-left) {
    transform: rotate(calc(-1 * var(--km-alice-left-rot, 12deg)));
  }

  .keymap-root :global(.keymap-key-unrotated-left.is-react-correct),
  .keymap-root :global(.keymap-key-unrotated-left[data-react="ok"]),
  .keymap-root :global(.keymap-key-unrotated-left.is-react-error),
  .keymap-root :global(.keymap-key-unrotated-left[data-react="err"]) {
    transform: rotate(calc(-1 * var(--km-alice-left-rot, 12deg))) scale(0.96) !important;
  }

  .keymap-root :global(.keymap-key-unrotated-right) {
    transform: rotate(calc(-1 * var(--km-alice-right-rot, -12deg)));
  }

  .keymap-root :global(.keymap-key-unrotated-right.is-react-correct),
  .keymap-root :global(.keymap-key-unrotated-right[data-react="ok"]),
  .keymap-root :global(.keymap-key-unrotated-right.is-react-error),
  .keymap-root :global(.keymap-key-unrotated-right[data-react="err"]) {
    transform: rotate(calc(-1 * var(--km-alice-right-rot, -12deg))) scale(0.96) !important;
  }

  /* Scoped state classes with guaranteed precedence (GPU-accelerated, zero-lag, no will-change) */
  .keymap-root :global(.keymap-key.is-react-correct),
  .keymap-root :global(.keymap-key[data-react="ok"]) {
    background-color: var(--color-ios-green, #34c759) !important;
    border-color: rgba(52, 199, 89, 0.9) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    transform: scale(0.96);
    outline: 2px solid rgba(52, 199, 89, 0.45);
  }

  .keymap-root :global(.keymap-key.is-react-error),
  .keymap-root :global(.keymap-key[data-react="err"]) {
    background-color: var(--color-ios-red, #ff3b30) !important;
    border-color: rgba(255, 59, 48, 0.9) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    transform: scale(0.96);
    outline: 2px solid rgba(255, 59, 48, 0.45);
  }

  .keymap-root :global(.keymap-key.is-next) {
    background-color: var(--tt-primary, var(--color-tt-primary)) !important;
    border-color: var(--tt-primary, var(--color-tt-primary)) !important;
    color: var(--tt-bg, #111111) !important;
    font-weight: 700 !important;
    outline: 2px solid var(--tt-primary, var(--color-tt-primary));
  }

  .keymap-root :global(.keymap-key.is-shift-active) {
    background-color: var(--tt-surface-3, rgba(140, 140, 140, 0.3)) !important;
    border-color: var(--tt-primary, var(--color-tt-primary)) !important;
    color: var(--tt-text, #ffffff) !important;
  }
</style>
