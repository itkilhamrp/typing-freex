<script lang="ts">
  import { portal } from '#lib/shared/actions/portal.svelte.js';
  import type { Snippet } from 'svelte';

  interface Props {
    opened?: boolean;
    isOpen?: boolean;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    maxWidth?: string;
    panelClass?: string;
    onbackdropClick?: () => void;
    onclose?: () => void;
    portalTarget?: boolean | string | HTMLElement;
    children?: Snippet;
    titleSlot?: Snippet;
    buttonsSlot?: Snippet;
    [key: string]: unknown;
  }

  let {
    opened = false,
    isOpen,
    title = '',
    size = 'md',
    maxWidth = '',
    panelClass = '',
    onbackdropClick,
    onclose,
    portalTarget = true,
    children,
    titleSlot,
    buttonsSlot,
  }: Props = $props();

  const isOpened = $derived(Boolean(opened || isOpen));
  const handleBackdropClick = () => {
    if (onbackdropClick) onbackdropClick();
    else if (onclose) onclose();
  };

  const sizeClass = $derived(
    maxWidth
      ? maxWidth
      : size === 'sm'
        ? 'w-[92vw] sm:w-[24rem] max-w-md'
        : size === 'lg'
          ? 'w-[94vw] sm:w-[38rem] max-w-2xl'
          : size === 'xl'
            ? 'w-[96vw] sm:w-[46rem] max-w-3xl'
            : 'w-[92vw] sm:w-[28rem] max-w-lg'
  );

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpened) {
      e.stopPropagation();
      handleBackdropClick();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpened}
  <div
    class="app-dialog-portal-root"
    use:portal={portalTarget}
    style="display: contents;"
  >
    <!-- Backdrop overlay -->
    <div
      class="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 flex items-center justify-center p-4 transition-opacity duration-200"
      onclick={(e) => {
        if (e.target === e.currentTarget) handleBackdropClick();
      }}
      role="presentation"
    >
      <!-- Dialog Surface Card -->
      <div
        role="dialog"
        aria-modal="true"
        class={[
          'card bg-tt-surface-elevated text-tt-text rounded-2xl shadow-2xl border border-tt-separator/50 flex flex-col overflow-hidden max-h-[90vh] transition-transform duration-200 animate-fade-in',
          sizeClass,
          panelClass,
        ].filter(Boolean).join(' ')}
      >
        {#if title || titleSlot}
          <div class="px-5 pt-5 pb-3 border-b border-tt-separator/30 flex items-center justify-between shrink-0">
            <h3 class="font-bold text-base sm:text-lg text-tt-text leading-tight">
              {#if titleSlot}
                {@render titleSlot()}
              {:else}
                {title}
              {/if}
            </h3>
          </div>
        {/if}

        <div class="px-5 py-4 overflow-y-auto flex-1">
          {@render children?.()}
        </div>

        {#if buttonsSlot}
          <div class="px-5 py-3.5 border-t border-tt-separator/30 flex items-center justify-end gap-2.5 bg-black/5 dark:bg-white/5 shrink-0">
            {@render buttonsSlot()}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
