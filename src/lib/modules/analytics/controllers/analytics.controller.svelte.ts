/* eslint-disable svelte/prefer-svelte-reactivity -- ephemeral local Set/Date/Map used inside derived computations for zero proxy overhead */
import { useAnalyticsStore } from "../stores/analytics.store.svelte";
import { useSettingsStore } from "#lib/modules/settings/stores/settings.store.svelte.js";
import type { KeyHeatmapEntry } from "@/core/ipc";

export interface HeatStyle {
  readonly bg: string;
  readonly text: string;
  readonly border: string;
  readonly shadow: string;
}

export interface KeyDef {
  readonly id: string;
  readonly key: string;
  readonly span: number;
  readonly label?: string;
  readonly sub?: string;
  readonly isModifier?: boolean;
  readonly isDecorative?: boolean;
}

export interface ActivityCell {
  readonly date: string;
  readonly count: number;
  readonly level: 0 | 1 | 2 | 3 | 4;
  readonly isFuture: boolean;
  readonly timeSpentSeconds: number;
  readonly wordsTyped: number;
  readonly bestWpm: number;
  readonly avgWpm: number;
}

export interface ActivityMonth {
  readonly label: string;
  readonly colIndex: number;
}

export interface ActivityGridData {
  readonly columns: readonly (readonly ActivityCell[])[];
  readonly months: readonly ActivityMonth[];
  readonly totalTests: number;
  readonly maxDaily: number;
}

// Hoisted: allocated once for the whole app, never per component instance or per render.
// Standard ANSI 60% mechanical keyboard layout (60 grid columns per row: 1u = 4 span)
const KEYBOARD_ROWS: readonly (readonly KeyDef[])[] = [
  // Row 0: Number & Symbols (60 cols: 13 * 4 + 8 = 60)
  [
    { id: "grave", key: "`", span: 4, label: "`", sub: "~" },
    { id: "1", key: "1", span: 4, label: "1", sub: "!" },
    { id: "2", key: "2", span: 4, label: "2", sub: "@" },
    { id: "3", key: "3", span: 4, label: "3", sub: "#" },
    { id: "4", key: "4", span: 4, label: "4", sub: "$" },
    { id: "5", key: "5", span: 4, label: "5", sub: "%" },
    { id: "6", key: "6", span: 4, label: "6", sub: "^" },
    { id: "7", key: "7", span: 4, label: "7", sub: "&" },
    { id: "8", key: "8", span: 4, label: "8", sub: "*" },
    { id: "9", key: "9", span: 4, label: "9", sub: "(" },
    { id: "0", key: "0", span: 4, label: "0", sub: ")" },
    { id: "minus", key: "-", span: 4, label: "-", sub: "_" },
    { id: "equal", key: "=", span: 4, label: "=", sub: "+" },
    { id: "backspace", key: "backspace", span: 8, label: "Backspace", isModifier: true, isDecorative: true },
  ],
  // Row 1: Top Alpha & Brackets (60 cols: 6 + 10 * 4 + 4 + 4 + 6 = 60)
  [
    { id: "tab", key: "tab", span: 6, label: "Tab", isModifier: true, isDecorative: true },
    { id: "q", key: "q", span: 4, label: "Q" },
    { id: "w", key: "w", span: 4, label: "W" },
    { id: "e", key: "e", span: 4, label: "E" },
    { id: "r", key: "r", span: 4, label: "R" },
    { id: "t", key: "t", span: 4, label: "T" },
    { id: "y", key: "y", span: 4, label: "Y" },
    { id: "u", key: "u", span: 4, label: "U" },
    { id: "i", key: "i", span: 4, label: "I" },
    { id: "o", key: "o", span: 4, label: "O" },
    { id: "p", key: "p", span: 4, label: "P" },
    { id: "bracket-l", key: "[", span: 4, label: "[", sub: "{" },
    { id: "bracket-r", key: "]", span: 4, label: "]", sub: "}" },
    { id: "backslash", key: "\\", span: 6, label: "\\", sub: "|" },
  ],
  // Row 2: Home Row (60 cols: 7 + 9 * 4 + 4 + 4 + 9 = 60)
  [
    { id: "caps", key: "caps", span: 7, label: "Caps", isModifier: true, isDecorative: true },
    { id: "a", key: "a", span: 4, label: "A" },
    { id: "s", key: "s", span: 4, label: "S" },
    { id: "d", key: "d", span: 4, label: "D" },
    { id: "f", key: "f", span: 4, label: "F" },
    { id: "g", key: "g", span: 4, label: "G" },
    { id: "h", key: "h", span: 4, label: "H" },
    { id: "j", key: "j", span: 4, label: "J" },
    { id: "k", key: "k", span: 4, label: "K" },
    { id: "l", key: "l", span: 4, label: "L" },
    { id: "semicolon", key: ";", span: 4, label: ";", sub: ":" },
    { id: "quote", key: "'", span: 4, label: "'", sub: "\"" },
    { id: "enter", key: "enter", span: 9, label: "Enter", isModifier: true, isDecorative: true },
  ],
  // Row 3: Bottom Alpha & Punctuation (60 cols: 9 + 7 * 4 + 4 + 4 + 4 + 11 = 60)
  [
    { id: "shift-l", key: "shift", span: 9, label: "Shift", isModifier: true },
    { id: "z", key: "z", span: 4, label: "Z" },
    { id: "x", key: "x", span: 4, label: "X" },
    { id: "c", key: "c", span: 4, label: "C" },
    { id: "v", key: "v", span: 4, label: "V" },
    { id: "b", key: "b", span: 4, label: "B" },
    { id: "n", key: "n", span: 4, label: "N" },
    { id: "m", key: "m", span: 4, label: "M" },
    { id: "comma", key: ",", span: 4, label: ",", sub: "<" },
    { id: "dot", key: ".", span: 4, label: ".", sub: ">" },
    { id: "slash", key: "/", span: 4, label: "/", sub: "?" },
    { id: "shift-r", key: "shift", span: 11, label: "Shift", isModifier: true },
  ],
  // Row 4: Spacebar & Modifiers (60 cols: 5 + 5 + 5 + 25 + 5 + 5 + 5 = 60)
  [
    { id: "ctrl-l", key: "ctrl", span: 5, label: "Ctrl", isModifier: true, isDecorative: true },
    { id: "win", key: "win", span: 5, label: "Win", isModifier: true, isDecorative: true },
    { id: "alt-l", key: "alt", span: 5, label: "Alt", isModifier: true, isDecorative: true },
    { id: "space", key: " ", span: 25, label: "Space", isModifier: false },
    { id: "alt-r", key: "alt", span: 5, label: "Alt", isModifier: true, isDecorative: true },
    { id: "fn", key: "fn", span: 5, label: "Fn", isModifier: true, isDecorative: true },
    { id: "ctrl-r", key: "ctrl", span: 5, label: "Ctrl", isModifier: true, isDecorative: true },
  ],
];

