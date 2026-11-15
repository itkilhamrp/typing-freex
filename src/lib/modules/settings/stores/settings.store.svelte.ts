import { settingsApi } from "@/core/ipc/client";
import type { SpeedUnit } from "@/core/typing-engine";
import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
import {
  DEFAULT_SETTINGS,
  SETTING_DB_KEYS,
  SETTINGS_STORAGE_KEYS,
  VALID_ARENA_WIDTHS,
  VALID_HAND_GUIDE_HANDS,
  VALID_HAND_GUIDE_LEGENDS,
  VALID_HAND_GUIDE_STYLES,
  VALID_KEYMAP_LEGENDS,
  VALID_KEYMAP_SHOW_KEYS,
  VALID_KEYMAP_STYLES,
  VALID_SOUND_WARNING_SECONDS,
  VALID_TAPE_MODES,
  VALID_VISUAL_MODES,
  type ArenaWidthPreset,
  type CaretStyle,
  type FontSizePreset,
  type HandGuideHands,
  type HandGuideLegendStyle,
  type HandGuideMode,
  type HandGuideStyle,
  type KeymapLegendStyle,
  type KeymapMode,
  type KeymapShowKeys,
  type KeymapStyle,
  type LocaleCode,
  type TapeMode,
  type ThemeMode,
  type VisualAssistMode,
} from "../logic/settings-defaults.js";
import {
  clampHistoryMinAccuracy,
  clampHistoryMinSpeed,
  clampScaleSize,
  clampSoundVolume,
  clampTapeMargin,
  clampVisibleLines,
  decodeStorageFallback,
  parseBooleanSetting,
  parseClampedFloat,
  parseIntInSet,
  parseOneOf,
  parsePositiveIntCapped,
} from "../logic/settings-codec.js";

export type {
  KeymapMode,
  KeymapStyle,
  KeymapLegendStyle,
  KeymapShowKeys,
  HandGuideMode,
  HandGuideStyle,
  HandGuideLegendStyle,
  HandGuideHands,
  ThemeMode,
  FontSizePreset,
  ArenaWidthPreset,
  TapeMode,
};

let activeProfileScopeUuid: string | null = null;

export function setSettingsProfileScope(uuid: string | null): void {
  activeProfileScopeUuid = uuid;
}

function getScopedStorageItem(baseKey: string): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    if (activeProfileScopeUuid) {
      const scopedVal = window.localStorage.getItem(`${baseKey}_${activeProfileScopeUuid}`);
      if (scopedVal !== null && scopedVal !== undefined) {
        return scopedVal;
      }
    }
    return window.localStorage.getItem(baseKey);
  } catch {
    return null;
  }
}

function setScopedStorageItem(baseKey: string, value: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    if (activeProfileScopeUuid) {
      window.localStorage.setItem(`${baseKey}_${activeProfileScopeUuid}`, value);
    }
    window.localStorage.setItem(baseKey, value);
  } catch {
    // Ignore localStorage write failures
  }
}

function getStorageSetting<T>(key: string, fallback: T): T {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const scopedKey = activeProfileScopeUuid
        ? `${SETTINGS_STORAGE_KEYS.settingPrefix}${activeProfileScopeUuid}_${key}`
        : null;
      const val =
        (scopedKey ? window.localStorage.getItem(scopedKey) : null) ??
        window.localStorage.getItem(SETTINGS_STORAGE_KEYS.settingPrefix + key);
      return decodeStorageFallback(val, fallback);
    } catch {
      // Ignore localStorage access failures
    }
  }
  return fallback;
}

function setStorageSetting(key: string, value: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (activeProfileScopeUuid) {
        window.localStorage.setItem(
          `${SETTINGS_STORAGE_KEYS.settingPrefix}${activeProfileScopeUuid}_${key}`,
          value,
        );
      }
      window.localStorage.setItem(SETTINGS_STORAGE_KEYS.settingPrefix + key, value);
    } catch {
      // Ignore localStorage write failures
    }
  }
}

function getSystemTheme(): ThemeMode {
  if (typeof window !== "undefined" && window.matchMedia) {
    try {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
      if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    } catch {
      // Ignore
    }
  }
  return DEFAULT_SETTINGS.theme;
}

function getInitialTheme(): ThemeMode {
  const stored = getScopedStorageItem(SETTINGS_STORAGE_KEYS.theme);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return getSystemTheme();
}

function getInitialVisualMode(
  modeKey: string,
  preferredKey: string,
  fallback: VisualAssistMode,
): VisualAssistMode {
  const stored = parseOneOf(getStorageSetting<string>(modeKey, ""), VALID_VISUAL_MODES);
  if (stored) return stored;
  const preferred = parseOneOf(getStorageSetting<string>(preferredKey, ""), VALID_VISUAL_MODES);
  if (preferred) return preferred;
  return fallback;
}

function persistKeyQuiet(key: string, value: string): void {
  setStorageSetting(key, value);
  try {
    void settingsApi.set({ [key]: value });
  } catch {
    // ignore
  }
}

