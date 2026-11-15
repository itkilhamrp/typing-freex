import type {
  TimelinePoint,
  KeyStat,
  RawKeyEventRecord,
  LatencyStats,
} from './types';
import { calculateLatencyStats } from './metrics/latency';

const MAX_DELTA_MS = 65535;

export class KeystrokeRecorder {
  private rawEvents: RawKeyEventRecord[] = [];
  private timestamps: number[] = [];
  private timeline: TimelinePoint[] = [];
  private keyStats: Map<string, KeyStat> = new Map();
  private lastTimestamp: number | null = null;

  recordKeystroke(
    key: string,
    code: string,
    isCorrect: boolean,
    timestamp: number,
    expectedKey?: string
  ): void {
    const deltaMs =
      this.lastTimestamp !== null
        ? Math.min(MAX_DELTA_MS, Math.max(0, Math.round(timestamp - this.lastTimestamp)))
        : 0;

    this.rawEvents.push({
      deltaMs,
      key,
      code,
      isCorrect,
    });

    this.timestamps.push(timestamp);

    // Update per-key stats (keyed by the expected character)
    const statKey = expectedKey ?? key;
    const existing = this.keyStats.get(statKey) ?? {
      key: statKey,
      total: 0,
      correct: 0,
      errors: 0,
      totalLatencyMs: 0,
    };

    existing.total++;
    if (isCorrect) {
      existing.correct++;
    } else {
      existing.errors++;
    }
    existing.totalLatencyMs += deltaMs;
    this.keyStats.set(statKey, existing);

    this.lastTimestamp = timestamp;
  }

  recordTimelinePoint(second: number, wpm: number, rawWpm: number, errors: number): void {
    this.timeline.push({
      second,
      wpm,
      rawWpm,
      errors,
    });
  }

  getRawEvents(): RawKeyEventRecord[] {
    return this.rawEvents;
  }

  getTimestamps(): readonly number[] {
    return this.timestamps;
  }

  getTimeline(): TimelinePoint[] {
    return this.timeline;
  }

  getKeyStats(): Record<string, KeyStat> {
    const result: Record<string, KeyStat> = {};
    for (const [k, v] of this.keyStats.entries()) {
      result[k] = { ...v };
    }
    return result;
  }

  getLatencyStats(): LatencyStats {
    return calculateLatencyStats(this.timestamps);
  }

  clear(): void {
    this.rawEvents = [];
    this.timestamps = [];
    this.timeline = [];
    this.keyStats.clear();
    this.lastTimestamp = null;
  }
}
