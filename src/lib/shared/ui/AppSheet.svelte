<script lang="ts">
  import { portal } from '#lib/shared/actions/portal.svelte.js';
  import type { Snippet } from 'svelte';

  interface Props {
    opened?: boolean;
    class?: string;
    onbackdropClick?: () => void;
    portalTarget?: boolean | string | HTMLElement;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    opened = false,
    class: className = '',
    onbackdropClick,
    portalTarget = true,
    children,
    ...rest
  }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && opened) {
      e.stopPropagation();
      onbackdropClick?.();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if opened}
  <div
    class="app-sheet-portal-root"
    use:portal={portalTarget}
    style="display: contents;"
  >
    <div
      class="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 flex items-end justify-center transition-opacity duration-200"
      onclick={(e) => {
        if (e.target === e.currentTarget) onbackdropClick?.();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        class={[
          'card w-full max-w-2xl bg-tt-surface-elevated text-tt-text max-h-[85vh] overflow-y-auto rounded-t-3xl shadow-2xl border-t border-x border-tt-separator/50 p-5 animate-fade-in',
          className,
        ].filter(Boolean).join(' ')}
        {...rest}
      >
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}
