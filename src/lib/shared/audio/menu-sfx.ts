/**
 * Official KilledByAPixel/ZzFX + Physical Mechanical Switch Audio Synthesizer
 * Reference: https://github.com/KilledByAPixel/ZzFX
 *
 * Engineered specifically for full, realistic mechanical keyboard switch presence
 * on both built-in and EXTERNAL SPEAKERS:
 * - Uses official `zzfx` / `ZZFX` AudioContext at 44.1kHz with automatic unlock/resume
 * - Combines 3 physical acoustic layers per switch actuation:
 *   1. Tactile Leaf / Jacket Transient (1.6kHz - 2.8kHz filtered impulse)
 *   2. PBT Keycap Top-Impact Clack (520Hz -> 260Hz resonant body)
 *   3. Gasket Case Bottom-Out Thock (240Hz -> 115Hz warm external-speaker fundamental)
 */

import { zzfx, ZZFX, type ZzFXSoundParams } from 'zzfx';
import { getSharedAudioContext } from './audio-context-provider.js';
import { ensureContextRunning } from './output-route-guard.js';

let masterBus: GainNode | null = null;
let lastTickTime = 0;
let zzfxVolumeInitialized = false;

function hasWebAudioSupport(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    typeof window.AudioContext !== 'undefined' ||
    typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext !== 'undefined'
  );
}

function getAudioContext(): AudioContext | null {
  if (!hasWebAudioSupport()) return null;
  const ctx = getSharedAudioContext();
  if (ctx) {
    try {
      ZZFX.audioContext = ctx;
      ZZFX.sampleRate = ctx.sampleRate;
      if (!zzfxVolumeInitialized) {
        ZZFX.volume = 0.55;
        zzfxVolumeInitialized = true;
      }
    } catch {
      // Ignore sealed environment
    }
  }
  return ctx;
}

function getMasterOutput(ctx: AudioContext): AudioNode {
  if (masterBus && masterBus.context === ctx) {
    return masterBus;
  }
  try {
    const gain = ctx.createGain();
    gain.gain.value = 0.85;

    if (typeof ctx.createDynamicsCompressor === 'function') {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -10;
      comp.knee.value = 12;
      comp.ratio.value = 3;
      comp.attack.value = 0.001;
      comp.release.value = 0.08;
      gain.connect(comp);
      comp.connect(ctx.destination);
    } else {
      gain.connect(ctx.destination);
    }
    masterBus = gain;
    return gain;
  } catch {
    return ctx.destination;
  }
}

/**
 * Synthesizes a 100% Authentic Linear Red Mechanical Switch (Cherry MX Red / Gateron Red profile):
 * - Zero metallic click-jacket/tactile leaf snap (pure linear travel)
 * - Layer 1: Smooth POM linear stem slide & low-pass housing contact (380Hz - 720Hz)
 * - Layer 2: Deep, buttery PBT keycap & stem pole bottom-out "thock" (150Hz - 275Hz)
 * - Layer 3: Subtle linear spring upstroke top-housing return (16ms delayed micro-return)
 */
