import {
  useSettingsStore,
  type FontSizePreset,
  type ArenaWidthPreset,
  type KeymapStyle,
  type KeymapLegendStyle,
  type KeymapShowKeys,
  type HandGuideStyle,
  type HandGuideLegendStyle,
  type HandGuideHands,
  type TapeMode,
} from "#lib/modules/settings/stores/settings.store.svelte.js";
import { typingActivity } from "#lib/shared/stores/typing-activity.svelte.js";
import type {
  TypingMode,
  Difficulty,
  SpeedUnit,
  EngineConfig,
  FinalResult,
  QuoteLengthFilter,
} from "@/core/typing-engine";

const DEFAULTS = {
  mode: "time" as TypingMode,
  difficulty: "normal" as Difficulty,
  timeLimit: 30,
  wordLimit: 25,
  punctuation: false,
  numbers: false,
  quoteLengthFilter: "all" as QuoteLengthFilter,
  activeQuoteSource: null as string | null,
  lastResult: null as FinalResult | null,
  customText: "",
  customTextTitle: "",
  customTextId: null as string | null,
  customTimeLimit: null as number | null,
  isTyping: false,
};

const settings = () => useSettingsStore();
const persist = (key: string, value: string) =>
  settings().updateSetting(key, value).catch(() => {});

class TypingStore {
  // Fine-grained reactive fields (Svelte skips notifications on equal values).
  mode = $state(DEFAULTS.mode);
  difficulty = $state(DEFAULTS.difficulty);
  timeLimit = $state(DEFAULTS.timeLimit);
  wordLimit = $state(DEFAULTS.wordLimit);
  punctuation = $state(DEFAULTS.punctuation);
  numbers = $state(DEFAULTS.numbers);
  quoteLengthFilter = $state(DEFAULTS.quoteLengthFilter);
  activeQuoteSource = $state(DEFAULTS.activeQuoteSource);
  lastResult = $state(DEFAULTS.lastResult);
  customText = $state(DEFAULTS.customText);
  customTextTitle = $state(DEFAULTS.customTextTitle);
  customTextId = $state(DEFAULTS.customTextId);
  customTimeLimit = $state(DEFAULTS.customTimeLimit);
  arenaConfigVersion = $state(0);
  get isTyping(): boolean {
    return typingActivity.isTyping;
  }
  set isTyping(v: boolean) {
    typingActivity.set(v);
  }

