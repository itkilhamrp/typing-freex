<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import AppDialog from './AppDialog.svelte';
  import { Warning, Trash } from 'phosphor-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    opened?: boolean;
    title?: string;
    message?: string;
    confirmWord?: string;
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
    confirmWord = 'RM',
    confirmText = '',
    cancelText = '',
    danger = true,
    loading = false,
    onconfirm,
    oncancel,
    children,
  }: Props = $props();

  const { t } = useI18n();

  let typedInput = $state('');
  let inputRef = $state<HTMLInputElement | null>(null);

  $effect(() => {
    if (opened) {
      typedInput = '';
      const timerId = setTimeout(() => {
        inputRef?.focus();
      }, 50);
      return () => clearTimeout(timerId);
    }
  });

  const isMatch = $derived(typedInput.trim() === confirmWord);
  const resolvedTitle = $derived(title || t('common.delete'));
  const resolvedConfirmText = $derived(confirmText || t('common.delete'));
  const resolvedCancelText = $derived(cancelText || t('common.cancel'));

  function handleCancel() {
    typedInput = '';
    oncancel?.();
  }

  function handleConfirm() {
    if (isMatch && !loading) {
      onconfirm?.();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }
</script>

{#snippet buttonsSlot()}
  <button
    type="button"
    disabled={Boolean(loading)}
    class="btn bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-tt-text border border-black/5 dark:border-white/10 rounded-full h-10 px-4 text-sm font-semibold flex-1 transition-[transform,background-color,color] duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
    onclick={handleCancel}
  >
    {resolvedCancelText}
  </button>
  <button
    type="button"
    disabled={!isMatch || Boolean(loading)}
    class={[
      'btn h-10 px-4 text-sm font-semibold flex-1 rounded-full transition-[transform,filter,opacity] duration-150 active:scale-[0.98] cursor-pointer shadow-xs inline-flex items-center justify-center',
      !isMatch || Boolean(loading)
        ? 'opacity-40 cursor-not-allowed bg-tt-surface-3 text-tt-text-secondary'
        : danger
          ? 'bg-status-red hover:brightness-105 text-white'
          : 'bg-tt-primary hover:brightness-105 text-white',
    ].join(' ')}
    onclick={handleConfirm}
  >
    <span class="inline-flex items-center justify-center gap-1.5">
      {#if danger && !loading}
        <Trash class="w-4 h-4 shrink-0" />
      {/if}
      <span>{resolvedConfirmText}</span>
    </span>
  </button>
{/snippet}

<AppDialog
  opened={Boolean(opened)}
  title={resolvedTitle}
  onbackdropClick={handleCancel}
  {buttonsSlot}
>
  <div class="py-2 text-left space-y-3">
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

    <div class="space-y-1.5 pt-1">
      <label for="confirm-input-field" class="block text-xs font-semibold text-tt-text-secondary">
        {t('mainMenu.typeConfirmPrompt', { word: confirmWord })}
      </label>
      <input
        id="confirm-input-field"
        bind:this={inputRef}
        bind:value={typedInput}
        type="text"
        maxlength="10"
        class="w-full px-3.5 py-2.5 rounded-xl border border-tt-separator bg-tt-surface-2 text-tt-text text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-tt-primary transition-colors"
        placeholder={confirmWord}
        onkeydown={handleKeydown}
      />
    </div>
  </div>
</AppDialog>
