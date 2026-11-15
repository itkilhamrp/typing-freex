import { describe, it, expect } from 'vitest';
import { InputProcessor } from './input-processor';

describe('InputProcessor (§5.5)', () => {
  const processor = new InputProcessor();

  it('maps single character keys to CHARACTER_INPUT', () => {
    const ev = processor.processKey({
      key: 'a',
      code: 'KeyA',
      timestamp: 1000,
    });
    expect(ev).toEqual({
      type: 'CHARACTER_INPUT',
      char: 'a',
      timestamp: 1000,
    });
  });

  it('maps Space to SPACE event', () => {
    const ev = processor.processKey({
      key: ' ',
      code: 'Space',
      timestamp: 1200,
    });
    expect(ev).toEqual({
      type: 'SPACE',
      timestamp: 1200,
    });
  });

  it('maps Backspace to BACKSPACE event', () => {
    const ev = processor.processKey({
      key: 'Backspace',
      code: 'Backspace',
      timestamp: 1300,
    });
    expect(ev).toEqual({
      type: 'BACKSPACE',
      timestamp: 1300,
    });
  });

  it('maps Escape to ABORT event', () => {
    const ev = processor.processKey({
      key: 'Escape',
      code: 'Escape',
      timestamp: 1400,
    });
    expect(ev).toEqual({
      type: 'ABORT',
      timestamp: 1400,
    });
  });

  it('detects Tab + Enter as RESTART shortcut within timeout window', () => {
    const p = new InputProcessor();
    expect(p.processKey({ key: 'Tab', code: 'Tab', timestamp: 1000 })).toBeNull();
    const restart = p.processKey({ key: 'Enter', code: 'Enter', timestamp: 1200 });
    expect(restart).toEqual({
      type: 'RESTART',
      timestamp: 1200,
    });
  });

  it('detects Shift+Enter as END_ZEN shortcut', () => {
    const ev = processor.processKey({
      key: 'Enter',
      code: 'Enter',
      shiftKey: true,
      timestamp: 1500,
    });
    expect(ev).toEqual({
      type: 'END_ZEN',
      timestamp: 1500,
    });
  });

  it('maps bare Enter to ENTER event', () => {
    const ev = processor.processKey({
      key: 'Enter',
      code: 'Enter',
      timestamp: 1550,
    });
    expect(ev).toEqual({
      type: 'ENTER',
      timestamp: 1550,
    });
  });

  it('ignores Enter with Ctrl or Alt modifiers', () => {
    expect(
      processor.processKey({
        key: 'Enter',
        code: 'Enter',
        ctrlKey: true,
        timestamp: 1560,
      })
    ).toBeNull();
    expect(
      processor.processKey({
        key: 'Enter',
        code: 'Enter',
        altKey: true,
        timestamp: 1570,
      })
    ).toBeNull();
  });

  it('ignores repeat keys when allowRepeat is false', () => {
    const ev = processor.processKey({
      key: 'a',
      code: 'KeyA',
      repeat: true,
      timestamp: 1600,
    });
    expect(ev).toBeNull();
  });

  it('ignores IME composition keystrokes', () => {
    const ev = processor.processKey({
      key: 'Process',
      code: 'KeyA',
      isComposing: true,
      timestamp: 1700,
    });
    expect(ev).toBeNull();
  });

  it('ignores Dead and Process keys even when isComposing is false', () => {
    expect(
      processor.processKey({
        key: 'Dead',
        code: 'BracketLeft',
        isComposing: false,
        timestamp: 1800,
      })
    ).toBeNull();

    expect(
      processor.processKey({
        key: 'Process',
        code: 'KeyS',
        isComposing: false,
        timestamp: 1810,
      })
    ).toBeNull();
  });

  it('accepts AltGr printable characters via altGraphKey or Windows Ctrl+Alt', () => {
    expect(
      processor.processKey({
        key: '@',
        code: 'Digit2',
        altGraphKey: true,
        timestamp: 1900,
      })
    ).toEqual({
      type: 'CHARACTER_INPUT',
      char: '@',
      timestamp: 1900,
    });

    expect(
      processor.processKey({
        key: '€',
        code: 'KeyE',
        ctrlKey: true,
        altKey: true,
        metaKey: false,
        timestamp: 1910,
      })
    ).toEqual({
      type: 'CHARACTER_INPUT',
      char: '€',
      timestamp: 1910,
    });

    // Reject Ctrl+Alt+Meta or non-printable keys
    expect(
      processor.processKey({
        key: '@',
        code: 'Digit2',
        ctrlKey: true,
        altKey: true,
        metaKey: true,
        timestamp: 1920,
      })
    ).toBeNull();

    expect(
      processor.processKey({
        key: 'Delete',
        code: 'Delete',
        ctrlKey: true,
        altKey: true,
        timestamp: 1930,
      })
    ).toBeNull();
  });
});
