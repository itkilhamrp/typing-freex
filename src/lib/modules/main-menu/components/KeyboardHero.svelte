<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { playMenuClick } from '#lib/shared/audio/menu-sfx.js';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';

  const { t } = useI18n();

  interface Props {
    activeKey?: string;
    onKeyClick?: (label: string) => void;
  }

  let { activeKey = '', onKeyClick }: Props = $props();

  interface GlitchBurst {
    id: number;
    tag: string;
    color: string;
    zone: number;
    rot: number;
  }

  const GLITCH_TAGS = ['THOCK!', 'CLACK!', 'ZAP!', '// 42 //', 'KRAKK!', 'POW!'];
  const GLITCH_COLORS = [
    'var(--color-status-cyan)',
    'var(--color-status-pink)',
    'var(--color-status-yellow)',
    'var(--tt-primary)',
  ];

  let isPressed = $state(false);
  let activeGlitch = $state<GlitchBurst | null>(null);
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let glitchInterval: ReturnType<typeof setInterval> | null = null;
  let glitchDismissTimer: ReturnType<typeof setTimeout> | null = null;
  let glitchCounter = 0;

  function triggerRecoil(label: string) {
    playMenuClick();
    isPressed = true;
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      isPressed = false;
      pressTimer = null;
    }, 110);
    onKeyClick?.(label);
  }

  function spawnSpiderGlitch() {
    glitchCounter += 1;
    const id = glitchCounter;
    activeGlitch = {
      id,
      tag: GLITCH_TAGS[id % GLITCH_TAGS.length]!,
      color: GLITCH_COLORS[id % GLITCH_COLORS.length]!,
      zone: (id + Math.floor(Math.random() * 2)) % 4,
      rot: -14 + Math.random() * 28,
    };

    if (glitchDismissTimer) clearTimeout(glitchDismissTimer);
    glitchDismissTimer = setTimeout(() => {
      activeGlitch = null;
      glitchDismissTimer = null;
    }, 260);
  }

  onMount(() => {
    // Relaxed, infrequent Spider-Verse glitch interval (~7.2s) - zero idle overhead
    glitchInterval = setInterval(() => {
      spawnSpiderGlitch();
    }, 7200);
  });

  onDestroy(() => {
    if (pressTimer) clearTimeout(pressTimer);
    if (glitchInterval) clearInterval(glitchInterval);
    if (glitchDismissTimer) clearTimeout(glitchDismissTimer);
  });
</script>

