<script lang="ts">
  import { i18n } from '#lib/shared/stores/i18n.svelte.js';
  import {
    customTextApi,
    formatErrorMessage,
    type TextImportPickResult,
  } from '@/core/ipc';
  import {
    ArrowLeft as PhArrowLeft,
    FileText as PhFileText,
    Warning as PhWarning,
    CheckCircle as PhCheckCircle,
  } from 'phosphor-svelte';
  import { AppPage, AppCard, AppButton, AppSelect } from '#lib/shared/ui/index.js';
  import { goto } from '$app/navigation';

  const t = i18n.t;

  async function navigate(path: string) {
    try {
      await goto(path);
    } catch {
      window.location.href = path;
    }
  }

  const encodingOptions = [
    { value: 'UTF-8', label: 'UTF-8' },
    { value: 'Windows-1252', label: 'Windows-1252 (Latin-1)' },
    { value: 'ISO-8859-15', label: 'ISO-8859-15' },
    { value: 'UTF-16LE', label: 'UTF-16 LE' },
    { value: 'UTF-16BE', label: 'UTF-16 BE' },
  ];

  let splitOptions = $derived([
    { value: 'none', label: t('customText.splitNone') },
    { value: 'paragraph', label: t('customText.splitParagraph') },
    { value: 'sentence', label: t('customText.splitSentence') },
    { value: 'fixed', label: t('customText.splitFixed') },
  ]);

  let staged = $state<TextImportPickResult | null>(null);
  let isPicking = $state(false);
  let isCommitting = $state(false);
  let error = $state<string | null>(null);

  let baseTitle = $state('');
  let language = $state('en');
  let selectedEncoding = $state('UTF-8');
  let splitStrategy = $state('none');

  let fileInputRef: HTMLInputElement | null = $state(null);

  async function pickFilePath(filePath: string) {
    isPicking = true;
    error = null;

    try {
      const res = await customTextApi.importPick(filePath);
      if (res) {
        staged = res;
        baseTitle = res.filename.replace(/\.[^/.]+$/, '');
      }
    } catch (err: unknown) {
      console.error('Pick text failed:', err);
      error = formatErrorMessage(err);
    } finally {
      isPicking = false;
    }
  }

  async function triggerFileInput() {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          title: t('customText.dialogSelectTextDoc'),
          multiple: false,
          directory: false,
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

        if (selected && typeof selected === 'string') {
          await pickFilePath(selected);
        }
        return;
      } catch (dialogErr) {
        console.warn('Native open file dialog failed, falling back to input:', dialogErr);
      }
    }

    fileInputRef?.click();
  }

  async function onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const filePath = (file as unknown as { path?: string }).path || file.name;
    await pickFilePath(filePath);
  }

  async function handleReencode() {
    if (!staged) return;
    error = null;
    try {
      const updated = await customTextApi.importReencode(
        staged.staging_id,
        selectedEncoding
      );
      staged = updated;
    } catch (err: unknown) {
      console.error('Re-encode failed:', err);
      error = formatErrorMessage(err);
    }
  }

  async function commitImport() {
    if (!staged) return;

    isCommitting = true;
    error = null;

    try {
      await customTextApi.importCommit(
        staged.staging_id,
        baseTitle.trim() || undefined,
        language,
        splitStrategy
      );
      await navigate('/custom-text');
    } catch (err: unknown) {
      console.error('Commit text import failed:', err);
      error = formatErrorMessage(err);
    } finally {
      isCommitting = false;
    }
  }

  async function cancelImport() {
    if (staged) {
      const stagingId = staged.staging_id;
      staged = null;
      try {
        await customTextApi.importCancel(stagingId);
      } catch (err) {
        console.warn('Cancel staged import failed:', err);
      }
    }
    await navigate('/custom-text');
  }
</script>

