import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSoundEngine } from '#lib/shared/audio/sound-engine.js';
import { getClickPackById } from './sound-pack-registry';
import {
  preloadPack,
  unloadPack,
  switchPack,
  preloadWarningSound,
} from './sound-preloader';

function setupFakeWindowAudio() {
  class FakeAudioContext {
    state = 'running';
    sampleRate = 44100;
    currentTime = 0;
    destination = {};
    createGain() {
      return {
        gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
    }
    createDynamicsCompressor() {
      return {
        threshold: { value: -2 },
        knee: { value: 6 },
        ratio: { value: 12 },
        attack: { value: 0.001 },
        release: { value: 0.05 },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
    }
    createBuffer(channels: number, length: number, sampleRate: number) {
      const data = new Float32Array(length);
      return {
        numberOfChannels: channels,
        length,
        sampleRate,
        duration: length / sampleRate,
        getChannelData: () => data,
      };
    }
    async decodeAudioData() {
      return this.createBuffer(2, 441, 44100);
    }
  }
  (globalThis as unknown as { window: Record<string, unknown> }).window = {
    AudioContext: FakeAudioContext,
  };
  (globalThis as unknown as { fetch: unknown }).fetch = vi.fn(async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(64),
  }));
}

describe('sound-preloader', () => {
  beforeEach(() => {
    setupFakeWindowAudio();
  });

  it('preloadPack and unloadPack manage authentic WAV pack buffers in SoundEngine', async () => {
    const engine = createSoundEngine();
    const pack = getClickPackById('nk-creams')!;

    await preloadPack(pack, engine);
    expect(engine.has('nk-creams/1')).toBe(true);
    expect(engine.has('nk-creams/6')).toBe(true);

    unloadPack(pack, engine);
    expect(engine.has('nk-creams/1')).toBe(false);
  });

  it('switchPack unloads old pack and preloads new pack', async () => {
    const engine = createSoundEngine();
    const oldPack = getClickPackById('nk-creams')!;
    const newPack = getClickPackById('tealios-v2')!;

    await preloadPack(oldPack, engine);
    expect(engine.has('nk-creams/1')).toBe(true);

    await switchPack(oldPack, newPack, engine);
    expect(engine.has('nk-creams/1')).toBe(false);
    expect(engine.has('tealios-v2/1')).toBe(true);
  });

  it('preloadWarningSound decodes and registers time-warning buffer', async () => {
    const engine = createSoundEngine();
    await preloadWarningSound(engine);
    expect(engine.has('time-warning')).toBe(true);
  });
});
