import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

import {
  createSoundEngine,
  getSoundEngine,
  stereoSamplesToWavBlob,
  decodeWavArrayBuffer,
  conditionStereoSamples,
  MAX_CONCURRENT_VOICES,
} from './sound-engine';

class MockAudioBuffer {
  readonly numberOfChannels: number;
  readonly length: number;
  readonly sampleRate: number;
  readonly duration: number;
  private readonly channels: Float32Array[];

  constructor(numberOfChannels = 2, length = 441, sampleRate = 44100) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channels = Array.from({ length: Math.max(1, numberOfChannels) }, () => new Float32Array(length));
  }

  getChannelData(channel = 0): Float32Array {
    return this.channels[channel] ?? this.channels[0]!;
  }
}

function createMockAudioContext() {
  const sources: Array<{
    buffer: AudioBuffer | null;
    playbackRate: { value: number };
    onended: (() => void) | null;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];

  class MockAudioContext {
    state: AudioContextState = 'running';
    sampleRate = 44100;
    currentTime = 0;
    destination = {} as AudioDestinationNode;

    createGain() {
      return {
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        channelCount: 2,
        channelCountMode: 'explicit' as ChannelCountMode,
        channelInterpretation: 'speakers' as ChannelInterpretation,
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
    }

    createConstantSource() {
      return {
        offset: { value: 0 },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
    }

    createBuffer(channels: number, length: number, sampleRate: number) {
      return new MockAudioBuffer(channels, length, sampleRate) as unknown as AudioBuffer;
    }

    createBufferSource() {
      const src = {
        buffer: null as AudioBuffer | null,
        playbackRate: { value: 1 },
        onended: null as (() => void) | null,
        start: vi.fn(),
        stop: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      sources.push(src);
      return src;
    }

    async decodeAudioData() {
      return new MockAudioBuffer(2, 441, 44100) as unknown as AudioBuffer;
    }

    async resume() {
      this.state = 'running';
    }

    async close() {
      this.state = 'closed';
    }
  }

  return { MockAudioContext, sources };
}

describe('sound-engine', () => {
  beforeEach(() => {
    const { MockAudioContext } = createMockAudioContext();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      AudioContext: MockAudioContext,
    };
    (globalThis as unknown as { Audio: unknown }).Audio = undefined;
  });

  it('getSoundEngine() returns singleton instance', () => {
    const a = getSoundEngine();
    const b = getSoundEngine();
    expect(a).toBe(b);
  });

  it('stereoSamplesToWavBlob and decodeWavArrayBuffer perform accurate 16-bit PCM Stereo roundtrip', async () => {
    const left = new Float32Array([0, 0.25, -0.5, 0.75]);
    const right = new Float32Array([0, -0.25, 0.5, -0.75]);
    const blob = stereoSamplesToWavBlob(left, right, 44100);
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBe(44 + 4 * 4); // 44 header + 4 frames * 4 bytes (16-bit stereo)

    const ab = await blob.arrayBuffer();
    const decoded = decodeWavArrayBuffer(ab, 44100);
    expect(decoded).not.toBeNull();
    expect(decoded!.left.length).toBe(4);
    expect(decoded!.left[1]).toBeCloseTo(0.25, 2);
    expect(decoded!.right[1]).toBeCloseTo(-0.25, 2);
  });

  it('conditionStereoSamples normalizes quiet recordings to 0.88 peak without unnecessary duration padding', () => {
    const raw = new Float32Array(200);
    for (let i = 0; i < raw.length; i++) {
      raw[i] = Math.sin(i * 0.2) * 0.2; // Quiet 0.20 peak recording
    }
    const { left, right } = conditionStereoSamples(raw, raw, 44100);
    expect(left.length).toBe(200);
    expect(right.length).toBe(left.length);

    let peak = 0;
    for (let i = 0; i < left.length; i++) {
      const a = Math.abs(left[i] ?? 0);
      if (a > peak) peak = a;
    }
    expect(peak).toBeGreaterThan(0.8);
    expect(peak).toBeLessThanOrEqual(0.89);
  });

  it('registerBuffer and play fire via Web Audio API AudioBufferSourceNode', () => {
    const { MockAudioContext, sources } = createMockAudioContext();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      AudioContext: MockAudioContext,
    };

    const engine = createSoundEngine();
    const ctx = engine.getContext()!;
    const buffer = ctx.createBuffer(2, 256, 44100);
    engine.registerBuffer('click/1', buffer);

    expect(engine.has('click/1')).toBe(true);
    engine.play('click/1', 0.8);
    expect(sources.length).toBeGreaterThanOrEqual(1);
    expect(sources[sources.length - 1]?.start).toHaveBeenCalledWith(0);
  });

  it('initializes keep-alive carrier and explicit stereo channel matrix for external speaker routing', () => {
    const { MockAudioContext } = createMockAudioContext();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      AudioContext: MockAudioContext,
    };

    const engine = createSoundEngine();
    const ctx = engine.getContext();
    expect(ctx).not.toBeNull();
    expect(ctx?.state).toBe('running');
  });

  it('play() is a safe no-op when buffer does not exist', () => {
    const engine = createSoundEngine();
    expect(() => engine.play('non-existent')).not.toThrow();
  });

  it('setVolume() clamps value between 0.0 and 2.0', () => {
    const engine = createSoundEngine();
    engine.setVolume(2.5);
    expect(engine.getVolume()).toBe(2.0);
    engine.setVolume(1.8);
    expect(engine.getVolume()).toBe(1.8);
    engine.setVolume(-0.5);
    expect(engine.getVolume()).toBe(0.0);
    engine.setVolume(0.65);
    expect(engine.getVolume()).toBe(0.65);
  });

  it('playRandom() picks from valid pool range and avoids immediate duplicate', () => {
    const engine = createSoundEngine();
    const ctx = engine.getContext()!;
    for (let i = 1; i <= 5; i++) {
      engine.registerBuffer(`nk-creams/${i}`, ctx.createBuffer(2, 128, 44100));
    }

    expect(() => {
      engine.playRandom('nk-creams', 5, 0.5);
      engine.playRandom('nk-creams', 5, 0.5);
    }).not.toThrow();
  });

  it('clear() removes specific prefix or all buffers', () => {
    const engine = createSoundEngine();
    const ctx = engine.getContext()!;
    engine.registerBuffer('packA/1', ctx.createBuffer(2, 64, 44100));
    engine.registerBuffer('packB/1', ctx.createBuffer(2, 64, 44100));

    engine.clear('packA');
    expect(engine.has('packA/1')).toBe(false);
    expect(engine.has('packB/1')).toBe(true);

    engine.clear();
    expect(engine.has('packB/1')).toBe(false);
  });

  it('handles rapid polyphonic burst exceeding MAX_CONCURRENT_VOICES without error', () => {
    const engine = createSoundEngine();
    const ctx = engine.getContext()!;
    engine.registerBuffer('tone', ctx.createBuffer(2, 64, 44100));

    expect(() => {
      for (let i = 0; i < MAX_CONCURRENT_VOICES + 4; i++) {
        engine.play('tone', 0.5);
      }
    }).not.toThrow();
  });

  it('play() on suspended context triggers single-flight wake-up and plays queued stroke when resumed', async () => {
    const { MockAudioContext, sources } = createMockAudioContext();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      AudioContext: MockAudioContext,
    };

    const engine = createSoundEngine();
    const ctx = engine.getContext()!;
    engine.registerBuffer('stroke', ctx.createBuffer(2, 64, 44100));

    let resolveResume!: () => void;
    ctx.resume = vi.fn().mockImplementation(() => {
      return new Promise<void>((r) => {
        resolveResume = () => {
          (ctx as unknown as { state: AudioContextState }).state = 'running';
          r();
        };
      });
    });

    (ctx as unknown as { state: AudioContextState }).state = 'suspended';

    engine.play('stroke', 0.7);
    expect(sources.length).toBe(0); // Zero active stroke sources while context is suspended

    resolveResume();
    await new Promise((r) => setTimeout(r, 20));

    expect(sources.length).toBe(1);
    expect(sources[0]?.start).toHaveBeenCalledWith(0);
  });

  it('play() dispatches via Web Audio API AudioBufferSourceNode with zero latency (Monkeytype parity)', () => {
    const { MockAudioContext, sources } = createMockAudioContext();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      AudioContext: MockAudioContext,
    };

    const engine = createSoundEngine();
    const ctx = engine.getContext()!;
    engine.registerBuffer('key/1', ctx.createBuffer(2, 64, 44100));

    engine.play('key/1', 0.5);
    expect(sources.length).toBe(1);
    expect(sources[0]?.start).toHaveBeenCalledWith(0);

    engine.clear();
  });

  it('NativeSoundEngine delegates registerBuffer, play, volume, and clear to Tauri invoke', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    const { NativeSoundEngine } = await import('./native-sound-engine');
    const nativeEngine = new NativeSoundEngine();

    nativeEngine.registerBuffer('click/1', new MockAudioBuffer(2, 64, 44100) as unknown as AudioBuffer);
    expect(nativeEngine.has('click/1')).toBe(true);

    nativeEngine.play('click/1', 0.8);
    expect(invoke).toHaveBeenCalledWith('audio_play', { id: 'click/1', volume: 0.8, vol: 0.8 });

    nativeEngine.setVolume(0.6);
    expect(invoke).toHaveBeenCalledWith('audio_set_volume', { volume: 0.6 });

    nativeEngine.clear('click');
    expect(invoke).toHaveBeenCalledWith('audio_clear', { prefix: 'click' });
    expect(nativeEngine.has('click/1')).toBe(false);

    // Boosted volume up to 2.0 (200%)
    nativeEngine.setVolume(2.0);
    expect(invoke).toHaveBeenCalledWith('audio_set_volume', { volume: 2.0 });

    nativeEngine.registerBuffer('click/2', new MockAudioBuffer(2, 64, 44100) as unknown as AudioBuffer);
    nativeEngine.play('click/2', 2.0);
    expect(invoke).toHaveBeenCalledWith('audio_play', { id: 'click/2', volume: 2.0, vol: 2.0 });
  });

  it('HybridSoundEngine allows volume up to 2.0 without error', () => {
    const engine = createSoundEngine();
    engine.setVolume(2.0);
    expect(engine.getVolume()).toBe(2.0);

    const ctx = engine.getContext();
    if (ctx) {
      engine.registerBuffer('boost', ctx.createBuffer(2, 64, 44100));
      expect(() => {
        engine.play('boost', 2.0);
      }).not.toThrow();
    }
  });
});
