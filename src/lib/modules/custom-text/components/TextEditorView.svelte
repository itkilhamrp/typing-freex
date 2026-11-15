<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { customTextStore } from '../stores/custom-text.store.svelte';
  import { typingStore } from '#lib/modules/modes/classic/stores/typing.store.svelte.js';
  import { i18n } from '#lib/shared/stores/i18n.svelte.js';
  import { AppPage, AppConfirmDialog } from '#lib/shared/ui/index.js';
  import {
    analyzeText,
    smartNormalizeText,
    groupIssues,
    type GroupedIssueSummary,
  } from '../logic/text-analysis';
  import type { RevisionDiffResult } from '@/core/ipc';
  import { goto } from '$app/navigation';

  import EditorToolbar from './EditorToolbar.svelte';
  import EditorTextarea from './EditorTextarea.svelte';
  import EditorSidebar from './EditorSidebar.svelte';
  import DiffInspector from './DiffInspector.svelte';

  interface Props {
    id?: string | null;
  }

  let { id = null }: Props = $props();

  const t = i18n.t;

  async function navigate(path: string) {
    try {
      await goto(path);
    } catch {
      window.location.href = path;
    }
  }

  let isEditing = $derived(!!id);

  let title = $state(t('customText.untitledTitle'));
  let body = $state('');
  let language = $state('en');
  let baseRevision = $state(1);

  let isSaving = $state(false);
  let saveError = $state<string | null>(null);
  let saveSuccessNotice = $state<string | null>(null);
  let noticeTimer: ReturnType<typeof setTimeout> | null = null;
  let showRevisions = $state(false);
  let loadedTextId: string | null | undefined = undefined;

  // Git Diff Inspector State
  let isDiffModalOpen = $state(false);
  let activeDiff = $state<RevisionDiffResult | null>(null);
  let isDiffLoading = $state(false);

  // Restore Confirmation State
  let restoreConfirmOpen = $state(false);
  let revisionToRestore = $state<number | null>(null);

  // Reactive text analysis via isolated logic
  let analysis = $derived(analyzeText(body, 50));
  let charCount = $derived(analysis.charCount);
  let wordCount = $derived(analysis.wordCount);
  let lineCount = $derived(analysis.lineCount);
  let estimatedDurationSecs = $derived(analysis.estimatedDurationSeconds);
  let longestWord = $derived(analysis.longestWordSample);
  let groupedIssues = $derived<GroupedIssueSummary[]>(groupIssues(analysis.issues));
  let totalIssuesCount = $derived(analysis.issues.length);

  function fixAllIssues() {
    if (!body) return;
    body = smartNormalizeText(body);
  }

  function showNotice(msg: string) {
    saveSuccessNotice = msg;
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      saveSuccessNotice = null;
      noticeTimer = null;
    }, 2500);
  }

  async function save(): Promise<boolean> {
    if (!title.trim()) {
      saveError = t('customText.errorTitleEmpty');
      return false;
    }
    if (!body.trim()) {
      saveError = t('customText.errorBodyEmpty');
      return false;
    }

    isSaving = true;
    saveError = null;

    try {
      if (isEditing && id) {
        const updated = await customTextStore.updateText(
          id,
          title.trim(),
          body,
          baseRevision
        );
        baseRevision = updated.revision;
        await customTextStore.loadRevisions(id);
        showNotice(t('customText.save'));
      } else {
        const created = await customTextStore.createText(
          title.trim(),
          body,
          language
        );
        await navigate(`/custom-text/edit/${created.id}`);
      }
      return true;
    } catch (err: unknown) {
      console.error('Save failed:', err);
      saveError = err instanceof Error ? err.message : String(err);
      return false;
    } finally {
      isSaving = false;
    }
  }

  async function saveAndPractice() {
    const ok = await save();
    if (ok) {
      typingStore.setCustomPractice(body, title, id);
      await navigate('/');
    }
  }

  function requestRestore(revisionNumber: number) {
    revisionToRestore = revisionNumber;
    restoreConfirmOpen = true;
  }

  async function handleConfirmRestore() {
    if (revisionToRestore === null) return;
    restoreConfirmOpen = false;
    await restoreRev(revisionToRestore);
    revisionToRestore = null;
  }

  function cancelRestore() {
    restoreConfirmOpen = false;
    revisionToRestore = null;
  }

  async function restoreRev(revisionNumber: number) {
    if (!id) return;
    try {
      const restored = await customTextStore.restoreRevision(id, revisionNumber);
      if (restored) {
        body = restored.body;
        baseRevision = restored.revision;
        showRevisions = false;
        await customTextStore.loadRevisions(id);
        showNotice(t('customText.restoredNotice', { rev: revisionNumber }));
      }
    } catch (err: unknown) {
      console.error('Failed to restore revision:', err);
      saveError = err instanceof Error ? err.message : String(err);
    }
  }

  async function openDiffModal(targetRev: number) {
    if (!id) return;
    isDiffLoading = true;
    isDiffModalOpen = true;
    activeDiff = null;
    try {
      const diff = await customTextStore.loadRevisionDiff(id, targetRev);
      activeDiff = diff;
    } catch (err) {
      console.error('Failed to load revision diff:', err);
    } finally {
      isDiffLoading = false;
    }
  }

  function restoreFromDiff(revisionNumber: number) {
    isDiffModalOpen = false;
    requestRestore(revisionNumber);
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      save();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      saveAndPractice();
    }
  }

  async function loadEditorForId(targetId: string | null) {
    if (loadedTextId === targetId) return;
    loadedTextId = targetId;
    if (targetId) {
      try {
        void customTextStore.loadRevisions(targetId);
        const text = await customTextStore.loadText(targetId);
        if (text && loadedTextId === targetId) {
          title = text.title;
          body = text.body;
          language = text.language;
          baseRevision = text.revision;
        }
      } catch (err: unknown) {
        console.error('Failed to load custom text:', err);
        saveError = err instanceof Error ? err.message : String(err);
      }
    } else {
      title = t('customText.untitledTitle');
      body = '';
      language = 'en';
      baseRevision = 1;
    }
  }

  $effect(() => {
    void loadEditorForId(id);
  });

  onMount(() => {
    void loadEditorForId(id);
    window.addEventListener('keydown', handleGlobalKeydown);
  });

  onDestroy(() => {
    if (noticeTimer) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleGlobalKeydown);
    }
  });
