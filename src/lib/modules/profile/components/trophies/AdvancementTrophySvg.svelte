<script lang="ts">
  import type { AdvancementShape } from "@/core/achievements";
  import { getAdvancementRankMeta } from "@/core/achievements/advancement-rank";
  import {
    HexBadgeShape,
    PentagonShape,
    CompassShape,
    SigilShape,
    ChevronShape,
    CrestShape,
    PrismShape,
    GearShape,
    AtomShape,
    RuneShape,
    AdvancementRankFrame,
  } from "./advancements";

  interface Props {
    uniqueId?: string;
    shape?: AdvancementShape;
    tier?: number;
    unlocked?: boolean;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    class?: string;
  }

  let {
    uniqueId,
    shape = "hex_badge",
    tier = 0,
    unlocked = false,
    size = "md",
    class: className = "",
  }: Props = $props();

  const isActuallyUnlocked = $derived(unlocked);
  const meta = $derived(getAdvancementRankMeta(tier));
  const rankName = $derived(meta.name || "locked");

  const sizeClasses: Record<string, string> = {
    xs: "w-5 h-5",
    sm: "w-7 h-7",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const containerSize = $derived(sizeClasses[size] ?? "w-10 h-10");
  const gradientId = $derived(`svg-adv-${uniqueId || shape}-${tier}`);
  const isHighTier = $derived(isActuallyUnlocked && tier >= 3);
  const isApexTier = $derived(isActuallyUnlocked && tier >= 5);
</script>

<div
  class="adv-trophy-root group relative inline-flex items-center justify-center shrink-0 select-none {containerSize} {className} {!isActuallyUnlocked
    ? 'opacity-45 grayscale is-locked'
    : 'is-unlocked'} tier-{tier} rank-{rankName}"
  data-tier={tier}
  data-rank={meta.name}
  data-shape={shape}
  data-unlocked={isActuallyUnlocked}
  style="--adv-fill: {meta.fillColor}; --adv-accent: {meta.accentColor};"
>
  {#if isActuallyUnlocked && tier > 0}
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="adv-bg-layer absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="{gradientId}-aura" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stop-color={meta.accentColor}
            stop-opacity={isApexTier ? "0.38" : isHighTier ? "0.26" : "0.16"}
          />
          <stop offset="65%" stop-color={meta.fillColor} stop-opacity="0.08" />
          <stop offset="100%" stop-color={meta.fillColor} stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle
        cx="24"
        cy="24"
        r="22"
        fill="url(#{gradientId}-aura)"
        class="adv-aura-pulse"
      />
      {#if isHighTier}
        <circle
          cx="24"
          cy="24"
          r="20.5"
          stroke={meta.accentColor}
          stroke-width="0.9"
          stroke-dasharray={isApexTier ? "4 2 1 2" : "3 3"}
          opacity="0.55"
          class="adv-orbit-ring"
        />
      {/if}
    </svg>
  {/if}

  {#key `${tier}-${isActuallyUnlocked}`}
    <div
      class="adv-shape-stage relative w-full h-full flex items-center justify-center"
    >
      {#if shape === "hex_badge"}
        <HexBadgeShape
          {tier}
          rank={rankName}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "pentagon"}
        <PentagonShape
          {tier}
          rank={rankName}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "compass"}
        <CompassShape
          {tier}
          rank={rankName}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "sigil"}
        <SigilShape
          {tier}
          rank={rankName}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "chevron"}
        <ChevronShape
          {tier}
          rank={rankName}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "crest"}
        <CrestShape
          {tier}
          rank={rankName}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "prism"}
        <PrismShape
          {tier}
          rank={rankName}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "gear"}
        <GearShape
          {tier}
          rank={rankName}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "atom"}
        <AtomShape
          {tier}
          rank={rankName}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else if shape === "rune"}
        <RuneShape
          {tier}
          rank={rankName}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {:else}
        <HexBadgeShape
          {tier}
          rank={rankName}
          fillColor={meta.fillColor}
          accentColor={meta.accentColor}
          {gradientId}
          isUnlocked={isActuallyUnlocked}
          class="w-full h-full"
        />
      {/if}
      <AdvancementRankFrame
        rank={rankName}
        fillColor={meta.fillColor}
        accentColor={meta.accentColor}
        gradientId="{gradientId}-frame"
        isUnlocked={isActuallyUnlocked}
      />
    </div>
  {/key}
</div>

<style>
  .adv-trophy-root {
    transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .adv-trophy-root.is-unlocked:hover {
    transform: translateY(-2px) scale(1.06);
  }
  .adv-shape-stage {
    animation: adv-rank-reveal 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .adv-aura-pulse {
    transform-origin: 24px 24px;
    animation: adv-pulse 3.2s ease-in-out infinite;
  }
  .adv-orbit-ring {
    transform-origin: 24px 24px;
    animation: adv-spin 18s linear infinite;
  }
  @keyframes adv-rank-reveal {
    0% {
      opacity: 0.4;
      transform: scale(0.84);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes adv-pulse {
    0%,
    100% {
      opacity: 0.72;
      transform: scale(0.96);
    }
    50% {
      opacity: 1;
      transform: scale(1.04);
    }
  }
  @keyframes adv-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .adv-shape-stage,
    .adv-aura-pulse,
    .adv-orbit-ring {
      animation: none !important;
    }
  }
</style>