let theme = $state<ThemeMode>(getInitialTheme());
let locale = $state<LocaleCode>(DEFAULT_SETTINGS.locale);
let speedUnit = $state<SpeedUnit>(
  getStorageSetting("test.speed_unit", DEFAULT_SETTINGS.speedUnit),
);
let timeLanguage = $state<string>(DEFAULT_SETTINGS.timeLanguage);
let wordsLanguage = $state<string>(DEFAULT_SETTINGS.wordsLanguage);
let targetLanguage = $state<string>(DEFAULT_SETTINGS.targetLanguage);
let quoteLanguage = $state<string>(DEFAULT_SETTINGS.quoteLanguage);
let techLanguage = $state<string>(DEFAULT_SETTINGS.techLanguage);
let caretStyle = $state<CaretStyle>(
  getStorageSetting("test.caret_style", DEFAULT_SETTINGS.caretStyle),
);
let handGuideMode = $state<VisualAssistMode>(
  getInitialVisualMode(
    "ui.hand_guide.mode",
    "ui.hand_guide.preferred_mode",
    DEFAULT_SETTINGS.handGuideMode,
  ),
);
let handGuidePreferredMode = $state<VisualAssistMode>(
  getInitialVisualMode(
    "ui.hand_guide.mode",
    "ui.hand_guide.preferred_mode",
    DEFAULT_SETTINGS.handGuidePreferredMode,
  ),
);
let handGuideStyle = $state<HandGuideStyle>(
  getStorageSetting("ui.hand_guide.style", DEFAULT_SETTINGS.handGuideStyle),
);
let handGuideLegendStyle = $state<HandGuideLegendStyle>(
  getStorageSetting("ui.hand_guide.legend", DEFAULT_SETTINGS.handGuideLegendStyle),
);
let handGuideHands = $state<HandGuideHands>(
  getStorageSetting("ui.hand_guide.hands", DEFAULT_SETTINGS.handGuideHands),
);
let handGuideSize = $state<number>(
  clampScaleSize(getStorageSetting("ui.hand_guide.size", DEFAULT_SETTINGS.handGuideSize)),
);
let handGuideLayout = $state<string>(
  getStorageSetting("ui.hand_guide.layout", DEFAULT_SETTINGS.handGuideLayout),
);
let handGuideEnabled = $state<boolean>(
  getStorageSetting("ui.hand_guide.enabled", DEFAULT_SETTINGS.handGuideEnabled),
);
let backspaceThroughWords = $state<boolean>(
  getStorageSetting("test.backspace_through_words", DEFAULT_SETTINGS.backspaceThroughWords),
);
let forgivingAccuracy = $state<boolean>(
  getStorageSetting("test.forgiving_accuracy", DEFAULT_SETTINGS.forgivingAccuracy),
);
let fontSizePreset = $state<FontSizePreset>(
  getStorageSetting("test.font_size", DEFAULT_SETTINGS.fontSizePreset),
);
let visibleLines = $state<number>(
  clampVisibleLines(getStorageSetting("test.visible_lines", DEFAULT_SETTINGS.visibleLines)),
);
let arenaWidth = $state<ArenaWidthPreset>(
  getStorageSetting("test.arena_width", DEFAULT_SETTINGS.arenaWidth),
);
let smoothCaret = $state<boolean>(
  getStorageSetting("test.smooth_caret", DEFAULT_SETTINGS.smoothCaret),
);
let highlightActiveWord = $state<boolean>(
  getStorageSetting("test.highlight_active_word", DEFAULT_SETTINGS.highlightActiveWord),
);
let showLiveStats = $state<boolean>(
  getStorageSetting("test.show_live_stats", DEFAULT_SETTINGS.showLiveStats),
);
let firstRunDone = $state<boolean>(DEFAULT_SETTINGS.firstRunDone);
let sidebarCollapsed = $state<boolean>(
  getStorageSetting("ui.sidebar_collapsed", DEFAULT_SETTINGS.sidebarCollapsed),
);
let historyFilterEnabled = $state<boolean>(
  getStorageSetting("history.filter.enabled", DEFAULT_SETTINGS.historyFilterEnabled),
);
let historyFilterMinSpeed = $state<number>(
  getStorageSetting("history.filter.min_speed", DEFAULT_SETTINGS.historyFilterMinSpeed),
);
let historyFilterMinAccuracy = $state<number>(
  getStorageSetting("history.filter.min_accuracy", DEFAULT_SETTINGS.historyFilterMinAccuracy),
);
let keymapMode = $state<VisualAssistMode>(
  getInitialVisualMode(
    "ui.keymap.mode",
    "ui.keymap.preferred_mode",
    DEFAULT_SETTINGS.keymapMode,
  ),
);
let keymapPreferredMode = $state<VisualAssistMode>(
  getInitialVisualMode(
    "ui.keymap.mode",
    "ui.keymap.preferred_mode",
    DEFAULT_SETTINGS.keymapPreferredMode,
  ),
);
let keymapEnabled = $state<boolean>(
  getStorageSetting("ui.keymap.enabled", DEFAULT_SETTINGS.keymapEnabled) &&
    !getStorageSetting("ui.hand_guide.enabled", DEFAULT_SETTINGS.handGuideEnabled),
);
let keymapStyle = $state<KeymapStyle>(
  getStorageSetting("ui.keymap.style", DEFAULT_SETTINGS.keymapStyle),
);
let keymapLegendStyle = $state<KeymapLegendStyle>(
  getStorageSetting("ui.keymap.legend", DEFAULT_SETTINGS.keymapLegendStyle),
);
let keymapShowKeys = $state<KeymapShowKeys>(
  getStorageSetting("ui.keymap.keys", DEFAULT_SETTINGS.keymapShowKeys),
);
let keymapSize = $state<number>(
  clampScaleSize(getStorageSetting("ui.keymap.size", DEFAULT_SETTINGS.keymapSize)),
);
let keymapLayout = $state<string>(
  getStorageSetting("ui.keymap.layout", DEFAULT_SETTINGS.keymapLayout),
);
let tapeEnabled = $state<boolean>(
  getStorageSetting("test.tape.enabled", DEFAULT_SETTINGS.tapeEnabled),
);
let tapeMode = $state<TapeMode>(
  getStorageSetting("test.tape.mode", DEFAULT_SETTINGS.tapeMode),
);
let tapeMargin = $state<number>(
  clampTapeMargin(getStorageSetting("test.tape.margin", DEFAULT_SETTINGS.tapeMargin)),
);
let soundEnabled = $state<boolean>(
  getStorageSetting("sound.enabled", DEFAULT_SETTINGS.soundEnabled),
);
let soundClickPack = $state<string>(
  getStorageSetting("sound.click_pack", DEFAULT_SETTINGS.soundClickPack) ||
    DEFAULT_SETTINGS.soundClickPack,
);
let soundErrorPack = $state<string>(
  getStorageSetting("sound.error_pack", DEFAULT_SETTINGS.soundErrorPack) ||
    DEFAULT_SETTINGS.soundErrorPack,
);
let soundVolume = $state<number>(
  clampSoundVolume(getStorageSetting("sound.volume", DEFAULT_SETTINGS.soundVolume)),
);
let soundWarningSeconds = $state<number>(
  getStorageSetting("sound.warning_seconds", DEFAULT_SETTINGS.soundWarningSeconds),
);
let isLoading = $state<boolean>(false);

