<script module lang="ts">
  let instanceSeed = 0;
</script>

<script lang="ts">
  import type { TrophyShape } from "@/core/achievements";
  import { getTierMeta } from "@/core/achievements/tier-system";
  import CupShape from "./CupShape.svelte";
  import StarShape from "./StarShape.svelte";
  import MedalShape from "./MedalShape.svelte";
  import ShieldShape from "./ShieldShape.svelte";
  import CrownShape from "./CrownShape.svelte";
  import BoltShape from "./BoltShape.svelte";
  import FlameShape from "./FlameShape.svelte";
  import GemShape from "./GemShape.svelte";
  import ScrollShape from "./ScrollShape.svelte";
  import WreathShape from "./WreathShape.svelte";
  import TrophyRankEffects from "./TrophyRankEffects.svelte";

  interface Props {
    uniqueId?: string;
    shape?: TrophyShape;
    tier?: number;
    unlocked?: boolean;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    class?: string;
  }

  let {
    uniqueId,
    shape = "cup",
    tier = 0,
    unlocked = false,
    size = "md",
    class: className = "",
  }: Props = $props();

  const instanceId = ++instanceSeed;
  const isActuallyUnlocked = $derived(unlocked || tier > 0);
  const meta = $derived(getTierMeta(tier));
  const rank = $derived(meta.name);

  const sizeClasses: Record<string, string> = {
    xs: "w-5 h-5",
    sm: "w-7 h-7",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const containerSize = $derived(sizeClasses[size] ?? "w-10 h-10");
  const gradientId = $derived(`svg-trophy-${uniqueId || shape}-${tier}-${instanceId}`);
</script>

<div
  class="trophy-emblem-root group relative inline-flex items-center justify-center shrink-0 select-none {containerSize} {className} {isActuallyUnlocked
    ? 'is-unlocked'
    : 'is-locked opacity-55'} rank-{rank}"
  data-tier={tier}
  data-rank={rank}
  data-shape={shape}
  data-unlocked={isActuallyUnlocked}
  style="--trophy-fill: {meta.fillColor}; --trophy-accent: {meta.accentColor};"
>
  <TrophyRankEffects
    {meta}
    {gradientId}
    isUnlocked={isActuallyUnlocked}
    layer="background"
  />

  <!-- Keyed Core Stage triggers a rank-ascension burst & scale transition whenever tier or shape changes -->
  {#key `${shape}-${tier}-${isActuallyUnlocked}`}
    <div
      class="trophy-core-stage relative w-full h-full flex items-center justify-center"
    >
      {#if shape === "cup"}
        <CupShape
          {tier}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "star"}
        <StarShape
          {tier}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "medal"}
        <MedalShape
          {tier}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "shield"}
        <ShieldShape
          {tier}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "crown"}
        <CrownShape
          {tier}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "bolt"}
        <BoltShape
          {tier}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "flame"}
        <FlameShape
          {tier}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "gem"}
        <GemShape
          {tier}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "scroll"}
        <ScrollShape
          {tier}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "wreath"}
        <WreathShape
          {tier}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else}
        <CupShape
          {tier}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {/if}
    </div>
  {/key}

  <TrophyRankEffects
    {meta}
    {gradientId}
    isUnlocked={isActuallyUnlocked}
    layer="foreground"
  />
</div>

<style>
  .trophy-emblem-root {
    transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
  }

  .trophy-emblem-root.is-unlocked:hover {
    transform: translateY(-2.5px) scale(1.07);
  }

  /* Rank-up / unlock reveal pop (one-shot, zero infinite lag) */
  .trophy-core-stage {
    animation: trophy-rank-ascend 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes trophy-rank-ascend {
    0% {
      opacity: 0.35;
      transform: scale(0.82) translateY(2px);
    }
    65% {
      opacity: 1;
      transform: scale(1.04) translateY(-1px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .trophy-core-stage {
      animation: none !important;
    }
    .trophy-emblem-root {
      transition: none !important;
    }
  }
</style>
