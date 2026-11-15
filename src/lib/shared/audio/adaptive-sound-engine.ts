/**
 * Adaptive Sound Engine (UNIX Pipeline Stage 4a).
 *
 * Facade implementing SoundEngine. Dynamically probes the Tauri Rust CPAL
 * audio subsystem. If native CPAL is operational (healthy), delegates to
 * NativeSoundEngine for zero-lag native host mixing.
 * If native CPAL is unavailable (e.g. headless container, missing host audio device,
 * or non-Tauri browser), seamlessly falls back to HybridSoundEngine (Web Audio API).
 *
 * Hot-path guarantee:
 * - Zero await in play / playRandom / playSequence
 * - Single probe on startup (<0.5ms), non-blocking
 */

import { invoke } from '@tauri-apps/api/core';
import type { SoundEngine } from './sound-engine.js';
import { NativeSoundEngine } from './native-sound-engine.js';
import { HybridSoundEngine } from './sound-engine.js';
import { probeNativeAudio } from './audio-backend-probe.js';
import { setupDeviceChangeWatcher } from './output-route-guard.js';

export class AdaptiveSoundEngine implements SoundEngine {
  private activeEngine: SoundEngine | null = null;
  private nativeEngine: SoundEngine | null = null;
  private hybridEngine: SoundEngine | null = null;
  private readonly probePromise: Promise<boolean>;
  private readonly pendingBuffers = new Map<string, AudioBuffer>();
  private readonly cachedBuffers = new Map<string, AudioBuffer>();
  private readonly cachedUrls = new Map<string, string>();
  private masterVolume = 1.0;
  private unlistenDeviceChange: (() => void) | null = null;

  constructor(
    probeFn: () => Promise<boolean> = probeNativeAudio,
    private readonly nativeFactory: () => SoundEngine = () => new NativeSoundEngine(),
    private readonly hybridFactory: () => SoundEngine = () => new HybridSoundEngine(true)
  ) {
    this.probePromise = probeFn()
      .then((healthy) => {
        if (healthy) {
          this.nativeEngine = this.nativeFactory();
          this.activeEngine = this.nativeEngine;
        } else {
          this.hybridEngine = this.hybridFactory();
          this.activeEngine = this.hybridEngine;
        }
        this.activeEngine.setVolume(this.masterVolume);
        this.flushPendingBuffers();
        return healthy;
      })
      .catch(() => {
        this.hybridEngine = this.hybridFactory();
        this.activeEngine = this.hybridEngine;
        this.activeEngine.setVolume(this.masterVolume);
        this.flushPendingBuffers();
        return false;
      });

    // Set up hotplug listener for OS audio output changes (Bluetooth connect/disconnect, USB DAC)
    this.unlistenDeviceChange = setupDeviceChangeWatcher(() => {
      this.handleDeviceChange(probeFn);
    });
  }

