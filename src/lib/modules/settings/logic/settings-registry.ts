/**
 * Declarative static metadata registry for all searchable settings items and sections.
 * Pure data module — zero Svelte, DOM, or reactive state dependencies.
 */

export interface SettingsItemDef {
  /** Unique identifier of the setting item */
  readonly id: string;
  /** Parent section identifier */
  readonly sectionId: string;
  /** Canonical i18n key for the item label */
  readonly labelKey: string;
  /** Canonical i18n key for the item description */
  readonly descKey: string;
  /** Supplementary search keywords (lowercase) for fuzzy/semantic matching */
  readonly keywords?: readonly string[];
}

export interface SettingsSectionDef {
  /** Unique section identifier matching SettingsItemDef.sectionId */
  readonly id: string;
  /** Canonical i18n key for the section heading */
  readonly titleKey: string;
}

export const SETTINGS_SECTIONS: readonly SettingsSectionDef[] = [
  { id: 'appearance', titleKey: 'settings.appearance' },
  { id: 'engine', titleKey: 'settings.engineAndUnits' },
  { id: 'sound', titleKey: 'settings.sound.title' },
  { id: 'tape', titleKey: 'settings.tape' },
  { id: 'hand_guide', titleKey: 'settings.handGuide' },
  { id: 'keymap', titleKey: 'settings.keymap' },
  { id: 'about', titleKey: 'settings.about' },
];

