<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useProfileStore } from '#lib/modules/profile/stores/profile.store.svelte.js';
  import GraffitiTitle from '#lib/shared/ui/GraffitiTitle.svelte';
  import {
    playMenuTick,
    playMenuClick,
    playMenuConfirm,
    playMenuCancel,
  } from '#lib/shared/audio/menu-sfx.js';
  import KeyboardHero from './KeyboardHero.svelte';
  import ProfilesPanel from './ProfilesPanel.svelte';
  import { Play, UsersThree, CaretRight } from 'phosphor-svelte';

  const { t } = useI18n();
  const profileStore = useProfileStore();

  let selectedUuid = $state<string>('');
  let profilesModalOpen = $state(false);
  let lastPressedKey = $state('');
  let keyResetTimer: ReturnType<typeof setTimeout> | null = null;

  const selectedProfile = $derived.by(() => {
    return profileStore.profiles.find((p) => p.uuid === selectedUuid) || null;
  });

  function triggerKeyFeedback(label: string) {
    lastPressedKey = label;
    if (keyResetTimer) clearTimeout(keyResetTimer);
    keyResetTimer = setTimeout(() => {
      lastPressedKey = '';
      keyResetTimer = null;
    }, 110);
  }

  onMount(async () => {
    if (profileStore.profiles.length === 0) {
      await profileStore.loadProfiles();
    }
    if (profileStore.activeProfile) {
      selectedUuid = profileStore.activeProfile.uuid;
    } else if (profileStore.profiles.length > 0) {
      selectedUuid = profileStore.profiles[0]!.uuid;
    }
    window.addEventListener('keydown', handleGlobalKeydown);
  });

  onDestroy(() => {
    if (keyResetTimer) clearTimeout(keyResetTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleGlobalKeydown);
    }
  });

  function navigateProfile(direction: 'up' | 'down') {
    const list = profileStore.profiles;
    if (!list.length) return;

    const currentIndex = list.findIndex((p) => p.uuid === selectedUuid);
    let nextIndex: number;

    if (currentIndex === -1) {
      nextIndex = direction === 'down' ? 0 : list.length - 1;
    } else if (direction === 'down') {
      nextIndex = currentIndex < list.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : list.length - 1;
    }

    const nextProfile = list[nextIndex];
    if (nextProfile) {
      playMenuTick();
      selectedUuid = nextProfile.uuid;
    }
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    if (e.key === 'Escape' && profilesModalOpen) {
      e.preventDefault();
      playMenuCancel();
      profilesModalOpen = false;
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateProfile('down');
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateProfile('up');
      return;
    }

    if (e.key === 'Enter' && selectedUuid) {
      e.preventDefault();
      if (profilesModalOpen) {
        playMenuConfirm();
        profilesModalOpen = false;
      } else {
        handlePlay();
      }
      return;
    }

    if (e.key.length === 1 && !profilesModalOpen) {
      playMenuClick();
      triggerKeyFeedback(e.key.toUpperCase());
    }
  }

  function openSelectProfile() {
    playMenuClick();
    profilesModalOpen = true;
  }

  async function handlePlay() {
    if (!selectedUuid) {
      openSelectProfile();
      return;
    }
    playMenuConfirm();
    await profileStore.enterSession(selectedUuid);
    try {
      await goto('/mode-select');
    } catch {
      window.location.href = '/mode-select';
    }
  }
</script>

<div
  class="main-menu-page relative w-full h-screen max-h-screen overflow-hidden bg-tt-bg text-tt-text select-none"