  // Settings-backed fields (single source of truth lives in the settings store).
  get timeLanguage() {
    return settings().timeLanguage;
  }
  set timeLanguage(v: string) {
    settings().timeLanguage = v;
  }
  get wordsLanguage() {
    return settings().wordsLanguage;
  }
  set wordsLanguage(v: string) {
    settings().wordsLanguage = v;
  }
  get targetLanguage() {
    return this.mode === "words" ? this.wordsLanguage : this.timeLanguage;
  }
  set targetLanguage(v: string) {
    if (this.mode === "words") {
      this.wordsLanguage = v;
    } else {
      this.timeLanguage = v;
    }
  }
  get quoteLanguage() {
    return settings().quoteLanguage;
  }
  set quoteLanguage(v: string) {
    settings().quoteLanguage = v;
  }
  get techLanguage() {
    return settings().techLanguage;
  }
  set techLanguage(v: string) {
    settings().techLanguage = v;
  }
  get speedUnit() {
    return settings().speedUnit;
  }
  set speedUnit(v: SpeedUnit) {
    settings().speedUnit = v;
  }
  get handGuideEnabled() {
    return settings().handGuideEnabled;
  }
  set handGuideEnabled(v: boolean) {
    settings().handGuideEnabled = v;
  }
  get handGuideMode() {
    return settings().handGuideMode;
  }
  set handGuideMode(v: "static" | "react" | "next") {
    settings().handGuideMode = v;
  }
  get handGuidePreferredMode() {
    return settings().handGuidePreferredMode;
  }
  set handGuidePreferredMode(v: "static" | "react" | "next") {
    settings().handGuidePreferredMode = v;
  }
  get handGuideStyle() {
    return settings().handGuideStyle;
  }
  set handGuideStyle(v: HandGuideStyle) {
    settings().handGuideStyle = v;
  }
  get handGuideLegendStyle() {
    return settings().handGuideLegendStyle;
  }
  set handGuideLegendStyle(v: HandGuideLegendStyle) {
    settings().handGuideLegendStyle = v;
  }
  get handGuideHands() {
    return settings().handGuideHands;
  }
  set handGuideHands(v: HandGuideHands) {
    settings().handGuideHands = v;
  }
  get handGuideSize() {
    return settings().handGuideSize;
  }
  set handGuideSize(v: number) {
    settings().handGuideSize = v;
  }
  get handGuideLayout() {
    return settings().handGuideLayout;
  }
  set handGuideLayout(v: string) {
    settings().handGuideLayout = v;
  }
  get fontSizePreset() {
    return settings().fontSizePreset;
  }
  set fontSizePreset(v: FontSizePreset) {
    settings().fontSizePreset = v;
  }
  get visibleLines() {
    return settings().visibleLines;
  }
  set visibleLines(v: number) {
    settings().visibleLines = v;
  }
  get arenaWidth() {
    return settings().arenaWidth;
  }
  set arenaWidth(v: ArenaWidthPreset) {
    settings().arenaWidth = v;
  }
  get smoothCaret() {
    return settings().smoothCaret;
  }
  set smoothCaret(v: boolean) {
    settings().smoothCaret = v;
  }
  get highlightActiveWord() {
    return settings().highlightActiveWord;
  }
  set highlightActiveWord(v: boolean) {
    settings().highlightActiveWord = v;
  }
  get showLiveStats() {
    return settings().showLiveStats;
  }
  set showLiveStats(v: boolean) {
    settings().showLiveStats = v;
  }
  get caretStyle() {
    return settings().caretStyle;
  }
  set caretStyle(v: "line" | "block" | "underline" | "outline") {
    settings().caretStyle = v;
  }
  get keymapMode() {
    return settings().keymapMode;
  }
  set keymapMode(v: "static" | "react" | "next") {
    settings().keymapMode = v;
  }
  get keymapStyle() {
    return settings().keymapStyle;
  }
  set keymapStyle(v: KeymapStyle) {
    settings().keymapStyle = v;
  }
  get keymapLegendStyle() {
    return settings().keymapLegendStyle;
  }
  set keymapLegendStyle(v: KeymapLegendStyle) {
    settings().keymapLegendStyle = v;
  }
  get keymapShowKeys() {
    return settings().keymapShowKeys;
  }
  set keymapShowKeys(v: KeymapShowKeys) {
    settings().keymapShowKeys = v;
  }
  get keymapSize() {
    return settings().keymapSize;
  }
  set keymapSize(v: number) {
    settings().keymapSize = v;
  }
  get keymapLayout() {
    return settings().keymapLayout;
  }
  set keymapLayout(v: string) {
    settings().keymapLayout = v;
  }
  get keymapVisible(): boolean {
    return settings().keymapEnabled;
  }
  set keymapVisible(v: boolean) {
    settings().keymapEnabled = v;
  }
  get keymapEnabled(): boolean {
    return settings().keymapEnabled;
  }
  set keymapEnabled(v: boolean) {
    settings().keymapEnabled = v;
  }
  get tapeEnabled(): boolean {
    return settings().tapeEnabled;
  }
  set tapeEnabled(v: boolean) {
    settings().tapeEnabled = v;
  }
  get tapeMode(): TapeMode {
    return settings().tapeMode;
  }
  set tapeMode(v: TapeMode) {
    settings().tapeMode = v;
  }
  get tapeMargin(): number {
    return settings().tapeMargin;
  }
  set tapeMargin(v: number) {
    settings().tapeMargin = v;
  }

  // Actions are arrow fields, so they stay bound when destructured or passed as callbacks.
  setMode = (v: TypingMode) => void (this.mode = v);
  setDifficulty = (v: Difficulty) => void (this.difficulty = v);
  setTimeLimit = (v: number) => void (this.timeLimit = v);
  setWordLimit = (v: number) => void (this.wordLimit = v);
  setQuoteLengthFilter = (v: QuoteLengthFilter) => void (this.quoteLengthFilter = v);
  setActiveQuoteSource = (v: string | null) => void (this.activeQuoteSource = v);
  setCustomTimeLimit = (v: number | null) => void (this.customTimeLimit = v);
  setLastResult = (v: FinalResult | null) => void (this.lastResult = v);
  setIsTyping = (v: boolean) => void (this.isTyping = v);
  togglePunctuation = () => void (this.punctuation = !this.punctuation);
  toggleNumbers = () => void (this.numbers = !this.numbers);
  notifyArenaConfigChanged = () => {
    this.arenaConfigVersion += 1;
  };
  cycleMode = () => {
    const order: readonly TypingMode[] = ["time", "words", "quote", "tech", "zen", "custom"];
    const idx = order.indexOf(this.mode);
    const next = order[(idx + 1) % order.length] ?? "time";
    this.mode = next;
    this.arenaConfigVersion += 1;
  };
  cycleDifficulty = () => {
    const order: readonly Difficulty[] = ["normal", "expert", "master"];
    const idx = order.indexOf(this.difficulty);
    const next = order[(idx + 1) % order.length] ?? "normal";
    this.difficulty = next;
    this.arenaConfigVersion += 1;
  };