<AppPage maxWidth="max-w-5xl" class="select-none animate-fade-in">
  <!-- Header -->
  <div class="flex items-center gap-3 border-b border-tt-separator pb-4">
    <button
      type="button"
      class="p-2 rounded-xl bg-tt-surface-2 hover:bg-tt-surface-3 transition-colors cursor-pointer text-tt-text"
      onclick={cancelImport}
    >
      <PhArrowLeft class="w-4 h-4 text-tt-text-secondary" />
    </button>
    <div>
      <h1 class="text-xl font-bold text-tt-text">{t('customText.wizardTitle')}</h1>
      <p class="text-xs text-tt-text-secondary">
        {t('customText.wizardSubtitle')}
      </p>
    </div>
  </div>

  <!-- Error Banner -->
  {#if error}
    <div
      class="p-3.5 rounded-xl bg-ios-red/10 border border-ios-red/30 text-ios-red text-xs flex items-center justify-between animate-fade-in font-semibold"
    >
      <div class="flex items-center gap-2">
        <PhWarning class="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
      <button
        type="button"
        class="hover:underline cursor-pointer"
        onclick={() => (error = null)}
      >
        {t('common.done')}
      </button>
    </div>
  {/if}

  <!-- Step 1: File Selection -->
  {#if !staged}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="border-2 border-dashed border-tt-separator hover:border-black/30 dark:hover:border-white/30 rounded-2xl p-12 text-center transition-colors cursor-pointer bg-tt-surface-2/40 hover:bg-tt-surface-2/60"
      onclick={triggerFileInput}
    >
      <input
        bind:this={fileInputRef}
        type="file"
        accept=".txt,.md,.text"
        class="hidden"
        onchange={onFileSelected}
      />
      <PhFileText class="w-12 h-12 text-tt-text-secondary mx-auto mb-3 opacity-60" />
      <div class="text-sm font-semibold text-tt-text">{t('customText.importFile')}</div>
      <div class="text-xs text-tt-text-secondary mt-1">
        {t('customText.importHint')}
      </div>
      <button
        type="button"
        class="mt-4 px-4 py-2 rounded-xl bg-tt-surface border border-tt-separator text-xs font-semibold hover:bg-tt-surface-2 transition-colors cursor-pointer text-tt-text disabled:opacity-50"
        disabled={isPicking}
      >
        {isPicking ? t('common.loading') : t('customText.importFile')}
      </button>
    </div>
  {:else}
    <!-- Step 2: Staged Preview & Configuration -->
    <div class="flex flex-col gap-6 animate-fade-in">
      <!-- File Metadata & Encoding -->
      <AppCard padding="p-5" class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tt-separator pb-4">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-tt-primary/10 text-tt-primary">
              <PhFileText class="w-5 h-5" />
            </div>
            <div>
              <div class="text-sm font-bold text-tt-text">{staged.filename}</div>
              <div class="text-xs text-tt-text-secondary font-medium">
                {staged.total_words} {t('customText.words')} • {staged.total_chars} {t('customText.characters')}
              </div>
            </div>
          </div>

          <!-- Encoding Selector -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-tt-text-secondary font-semibold">{t('customText.encoding')}:</span>
            <AppSelect
              bind:value={selectedEncoding}
              options={encodingOptions}
              size="sm"
              onchange={handleReencode}
            />
          </div>
        </div>

        <!-- Title and Splitting -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-tt-text-secondary mb-1" for="import-title-input">
              {t('customText.textTitle')}
            </label>
            <input
              id="import-title-input"
              bind:value={baseTitle}
              type="text"
              maxlength={100}
              class="w-full px-3.5 py-2 rounded-xl bg-tt-surface-2 border border-tt-separator text-tt-text text-xs focus:outline-none focus:border-tt-primary transition-colors font-medium"
            />
          </div>

          <div>
            <span class="block text-xs font-semibold text-tt-text-secondary mb-1">
              {t('customText.splitting')}
            </span>
            <AppSelect
              bind:value={splitStrategy}
              options={splitOptions}
              block
            />
          </div>
        </div>

        <!-- Issue warnings if any -->
        {#if staged.issues.length > 0}
          <div
            class="p-3 rounded-xl bg-ios-orange/15 border border-ios-orange/30 text-ios-orange text-xs space-y-1 font-medium"
          >
            <div class="font-bold flex items-center gap-1.5 text-ios-orange">
              <PhWarning class="w-3.5 h-3.5" />
              {t('customText.detectedIssues')}
            </div>
            {#each staged.issues as iss, i (i)}
              <div class="pl-5 text-2xs">
                • {iss}
              </div>
            {/each}
          </div>
        {/if}

        <!-- Preview Box (First 2000 chars) -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs text-tt-text-secondary font-medium">
            <span>{t('customText.preview')} {t('customText.previewHint')}</span>
            <span class="text-3xs uppercase font-mono">{t('customText.sanitizedPreview')}</span>
          </div>
          <div
            class="p-3.5 rounded-xl bg-tt-surface-2 border border-tt-separator font-mono text-xs max-h-48 overflow-y-auto leading-relaxed text-tt-text select-text whitespace-pre-wrap"
          >
            {staged.preview_text}
          </div>
        </div>

        <!-- Action Row -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-tt-separator/50">
          <AppButton
            tonal
            rounded
            class="text-xs font-semibold cursor-pointer"
            onclick={cancelImport}
          >
            {t('common.cancel')}
          </AppButton>
          <AppButton
            rounded
            class="bg-tt-primary text-white text-xs font-semibold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            disabled={isCommitting || !baseTitle.trim()}
            onclick={commitImport}
          >
            <PhCheckCircle class="w-3.5 h-3.5" />
            <span>{isCommitting ? t('common.loading') : t('customText.finishImport')}</span>
          </AppButton>
        </div>
      </AppCard>
    </div>
  {/if}
</AppPage>
