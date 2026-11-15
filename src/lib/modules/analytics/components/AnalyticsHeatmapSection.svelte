<script lang="ts">
  import type { KeyHeatmapEntry } from "@/core/ipc";
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import type { HeatStyle } from "../controllers/analytics.controller.svelte";
  import { AppCard } from "#lib/shared/ui/index.js";
  import { X } from "phosphor-svelte";

  interface KeyCellItem {
    readonly id: string;
    readonly key: string;
    readonly span: number;
    readonly label: string;
    readonly sub?: string;
    readonly isModifier: boolean;
    readonly isDecorative: boolean;
    readonly bg: string;
    readonly text: string;
    readonly border: string;
    readonly shadow: string;
    readonly rate: string;
    readonly totalPresses: number;
  }

  interface Props {
    keyCells: readonly (readonly KeyCellItem[])[];
    heatmapMap: ReadonlyMap<string, KeyHeatmapEntry>;
    getKeyHeatColor: (key: string) => HeatStyle;
  }

  const { keyCells, heatmapMap, getKeyHeatColor }: Props = $props();

  const { t } = useI18n();

  // Mechanical keycap styling: minimal, premium, zero-outline, tactile physical depth.
  const KEY_BASE =
    "relative h-11 sm:h-12 rounded-lg flex flex-col items-center justify-center transition-[transform,box-shadow,background-color] duration-100 select-none overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-tt-primary/50";
  const KEY_ACTIVE =
    "translate-y-[1px] shadow-none ring-1 ring-tt-primary/50 z-10";
  const KEY_IDLE =
    "cursor-pointer hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none";
  const KEY_DECORATIVE = "cursor-default opacity-60 pointer-events-none";
  const KEY_SHIFT_ACTIVE =
    "cursor-pointer translate-y-[1px] shadow-none ring-1 ring-tt-primary/50 bg-tt-primary/15 text-tt-primary z-10 hover:-translate-y-0.5";

  let shiftActive = $state(false);
  let selectedCellId = $state<string | null>(null);

  function getCellActiveChar(cell: KeyCellItem, shifted: boolean): string {
    if (cell.isDecorative || cell.isModifier) return cell.key;
    if (shifted) {
      if (cell.sub) return cell.sub;
      if (cell.key === " ") return " ";
      return cell.label ? cell.label.toUpperCase() : cell.key.toUpperCase();
    }
    if (cell.key === " ") return " ";
    return cell.key;
  }

  // O(1) lookup map for cells by ID
  const cellByIdMap = $derived.by(() => {
    const record: Record<string, KeyCellItem> = {};
    for (const row of keyCells) {
      for (const cell of row) {
        record[cell.id] = cell;
      }
    }
    return {
      get: (id: string): KeyCellItem | undefined => record[id],
    };
  });

  // Pre-compute keycap visual states independent of selectedCellId so clicking a key is O(1)
  const preparedKeyRows = $derived.by(() => {
    const isShifted = shiftActive;
    const hMap = heatmapMap;

    return keyCells.map((row) =>
      row.map((cell) => {
        const activeChar = getCellActiveChar(cell, isShifted);
        const isShift = cell.key === "shift";
        const isRegularKey = !cell.isDecorative && !cell.isModifier;
        const heat = isRegularKey
          ? getKeyHeatColor(activeChar)
          : { bg: cell.bg, text: cell.text, shadow: cell.shadow };

        const displayLabel =
          cell.isModifier || cell.isDecorative
            ? cell.label
            : cell.key === " "
              ? t("analytics.spaceKey")
              : activeChar;

        let rate = "-";
        if (isRegularKey && cell.key !== " ") {
          const entry = hMap.get(activeChar);
          if (entry?.total_presses) {
            rate = `${entry.error_rate}%`;
          }
        }

        const idleClass = cell.isDecorative
          ? `${KEY_BASE} ${cell.bg} ${cell.shadow} ${KEY_DECORATIVE}`
          : isShift
            ? isShifted
              ? `${KEY_BASE} ${KEY_SHIFT_ACTIVE}`
              : `${KEY_BASE} ${cell.bg} ${cell.shadow} ${KEY_IDLE}`
            : `${KEY_BASE} ${heat.bg} ${heat.shadow} ${KEY_IDLE}`;

        const activeClass = `${KEY_BASE} ${heat.bg} ${KEY_ACTIVE}`;

        const titleText = cell.isDecorative
          ? cell.label
          : isShift
            ? isShifted
              ? t("analytics.shiftActive")
              : t("analytics.shiftToggle")
            : t("analytics.keyTooltip", { label: displayLabel });

        return {
          cell,
          id: cell.id,
          span: cell.span,
          isDecorative: cell.isDecorative,
          isModifier: cell.isModifier,
          isShift,
          isSpace: cell.key === " ",
          sub: cell.sub,
          totalPresses: cell.totalPresses,
          cellRate: cell.rate,
          heatText: heat.text,
          displayLabel,
          rate,
          idleClass,
          activeClass,
          titleText,
        };
      }),
    );
  });

  function handleKeyboardGridClick(e: MouseEvent) {
    const target = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      "button[data-cell-id]",
    );
    if (!target) return;
    const cellId = target.dataset.cellId;
    if (!cellId) return;
    const cell = cellByIdMap.get(cellId);
    if (!cell || cell.isDecorative) return;

    if (cell.key === "shift") {
      shiftActive = !shiftActive;
      return;
    }
    selectedCellId = selectedCellId === cell.id ? null : cell.id;
  }

  const selectedCell = $derived(
    selectedCellId ? (cellByIdMap.get(selectedCellId) ?? null) : null,
  );

  const activeSelectedChar = $derived(
    selectedCell ? getCellActiveChar(selectedCell, shiftActive) : null,
  );

  const selectedKeyStat = $derived(
    activeSelectedChar
      ? (heatmapMap.get(activeSelectedChar) ?? null)
      : null,
  );
