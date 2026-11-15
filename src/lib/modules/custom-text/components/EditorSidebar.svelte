<script lang="ts">
  import {
    Article as PhArticle,
    Clock as PhClock,
    Sparkle as PhSparkle,
    CheckCircle as PhCheckCircle,
    MagicWand as PhMagicWand,
  } from 'phosphor-svelte';
  import { AppCard, AppBadge } from '#lib/shared/ui/index.js';
  import { i18n } from '#lib/shared/stores/i18n.svelte.js';
  import type { TextRevision } from '@/core/ipc';
  import type { GroupedIssueSummary } from '../logic/text-analysis';
  import RevisionTimeline from './RevisionTimeline.svelte';

  interface Props {
    wordCount: number;
    charCount: number;
    lineCount: number;
    estimatedDuration: number;
    longestWord: string | null;
    groupedIssues: GroupedIssueSummary[];
    totalIssuesCount: number;
    showRevisions: boolean;
    revisions: TextRevision[];
    activeRevision?: number;
    onfixIssues: () => void;
    onopenDiff: (rev: number) => void;
    onrestore: (rev: number) => void;
    oncloseRevisions: () => void;
  }

  let {
    wordCount,
    charCount,
    lineCount,
    estimatedDuration,
    longestWord,
    groupedIssues,
    totalIssuesCount,
    showRevisions,
    revisions,
    activeRevision,
    onfixIssues,
    onopenDiff,
    onrestore,
    oncloseRevisions,
  }: Props = $props();

  const t = i18n.t;
</script>

<div class="flex flex-col gap-4 [contain:layout_style]">
  <!-- Card 1: Text Telemetry -->
  <AppCard padding="p-4" class="space-y-3" aria-live="polite">
    <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-tt-text-secondary pb-1 border-b border-tt-separator/40">
      <span class="flex items-center gap-1.5">
        <PhArticle class="w-3.5 h-3.5 text-tt-primary" />
        <span>{t('customText.textTelemetry')}</span>
      </span>
    </div>

    <div class="space-y-2.5 text-xs">
      <div class="flex items-center justify-between">
        <span class="text-tt-text-secondary font-medium">{t('customText.words')}</span>
        <span class="font-mono font-bold text-tt-text">{wordCount.toLocaleString()}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-tt-text-secondary font-medium">{t('customText.characters')}</span>
        <span class="font-mono font-bold text-tt-text">{charCount.toLocaleString()}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-tt-text-secondary font-medium">{t('customText.lines')}</span>
        <span class="font-mono font-bold text-tt-text">{lineCount.toLocaleString()}</span>
      </div>
      {#if longestWord}
        <div class="flex items-center justify-between pt-1">
          <span class="text-tt-text-secondary font-medium">{t('customText.longestWord')}</span>
          <span
            class="font-mono text-3xs text-tt-text truncate max-w-[110px]"
            title={longestWord}
          >
            {longestWord}
          </span>
        </div>
      {/if}
      <div class="flex items-center justify-between pt-2 border-t border-tt-separator/50">
        <span class="text-tt-text-secondary font-medium flex items-center gap-1">
          <PhClock class="w-3.5 h-3.5 text-tt-text-secondary" />
          <span>{t('customText.estDuration')}</span>
        </span>
        <span class="font-mono text-tt-primary font-bold">~{estimatedDuration}s</span>
      </div>
    </div>
  </AppCard>

  <!-- Card 2: Typing Quality & Issues -->
  <AppCard padding="p-4" class="space-y-3">
    <div class="flex items-center justify-between pb-1 border-b border-tt-separator/40">
      <div class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-tt-text-secondary">
        <PhSparkle class="w-3.5 h-3.5 text-ios-orange" />
        <span>{t('customText.typingQuality')}</span>
      </div>

      <!-- Quality Status Pill -->
      {#if totalIssuesCount > 0}
        <AppBadge variant="warning" size="sm">
          {t('customText.issuesCount', { count: totalIssuesCount })}
        </AppBadge>
      {:else}
        <AppBadge variant="success" size="sm">
          {#snippet icon()}
            <PhCheckCircle class="w-3 h-3" weight="bold" />
          {/snippet}
          <span>{t('customText.clean')}</span>
        </AppBadge>
      {/if}
    </div>

    <!-- Issues Listing -->
    {#if groupedIssues.length > 0}
      <div class="space-y-2.5">
        <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {#each groupedIssues as item (item.code)}
            <div
              class="p-2 rounded-xl bg-tt-surface-2 border border-tt-separator/60 text-2xs space-y-1"
            >
              <div class="flex items-center justify-between font-semibold">
                <span
                  class={
                    item.category === 'invisible' ? 'text-ios-red' :
                    item.category === 'typography' ? 'text-ios-orange' :
                    item.category === 'spacing' ? 'text-ios-blue' :
                    'text-tt-text-secondary'
                  }
                >
                  {item.title}
                </span>
                <span class="font-mono text-3xs px-1.5 py-0.2 rounded bg-tt-surface text-tt-text-secondary border border-tt-separator/40">
                  {item.count}×
                </span>
              </div>

              {#if item.samples.length > 0}
                <div class="flex gap-1 flex-wrap">
                  {#each item.samples as sample, sIdx (sIdx)}
                    <span
                      class="font-mono text-3xs px-1 rounded bg-black/5 dark:bg-white/10 text-tt-text-secondary"
                    >
                      {sample}
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- 1-Click Smart Normalization Action -->
        <button
          type="button"
          class="w-full mt-2 py-2 px-3 rounded-xl bg-ios-orange/15 hover:bg-ios-orange/25 border border-ios-orange/30 text-ios-orange text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          onclick={onfixIssues}
        >
          <PhMagicWand class="w-4 h-4 text-ios-orange" weight="bold" />
          <span>{t('customText.fixSafeIssues')}</span>
        </button>
      </div>
    {:else}
      <!-- Clean state text -->
      <div class="text-2xs text-tt-text-secondary py-1 flex items-center gap-2">
        <PhCheckCircle class="w-4 h-4 text-ios-green shrink-0" weight="fill" />
        <span>{t('customText.noIssues')}</span>
      </div>
    {/if}
  </AppCard>

  <!-- Card 3: Revisions History Drawer -->
  {#if showRevisions}
    <RevisionTimeline
      {revisions}
      {activeRevision}
      {onopenDiff}
      {onrestore}
      onclose={oncloseRevisions}
    />
  {/if}
</div>