const isDark = $derived<boolean>(theme === "dark");

function applyLocale(targetLocale: LocaleCode) {
  const i18nStore = useI18n();
  i18nStore.locale = targetLocale;
  if (typeof document !== "undefined") {
    document.documentElement.lang = targetLocale;
    document.documentElement.dir = "ltr";
  }
}

export function applyTheme(targetTheme: ThemeMode | string) {
  const resolved: ThemeMode =
    targetTheme === "light" ? "light" : targetTheme === "dark" ? "dark" : getSystemTheme();
  theme = resolved;
  setScopedStorageItem(SETTINGS_STORAGE_KEYS.theme, resolved);
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-mode", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-mode", "light");
  }
}

function hydrateBoolean(
  data: Record<string, string>,
  key: string,
  apply: (v: boolean) => void,
  resetOnUndefined?: () => void,
): void {
  if (data[key] !== undefined) {
    const val = parseBooleanSetting(data[key]);
    apply(val);
    setStorageSetting(key, String(val));
  } else if (resetOnUndefined) {
    resetOnUndefined();
  }
}

function hydrateVisualMode(
  data: Record<string, string>,
  modeKey: string,
  preferredKey: string,
  enabledKey: string,
  onMode: (mode: VisualAssistMode) => void,
  onDisable: () => void,
): void {
  if (data[modeKey]) {
    const parsed = parseOneOf(data[modeKey], VALID_VISUAL_MODES);
    if (parsed) {
      onMode(parsed);
      setStorageSetting(modeKey, parsed);
      setStorageSetting(preferredKey, parsed);
    } else if (data[modeKey] === "off" && data[enabledKey] === undefined) {
      onDisable();
      setStorageSetting(enabledKey, "false");
    }
  }
  if (data[preferredKey]) {
    const pref = parseOneOf(data[preferredKey], VALID_VISUAL_MODES);
    if (pref) {
      onMode(pref);
      setStorageSetting(preferredKey, pref);
      setStorageSetting(modeKey, pref);
    }
  }
}

