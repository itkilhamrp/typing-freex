<script lang="ts">
  import { CaretRight } from 'phosphor-svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    text?: string;
    after?: string;
    link?: boolean;
    chevron?: boolean;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
    media?: Snippet;
    titleSlot?: Snippet;
    subtitleSlot?: Snippet;
    afterSlot?: Snippet;
    [key: string]: unknown;
  }

  let {
    title = '',
    subtitle = '',
    text = '',
    after = '',
    link = false,
    chevron,
    class: className = '',
    onclick,
    children,
    media,
    titleSlot,
    subtitleSlot,
    afterSlot,
    ...rest
  }: Props = $props();

  const showChevron = $derived(chevron ?? link);
</script>

<div
  class={[
    'flex items-center justify-between px-4 py-3 min-h-[44px] transition-colors',
    link || onclick ? 'hover:bg-tt-surface-2/80 active:bg-tt-surface-3 cursor-pointer' : '',
    className,
  ].filter(Boolean).join(' ')}
  {onclick}
  {...rest}
>
  <div class="flex items-center gap-3 min-w-0 flex-1">
    {#if media}
      <div class="shrink-0 flex items-center justify-center text-tt-text">
        {@render media()}
      </div>
    {/if}

    <div class="flex flex-col min-w-0 flex-1">
      {#if title || titleSlot}
        <span class="text-sm font-semibold text-tt-text truncate">
          {#if titleSlot}
            {@render titleSlot()}
          {:else}
            {title}
          {/if}
        </span>
      {/if}

      {#if subtitle || subtitleSlot}
        <span class="text-xs text-tt-text-secondary truncate mt-0.5">
          {#if subtitleSlot}
            {@render subtitleSlot()}
          {:else}
            {subtitle}
          {/if}
        </span>
      {/if}

      {#if text}
        <span class="text-xs text-tt-text-tertiary leading-relaxed mt-0.5">
          {text}
        </span>
      {/if}

      {@render children?.()}
    </div>
  </div>

  {#if after || afterSlot || showChevron}
    <div class="flex items-center gap-2 shrink-0 ml-3">
      {#if afterSlot}
        {@render afterSlot()}
      {:else if after}
        <span class="text-xs text-tt-text-secondary">{after}</span>
      {/if}

      {#if showChevron}
        <CaretRight class="w-4 h-4 text-tt-text-tertiary" />
      {/if}
    </div>
  {/if}
</div>