const HEAT: Record<"idle" | "low" | "mid" | "high", HeatStyle> = {
  idle: {
    bg: "bg-tt-surface dark:bg-tt-surface-elevated",
    text: "text-tt-text",
    border: "border-transparent",
    shadow: "shadow-[0_2.5px_0_0_rgba(0,0,0,0.14)] dark:shadow-[0_2.5px_0_0_rgba(0,0,0,0.5)]",
  },
  low: {
    bg: "bg-ios-green/20 text-ios-green",
    text: "text-ios-green",
    border: "border-transparent",
    shadow: "shadow-[0_2.5px_0_0_rgba(52,199,89,0.35)]",
  },
  mid: {
    bg: "bg-ios-orange/20 text-ios-orange",
    text: "text-ios-orange font-semibold",
    border: "border-transparent",
    shadow: "shadow-[0_2.5px_0_0_rgba(255,149,0,0.35)]",
  },
  high: {
    bg: "bg-ios-red/20 text-ios-red",
    text: "text-ios-red font-bold",
    border: "border-transparent",
    shadow: "shadow-[0_2.5px_0_0_rgba(255,59,48,0.35)]",
  },
};

function heatStyle(entry?: KeyHeatmapEntry): HeatStyle {
  if (!entry || entry.total_presses === 0) return HEAT.idle;
  if (entry.error_rate >= 15) return HEAT.high;
  if (entry.error_rate >= 5) return HEAT.mid;
  return HEAT.low;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function useAnalyticsController() {
  const store = useAnalyticsStore();
  const settingsStore = useSettingsStore();

  const speedUnit = $derived(settingsStore.speedUnit);

  const formatSpeed = (wpm: number): string =>
    String(Math.round(speedUnit === "cpm" ? wpm * 5 : wpm));

  // Consecutive local days ending today (or yesterday): one Set pass + a short walk back, no sort.
  const dayStreak = $derived.by(() => {
    const days = new Set<string>();
    for (const a of store.dailyActivity) {
      if (a.tests_completed > 0 && a.date) days.add(a.date);
    }
    if (days.size === 0) return 0;

    const cursor = new Date();
    if (!days.has(toLocalDateString(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
      if (!days.has(toLocalDateString(cursor))) return 0;
    }

    let streak = 0;
    while (days.has(toLocalDateString(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  });

  const activityGrid = $derived.by((): ActivityGridData => {
    const activityMap = new Map<string, (typeof store.dailyActivity)[number]>();
    let totalTests = 0;
    let maxDaily = 0;

    for (const a of store.dailyActivity) {
      activityMap.set(a.date, a);
      totalTests += a.tests_completed;
      if (a.tests_completed > maxDaily) {
        maxDaily = a.tests_completed;
      }
    }

    const today = new Date();
    const todayDayOfWeek = today.getDay(); // 0 = Sun .. 6 = Sat
    const startDaysOffset = 52 * 7 + todayDayOfWeek;
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - startDaysOffset,
    );

    const q1 = Math.max(1, Math.ceil(maxDaily * 0.25));
    const q2 = Math.max(2, Math.ceil(maxDaily * 0.5));
    const q3 = Math.max(3, Math.ceil(maxDaily * 0.75));

    const getLevel = (count: number): 0 | 1 | 2 | 3 | 4 => {
      if (count <= 0) return 0;
      if (maxDaily <= 4) return Math.min(4, count) as 1 | 2 | 3 | 4;
      if (count <= q1) return 1;
      if (count <= q2) return 2;
      if (count <= q3) return 3;
      return 4;
    };

    const columns: ActivityCell[][] = [];
    const months: ActivityMonth[] = [];
    let lastMonth = -1;
    let lastMonthCol = -3;

    for (let c = 0; c < 53; c++) {
      const colCells: ActivityCell[] = [];
      for (let r = 0; r < 7; r++) {
        const dayOffset = c * 7 + r;
        const cellDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate() + dayOffset,
        );
        const dateStr = toLocalDateString(cellDate);
        const isFuture = dayOffset > startDaysOffset;

        if (isFuture) {
          colCells.push({
            date: dateStr,
            count: 0,
            level: 0,
            isFuture: true,
            timeSpentSeconds: 0,
            wordsTyped: 0,
            bestWpm: 0,
            avgWpm: 0,
          });
          continue;
        }

        const act = activityMap.get(dateStr);
        const count = act?.tests_completed ?? 0;
        colCells.push({
          date: dateStr,
          count,
          level: getLevel(count),
          isFuture: false,
          timeSpentSeconds: act?.time_spent_seconds ?? 0,
          wordsTyped: act?.words_typed ?? 0,
          bestWpm: act?.best_wpm ?? 0,
          avgWpm: act?.avg_wpm ?? 0,
        });

        if (r === 0) {
          const m = cellDate.getMonth();
          if (m !== lastMonth && (c - lastMonthCol >= 3 || lastMonth === -1)) {
            months.push({
              label: cellDate.toLocaleDateString(undefined, { month: 'short' }),
              colIndex: c,
            });
            lastMonth = m;
            lastMonthCol = c;
          }
        }
      }
      columns.push(colCells);
    }

    return {
      columns,
      months,
      totalTests,
      maxDaily,
    };
  });

  const heatmapMap = $derived.by(() => {
    const map = new Map<string, KeyHeatmapEntry>();
    for (const item of store.heatmap) map.set(item.key, item);
    return map;
  });

  const getKeyHeatColor = (key: string): HeatStyle => heatStyle(heatmapMap.get(key));

  // Render-ready keyboard: the view does zero lookups or styling logic per key.
  const keyCells = $derived(
    KEYBOARD_ROWS.map((row) =>
      row.map((def) => {
        const isDecorative = def.isDecorative ?? false;
        const isModifier = def.isModifier ?? false;
        const entry = isDecorative || isModifier ? undefined : heatmapMap.get(def.key);
        return {
          id: def.id,
          key: def.key,
          span: def.span,
          label: def.label ?? def.key.toUpperCase(),
          sub: def.sub,
          isModifier,
          isDecorative,
          ...heatStyle(entry),
          rate: entry?.total_presses ? `${entry.error_rate}%` : "-",
          totalPresses: entry?.total_presses ?? 0,
        };
      }),
    ),
  );

  // Each chart depends only on what it displays: switching speed unit never re-feeds the accuracy chart.
  const speedChartData = $derived(
    store.series.map((pt, i) => ({
      x: i + 1,
      y: Math.round(speedUnit === "cpm" ? pt.cpm : pt.wpm),
      secondaryY: Math.round(speedUnit === "cpm" ? pt.raw_cpm : pt.raw_wpm),
      label: `Test #${i + 1}`,
    })),
  );

  const accuracyChartData = $derived(
    store.series.map((pt, i) => ({
      x: i + 1,
      y: Math.round(pt.accuracy),
      label: `Test #${i + 1}`,
    })),
  );

  const accuracyMinY = $derived.by(() => {
    if (accuracyChartData.length === 0) return 80;
    let lowest = Infinity;
    for (const d of accuracyChartData) if (d.y < lowest) lowest = d.y;
    return Math.max(0, Math.floor((lowest - 5) / 10) * 10);
  });

  // Kept for API compatibility. Lazy: costs nothing unless something reads it.
  const chartData = $derived(
    store.series.map((pt, idx) => ({
      label: `#${idx + 1}`,
      speed: speedUnit === "cpm" ? pt.cpm : pt.wpm,
      rawSpeed: speedUnit === "cpm" ? pt.raw_cpm : pt.raw_wpm,
      accuracy: pt.accuracy,
    })),
  );

  return {
    store,
    get speedUnit() {
      return speedUnit;
    },
    formatSpeed,
    formatTime,
    get dayStreak() {
      return dayStreak;
    },
    get heatmapMap() {
      return heatmapMap;
    },
    keyboardRows: KEYBOARD_ROWS,
    getKeyHeatColor,
    get keyCells() {
      return keyCells;
    },
    get speedChartData() {
      return speedChartData;
    },
    get accuracyChartData() {
      return accuracyChartData;
    },
    get accuracyMinY() {
      return accuracyMinY;
    },
    get chartData() {
      return chartData;
    },
    get activityGrid() {
      return activityGrid;
    },
  };
}