export const SETTINGS_ITEMS: readonly SettingsItemDef[] = [
  // Appearance Section
  {
    id: 'interface_language',
    sectionId: 'appearance',
    labelKey: 'settings.interfaceLanguage',
    descKey: 'settings.interfaceLanguageDesc',
    keywords: ['language', 'locale', 'bahasa', 'english', 'indonesia', 'translation', 'ui', 'theme'],
  },

  // Engine & Units Section
  {
    id: 'speed_unit',
    sectionId: 'engine',
    labelKey: 'settings.speedUnit',
    descKey: 'settings.speedUnitDesc',
    keywords: ['wpm', 'cpm', 'speed', 'unit', 'words per minute', 'characters per minute', 'kecepatan'],
  },
  {
    id: 'caret_style',
    sectionId: 'engine',
    labelKey: 'settings.caretStyle',
    descKey: 'settings.caretStyleDesc',
    keywords: ['caret', 'cursor', 'kursor', 'line', 'block', 'underline', 'outline', 'blinking', 'style'],
  },
  {
    id: 'backspace_through_words',
    sectionId: 'engine',
    labelKey: 'settings.backspaceThroughWords',
    descKey: 'settings.backspaceThroughWordsDesc',
    keywords: ['backspace', 'delete', 'hapus', 'previous words', 'kata sebelumnya', 'error'],
  },
  {
    id: 'forgiving_accuracy',
    sectionId: 'engine',
    labelKey: 'settings.forgivingAccuracy',
    descKey: 'settings.forgivingAccuracyDesc',
    keywords: ['accuracy', 'akurasi', 'forgiving', 'mistake', 'error', 'kesalahan', 'koreksi'],
  },

  // Sound Section
  {
    id: 'sound_volume',
    sectionId: 'sound',
    labelKey: 'settings.sound.volume',
    descKey: 'settings.sound.volumeDesc',
    keywords: ['sound', 'volume', 'suara', 'audio', 'loudness', 'level'],
  },
  {
    id: 'sound_click_pack',
    sectionId: 'sound',
    labelKey: 'settings.sound.clickPack',
    descKey: 'settings.sound.clickPackDesc',
    keywords: [
      'sound',
      'click',
      'type',
      'key',
      'press',
      'mechanical',
      'keyboard',
      'switch',
      'cherry',
      'mx',
      'razer',
      'tealios',
      'typewriter',
      'suara',
      'ketik',
    ],
  },
  {
    id: 'sound_error_pack',
    sectionId: 'sound',
    labelKey: 'settings.sound.errorPack',
    descKey: 'settings.sound.errorPackDesc',
    keywords: ['sound', 'error', 'mistake', 'wrong', 'incorrect', 'kesalahan', 'salah'],
  },
  {
    id: 'sound_time_warning',
    sectionId: 'sound',
    labelKey: 'settings.sound.timeWarning',
    descKey: 'settings.sound.timeWarningDesc',
    keywords: ['sound', 'warning', 'time', 'timer', 'countdown', 'alert', 'peringatan', 'waktu'],
  },

  // Tape Mode Section
  {
    id: 'tape_mode',
    sectionId: 'tape',
    labelKey: 'settings.tapeMode',
    descKey: 'settings.tapeModeDesc',
    keywords: ['tape', 'scroll', 'horizontal', 'letter', 'word', 'single line', 'monkeytype', 'baris'],
  },
  {
    id: 'tape_margin',
    sectionId: 'tape',
    labelKey: 'settings.tapeMargin',
    descKey: 'settings.tapeMarginDesc',
    keywords: ['tape', 'margin', 'offset', 'center', 'position', 'anchor', 'caret position', 'batas'],
  },

  // Hand Guide Section
  {
    id: 'hand_guide_mode',
    sectionId: 'hand_guide',
    labelKey: 'settings.handGuideMode',
    descKey: 'settings.handGuideModeDesc',
    keywords: ['hand', 'guide', 'panduan', 'tangan', 'jari', 'finger', 'static', 'react', 'next', 'mode'],
  },
  {
    id: 'hand_guide_style',
    sectionId: 'hand_guide',
    labelKey: 'settings.handGuideStyle',
    descKey: 'settings.handGuideStyleDesc',
    keywords: ['hand', 'guide', 'style', 'gaya', 'robot', 'minimal', 'cyber', 'visual', 'ascii'],
  },
  {
    id: 'hand_guide_legend',
    sectionId: 'hand_guide',
    labelKey: 'settings.handGuideLegend',
    descKey: 'settings.handGuideLegendDesc',
    keywords: ['hand', 'guide', 'legend', 'label', 'finger', 'jari', 'home keys', 'blank', 'dynamic'],
  },
  {
    id: 'hand_guide_hands',
    sectionId: 'hand_guide',
    labelKey: 'settings.handGuideHands',
    descKey: 'settings.handGuideHandsDesc',
    keywords: ['hand', 'hands', 'visible', 'tangan', 'kiri', 'kanan', 'left', 'right', 'both'],
  },
  {
    id: 'hand_guide_size',
    sectionId: 'hand_guide',
    labelKey: 'settings.handGuideSize',
    descKey: 'settings.handGuideSizeDesc',
    keywords: ['hand', 'guide', 'size', 'scale', 'ukuran', 'skala'],
  },
  {
    id: 'hand_guide_layout',
    sectionId: 'hand_guide',
    labelKey: 'settings.handGuideLayout',
    descKey: 'settings.handGuideLayoutDesc',
    keywords: ['hand', 'guide', 'layout', 'tata letak', 'qwerty'],
  },

  // Keymap Section
  {
    id: 'keymap_mode',
    sectionId: 'keymap',
    labelKey: 'settings.keymapMode',
    descKey: 'settings.keymapModeDesc',
    keywords: ['keymap', 'keyboard', 'peta tombol', 'mode', 'static', 'react', 'next'],
  },
  {
    id: 'keymap_style',
    sectionId: 'keymap',
    labelKey: 'settings.keymapStyle',
    descKey: 'settings.keymapStyleDesc',
    keywords: ['keymap', 'style', 'gaya', 'staggered', 'alice', 'matrix', 'split', 'steno', 'ortholinear'],
  },
  {
    id: 'keymap_legend',
    sectionId: 'keymap',
    labelKey: 'settings.keymapLegend',
    descKey: 'settings.keymapLegendDesc',
    keywords: ['keymap', 'legend', 'label', 'lowercase', 'uppercase', 'blank', 'dynamic'],
  },
  {
    id: 'keymap_keys',
    sectionId: 'keymap',
    labelKey: 'settings.keymapKeys',
    descKey: 'settings.keymapKeysDesc',
    keywords: ['keymap', 'keys', 'tombol', 'baris', 'rows', 'minimal', 'numrow', 'full'],
  },
  {
    id: 'keymap_size',
    sectionId: 'keymap',
    labelKey: 'settings.keymapSize',
    descKey: 'settings.keymapSizeDesc',
    keywords: ['keymap', 'size', 'scale', 'ukuran', 'keyboard size'],
  },
  {
    id: 'keymap_layout',
    sectionId: 'keymap',
    labelKey: 'settings.keymapLayout',
    descKey: 'settings.keymapLayoutDesc',
    keywords: ['keymap', 'layout', 'tata letak', 'qwerty'],
  },

  // About Section
  {
    id: 'about_info',
    sectionId: 'about',
    labelKey: 'settings.about',
    descKey: 'settings.aboutDesc',
    keywords: ['about', 'tentang', 'version', 'versi', 'license', 'lisensi', 'agpl', 'typing freex', 'offline', 'info', 'tauri', 'rust'],
  },
];

