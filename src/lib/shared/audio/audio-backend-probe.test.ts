import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { probeNativeAudio } from './audio-backend-probe.js';

describe('probeNativeAudio', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('returns false when window is undefined (e.g. node/ssr)', async () => {
    // @ts-expect-error test simulation
    delete globalThis.window;
    const result = await probeNativeAudio();
    expect(result).toBe(false);
  });

  it('returns false when not running inside Tauri runtime', async () => {
    globalThis.window = {} as unknown as Window & typeof globalThis;
    const result = await probeNativeAudio();
    expect(result).toBe(false);
  });

  it('returns true when Tauri audio_status reports healthy: true', async () => {
    globalThis.window = {
      __TAURI_INTERNALS__: {},
    } as unknown as Window & typeof globalThis;

    const mockInvoke = vi.fn().mockResolvedValue({
      healthy: true,
      sample_rate: 48000,
      loaded_samples: 5,
    });

    const result = await probeNativeAudio(mockInvoke);
    expect(result).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('audio_status');
  });

  it('returns false when Tauri audio_status reports healthy: false', async () => {
    globalThis.window = {
      __TAURI_INTERNALS__: {},
    } as unknown as Window & typeof globalThis;

    const mockInvoke = vi.fn().mockResolvedValue({
      healthy: false,
      sample_rate: 48000,
      loaded_samples: 0,
    });

    const result = await probeNativeAudio(mockInvoke);
    expect(result).toBe(false);
  });

  it('returns false when invoke throws an error or rejects', async () => {
    globalThis.window = {
      __TAURI_INTERNALS__: {},
    } as unknown as Window & typeof globalThis;

    const mockInvoke = vi.fn().mockRejectedValue(new Error('IPC failed'));
    const result = await probeNativeAudio(mockInvoke);
    expect(result).toBe(false);
  });

  it('returns false when probe times out', async () => {
    globalThis.window = {
      __TAURI_INTERNALS__: {},
    } as unknown as Window & typeof globalThis;

    const mockInvoke = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ healthy: true }), 100))
    );

    const result = await probeNativeAudio(mockInvoke, 10);
    expect(result).toBe(false);
  });
});

