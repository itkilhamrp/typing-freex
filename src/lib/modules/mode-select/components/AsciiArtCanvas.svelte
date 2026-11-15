<script lang="ts">
  import { ART, HUD, COLS, ROWS, type AsciiMode } from "./ascii-art-data";

  interface Props {
    mode: AsciiMode;
  }

  let { mode }: Props = $props();

  const art = $derived(ART[mode]);
  const hud = $derived(HUD[mode]);
</script>

<div
  class="ascii-art-wrap ascii-{mode}"
  style="--ascii-cols: {COLS}; --ascii-rows: {ROWS};"
  aria-hidden="true"
>
  <div class="ascii-fit">
    <div class="ascii-stage">
      <pre class="ascii-pre ascii-layer ascii-dim">{art.dim}</pre>
      <pre class="ascii-pre ascii-layer ascii-mid">{art.mid}</pre>
      <pre class="ascii-pre ascii-layer ascii-hot">{art.hot}</pre>
      <pre class="ascii-pre ascii-layer ascii-acc">{art.acc}</pre>
    </div>
  </div>

  <!-- Per-mode ambient effects (pure CSS) -->
  {#if mode === "classic" || mode === "arena"}
    <div class="ascii-scanline"></div>
  {:else if mode === "learning"}
    <div class="ascii-float-glow"></div>
  {:else}
    <div class="ascii-pulse-ring"></div>
  {/if}

  <!-- Telemetry HUD -->
  <div class="ascii-hud ascii-hud-top">
    <span class="ascii-dot"></span>
    <span>{hud.tag}</span>
    {#if mode === "classic" || mode === "arena"}
      <span class="ascii-cursor">_</span>
    {/if}
  </div>
  <div class="ascii-hud ascii-hud-bottom">
    <span>{hud.left}</span>
    <span>{hud.right}</span>
  </div>
</div>

<style>
  /* ─── Base wrapper ─────────────────────────────────────── */
  .ascii-art-wrap {
    --ascii-c: var(--tt-primary, #007aff);
    --ascii-a: var(--color-ios-orange, #ff9f0a);
    position: relative;
    width: 100%;
    height: 100%;
    aspect-ratio: 128 / 70;
    overflow: hidden;
    border-radius: 14px;
    color: var(--ascii-c);
    contain: paint layout;
  }

  /* Fits the whole grid inside the card (contain), centred */
  .ascii-fit {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    container-type: size;
    contain: strict;
  }

  .ascii-stage {
    position: relative;
    flex: none;
    font-size: 0.34rem;
    font-size: min(
      calc(100cqw / (var(--ascii-cols) * 0.61)),
      calc(100cqh / var(--ascii-rows))
    );
    line-height: 1;
    width: calc(var(--ascii-cols) * 1ch);
    height: calc(var(--ascii-rows) * 1em);
    transform: translateZ(0);
  }

  .ascii-pre {
    font-family:
      "OTTE Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      "Liberation Mono", "DejaVu Sans Mono", monospace;
    font-size: inherit;
    line-height: 1;
    letter-spacing: 0;
    white-space: pre;
    margin: 0;
    padding: 0;
    font-weight: 500;
    user-select: none;
    text-shadow: none !important;
    filter: none !important;
  }

  .ascii-layer {
    position: absolute;
    top: 0;
    left: 0;
    color: var(--ascii-c);
    transform: translateZ(0);
  }

  .ascii-dim {
    opacity: 0.38;
  }

  .ascii-mid {
    opacity: 0.72;
  }

  .ascii-hot {
    opacity: 1;
    font-weight: 700;
  }

  .ascii-acc {
    color: var(--ascii-a);
    opacity: 1;
    font-weight: 800;
  }

  /* ─── HUD ─────────────────────────────────────────────── */
  .ascii-hud {
    position: absolute;
    left: 0.7rem;
    right: 0.7rem;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family:
      "OTTE Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      monospace;
    font-size: 0.56rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--ascii-c);
    opacity: 0.85;
    pointer-events: none;
    user-select: none;
    text-shadow: none !important;
  }

  .ascii-hud-top {
    top: 0.6rem;
  }

  .ascii-hud-bottom {
    bottom: 0.6rem;
    justify-content: space-between;
    opacity: 0.6;
  }

  .ascii-dot {
    width: 0.38rem;
    height: 0.38rem;
    border-radius: 50%;
    background: var(--ascii-a);
    flex: none;
    opacity: 0.9;
  }

  /* ─── Classic & Arena ─────────────────────────────────── */
  :global(.ascii-classic),
  :global(.ascii-arena) {
    --ascii-c: var(--tt-primary, #007aff);
    --ascii-a: var(--color-ios-orange, #ff9f0a);
  }

  .ascii-cursor {
    display: inline-block;
    font-weight: 800;
    animation: ascii-cursor-blink 0.9s step-end infinite;
  }

  @keyframes ascii-cursor-blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }

  .ascii-scanline {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(0, 122, 255, 0.1) 50%,
      transparent 100%
    );
    background-size: 100% 12%;
    background-repeat: no-repeat;
    animation: ascii-scanline-sweep 6s linear infinite;
    pointer-events: none;
    z-index: 2;
    border-radius: inherit;
  }

  @keyframes ascii-scanline-sweep {
    0% {
      transform: translateY(-100%);
    }
    100% {
      transform: translateY(100%);
    }
  }

  /* ─── Learning ────────────────────────────────────────── */
  :global(.ascii-learning) {
    --ascii-c: var(--color-ios-indigo, #5856d6);
    --ascii-a: var(--color-ios-blue, #007aff);
  }

  .ascii-float-glow {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 8px;
    border-radius: 50%;
    background: radial-gradient(
      ellipse at center,
      rgba(88, 86, 214, 0.35) 0%,
      transparent 70%
    );
    z-index: 0;
    pointer-events: none;
  }

  /* ─── Games ───────────────────────────────────────────── */
  :global(.ascii-games) {
    --ascii-c: var(--color-ios-green, #34c759);
    --ascii-a: var(--color-ios-pink, #ff375f);
  }

  .ascii-pulse-ring {
    position: absolute;
    inset: 6px;
    border: 1.5px solid rgba(52, 199, 89, 0.25);
    border-radius: 10px;
    pointer-events: none;
    z-index: 0;
  }

  /* ─── Reduced motion ─────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .ascii-stage,
    .ascii-dim,
    .ascii-mid,
    .ascii-hot,
    .ascii-acc,
    .ascii-dot,
    .ascii-cursor,
    .ascii-scanline,
    .ascii-float-glow,
    .ascii-pulse-ring {
      animation: none !important;
      transform: none !important;
    }

    .ascii-float-glow {
      transform: translateX(-50%) !important;
    }

    .ascii-dim {
      opacity: 0.38;
    }
    .ascii-mid {
      opacity: 0.72;
    }
    .ascii-hot,
    .ascii-acc {
      opacity: 1;
    }
  }
</style>
