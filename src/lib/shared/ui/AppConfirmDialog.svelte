<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import AppDialog from './AppDialog.svelte';
  import { Warning, Trash } from 'phosphor-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    opened?: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    loading?: boolean;
    onconfirm?: () => void;
    oncancel?: () => void;
    children?: Snippet;
  }

  let {
    opened = false,
    title = '',
    message = '',
    confirmText = '',
    cancelText = '',
    danger = true,
    loading = false,
    onconfirm,
    oncancel,
    children,
  }: Props = $props();

  const { t } = useI18n();

  const resolvedTitle = $derived(title || t('common.delete'));
  const resolvedConfirmText = $derived(confirmText || t('common.delete'));
  const resolvedCancelText = $derived(cancelText || t('common.cancel'));
</script>

{#snippet buttonsSlot()}
  <button
    type="button"
    disabled={Boolean(loading)}
    class="btn bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-tt-text border border-black/5 dark:border-white/10 rounded-full h-10 px-4 text-sm font-semibold flex-1 transition-[transform,background-color,color] duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
    onclick={oncancel}
  >
    {resolvedCancelText}
  </button>
  <button
    type="button"
    disabled={Boolean(loading)}
    class={[
      'btn h-10 px-4 text-sm font-semibold flex-1 rounded-full transition-[transform,filter] duration-150 active:scale-[0.98] cursor-pointer shadow-xs inline-flex items-center justify-center',
      danger
        ? 'bg-status-red hover:brightness-105 text-white'
        : 'bg-tt-primary hover:brightness-105 text-white',
    ].join(' ')}
    onclick={onconfirm}
  >
    <span class="inline-flex items-center justify-center gap-1.5 text-white">
      {#if danger && !loading}
        <Trash class="w-4 h-4 text-white shrink-0" />
      {/if}
      <span>{resolvedConfirmText}</span>
    </span>
  </button>
{/snippet}

<AppDialog
  opened={Boolean(opened)}
  title={resolvedTitle}
  onbackdropClick={oncancel}
  {buttonsSlot}
>
  <div class="py-2 text-left space-y-2">
    {#if danger}
      <div class="flex items-center gap-1.5 text-status-red mb-1">
        <Warning class="w-4 h-4 shrink-0" />
        <span class="text-xs font-bold uppercase tracking-wider">
          {t('common.warning')}
        </span>
      </div>
    {/if}
    <p class="text-sm text-tt-text-secondary leading-relaxed">
      {#if children}
        {@render children()}
      {:else}
        {message}
      {/if}
    </p>
  </div>
</AppDialog>
