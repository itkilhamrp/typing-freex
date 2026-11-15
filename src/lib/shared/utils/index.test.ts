import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  round,
  formatModeInfo,
  formatModeBadge,
  formatModeDetail,
} from './index';

describe('Shared Utils - formatters & mathematical helpers', () => {
  describe('formatDuration', () => {
    it('formats seconds into mm:ss notation', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(59)).toBe('0:59');
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3600)).toBe('60:00');
    });
  });

  describe('round', () => {
    it('rounds values to desired decimal points', () => {
      expect(round(12.3456, 2)).toBe(12.35);
      expect(round(12.3444, 2)).toBe(12.34);
      expect(round(12.5, 0)).toBe(13);
    });
  });

  describe('formatModeInfo & duplicate label elimination', () => {
    it('suppresses duplicate custom labels (no CUSTOM CUSTOM)', () => {
      const infoNull = formatModeInfo('custom');
      expect(infoNull.badge).toBe('Custom · Infinity');
      expect(infoNull.detail).toBe('Infinity');

      const infoLegacy = formatModeInfo('custom', 'custom');
      expect(infoLegacy.badge).toBe('Custom · Infinity');
      expect(infoLegacy.detail).toBe('Infinity');

      const infoInf = formatModeInfo('custom', 'infinity');
      expect(infoInf.badge).toBe('Custom · Infinity');
      expect(infoInf.detail).toBe('Infinity');

      expect(formatModeBadge('custom', 'custom')).toBe('Custom · Infinity');
      expect(formatModeDetail('custom', 'custom')).toBe('Custom (Infinity)');
    });

    it('formats timed custom sessions with clean second suffixes', () => {
      const info30 = formatModeInfo('custom', '30');
      expect(info30.badge).toBe('Custom · 30s');
      expect(info30.detail).toBe('30s');

      const info60s = formatModeInfo('custom', '60s');
      expect(info60s.badge).toBe('Custom · 60s');
      expect(info60s.detail).toBe('60s');

      expect(formatModeBadge('custom', '45')).toBe('Custom · 45s');
      expect(formatModeDetail('custom', '45')).toBe('Custom (45s)');
    });

    it('suppresses duplicate quote, tech, and zen labels (no QUOTE QUOTE or TECH TECH)', () => {
      expect(formatModeBadge('quote', 'quote')).toBe('Quote');
      expect(formatModeDetail('quote', 'quote')).toBe('Quote');

      expect(formatModeBadge('tech', 'tech')).toBe('Tech');
      expect(formatModeDetail('tech', 'tech')).toBe('Tech');

      expect(formatModeBadge('zen', 'zen')).toBe('Zen');
      expect(formatModeDetail('zen', 'zen')).toBe('Zen');

      expect(formatModeBadge('quote')).toBe('Quote');
      expect(formatModeBadge('tech')).toBe('Tech');
      expect(formatModeBadge('zen')).toBe('Zen');
    });

    it('formats standard time and words modes cleanly', () => {
      expect(formatModeBadge('time', '15')).toBe('Time · 15s');
      expect(formatModeBadge('time', '30s')).toBe('Time · 30s');
      expect(formatModeDetail('time', '60')).toBe('Time (60s)');

      expect(formatModeBadge('words', '25')).toBe('Words · 25');
      expect(formatModeDetail('words', '50')).toBe('Words (50)');
    });
  });
});