</script>

<AppPage maxWidth="max-w-5xl" class="select-none animate-fade-in space-y-6 [contain:layout_style]">
  <!-- Top Action Toolbar -->
  <EditorToolbar
    {isEditing}
    {baseRevision}
    {isSaving}
    canSave={body.trim().length > 0}
    {showRevisions}
    revisionCount={customTextStore.revisions.length}
    {saveError}
    {saveSuccessNotice}
    onsave={save}
    onsaveAndPractice={saveAndPractice}
    ontoggleRevisions={() => (showRevisions = !showRevisions)}
    onback={() => navigate('/custom-text')}
    ondismissError={() => (saveError = null)}
  />

  <!-- Title Input Surface -->
  <div>
    <label
      class="block text-2xs font-bold uppercase tracking-wider text-tt-text-secondary mb-1.5"
      for="custom-text-title-input"
    >
      {t('customText.titleLabel')}
    </label>
    <input
      id="custom-text-title-input"
      bind:value={title}
      type="text"
      maxlength={100}
      placeholder={t('customText.titlePlaceholder')}
      class="w-full px-4 py-2.5 rounded-xl bg-tt-surface border border-tt-separator text-sm font-medium focus:outline-none focus:border-tt-primary focus:ring-2 focus:ring-tt-primary/15 transition-all text-tt-text"
    />
  </div>

  <!-- Main Workspace: Textarea Area (Left 3/4) & Diagnostics / History Sidebar (Right 1/4) -->
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
    <div class="lg:col-span-3">
      <EditorTextarea
        bind:body
        {lineCount}
        {charCount}
        maxChars={50000}
      />
    </div>

    <div class="lg:col-span-1">
      <EditorSidebar
        {wordCount}
        {charCount}
        {lineCount}
        estimatedDuration={estimatedDurationSecs}
        {longestWord}
        {groupedIssues}
        {totalIssuesCount}
        {showRevisions}
        revisions={customTextStore.revisions}
        activeRevision={baseRevision}
        onfixIssues={fixAllIssues}
        onopenDiff={openDiffModal}
        onrestore={requestRestore}
        oncloseRevisions={() => (showRevisions = false)}
      />
    </div>
  </div>

  <!-- Git Diff Inspector Modal (Word-Level Diff) -->
  <DiffInspector
    opened={isDiffModalOpen}
    diff={activeDiff}
    isLoading={isDiffLoading}
    onclose={() => (isDiffModalOpen = false)}
    onrestore={restoreFromDiff}
  />

  <!-- Restore Revision Confirmation Dialog -->
  <AppConfirmDialog
    opened={restoreConfirmOpen}
    title={t('customText.restoreConfirmTitle')}
    message={t('customText.restoreConfirmMessage', { rev: revisionToRestore ?? 0 })}
    danger={false}
    confirmText={t('customText.restoreConfirmAction')}
    cancelText={t('common.cancel')}
    onconfirm={handleConfirmRestore}
    oncancel={cancelRestore}
  />
</AppPage>
