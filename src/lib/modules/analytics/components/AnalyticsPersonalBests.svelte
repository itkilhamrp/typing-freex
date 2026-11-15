<script lang="ts">
  import type { PersonalBest } from "@/core/ipc";
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import { formatModeBadge } from "#lib/shared/utils/index.js";
  import { getLanguageDisplayName } from "@/core/text-tools";
  import KeycapEvolutionBadge from "./KeycapEvolutionBadge.svelte";
  import CardCrystalAccents from "./CardCrystalAccents.svelte";
  import CardGlassCracks from "./CardGlassCracks.svelte";
  import { getEvolutionTier } from "../utils/evolution-tier";
  import {
    getCardPolygon,
    getCardBorderGradient,
    getGlowColor,
    getRailColor,
    getSpeedColor,
  } from "../utils/pb-card-styles";
  import { AppCard, AppBadge } from "#lib/shared/ui/index.js";
  import { Trophy, CaretDown, CaretUp } from "phosphor-svelte";

  interface Props {
    personalBests: readonly PersonalBest[];
    speedUnit: string;
    formatSpeed: (wpm: number) => string;
  }

  const { personalBests, speedUnit, formatSpeed }: Props = $props();

  const { t } = useI18n();

  interface PreparedPersonalBest {
    pb: PersonalBest;
    key: string;
    diff: string | null;
    isExpert: boolean;
    isMaster: boolean;
    tier: number;
    cardPolygon: string;
    borderGradient: string;
    glowColor: string;
    speedColor: string;
    railColor: string;
    modeBadge: string;
    formattedSpeed: string | number;
    roundedAccuracy: number;
    languageName: string | null;
    dateStr: string;
  }

  function prepareBestList(
    items: PersonalBest[],
    prefix: string,
  ): PreparedPersonalBest[] {
    items.sort((a, b) => b.wpm - a.wpm);
    const top = items.length > 3 ? items.slice(0, 3) : items;
    return top.map((pb, index) => {
      const diff = pb.difficulty ?? null;
      const isExpert = diff === "expert";
      const isMaster = diff === "master";
      const tier = getEvolutionTier(diff, pb.wpm, pb.accuracy);
      return {
        pb,
        key: `${prefix}-${pb.result_uuid ?? `${pb.mode}-${pb.mode_variant}-${pb.language}-${index}`}`,
        diff,
        isExpert,
        isMaster,
        tier,
        cardPolygon: getCardPolygon(diff, tier),
        borderGradient: getCardBorderGradient(diff, tier),
        glowColor: getGlowColor(diff, tier),
        speedColor: getSpeedColor(diff, tier),
        railColor: getRailColor(diff, tier),
        modeBadge: formatModeBadge(pb.mode, pb.mode_variant, t),
        formattedSpeed: formatSpeed(pb.wpm),
        roundedAccuracy: Math.round(pb.accuracy),
        languageName:
          pb.mode !== "custom" && pb.language
            ? getLanguageDisplayName(pb.language)
            : null,
        dateStr: pb.achieved_at ? pb.achieved_at.slice(0, 10) : "",
      };
    });
  }

  // Single-pass grouping & pre-computation of personal bests
  const groupedBests = $derived.by(() => {
    const masterRaw: PersonalBest[] = [];
    const expertRaw: PersonalBest[] = [];
    const normalRaw: PersonalBest[] = [];

    for (const pb of personalBests) {
      if (pb.difficulty === "master") {
        masterRaw.push(pb);
      } else if (pb.difficulty === "expert") {
        expertRaw.push(pb);
      } else {
        normalRaw.push(pb);
      }
    }

    const master = prepareBestList(masterRaw, "master");
    const expert = prepareBestList(expertRaw, "expert");
    const normal = prepareBestList(normalRaw, "normal");

    return {
      master,
      expert,
      normal,
      hasAny: master.length > 0 || expert.length > 0 || normal.length > 0,
    };
  });

  let isPersonalBestsExpanded = $state(false);

  function togglePersonalBests() {
    isPersonalBestsExpanded = !isPersonalBestsExpanded;
  }

  const totalBestsCount = $derived(
    groupedBests.master.length + groupedBests.expert.length + groupedBests.normal.length,
  );
</script>