  setCustomText = (text: string, title = "", id: string | null = null) => {
    this.customText = text;
    this.customTextTitle = title;
    this.customTextId = id;
  };

  setCustomPractice = (text: string, title = "", id: string | null = null) => {
    this.mode = "custom";
    this.setCustomText(text, title, id);
  };

  clearCustomText = () => this.setCustomText("");

  setTimeLanguage = (lang: string) => {
    this.timeLanguage = lang;
    persist("test.time_language", lang);
  };

  setWordsLanguage = (lang: string) => {
    this.wordsLanguage = lang;
    persist("test.words_language", lang);
  };

  setTargetLanguage = (lang: string) => {
    if (this.mode === "words") {
      this.setWordsLanguage(lang);
    } else {
      this.setTimeLanguage(lang);
    }
  };

  setQuoteLanguage = (lang: string) => {
    this.quoteLanguage = lang;
    persist("test.quote_language", lang);
  };

  setTechLanguage = (lang: string) => {
    this.techLanguage = lang;
    persist("test.tech_language", lang);
  };

  setSpeedUnit = (unit: SpeedUnit) => {
    this.speedUnit = unit;
    persist("test.speed_unit", unit);
  };

  toggleHandGuide = () => {
    const nextState = !this.handGuideEnabled;
    this.handGuideEnabled = nextState;
    persist("ui.hand_guide.enabled", String(nextState));
    if (nextState && this.keymapVisible) {
      this.keymapVisible = false;
      persist("ui.keymap.enabled", "false");
    }
  };

  setHandGuideMode = (v: "static" | "react" | "next") => {
    if (v === "static" || v === "react" || v === "next") {
      this.handGuideMode = v;
      persist("ui.hand_guide.mode", v);
      persist("ui.hand_guide.preferred_mode", v);
    }
  };

  setHandGuideStyle = (v: HandGuideStyle) => {
    this.handGuideStyle = v;
    persist("ui.hand_guide.style", v);
  };

  setHandGuideLegendStyle = (v: HandGuideLegendStyle) => {
    this.handGuideLegendStyle = v;
    persist("ui.hand_guide.legend", v);
  };

  setHandGuideHands = (v: HandGuideHands) => {
    this.handGuideHands = v;
    persist("ui.hand_guide.hands", v);
  };

  setHandGuideSize = (v: number) => {
    this.handGuideSize = v;
    persist("ui.hand_guide.size", String(v));
  };

  setHandGuideLayout = (v: string) => {
    this.handGuideLayout = v;
    persist("ui.hand_guide.layout", v);
  };

  toggleKeymap = () => {
    const nextState = !this.keymapVisible;
    this.keymapVisible = nextState;
    persist("ui.keymap.enabled", String(nextState));
    if (nextState && this.handGuideEnabled) {
      this.handGuideEnabled = false;
      persist("ui.hand_guide.enabled", "false");
    }
  };

  setKeymapMode = (v: "static" | "react" | "next") => {
    if (v === "static" || v === "react" || v === "next") {
      this.keymapMode = v;
      persist("ui.keymap.mode", v);
      persist("ui.keymap.preferred_mode", v);
    }
  };

  setKeymapStyle = (v: KeymapStyle) => {
    this.keymapStyle = v;
    persist("ui.keymap.style", v);
  };

  setKeymapLegendStyle = (v: KeymapLegendStyle) => {
    this.keymapLegendStyle = v;
    persist("ui.keymap.legend", v);
  };

  setKeymapShowKeys = (v: KeymapShowKeys) => {
    this.keymapShowKeys = v;
    persist("ui.keymap.keys", v);
  };

  setKeymapSize = (v: number) => {
    const clamped = Math.round(Math.max(0.5, Math.min(2.0, v)) * 10) / 10;
    this.keymapSize = clamped;
    persist("ui.keymap.size", String(clamped));
  };

