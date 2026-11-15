import {
  readMirrorLineHeights,
  readTextareaMetrics,
} from './gutter-dom-reader';

export interface GutterItem {
  lineNum: number;
  isWrap: boolean;
}

/**
 * Pure math: computes inner content width of the mirror element from raw metrics.
 */
export function calculateMirrorWidth(
  clientWidth: number,
  paddingLeft = 16,
  paddingRight = 16
): number {
  return Math.max(0, Math.floor(clientWidth - paddingLeft - paddingRight));
}

/**
 * Pure math: transforms an array of logical line heights into visual gutter items.
 */
export function calculateGutterLinesFromHeights(
  lineHeights: readonly number[],
  singleLineHeight = 24
): GutterItem[] {
  if (lineHeights.length === 0) return [{ lineNum: 1, isWrap: false }];

  const safeSingleHeight = singleLineHeight > 0 ? singleLineHeight : 24;
  const lines: GutterItem[] = [];

  for (let i = 0; i < lineHeights.length; i++) {
    const h = lineHeights[i] ?? safeSingleHeight;
    const wrapCount = Math.max(1, Math.round(h / safeSingleHeight));

    lines.push({ lineNum: i + 1, isWrap: false });
    for (let c = 1; c < wrapCount; c++) {
      lines.push({ lineNum: i + 1, isWrap: true });
    }
  }

  return lines;
}

/**
 * Menghitung lebar mirror element yang presisi berdasarkan lebar textarea dan padding.
 */
export function computeMirrorWidth(textareaEl: HTMLTextAreaElement): number {
  const metrics = readTextareaMetrics(textareaEl);
  if (!metrics) return 500;
  return calculateMirrorWidth(
    metrics.clientWidth,
    metrics.paddingLeft,
    metrics.paddingRight
  );
}

/**
 * Mengukur tinggi setiap baris logis di dalam mirror element
 * untuk mendeteksi wrap visual pada textarea.
 */
export function measureGutterLines(
  mirrorEl: HTMLElement | null,
  singleLineHeight = 24
): GutterItem[] {
  if (!mirrorEl) return [{ lineNum: 1, isWrap: false }];
  const heights = readMirrorLineHeights(mirrorEl);
  return calculateGutterLinesFromHeights(heights, singleLineHeight);
}

