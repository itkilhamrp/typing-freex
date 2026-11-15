<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useCustomTextStore } from '#lib/modules/custom-text/stores/custom-text.store.svelte.js';
  import type { CustomTextSummary, CustomTextDetail } from '@/core/ipc';
  import { goto } from '$app/navigation';
  import {
    BookOpen,
    FileText,
    Play,
    Check,
    Plus,
    X,
    ArrowLeft,
  } from 'phosphor-svelte';
  import {
    AppDialog,
    AppSearchbar,
    AppList,
    AppListItem,
    AppButton,
    AppBadge,
  } from '#lib/shared/ui/index.js';

  interface Props {
    opened?: boolean;
    currentTextId?: string | null;
    canCancel?: boolean;
    embedded?: boolean;
    onselect?: (text: CustomTextDetail) => void;
    onclose?: () => void;
  }

  let {
    opened = false,
    currentTextId = null,
    canCancel = true,
    embedded = false,
    onselect,
    onclose,
  }: Props = $props();

  const { t } = useI18n();
  const store = useCustomTextStore();

  let searchQuery = $state('');
  let selectingId = $state<string | null>(null);
  let displayLimit = $state(50);

  $effect(() => {
    if (opened || embedded) {
      searchQuery = '';
      displayLimit = 50;
      store.fetchTexts();
    }
  });

  const filteredTexts = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return store.texts;
    }
    return store.texts.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.language.toLowerCase().includes(query)
      );
    });
  });

  const displayedTexts = $derived.by(() => {
    return filteredTexts.slice(0, displayLimit);
  });

  function handleListScroll(e: Event) {
    const target = e.target as HTMLElement;
    if (!target) return;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
      if (displayLimit < filteredTexts.length) {
        displayLimit += 30;
      }
    }
  }

  async function selectItem(item: CustomTextSummary) {
    if (selectingId) return;
    selectingId = item.id;
    try {
      const detail = await store.loadText(item.id);
      if (detail) {
        onselect?.(detail);
      }
    } finally {
      selectingId = null;
    }
  }

  async function handleGoToLibrary() {
    onclose?.();
    try {
      await goto('/custom-text');
    } catch {
      // Fallback for non-SvelteKit browser test environments
      window.location.href = '/custom-text';
    }
  }
</script>

