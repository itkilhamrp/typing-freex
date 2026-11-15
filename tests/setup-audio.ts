/**
 * @file setup-audio.ts
 * @description Headless Web Audio API polyfill/mock for Vitest and Happy-DOM.
 * Guarantees zero ReferenceError when modules import official zzfx or AudioContext in tests.
 */

if (typeof globalThis.AudioContext === "undefined") {
  class MockAudioBuffer {
    numberOfChannels: number;
    length: number;
    sampleRate: number;
    private channels: Float32Array[];

    constructor(channels: number, length: number, sampleRate: number) {
      this.numberOfChannels = channels;
      this.length = length;
      this.sampleRate = sampleRate;
      this.channels = Array.from({ length: channels }, () => new Float32Array(length));
    }

    getChannelData(channel: number): Float32Array {
      return this.channels[channel] || new Float32Array(this.length);
    }
  }

  class MockAudioNode {
    connect(target?: unknown): unknown {
      return target || this;
    }
    disconnect(): void {}
  }

  class MockAudioBufferSourceNode extends MockAudioNode {
    buffer: MockAudioBuffer | null = null;
    playbackRate = { value: 1 };
    loop = false;
    onended: (() => void) | null = null;
    start(): void {}
    stop(): void {}
  }

  class MockGainNode extends MockAudioNode {
    gain = { value: 1 };
  }

  class MockStereoPannerNode extends MockAudioNode {
    pan = { value: 0 };
    constructor(_ctx?: unknown, options?: { pan?: number }) {
      super();
      if (options?.pan !== undefined) {
        this.pan.value = options.pan;
      }
    }
  }

  class MockAudioContext {
    sampleRate = 44100;
    state: AudioContextState = "running";
    destination = new MockAudioNode();

    createBuffer(channels: number, length: number, sampleRate: number): MockAudioBuffer {
      return new MockAudioBuffer(channels, length, sampleRate);
    }

    createBufferSource(): MockAudioBufferSourceNode {
      return new MockAudioBufferSourceNode();
    }

    createGain(): MockGainNode {
      return new MockGainNode();
    }

    resume(): Promise<void> {
      this.state = "running";
      return Promise.resolve();
    }

    close(): Promise<void> {
      this.state = "closed";
      return Promise.resolve();
    }
  }

  // Bind to global test environment
  (globalThis as unknown as { AudioContext: unknown }).AudioContext = MockAudioContext;
  (globalThis as unknown as { webkitAudioContext: unknown }).webkitAudioContext = MockAudioContext;
  (globalThis as unknown as { StereoPannerNode: unknown }).StereoPannerNode = MockStereoPannerNode;
}
