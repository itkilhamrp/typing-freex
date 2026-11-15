<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';

  interface Props {
    progress: number;
    exiting?: boolean;
  }

  let { progress = 0, exiting = false }: Props = $props();

  const { t } = useI18n();
  const clampedProgress = $derived(Math.min(100, Math.max(0, Math.round(progress * 100))));
</script>

<div
  class={[
    'splash-screen fixed inset-0 z-50 flex flex-col items-center justify-center bg-tt-bg text-tt-text select-none',
    exiting ? 'motion-safe:animate-splash-exit' : ''
  ].filter(Boolean).join(' ')}
  role="status"
  aria-live="polite"
  aria-label={t('splash.loading')}
>
  <!-- Halftone subtle comic backdrop pattern -->
  <div class="splash-halftone pointer-events-none absolute inset-0" aria-hidden="true"></div>

  <!-- Diagonal comic framing accents -->
  <svg
    class="pointer-events-none absolute inset-0 w-full h-full opacity-15"
    viewBox="0 0 1000 700"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <line x1="0" y1="620" x2="360" y2="700" stroke="var(--tt-primary)" stroke-width="2" />
    <line x1="680" y1="0" x2="1000" y2="110" stroke="var(--color-status-pink)" stroke-width="2" />
    <line x1="720" y1="0" x2="1000" y2="95" stroke="var(--color-status-cyan)" stroke-width="1" />
  </svg>

  <div class="relative z-10 flex flex-col items-center gap-6 px-6 max-w-md w-full text-center">
    <!-- Custom GameHouse / Kraisoft inspired Emblem & Keyboard Crest -->
    <div class="splash-icon relative motion-safe:animate-splash-icon">
      <!-- Offset comic shadow plate -->
      <div
        class="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl bg-status-pink"
        aria-hidden="true"
      ></div>
      <div
        class="relative w-24 h-24 rounded-2xl bg-tt-surface-elevated border-2 border-tt-text flex items-center justify-center shadow-sm"
      >
        <svg
          class="w-16 h-16"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <!-- Outer Keyboard Chassis tilted slightly -->
          <g transform="rotate(-10 40 40)">
            <rect
              x="8"
              y="22"
              width="64"
              height="38"
              rx="6"
              fill="var(--tt-surface-2)"
              stroke="var(--tt-text)"
              stroke-width="3"
            />
            <!-- Top Row Keys -->
            <rect x="14" y="28" width="9" height="8" rx="2" fill="var(--color-status-cyan)" stroke="var(--tt-text)" stroke-width="2" />
            <rect x="26" y="28" width="9" height="8" rx="2" fill="var(--tt-primary)" stroke="var(--tt-text)" stroke-width="2" />
            <rect x="38" y="28" width="9" height="8" rx="2" fill="var(--color-status-purple)" stroke="var(--tt-text)" stroke-width="2" />
            <rect x="50" y="28" width="16" height="8" rx="2" fill="var(--color-status-pink)" stroke="var(--tt-text)" stroke-width="2" />
            <!-- Home Row Keys -->
            <rect x="14" y="39" width="12" height="8" rx="2" fill="var(--color-status-orange)" stroke="var(--tt-text)" stroke-width="2" />
            <rect x="29" y="39" width="9" height="8" rx="2" fill="var(--tt-surface)" stroke="var(--tt-text)" stroke-width="2" />
            <rect x="41" y="39" width="9" height="8" rx="2" fill="var(--tt-surface)" stroke="var(--tt-text)" stroke-width="2" />
            <rect x="53" y="39" width="13" height="8" rx="2" fill="var(--color-status-yellow)" stroke="var(--tt-text)" stroke-width="2" />
            <!-- Spacebar Row -->
            <rect x="14" y="50" width="10" height="5" rx="1.5" fill="var(--tt-surface-3)" stroke="var(--tt-text)" stroke-width="1.75" />
            <rect x="27" y="50" width="26" height="5" rx="1.5" fill="var(--tt-primary)" stroke="var(--tt-text)" stroke-width="1.75" />
            <rect x="56" y="50" width="10" height="5" rx="1.5" fill="var(--tt-surface-3)" stroke="var(--tt-text)" stroke-width="1.75" />
          </g>
          <!-- Comic Energy Spark Accents -->
          <path d="M64 14L70 8M68 20L75 18" stroke="var(--color-status-yellow)" stroke-width="2.5" stroke-linecap="round" />
          <path d="M12 64L6 70M16 68L13 74" stroke="var(--color-status-cyan)" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </div>
    </div>

    <!-- Title & Edition Badge -->
    <div class="space-y-1.5 motion-safe:animate-splash-title">
      <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-tt-surface-2 text-tt-text-secondary text-[10px] font-mono font-bold uppercase tracking-widest">
        <span>{t('splash.engineBadge')}</span>
      </div>
      <h1 class="text-3xl sm:text-4xl font-black tracking-tight uppercase text-tt-text">
        {t('splash.title')}
      </h1>
    </div>

    <!-- Retro Arcade / GameHouse Style Loading Bar -->
    <div class="w-56 sm:w-64 space-y-2 motion-safe:animate-splash-title">
      <div class="h-2.5 w-full rounded-full bg-tt-surface-2 border border-tt-text/20 overflow-hidden p-0.5">
        <div
          class="h-full rounded-full bg-tt-primary transition-[width] duration-150 ease-out"
          style={`width: ${clampedProgress}%;`}
        ></div>
      </div>
      <div class="flex items-center justify-between text-[11px] font-mono font-bold text-tt-text-secondary uppercase tracking-wider">
        <span>{t('splash.loading')}</span>
        <span>{clampedProgress}%</span>
      </div>
    </div>
  </div>
</div>

<style>
  .splash-screen {
    contain: layout style paint;
  }

  .splash-halftone {
    background-image: radial-gradient(var(--tt-text) 1px, transparent 1px);
    background-size: 16px 16px;
    opacity: 0.04;
  }

  :global(.animate-splash-icon) {
    animation: splash-icon 320ms var(--tt-ease-default, cubic-bezier(0.16, 1, 0.3, 1)) both;
  }

  :global(.animate-splash-title) {
    animation: splash-title 360ms var(--tt-ease-default, cubic-bezier(0.16, 1, 0.3, 1)) 100ms both;
  }

  :global(.animate-splash-exit) {
    animation: splash-exit 180ms ease-out forwards;
  }

  @keyframes splash-icon {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes splash-title {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes splash-exit {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(1.02);
    }
  }
</style>
