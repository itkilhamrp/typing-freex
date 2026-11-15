<script lang="ts">
  import { XCircle } from 'phosphor-svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';

  const { t } = useI18n();

  interface Props extends Omit<HTMLInputAttributes, 'value' | 'type'> {
    label?: string;
    type?: string;
    placeholder?: string;
    value?: string | number;
    modelValue?: string | number;
    disabled?: boolean;
    clearButton?: boolean;
    error?: string;
    class?: string;
    id?: string;
    oninput?: (event: Event) => void;
    onchange?: (event: Event) => void;
    onclear?: () => void;
    children?: Snippet;
    media?: Snippet;
    [key: string]: unknown;
  }

  let {
    label = '',
    type = 'text',
    placeholder = '',
    value = '',
    modelValue = $bindable(''),
    disabled = false,
    clearButton = false,
    error = '',
    class: className = '',
    id,
    oninput,
    onchange,
    onclear,
    children,
    media,
    ...rest
  }: Props = $props();

  const inputId = $derived(id || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined));
  const currentValue = $derived(modelValue !== undefined && modelValue !== '' ? modelValue : value);

  function handleInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    modelValue = val;
    oninput?.(e);
  }

  function handleClear() {
    modelValue = '';
    onclear?.();
  }
</script>

<div class={['flex flex-col gap-1.5 px-4 py-2.5', className].filter(Boolean).join(' ')}>
  {#if label}
    <label for={inputId} class="text-xs font-semibold text-tt-text-secondary">
      {label}
    </label>
  {/if}

  <div class="flex items-center gap-2.5 relative">
    {#if media}
      <div class="shrink-0 flex items-center justify-center text-tt-text-secondary">
        {@render media()}
      </div>
    {/if}

    <div class="relative flex-1 flex items-center">
      <input
        id={inputId}
        {type}
        {placeholder}
        value={currentValue ?? ''}
        disabled={Boolean(disabled)}
        class="w-full h-10 px-3.5 pr-8 rounded-xl border border-tt-separator bg-tt-surface text-tt-text text-sm transition-colors focus:outline-none focus:border-tt-primary focus:ring-1 focus:ring-tt-primary disabled:opacity-50"
        oninput={handleInput}
        onchange={onchange}
        {...rest}
      />

      {#if clearButton && currentValue}
        <button
          type="button"
          class="absolute right-2.5 text-tt-text-secondary hover:text-tt-text p-1 cursor-pointer"
          onclick={handleClear}
          aria-label={t('common.clear')}
        >
          <XCircle class="w-4 h-4" weight="fill" />
        </button>
      {/if}
    </div>
  </div>

  {#if error}
    <span class="text-xs text-status-red">{error}</span>
  {/if}

  {@render children?.()}
</div>
