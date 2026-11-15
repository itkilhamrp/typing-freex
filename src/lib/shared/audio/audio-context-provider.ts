/**
 * Canonical AudioContext Provider (UNIX Pipeline Stage 1).
 *
 * Single Source of Truth for the Web Audio API AudioContext instance.
 * Replaces fragmented, duplicate AudioContext instantiation across modules.
 *
 * Key Capabilities:
 * 1. Unified hardware negotiation without latencyHint overrides (prevents Linux WebKitGTK / BlueZ buffer drops).
 * 2. Persistent User-Gesture Unlocking: Handlers for pointerdown/keydown are NOT
 *    discarded on first fire if the browser/webview policy still keeps the context suspended.
 * 3. Graceful context reconstruction on device transition or hardware interruption.
 * 4. Backward-compatible synchronization with KilledByAPixel/ZzFX.
 *
 * Pure Mechanism Layer — Zero Svelte, UI DOM, or reactive store dependencies.
 */

import { ZZFX } from 'zzfx';
import {
  ensureContextRunning,
  startKeepAliveCarrier,
  type KeepAliveCarrierHandle,
} from './output-route-guard.js';

let sharedAudioCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let sharedKeepAlive: KeepAliveCarrierHandle | null = null;
let synthesisContext: BaseAudioContext | null = null;
const contextRecreateListeners = new Set<(newCtx: AudioContext) => void>();

export function createDedicatedAudioContext(): AudioContext | null {
  return createAudioContextInstance();
}

function createAudioContextInstance(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) return null;

  let ctx: AudioContext | null = null;
  try {
    // Avoid passing { latencyHint: 'interactive' } which triggers Linux WebKitGTK / BlueZ
    // buffer size mismatch and silent dropouts on Bluetooth A2DP and external DACs.
    ctx = new AudioCtx();
  } catch {
    return null;
  }

  return ctx;
}

function syncZzfx(ctx: AudioContext): void {
  try {
    if (ZZFX) {
      ZZFX.audioContext = ctx;
      ZZFX.sampleRate = ctx.sampleRate;
    }
  } catch {
    // Ignore in sealed / mock environments
  }
}

/**
 * Returns the primary shared AudioContext singleton.
 * Lazily initializes on first call.
 */
export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    if (sharedKeepAlive) {
      sharedKeepAlive.stop();
      sharedKeepAlive = null;
    }
    sharedAudioCtx = createAudioContextInstance();
    if (sharedAudioCtx) {
      masterGainNode = sharedAudioCtx.createGain();
      masterGainNode.gain.value = 1.0;
      masterGainNode.channelCountMode = 'max';
      masterGainNode.channelInterpretation = 'speakers';
      masterGainNode.connect(sharedAudioCtx.destination);
      sharedKeepAlive = startKeepAliveCarrier(sharedAudioCtx);
      syncZzfx(sharedAudioCtx);
    }
  }

  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    void ensureContextRunning(sharedAudioCtx);
  }

  return sharedAudioCtx;
}

/**
 * Returns the shared master gain node associated with the shared AudioContext.
 */
export function getSharedMasterGain(): GainNode | null {
  getSharedAudioContext();
  return masterGainNode;
}

/**
 * Returns a lightweight AudioContext or OfflineAudioContext dedicated solely to buffer synthesis.
 * Does NOT bind to hardware output or OS audio streams.
 */
export function getSynthesisContext(): BaseAudioContext | null {
  if (typeof window === 'undefined') return null;

  if (synthesisContext) return synthesisContext;

  const OfflineCtx =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;

  if (OfflineCtx) {
    try {
      synthesisContext = new OfflineCtx(2, 1, 44100);
      return synthesisContext;
    } catch {
      // Fallback below
    }
  }

  synthesisContext = getSharedAudioContext();
  return synthesisContext;
}

/**
 * Recreates the shared AudioContext (e.g. after a disruptive audio route/hardware change).
 * Safely disposes the old context and notifies all registered subscribers.
 */
export function recreateSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (sharedKeepAlive) {
    sharedKeepAlive.stop();
    sharedKeepAlive = null;
  }

  if (sharedAudioCtx) {
    try {
      if (sharedAudioCtx.state !== 'closed') {
        void sharedAudioCtx.close().catch(() => {});
      }
    } catch {
      // Ignore
    }
    sharedAudioCtx = null;
    masterGainNode = null;
  }

  const newCtx = getSharedAudioContext();
  if (newCtx) {
    for (const listener of contextRecreateListeners) {
      try {
        listener(newCtx);
      } catch {
        // Prevent subscriber errors from halting others
      }
    }
  }

  return newCtx;
}

/**
 * Registers a listener callback invoked whenever the shared AudioContext is recreated.
 */
export function onAudioContextRecreated(
  callback: (newCtx: AudioContext) => void
): () => void {
  contextRecreateListeners.add(callback);
  return () => {
    contextRecreateListeners.delete(callback);
  };
}

/**
 * Unlocks the audio subsystem asynchronously on user interaction.
 * Uses persistent single-flight resumption.
 */
export async function unlockSharedAudioContext(): Promise<AudioContext | null> {
  const ctx = getSharedAudioContext();
  if (ctx && ctx.state === 'suspended') {
    await ensureContextRunning(ctx);
  }
  return ctx;
}

/**
 * Pre-warms the audio subsystem to eliminate first-click latency.
 */
export function warmSharedAudioContext(): void {
  if (typeof window === 'undefined') return;

  if (sharedAudioCtx) {
    if (sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = null;
      masterGainNode = null;
    } else if (sharedAudioCtx.state === 'suspended') {
      void ensureContextRunning(sharedAudioCtx);
    }
  }
  getSharedAudioContext();
}

// Persistent user interaction unlock handler:
// Keeps listening until the AudioContext successfully transitions into 'running' state.
if (typeof window !== 'undefined') {
  const persistentUnlock = () => {
    void unlockSharedAudioContext().then((ctx) => {
      if (ctx && ctx.state === 'running') {
        window.removeEventListener('pointerdown', persistentUnlock, true);
        window.removeEventListener('keydown', persistentUnlock, true);
      }
    });
  };

  window.addEventListener('pointerdown', persistentUnlock, { capture: true });
  window.addEventListener('keydown', persistentUnlock, { capture: true });
}