{#snippet personalBestCard(item: PreparedPersonalBest, index: number)}
  {@const {
    pb,
    diff,
    isExpert,
    isMaster,
    tier,
    cardPolygon,
    borderGradient,
    glowColor,
    speedColor,
    railColor,
    modeBadge,
    formattedSpeed,
    roundedAccuracy,
    languageName,
    dateStr,
  } = item}

  <div
    class="relative group transition-transform duration-200 hover:-translate-y-1 pb-hex-card {tier >=
    7
      ? 'pb-hex-pulse'
      : ''}"
    style="contain: layout style; --pb-glow-color: {glowColor}; --pb-polygon: {cardPolygon};"
    title={t("analytics.pbCardTitle", {
      mode: modeBadge,
      speed: formattedSpeed,
      unit: speedUnit,
      acc: pb.accuracy,
      tier,
    })}
  >
    <!-- 3D Crystalline Facet Accents Protruding OUT of Card Frame (EA FC TOTS/TOTY Style) -->
    <CardCrystalAccents difficulty={diff} {tier} />

    <!-- Outer Asymmetrical Hexagonal Polygon Shell (1.5px perimeter gradient border) -->
    <div
      class="p-[1.5px] w-full h-full transition-[background] duration-300 relative z-10"
      style="clip-path: {cardPolygon}; background: {borderGradient};"
    >
      <!-- Inner Asymmetrical Card Body Surface (Luminous, High-Density & Anti-Clipping) -->
      <div
        class={[
          "w-full h-full px-3.5 sm:px-4 pt-2.5 sm:pt-3 pb-3 sm:pb-3.5 flex flex-col justify-between gap-1.5 sm:gap-2 relative overflow-hidden",
          isMaster
            ? "pb-card-body-master"
            : isExpert
              ? "pb-card-body-expert"
              : "pb-card-body-normal",
        ].join(" ")}
        style="clip-path: {cardPolygon};"
      >
        <!-- Procedural Glass Fracture / Crack Web (EA FC Style) -->
        <CardGlassCracks difficulty={diff} {tier} />

        <!-- Top Accent Rail Line -->
        <div
          class="absolute inset-x-0 top-0 h-[2px] {railColor} opacity-90 pointer-events-none"
        ></div>

        <!-- Top Header Row (Compact & Clean) -->
        <div
          class="flex items-center justify-between text-xs text-tt-text-secondary gap-1 z-10 pt-0.5"
        >
          <div class="flex items-center gap-1.5 flex-wrap">
            <span
              class={[
                "px-1.5 py-0.5 rounded-sm text-3xs font-black font-mono tracking-wider shadow-2xs",
                index === 0
                  ? isMaster
                    ? "bg-red-500/20 text-red-600 dark:text-red-400"
                    : isExpert
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      : "bg-teal-500/20 text-teal-700 dark:text-teal-400"
                  : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-tt-text-secondary",
              ].join(" ")}
            >
              #{index + 1}
            </span>
            <span
              class="font-bold uppercase tracking-wider text-slate-800 dark:text-tt-text text-3xs sm:text-2xs truncate max-w-[110px]"
            >
              {modeBadge}
            </span>
            {#if isExpert}
              <span
                class="px-1.5 py-0.5 rounded-sm text-3xs font-black font-mono tracking-widest uppercase bg-amber-500 text-slate-950 shadow-xs"
              >
                {t("analytics.difficultyExpert")}
              </span>
            {:else if isMaster}
              <span
                class="px-1.5 py-0.5 rounded-sm text-3xs font-black font-mono tracking-widest uppercase bg-red-600 text-white shadow-xs"
              >
                {t("analytics.difficultyMaster")}
              </span>
            {/if}
          </div>

          <!-- EA FC Evolution Tier Crest Badge with Tier Level -->
          <span
            class={[
              "px-2 py-0.5 rounded-sm text-3xs font-black font-mono tracking-wider uppercase shadow-2xs shrink-0",
              isMaster
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : isExpert
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                  : "bg-teal-500/15 text-teal-700 dark:text-teal-400",
            ].join(" ")}
          >
            {t("analytics.tierBadge", { tier })}
          </span>
        </div>

        <!-- Triad Hero Row: SPEED (Left) | KEYCAP (Center) | ACCURACY (Right) -->
        <div
          class="flex items-center justify-between gap-1 sm:gap-2 my-0.5 z-10"
        >
          <!-- Left Hero: SPEED (CPM / WPM) -->
          <div
            class="flex flex-col items-start shrink-0 min-w-[64px] sm:min-w-[72px] pl-0.5 sm:pl-1"
          >
            <span
              class="text-3xs uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-tt-text-secondary/80 leading-none"
            >
              {t("analytics.speedUpper")}
            </span>
            <div
              class="text-2xl sm:text-3xl font-black font-mono tabular-nums leading-none tracking-tight {speedColor} mt-0.5"
            >
              {formattedSpeed}<span
                class="text-3xs font-bold text-slate-500 dark:text-tt-text-secondary uppercase ml-0.5 font-sans"
                >{speedUnit}</span
              >
            </div>
          </div>

          <!-- Center Hero: Cinematic Interactive 3D Mechanical Keyboard Keycap -->
          <div class="flex items-center justify-center shrink-0">
            <KeycapEvolutionBadge difficulty={diff} {tier} />
          </div>

          <!-- Right Hero: ACCURACY (%) -->
          <div
            class="flex flex-col items-end shrink-0 min-w-[64px] sm:min-w-[72px] text-right pr-1.5 sm:pr-2.5"
          >
            <span
              class="text-3xs uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-tt-text-secondary/80 leading-none"
            >
              {t("analytics.accuracyUpper")}
            </span>
            <div
              class="text-2xl sm:text-3xl font-black font-mono tabular-nums leading-none tracking-tight text-ios-green dark:text-emerald-400 mt-0.5"
              title={`${pb.accuracy}%`}
            >
              {roundedAccuracy}<span class="text-xs font-bold ml-0.5">%</span>
            </div>
          </div>
        </div>

        <!-- Footer Meta Rail (Language & Date) -->
        <div
          class="pt-1.5 border-t border-slate-200/60 dark:border-tt-separator/30 flex items-center justify-between text-3xs text-slate-600 dark:text-tt-text-secondary/80 font-mono z-10"
        >
          {#if languageName}
            <span
              class="px-1.5 py-0.5 rounded-sm uppercase bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 truncate max-w-[95px] font-semibold"
              title={languageName}
            >
              {languageName}
            </span>
          {:else}
            <span></span>
          {/if}
          <span
            class="font-semibold tabular-nums text-slate-600 dark:text-tt-text-secondary/80"
          >
            {dateStr}
          </span>
        </div>
      </div>
    </div>
  </div>
{/snippet}

{#snippet unclaimedCard(
  label: string,
  difficultyType: "master" | "expert" | "normal",
)}
  {@const cardPolygon = getCardPolygon(difficultyType, 0)}
  <div class="relative group" style="contain: layout style;">
    <!-- Base Tier 0 crystal accents (omitted at tier 0) -->
    <CardCrystalAccents difficulty={difficultyType} tier={0} />

    <div
      class={[
        "p-[1.5px] w-full h-full relative z-10",
        difficultyType === "master"
          ? "bg-red-500/25"
          : difficultyType === "expert"
            ? "bg-amber-500/25"
            : "bg-teal-500/25",
      ].join(" ")}
      style="clip-path: {cardPolygon};"
    >
      <div
        class={[
          "px-3.5 sm:px-4 py-3 w-full h-full flex flex-col items-center justify-center text-center gap-1.5 min-h-[135px] relative overflow-hidden pb-card-unclaimed-body",
          difficultyType === "master"
            ? "text-red-600 dark:text-red-400"
            : difficultyType === "expert"
              ? "text-amber-700 dark:text-amber-400"
              : "text-teal-700 dark:text-teal-400",
        ].join(" ")}
        style="clip-path: {cardPolygon};"
      >
        <!-- Procedural Glass Fracture Overlay (Unclaimed Base Tier 0: pristine unbroken glass) -->
        <CardGlassCracks difficulty={difficultyType} tier={0} />

        <div
          class="text-3xs font-extrabold uppercase font-mono tracking-wider z-10"
        >
          {t("analytics.unclaimedTitle", { label })}
        </div>
        <p
          class="text-3xs text-slate-500 dark:text-tt-text-secondary max-w-[190px] z-10"
        >
          {t("analytics.unclaimedDesc", { label })}
        </p>
      </div>
    </div>
  </div>
{/snippet}

<!-- Personal Bests Showcase (Collapsible, Default: Collapsed for zero-lag initial load) -->
<AppCard
  padding="p-5 sm:p-6"
  class="space-y-4"
  style="contain: layout style; content-visibility: auto;"
>
  <div
    class="flex items-center justify-between gap-3 {isPersonalBestsExpanded ? 'pb-3 border-b border-tt-separator/30' : ''}"
  >
    <div class="flex items-center gap-3 min-w-0">
      <div
        class="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs shrink-0"
      >
        <Trophy class="w-4.5 h-4.5" />
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h2 class="text-lg font-bold text-tt-text">
            {t("analytics.personalBests")}
          </h2>
          {#if groupedBests.hasAny}
            <AppBadge variant="warning" size="sm" class="font-mono shrink-0">
              {totalBestsCount} {totalBestsCount === 1 ? t("analytics.recordSingular") : t("analytics.recordPlural")}
            </AppBadge>
          {/if}
        </div>
        <p class="text-xs text-tt-text-secondary mt-0.5 truncate">
          {t("analytics.recordsSubtitle")}
        </p>
      </div>
    </div>

    <button
      type="button"
      onclick={togglePersonalBests}
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-tt-text bg-tt-surface-2 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-tt-separator shadow-2xs shrink-0 select-none"
      aria-expanded={isPersonalBestsExpanded}
    >
      <span>
        {isPersonalBestsExpanded ? t("analytics.hidePersonalBests") : t("analytics.showPersonalBests")}
      </span>
      {#if isPersonalBestsExpanded}
        <CaretUp class="w-3.5 h-3.5 text-tt-text-secondary" />
      {:else}
        <CaretDown class="w-3.5 h-3.5 text-tt-text-secondary" />
      {/if}
    </button>
  </div>

  {#if isPersonalBestsExpanded}
    {#if groupedBests.hasAny}
      <div class="space-y-4">
        {#if groupedBests.master.length > 0}
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
          >
            {#each groupedBests.master as item, index (item.key)}
              {@render personalBestCard(item, index)}
            {/each}
          </div>
        {/if}

        {#if groupedBests.expert.length > 0}
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
          >
            {#each groupedBests.expert as item, index (item.key)}
              {@render personalBestCard(item, index)}
            {/each}
          </div>
        {:else if groupedBests.master.length > 0 || groupedBests.normal.length > 0}
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
          >
            {@render unclaimedCard(t("arena.diffExpert"), "expert")}
          </div>
        {/if}

        {#if groupedBests.normal.length > 0}
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
          >
            {#each groupedBests.normal as item, index (item.key)}
              {@render personalBestCard(item, index)}
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <div class="text-center py-8 text-sm text-tt-text-secondary">
        {t("analytics.noPersonalBests")}
      </div>
    {/if}
  {/if}
</AppCard>

<style>
  @keyframes pb-hex-pulse-opacity {
    0%,
    100% {
      opacity: 0.45;
    }
    50% {
      opacity: 0.95;
    }
  }

  .pb-hex-card {
    position: relative;
    transform: translateZ(0);
    backface-visibility: hidden;
  }

  /* GPU-accelerated ambient glow layer: avoids heavy CPU blur filter rasterization in WebKitGTK */
  .pb-hex-card::before {
    content: "";
    position: absolute;
    inset: 4px;
    border-radius: 12px;
    box-shadow: 0 0 16px 2px var(--pb-glow-color, rgba(0, 0, 0, 0.12));
    opacity: 0.45;
    z-index: 0;
    pointer-events: none;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
    transform: translateZ(0);
  }

  .pb-hex-card:hover::before {
    opacity: 0.85;
    transform: translateZ(0) scale(1.02);
  }

  .pb-hex-pulse::before {
    will-change: opacity;
    animation: pb-hex-pulse-opacity 3s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .pb-hex-pulse::before {
      animation: none !important;
    }
  }

  .pb-card-body-master {
    background: linear-gradient(to bottom, #ffffff, #ffffff, rgba(239, 68, 68, 0.04));
  }
  :global(.dark) .pb-card-body-master {
    background: linear-gradient(to bottom, #14161d, #14161d, #1a1215);
  }

  .pb-card-body-expert {
    background: linear-gradient(to bottom, #ffffff, #ffffff, rgba(245, 158, 11, 0.04));
  }
  :global(.dark) .pb-card-body-expert {
    background: linear-gradient(to bottom, #14161d, #14161d, #1a1712);
  }

  .pb-card-body-normal {
    background: linear-gradient(to bottom, #ffffff, #ffffff, rgba(20, 184, 166, 0.04));
  }
  :global(.dark) .pb-card-body-normal {
    background: linear-gradient(to bottom, #14161d, #14161d, #121919);
  }

  .pb-card-unclaimed-body {
    background: rgba(255, 255, 255, 0.95);
  }
  :global(.dark) .pb-card-unclaimed-body {
    background: #14161d;
  }
</style>
