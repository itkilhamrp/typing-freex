import { describe, it, expect, beforeEach } from "vitest";
import { useAnalyticsController } from "./analytics.controller.svelte";
import { useSettingsStore } from "#lib/modules/settings/stores/settings.store.svelte.js";
import { useAnalyticsStore } from "../stores/analytics.store.svelte";

describe("useAnalyticsController (Svelte 5 Runes)", () => {
  beforeEach(() => {
    const settingsStore = useSettingsStore();
    settingsStore.resetSettingsState();
    const analyticsStore = useAnalyticsStore();
    analyticsStore.resetAnalyticsState();
  });

  it("formats speed in WPM and CPM accurately", () => {
    const settingsStore = useSettingsStore();
    const ctrl = useAnalyticsController();

    settingsStore.speedUnit = "wpm";
    expect(ctrl.formatSpeed(60)).toBe("60");

    settingsStore.speedUnit = "cpm";
    expect(ctrl.formatSpeed(60)).toBe("300");
  });

  it("formats active typing time cleanly", () => {
    const ctrl = useAnalyticsController();
    expect(ctrl.formatTime(45)).toBe("45s");
    expect(ctrl.formatTime(125)).toBe("2m 5s");
    expect(ctrl.formatTime(3665)).toBe("1h 1m");
  });

  it("evaluates key heatmap coloring correctly", () => {
    const ctrl = useAnalyticsController();
    const analyticsStore = useAnalyticsStore();

    analyticsStore.heatmap = [
      {
        key: "e",
        total_presses: 100,
        errors: 2,
        error_rate: 2.0,
        avg_latency_ms: 120,
      },
      {
        key: "t",
        total_presses: 100,
        errors: 8,
        error_rate: 8.0,
        avg_latency_ms: 150,
      },
      {
        key: "x",
        total_presses: 100,
        errors: 20,
        error_rate: 20.0,
        avg_latency_ms: 220,
      },
    ];

    const eColor = ctrl.getKeyHeatColor("e");
    expect(eColor.bg).toContain("ios-green");

    const tColor = ctrl.getKeyHeatColor("t");
    expect(tColor.bg).toContain("ios-orange");

    const xColor = ctrl.getKeyHeatColor("x");
    expect(xColor.bg).toContain("ios-red");
  });

  it("configures keyboard layout with decorative modifiers and functional shift", () => {
    const ctrl = useAnalyticsController();
    const rows = ctrl.keyCells;

    expect(rows).toHaveLength(5);

    // Flatten all key cells
    const allCells = rows.flat();

    // Decorative modifiers
    const decorativeKeys = ["backspace", "tab", "caps", "enter", "ctrl", "win", "alt", "fn"];
    for (const keyId of decorativeKeys) {
      const match = allCells.find((c) => c.id.startsWith(keyId));
      expect(match, `Expected ${keyId} to exist`).toBeDefined();
      expect(match?.isDecorative, `Expected ${keyId} to be decorative`).toBe(true);
      expect(match?.isModifier, `Expected ${keyId} to be a modifier`).toBe(true);
    }

    // Shift is a modifier but NOT decorative (functional toggle)
    const shiftLeft = allCells.find((c) => c.id === "shift-l");
    const shiftRight = allCells.find((c) => c.id === "shift-r");
    expect(shiftLeft?.isModifier).toBe(true);
    expect(shiftLeft?.isDecorative).toBe(false);
    expect(shiftRight?.isModifier).toBe(true);
    expect(shiftRight?.isDecorative).toBe(false);

    // Space is regular key
    const space = allCells.find((c) => c.id === "space");
    expect(space?.isModifier).toBe(false);
    expect(space?.isDecorative).toBe(false);

    // Decorative keys do not expose heatmap stats even if store contains them
    const analyticsStore = useAnalyticsStore();
    analyticsStore.heatmap = [
      { key: "backspace", total_presses: 50, errors: 0, error_rate: 0, avg_latency_ms: 100 },
      { key: "e", total_presses: 100, errors: 2, error_rate: 2.0, avg_latency_ms: 120 },
    ];
    const backspaceCell = ctrl.keyCells.flat().find((c) => c.id === "backspace");
    const eCell = ctrl.keyCells.flat().find((c) => c.id === "e");
    expect(backspaceCell?.rate).toBe("-");
    expect(backspaceCell?.totalPresses).toBe(0);
    expect(eCell?.rate).toBe("2%");
    expect(eCell?.totalPresses).toBe(100);
  });

  it("maintains distinct case-sensitive heatmap statistics for uppercase vs lowercase and symbols", () => {
    const ctrl = useAnalyticsController();
    const analyticsStore = useAnalyticsStore();

    analyticsStore.heatmap = [
      { key: "a", total_presses: 100, errors: 2, error_rate: 2.0, avg_latency_ms: 120 },
      { key: "A", total_presses: 50, errors: 10, error_rate: 20.0, avg_latency_ms: 210 },
      { key: "1", total_presses: 80, errors: 4, error_rate: 5.0, avg_latency_ms: 150 },
      { key: "!", total_presses: 30, errors: 6, error_rate: 20.0, avg_latency_ms: 220 },
    ];

    expect(ctrl.heatmapMap.get("a")?.error_rate).toBe(2.0);
    expect(ctrl.heatmapMap.get("A")?.error_rate).toBe(20.0);
    expect(ctrl.heatmapMap.get("1")?.error_rate).toBe(5.0);
    expect(ctrl.heatmapMap.get("!")?.error_rate).toBe(20.0);

    const aColor = ctrl.getKeyHeatColor("a");
    const upperAColor = ctrl.getKeyHeatColor("A");
    expect(aColor.bg).toContain("ios-green");
    expect(upperAColor.bg).toContain("ios-red");

    const num1Color = ctrl.getKeyHeatColor("1");
    const symExclColor = ctrl.getKeyHeatColor("!");
    expect(num1Color.bg).toContain("ios-orange");
    expect(symExclColor.bg).toContain("ios-red");
  });

  it("calculates dayStreak from dailyActivity accurately", () => {
    const ctrl = useAnalyticsController();
    const analyticsStore = useAnalyticsStore();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    analyticsStore.dailyActivity = [
      {
        date: fmt(twoDaysAgo),
        tests_completed: 3,
        time_spent_seconds: 60,
        words_typed: 40,
        best_wpm: 80,
        avg_wpm: 75,
      },
      {
        date: fmt(yesterday),
        tests_completed: 5,
        time_spent_seconds: 100,
        words_typed: 70,
        best_wpm: 85,
        avg_wpm: 78,
      },
      {
        date: fmt(today),
        tests_completed: 2,
        time_spent_seconds: 30,
        words_typed: 25,
        best_wpm: 82,
        avg_wpm: 80,
      },
    ];

    expect(ctrl.dayStreak).toBe(3);
  });

  it("computes 53-week activityGrid with quartiles and metadata", () => {
    const ctrl = useAnalyticsController();
    const analyticsStore = useAnalyticsStore();

    const today = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    analyticsStore.dailyActivity = [
      {
        date: fmt(today),
        tests_completed: 12,
        time_spent_seconds: 300,
        words_typed: 200,
        best_wpm: 95,
        avg_wpm: 88,
      },
    ];

    const grid = ctrl.activityGrid;
    expect(grid.columns).toHaveLength(53);
    for (const col of grid.columns) {
      expect(col).toHaveLength(7);
    }
    expect(grid.totalTests).toBe(12);
    expect(grid.maxDaily).toBe(12);
    expect(grid.months.length).toBeGreaterThan(0);

    // Today's cell in column 52 should have level 4 (since 12 is max)
    const col52 = grid.columns[52];
    expect(col52).toBeDefined();
    const todayCell = col52?.find((c) => c.date === fmt(today));
    expect(todayCell).toBeDefined();
    expect(todayCell?.count).toBe(12);
    expect(todayCell?.level).toBe(4);
    expect(todayCell?.bestWpm).toBe(95);
  });
});