function playPhysicalSwitchProfile(options: {
  thockFreq: number;
  clackFreq: number;
  upstrokeFreq: number;
  volume: number;
  durationMs: number;
  zzfxLayer?: ZzFXSoundParams;
}): void {
  if (!hasWebAudioSupport()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      void ensureContextRunning(ctx);
    }

    const sampleRate = ctx.sampleRate || 44100;
    const totalSamples = Math.max(256, Math.floor((sampleRate * options.durationMs) / 1000));
    const buffer = ctx.createBuffer(2, totalSamples, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let phaseThock = 0;
    let phaseClack = 0;
    let phaseUpstroke = 0;
    let lpState1 = 0;
    let lpState2 = 0;
    const pitchJitter = 0.975 + Math.random() * 0.05;

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;

      // 1. Linear POM Stem Bottom-Out Cushion (Low-pass filtered warm plastic impact, no metallic click!)
      const impactEnv = Math.exp(-t * 210) * (1 - Math.exp(-t * 2400));
      const white = Math.random() * 2 - 1;
      // 2-pole warm low-pass filter (~650Hz cutoff) for genuine lubed linear switch acoustics
      lpState1 += 0.14 * (white - lpState1);
      lpState2 += 0.14 * (lpState1 - lpState2);
      const linearStemImpact = lpState2 * impactEnv * 1.35;

      // 2. Thick PBT Keycap & Polycarbonate Housing Body (340Hz -> 190Hz)
      const clackInstFreq =
        options.clackFreq * pitchJitter * (0.54 + 0.46 * Math.exp(-t * 95));
      phaseClack += (2 * Math.PI * clackInstFreq) / sampleRate;
      const clackEnv = Math.exp(-t * 88) * (1 - Math.exp(-t * 1500));
      const clackWave =
        (Math.sin(phaseClack) + 0.24 * Math.sin(phaseClack * 1.65)) * clackEnv * 0.62;

      // 3. Gasket Plate Deep Bottom-Out Thock (145Hz -> 95Hz warm resonance on external speakers)
      const thockInstFreq =
        options.thockFreq * pitchJitter * (0.52 + 0.48 * Math.exp(-t * 58));
      phaseThock += (2 * Math.PI * thockInstFreq) / sampleRate;
      const thockEnv = Math.exp(-t * 52) * (1 - Math.exp(-t * 1100));
      const thockWave = Math.tanh(Math.sin(phaseThock) * 1.4) * thockEnv * 0.85;

      // 4. Linear Red Switch Top-Housing Upstroke Return (occurs ~18ms after bottom-out)
      let upstrokeWave = 0;
      if (t > 0.017) {
        const tu = t - 0.017;
        const upFreq = options.upstrokeFreq * pitchJitter * (0.65 + 0.35 * Math.exp(-tu * 140));
        phaseUpstroke += (2 * Math.PI * upFreq) / sampleRate;
        const upEnv = Math.exp(-tu * 135) * (1 - Math.exp(-tu * 1900));
        upstrokeWave = (Math.sin(phaseUpstroke) * 0.7 + lpState2 * 0.4) * upEnv * 0.36;
      }

      const sample = Math.max(
        -0.98,
        Math.min(
          0.98,
          (linearStemImpact + clackWave + thockWave + upstrokeWave) * options.volume
        )
      );

      left[i] = sample;
      right[i] = sample * 0.98;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(getMasterOutput(ctx));
    source.start();

    if (options.zzfxLayer) {
      zzfx(...options.zzfxLayer);
    }
  } catch {
    // Ignore autoplay errors
  }
}

/**
 * Linear Red Switch subtle key step when navigating items with keyboard arrows (↑/↓).
 */
export function playMenuTick(): void {
  if (!hasWebAudioSupport()) return;
  const now = performance.now();
  if (now - lastTickTime < 35) return;
  lastTickTime = now;

  playPhysicalSwitchProfile({
    thockFreq: 175,
    clackFreq: 370,
    upstrokeFreq: 440,
    volume: 0.65,
    durationMs: 48,
    zzfxLayer: [0.16, 0.02, 240, 0.001, 0.004, 0.022, 0, 1.05, -12, 0, 0, 0, 0, 0.08, 0, 0, 0, 0.5, 0.005, 0, -520],
  });
}

/**
 * 100% Authentic Linear Red Switch actuation (buttery smooth bottom-out thock + PBT housing return).
 * Triggered ONLY on click or key press — never on hover.
 */
export function playMenuClick(): void {
  if (!hasWebAudioSupport()) return;

  playPhysicalSwitchProfile({
    thockFreq: 182,
    clackFreq: 395,
    upstrokeFreq: 475,
    volume: 0.9,
    durationMs: 62,
    zzfxLayer: [0.24, 0.02, 225, 0.001, 0.006, 0.028, 0, 1.08, -14, 0, 0, 0, 0, 0.1, 0, 0, 0, 0.58, 0.006, 0, -580],
  });
}

/**
 * Deep Lubed Stabilized Linear Red Switch Spacebar / Enter Thock for primary actions (PLAY / OK).
 */
export function playMenuConfirm(): void {
  if (!hasWebAudioSupport()) return;

  playPhysicalSwitchProfile({
    thockFreq: 148,
    clackFreq: 325,
    upstrokeFreq: 390,
    volume: 0.98,
    durationMs: 74,
    zzfxLayer: [0.3, 0.02, 185, 0.001, 0.009, 0.038, 0, 1.12, -10, 0, 0, 0, 0, 0.08, 0, 0, 0, 0.64, 0.008, 0, -480],
  });
}

/**
 * Linear Red Switch soft upstroke release for Cancel / Close actions.
 */
export function playMenuCancel(): void {
  if (!hasWebAudioSupport()) return;

  playPhysicalSwitchProfile({
    thockFreq: 198,
    clackFreq: 430,
    upstrokeFreq: 510,
    volume: 0.74,
    durationMs: 52,
    zzfxLayer: [0.18, 0.02, 265, 0.001, 0.005, 0.024, 0, 1.05, -15, 0, 0, 0, 0, 0.08, 0, 0, 0, 0.5, 0.005, 0, -620],
  });
}