{#snippet customTextListContent()}
  {#if store.isLoading && store.texts.length === 0}
    <div class="py-10 text-center text-xs text-tt-text-secondary">
      <div class="w-5 h-5 mx-auto mb-2 border-2 border-tt-primary border-t-transparent rounded-full animate-spin"></div>
      <span>{t('app.loading')}</span>
    </div>
  {:else if store.texts.length === 0}
    <div
      class="my-2 py-8 px-6 rounded-2xl bg-tt-surface-2/40 border border-dashed border-tt-separator flex flex-col items-center justify-center text-center gap-3"
    >
      <div class="w-10 h-10 rounded-xl bg-tt-surface-3 flex items-center justify-center text-tt-text-secondary">
        <BookOpen class="w-5 h-5" />
      </div>
      <div class="space-y-1">
        <h3 class="text-sm font-semibold text-tt-text">
          {t('arena.emptyCustomTextLibrary')}
        </h3>
        <p class="text-xs text-tt-text-secondary max-w-sm">
          {t('arena.emptyCustomTextDesc')}
        </p>
      </div>
      <AppButton
        variant="primary"
        size="small"
        rounded
        class="cursor-pointer font-sans"
        onclick={handleGoToLibrary}
      >
        {#snippet icon()}
          <Plus class="w-3.5 h-3.5" />
        {/snippet}
        {t('arena.goToLibrary')}
      </AppButton>
    </div>
  {:else if filteredTexts.length === 0}
    <div class="my-3 py-6 px-4 rounded-xl bg-tt-surface-2/30 border border-tt-separator/40 text-center space-y-1">
      <p class="text-xs font-medium text-tt-text">
        {t('arena.noCustomTextMatches')}
      </p>
      <p class="text-3xs text-tt-text-secondary">
        "{searchQuery}"
      </p>
    </div>
  {:else}
    <div
      class={[
        'overflow-y-auto space-y-1 select-none pr-1',
        embedded ? 'max-h-[220px]' : 'max-h-[300px]'
      ].join(' ')}
      onscroll={handleListScroll}
    >
      <AppList inset strong class="!my-0 !p-0 !bg-transparent space-y-1">
        {#each displayedTexts as item (item.id)}
          <AppListItem
            link
            chevron={false}
            class={[
              'cursor-pointer transition-colors rounded-xl overflow-hidden',
              item.id === currentTextId ? '!bg-tt-primary/10 border border-tt-primary/25' : 'hover:!bg-tt-surface-2/60'
            ].filter(Boolean).join(' ')}
            onclick={() => selectItem(item)}
          >
            {#snippet media()}
              <div
                class={[
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0',
                  item.id === currentTextId ? 'bg-tt-primary/20 text-tt-primary' : 'bg-tt-surface-2 text-tt-text-secondary'
                ].join(' ')}
              >
                <FileText class="w-4 h-4" />
              </div>
            {/snippet}

            {#snippet titleSlot()}
              <div class="flex items-center gap-2">
                <span class="font-semibold text-xs text-tt-text truncate max-w-[200px] sm:max-w-xs">
                  {item.title}
                </span>
                {#if item.id === currentTextId}
                  <AppBadge variant="primary" size="sm" class="uppercase tracking-wider">
                    {t('arena.activeBadge')}
                  </AppBadge>
                {/if}
              </div>
            {/snippet}

            {#snippet subtitleSlot()}
              <div class="flex items-center gap-1.5 text-3xs font-mono text-tt-text-secondary mt-0.5">
                <span>{t('arena.wordsCount', { count: item.word_count })}</span>
                <span>·</span>
                <span>{t('arena.charsCount', { count: item.char_count })}</span>
              </div>
            {/snippet}

            {#snippet afterSlot()}
              <div class="flex items-center shrink-0">
                {#if item.id === currentTextId}
                  <div class="w-6 h-6 rounded-md bg-tt-primary/20 text-tt-primary flex items-center justify-center">
                    <Check class="w-3.5 h-3.5 font-bold" />
                  </div>
                {:else}
                  <div
                    class="w-6 h-6 rounded-md bg-tt-surface-2 hover:bg-tt-primary hover:text-white text-tt-text-secondary flex items-center justify-center transition-colors"
                  >
                    <Play class="w-3 h-3 fill-current" weight="fill" />
                  </div>
                {/if}
              </div>
            {/snippet}
          </AppListItem>
        {/each}
      </AppList>
    </div>
  {/if}
{/snippet}

{#if embedded}
  <!-- Embedded Mode: Clean, native in-card passage selector (Typing Master Flow) -->
  <div class="w-full flex flex-col gap-2.5 px-4 sm:px-6 py-3 sm:py-4 select-none animate-fade-in">
    <!-- Header: Title on left, clean actions on right -->
    <div class="flex items-center justify-between w-full pb-2.5 border-b border-tt-separator/40">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-tt-primary/15 text-tt-primary flex items-center justify-center shrink-0">
          <BookOpen class="w-4 h-4" />
        </div>
        <div class="text-left">
          <h2 class="text-sm font-bold text-tt-text tracking-tight">
            {t('arena.selectCustomText')}
          </h2>
          <p class="text-3xs text-tt-text-secondary font-normal">
            {#if filteredTexts.length === store.texts.length}
              {store.texts.length} {t('arena.availableTexts').toLowerCase()}
            {:else}
              {filteredTexts.length} / {store.texts.length} {t('arena.availableTexts').toLowerCase()}
            {/if}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <AppButton
          variant="secondary"
          size="small"
          rounded
          class="!text-xs flex items-center gap-1.5 cursor-pointer font-sans"
          onclick={handleGoToLibrary}
        >
          <Plus class="w-3.5 h-3.5 text-tt-primary shrink-0" />
          <span>{t('arena.goToLibrary')}</span>
        </AppButton>

        {#if canCancel}
          <AppButton
            variant="secondary"
            size="small"
            rounded
            class="!text-xs flex items-center gap-1.5 cursor-pointer font-sans"
            onclick={() => onclose?.()}
          >
            <ArrowLeft class="w-3.5 h-3.5 shrink-0" />
            <span>{t('arena.cancel')}</span>
          </AppButton>
        {/if}
      </div>
    </div>

    <!-- Searchbar -->
    <div class="w-full my-0.5">
      <AppSearchbar
        bind:modelValue={searchQuery}
        placeholder={t('arena.searchCustomText')}
        disableButton={true}
        oninput={() => { displayLimit = 50; }}
        onclear={() => { displayLimit = 50; }}
      />
    </div>

    <!-- Content list -->
    {@render customTextListContent()}
  </div>
{:else}
  <!-- Dialog Mode: Standalone modal popup -->
  <AppDialog
    opened={Boolean(opened)}
    size="lg"
    panelClass="!overflow-hidden !p-0"
    onbackdropClick={canCancel ? () => onclose?.() : undefined}
  >
    {#snippet titleSlot()}
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-tt-primary/15 text-tt-primary flex items-center justify-center shrink-0">
            <BookOpen class="w-4 h-4" />
          </div>
          <div class="text-left">
            <h2 class="text-sm font-bold text-tt-text tracking-tight">
              {t('arena.selectCustomText')}
            </h2>
            <p class="text-3xs text-tt-text-secondary font-normal">
              {store.texts.length} {t('arena.availableTexts').toLowerCase()}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          {#if canCancel}
            <AppButton
              variant="secondary"
              size="small"
              rounded
              class="!w-7 !h-7 !p-0 !min-h-0 flex items-center justify-center cursor-pointer"
              title={t('arena.cancel')}
              onclick={() => onclose?.()}
            >
              <X class="w-3.5 h-3.5" />
            </AppButton>
          {/if}
        </div>
      </div>
    {/snippet}

    <div class="w-full flex flex-col gap-3 py-1 px-1">
      <div class="w-full">
        <AppSearchbar
          bind:modelValue={searchQuery}
          placeholder={t('arena.searchCustomText')}
          disableButton={true}
          oninput={() => { displayLimit = 50; }}
          onclear={() => { displayLimit = 50; }}
        />
      </div>

      {@render customTextListContent()}

      <!-- Clean Modal Footer Bar -->
      <div class="flex items-center justify-between w-full pt-3 mt-1 border-t border-tt-separator/40">
        <AppButton
          variant="secondary"
          size="small"
          rounded
          class="cursor-pointer font-sans"
          onclick={handleGoToLibrary}
        >
          {#snippet icon()}
            <Plus class="w-3.5 h-3.5 text-tt-primary" />
          {/snippet}
          {t('arena.goToLibrary')}
        </AppButton>

        {#if canCancel}
          <AppButton
            variant="secondary"
            size="small"
            rounded
            class="cursor-pointer font-sans"
            onclick={() => onclose?.()}
          >
            {t('arena.cancel')}
          </AppButton>
        {/if}
      </div>
    </div>
  </AppDialog>
{/if}
