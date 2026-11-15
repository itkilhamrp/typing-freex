<script lang="ts">
  import type { StatsSummary } from "@/core/ipc";
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import { AppKpiCard } from "#lib/shared/ui/index.js";
  import {
    Pulse,
    Clock,
    Lightning,
    Trophy,
    CheckCircle,
    Flame,
  } from "phosphor-svelte";

  interface Props {
    summary: StatsSummary | null;
    dayStreak: number;
    speedUnit: string;
    formatSpeed: (wpm: number) => string;
    formatTime: (seconds: number) => string;
  }

  const { summary, dayStreak, speedUnit, formatSpeed, formatTime }: Props = $props();

  const { t } = useI18n();
</script>

<!-- KPI Summary Cards -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
  <AppKpiCard
    label={t("analytics.testsCompleted")}
    value={summary?.total_tests ?? 0}
    subtext={`${summary?.total_words ?? 0} ${t("customText.words")}`}
    icon={Pulse}
    highlight={true}
  />

  <AppKpiCard
    label={t("analytics.typingTime")}
    value={formatTime(summary?.total_time_seconds ?? 0)}
    subtext={t("analytics.activePractice")}
    icon={Clock}
  />

  <AppKpiCard
    label={t("analytics.avgSpeed")}
    value={formatSpeed(summary?.avg_wpm ?? 0)}
    unit={speedUnit.toUpperCase()}
    subtext={t("analytics.overallMean")}
    icon={Lightning}
  />

  <AppKpiCard
    label={t("analytics.peak")}
    value={formatSpeed(summary?.highest_wpm ?? 0)}
    unit={speedUnit.toUpperCase()}
    subtext={t("analytics.personalBest")}
    icon={Trophy}
  />

  <AppKpiCard
    label={t("analytics.avgAccuracy")}
    value={`${summary?.avg_accuracy ?? 0}%`}
    subtext={summary?.avg_consistency
      ? t("analytics.consistencySubtext", { value: summary.avg_consistency })
      : t("analytics.consistent")}
    icon={CheckCircle}
  />

  <AppKpiCard
    label={t("analytics.streak")}
    value={dayStreak}
    unit={t("analytics.daysUnit")}
    subtext={t("analytics.dailyMomentum")}
    icon={Flame}
  />
</div>
