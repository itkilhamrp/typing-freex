import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSubAudibleDitherBuffer,
  startKeepAliveCarrier,
  ensureContextRunning,
  setupDeviceChangeWatcher,
  SUB_AUDIBLE_DITHER_AMPLITUDE,
} from './output-route-guard.js';

class MockAudioBuffer {
  readonly numberOfChannels: number;
  readonly length: number;
  readonly sampleRate: number;
  readonly duration: number;
  private readonly channels: Float32Array[];

  constructor(numberOfChannels = 2, length = 44100, sampleRate = 44100) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }

  getChannelData(channel = 0): Float32Array {
    return this.channels[channel] ?? this.channels[0]!;
  }
}

function createMockAudioContext(initialState: AudioContextState = 'suspended') {
  let resumeCallCount = 0;
  let resumeResolve: (() => void) | null = null;

  const sources: Array<{
    buffer: AudioBuffer | null;
    loop: boolean;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];

  class MockAudioContext {
    state: AudioContextState = initialState;
    sampleRate = 44100;
    destination = {} as AudioDestinationNode;

    createGain() {
      return {
        gain: { value: 1 },
        channelCount: 2,
        channelCountMode: 'explicit' as ChannelCountMode,
        channelInterpretation: 'speakers' as ChannelInterpretation,
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
    }

    createBuffer(channels: number, length: number, sampleRate: number) {
      return new MockAudioBuffer(channels, length, sampleRate) as unknown as AudioBuffer;
    }

    createBufferSource() {
      const src = {
        buffer: null as AudioBuffer | null,
        loop: false,
        start: vi.fn(),
        stop: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      sources.push(src);
      return src;
    }

    resume() {
      resumeCallCount++;
      return new Promise<void>((resolve) => {
        resumeResolve = () => {
          this.state = 'running';
          resolve();
        };
        // Auto resolve microtask
        queueMicrotask(() => {
          if (resumeResolve) resumeResolve();
        });
      });
    }
  }

  return {
    ctx: new MockAudioContext() as unknown as AudioContext,
    sources,
    getResumeCallCount: () => resumeCallCount,
  };
}

describe('output-route-guard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('createSubAudibleDitherBuffer generates non-zero TPDF dither samples within amplitude bounds', () => {
    const { ctx } = createMockAudioContext('running');
    const buf = createSubAudibleDitherBuffer(ctx, 0.1);

    expect(buf.numberOfChannels).toBe(2);
    const left = buf.getChannelData(0);
    const right = buf.getChannelData(1);

    let hasNonZeroLeft = false;
    let hasNonZeroRight = false;
    let maxAbs = 0;

    for (let i = 0; i < left.length; i++) {
      const valL = left[i] ?? 0;
      const valR = right[i] ?? 0;
      if (valL !== 0) hasNonZeroLeft = true;
      if (valR !== 0) hasNonZeroRight = true;
      if (Math.abs(valL) > maxAbs) maxAbs = Math.abs(valL);
      if (Math.abs(valR) > maxAbs) maxAbs = Math.abs(valR);
    }

    expect(hasNonZeroLeft).toBe(true);
    expect(hasNonZeroRight).toBe(true);
    // Peak TPDF sum of two uniform [-0.5, 0.5] * amplitude <= amplitude
    expect(maxAbs).toBeLessThanOrEqual(SUB_AUDIBLE_DITHER_AMPLITUDE + 0.000001);
  });

  it('startKeepAliveCarrier starts a looping buffer source and cleans up on stop', () => {
    const { ctx, sources } = createMockAudioContext('running');
    const handle = startKeepAliveCarrier(ctx);

    expect(sources.length).toBe(1);
    const src = sources[0]!;
    expect(src.loop).toBe(true);
    expect(src.start).toHaveBeenCalledWith(0);

    handle.stop();
    expect(src.stop).toHaveBeenCalled();
    expect(src.disconnect).toHaveBeenCalled();
  });

  it('ensureContextRunning consolidates concurrent resume calls into single-flight promise', async () => {
    const { ctx, getResumeCallCount } = createMockAudioContext('suspended');

    const p1 = ensureContextRunning(ctx);
    const p2 = ensureContextRunning(ctx);
    const p3 = ensureContextRunning(ctx);

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(r3).toBe(true);
    expect(ctx.state).toBe('running');
    expect(getResumeCallCount()).toBe(1);
  });

  it('setupDeviceChangeWatcher debounces device changes and responds to focus/visibility', async () => {
    let changeCount = 0;
    const mediaListeners: Record<string, () => void> = {};
    const windowListeners: Record<string, () => void> = {};
    const docListeners: Record<string, () => void> = {};

    const mockMediaDevices = {
      addEventListener: vi.fn((event: string, cb: () => void) => {
        mediaListeners[event] = cb;
      }),
      removeEventListener: vi.fn((event: string) => {
        delete mediaListeners[event];
      }),
    };

    const windowSpy = vi.spyOn(window, 'addEventListener').mockImplementation((event, cb) => {
      windowListeners[event] = cb as () => void;
    });
    const windowRemoveSpy = vi.spyOn(window, 'removeEventListener').mockImplementation((event) => {
      delete windowListeners[event];
    });

    const docSpy = vi.spyOn(document, 'addEventListener').mockImplementation((event, cb) => {
      docListeners[event] = cb as () => void;
    });
    const docRemoveSpy = vi.spyOn(document, 'removeEventListener').mockImplementation((event) => {
      delete docListeners[event];
    });

    const originalMediaDevices = navigator.mediaDevices;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: mockMediaDevices,
      configurable: true,
      writable: true,
    });

    const cleanup = setupDeviceChangeWatcher(() => {
      changeCount++;
    }, 50);

    expect(mockMediaDevices.addEventListener).toHaveBeenCalledWith(
      'devicechange',
      expect.any(Function)
    );
    expect(window.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );

    // Fire events across different channels in rapid succession
    mediaListeners.devicechange?.();
    windowListeners.focus?.();
    docListeners.visibilitychange?.();

    expect(changeCount).toBe(0);

    await new Promise((r) => setTimeout(r, 80));
    expect(changeCount).toBe(1);

    cleanup();
    expect(mockMediaDevices.removeEventListener).toHaveBeenCalledWith(
      'devicechange',
      expect.any(Function)
    );
    expect(window.removeEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );

    windowSpy.mockRestore();
    windowRemoveSpy.mockRestore();
    docSpy.mockRestore();
    docRemoveSpy.mockRestore();

    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      configurable: true,
      writable: true,
    });
  });
});

