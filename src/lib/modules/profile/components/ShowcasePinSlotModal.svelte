<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { AppDialog, AppBadge } from '#lib/shared/ui/index.js';
  import { useAchievementStore, type AchievementItem } from '../stores/achievement.store.svelte';
  import {
    buildSlotDisplayList,
    getPinnedSlot,
  } from '../logic/showcase-slot.logic';
  import TrophyIcon from './TrophyIcon.svelte';
  import { getTierMeta, formatTierDisplay } from '@/core/achievements/tier-system';
  import { getAdvancementRankMeta, formatAdvancementDisplay } from '@/core/achievements/advancement-rank';
  import { PushPin, Plus, ArrowsClockwise, Trash } from 'phosphor-svelte';

  interface Props {
    opened: boolean;
    item: AchievementItem | null;
    onclose: () => void;
  }

  let { opened, item, onclose }: Props = $props();

  const { t } = useI18n();
  const achievementStore = useAchievementStore();

  let isSubmitting = $state(false);

  const isAdvancement = $derived(item?.definition.category === 'advancement');
  const activeTier = $derived(
    isAdvancement
      ? (item?.definition.tiers[0]?.tier ?? 1)
      : (item?.currentTier ?? 1),
  );

  const targetTierMeta = $derived(
    isAdvancement ? getAdvancementRankMeta(activeTier) : getTierMeta(activeTier),
  );

  const targetTierDisplay = $derived.by(() => {
    if (!item) return { title: '', badge: '' };
    return isAdvancement
      ? formatAdvancementDisplay(activeTier, t)
      : formatTierDisplay(activeTier, t);
  });

  const targetTitle = $derived.by(() => {
    if (!item) return '';
    const def = item.definition;
    const tierDef = isAdvancement
      ? def.tiers[0]
      : (def.tiers.find((td) => td.tier === item.currentTier) ?? def.tiers[0]);
    return tierDef?.labelKey ? t(tierDef.labelKey) : def.id;
  });

  const currentPinnedSlot = $derived.by(() => {
    if (!item) return null;
    return getPinnedSlot(achievementStore.showcaseSlots, item.definition.id);
  });

  const slotsList = $derived.by(() => {
    if (!item) return [];
    return buildSlotDisplayList(
      achievementStore.showcaseSlots,
      achievementStore.items,
      item.definition.id,
    );
  });

  async function handleAssignSlot(slotNumber: number) {
    if (!item || isSubmitting) return;
    isSubmitting = true;
    try {
      await achievementStore.setShowcase(slotNumber, item.definition.id, item.itemType);
      onclose();
    } finally {
      isSubmitting = false;
    }
  }

  async function handleUnpin(slotNumber: number) {
    if (isSubmitting) return;
    isSubmitting = true;
    try {
      await achievementStore.setShowcase(slotNumber, null);
      onclose();
    } finally {
      isSubmitting = false;
    }
  }

  function getSlotItemTitle(slotItem: AchievementItem | null): string {
    if (!slotItem) return '';
    const isAdv = slotItem.definition.category === 'advancement';
    const tierDef = isAdv
      ? slotItem.definition.tiers[0]
      : (slotItem.definition.tiers.find((td) => td.tier === slotItem.currentTier) ?? slotItem.definition.tiers[0]);
    return tierDef?.labelKey ? t(tierDef.labelKey) : slotItem.definition.id;
  }
</script>

<AppDialog
  {opened}
  title={t('achievements.selectSlotTitle')}
  onbackdropClick={() => {
    if (!isSubmitting) onclose();
  }}
