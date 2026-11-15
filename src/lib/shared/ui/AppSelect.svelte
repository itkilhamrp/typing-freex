<script lang="ts">
  import { CaretDown, Check } from 'phosphor-svelte';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';

  const { t } = useI18n();

  export interface SelectOption {
    value: string | number;
    label: string;
    description?: string;
  }

  interface Props {
    modelValue?: string | number;
    value?: string | number;
    options: (SelectOption | string)[];
    placeholder?: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    block?: boolean;
    ariaLabel?: string;
    class?: string;
    onchange?: (value: string | number) => void;
  }

  let {
    modelValue = $bindable(undefined),
    value = $bindable(undefined),
    options = [],
    placeholder,
    disabled = false,
    size = 'md',
    block = false,
    ariaLabel,
    class: className = '',
    onchange,
  }: Props = $props();

  const currentValue = $derived(value !== undefined ? value : (modelValue ?? ''));
  const resolvedPlaceholder = $derived(placeholder ?? t('common.selectPlaceholder'));
  const resolvedAriaLabel = $derived(ariaLabel ?? t('common.dropdownAriaLabel'));

  let isOpen = $state(false);
  let selectRef = $state<HTMLDivElement | null>(null);

  const normalizedOptions = $derived<SelectOption[]>(
    options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt))
  );

  const selectedOption = $derived(
    normalizedOptions.find((opt) => opt.value === currentValue) || null
  );

  const displayLabel = $derived(selectedOption?.label ?? resolvedPlaceholder);

  function toggleDropdown() {
    if (disabled) return;
    isOpen = !isOpen;
  }

  function selectOption(option: SelectOption) {
    if (disabled) return;
    modelValue = option.value;
    value = option.value;
    onchange?.(option.value);
    isOpen = false;
  }

  $effect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    function handleClickOutside(e: MouseEvent) {
      if (selectRef && !selectRef.contains(e.target as Node)) {
        isOpen = false;
      }
    }
    function handleKeydown(e: KeyboardEvent) {
      if (disabled) return;
      if (e.key === 'Escape') {
        isOpen = false;
      }
    }

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  const sizeClasses = $derived(
    size === 'sm'
      ? 'h-8 px-3 text-xs rounded-xl gap-1.5'
      : size === 'lg'
        ? 'h-12 px-4 text-base rounded-2xl gap-3'
        : 'h-10 px-3.5 text-xs sm:text-sm rounded-xl gap-2'
  );
</script>

<div
  bind:this={selectRef}
  class={[
    'relative inline-block select-none font-sans',
    block ? 'w-full' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    className,
  ].filter(Boolean).join(' ')}
>
  <!-- Trigger Button -->
  <button
    type="button"
    disabled={Boolean(disabled)}
    aria-label={resolvedAriaLabel}
    aria-expanded={isOpen}
    class={[
      'btn w-full flex items-center justify-between text-left font-medium transition-[background-color,border-color,box-shadow,opacity] duration-150',
      'border border-tt-separator bg-tt-surface hover:bg-tt-surface-2 text-tt-text cursor-pointer active:opacity-75',
      isOpen ? 'border-status-blue ring-2 ring-status-blue/20' : '',
      sizeClasses,
    ].filter(Boolean).join(' ')}
    onclick={toggleDropdown}
  >
    <span class="truncate pr-1.5 text-tt-text">
      {displayLabel}
    </span>

    <span
      class={[
        'w-4 h-4 shrink-0 transition-transform duration-200 inline-flex items-center justify-center',
        isOpen ? 'rotate-180 text-status-blue' : 'text-tt-text-secondary',
      ].join(' ')}
    >
      <CaretDown class="w-4 h-4" />
    </span>
  </button>

  <!-- Dropdown Menu Popover -->
  {#if isOpen}
    <div
      class={[
        'card absolute z-50 mt-1.5 min-w-full sm:min-w-[190px] max-h-64 overflow-y-auto',
        'rounded-2xl p-1.5 shadow-2xl border border-tt-separator bg-tt-surface-elevated text-tt-text',
      ].join(' ')}
      role="listbox"
    >
      {#each normalizedOptions as opt (opt.value)}
        <button
          type="button"
          role="option"
          aria-selected={opt.value === currentValue}
          class={[
            'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium transition-colors cursor-pointer',
            opt.value === currentValue
              ? 'bg-status-blue/15 text-status-blue font-semibold'
              : 'hover:bg-tt-surface-2 text-tt-text',
          ].join(' ')}
          onclick={() => selectOption(opt)}
        >
          <div class="flex flex-col truncate pr-2">
            <span>{opt.label}</span>
            {#if opt.description}
              <span class="text-[11px] text-tt-text-secondary font-normal truncate">
                {opt.description}
              </span>
            {/if}
          </div>

          {#if opt.value === currentValue}
            <span class="w-4 h-4 text-status-blue shrink-0 ml-1.5 inline-flex items-center justify-center">
              <Check class="w-4 h-4" />
            </span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