<div class="keyboard-hero-stage relative flex items-center justify-center select-none overflow-visible">
  <!-- Abundant, Multi-Layered Cinematic Atmospheric Fog & Mist (Zero Frame Cost, Theme-Adaptive) -->
  <div
    class="keyboard-smoke-layer pointer-events-none absolute inset-0 overflow-visible"
    aria-hidden="true"
  >
    <div class="smoke-wisp smoke-wisp-tl"></div>
    <div class="smoke-wisp smoke-wisp-br"></div>
    <div class="smoke-wisp smoke-wisp-tr"></div>
    <div class="smoke-wisp smoke-wisp-bl"></div>
    <div class="smoke-wisp smoke-wisp-left"></div>
    <div class="smoke-wisp smoke-wisp-right"></div>
    <div class="smoke-wisp smoke-wisp-top"></div>
    <div class="smoke-wisp smoke-wisp-bottom"></div>
  </div>

  <!-- Interactive Tilted Spider-Verse Keyboard Showcase -->
  <button
    type="button"
    class={[
      'keyboard-hero-tilt relative cursor-pointer bg-transparent border-0 p-0 focus:outline-none overflow-visible transition-transform duration-120',
      isPressed || activeKey ? 'keyboard-hero-recoil' : ''
    ].filter(Boolean).join(' ')}
    onclick={(e) => {
      e.stopPropagation();
      triggerRecoil('SPACE');
    }}
    aria-label={t('mainMenu.keyboardAriaLabel')}
  >
    <!-- Keyboard Image with Guaranteed Seamless Feathering Mask (Zero Hard Box Edges) -->
    <div class="keyboard-img-mask-wrapper relative">
      <img
        src="/keyboard-hero.png"
        alt={t('mainMenu.keyboardAlt')}
        class="keyboard-hero-img w-full h-auto block select-none pointer-events-none"
        decoding="async"
        draggable="false"
      />

      <!-- Theme-Adaptive Soft Radial Edge Blending Halo -->
      <div class="keyboard-soft-halo pointer-events-none absolute inset-0" aria-hidden="true"></div>
    </div>

    <!-- Infrequent Across the Spider-Verse Kinetic Comic Glitch Burst (Lightweight, 260ms Snap) -->
    {#if activeGlitch}
      <div
        class={[
          'spider-glitch-burst pointer-events-none absolute',
          activeGlitch.zone === 0
            ? 'top-[6%] left-[4%]'
            : activeGlitch.zone === 1
              ? 'top-[4%] right-[8%]'
              : activeGlitch.zone === 2
                ? 'bottom-[6%] left-[8%]'
                : 'bottom-[8%] right-[6%]'
        ].join(' ')}
        style={`--glitch-color: ${activeGlitch.color}; --glitch-rot: ${activeGlitch.rot}deg;`}
        aria-hidden="true"
      >
        <!-- Chromatic Offset Slivers -->
        <div class="glitch-slice-cyan"></div>
        <div class="glitch-slice-pink"></div>
        <!-- Comic Pop-Art Sound Effect Tag -->
        <span class="glitch-comic-tag font-mono font-black text-xs tracking-wider uppercase">
          {activeGlitch.tag}
        </span>
      </div>
    {/if}
  </button>
</div>

<style>
  .keyboard-hero-stage {
    contain: layout style;
    width: clamp(540px, 84vw, 1280px);
    max-width: 98vw;
  }

  .keyboard-smoke-layer {
    contain: layout style;
    transform: translateZ(0);
  }

  .keyboard-hero-tilt {
    width: 100%;
    transform: rotate(-12deg) translateZ(0);
    transform-origin: center center;
  }

  .keyboard-hero-recoil {
    transform: rotate(-12deg) scale(0.986) translate3d(-2px, 3px, 0);
  }

  .keyboard-img-mask-wrapper {
    contain: layout style;
    /* Safe inner-radius falloff reaching 0% opacity well before element bounds (no box edges in light/dark mode) */
    -webkit-mask-image: radial-gradient(
      ellipse 48% 44% at 50% 50%,
      #000 0%,
      #000 38%,
      rgba(0, 0, 0, 0.88) 54%,
      rgba(0, 0, 0, 0.55) 70%,
      rgba(0, 0, 0, 0.18) 84%,
      rgba(0, 0, 0, 0.02) 94%,
      transparent 100%
    );
    mask-image: radial-gradient(
      ellipse 48% 44% at 50% 50%,
      #000 0%,
      #000 38%,
      rgba(0, 0, 0, 0.88) 54%,
      rgba(0, 0, 0, 0.55) 70%,
      rgba(0, 0, 0, 0.18) 84%,
      rgba(0, 0, 0, 0.02) 94%,
      transparent 100%
    );
  }

  .keyboard-hero-img {
    max-height: min(82vh, 820px);
    object-fit: contain;
  }

  /* Seamless edge blending that respects current theme surface/background */
  .keyboard-soft-halo {
    background: radial-gradient(
      ellipse 46% 41% at 50% 50%,
      transparent 42%,
      var(--tt-bg) 98%
    );
    opacity: 0.14;
  }

  /* =========================================================================
     Cinematic Layered Smoke Wisps (8 Atmospheric Zones, Theme-Harmonized)
     ========================================================================= */
  .smoke-wisp {
    position: absolute;
    border-radius: 9999px;
    pointer-events: none;
  }

  .smoke-wisp-tl {
    left: -12%;
    top: -6%;
    width: 480px;
    height: 300px;
    background: radial-gradient(
      ellipse at center,
      rgba(50, 173, 230, 0.16) 0%,
      rgba(50, 173, 230, 0.05) 45%,
      transparent 72%
    );
  }

  .smoke-wisp-br {
    right: -12%;
    bottom: -6%;
    width: 500px;
    height: 310px;
    background: radial-gradient(
      ellipse at center,
      rgba(255, 45, 85, 0.16) 0%,
      rgba(175, 82, 222, 0.06) 45%,
      transparent 72%
    );
  }

  .smoke-wisp-tr {
    right: -4%;
    top: -8%;
    width: 420px;
    height: 260px;
    background: radial-gradient(
      ellipse at center,
      rgba(255, 204, 0, 0.13) 0%,
      rgba(50, 173, 230, 0.05) 45%,
      transparent 72%
    );
  }

  .smoke-wisp-bl {
    left: -4%;
    bottom: -6%;
    width: 430px;
    height: 270px;
    background: radial-gradient(
      ellipse at center,
      rgba(0, 199, 190, 0.14) 0%,
      rgba(255, 45, 85, 0.05) 45%,
      transparent 72%
    );
  }

  .smoke-wisp-left {
    left: -15%;
    top: 26%;
    width: 460px;
    height: 300px;
    background: radial-gradient(
      ellipse at center,
      rgba(50, 173, 230, 0.12) 0%,
      rgba(0, 199, 190, 0.04) 45%,
      transparent 72%
    );
  }

  .smoke-wisp-right {
    right: -15%;
    top: 24%;
    width: 460px;
    height: 300px;
    background: radial-gradient(
      ellipse at center,
      rgba(255, 45, 85, 0.12) 0%,
      rgba(255, 204, 0, 0.04) 45%,
      transparent 72%
    );
  }

  .smoke-wisp-top {
    left: 20%;
    top: -12%;
    width: 500px;
    height: 240px;
    background: radial-gradient(
      ellipse at center,
      rgba(255, 204, 0, 0.10) 0%,
      rgba(50, 173, 230, 0.04) 45%,
      transparent 72%
    );
  }

  .smoke-wisp-bottom {
    left: 22%;
    bottom: -12%;
    width: 500px;
    height: 240px;
    background: radial-gradient(
      ellipse at center,
      rgba(175, 82, 222, 0.10) 0%,
      rgba(50, 173, 230, 0.04) 45%,
      transparent 72%
    );
  }

  /* =========================================================================
     Across the Spider-Verse Comic Glitch Burst (Lightweight, 260ms Snap)
     ========================================================================= */
  .spider-glitch-burst {
    transform: rotate(var(--glitch-rot, 0deg));
    z-index: 25;
  }

  .glitch-slice-cyan {
    position: absolute;
    left: -14px;
    top: 6px;
    width: 82px;
    height: 4px;
    background: var(--color-status-cyan);
    box-shadow: 2px 2px 0 var(--tt-text);
    transform: rotate(-8deg);
  }

  .glitch-slice-pink {
    position: absolute;
    left: 4px;
    top: 14px;
    width: 64px;
    height: 3px;
    background: var(--color-status-pink);
    transform: rotate(6deg);
  }

  .glitch-comic-tag {
    position: relative;
    display: inline-block;
    padding: 2px 7px;
    background: #0b0d14;
    color: var(--glitch-color);
    border: 2px solid var(--glitch-color);
    box-shadow: 2.5px 2.5px 0 var(--color-status-pink);
    transform: skewX(-12deg);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: no-preference) {
    .spider-glitch-burst {
      animation: spider-glitch-pop 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
  }

  @keyframes spider-glitch-pop {
    0% {
      opacity: 0;
      transform: rotate(var(--glitch-rot, 0deg)) scale(0.65) translate3d(0, 6px, 0);
    }
    30% {
      opacity: 0.96;
      transform: rotate(var(--glitch-rot, 0deg)) scale(1.06) translate3d(-2px, -2px, 0);
    }
    75% {
      opacity: 0.9;
      transform: rotate(var(--glitch-rot, 0deg)) scale(1) translate3d(1px, 0, 0);
    }
    100% {
      opacity: 0;
      transform: rotate(var(--glitch-rot, 0deg)) scale(1.1) translate3d(0, -4px, 0);
    }
  }
</style>
