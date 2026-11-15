<script lang="ts">
  /**
   * Sound Settings Configuration Section (Monkeytype Parity)
   * - Sound Volume (0.0 – 2.0) slider + quick presets
   * - Play Sound on Click (27 mechanical switch & synth variants — NO 'off' button; toggled on Typing ModeBar Row 2)
   * - Play Sound on Error (damage, triangle, square, missed punch)
   * - Play Time Warning (1s, 3s, 5s, 10s)
   */

  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useSettingsStore } from '#lib/modules/settings/stores/settings.store.svelte.js';
  import {
    AppCard,
    AppSectionHeader,
    AppRange,
  } from '#lib/shared/ui/index.js';
  import {
    SpeakerHigh,
    SpeakerLow,
    SpeakerX,
    Warning,
  } from 'phosphor-svelte';
  import {
    CLICK_PACKS,
    ERROR_PACKS,
    TIME_WARNING_OPTIONS,
  } from '../logic/sound-pack-registry.js';
  import { useTypingSoundController } from '../controllers/typing-sound.controller.svelte.js';
  import type { TimeWarningSeconds } from '../types/sound-types.js';

  const { t } = useI18n();
  const settingsStore = useSettingsStore();
  const soundController = useTypingSoundController();

  function setVolume(vol: number) {
    settingsStore.soundVolume = vol;
    soundController.previewClickPack(settingsStore.soundClickPack);
  }

  function selectClickPack(packId: string) {
    settingsStore.soundClickPack = packId;
    soundController.previewClickPack(packId);
  }

  function selectErrorPack(packId: string) {
    settingsStore.soundErrorPack = packId;
    soundController.previewErrorPack(packId);
  }

  function selectWarningSeconds(sec: TimeWarningSeconds) {
    settingsStore.soundWarningSeconds = sec;
    soundController.previewWarning();
  }
</script>

<div class="flex flex-col gap-3">
  <AppSectionHeader title={t('settings.sound.title')} icon={SpeakerHigh} />

  <AppCard padding="p-4 sm:p-5">
    <div class="space-y-6">
      <!-- 1. Sound Volume Slider -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="max-w-md">
          <div class="flex items-center gap-2">
            <SpeakerLow class="w-4 h-4 text-tt-text-secondary shrink-0" />
            <span class="font-semibold text-sm text-tt-text">{t('settings.sound.volume')}</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded-md bg-tt-surface-2 text-tt-primary border border-tt-separator/50 font-bold tabular-nums">
              {settingsStore.soundVolume.toFixed(2)}
            </span>
          </div>
          <div class="text-xs text-tt-text-secondary mt-0.5 leading-relaxed">
            {t('settings.sound.volumeDesc')}
          </div>
        </div>

        <div class="w-full sm:w-80 sm:shrink-0 flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <span class="text-[11px] font-mono text-tt-text-secondary">0.0</span>
            <AppRange
              value={settingsStore.soundVolume}
              min={0}
              max={2}
              step={0.05}
              oninput={(val) => setVolume(val)}
            />
            <span class="text-[11px] font-mono text-tt-text-secondary">2.0</span>
          </div>

          <div class="flex items-center justify-between gap-1.5 pt-0.5">
            {#each [0.5, 1.0, 1.5, 2.0] as preset (preset)}
              <button
                type="button"
                class={[
                  'flex-1 py-0.5 rounded-md text-[11px] font-mono font-medium transition-all duration-150 border text-center cursor-pointer select-none',
                  Math.abs(settingsStore.soundVolume - preset) < 0.01
                    ? 'bg-tt-primary text-tt-bg border-tt-primary font-bold shadow-sm'
                    : 'bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text-secondary hover:text-tt-text border-tt-separator/40',
                ].join(' ')}
                onclick={() => setVolume(preset)}
              >
                {preset.toFixed(2)}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 2. Play Sound on Click (Mechanical Switch & Synth Grid) -->
      <div class="space-y-3">
        <div>
          <div class="flex items-center gap-2">
            <SpeakerHigh class="w-4 h-4 text-tt-text-secondary shrink-0" />
            <span class="font-semibold text-sm text-tt-text">{t('settings.sound.clickPack')}</span>
          </div>
          <div class="text-xs text-tt-text-secondary mt-0.5 leading-relaxed">
            {t('settings.sound.clickPackDesc')}
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {#each CLICK_PACKS as pack (pack.id)}
            <button
              type="button"
              class={[
                'px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 border text-center truncate cursor-pointer select-none active:scale-98',
                settingsStore.soundClickPack === pack.id
                  ? 'bg-tt-primary text-tt-bg border-tt-primary font-bold shadow-sm'
                  : 'bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text-secondary hover:text-tt-text border-tt-separator/40',
              ].join(' ')}
              onclick={() => selectClickPack(pack.id)}
            >
              {t(pack.label)}
            </button>
          {/each}
        </div>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 3. Play Sound on Error -->
      <div class="space-y-3">
        <div>
          <div class="flex items-center gap-2">
            <SpeakerX class="w-4 h-4 text-tt-text-secondary shrink-0" />
            <span class="font-semibold text-sm text-tt-text">{t('settings.sound.errorPack')}</span>
          </div>
          <div class="text-xs text-tt-text-secondary mt-0.5 leading-relaxed">
            {t('settings.sound.errorPackDesc')}
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {#each ERROR_PACKS as pack (pack.id)}
            <button
              type="button"
              class={[
                'px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 border text-center truncate cursor-pointer select-none active:scale-98',
                settingsStore.soundErrorPack === pack.id
                  ? 'bg-tt-primary text-tt-bg border-tt-primary font-bold shadow-sm'
                  : 'bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text-secondary hover:text-tt-text border-tt-separator/40',
              ].join(' ')}
              onclick={() => selectErrorPack(pack.id)}
            >
              {t(pack.label)}
            </button>
          {/each}
        </div>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 4. Play Time Warning -->
      <div class="space-y-3">
        <div>
          <div class="flex items-center gap-2">
            <Warning class="w-4 h-4 text-tt-text-secondary shrink-0" />
            <span class="font-semibold text-sm text-tt-text">{t('settings.sound.timeWarning')}</span>
          </div>
          <div class="text-xs text-tt-text-secondary mt-0.5 leading-relaxed">
            {t('settings.sound.timeWarningDesc')}
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {#each TIME_WARNING_OPTIONS as opt (opt.seconds)}
            <button
              type="button"
              class={[
                'px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 border text-center truncate cursor-pointer select-none active:scale-98',
                settingsStore.soundWarningSeconds === opt.seconds
                  ? 'bg-tt-primary text-tt-bg border-tt-primary font-bold shadow-sm'
                  : 'bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text-secondary hover:text-tt-text border-tt-separator/40',
              ].join(' ')}
              onclick={() => selectWarningSeconds(opt.seconds)}
            >
              {t(opt.labelKey)}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </AppCard>
</div>

