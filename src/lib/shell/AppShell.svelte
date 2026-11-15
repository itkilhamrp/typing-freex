<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Navigation from './Navigation.svelte';
  import { page } from '$app/state';
  import type { Component, Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  let ToastComponent = $state<Component | null>(null);
  let ShortcutsProviderComponent = $state<Component | null>(null);
  let windowWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1024);
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;

  function updateWidth() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      windowWidth = window.innerWidth;
      resizeTimer = null;
    }, 100);
  }

  onMount(() => {
    window.addEventListener('resize', updateWidth);
    import('#lib/modules/profile/components/AchievementToast.svelte')
      .then((m) => {
        ToastComponent = m.default;
      })
      .catch(() => {
        ToastComponent = null;
      });
    import('#lib/modules/modes/classic/keyboard-shortcuts/ClassicShortcutsProvider.svelte')
      .then((m) => {
        ShortcutsProviderComponent = m.default;
      })
      .catch(() => {
        ShortcutsProviderComponent = null;
      });
  });

  onDestroy(() => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
      resizeTimer = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateWidth);
    }
  });

  let currentPath = $derived<string>(page?.url?.pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/'));

  let isShellHidden = $derived(
    currentPath === '/welcome' ||
    currentPath === '/main-menu' ||
    currentPath === '/mode-select'
  );

  let layoutMode = $derived.by<'toolbar' | 'tabbar-icons' | 'tabbar-full'>(() => {
    if (windowWidth >= 1024) return 'toolbar';
    if (windowWidth >= 560) return 'tabbar-full';
    return 'tabbar-icons';
  });
</script>

<div class="flex flex-col h-screen w-screen overflow-hidden bg-tt-bg text-tt-text">
  <!-- Desktop Top Toolbar (>=1024px) -->
  {#if !isShellHidden && layoutMode === 'toolbar'}
    <Navigation mode="toolbar" />
  {/if}

  <!-- Main Content Container -->
  <main
    class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative w-full flex flex-col items-center"
    style="-webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; contain: layout style;"
  >
    {@render children?.()}
  </main>

  <!-- Mobile/Tablet Bottom Tabbar (<1024px) -->
  {#if !isShellHidden && layoutMode !== 'toolbar'}
    <Navigation mode={layoutMode} />
  {/if}

  <!-- Realtime Achievement / Advancement Notification Toast -->
  {#if ToastComponent}
    <ToastComponent />
  {/if}

  <!-- Classic Mode Keyboard-Driven Shortcuts Provider -->
  {#if !isShellHidden && ShortcutsProviderComponent}
    <ShortcutsProviderComponent />
  {/if}
</div>

