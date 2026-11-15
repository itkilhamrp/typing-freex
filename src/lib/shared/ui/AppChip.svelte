<script lang="ts">
  import { X } from 'phosphor-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    outline?: boolean;
    active?: boolean;
    deleteButton?: boolean;
    class?: string;
    ondelete?: () => void;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
    media?: Snippet;
    [key: string]: unknown;
  }

  let {
    outline = false,
    active = false,
    deleteButton = false,
    class: className = '',
    ondelete,
    onclick,
    children,
    media,
    ...rest
  }: Props = $props();
</script>

<button
  type="button"
  aria-pressed={active}
  class={[
    'chip inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium cursor-pointer select-none transition-[transform,background-color,color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-tt-primary/70 focus-visible:ring-offset-1 active:scale-95',
    active
      ? 'bg-tt-primary text-white shadow-xs font-semibold'
      : outline
        ? 'border border-tt-separator text-tt-text-secondary hover:text-tt-text hover:bg-tt-surface-2 bg-transparent'
        : 'bg-tt-surface-2 text-tt-text-secondary hover:text-tt-text hover:bg-tt-surface-3',
    className,
  ].filter(Boolean).join(' ')}
  {onclick}
  {...rest}
>
  {#if media}
    <span class="inline-flex shrink-0">
      {@render media()}
    </span>
  {/if}

  {@render children?.()}

  {#if deleteButton}
    <span
      role="button"
      tabindex={0}
      aria-label="Remove"
      class="ml-1 -mr-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 text-current inline-flex items-center justify-center cursor-pointer"
      onclick={(e) => {
        e.stopPropagation();
        ondelete?.();
      }}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.stopPropagation();
          ondelete?.();
        }
      }}
    >
      <X class="w-3 h-3" />
    </span>
  {/if}
</button>
