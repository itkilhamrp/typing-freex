/**
 * DOM Measurement Utilities
 *
 * Deterministic, invariant DOM inspection helpers adhering to UNIX philosophy:
 * single responsibility, zero framework dependencies, pure DOM hierarchy traversal.
 */

export interface RelativeOffset {
  left: number;
  top: number;
}

/**
 * Calculates the exact cumulative offset of an element relative to a specific ancestor.
 * Invariant against any intermediate positioned ancestors (e.g. position: relative on words or wrappers).
 */
export function getOffsetRelativeTo(
  element: HTMLElement,
  ancestor: HTMLElement,
): RelativeOffset {
  let left = 0;
  let top = 0;
  let curr: HTMLElement | null = element;

  while (curr && curr !== ancestor) {
    left += curr.offsetLeft;
    top += curr.offsetTop;
    curr = curr.offsetParent as HTMLElement | null;
  }

  return { left, top };
}

