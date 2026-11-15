import type { SpeedUnit } from '../types';

export const CHARS_PER_WORD = 5 as const;

/**
 * Converts a standard WPM value to the target SpeedUnit.
 * Standard formula: 1 WPM = 5 CPM.
 */
export function toUnit(wpm: number, unit: SpeedUnit): number {
  if (unit === 'cpm') {
    return Math.round(wpm * CHARS_PER_WORD * 100) / 100;
  }
  return Math.round(wpm * 100) / 100;
}

/**
 * Formats a speed value into a localized string with unit suffix.
 */
export function formatSpeed(wpm: number, unit: SpeedUnit, locale: string = 'en'): string {
  const value = toUnit(wpm, unit);
  const formattedNum = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);

  const suffix = unit.toUpperCase();
  return `${formattedNum} ${suffix}`;
}
