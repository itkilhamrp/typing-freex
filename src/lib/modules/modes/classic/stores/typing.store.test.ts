import { describe, it, expect, beforeEach } from "vitest";
import { useTypingStore } from "./typing.store.svelte";
import { useSettingsStore } from "#lib/modules/settings/stores/settings.store.svelte.js";

describe("typing.store (Svelte 5 Runes)", () => {
  beforeEach(() => {
    const typingStore = useTypingStore();
    typingStore.resetTypingState();
    const settingsStore = useSettingsStore();
    settingsStore.resetSettingsState();
  });

  it("initializes with default settings", () => {
    const store = useTypingStore();
    expect(store.mode).toBe("time");
    expect(store.timeLimit).toBe(30);
    expect(store.wordLimit).toBe(25);
    expect(store.punctuation).toBe(false);
    expect(store.numbers).toBe(false);
  });

  it("updates modes and limits properly", () => {
    const store = useTypingStore();
    store.setMode("words");
    expect(store.mode).toBe("words");

    store.setWordLimit(50);
    expect(store.wordLimit).toBe(50);

    store.setMode("time");
    store.setTimeLimit(60);
    expect(store.timeLimit).toBe(60);
  });

  it("toggles punctuation and numbers flags", () => {
    const store = useTypingStore();
    expect(store.punctuation).toBe(false);
    store.togglePunctuation();
    expect(store.punctuation).toBe(true);

    expect(store.numbers).toBe(false);
    store.toggleNumbers();
    expect(store.numbers).toBe(true);
  });

  it("handles custom text practice setup and clearing", () => {
    const store = useTypingStore();
    store.setCustomPractice(
      "Sample practice text",
      "Practice Title",
      "text-123",
    );

    expect(store.mode).toBe("custom");
    expect(store.customText).toBe("Sample practice text");
    expect(store.customTextTitle).toBe("Practice Title");
    expect(store.customTextId).toBe("text-123");

    store.clearCustomText();
    expect(store.customText).toBe("");
    expect(store.customTextTitle).toBe("");
    expect(store.customTextId).toBeNull();
  });

  it("generates consistent EngineConfig", () => {
    const store = useTypingStore();
    store.setMode("words");
    store.setWordLimit(10);
    store.togglePunctuation();

    const config = store.getEngineConfig();
    expect(config.mode).toBe("words");
    expect(config.wordLimit).toBe(10);
    expect(config.punctuation).toBe(true);
  });

  it("handles customization bar settings actions", () => {
    const store = useTypingStore();
    expect(store.fontSizePreset).toBe("md");
    expect(store.visibleLines).toBe(3);
    expect(store.arenaWidth).toBe("lg");
    expect(store.smoothCaret).toBe(false);
    expect(store.highlightActiveWord).toBe(false);
    expect(store.showLiveStats).toBe(true);
    expect(store.caretStyle).toBe("line");

    store.setFontSizePreset("xl");
    expect(store.fontSizePreset).toBe("xl");

    store.setVisibleLines(5);
    expect(store.visibleLines).toBe(5);

    // Capping at 5
    store.setVisibleLines(10);
    expect(store.visibleLines).toBe(5);

    store.setArenaWidth("xl");
    expect(store.arenaWidth).toBe("xl");
    store.setArenaWidth("sm");
    expect(store.arenaWidth).toBe("sm");

    store.toggleSmoothCaret();
    expect(store.smoothCaret).toBe(true);

    store.toggleHighlightActiveWord();
    expect(store.highlightActiveWord).toBe(true);

    store.toggleShowLiveStats();
    expect(store.showLiveStats).toBe(false);

    store.cycleCaretStyle();
    expect(store.caretStyle).toBe("block");
    store.cycleCaretStyle();
    expect(store.caretStyle).toBe("underline");
    store.cycleCaretStyle();
    expect(store.caretStyle).toBe("outline");
    store.cycleCaretStyle();
    expect(store.caretStyle).toBe("line");
  });

  it("supports tech mode, techLanguage, and tech EngineConfig", () => {
    const store = useTypingStore();
    store.setMode("tech");
    expect(store.mode).toBe("tech");

    store.setTechLanguage("docker");
    expect(store.techLanguage).toBe("docker");

    store.setQuoteLengthFilter("short");
    expect(store.quoteLengthFilter).toBe("short");

    const config = store.getEngineConfig();
    expect(config.mode).toBe("tech");
    expect(config.language).toBe("docker");
    expect(config.quoteLengthFilter).toBe("short");
  });

  it("manages keymap fields and enforces mutual exclusion with hand guide", () => {
    const store = useTypingStore();

    // Default state: modes are valid and persistent, visibility is controlled separately
    expect(store.keymapMode).toBe("static");
    expect(store.keymapVisible).toBe(false);
    expect(store.keymapStyle).toBe("staggered");
    expect(store.keymapLegendStyle).toBe("lowercase");
    expect(store.keymapShowKeys).toBe("full");
    expect(store.keymapSize).toBe(1.0);
    expect(store.keymapLayout).toBe("qwerty-us");
    expect(store.handGuideEnabled).toBe(true);
    expect(store.handGuideMode).toBe("next");

    // Activating keymap auto-disables hand guide visibility (modes stay intact)
    store.toggleKeymap();
    expect(store.keymapVisible).toBe(true);
    expect(store.keymapMode).toBe("static");
    expect(store.handGuideEnabled).toBe(false);
    expect(store.handGuideMode).toBe("next");

    // Activating hand guide auto-disables keymap visibility (modes stay intact)
    store.toggleHandGuide();
    expect(store.handGuideEnabled).toBe(true);
    expect(store.handGuideMode).toBe("next");
    expect(store.keymapVisible).toBe(false);
    expect(store.keymapMode).toBe("static");

    // Setting keymap mode directly to react updates keymap mode without mutating visibility
    store.setKeymapMode("react");
    expect(store.keymapMode).toBe("react");

    // Toggling keymap visibility on and off does NOT alter configured mode
    store.toggleKeymap();
    expect(store.keymapVisible).toBe(true);
    expect(store.keymapMode).toBe("react");
    store.toggleKeymap();
    expect(store.keymapVisible).toBe(false);
    expect(store.keymapMode).toBe("react");

    // Config updates
    store.setKeymapStyle("alice");
    expect(store.keymapStyle).toBe("alice");

    store.setKeymapLegendStyle("uppercase");
    expect(store.keymapLegendStyle).toBe("uppercase");

    store.setKeymapShowKeys("minimal");
    expect(store.keymapShowKeys).toBe("minimal");

    store.setKeymapSize(1.4);
    expect(store.keymapSize).toBe(1.4);

    store.setKeymapLayout("qwerty-us");
    expect(store.keymapLayout).toBe("qwerty-us");

    // Hand guide config updates
    store.setHandGuideStyle("cyber");
    expect(store.handGuideStyle).toBe("cyber");

    store.setHandGuideLegendStyle("keys");
    expect(store.handGuideLegendStyle).toBe("keys");

    store.setHandGuideHands("left");
    expect(store.handGuideHands).toBe("left");

    store.setHandGuideSize(1.3);
    expect(store.handGuideSize).toBe(1.3);

    store.setHandGuideLayout("qwerty-us");
    expect(store.handGuideLayout).toBe("qwerty-us");
  });
});

