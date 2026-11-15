<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLElement> {
    title?: string;
    subtitle?: string;
    class?: string;
    left?: Snippet;
    right?: Snippet;
    titleSlot?: Snippet;
    [key: string]: unknown;
  }

  let {
    title = '',
    subtitle = '',
    class: className = '',
    left,
    right,
    titleSlot,
    ...rest
  }: Props = $props();
</script>

<header
  class={[
    'sticky top-0 z-20 w-full h-12 border-b border-[var(--tt-glass-border)] bg-[var(--tt-glass-bg)] shadow-glass flex items-center justify-between px-4 select-none shrink-0',
    className,
  ].filter(Boolean).join(' ')}
  style="isolation: isolate; transform: translateZ(0); contain: layout style;"
  {...rest}
>
  <div class="flex items-center gap-2 min-w-0">
    {#if left}
      {@render left()}
    {/if}
    <div class="flex flex-col min-w-0">
      {#if titleSlot}
        {@render titleSlot()}
      {:else if title}
        <span class="font-bold text-sm text-tt-text truncate">{title}</span>
      {/if}
      {#if subtitle}
        <span class="text-[11px] text-tt-text-secondary truncate">{subtitle}</span>
      {/if}
    </div>
  </div>

  {#if right}
    <div class="flex items-center gap-2 shrink-0">
      {@render right()}
    </div>
  {/if}
</header>
