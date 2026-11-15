<script lang="ts">
  /**
   * Keymap Settings Configuration Section (§5.12.4)
   * Full MonkeyType parity configuration for visual keymap:
   * - Keymap Mode (static, react, next) — visibility toggled via arena customize bar
   * - Keymap Style (7 physical layouts: staggered, alice, matrix, split, split_matrix, steno, steno_matrix)
   * - Keymap Legend (lowercase, uppercase, blank, dynamic)
   * - Keymap Keys (minimal, minimal_numrow, full)
   * - Keymap Size (0.5x – 2.0x slider)
   * - Keymap Layout (QWERTY US, extensible)
   * - Live Preview Sandbox
   */

  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useSettingsStore } from '../stores/settings.store.svelte';
  import {
    AppCard,
    AppSectionHeader,
    AppSegmented,
    AppSegmentedButton,
    AppRange,
    AppSelect,
  } from '#lib/shared/ui/index.js';
  import { Keyboard } from 'phosphor-svelte';
  import Keymap from '#lib/modules/typing-shared/components/Keymap.svelte';
  import {
    DEFAULT_KEYBOARD_LAYOUT as keymapLayout,
    type KeymapStyle,
    type KeymapLegendStyle,
    type KeymapShowKeys,
  } from '@/core/keymap';

  const { t } = useI18n();
  const settingsStore = useSettingsStore();

  const modeOptions: { id: "static" | "react" | "next"; label: string }[] = $derived([
    { id: 'static', label: t('settings.keymapModeStatic') },
    { id: 'react', label: t('settings.keymapModeReact') },
    { id: 'next', label: t('settings.keymapModeNext') },
  ]);

  const styleRow1: { id: KeymapStyle; label: string }[] = $derived([
    { id: 'staggered', label: t('settings.keymapStyleStaggered') },
    { id: 'alice', label: t('settings.keymapStyleAlice') },
    { id: 'matrix', label: t('settings.keymapStyleMatrix') },
    { id: 'split', label: t('settings.keymapStyleSplit') },
  ]);

  const styleRow2: { id: KeymapStyle; label: string }[] = $derived([
    { id: 'split_matrix', label: t('settings.keymapStyleSplitMatrix') },
    { id: 'steno', label: t('settings.keymapStyleSteno') },
    { id: 'steno_matrix', label: t('settings.keymapStyleStenoMatrix') },
  ]);

  const legendOptions: { id: KeymapLegendStyle; label: string }[] = $derived([
    { id: 'lowercase', label: t('settings.keymapLegendLowercase') },
    { id: 'uppercase', label: t('settings.keymapLegendUppercase') },
    { id: 'blank', label: t('settings.keymapLegendBlank') },
    { id: 'dynamic', label: t('settings.keymapLegendDynamic') },
  ]);

  const keysOptions: { id: KeymapShowKeys; label: string }[] = $derived([
    { id: 'minimal', label: t('settings.keymapKeysMinimal') },
    { id: 'minimal_numrow', label: t('settings.keymapKeysMinimalNumrow') },
    { id: 'full', label: t('settings.keymapKeysFull') },
  ]);

  const layoutOptions = $derived([
    { value: 'qwerty-us', label: t('settings.layoutQwertyUs') },
  ]);

  function setMode(mode: "static" | "react" | "next") {
    settingsStore.keymapMode = mode;
  }

  function setStyle(style: KeymapStyle) {
    settingsStore.keymapStyle = style;
  }

  function setLegend(legend: KeymapLegendStyle) {
    settingsStore.keymapLegendStyle = legend;
  }

  function setKeys(keys: KeymapShowKeys) {
    settingsStore.keymapShowKeys = keys;
  }

  function setSize(size: number) {
    settingsStore.keymapSize = size;
  }

  function setLayout(layoutId: string | number) {
    settingsStore.keymapLayout = String(layoutId);
  }
</script>

