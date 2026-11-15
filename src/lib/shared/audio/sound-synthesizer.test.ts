import { describe, it, expect } from 'vitest';
import {
  MONKEYTYPE_NOTES,
  CODE_TO_NOTE,
  PENTATONIC_VALID_NOTES,
  WHOLETONE_VALID_NOTES,
  synthesizeTone,
  synthesizeScale,
  bakeSynthesizedPacks,
} from './sound-synthesizer';

function createFakeAudioContext(): AudioContext {
  return {
    sampleRate: 44100,
    createBuffer(channels: number, length: number, sampleRate: number) {
      const ch0 = new Float32Array(length);
      const ch1 = new Float32Array(length);
      return {
        numberOfChannels: channels,
        length,
        sampleRate,
        duration: length / sampleRate,
        getChannelData(ch = 0) {
          return ch === 0 ? ch0 : ch1;
        },
      } as unknown as AudioBuffer;
    },
  } as unknown as AudioContext;
}

describe('sound-synthesizer (Monkeytype Official Note & Scale Synthesis)', () => {
  it('contains exact Monkeytype note frequencies and keyboard code mappings', () => {
    expect(MONKEYTYPE_NOTES.C[4]).toBeCloseTo(261.63, 2);
    expect(CODE_TO_NOTE['KeyZ']?.(4)).toBeCloseTo(261.63, 2);
    expect(CODE_TO_NOTE['Space']?.(3)).toBeCloseTo(261.63, 2);
    expect(PENTATONIC_VALID_NOTES.length).toBe(5);
    expect(WHOLETONE_VALID_NOTES.length).toBe(6);
  });

  it('synthesizeTone generates clean non-clipping stereo PCM samples for all oscillator shapes', () => {
    const ctx = createFakeAudioContext();

    for (const shape of ['sine', 'sawtooth', 'square', 'triangle'] as const) {
      const buf = synthesizeTone(ctx, shape, 440, 0.12);
      expect(buf.numberOfChannels).toBe(2);

      const data = buf.getChannelData(0);
      let maxAbs = 0;
      for (let i = 0; i < data.length; i++) {
        const val = data[i] ?? 0;
        const abs = Math.abs(val);
        if (abs > maxAbs) maxAbs = abs;
        expect(val).toBeGreaterThanOrEqual(-0.3);
        expect(val).toBeLessThanOrEqual(0.3);
      }
      expect(maxAbs).toBeGreaterThan(0.1);
    }
  });

  it('synthesizeScale produces multi-note sequences for pentatonic and wholetone', () => {
    const ctx = createFakeAudioContext();
    const pent = synthesizeScale(ctx, 'pentatonic', 330, 0.08);
    const whole = synthesizeScale(ctx, 'wholetone', 330, 0.08);
    expect(pent.length).toBeGreaterThanOrEqual(5);
    expect(whole.length).toBeGreaterThanOrEqual(6);
  });

  it('bakeSynthesizedPacks pre-bakes all oscillator and scale packs', () => {
    const ctx = createFakeAudioContext();
    const map = bakeSynthesizedPacks(ctx);
    expect(map.has('sine')).toBe(true);
    expect(map.has('pentatonic/1')).toBe(true);
    expect(map.has('wholetone/1')).toBe(true);
  });
});