export async function loadSettings(): Promise<void> {
  if (isLoading) return;
  isLoading = true;
  try {
    const data = await settingsApi.get([...SETTING_DB_KEYS]);

    applyTheme(data["ui.theme"] || theme);
    if (data["ui.locale"]) {
      locale = data["ui.locale"] as LocaleCode;
      applyLocale(locale);
    }
    if (data["test.target_language"] === "random") targetLanguage = "random";
    if (data["test.quote_language"] === "random") quoteLanguage = "random";
    if (data["test.tech_language"] === "random") techLanguage = "random";

    if (data["test.speed_unit"]) {
      speedUnit = data["test.speed_unit"] as SpeedUnit;
      setStorageSetting("test.speed_unit", speedUnit);
    }
    if (data["test.caret_style"]) {
      caretStyle = data["test.caret_style"] as CaretStyle;
      setStorageSetting("test.caret_style", caretStyle);
    }

    hydrateBoolean(data, "ui.hand_guide.enabled", (v) => (handGuideEnabled = v));
    hydrateVisualMode(
      data,
      "ui.hand_guide.mode",
      "ui.hand_guide.preferred_mode",
      "ui.hand_guide.enabled",
      (m) => {
        handGuideMode = m;
        handGuidePreferredMode = m;
      },
      () => (handGuideEnabled = false),
    );

    const hgStyle = parseOneOf(data["ui.hand_guide.style"], VALID_HAND_GUIDE_STYLES);
    if (hgStyle) {
      handGuideStyle = hgStyle;
      setStorageSetting("ui.hand_guide.style", hgStyle);
    }
    const hgLegend = parseOneOf(data["ui.hand_guide.legend"], VALID_HAND_GUIDE_LEGENDS);
    if (hgLegend) {
      handGuideLegendStyle = hgLegend;
      setStorageSetting("ui.hand_guide.legend", hgLegend);
    }
    const hgHands = parseOneOf(data["ui.hand_guide.hands"], VALID_HAND_GUIDE_HANDS);
    if (hgHands) {
      handGuideHands = hgHands;
      setStorageSetting("ui.hand_guide.hands", hgHands);
    }
    const hgSize = parseClampedFloat(data["ui.hand_guide.size"], 0.5, 2.0);
    if (hgSize !== null) {
      handGuideSize = clampScaleSize(hgSize);
      setStorageSetting("ui.hand_guide.size", String(handGuideSize));
    }
    if (data["ui.hand_guide.layout"]) {
      handGuideLayout = data["ui.hand_guide.layout"];
      setStorageSetting("ui.hand_guide.layout", handGuideLayout);
    }

    if (data["test.backspace_through_words"]) {
      backspaceThroughWords = parseBooleanSetting(data["test.backspace_through_words"]);
      setStorageSetting("test.backspace_through_words", String(backspaceThroughWords));
    }
    hydrateBoolean(
      data,
      "test.forgiving_accuracy",
      (v) => (forgivingAccuracy = v),
      () => (forgivingAccuracy = false),
    );
    if (data["test.font_size"]) {
      fontSizePreset = data["test.font_size"] as FontSizePreset;
      setStorageSetting("test.font_size", fontSizePreset);
    }
    const lines = parsePositiveIntCapped(data["test.visible_lines"], 1, 5);
    if (lines !== null) {
      visibleLines = lines;
      setStorageSetting("test.visible_lines", String(visibleLines));
    }
    const width = parseOneOf(data["test.arena_width"], VALID_ARENA_WIDTHS);
    if (width) {
      arenaWidth = width;
      setStorageSetting("test.arena_width", width);
    }

    hydrateBoolean(data, "test.smooth_caret", (v) => (smoothCaret = v));
    hydrateBoolean(data, "test.highlight_active_word", (v) => (highlightActiveWord = v));
    hydrateBoolean(data, "test.show_live_stats", (v) => (showLiveStats = v));
    if (data["app.first_run_done"]) {
      firstRunDone = parseBooleanSetting(data["app.first_run_done"]);
      setStorageSetting("app.first_run_done", String(firstRunDone));
    }
    if (data["ui.sidebar_collapsed"]) {
      sidebarCollapsed = parseBooleanSetting(data["ui.sidebar_collapsed"]);
      setStorageSetting("ui.sidebar_collapsed", String(sidebarCollapsed));
    }

    hydrateBoolean(
      data,
      "history.filter.enabled",
      (v) => (historyFilterEnabled = v),
      () => (historyFilterEnabled = false),
    );
    if (data["history.filter.min_speed"] !== undefined) {
      const spd = parseClampedFloat(data["history.filter.min_speed"], 0, 300);
      if (spd !== null) {
        historyFilterMinSpeed = spd;
        setStorageSetting("history.filter.min_speed", String(historyFilterMinSpeed));
      }
    } else {
      historyFilterMinSpeed = 0;
    }
    if (data["history.filter.min_accuracy"] !== undefined) {
      const acc = parseClampedFloat(data["history.filter.min_accuracy"], 0, 100);
      if (acc !== null) {
        historyFilterMinAccuracy = acc;
        setStorageSetting("history.filter.min_accuracy", String(historyFilterMinAccuracy));
      }
    } else {
      historyFilterMinAccuracy = 0;
    }

    hydrateBoolean(data, "ui.keymap.enabled", (v) => (keymapEnabled = v));
    hydrateVisualMode(
      data,
      "ui.keymap.mode",
      "ui.keymap.preferred_mode",
      "ui.keymap.enabled",
      (m) => {
        keymapMode = m;
        keymapPreferredMode = m;
      },
      () => (keymapEnabled = false),
    );

    const kmStyle = parseOneOf(data["ui.keymap.style"], VALID_KEYMAP_STYLES);
    if (kmStyle) {
      keymapStyle = kmStyle;
      setStorageSetting("ui.keymap.style", kmStyle);
    }
    const kmLegend = parseOneOf(data["ui.keymap.legend"], VALID_KEYMAP_LEGENDS);
    if (kmLegend) {
      keymapLegendStyle = kmLegend;
      setStorageSetting("ui.keymap.legend", kmLegend);
    }
    const kmKeys = parseOneOf(data["ui.keymap.keys"], VALID_KEYMAP_SHOW_KEYS);
    if (kmKeys) {
      keymapShowKeys = kmKeys;
      setStorageSetting("ui.keymap.keys", kmKeys);
    }
    const kmSize = parseClampedFloat(data["ui.keymap.size"], 0.5, 2.0);
    if (kmSize !== null) {
      keymapSize = clampScaleSize(kmSize);
      setStorageSetting("ui.keymap.size", String(keymapSize));
    }
    if (data["ui.keymap.layout"]) {
      keymapLayout = data["ui.keymap.layout"];
      setStorageSetting("ui.keymap.layout", keymapLayout);
    }

    hydrateBoolean(data, "test.tape.enabled", (v) => (tapeEnabled = v));
    const tpMode = parseOneOf(data["test.tape.mode"], VALID_TAPE_MODES);
    if (tpMode) {
      tapeMode = tpMode;
      setStorageSetting("test.tape.mode", tpMode);
    }
    const tpMargin = parseClampedFloat(data["test.tape.margin"], 0, 100, clampTapeMargin);
    if (tpMargin !== null) {
      tapeMargin = tpMargin;
      setStorageSetting("test.tape.margin", String(tapeMargin));
    }

    hydrateBoolean(data, "sound.enabled", (v) => (soundEnabled = v));
    if (data["sound.click_pack"] && data["sound.click_pack"] !== "off") {
      soundClickPack = data["sound.click_pack"];
      setStorageSetting("sound.click_pack", soundClickPack);
    }
    if (data["sound.error_pack"] && data["sound.error_pack"] !== "off") {
      soundErrorPack = data["sound.error_pack"];
      setStorageSetting("sound.error_pack", soundErrorPack);
    }
    const sVol = parseClampedFloat(data["sound.volume"], 0, 2.0, clampSoundVolume);
    if (sVol !== null) {
      soundVolume = sVol;
      setStorageSetting("sound.volume", String(soundVolume));
    }
    const sWarn = parseIntInSet(data["sound.warning_seconds"], VALID_SOUND_WARNING_SECONDS);
    if (sWarn !== null) {
      soundWarningSeconds = sWarn;
      setStorageSetting("sound.warning_seconds", String(soundWarningSeconds));
    }

    // Enforce mutual exclusion on arena visibility only
    if (handGuideEnabled && keymapEnabled) {
      keymapEnabled = false;
      persistKeyQuiet("ui.keymap.enabled", "false");
    }
  } catch (err) {
    console.warn(
      "Failed to load settings via IPC, defaulting to fallback configuration:",
      err,
    );
    applyTheme(theme);
  } finally {
    isLoading = false;
  }
}

