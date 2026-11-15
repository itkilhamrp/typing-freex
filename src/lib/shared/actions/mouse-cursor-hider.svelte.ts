/**
 * Monkeytype-style Mouse Cursor Auto-Hider Composable (Svelte 5 Runes)
 * Hides the mouse pointer when typing starts to eliminate visual distraction,
 * and restores it automatically when the mouse physically moves, focus is lost,
 * the test ends, or the user navigates away.
 */

export interface MouseCursorHiderOptions {
  /** Optional predicate to check if hiding is currently allowed (e.g. test is active & focused) */
  canHide?: () => boolean;
}

export function useMouseCursorHider(options?: MouseCursorHiderOptions) {
  let isHidden = $state(false);
  let lastX = -1;
  let lastY = -1;

  function hideCursor(): void {
    if (typeof document === 'undefined') return;
    if (options?.canHide && !options.canHide()) return;

    if (!isHidden) {
      isHidden = true;
      document.body.classList.add('cursor-hidden');
    }
  }

  function showCursor(): void {
    if (typeof document === 'undefined') return;
    if (isHidden || document.body.classList.contains('cursor-hidden')) {
      isHidden = false;
      document.body.classList.remove('cursor-hidden');
    }
  }

  function handleMouseMove(e: MouseEvent): void {
    // Guard against synthetic zero-delta mousemove events fired by browser when cursor style toggles
    if (e.clientX === lastX && e.clientY === lastY) {
      return;
    }
    lastX = e.clientX;
    lastY = e.clientY;

    if (isHidden) {
      showCursor();
    }
  }

  function destroy(): void {
    showCursor();
  }

  return {
    get isHidden() {
      return isHidden;
    },
    hideCursor,
    showCursor,
    handleMouseMove,
    destroy,
  };
}
