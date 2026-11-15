import { describe, expect, it } from 'vitest';
import { CLASSIC_SHORTCUTS, ACTIONABLE_IDS } from './shortcut-registry.js';
import {
  formatShortcutKeyTokens,
  matchShortcut,
  type MinimalKeyboardEvent,
} from './shortcut-matcher.js';

function createEvent(overrides: Partial<MinimalKeyboardEvent>): MinimalKeyboardEvent {
  return {
    key: '',
    code: '',
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ...overrides,
  };
}

describe('shortcut-matcher (pure UNIX pipeline stage)', () => {
  it('matches F1 and Ctrl+/ for help toggle in global and arena-idle contexts', () => {
    const f1 = createEvent({ key: 'F1', code: 'F1' });
    const ctrlSlash = createEvent({ key: '/', code: 'Slash', ctrlKey: true });

    expect(matchShortcut(f1, CLASSIC_SHORTCUTS, 'global')?.id).toBe('help.toggle');
    expect(matchShortcut(f1, CLASSIC_SHORTCUTS, 'arena-idle')?.id).toBe('help.toggle');
    expect(matchShortcut(ctrlSlash, CLASSIC_SHORTCUTS, 'global')?.id).toBe('help.toggle.alt');
  });

  it('matches Ctrl+1..6 navigation shortcuts across Classic contexts', () => {
    const ctrl1 = createEvent({ key: '1', code: 'Digit1', ctrlKey: true });
    const ctrl6 = createEvent({ key: '6', code: 'Digit6', ctrlKey: true });

    expect(matchShortcut(ctrl1, CLASSIC_SHORTCUTS, 'global')?.id).toBe('nav.arena');
    expect(matchShortcut(ctrl6, CLASSIC_SHORTCUTS, 'result')?.id).toBe('nav.settings');
  });

  it('matches arena control toggles and cycles ONLY in arena-idle context', () => {
    const toggleKeymap = createEvent({
      key: 'K',
      code: 'KeyK',
      ctrlKey: true,
      shiftKey: true,
    });
    const toggleHandGuide = createEvent({
      key: 'H',
      code: 'KeyH',
      ctrlKey: true,
      shiftKey: true,
    });
    const cycleMode = createEvent({
      key: 'm',
      code: 'KeyM',
      altKey: true,
    });
    const cycleDifficulty = createEvent({
      key: 'd',
      code: 'KeyD',
      altKey: true,
    });

    expect(matchShortcut(toggleKeymap, CLASSIC_SHORTCUTS, 'arena-idle')?.id).toBe(
      'arena.toggleKeymap',
    );
    expect(matchShortcut(toggleHandGuide, CLASSIC_SHORTCUTS, 'arena-idle')?.id).toBe(
      'arena.toggleHandGuide',
    );
    expect(matchShortcut(cycleMode, CLASSIC_SHORTCUTS, 'arena-idle')?.id).toBe(
      'arena.cycleMode',
    );
    expect(matchShortcut(cycleDifficulty, CLASSIC_SHORTCUTS, 'arena-idle')?.id).toBe(
      'arena.cycleDifficulty',
    );
    expect(matchShortcut(toggleKeymap, CLASSIC_SHORTCUTS, 'global')).toBeNull();
    expect(matchShortcut(cycleMode, CLASSIC_SHORTCUTS, 'result')).toBeNull();
  });

  it('never matches displayOnly definitions in matchShortcut', () => {
    const tab = createEvent({ key: 'Tab', code: 'Tab' });
    const f11 = createEvent({ key: 'F11', code: 'F11' });

    expect(matchShortcut(tab, CLASSIC_SHORTCUTS, 'arena-typing')).toBeNull();
    expect(matchShortcut(f11, CLASSIC_SHORTCUTS, 'app')).toBeNull();
    expect(ACTIONABLE_IDS).not.toContain('arena.restart');
    expect(ACTIONABLE_IDS).not.toContain('app.fullscreen');
    expect(ACTIONABLE_IDS).toContain('arena.toggleHandGuide');
  });

  it('formats shortcut key tokens cleanly for <kbd> display including sequenceKeys', () => {
    expect(
      formatShortcutKeyTokens({ key: 'K', ctrl: true, shift: true }),
    ).toEqual(['Ctrl', 'Shift', 'K']);
    expect(
      formatShortcutKeyTokens({ key: 'Tab', sequenceKeys: ['Tab', 'Enter'] }),
    ).toEqual(['Tab', 'Enter']);
    expect(formatShortcutKeyTokens({ key: 'Escape' })).toEqual(['Esc']);
    expect(formatShortcutKeyTokens({ key: 'F1' })).toEqual(['F1']);
  });
});
