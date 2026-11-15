<script lang="ts">
  /**
   * Tape Mode Settings Configuration Section
   * Parity with MonkeyType tape mode configuration:
   * - Tape Mode (letter, word) — NO 'off' button in settings, controlled via arena customize bar
   * - Tape Margin (0% – 100%) slider + value display
   */

  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useSettingsStore, type TapeMode } from '../stores/settings.store.svelte';
  import {
    AppCard,
    AppSectionHeader,
    AppSegmented,
    AppSegmentedButton,
    AppRange,
  } from '#lib/shared/ui/index.js';
  import { FilmStrip } from 'phosphor-svelte';

  const { t } = useI18n();
  const settingsStore = useSettingsStore();

  const modeOptions: { id: TapeMode; label: string }[] = $derived([
    { id: 'letter', label: t('settings.tapeModeLetter') },
    { id: 'word', label: t('settings.tapeModeWord') },
  ]);

  function setMode(mode: TapeMode) {
    settingsStore.tapeMode = mode;
  }

  function setMargin(margin: number) {
    settingsStore.tapeMargin = margin;
  }
</script>

<div class="flex flex-col gap-3">
  <AppSectionHeader title={t('settings.tape')} icon={FilmStrip} />

  <AppCard padding="p-4 sm:p-5">
    <div class="space-y-6">
      <!-- 1. Tape Mode Selection (letter | word) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="max-w-md">
          <div class="font-semibold text-sm text-tt-text">{t('settings.tapeMode')}</div>
          <div class="text-xs text-tt-text-secondary mt-0.5 leading-relaxed">
            {t('settings.tapeModeDesc')}
          </div>
        </div>

        <AppSegmented rounded strong class="w-full sm:w-auto sm:min-w-[200px]">
          {#each modeOptions as opt (opt.id)}
            <AppSegmentedButton
              active={settingsStore.tapeMode === opt.id}
              onclick={() => setMode(opt.id)}
            >
              {opt.label}
            </AppSegmentedButton>
          {/each}
        </AppSegmented>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 2. Tape Margin Slider -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="max-w-md">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm text-tt-text">{t('settings.tapeMargin')}</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded-md bg-tt-surface-2 text-tt-primary border border-tt-separator/50 font-bold tabular-nums">
              {settingsStore.tapeMargin}%
            </span>
          </div>
          <div class="text-xs text-tt-text-secondary mt-0.5 leading-relaxed">
            {t('settings.tapeMarginDesc')}
          </div>
        </div>

        <div class="w-full sm:w-80 sm:shrink-0 flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <span class="text-[11px] font-mono text-tt-text-secondary">0%</span>
            <AppRange
              value={settingsStore.tapeMargin}
              min={0}
              max={100}
              step={1}
              oninput={(val) => setMargin(val)}
            />
            <span class="text-[11px] font-mono text-tt-text-secondary">100%</span>
          </div>

          <!-- Quick Preset Margin Chips -->
          <div class="flex items-center justify-between gap-1.5 pt-0.5">
            {#each [10, 25, 50, 75] as preset (preset)}
              <button
                type="button"
                class={[
                  'flex-1 py-0.5 rounded-md text-[11px] font-mono font-medium transition-all duration-150 border text-center cursor-pointer select-none',
                  settingsStore.tapeMargin === preset
                    ? 'bg-tt-primary text-tt-bg border-tt-primary font-bold shadow-sm'
                    : 'bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text-secondary hover:text-tt-text border-tt-separator/40',
                ].join(' ')}
                onclick={() => setMargin(preset)}
              >
                {preset}%
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </AppCard>
</div>

