import type { LatencyStats } from '../types';

const PAUSE_THRESHOLD_MS = 2000;

/**
 * Calculates Keystroke Latency Statistics (§5.3 — FR-MET-006)
 * Measures inter-key intervals (t_n - t_{n-1}) from consecutive timestamps.
 */
export function calculateLatencyStats(timestamps: readonly number[]): LatencyStats {
  if (timestamps.length < 2) {
    return {
      meanMs: 0,
      medianMs: 0,
      p95Ms: 0,
      pausesCount: 0,
    };
  }

  const validIntervals: number[] = [];
  let pausesCount = 0;

  for (let i = 1; i < timestamps.length; i++) {
    const delta = (timestamps[i] as number) - (timestamps[i - 1] as number);
    if (delta > PAUSE_THRESHOLD_MS) {
      pausesCount++;
    } else if (delta >= 0) {
      validIntervals.push(delta);
    }
  }

  if (validIntervals.length === 0) {
    return {
      meanMs: 0,
      medianMs: 0,
      p95Ms: 0,
      pausesCount,
    };
  }

  // Sort ascending for median and percentile calculations
  validIntervals.sort((a, b) => a - b);

  const sum = validIntervals.reduce((a, b) => a + b, 0);
  const meanMs = Math.round((sum / validIntervals.length) * 100) / 100;

  // Median
  const mid = Math.floor(validIntervals.length / 2);
  const medianMs =
    validIntervals.length % 2 !== 0
      ? validIntervals[mid]!
      : Math.round((((validIntervals[mid - 1] as number) + (validIntervals[mid] as number)) / 2) * 100) / 100;

  // P95 (95th percentile)
  const p95Index = Math.min(
    validIntervals.length - 1,
    Math.floor(validIntervals.length * 0.95)
  );
  const p95Ms = validIntervals[p95Index]!;

  return {
    meanMs,
    medianMs,
    p95Ms,
    pausesCount,
  };
}