  private handleDeviceChange(probeFn: () => Promise<boolean>): void {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      void invoke<{ healthy?: boolean }>('audio_rebuild_stream')
        .then(async (status) => {
          if (status && status.healthy === true) return true;
          const firstTry = await probeFn();
          if (firstTry) return true;
          // Allow supervisor thread to finish rebuilding stream before deciding to downgrade
          await new Promise((r) => setTimeout(r, 120));
          return probeFn();
        })
        .then((healthy) => {
          if (healthy) {
            if (!this.nativeEngine) {
              this.nativeEngine = this.nativeFactory();
            }
            this.activeEngine = this.nativeEngine;
          } else {
            if (!this.hybridEngine) {
              this.hybridEngine = this.hybridFactory();
            }
            this.activeEngine = this.hybridEngine;
            this.syncCacheToFallback(this.hybridEngine);
          }
          this.activeEngine.setVolume(this.masterVolume);
          this.flushPendingBuffers();
        })
        .catch(() => {});
    }
  }

  private syncCacheToFallback(engine: SoundEngine): void {
    for (const [id, buffer] of this.cachedBuffers.entries()) {
      if (!engine.has(id)) {
        engine.registerBuffer(id, buffer);
      }
    }
    if (this.cachedUrls.size > 0) {
      const missingEntries: Array<{ id: string; url: string }> = [];
      for (const [id, url] of this.cachedUrls.entries()) {
        if (!engine.has(id)) {
          missingEntries.push({ id, url });
        }
      }
      if (missingEntries.length > 0) {
        void engine.preloadBatch(missingEntries);
      }
    }
  }

  private flushPendingBuffers(): void {
    if (!this.activeEngine || this.pendingBuffers.size === 0) return;
    for (const [id, buffer] of this.pendingBuffers.entries()) {
      this.activeEngine.registerBuffer(id, buffer);
    }
    this.pendingBuffers.clear();
  }

  private async ensureResolved(): Promise<SoundEngine> {
    if (this.activeEngine) return this.activeEngine;
    await this.probePromise;
    return this.activeEngine!;
  }

  getContext(): AudioContext | null {
    if (this.activeEngine) {
      return this.activeEngine.getContext();
    }
    return null;
  }

  async preload(id: string, url: string): Promise<boolean> {
    this.cachedUrls.set(id, url);
    const engine = await this.ensureResolved();
    return engine.preload(id, url);
  }

  async preloadBatch(
    entries: ReadonlyArray<{ readonly id: string; readonly url: string }>
  ): Promise<void> {
    for (const entry of entries) {
      this.cachedUrls.set(entry.id, entry.url);
    }
    const engine = await this.ensureResolved();
    return engine.preloadBatch(entries);
  }

  registerBuffer(id: string, buffer: AudioBuffer): void {
    this.cachedBuffers.set(id, buffer);
    if (this.activeEngine) {
      this.activeEngine.registerBuffer(id, buffer);
    } else {
      this.pendingBuffers.set(id, buffer);
    }
  }

  play(id: string, volumeOverride?: number, playbackRate = 1.0): void {
    if (this.activeEngine) {
      this.activeEngine.play(id, volumeOverride, playbackRate);
    }
  }

  playRandom(poolPrefix: string, count: number, volumeOverride?: number): void {
    if (this.activeEngine) {
      this.activeEngine.playRandom(poolPrefix, count, volumeOverride);
    }
  }

  playSequence(poolPrefix: string, count: number, volumeOverride?: number): void {
    if (this.activeEngine) {
      this.activeEngine.playSequence(poolPrefix, count, volumeOverride);
    }
  }

  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(2.0, Number.isFinite(volume) ? volume : 0.5));
    if (this.activeEngine) {
      this.activeEngine.setVolume(this.masterVolume);
    }
  }

  getVolume(): number {
    return this.activeEngine ? this.activeEngine.getVolume() : this.masterVolume;
  }

  async resume(): Promise<void> {
    const engine = await this.ensureResolved();
    return engine.resume();
  }

  has(id: string): boolean {
    if (this.activeEngine) {
      return this.activeEngine.has(id);
    }
    return this.pendingBuffers.has(id);
  }

  clear(prefix?: string): void {
    if (prefix) {
      const matchPrefix = (k: string) => k === prefix || k.startsWith(`${prefix}/`) || k.startsWith(prefix);
      for (const k of Array.from(this.pendingBuffers.keys())) {
        if (matchPrefix(k)) this.pendingBuffers.delete(k);
      }
      for (const k of Array.from(this.cachedBuffers.keys())) {
        if (matchPrefix(k)) this.cachedBuffers.delete(k);
      }
      for (const k of Array.from(this.cachedUrls.keys())) {
        if (matchPrefix(k)) this.cachedUrls.delete(k);
      }
    } else {
      this.pendingBuffers.clear();
      this.cachedBuffers.clear();
      this.cachedUrls.clear();
    }
    if (this.activeEngine) {
      this.activeEngine.clear(prefix);
    }
  }

  dispose(): void {
    if (this.unlistenDeviceChange) {
      this.unlistenDeviceChange();
      this.unlistenDeviceChange = null;
    }
    this.pendingBuffers.clear();
    this.cachedBuffers.clear();
    this.cachedUrls.clear();
    if (this.nativeEngine) this.nativeEngine.dispose();
    if (this.hybridEngine) this.hybridEngine.dispose();
    this.activeEngine = null;
  }
}

