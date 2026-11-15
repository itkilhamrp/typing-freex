<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    opened?: boolean;
    position?: 'left' | 'center' | 'right';
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    opened = false,
    position = 'center',
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const positionClasses = $derived(
    position === 'left'
      ? 'left-6 bottom-6'
      : position === 'right'
        ? 'right-6 bottom-6'
        : 'left-1/2 -translate-x-1/2 bottom-6'
  );
</script>

{#if opened}
  <div
    role="status"
    aria-live="polite"
    class={[
      'fixed z-50 px-4 py-2.5 rounded-xl bg-black/85 dark:bg-white/90 text-white dark:text-black text-xs font-semibold shadow-xl border border-white/10 dark:border-black/10 animate-fade-in select-none flex items-center gap-2',
      positionClasses,
      className,
    ].filter(Boolean).join(' ')}
    {...rest}
  >
    {@render children?.()}
  </div>
{/if}
