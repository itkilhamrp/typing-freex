<script lang="ts">
  import { MagnifyingGlass, XCircle } from 'phosphor-svelte';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';

  const { t } = useI18n();

  interface Props {
    modelValue?: string;
    value?: string;
    placeholder?: string;
    clearButton?: boolean;
    disableButton?: boolean;
    onclear?: () => void;
    oninput?: (event: Event) => void;
    onChange?: (event: Event) => void;
    onchange?: (event: Event) => void;
    onfocus?: (event: FocusEvent) => void;
    onblur?: (event: FocusEvent) => void;
    ondisable?: () => void;
  }

  let {
    modelValue = $bindable(undefined),
    value = $bindable(undefined),
    placeholder,
    clearButton = true,
    disableButton = true,
    onclear,
    oninput,
    onChange,
    onchange,
    onfocus,
    onblur,
    ondisable,
  }: Props = $props();

  const currentValue = $derived(value !== undefined ? value : (modelValue ?? ''));
  const resolvedPlaceholder = $derived(placeholder || t('common.searchPlaceholder'));

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    modelValue = target.value;
    value = target.value;
    oninput?.(event);
    onchange?.(event);
    onChange?.(event);
  }

  function handleClear() {
    modelValue = '';
    value = '';
    onclear?.();
    if (disableButton) {
      ondisable?.();
    }
  }
</script>

<div class="w-full relative flex items-center">
  <div class="absolute left-3 text-tt-text-secondary pointer-events-none flex items-center justify-center">
    <MagnifyingGlass class="w-4 h-4" />
  </div>

  <input
    type="search"
    value={currentValue ?? ''}
    placeholder={resolvedPlaceholder}
    class="search-input w-full h-10 pl-9 pr-9 rounded-xl border border-tt-separator bg-tt-surface text-tt-text text-sm transition-colors focus:outline-none focus:border-tt-primary focus:ring-1 focus:ring-tt-primary placeholder:text-tt-text-secondary/60"
    oninput={handleInput}
    onfocus={onfocus}
    onblur={onblur}
  />

  {#if currentValue && clearButton}
    <button
      type="button"
      aria-label={t('common.clearSearch')}
      class="absolute right-2.5 text-tt-text-secondary hover:text-tt-text p-1 cursor-pointer flex items-center justify-center"
      onclick={handleClear}
    >
      <XCircle class="w-4 h-4" weight="fill" />
    </button>
  {/if}
</div>

<style>
  .search-input::-webkit-search-decoration,
  .search-input::-webkit-search-cancel-button,
  .search-input::-webkit-search-results-button,
  .search-input::-webkit-search-results-decoration {
    -webkit-appearance: none;
    appearance: none;
    display: none;
  }
</style>
