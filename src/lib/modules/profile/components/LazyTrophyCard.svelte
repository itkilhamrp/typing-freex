<script module lang="ts">
  type VisibilityCallback = (visible: boolean) => void;
  const subscribers = new WeakMap<Element, VisibilityCallback>();

  let sharedObserver: IntersectionObserver | null = null;

  function getSharedObserver(): IntersectionObserver | null {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return null;
    }
    if (!sharedObserver) {
      sharedObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const cb = subscribers.get(entry.target);
              if (cb) {
                cb(true);
                sharedObserver?.unobserve(entry.target);
                subscribers.delete(entry.target);
              }
            }
          }
        },
        { rootMargin: '300px 0px' },
      );
    }
    return sharedObserver;
  }

  export function observeViewport(node: HTMLElement, onVisible: VisibilityCallback): () => void {
    const obs = getSharedObserver();
    if (!obs) {
      onVisible(true);
      return () => {};
    }
    subscribers.set(node, onVisible);
    obs.observe(node);
    return () => {
      obs.unobserve(node);
      subscribers.delete(node);
    };
  }
</script>

<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import type { AchievementItem } from '../stores/achievement.store.svelte';
  import TrophyIcon from './TrophyIcon.svelte';
  import { PushPin } from 'phosphor-svelte';

  interface Props {
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
    onPin: (item: AchievementItem) => void;
  }

  let { item, isPinned, tierMeta, tierDisplay, title, onPin }: Props = $props();

  const { t } = useI18n();

  let cardEl = $state<HTMLDivElement | null>(null);
  let isVisible = $state(false);

  $effect(() => {
    if (!cardEl || isVisible) return;
    const cleanup = observeViewport(cardEl, (visible) => {
      if (visible) {
        isVisible = true;
      }
    });
    return cleanup;
  });
</script>

<div
  bind:this={cardEl}
  class="group relative p-4 rounded-2xl bg-tt-surface-elevated border transition-all duration-200 flex flex-col items-center justify-between text-center min-h-[160px] cursor-default [contain:layout_style_paint] [content-visibility:auto] [contain-intrinsic-size:auto_170px] {item.isUnlocked
    ? 'hover:border-tt-primary/60 hover:-translate-y-0.5 hover:shadow-md'
    : 'opacity-70 grayscale-[30%] hover:grayscale-0 hover:opacity-100 hover:border-tt-separator/80'}"
  style="border-color: {item.isUnlocked ? tierMeta.accentColor + '33' : 'var(--color-tt-separator)'};"
>
  <!-- Pin Button (Top-Right, only if unlocked) -->
  {#if item.isUnlocked}
    <button
      type="button"
      onclick={(e) => {
        e.stopPropagation();
        onPin(item);
      }}
      class="absolute top-2.5 right-2.5 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10 {isPinned
        ? 'bg-tt-primary/20 text-tt-primary !opacity-100'
        : 'bg-tt-surface-2 text-tt-text-secondary hover:text-tt-text'}"
      title={isPinned ? t('achievements.unpinFromShowcase') : t('achievements.pinToShowcase')}
      aria-label={isPinned ? t('achievements.unpinFromShowcase') : t('achievements.pinToShowcase')}
    >
      <PushPin class="w-3.5 h-3.5 {isPinned ? 'fill-current' : ''}" />
    </button>
  {/if}

  <!-- Trophy Icon: Rendered strictly when in/near viewport -->
  <div class="flex-1 flex items-center justify-center pt-2 min-h-[64px]">
    {#if isVisible}
      <TrophyIcon
        uniqueId={item.definition.id}
        icon={item.definition.icon}
        tier={item.definition.category === 'advancement'
          ? (item.definition.tiers[0]?.tier ?? 1)
          : item.currentTier}
        shape={item.definition.trophyShape}
        advancementShape={item.definition.advancementShape}
        category={item.definition.category}
        unlocked={item.isUnlocked}
        size="lg"
      />
    {:else}
      <!-- Lightweight chassis placeholder keeping exact 64px (size lg) geometry -->
      <div
        class="w-16 h-16 rounded-2xl bg-tt-surface-2/30 border border-tt-separator/20 shrink-0"
        aria-hidden="true"
      ></div>
    {/if}
  </div>

  <!-- Trophy Info (Title & Rank Badge Only) -->
  <div class="w-full mt-2 space-y-1">
    <span
      class="block text-xs sm:text-sm font-bold text-tt-text line-clamp-2 group-hover:text-tt-primary transition-colors leading-tight px-1"
      title={title}
    >
      {title}
    </span>

    <div class="flex items-center justify-center">
      {#if item.isUnlocked}
        <span
          class="text-3xs uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full"
          style="background-color: {tierMeta.accentColor}18; color: {tierMeta.accentColor};"
        >
          {tierDisplay.badge}
        </span>
      {:else}
        <span class="text-3xs uppercase tracking-wider font-semibold text-tt-text-secondary/70">
          {t('achievements.locked')}
        </span>
      {/if}
    </div>
  </div>
</div>
