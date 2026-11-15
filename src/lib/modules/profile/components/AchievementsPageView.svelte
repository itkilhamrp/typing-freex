<script lang="ts">
  import { onMount } from 'svelte';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useAchievementStore } from '../stores/achievement.store.svelte';
  import {
    AppPage,
    AppCard,
    AppSegmented,
    AppSegmentedButton,
    AppBadge,
  } from '#lib/shared/ui/index.js';
  import TrophyCard from './TrophyCard.svelte';
  import TierLadderDialog from './TierLadderDialog.svelte';
  import {
    ArrowLeft,
    Trophy,
    Lightning,
    Target,
    HourglassHigh,
    WaveSine,
    Compass,
    Medal,
  } from 'phosphor-svelte';
  import type { AchievementGroup } from '@/core/achievements';
  import type { AchievementItem } from '../stores/achievement.store.svelte';
  import { goto } from '$app/navigation';

  const { t } = useI18n();
  const achievementStore = useAchievementStore();

  let activeGroup = $state<AchievementGroup | 'all'>('all');
  let selectedLadderItem = $state<AchievementItem | null>(null);

  onMount(() => {
    if (!achievementStore.isLoaded) {
      achievementStore.loadAll();
    }
  });

  const achievementItems = $derived(
    achievementStore.items.filter((item) => item.definition.category === 'achievement'),
  );

  const filteredItems = $derived.by(() => {
    if (activeGroup === 'all') return achievementItems;
    return achievementItems.filter((item) => item.definition.group === activeGroup);
  });

  // Tiered progression metrics: calculates total ladder tiers reached vs available
  const scopeItems = $derived(filteredItems);

  const totalUnlockedTiers = $derived(
    scopeItems.reduce((acc, item) => acc + item.currentTier, 0),
  );

  const totalPossibleTiers = $derived(
    scopeItems.reduce((acc, item) => acc + item.definition.tiers.length, 0),
  );

  const percent = $derived(
    totalPossibleTiers > 0
      ? Math.round((totalUnlockedTiers / totalPossibleTiers) * 100)
      : 0,
  );

  const masteredCount = $derived(
    scopeItems.filter((item) => {
      const maxTier = item.definition.tiers[item.definition.tiers.length - 1]?.tier ?? 1;
      return item.currentTier >= maxTier;
    }).length,
  );

  const totalCount = $derived(scopeItems.length);

  const GROUPS: { key: AchievementGroup; labelKey: string; icon: typeof Lightning }[] = [
    { key: 'speed', labelKey: 'achievements.group.speed', icon: Lightning },
    { key: 'accuracy', labelKey: 'achievements.group.accuracy', icon: Target },
    { key: 'endurance', labelKey: 'achievements.group.endurance', icon: HourglassHigh },
    { key: 'consistency', labelKey: 'achievements.group.consistency', icon: WaveSine },
    { key: 'exploration', labelKey: 'achievements.group.exploration', icon: Compass },
    { key: 'milestones', labelKey: 'achievements.group.milestones', icon: Medal },
  ];
</script>

