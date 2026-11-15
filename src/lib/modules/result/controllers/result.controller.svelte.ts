/**
 * Result Controller (Svelte 5 Runes)
 * Formats FinalResult metrics, timeline series, and handles next-test actions.
 */

import { useTypingStore } from "#lib/modules/modes/classic/stores/typing.store.svelte.js";
import { toUnit } from "@/core/typing-engine";
import { formatModeBadge } from "#lib/shared/utils/index.js";
import { getLanguageDisplayName } from "@/core/text-tools";
import type { DataPoint, BarDataPoint } from "#lib/shared/ui/index.js";

export interface ResultTimelinePoint {
  second: number;
  wpm: number;
  rawWpm: number;
  errors: number;
}

export function useResultController() {
  const store = useTypingStore();

  const result = $derived(store.lastResult);
  const speedUnit = $derived(store.speedUnit);

  const netSpeed = $derived.by(() => {
    if (!result) return 0;
    const val = toUnit(result.wpm, speedUnit);
    return Math.round(val);
  });

  const rawSpeed = $derived.by(() => {
    if (!result) return 0;
    const val = toUnit(result.rawWpm, speedUnit);
    return Math.round(val);
  });

  const accuracy = $derived.by(() => {
    return result ? result.accuracy.toFixed(1) : "100.0";
  });

  const consistency = $derived.by(() => {
    return result?.consistency !== null && result?.consistency !== undefined
      ? `${result.consistency.toFixed(1)}%`
      : "—";
  });

  const duration = $derived.by(() => {
    return result ? `${result.durationSeconds.toFixed(1)}s` : "0s";
  });

  const charBreakdown = $derived.by(() => {
    if (!result) return { correct: 0, incorrect: 0, extra: 0, missed: 0 };
    return {
      correct: result.liveMetrics.correctChars,
      incorrect: result.liveMetrics.incorrectChars,
      extra: result.liveMetrics.extraChars,
      missed: result.liveMetrics.missedChars,
    };
  });

  // Timeline series for LineChart (backward compatibility)
  const wpmSeries = $derived.by<DataPoint[]>(() => {
    if (!result || result.timeline.length === 0) return [];
    return result.timeline.map((t) => ({
      x: t.second,
      y: Math.round(toUnit(t.wpm, speedUnit)),
      label: `${t.second}s`,
    }));
  });

  // Raw WPM series for dual-line charts
  const rawWpmSeries = $derived.by<DataPoint[]>(() => {
    if (!result || result.timeline.length === 0) return [];
    return result.timeline.map((t) => ({
      x: t.second,
      y: Math.round(toUnit(t.rawWpm, speedUnit)),
      label: `${t.second}s`,
    }));
  });

  // Errors series for BarChart (backward compatibility)
  const errorSeries = $derived.by<BarDataPoint[]>(() => {
    if (!result || result.timeline.length === 0) return [];
    return result.timeline.map((t) => ({
      label: `${t.second}s`,
      value: t.errors,
    }));
  });

  // Unified structured timeline for ResultChart (Monkeytype style)
  const timelineChartData = $derived.by<ResultTimelinePoint[]>(() => {
    if (!result || result.timeline.length === 0) return [];
    return result.timeline.map((t) => ({
      second: t.second,
      wpm: Math.round(toUnit(t.wpm, speedUnit)),
      rawWpm: Math.round(toUnit(t.rawWpm, speedUnit)),
      errors: t.errors,
    }));
  });

  // Formatted metadata tags
  const modeBadge = $derived.by(() => {
    if (!result) return "Time · 30s";
    const cfg = result.config;
    let variant: string | undefined;
    if (cfg.mode === "time") {
      variant = cfg.timeLimit ? `${cfg.timeLimit}` : "30";
    } else if (cfg.mode === "words") {
      variant = cfg.wordLimit ? `${cfg.wordLimit}` : "25";
    } else if (cfg.mode === "custom") {
      variant = cfg.timeLimit ? `${cfg.timeLimit}` : "infinity";
    }
    return formatModeBadge(cfg.mode, variant);
  });

  const testMode = $derived(result?.config.mode ?? "time");
  const testModeDetail = $derived.by(() => {
    if (!result) return "30s";
    const cfg = result.config;
    if (cfg.mode === "time") return `${cfg.timeLimit ?? 30}s`;
    if (cfg.mode === "words") return `${cfg.wordLimit ?? 25} words`;
    if (cfg.mode === "custom")
      return cfg.timeLimit ? `${cfg.timeLimit}s` : "Infinity";
    return "";
  });

  const language = $derived.by(() => {
    if (result?.config.mode === "custom" || result?.config.mode === "zen") return "";
    const lang =
      result?.config.language ??
      (result?.config.mode === "tech"
        ? store.techLanguage
        : result?.config.mode === "quote"
          ? store.quoteLanguage
          : store.targetLanguage);
    return getLanguageDisplayName(lang);
  });

  const hasPunctuation = $derived(Boolean(result?.config.punctuation));
  const hasNumbers = $derived(Boolean(result?.config.numbers));
  const quoteSource = $derived(
    result?.config.mode === "quote" || result?.config.mode === "tech"
      ? store.activeQuoteSource
      : null,
  );
  const isFailed = $derived(Boolean(result?.failedByDifficulty));
  const difficulty = $derived(result?.config.difficulty ?? "normal");

  async function startNextTest() {
    try {
      const { goto } = await import("$app/navigation");
      await goto("/", { replace: true });
    } catch {
      // In tests
    }
  }

  return {
    get result() {
      return result;
    },
    get speedUnit() {
      return speedUnit;
    },
    get netSpeed() {
      return netSpeed;
    },
    get rawSpeed() {
      return rawSpeed;
    },
    get accuracy() {
      return accuracy;
    },
    get consistency() {
      return consistency;
    },
    get duration() {
      return duration;
    },
    get charBreakdown() {
      return charBreakdown;
    },
    get wpmSeries() {
      return wpmSeries;
    },
    get rawWpmSeries() {
      return rawWpmSeries;
    },
    get errorSeries() {
      return errorSeries;
    },
    get timelineChartData() {
      return timelineChartData;
    },
    get modeBadge() {
      return modeBadge;
    },
    get testMode() {
      return testMode;
    },
    get testModeDetail() {
      return testModeDetail;
    },
    get language() {
      return language;
    },
    get hasPunctuation() {
      return hasPunctuation;
    },
    get hasNumbers() {
      return hasNumbers;
    },
    get quoteSource() {
      return quoteSource;
    },
    get isFailed() {
      return isFailed;
    },
    get difficulty() {
      return difficulty;
    },
    startNextTest,
  };
}
