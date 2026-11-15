<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useSettingsStore } from '#lib/modules/settings/stores/settings.store.svelte.js';
  import { AppDialog, AppBadge } from '#lib/shared/ui/index.js';
  import type { AchievementItem } from '../stores/achievement.store.svelte';
  import TrophyIcon from './TrophyIcon.svelte';
  import {
    getTierMeta,
    formatTierDisplay,
    formatMissionDescription,
    getMissionEligibleModes,
  } from '@/core/achievements/tier-system';
  import { Check, Lock, Star } from 'phosphor-svelte';

  interface Props {
    opened: boolean;
    item: AchievementItem | null;
    onclose: () => void;
  }

  let { opened, item, onclose }: Props = $props();

  const { t } = useI18n();
  const settingsStore = useSettingsStore();
  const speedUnit = $derived(settingsStore.speedUnit);

  const currentTier = $derived(item?.currentTier ?? 0);
  const tiers = $derived(item?.definition.tiers ?? []);
  const currentValue = $derived(item?.progress.current_value ?? 0);

  const nextTierDef = $derived.by(() => {
    return tiers.find((td) => td.tier > currentTier) ?? null;
  });

  const isSpeed = $derived(
    item?.definition.id === 'speed_tier' || item?.definition.id === 'raw_speed_tier',
  );

  const displayCurrentValue = $derived(
    isSpeed && speedUnit === 'cpm'
      ? Math.round(currentValue * 5)
      : currentValue,
  );

  const eligibleModes = $derived(
    item ? getMissionEligibleModes(item.definition) : [],
  );

  function getModeLabel(mode: string): string {
    switch (mode) {
      case 'all':
        return t('achievements.allModes');
      case 'time':
        return t('arena.modeTime');
      case 'words':
        return t('arena.modeWords');
      case 'quote':
        return t('arena.modeQuote');
      case 'tech':
        return t('arena.modeTech');
      case 'zen':
        return t('arena.modeZen');
      case 'custom':
        return t('arena.modeCustom');
      default:
        return mode.charAt(0).toUpperCase() + mode.slice(1);
    }
  }
</script>

<AppDialog
  {opened}
  title={t('achievements.tierLadderTitle')}
  onbackdropClick={onclose}
