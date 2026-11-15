/**
 * Reactive Typing Sound Policy Controller (Svelte 5 Runes).
 * Bridges TypingArena events, ModeBar quick toggle, and Settings previews to the HybridSoundEngine.
 * Routes all 26 click packs, 4 error packs, and time warning through 16-bit Stereo WAV pools
 * so external speakers (Bluetooth, Wi-Fi, USB DAC, 3.5mm) always output crystal-clear sound.
 */

import { getSoundEngine } from '#lib/shared/audio/sound-engine.js';
import { resolveKeyNoteVariant } from '#lib/shared/audio/sound-synthesizer.js';
import { useSettingsStore } from '#lib/modules/settings/stores/settings.store.svelte.js';
import {
  getClickPackById,
  getErrorPackById,
} from '../logic/sound-pack-registry.js';
import {
  ensureSynthesizedPackReady,
  preloadPack,
  preloadWarningSound,
} from '../logic/sound-preloader.js';

export interface TypingSoundController {
  /** Reactive state: whether typing sound is enabled on the typing bar */
  readonly isEnabled: boolean;

  /** Fire click sound on valid keypress (synchronous, zero-latency) */
  playClick(keyCode?: string): void;

  /** Fire error sound on incorrect keypress (synchronous, zero-latency) */
  playError(): void;

  /** Fire time warning sound when countdown reaches threshold */
  playWarning(): void;

  /** Preview a click pack immediately (used in SoundSettingsSection) */
  previewClickPack(packId: string): void;

  /** Preview an error pack immediately (used in SoundSettingsSection) */
  previewErrorPack(packId: string): void;

  /** Preview time warning sound immediately (used in SoundSettingsSection) */
  previewWarning(): void;

  /** Toggle sound on/off from the typing page ModeBar Row 2 */
  toggleSound(): void;

  /** Dispose resources */
  dispose(): void;
}

let singletonController: TypingSoundController | null = null;

export function useTypingSoundController(): TypingSoundController {
  if (singletonController) {
    return singletonController;
  }

  const settings = useSettingsStore();
  const engine = getSoundEngine();
  const pendingWarmupPacks: Record<string, boolean | undefined> = {};

  // Eagerly warm up active sound packs in the background when running in browser
  if (typeof window !== 'undefined') {
    const initialClick = getClickPackById(settings.soundClickPack);
    const initialError = getErrorPackById(settings.soundErrorPack);
    if (initialClick) void preloadPack(initialClick, engine);
    if (initialError) void preloadPack(initialError, engine);
    void preloadWarningSound(engine);
  }

  function triggerPackPlayback(
    packId: string,
    isError: boolean,
    forcePlay = false,
    keyCode?: string
  ): void {
    if (!forcePlay && !settings.soundEnabled) return;

    const ctx = engine.getContext();
    if (ctx && ctx.state === 'suspended') {
      void engine.resume();
    }

    const pack = isError ? getErrorPackById(packId) : getClickPackById(packId);
    if (!pack) return;

    const vol = settings.soundVolume;

    if (pack.sourceType === 'synthesized') {
      ensureSynthesizedPackReady(pack, engine);
      const variantIdx = resolveKeyNoteVariant(keyCode, pack.variants);
      engine.play(`${pack.id}/${variantIdx}`, vol);
      return;
    }

    if (pack.sourceType === 'sequence') {
      ensureSynthesizedPackReady(pack, engine);
      engine.playSequence(pack.id, pack.variants, vol);
      return;
    }

    // Authentic Monkeytype sample pack (click1..click26, error1..error4)
    if (engine.has(`${pack.id}/1`)) {
      engine.playRandom(pack.id, pack.variants, vol);
      return;
    }

    // Coalesce warmup so fast typing while a pack is still loading never stacks burst callbacks
    if (!pendingWarmupPacks[pack.id]) {
      pendingWarmupPacks[pack.id] = true;
      void preloadPack(pack, engine).finally(() => {
        pendingWarmupPacks[pack.id] = false;
        if (forcePlay || settings.soundEnabled) {
          engine.playRandom(pack.id, pack.variants, settings.soundVolume);
        }
      });
    }
  }

  singletonController = {
    get isEnabled(): boolean {
      return settings.soundEnabled;
    },

    playClick(keyCode?: string): void {
      triggerPackPlayback(settings.soundClickPack, false, false, keyCode);
    },

    playError(): void {
      triggerPackPlayback(settings.soundErrorPack, true, false);
    },

    playWarning(): void {
      if (!settings.soundEnabled) return;
      const vol = settings.soundVolume;
      if (engine.has('time-warning')) {
        engine.play('time-warning', vol);
      } else if (!pendingWarmupPacks['time-warning']) {
        pendingWarmupPacks['time-warning'] = true;
        void preloadWarningSound(engine).finally(() => {
          pendingWarmupPacks['time-warning'] = false;
          engine.play('time-warning', settings.soundVolume);
        });
      }
    },

    previewClickPack(packId: string): void {
      triggerPackPlayback(packId, false, true, 'KeyQ');
    },

    previewErrorPack(packId: string): void {
      triggerPackPlayback(packId, true, true);
    },

    previewWarning(): void {
      const vol = settings.soundVolume;
      if (engine.has('time-warning')) {
        engine.play('time-warning', vol);
      } else {
        void preloadWarningSound(engine).then(() => {
          engine.play('time-warning', vol);
        });
      }
    },

    toggleSound(): void {
      const next = !settings.soundEnabled;
      settings.soundEnabled = next;
      if (next) {
        triggerPackPlayback(settings.soundClickPack, false, true, 'KeyQ');
      }
    },

    dispose(): void {
      engine.clear();
    },
  };

  return singletonController;
}
