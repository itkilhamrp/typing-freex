<!--
  @file CardCrystalAccents.svelte
  @description Procedural 3D crystalline facet accents for personal best evolution cards.
  Inspired by EA FC Mobile TOTS (Team of the Season) and TOTY (Team of the Year) gemstone card frames.
  Renders authentic angular mineral facets that PROTRUDE OUT of the card frame into 3D space,
  with specular ridge lighting, dynamic mode variations, and tier progression (Tiers 1-10).
  Zero external assets, zero backdrop-filter blur, 60 FPS GPU-accelerated.
-->
<script lang="ts">
  interface Props {
    difficulty: string | null | undefined;
    tier: number; // 0 to 10
  }

  const { difficulty, tier }: Props = $props();

  const clampedTier = $derived(Math.max(0, Math.min(10, tier ?? 0)));

  const mode = $derived(
    difficulty === "master"
      ? "master"
      : difficulty === "expert"
        ? "expert"
        : "normal",
  );

  // Distinct chromatic mineral palette per mode
  const pal = $derived.by(() => {
    if (mode === "master") {
      return {
        light: "#fca5a5",
        mid: "#ef4444",
        deep: "#991b1b",
        dark: "#450a0a",
        gold: "#fde047",
        specular: "#ffffff",
        glow: "rgba(239, 68, 68, 0.45)",
      };
    }
    if (mode === "expert") {
      return {
        light: "#fde68a",
        mid: "#f59e0b",
        deep: "#b45309",
        dark: "#78350f",
        gold: "#fef08a",
        specular: "#ffffff",
        glow: "rgba(245, 158, 11, 0.45)",
      };
    }
    return {
      light: "#a5f3fc",
      mid: "#06b6d4",
      deep: "#0d9488",
      dark: "#134e4a",
      gold: "#cffafe",
      specular: "#ffffff",
      glow: "rgba(6, 182, 212, 0.45)",
    };
  });
</script>

