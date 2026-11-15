<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLElement> {
    icons?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    icons: _icons = false,
    class: className = '',
    children,
    ...rest
  }: Props = $props();
</script>

<nav
  class={[
    'w-full h-14 border-t border-[var(--tt-glass-border)] bg-[var(--tt-glass-bg)] shadow-glass flex items-center justify-around px-2 z-20 shrink-0',
    className,
  ].filter(Boolean).join(' ')}
  {...rest}
>
  {@render children?.()}
</nav>
