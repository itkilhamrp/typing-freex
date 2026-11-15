<script lang="ts">
  import {
    ClockCounterClockwise as PhClockCounterClockwise,
    GitDiff as PhGitDiff,
  } from 'phosphor-svelte';
  import { AppCard, AppBadge } from '#lib/shared/ui/index.js';
  import { i18n } from '#lib/shared/stores/i18n.svelte.js';
  import type { TextRevision } from '@/core/ipc';

  interface Props {
    revisions: TextRevision[];
    activeRevision?: number;
    onopenDiff: (rev: number) => void;
    onrestore: (rev: number) => void;
    onclose: () => void;
  }

  let {
    revisions,
    activeRevision,
    onopenDiff,
    onrestore,
    onclose,
  }: Props = $props();

  const t = i18n.t;

  function formatTimeAgo(isoString: string): string {
    const time = new Date(isoString).getTime();
    if (isNaN(time)) return '';
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - time) / 1000));

    if (diffSec < 60) return t('customText.timeJustNow');
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return t('customText.timeMinutesAgo', { count: diffMin });
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return t('customText.timeHoursAgo', { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return t('customText.timeYesterday');
    if (diffDays < 30) return t('customText.timeDaysAgo', { count: diffDays });
    return new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
</script>

<AppCard
  padding="p-4"
  class="space-y-3 bg-tt-surface-2 border border-tt-separator animate-fade-in [contain:layout_style]"
>
  <!-- Header -->
  <div class="flex items-center justify-between pb-1 border-b border-tt-separator/40">
    <div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-tt-text">
      <PhClockCounterClockwise class="w-3.5 h-3.5 text-ios-indigo" />
      <span>{t('customText.revisionsTitle')}</span>
    </div>
    <button
      type="button"
      class="text-3xs text-tt-text-secondary hover:text-tt-text cursor-pointer font-bold px-1.5 py-0.5 rounded hover:bg-tt-surface-3 transition-colors"
      onclick={onclose}
    >
      {t('common.done')}
    </button>
  </div>

  {#if revisions.length > 0}
    <!-- Vertical Timeline Container -->
    <div class="space-y-3 max-h-72 overflow-y-auto pr-1">
      {#each revisions as rev, idx (rev.revision_number)}
        {@const isCurrent = activeRevision ? rev.revision_number === activeRevision : idx === 0}
        <div
          class="relative pl-3 border-l-2 {isCurrent ? 'border-ios-indigo' : 'border-tt-separator/60'} text-xs space-y-1.5 transition-all"
        >
          <!-- Timeline Node Bullet -->
          <div
            class="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full {isCurrent ? 'bg-ios-indigo ring-2 ring-ios-indigo/20' : 'bg-tt-separator'}"
          ></div>

          <!-- Revision Item Header -->
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold text-tt-text font-mono">#{rev.revision_number}</span>

              {#if isCurrent}
                <AppBadge variant="primary" size="sm" class="font-sans text-[10px] py-0 px-1.5">
                  {t('customText.revisionCurrent')}
                </AppBadge>
              {/if}

              {#if (rev.additions ?? 0) > 0}
                <span
                  class="font-mono text-3xs font-semibold px-1 py-0.2 rounded bg-ios-green/15 text-ios-green"
                  title={t('customText.diffAdditions')}
                >
                  +{rev.additions}
                </span>
              {/if}
              {#if (rev.deletions ?? 0) > 0}
                <span
                  class="font-mono text-3xs font-semibold px-1 py-0.2 rounded bg-ios-red/15 text-ios-red"
                  title={t('customText.diffDeletions')}
                >
                  −{rev.deletions}
                </span>
              {/if}
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                class="px-2 py-0.5 rounded-md bg-tt-surface hover:bg-tt-surface-3 text-tt-text text-2xs font-semibold flex items-center gap-1 border border-tt-separator/60 cursor-pointer transition-colors"
                title={t('customText.viewDiff')}
                onclick={() => onopenDiff(rev.revision_number)}
              >
                <PhGitDiff class="w-3 h-3 text-ios-indigo" />
                <span>{t('customText.diff')}</span>
              </button>

              <button
                type="button"
                class="px-2 py-0.5 rounded-md bg-tt-primary/10 hover:bg-tt-primary/20 text-tt-primary text-2xs font-bold cursor-pointer transition-colors"
                onclick={() => onrestore(rev.revision_number)}
              >
                {t('customText.restore')}
              </button>
            </div>
          </div>

          <!-- Time & Meta -->
          <div class="flex items-center justify-between text-3xs text-tt-text-secondary">
            <span>{formatTimeAgo(rev.created_at)}</span>
            <span class="font-mono">{rev.word_count.toLocaleString()} {t('customText.words')}</span>
          </div>

          <!-- Body Preview -->
          <div class="text-2xs text-tt-text-secondary/80 line-clamp-2 leading-relaxed font-mono bg-tt-surface/50 p-1.5 rounded-lg border border-tt-separator/30">
            {rev.preview}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-2xs text-tt-text-secondary py-3 text-center">
      {t('customText.revisionsEmpty')}
    </div>
  {/if}
</AppCard>