export async function updateSetting(key: string, value: string): Promise<void> {
  let normalizedValue = value;

  switch (key) {
    case "ui.theme":
      applyTheme(value);
      break;
    case "ui.locale":
      locale = value as LocaleCode;
      applyLocale(locale);
      break;
    case "test.target_language":
      targetLanguage = value;
      timeLanguage = value;
      setScopedStorageItem(SETTINGS_STORAGE_KEYS.targetLanguage, targetLanguage);
      break;
    case "test.time_language":
      timeLanguage = value;
      targetLanguage = value;
      break;
    case "test.words_language":
      wordsLanguage = value;
      break;
    case "test.quote_language":
      quoteLanguage = value;
      setScopedStorageItem(SETTINGS_STORAGE_KEYS.quoteLanguage, quoteLanguage);
      break;
    case "test.tech_language":
      techLanguage = value;
      setScopedStorageItem(SETTINGS_STORAGE_KEYS.techLanguage, techLanguage);
      break;
    case "test.speed_unit":
      speedUnit = value as SpeedUnit;
      break;
    case "test.caret_style":
      caretStyle = value as CaretStyle;
      break;
    case "ui.hand_guide.enabled": {
      const enabled = parseBooleanSetting(value);
      handGuideEnabled = enabled;
      if (enabled && keymapEnabled) {
        keymapEnabled = false;
        persistKeyQuiet("ui.keymap.enabled", "false");
      }
      break;
    }
    case "ui.hand_guide.mode": {
      const parsed = parseOneOf(value, VALID_VISUAL_MODES);
      if (parsed) {
        handGuideMode = parsed;
        handGuidePreferredMode = parsed;
        persistKeyQuiet("ui.hand_guide.preferred_mode", parsed);
      }
      break;
    }
    case "ui.hand_guide.preferred_mode": {
      const parsed = parseOneOf(value, VALID_VISUAL_MODES);
      if (parsed) {
        handGuidePreferredMode = parsed;
        handGuideMode = parsed;
        persistKeyQuiet("ui.hand_guide.mode", parsed);
      }
      break;
    }
    case "ui.hand_guide.style": {
      const parsed = parseOneOf(value, VALID_HAND_GUIDE_STYLES);
      if (parsed) handGuideStyle = parsed;
      break;
    }
    case "ui.hand_guide.legend": {
      const parsed = parseOneOf(value, VALID_HAND_GUIDE_LEGENDS);
      if (parsed) handGuideLegendStyle = parsed;
      break;
    }
    case "ui.hand_guide.hands": {
      const parsed = parseOneOf(value, VALID_HAND_GUIDE_HANDS);
      if (parsed) handGuideHands = parsed;
      break;
    }
    case "ui.hand_guide.size": {
      const parsed = parseClampedFloat(value, 0.5, 2.0, clampScaleSize);
      if (parsed !== null) {
        handGuideSize = parsed;
        normalizedValue = String(parsed);
      }
      break;
    }
    case "ui.hand_guide.layout":
      handGuideLayout = value;
      break;
    case "test.backspace_through_words":
      backspaceThroughWords = parseBooleanSetting(value);
      break;
    case "test.forgiving_accuracy":
      forgivingAccuracy = parseBooleanSetting(value);
      break;
    case "test.font_size":
      fontSizePreset = value as FontSizePreset;
      break;
    case "test.visible_lines": {
      const parsed = parsePositiveIntCapped(value, 1, 5);
      if (parsed !== null) {
        visibleLines = parsed;
        normalizedValue = String(parsed);
      }
      break;
    }
    case "test.arena_width": {
      const parsed = parseOneOf(value, VALID_ARENA_WIDTHS);
      if (parsed) arenaWidth = parsed;
      break;
    }
    case "test.smooth_caret":
      smoothCaret = parseBooleanSetting(value);
      break;
    case "test.highlight_active_word":
      highlightActiveWord = parseBooleanSetting(value);
      break;
    case "test.show_live_stats":
      showLiveStats = parseBooleanSetting(value);
      break;
    case "app.first_run_done":
      firstRunDone = parseBooleanSetting(value);
      break;
    case "ui.sidebar_collapsed":
      sidebarCollapsed = parseBooleanSetting(value);
      break;
    case "history.filter.enabled":
      historyFilterEnabled = parseBooleanSetting(value);
      break;
    case "history.filter.min_speed": {
      const parsed = parseClampedFloat(value, 0, 300);
      if (parsed !== null) {
        historyFilterMinSpeed = parsed;
        normalizedValue = String(parsed);
      }
      break;
    }
    case "history.filter.min_accuracy": {
      const parsed = parseClampedFloat(value, 0, 100);
      if (parsed !== null) {
        historyFilterMinAccuracy = parsed;
        normalizedValue = String(parsed);
      }
      break;
    }
    case "ui.keymap.enabled": {
      const enabled = parseBooleanSetting(value);
      keymapEnabled = enabled;
      if (enabled && handGuideEnabled) {
        handGuideEnabled = false;
        persistKeyQuiet("ui.hand_guide.enabled", "false");
      }
      break;
    }
    case "ui.keymap.mode": {
      const parsed = parseOneOf(value, VALID_VISUAL_MODES);
      if (parsed) {
        keymapMode = parsed;
        keymapPreferredMode = parsed;
        persistKeyQuiet("ui.keymap.preferred_mode", parsed);
      }
      break;
    }
    case "ui.keymap.preferred_mode": {
      const parsed = parseOneOf(value, VALID_VISUAL_MODES);
      if (parsed) {
        keymapPreferredMode = parsed;
        keymapMode = parsed;
        persistKeyQuiet("ui.keymap.mode", parsed);
      }
      break;
    }
    case "ui.keymap.style": {
      const parsed = parseOneOf(value, VALID_KEYMAP_STYLES);
      if (parsed) keymapStyle = parsed;
      break;
    }
    case "ui.keymap.legend": {
      const parsed = parseOneOf(value, VALID_KEYMAP_LEGENDS);
      if (parsed) keymapLegendStyle = parsed;
      break;
    }
    case "ui.keymap.keys": {
      const parsed = parseOneOf(value, VALID_KEYMAP_SHOW_KEYS);
      if (parsed) keymapShowKeys = parsed;
      break;
    }
    case "ui.keymap.size": {
      const parsed = parseClampedFloat(value, 0.5, 2.0, clampScaleSize);
      if (parsed !== null) {
        keymapSize = parsed;
        normalizedValue = String(parsed);
      }
      break;
    }
    case "ui.keymap.layout":
      keymapLayout = value;
      break;
    case "test.tape.enabled":
      tapeEnabled = parseBooleanSetting(value);
      break;
    case "test.tape.mode": {
      const parsed = parseOneOf(value, VALID_TAPE_MODES);
      if (parsed) tapeMode = parsed;
      break;
    }
    case "test.tape.margin": {
      const parsed = parseClampedFloat(value, 0, 100, clampTapeMargin);
      if (parsed !== null) {
        tapeMargin = parsed;
        normalizedValue = String(parsed);
      }
      break;
    }
    case "sound.enabled":
      soundEnabled = parseBooleanSetting(value);
      break;
    case "sound.click_pack":
      if (value && value !== "off") soundClickPack = value;
      break;
    case "sound.error_pack":
      if (value && value !== "off") soundErrorPack = value;
      break;
    case "sound.volume": {
      const parsed = parseClampedFloat(value, 0, 2.0, clampSoundVolume);
      if (parsed !== null) {
        soundVolume = parsed;
        normalizedValue = String(parsed);
      }
      break;
    }
    case "sound.warning_seconds": {
      const parsed = parseIntInSet(value, VALID_SOUND_WARNING_SECONDS);
      if (parsed !== null) {
        soundWarningSeconds = parsed;
        normalizedValue = String(parsed);
      }
      break;
    }
  }

  setStorageSetting(key, normalizedValue);

  try {
    await settingsApi.set({ [key]: normalizedValue });
  } catch (err) {
    console.warn(`Failed to persist setting ${key} via IPC:`, err);
  }
}

