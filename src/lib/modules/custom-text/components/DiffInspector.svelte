<script lang="ts">
  import {
    GitDiff as PhGitDiff,
    CheckCircle as PhCheckCircle,
    ClockCounterClockwise as PhClockCounterClockwise,
    ArrowsDownUp as PhArrowsDownUp,
  } from 'phosphor-svelte';
  import { AppDialog } from '#lib/shared/ui/index.js';
  import { i18n } from '#lib/shared/stores/i18n.svelte.js';
  import type { RevisionDiffResult } from '@/core/ipc';
  import {
    pairModifiedLines,
    groupIntoHunks,
  } from '../logic/diff-tokenizer';
  import type { DiffDisplayLine } from '../types/diff.types';

  interface Props {
    opened: boolean;
    diff: RevisionDiffResult | null;
    isLoading: boolean;
    onclose: () => void;
    onrestore: (rev: number) => void;
  }

  let {
    opened,
    diff,
    isLoading,
    onclose,
    onrestore,
  }: Props = $props();

  const t = i18n.t;

  // Track hunk yang dibuka oleh pengguna
  let expandedHunks = $state<Record<string, boolean>>({});

  function toggleHunk(hunkId: string) {
    expandedHunks[hunkId] = !expandedHunks[hunkId];
  }

  let displayLines = $derived.by<DiffDisplayLine[]>(() => {
    if (!diff || !diff.lines || diff.lines.length === 0) return [];
    return pairModifiedLines(diff.lines);
  });

  let hunks = $derived.by(() => {
    return groupIntoHunks(displayLines, 3);
  });
</script>

<AppDialog
  {opened}
  title={t('customText.diffTitle')}
  maxWidth="max-w-4xl"
  onbackdropClick={onclose}
