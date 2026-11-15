import { describe, it, expect } from 'vitest';
import { audioBufferToWavBytes } from './wav-encoder.js';

class TestAudioBuffer {
  readonly numberOfChannels: number;
  readonly length: number;
  readonly sampleRate: number;
  readonly duration: number;
  private readonly channels: Float32Array[];

  constructor(numberOfChannels = 2, length = 10, sampleRate = 44100) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channels = [new Float32Array(length), new Float32Array(length)];
  }

  getChannelData(channel = 0): Float32Array {
    return this.channels[channel] ?? this.channels[0]!;
  }
}

describe('audioBufferToWavBytes', () => {
  it('encodes an AudioBuffer into a valid 16-bit PCM RIFF WAVE header and payload', () => {
    const buffer = new TestAudioBuffer(2, 4, 48000) as unknown as AudioBuffer;
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    left[0] = 0.5;
    right[0] = -0.5;

    const wavBytes = audioBufferToWavBytes(buffer);
    expect(wavBytes).toBeInstanceOf(Uint8Array);
    // Header size (44) + data (4 frames * 2 channels * 2 bytes = 16 bytes) = 60 bytes
    expect(wavBytes.length).toBe(44 + 16);

    const view = new DataView(wavBytes.buffer);
    // RIFF magic
    expect(view.getUint32(0, false)).toBe(0x52494646);
    // WAVE magic
    expect(view.getUint32(8, false)).toBe(0x57415645);
    // fmt magic
    expect(view.getUint32(12, false)).toBe(0x666d7420);
    // PCM format (1)
    expect(view.getUint16(20, true)).toBe(1);
    // Stereo (2)
    expect(view.getUint16(22, true)).toBe(2);
    // Sample rate (48000)
    expect(view.getUint32(24, true)).toBe(48000);
    // Bits per sample (16)
    expect(view.getUint16(34, true)).toBe(16);
    // data magic
    expect(view.getUint32(36, false)).toBe(0x64617461);
    // Data size (16)
    expect(view.getUint32(40, true)).toBe(16);

    // First sample values
    const s0Left = view.getInt16(44, true);
    const s0Right = view.getInt16(46, true);
    expect(s0Left).toBeGreaterThan(16000);
    expect(s0Right).toBeLessThan(-16000);
  });
});

