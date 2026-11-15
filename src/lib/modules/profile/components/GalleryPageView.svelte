<script lang="ts">
  import { onMount } from 'svelte';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import {
    useAchievementStore,
    type AchievementItem,
  } from '../stores/achievement.store.svelte';
  import {
    AppPage,
    AppCard,
    AppSegmented,
    AppSegmentedButton,
  } from '#lib/shared/ui/index.js';
  import LazyTrophyCard from './LazyTrophyCard.svelte';
  import TrophyShowcase from './TrophyShowcase.svelte';
  import ShowcasePinSlotModal from './ShowcasePinSlotModal.svelte';
  import { getPinnedItemsLookup } from '../logic/showcase-slot.logic';
  import { getTierMeta, formatTierDisplay } from '@/core/achievements/tier-system';
  import {
    getAdvancementRankMeta,
    formatAdvancementDisplay,
  } from '@/core/achievements/advancement-rank';
  import {
    ArrowLeft,
    Trophy,
    Lightning,
    Target,
    HourglassHigh,
    WaveSine,
    Compass,
    Medal,
    Moon,
  } from 'phosphor-svelte';
  import type { AchievementGroup } from '@/core/achievements';
  import { goto } from '$app/navigation';

  const { t } = useI18n();
  const achievementStore = useAchievementStore();

  let activeFilter = $state<'all' | 'achievement' | 'advancement'>('all');
  let activeGroup = $state<AchievementGroup | 'all'>('all');
  let selectedPinItem = $state<AchievementItem | null>(null);

  onMount(() => {
    if (!achievementStore.isLoaded) {
      achievementStore.loadAll();
    }
  });

  const GROUPS: { key: AchievementGroup; labelKey: string; icon: typeof Lightning }[] = [
    { key: 'speed', labelKey: 'achievements.group.speed', icon: Lightning },
    { key: 'accuracy', labelKey: 'achievements.group.accuracy', icon: Target },
    { key: 'endurance', labelKey: 'achievements.group.endurance', icon: HourglassHigh },
    { key: 'consistency', labelKey: 'achievements.group.consistency', icon: WaveSine },
    { key: 'exploration', labelKey: 'achievements.group.exploration', icon: Compass },
    { key: 'milestones', labelKey: 'achievements.group.milestones', icon: Medal },
    { key: 'special', labelKey: 'achievements.group.special', icon: Moon },
  ];

  const filteredItems = $derived.by(() => {
    let result = achievementStore.items;
    if (activeFilter !== 'all') {
      result = result.filter((item) => item.definition.category === activeFilter);
    }
    if (activeGroup !== 'all') {
      result = result.filter((item) => item.definition.group === activeGroup);
    }
    return result;
  });

  interface GalleryCardData {
    item: AchievementItem;
    isPinned: boolean;
    tierMeta: {
      accentColor: string;
      fillColor: string;
      name: string;
    };
    tierDisplay: {
      title: string;
      badge: string;
    };
    title: string;
  }

  const galleryCards = $derived.by<GalleryCardData[]>(() => {
    const pinnedLookup = getPinnedItemsLookup(achievementStore.showcaseSlots);

    return filteredItems.map((item) => {
      const isAdv = item.definition.category === 'advancement';
      const firstTier = item.definition.tiers[0] ?? { tier: 1, target: 1, labelKey: '', descKey: '' };
      const activeTierDef = isAdv
        ? firstTier
        : (item.definition.tiers.find((td) => td.tier === item.currentTier) ?? firstTier);

      const tierMeta = isAdv
        ? getAdvancementRankMeta(firstTier.tier)
        : getTierMeta(item.currentTier);
      const tierDisplay = isAdv
        ? formatAdvancementDisplay(firstTier.tier, t)
        : formatTierDisplay(item.currentTier, t);

      return {
        item,
        isPinned: Boolean(pinnedLookup[item.definition.id]),
        tierMeta,
        tierDisplay,
        title: activeTierDef?.labelKey ? t(activeTierDef.labelKey) : item.definition.id,
      };
    });
  });

  function handlePinRequest(item: AchievementItem) {
    if (!item.isUnlocked) return;
    selectedPinItem = item;
  }
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
          <span>{t('achievements.navGallery')}</span>
        </h1>
        <p class="text-xs text-tt-text-secondary mt-0.5">
          {t('achievements.galleryDesc')}
        </p>
      </div>
    </div>

    <!-- Quick Sub-Route Switcher -->
    <AppSegmented class="self-start sm:self-center">
      <AppSegmentedButton active={false} onclick={() => goto('/profiles/achievements')}>
        {t('achievements.navAchievements')}
      </AppSegmentedButton>
      <AppSegmentedButton active={false} onclick={() => goto('/profiles/advancements')}>
        {t('achievements.navAdvancements')}
      </AppSegmentedButton>
      <AppSegmentedButton active={true} onclick={() => goto('/profiles/gallery')}>
        {t('achievements.navGallery')}
      </AppSegmentedButton>
    </AppSegmented>
  </div>

  <!-- Showcase Section (7 Slots) -->
  <AppCard padding="p-5 sm:p-6" class="bg-tt-surface border border-tt-separator/40 dark:border-white/5 shadow-xs">
    <TrophyShowcase />
  </AppCard>

  <!-- Filter Controls Card -->
  <AppCard padding="p-5 sm:p-6" class="bg-tt-surface border border-tt-separator/40 dark:border-white/5 shadow-xs space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <span class="text-3xs uppercase tracking-wider font-bold text-tt-text-secondary">Full Trophy Exhibition</span>
        <div class="flex items-baseline gap-2.5 mt-1">
          <span class="text-2xl sm:text-3xl font-extrabold font-mono text-tt-text whitespace-nowrap">
            {achievementStore.unlockedCount} / {achievementStore.totalCount}
          </span>
          <span class="text-xs sm:text-sm font-mono font-semibold text-tt-text-secondary whitespace-nowrap">
            {t('achievements.unlocked')}
          </span>
          <span class="text-xs sm:text-sm font-mono font-bold text-tt-primary whitespace-nowrap">({achievementStore.completionPercent}%)</span>
        </div>
      </div>

      <!-- Category Filter Segmented Control -->
      <AppSegmented class="self-start sm:self-center">
        <AppSegmentedButton
          active={activeFilter === 'all'}
          onclick={() => (activeFilter = 'all')}
        >
          {t('achievements.filterAll')}
        </AppSegmentedButton>
        <AppSegmentedButton
          active={activeFilter === 'achievement'}
          onclick={() => (activeFilter = 'achievement')}
        >
          {t('achievements.filterAchievements')}
        </AppSegmentedButton>
        <AppSegmentedButton
          active={activeFilter === 'advancement'}
          onclick={() => (activeFilter = 'advancement')}
        >
          {t('achievements.filterAdvancements')}
        </AppSegmentedButton>
      </AppSegmented>
    </div>

    <!-- Group Filter Buttons -->
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

  <!-- Pure Trophy Exhibition Grid (5 Columns) -->
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 [contain:layout_style]">
    {#each galleryCards as { item, isPinned, tierMeta, tierDisplay, title } (item.definition.id)}
      <LazyTrophyCard
        {item}
        {isPinned}
        {tierMeta}
        {tierDisplay}
        {title}
        onPin={handlePinRequest}
      />
    {/each}
  </div>

  {#if selectedPinItem !== null}
    <ShowcasePinSlotModal
      opened={true}
      item={selectedPinItem}
      onclose={() => (selectedPinItem = null)}
    />
  {/if}
</AppPage>
