<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useSettingsStore } from '#lib/modules/settings/stores/settings.store.svelte.js';
  import { AppBadge } from '#lib/shared/ui/index.js';
  import type { AchievementItem } from '../stores/achievement.store.svelte';
  import TrophyIcon from './TrophyIcon.svelte';
  import {
    getTierMeta,
    formatTierDisplay,
    formatMissionDescription,
    getMissionEligibleModes,
  } from '@/core/achievements/tier-system';
  import {
    getAdvancementRankMeta,
    formatAdvancementDisplay,
  } from '@/core/achievements/advancement-rank';
  import { PushPin, ListNumbers } from 'phosphor-svelte';

  interface Props {
    item: AchievementItem;
    isPinned?: boolean;
    onPin?: (item: AchievementItem) => void;
    onViewLadder?: (item: AchievementItem) => void;
  }

  let { item, isPinned = false, onPin, onViewLadder }: Props = $props();

  const { t } = useI18n();
  const settingsStore = useSettingsStore();
  const speedUnit = $derived(settingsStore.speedUnit);

  const isAdvancement = $derived(item.definition.category === 'advancement');

  const defaultTierDef = {
    tier: 1,
    target: 1,
    labelKey: '',
    descKey: '',
  };
  const currentTier = $derived(item.currentTier);
  const tiers = $derived(item.definition.tiers);
  const firstTier = $derived(tiers[0] ?? defaultTierDef);
  const maxTier = $derived(tiers[tiers.length - 1]?.tier ?? 1);
  const isCompleted = $derived(isAdvancement ? item.isUnlocked : currentTier >= maxTier);

  // Active goal tier definition to display:
  // For achievements: dynamically points to the NEXT tier goal being pursued.
  // For advancements: always uses the single advancement mission definition.
  const displayTierDef = $derived.by(() => {
    if (isAdvancement) {
      return firstTier;
    }
    const next = tiers.find((td) => td.tier > currentTier);
    if (next) return next;
    const match = tiers.find((td) => td.tier === currentTier);
    return match ?? firstTier;
  });

  const nextTarget = $derived.by(() => {
    return displayTierDef.target;
  });

  const isSpeedTarget = $derived(
    item.definition.id === 'speed_tier' || item.definition.id === 'raw_speed_tier',
  );

  const displayCurrent = $derived(
    isSpeedTarget && speedUnit === 'cpm'
      ? Math.round(item.progress.current_value * 5)
      : item.progress.current_value,
  );

  const displayTarget = $derived(
    isSpeedTarget && speedUnit === 'cpm'
      ? Math.round(nextTarget * 5)
      : nextTarget,
  );

  const formattedDesc = $derived(
    formatMissionDescription(
      displayTierDef.descKey ? t(displayTierDef.descKey) : '',
      speedUnit,
    ),
  );

  const eligibleModes = $derived(getMissionEligibleModes(item.definition));

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

  const progressPercent = $derived.by(() => {
    if (isCompleted) return 100;
    const target = nextTarget;
    if (target <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((item.progress.current_value / target) * 100)));
  });

  const tierMeta = $derived(getTierMeta(currentTier));
  const rankMeta = $derived(getAdvancementRankMeta(firstTier.tier));

  const badgeDisplay = $derived.by(() => {
    if (isAdvancement) {
      const advDisp = formatAdvancementDisplay(firstTier.tier, t);
      return {
        badge: advDisp.badge,
        fillColor: rankMeta.fillColor,
        accentColor: rankMeta.accentColor,
      };
    }
    const achDisp = formatTierDisplay(currentTier, t);
    return {
      badge: achDisp.badge,
      fillColor: tierMeta.fillColor,
      accentColor: tierMeta.accentColor,
    };
  });

  function formatDate(iso?: string | null): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  }
</script>

<div
  class="relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 [content-visibility:auto] [contain-intrinsic-size:auto_160px] transition-[border-color,background-color,transform] duration-150 border {item.isUnlocked
    ? 'bg-tt-surface-elevated hover:border-tt-primary/60 shadow-xs'
    : 'bg-tt-surface-2/40 border-tt-separator/20 opacity-75'}"
  style={item.isUnlocked
    ? `border-color: ${badgeDisplay.accentColor}33; box-shadow: 0 0 16px ${badgeDisplay.fillColor}12;`
    : undefined}
