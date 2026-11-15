/**
 * Pure validation, clamping, and codec helpers for Settings store.
 * Zero Svelte, DOM, or reactive state dependencies (UNIX Rule of Separation).
 */

export function parseOneOf<T extends string>(
  raw: string | undefined | null,
  allowed: readonly T[],
): T | null {
  if (!raw) return null;
  return allowed.includes(raw as T) ? (raw as T) : null;
}

export function parseBooleanSetting(raw: string | undefined | null): boolean {
  return raw === "true";
}

export function clampScaleSize(value: number): number {
  return Math.round(Math.max(0.5, Math.min(2.0, value)) * 10) / 10;
}

export function clampVisibleLines(value: number): number {
  return Math.min(5, Math.max(1, value));
}

export function clampHistoryMinSpeed(value: number): number {
  return Math.max(0, Math.min(300, value));
}

export function clampHistoryMinAccuracy(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function clampTapeMargin(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

export function clampSoundVolume(value: number): number {
  return Math.round(Math.max(0, Math.min(2.0, value)) * 100) / 100;
}

export function parseClampedFloat(
  raw: string | undefined | null,
  min: number,
  max: number,
  clampFn?: (n: number) => number,
): number | null {
  if (raw === undefined || raw === null) return null;
  const parsed = parseFloat(raw);
  if (isNaN(parsed)) return null;
  if (clampFn) return clampFn(parsed);
  if (parsed < min || parsed > max) return null;
  return parsed;
}

export function parsePositiveIntCapped(
  raw: string | undefined | null,
  min: number,
  max: number,
): number | null {
  if (raw === undefined || raw === null) return null;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed < min) return null;
  return Math.min(max, parsed);
}

export function parseIntInSet(
  raw: string | undefined | null,
  allowed: readonly number[],
): number | null {
  if (raw === undefined || raw === null) return null;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || !allowed.includes(parsed)) return null;
  return parsed;
}

export function decodeStorageFallback<T>(raw: string | null | undefined, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof fallback === "boolean") {
    return (raw === "true") as unknown as T;
  }
  if (typeof fallback === "number") {
    const num = parseFloat(raw);
    return (!isNaN(num) ? num : fallback) as unknown as T;
  }
  return raw as unknown as T;
}

