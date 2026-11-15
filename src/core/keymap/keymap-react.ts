/**
 * Headless pure-function helper for Keymap React Mode pulse.
 * Evaluates keypress correctness for keymap pulse without DOM/Svelte dependencies.
 */

export interface ReactPulseResult {
  readonly code: string;
  readonly isCorrect: boolean;
}

export interface KeypressPayload {
  readonly code: string;
  readonly key: string;
}

/**
 * Resolves whether a keypress in Keymap React mode was correct or an error.
 *
 * @param event - The keypress event or payload containing code and key.
 * @param expected - The next expected character (or null if none/zen).
 * @param mode - The current typing mode (e.g. 'zen', 'words', 'time').
 */
export function evaluateReactPulse(
  event: KeypressPayload,
  expected: string | null,
  mode: string,
): ReactPulseResult {
  const isCorrect =
    mode === 'zen' ||
    expected === null ||
    (event.key === 'Enter' ? expected === '\n' : event.key === expected);

  return {
    code: event.code,
    isCorrect,
  };
}

