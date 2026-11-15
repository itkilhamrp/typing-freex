import { describe, it, expect, vi, beforeEach } from "vitest";
import { useResultController } from "./result.controller.svelte";
import { useTypingStore } from "#lib/modules/modes/classic/stores/typing.store.svelte.js";
import type { FinalResult } from "@/core/typing-engine";

import { useSettingsStore } from "#lib/modules/settings/stores/settings.store.svelte.js";

const gotoMock = vi.fn();
vi.mock("$app/navigation", () => ({
  goto: gotoMock,
}));

const mockResult: FinalResult = {
  uuid: "test-12345",
  config: {
    mode: "words",
    wordLimit: 25,
  },
  completedAt: "2026-03-30T10:00:00.000Z",
  durationSeconds: 15.5,
  wpm: 60,
  rawWpm: 70,
  accuracy: 95.5,
  consistency: 82.4,
  liveMetrics: {
    wpm: 60,
    rawWpm: 70,
    accuracy: 95.5,
    consistency: 82.4,
    correctChars: 95,
    incorrectChars: 5,
    extraChars: 2,
    missedChars: 1,
    characterProducingKeystrokes: 100,
    totalKeystrokes: 150,
  },
  timeline: [
    { second: 1, wpm: 50, rawWpm: 55, errors: 0 },
    { second: 2, wpm: 60, rawWpm: 65, errors: 1 },
    { second: 3, wpm: 70, rawWpm: 75, errors: 0 },
  ],
  keyStats: {},
  latencyStats: {
    meanMs: 125,
    medianMs: 120,
    p95Ms: 250,
    pausesCount: 0,
  },
  rawEvents: [],
};

describe("useResultController (Svelte 5 Runes)", () => {
  beforeEach(() => {
    gotoMock.mockClear();
    vi.clearAllMocks();
    const store = useTypingStore();
    store.resetTypingState();
    const settingsStore = useSettingsStore();
    settingsStore.resetSettingsState();
  });

  it("provides safe defaults when no result is present", () => {
    const controller = useResultController();

    expect(controller.result).toBeNull();
    expect(controller.netSpeed).toBe(0);
    expect(controller.rawSpeed).toBe(0);
    expect(controller.accuracy).toBe("100.0");
    expect(controller.consistency).toBe("—");
    expect(controller.duration).toBe("0s");
    expect(controller.charBreakdown).toEqual({
      correct: 0,
      incorrect: 0,
      extra: 0,
      missed: 0,
    });
    expect(controller.wpmSeries).toEqual([]);
    expect(controller.errorSeries).toEqual([]);
  });

  it("formats KPIs and breakdown correctly when result is present", () => {
    const store = useTypingStore();
    store.setLastResult(mockResult);

    const controller = useResultController();

    expect(controller.netSpeed).toBe(60);
    expect(controller.rawSpeed).toBe(70);
    expect(controller.accuracy).toBe("95.5");
    expect(controller.consistency).toBe("82.4%");
    expect(controller.duration).toBe("15.5s");
    expect(controller.charBreakdown).toEqual({
      correct: 95,
      incorrect: 5,
      extra: 2,
      missed: 1,
    });
  });

  it("updates chart series and speeds when unit toggles to CPM (AC-09)", () => {
    const store = useTypingStore();
    store.setLastResult(mockResult);
    store.setSpeedUnit("wpm");

    const controller = useResultController();
    expect(controller.netSpeed).toBe(60);
    expect(controller.wpmSeries[0]?.y).toBe(50);

    // Switch to CPM (1 WPM = 5 CPM)
    store.setSpeedUnit("cpm");
    expect(controller.netSpeed).toBe(300);
    expect(controller.rawSpeed).toBe(350);
    expect(controller.wpmSeries[0]?.y).toBe(250);
  });

  it("formats timeline series for LineChart and BarChart", () => {
    const store = useTypingStore();
    store.setLastResult(mockResult);

    const controller = useResultController();

    expect(controller.wpmSeries).toHaveLength(3);
    expect(controller.wpmSeries[1]).toEqual({
      x: 2,
      y: 60,
      label: "2s",
    });

    expect(controller.errorSeries).toHaveLength(3);
    expect(controller.errorSeries[1]).toEqual({
      label: "2s",
      value: 1,
    });

    expect(controller.rawWpmSeries).toHaveLength(3);
    expect(controller.rawWpmSeries[1]).toEqual({
      x: 2,
      y: 65,
      label: "2s",
    });

    expect(controller.timelineChartData).toHaveLength(3);
    expect(controller.timelineChartData[1]).toEqual({
      second: 2,
      wpm: 60,
      rawWpm: 65,
      errors: 1,
    });
  });

  it("navigates back to arena on startNextTest()", async () => {
    const controller = useResultController();
    await controller.startNextTest();

    expect(gotoMock).toHaveBeenCalledWith("/", { replace: true });
  });
});
