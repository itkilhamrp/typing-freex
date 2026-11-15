import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdaptiveSoundEngine } from './adaptive-sound-engine.js';
import type { SoundEngine } from './sound-engine.js';

function createMockEngine(name: string): SoundEngine & { name: string; calls: string[] } {
  const calls: string[] = [];
  return {
    name,
    calls,
    getContext: vi.fn().mockReturnValue(name === 'hybrid' ? ({} as AudioContext) : null),
    preload: vi.fn().mockImplementation((id: string) => {
      calls.push(`preload:${id}`);
      return Promise.resolve(true);
    }),
    preloadBatch: vi.fn().mockImplementation((entries) => {
      calls.push(`preloadBatch:${entries.length}`);
      return Promise.resolve();
    }),
    registerBuffer: vi.fn().mockImplementation((id: string) => {
      calls.push(`registerBuffer:${id}`);
    }),
    play: vi.fn().mockImplementation((id: string) => {
      calls.push(`play:${id}`);
    }),
    playRandom: vi.fn().mockImplementation((prefix: string) => {
      calls.push(`playRandom:${prefix}`);
    }),
    playSequence: vi.fn().mockImplementation((prefix: string) => {
      calls.push(`playSequence:${prefix}`);
    }),
    setVolume: vi.fn().mockImplementation((vol: number) => {
      calls.push(`setVolume:${vol}`);
    }),
    getVolume: vi.fn().mockReturnValue(0.7),
    resume: vi.fn().mockResolvedValue(undefined),
    has: vi.fn().mockReturnValue(true),
    clear: vi.fn().mockImplementation((prefix?: string) => {
      calls.push(`clear:${prefix ?? 'all'}`);
    }),
    dispose: vi.fn().mockImplementation(() => {
      calls.push('dispose');
    }),
  };
}

describe('AdaptiveSoundEngine', () => {
  let nativeEngine: ReturnType<typeof createMockEngine>;
  let hybridEngine: ReturnType<typeof createMockEngine>;

  beforeEach(() => {
    nativeEngine = createMockEngine('native');
    hybridEngine = createMockEngine('hybrid');
  });

  it('delegates to NativeSoundEngine when probe resolves healthy: true', async () => {
    const probeFn = vi.fn().mockResolvedValue(true);
    const engine = new AdaptiveSoundEngine(
      probeFn,
      () => nativeEngine,
      () => hybridEngine
    );

    await engine.preload('click/1', '/sounds/click1.wav');
    engine.play('click/1');

    expect(nativeEngine.calls).toContain('preload:click/1');
    expect(nativeEngine.calls).toContain('play:click/1');
    expect(hybridEngine.calls.length).toBe(0);
  });

  it('delegates to HybridSoundEngine when probe resolves healthy: false', async () => {
    const probeFn = vi.fn().mockResolvedValue(false);
    const engine = new AdaptiveSoundEngine(
      probeFn,
      () => nativeEngine,
      () => hybridEngine
    );

    await engine.preload('click/1', '/sounds/click1.wav');
    engine.play('click/1');

    expect(hybridEngine.calls).toContain('preload:click/1');
    expect(hybridEngine.calls).toContain('play:click/1');
    expect(nativeEngine.calls.length).toBe(0);
  });

  it('flushes buffers registered while probe was pending into the selected engine', async () => {
    let resolveProbe!: (value: boolean) => void;
    const probePromise = new Promise<boolean>((resolve) => {
      resolveProbe = resolve;
    });

    const engine = new AdaptiveSoundEngine(
      () => probePromise,
      () => nativeEngine,
      () => hybridEngine
    );

    const mockBuffer = {} as AudioBuffer;
    engine.registerBuffer('sine/1', mockBuffer);
    expect(nativeEngine.calls).not.toContain('registerBuffer:sine/1');

    resolveProbe(true);
    await engine.resume();

    expect(nativeEngine.calls).toContain('registerBuffer:sine/1');
    expect(hybridEngine.calls.length).toBe(0);

    engine.dispose();
    expect(nativeEngine.calls).toContain('dispose');
  });
});

