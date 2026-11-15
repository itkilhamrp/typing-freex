import type { SpeedUnit } from "@/core/typing-engine";
import type {
  KeymapMode,
  KeymapStyle,
  KeymapLegendStyle,
  KeymapShowKeys,
} from "@/core/keymap";
import type {
  HandGuideMode,
  HandGuideStyle,
  HandGuideLegendStyle,
  HandGuideHands,
} from "@/core/hand-guide";

export type {
  KeymapMode,
  KeymapStyle,
  KeymapLegendStyle,
  KeymapShowKeys,
  HandGuideMode,
  HandGuideStyle,
  HandGuideLegendStyle,
  HandGuideHands,
};

export type ThemeMode = "light" | "dark";
export type LocaleCode = "en" | "id";
export type CaretStyle = "line" | "block" | "underline" | "outline";
export type VisualAssistMode = "static" | "react" | "next";
export type FontSizePreset = "xs" | "sm" | "md" | "lg" | "xl";
export type ArenaWidthPreset = "sm" | "md" | "lg" | "xl";
export type TapeMode = "letter" | "word";

export const SETTINGS_STORAGE_KEYS = {
  theme: "typing_freex_theme",
  targetLanguage: "typing_freex_target_language",
  quoteLanguage: "typing_freex_quote_language",
  techLanguage: "typing_freex_tech_language",
  settingPrefix: "typingfreex_setting_",
} as const;

export const SETTING_DB_KEYS: readonly string[] = [
  "ui.theme",
  "ui.locale",
  "test.target_language",
  "test.quote_language",
  "test.tech_language",
  "test.speed_unit",
  "test.caret_style",
  "ui.hand_guide.enabled",
  "ui.hand_guide.mode",
  "ui.hand_guide.preferred_mode",
  "ui.hand_guide.style",
  "ui.hand_guide.legend",
  "ui.hand_guide.hands",
  "ui.hand_guide.size",
  "ui.hand_guide.layout",
  "test.backspace_through_words",
  "test.forgiving_accuracy",
  "test.font_size",
  "test.visible_lines",
  "test.arena_width",
  "test.smooth_caret",
  "test.highlight_active_word",
  "test.show_live_stats",
  "app.first_run_done",
  "ui.sidebar_collapsed",
  "history.filter.enabled",
  "history.filter.min_speed",
  "history.filter.min_accuracy",
  "ui.keymap.enabled",
  "ui.keymap.mode",
  "ui.keymap.preferred_mode",
  "ui.keymap.style",
  "ui.keymap.legend",
  "ui.keymap.keys",
  "ui.keymap.size",
  "ui.keymap.layout",
  "test.tape.enabled",
  "test.tape.mode",
  "test.tape.margin",
  "sound.enabled",
  "sound.click_pack",
  "sound.error_pack",
  "sound.volume",
  "sound.warning_seconds",
];

export const VALID_VISUAL_MODES: readonly VisualAssistMode[] = ["static", "react", "next"];
export const VALID_HAND_GUIDE_STYLES: readonly HandGuideStyle[] = ["robot", "minimal", "cyber"];
export const VALID_HAND_GUIDE_LEGENDS: readonly HandGuideLegendStyle[] = [
  "keys",
  "finger_name",
  "blank",
  "dynamic",
];
export const VALID_HAND_GUIDE_HANDS: readonly HandGuideHands[] = ["both", "left", "right"];
export const VALID_ARENA_WIDTHS: readonly ArenaWidthPreset[] = ["sm", "md", "lg", "xl"];
export const VALID_KEYMAP_STYLES: readonly KeymapStyle[] = [
  "staggered",
  "alice",
  "matrix",
  "split",
  "split_matrix",
  "steno",
  "steno_matrix",
];
export const VALID_KEYMAP_LEGENDS: readonly KeymapLegendStyle[] = [
  "lowercase",
  "uppercase",
  "blank",
  "dynamic",
];
export const VALID_KEYMAP_SHOW_KEYS: readonly KeymapShowKeys[] = [
  "minimal",
  "minimal_numrow",
  "full",
];
export const VALID_TAPE_MODES: readonly TapeMode[] = ["letter", "word"];
export const VALID_SOUND_WARNING_SECONDS: readonly number[] = [1, 3, 5, 10];

export const DEFAULT_SETTINGS = {
  theme: "dark" as ThemeMode,
  locale: "en" as LocaleCode,
  speedUnit: "wpm" as SpeedUnit,
  timeLanguage: "random",
  wordsLanguage: "random",
  targetLanguage: "random",
  quoteLanguage: "random",
  techLanguage: "random",
  caretStyle: "line" as CaretStyle,
  handGuideMode: "next" as VisualAssistMode,
  handGuidePreferredMode: "next" as VisualAssistMode,
  handGuideStyle: "robot" as HandGuideStyle,
  handGuideLegendStyle: "blank" as HandGuideLegendStyle,
  handGuideHands: "both" as HandGuideHands,
  handGuideSize: 1.0,
  handGuideLayout: "qwerty-us",
  handGuideEnabled: true,
  backspaceThroughWords: false,
  forgivingAccuracy: false,
  fontSizePreset: "md" as FontSizePreset,
  visibleLines: 3,
  arenaWidth: "lg" as ArenaWidthPreset,
  smoothCaret: false,
  highlightActiveWord: false,
  showLiveStats: true,
  firstRunDone: true,
  sidebarCollapsed: false,
  historyFilterEnabled: false,
  historyFilterMinSpeed: 0,
  historyFilterMinAccuracy: 0,
  keymapMode: "static" as VisualAssistMode,
  keymapPreferredMode: "static" as VisualAssistMode,
  keymapEnabled: false,
  keymapStyle: "staggered" as KeymapStyle,
  keymapLegendStyle: "lowercase" as KeymapLegendStyle,
  keymapShowKeys: "full" as KeymapShowKeys,
  keymapSize: 1.0,
  keymapLayout: "qwerty-us",
  tapeEnabled: false,
  tapeMode: "letter" as TapeMode,
  tapeMargin: 50,
  soundEnabled: false,
  soundClickPack: "nk-creams",
  soundErrorPack: "error-damage",
  soundVolume: 0.5,
  soundWarningSeconds: 3,
} as const;

