<script lang="ts">
  /**
   * Hand Guide Settings Configuration Section (§5.12.4)
   * 100% Parity with Keymap configuration:
   * - Hand Guide Mode (static, react, next) — visibility toggled via arena customize bar
   * - Hand Guide Style (robot, minimal, cyber)
   * - Finger Labels / Legend (home keys, finger name, blank, dynamic target)
   * - Visible Hands (both hands, left hand, right hand)
   * - Hand Guide Size (0.5x – 2.0x slider + quick preset chips)
   * - Hand Guide Layout (QWERTY US, extensible)
   * - Live Interactive Sandbox Preview
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
  import { Hand } from 'phosphor-svelte';
  import HandGuide from '#lib/modules/typing-shared/components/HandGuide.svelte';
  import type {
    HandGuideStyle,
    HandGuideLegendStyle,
    HandGuideHands,
    HandVisualState,
  } from '@/core/hand-guide';

  const { t } = useI18n();
  const settingsStore = useSettingsStore();

  const modeOptions: { id: "static" | "react" | "next"; label: string }[] = $derived([
    { id: 'static', label: t('settings.handGuideModeStatic') },
    { id: 'react', label: t('settings.handGuideModeReact') },
    { id: 'next', label: t('settings.handGuideModeNext') },
  ]);

  const styleOptions: { id: HandGuideStyle; label: string }[] = $derived([
    { id: 'robot', label: t('settings.handGuideStyleRobot') },
    { id: 'minimal', label: t('settings.handGuideStyleMinimal') },
    { id: 'cyber', label: t('settings.handGuideStyleCyber') },
  ]);

  const legendOptions: { id: HandGuideLegendStyle; label: string }[] = $derived([
    { id: 'keys', label: t('settings.handGuideLegendKeys') },
    { id: 'finger_name', label: t('settings.handGuideLegendFingerName') },
    { id: 'blank', label: t('settings.handGuideLegendBlank') },
    { id: 'dynamic', label: t('settings.handGuideLegendDynamic') },
  ]);

  const handsOptions: { id: HandGuideHands; label: string }[] = $derived([
    { id: 'both', label: t('settings.handGuideHandsBoth') },
    { id: 'left', label: t('settings.handGuideHandsLeft') },
    { id: 'right', label: t('settings.handGuideHandsRight') },
  ]);

  const layoutOptions = $derived([
    { value: 'qwerty-us', label: t('settings.layoutQwertyUs') },
  ]);

  function setMode(mode: "static" | "react" | "next") {
    settingsStore.handGuideMode = mode;
  }

  function setStyle(style: HandGuideStyle) {
    settingsStore.handGuideStyle = style;
  }

  function setLegend(legend: HandGuideLegendStyle) {
    settingsStore.handGuideLegendStyle = legend;
  }

  function setHands(hands: HandGuideHands) {
    settingsStore.handGuideHands = hands;
  }

  function setSize(size: number) {
    settingsStore.handGuideSize = size;
  }

  function setLayout(layoutId: string | number) {
    settingsStore.handGuideLayout = String(layoutId);
  }

  const previewVisualState = $derived.by<HandVisualState>(() => {
    const isReact = settingsStore.handGuideMode === 'react';
    const isNext = settingsStore.handGuideMode === 'next';

    return {
      fingerStates: {
        l_pinky: 'idle',
        l_ring: 'idle',
        l_middle: 'idle',
        l_index: isNext ? 'target' : 'idle',
        l_thumb: 'idle',
        r_thumb: isReact || isNext ? 'pressed' : 'idle',
        r_index: 'idle',
        r_middle: 'idle',
        r_ring: 'idle',
        r_pinky: 'idle',
      },
      targetChar: isNext ? 'f' : null,
      isSuspended: false,
    };
  });
</script>

<div class="flex flex-col gap-3">
  <AppSectionHeader
    title={t('settings.handGuide')}
    icon={Hand}
  />

  <AppCard padding="p-4 sm:p-5">
    <div class="space-y-6">
      <!-- 1. Hand Guide Mode -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="max-w-md">
          <div class="font-semibold text-sm text-tt-text">{t('settings.handGuideMode')}</div>
          <div class="text-xs text-tt-text-secondary mt-0.5">{t('settings.handGuideModeDesc')}</div>
        </div>
        <AppSegmented rounded strong class="w-full sm:w-auto sm:min-w-[320px] sm:shrink-0">
          {#each modeOptions as opt (opt.id)}
            <AppSegmentedButton
              active={settingsStore.handGuideMode === opt.id}
              onclick={() => setMode(opt.id)}
            >
              {opt.label}
            </AppSegmentedButton>
          {/each}
        </AppSegmented>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 2. Hand Guide Style -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="max-w-md">
          <div class="font-semibold text-sm text-tt-text">{t('settings.handGuideStyle')}</div>
          <div class="text-xs text-tt-text-secondary mt-0.5">{t('settings.handGuideStyleDesc')}</div>
        </div>
        <AppSegmented rounded strong class="w-full sm:w-auto sm:min-w-[320px] sm:shrink-0">
          {#each styleOptions as opt (opt.id)}
            <AppSegmentedButton
              active={settingsStore.handGuideStyle === opt.id}
              onclick={() => setStyle(opt.id)}
            >
              {opt.label}
            </AppSegmentedButton>
          {/each}
        </AppSegmented>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 3. Finger Labels / Legend -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="max-w-md">
          <div class="font-semibold text-sm text-tt-text">{t('settings.handGuideLegend')}</div>
          <div class="text-xs text-tt-text-secondary mt-0.5">{t('settings.handGuideLegendDesc')}</div>
        </div>
        <AppSegmented rounded strong class="w-full sm:w-auto sm:min-w-[360px] sm:shrink-0">
          {#each legendOptions as opt (opt.id)}
            <AppSegmentedButton
              active={settingsStore.handGuideLegendStyle === opt.id}
              onclick={() => setLegend(opt.id)}
            >
              {opt.label}
            </AppSegmentedButton>
          {/each}
        </AppSegmented>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 4. Visible Hands -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="max-w-md">
          <div class="font-semibold text-sm text-tt-text">{t('settings.handGuideHands')}</div>
          <div class="text-xs text-tt-text-secondary mt-0.5">{t('settings.handGuideHandsDesc')}</div>
        </div>
        <AppSegmented rounded strong class="w-full sm:w-auto sm:min-w-[320px] sm:shrink-0">
          {#each handsOptions as opt (opt.id)}
            <AppSegmentedButton
              active={settingsStore.handGuideHands === opt.id}
              onclick={() => setHands(opt.id)}
            >
              {opt.label}
            </AppSegmentedButton>
          {/each}
        </AppSegmented>
      </div>

      <div class="h-px bg-tt-separator/40 w-full"></div>

      <!-- 5. Hand Guide Size Slider & Quick Presets -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="max-w-md">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm text-tt-text">{t('settings.handGuideSize')}</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded-md bg-tt-surface-2 text-tt-primary border border-tt-separator/50 font-bold">
              {settingsStore.handGuideSize.toFixed(1)}x
            </span>
          </div>
          <div class="text-xs text-tt-text-secondary mt-0.5">{t('settings.handGuideSizeDesc')}</div>
        </div>
        <div class="w-full sm:w-80 sm:shrink-0 flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <span class="text-[11px] font-mono text-tt-text-secondary">0.5</span>
            <AppRange
              value={settingsStore.handGuideSize}
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
                  Math.abs(settingsStore.handGuideSize - preset) < 0.05
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

      <!-- 6. Hand Guide Layout Dropdown -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="max-w-md">
          <div class="font-semibold text-sm text-tt-text">{t('settings.handGuideLayout')}</div>
          <div class="text-xs text-tt-text-secondary mt-0.5">{t('settings.handGuideLayoutDesc')}</div>
        </div>
        <div class="w-full sm:w-72 sm:shrink-0">
          <AppSelect
            block
            options={layoutOptions}
            value={settingsStore.handGuideLayout}
            onchange={setLayout}
          />
        </div>
      </div>

      <!-- 7. Live Interactive Preview Sandbox -->
      <div class="rounded-2xl bg-tt-surface-2/60 border border-tt-separator/60 p-4 sm:p-5 flex flex-col items-center justify-center min-h-[170px] transition-all overflow-hidden">
        <div class="w-full flex items-center justify-between border-b border-tt-separator/40 pb-2.5 mb-4">
          <span class="text-[11px] font-semibold text-tt-text-secondary uppercase tracking-wider font-mono">
            {t('settings.handGuidePreview')}
          </span>
          <span class="text-[10px] text-tt-text-secondary/70 font-mono">
            {#if settingsStore.handGuideMode === 'next'}
              {t('settings.handGuidePreviewNext')}
            {:else if settingsStore.handGuideMode === 'react'}
              {t('settings.handGuidePreviewReact')}
            {:else}
              {t('settings.handGuidePreviewStatic')}
            {/if}
          </span>
        </div>

        <div class="w-full flex items-center justify-center py-2 overflow-x-auto">
          <HandGuide
            visualState={previewVisualState}
            mode={settingsStore.handGuideMode}
            style={settingsStore.handGuideStyle}
            legendStyle={settingsStore.handGuideLegendStyle}
            showHands={settingsStore.handGuideHands}
            size={1.0}
          />
        </div>
      </div>
    </div>
  </AppCard>
</div>

