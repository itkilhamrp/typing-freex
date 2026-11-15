/**
 * Hand State Engine (§5.12.4)
 * Resolves visual state and precedence across fingers given current typing snapshot.
 */

import type { FingerId, KeyboardLayoutDef } from './finger-map';
import { hintForChar } from './finger-map';

export type VisualFingerState =
  | 'idle'
  | 'target'
  | 'shift_target'
  | 'pressed'
  | 'pressed_error';

export type HandGuideMode = 'off' | 'static' | 'react' | 'next';
export type HandGuideStyle = 'robot' | 'minimal' | 'cyber';
export type HandGuideLegendStyle = 'keys' | 'finger_name' | 'blank' | 'dynamic';
export type HandGuideHands = 'both' | 'left' | 'right';

export const ALL_FINGERS: readonly FingerId[] = [
  'l_pinky',
  'l_ring',
  'l_middle',
  'l_index',
  'l_thumb',
  'r_thumb',
  'r_index',
  'r_middle',
  'r_ring',
  'r_pinky',
] as const;

export const ANIMATION_TOKENS = {
  pressDownMs: 90,
  releaseMs: 140,
  targetPulseMs: 900,
  errorShakeMs: 180,
  errorColorHoldMs: 300,
} as const;

export interface FingerPressAnimation {
  readonly startTime: number;
  readonly isError: boolean;
}

export interface HandVisualState {
  readonly fingerStates: Readonly<Record<FingerId, VisualFingerState>>;
  readonly targetChar: string | null;
  readonly isSuspended: boolean;
}

/**
 * State precedence order (higher index = higher precedence):
 * pressed_error > pressed > target > shift_target > idle
 */
const PRECEDENCE_MAP: Record<VisualFingerState, number> = {
  idle: 0,
  shift_target: 1,
  target: 2,
  pressed: 3,
  pressed_error: 4,
};

export function resolveFingerPrecedence(
  a: VisualFingerState,
  b: VisualFingerState
): VisualFingerState {
  return PRECEDENCE_MAP[a] >= PRECEDENCE_MAP[b] ? a : b;
}

/**
 * Calculates current visual states across all 10 fingers.
 */
export function computeHandVisualState(
  nextExpectedChar: string | null,
  engineState: string,
  layout: KeyboardLayoutDef,
  activePresses: Readonly<Partial<Record<FingerId, FingerPressAnimation>>>,
  nowMs: number,
  mode: HandGuideMode = 'next'
): HandVisualState {
  const resultStates: Record<FingerId, VisualFingerState> = {
    l_pinky: 'idle',
    l_ring: 'idle',
    l_middle: 'idle',
    l_index: 'idle',
    l_thumb: 'idle',
    r_thumb: 'idle',
    r_index: 'idle',
    r_middle: 'idle',
    r_ring: 'idle',
    r_pinky: 'idle',
  };

  if (mode === 'off') {
    return {
      fingerStates: resultStates,
      targetChar: null,
      isSuspended: true,
    };
  }

  const isSuspended = engineState === 'Suspended';
  const isFinished = engineState === 'Finished' || engineState === 'Result' || engineState === 'Idle';

  // 1. If mode is 'next' and not finished, compute target and shift target from next expected character
  if (mode === 'next' && !isFinished && nextExpectedChar) {
    if (nextExpectedChar === '\n') {
      const enterFinger = layout.modifiers['Enter'];
      if (enterFinger) {
        resultStates[enterFinger] = 'target';
      }
    } else {
      const hint = hintForChar(layout, nextExpectedChar);
      if (hint) {
        resultStates[hint.finger] = 'target';
        if (hint.shiftFinger) {
          resultStates[hint.shiftFinger] = resolveFingerPrecedence(
            resultStates[hint.shiftFinger],
            'shift_target'
          );
        }
      }
    }
  }

  // 2. If mode is 'react' or 'next', overlay press animations respecting precedence
  if (mode === 'react' || mode === 'next') {
    for (const finger of ALL_FINGERS) {
      const press = activePresses[finger];
      if (press) {
        const elapsed = nowMs - press.startTime;
        const totalDuration = press.isError
          ? ANIMATION_TOKENS.errorColorHoldMs
          : ANIMATION_TOKENS.pressDownMs + ANIMATION_TOKENS.releaseMs;

        if (elapsed < totalDuration) {
          const pressState: VisualFingerState = press.isError ? 'pressed_error' : 'pressed';
          resultStates[finger] = resolveFingerPrecedence(resultStates[finger], pressState);
        }
      }
    }
  }

  return {
    fingerStates: resultStates,
    targetChar: isFinished || mode === 'static' || mode === 'react' ? null : nextExpectedChar,
    isSuspended,
  };
}