</script>

<!-- Key Heatmap Section -->
<AppCard
  padding="p-5 sm:p-6"
  class="flex flex-col gap-4 sm:gap-5"
  style="content-visibility: auto; contain-intrinsic-size: 0 380px;"
>
  <div
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-tt-separator/30"
  >
    <div>
      <h2 class="text-lg font-bold text-tt-text">
        {t("analytics.keyHeatmap")}
      </h2>
      <p class="text-xs text-tt-text-secondary mt-1">
        {t("analytics.heatmapDesc")}
      </p>
    </div>
    <!-- Legend -->
    <div
      class="flex items-center gap-2 sm:gap-2.5 text-xs text-tt-text-secondary flex-wrap"
    >
      <div
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tt-surface-2 border border-tt-separator/50 shadow-2xs"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-ios-green shadow-xs"></span>
        <span class="font-medium text-tt-text text-2xs">{t("analytics.legendLt5")}</span>
      </div>
      <div
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tt-surface-2 border border-tt-separator/50 shadow-2xs"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-ios-orange shadow-xs"></span>
        <span class="font-medium text-tt-text text-2xs">{t("analytics.legend5to15")}</span>
      </div>
      <div
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tt-surface-2 border border-tt-separator/50 shadow-2xs"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-ios-red shadow-xs"></span>
        <span class="font-medium text-tt-text text-2xs">{t("analytics.legendGt15")}</span>
      </div>
    </div>
  </div>

  <!-- Virtual Mechanical Keyboard Grid (Delegated Click Handling) -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="p-3 sm:p-4 md:p-5 bg-tt-surface-2 rounded-2xl border border-tt-separator flex flex-col gap-1.5 sm:gap-2 overflow-x-auto min-w-0"
    onclick={handleKeyboardGridClick}
  >
    <div
      class="min-w-[640px] sm:min-w-[700px] flex flex-col gap-1.5 sm:gap-2 w-full"
    >
      {#each preparedKeyRows as row, rIdx (rIdx)}
        <div
          class="w-full gap-1 sm:gap-1.5 items-stretch"
          style="display: grid; grid-template-columns: repeat(60, minmax(0, 1fr));"
        >
          {#each row as item (item.id)}
            {@const isSelected =
              !item.isDecorative &&
              !item.isShift &&
              selectedCellId === item.id}
            <button
              type="button"
              data-cell-id={item.id}
              style="contain: layout style; grid-column: span {item.span};"
              class={isSelected ? item.activeClass : item.idleClass}
              title={item.titleText}
              tabindex={item.isDecorative ? -1 : 0}
            >
              <!-- Keycap Top Lighting Dish -->
              <div
                class="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 dark:from-white/5 to-transparent rounded-t-lg"
              ></div>

              <!-- Sub-legend (Shift character) for number/symbol keys -->
              {#if item.sub && !shiftActive}
                <span
                  class="pointer-events-none absolute top-1 left-1.5 text-[9px] font-mono leading-none text-tt-text-secondary/70 select-none"
                >
                  {item.sub}
                </span>
              {/if}

              <!-- Primary Legend -->
              <span
                class="pointer-events-none {item.isModifier ||
                item.isDecorative
                  ? 'text-xs sm:text-[13px] font-semibold tracking-tight'
                  : item.isSpace
                    ? 'text-xs font-medium tracking-widest uppercase'
                    : 'text-sm sm:text-base font-bold font-mono'} leading-none {item.isShift &&
                shiftActive
                  ? 'text-tt-primary font-bold'
                  : item.heatText}"
              >
                {item.displayLabel}
              </span>

              <!-- Rate / Latency Micro-badge -->
              {#if !item.isDecorative && !item.isModifier && !item.isSpace}
                <span
                  class="pointer-events-none text-[9px] font-mono tabular-nums leading-none mt-1 {item.rate !==
                  '-'
                    ? item.heatText
                    : 'text-tt-text-secondary/50'}"
                >
                  {item.rate}
                </span>
              {:else if !item.isDecorative && !item.isModifier && item.isSpace && item.totalPresses > 0}
                <span
                  class="pointer-events-none text-[9px] font-mono tabular-nums leading-none mt-0.5 text-tt-text-secondary/70"
                >
                  {item.cellRate}
                </span>
              {/if}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  <!-- Key Detail Card -->
  {#if selectedCell && activeSelectedChar}
    {@const keyName =
      activeSelectedChar === " " ? t("analytics.spaceKey") : activeSelectedChar}
    <div
      class="mt-3 sm:mt-4 p-4 sm:p-5 rounded-2xl bg-tt-surface-2 border border-tt-separator flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in"
    >
      <div class="flex items-center gap-3.5">
        <div
          class="relative w-12 h-12 rounded-xl bg-tt-surface dark:bg-tt-surface-elevated shadow-[0_3px_0_0_rgba(0,0,0,0.14)] dark:shadow-[0_3px_0_0_rgba(0,0,0,0.5)] flex items-center justify-center text-lg sm:text-xl font-bold font-mono text-tt-primary select-none overflow-hidden ring-1 ring-tt-primary/30"
        >
          <!-- Keycap Top Lighting Dish -->
          <div
            class="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 dark:from-white/5 to-transparent rounded-t-xl"
          ></div>
          <span class="relative z-10 leading-none">
            {activeSelectedChar === " "
              ? t("analytics.spaceShort")
              : activeSelectedChar.length > 3
                ? activeSelectedChar.slice(0, 3)
                : activeSelectedChar}
          </span>
        </div>
        <div>
          <div class="font-bold text-sm text-tt-text">
            {t("analytics.keyPerformance", { key: keyName })}
          </div>
          <div class="text-xs text-tt-text-secondary mt-0.5">
            {t("analytics.totalPresses")} <span class="font-semibold text-tt-text"
              >{selectedKeyStat?.total_presses ?? 0}</span
            >
            &bull; {t("analytics.errorsLabel")}
            <span class="font-semibold text-tt-text"
              >{selectedKeyStat?.errors ?? 0}</span
            >
          </div>
        </div>
      </div>

      <div class="flex items-center gap-6 self-end sm:self-auto">
        <div class="text-right">
          <div
            class="text-2xs text-tt-text-secondary uppercase tracking-wider font-semibold"
          >
            {t("analytics.errorRate")}
          </div>
          <div
            class="text-base font-bold font-mono {(selectedKeyStat?.error_rate ??
              0) > 5
              ? 'text-ios-red'
              : 'text-ios-green'}"
          >
            {selectedKeyStat?.error_rate ?? 0}%
          </div>
        </div>
        <div class="text-right">
          <div
            class="text-2xs text-tt-text-secondary uppercase tracking-wider font-semibold"
          >
            {t("analytics.avgLatency")}
          </div>
          <div class="text-base font-bold font-mono text-ios-blue">
            {selectedKeyStat?.avg_latency_ms
              ? `${selectedKeyStat.avg_latency_ms}ms`
              : "-"}
          </div>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg text-tt-text-secondary hover:text-tt-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title={t("common.close")}
          aria-label={t("common.close")}
          onclick={() => (selectedCellId = null)}
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  {/if}
</AppCard>