{#if clampedTier >= 1}
<div
  class="pointer-events-none absolute inset-0 w-full h-full overflow-visible select-none z-20"
  aria-hidden="true"
>
  <svg
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    class="w-full h-full overflow-visible"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <!-- Linear Gradients for Top Facets (Light / Highlight Face) -->
      <linearGradient id="c-top-{mode}-{clampedTier}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color={pal.specular} stop-opacity="0.9" />
        <stop offset="35%" stop-color={pal.light} />
        <stop offset="100%" stop-color={pal.mid} />
      </linearGradient>

      <!-- Linear Gradients for Mid / Main Facets -->
      <linearGradient id="c-mid-{mode}-{clampedTier}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color={pal.mid} />
        <stop offset="100%" stop-color={pal.deep} />
      </linearGradient>

      <!-- Linear Gradients for Shadow Facets -->
      <linearGradient id="c-shd-{mode}-{clampedTier}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color={pal.deep} />
        <stop offset="100%" stop-color={pal.dark} />
      </linearGradient>
    </defs>

    <!-- ========================================================================= -->
    <!-- 1. TOP-RIGHT PROTRUDING CRYSTAL HORN (Spikes OUT of the top-right frame)   -->
    <!-- ========================================================================= -->

    <!-- Primary Top-Right Protruding Shard (Extends OUT to x: 105, y: -4) -->
    <polygon
      points="92,0 105,-4 98,9"
      fill="url(#c-top-{mode}-{clampedTier})"
    />
    <!-- Shadow Plane -->
    <polygon
      points="105,-4 102,11 98,9"
      fill="url(#c-shd-{mode}-{clampedTier})"
    />
    <!-- Specular Ridge Line to Horn Tip -->
    <line
      x1="92" y1="0" x2="105" y2="-4"
      stroke={pal.specular}
      stroke-width="0.4"
      stroke-linecap="round"
      stroke-opacity="0.95"
    />

    <!-- Tier >= 2: Secondary Outer Facet Shard -->
    {#if clampedTier >= 2}
      <polygon
        points="86,0 92,0 98,9 90,6"
        fill="url(#c-mid-{mode}-{clampedTier})"
      />
      <line
        x1="86" y1="0" x2="90" y2="6"
        stroke={pal.light}
        stroke-width="0.3"
        stroke-opacity="0.8"
      />
    {/if}

    <!-- Tier >= 4: Tertiary Outer Blade Horn (Juts out to x: 106, y: 15) -->
    {#if clampedTier >= 4}
      <polygon
        points="100,10 106,15 99,18"
        fill="url(#c-top-{mode}-{clampedTier})"
      />
      <polygon
        points="106,15 101,21 99,18"
        fill="url(#c-shd-{mode}-{clampedTier})"
      />
      <line
        x1="98" y1="9" x2="106" y2="15"
        stroke={pal.gold}
        stroke-width="0.35"
        stroke-opacity="0.9"
      />
    {/if}

    <!-- Tier >= 6: Quaternary Apex Crystal Spike (Juts out to x: 107, y: -7) -->
    {#if clampedTier >= 6}
      <polygon
        points="97,-2 107,-7 103,1"
        fill="url(#c-top-{mode}-{clampedTier})"
      />
      <polygon
        points="107,-7 106,4 103,1"
        fill="url(#c-shd-{mode}-{clampedTier})"
      />
      <line
        x1="97" y1="-2" x2="107" y2="-7"
        stroke={pal.specular}
        stroke-width="0.4"
      />
    {/if}

    <!-- ========================================================================= -->
    <!-- 2. BOTTOM-SPEAR & BOTTOM-LEFT CRYSTALS (Protrudes down to y: 107)         -->
    <!-- ========================================================================= -->

    {#if clampedTier >= 2}
      <!-- Bottom-Left Angle Shard: Protrudes OUT to x: -3, y: 103 -->
      <polygon
        points="0,91 6,95 -3,103"
        fill="url(#c-mid-{mode}-{clampedTier})"
      />
      <polygon
        points="6,95 11,100 -3,103"
        fill="url(#c-shd-{mode}-{clampedTier})"
      />
      <line
        x1="0" y1="91" x2="-3" y2="103"
        stroke={pal.light}
        stroke-width="0.3"
        stroke-opacity="0.8"
      />
    {/if}

    {#if clampedTier >= 3}
      <!-- Bottom Spear Center Crystal: Juts DOWN OUT to y: 107 -->
      <polygon
        points="46,100 50,107 50,96"
        fill="url(#c-top-{mode}-{clampedTier})"
      />
      <polygon
        points="50,107 54,100 50,96"
        fill="url(#c-shd-{mode}-{clampedTier})"
      />
      <line
        x1="50" y1="96" x2="50" y2="107"
        stroke={pal.specular}
        stroke-width="0.4"
        stroke-opacity="0.95"
      />
    {/if}

    {#if clampedTier >= 5}
      <!-- Bottom-Right Flank Spike: Juts OUT to x: 105, y: 102 -->
      <polygon
        points="95,92 105,102 98,100"
        fill="url(#c-mid-{mode}-{clampedTier})"
      />
      <line
        x1="95" y1="92" x2="105" y2="102"
        stroke={pal.gold}
        stroke-width="0.3"
        stroke-opacity="0.85"
      />
    {/if}

    <!-- ========================================================================= -->
    <!-- 3. TOP-LEFT & CROWN PROTRUDING SHARDS (Juts OUT past top & left edge)     -->
    <!-- ========================================================================= -->

    {#if clampedTier >= 3}
      <!-- Top-Left Chamfer Shard: Juts OUT to x: -4, y: -4 -->
      <polygon
        points="0,0 8,0 -4,-4"
        fill="url(#c-top-{mode}-{clampedTier})"
      />
      <polygon
        points="0,0 -4,-4 0,8"
        fill="url(#c-shd-{mode}-{clampedTier})"
      />
      <line
        x1="8" y1="0" x2="-4" y2="-4"
        stroke={pal.specular}
        stroke-width="0.35"
        stroke-opacity="0.9"
      />
    {/if}

    {#if clampedTier >= 7}
      <!-- Apex Crown Prismatic Spear (Juts UP ABOVE the card to y: -8) -->
      <polygon
        points="48,0 50,-8 50,2"
        fill="url(#c-top-{mode}-{clampedTier})"
      />
      <polygon
        points="50,-8 52,0 50,2"
        fill="url(#c-mid-{mode}-{clampedTier})"
      />
      <line
        x1="50" y1="2" x2="50" y2="-8"
        stroke={pal.gold}
        stroke-width="0.4"
        stroke-opacity="0.95"
      />
    {/if}

    <!-- ========================================================================= -->
    <!-- 4. APEX TOTS/TOTY DIVINE WINGS (Tiers 8, 9, 10 - Juts OUT laterally)      -->
    <!-- ========================================================================= -->

    {#if clampedTier >= 8}
      <!-- Left Waist Diamond Wing (Juts OUT to x: -6) -->
      <polygon
        points="0,48 -6,52 0,55"
        fill="url(#c-top-{mode}-{clampedTier})"
      />
      <polygon
        points="-6,52 0,55 0,58"
        fill="url(#c-shd-{mode}-{clampedTier})"
      />
      <!-- Right Waist Diamond Wing (Juts OUT to x: 106) -->
      <polygon
        points="100,48 106,52 100,55"
        fill="url(#c-mid-{mode}-{clampedTier})"
      />
    {/if}

    {#if clampedTier >= 9}
      <!-- Crown Wing Shards (Juts UP to y: -6) -->
      <polygon
        points="43,0 46,-6 47,0"
        fill="url(#c-mid-{mode}-{clampedTier})"
      />
      <polygon
        points="53,0 54,-6 57,0"
        fill="url(#c-mid-{mode}-{clampedTier})"
      />
    {/if}

    {#if clampedTier >= 10}
      <!-- Tier 10 Ultimate Divine Prism Array (Dramatic 3D TOTY/TOTS Horns) -->
      <polygon
        points="101,23 108,26 100,30"
        fill="url(#c-top-{mode}-{clampedTier})"
      />
      <polygon
        points="-1,22 -7,25 0,28"
        fill="url(#c-top-{mode}-{clampedTier})"
      />
      <polygon
        points="41,100 45,108 45,99"
        fill="url(#c-mid-{mode}-{clampedTier})"
      />
      <polygon
        points="55,100 55,108 59,100"
        fill="url(#c-mid-{mode}-{clampedTier})"
      />
    {/if}
  </svg>

  <!-- ========================================================================= -->
  <!-- 5. LIGHTWEIGHT 60 FPS CSS SPECULAR GLINT SPARKS (At Protruding Tips)     -->
  <!-- ========================================================================= -->

  <!-- Top-Right Horn Glint Spark (Protrudes outside the card) -->
  <div
    class="absolute -top-2.5 -right-2 w-3 h-3 pointer-events-none toty-glint-spark"
    style="--glint-delay: 0s; --glint-color: {pal.gold};"
  >
    <svg viewBox="0 0 16 16" class="w-full h-full" fill="none">
      <path
        d="M 8 0 L 9.5 6.5 L 16 8 L 9.5 9.5 L 8 16 L 6.5 9.5 L 0 8 L 6.5 6.5 Z"
        fill={pal.gold}
      />
      <circle cx="8" cy="8" r="2.2" fill={pal.specular} />
    </svg>
  </div>

  <!-- Tier >= 5: Second Glint Spark (Bottom Protruding Spear) -->
  {#if clampedTier >= 5}
    <div
      class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-3 h-3 pointer-events-none toty-glint-spark"
      style="--glint-delay: 2.2s; --glint-color: {pal.gold};"
    >
      <svg viewBox="0 0 16 16" class="w-full h-full" fill="none">
        <path
          d="M 8 0 L 9.5 6.5 L 16 8 L 9.5 9.5 L 8 16 L 6.5 9.5 L 0 8 L 6.5 6.5 Z"
          fill={pal.gold}
        />
        <circle cx="8" cy="8" r="2" fill={pal.specular} />
      </svg>
    </div>
  {/if}

  <!-- Tier >= 8: Third Glint Spark (Apex Crown Spike) -->
  {#if clampedTier >= 8}
    <div
      class="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 pointer-events-none toty-glint-spark"
      style="--glint-delay: 1.1s; --glint-color: {pal.gold};"
    >
      <svg viewBox="0 0 16 16" class="w-full h-full" fill="none">
        <path
          d="M 8 0 L 9.5 6.5 L 16 8 L 16 8 L 9.5 9.5 L 8 16 L 6.5 9.5 L 0 8 L 6.5 6.5 Z"
          fill={pal.gold}
        />
        <circle cx="8" cy="8" r="2.5" fill={pal.specular} />
      </svg>
    </div>
  {/if}
</div>
{/if}

<style>
  /* 60 FPS GPU-accelerated TOTY Glint Shimmer Keyframe */
  .toty-glint-spark {
    animation: totyGlint 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    animation-delay: var(--glint-delay, 0s);
    opacity: 0;
    transform: scale(0.4) rotate(0deg);
  }

  @keyframes totyGlint {
    0%, 75%, 100% {
      opacity: 0;
      transform: scale(0.3) rotate(0deg);
    }
    82% {
      opacity: 1;
      transform: scale(1.2) rotate(45deg);
    }
    90% {
      opacity: 0.85;
      transform: scale(0.95) rotate(90deg);
    }
    96% {
      opacity: 0;
      transform: scale(0.4) rotate(135deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .toty-glint-spark {
      animation: none;
      opacity: 0.6;
      transform: scale(0.8);
    }
  }
</style>