<AppPage maxWidth="max-w-5xl" class="select-none space-y-6 animate-fade-in pb-16">
  <!-- Top Navigation Bar / Breadcrumb -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tt-separator/50 pb-5">
    <div class="flex items-center gap-3">
      <button
        type="button"
        onclick={() => goto('/profiles')}
        class="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-tt-surface-2 hover:bg-tt-surface-3 active:scale-95 border border-tt-separator/50 text-tt-text-secondary hover:text-tt-text transition-all cursor-pointer shadow-xs"
        title={t('achievements.backToProfile')}
        aria-label={t('achievements.backToProfile')}
      >
        <ArrowLeft class="w-4 h-4" />
      </button>
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-tt-text flex items-center gap-2">
          <Trophy class="w-5 h-5 sm:w-6 sm:h-6 text-tt-primary" />
          <span>{t('achievements.navAchievements')}</span>
        </h1>
        <p class="text-xs text-tt-text-secondary mt-0.5">
          {t('achievements.achievementsDesc')}
        </p>
      </div>
    </div>

    <!-- Quick Sub-Route Switcher -->
    <AppSegmented class="self-start sm:self-center">
      <AppSegmentedButton active={true} onclick={() => goto('/profiles/achievements')}>
        {t('achievements.navAchievements')}
      </AppSegmentedButton>
      <AppSegmentedButton active={false} onclick={() => goto('/profiles/advancements')}>
        {t('achievements.navAdvancements')}
      </AppSegmentedButton>
      <AppSegmentedButton active={false} onclick={() => goto('/profiles/gallery')}>
        {t('achievements.navGallery')}
      </AppSegmentedButton>
    </AppSegmented>
  </div>

  <!-- Progress Overview Card -->
  <AppCard padding="p-5 sm:p-6" class="bg-tt-surface-elevated border-tt-separator/50 shadow-sm space-y-4">
    <!-- Top row: Metric readout -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <span class="text-3xs uppercase tracking-wider font-bold text-tt-text-secondary">
          {t('achievements.tierProgressOverview')}
        </span>
        <div class="flex items-baseline gap-2.5 mt-1 flex-wrap">
          <span class="text-3xl sm:text-4xl font-extrabold font-mono text-tt-text">{percent}%</span>
          <span class="text-xs sm:text-sm font-mono text-tt-text-secondary font-semibold whitespace-nowrap">
            ({totalUnlockedTiers} / {totalPossibleTiers} {t('achievements.tiersUnlocked')})
          </span>
        </div>
      </div>

      {#if masteredCount > 0}
        <div class="self-start sm:self-center">
          <AppBadge variant="success" size="md" role="status">
            {#snippet icon()}
              <Trophy class="w-3.5 h-3.5" />
            {/snippet}
            {t('achievements.masteredCount', { count: masteredCount, total: totalCount })}
          </AppBadge>
        </div>
      {/if}
    </div>

    <!-- Progress Track -->
    <div class="w-full h-2.5 rounded-full bg-tt-surface-2 overflow-hidden border border-tt-separator/30">
      <div
        class="h-full rounded-full bg-gradient-to-r from-tt-primary to-ios-green transition-[width] duration-500"
        style="width: {percent}%;"
      ></div>
    </div>

    <!-- Group Filters (Dedicated Row) -->
    <div class="flex items-center gap-1.5 flex-wrap pt-3 border-t border-tt-separator/30">
      <button
        type="button"
        onclick={() => (activeGroup = 'all')}
        class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer {activeGroup === 'all'
          ? 'bg-tt-primary text-white shadow-xs'
          : 'bg-tt-surface-2 text-tt-text-secondary hover:text-tt-text border border-tt-separator/40'}"
      >
        {t('achievements.filterAll')}
      </button>
      {#each GROUPS as grp (grp.key)}
        {@const Icon = grp.icon}
        <button
          type="button"
          onclick={() => (activeGroup = grp.key)}
          class="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer {activeGroup === grp.key
            ? 'bg-tt-primary text-white shadow-xs'
            : 'bg-tt-surface-2 text-tt-text-secondary hover:text-tt-text border border-tt-separator/40'}"
        >
          <Icon class="w-3.5 h-3.5" />
          <span>{t(grp.labelKey)}</span>
        </button>
      {/each}
    </div>
  </AppCard>

  <!-- Achievement Cards Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 [contain:layout_style]">
    {#each filteredItems as item (item.definition.id)}
      <TrophyCard
        {item}
        onViewLadder={(selected) => (selectedLadderItem = selected)}
      />
    {/each}
  </div>

  {#if selectedLadderItem}
    <TierLadderDialog
      opened={true}
      item={selectedLadderItem}
      onclose={() => (selectedLadderItem = null)}
    />
  {/if}
</AppPage>
