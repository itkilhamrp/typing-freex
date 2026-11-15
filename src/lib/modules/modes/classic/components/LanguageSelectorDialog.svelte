<script lang="ts">
  import { untrack } from 'svelte';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { AppDialog, AppSearchbar } from '#lib/shared/ui/index.js';
  import { Check } from 'phosphor-svelte';
  import {
    getAvailableLanguages,
    getQuoteOnlyLanguages,
    getTechLanguages,
    resolveLanguageId,
    resolveQuoteLanguageCode,
    resolveTechLanguageCode,
  } from '@/core/text-tools';

  interface Props {
    opened?: boolean;
    activeId?: string;
    mode?: 'wordlists' | 'quotes' | 'tech';
    title?: string;
    onclose?: () => void;
    onselect?: (id: string) => void;
  }

  interface SelectableOption {
    id: string;
    langCode: string;
    langName: string;
    nativeName: string;
    flag: string;
    variantName: string;
    size: number;
    isSelected: boolean;
  }

  let {
    opened = false,
    activeId = '',
    mode = 'wordlists',
    title = '',
    onclose,
    onselect,
  }: Props = $props();

  const { t } = useI18n();

  let searchQuery = $state('');
  let focusedIndex = $state(0);

  // Derived options based on mode ('wordlists' vs 'quotes' vs 'tech')
  const allOptions = $derived.by<SelectableOption[]>(() => {
    const isRandomActive = !activeId || activeId.toLowerCase() === 'random';

    if (mode === 'quotes') {
      const quoteLangs = getQuoteOnlyLanguages();
      const currentQuoteCode = isRandomActive ? 'random' : resolveQuoteLanguageCode(activeId);

      const randomOption: SelectableOption = {
        id: 'random',
        langCode: 'random',
        langName: 'RANDOM',
        nativeName: 'Random Quotes',
        flag: '🎲',
        variantName: 'All Packs',
        size: quoteLangs.reduce((acc, l) => acc + l.count, 0),
        isSelected: isRandomActive,
      };

      const mapped = quoteLangs.map((lang) => ({
        id: lang.code,
        langCode: lang.code,
        langName: lang.name,
        nativeName: lang.nativeName,
        flag: lang.flag,
        variantName: 'Quotes',
        size: lang.count,
        isSelected: !isRandomActive && lang.code === currentQuoteCode,
      }));

      return [randomOption, ...mapped];
    }

    if (mode === 'tech') {
      const isTechRandomActive = isRandomActive || activeId.toLowerCase() === 'tech';
      const techLangs = getTechLanguages().filter((lang) => lang.code !== 'tech');
      const currentTechCode = isTechRandomActive ? 'random' : resolveTechLanguageCode(activeId);

      const randomOption: SelectableOption = {
        id: 'random',
        langCode: 'random',
        langName: 'RANDOM',
        nativeName: 'Random Tech',
        flag: '🎲',
        variantName: 'All Tech',
        size: techLangs.reduce((acc, l) => acc + l.count, 0),
        isSelected: isTechRandomActive,
      };

      const mapped = techLangs.map((lang) => ({
        id: lang.code,
        langCode: lang.code,
        langName: lang.name,
        nativeName: lang.nativeName,
        flag: lang.flag,
        variantName: 'Tech',
        size: lang.count,
        isSelected: !isTechRandomActive && lang.code === currentTechCode,
      }));

      return [randomOption, ...mapped];
    }

    // Wordlists mode
    const canonicalActiveId = isRandomActive ? 'random' : resolveLanguageId(activeId || 'en');
    const allLanguages = getAvailableLanguages();
    const list: SelectableOption[] = [
      {
        id: 'random',
        langCode: 'random',
        langName: 'RANDOM',
        nativeName: 'Random Language',
        flag: '🎲',
        variantName: 'All Wordlists',
        size: allLanguages.reduce((acc, l) => acc + l.variants.reduce((va, v) => va + v.size, 0), 0),
        isSelected: isRandomActive,
      },
    ];

    for (const lang of allLanguages) {
      for (const variant of lang.variants) {
        list.push({
          id: variant.id,
          langCode: lang.code,
          langName: lang.name,
          nativeName: lang.nativeName,
          flag: lang.flag,
          variantName: variant.name,
          size: variant.size,
          isSelected: !isRandomActive && variant.id === canonicalActiveId,
        });
      }
    }
    return list;
  });

  const filteredOptions = $derived.by<SelectableOption[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter(
      (opt) =>
        opt.langName.toLowerCase().includes(q) ||
        opt.nativeName.toLowerCase().includes(q) ||
        opt.variantName.toLowerCase().includes(q) ||
        opt.id.toLowerCase().includes(q) ||
        opt.langCode.toLowerCase().includes(q)
    );
  });

  // Safe effect on open — uses untrack to avoid reactive loop with searchQuery / filteredOptions
  $effect(() => {
    if (opened) {
      searchQuery = '';
      untrack(() => {
        const initialIdx = allOptions.findIndex((opt) => opt.isSelected);
        focusedIndex = initialIdx >= 0 ? initialIdx : 0;
      });

      if (typeof window !== 'undefined') {
        const timer = setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('.lang-dialog-search input');
          input?.focus();
        }, 50);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  });

  // Adjust focused index when filtering
  $effect(() => {
    if (searchQuery) {
      untrack(() => {
        focusedIndex = 0;
      });
    }
  });

  function selectOption(id: string) {
    onselect?.(id);
    onclose?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!opened) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        focusedIndex = (focusedIndex + 1) % filteredOptions.length;
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        focusedIndex = (focusedIndex - 1 + filteredOptions.length) % filteredOptions.length;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetOpt = filteredOptions[focusedIndex];
      if (targetOpt) {
        selectOption(targetOpt.id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onclose?.();
    }
  }

  $effect(() => {
    if (typeof window !== 'undefined' && opened) {
      window.addEventListener('keydown', handleKeydown);
      return () => {
        window.removeEventListener('keydown', handleKeydown);
      };
    }
  });

  const dialogTitle = $derived(
    title ||
      (mode === 'tech'
        ? t('arena.selectTechLanguage')
        : mode === 'quotes'
          ? t('arena.selectQuoteLanguage')
          : t('arena.selectLanguage'))
  );