>
  {#if item}
    <div class="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1 [contain:layout_style]">
      <!-- Header Summary -->
      <div class="flex items-center gap-3.5 p-3.5 rounded-2xl bg-tt-surface-2/70 border border-tt-separator/40">
        <TrophyIcon
          icon={item.definition.icon}
          tier={item.currentTier}
          shape={item.definition.trophyShape}
          category={item.definition.category}
          unlocked={item.isUnlocked}
          size="md"
        />
        <div class="min-w-0 flex-1">
          <span class="block text-3xs font-bold uppercase tracking-wider text-tt-text-secondary">
            {t(`achievements.group.${item.definition.group}`)}
          </span>
          <span class="block text-sm font-bold text-tt-text truncate">
            {nextTierDef?.labelKey ? t(nextTierDef.labelKey) : (t(`advancements.${item.definition.id}`) || t(`achievements.${item.definition.id}`) || item.definition.id)}
          </span>
          <span class="block text-2xs font-mono text-tt-text-secondary mt-0.5">
            {t('achievements.progress', {
              current: displayCurrentValue,
              target: nextTierDef
                ? (isSpeed && speedUnit === 'cpm' ? nextTierDef.target * 5 : nextTierDef.target)
                : displayCurrentValue,
            })}
          </span>

          <!-- Eligible Modes Badges -->
          <div class="flex items-center gap-1.5 flex-wrap mt-2">
            <span class="text-3xs font-semibold text-tt-text-secondary/70 uppercase tracking-wider">{t('achievements.eligibleModes')}:</span>
            {#each eligibleModes as modeKey (modeKey)}
              <span class="inline-flex items-center text-3xs font-medium px-1.5 py-0.5 rounded-md bg-tt-surface-2 text-tt-text-secondary border border-tt-separator/40">
                {getModeLabel(modeKey)}
              </span>
            {/each}
          </div>
        </div>
      </div>

      <!-- Tiers Ladder List -->
      <div class="space-y-2">
        {#each tiers as tierDef (tierDef.tier)}
          {@const isUnlocked = tierDef.tier <= currentTier}
          {@const isNextTarget = !isUnlocked && nextTierDef !== null && tierDef.tier === nextTierDef.tier}
          {@const tierMeta = getTierMeta(tierDef.tier)}
          {@const tierDisplay = formatTierDisplay(tierDef.tier, t)}
          {@const tierTarget = isSpeed && speedUnit === 'cpm' ? tierDef.target * 5 : tierDef.target}
          {@const tierPercent = Math.min(100, Math.max(0, Math.round((currentValue / tierDef.target) * 100)))}
          {@const tierDesc = formatMissionDescription(t(tierDef.descKey), speedUnit)}

          <div
            class="p-3 rounded-xl border transition-all {isUnlocked
              ? 'bg-tt-surface-elevated/90 border-tt-separator/60'
              : isNextTarget
                ? 'bg-tt-primary/5 border-tt-primary/50 shadow-xs'
                : 'bg-tt-surface-2/30 border-tt-separator/20 opacity-60'}"
            style={isUnlocked
              ? `border-color: ${tierMeta.accentColor}33;`
              : isNextTarget
                ? `border-color: ${tierMeta.accentColor}80; box-shadow: 0 0 12px ${tierMeta.fillColor}15;`
                : undefined}
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-2.5 min-w-0">
                <!-- Rank Badge -->
                <AppBadge
                  variant="custom"
                  size="sm"
                  accentColor={tierMeta.accentColor}
                  fillColor={tierMeta.fillColor}
                >
                  {#snippet icon()}
                    {#if tierMeta.isStarRank}
                      <Star class="w-3 h-3 fill-current" />
                    {/if}
                  {/snippet}
                  {tierDisplay.badge}
                </AppBadge>

                <!-- Title & Target -->
                <div class="min-w-0">
                  <span class="block text-xs font-bold text-tt-text truncate">
                    {t(tierDef.labelKey)}
                  </span>
                  <span class="block text-3xs text-tt-text-secondary font-mono">
                    {t('achievements.tierTarget', {
                      target: isSpeed ? `${tierTarget} ${speedUnit.toUpperCase()}` : tierTarget,
                    })}
                  </span>
                </div>
              </div>

              <!-- Status Chip -->
              <div class="shrink-0 flex items-center gap-1">
                {#if isUnlocked}
                  <AppBadge variant="success" size="sm">
                    {#snippet icon()}
                      <Check class="w-3 h-3" />
                    {/snippet}
                    {t('achievements.tierStatusCompleted')}
                  </AppBadge>
                {:else if isNextTarget}
                  <AppBadge variant="primary" size="sm">
                    {t('achievements.tierStatusCurrent')}
                  </AppBadge>
                {:else}
                  <AppBadge variant="muted" size="sm">
                    {#snippet icon()}
                      <Lock class="w-3 h-3" />
                    {/snippet}
                    {t('achievements.tierStatusLocked')}
                  </AppBadge>
                {/if}
              </div>
            </div>

            <!-- Description -->
            <p class="text-3xs text-tt-text-secondary mt-1.5 leading-relaxed">
              {tierDesc}
            </p>

            <!-- Progress Track (only for active target) -->
            {#if isNextTarget}
              <div class="mt-2 space-y-1">
                <div class="flex items-center justify-between text-3xs font-mono text-tt-text-secondary">
                  <span>{displayCurrentValue} / {tierTarget}</span>
                  <span>{tierPercent}%</span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-tt-surface-2 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-tt-primary transition-all duration-300"
                    style="width: {tierPercent}%;"
                  ></div>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

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
