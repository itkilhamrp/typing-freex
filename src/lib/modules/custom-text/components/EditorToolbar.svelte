<script lang="ts">
  import {
    FloppyDisk as PhFloppyDisk,
    Play as PhPlay,
    Warning as PhWarning,
    ClockCounterClockwise as PhClockCounterClockwise,
    ArrowLeft as PhArrowLeft,
    CheckCircle as PhCheckCircle,
  } from 'phosphor-svelte';
  import { AppButton, AppBadge } from '#lib/shared/ui/index.js';
  import { i18n } from '#lib/shared/stores/i18n.svelte.js';

  interface Props {
    isEditing: boolean;
    baseRevision: number;
    isSaving: boolean;
    canSave: boolean;
    showRevisions: boolean;
    revisionCount: number;
    saveError: string | null;
    saveSuccessNotice: string | null;
    onsave: () => void;
    onsaveAndPractice: () => void;
    ontoggleRevisions: () => void;
    onback: () => void;
    ondismissError: () => void;
  }

  let {
    isEditing,
    baseRevision,
    isSaving,
    canSave,
    showRevisions,
    revisionCount,
    saveError,
    saveSuccessNotice,
    onsave,
    onsaveAndPractice,
    ontoggleRevisions,
    onback,
    ondismissError,
  }: Props = $props();

  const t = i18n.t;
</script>

<div class="space-y-3">
  <!-- Top Action Bar -->
  <div
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-tt-surface-2 border border-tt-separator shadow-sm"
  >
    <!-- Left: Back button & Document context -->
    <div class="flex items-center gap-3.5">
      <button
        type="button"
        class="p-2.5 rounded-xl bg-tt-surface hover:bg-tt-surface-3 border border-tt-separator text-tt-text transition-colors cursor-pointer shrink-0"
        title={t('customText.backToLibrary')}
        onclick={onback}
      >
        <PhArrowLeft class="w-4 h-4 text-tt-text-secondary" />
      </button>

      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-lg sm:text-xl font-bold text-tt-text leading-tight">
            {isEditing ? t('customText.edit') : t('customText.newText')}
          </h1>
          <AppBadge variant="primary" size="md" class="font-mono">
            #{baseRevision}
          </AppBadge>
        </div>
        <div class="text-xs text-tt-text-secondary mt-0.5">
          {t('customText.editorSubtitle')}
        </div>
      </div>
    </div>

    <!-- Right: Action Buttons Group -->
    <div class="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
      <!-- Revisions Drawer Toggle -->
      {#if isEditing}
        <AppButton
          tonal
          rounded
          inline
          class="h-10 px-3.5 font-semibold text-xs sm:text-sm whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer shrink-0 {showRevisions ? 'bg-ios-indigo/15 text-ios-indigo border-ios-indigo/30' : ''}"
          onclick={ontoggleRevisions}
        >
          <PhClockCounterClockwise class="w-4 h-4 text-ios-indigo shrink-0" />
          <span>{t('customText.revisions', { count: revisionCount })}</span>
        </AppButton>
      {/if}

      <!-- Save Button -->
      <AppButton
        tonal
        rounded
        inline
        class="h-10 px-4 font-semibold text-xs sm:text-sm whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        disabled={isSaving}
        onclick={onsave}
      >
        <PhFloppyDisk class="w-4 h-4 text-ios-blue shrink-0" />
        <span>{isSaving ? t('common.loading') : t('customText.save')}</span>
      </AppButton>

      <!-- Save & Practice Primary Action -->
      <AppButton
        rounded
        inline
        class="h-10 px-5 font-semibold text-xs sm:text-sm whitespace-nowrap flex items-center justify-center gap-2 bg-tt-primary text-white shadow-sm hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shrink-0"
        disabled={isSaving || !canSave}
        onclick={onsaveAndPractice}
      >
        <PhPlay class="w-4 h-4 fill-current shrink-0" weight="fill" />
        <span>{t('customText.saveAndPractice')}</span>
      </AppButton>
    </div>
  </div>

  <!-- Error Banner -->
  {#if saveError}
    <div
      class="p-3.5 rounded-xl bg-ios-red/10 border border-ios-red/30 text-ios-red text-xs flex items-center justify-between animate-fade-in font-semibold"
    >
      <div class="flex items-center gap-2">
        <PhWarning class="w-4 h-4 flex-shrink-0" />
        <span>{saveError}</span>
      </div>
      <button
        type="button"
        class="hover:underline cursor-pointer font-bold"
        onclick={ondismissError}
      >
        {t('common.done')}
      </button>
    </div>
  {/if}

  <!-- Success Notice -->
  {#if saveSuccessNotice}
    <div
      class="p-3 rounded-xl bg-ios-green/10 border border-ios-green/30 text-ios-green text-xs flex items-center gap-2 animate-fade-in font-semibold"
    >
      <PhCheckCircle class="w-4 h-4 flex-shrink-0" weight="bold" />
      <span>{saveSuccessNotice}</span>
    </div>
  {/if}
</div>

