<script lang="ts">
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import { AppCard } from "#lib/shared/ui/index.js";
  import type { ActivityGridData, ActivityCell } from "../controllers/analytics.controller.svelte";

  interface Props {
    gridData: ActivityGridData;
    speedUnit?: string;
    formatTime?: (seconds: number) => string;
  }

  const {
    gridData,
    speedUnit = "wpm",
    formatTime = (s: number) => `${Math.round(s)}s`,
  }: Props = $props();

  const { t } = useI18n();

  const testsSubtitle = $derived(
    t("analytics.testsLast12Months", { count: gridData.totalTests })
  );

  // Skip the partial first month (col 0) if 13 months were generated, matching Monkeytype's 12-month calendar (nov-oct)
  const displayMonths = $derived.by(() => {
    if (gridData.months.length > 12) {
      return gridData.months.slice(1);
    }
    return gridData.months;
  });

  function getCellClasses(level: 0 | 1 | 2 | 3 | 4, isFuture: boolean): string {
    if (isFuture) {
      return "opacity-0 pointer-events-none select-none";
    }
    switch (level) {
      case 0:
        return "bg-[#e2e4e7] dark:bg-[#2c2e31] hover:opacity-80";
      case 1:
        return "bg-[#fae8a4] dark:bg-[#4d4626] hover:opacity-80";
      case 2:
        return "bg-[#f4d068] dark:bg-[#7a6e2d] hover:opacity-80";
      case 3:
        return "bg-[#ebb819] dark:bg-[#b89d28] hover:opacity-80";
      case 4:
        return "bg-[#d4a30a] dark:bg-[#e2b714] hover:opacity-80";
    }
  }

  function getTooltipText(cell: ActivityCell): string {
    if (cell.isFuture) return "";
    const parts = cell.date.split("-");
    const y = Number(parts[0] ?? "2026");
    const m = Number(parts[1] ?? "1");
    const d = Number(parts[2] ?? "1");
    const dateObj = new Date(y, m - 1, d);
    const dateLabel = dateObj.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    if (cell.count === 0) {
      return t("analytics.testsOnDateZero", { date: dateLabel });
    }

    let text =
      cell.count === 1
        ? t("analytics.testsOnDateOne", { count: cell.count, date: dateLabel })
        : t("analytics.testsOnDateMany", { count: cell.count, date: dateLabel });
    if (cell.bestWpm > 0) {
      text += `\n${t("analytics.heatmapBest", {
        speed: cell.bestWpm,
        unit: speedUnit.toUpperCase(),
      })}`;
    }
    if (cell.timeSpentSeconds > 0) {
      text += ` · ${t("analytics.heatmapTime", { time: formatTime(cell.timeSpentSeconds) })}`;
    }
    return text;
  }
</script>

<div class="w-full">
  <AppCard padding="p-3.5 sm:p-4" class="w-full space-y-2.5" style="contain: layout style; content-visibility: auto;">
    <!-- Safe-Centering Container: Prevents left truncation (wednesday) and right truncation (more) -->
    <div class="overflow-x-auto pb-1 pt-1 -mx-1 px-1 scrollbar-none">
      <div class="inline-flex flex-col min-w-full items-center select-none py-1">
        <div class="flex flex-col gap-2.5 w-fit shrink-0">
          <!-- Header: 7774 tests last 12 months (left) | less ■■■■■ more (right) -->
          <div class="flex items-center justify-between font-mono text-xs text-tt-text-secondary w-full">
            <span>{testsSubtitle}</span>

            <div class="flex items-center gap-1.5">
              <span class="text-3xs sm:text-2xs">{t("common.less").toLowerCase()}</span>
              <div class="flex items-center gap-[3px]">
                {#each [0, 1, 2, 3, 4] as const as lvl (lvl)}
                  <span
                    class={["w-[12px] h-[12px] rounded-[2px]", getCellClasses(lvl, false)].join(" ")}
                    title={t("analytics.levelTooltip", { level: lvl })}
                  ></span>
                {/each}
              </div>
              <span class="text-3xs sm:text-2xs">{t("common.more").toLowerCase()}</span>
            </div>
          </div>

          <!-- Main Activity Heatmap Grid -->
          <div class="flex items-center">
            <!-- Weekday Labels (monday, wednesday, friday) aligned with rows 1, 3, 5 -->
            <div class="w-[68px] shrink-0 flex flex-col gap-[3px] pr-2 text-right font-mono select-none">
              <span class="h-[12px] flex items-center justify-end text-xs text-tt-text-secondary/60 leading-none"></span>
              <span class="h-[12px] flex items-center justify-end text-xs text-tt-text-secondary/60 leading-none">{t("analytics.weekdayMon")}</span>
              <span class="h-[12px] flex items-center justify-end text-xs text-tt-text-secondary/60 leading-none"></span>
              <span class="h-[12px] flex items-center justify-end text-xs text-tt-text-secondary/60 leading-none">{t("analytics.weekdayWed")}</span>
              <span class="h-[12px] flex items-center justify-end text-xs text-tt-text-secondary/60 leading-none"></span>
              <span class="h-[12px] flex items-center justify-end text-xs text-tt-text-secondary/60 leading-none">{t("analytics.weekdayFri")}</span>
              <span class="h-[12px] flex items-center justify-end text-xs text-tt-text-secondary/60 leading-none"></span>
            </div>

            <!-- 53 Columns of 7 Days (12px squares, 3px gap, 2px radius, NO BORDERS) -->
            <div class="flex gap-[3px] shrink-0" role="grid" aria-label={t("analytics.activityGraph")}>
              {#each gridData.columns as col, cIndex (cIndex)}
                <div class="flex flex-col gap-[3px] shrink-0" role="row">
                  {#each col as cell, rIndex (`${cell.date}-${rIndex}`)}
                    <div
                      role="gridcell"
                      tabindex={cell.isFuture ? -1 : 0}
                      class={[
                        "w-[12px] h-[12px] rounded-[2px] transition-opacity duration-75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-tt-primary",
                        cell.isFuture ? "" : "cursor-pointer",
                        getCellClasses(cell.level, cell.isFuture)
                      ].join(" ")}
                      title={getTooltipText(cell)}
                      aria-label={getTooltipText(cell)}
                    ></div>
                  {/each}
                </div>
              {/each}
            </div>
          </div>

          <!-- Month Labels Header (below grid, offset 68px matching weekday labels) -->
          <div class="flex items-center select-none pt-1">
            <div class="w-[68px] shrink-0"></div>
            <div class="relative h-4 w-[792px] shrink-0">
              {#each displayMonths as m (`month-${m.colIndex}-${m.label}`)}
                <span
                  class="absolute text-xs font-mono text-tt-text-secondary/60 leading-none whitespace-nowrap lowercase"
                  style="left: {Math.min(m.colIndex * 15, 792 - 28)}px;"
                >
                  {m.label.toLowerCase()}
                </span>
              {/each}
            </div>
          </div>

          <!-- Footer Note: Centered monospace note (Monkeytype style) -->
          <div class="text-[10px] font-mono text-tt-text-secondary/45 text-center pt-1.5 select-none">
            {t("analytics.notePrefix")} {t("analytics.activityTimezoneNote")}
          </div>
        </div>
      </div>
    </div>
  </AppCard>
</div>
