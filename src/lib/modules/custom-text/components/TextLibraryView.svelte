<script lang="ts">
  import { customTextStore } from '../stores/custom-text.store.svelte';
  import { typingStore } from '#lib/modules/modes/classic/stores/typing.store.svelte.js';
  import { i18n } from '#lib/shared/stores/i18n.svelte.js';
  import {
    BookOpen as PhBookOpen,
    Plus as PhPlus,
    UploadSimple as PhUploadSimple,
    Play as PhPlay,
    PencilSimple as PhPencilSimple,
    Copy as PhCopy,
    Trash as PhTrash,
    DownloadSimple as PhDownloadSimple,
  } from 'phosphor-svelte';
  import {
    AppPage,
    AppCard,
    AppSelect,
    AppConfirmDialog,
    AppButton,
    AppSearchbar,
    AppPagination,
  } from '#lib/shared/ui/index.js';
  import { customTextApi } from '@/core/ipc';
  import { goto } from '$app/navigation';

  const t = i18n.t;

  async function navigate(path: string) {
    try {
      await goto(path);
    } catch {
      window.location.href = path;
    }
  }

  let deleteConfirmOpen = $state(false);
  let itemToDelete = $state<{ id: string; title: string } | null>(null);

  function requestDelete(id: string, title: string) {
    itemToDelete = { id, title };
    deleteConfirmOpen = true;
  }

  async function handleConfirmDelete() {
    if (!itemToDelete) return;
    try {
      await customTextStore.deleteText(itemToDelete.id);
    } catch (err) {
      console.error('Failed to delete custom text:', err);
    } finally {
      deleteConfirmOpen = false;
      itemToDelete = null;
    }
  }

  const sortOptions = $derived([
    { value: 'updated_at', label: t('customText.sortUpdated') },
    { value: 'title', label: t('customText.sortTitleAz') },
    { value: 'word_count', label: t('customText.sortWordCount') },
  ]);

  let currentPage = $state(1);
  const pageSize = 9;

  $effect(() => {
    customTextStore.fetchTexts();
  });

  function handleSearch() {
    customTextStore.fetchTexts();
  }

  function handleSortChange() {
    customTextStore.fetchTexts();
  }

  async function practiceText(id: string) {
    try {
      const detail = await customTextStore.loadText(id);
      if (detail) {
        typingStore.setCustomPractice(detail.body, detail.title, detail.id);
        await navigate('/');
      }
    } catch (err) {
      console.error('Failed to load custom text for practice:', err);
    }
  }

  async function duplicateTextItem(id: string) {
    try {
      await customTextStore.duplicateText(id);
    } catch (err) {
      console.error('Failed to duplicate custom text:', err);
    }
  }

  async function exportText(id: string, title: string) {
    let detail;
    try {
      detail = await customTextStore.loadText(id);
    } catch (err) {
      console.error('Failed to load custom text for export:', err);
      return;
    }
    if (!detail) return;

    const sanitizedBase = title.replace(/[^a-zA-Z0-9_\-\s]/g, '_').trim() || 'custom_text';
    const defaultFileName = `${sanitizedBase}.txt`;

    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        let defaultPath = defaultFileName;

        try {
          const { documentDir, downloadDir, join } = await import('@tauri-apps/api/path');
          const baseDir = (await documentDir()) || (await downloadDir());
          if (baseDir) {
            defaultPath = await join(baseDir, defaultFileName);
          }
        } catch (pathErr) {
          console.warn('Failed to resolve standard directory for file dialog:', pathErr);
        }

        const selected = await save({
          title: t('customText.saveDialogTitle'),
          defaultPath,
          filters: [
            {
              name: t('customText.filterTextDoc'),
              extensions: ['txt'],
            },
            {
              name: t('customText.filterAllFiles'),
              extensions: ['*'],
            },
          ],
        });

        if (!selected) {
          return;
        }

        await customTextApi.exportToFile(id, selected);
        return;
      } catch (dialogErr) {
        console.warn('Native file save dialog failed, falling back to browser download:', dialogErr);
      }
    }

    const blob = new Blob([detail.body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  let paginatedTexts = $derived.by(() => {
    const start = (currentPage - 1) * pageSize;
    return customTextStore.texts.slice(start, start + pageSize);
  });

  $effect(() => {
    // Reset page to 1 when query/sort changes
    void [customTextStore.searchQuery, customTextStore.sortOption];
    currentPage = 1;
  });

  $effect(() => {
    const total = customTextStore.texts.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > maxPage) {
      currentPage = maxPage;
    }
  });
</script>

<AppPage maxWidth="max-w-5xl" class="select-none animate-fade-in">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tt-separator/50 pb-6">
    <div>
      <h1 class="text-3xl font-extrabold tracking-tight text-tt-text">{t('customText.title')}</h1>
      <p class="text-sm text-tt-text-secondary mt-1">
        {t('customText.subtitle')}
      </p>
    </div>

    <div class="flex items-center gap-2.5 sm:gap-3 shrink-0">
      <AppButton
        tonal
        rounded
        class="w-36 sm:w-40 h-10.5 font-semibold text-xs sm:text-sm whitespace-nowrap flex items-center justify-center gap-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-tt-text border border-black/5 dark:border-white/10 shadow-sm active:scale-[0.98] transition-[transform,background-color,color] duration-150 cursor-pointer"
        onclick={() => navigate('/custom-text/import')}
      >
        <PhUploadSimple class="w-4 h-4 text-ios-orange shrink-0" />
        <span>{t('customText.importFile')}</span>
      </AppButton>

      <AppButton
        rounded
        class="w-36 sm:w-40 h-10.5 font-semibold text-xs sm:text-sm whitespace-nowrap flex items-center justify-center gap-2 bg-tt-primary text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.98] transition-[transform,filter,box-shadow] duration-150 cursor-pointer"
        onclick={() => navigate('/custom-text/edit')}
      >
        <PhPlus class="w-4 h-4 shrink-0" />
        <span>{t('customText.newText')}</span>
      </AppButton>
    </div>
  </div>

  <!-- Search & Filter Bar -->
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
    <div class="w-full sm:w-96 md:w-[420px]">
      <AppSearchbar
        bind:value={customTextStore.searchQuery}
        placeholder={t('customText.searchPlaceholder')}
        oninput={handleSearch}
        onclear={handleSearch}
      />
    </div>

    <div class="flex items-center gap-2 self-end sm:self-auto text-xs text-tt-text-secondary">
      <span class="font-semibold">{t('customText.sortLabel')}</span>
      <AppSelect
        bind:value={customTextStore.sortOption}
        options={sortOptions}
        size="sm"
        onchange={handleSortChange}
      />
    </div>
  </div>

  <!-- Library Grid -->
  {#if customTextStore.texts.length > 0}
    <div class="flex flex-col gap-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {#each paginatedTexts as item (item.id)}
          <AppCard
            padding="p-5"
            class="h-full flex flex-col justify-between hover:border-black/15 dark:hover:border-white/20 hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-150 group shadow-sm hover:shadow-md"
            style="content-visibility: auto; contain-intrinsic-size: 0 160px;"
          >
            <div class="flex-1">
              <!-- Title -->
              <h3 class="font-bold text-sm sm:text-base line-clamp-1 group-hover:text-tt-primary transition-colors text-tt-text mb-2">
                {item.title}
              </h3>

              <!-- Metadata -->
              <div class="flex items-center gap-2 text-xs text-tt-text-secondary font-medium">
                <span>{item.word_count} {t('customText.words')}</span>
                <span class="text-tt-separator">·</span>
                <span>{item.char_count} {t('customText.characters')}</span>
                {#if item.source}
                  <span class="text-tt-separator">·</span>
                  <span class="truncate max-w-[120px]">{item.source}</span>
                {/if}
              </div>
            </div>

            <!-- Action Row -->
            <div class="pt-3 mt-3 border-t border-tt-separator/40 flex items-center justify-between">
              <AppButton
                rounded
                small
                class="bg-tt-primary text-white hover:brightness-105 active:scale-[0.98] shadow-xs hover:shadow-sm text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer"
                onclick={() => practiceText(item.id)}
              >
                <PhPlay class="w-3.5 h-3.5" weight="fill" />
                <span>{t('customText.practice')}</span>
              </AppButton>

              <div class="flex items-center gap-0.5 text-tt-text-secondary">
                <button
                  type="button"
                  class="p-2 rounded-lg hover:bg-tt-surface-2 hover:text-tt-text transition-colors cursor-pointer"
                  title={t('customText.edit')}
                  onclick={() => navigate(`/custom-text/edit/${item.id}`)}
                >
                  <PhPencilSimple class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  class="p-2 rounded-lg hover:bg-tt-surface-2 hover:text-tt-text transition-colors cursor-pointer"
                  title={t('customText.duplicate')}
                  onclick={() => duplicateTextItem(item.id)}
                >
                  <PhCopy class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  class="p-2 rounded-lg hover:bg-tt-surface-2 hover:text-tt-text transition-colors cursor-pointer"
                  title={t('customText.export')}
                  onclick={() => exportText(item.id, item.title)}
                >
                  <PhDownloadSimple class="w-4 h-4" />
                </button>
                <button
                  type="button"
                  class="p-2 rounded-lg hover:bg-ios-red/10 hover:text-ios-red transition-colors cursor-pointer"
                  title={t('customText.delete')}
                  onclick={() => requestDelete(item.id, item.title)}
                >
                  <PhTrash class="w-4 h-4" />
                </button>
              </div>
            </div>
          </AppCard>
        {/each}
      </div>

      <!-- AppPagination Control -->
      {#if customTextStore.texts.length > 0}
        <AppPagination
          bind:currentPage
          totalItems={customTextStore.texts.length}
          {pageSize}
          itemLabel="texts"
        />
      {/if}
    </div>
  {:else}
    <!-- Empty State -->
    <AppCard
      class="text-center py-16 p-8 space-y-4"
      padding="p-8"
    >
      <PhBookOpen class="w-12 h-12 text-tt-text-secondary mx-auto opacity-40" />
      <div class="text-base font-bold text-tt-text">{t('customText.emptyLibrary')}</div>
      <p class="text-xs text-tt-text-secondary max-w-sm mx-auto">
        {t('customText.emptyCta')}
      </p>
      <div class="flex items-center justify-center gap-3 pt-2">
        <AppButton
          tonal
          rounded
          class="w-36 sm:w-40 h-10 font-semibold text-xs sm:text-sm whitespace-nowrap flex items-center justify-center gap-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-tt-text border border-black/5 dark:border-white/10 shadow-sm active:scale-[0.98] transition-[transform,background-color,color] duration-150 cursor-pointer"
          onclick={() => navigate('/custom-text/import')}
        >
          <PhUploadSimple class="w-4 h-4 text-ios-orange shrink-0" />
          <span>{t('customText.importFile')}</span>
        </AppButton>
        <AppButton
          rounded
          class="w-36 sm:w-40 h-10 font-semibold text-xs sm:text-sm whitespace-nowrap flex items-center justify-center gap-2 bg-tt-primary text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.98] transition-[transform,filter,box-shadow] duration-150 cursor-pointer"
          onclick={() => navigate('/custom-text/edit')}
        >
          <PhPlus class="w-4 h-4 shrink-0" />
          <span>{t('customText.createFirst')}</span>
        </AppButton>
      </div>
    </AppCard>
  {/if}

  <!-- Delete Confirmation Dialog -->
  <AppConfirmDialog
    opened={deleteConfirmOpen}
    title={t('customText.delete')}
    message={t('customText.deleteConfirm', { title: itemToDelete?.title ?? '' })}
    onconfirm={handleConfirmDelete}
    oncancel={() => {
      deleteConfirmOpen = false;
      itemToDelete = null;
    }}
  />
</AppPage>
