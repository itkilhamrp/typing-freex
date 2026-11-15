<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { AppDialog } from '#lib/shared/ui/index.js';
  import { Clock, Minus, Plus } from 'phosphor-svelte';

  interface Props {
    opened?: boolean;
    initialSeconds?: number | null;
    onclose?: () => void;
    onconfirm?: (seconds: number) => void;
  }

  let {
    opened = false,
    initialSeconds = 45,
    onclose,
    onconfirm,
  }: Props = $props();

  const { t } = useI18n();

  let enteredSeconds = $state<number>(45);
  let inputRef = $state<HTMLInputElement | null>(null);
  let errorMessage = $state<string>('');

  const quickPresets = [45, 90, 180, 300, 600];

  $effect(() => {
    if (opened) {
      enteredSeconds = initialSeconds && initialSeconds > 0 ? initialSeconds : 45;
      errorMessage = '';
      const timer = setTimeout(() => {
        inputRef?.focus();
        inputRef?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  });

  function step(delta: number) {
    const current = Number(enteredSeconds) || 0;
    const next = Math.min(3600, Math.max(5, current + delta));
    enteredSeconds = next;
    errorMessage = '';
  }

  function selectPreset(val: number) {
    enteredSeconds = val;
    errorMessage = '';
  }

  function handleConfirm() {
    const val = Math.round(Number(enteredSeconds));
    if (isNaN(val) || val < 5 || val > 3600) {
      errorMessage = t('arena.customDurationMinMax');
      return;
    }
    onconfirm?.(val);
    onclose?.();
  }

  function handleCancel() {
    onclose?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!opened) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
    }
  }

  $effect(() => {
    if (typeof window !== 'undefined' && opened) {
      window.addEventListener('keydown', handleKeydown);
      return () => {
        window.removeEventListener('keydown', handleKeydown);
      };
    }
    return undefined;
  });
</script>

{#snippet buttonsSlot()}
  <button
    type="button"
    class="btn bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-tt-text border border-black/5 dark:border-white/10 rounded-full h-10 px-4 text-sm font-semibold flex-1 transition-[transform,background-color,color] duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
    onclick={handleCancel}
  >
    {t('arena.cancel')}
  </button>
  <button
    type="button"
    class="btn bg-tt-primary hover:brightness-105 text-white h-10 px-4 text-sm font-semibold flex-1 rounded-full transition-[transform,filter] duration-150 active:scale-[0.98] cursor-pointer shadow-xs inline-flex items-center justify-center"
    onclick={handleConfirm}
  >
    {t('arena.setDuration')}
  </button>
{/snippet}

<AppDialog
  opened={Boolean(opened)}
  title={t('arena.customDurationPrompt')}
  onbackdropClick={handleCancel}
  {buttonsSlot}
>
  <div class="py-2 space-y-4 text-left">
    <p class="text-xs text-tt-text-secondary leading-relaxed flex items-center gap-1.5">
      <Clock class="w-4 h-4 text-tt-primary shrink-0" />
      <span>{t('arena.customDurationDesc')}</span>
    </p>

    <!-- Quick Preset Chips -->
    <div class="flex flex-wrap items-center gap-1.5">
      {#each quickPresets as p (p)}
        <button
          type="button"
          class={[
            'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer select-none',
            enteredSeconds === p
              ? 'bg-tt-primary text-white border-tt-primary shadow-xs'
              : 'bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text-secondary hover:text-tt-text border-tt-separator/50',
          ].join(' ')}
          onclick={() => selectPreset(p)}
        >
          {p}s
        </button>
      {/each}
    </div>

    <!-- Duration Input with Steppers -->
    <div class="space-y-1.5">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="w-10 h-10 rounded-xl bg-tt-surface-2 hover:bg-tt-surface-3 border border-tt-separator/60 flex items-center justify-center text-tt-text active:scale-95 transition-all cursor-pointer select-none shrink-0"
          title="-15s"
          onclick={() => step(-15)}
        >
          <Minus class="w-4 h-4" />
        </button>

        <div class="relative flex-1">
          <input
            bind:this={inputRef}
            bind:value={enteredSeconds}
            type="number"
            min="5"
            max="3600"
            class="w-full h-10 px-3.5 pr-8 rounded-xl bg-tt-surface-2 border border-tt-separator/60 text-tt-text font-mono text-center font-bold text-base focus:outline-none focus:border-tt-primary focus:ring-1 focus:ring-tt-primary transition-all"
            placeholder={t('arena.customDurationPlaceholder')}
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-tt-text-secondary pointer-events-none">
            s
          </span>
        </div>

        <button
          type="button"
          class="w-10 h-10 rounded-xl bg-tt-surface-2 hover:bg-tt-surface-3 border border-tt-separator/60 flex items-center justify-center text-tt-text active:scale-95 transition-all cursor-pointer select-none shrink-0"
          title="+15s"
          onclick={() => step(15)}
        >
          <Plus class="w-4 h-4" />
        </button>
      </div>

      {#if errorMessage}
        <p class="text-xs font-medium text-status-red animate-fade-in">
          {errorMessage}
        </p>
      {/if}
    </div>
  </div>
</AppDialog>
