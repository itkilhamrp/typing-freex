/**
 * Keyboard Layout & Finger Mapping Module (§5.12.3)
 * Touch-typing conventions, physical key code resolution, and opposite-hand Shift rule.
 */

export type FingerId =
  | 'l_pinky'
  | 'l_ring'
  | 'l_middle'
  | 'l_index'
  | 'l_thumb'
  | 'r_thumb'
  | 'r_index'
  | 'r_middle'
  | 'r_ring'
  | 'r_pinky';

export type Finger = FingerId; // Alias for backward compatibility

export interface KeyDef {
  readonly code: string;   // KeyboardEvent.code (e.g. 'KeyQ', 'Digit1')
  readonly base: string;   // Unshifted character (e.g. 'q', '1')
  readonly shift?: string; // Shifted character (e.g. 'Q', '!')
  readonly finger: FingerId;
}

export interface KeyboardLayoutDef {
  readonly id: string;
  readonly name: string;
  readonly license?: string;
  readonly keys: readonly KeyDef[];
  readonly modifiers: Readonly<Record<string, FingerId>>;
}

export interface FingerHint {
  readonly finger: FingerId;
  readonly shiftFinger: FingerId | null;
}

/**
 * Determines whether a finger belongs to the left hand.
 */
export function isLeftHand(finger: FingerId): boolean {
  return finger.startsWith('l_');
}

/**
 * Returns the opposite hand's pinky to act as the Shift finger.
 */
export function getOppositeShiftFinger(primaryFinger: FingerId): FingerId {
  return isLeftHand(primaryFinger) ? 'r_pinky' : 'l_pinky';
}

/**
 * Look up target finger and potential Shift finger for the next expected character.
 */
export function hintForChar(layout: KeyboardLayoutDef, ch: string): FingerHint | null {
  if (!ch) return null;

  for (const key of layout.keys) {
    if (key.base === ch) {
      return {
        finger: key.finger,
        shiftFinger: null,
      };
    }

    if (key.shift === ch) {
      return {
        finger: key.finger,
        shiftFinger: getOppositeShiftFinger(key.finger),
      };
    }
  }

  // Fallback for uppercase letters if not explicitly in shift table
  if (ch.length === 1 && ch.toUpperCase() === ch && ch.toLowerCase() !== ch) {
    const lower = ch.toLowerCase();
    for (const key of layout.keys) {
      if (key.base === lower) {
        return {
          finger: key.finger,
          shiftFinger: getOppositeShiftFinger(key.finger),
        };
      }
    }
  }

  return null;
}

/**
 * Look up the physical finger that pressed a physical key code.
 */
export function fingerForCode(layout: KeyboardLayoutDef, code: string): FingerId | null {
  // Check modifier keys first (ShiftLeft, ShiftRight, Enter, Backspace, etc.)
  if (layout.modifiers[code]) {
    return layout.modifiers[code];
  }

  // Check character keys
  for (const key of layout.keys) {
    if (key.code === code) {
      return key.finger;
    }
  }

  return null;
}
