/**
 * Calculates Typing Consistency (§5.3 — FR-MET-004)
 * Based on the coefficient of variation (CV) of raw WPM sampled per second.
 * Requires at least 3 full elapsed seconds; otherwise returns null.
 * Formula: consistency = 100 * (1 - tanh(cv + cv^3 / 3 + cv^5 / 5)), clamped to [0, 100]
 */
export function calculateConsistency(rawWpmPerSecond: readonly number[]): number | null {
  if (rawWpmPerSecond.length < 3) {
    return null;
  }

  const n = rawWpmPerSecond.length;
  const sum = rawWpmPerSecond.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;

  if (mean <= 0) {
    return 100;
  }

  const variance =
    rawWpmPerSecond.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  // Taylor polynomial / tanh transformation per PRD formula
  const x = cv + Math.pow(cv, 3) / 3 + Math.pow(cv, 5) / 5;
  const penalty = Math.tanh(x);
  const consistency = 100 * (1 - penalty);

  return Math.max(0, Math.min(100, Math.round(consistency * 100) / 100));
}

/**
 * Incremental O(1) consistency calculation from running aggregates.
 * Uses the same CV → tanh formula as calculateConsistency, but avoids
 * O(n) array allocation and reduce passes on every sample.
 */
export function calculateConsistencyIncremental(
  sum: number,
  sumSq: number,
  count: number,
): number | null {
  if (count < 3) return null;
  const mean = sum / count;
  if (mean <= 0) return 100;
  const variance = sumSq / count - mean * mean;
  const stdDev = Math.sqrt(Math.max(0, variance));
  const cv = stdDev / mean;
  const x = cv + Math.pow(cv, 3) / 3 + Math.pow(cv, 5) / 5;
  const penalty = Math.tanh(x);
  const consistency = 100 * (1 - penalty);
  return Math.max(0, Math.min(100, Math.round(consistency * 100) / 100));
}

