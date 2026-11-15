<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    Sun,
    Moon,
    SquaresFour,
    CaretDown,
    Translate,
    CornersOut,
    CornersIn,
    House,
  } from 'phosphor-svelte';
  import { settingsStore } from '#lib/modules/settings/stores/settings.store.svelte.js';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { fullscreenStore } from '#lib/shared/utils/fullscreen.svelte.js';
  import {
    playMenuClick,
    playMenuCancel,
  } from '#lib/shared/audio/menu-sfx.js';

  interface Props {
    class?: string;
    dimmed?: boolean;
  }

  let { class: className = '', dimmed = false }: Props = $props();

  const { t, setLocale } = useI18n();

  const FAB_SIZE = 48;
  const STORAGE_KEY = 'typing_freex_fab_pos';

  let posX = $state(0);
  let posY = $state(0);
  let isReady = $state(false);
  let isDragging = $state(false);
  let isOpen = $state(false);
  let isClosing = $state(false);
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  let fabRootEl = $state<HTMLElement | null>(null);

  // Auto-close FAB menu immediately when typing starts (dimmed === true)
  $effect(() => {
    if (dimmed && isOpen) {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      isOpen = false;
      isClosing = false;
    }
  });

  // Auto-close FAB menu when clicking outside or starting to type on the arena
  $effect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    function handleOutsidePointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (fabRootEl && target && !fabRootEl.contains(target)) {
        closeHub(true);
      }
    }

    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      const target = e.target as Node | null;
      const isInsideFab = Boolean(fabRootEl && target && fabRootEl.contains(target));

      if (e.key === 'Escape') {
        if (!isInsideFab) {
          closeHub(true);
        }
        return;
      }

      // Let Space/Enter inside FAB buttons be handled by the button's own onkeydown/onclick
      if (isInsideFab && (e.key === ' ' || e.code === 'Space' || e.key === 'Enter')) {
        return;
      }

      // If user presses a typing character while FAB is open, close FAB immediately
      if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.length === 1 &&
        !(e.target instanceof HTMLInputElement && !e.target.hasAttribute('data-typing-arena-input')) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
        isOpen = false;
        isClosing = false;
      }
    }

    window.addEventListener('pointerdown', handleOutsidePointerDown, true);
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('pointerdown', handleOutsidePointerDown, true);
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  });

  let isPointerDown = false;
  let hasMoved = false;
  let startX = 0;
  let startY = 0;
  let startFabX = 0;
  let startFabY = 0;
  let dragBounds = { minX: 12, maxX: 964, minY: 12, maxY: 708 };

  function clamp(val: number, min: number, max: number): number {
    if (min > max) return min;
    return Math.min(Math.max(val, min), max);
  }

  function getBounds() {
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 768;
    return {
      minX: 12,
      maxX: Math.max(12, winW - FAB_SIZE - 12),
      minY: 12,
      maxY: Math.max(12, winH - FAB_SIZE - 12),
    };
  }

  function savePosition(x: number, y: number) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
    } catch {
      // Ignore storage errors
    }
  }

  function handleResize() {
    if (typeof window === 'undefined') return;
    const { minX, maxX, minY, maxY } = getBounds();
    posX = clamp(posX, minX, maxX);
    posY = clamp(posY, minY, maxY);
  }

  onMount(() => {
    const { minX, maxX, minY, maxY } = getBounds();
    let restored = false;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            posX = clamp(parsed.x, minX, maxX);
            posY = clamp(parsed.y, minY, maxY);
            restored = true;
          }
        }
      } catch {
        // Fallback below
      }

      if (!restored) {
        posX = clamp(window.innerWidth - FAB_SIZE - 20, minX, maxX);
        posY = clamp(window.innerHeight - FAB_SIZE - 20, minY, maxY);
      }

      window.addEventListener('resize', handleResize);
    }

    isReady = true;
  });

  onDestroy(() => {
    if (closeTimer) clearTimeout(closeTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
    }
  });

  function openHub() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    isClosing = false;
    isOpen = true;
    playMenuClick();
  }

  function closeHub(animate = true) {
    if (!isOpen) return;
    playMenuCancel();
    if (!animate) {
      isOpen = false;
      isClosing = false;
      return;
    }
    isClosing = true;
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      isOpen = false;
      isClosing = false;
      closeTimer = null;
    }, 150);
  }

  function toggleHub() {
    if (isOpen && !isClosing) {
      closeHub(true);
    } else {
      openHub();
    }
  }

  function toggleTheme() {
    playMenuClick();
    const next = settingsStore.theme === 'dark' ? 'light' : 'dark';
    settingsStore.updateSetting('ui.theme', next);
  }

  function toggleLanguage() {
    playMenuClick();
    const nextLocale = settingsStore.locale === 'en' ? 'id' : 'en';
    setLocale(nextLocale);
    settingsStore.updateSetting('ui.locale', nextLocale);
  }

  async function toggleFullscreen() {
    playMenuClick();
    await fullscreenStore.toggle();
  }

  async function goHomeMainMenu() {
    playMenuClick();
    closeHub(false);
    try {
      await goto('/main-menu');
    } catch {
      if (typeof window !== 'undefined') {
        window.location.href = '/main-menu';
      }
    }
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return; // Primary button only
    isPointerDown = true;
    hasMoved = false;
    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;
    startFabX = posX;
    startFabY = posY;
    dragBounds = getBounds();

    const target = e.currentTarget as HTMLElement;
    if (typeof target?.setPointerCapture === 'function') {
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!isPointerDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!hasMoved) {
      if (Math.hypot(dx, dy) > 5) {
        hasMoved = true;
        isDragging = true;
      }
    }

    if (hasMoved) {
      posX = clamp(startFabX + dx, dragBounds.minX, dragBounds.maxX);
      posY = clamp(startFabY + dy, dragBounds.minY, dragBounds.maxY);
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (!isPointerDown) return;
    isPointerDown = false;

    const target = e.currentTarget as HTMLElement;
    if (typeof target?.releasePointerCapture === 'function') {
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }

    if (hasMoved) {
      isDragging = false;
      savePosition(posX, posY);
    } else {
      isDragging = false;
      toggleHub();
    }
  }

  function onPointerCancel(e: PointerEvent) {
    if (!isPointerDown) return;
    isPointerDown = false;
    isDragging = false;
    hasMoved = false;

    const target = e.currentTarget as HTMLElement;
    if (typeof target?.releasePointerCapture === 'function') {
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    const { minX, maxX, minY, maxY } = getBounds();
    const STEP = 16;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleHub();
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeHub(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      posY = clamp(posY - STEP, minY, maxY);
      savePosition(posX, posY);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      posY = clamp(posY + STEP, minY, maxY);
      savePosition(posX, posY);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      posX = clamp(posX - STEP, minX, maxX);
      savePosition(posX, posY);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      posX = clamp(posX + STEP, minX, maxX);
      savePosition(posX, posY);
    }
  }

  const themeTooltipText = $derived.by(() => {
    return settingsStore.theme === 'dark'
      ? t('settings.themeFabTooltipDark')
      : t('settings.themeFabTooltipLight');
  });
</script>

<div
  bind:this={fabRootEl}
  class={[
    'fixed left-0 top-0 z-50 pointer-events-auto touch-none select-none transition-opacity duration-200',
    !isReady ? 'opacity-0 pointer-events-none' : dimmed ? 'opacity-20 hover:opacity-100' : 'opacity-100',
    className,
  ].filter(Boolean).join(' ')}
  style="transform: translate3d({posX}px, {posY}px, 0); contain: layout style;"
>
  <div class="relative flex flex-col items-center">
    <!-- Expandable Vertical Rounded Capsule Menu (Opens Upward) -->
    {#if isOpen}
      <div
        id="fab-capsule-menu"
        class={[
          'fab-capsule absolute bottom-14 left-0 w-12 rounded-full py-2 px-1',
          'bg-tt-surface-elevated border-2 border-tt-text shadow-2xl',
          'flex flex-col items-center gap-2 z-10',
          isClosing ? 'fab-capsule-closing' : 'fab-capsule-opening',
        ].join(' ')}
        role="menu"
        aria-label={t('settings.fabHubTooltip')}
      >
        <!-- 1. Quick Main Menu Button -->
        <button
          type="button"
          id="fab-action-home"
          role="menuitem"
          class="fab-sub-btn w-9 h-9 rounded-full flex items-center justify-center bg-tt-surface-2 hover:bg-tt-primary hover:text-white text-tt-text transition-colors cursor-pointer"
          title={t('settings.fabQuickMainMenu')}
          aria-label={t('settings.fabQuickMainMenu')}
          onclick={goHomeMainMenu}
        >
          <House class="w-4 h-4 pointer-events-none" weight="bold" />
        </button>

        <!-- 2. Fullscreen Toggle Button -->
        <button
          type="button"
          id="fab-action-fullscreen"
          role="menuitem"
          class="fab-sub-btn w-9 h-9 rounded-full flex items-center justify-center bg-tt-surface-2 hover:bg-tt-primary hover:text-white text-tt-text transition-colors cursor-pointer"
          title={t('settings.fabToggleFullscreen')}
          aria-label={t('settings.fabToggleFullscreen')}
          onclick={toggleFullscreen}
        >
          {#if fullscreenStore.isFullscreen}
            <CornersIn class="w-4 h-4 pointer-events-none" weight="bold" />
          {:else}
            <CornersOut class="w-4 h-4 pointer-events-none" weight="bold" />
          {/if}
        </button>

        <!-- 3. Language / Locale Toggle Button -->
        <button
          type="button"
          id="fab-action-locale"
          role="menuitem"
          class="fab-sub-btn w-9 h-9 rounded-full flex flex-col items-center justify-center bg-tt-surface-2 hover:bg-tt-primary hover:text-white text-tt-text transition-colors cursor-pointer"
          title={t('settings.fabToggleLanguage')}
          aria-label={t('settings.fabToggleLanguage')}
          onclick={toggleLanguage}
        >
          <Translate class="w-3.5 h-3.5 pointer-events-none" weight="bold" />
          <span class="text-[8px] font-mono font-black uppercase leading-none mt-0.5 pointer-events-none">
            {settingsStore.locale}
          </span>
        </button>

        <!-- 4. Dark / Light Theme Toggle Button -->
        <button
          type="button"
          id="fab-action-theme"
          role="menuitem"
          class="fab-sub-btn w-9 h-9 rounded-full flex items-center justify-center bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text transition-colors cursor-pointer"
          title={themeTooltipText}
          aria-label={themeTooltipText}
          onclick={toggleTheme}
        >
          {#if settingsStore.theme === 'dark'}
            <Moon class="w-4 h-4 text-tt-primary pointer-events-none" weight="fill" />
          {:else}
            <Sun class="w-4 h-4 text-status-orange pointer-events-none" weight="fill" />
          {/if}
        </button>
      </div>
    {/if}

    <!-- Primary All-Rounder Circular Trigger FAB -->
    <button
      type="button"
      id="theme-fab-button"
      aria-expanded={isOpen && !isClosing}
      aria-haspopup="menu"
      class={[
        'w-12 h-12 rounded-full min-h-[48px] min-w-[48px]',
        'flex items-center justify-center',
        isOpen && !isClosing ? 'bg-tt-primary text-white border-2 border-tt-text' : 'bg-tt-surface-elevated text-tt-text border-2 border-tt-text/80 hover:text-tt-primary',
        'shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tt-focus-ring',
        isDragging
          ? 'cursor-grabbing shadow-2xl transition-none'
          : 'cursor-grab transition-[background-color,color,transform] duration-150',
      ].filter(Boolean).join(' ')}
      title={t('settings.fabHubTooltip')}
      aria-label={t('settings.fabHubTooltip')}
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerCancel}
      onkeydown={onKeyDown}
    >
      {#if isOpen && !isClosing}
        <CaretDown class="w-5 h-5 pointer-events-none transition-transform duration-150" weight="bold" />
      {:else}
        <SquaresFour class="w-5 h-5 text-tt-primary pointer-events-none transition-transform duration-150" weight="fill" />
      {/if}
    </button>
  </div>
</div>

<style>
  .fab-capsule {
    transform-origin: bottom center;
  }

  @media (prefers-reduced-motion: no-preference) {
    .fab-capsule-opening {
      animation: fab-capsule-up 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .fab-capsule-closing {
      animation: fab-capsule-down 150ms ease-in forwards;
    }

    .fab-sub-btn {
      animation: fab-item-pop 220ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
  }

  @keyframes fab-capsule-up {
    from {
      opacity: 0;
      transform: translate3d(0, 18px, 0) scaleY(0.35);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scaleY(1);
    }
  }

  @keyframes fab-capsule-down {
    from {
      opacity: 1;
      transform: translate3d(0, 0, 0) scaleY(1);
    }
    to {
      opacity: 0;
      transform: translate3d(0, 20px, 0) scaleY(0.3);
    }
  }

  @keyframes fab-item-pop {
    from {
      opacity: 0;
      transform: translate3d(0, 8px, 0) scale(0.8);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }
</style>
