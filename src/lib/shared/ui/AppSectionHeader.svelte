<script lang="ts">
  import type { Component, Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    icon?: Component;
    class?: string;
    actions?: Snippet;
    [key: string]: unknown;
  }

  let {
    title,
    subtitle = '',
    icon: IconComponent,
    class: className = '',
    actions,
    ...rest
  }: Props = $props();
</script>

<div class={['flex items-center justify-between gap-4 mb-4', className].filter(Boolean).join(' ')} {...rest}>
  <div class="flex items-center gap-2.5 min-w-0">
    {#if IconComponent}
      <IconComponent class="w-5 h-5 text-tt-primary shrink-0" />
    {/if}
    <div>
      <h3 class="p-0 m-0 text-base sm:text-lg font-bold text-tt-text tracking-tight truncate block">
        {title}
      </h3>
      {#if subtitle}
        <p class="text-xs sm:text-sm text-tt-text-secondary mt-0.5">
          {subtitle}
        </p>
      {/if}
    </div>
  </div>
  {#if actions}
    <div class="flex items-center gap-2 shrink-0">
      {@render actions()}
    </div>
  {/if}
</div>