export function resetSettingsState(): void {
  activeProfileScopeUuid = null;
  theme = getInitialTheme();
  locale = DEFAULT_SETTINGS.locale;
  speedUnit = DEFAULT_SETTINGS.speedUnit;
  timeLanguage = DEFAULT_SETTINGS.timeLanguage;
  wordsLanguage = DEFAULT_SETTINGS.wordsLanguage;
  targetLanguage = DEFAULT_SETTINGS.targetLanguage;
  quoteLanguage = DEFAULT_SETTINGS.quoteLanguage;
  techLanguage = DEFAULT_SETTINGS.techLanguage;
  caretStyle = DEFAULT_SETTINGS.caretStyle;
  handGuideMode = DEFAULT_SETTINGS.handGuideMode;
  handGuidePreferredMode = DEFAULT_SETTINGS.handGuidePreferredMode;
  handGuideEnabled = DEFAULT_SETTINGS.handGuideEnabled;
  keymapMode = DEFAULT_SETTINGS.keymapMode;
  keymapPreferredMode = DEFAULT_SETTINGS.keymapPreferredMode;
  keymapEnabled = DEFAULT_SETTINGS.keymapEnabled;
  keymapStyle = DEFAULT_SETTINGS.keymapStyle;
  keymapLegendStyle = DEFAULT_SETTINGS.keymapLegendStyle;
  keymapShowKeys = DEFAULT_SETTINGS.keymapShowKeys;
  keymapSize = DEFAULT_SETTINGS.keymapSize;
  keymapLayout = DEFAULT_SETTINGS.keymapLayout;
  backspaceThroughWords = DEFAULT_SETTINGS.backspaceThroughWords;
  forgivingAccuracy = DEFAULT_SETTINGS.forgivingAccuracy;
  fontSizePreset = DEFAULT_SETTINGS.fontSizePreset;
  visibleLines = DEFAULT_SETTINGS.visibleLines;
  arenaWidth = DEFAULT_SETTINGS.arenaWidth;
  smoothCaret = DEFAULT_SETTINGS.smoothCaret;
  highlightActiveWord = DEFAULT_SETTINGS.highlightActiveWord;
  showLiveStats = DEFAULT_SETTINGS.showLiveStats;
  firstRunDone = DEFAULT_SETTINGS.firstRunDone;
  sidebarCollapsed = DEFAULT_SETTINGS.sidebarCollapsed;
  historyFilterEnabled = DEFAULT_SETTINGS.historyFilterEnabled;
  historyFilterMinSpeed = DEFAULT_SETTINGS.historyFilterMinSpeed;
  historyFilterMinAccuracy = DEFAULT_SETTINGS.historyFilterMinAccuracy;
  tapeEnabled = DEFAULT_SETTINGS.tapeEnabled;
  tapeMode = DEFAULT_SETTINGS.tapeMode;
  tapeMargin = DEFAULT_SETTINGS.tapeMargin;
  soundEnabled = DEFAULT_SETTINGS.soundEnabled;
  soundClickPack = DEFAULT_SETTINGS.soundClickPack;
  soundErrorPack = DEFAULT_SETTINGS.soundErrorPack;
  soundVolume = DEFAULT_SETTINGS.soundVolume;
  soundWarningSeconds = DEFAULT_SETTINGS.soundWarningSeconds;
  isLoading = false;
}

