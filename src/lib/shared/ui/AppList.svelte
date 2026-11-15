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
    'my-3 overflow-hidden flex flex-col divide-y divide-tt-separator/30',
    inset ? 'mx-4 rounded-2xl border border-tt-separator/40' : '',
    strong ? 'bg-tt-surface shadow-xs' : 'bg-transparent',
    className,
  ].filter(Boolean).join(' ')}
  {...rest}
>
  {@render children?.()}
</div>
