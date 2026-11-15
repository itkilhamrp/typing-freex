/**
 * Hand Sprite System (§5.12.5, SEC-25)
 * Strict validation and formatting for ASCII robot hand sprites.
 */

export const MAX_SPRITE_SIZE_BYTES = 8192; // 8 KB size cap

// Allowed glyph set: . - _ | = o @ [ ] : / \ ' space
export const ALLOWED_GLYPHS = new Set([
  '.', '-', '_', '|', '=', 'o', 'O', '@', '[', ']', ':', '/', '\\', "'", ' ', '\n',
]);

export interface FingerSprite {
  readonly normal: readonly string[];  // Idle pose (relaxed, joints slightly bent)
  readonly target?: readonly string[]; // Optional "reach" pose (finger extended) for target / shift_target
  readonly pressed?: readonly string[]; // Optional alternate lines for pressed state (finger curled)
  /**
   * Optional: how many rows the sprite hangs below the finger baseline (palm top).
   * Used for fingers attached lower on the palm (e.g. thumb) and for the slanted knuckle line.
   * The palm sprite must leave those cells blank.
   */
  readonly offsetY?: number;
}

export const MAX_OFFSET_Y = 48;

export interface HandSpritePack {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly theme: string;
  readonly leftFingers: Record<string, FingerSprite>;
  /** Omitted when `mirrorRight` is true (the right hand is the mirror image of the left). */
  readonly rightFingers?: Record<string, FingerSprite>;
  readonly leftPalm: readonly string[];
  readonly rightPalm?: readonly string[];
  /**
   * When true, the right hand is derived at load time by mirroring the left one
   * (reverse every row, swap slash/backslash and the two brackets). Halves the pack size, so the same
   * SEC-25 byte cap allows roughly twice the detail. The glyph set is unchanged.
   */
  readonly mirrorRight?: boolean;
}

export interface SpriteValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
}

/**
 * Validates a sprite definition against SEC-25 rules.
 */
export function validateSpritePack(data: unknown, rawByteLength?: number): SpriteValidationResult {
  if (rawByteLength && rawByteLength > MAX_SPRITE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `Sprite pack exceeds 8 KB size cap (${rawByteLength} bytes)`,
    };
  }

  if (typeof data !== 'object' || data === null) {
    return { isValid: false, error: 'Sprite pack must be an object' };
  }

  const pack = data as Partial<HandSpritePack>;
  if (pack.mirrorRight !== undefined && typeof pack.mirrorRight !== 'boolean') {
    return { isValid: false, error: 'mirrorRight must be a boolean' };
  }
  const mirrored = pack.mirrorRight === true;
  const leftFingers = pack.leftFingers;
  const leftPalm = pack.leftPalm;
  if (!pack.id || !pack.name || !leftFingers || !leftPalm) {
    return { isValid: false, error: 'Missing required sprite pack fields' };
  }
  if (!mirrored && (!pack.rightFingers || !pack.rightPalm)) {
    return { isValid: false, error: 'Missing required sprite pack fields' };
  }

  const validateLines = (lines: readonly string[], context: string): SpriteValidationResult => {
    if (!Array.isArray(lines) || lines.length === 0) {
      return { isValid: false, error: `Empty lines in ${context}` };
    }
    const firstLine = lines[0];
    if (firstLine === undefined) {
      return { isValid: false, error: `Empty lines in ${context}` };
    }
    const width = firstLine.length;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      if (line.length !== width) {
        return {
          isValid: false,
          error: `Unequal row width in ${context} at line ${i} (expected ${width}, got ${line.length})`,
        };
      }
      for (const ch of line) {
        if (!ALLOWED_GLYPHS.has(ch)) {
          return {
            isValid: false,
            error: `Disallowed glyph '${ch}' (code ${ch.charCodeAt(0)}) in ${context}`,
          };
        }
      }
    }
    return { isValid: true };
  };

  // Validate one finger: every pose must be valid and share the same width as `normal`
  const validateFinger = (sprite: FingerSprite, context: string): SpriteValidationResult => {
    const res = validateLines(sprite.normal, `${context}.normal`);
    if (!res.isValid) return res;
    const firstNormal = sprite.normal[0];
    if (firstNormal === undefined) {
      return { isValid: false, error: `Missing normal pose in ${context}` };
    }
    const width = firstNormal.length;
    for (const pose of ['target', 'pressed'] as const) {
      const lines = sprite[pose];
      if (!lines) continue;
      const pRes = validateLines(lines, `${context}.${pose}`);
      if (!pRes.isValid) return pRes;
      const poseFirst = lines[0];
      const poseWidth = poseFirst !== undefined ? poseFirst.length : 0;
      if (poseWidth !== width) {
        return {
          isValid: false,
          error: `Pose width mismatch in ${context}.${pose} (expected ${width}, got ${poseWidth})`,
        };
      }
    }
    if (sprite.offsetY !== undefined) {
      if (!Number.isInteger(sprite.offsetY) || sprite.offsetY < 0 || sprite.offsetY > MAX_OFFSET_Y) {
        return { isValid: false, error: `Invalid offsetY in ${context} (must be an integer 0..${MAX_OFFSET_Y})` };
      }
    }
    return { isValid: true };
  };

  // Validate left fingers
  for (const [finger, sprite] of Object.entries(leftFingers)) {
    const res = validateFinger(sprite, `leftFingers.${finger}`);
    if (!res.isValid) return res;
  }

  // Validate right fingers
  for (const [finger, sprite] of Object.entries(pack.rightFingers ?? {})) {
    const res = validateFinger(sprite, `rightFingers.${finger}`);
    if (!res.isValid) return res;
  }

  // Validate palms
  const leftPalmRes = validateLines(leftPalm, 'leftPalm');
  if (!leftPalmRes.isValid) return leftPalmRes;

  if (pack.rightPalm) {
    const rightPalmRes = validateLines(pack.rightPalm, 'rightPalm');
    if (!rightPalmRes.isValid) return rightPalmRes;
  }

  return { isValid: true };
}