export function useSettingsStore() {
  return {
    get theme() {
      return theme;
    },
    set theme(v: ThemeMode) {
      theme = v;
    },
    get isDark() {
      return isDark;
    },
    get locale() {
      return locale;
    },
    set locale(v: LocaleCode) {
      locale = v;
    },
    get timeLanguage() {
      return timeLanguage;
    },
    set timeLanguage(v: string) {
      timeLanguage = v;
      setScopedStorageItem(SETTINGS_STORAGE_KEYS.targetLanguage, v);
    },
    get wordsLanguage() {
      return wordsLanguage;
    },
    set wordsLanguage(v: string) {
      wordsLanguage = v;
    },
    get targetLanguage() {
      return targetLanguage;
    },
    set targetLanguage(v: string) {
      targetLanguage = v;
      timeLanguage = v;
      setScopedStorageItem(SETTINGS_STORAGE_KEYS.targetLanguage, v);
    },
    get quoteLanguage() {
      return quoteLanguage;
    },
    set quoteLanguage(v: string) {
      quoteLanguage = v;
      setScopedStorageItem(SETTINGS_STORAGE_KEYS.quoteLanguage, v);
    },
    get techLanguage() {
      return techLanguage;
    },
    set techLanguage(v: string) {
      techLanguage = v;
      setScopedStorageItem(SETTINGS_STORAGE_KEYS.techLanguage, v);
    },
    get speedUnit() {
      return speedUnit;
    },
    set speedUnit(v: SpeedUnit) {
      speedUnit = v;
      void updateSetting("test.speed_unit", v);
    },
    get caretStyle() {
      return caretStyle;
    },
    set caretStyle(v: CaretStyle) {
      caretStyle = v;
      void updateSetting("test.caret_style", v);
    },
    get handGuideEnabled() {
      return handGuideEnabled;
    },
    set handGuideEnabled(v: boolean) {
      handGuideEnabled = v;
      void updateSetting("ui.hand_guide.enabled", String(v));
    },
    get handGuideMode() {
      return handGuideMode;
    },
    set handGuideMode(v: VisualAssistMode) {
      if (VALID_VISUAL_MODES.includes(v)) {
        handGuideMode = v;
        handGuidePreferredMode = v;
        void updateSetting("ui.hand_guide.mode", v);
      }
    },
    get handGuidePreferredMode() {
      return handGuidePreferredMode;
    },
    set handGuidePreferredMode(v: VisualAssistMode) {
      if (VALID_VISUAL_MODES.includes(v)) {
        handGuidePreferredMode = v;
        handGuideMode = v;
        void updateSetting("ui.hand_guide.preferred_mode", v);
      }
    },
    get handGuideStyle() {
      return handGuideStyle;
    },
    set handGuideStyle(v: HandGuideStyle) {
      handGuideStyle = v;
      void updateSetting("ui.hand_guide.style", v);
    },
    get handGuideLegendStyle() {
      return handGuideLegendStyle;
    },
    set handGuideLegendStyle(v: HandGuideLegendStyle) {
      handGuideLegendStyle = v;
      void updateSetting("ui.hand_guide.legend", v);
    },
    get handGuideHands() {
      return handGuideHands;
    },
    set handGuideHands(v: HandGuideHands) {
      handGuideHands = v;
      void updateSetting("ui.hand_guide.hands", v);
    },
    get handGuideSize() {
      return handGuideSize;
    },
    set handGuideSize(v: number) {
      const clamped = clampScaleSize(v);
      handGuideSize = clamped;
      void updateSetting("ui.hand_guide.size", String(clamped));
    },
    get handGuideLayout() {
      return handGuideLayout;
    },
    set handGuideLayout(v: string) {
      handGuideLayout = v;
      void updateSetting("ui.hand_guide.layout", v);
    },
    get backspaceThroughWords() {
      return backspaceThroughWords;
    },
    set backspaceThroughWords(v: boolean) {
      backspaceThroughWords = v;
      void updateSetting("test.backspace_through_words", String(v));
    },
    get forgivingAccuracy() {
      return forgivingAccuracy;
    },
    set forgivingAccuracy(v: boolean) {
      forgivingAccuracy = v;
      void updateSetting("test.forgiving_accuracy", String(v));
    },
    get firstRunDone() {
      return firstRunDone;
    },
    set firstRunDone(v: boolean) {
      firstRunDone = v;
      void updateSetting("app.first_run_done", String(v));
    },
    get sidebarCollapsed() {
      return sidebarCollapsed;
    },
    set sidebarCollapsed(v: boolean) {
      sidebarCollapsed = v;
      void updateSetting("ui.sidebar_collapsed", String(v));
    },
    get fontSizePreset() {
      return fontSizePreset;
    },
    set fontSizePreset(v: FontSizePreset) {
      fontSizePreset = v;
      void updateSetting("test.font_size", v);
    },
    get visibleLines() {
      return visibleLines;
    },
    set visibleLines(v: number) {
      visibleLines = clampVisibleLines(v);
      void updateSetting("test.visible_lines", String(visibleLines));
    },
    get arenaWidth() {
      return arenaWidth;
    },
    set arenaWidth(v: ArenaWidthPreset) {
      arenaWidth = v;
      void updateSetting("test.arena_width", v);
    },
    get smoothCaret() {
      return smoothCaret;
    },
    set smoothCaret(v: boolean) {
      smoothCaret = v;
      void updateSetting("test.smooth_caret", String(v));
    },
    get highlightActiveWord() {
      return highlightActiveWord;
    },
    set highlightActiveWord(v: boolean) {
      highlightActiveWord = v;
      void updateSetting("test.highlight_active_word", String(v));
    },
    get showLiveStats() {
      return showLiveStats;
    },
    set showLiveStats(v: boolean) {
      showLiveStats = v;
      void updateSetting("test.show_live_stats", String(v));
    },
    get historyFilterEnabled() {
      return historyFilterEnabled;
    },
    set historyFilterEnabled(v: boolean) {
      historyFilterEnabled = v;
      void updateSetting("history.filter.enabled", String(v));
    },
    get historyFilterMinSpeed() {
      return historyFilterMinSpeed;
    },
    set historyFilterMinSpeed(v: number) {
      historyFilterMinSpeed = clampHistoryMinSpeed(v);
      void updateSetting("history.filter.min_speed", String(historyFilterMinSpeed));
    },
    get historyFilterMinAccuracy() {
      return historyFilterMinAccuracy;
    },
    set historyFilterMinAccuracy(v: number) {
      historyFilterMinAccuracy = clampHistoryMinAccuracy(v);
      void updateSetting("history.filter.min_accuracy", String(historyFilterMinAccuracy));
    },
    get keymapEnabled() {
      return keymapEnabled;
    },
    set keymapEnabled(v: boolean) {
      keymapEnabled = v;
      void updateSetting("ui.keymap.enabled", String(v));
    },
    get keymapMode() {
      return keymapMode;
    },
    set keymapMode(v: VisualAssistMode) {
      if (VALID_VISUAL_MODES.includes(v)) {
        keymapMode = v;
        keymapPreferredMode = v;
        void updateSetting("ui.keymap.mode", v);
      }
    },
    get keymapPreferredMode() {
      return keymapPreferredMode;
    },
    set keymapPreferredMode(v: VisualAssistMode) {
      if (VALID_VISUAL_MODES.includes(v)) {
        keymapPreferredMode = v;
        keymapMode = v;
        void updateSetting("ui.keymap.preferred_mode", v);
      }
    },
    get keymapStyle() {
      return keymapStyle;
    },
    set keymapStyle(v: KeymapStyle) {
      keymapStyle = v;
      void updateSetting("ui.keymap.style", v);
    },
    get keymapLegendStyle() {
      return keymapLegendStyle;
    },
    set keymapLegendStyle(v: KeymapLegendStyle) {
      keymapLegendStyle = v;
      void updateSetting("ui.keymap.legend", v);
    },
    get keymapShowKeys() {
      return keymapShowKeys;
    },
    set keymapShowKeys(v: KeymapShowKeys) {
      keymapShowKeys = v;
      void updateSetting("ui.keymap.keys", v);
    },
    get keymapSize() {
      return keymapSize;
    },
    set keymapSize(v: number) {
      const clamped = clampScaleSize(v);
      keymapSize = clamped;
      void updateSetting("ui.keymap.size", String(clamped));
    },
    get keymapLayout() {
      return keymapLayout;
    },
    set keymapLayout(v: string) {
      keymapLayout = v;
      void updateSetting("ui.keymap.layout", v);
    },
    get tapeEnabled() {
      return tapeEnabled;
    },
    set tapeEnabled(v: boolean) {
      tapeEnabled = v;
      void updateSetting("test.tape.enabled", String(v));
    },
    get tapeMode() {
      return tapeMode;
    },
    set tapeMode(v: TapeMode) {
      if (VALID_TAPE_MODES.includes(v)) {
        tapeMode = v;
        void updateSetting("test.tape.mode", v);
      }
    },
    get tapeMargin() {
      return tapeMargin;
    },
    set tapeMargin(v: number) {
      const clamped = clampTapeMargin(v);
      tapeMargin = clamped;
      void updateSetting("test.tape.margin", String(clamped));
    },
    get soundEnabled() {
      return soundEnabled;
    },
    set soundEnabled(v: boolean) {
      soundEnabled = v;
      void updateSetting("sound.enabled", String(v));
    },
    get soundClickPack() {
      return soundClickPack;
    },
    set soundClickPack(v: string) {
      if (v && valueIsPack(v)) {
        soundClickPack = v;
        void updateSetting("sound.click_pack", v);
      }
    },
    get soundErrorPack() {
      return soundErrorPack;
    },
    set soundErrorPack(v: string) {
      if (v && valueIsPack(v)) {
        soundErrorPack = v;
        void updateSetting("sound.error_pack", v);
      }
    },
    get soundVolume() {
      return soundVolume;
    },
    set soundVolume(v: number) {
      const clamped = clampSoundVolume(v);
      soundVolume = clamped;
      void updateSetting("sound.volume", String(clamped));
    },
    get soundWarningSeconds() {
      return soundWarningSeconds;
    },
    set soundWarningSeconds(v: number) {
      if (VALID_SOUND_WARNING_SECONDS.includes(v)) {
        soundWarningSeconds = v;
        void updateSetting("sound.warning_seconds", String(v));
      }
    },
    get isLoading() {
      return isLoading;
    },
    set isLoading(v: boolean) {
      isLoading = v;
    },
    loadSettings,
    updateSetting,
    applyTheme,
    resetSettingsState,
  };
}

function valueIsPack(v: string): boolean {
  return v !== "off";
}

export const settingsStore = useSettingsStore();