>
  {#if item}
    <div class="space-y-4 py-1 select-none">
      <!-- Target Trophy Summary Header Banner -->
      <div
        class="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 bg-tt-surface-2/70 border-tt-separator/50"
        style="border-color: {targetTierMeta.accentColor}40;"
      >
        <div class="shrink-0 flex items-center justify-center">
          <TrophyIcon
            uniqueId={item.definition.id}
            icon={item.definition.icon}
            tier={activeTier}
            shape={item.definition.trophyShape}
            advancementShape={item.definition.advancementShape}
            category={item.definition.category}
            unlocked={item.isUnlocked}
            size="md"
          />
        </div>

        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs sm:text-sm font-bold text-tt-text truncate">
              {targetTitle}
            </span>
            <AppBadge
              variant="custom"
              size="sm"
              accentColor={targetTierMeta.accentColor}
              fillColor={targetTierMeta.fillColor}
            >
              {targetTierDisplay.badge}
            </AppBadge>
          </div>

          <p class="text-2xs text-tt-text-secondary">
            {#if currentPinnedSlot !== null}
              <span class="text-tt-primary font-semibold">
                {t('achievements.currentlyPinnedIn', { slot: currentPinnedSlot })}
              </span>
            {:else}
              <span>{t('achievements.selectSlotHint')}</span>
            {/if}
          </p>
        </div>
      </div>

      <!-- 7 Showcase Slots Interactive List -->
      <div class="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {#each slotsList as slotData (slotData.slot)}
          {@const isThisItem = slotData.isTargetItem}
          {@const isEmpty = slotData.isEmpty}
          {@const slotItem = slotData.currentItem}
          {@const slotTitle = getSlotItemTitle(slotItem)}
          {@const isSlotAdv = slotItem?.definition.category === 'advancement'}
          {@const slotTier = isSlotAdv ? (slotItem?.definition.tiers[0]?.tier ?? 1) : (slotItem?.currentTier ?? 1)}

          <div
            class="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border transition-all duration-150 {isThisItem
              ? 'bg-tt-primary/10 border-tt-primary shadow-xs ring-1 ring-tt-primary/30'
              : isEmpty
                ? 'bg-tt-surface/60 border-dashed border-tt-separator/60 hover:border-tt-primary/60 hover:bg-tt-surface-2/40'
                : 'bg-tt-surface-2/50 border-tt-separator/40 hover:bg-tt-surface-2 hover:border-tt-separator/80'}"
          >
            <!-- Slot Badge & Item Preview -->
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <!-- Slot Number Badge -->
              <div
                class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors {isThisItem
                  ? 'bg-tt-primary text-white'
                  : 'bg-tt-surface-3 text-tt-text-secondary'}"
              >
                {slotData.slot}
              </div>

              <!-- Slot Item Visual Preview -->
              <div class="shrink-0 flex items-center justify-center">
                {#if isEmpty}
                  <div class="w-7 h-7 rounded-lg border border-dashed border-tt-separator flex items-center justify-center text-tt-text-secondary/70">
                    <Plus class="w-3.5 h-3.5" />
                  </div>
                {:else if slotItem}
                  <TrophyIcon
                    icon={slotItem.definition.icon}
                    tier={slotTier}
                    shape={slotItem.definition.trophyShape}
                    advancementShape={slotItem.definition.advancementShape}
                    category={slotItem.definition.category}
                    unlocked={true}
                    size="sm"
                  />
                {/if}
              </div>

              <!-- Slot Description Texts -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold truncate {isThisItem ? 'text-tt-primary' : 'text-tt-text'}">
                    {#if isEmpty}
                      {t('achievements.showcaseEmpty')}
                    {:else}
                      {slotTitle}
                    {/if}
                  </span>
                </div>
                <span class="block text-3xs text-tt-text-secondary uppercase tracking-wider font-semibold">
                  {t('achievements.slotLabel', { slot: slotData.slot })}
                  {#if isThisItem}
                    · <span class="text-tt-primary font-bold">{t('achievements.currentlyPinnedBadge')}</span>
                  {/if}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="shrink-0 flex items-center gap-1.5">
              {#if isThisItem}
                <!-- Unpin Action -->
                <button
                  type="button"
                  disabled={isSubmitting}
                  onclick={() => handleUnpin(slotData.slot)}
                  class="px-2.5 py-1.5 rounded-lg text-2xs font-semibold flex items-center gap-1 text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  title={t('achievements.unpinFromShowcase')}
                >
                  <Trash class="w-3.5 h-3.5" />
                  <span>{t('achievements.unpinSlot')}</span>
                </button>
              {:else if isEmpty}
                <!-- Place in Empty Slot -->
                <button
                  type="button"
                  disabled={isSubmitting}
                  onclick={() => handleAssignSlot(slotData.slot)}
                  class="px-3 py-1.5 rounded-lg text-2xs font-bold flex items-center gap-1 bg-tt-primary hover:bg-tt-primary/90 text-white active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <PushPin class="w-3.5 h-3.5 fill-current" />
                  <span>{t('achievements.placeInSlot')}</span>
                </button>
              {:else}
                <!-- Swap Slot Action -->
                <button
                  type="button"
                  disabled={isSubmitting}
                  onclick={() => handleAssignSlot(slotData.slot)}
                  class="px-2.5 py-1.5 rounded-lg text-2xs font-semibold flex items-center gap-1 bg-tt-surface-3 hover:bg-tt-surface hover:text-tt-primary text-tt-text-secondary border border-tt-separator/50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  title={t('achievements.swapWithSlot')}
                >
                  <ArrowsClockwise class="w-3.5 h-3.5" />
                  <span>{t('achievements.swapWithSlot')}</span>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#snippet buttonsSlot()}
    <div class="flex items-center justify-end p-2 w-full">
      <button
        type="button"
        disabled={isSubmitting}
        class="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-tt-surface-2 text-tt-text cursor-pointer transition-colors disabled:opacity-50"
        onclick={onclose}
      >
        {t('common.cancel')}
      </button>
    </div>
  {/snippet}
</AppDialog>