>
  <!-- Header: Icon + Badges + Actions -->
  <div class="flex items-start justify-between gap-3">
    <TrophyIcon
      uniqueId={item.definition.id}
      icon={item.definition.icon}
      tier={isAdvancement ? firstTier.tier : item.currentTier}
      shape={item.definition.trophyShape}
      advancementShape={item.definition.advancementShape}
      category={item.definition.category}
      unlocked={item.isUnlocked}
      size="lg"
    />

    <div class="flex items-center gap-1.5 flex-wrap justify-end">
      <!-- Tier / Status Pill -->
      {#if item.isUnlocked}
        <AppBadge
          variant="custom"
          size="md"
          accentColor={badgeDisplay.accentColor}
          fillColor={badgeDisplay.fillColor}
        >
          {badgeDisplay.badge}
        </AppBadge>
      {:else}
        <AppBadge variant="muted" size="md">
          {t('achievements.tier.locked')}
        </AppBadge>
      {/if}

      <!-- Tier Ladder Button (only for multi-tier achievements) -->
      {#if !isAdvancement}
        <button
          type="button"
          title={t('achievements.viewLadder')}
          onclick={() => onViewLadder?.(item)}
          class="p-1 rounded-lg border bg-tt-surface-2 text-tt-text-secondary hover:text-tt-text border-tt-separator/50 transition-colors cursor-pointer"
        >
          <ListNumbers class="w-3.5 h-3.5" />
        </button>
      {/if}

      <!-- Pin to Showcase button (only if unlocked) -->
      {#if item.isUnlocked && onPin}
        <button
          type="button"
          title={isPinned ? t('achievements.unpinFromShowcase') : t('achievements.pinToShowcase')}
          onclick={() => onPin(item)}
          class="p-1 rounded-lg border transition-colors cursor-pointer {isPinned
            ? 'bg-tt-primary text-white border-tt-primary shadow-xs'
            : 'bg-tt-surface-2 text-tt-text-secondary hover:text-tt-text border-tt-separator/50'}"
        >
          <PushPin class="w-3.5 h-3.5" />
        </button>
      {/if}
    </div>
  </div>

  <!-- Body: Name, Description & Eligible Modes -->
  <div class="space-y-1.5">
    <h3 class="font-bold text-sm text-tt-text leading-snug">
      {displayTierDef.labelKey ? t(displayTierDef.labelKey) : (t(`advancements.${item.definition.id}`) || t(`achievements.${item.definition.id}`) || item.definition.id)}
    </h3>
    <p class="text-xs text-tt-text-secondary leading-relaxed line-clamp-2">
      {formattedDesc}
    </p>

    <!-- Eligible Modes Badge Row -->
    <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
      <span class="text-3xs font-semibold text-tt-text-secondary/70 uppercase tracking-wider">{t('achievements.eligibleModes')}:</span>
      {#each eligibleModes as modeKey (modeKey)}
        <AppBadge variant="surface" size="sm">
          {getModeLabel(modeKey)}
        </AppBadge>
      {/each}
    </div>
  </div>

  <!-- Footer: Progress Bar or Unlock Date -->
  <div class="space-y-1.5 pt-1 border-t border-tt-separator/30">
    <div class="flex items-center justify-between text-2xs font-mono text-tt-text-secondary">
      {#if isCompleted}
        <span class="text-ios-green font-semibold">
          {isAdvancement ? t('achievements.unlocked') : t('achievements.maxTierReached')}
        </span>
        <span>{formatDate(item.progress.unlocked_at)}</span>
      {:else}
        <span>{t('achievements.progress', { current: displayCurrent, target: displayTarget })}</span>
        <span>{progressPercent}%</span>
      {/if}
    </div>

    <!-- Progress Track -->
    <div class="w-full h-1.5 rounded-full bg-tt-surface-2 overflow-hidden">
      <div
        class="h-full rounded-full transition-[width] duration-300 {isCompleted
          ? 'bg-ios-green'
          : item.isUnlocked
            ? 'bg-tt-primary'
            : 'bg-tt-text-secondary/40'}"
        style="width: {progressPercent}%;"
      ></div>
    </div>
  </div>
</div>

