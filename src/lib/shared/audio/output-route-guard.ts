/**
 * Output Route Guard & Acoustic Keep-Alive (UNIX Pipeline Stage 2).
 *
 * Responsibilities:
 * 1. Sub-audible dither carrier (-88 dBFS / TPDF noise): Prevents Bluetooth A2DP,
 *    USB DACs, and Linux PipeWire/PulseAudio sinks from entering aggressive power-saving suspend,
 *    eliminating dropped first-stroke audio without audible hiss.
 * 2. Single-flight AudioContext resumption: Coalesces concurrent `ctx.resume()` calls into
 *    a single in-flight promise to avoid thread thrashing and infinite statechange loops.
 * 3. Hardware devicechange listener with debouncing: Safely handles hotplugging headphones
 *    or external speakers.
 *
 * Pure Mechanism Layer — Zero Svelte, UI DOM, or reactive store dependencies.
 */

import { DEFAULT_FALLBACK_SAMPLE_RATE } from './zzfx.js';

/**
 * Amplitude ~0.000045 (-87 dBFS).
 * In 16-bit audio, 1 LSB is 1/32768 ≈ 0.0000305.
 * Setting dither peak slightly above 1 LSB guarantees the DAC/Bluetooth DSP receives
 * active bits across quantization, preventing audio sink power-collapse while remaining
 * completely inaudible to human ears.
 */
export const SUB_AUDIBLE_DITHER_AMPLITUDE = 0.000045;

/** Duration of the looping dither buffer in seconds */
export const DITHER_BUFFER_DURATION_SEC = 1.0;

let activeResumePromise: Promise<boolean> | null = null;
let lastResumedContext: AudioContext | null = null;

/**
 * Creates a sub-audible dither buffer using Triangular Probability Density Function (TPDF).
 * TPDF is the gold standard in audio engineering for non-periodic, zero-correlation noise.
 */
export function createSubAudibleDitherBuffer(
  ctx: AudioContext,
  durationSec = DITHER_BUFFER_DURATION_SEC,
  amplitude = SUB_AUDIBLE_DITHER_AMPLITUDE
): AudioBuffer {
  const sampleRate = ctx.sampleRate || DEFAULT_FALLBACK_SAMPLE_RATE;
  const numFrames = Math.max(256, Math.floor(sampleRate * durationSec));
  const buffer = ctx.createBuffer(2, numFrames, sampleRate);

  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;

  for (let i = 0; i < numFrames; i++) {
    // TPDF noise: sum of two independent uniform random variables (-0.5..0.5)
    const r1 = Math.random() - 0.5;
    const r2 = Math.random() - 0.5;
    const ditherL = (r1 + r2) * amplitude;

    const r3 = Math.random() - 0.5;
    const r4 = Math.random() - 0.5;
    const ditherR = (r3 + r4) * amplitude;

    left[i] = ditherL;
    if (buffer.numberOfChannels > 1) {
      right[i] = ditherR;
    }
  }

  return buffer;
}

export interface KeepAliveCarrierHandle {
  stop(): void;
}

/**
 * Starts an active sub-audible carrier stream connected directly to the AudioDestinationNode.
 * Unlike silence (zeros), this active dither keeps Bluetooth/USB sinks locked in playing state.
 */
export function startKeepAliveCarrier(ctx: AudioContext): KeepAliveCarrierHandle {
  if (typeof window === 'undefined') {
    return { stop: () => {} };
  }

  try {
    const ditherBuf = createSubAudibleDitherBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = ditherBuf;
    source.loop = true;

    const carrierGain = ctx.createGain();
    carrierGain.gain.value = 1.0;
    // Explicit stereo routing prevents mono downmixing from canceling anti-phase components
    carrierGain.channelCount = 2;
    carrierGain.channelCountMode = 'max';
    carrierGain.channelInterpretation = 'speakers';

    source.connect(carrierGain);
    carrierGain.connect(ctx.destination);
    source.start(0);

    return {
      stop: () => {
        try {
          source.stop();
          source.disconnect();
          carrierGain.disconnect();
        } catch {
          // Ignore if already stopped or closed
        }
      },
    };
  } catch {
    return { stop: () => {} };
  }
}

/**
 * Single-flight AudioContext resumption.
 * Guarantees that even if 50 keystrokes happen in parallel while suspended,
 * exactly one `ctx.resume()` call is executed.
 */
export function ensureContextRunning(ctx: AudioContext): Promise<boolean> {
  if (ctx.state === 'running') {
    return Promise.resolve(true);
  }

  if (ctx.state === 'closed') {
    return Promise.resolve(false);
  }

  if (activeResumePromise && lastResumedContext === ctx) {
    return activeResumePromise;
  }

  lastResumedContext = ctx;
  activeResumePromise = ctx
    .resume()
    .then(() => ctx.state === 'running')
    .catch(() => false)
    .finally(() => {
      activeResumePromise = null;
      lastResumedContext = null;
    });

  return activeResumePromise;
}

/**
 * Sets up a debounced listener for audio output hardware device changes
 * (e.g. plugging/unplugging 3.5mm jack, connecting Bluetooth speaker,
 * or switching default audio sink in OS settings via window focus/visibility).
 */
export function setupDeviceChangeWatcher(
  onDeviceChange: () => void,
  debounceMs = 100
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const handler = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      onDeviceChange();
    }, debounceMs);
  };

  const visibilityHandler = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      handler();
    }
  };

  if (
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.addEventListener === 'function'
  ) {
    navigator.mediaDevices.addEventListener('devicechange', handler);
  }

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('focus', handler);
  }

  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', visibilityHandler);
  }

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.removeEventListener === 'function'
    ) {
      navigator.mediaDevices.removeEventListener('devicechange', handler);
    }
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('focus', handler);
    }
    if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
      document.removeEventListener('visibilitychange', visibilityHandler);
    }
  };
}

