/**
 * Typing Arena Controller (Svelte 5 Runes)
 * Connects the headless TypingEngine to Svelte 5 reactivity, DOM keyboard capture,
 * and the 60/120 FPS requestAnimationFrame loop.
 */

import { useTypingStore } from "../stores/typing.store.svelte";
import {
  TypingEngine,
  generateWordsText,
  generateTimeText,
  pickQuote,
  type EngineSnapshot,
  type WordState,
  toUnit,
} from "@/core/typing-engine";
import { useRaf } from "#lib/shared/actions/raf.svelte.js";
import { resultApi, achievementApi, advancementApi, trackingStateApi } from "@/core/ipc/client";
import type { TestResultDto } from "@/core/ipc/contracts";
import { getWordlist, getQuotesForLanguage, getTechQuotesForLanguage } from "@/core/text-tools";
import { useSettingsStore } from "#lib/modules/settings/stores/settings.store.svelte.js";
import { evaluateAchievements, type EvaluationContext } from "@/core/achievements";
import { useAchievementStore } from "#lib/modules/profile/stores/achievement.store.svelte.js";

export function useTypingArenaController() {
  const store = useTypingStore();

  let engine: TypingEngine | null = null;
  let unsubscribeEngine: (() => void) | null = null;
  let suspendTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let snapshot = $state.raw<EngineSnapshot | null>(null);
  let words = $state.raw<WordState[]>([]);
  let currentWordIndex = $state(0);
  let currentCharIndex = $state(0);
  let isFocused = $state(true);
  let inputElement: HTMLInputElement | null = null;

  const engineState = $derived(snapshot?.state ?? "Idle");

  const speedDisplay = $derived.by(() => {
    if (!snapshot) return "0";
    const wpm = snapshot.metrics.wpm;
    const unit = store.speedUnit;
    const converted = toUnit(wpm, unit);
    return Math.round(converted).toString();
  });

  const accuracyDisplay = $derived.by(() => {
    if (!snapshot) return "100";
    return snapshot.metrics.accuracy.toFixed(0);
  });

  const timeRemainingSeconds = $derived.by(() => {
    if (snapshot?.remainingTimeSeconds !== undefined) {
      return snapshot.remainingTimeSeconds;
    }
    const elapsed = (snapshot?.activeElapsedMs ?? 0) / 1000;
    return Math.floor(elapsed);
  });

  const remainingWordsCount = $derived.by(() => {
    if (store.mode === "words") {
      const total = words.length;
      const done = currentWordIndex;
      return `${done}/${total}`;
    }
    return undefined;
  });

  const quoteWordsCount = $derived.by(() => {
    if (store.mode === "quote" || store.mode === "tech") {
      const total = words.length;
      const done = currentWordIndex;
      return `${done}/${total}`;
    }
    return undefined;
  });

  const zenSpacesCount = $derived.by(() => {
    return currentWordIndex;
  });

  // RAF loop for monotonic ticking and smooth timeline updates
  const { start: startRaf, stop: stopRaf } = useRaf((nowTimestamp) => {
    if (engine && engineState === "Running") {
      engine.dispatch({ type: "TICK", timestamp: nowTimestamp });
    }
  });

  function generateTargetText(): string {
    const seed = Date.now();
    const config = store.getEngineConfig();
    const activeQuotes = getQuotesForLanguage(store.quoteLanguage);

    if (config.mode === "words") {
      const activeWordlist = getWordlist(store.wordsLanguage);
      return generateWordsText(
        activeWordlist,
        store.wordLimit,
        seed,
        store.punctuation,
        store.numbers,
      );
    }

    if (config.mode === "time") {
      const activeWordlist = getWordlist(store.timeLanguage);
      return generateTimeText(
        activeWordlist,
        store.timeLimit,
        seed,
        store.punctuation,
        store.numbers,
      );
    }

    if (config.mode === "quote") {
      const q = pickQuote(activeQuotes, seed, store.quoteLengthFilter);
      store.setActiveQuoteSource(q.source);
      return q.text;
    }

    if (config.mode === "tech") {
      const activeTechQuotes = getTechQuotesForLanguage(store.techLanguage);
      const q = pickQuote(activeTechQuotes, seed, store.quoteLengthFilter);
      store.setActiveQuoteSource(q.source);
      return q.text;
    }

    store.setActiveQuoteSource(null);

    if (config.mode === "zen") {
      return ""; // Free typing in Zen mode
    }

    if (config.mode === "custom") {
      return store.customText || "";
    }

    return generateWordsText(getWordlist(store.wordsLanguage), 25, seed);
  }

  function clearSuspendTimer() {
    if (suspendTimeoutId !== null) {
      clearTimeout(suspendTimeoutId);
      suspendTimeoutId = null;
    }
  }

  function initTest() {
    stopRaf();
    clearSuspendTimer();
    if (unsubscribeEngine) {
      unsubscribeEngine();
      unsubscribeEngine = null;
    }
    store.setIsTyping(false);
    const text = generateTargetText();
    const config = store.getEngineConfig();

    engine = new TypingEngine(config, text);

    let lastRevision = -1;
    let lastBufferRevision = -1;

    unsubscribeEngine = engine.subscribe((snap) => {
      if (snap.revision === lastRevision && snap.state === snapshot?.state) {
        return;
      }
      lastRevision = snap.revision;
      snapshot = snap;
      store.setIsTyping(snap.state === "Running");

      const snapBufRev = snap.bufferRevision ?? snap.revision;
      if (snapBufRev !== lastBufferRevision) {
        lastBufferRevision = snapBufRev;
        words = snap.words;
        currentWordIndex = snap.currentWordIndex;
        currentCharIndex = snap.currentCharIndex;
      }

      // Smart RAF: Only run the 60/120fps animation loop while the engine is actively Running
      if (snap.state === "Running") {
        clearSuspendTimer();
        startRaf();
      } else {
        stopRaf();
        if (snap.state === "Suspended") {
          clearSuspendTimer();
          const timeoutMs = (config.suspendTimeoutMs ?? 10000) + 20;
          suspendTimeoutId = setTimeout(() => {
            suspendTimeoutId = null;
            if (engine && snapshot?.state === "Suspended") {
              const ts = typeof performance !== "undefined" ? performance.now() : Date.now();
              engine.dispatch({ type: "TICK", timestamp: ts });
            }
          }, timeoutMs);
        } else {
          clearSuspendTimer();
        }
      }

      if (snap.state === "Finished") {
        onTestFinished();
      } else if (snap.state === "Aborted") {
        initTest();
      }
    });

    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const initialSnap = engine.getSnapshot(now);
    snapshot = initialSnap;
    words = [...initialSnap.words];
    currentWordIndex = initialSnap.currentWordIndex;
    currentCharIndex = initialSnap.currentCharIndex;
    lastRevision = initialSnap.revision;
    lastBufferRevision = initialSnap.bufferRevision ?? initialSnap.revision;
    focusInput();
  }

  function restartTest() {
    initTest();
  }

  async function onTestFinished() {
    stopRaf();
    store.setIsTyping(false);
    if (!engine) return;

    const result = engine.finalize(performance.now());
    store.setLastResult(result);

    const resultDto: TestResultDto = {
      uuid: result.uuid,
      mode: result.config.mode,
      mode_variant:
        result.config.mode === "time"
          ? (result.config.timeLimit?.toString() ?? "15")
          : result.config.mode === "words"
            ? (result.config.wordLimit?.toString() ?? "25")
            : result.config.mode === "quote"
              ? (result.config.quoteLengthFilter ?? "all")
              : result.config.mode === "tech"
                ? (result.config.quoteLengthFilter ?? "all")
                : result.config.mode === "custom"
                  ? result.config.timeLimit
                    ? `${result.config.timeLimit}`
                    : "infinity"
                  : result.config.mode,
      language: result.config.language ?? "en",
      wpm: result.wpm,
      raw_wpm: result.rawWpm,
      accuracy: result.accuracy,
      consistency: result.consistency,
      duration_seconds: result.durationSeconds,
      character_count: result.liveMetrics.characterProducingKeystrokes,
      keystroke_count: result.liveMetrics.totalKeystrokes,
      correct_keystrokes: result.liveMetrics.correctChars,
      error_keystrokes:
        result.liveMetrics.incorrectChars + result.liveMetrics.extraChars,
      completed_at: result.completedAt,
      is_completed: !result.failedByDifficulty,
      payload_json: JSON.stringify(result),
    };

    // Failed-by-difficulty tests (expert/master mode failures) must NEVER enter history or achievements.
    // Zen mode tests do not enter history, but MUST evaluate achievements (e.g. zen_master, zen_flow).
    const isFailed = Boolean(result.failedByDifficulty);
    const isZen = result.config.mode === "zen";
    let savePromise: Promise<{ id: number; uuid: string; is_personal_best: boolean }>;

    if (!isFailed && !isZen) {
      const settings = useSettingsStore();
      const shouldSkip =
        settings.historyFilterEnabled &&
        (result.wpm < settings.historyFilterMinSpeed ||
          result.accuracy < settings.historyFilterMinAccuracy);

      if (!shouldSkip) {
        savePromise = resultApi.save(resultDto).catch((err) => {
          console.warn("Failed to save test result via IPC:", err);
          return { id: 0, uuid: resultDto.uuid, is_personal_best: false };
        });
      } else {
        savePromise = Promise.resolve({ id: 0, uuid: resultDto.uuid, is_personal_best: false });
      }
    } else {
      savePromise = Promise.resolve({ id: 0, uuid: resultDto.uuid, is_personal_best: false });
    }

    if (!isFailed) {
      // Realtime event-driven achievement evaluation (non-blocking)
      // Guarded strictly against failed-by-difficulty tests
      savePromise.then(async (saved) => {
        try {
          const achievementStore = useAchievementStore();
          if (!achievementStore.isLoaded) {
            await achievementStore.loadAll();
          }
          const evalContext: EvaluationContext = {
            wpm: result.wpm,
            rawWpm: result.rawWpm,
            accuracy: result.accuracy,
            consistency: result.consistency ?? null,
            durationSeconds: result.durationSeconds,
            mode: result.config.mode,
            modeVariant:
              result.config.mode === 'time'
                ? String(result.config.timeLimit ?? 30)
                : result.config.mode === 'words'
                  ? String(result.config.wordLimit ?? 25)
                  : '',
            language: result.config.language ?? store.targetLanguage,
            isPersonalBest: saved.is_personal_best,
            completedAt: result.completedAt,
            correctChars: result.liveMetrics?.correctChars,
            incorrectChars: result.liveMetrics?.incorrectChars,
            totalKeystrokes: result.liveMetrics?.totalKeystrokes,
            characterProducingKeystrokes: result.liveMetrics?.characterProducingKeystrokes,
            failedByDifficulty: Boolean(result.failedByDifficulty),
            isCompleted: !result.failedByDifficulty,
            difficulty: result.config.difficulty ?? 'normal',
          };

          const evalResult = evaluateAchievements(
            evalContext,
            achievementStore.achievements,
            achievementStore.advancements,
            achievementStore.trackingState,
          );

          const writes: Promise<unknown>[] = [];
          if (evalResult.achievementUpdates.length > 0) {
            writes.push(achievementApi.batchUpsert(evalResult.achievementUpdates));
          }
          if (evalResult.advancementUpdates.length > 0) {
            writes.push(advancementApi.batchUpsert(evalResult.advancementUpdates));
          }
          if (evalResult.stateUpdates.length > 0) {
            writes.push(trackingStateApi.save(evalResult.stateUpdates));
          }
          if (writes.length > 0) {
            await Promise.all(writes);
          }
          achievementStore.applyUpdates(evalResult, evalResult.newUnlocks);
        } catch (err) {
          console.warn('Failed evaluating achievements:', err);
        }
      });
    }

    try {
      const { goto } = await import("$app/navigation");
      await goto("/result", { replace: true });
    } catch {
      // In tests or environments without SvelteKit router
    }
  }

  function focusInput() {
    if (inputElement) {
      inputElement.focus();
      isFocused = true;
    }
  }

  function handleFocus() {
    isFocused = true;
    if (engine && engineState === "Suspended") {
      engine.dispatch({ type: "FOCUS_GAINED", timestamp: performance.now() });
    }
  }

  function handleBlur() {
    isFocused = false;
    if (engine && engineState === "Running") {
      engine.dispatch({
        type: "FOCUS_LOST",
        timestamp: performance.now(),
        behavior: "suspend",
      });
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      (e.key === "H" || e.key === "h")
    ) {
      e.preventDefault();
      store.toggleHandGuide();
      return;
    }

    if (!engine) return;

    // Shift + Enter in Zen mode: cleanly finish Zen mode immediately
    if (
      store.mode === "zen" &&
      (e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter") &&
      e.shiftKey
    ) {
      e.preventDefault();
      const timestamp = performance.now();
      engine.dispatch({ type: "END_ZEN", timestamp });
      return;
    }

    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
    }
    if (e.key === "Tab") {
      e.preventDefault();
    }
    if (e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter") {
      e.preventDefault();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      restartTest();
      return;
    }

    const timestamp = performance.now();
    const altGraphKey =
      typeof e.getModifierState === "function"
        ? e.getModifierState("AltGraph")
        : false;
    engine.dispatch({
      type: "KEY_DOWN",
      code: e.code,
      key: e.key,
      timestamp,
      repeat: e.repeat,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      altGraphKey,
      isComposing: e.isComposing,
    });
  }

  function handleComposedInput(text: string) {
    if (!engine || !text) return;
    const timestamp =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    for (const ch of text) {
      if (ch === " ") {
        engine.dispatch({ type: "SPACE", timestamp });
      } else if (ch === "\n") {
        engine.dispatch({ type: "ENTER", timestamp });
      } else {
        engine.dispatch({ type: "CHARACTER_INPUT", char: ch, timestamp });
      }
    }
  }

  return {
    get snapshot() {
      return snapshot;
    },
    get words() {
      return words;
    },
    get currentWordIndex() {
      return currentWordIndex;
    },
    get currentCharIndex() {
      return currentCharIndex;
    },
    get engineState() {
      return engineState;
    },
    get isFocused() {
      return isFocused;
    },
    set isFocused(v: boolean) {
      isFocused = v;
    },
    get inputRef() {
      return {
        get value() {
          return inputElement;
        },
        set value(el: HTMLInputElement | null) {
          inputElement = el;
        },
      };
    },
    setInputRef(el: HTMLInputElement | null) {
      inputElement = el;
    },
    get speedDisplay() {
      return speedDisplay;
    },
    get accuracyDisplay() {
      return accuracyDisplay;
    },
    get timeRemainingSeconds() {
      return timeRemainingSeconds;
    },
    get remainingWordsCount() {
      return remainingWordsCount;
    },
    get quoteWordsCount() {
      return quoteWordsCount;
    },
    get zenSpacesCount() {
      return zenSpacesCount;
    },
    initTest,
    restartTest,
    focusInput,
    handleFocus,
    handleBlur,
    handleKeyDown,
    handleComposedInput,
    destroy() {
      stopRaf();
      clearSuspendTimer();
      if (unsubscribeEngine) {
        unsubscribeEngine();
        unsubscribeEngine = null;
      }
      store.setIsTyping(false);
    },
  };
}
