/**
 * Official Monkeytype Oscillator & Musical Scale Engine
 * Ported directly from monkeytype/frontend/src/ts/controllers/sound-controller.ts
 * and monkeytype/frontend/src/ts/constants/sounds.ts.
 *
 * Pure Mechanism Layer — zero Svelte, DOM UI, or reactive store dependencies.
 */

import { getAudioContext as getSharedZzfxAudioContext } from './zzfx.js';

export type OscillatorShape = 'sine' | 'sawtooth' | 'square' | 'triangle';

export type ValidNotes =
  | 'C'
  | 'Db'
  | 'D'
  | 'Eb'
  | 'E'
  | 'F'
  | 'Gb'
  | 'G'
  | 'Ab'
  | 'A'
  | 'Bb'
  | 'B';

export interface EnvelopeParams {
  readonly attack: number;
  readonly decay: number;
  readonly sustain: number;
  readonly release: number;
}

export const DEFAULT_SAMPLE_RATE = 44100;

/** Exact Monkeytype frequency table across 9 octaves */
export const MONKEYTYPE_NOTES: Readonly<Record<ValidNotes, readonly number[]>> = {
  C: [16.35, 32.7, 65.41, 130.81, 261.63, 523.25, 1046.5, 2093.0, 4186.01],
  Db: [17.32, 34.65, 69.3, 138.59, 277.18, 554.37, 1108.73, 2217.46, 4434.92],
  D: [18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32, 4698.64],
  Eb: [19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02, 4978.03],
  E: [20.6, 41.2, 82.41, 164.81, 329.63, 659.26, 1318.51, 2637.02],
  F: [21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83],
  Gb: [23.12, 46.25, 92.5, 185.0, 369.99, 739.99, 1479.98, 2959.96],
  G: [24.5, 49.0, 98.0, 196.0, 392.0, 783.99, 1567.98, 3135.96],
  Ab: [25.96, 51.91, 103.83, 207.65, 415.3, 830.61, 1661.22, 3322.44],
  A: [27.5, 55.0, 110.0, 220.0, 440.0, 880.0, 1760.0, 3520.0],
  Bb: [29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31],
  B: [30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07],
};

export const PENTATONIC_VALID_NOTES: readonly ValidNotes[] = ['C', 'D', 'E', 'G', 'A'];
export const WHOLETONE_VALID_NOTES: readonly ValidNotes[] = ['C', 'D', 'E', 'Gb', 'Ab', 'Bb'];

type GetNoteFrequencyCallback = (octave: number) => number;

function bindToNote(
  noteFrequencies: readonly number[],
  octaveOffset = 0
): GetNoteFrequencyCallback {
  return (octave: number): number => {
    return noteFrequencies[octave + octaveOffset] ?? 261.63;
  };
}

