<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    raised?: boolean;
    rounded?: boolean;
    strong?: boolean;
    outline?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    raised = false,
    rounded = true,
    strong = true,
    outline = false,
    class: className = '',
    children,
    ...rest
  }: Props = $props();
</script>

<div
  class={[
    'inline-flex items-center p-1 gap-1',
    rounded ? 'rounded-full' : 'rounded-xl',
    raised ? 'shadow-md' : 'shadow-2xs',
    strong ? 'bg-tt-surface-2' : 'bg-transparent',
    outline ? 'border border-tt-separator' : 'border-0',
    className,
  ].filter(Boolean).join(' ')}
  role="group"
  {...rest}
>
  {@render children?.()}
</div>
