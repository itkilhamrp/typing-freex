<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    label: string;
    value: string | number;
    unit?: string;
    subtext?: string;
    icon?: Component;
    highlight?: boolean;
    class?: string;
    subtextSlot?: Snippet;
    [key: string]: unknown;
  }

  let {
    label,
    value,
    unit = '',
    subtext = '',
    icon: IconComponent,
    highlight = false,
    class: className = '',
    subtextSlot,
    ...rest
  }: Props = $props();

  const cardClass = $derived(
    `card m-0 rounded-2xl p-4 sm:p-5 transition-[transform,box-shadow] duration-200 bg-tt-surface flex flex-col justify-between border border-black/5 dark:border-white/5 ${
      highlight
        ? 'shadow-md ring-1 ring-status-blue/20 dark:ring-status-blue/30'
        : 'shadow-xs'
    } ${className}`.trim(),
  );
</script>

<div class={cardClass} {...rest}>
  <div class="flex items-center justify-between gap-2 mb-2">
    <span class="text-xs font-semibold text-tt-text-secondary uppercase tracking-wider truncate">
      {label}
    </span>
    {#if IconComponent}
      <IconComponent
        class="w-4 h-4 shrink-0 {highlight ? 'text-tt-primary' : 'text-tt-text-secondary'}"
      />
    {/if}
  </div>

  <div class="flex items-baseline gap-1 my-1">
    <span
      class="text-2xl sm:text-3xl font-extrabold tracking-tight {highlight
        ? 'text-tt-primary'
        : 'text-tt-text'}"
    >
      {value}
    </span>
    {#if unit}
      <span class="text-xs sm:text-sm font-semibold text-tt-text-secondary">
        {unit}
      </span>
    {/if}
  </div>

  {#if subtext || subtextSlot}
    <div class="text-xs text-tt-text-secondary mt-1">
      {#if subtextSlot}
        {@render subtextSlot()}
      {:else}
        {subtext}
      {/if}
    </div>
  {/if}
</div>
