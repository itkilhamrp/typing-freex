<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg';
    class?: string;
  }

  let { size = 'lg', class: className = '' }: Props = $props();

  const sizeClasses = $derived(
    size === 'sm'
      ? 'w-[250px] sm:w-[310px]'
      : size === 'md'
        ? 'w-[330px] sm:w-[430px]'
        : 'w-[360px] sm:w-[500px] md:w-[590px] lg:w-[680px]'
  );
</script>

<div
  class={['graffiti-title-root relative select-none inline-block', sizeClasses, className]
    .filter(Boolean)
    .join(' ')}
  role="heading"
  aria-level="1"
  aria-label="Typing FreeX"
>
  <svg
    class="w-full h-auto overflow-visible"
    viewBox="0 0 580 245"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <!-- Street-Art Halftone Dot Pattern inside Calligraphy Strokes -->
      <pattern id="gf-halftone-dots" width="8" height="8" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.6" fill="var(--tt-bg)" fill-opacity="0.3" />
      </pattern>

      <!-- Vibrant Spider-Verse Street Gradient for FREEX -->
      <linearGradient id="gf-freex-grad" x1="0%" y1="0%" x2="100%" y2="25%">
        <stop offset="0%" stop-color="var(--color-status-cyan)" />
        <stop offset="48%" stop-color="var(--tt-primary)" />
        <stop offset="100%" stop-color="var(--color-status-pink)" />
      </linearGradient>

      <!-- Calligraphic Brush Slash Gradient -->
      <linearGradient id="gf-slash-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="var(--color-status-pink)" />
        <stop offset="55%" stop-color="var(--color-status-orange)" />
        <stop offset="100%" stop-color="var(--color-status-yellow)" />
      </linearGradient>
    </defs>

    <!-- 1. Street-Art Crown & Animated Spider-Verse Glitch Sparks (Top-Left) -->
    <g class="graffiti-crown-spark" transform="translate(18, 6) rotate(-8)">
      <path
        d="M4 24 L0 6 L14 15 L24 2 L34 15 L48 6 L44 24 Z"
        fill="var(--color-status-yellow)"
        stroke="var(--tt-text)"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
      <circle cx="0" cy="2" r="2.5" fill="var(--color-status-pink)" />
      <circle cx="24" cy="-2" r="2.8" fill="var(--color-status-cyan)" />
      <circle cx="49" cy="2" r="2.5" fill="var(--color-status-pink)" />
    </g>

    <!-- Spider-Verse Dimensional Glitch Bars Behind Title -->
    <g class="graffiti-glitch-bars">
      <rect x="380" y="22" width="110" height="6" rx="1" fill="var(--color-status-cyan)" opacity="0.85" />
      <rect x="425" y="32" width="78" height="4" rx="1" fill="var(--color-status-pink)" opacity="0.9" />
      <rect x="8" y="138" width="68" height="5" rx="1" fill="var(--color-status-yellow)" opacity="0.85" />
    </g>

    <!-- 2. Background Graffiti Tag Slash & Ink Splatter Dots -->
    <path
      d="M12 110 Q195 88 535 72 L522 86 Q200 102 18 118 Z"
      fill="var(--color-status-pink)"
      opacity="0.9"
    />
    <circle cx="542" cy="52" r="5" fill="var(--color-status-cyan)" />
    <circle cx="556" cy="66" r="3" fill="var(--color-status-pink)" />
    <circle cx="512" cy="36" r="3.5" fill="var(--color-status-yellow)" />

    <!-- ============================================================
         ROW 1: "TYPING" — Hand-Style Chisel Calligraphy + 3D Extrude
         ============================================================ -->
    <g transform="translate(16, 100) rotate(-4) skewX(-14)">
      <!-- Chromatic Cyan Offset Layer (Animated Spider-Verse shift) -->
      <text
        x="-5"
        y="-3"
        class="graffiti-word-typing graffiti-chromatic-cyan"
        fill="var(--color-status-cyan)"
        stroke="var(--color-status-cyan)"
        stroke-width="11"
        stroke-linejoin="round"
        opacity="0.88"
      >
        TYPING
      </text>

      <!-- Deep 3D Extruded Block Shadow -->
      <text
        x="7"
        y="8"
        class="graffiti-word-typing graffiti-chromatic-pink"
        fill="var(--color-status-pink)"
        stroke="var(--tt-text)"
        stroke-width="13"
        stroke-linejoin="round"
      >
        TYPING
      </text>

      <!-- Main Calligraphic Lettering Body -->
      <text
        x="0"
        y="0"
        class="graffiti-word-typing"
        fill="var(--tt-text)"
        stroke="var(--tt-bg)"
        stroke-width="3.5"
        paint-order="stroke fill"
      >
        TYPING
      </text>

      <!-- Inner Calligraphic Chisel Highlight Cuts -->
      <path
        d="M14 -56 L48 -56 M90 -56 L108 -28 M156 -56 L156 -12 M220 -56 L220 -12 M262 -56 L262 -12 M348 -56 L378 -56"
        stroke="var(--tt-bg)"
        stroke-width="2.8"
        stroke-linecap="round"
        opacity="0.6"
      />
    </g>

    <!-- ============================================================
         ROW 2: "FREEX" — Wildstyle Calligraphic Street-Art + X-Slash
         ============================================================ -->
    <g transform="translate(24, 198) rotate(-5) skewX(-16)">
      <!-- Cyan Chromatic Shift -->
      <text
        x="-6"
        y="-4"
        class="graffiti-word-freex graffiti-chromatic-cyan"
        fill="none"
        stroke="var(--color-status-cyan)"
        stroke-width="15"
        stroke-linejoin="round"
      >
        FREEX
      </text>

      <!-- 3D Hard Offset Shadow -->
      <text
        x="9"
        y="10"
        class="graffiti-word-freex"
        fill="var(--tt-text)"
        stroke="var(--tt-text)"
        stroke-width="15"
        stroke-linejoin="round"
      >
        FREEX
      </text>

      <!-- Main Vibrant Gradient Fill -->
      <text
        x="0"
        y="0"
        class="graffiti-word-freex"
        fill="url(#gf-freex-grad)"
        stroke="var(--tt-text)"
        stroke-width="4.5"
        stroke-linejoin="round"
        paint-order="stroke fill"
      >
        FREEX
      </text>

      <!-- Halftone Pattern Overlay on FREEX -->
      <text
        x="0"
        y="0"
        class="graffiti-word-freex"
        fill="url(#gf-halftone-dots)"
      >
        FREEX
      </text>

      <!-- Custom Calligraphic X-Cross Razor Flourish over the final 'X' -->
      <path
        class="graffiti-x-slash"
        d="M380 -80 C422 -46, 460 -12, 506 20"
        stroke="var(--color-status-yellow)"
        stroke-width="6.5"
        stroke-linecap="round"
      />
      <path
        class="graffiti-x-slash"
        d="M496 -84 C454 -45, 414 -10, 370 24"
        stroke="var(--color-status-pink)"
        stroke-width="6.5"
        stroke-linecap="round"
      />
    </g>

    <!-- ============================================================
         3. Calligraphic Underline Swash & Graffiti Ink Drips
         ============================================================ -->
    <g>
      <!-- Shadow of Underline Swash -->
      <path
        d="M22 220 C170 190, 355 178, 545 168 C445 188, 228 208, 48 230 Z"
        fill="var(--tt-text)"
        transform="translate(4, 5)"
      />
      <!-- Main Calligraphic Brush Swash -->
      <path
        d="M22 220 C170 190, 355 178, 545 168 C445 188, 228 208, 48 230 Z"
        fill="url(#gf-slash-grad)"
        stroke="var(--tt-text)"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
      <!-- Graffiti Vertical Ink Drips -->
      <path
        d="M98 218 L98 234 A3.5 3.5 0 0 0 105 234 L105 216 Z"
        fill="var(--color-status-pink)"
      />
      <path
        d="M254 202 L254 225 A4 4 0 0 0 262 225 L262 201 Z"
        fill="var(--color-status-orange)"
      />
      <path
        d="M424 185 L424 204 A3 3 0 0 0 430 204 L430 184 Z"
        fill="var(--color-status-yellow)"
      />
      <circle cx="101.5" cy="240" r="2.5" fill="var(--color-status-pink)" />
      <circle cx="258" cy="232" r="3" fill="var(--color-status-orange)" />
    </g>
  </svg>
