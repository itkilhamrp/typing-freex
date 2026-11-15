/**
 * Hand Guide Controller (Svelte 5 Runes)
 * Derives visual state and animations for ASCII robot hands in real-time.
 */

import {
  computeHandVisualState,
  fingerForCode,
  type KeyboardLayoutDef,
  type FingerPressAnimation,
  type HandGuideMode,
  ANIMATION_TOKENS,
} from '@/core/hand-guide';
import defaultLayoutData from '../../../../../../content-packs/keyboard-layouts/qwerty-us.json';

const defaultLayout = defaultLayoutData as unknown as KeyboardLayoutDef;

export function useHandGuideController() {
  let activePresses = $state.raw<Record<string, FingerPressAnimation>>({});
  const releaseTimers: Partial<Record<string, ReturnType<typeof setTimeout>>> = {};

  function clearAllTimers() {
    for (const [k, timer] of Object.entries(releaseTimers)) {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      delete releaseTimers[k];
    }
  }

  function registerKeyPress(code: string, isError: boolean, timestamp: number = performance.now()) {
    const finger = fingerForCode(defaultLayout, code);
    if (finger) {
      const prevTimer = releaseTimers[finger];
      if (prevTimer !== undefined) {
        clearTimeout(prevTimer);
      }

      const nextPresses: Record<string, FingerPressAnimation> = {};
      const maxAge = ANIMATION_TOKENS.errorColorHoldMs + 100;
      for (const [f, p] of Object.entries(activePresses)) {
        if (timestamp - p.startTime < maxAge) {
          nextPresses[f] = p;
        }
      }
      nextPresses[finger] = { startTime: timestamp, isError };
      activePresses = nextPresses;

      const durationMs =
        (isError
          ? ANIMATION_TOKENS.errorColorHoldMs
          : ANIMATION_TOKENS.pressDownMs + ANIMATION_TOKENS.releaseMs) + 10;

      const timer = setTimeout(() => {
        delete releaseTimers[finger];
        if (activePresses[finger]?.startTime === timestamp) {
          const updated: Record<string, FingerPressAnimation> = {};
          for (const [f, p] of Object.entries(activePresses)) {
            if (f !== finger) {
              updated[f] = p;
            }
          }
          activePresses = updated;
        }
      }, durationMs);
      releaseTimers[finger] = timer;
    }
  }

  function reset() {
    clearAllTimers();
    activePresses = {};
  }

  function destroy() {
    clearAllTimers();
    activePresses = {};
  }

  function getVisualState(
    nextExpectedChar: string | null,
    engineState: string,
    mode: HandGuideMode = 'next',
    nowMs: number = performance.now()
  ) {
    return computeHandVisualState(
      nextExpectedChar,
      engineState,
      defaultLayout,
      activePresses,
      nowMs,
      mode
    );
  }

  return {
    registerKeyPress,
    getVisualState,
    reset,
    destroy,
  };
}