>
  <div class="space-y-4 [contain:layout_style]">
    <!-- Diff Header & Changeset Summary -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-tt-surface-2 border border-tt-separator text-sm"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="w-8 h-8 rounded-lg bg-ios-indigo/15 border border-ios-indigo/25 flex items-center justify-center shrink-0"
        >
          <PhGitDiff class="w-4 h-4 text-ios-indigo" />
        </div>
        <div>
          <div class="font-bold text-tt-text text-sm">
            {t('customText.diffComparing', {
              target: diff?.target_revision ?? 0,
              base: diff?.base_revision ?? 0,
            })}
          </div>
          <div class="text-3xs text-tt-text-secondary mt-0.5">
            {t('customText.diffWordChanges')}
          </div>
        </div>
      </div>

      {#if diff}
        <div class="flex items-center gap-2 text-xs font-mono font-bold flex-wrap">
          <span
            class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ios-green/15 text-ios-green border border-ios-green/30"
          >
            <span class="font-black text-sm leading-none">+</span>
            <span>{t('customText.diffAdditions', { count: diff.additions })}</span>
          </span>
          <span
            class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ios-red/15 text-ios-red border border-ios-red/30"
          >
            <span class="font-black text-sm leading-none">−</span>
            <span>{t('customText.diffDeletions', { count: diff.deletions })}</span>
          </span>
        </div>
      {/if}
    </div>

    <!-- Main Content State -->
    {#if isLoading}
      <div class="py-16 text-center text-tt-text-secondary text-xs flex flex-col items-center justify-center gap-2">
        <div class="w-6 h-6 border-2 border-tt-primary border-t-transparent rounded-full animate-spin"></div>
        <span>{t('common.loading')}...</span>
      </div>
    {:else if diff && displayLines.length > 0}
      <!-- Word-Level Diff Container -->
      <div
        class="rounded-xl border border-tt-separator bg-tt-surface overflow-hidden font-mono text-xs max-h-[60vh] overflow-y-auto flex flex-col shadow-inner"
      >
        <!-- Sticky Column Header -->
        <div
          class="sticky top-0 z-10 flex items-stretch bg-tt-surface-2 border-b border-tt-separator text-3xs font-bold uppercase tracking-wider text-tt-text-secondary select-none font-sans"
        >
          <div class="w-12 shrink-0 text-right pr-2 py-1.5 border-r border-tt-separator/30 font-mono">
            #{diff.base_revision}
          </div>
          <div class="w-12 shrink-0 text-right pr-2 py-1.5 border-r border-tt-separator/30 font-mono">
            #{diff.target_revision}
          </div>
          <div class="w-7 shrink-0 text-center py-1.5 border-r border-tt-separator/30">
            +/-
          </div>
          <div class="flex-1 px-3 py-1.5 font-sans">
            {t('customText.diffContentHeader')}
          </div>
        </div>

        <!-- Render Hunks -->
        <div class="divide-y divide-tt-separator/15">
          {#each hunks as hunk (hunk.id)}
            {#if hunk.type === 'context' && !expandedHunks[hunk.id]}
              <!-- Collapsed Unchanged Lines Indicator -->
              <button
                type="button"
                class="w-full py-2 px-4 bg-tt-surface-2/70 hover:bg-tt-surface-3/80 text-tt-text-secondary hover:text-tt-text text-2xs font-sans font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer select-none border-y border-tt-separator/30"
                onclick={() => toggleHunk(hunk.id)}
              >
                <PhArrowsDownUp class="w-3.5 h-3.5 text-ios-indigo" />
                <span>{t('customText.diffShowHidden', { count: hunk.collapsedCount ?? hunk.lines.length })}</span>
              </button>
            {:else}
              <!-- Render Diff Lines -->
              {#each hunk.lines as line, lIdx (lIdx)}
                {#if line.tag === 'modified'}
                  <!-- Line Deleted / Replaced Portion (Old) -->
                  <div class="flex items-stretch select-text leading-relaxed bg-ios-red/10 border-l-2 border-ios-red/60">
                    <div class="w-12 shrink-0 text-right pr-2 py-1 text-xs select-none tabular-nums font-mono border-r border-tt-separator/30 bg-ios-red/15 text-ios-red font-bold">
                      {line.oldLineNum ?? ''}
                    </div>
                    <div class="w-12 shrink-0 text-right pr-2 py-1 text-xs select-none tabular-nums font-mono border-r border-tt-separator/30 bg-tt-surface-2/40 text-tt-text-secondary/40">
                      -
                    </div>
                    <div class="w-7 shrink-0 text-center py-1 text-xs font-mono font-bold select-none border-r border-tt-separator/30 bg-ios-red/20 text-ios-red">
                      −
                    </div>
                    <div class="flex-1 whitespace-pre-wrap break-all py-1 px-3 text-xs font-mono text-ios-red/90">
                      {#if line.oldSegments}
                        {#each line.oldSegments as seg, sIdx (sIdx)}
                          {#if seg.type === 'delete'}
                            <span class="bg-ios-red/35 text-ios-red font-bold underline decoration-ios-red/50 px-0.5 rounded-sm">{seg.text}</span>
                          {:else}
                            <span>{seg.text}</span>
                          {/if}
                        {/each}
                      {:else}
                        {line.text}
                      {/if}
                    </div>
                  </div>

                  <!-- Line Inserted / Replacement Portion (New) -->
                  <div class="flex items-stretch select-text leading-relaxed bg-ios-green/10 border-l-2 border-ios-green/60">
                    <div class="w-12 shrink-0 text-right pr-2 py-1 text-xs select-none tabular-nums font-mono border-r border-tt-separator/30 bg-tt-surface-2/40 text-tt-text-secondary/40">
                      +
                    </div>
                    <div class="w-12 shrink-0 text-right pr-2 py-1 text-xs select-none tabular-nums font-mono border-r border-tt-separator/30 bg-ios-green/15 text-ios-green font-bold">
                      {line.newLineNum ?? ''}
                    </div>
                    <div class="w-7 shrink-0 text-center py-1 text-xs font-mono font-bold select-none border-r border-tt-separator/30 bg-ios-green/20 text-ios-green">
                      +
                    </div>
                    <div class="flex-1 whitespace-pre-wrap break-all py-1 px-3 text-xs font-mono text-ios-green font-medium">
                      {#if line.newSegments}
                        {#each line.newSegments as seg, sIdx (sIdx)}
                          {#if seg.type === 'insert'}
                            <span class="bg-ios-green/35 text-ios-green font-bold px-0.5 rounded-sm">{seg.text}</span>
                          {:else}
                            <span>{seg.text}</span>
                          {/if}
                        {/each}
                      {:else}
                        {line.text}
                      {/if}
                    </div>
                  </div>
                {:else if line.tag === 'insert'}
                  <!-- Pure Inserted Line -->
                  <div class="flex items-stretch select-text leading-relaxed bg-ios-green/10">
                    <div class="w-12 shrink-0 text-right pr-2 py-1 text-xs select-none tabular-nums font-mono border-r border-tt-separator/30 bg-tt-surface-2/40 text-tt-text-secondary/50"></div>
                    <div class="w-12 shrink-0 text-right pr-2 py-1 text-xs select-none tabular-nums font-mono border-r border-tt-separator/30 bg-ios-green/15 text-ios-green font-bold">
                      {line.newLineNum ?? ''}
                    </div>
                    <div class="w-7 shrink-0 text-center py-1 text-xs font-mono font-bold select-none border-r border-tt-separator/30 bg-ios-green/20 text-ios-green">
                      +
                    </div>
                    <div class="flex-1 whitespace-pre-wrap break-all py-1 px-3 text-xs font-mono text-ios-green font-medium">
                      {line.text && line.text.length > 0 ? line.text : '\u00A0'}
                    </div>
                  </div>
                {:else if line.tag === 'delete'}
                  <!-- Pure Deleted Line -->
                  <div class="flex items-stretch select-text leading-relaxed bg-ios-red/10">
                    <div class="w-12 shrink-0 text-right pr-2 py-1 text-xs select-none tabular-nums font-mono border-r border-tt-separator/30 bg-ios-red/15 text-ios-red font-bold">
                      {line.oldLineNum ?? ''}
                    </div>
                    <div class="w-12 shrink-0 text-right pr-2 py-1 text-xs select-none tabular-nums font-mono border-r border-tt-separator/30 bg-tt-surface-2/40 text-tt-text-secondary/50"></div>
                    <div class="w-7 shrink-0 text-center py-1 text-xs font-mono font-bold select-none border-r border-tt-separator/30 bg-ios-red/20 text-ios-red">
                      −
                    </div>
                    <div class="flex-1 whitespace-pre-wrap break-all py-1 px-3 text-xs font-mono text-ios-red/90 line-through">
                      {line.text && line.text.length > 0 ? line.text : '\u00A0'}
                    </div>
                  </div>
                {:else}
                  <!-- Equal Unchanged Line -->
                  <div class="flex items-stretch select-text leading-relaxed hover:bg-tt-surface-2/30">
                    <div class="w-12 shrink-0 text-right pr-2 py-1 text-xs select-none tabular-nums font-mono border-r border-tt-separator/30 text-tt-text-secondary/50">
                      {line.oldLineNum ?? ''}
                    </div>
                    <div class="w-12 shrink-0 text-right pr-2 py-1 text-xs select-none tabular-nums font-mono border-r border-tt-separator/30 text-tt-text-secondary/50">
                      {line.newLineNum ?? ''}
                    </div>
                    <div class="w-7 shrink-0 text-center py-1 text-xs font-mono select-none border-r border-tt-separator/30 text-transparent">
                      ·
                    </div>
                    <div class="flex-1 whitespace-pre-wrap break-all py-1 px-3 text-xs font-mono text-tt-text">
                      {line.text && line.text.length > 0 ? line.text : '\u00A0'}
                    </div>
                  </div>
                {/if}
              {/each}
            {/if}
          {/each}
        </div>
      </div>
    {:else}
      <!-- No Changes State -->
      <div class="py-12 text-center text-xs text-tt-text-secondary rounded-xl border border-tt-separator bg-tt-surface p-6">
        <PhCheckCircle class="w-8 h-8 text-ios-green mx-auto mb-2 opacity-80" />
        <div class="font-bold text-tt-text">{t('customText.diffNoChanges')}</div>
      </div>
    {/if}

    <!-- Action Footer -->
    <div class="flex items-center justify-between gap-4 pt-3 border-t border-tt-separator">
      <button
        type="button"
        class="h-11 px-5 rounded-xl text-sm font-semibold text-tt-text-secondary hover:text-tt-text bg-tt-surface-2 hover:bg-tt-surface-3 border border-tt-separator/50 transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-[0.98]"
        onclick={onclose}
      >
        {t('customText.closeDiff')}
      </button>

      {#if diff}
        <button
          type="button"
          class="h-11 px-6 rounded-xl text-sm font-semibold text-white bg-tt-primary hover:brightness-110 active:scale-[0.98] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
          onclick={() => onrestore(diff.target_revision)}
        >
          <PhClockCounterClockwise class="w-4 h-4 shrink-0" />
          <span>{t('customText.restoreThisRevision')} (#{diff.target_revision})</span>
        </button>
      {/if}
    </div>
  </div>
</AppDialog>

