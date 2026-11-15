/**
 * Official Monkeytype Sound Pack Preloading & Cache Pipeline.
 * Pure Logic Layer — preloads authentic Monkeytype WAV files from `static/sounds/`
 * and bakes oscillator/scale packs into 16-bit Stereo WAV Blobs & AudioBuffers.
 */

import { getSoundEngine, type SoundEngine } from '#lib/shared/audio/sound-engine.js';
import { synthesizePackBuffers } from '#lib/shared/audio/sound-synthesizer.js';
import { getSynthesisContext } from '#lib/shared/audio/audio-context-provider.js';
import { TIME_WARNING_SOUND_URL } from './sound-pack-registry.js';
import type { SoundPackDef } from '../types/sound-types.js';

/** Build the list of static WAV asset URLs for a Monkeytype sample pack */
export function getPackSampleEntries(
  pack: SoundPackDef
): ReadonlyArray<{ readonly id: string; readonly url: string }> {
  if (!pack.basePath) return [];
  const entries: Array<{ readonly id: string; readonly url: string }> = [];
  for (let i = 1; i <= pack.variants; i++) {
    entries.push({
      id: `${pack.id}/${i}`,
      url: `${pack.basePath}/${i}.wav`,
    });
  }
  return entries;
}

/** Synchronously bake oscillator/scale packs (`sine`, `sawtooth`, `square`, `triangle`, `pentatonic`, `wholetone`) */
export function ensureSynthesizedPackReady(
  pack: SoundPackDef,
  engine: SoundEngine = getSoundEngine()
): void {
  const firstKey = `${pack.id}/1`;
  if (engine.has(firstKey) || engine.has(pack.id)) return;
  const ctx = engine.getContext() ?? getSynthesisContext();
  if (!ctx) return;
  const buffers = synthesizePackBuffers(ctx, pack.id, pack.variants);
  for (const [key, buf] of buffers) {
    engine.registerBuffer(key, buf);
  }
}

/** Preload a sound pack's authentic WAV files (or synthesized buffers) into the engine's RAM cache */
export async function preloadPack(
  pack: SoundPackDef,
  engine: SoundEngine = getSoundEngine()
): Promise<void> {
  const firstKey = `${pack.id}/1`;
  if (engine.has(firstKey) || engine.has(pack.id)) {
    return;
  }

  // 1. If pack has static Monkeytype WAV files and fetch is available, decode real WAV files
  if (pack.basePath && typeof fetch === 'function') {
    const entries = getPackSampleEntries(pack);
    await engine.preloadBatch(entries);
    if (engine.has(firstKey)) {
      return;
    }
  }

  // 2. For synthesized/scale packs (or headless unit test environment without HTTP fetch), bake buffers
  ensureSynthesizedPackReady(pack, engine);
}

/** Preload the Monkeytype timeWarning.wav alert into the engine's buffer cache */
export async function preloadWarningSound(
  engine: SoundEngine = getSoundEngine()
): Promise<void> {
  if (engine.has('time-warning')) return;
  if (typeof fetch === 'function') {
    const ok = await engine.preload('time-warning', TIME_WARNING_SOUND_URL);
    if (ok) return;
  }
  const ctx = engine.getContext() ?? getSynthesisContext();
  if (!ctx) return;
  const buffers = synthesizePackBuffers(ctx, 'time-warning', 1);
  for (const [key, buf] of buffers) {
    engine.registerBuffer(key, buf);
  }
}

/** Unload a previously loaded pack from cache */
export function unloadPack(
  pack: SoundPackDef,
  engine: SoundEngine = getSoundEngine()
): void {
  engine.clear(pack.id);
}

/** Switch from one pack to another (unload old -> preload new) */
export async function switchPack(
  oldPack: SoundPackDef | null,
  newPack: SoundPackDef | null,
  engine: SoundEngine = getSoundEngine()
): Promise<void> {
  if (oldPack && (!newPack || oldPack.id !== newPack.id)) {
    unloadPack(oldPack, engine);
  }
  if (newPack) {
    await preloadPack(newPack, engine);
  }
}