</div>

<style>
  .graffiti-title-root {
    contain: layout style paint;
  }

  .graffiti-word-typing {
    font-family: 'Impact', 'Arial Black', 'Franklin Gothic Heavy', var(--tt-font-display), sans-serif;
    font-size: 80px;
    font-weight: 900;
    letter-spacing: 0.06em;
    font-style: italic;
  }

  .graffiti-word-freex {
    font-family: 'Impact', 'Arial Black', 'Franklin Gothic Heavy', var(--tt-font-display), sans-serif;
    font-size: 96px;
    font-weight: 900;
    letter-spacing: 0.07em;
    font-style: italic;
  }

  @media (prefers-reduced-motion: no-preference) {
    .graffiti-title-root {
      animation: graffiti-title-enter 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* Calmer, minimal chromatic Spider-Verse tick (static 96% of the cycle, snaps briefly for 180ms) */
    .graffiti-chromatic-cyan {
      animation: spider-subtle-cyan 5.8s steps(2, end) infinite;
    }

    .graffiti-chromatic-pink {
      animation: spider-subtle-pink 5.8s steps(2, end) infinite;
    }
  }

  @keyframes graffiti-title-enter {
    from {
      opacity: 0;
      transform: translate3d(0, -6px, 0) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  @keyframes spider-subtle-cyan {
    0%, 93%, 100% {
      transform: translate3d(0, 0, 0);
    }
    95% {
      transform: translate3d(-2.5px, 1px, 0);
    }
    97% {
      transform: translate3d(1.5px, -1px, 0);
    }
  }

  @keyframes spider-subtle-pink {
    0%, 93%, 100% {
      transform: translate3d(0, 0, 0);
    }
    95% {
      transform: translate3d(2.5px, -1px, 0);
    }
    97% {
      transform: translate3d(-1.5px, 1px, 0);
    }
  }
</style>