/** Exact Monkeytype keycode-to-note mapping for oscillator modes */
export const CODE_TO_NOTE: Readonly<Record<string, GetNoteFrequencyCallback>> = {
  KeyZ: bindToNote(MONKEYTYPE_NOTES.C),
  KeyS: bindToNote(MONKEYTYPE_NOTES.Db),
  KeyX: bindToNote(MONKEYTYPE_NOTES.D),
  KeyD: bindToNote(MONKEYTYPE_NOTES.Eb),
  KeyC: bindToNote(MONKEYTYPE_NOTES.E),
  KeyV: bindToNote(MONKEYTYPE_NOTES.F),
  KeyG: bindToNote(MONKEYTYPE_NOTES.Gb),
  KeyB: bindToNote(MONKEYTYPE_NOTES.G),
  KeyH: bindToNote(MONKEYTYPE_NOTES.Ab),
  KeyN: bindToNote(MONKEYTYPE_NOTES.A),
  KeyJ: bindToNote(MONKEYTYPE_NOTES.Bb),
  KeyM: bindToNote(MONKEYTYPE_NOTES.B),
  Comma: bindToNote(MONKEYTYPE_NOTES.C, 1),
  KeyL: bindToNote(MONKEYTYPE_NOTES.Db, 1),
  Period: bindToNote(MONKEYTYPE_NOTES.D, 1),
  Semicolon: bindToNote(MONKEYTYPE_NOTES.Eb, 1),
  Slash: bindToNote(MONKEYTYPE_NOTES.E, 1),
  KeyQ: bindToNote(MONKEYTYPE_NOTES.C, 1),
  Digit2: bindToNote(MONKEYTYPE_NOTES.Db, 1),
  KeyW: bindToNote(MONKEYTYPE_NOTES.D, 1),
  Digit3: bindToNote(MONKEYTYPE_NOTES.Eb, 1),
  KeyE: bindToNote(MONKEYTYPE_NOTES.E, 1),
  KeyR: bindToNote(MONKEYTYPE_NOTES.F, 1),
  Digit5: bindToNote(MONKEYTYPE_NOTES.Gb, 1),
  KeyT: bindToNote(MONKEYTYPE_NOTES.G, 1),
  Digit6: bindToNote(MONKEYTYPE_NOTES.Ab, 1),
  KeyY: bindToNote(MONKEYTYPE_NOTES.A, 1),
  Digit7: bindToNote(MONKEYTYPE_NOTES.Bb, 1),
  KeyU: bindToNote(MONKEYTYPE_NOTES.B, 1),
  KeyI: bindToNote(MONKEYTYPE_NOTES.C, 2),
  Digit9: bindToNote(MONKEYTYPE_NOTES.Db, 2),
  KeyO: bindToNote(MONKEYTYPE_NOTES.D, 2),
  Digit0: bindToNote(MONKEYTYPE_NOTES.Eb, 2),
  KeyP: bindToNote(MONKEYTYPE_NOTES.E, 2),
  BracketLeft: bindToNote(MONKEYTYPE_NOTES.F, 2),
  Equal: bindToNote(MONKEYTYPE_NOTES.Gb, 2),
  BracketRight: bindToNote(MONKEYTYPE_NOTES.G, 2),
  KeyA: bindToNote(MONKEYTYPE_NOTES.C, 1),
  KeyF: bindToNote(MONKEYTYPE_NOTES.F, 1),
  KeyK: bindToNote(MONKEYTYPE_NOTES.A, 1),
  Space: bindToNote(MONKEYTYPE_NOTES.C, 1),
};

/**
 * Maps a keyboard `event.code` to a 1-based variant index `[1..variants]`
 * so oscillator packs (`sine`, `sawtooth`, `square`, `triangle`) play key-dependent
 * pitches through the external-speaker-safe 16-bit Stereo WAV pool.
 */
export function resolveKeyNoteVariant(keyCode: string | undefined, variants: number): number {
  const count = Math.max(1, variants);
  if (!keyCode) return 1;
  let hash = 0;
  for (let i = 0; i < keyCode.length; i++) {
    hash = (hash * 31 + keyCode.charCodeAt(i)) >>> 0;
  }
  return (hash % count) + 1;
}

export interface ScaleData {
  octave: number;
  direction: number;
  position: number;
}

const scaleStates: Record<'pentatonic' | 'wholetone', ScaleData> = {
  pentatonic: { position: 0, octave: 4, direction: 1 },
  wholetone: { position: 0, octave: 4, direction: 1 },
};

/**
 * Exact Monkeytype `playNote` implementation using Web Audio API OscillatorNode.
 */
