<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    header?: string;
    footer?: string;
    padding?: string;
    hoverable?: boolean;
    outline?: boolean;
    raised?: boolean;
    margin?: string;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
    headerSlot?: Snippet;
    footerSlot?: Snippet;
    [key: string]: unknown;
  }

  let {
    header = '',
    footer = '',
    padding = 'p-4 sm:p-5',
    hoverable = false,
    outline = false,
    raised = true,
    margin = 'm-0',
    class: className = '',
    onclick,
    children,
    headerSlot,
    footerSlot,
    ...rest
  }: Props = $props();
</script>

<div
  class={[
    'card rounded-2xl transition-[transform,box-shadow] duration-200 bg-tt-surface overflow-hidden flex flex-col',
    outline && !raised ? 'border border-tt-separator/60 dark:border-white/10' : 'border border-black/5 dark:border-white/5 shadow-xs',
    margin,
    hoverable ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : '',
    className,
  ].filter(Boolean).join(' ')}
  {onclick}
  {...rest}
>
  {#if header || headerSlot}
    <div class="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-tt-separator/30 font-semibold text-sm sm:text-base text-tt-text flex items-center justify-between w-full">
      {#if headerSlot}
        {@render headerSlot()}
      {:else}
        {header}
      {/if}
    </div>
  {/if}

  <div class={[padding, 'flex-1'].join(' ')}>
    {@render children?.()}
  </div>

  {#if footer || footerSlot}
    <div class="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-tt-separator/30 text-xs sm:text-sm text-tt-text-secondary w-full">
      {#if footerSlot}
        {@render footerSlot()}
      {:else}
        {footer}
      {/if}
    </div>
  {/if}
</div>
