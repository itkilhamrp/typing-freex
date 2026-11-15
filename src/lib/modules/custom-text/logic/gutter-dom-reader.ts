/**
 * DOM Reader stage for Custom Text Editor Gutter (UNIX Pipeline).
 * Isolates all browser/DOM layout reads (getComputedStyle, clientWidth, offsetHeight)
 * from the pure mathematical gutter line wrapper calculations in gutter-measurer.ts.
 */

export interface TextareaMetrics {
  clientWidth: number;
  paddingLeft: number;
  paddingRight: number;
}

/**
 * Reads clientWidth and horizontal padding from a textarea element.
 */
export function readTextareaMetrics(
  textareaEl: HTMLTextAreaElement | null
): TextareaMetrics | null {
  if (!textareaEl || typeof window === 'undefined') return null;
  const comp = window.getComputedStyle(textareaEl);
  const paddingLeft = parseFloat(comp.paddingLeft) || 16;
  const paddingRight = parseFloat(comp.paddingRight) || 16;
  return {
    clientWidth: textareaEl.clientWidth,
    paddingLeft,
    paddingRight,
  };
}

/**
 * Reads rendered offsetHeight of each logical line child inside the hidden mirror element.
 */
export function readMirrorLineHeights(mirrorEl: HTMLElement | null): number[] {
  if (!mirrorEl) return [];
  const children = mirrorEl.children;
  const count = children.length;
  const heights: number[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const el = children[i] as HTMLElement;
    heights[i] = el.offsetHeight;
  }
  return heights;
}

