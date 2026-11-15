<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    inset?: boolean;
    strong?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    inset = false,
    strong = false,
    class: className = '',
    children,
    ...rest
  }: Props = $props();
</script>

<div
  class={[
    'my-3',
    inset ? 'mx-4 rounded-xl' : '',
    strong ? 'bg-tt-surface p-4 shadow-xs rounded-xl' : '',
    className,
  ].filter(Boolean).join(' ')}
  {...rest}
>
  {@render children?.()}
</div>
