<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'tonal';
    size?: 'small' | 'medium' | 'large';
    tonal?: boolean;
    outline?: boolean;
    clear?: boolean;
    rounded?: boolean;
    small?: boolean;
    large?: boolean;
    disabled?: boolean;
    inline?: boolean;
    block?: boolean;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    variant = 'primary',
    size = 'medium',
    tonal = false,
    outline = false,
    clear = false,
    rounded = false,
    small = false,
    large = false,
    disabled = false,
    inline = false,
    block = false,
    class: className = '',
    onclick,
    children,
    type = 'button',
    ...rest
  }: Props = $props();

  const isTonal = $derived(Boolean(tonal || variant === 'secondary' || variant === 'tonal'));
  const isClear = $derived(Boolean(clear || variant === 'ghost'));
  const isOutline = $derived(Boolean(outline || variant === 'outline'));
  const isSmall = $derived(Boolean(small || size === 'small'));
  const isLarge = $derived(Boolean(large || size === 'large'));
  const isInline = $derived(
    block
      ? false
      : inline ||
        Boolean(
          isTonal ||
            isClear ||
            isOutline ||
            isSmall ||
            variant === 'secondary' ||
            variant === 'ghost' ||
            variant === 'tonal' ||
            size === 'small' ||
            small
        )
  );

  const sizeClasses = $derived(
    isSmall
      ? 'h-7 px-2.5 py-1 text-xs gap-1.5'
      : isLarge
        ? 'h-11 px-5 py-2.5 text-base gap-2.5'
        : 'h-9 px-3.5 py-1.5 text-sm gap-2'
  );

  const radiusClasses = $derived(rounded ? 'rounded-full' : 'rounded-lg');

  const variantClasses = $derived(
    isTonal
      ? 'bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text border border-tt-separator/50 shadow-xs'
      : isClear
        ? 'bg-transparent hover:bg-tt-surface-2/60 text-tt-text-secondary hover:text-tt-text'
        : isOutline
          ? 'border border-tt-separator bg-transparent text-tt-text hover:bg-tt-surface-2 active:bg-tt-surface-3 shadow-xs'
          : 'bg-tt-primary text-white shadow-xs hover:brightness-105 active:brightness-95'
  );
</script>

<button
  {type}
  disabled={Boolean(disabled)}
  class={[
    'btn font-medium transition-[transform,background-color,border-color,box-shadow,opacity] duration-150 active:scale-[0.98] cursor-pointer items-center justify-center select-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
    isInline ? 'inline-flex' : 'flex w-full',
    sizeClasses,
    radiusClasses,
    variantClasses,
    className,
  ].filter(Boolean).join(' ')}
  {onclick}
  {...rest}
>
  {@render children?.()}
</button>
