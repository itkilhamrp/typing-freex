export function useRaf(callback: (timestamp: number) => void) {
  let rafId: number | null = null;
  let isRunning = false;

  const loop = (timestamp: number) => {
    if (!isRunning) return;
    callback(timestamp);
    if (isRunning) {
      rafId = requestAnimationFrame(loop);
    }
  };

  const start = () => {
    if (isRunning) return;
    isRunning = true;
    rafId = requestAnimationFrame(loop);
  };

  const stop = () => {
    isRunning = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return { start, stop };
}
