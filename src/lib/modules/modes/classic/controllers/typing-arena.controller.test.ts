import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTypingArenaController } from "./typing-arena.controller.svelte";
import { useTypingStore } from "../stores/typing.store.svelte";
import { useSettingsStore } from "#lib/modules/settings/stores/settings.store.svelte.js";
import { resultApi, achievementApi } from "@/core/ipc/client";

const gotoMock = vi.fn();
vi.mock("$app/navigation", () => ({
  goto: gotoMock,
}));

describe("useTypingArenaController (Svelte 5 Runes)", () => {
  beforeEach(() => {
    gotoMock.mockClear();
    vi.clearAllMocks();
    const store = useTypingStore();
    store.resetTypingState();
    const settingsStore = useSettingsStore();
    settingsStore.resetSettingsState();
  });

  it("initializes engine and generates text on mount", () => {
    const controller = useTypingArenaController();
    controller.initTest();

    expect(controller.snapshot).not.toBeNull();
    expect(controller.words.length).toBeGreaterThan(0);
    expect(controller.engineState).toBe("Ready");
    expect(controller.speedDisplay).toBe("0");
    expect(controller.accuracyDisplay).toBe("100");
  });

  it("updates text generation when mode changes", () => {
    const store = useTypingStore();
    const controller = useTypingArenaController();

    // Mode: Words (10 words)
    store.setMode("words");
    store.setWordLimit(10);
    controller.initTest();
    expect(controller.words.length).toBe(10);

    // Mode: Quote
    store.setMode("quote");
    controller.initTest();
    expect(controller.words.length).toBeGreaterThan(0);

    // Mode: Zen
    store.setMode("zen");
    controller.initTest();
    expect(controller.words.length).toBe(0);
  });

  it("handles key input and transitions engine to Running", () => {
    const store = useTypingStore();
    store.setMode("words");
    store.setWordLimit(10);
    const controller = useTypingArenaController();
    controller.initTest();

    const firstWord = controller.words[0];
    expect(firstWord).toBeDefined();
    const firstChar = firstWord?.target[0] ?? "a";
    const keyEvent = new KeyboardEvent("keydown", {
      key: firstChar,
      code: `Key${firstChar.toUpperCase()}`,
    });

    controller.handleKeyDown(keyEvent);

    expect(controller.engineState).toBe("Running");
    expect(controller.words[0]?.chars[0]?.status).toBe("correct");
  });

  it("handles blur and focus for suspension", () => {
    const store = useTypingStore();
    store.setMode("words");
    store.setWordLimit(10);
    const controller = useTypingArenaController();
    controller.initTest();

    // Start running
    const firstWord = controller.words[0];
    expect(firstWord).toBeDefined();
    const firstChar = firstWord?.target[0] ?? "a";
    controller.handleKeyDown(
      new KeyboardEvent("keydown", {
        key: firstChar,
        code: `Key${firstChar.toUpperCase()}`,
      }),
    );
    expect(controller.engineState).toBe("Running");

    // Blur -> Suspend
    controller.handleBlur();
    expect(controller.isFocused).toBe(false);
    expect(controller.engineState).toBe("Suspended");

    // Focus -> Resume
    controller.handleFocus();
    expect(controller.isFocused).toBe(true);
    expect(controller.engineState).toBe("Running");
  });

  it("dynamically converts speed display between WPM and CPM (AC-09)", () => {
    const store = useTypingStore();
    store.setMode("words");
    store.setWordLimit(10);
    const controller = useTypingArenaController();
    controller.initTest();

    // Default: WPM
    store.setSpeedUnit("wpm");
    expect(controller.speedDisplay).toBe("0");

    // Switch to CPM
    store.setSpeedUnit("cpm");
    expect(controller.speedDisplay).toBe("0");
  });

  it("handles Hand Guide shortcut (Ctrl/Cmd + Shift + H)", () => {
    const store = useTypingStore();
    const controller = useTypingArenaController();
    controller.initTest();

    expect(store.handGuideEnabled).toBe(true);

    const toggleEvent = new KeyboardEvent("keydown", {
      key: "H",
      ctrlKey: true,
      shiftKey: true,
    });

    controller.handleKeyDown(toggleEvent);
    expect(store.handGuideEnabled).toBe(false);

    controller.handleKeyDown(toggleEvent);
    expect(store.handGuideEnabled).toBe(true);
  });

  it("restarts test cleanly with restartTest()", () => {
    const controller = useTypingArenaController();
    controller.initTest();

    // Type a key
    const firstWord = controller.words[0];
    expect(firstWord).toBeDefined();
    const firstChar = firstWord?.target[0] ?? "a";
    controller.handleKeyDown(
      new KeyboardEvent("keydown", {
        key: firstChar,
        code: `Key${firstChar.toUpperCase()}`,
      }),
    );
    expect(controller.engineState).toBe("Running");

    // Restart
    controller.restartTest();
    expect(controller.engineState).toBe("Ready");
    expect(controller.currentWordIndex).toBe(0);
    expect(controller.currentCharIndex).toBe(0);
  });

  it("prevents default on Space and Tab keys to avoid page scroll / focus loss", () => {
    const controller = useTypingArenaController();
    controller.initTest();

    const spaceEvent = new KeyboardEvent("keydown", {
      key: " ",
      code: "Space",
    });
    const spacePreventSpy = vi.spyOn(spaceEvent, "preventDefault");
    controller.handleKeyDown(spaceEvent);
    expect(spacePreventSpy).toHaveBeenCalled();

    const tabEvent = new KeyboardEvent("keydown", { key: "Tab", code: "Tab" });
    const tabPreventSpy = vi.spyOn(tabEvent, "preventDefault");
    controller.handleKeyDown(tabEvent);
    expect(tabPreventSpy).toHaveBeenCalled();
  });

  it("handles Escape key by restarting test immediately", () => {
    const store = useTypingStore();
    store.setMode("words");
    store.setWordLimit(10);
    const controller = useTypingArenaController();
    controller.initTest();

    // Start running
    const firstWord = controller.words[0];
    const firstChar = firstWord?.target[0] ?? "a";
    controller.handleKeyDown(
      new KeyboardEvent("keydown", {
        key: firstChar,
        code: `Key${firstChar.toUpperCase()}`,
      }),
    );
    expect(controller.engineState).toBe("Running");

    // Press Escape
    const escEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
    });
    const escPreventSpy = vi.spyOn(escEvent, "preventDefault");
    controller.handleKeyDown(escEvent);

    expect(escPreventSpy).toHaveBeenCalled();
    expect(controller.engineState).toBe("Ready");
    expect(controller.currentWordIndex).toBe(0);
  });

  it("focuses input element when focusInput() is called with bound inputRef", () => {
    const controller = useTypingArenaController();
    controller.initTest();

    const fakeInput = document.createElement("input");
    const focusSpy = vi.spyOn(fakeInput, "focus");
    controller.inputRef.value = fakeInput;

    controller.focusInput();
    expect(focusSpy).toHaveBeenCalled();
    expect(controller.isFocused).toBe(true);
  });

  it("switches targetLanguage between English and Indonesian wordlists", () => {
    const store = useTypingStore();
    const controller = useTypingArenaController();

    store.setMode("words");
    store.setWordLimit(10);
    store.setTargetLanguage("en");
    controller.initTest();
    const enWords = controller.words.map((w) => w.target);
    expect(enWords.length).toBe(10);

    store.setTargetLanguage("id");
    controller.initTest();
    const idWords = controller.words.map((w) => w.target);
    expect(idWords.length).toBe(10);
  });

  it("persists targetLanguage setting when switched in typing store", async () => {
    const store = useTypingStore();
    const settingsStore = useSettingsStore();

    store.setTargetLanguage("id");
    expect(store.targetLanguage).toBe("id");
    expect(settingsStore.targetLanguage).toBe("id");

    store.setTargetLanguage("en");
    expect(store.targetLanguage).toBe("en");
    expect(settingsStore.targetLanguage).toBe("en");
  });

  it("maintains independent languages across Time and Words modes", () => {
    const store = useTypingStore();

    store.setMode("time");
    store.setTimeLanguage("indonesian");
    expect(store.timeLanguage).toBe("indonesian");
    expect(store.targetLanguage).toBe("indonesian");

    store.setMode("words");
    store.setWordsLanguage("code_javascript");
    expect(store.wordsLanguage).toBe("code_javascript");
    expect(store.targetLanguage).toBe("code_javascript");

    // Switching back to Time mode preserves Time mode's language
    store.setMode("time");
    expect(store.timeLanguage).toBe("indonesian");
    expect(store.targetLanguage).toBe("indonesian");

    // And Words mode language remains untouched
    expect(store.wordsLanguage).toBe("code_javascript");
  });

  it("computes remainingWordsCount correctly in words mode", () => {
    const store = useTypingStore();
    const controller = useTypingArenaController();

    store.setMode("words");
    store.setWordLimit(10);
    controller.initTest();
    expect(controller.remainingWordsCount).toBe("0/10");
  });

  it("supports free typing and completion with Shift+Enter in Zen mode", () => {
    const store = useTypingStore();
    const controller = useTypingArenaController();

    store.setMode("zen");
    controller.initTest();
    expect(controller.words.length).toBe(0);

    expect(controller.zenSpacesCount).toBe(0);

    // Initial Space is ignored on empty buffer
    const spaceEvt = new KeyboardEvent("keydown", { key: " ", code: "Space" });
    const preventDefaultSpy = vi.spyOn(spaceEvt, "preventDefault");
    controller.handleKeyDown(spaceEvt);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(controller.words.length).toBe(0);
    expect(controller.zenSpacesCount).toBe(0);

    // Type character 'z'
    controller.handleKeyDown(
      new KeyboardEvent("keydown", { key: "z", code: "KeyZ" }),
    );
    expect(controller.engineState).toBe("Running");
    expect(controller.words.length).toBe(1);
    expect(controller.words[0]?.target).toBe("z");
    expect(controller.zenSpacesCount).toBe(0);

    // Type Space
    controller.handleKeyDown(
      new KeyboardEvent("keydown", { key: " ", code: "Space" }),
    );
    expect(controller.words.length).toBe(2);
    expect(controller.zenSpacesCount).toBe(1);

    // Backspacing across word boundary pops the empty word and returns to previous word
    controller.handleKeyDown(
      new KeyboardEvent("keydown", { key: "Backspace", code: "Backspace" }),
    );
    expect(controller.words.length).toBe(1);
    expect(controller.currentWordIndex).toBe(0);
    expect(controller.words[0]?.target).toBe("z");
    expect(controller.zenSpacesCount).toBe(0);

    // Space again
    controller.handleKeyDown(
      new KeyboardEvent("keydown", { key: " ", code: "Space" }),
    );
    expect(controller.words.length).toBe(2);
    expect(controller.zenSpacesCount).toBe(1);

    // Shift + Enter ends Zen mode for the 1st time
    const enterEvt = new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      shiftKey: true,
    });
    const enterPreventSpy = vi.spyOn(enterEvt, "preventDefault");
    controller.handleKeyDown(enterEvt);
    expect(enterPreventSpy).toHaveBeenCalled();
    expect(controller.engineState).toBe("Finished");

    // Initialize 2nd test (user starts typing again after first completion)
    controller.initTest();
    expect(controller.engineState).toBe("Ready");
    expect(controller.words.length).toBe(0);
    expect(controller.zenSpacesCount).toBe(0);

    // Type in 2nd test
    controller.handleKeyDown(
      new KeyboardEvent("keydown", { key: "a", code: "KeyA" }),
    );
    expect(controller.engineState).toBe("Running");
    expect(controller.words.length).toBe(1);

    // Shift + Enter ends Zen mode for the 2nd time cleanly
    controller.handleKeyDown(enterEvt);
    expect(controller.engineState).toBe("Finished");
  });

  it("supports quote mode with length filter", () => {
    const store = useTypingStore();
    const controller = useTypingArenaController();

    store.setMode("quote");
    store.setQuoteLanguage("english");
    store.setQuoteLengthFilter("short");
    controller.initTest();

    expect(controller.words.length).toBeGreaterThan(0);
    const fullText = controller.words.map((w) => w.target).join(" ");
    expect(fullText.length).toBeLessThanOrEqual(100);
    expect(store.activeQuoteSource).toBeTruthy();
  });

  it("handles long custom text mode efficiently without lag", () => {
    const store = useTypingStore();
    const controller = useTypingArenaController();

    const longText = Array.from({ length: 1000 }, (_, i) => `word${i}`).join(" ");
    store.setMode("custom");
    store.setCustomText(longText);
    controller.initTest();

    expect(controller.words.length).toBe(1000);
    expect(controller.engineState).toBe("Ready");

    const t0 = performance.now();
    for (let i = 0; i < 20; i++) {
      controller.handleKeyDown(
        new KeyboardEvent("keydown", { key: "w", code: "KeyW" }),
      );
    }
    const duration = performance.now() - t0;

    expect(duration).toBeLessThan(50);
    expect(controller.engineState).toBe("Running");
  });

  it("saves result to history when filter is disabled", async () => {
    const saveSpy = vi.spyOn(resultApi, "save").mockResolvedValue({ id: 1, uuid: "res-1", is_personal_best: false });
    const store = useTypingStore();
    const settings = useSettingsStore();
    settings.historyFilterEnabled = false;

    store.setMode("words");
    store.setWordLimit(1);
    const controller = useTypingArenaController();
    controller.initTest();

    const word = controller.words[0]!.target;
    for (const char of word) {
      controller.handleKeyDown(new KeyboardEvent("keydown", { key: char }));
    }

    expect(controller.engineState).toBe("Finished");
    expect(saveSpy).toHaveBeenCalledTimes(1);
    saveSpy.mockRestore();
  });

  it("skips saving to history when result is below min_speed threshold", async () => {
    let fakeTime = 1000;
    const perfSpy = vi.spyOn(performance, "now").mockImplementation(() => fakeTime);
    const saveSpy = vi.spyOn(resultApi, "save").mockResolvedValue({ id: 2, uuid: "res-2", is_personal_best: false });
    const store = useTypingStore();
    const settings = useSettingsStore();

    settings.historyFilterEnabled = true;
    settings.historyFilterMinSpeed = 50; // requires at least 50 WPM
    settings.historyFilterMinAccuracy = 0;

    store.setMode("words");
    store.setWordLimit(1);
    const controller = useTypingArenaController();
    controller.initTest();

    const achievementSpy = vi.spyOn(achievementApi, "batchUpsert").mockResolvedValue(undefined);

    // Type slowly: 1 word over 10 seconds => 6 WPM (< 50 WPM threshold)
    const word = controller.words[0]!.target;
    for (let i = 0; i < word.length; i++) {
      fakeTime += 3000;
      controller.handleKeyDown(new KeyboardEvent("keydown", { key: word[i] }));
    }

    expect(controller.engineState).toBe("Finished");
    expect(saveSpy).not.toHaveBeenCalled();

    // Achievements still evaluate even when history filter skipped saving to history
    await new Promise((r) => setTimeout(r, 20));
    expect(achievementSpy).toHaveBeenCalled();

    saveSpy.mockRestore();
    achievementSpy.mockRestore();
    perfSpy.mockRestore();
  });

  it("skips saving to history when accuracy is below min_accuracy threshold", async () => {
    const saveSpy = vi.spyOn(resultApi, "save").mockResolvedValue({ id: 2, uuid: "res-2b", is_personal_best: false });
    const store = useTypingStore();
    const settings = useSettingsStore();

    settings.historyFilterEnabled = true;
    settings.historyFilterMinSpeed = 0;
    settings.historyFilterMinAccuracy = 98; // requires at least 98% accuracy

    store.setMode("words");
    store.setWordLimit(1);
    const controller = useTypingArenaController();
    controller.initTest();

    // Type error key to reduce accuracy below 95%
    controller.handleKeyDown(new KeyboardEvent("keydown", { key: "x" }));
    controller.handleKeyDown(new KeyboardEvent("keydown", { key: "Backspace" }));

    const word = controller.words[0]!.target;
    for (const char of word) {
      controller.handleKeyDown(new KeyboardEvent("keydown", { key: char }));
    }

    expect(controller.engineState).toBe("Finished");
    expect(saveSpy).not.toHaveBeenCalled();

    saveSpy.mockRestore();
  });

  it("saves to history when result satisfies filter thresholds", async () => {
    const saveSpy = vi.spyOn(resultApi, "save").mockResolvedValue({ id: 3, uuid: "res-3", is_personal_best: false });
    const store = useTypingStore();
    const settings = useSettingsStore();

    // Enable filter with very low thresholds
    settings.historyFilterEnabled = true;
    settings.historyFilterMinSpeed = 0;
    settings.historyFilterMinAccuracy = 50;

    store.setMode("words");
    store.setWordLimit(1);
    const controller = useTypingArenaController();
    controller.initTest();

    const word = controller.words[0]!.target;
    for (const char of word) {
      controller.handleKeyDown(new KeyboardEvent("keydown", { key: char }));
    }

    expect(controller.engineState).toBe("Finished");
    expect(saveSpy).toHaveBeenCalledTimes(1);
    saveSpy.mockRestore();
  });

  it("never saves to history/analytics when test fails in expert difficulty", async () => {
    const saveSpy = vi.spyOn(resultApi, "save").mockResolvedValue({ id: 4, uuid: "res-4", is_personal_best: false });
    const achievementSpy = vi.spyOn(achievementApi, "batchUpsert").mockResolvedValue(undefined);
    const store = useTypingStore();
    const settings = useSettingsStore();
    settings.historyFilterEnabled = false;

    store.setMode("words");
    store.setWordLimit(10);
    store.setDifficulty("expert");

    const controller = useTypingArenaController();
    controller.initTest();

    // In expert mode, submitting an incorrect word with Space triggers immediate failure
    const firstWord = controller.words[0]!.target;
    const wrongChar = firstWord[0] === "a" ? "b" : "a";
    controller.handleKeyDown(new KeyboardEvent("keydown", { key: wrongChar }));
    controller.handleKeyDown(new KeyboardEvent("keydown", { key: " " }));

    expect(controller.engineState).toBe("Finished");
    expect(controller.snapshot?.failedByDifficulty).toBe(true);
    expect(store.lastResult?.failedByDifficulty).toBe(true);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(achievementSpy).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 10));
    expect(gotoMock).toHaveBeenCalledWith("/result", { replace: true });

    saveSpy.mockRestore();
    achievementSpy.mockRestore();
  });

  it("never saves to history/analytics when test fails in master difficulty", async () => {
    const saveSpy = vi.spyOn(resultApi, "save").mockResolvedValue({ id: 5, uuid: "res-5", is_personal_best: false });
    const achievementSpy = vi.spyOn(achievementApi, "batchUpsert").mockResolvedValue(undefined);
    const store = useTypingStore();
    const settings = useSettingsStore();
    settings.historyFilterEnabled = false;

    store.setMode("words");
    store.setWordLimit(10);
    store.setDifficulty("master");

    const controller = useTypingArenaController();
    controller.initTest();

    // Type a wrong key in master mode -> immediate failure
    const firstWord = controller.words[0]!.target;
    const wrongChar = firstWord[0] === "a" ? "b" : "a";
    controller.handleKeyDown(new KeyboardEvent("keydown", { key: wrongChar }));

    expect(controller.engineState).toBe("Finished");
    expect(controller.snapshot?.failedByDifficulty).toBe(true);
    expect(store.lastResult?.failedByDifficulty).toBe(true);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(achievementSpy).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 10));
    expect(gotoMock).toHaveBeenCalledWith("/result", { replace: true });

    saveSpy.mockRestore();
    achievementSpy.mockRestore();
  });

  it("saves to history when test succeeds in expert difficulty without errors", async () => {
    const saveSpy = vi.spyOn(resultApi, "save").mockResolvedValue({ id: 6, uuid: "res-6", is_personal_best: false });
    const store = useTypingStore();
    const settings = useSettingsStore();
    settings.historyFilterEnabled = false;

    store.setMode("words");
    store.setWordLimit(1);
    store.setDifficulty("expert");

    const controller = useTypingArenaController();
    controller.initTest();

    const word = controller.words[0]!.target;
    for (const char of word) {
      controller.handleKeyDown(new KeyboardEvent("keydown", { key: char }));
    }

    expect(controller.engineState).toBe("Finished");
    expect(controller.snapshot?.failedByDifficulty).toBe(false);
    expect(store.lastResult?.failedByDifficulty).toBe(false);
    expect(saveSpy).toHaveBeenCalledTimes(1);

    await new Promise((r) => setTimeout(r, 10));
    expect(gotoMock).toHaveBeenCalledWith("/result", { replace: true });

    saveSpy.mockRestore();
  });

  it("calculates quoteWordsCount in quote and tech modes", () => {
    const store = useTypingStore();
    store.setMode("quote");
    const controllerQuote = useTypingArenaController();
    controllerQuote.initTest();

    expect(controllerQuote.quoteWordsCount).toBeDefined();
    expect(controllerQuote.quoteWordsCount).toMatch(/^0\/\d+$/);

    store.setMode("tech");
    const controllerTech = useTypingArenaController();
    controllerTech.initTest();

    expect(controllerTech.quoteWordsCount).toBeDefined();
    expect(controllerTech.quoteWordsCount).toMatch(/^0\/\d+$/);

    store.setMode("time");
    const controllerTime = useTypingArenaController();
    controllerTime.initTest();
    expect(controllerTime.quoteWordsCount).toBeUndefined();
  });

  it("saves tech test results with correct quoteLengthFilter as mode_variant", async () => {
    const saveSpy = vi.spyOn(resultApi, "save").mockResolvedValue({ id: 7, uuid: "res-7", is_personal_best: false });
    const store = useTypingStore();
    const settings = useSettingsStore();
    settings.historyFilterEnabled = false;

    store.setMode("tech");
    store.setQuoteLengthFilter("short");

    const controller = useTypingArenaController();
    controller.initTest();

    // Type all words accurately, handling newline words with Enter
    const words = controller.words;
    for (let i = 0; i < words.length; i++) {
      const word = words[i]!.target;
      if (word === "\n") {
        controller.handleKeyDown(new KeyboardEvent("keydown", { key: "Enter" }));
      } else {
        for (const char of word) {
          controller.handleKeyDown(new KeyboardEvent("keydown", { key: char }));
        }
        if (i < words.length - 1 && words[i + 1]?.target !== "\n") {
          controller.handleKeyDown(new KeyboardEvent("keydown", { key: " " }));
        }
      }
    }

    expect(controller.engineState).toBe("Finished");
    expect(saveSpy).toHaveBeenCalledTimes(1);
    const savedDto = saveSpy.mock.calls[0]![0];
    expect(savedDto.mode).toBe("tech");
    expect(savedDto.mode_variant).toBe("short");

    saveSpy.mockRestore();
  });
});


