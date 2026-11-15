<script lang="ts">
  import { profileStore } from '#lib/modules/profile/stores/profile.store.svelte.js';
  import { typingActivity } from '#lib/shared/stores/typing-activity.svelte.js';
  import { i18n } from '#lib/shared/stores/i18n.svelte.js';
  import {
    Keyboard as PhKeyboard,
    ChartBar as PhChartBar,
    ClockCounterClockwise as PhClockCounterClockwise,
    Users as PhUsers,
    Gear as PhGear,
    BookOpen as PhBookOpen,
    SignOut as PhSignOut,
  } from 'phosphor-svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  interface Props {
    mode: 'toolbar' | 'tabbar-icons' | 'tabbar-full';
  }

  let { mode }: Props = $props();

  const t = i18n.t;

  async function navigate(path: string) {
    try {
      await goto(path);
    } catch {
      window.location.href = path;
    }
  }

  async function exitToMainMenu() {
    try {
      profileStore.exitSession();
    } catch {
      // Ignore if session not active
    }
    await navigate('/main-menu');
  }

  let currentPath = $derived(page?.url?.pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/'));

  function isItemActive(path: string): boolean {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  }

  let isDimmed = $derived(currentPath === '/' && Boolean(typingActivity.isTyping));

  const primaryNavItems = [
    { path: '/', label: 'Typing', icon: PhKeyboard, i18nKey: 'nav.typing' },
    { path: '/custom-text', label: 'Custom Text', icon: PhBookOpen, i18nKey: 'nav.customText' },
    { path: '/analytics', label: 'Analytics', icon: PhChartBar, i18nKey: 'nav.analytics' },
    { path: '/history', label: 'History', icon: PhClockCounterClockwise, i18nKey: 'nav.history' },
    { path: '/profiles', label: 'Profiles', icon: PhUsers, i18nKey: 'nav.profiles' },
  ];

  const tabbarNavItems = [
    ...primaryNavItems,
    { path: '/settings', label: 'Settings', icon: PhGear, i18nKey: 'nav.settings' },
  ];
</script>

{#if mode === 'toolbar'}
  <!-- Desktop Header Toolbar (>=1024px) -->
  <header
    class={[
      'w-full h-11 border-b border-[var(--tt-glass-border)] flex items-center justify-between px-3.5 select-none shrink-0 z-20 pointer-events-auto touch-auto bg-[var(--tt-glass-bg)] shadow-glass transition-opacity duration-150',
      isDimmed ? 'opacity-20 hover:opacity-100' : 'opacity-100'
    ].join(' ')}
    style="isolation: isolate; transform: translateZ(0); contain: layout style;"
  >
    <!-- Left: App Logo & Branding -->
    <div class="flex items-center gap-2.5 shrink-0">
      <div
        class="w-7 h-7 rounded-lg flex items-center justify-center text-status-blue bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-xs shrink-0"
      >
        <span class="font-bold text-xs tracking-wider text-status-blue">TF</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="font-bold text-xs tracking-tight text-tt-text">Typing FreeX</span>
        <span class="text-[10px] text-tt-text-secondary/70 font-mono hidden md:inline-block">{t('nav.classic')}</span>
      </div>
    </div>

    <!-- Center: Horizontal Navigation Items (Pills) -->
    <nav class="flex items-center gap-1 p-0.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5" aria-label={t('nav.mainAriaLabel')}>
      {#each primaryNavItems as item (item.path)}
        {@const active = isItemActive(item.path)}
        {@const IconComponent = item.icon}
        <button
          type="button"
          title={t(item.i18nKey)}
          aria-label={t(item.i18nKey)}
          class={[
            'h-7 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-[background-color,color,box-shadow,transform] duration-150 cursor-pointer shrink-0 active:scale-95',
            active
              ? 'bg-white text-black shadow-xs font-semibold'
              : 'text-tt-text-secondary hover:text-tt-text hover:bg-black/5 dark:hover:bg-white/5'
          ].join(' ')}
          onclick={() => navigate(item.path)}
        >
          <IconComponent class="w-4 h-4 shrink-0" weight={active ? 'fill' : 'regular'} />
          <span class="truncate">{t(item.i18nKey)}</span>
        </button>
      {/each}
    </nav>

    <!-- Right: Utility Actions (Settings + Exit) -->
    <div class="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        title={t('nav.settings')}
        aria-label={t('nav.settings')}
        class={[
          'h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-[background-color,color,transform] duration-150 cursor-pointer shrink-0 active:scale-95',
          isItemActive('/settings')
            ? 'bg-white text-black shadow-xs font-semibold'
            : 'text-tt-text-secondary hover:text-tt-text hover:bg-black/5 dark:hover:bg-white/5'
        ].join(' ')}
        onclick={() => navigate('/settings')}
      >
        <PhGear class="w-4 h-4 shrink-0" weight={isItemActive('/settings') ? 'fill' : 'regular'} />
        <span class="hidden xl:inline-block truncate">{t('nav.settings')}</span>
      </button>

      <div class="w-px h-3.5 bg-[var(--tt-separator)] mx-0.5"></div>

      <button
        type="button"
        title={t('nav.exitMainMenu')}
        aria-label={t('nav.exitMainMenu')}
        class="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium text-status-red hover:bg-status-red/10 transition-[background-color,color,transform] duration-150 cursor-pointer shrink-0 active:scale-95"
        onclick={exitToMainMenu}
      >
        <PhSignOut class="w-4 h-4 shrink-0" />
        <span class="hidden xl:inline-block truncate">{t('nav.exitMainMenu')}</span>
      </button>
    </div>
  </header>
{:else}
  <!-- Bottom Tabbar for Medium & Compact screens (<1024px) -->
  <nav
    class={[
      'shrink-0 h-14 border-t border-[var(--tt-glass-border)] bg-[var(--tt-glass-bg)] shadow-glass transition-opacity duration-150 flex items-center justify-around px-1 z-20',
      isDimmed ? 'opacity-20 hover:opacity-100' : 'opacity-100'
    ].join(' ')}
    aria-label={t('nav.mobileAriaLabel')}
  >
    {#each tabbarNavItems as item (item.path)}
      {@const active = isItemActive(item.path)}
      {@const IconComponent = item.icon}
      <button
        type="button"
        title={t(item.i18nKey)}
        aria-label={t(item.i18nKey)}
        class={[
          'flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors cursor-pointer',
          active ? 'text-black dark:text-white font-semibold' : 'text-tt-text-secondary hover:text-tt-text'
        ].join(' ')}
        onclick={() => navigate(item.path)}
      >
        <IconComponent class="w-5 h-5 shrink-0" weight={active ? 'fill' : 'regular'} />
        {#if mode === 'tabbar-full'}
          <span class="text-[10px] mt-0.5 truncate max-w-[64px] font-medium leading-tight">{t(item.i18nKey)}</span>
        {/if}
      </button>
    {/each}
  </nav>
{/if}
