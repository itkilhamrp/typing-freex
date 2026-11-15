<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import {
    useAchievementStore,
    type AchievementItem,
  } from '../stores/achievement.store.svelte';
  import {
    AppSegmented,
    AppSegmentedButton,
    AppCard,
  } from '#lib/shared/ui/index.js';
  import TrophyCard from './TrophyCard.svelte';
  import ShowcasePinSlotModal from './ShowcasePinSlotModal.svelte';
  import { getPinnedItemsLookup } from '../logic/showcase-slot.logic';
  import {
    Lightning,
    Target,
    HourglassHigh,
    WaveSine,
    Compass,
    Trophy,
    Sparkle,
  } from 'phosphor-svelte';
  import type { AchievementGroup } from '@/core/achievements';
  import { SvelteMap } from 'svelte/reactivity';

  const { t } = useI18n();
  const achievementStore = useAchievementStore();

  let activeFilter = $state<'all' | 'achievement' | 'advancement'>('all');
  let selectedPinItem = $state<AchievementItem | null>(null);

  const GROUPS: { key: AchievementGroup; icon: typeof Lightning }[] = [
    { key: 'speed', icon: Lightning },
    { key: 'accuracy', icon: Target },
    { key: 'endurance', icon: HourglassHigh },
    { key: 'consistency', icon: WaveSine },
    { key: 'exploration', icon: Compass },
    { key: 'milestones', icon: Trophy },
    { key: 'special', icon: Sparkle },
  ];

  const filteredItems = $derived.by(() => {
    if (activeFilter === 'all') return achievementStore.items;
    return achievementStore.items.filter(
      (item) => item.definition.category === activeFilter,
    );
  });

  const pinnedLookup = $derived.by(() => {
    return getPinnedItemsLookup(achievementStore.showcaseSlots);
  });

  const groupedItems = $derived.by(() => {
    const map = new SvelteMap<AchievementGroup, AchievementItem[]>();
    for (const g of GROUPS) {
      map.set(g.key, []);
    }
    for (const item of filteredItems) {
      const arr = map.get(item.definition.group);
      if (arr) {
        arr.push(item);
      } else {
        map.set(item.definition.group, [item]);
      }
    }
    return map;
  });

  function handlePinRequest(item: AchievementItem) {
    if (!item.isUnlocked) return;
    selectedPinItem = item;
  }
</script>

<div class="space-y-6">
  <!-- Top Summary Banner -->
  <AppCard padding="p-5 sm:p-6" class="bg-tt-surface-elevated border-tt-separator/50 shadow-sm space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-tt-text">{t('achievements.trophyGallery')}</h2>
        <p class="text-xs text-tt-text-secondary mt-1">
          {t('achievements.totalProgress', {
            unlocked: achievementStore.unlockedCount,
            total: achievementStore.totalCount,
            percent: achievementStore.completionPercent,
          })}
        </p>
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

    <!-- Overall Progress Bar -->
    <div class="space-y-1.5">
      <div class="w-full h-2.5 rounded-full bg-tt-surface-2 overflow-hidden border border-tt-separator/30">
        <div
          class="h-full rounded-full bg-gradient-to-r from-tt-primary via-tt-primary to-ios-green transition-[width] duration-500"
          style="width: {achievementStore.completionPercent}%;"
        ></div>
      </div>
    </div>
  </AppCard>

  <!-- Grouped Lists -->
  <div class="space-y-8">
    {#each GROUPS as { key, icon: GroupIcon } (key)}
      {@const groupItems = groupedItems.get(key) ?? []}
      {#if groupItems.length > 0}
        <section class="space-y-3.5">
          <!-- Section Header -->
          <div class="flex items-center gap-2 border-b border-tt-separator/40 pb-2">
            <GroupIcon class="w-4 h-4 text-tt-primary" />
            <h3 class="text-sm font-bold uppercase tracking-wider text-tt-text">
              {t(`achievements.group.${key}`)}
            </h3>
            <span class="text-2xs font-mono text-tt-text-secondary">
              ({groupItems.filter((i) => i.isUnlocked).length}/{groupItems.length})
            </span>
          </div>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 [contain:layout_style]">
            {#each groupItems as item (item.definition.id)}
              <TrophyCard
                {item}
                isPinned={Boolean(pinnedLookup[item.definition.id])}
                onPin={handlePinRequest}
              />
            {/each}
          </div>
        </section>
      {/if}
    {/each}
  </div>

  {#if selectedPinItem !== null}
    <ShowcasePinSlotModal
      opened={true}
      item={selectedPinItem}
      onclose={() => (selectedPinItem = null)}
    />
  {/if}
</div>
