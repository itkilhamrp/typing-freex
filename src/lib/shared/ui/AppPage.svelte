<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    maxWidth?: string;
    padded?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    maxWidth = 'max-w-5xl',
    padded = true,
    class: className = '',
    children,
    ...rest
  }: Props = $props();
</script>

<div
  class={[
    'relative min-h-full w-full flex flex-col items-center justify-start bg-transparent',
    className,
  ].filter(Boolean).join(' ')}
  {...rest}
>
  <div
    class={[
      'w-full mx-auto flex flex-col',
      maxWidth,
      padded ? 'p-4 sm:p-6 lg:p-8 gap-6' : '',
    ].join(' ')}
    style="contain: layout style;"
  >
    {@render children?.()}
  </div>
</div>
