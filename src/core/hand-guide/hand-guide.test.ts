import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  hintForChar,
  fingerForCode,
  type KeyboardLayoutDef,
} from './finger-map';
import {
  computeHandVisualState,
  resolveFingerPrecedence,
} from './hand-state';
import {
  validateSpritePack,
  MAX_SPRITE_SIZE_BYTES,
} from './sprite';

describe('Hand Guide - Finger Map & Shift Rule (§5.12.3)', () => {
  const layoutPath = path.resolve(
    __dirname,
    '../../../content-packs/keyboard-layouts/qwerty-us.json'
  );
  const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf-8')) as KeyboardLayoutDef;

  it('maps lowercase letters to primary fingers without shift', () => {
    const hintQ = hintForChar(layout, 'q');
    expect(hintQ).toEqual({ finger: 'l_pinky', shiftFinger: null });

    const hintJ = hintForChar(layout, 'j');
    expect(hintJ).toEqual({ finger: 'r_index', shiftFinger: null });

    const hintSpace = hintForChar(layout, ' ');
    expect(hintSpace).toEqual({ finger: 'r_thumb', shiftFinger: null });
  });

  it('applies opposite-hand Shift rule for uppercase and shifted symbols', () => {
    // 'Q' is left hand -> requires right pinky Shift
    const hintQ = hintForChar(layout, 'Q');
    expect(hintQ).toEqual({ finger: 'l_pinky', shiftFinger: 'r_pinky' });

    // 'J' is right hand -> requires left pinky Shift
    const hintJ = hintForChar(layout, 'J');
    expect(hintJ).toEqual({ finger: 'r_index', shiftFinger: 'l_pinky' });

    // '!' is shift on Digit1 (left hand) -> requires right pinky Shift
    const hintExclamation = hintForChar(layout, '!');
    expect(hintExclamation).toEqual({ finger: 'l_pinky', shiftFinger: 'r_pinky' });
  });

  it('returns null for unknown characters not present in layout', () => {
    expect(hintForChar(layout, '€')).toBeNull();
    expect(hintForChar(layout, '🚀')).toBeNull();
  });

  it('maps physical codes including modifiers correctly', () => {
    expect(fingerForCode(layout, 'KeyQ')).toBe('l_pinky');
    expect(fingerForCode(layout, 'KeyJ')).toBe('r_index');
    expect(fingerForCode(layout, 'ShiftLeft')).toBe('l_pinky');
    expect(fingerForCode(layout, 'ShiftRight')).toBe('r_pinky');
    expect(fingerForCode(layout, 'Backspace')).toBe('r_pinky');
    expect(fingerForCode(layout, 'Space')).toBe('r_thumb');
  });
});

