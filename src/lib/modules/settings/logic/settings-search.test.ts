import { describe, it, expect } from 'vitest';
import { filterSettings } from './settings-search.js';
import { SETTINGS_ITEMS, SETTINGS_SECTIONS } from './settings-registry.js';

const mockTranslations: Record<string, string> = {
  'settings.appearance': 'Appearance & Theme',
  'settings.interfaceLanguage': 'Interface Language',
  'settings.interfaceLanguageDesc': 'App interface translation and typography.',
  'settings.engineAndUnits': 'Typing Engine & Units',
  'settings.speedUnit': 'Primary Speed Unit',
  'settings.speedUnitDesc': 'WPM (Words per Minute) or CPM (Characters per Minute).',
  'settings.caretStyle': 'Caret Visual Style',
  'settings.caretStyleDesc': 'Cursor indicator displayed during typing.',
  'settings.backspaceThroughWords': 'Backspace Across Words',
  'settings.backspaceThroughWordsDesc': 'Allow backspacing into previous words.',
  'settings.forgivingAccuracy': 'Forgiving Accuracy',
  'settings.forgivingAccuracyDesc': 'Mistakes corrected with backspace do not penalize accuracy.',
  'settings.tape': 'Tape Mode',
  'settings.tapeMode': 'Tape Mode',
  'settings.tapeModeDesc': 'Only shows one line which scrolls horizontally.',
  'settings.tapeMargin': 'Tape Margin',
  'settings.tapeMarginDesc': 'Set the caret position from the left edge.',
  'settings.handGuide': 'Hand Guide & Assistance',
  'settings.keymap': 'Keymap',
  'settings.about': 'About Typing FreeX',
  'settings.aboutDesc': 'Offline Typing Test Engine.',
};

const mockT = (key: string): string => mockTranslations[key] ?? key;

describe('filterSettings (Settings Search UNIX Pipeline)', () => {
  it('returns all items and sections when query is empty or whitespace', () => {
    const resEmpty = filterSettings('', SETTINGS_ITEMS, SETTINGS_SECTIONS, mockT);
    expect(resEmpty.isEmpty).toBe(false);
    expect(resEmpty.visibleSectionIds.size).toBe(SETTINGS_SECTIONS.length);
    expect(resEmpty.matchedItemIds.size).toBe(SETTINGS_ITEMS.length);

    const resSpaces = filterSettings('   ', SETTINGS_ITEMS, SETTINGS_SECTIONS, mockT);
    expect(resSpaces.isEmpty).toBe(false);
    expect(resSpaces.visibleSectionIds.size).toBe(SETTINGS_SECTIONS.length);
  });

  it('matches items by translated label and isolates matching section', () => {
    const res = filterSettings('Caret Visual', SETTINGS_ITEMS, SETTINGS_SECTIONS, mockT);
    expect(res.isEmpty).toBe(false);
    expect(res.matchedItemIds.has('caret_style')).toBe(true);
    expect(res.visibleSectionIds.has('engine')).toBe(true);
    expect(res.visibleSectionIds.has('appearance')).toBe(false);
  });

  it('matches items by multi-word AND query across description and keywords', () => {
    const res = filterSettings('cursor style', SETTINGS_ITEMS, SETTINGS_SECTIONS, mockT);
    expect(res.isEmpty).toBe(false);
    expect(res.matchedItemIds.has('caret_style')).toBe(true);
    expect(res.matchedItemIds.size).toBe(1);
  });

  it('matches all items within a section when searching by section title', () => {
    const res = filterSettings('Tape Mode', SETTINGS_ITEMS, SETTINGS_SECTIONS, mockT);
    expect(res.isEmpty).toBe(false);
    expect(res.visibleSectionIds.has('tape')).toBe(true);
    expect(res.matchedItemIds.has('tape_mode')).toBe(true);
    expect(res.matchedItemIds.has('tape_margin')).toBe(true);
  });

  it('returns isEmpty = true when no items match the query', () => {
    const res = filterSettings('nonexistent_xyz_setting_999', SETTINGS_ITEMS, SETTINGS_SECTIONS, mockT);
    expect(res.isEmpty).toBe(true);
    expect(res.matchedItemIds.size).toBe(0);
    expect(res.visibleSectionIds.size).toBe(0);
  });
});

