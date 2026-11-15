/**
 * Clock-injected Monotonic Timer (§5.6)
 * Never reads system clock directly; driven by event and frame timestamps
 * to ensure 100% determinism during testing and trace replays.
 */
export class MonotonicTimer {
  private startTime: number | null = null;
  private accumulatedActiveMs: number = 0;
  private pauseStartTime: number | null = null;
  private isSuspended: boolean = false;

  start(timestamp: number): void {
    if (this.startTime !== null) return;
    this.startTime = timestamp;
    this.accumulatedActiveMs = 0;
    this.pauseStartTime = null;
    this.isSuspended = false;
  }

  suspend(timestamp: number): void {
    if (!this.isRunning() || this.isSuspended) return;
    this.accumulatedActiveMs += Math.max(0, timestamp - (this.pauseStartTime ?? this.startTime!));
    this.pauseStartTime = timestamp;
    this.isSuspended = true;
  }

  resume(timestamp: number): void {
    if (!this.isSuspended) return;
    this.startTime = timestamp;
    this.pauseStartTime = null;
    this.isSuspended = false;
  }

  reset(): void {
    this.startTime = null;
    this.accumulatedActiveMs = 0;
    this.pauseStartTime = null;
    this.isSuspended = false;
  }

  isRunning(): boolean {
    return this.startTime !== null && !this.isSuspended;
  }

  isPaused(): boolean {
    return this.isSuspended;
  }

  getActiveElapsedMs(nowTimestamp: number): number {
    if (this.startTime === null) return 0;
    if (this.isSuspended) {
      return this.accumulatedActiveMs;
    }
    const currentSegment = Math.max(0, nowTimestamp - this.startTime);
    return this.accumulatedActiveMs + currentSegment;
  }

  getActiveElapsedSeconds(nowTimestamp: number): number {
    return this.getActiveElapsedMs(nowTimestamp) / 1000;
  }
}