describe('Hand Guide - State Precedence & Animation Timing (§5.12.4)', () => {
  const layoutPath = path.resolve(
    __dirname,
    '../../../content-packs/keyboard-layouts/qwerty-us.json'
  );
  const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf-8')) as KeyboardLayoutDef;

  it('resolves precedence: pressed_error > pressed > target > shift_target > idle', () => {
    expect(resolveFingerPrecedence('idle', 'target')).toBe('target');
    expect(resolveFingerPrecedence('target', 'pressed')).toBe('pressed');
    expect(resolveFingerPrecedence('pressed', 'pressed_error')).toBe('pressed_error');
    expect(resolveFingerPrecedence('pressed_error', 'target')).toBe('pressed_error');
  });

  it('computes visual states for targets and active presses', () => {
    const now = 1000;
    const activePresses = {
      l_index: { startTime: 950, isError: false }, // active press (elapsed 50ms < 230ms)
      r_middle: { startTime: 800, isError: true }, // active error press (elapsed 200ms < 300ms)
    };

    // Next expected 'Q' -> target on l_pinky, shift_target on r_pinky
    const state = computeHandVisualState('Q', 'Running', layout, activePresses, now);

    expect(state.fingerStates.l_pinky).toBe('target');
    expect(state.fingerStates.r_pinky).toBe('shift_target');
    expect(state.fingerStates.l_index).toBe('pressed');
    expect(state.fingerStates.r_middle).toBe('pressed_error');
    expect(state.fingerStates.l_thumb).toBe('idle');
  });

  it('highlights Enter modifier finger (r_pinky) when nextExpectedChar is \\n', () => {
    const state = computeHandVisualState('\n', 'Running', layout, {}, 1000);
    expect(state.targetChar).toBe('\n');
    expect(state.fingerStates.r_pinky).toBe('target');
    expect(state.fingerStates.l_pinky).toBe('idle');
  });

  it('returns all idle on finished or result state', () => {
    const state = computeHandVisualState('a', 'Result', layout, {}, 1000);
    expect(state.targetChar).toBeNull();
    for (const finger of Object.values(state.fingerStates)) {
      expect(finger).toBe('idle');
    }
  });

  it('respects static mode by ignoring targets and press animations', () => {
    const activePresses = {
      l_index: { startTime: 950, isError: false },
    };
    const state = computeHandVisualState('f', 'Running', layout, activePresses, 1000, 'static');
    expect(state.targetChar).toBeNull();
    for (const finger of Object.values(state.fingerStates)) {
      expect(finger).toBe('idle');
    }
  });

  it('respects react mode by showing pressed fingers without target highlights', () => {
    const activePresses = {
      l_index: { startTime: 950, isError: false },
    };
    const state = computeHandVisualState('f', 'Running', layout, activePresses, 1000, 'react');
    expect(state.targetChar).toBeNull();
    expect(state.fingerStates.l_index).toBe('pressed');
    // f targets l_index, but in react mode it should NOT be highlighted as target if not pressed
    const unpressedState = computeHandVisualState('f', 'Running', layout, {}, 1000, 'react');
    expect(unpressedState.fingerStates.l_index).toBe('idle');
  });

  it('respects off mode by returning all idle and suspended flag', () => {
    const state = computeHandVisualState('f', 'Running', layout, {}, 1000, 'off');
    expect(state.isSuspended).toBe(true);
    expect(state.targetChar).toBeNull();
    for (const finger of Object.values(state.fingerStates)) {
      expect(finger).toBe('idle');
    }
  });
});

describe('Hand Guide - Sprite System & Validation (§5.12.5, SEC-25)', () => {
  it('validates baseline robot-v0.json sprite pack', () => {
    const spritePath = path.resolve(__dirname, './sprites/robot-v0.json');
    const content = fs.readFileSync(spritePath, 'utf-8');
    const parsed = JSON.parse(content);

    const result = validateSpritePack(parsed, Buffer.byteLength(content));
    expect(result.isValid).toBe(true);
    expect(Buffer.byteLength(content)).toBeLessThanOrEqual(MAX_SPRITE_SIZE_BYTES);
  });

  it('rejects sprite pack with disallowed characters', () => {
    const illegalPack = {
      id: 'bad',
      name: 'Bad',
      version: '1.0',
      theme: 'robot',
      leftFingers: {
        l_pinky: { normal: ['<script>'] },
      },
      rightFingers: {},
      leftPalm: ['[=]'],
      rightPalm: ['[=]'],
    };

    const result = validateSpritePack(illegalPack);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Disallowed glyph');
  });

  it('rejects sprite pack with unequal row widths', () => {
    const unequalPack = {
      id: 'unequal',
      name: 'Unequal',
      version: '1.0',
      theme: 'robot',
      leftFingers: {
        l_pinky: { normal: ['---', '|o|', '| |extra'] },
      },
      rightFingers: {},
      leftPalm: ['[=]'],
      rightPalm: ['[=]'],
    };

    const result = validateSpritePack(unequalPack);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Unequal row width');
  });
});