export function playMonkeytypeNote(
  oscillatorType: OscillatorShape,
  volume: number,
  keyCode = 'KeyQ',
  shiftKey = false,
  ctxOverride?: AudioContext | null
): boolean {
  const ctx = ctxOverride ?? getSharedZzfxAudioContext();
  if (!ctx || typeof ctx.createOscillator !== 'function') return false;

  try {
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    const resolver = CODE_TO_NOTE[keyCode] ?? CODE_TO_NOTE.KeyQ!;
    const baseOctave = 3;
    const octave = baseOctave + (shiftKey ? 1 : 0);
    const frequency = resolver(octave);

    const oscillatorNode = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillatorNode.type = oscillatorType;
    gainNode.gain.value = Math.max(0, Math.min(1, volume)) / 10;

    oscillatorNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime || 0;
    oscillatorNode.frequency.value = frequency;
    oscillatorNode.start(now);
    gainNode.gain.setTargetAtTime(0, now, 0.15);
    oscillatorNode.stop(now + 0.5);
    return true;
  } catch {
    return false;
  }
}

/**
 * Exact Monkeytype `playScale` implementation for pentatonic & wholetone scales.
 */
export function playMonkeytypeScale(
  scale: 'pentatonic' | 'wholetone',
  volume: number,
  ctxOverride?: AudioContext | null
): boolean {
  const ctx = ctxOverride ?? getSharedZzfxAudioContext();
  if (!ctx || typeof ctx.createOscillator !== 'function') return false;

  try {
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    const scaleMeta = scaleStates[scale];
    const validNotes =
      scale === 'pentatonic' ? PENTATONIC_VALID_NOTES : WHOLETONE_VALID_NOTES;

    if (Math.random() < 0.5) {
      scaleMeta.octave += scaleMeta.direction;
    }
    if (scaleMeta.octave >= 6) {
      scaleMeta.direction = -1;
    }
    if (scaleMeta.octave <= 4) {
      scaleMeta.direction = 1;
    }

    const note = validNotes[Math.floor(Math.random() * validNotes.length)] ?? 'C';
    const currentFrequency = MONKEYTYPE_NOTES[note][scaleMeta.octave] ?? 261.63;

    const oscillatorNode = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillatorNode.type = 'sine';
    gainNode.gain.value = Math.max(0, Math.min(1, volume)) / 10;

    oscillatorNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime || 0;
    oscillatorNode.frequency.value = currentFrequency;
    oscillatorNode.start(now);
    gainNode.gain.setTargetAtTime(0, now, 0.3);
    oscillatorNode.stop(now + 2);
    return true;
  } catch {
    return false;
  }
}

/** Convert Float32Array into a 2-channel Stereo Web Audio API AudioBuffer */
export function samplesToAudioBuffer(
  ctx: BaseAudioContext,
  samples: Float32Array,
  sampleRate = DEFAULT_SAMPLE_RATE
): AudioBuffer {
  const buffer = ctx.createBuffer(2, samples.length, sampleRate);
  buffer.getChannelData(0).set(samples);
  if (buffer.numberOfChannels > 1) {
    try {
      buffer.getChannelData(1).set(samples);
    } catch {
      // Fallback for single-channel mock in unit tests
    }
  }
  return buffer;
}

/** Generate a clean band-limited oscillator AudioBuffer for 16-bit Stereo WAV pool & unit tests */
export function synthesizeTone(
  ctx: BaseAudioContext,
  shape: OscillatorShape,
  frequency: number,
  duration = 0.2,
  envelope: EnvelopeParams = { attack: 0.003, decay: 0.04, sustain: 0.25, release: 0.08 }
): AudioBuffer {
  const sampleRate = ctx.sampleRate || DEFAULT_SAMPLE_RATE;
  const totalSamples = Math.max(128, Math.floor(sampleRate * duration));
  const data = new Float32Array(totalSamples);

  const attackSamples = Math.max(1, Math.floor(envelope.attack * sampleRate));
  let phase = 0;
  const phaseStep = (2 * Math.PI * frequency) / sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Exponential decay matching Monkeytype's setTargetAtTime(0, now, 0.08)
    const env = i < attackSamples ? i / attackSamples : Math.exp(-t / 0.085);
    const raw =
      shape === 'sine'
        ? Math.sin(phase)
        : shape === 'triangle'
          ? Math.sin(phase) - (1 / 9) * Math.sin(3 * phase) + (1 / 25) * Math.sin(5 * phase)
          : shape === 'square'
            ? (Math.sin(phase) + (1 / 3) * Math.sin(3 * phase) + (1 / 5) * Math.sin(5 * phase)) * 0.65
            : (Math.sin(phase) - 0.5 * Math.sin(2 * phase) + (1 / 3) * Math.sin(3 * phase)) * 0.65;

    data[i] = raw * env * 0.25;
    phase += phaseStep;
  }

  return samplesToAudioBuffer(ctx, data, sampleRate);
}

