<script lang="ts">
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import LineChart from "#lib/shared/ui/charts/LineChart.svelte";
  import { AppCard } from "#lib/shared/ui/index.js";

  interface SpeedChartPoint {
    readonly x: number;
    readonly y: number;
    readonly secondaryY?: number;
    readonly label: string;
  }

  interface AccuracyChartPoint {
    readonly x: number;
    readonly y: number;
    readonly label: string;
  }

  interface Props {
    speedChartData: readonly SpeedChartPoint[];
    accuracyChartData: readonly AccuracyChartPoint[];
    accuracyMinY: number;
    speedUnit: string;
  }

  const {
    speedChartData,
    accuracyChartData,
    accuracyMinY,
    speedUnit,
  }: Props = $props();

  const { t } = useI18n();
</script>

<!-- Charts Section -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
  <!-- Speed Trajectory Chart -->
  <AppCard padding="p-5" class="flex flex-col justify-between">
    <div class="flex items-center justify-between mb-2">
      <div>
        <h2 class="text-base font-bold text-tt-text">
          {t("analytics.speedTrend")}
        </h2>
        <p class="text-xs text-tt-text-secondary">
          {t("analytics.speedChartDesc", { unit: speedUnit.toUpperCase() })}
        </p>
      </div>
      <span
        class="px-2.5 py-0.5 text-2xs rounded-full bg-ios-blue/15 text-ios-blue font-semibold"
      >
        {t("analytics.speedBadge")}
      </span>
    </div>

    {#if speedChartData.length > 0}
      <div class="min-h-[190px] flex items-center">
        <LineChart
          data={[...speedChartData]}
          height={185}
          color="var(--color-ios-blue, #007aff)"
          secondaryColor="var(--tt-text-secondary, #8e8e93)"
          primaryLabel={t("analytics.speedNet")}
          secondaryLabel={t("analytics.speedRaw")}
          unit={speedUnit.toUpperCase()}
          showArea={true}
          showLegend={true}
        />
      </div>
    {:else}
      <div
        class="h-44 flex items-center justify-center text-sm text-tt-text-secondary font-mono"
      >
        {t("analytics.noTests")}
      </div>
    {/if}
  </AppCard>

  <!-- Accuracy Trajectory Chart -->
  <AppCard padding="p-5" class="flex flex-col justify-between">
    <div class="flex items-center justify-between mb-2">
      <div>
        <h2 class="text-base font-bold text-tt-text">
          {t("analytics.accuracyTrend")}
        </h2>
        <p class="text-xs text-tt-text-secondary">{t("analytics.accuracyChartDesc")}</p>
      </div>
      <span
        class="px-2.5 py-0.5 text-2xs rounded-full bg-ios-green/15 text-ios-green font-semibold"
      >
        {t("analytics.accuracyLabel")}
      </span>
    </div>

    {#if accuracyChartData.length > 0}
      <div class="min-h-[190px] flex items-center">
        <LineChart
          data={[...accuracyChartData]}
          height={185}
          color="var(--color-ios-green, #34c759)"
          primaryLabel={t("analytics.accuracyLabel")}
          unit="%"
          minY={accuracyMinY}
          maxY={100}
          showArea={true}
          showLegend={false}
        />
      </div>
    {:else}
      <div
        class="h-44 flex items-center justify-center text-sm text-tt-text-secondary font-mono"
      >
        {t("analytics.noTests")}
      </div>
    {/if}
  </AppCard>
</div>