  setKeymapLayout = (v: string) => {
    this.keymapLayout = v;
    persist("ui.keymap.layout", v);
  };

  toggleTape = () => {
    const nextState = !this.tapeEnabled;
    this.tapeEnabled = nextState;
    persist("test.tape.enabled", String(nextState));
  };

  setTapeMode = (v: TapeMode) => {
    if (v === "letter" || v === "word") {
      this.tapeMode = v;
      persist("test.tape.mode", v);
    }
  };

  setTapeMargin = (v: number) => {
    const clamped = Math.round(Math.max(0, Math.min(100, v)));
    this.tapeMargin = clamped;
    persist("test.tape.margin", String(clamped));
  };

  setFontSizePreset = (v: FontSizePreset) => {
    this.fontSizePreset = v;
    persist("test.font_size", v);
  };

  setVisibleLines = (v: number) => {
    this.visibleLines = v;
    persist("test.visible_lines", String(v));
  };

  setArenaWidth = (v: ArenaWidthPreset) => {
    this.arenaWidth = v;
    persist("test.arena_width", v);
  };

  toggleSmoothCaret = () => {
    const next = !this.smoothCaret;
    this.smoothCaret = next;
    persist("test.smooth_caret", String(next));
  };

  toggleHighlightActiveWord = () => {
    const next = !this.highlightActiveWord;
    this.highlightActiveWord = next;
    persist("test.highlight_active_word", String(next));
  };

  toggleShowLiveStats = () => {
    const next = !this.showLiveStats;
    this.showLiveStats = next;
    persist("test.show_live_stats", String(next));
  };

  cycleCaretStyle = () => {
    const styles: ("line" | "block" | "underline" | "outline")[] = [
      "line",
      "block",
      "underline",
      "outline",
    ];
    const currentIndex = styles.indexOf(this.caretStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length] ?? "line";
    this.caretStyle = nextStyle;
    persist("test.caret_style", nextStyle);
  };

  getEngineConfig = (): EngineConfig => {
    const s = settings();
    const isNormal = this.difficulty === "normal";
    const config: EngineConfig = {
      mode: this.mode,
      difficulty: this.difficulty,
      language:
        this.mode === "tech"
          ? s.techLanguage
          : this.mode === "quote"
            ? s.quoteLanguage
            : this.mode === "words"
              ? s.wordsLanguage
              : s.timeLanguage,
      punctuation: this.punctuation,
      numbers: this.numbers,
      speedUnit: s.speedUnit,
      backspaceThroughWords: isNormal ? s.backspaceThroughWords : false,
      forgivingAccuracy: isNormal ? s.forgivingAccuracy : false,
      strictSpace: false,
    };
    if (this.mode === "time") config.timeLimit = this.timeLimit;
    if (this.mode === "words") config.wordLimit = this.wordLimit;
    if (this.mode === "quote" || this.mode === "tech") config.quoteLengthFilter = this.quoteLengthFilter;
    if (this.mode === "custom") {
      config.customText = this.customText;
      if (this.customTimeLimit && this.customTimeLimit > 0) {
        config.timeLimit = this.customTimeLimit;
      }
    }
    return config;
  };

  resetTypingState = () => void Object.assign(this, DEFAULTS);
}

export const typingStore = new TypingStore();

export const useTypingStore = () => typingStore;

export const {
  setMode,
  setDifficulty,
  setTimeLimit,
  setWordLimit,
  setQuoteLengthFilter,
  setActiveQuoteSource,
  setCustomText,
  setCustomTimeLimit,
  setCustomPractice,
  clearCustomText,
  setTargetLanguage,
  setQuoteLanguage,
  setTechLanguage,
  togglePunctuation,
  toggleNumbers,
  toggleHandGuide,
  toggleKeymap,
  setKeymapMode,
  setKeymapStyle,
  setKeymapLegendStyle,
  setKeymapShowKeys,
  setKeymapSize,
  setKeymapLayout,
  toggleTape,
  setTapeMode,
  setTapeMargin,
  setFontSizePreset,
  setVisibleLines,
  setArenaWidth,
  toggleSmoothCaret,
  toggleHighlightActiveWord,
  toggleShowLiveStats,
  cycleCaretStyle,
  setSpeedUnit,
  setLastResult,
  setIsTyping,
  getEngineConfig,
  resetTypingState,
} = typingStore;