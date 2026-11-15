<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useSettingsStore } from '#lib/modules/settings/stores/settings.store.svelte.js';
  import { AppDialog, AppButton } from '#lib/shared/ui/index.js';
  import { useAchievementStore, type AchievementItem } from '../stores/achievement.store.svelte';
  import { formatMissionDescription } from '@/core/achievements/tier-system';
  import TrophyIcon from './TrophyIcon.svelte';
  import { Trash } from 'phosphor-svelte';

  interface Props {
    opened: boolean;
    slot: number;
    onclose: () => void;
  }

  let { opened, slot, onclose }: Props = $props();

  const { t } = useI18n();
  const settingsStore = useSettingsStore();
  const speedUnit = $derived(settingsStore.speedUnit);
  const achievementStore = useAchievementStore();

  const unlockedItems = $derived(
    achievementStore.items.filter((item) => item.isUnlocked),
  );

  let isSubmitting = $state(false);

  async function selectAchievement(item: AchievementItem) {
    if (isSubmitting) return;
    isSubmitting = true;
    try {
      await achievementStore.setShowcase(slot, item.definition.id, item.itemType);
      onclose();
    } catch (err) {
      console.error('Failed to pin showcase item:', err);
    } finally {
      isSubmitting = false;
    }
  }

  async function unpinSlot() {
    if (isSubmitting) return;
    isSubmitting = true;
    try {
      await achievementStore.setShowcase(slot, null);
      onclose();
    } catch (err) {
      console.error('Failed to unpin showcase slot:', err);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<AppDialog
  {opened}
  title="{t('achievements.showcase')} — {t('achievements.slotLabel', { slot })}"
  onbackdropClick={onclose}
>
  <div class="space-y-4 py-2 max-h-80 overflow-y-auto pr-1">
    {#if unlockedItems.length === 0}
      <div class="p-6 text-center text-tt-text-secondary text-sm">
        <p>{t('achievements.noUnlocks')}</p>
      </div>
    {:else}
      <p class="text-xs text-tt-text-secondary">
        {t('achievements.showcaseHint')}
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {#each unlockedItems as item (item.definition.id)}
          {@const activeTierDef = item.definition.tiers.find((t) => t.tier === item.currentTier) ?? item.definition.tiers[0]}
          {@const isAlreadyPinned = achievementStore.showcaseSlots.some(
            (s) => s.slot === slot && s.item_id === item.definition.id,
          )}
          {@const isAdv = item.definition.category === 'advancement'}
          <button
            type="button"
            onclick={() => selectAchievement(item)}
            class="flex items-center gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer {isAlreadyPinned
              ? 'bg-tt-primary/10 border-tt-primary text-tt-text'
              : 'bg-tt-surface-2/60 border-tt-separator/40 hover:bg-tt-surface-2 hover:border-tt-separator text-tt-text'}"
          >
            <TrophyIcon
              uniqueId={item.definition.id}
              icon={item.definition.icon}
              tier={isAdv ? (item.definition.tiers[0]?.tier ?? 1) : item.currentTier}
              shape={item.definition.trophyShape}
              advancementShape={item.definition.advancementShape}
              category={item.definition.category}
              unlocked={true}
              size="sm"
            />
            <div class="min-w-0 flex-1">
              <span class="block text-xs font-bold truncate">
                {activeTierDef ? (t(activeTierDef.labelKey) || t(`advancements.${item.definition.id}`) || t(`achievements.${item.definition.id}`) || item.definition.id) : ''}
              </span>
              <span class="block text-2xs text-tt-text-secondary truncate">
                {activeTierDef ? formatMissionDescription(t(activeTierDef.descKey), speedUnit) : ''}
              </span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#snippet buttonsSlot()}
    <div class="flex items-center justify-between gap-2 p-2 w-full">
      <AppButton
        tonal
        small
        class="text-status-red hover:bg-status-red/10 cursor-pointer flex items-center gap-1.5"
        onclick={unpinSlot}
      >
        <Trash class="w-3.5 h-3.5" />
        <span>{t('achievements.unpinFromShowcase')}</span>
      </AppButton>

      <button
        type="button"
        class="px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-tt-surface-2 text-tt-text cursor-pointer transition-colors"
        onclick={onclose}
      >
        {t('common.cancel')}
      </button>
    </div>
  {/snippet}
</AppDialog>
