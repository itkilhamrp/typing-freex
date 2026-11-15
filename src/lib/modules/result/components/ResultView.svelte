<script lang="ts">
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import { useResultController } from "../controllers/result.controller.svelte";
  import ResultChart from "./ResultChart.svelte";
  import {
    AppPage,
    AppButton,
    AppCard,
    AppKpiCard,
    AppBadge,
  } from "#lib/shared/ui/index.js";
  import { ArrowCounterClockwise } from "phosphor-svelte";

  const { t } = useI18n();
  const controller = useResultController();

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      controller.startNextTest();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<AppPage maxWidth="max-w-5xl" class="select-none animate-fade-in space-y-5">
  <!-- Screen Reader Live Announcement (A11Y-03) -->
  <div class="sr-only" aria-live="polite" role="status">
    {controller.isFailed ? t("result.testFailed") : t("result.title")}: {controller.netSpeed}
    {controller.speedUnit.toUpperCase()}, {controller.accuracy}% {t(
      "result.accuracy",
    )}
  </div>

  <!-- Header with Test Configuration Tags & Pure Typographic Accent -->
  <div class="text-center space-y-2.5">
    <h1
      class="flex flex-wrap items-baseline justify-center gap-x-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight {controller.isFailed
        ? 'text-status-red'
        : 'text-tt-text'}"
    >
      <span>{controller.isFailed ? t("result.testFailed") : t("result.title")}</span>
      {#if controller.difficulty && controller.difficulty !== "normal"}
        <span
          class="font-mono text-xl sm:text-2xl font-bold tracking-wider uppercase text-tt-text-secondary/70 select-none"
        >
          · {controller.difficulty}
        </span>
      {/if}
    </h1>
    <!-- Row 1: Primary Test Configuration Badges -->
    <div
      class="flex flex-wrap items-center justify-center gap-2 font-mono text-xs"
    >
      <AppBadge variant="primary" size="md" class="uppercase tracking-wider">
        {controller.modeBadge}
      </AppBadge>
      {#if controller.language}
        <AppBadge variant="surface" size="md">
          {controller.language}
        </AppBadge>
      {/if}
      {#if controller.hasPunctuation}
        <AppBadge variant="surface" size="md">
          {t("result.punctuationBadge")}
        </AppBadge>
      {/if}
      {#if controller.hasNumbers}
        <AppBadge variant="surface" size="md">
          {t("result.numbersBadge")}
        </AppBadge>
      {/if}
    </div>
    <!-- Row 2: Dedicated Source Text Attribution -->
    {#if controller.quoteSource}
      <div class="flex items-center justify-center pt-0.5">
        <AppBadge
          variant="surface"
          size="md"
          class="truncate max-w-md sm:max-w-xl font-mono text-xs text-tt-text-secondary"
        >
          — {controller.quoteSource}
        </AppBadge>
      </div>
    {/if}
  </div>

  <!-- Hero KPI Cards (Solid System Materials, Layer 2 per Apple One Layer One Space) -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-mono">
    <AppKpiCard
      label={controller.speedUnit.toUpperCase()}
      value={controller.netSpeed}
      subtext={controller.speedUnit === "cpm"
        ? t("result.rawCpm", { raw: controller.rawSpeed })
        : t("result.rawWpm", { raw: controller.rawSpeed })}
      highlight={true}
      class="tabular-nums"
    />
    <AppKpiCard
      label={t("result.accuracy")}
      value={`${controller.accuracy}%`}
      subtext={t("result.subtextPrecision")}
      class="tabular-nums"
    />
    <AppKpiCard
      label={t("result.consistency")}
      value={controller.consistency}
      subtext={t("result.subtextVariance")}
      class="tabular-nums"
    />
    <AppKpiCard
      label={t("result.labelTime")}
      value={controller.duration}
      subtext={t("result.subtextActiveTime")}
      class="tabular-nums"
    />
  </div>

  <!-- Character Breakdown -->
  <div
    class="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-tt-separator/40 py-3 px-4 sm:px-6 rounded-2xl bg-tt-surface-2 font-mono text-sm border border-tt-separator/50 shadow-xs"
  >
    <div class="flex items-center justify-center gap-2.5 py-1.5 sm:py-0 sm:px-3">
      <span class="w-2.5 h-2.5 rounded-full bg-ios-green shrink-0"></span>
      <span class="text-tt-text-secondary text-xs">{t("result.correct")}:</span>
      <span class="font-bold tabular-nums text-tt-text"
        >{controller.charBreakdown.correct}</span
      >
    </div>
    <div class="flex items-center justify-center gap-2.5 py-1.5 sm:py-0 sm:px-3">
      <span class="w-2.5 h-2.5 rounded-full bg-ios-red shrink-0"></span>
      <span class="text-tt-text-secondary text-xs"
        >{t("result.incorrect")}:</span
      >
      <span class="font-bold tabular-nums text-tt-text"
        >{controller.charBreakdown.incorrect}</span
      >
    </div>
    <div class="flex items-center justify-center gap-2.5 py-1.5 sm:py-0 sm:px-3">
      <span class="w-2.5 h-2.5 rounded-full bg-ios-orange shrink-0"></span>
      <span class="text-tt-text-secondary text-xs">{t("result.extra")}:</span>
      <span class="font-bold tabular-nums text-tt-text"
        >{controller.charBreakdown.extra}</span
      >
    </div>
    <div class="flex items-center justify-center gap-2.5 py-1.5 sm:py-0 sm:px-3">
      <span class="w-2.5 h-2.5 rounded-full bg-tt-text-secondary/70 shrink-0"></span>
      <span class="text-tt-text-secondary text-xs">{t("result.missed")}:</span>
      <span class="font-bold tabular-nums text-tt-text"
        >{controller.charBreakdown.missed}</span
      >
    </div>
  </div>

  <!-- Trajectory Telemetry Chart -->
  {#if controller.timelineChartData.length > 0}
    <AppCard padding="p-4 sm:p-5">
      <div class="mb-2">
        <h2 class="text-sm font-semibold text-tt-text tracking-tight">
          {t("result.trajectory")}
        </h2>
      </div>
      <ResultChart
        data={controller.timelineChartData}
        unit={controller.speedUnit.toUpperCase()}
        height={220}
      />
    </AppCard>
  {/if}

  <!-- Bottom Actions -->
  <div class="flex flex-col items-center justify-center gap-3 pt-2">
    <AppButton
      large
      rounded
      tonal
      class="w-full max-w-[260px] sm:w-56 h-12 font-semibold flex items-center justify-center gap-2.5 bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text border border-tt-separator/60 shadow-xs hover:border-tt-primary/40 active:scale-[0.98] transition-all duration-150 cursor-pointer"
      onclick={controller.startNextTest}
    >
      <ArrowCounterClockwise class="w-4 h-4 shrink-0 text-tt-primary" />
      <span>{t("result.repeat")}</span>
    </AppButton>

    <!-- Shortcut Hint -->
    <p class="text-xs text-tt-text-secondary font-mono flex items-center gap-1.5">
      <span>{t("arena.hintPress")}</span>
      <kbd
        class="px-2 py-0.5 bg-tt-surface-2 rounded-md border border-tt-separator font-bold text-tt-text shadow-xs text-[11px]"
        >Ctrl</kbd
      >
      <span>+</span>
      <kbd
        class="px-2 py-0.5 bg-tt-surface-2 rounded-md border border-tt-separator font-bold text-tt-text shadow-xs text-[11px]"
        >Enter</kbd
      >
      <span>{t("result.shortcutToRepeat")}</span>
    </p>
  </div>
</AppPage>
