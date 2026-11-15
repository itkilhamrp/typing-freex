import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRaf } from './raf.svelte';

describe('useRaf', () => {
  let nextId = 1;
  let scheduled = new Map<number, FrameRequestCallback>();

  beforeEach(() => {
    nextId = 1;
    scheduled = new Map();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        const id = nextId++;
        scheduled.set(id, cb);
        return id;
      }),
    );
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id: number) => {
        scheduled.delete(id);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('schedules next frame while running and avoids duplicate starts', () => {
    const tick = vi.fn();
    const raf = useRaf(tick);

    raf.start();
    raf.start();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    const firstCb = scheduled.get(1);
    scheduled.delete(1);
    firstCb?.(16);

    expect(tick).toHaveBeenCalledWith(16);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);

    raf.stop();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(2);
    expect(scheduled.size).toBe(0);
  });

  it('does not re-schedule a zombie frame when stop() is called inside tick callback', () => {
    const raf = useRaf(() => {
      raf.stop();
    });

    raf.start();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    const cb = scheduled.get(1);
    scheduled.delete(1);
    cb?.(32);

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(scheduled.size).toBe(0);
  });
});
