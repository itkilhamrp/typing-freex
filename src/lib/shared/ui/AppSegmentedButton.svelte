<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    active?: boolean;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    active = false,
    class: className = '',
    onclick,
    children,
    type = 'button',
    ...rest
  }: Props = $props();
</script>

<button
  {type}
  aria-pressed={active}
  class={[
    'btn flex-1 text-center justify-center transition-[background-color,color,box-shadow,transform] duration-150 cursor-pointer text-xs sm:text-sm select-none whitespace-nowrap rounded-full px-3 py-1 font-medium inline-flex items-center active:scale-[0.98]',
    active
      ? 'bg-white text-black font-semibold shadow-xs'
      : 'text-tt-text-secondary hover:text-tt-text hover:bg-black/5 dark:hover:bg-white/5',
    className,
  ].filter(Boolean).join(' ')}
  {onclick}
  {...rest}
>
  {@render children?.()}
</button>
