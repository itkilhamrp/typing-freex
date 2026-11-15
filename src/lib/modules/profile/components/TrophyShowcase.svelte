<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useAchievementStore, type AchievementItem } from '../stores/achievement.store.svelte';
  import TrophyIcon from './TrophyIcon.svelte';
  import ShowcasePickerDialog from './ShowcasePickerDialog.svelte';
  import { getTierMeta } from '@/core/achievements/tier-system';
  import { getAdvancementRankMeta } from '@/core/achievements/advancement-rank';
  import { Plus, PushPin } from 'phosphor-svelte';

  const { t } = useI18n();
  const achievementStore = useAchievementStore();

  let activePickerSlot = $state<number | null>(null);

  function openPicker(slot: number) {
    activePickerSlot = slot;
  }

  function closePicker() {
    activePickerSlot = null;
  }
</script>

{#snippet slotCard({ slot, item }: { slot: number; item: AchievementItem | null })}
  <div class="showcase-slot-item">
    {#if item}
      {@const isAdv = item.definition.category === 'advancement'}
      {@const activeTierDef = item.definition.tiers.find((td) => td.tier === item.currentTier) ?? item.definition.tiers[0]}
      {@const meta = isAdv ? getAdvancementRankMeta(item.definition.tiers[0]?.tier ?? 1) : getTierMeta(item.currentTier)}
      <!-- Filled Slot -->
      <button
        type="button"
        onclick={() => openPicker(slot)}
        class="showcase-card group rounded-2xl bg-tt-surface border hover:border-tt-primary/60 shadow-xs transition-[border-color,box-shadow,background-color] duration-150 flex flex-col items-center justify-center p-2.5 sm:p-4 text-center cursor-pointer w-full h-full"
        style={`border-color: ${meta.accentColor}33;`}
      >
        <TrophyIcon
          uniqueId={item.definition.id}
          icon={item.definition.icon}
          tier={isAdv ? (item.definition.tiers[0]?.tier ?? 1) : item.currentTier}
          shape={item.definition.trophyShape}
          advancementShape={item.definition.advancementShape}
          category={item.definition.category}
          unlocked={true}
          size="lg"
        />
        <span class="block text-xs sm:text-sm font-bold text-tt-text line-clamp-2 leading-tight group-hover:text-tt-primary transition-colors max-w-full px-1">
          {activeTierDef && activeTierDef.labelKey ? t(activeTierDef.labelKey) : (t(`advancements.${item.definition.id}`) || t(`achievements.${item.definition.id}`) || item.definition.id)}
        </span>
      </button>
    {:else}
      <!-- Empty Slot -->
      <button
        type="button"
        onclick={() => openPicker(slot)}
        class="showcase-card rounded-2xl border-2 border-dashed border-tt-separator/40 hover:border-tt-primary/50 hover:bg-tt-surface-2/40 bg-tt-surface/50 transition-[border-color,background-color] duration-150 flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 text-tt-text-secondary hover:text-tt-text cursor-pointer w-full h-full text-center"
      >
        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-tt-surface-2 flex items-center justify-center text-tt-text-secondary shrink-0">
          <Plus class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div>
          <span class="block text-3xs uppercase tracking-wider font-bold text-tt-text-secondary/70">
            {t('achievements.slotLabel', { slot })}
          </span>
          <span class="block text-2xs sm:text-xs font-medium text-tt-text-secondary mt-0.5">
            {t('achievements.showcaseEmpty')}
          </span>
        </div>
      </button>
    {/if}
  </div>
{/snippet}

<div class="space-y-3">
  <!-- Section Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <PushPin class="w-4 h-4 text-tt-primary" />
      <h2 class="text-base font-bold text-tt-text">{t('achievements.showcase')}</h2>
    </div>
    <span class="text-2xs text-tt-text-secondary font-medium">
      {t('achievements.showcaseHint')}
    </span>
  </div>

  <!-- 7 Showcase Slots Grid (Row 1: 3 Centered Slots | Row 2: 4 Centered Slots — 1:1 Square) -->
  <div class="showcase-slots-container">
    <!-- Row 1: 3 Cards Centered -->
    <div class="showcase-row">
      {#each achievementStore.showcaseItems.slice(0, 3) as slotData (slotData.slot)}
        {@render slotCard(slotData)}
      {/each}
    </div>

    <!-- Row 2: 4 Cards Centered -->
    <div class="showcase-row">
      {#each achievementStore.showcaseItems.slice(3, 7) as slotData (slotData.slot)}
        {@render slotCard(slotData)}
      {/each}
    </div>
  </div>

  {#if activePickerSlot !== null}
    <ShowcasePickerDialog
      opened={true}
      slot={activePickerSlot}
      onclose={closePicker}
    />
  {/if}
</div>

<style>
  .showcase-slots-container {
    --showcase-card-size: clamp(4.5rem, 21vw, 7.5rem);
    --showcase-gap: 0.5rem;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--showcase-gap);
    width: 100%;
    margin-inline: auto;
    contain: layout style;
  }

  .showcase-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--showcase-gap);
    width: 100%;
    max-width: 100%;
  }

  @media (min-width: 640px) {
    .showcase-slots-container {
      --showcase-card-size: 9.5rem;
      --showcase-gap: 0.875rem;
    }
  }

  @media (min-width: 1024px) {
    .showcase-slots-container {
      --showcase-card-size: 10.25rem;
      --showcase-gap: 1rem;
    }
  }

  .showcase-slot-item {
    width: var(--showcase-card-size);
    height: var(--showcase-card-size);
    flex: 0 0 var(--showcase-card-size);
    aspect-ratio: 1 / 1;
    display: flex;
    box-sizing: border-box;
  }

  .showcase-card {
    aspect-ratio: 1 / 1;
    box-sizing: border-box;
    gap: 0.5rem;
  }
</style>
