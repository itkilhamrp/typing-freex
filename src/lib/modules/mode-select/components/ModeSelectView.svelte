<script lang="ts">
  import { onDestroy } from 'svelte';
  import './ModeSelectView.css';
  import { goto } from '$app/navigation';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { ArrowLeft } from 'phosphor-svelte';
  import ModeRibbon from './ModeRibbon.svelte';
  import type { ModeConfig, RibbonFocusState } from './mode-select-types';

  const { t } = useI18n();

  const MODES: readonly ModeConfig[] = [
    {
      key: 'classic',
      asciiMode: 'classic',
      i18nPrefix: 'modeSelect.classic',
      available: true,
      accentVar: 'var(--tt-primary, #007aff)',
      stagger: 'left',
    },
    {
      key: 'learning',
      asciiMode: 'learning',
      i18nPrefix: 'modeSelect.learning',
      available: false,
      accentVar: 'var(--color-ios-indigo, #5856d6)',
      stagger: 'right',
    },
    {
      key: 'games',
      asciiMode: 'games',
      i18nPrefix: 'modeSelect.games',
      available: false,
      accentVar: 'var(--color-ios-green, #34c759)',
      stagger: 'left',
    },
  ] as const;

  let focusedIndex = $state(0);
  let comingSoonFlash = $state<string | null>(null);
  let flashTimer: ReturnType<typeof setTimeout> | null = null;

  function getFocusState(modeIndex: number): RibbonFocusState {
    if (comingSoonFlash === MODES[modeIndex]!.key) return 'flash';
    if (focusedIndex === modeIndex) return 'focused';
    return 'idle';
  }

  async function goBack() {
    try {
      await goto('/main-menu');
    } catch {
      window.location.href = '/main-menu';
    }
  }

  async function selectMode(modeKey: string) {
    if (modeKey === 'classic' || modeKey === 'arena') {
      try {
        await goto('/');
      } catch {
        window.location.href = '/';
      }
      return;
    }
    comingSoonFlash = modeKey;
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      comingSoonFlash = null;
      flashTimer = null;
    }, 900);
  }

  let stageEl = $state<HTMLElement | null>(null);

  function focusRibbonDom(index: number) {
    const ribbons = stageEl?.querySelectorAll<HTMLElement>('.mode-ribbon[role="button"]');
    ribbons?.[index]?.focus();
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    if (e.defaultPrevented) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      focusedIndex = (focusedIndex + 1) % MODES.length;
      focusRibbonDom(focusedIndex);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      focusedIndex = (focusedIndex + MODES.length - 1) % MODES.length;
      focusRibbonDom(focusedIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectMode(MODES[focusedIndex]!.key);
    } else if (e.key === 'Escape') {
      goBack();
    }
  }

  onDestroy(() => {
    if (flashTimer) {
      clearTimeout(flashTimer);
      flashTimer = null;
    }
  });
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="mode-select-page">
  <!-- Ambient Backdrop Orbs -->
  <div class="mode-select-backdrop" aria-hidden="true">
    <div class="mode-orb mode-orb--classic"></div>
    <div class="mode-orb mode-orb--learning"></div>
    <div class="mode-orb mode-orb--games"></div>
  </div>

  <!-- Header Chrome -->
  <header class="mode-header">
    <button
      type="button"
      class="mode-back-btn"
      aria-label={t('modeSelect.back')}
      onclick={goBack}
    >
      <ArrowLeft class="w-4 h-4" weight="bold" aria-hidden="true" />
      <span class="hidden sm:inline">{t('modeSelect.back')}</span>
    </button>

    <div class="mode-header__center">
      <h1 class="mode-header__title">{t('modeSelect.title')}</h1>
      <span class="mode-header__badge">{t('modeSelect.chooseOne')}</span>
    </div>

    <div class="mode-header__hint hidden sm:block" aria-hidden="true">
      {t('modeSelect.navHint')}
    </div>
  </header>

  <!-- Ribbon Stack Stage -->
  <div
    bind:this={stageEl}
    class="mode-ribbon-stage"
    role="group"
    aria-label={t('modeSelect.chooseOne')}
  >
    {#each MODES as mode, idx (mode.key)}
      <ModeRibbon
        config={mode}
        focusState={getFocusState(idx)}
        onselect={() => selectMode(mode.key)}
        onfocus={() => {
          focusedIndex = idx;
        }}
      />
    {/each}
  </div>
</div>