>
  <!-- Subtle Halftone & Wide Spider-Verse Graffiti Structural Backdrop -->
  <div class="main-menu-backdrop pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    <div class="main-menu-halftone absolute inset-0"></div>
    <svg class="w-full h-full opacity-20" viewBox="0 0 1440 900" preserveAspectRatio="none">
      <line x1="0" y1="780" x2="1440" y2="140" stroke="var(--tt-separator)" stroke-width="1.5" />
      <line x1="0" y1="820" x2="1440" y2="180" stroke="var(--tt-primary)" stroke-width="1.2" />
      <line x1="260" y1="0" x2="0" y2="380" stroke="var(--color-status-pink)" stroke-width="2" />
      <!-- Wide Ambient Graffiti Accents Across Stage -->
      <rect x="1140" y="96" width="84" height="6" fill="var(--color-status-cyan)" opacity="0.55" transform="rotate(-12 1140 96)" />
      <rect x="1165" y="110" width="46" height="4" fill="var(--color-status-pink)" opacity="0.5" transform="rotate(-12 1165 110)" />
      <rect x="140" y="640" width="92" height="5" fill="var(--color-status-yellow)" opacity="0.45" transform="rotate(-12 140 640)" />
      <circle cx="1210" cy="240" r="4" fill="var(--color-status-yellow)" opacity="0.55" />
      <circle cx="290" cy="540" r="3.5" fill="var(--color-status-cyan)" opacity="0.55" />
    </svg>
  </div>

  <!-- TOP-LEFT ZONE: GRAFFITI / CALLIGRAPHY "TYPING FREEX" TITLE -->
  <header class="absolute top-3 left-4 sm:top-5 sm:left-7 lg:top-6 lg:left-9 z-20 pointer-events-none origin-top-left scale-95 sm:scale-100">
    <GraffitiTitle size="lg" />
  </header>

  <!-- CENTER ZONE: LARGE UNCLIPPED SPIDER-VERSE KEYBOARD IMAGE -->
  <div class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none px-4">
    <div class="pointer-events-auto">
      <KeyboardHero
        activeKey={lastPressedKey}
        onKeyClick={(label) => {
          triggerKeyFeedback(label);
        }}
      />
    </div>
  </div>

  <!-- BOTTOM-LEFT: MINIMALIST VERSION STAMP -->
  <div class="absolute bottom-4 left-5 sm:bottom-6 sm:left-8 z-20 text-[11px] font-mono font-bold text-tt-text-secondary tracking-wider uppercase pointer-events-none">
    v0.1.0
  </div>

  <!-- BOTTOM-RIGHT: RESPONSIVE GAME CONSOLE (Raised higher above bottom edge & cleanly to the left of FAB) -->
  <footer class="preset-console-anchor absolute bottom-10 right-20 sm:bottom-14 sm:right-24 lg:bottom-16 lg:right-28 z-20 w-[min(320px,calc(100vw-6.5rem))] sm:w-[325px]">
    <div class="relative">
      <!-- Comic offset shadow frame -->
      <div
        class="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl bg-tt-text pointer-events-none"
        aria-hidden="true"
      ></div>

      <div class="relative rounded-2xl bg-tt-surface-elevated/95 border-2 border-tt-text p-3 sm:p-3.5 flex flex-col gap-2">
        <!-- Active Player Callout & Select Profile Button (COD 4 MW Trigger) -->
        <button
          type="button"
          class="w-full min-h-[44px] px-3 py-2 rounded-xl bg-tt-surface-2 hover:bg-tt-surface-3 border border-tt-separator/80 flex items-center justify-between gap-2.5 cursor-pointer active:scale-[0.99] transition-[transform,background-color] text-left"
          onclick={openSelectProfile}
          aria-label={t('mainMenu.selectProfileTitle')}
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-tt-primary text-white border border-tt-text flex items-center justify-center shrink-0">
              <UsersThree class="w-4 h-4" weight="bold" />
            </div>
            <div class="min-w-0">
              <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-tt-text-secondary truncate">
                {t('mainMenu.selectProfileTitle')}
              </div>
              <div class="text-sm font-black text-tt-text truncate">
                {selectedProfile ? selectedProfile.name : t('mainMenu.noProfiles')}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1 text-xs font-bold text-tt-primary shrink-0">
            <span>{t('mainMenu.profilesButton')}</span>
            <CaretRight class="w-4 h-4" weight="bold" />
          </div>
        </button>

        <!-- Primary Game Launch Action (PLAY) -->
        <button
          type="button"
          disabled={!selectedUuid || profileStore.isLoading}
          class="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-tt-primary text-white border-2 border-tt-text font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-[transform,filter] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onclick={handlePlay}
        >
          <Play class="w-4 h-4 shrink-0" weight="fill" />
          <span class="shrink-0">{t('mainMenu.quickPlay')}</span>
          {#if selectedProfile}
            <span class="text-[11px] font-mono font-bold opacity-90 truncate max-w-[135px]">
              ({t('mainMenu.playAs', { name: selectedProfile.name })})
            </span>
          {/if}
        </button>
      </div>
    </div>
  </footer>

  <!-- COD 4 MW Style Select Profile Window -->
  <ProfilesPanel
    opened={profilesModalOpen}
    {selectedUuid}
    onSelectUuid={(uuid: string) => {
      selectedUuid = uuid;
    }}
    onClose={() => {
      profilesModalOpen = false;
    }}
    onConfirm={(uuid: string) => {
      selectedUuid = uuid;
      profilesModalOpen = false;
    }}
  />
</div>

<style>
  .main-menu-page {
    isolation: isolate;
    contain: layout style;
  }

  .main-menu-backdrop {
    contain: strict;
    transform: translateZ(0);
  }

  .main-menu-halftone {
    background-image: radial-gradient(var(--tt-text) 1px, transparent 1px);
    background-size: 24px 24px;
    opacity: 0.03;
  }
</style>
