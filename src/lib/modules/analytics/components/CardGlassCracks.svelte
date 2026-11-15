<!--
  @file CardGlassCracks.svelte
  @description Procedural glass fracture / crystalline fissure vector overlay for personal best evolution cards.
  Renders authentic hairline stress fractures, diagonal cleavages, and micro-splinters.
  Varies across difficulty modes (Magma, Topaz, Glacier) and evolves across 10 tiers.
  100% lightweight inline SVG, zero external assets, zero GPU lag.
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

  // Fracture color accents per mode
  const fissureColor = $derived.by(() => {
    if (mode === "master") {
      return {
        primary: "#ef4444",
        accent: "#fde047",
        secondary: "#b91c1c",
      };
    }
    if (mode === "expert") {
      return {
        primary: "#f59e0b",
        accent: "#fef08a",
        secondary: "#d97706",
      };
    }
    return {
      primary: "#06b6d4",
      accent: "#cffafe",
      secondary: "#0d9488",
    };
  });
</script>

{#if clampedTier >= 1}
<div
  class="pointer-events-none absolute inset-0 w-full h-full overflow-hidden select-none z-0 opacity-25 dark:opacity-35 group-hover:opacity-45 transition-opacity duration-300"
  aria-hidden="true"
>
  <svg
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    class="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- ========================================================================= -->
    <!-- PRIMARY FRACTURE NETWORK (Tier 1..10)                                     -->
    <!-- ========================================================================= -->

    <!-- Primary Fracture 1: Originating from top-right corner spreading across card -->
    <path
      d="M 95 6 L 82 18 L 68 22 L 54 36 L 41 38"
      stroke={fissureColor.primary}
      stroke-width="0.65"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Primary Fracture 2: Branching downward towards bottom edge -->
    <path
      d="M 68 22 L 72 40 L 64 58 L 56 72 L 48 95"
      stroke={fissureColor.secondary}
      stroke-width="0.55"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- ========================================================================= -->
    <!-- TIER >= 3: SECONDARY BRANCHES & MICRO-SPLINTERS                           -->
    <!-- ========================================================================= -->
    {#if clampedTier >= 3}
      <!-- Top Left Fracture Splinter -->
      <path
        d="M 8 10 L 19 21 L 28 19 L 36 29"
        stroke={fissureColor.primary}
        stroke-width="0.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- Sharp Micro-fork -->
      <path
        d="M 54 36 L 50 48 L 38 52"
        stroke={fissureColor.accent}
        stroke-width="0.45"
        stroke-linecap="round"
      />
    {/if}

    <!-- ========================================================================= -->
    <!-- TIER >= 5: INTERSECTING DIAGONAL CLEAVAGE                                 -->
    <!-- ========================================================================= -->
    {#if clampedTier >= 5}
      <!-- Bottom-Left Radiating Stress Line -->
      <path
        d="M 4 90 L 16 78 L 26 80 L 38 66 L 50 68"
        stroke={fissureColor.primary}
        stroke-width="0.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- Center High-Tension Cross Crack -->
      <path
        d="M 41 38 L 32 44 L 38 66"
        stroke={fissureColor.accent}
        stroke-width="0.5"
        stroke-linecap="round"
      />
      <!-- Top Right Accent Hairline -->
      <path
        d="M 82 18 L 88 32 L 80 42"
        stroke={fissureColor.secondary}
        stroke-width="0.4"
      />
    {/if}

    <!-- ========================================================================= -->
    <!-- TIER >= 7: COMPLEX CRYSTALLINE MESH FISSURES                              -->
    <!-- ========================================================================= -->
    {#if clampedTier >= 7}
      <!-- Diagonal Splay Line -->
      <path
        d="M 98 48 L 88 56 L 76 52 L 64 58"
        stroke={fissureColor.primary}
        stroke-width="0.55"
        stroke-linecap="round"
      />
      <!-- Upper Crown Stress Web -->
      <path
        d="M 48 4 L 52 14 L 62 18"
        stroke={fissureColor.accent}
        stroke-width="0.5"
        stroke-linecap="round"
      />
      <!-- Micro-shard cleavage triangle -->
      <polygon
        points="68,22 72,28 66,29"
        stroke={fissureColor.accent}
        stroke-width="0.4"
        fill={fissureColor.accent}
        fill-opacity="0.08"
      />
    {/if}

    <!-- ========================================================================= -->
    <!-- TIER >= 9: APEX SHATTERED PRISM CRACK WEB (Tiers 9 & 10)                  -->
    <!-- ========================================================================= -->
    {#if clampedTier >= 9}
      <!-- Intricate Spiderweb Micro-Cracks -->
      <path
        d="M 19 21 L 24 34 L 16 46 L 6 52"
        stroke={fissureColor.secondary}
        stroke-width="0.45"
        stroke-linecap="round"
      />
      <path
        d="M 76 52 L 84 68 L 78 82 L 86 94"
        stroke={fissureColor.primary}
        stroke-width="0.55"
        stroke-linecap="round"
      />
      <path
        d="M 50 68 L 58 78 L 54 90"
        stroke={fissureColor.accent}
        stroke-width="0.45"
        stroke-linecap="round"
      />
      <!-- Secondary Shard facet triangle -->
      <polygon
        points="38,66 44,62 46,70"
        stroke={fissureColor.primary}
        stroke-width="0.4"
        fill={fissureColor.primary}
        fill-opacity="0.1"
      />
    {/if}
  </svg>
</div>
{/if}
