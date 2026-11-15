<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { AppDialog } from '#lib/shared/ui/index.js';
  import { useAchievementStore, type AchievementItem } from '../stores/achievement.store.svelte';
  import TrophyIcon from './TrophyIcon.svelte';

  interface Props {
    opened: boolean;
    itemToPin: AchievementItem | null;
    onclose: () => void;
  }

  let { opened, itemToPin, onclose }: Props = $props();

  const { t } = useI18n();
  const achievementStore = useAchievementStore();

  async function handleSelectSlot(slot: number) {
    if (!itemToPin) return;
    await achievementStore.setShowcase(slot, itemToPin.definition.id, itemToPin.itemType);
    onclose();
  }
</script>

<AppDialog
  {opened}
  title={t('achievements.replaceSlotTitle')}
  onbackdropClick={onclose}
>
  <div class="space-y-4 py-2 max-h-96 overflow-y-auto pr-1">
    <p class="text-xs text-tt-text-secondary">
      {t('achievements.replaceSlotHint')}
    </p>

    <div class="space-y-2">
      {#each achievementStore.showcaseItems as { slot, item } (slot)}
        {@const isAdv = item?.definition.category === 'advancement'}
        {@const activeTierDef = item?.definition.tiers.find((td) => td.tier === item.currentTier) ?? item?.definition.tiers[0]}
        {@const title = activeTierDef?.labelKey ? t(activeTierDef.labelKey) : item?.definition.id ?? t('achievements.showcaseEmpty')}

        <button
          type="button"
          onclick={() => handleSelectSlot(slot)}
          class="w-full flex items-center gap-3 p-3 rounded-xl border bg-tt-surface-2/60 border-tt-separator/40 hover:bg-tt-surface-2 hover:border-tt-primary transition-all text-left cursor-pointer group"
        >
          <div class="w-8 h-8 rounded-lg bg-tt-surface-3 flex items-center justify-center text-xs font-bold text-tt-text-secondary shrink-0">
            {slot}
          </div>

          <div class="shrink-0">
            {#if item}
              <TrophyIcon
                icon={item.definition.icon}
                tier={isAdv ? (item.definition.tiers[0]?.tier ?? 1) : item.currentTier}
                shape={item.definition.trophyShape}
                advancementShape={item.definition.advancementShape}
                category={item.definition.category}
                unlocked={true}
                size="sm"
              />
            {:else}
              <div class="w-7 h-7 rounded-lg border border-dashed border-tt-separator flex items-center justify-center text-3xs text-tt-text-secondary">
                —
              </div>
            {/if}
          </div>

          <div class="min-w-0 flex-1">
            <span class="block text-xs font-bold text-tt-text group-hover:text-tt-primary truncate transition-colors">
              {title}
            </span>
            <span class="block text-3xs text-tt-text-secondary uppercase tracking-wider font-semibold">
              Slot {slot}
            </span>
          </div>

          <span class="text-2xs font-semibold text-tt-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 px-2 py-1 rounded-md bg-tt-primary/10">
            {t('achievements.replaceButton')}
          </span>
        </button>
      {/each}
    </div>
  </div>

  {#snippet buttonsSlot()}
    <div class="flex items-center justify-end p-2 w-full">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-tt-surface-2 text-tt-text cursor-pointer transition-colors"
        onclick={onclose}
      >
        {t('common.cancel')}
      </button>
    </div>
  {/snippet}
</AppDialog>
