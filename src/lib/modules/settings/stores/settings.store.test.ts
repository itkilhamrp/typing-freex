import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settings.store.svelte';
import { resetMockStore } from '@/core/ipc/client';

describe('settings.store (Svelte 5 Runes)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockStore();
    const store = useSettingsStore();
    store.resetSettingsState();
  });

  it('loads settings and applies defaults', async () => {
    const store = useSettingsStore();
    await store.loadSettings();

    expect(store.theme).toBe('dark');
    expect(store.speedUnit).toBe('wpm');
    expect(store.firstRunDone).toBe(true);
  });

  it('updates theme setting and toggles dark mode class on document element', async () => {
    const store = useSettingsStore();
    await store.updateSetting('ui.theme', 'light');

    expect(store.theme).toBe('light');
    expect(store.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('typing_freex_theme')).toBe('light');

    await store.updateSetting('ui.theme', 'dark');
    expect(store.theme).toBe('dark');
    expect(store.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('typing_freex_theme')).toBe('dark');
  });

  it('restores initial theme from localStorage if available', () => {
    localStorage.setItem('typing_freex_theme', 'light');
    const store = useSettingsStore();
    store.resetSettingsState();
    expect(store.theme).toBe('light');
    expect(store.isDark).toBe(false);
    localStorage.removeItem('typing_freex_theme');
  });

  it('updates speed unit setting between wpm and cpm (AC-09)', async () => {
    const store = useSettingsStore();
    await store.updateSetting('test.speed_unit', 'cpm');
    expect(store.speedUnit).toBe('cpm');

    await store.updateSetting('test.speed_unit', 'wpm');
    expect(store.speedUnit).toBe('wpm');
  });

  it('updates caret style and hand guide toggle', async () => {
    const store = useSettingsStore();
    await store.updateSetting('test.caret_style', 'block');
    expect(store.caretStyle).toBe('block');

    await store.updateSetting('ui.hand_guide.enabled', 'false');
    expect(store.handGuideEnabled).toBe(false);
  });

  it('updates backspace through words setting', async () => {
    const store = useSettingsStore();
    expect(store.backspaceThroughWords).toBe(false);

    await store.updateSetting('test.backspace_through_words', 'true');
    expect(store.backspaceThroughWords).toBe(true);

    await store.updateSetting('test.backspace_through_words', 'false');
    expect(store.backspaceThroughWords).toBe(false);
  });

  it('updates sidebar collapsed setting', async () => {
    const store = useSettingsStore();
    expect(store.sidebarCollapsed).toBe(false);

    await store.updateSetting('ui.sidebar_collapsed', 'true');
    expect(store.sidebarCollapsed).toBe(true);

    await store.updateSetting('ui.sidebar_collapsed', 'false');
    expect(store.sidebarCollapsed).toBe(false);
  });

  it('updates forgiving accuracy setting', async () => {
    const store = useSettingsStore();
    expect(store.forgivingAccuracy).toBe(false);

    await store.updateSetting('test.forgiving_accuracy', 'true');
    expect(store.forgivingAccuracy).toBe(true);

    await store.updateSetting('test.forgiving_accuracy', 'false');
    expect(store.forgivingAccuracy).toBe(false);
  });

  it('resets forgiving accuracy to false when profile settings do not have it enabled', async () => {
    const store = useSettingsStore();
    await store.updateSetting('test.forgiving_accuracy', 'true');
    expect(store.forgivingAccuracy).toBe(true);

    // Simulate switching to another profile whose settings lack test.forgiving_accuracy
    resetMockStore();
    await store.loadSettings();
    expect(store.forgivingAccuracy).toBe(false);
  });

  it('updates and persists target language per profile', async () => {
    const store = useSettingsStore();
    expect(store.targetLanguage).toBe('random');
    expect(store.quoteLanguage).toBe('random');

    await store.updateSetting('test.target_language', 'id');
    expect(store.targetLanguage).toBe('id');

    await store.updateSetting('test.target_language', 'en');
    expect(store.targetLanguage).toBe('en');

    await store.updateSetting('test.target_language', 'random');
    expect(store.targetLanguage).toBe('random');
  });

  it('updates and resets customization bar settings', async () => {
    const store = useSettingsStore();
    expect(store.fontSizePreset).toBe('md');
    expect(store.visibleLines).toBe(3);
    expect(store.arenaWidth).toBe('lg');
    expect(store.smoothCaret).toBe(false);
    expect(store.highlightActiveWord).toBe(false);
    expect(store.showLiveStats).toBe(true);

    await store.updateSetting('test.font_size', 'lg');
    expect(store.fontSizePreset).toBe('lg');

    await store.updateSetting('test.visible_lines', '5');
    expect(store.visibleLines).toBe(5);

    // Ensure capping at 5
    await store.updateSetting('test.visible_lines', '20');
    expect(store.visibleLines).toBe(5);

    await store.updateSetting('test.arena_width', 'xl');
    expect(store.arenaWidth).toBe('xl');

    await store.updateSetting('test.arena_width', 'sm');
    expect(store.arenaWidth).toBe('sm');

    await store.updateSetting('test.smooth_caret', 'true');
    expect(store.smoothCaret).toBe(true);

    await store.updateSetting('test.highlight_active_word', 'true');
    expect(store.highlightActiveWord).toBe(true);

    await store.updateSetting('test.show_live_stats', 'false');
    expect(store.showLiveStats).toBe(false);
    expect(localStorage.getItem('typingfreex_setting_test.font_size')).toBe('lg');
    expect(localStorage.getItem('typingfreex_setting_test.visible_lines')).toBe('5');
    expect(localStorage.getItem('typingfreex_setting_test.arena_width')).toBe('sm');

    // Test setter-triggered persistence
    store.fontSizePreset = 'xl';
    expect(store.fontSizePreset).toBe('xl');
    expect(localStorage.getItem('typingfreex_setting_test.font_size')).toBe('xl');

    store.resetSettingsState();
    expect(store.fontSizePreset).toBe('md');
    expect(store.visibleLines).toBe(3);
    expect(store.arenaWidth).toBe('lg');
    expect(store.smoothCaret).toBe(false);
    expect(store.highlightActiveWord).toBe(false);
    expect(store.showLiveStats).toBe(true);
  });

  it('handles history filter settings defaults, updates, and persistence', async () => {
    const store = useSettingsStore();

    // Defaults: disabled for new account/clean state
    expect(store.historyFilterEnabled).toBe(false);
    expect(store.historyFilterMinSpeed).toBe(0);
    expect(store.historyFilterMinAccuracy).toBe(0);

    // Update via updateSetting
    await store.updateSetting('history.filter.enabled', 'true');
    await store.updateSetting('history.filter.min_speed', '50');
    await store.updateSetting('history.filter.min_accuracy', '85');

    expect(store.historyFilterEnabled).toBe(true);
    expect(store.historyFilterMinSpeed).toBe(50);
    expect(store.historyFilterMinAccuracy).toBe(85);
    expect(localStorage.getItem('typingfreex_setting_history.filter.enabled')).toBe('true');
    expect(localStorage.getItem('typingfreex_setting_history.filter.min_speed')).toBe('50');
    expect(localStorage.getItem('typingfreex_setting_history.filter.min_accuracy')).toBe('85');

    // Update via property setters
    store.historyFilterEnabled = false;
    store.historyFilterMinSpeed = 60;
    store.historyFilterMinAccuracy = 90;

    expect(store.historyFilterEnabled).toBe(false);
    expect(store.historyFilterMinSpeed).toBe(60);
    expect(store.historyFilterMinAccuracy).toBe(90);

    // Clamping min_speed and min_accuracy
    store.historyFilterMinSpeed = 500;
    expect(store.historyFilterMinSpeed).toBe(300);

    store.historyFilterMinAccuracy = 150;
    expect(store.historyFilterMinAccuracy).toBe(100);

    // Reset settings state
    store.resetSettingsState();
    expect(store.historyFilterEnabled).toBe(false);
    expect(store.historyFilterMinSpeed).toBe(0);
    expect(store.historyFilterMinAccuracy).toBe(0);
  });

  it('manages full hand guide settings and mutual exclusivity with keymap', async () => {
    const store = useSettingsStore();

    // Verify defaults
    expect(store.handGuideMode).toBe('next');
    expect(store.handGuideStyle).toBe('robot');
    expect(store.handGuideLegendStyle).toBe('blank');
    expect(store.handGuideHands).toBe('both');
    expect(store.handGuideSize).toBe(1.0);
    expect(store.handGuideLayout).toBe('qwerty-us');

    // Update hand guide settings
    store.handGuideMode = 'react';
    store.handGuideStyle = 'cyber';
    store.handGuideLegendStyle = 'keys';
    store.handGuideHands = 'left';
    store.handGuideSize = 1.5;

    expect(store.handGuideMode).toBe('react');
    expect(store.handGuideStyle).toBe('cyber');
    expect(store.handGuideLegendStyle).toBe('keys');
    expect(store.handGuideHands).toBe('left');
    expect(store.handGuideSize).toBe(1.5);

    // Independence: Setting Keymap mode does not alter Hand Guide mode in settings
    store.keymapMode = 'static';
    expect(store.keymapMode).toBe('static');
    expect(store.handGuideMode).toBe('react'); // hand guide mode remains intact!

    // Mutual exclusivity on visibility: enabling Keymap turns Hand Guide visibility off
    store.handGuideEnabled = true;
    store.keymapEnabled = true;
    expect(store.keymapEnabled).toBe(true);
    expect(store.handGuideEnabled).toBe(false);
    expect(store.keymapMode).toBe('static'); // mode stays intact
    expect(store.handGuideMode).toBe('react'); // mode stays intact

    // Mutual exclusivity on visibility: re-enabling Hand Guide turns Keymap visibility off
    store.handGuideEnabled = true;
    expect(store.handGuideEnabled).toBe(true);
    expect(store.keymapEnabled).toBe(false);
    expect(store.handGuideMode).toBe('react'); // mode stays intact
    expect(store.keymapMode).toBe('static'); // mode stays intact
  });

  it('manages tape mode settings, clamping, and persistence correctly', async () => {
    const store = useSettingsStore();

    // Verify defaults
    expect(store.tapeEnabled).toBe(false);
    expect(store.tapeMode).toBe('letter');
    expect(store.tapeMargin).toBe(50);

    // Update tape mode
    store.tapeMode = 'word';
    expect(store.tapeMode).toBe('word');

    // Update tape margin with clamping
    store.tapeMargin = 75;
    expect(store.tapeMargin).toBe(75);
    store.tapeMargin = 150; // over max
    expect(store.tapeMargin).toBe(100);
    store.tapeMargin = -10; // under min
    expect(store.tapeMargin).toBe(0);

    // Tape enabled toggle
    store.tapeEnabled = true;
    expect(store.tapeEnabled).toBe(true);
  });

  it('manages sound volume settings with 0.0 to 2.0 range and clamping', async () => {
    const store = useSettingsStore();

    // Default volume
    expect(store.soundVolume).toBe(0.5);

    // Boost volume to 1.50 and 2.00
    store.soundVolume = 1.5;
    await new Promise((r) => setTimeout(r, 10));
    expect(store.soundVolume).toBe(1.5);
    expect(localStorage.getItem('typingfreex_setting_sound.volume')).toBe('1.5');

    store.soundVolume = 2.0;
    await new Promise((r) => setTimeout(r, 10));
    expect(store.soundVolume).toBe(2.0);
    expect(localStorage.getItem('typingfreex_setting_sound.volume')).toBe('2');

    // Clamps values above 2.0 to 2.0
    store.soundVolume = 2.5;
    await new Promise((r) => setTimeout(r, 10));
    expect(store.soundVolume).toBe(2.0);

    // Clamps negative values to 0.0
    store.soundVolume = -0.5;
    await new Promise((r) => setTimeout(r, 10));
    expect(store.soundVolume).toBe(0.0);
  });
});
