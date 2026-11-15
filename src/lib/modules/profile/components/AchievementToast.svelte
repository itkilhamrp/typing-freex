<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { useAchievementStore } from '../stores/achievement.store.svelte';
  import { useSettingsStore } from '#lib/modules/settings/stores/settings.store.svelte.js';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { formatMissionDescription } from '@/core/achievements/tier-system';
  import TrophyIcon from './TrophyIcon.svelte';
  import { X } from 'phosphor-svelte';
  import type { UnlockedAchievement } from '@/core/achievements';

  const { t } = useI18n();
  const settingsStore = useSettingsStore();
  const speedUnit = $derived(settingsStore.speedUnit);
  const achievementStore = useAchievementStore();

  const MAX_VISIBLE = 3;
  const TOAST_DURATION_MS = 4500;

  interface ActiveToastEntry {
    id: string;
    item: UnlockedAchievement;
    timer: ReturnType<typeof setTimeout>;
    startTimer?: ReturnType<typeof setTimeout>;
    isStarted: boolean;
  }

  let activeToasts = $state<ActiveToastEntry[]>([]);

  function dismissToast(id: string) {
    const entry = activeToasts.find((t) => t.id === id);
    if (entry?.timer) {
      clearTimeout(entry.timer);
    }
    if (entry?.startTimer) {
      clearTimeout(entry.startTimer);
    }
    activeToasts = activeToasts.filter((t) => t.id !== id);
  }

  $effect(() => {
    // If we have room for more toasts and queue has items, dequeue and add to active list
    if (activeToasts.length < MAX_VISIBLE && achievementStore.toastQueue.length > 0) {
      const next = achievementStore.dequeueToast();
      if (next) {
        const id = `${next.achievementId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const timer = setTimeout(() => {
          dismissToast(id);
        }, TOAST_DURATION_MS);

        // Trigger linear countdown animation on next frame
        const startTimer = setTimeout(() => {
          activeToasts = activeToasts.map((t) =>
            t.id === id ? { ...t, isStarted: true } : t
          );
        }, 30);

        const newEntry: ActiveToastEntry = {
          id,
          item: next,
          timer,
          startTimer,
          isStarted: false,
        };

        activeToasts = [...activeToasts, newEntry];
      }
    }
  });

  onDestroy(() => {
    for (const toast of activeToasts) {
      if (toast.timer) clearTimeout(toast.timer);
      if (toast.startTimer) clearTimeout(toast.startTimer);
    }
  });

  import { getAdvancementRankMeta } from '@/core/achievements/advancement-rank';

  function getToastStyles(item: UnlockedAchievement) {
    if (item.category === 'advancement') {
      const rankMeta = getAdvancementRankMeta(item.tier);
      return {
        banner: `border-color: ${rankMeta.accentColor}70; box-shadow: 0 0 16px ${rankMeta.glowColor};`,
        title: `color: ${rankMeta.accentColor};`,
        progress: `background-color: ${rankMeta.fillColor};`,
      };
    }
    return {
      banner: 'border-color: rgba(6, 182, 212, 0.5);',
      title: 'color: #22d3ee;',
      progress: 'background-color: var(--tt-primary);',
    };
  }
</script>

<div
  role="region"
  aria-label={t('achievements.notificationsAriaLabel')}
  class="fixed top-20 right-6 z-50 pointer-events-none flex flex-col gap-2.5 max-w-sm w-full select-none"
>
  {#each activeToasts as toast (toast.id)}
    {@const styles = getToastStyles(toast.item)}
    <div
      role="alert"
      aria-live="assertive"
      transition:fly={{ x: 100, duration: 250 }}
      animate:flip={{ duration: 250 }}
      class="pointer-events-auto w-full"
    >
      <div
        class="relative overflow-hidden rounded-2xl bg-tt-surface-elevated/95 backdrop-blur-md border shadow-xl p-4 flex items-center gap-3.5"
        style={styles.banner}
      >
        <!-- Trophy Icon with glow -->
        <TrophyIcon
          icon={toast.item.icon}
          tier={toast.item.tier}
          shape={toast.item.trophyShape}
          advancementShape={toast.item.advancementShape}
          category={toast.item.category}
          unlocked={true}
          size="md"
        />

        <!-- Text content -->
        <div class="flex-1 min-w-0 pr-4">
          <span class="block text-2xs uppercase tracking-widest font-black" style={styles.title}>
            {toast.item.category === 'advancement'
              ? t('achievements.toastAdvancement')
              : t('achievements.toastTitle')}
          </span>
          <h4 class="font-bold text-sm text-tt-text truncate leading-tight mt-0.5">
            {t(toast.item.labelKey)}
          </h4>
          <p class="text-xs text-tt-text-secondary truncate mt-0.5">
            {formatMissionDescription(t(toast.item.descKey), speedUnit)}
          </p>
        </div>

        <!-- Dismiss button -->
        <button
          type="button"
          aria-label={t('common.close') || 'Close'}
          onclick={() => dismissToast(toast.id)}
          class="shrink-0 p-1 rounded-lg text-tt-text-secondary hover:text-tt-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>

        <!-- Auto-dismiss linear countdown timer bar at bottom -->
        <div
          class="absolute bottom-0 left-0 h-1 rounded-full"
          style="{styles.progress} width: {toast.isStarted ? '0%' : '100%'}; transition: width 4.5s linear;"
        ></div>
      </div>
    </div>
  {/each}
</div>
