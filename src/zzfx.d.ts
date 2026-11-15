/**
 * @file zzfx.d.ts
 * @description Type definitions for KilledByAPixel/ZzFX official npm package (v1.4.0).
 */

declare module "zzfx" {
  export type ZzFXSoundParams = [
    volume?: number,        // 0: volume (0..1)
    randomness?: number,    // 1: randomness (0..1)
    frequency?: number,     // 2: frequency (Hz)
    attack?: number,        // 3: attack duration (s)
    sustain?: number,       // 4: sustain duration (s)
    release?: number,       // 5: release duration (s)
    shape?: number,         // 6: waveform shape: 0=sine, 1=triangle, 2=saw, 3=tan, 4=noise, 5=square
    shapeCurve?: number,    // 7: shape curve / envelope curvature
    slide?: number,         // 8: pitch slide (Hz/s)
    deltaSlide?: number,    // 9: slide acceleration
    pitchJump?: number,     // 10: pitch jump (Hz or semitone shift)
    pitchJumpTime?: number, // 11: pitch jump time offset (s)
    repeatTime?: number,    // 12: repeat interval (s)
    noise?: number,         // 13: noise blend (0..1)
    modulation?: number,    // 14: frequency modulation rate
    bitCrush?: number,      // 15: bit crush reduction
    delay?: number,         // 16: echo delay time (s)
    sustainVolume?: number, // 17: sustain volume level (0..1)
    decay?: number,         // 18: decay duration (s)
    tremolo?: number,       // 19: tremolo depth (0..1)
    filter?: number,        // 20: biquad filter
  ];

  export interface ZZFXEngine {
    volume: number;
    sampleRate: number;
    audioContext: AudioContext;
    play: (...parameters: (number | undefined)[]) => AudioBufferSourceNode | undefined;
    playSamples: (
      sampleChannels: Float32Array[],
      volumeScale?: number,
      rate?: number,
      pan?: number,
      loop?: boolean,
    ) => AudioBufferSourceNode;
    buildSamples: (
      volume?: number,
      randomness?: number,
      frequency?: number,
      attack?: number,
      sustain?: number,
      release?: number,
      shape?: number,
      shapeCurve?: number,
      slide?: number,
      deltaSlide?: number,
      pitchJump?: number,
      pitchJumpTime?: number,
      repeatTime?: number,
      noise?: number,
      modulation?: number,
      bitCrush?: number,
      delay?: number,
      sustainVolume?: number,
      decay?: number,
      tremolo?: number,
      filter?: number,
    ) => Float32Array;
    getNote: (semitoneOffset?: number, rootNoteFrequency?: number) => number;
  }

  export class ZZFXSound {
    constructor(zzfxSound?: (number | undefined)[]);
    zzfxSound: (number | undefined)[];
    randomness: number;
    samples: Float32Array;
    source?: AudioBufferSourceNode;
    play: (
      volume?: number,
      pitch?: number,
      randomnessScale?: number,
      pan?: number,
      loop?: boolean,
    ) => AudioBufferSourceNode | undefined;
  }

  export const ZZFX: ZZFXEngine;
  export function zzfx(
    ...parameters: (number | undefined)[]
  ): AudioBufferSourceNode | undefined;
}
