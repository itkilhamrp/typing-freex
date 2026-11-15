<script lang="ts">
  import { onMount } from "svelte";
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import { useAnalyticsController } from "../controllers/analytics.controller.svelte";
  import AnalyticsSummarySection from "./AnalyticsSummarySection.svelte";
  import AnalyticsChartsSection from "./AnalyticsChartsSection.svelte";
  import AnalyticsHeatmapSection from "./AnalyticsHeatmapSection.svelte";
  import AnalyticsPersonalBests from "./AnalyticsPersonalBests.svelte";
  import ActivityHeatmap from "./ActivityHeatmap.svelte";
  import {
    AppPage,
    AppSegmented,
    AppSegmentedButton,
  } from "#lib/shared/ui/index.js";

  const { t } = useI18n();

  const ctrl = useAnalyticsController();
  const store = ctrl.store;
  const { formatSpeed, formatTime } = ctrl;

  type ModeFilter = Parameters<typeof store.setSelectedMode>[0];
  type TimeRangeFilter = Parameters<typeof store.setTimeRange>[0];

  const MODE_FILTERS: readonly { id: ModeFilter; i18nKey: string }[] = [
    { id: "all", i18nKey: "analytics.allModes" },
    { id: "time", i18nKey: "arena.modeTime" },
    { id: "words", i18nKey: "arena.modeWords" },
    { id: "quote", i18nKey: "arena.modeQuote" },
    { id: "tech", i18nKey: "arena.modeTech" },
  ];

  const TIME_RANGE_FILTERS: readonly TimeRangeFilter[] = [
    "all",
    "month",
    "week",
    "today",
  ];

  function handleModeChange(mode: ModeFilter) {
    store.setSelectedMode(mode);
  }

  function handleTimeRangeChange(range: TimeRangeFilter) {
    store.setTimeRange(range);
  }

  onMount(() => {
    store.fetchAll();
  });
</script>

<AppPage maxWidth="max-w-5xl" class="select-none animate-fade-in">
  <!-- Header with Filters -->
  <div
    class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-tt-separator pb-6"
  >
    <div>
      <h1 class="text-3xl font-extrabold tracking-tight">
        {t("analytics.title")}
      </h1>
      <p class="text-sm text-tt-text-secondary mt-1">
        {t("analytics.subtitle")}
      </p>
    </div>

    <!-- 2-Row Filter Layout: Row 1 = Mode filter, Row 2 = Time range filter -->
    <div
      class="flex flex-col gap-2.5 w-full sm:w-auto items-start lg:items-end shrink-0"
    >
      <!-- Row 1: Mode filter buttons -->
      <AppSegmented rounded strong class="w-full sm:w-[450px] md:w-[480px]">
        {#each MODE_FILTERS as m (m.id)}
          <AppSegmentedButton
            active={store.selectedMode === m.id}
            class="capitalize text-xs sm:text-sm whitespace-nowrap"
            onclick={() => handleModeChange(m.id)}
          >
            {t(m.i18nKey)}
          </AppSegmentedButton>
        {/each}
      </AppSegmented>

      <!-- Row 2: Time range filter buttons -->
      <AppSegmented rounded strong class="w-full sm:w-[370px] md:w-[390px]">
        {#each TIME_RANGE_FILTERS as r (r)}
          <AppSegmentedButton
            active={store.timeRange === r}
            class="capitalize text-xs sm:text-sm whitespace-nowrap"
            onclick={() => handleTimeRangeChange(r)}
          >
            {r === "all"
              ? t("analytics.allTime")
              : r === "month"
                ? t("analytics.days30")
                : r === "week"
                  ? t("analytics.days7")
                  : t("analytics.today24h")}
          </AppSegmentedButton>
        {/each}
      </AppSegmented>
    </div>
  </div>

  {#if store.error}
    <div
      class="p-3.5 rounded-xl bg-status-red/10 border border-status-red/30 text-status-red text-xs font-semibold flex items-center justify-between animate-fade-in"
    >
      <span>{t("common.error", { message: store.error })}</span>
    </div>
  {/if}

  <AnalyticsSummarySection
    summary={store.summary}
    dayStreak={ctrl.dayStreak}
    speedUnit={ctrl.speedUnit}
    {formatSpeed}
    {formatTime}
  />

  <AnalyticsChartsSection
    speedChartData={ctrl.speedChartData}
    accuracyChartData={ctrl.accuracyChartData}
    accuracyMinY={ctrl.accuracyMinY}
    speedUnit={ctrl.speedUnit}
  />

  <AnalyticsHeatmapSection
    keyCells={ctrl.keyCells}
    heatmapMap={ctrl.heatmapMap}
    getKeyHeatColor={ctrl.getKeyHeatColor}
  />

  <AnalyticsPersonalBests
    personalBests={store.personalBests}
    speedUnit={ctrl.speedUnit}
    {formatSpeed}
  />

  <!-- 12-Month Activity Heatmap (GitHub Contribution Graph Style) -->
  <ActivityHeatmap
    gridData={ctrl.activityGrid}
    speedUnit={ctrl.speedUnit}
    {formatTime}
  />
</AppPage>