/** Generate scale note AudioBuffers across octaves 4 & 5 */
export function synthesizeScale(
  ctx: BaseAudioContext,
  scale: 'pentatonic' | 'wholetone',
  _baseFrequency = 261.63,
  noteDuration = 0.2
): AudioBuffer[] {
  const notes = scale === 'pentatonic' ? PENTATONIC_VALID_NOTES : WHOLETONE_VALID_NOTES;
  const frequencies: number[] = [];
  for (const n of notes) {
    frequencies.push(MONKEYTYPE_NOTES[n][4] ?? 261.63);
  }
  for (let i = notes.length - 1; i >= 0; i--) {
    const n = notes[i] ?? 'C';
    frequencies.push(MONKEYTYPE_NOTES[n][5] ?? 523.25);
  }
  return frequencies.map((freq) => synthesizeTone(ctx, 'sine', freq, noteDuration));
}

/** Synthesize AudioBuffers for oscillator & scale packs (which SoundEngine wraps into 16-bit Stereo WAV Blobs) */
export function synthesizePackBuffers(
  ctx: BaseAudioContext,
  packId: string,
  variants: number
): Map<string, AudioBuffer> {
  const result = new Map<string, AudioBuffer>();

  if (packId === 'sine' || packId === 'sawtooth' || packId === 'square' || packId === 'triangle') {
    const count = Math.max(1, variants);
    const noteKeys: ValidNotes[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
    for (let i = 0; i < count; i++) {
      const note = noteKeys[i % noteKeys.length] ?? 'C';
      const octave = i >= 7 ? 5 : 4;
      const freq = MONKEYTYPE_NOTES[note][octave] ?? 261.63;
      const buf = synthesizeTone(ctx, packId, freq, 0.2);
      result.set(`${packId}/${i + 1}`, buf);
      if (i === 0) {
        result.set(packId, buf);
      }
    }
    return result;
  }

  if (packId === 'pentatonic' || packId === 'wholetone') {
    const buffers = synthesizeScale(ctx, packId, 261.63, 0.2);
    buffers.forEach((buf, idx) => {
      result.set(`${packId}/${idx + 1}`, buf);
    });
    if (buffers[0]) {
      result.set(packId, buffers[0]);
    }
    return result;
  }

  const count = Math.max(1, variants);
  for (let i = 1; i <= count; i++) {
    const freq = 220 + i * 25;
    const buf = synthesizeTone(ctx, 'sine', freq, 0.15);
    result.set(`${packId}/${i}`, buf);
    if (i === 1) {
      result.set(packId, buf);
    }
  }
  return result;
}

/** Pre-bake oscillator & scale packs */
export function bakeSynthesizedPacks(ctx: BaseAudioContext): Map<string, AudioBuffer> {
  const all = new Map<string, AudioBuffer>();
  const synthIds: ReadonlyArray<{ id: string; variants: number }> = [
    { id: 'sine', variants: 8 },
    { id: 'sawtooth', variants: 8 },
    { id: 'square', variants: 8 },
    { id: 'triangle', variants: 8 },
    { id: 'pentatonic', variants: 10 },
    { id: 'wholetone', variants: 12 },
    { id: 'error-triangle', variants: 1 },
    { id: 'error-square', variants: 1 },
    { id: 'time-warning', variants: 1 },
  ];

  for (const item of synthIds) {
    const baked = synthesizePackBuffers(ctx, item.id, item.variants);
    for (const [k, v] of baked) {
      all.set(k, v);
    }
  }
  return all;
}