<div class="flex flex-col gap-3">
  <AppSectionHeader
    title={t('settings.keymap')}
    icon={Keyboard}
  />

  <AppCard padding="p-4 sm:p-5">
    <div class="space-y-6">
      <!-- 1. Keymap Mode -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="max-w-md">
          <div class="font-semibold text-sm text-tt-text">{t('settings.keymapMode')}</div>
          <div class="text-xs text-tt-text-secondary mt-0.5">{t('settings.keymapModeDesc')}</div>
        </div>
        <AppSegmented rounded strong class="w-full sm:w-auto sm:min-w-[320px] sm:shrink-0">
          {#each modeOptions as opt (opt.id)}
            <AppSegmentedButton
              active={settingsStore.keymapMode === opt.id}
              onclick={() => setMode(opt.id)}
            >
              {opt.label}
            </AppSegmentedButton>
          {/each}
        </AppSegmented>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 2. Keymap Style (7 Physical Variations) -->
      <div class="flex flex-col gap-3">
        <div>
          <div class="font-semibold text-sm text-tt-text">{t('settings.keymapStyle')}</div>
          <div class="text-xs text-tt-text-secondary mt-0.5">{t('settings.keymapStyleDesc')}</div>
        </div>
        <div class="flex flex-col gap-2">
          <!-- Row 1: Staggered, Alice, Matrix, Split -->
          <AppSegmented rounded strong class="w-full">
            {#each styleRow1 as opt (opt.id)}
              <AppSegmentedButton
                active={settingsStore.keymapStyle === opt.id}
                onclick={() => setStyle(opt.id)}
              >
                {opt.label}
              </AppSegmentedButton>
            {/each}
          </AppSegmented>
          <!-- Row 2: Split Matrix, Steno, Steno Matrix -->
          <AppSegmented rounded strong class="w-full">
            {#each styleRow2 as opt (opt.id)}
              <AppSegmentedButton
                active={settingsStore.keymapStyle === opt.id}
                onclick={() => setStyle(opt.id)}
              >
                {opt.label}
              </AppSegmentedButton>
            {/each}
          </AppSegmented>
        </div>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 3. Keymap Legend Style -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="max-w-md">
          <div class="font-semibold text-sm text-tt-text">{t('settings.keymapLegend')}</div>
          <div class="text-xs text-tt-text-secondary mt-0.5">{t('settings.keymapLegendDesc')}</div>
        </div>
        <AppSegmented rounded strong class="w-full sm:w-auto sm:min-w-[360px] sm:shrink-0">
          {#each legendOptions as opt (opt.id)}
            <AppSegmentedButton
              active={settingsStore.keymapLegendStyle === opt.id}
              onclick={() => setLegend(opt.id)}
            >
              {opt.label}
            </AppSegmentedButton>
          {/each}
        </AppSegmented>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 4. Keymap Keys (Minimal / Minimal Numrow / Full) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="max-w-md">
          <div class="font-semibold text-sm text-tt-text">{t('settings.keymapKeys')}</div>
          <div class="text-xs text-tt-text-secondary mt-0.5">{t('settings.keymapKeysDesc')}</div>
        </div>
        <AppSegmented rounded strong class="w-full sm:w-auto sm:min-w-[360px] sm:shrink-0">
          {#each keysOptions as opt (opt.id)}
            <AppSegmentedButton
              active={settingsStore.keymapShowKeys === opt.id}
              onclick={() => setKeys(opt.id)}
            >
              {opt.label}
            </AppSegmentedButton>
          {/each}
        </AppSegmented>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 5. Keymap Size Slider & Quick Presets -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="max-w-md">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm text-tt-text">{t('settings.keymapSize')}</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded-md bg-tt-surface-2 text-tt-primary border border-tt-separator/50 font-bold">
              {settingsStore.keymapSize.toFixed(1)}x
            </span>
          </div>
          <div class="text-xs text-tt-text-secondary mt-0.5">{t('settings.keymapSizeDesc')}</div>
        </div>
        <div class="w-full sm:w-80 sm:shrink-0 flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <span class="text-[11px] font-mono text-tt-text-secondary">0.5</span>
            <AppRange
              value={settingsStore.keymapSize}
              min={0.5}
              max={2.0}
              step={0.1}
              oninput={(val) => setSize(val)}
            />
            <span class="text-[11px] font-mono text-tt-text-secondary">2.0</span>
          </div>
          <!-- Quick Preset Chips -->
          <div class="flex items-center justify-between gap-1.5 pt-0.5">
            {#each [0.8, 1.0, 1.2, 1.5, 2.0] as preset (preset)}
              <button
                type="button"
                class={[
                  'flex-1 py-0.5 rounded-md text-[11px] font-mono font-medium transition-all duration-150 border text-center cursor-pointer select-none',
                  Math.abs(settingsStore.keymapSize - preset) < 0.05
                    ? 'bg-tt-primary text-tt-bg border-tt-primary font-bold shadow-sm'
                    : 'bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text-secondary hover:text-tt-text border-tt-separator/40',
                ].join(' ')}
                onclick={() => setSize(preset)}
              >
                {preset.toFixed(1)}x
              </button>
            {/each}
          </div>
        </div>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 6. Keymap Layout Dropdown -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="max-w-md">
          <div class="font-semibold text-sm text-tt-text">{t('settings.keymapLayout')}</div>
          <div class="text-xs text-tt-text-secondary mt-0.5">{t('settings.keymapLayoutDesc')}</div>
        </div>
        <div class="w-full sm:w-72 sm:shrink-0">
          <AppSelect
            block
            options={layoutOptions}
            value={settingsStore.keymapLayout}
            onchange={setLayout}
          />
        </div>
      </div>

      <!-- 7. Live Interactive Preview Sandbox -->
      <div class="rounded-2xl bg-tt-surface-2/60 border border-tt-separator/60 p-4 sm:p-5 flex flex-col items-center justify-center min-h-[170px] transition-all overflow-hidden">
        <div class="w-full flex items-center justify-between border-b border-tt-separator/40 pb-2.5 mb-4">
          <span class="text-[11px] font-semibold text-tt-text-secondary uppercase tracking-wider font-mono">
            {t('settings.keymapPreview')}
          </span>
          <span class="text-[10px] text-tt-text-secondary/70 font-mono">
            {#if settingsStore.keymapMode === 'next'}
              {t('settings.keymapPreviewNext')}
            {:else if settingsStore.keymapMode === 'react'}
              {t('settings.keymapPreviewReact')}
            {:else}
              {t('settings.keymapPreviewStatic')}
            {/if}
          </span>
        </div>

        <div class="w-full flex items-center justify-center py-2 overflow-x-auto">
          <Keymap
            layout={keymapLayout}
            mode={settingsStore.keymapMode}
            style={settingsStore.keymapStyle}
            legendStyle={settingsStore.keymapLegendStyle}
            showKeys={settingsStore.keymapShowKeys}
            size={1.0}
            nextKeyCode="KeyF"
            activeKeyCode="KeyJ"
            activeKeyCorrect={true}
            isShiftActive={false}
          />
        </div>
      </div>
    </div>
  </AppCard>
</div>
