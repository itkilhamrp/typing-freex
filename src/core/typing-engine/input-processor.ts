import type { EngineEvent } from './types';

export interface RawKeyInput {
  key: string;
  code: string;
  isComposing?: boolean | undefined;
  repeat?: boolean | undefined;
  shiftKey?: boolean | undefined;
  ctrlKey?: boolean | undefined;
  altKey?: boolean | undefined;
  metaKey?: boolean | undefined;
  altGraphKey?: boolean | undefined;
  timestamp: number;
}

export interface InputProcessorOptions {
  allowRepeat?: boolean;
}

export class InputProcessor {
  private options: InputProcessorOptions;
  private tabPressedTimestamp: number | null = null;

  constructor(options: InputProcessorOptions = {}) {
    this.options = {
      allowRepeat: false,
      ...options,
    };
  }

  processKey(input: RawKeyInput): EngineEvent | null {
    // 1. Ignore IME composition and dead-key staging events
    if (input.isComposing || input.key === 'Dead' || input.key === 'Process') {
      return null;
    }

    // 2. Ignore key repeat if disabled
    if (input.repeat && !this.options.allowRepeat) {
      return null;
    }

    // 3. System shortcuts
    if (input.key === 'Escape') {
      return { type: 'ABORT', timestamp: input.timestamp };
    }

    // Tab -> Enter sequence for quick restart
    if (input.key === 'Tab') {
      this.tabPressedTimestamp = input.timestamp;
      return null;
    }

    const isEnterKey = input.key === 'Enter' || input.code === 'Enter' || input.code === 'NumpadEnter';

    if (isEnterKey) {
      if (input.shiftKey) {
        this.tabPressedTimestamp = null;
        return { type: 'END_ZEN', timestamp: input.timestamp };
      }
      if (this.tabPressedTimestamp && input.timestamp - this.tabPressedTimestamp < 1500) {
        this.tabPressedTimestamp = null;
        return { type: 'RESTART', timestamp: input.timestamp };
      }
      if (input.ctrlKey || input.metaKey || input.altKey) {
        this.tabPressedTimestamp = null;
        return null;
      }
      this.tabPressedTimestamp = null;
      return { type: 'ENTER', timestamp: input.timestamp };
    } else if (input.key !== 'Shift' && input.code !== 'ShiftLeft' && input.code !== 'ShiftRight') {
      // Clear tab state on any other non-modifier key
      this.tabPressedTimestamp = null;
    }

    // 4. Backspace
    if (input.key === 'Backspace') {
      return { type: 'BACKSPACE', timestamp: input.timestamp };
    }

    // 5. Space
    if (input.key === ' ' || input.code === 'Space') {
      return { type: 'SPACE', timestamp: input.timestamp };
    }

    // 6. Ignore non-character control keys (Ctrl, Alt, Meta combos, function keys, arrows),
    // except AltGr (AltGraph or Ctrl+Alt without Meta) producing a single printable character.
    const isAltGr = Boolean(
      input.altGraphKey || (input.ctrlKey && input.altKey && !input.metaKey)
    );
    if ((input.ctrlKey || input.metaKey || input.altKey) && !(isAltGr && input.key.length === 1)) {
      return null;
    }

    // Standard character input (single printable character)
    if (input.key.length === 1) {
      return {
        type: 'CHARACTER_INPUT',
        char: input.key,
        timestamp: input.timestamp,
      };
    }

    return null;
  }
}