</script>

{#snippet buttonsSlot()}
  <button
    type="button"
    class="btn bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-tt-text border border-black/5 dark:border-white/10 rounded-full h-10 px-6 text-sm font-semibold transition-[transform,background-color,color] duration-150 active:scale-[0.98] cursor-pointer inline-flex items-center justify-center"
    onclick={onclose}
  >
    {t('arena.cancel')}
  </button>
{/snippet}

<AppDialog
  opened={Boolean(opened)}
  title={dialogTitle}
  size="md"
  onbackdropClick={onclose}
  {buttonsSlot}
>
  <div class="py-2 space-y-3 text-left">
    <!-- Search Bar with class for auto-focus -->
    <div class="lang-dialog-search w-full">
      <AppSearchbar
        bind:value={searchQuery}
        placeholder={t('arena.searchLanguage')}
        clearButton
      />
    </div>

    <!-- Options List -->
    <div
      class="max-h-72 overflow-y-auto space-y-1 pr-0.5 rounded-xl border border-tt-separator/40 p-1 bg-tt-surface-2/40"
      style="contain: layout style;"
    >
      {#if filteredOptions.length === 0}
        <div class="py-8 text-center text-xs text-tt-text-secondary">
          {t('arena.noLanguageMatches')}
        </div>
      {:else}
        {#each filteredOptions as opt, idx (opt.id)}
          <button
            type="button"
            class={[
              'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 select-none cursor-pointer min-h-[44px]',
              opt.isSelected
                ? 'bg-tt-primary/15 text-tt-primary font-semibold border border-tt-primary/30'
                : idx === focusedIndex
                  ? 'bg-tt-surface-2 text-tt-text border border-tt-separator/60'
                  : 'hover:bg-tt-surface-2/70 text-tt-text-secondary hover:text-tt-text border border-transparent',
            ].join(' ')}
            onclick={() => selectOption(opt.id)}
            onmouseenter={() => (focusedIndex = idx)}
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="text-base shrink-0 leading-none" aria-hidden="true">
                {opt.flag}
              </span>
              <div class="truncate">
                <div class="text-sm font-medium truncate flex items-center gap-2">
                  <span>{opt.langName}</span>
                  {#if opt.nativeName && opt.nativeName !== opt.langName}
                    <span class="text-xs text-tt-text-secondary/70 font-normal">
                      ({opt.nativeName})
                    </span>
                  {/if}
                </div>
                <div class="text-xs text-tt-text-secondary flex items-center gap-1.5 mt-0.5">
                  {#if mode === 'quotes'}
                    <span class="font-sans">{t('arena.quotesCount', { count: opt.size })}</span>
                  {:else if mode === 'tech'}
                    <span class="font-sans">{t('arena.techsCount', { count: opt.size })}</span>
                  {:else}
                    <span class="font-mono">{opt.variantName}</span>
                    <span class="opacity-40">•</span>
                    <span>{t('arena.wordsCount', { count: opt.size })}</span>
                  {/if}
                </div>
              </div>
            </div>

            {#if opt.isSelected}
              <div class="shrink-0 flex items-center text-tt-primary">
                <Check class="w-4 h-4" />
              </div>
            {/if}
          </button>
        {/each}
      {/if}
    </div>
  </div>
</AppDialog>
