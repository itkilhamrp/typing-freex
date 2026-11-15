<script lang="ts">
  import { tick } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useProfileStore } from '#lib/modules/profile/stores/profile.store.svelte.js';
  import { useDatabaseToolsController } from '#lib/modules/database/controllers/database-tools.controller.svelte.js';
  import {
    AppSearchbar,
    AppDialog,
    AppTypeConfirmDialog,
  } from '#lib/shared/ui/index.js';
  import {
    Database,
    Warning,
    CheckCircle,
    MagnifyingGlass,
  } from 'phosphor-svelte';
  import {
    playMenuClick,
    playMenuTick,
    playMenuConfirm,
    playMenuCancel,
  } from '#lib/shared/audio/menu-sfx.js';
  import type { ProfileDto } from '@/core/ipc/contracts';

  interface Props {
    opened: boolean;
    selectedUuid: string;
    onSelectUuid: (uuid: string) => void;
    onClose: () => void;
    onConfirm?: (uuid: string) => void;
    onPlay?: () => void;
  }

  let {
    opened,
    selectedUuid,
    onSelectUuid,
    onClose,
    onConfirm,
    onPlay,
  }: Props = $props();

  const { t } = useI18n();
  const profileStore = useProfileStore();
  const dbTools = useDatabaseToolsController();

  let searchQuery = $state('');
  let showSearch = $state(false);
  let rosterListRef = $state<HTMLElement | null>(null);

  // Create Profile Dialog
  let showCreateDialog = $state(false);
  let newProfileName = $state('');
  let isCreating = $state(false);

  // Delete Profile Dialog with 'RM' Type-to-Confirm
  let showDeleteDialog = $state(false);
  let profileToDelete = $state<ProfileDto | null>(null);
  let isDeleting = $state(false);

  // Import Profile Database
  let showImportDialog = $state(false);
  let fileInputRef = $state<HTMLInputElement | null>(null);

  const dateFormatter =
    typeof Intl !== 'undefined'
      ? new Intl.DateTimeFormat(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null;
  const formattedDateCache = new SvelteMap<string, string>();

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const cached = formattedDateCache.get(dateStr);
    if (cached !== undefined) return cached;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const formatted = dateFormatter
        ? dateFormatter.format(d)
        : d.toLocaleDateString();
      formattedDateCache.set(dateStr, formatted);
      return formatted;
    } catch {
      return dateStr;
    }
  }

  const filteredProfiles = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return profileStore.profiles;
    return profileStore.profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
    );
  });

  const selectedProfile = $derived.by(() => {
    return profileStore.profiles.find((p) => p.uuid === selectedUuid) || null;
  });

  function scrollToSelectedProfile(uuid: string) {
    if (!uuid) return;
    tick().then(() => {
      if (!rosterListRef) return;
      const selectedEl = rosterListRef.querySelector<HTMLElement>(
        `[data-profile-uuid="${uuid}"]`
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  // Reactively auto-scroll whenever selectedUuid changes or modal opens
  $effect(() => {
    if (opened && selectedUuid) {
      scrollToSelectedProfile(selectedUuid);
    }
  });

  function navigateModalProfile(direction: 'up' | 'down') {
    const list = filteredProfiles;
    if (!list.length) return;

    const currentIndex = list.findIndex((p) => p.uuid === selectedUuid);
    let nextIndex: number;

    if (currentIndex === -1) {
      nextIndex = direction === 'down' ? 0 : list.length - 1;
    } else if (direction === 'down') {
      nextIndex = currentIndex < list.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : list.length - 1;
    }

    const nextProfile = list[nextIndex];
    if (nextProfile) {
      playMenuTick();
      onSelectUuid(nextProfile.uuid);
    }
  }

  function handleModalKeydown(e: KeyboardEvent) {
    if (!opened) return;
    if (showCreateDialog || showDeleteDialog || showImportDialog) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      navigateModalProfile('down');
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      navigateModalProfile('up');
      return;
    }
  }

  $effect(() => {
    if (opened && typeof window !== 'undefined') {
      window.addEventListener('keydown', handleModalKeydown, true);
      return () => {
        window.removeEventListener('keydown', handleModalKeydown, true);
      };
    }
  });

  function selectProfile(uuid: string) {
    playMenuClick();
    onSelectUuid(uuid);
  }

  function handleConfirmSelection() {
    if (!selectedUuid) return;
    playMenuConfirm();
    if (onConfirm) {
      onConfirm(selectedUuid);
    } else if (onPlay) {
      onPlay();
    } else {
      onClose();
    }
  }

  function handleCancelSelection() {
    playMenuCancel();
    onClose();
  }

  async function handleCreate() {
    const name = newProfileName.trim();
    if (!name) return;
    isCreating = true;
    try {
      const created = await profileStore.createProfile(name);
      playMenuConfirm();
      onSelectUuid(created.uuid);
      newProfileName = '';
      showCreateDialog = false;
      scrollToSelectedProfile(created.uuid);
    } finally {
      isCreating = false;
    }
  }

  function openDeleteSelected() {
    if (!selectedProfile || profileStore.profiles.length <= 1) return;
    playMenuClick();
    profileToDelete = selectedProfile;
    showDeleteDialog = true;
  }

  async function handleDelete() {
    if (!profileToDelete) return;
    isDeleting = true;
    try {
      const deletedUuid = profileToDelete.uuid;
      await profileStore.deleteProfile(deletedUuid);
      showDeleteDialog = false;
      profileToDelete = null;

      if (selectedUuid === deletedUuid) {
        if (profileStore.profiles.length > 0) {
          onSelectUuid(profileStore.profiles[0]!.uuid);
        } else {
          onSelectUuid('');
        }
      }
    } finally {
      isDeleting = false;
    }
  }

  function openImport() {
    playMenuClick();
    dbTools.cancelImport();
    showImportDialog = true;
  }

  async function triggerFileInput() {
    playMenuClick();
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          title: t('mainMenu.importDatabase'),
          multiple: false,
          directory: false,
          filters: [
            {
              name: t('mainMenu.filterSqliteDatabase'),
              extensions: ['db', 'sqlite', 'sqlite3'],
            },
            {
              name: t('mainMenu.filterAllFiles'),
              extensions: ['*'],
            },
          ],
        });

        if (selected && typeof selected === 'string') {
          await dbTools.handleFileSelected(selected);
        }
        return;
      } catch (dialogErr) {
        console.warn('Native open file dialog failed, falling back to input:', dialogErr);
      }
    }

    fileInputRef?.click();
  }

  function onFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const path = (file as unknown as { path?: string }).path || file.name;
    dbTools.handleFileSelected(path);
  }

  async function handleCommitImport() {
    await dbTools.commitImport();
    if (profileStore.profiles.length > 0) {
      const latest = profileStore.profiles[profileStore.profiles.length - 1];
      if (latest) {
        onSelectUuid(latest.uuid);
      }
    }
  }

  function closeImportDialog() {
    playMenuCancel();
    dbTools.cancelImport();
    showImportDialog = false;
  }
</script>

{#if opened}
  <div
    class="fixed inset-0 z-40 flex items-center justify-center sm:justify-end p-4 sm:pr-10 md:pr-16 lg:pr-24"
    role="dialog"
    aria-modal="true"
    aria-label={t('mainMenu.selectProfileTitle')}
  >
    <!-- Dark Vignette Backdrop -->
    <div
      class="fixed inset-0 bg-black/65 transition-opacity"
      onclick={handleCancelSelection}
      role="presentation"
    ></div>

    <!-- COD 4 MW Inspired Tactical Select Profile Window -->
    <div class="cod-profile-modal relative z-10 w-full max-w-[468px] flex flex-col gap-3 select-none">
      <!-- 1. Top Tapered Banner Header: "Select Profile" -->
      <div class="cod-header-banner relative py-2 px-6 text-center">
        <div class="cod-header-line-top" aria-hidden="true"></div>
        <h2 class="text-lg sm:text-xl font-bold tracking-wide text-tt-text">
          {t('mainMenu.selectProfileTitle')}
        </h2>
        <div class="cod-header-line-bottom" aria-hidden="true"></div>
      </div>

      <!-- 2. Profile Roster Table Box ("Name" Header + Scrollable List) -->
      <div class="relative">
        <!-- Comic subtle offset shadow to tie into Spider-Verse theme -->
        <div
          class="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-xl bg-tt-text/80 pointer-events-none"
          aria-hidden="true"
        ></div>

        <div class="relative rounded-xl bg-tt-surface-elevated border-2 border-tt-text overflow-hidden flex flex-col">
          <!-- Column Header Bar: "Name" + Search Toggle -->
          <div class="px-3.5 py-2 bg-tt-surface-2 border-b border-tt-separator/80 flex items-center justify-between gap-2">
            <span class="text-xs font-bold tracking-wider uppercase text-tt-text-secondary">
              {t('mainMenu.columnName')} ({filteredProfiles.length})
            </span>

            <div class="flex items-center gap-2">
              <span class="text-[11px] font-mono text-tt-text-secondary hidden sm:inline">
                {t('mainMenu.navigateTip')}
              </span>
              <button
                type="button"
                class="p-1 rounded-md text-tt-text-secondary hover:text-tt-text hover:bg-tt-surface-3 cursor-pointer transition-colors"
                title={t('mainMenu.searchPlaceholder')}
                onclick={() => {
                  playMenuClick();
                  showSearch = !showSearch;
                }}
              >
                <MagnifyingGlass class="w-3.5 h-3.5" weight="bold" />
              </button>
            </div>
          </div>

          {#if showSearch || profileStore.profiles.length > 6}
            <div class="p-2 bg-tt-surface border-b border-tt-separator/50">
              <AppSearchbar
                bind:modelValue={searchQuery}
                placeholder={t('mainMenu.searchPlaceholder')}
                clearButton={true}
                disableButton={true}
              />
            </div>
          {/if}

          <!-- Scrollable Roster List Box (COD 4 MW full-bar highlight style) -->
          <div
            bind:this={rosterListRef}
            class="h-[220px] sm:h-[250px] overflow-y-auto divide-y divide-tt-separator/25 bg-tt-surface"
            style="contain: layout style;"
            role="listbox"
          >
            {#each filteredProfiles as profile (profile.uuid)}
              {@const isSelected = selectedUuid === profile.uuid}
              <button
                type="button"
                data-profile-uuid={profile.uuid}
                role="option"
                aria-selected={isSelected}
                class={[
                  'w-full min-h-[44px] px-4 py-2.5 flex items-center justify-between gap-3 text-left transition-colors duration-100 cursor-pointer focus:outline-none',
                  isSelected
                    ? 'bg-tt-primary text-white font-black'
                    : 'bg-transparent hover:bg-tt-surface-2/80 text-tt-text font-semibold'
                ].join(' ')}
                onclick={() => selectProfile(profile.uuid)}
                ondblclick={() => {
                  onSelectUuid(profile.uuid);
                  handleConfirmSelection();
                }}
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="text-sm sm:text-base tracking-wide truncate">
                    {profile.name}
                  </span>
                  {#if profile.is_active}
                    <span
                      class={[
                        'text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0',
                        isSelected
                          ? 'bg-white/25 text-white'
                          : 'bg-status-green text-white'
                      ].join(' ')}
                    >
                      {t('mainMenu.activeBadge')}
                    </span>
                  {/if}
                </div>

                <span
                  class={[
                    'text-[11px] font-mono shrink-0',
                    isSelected ? 'text-white/90' : 'text-tt-text-secondary'
                  ].join(' ')}
                >
                  {formatDate(profile.last_active_at)}
                </span>
              </button>
            {/each}

            {#if filteredProfiles.length === 0}
              <div class="h-full flex items-center justify-center p-6 text-center text-xs text-tt-text-secondary">
                {searchQuery ? t('mainMenu.noProfilesMatch') : t('mainMenu.noProfiles')}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- 3. Bottom Horizontal Action Strip: OK | Cancel | New | Import | Delete -->
      <div class="grid grid-cols-5 gap-2 pt-1">
        <button
          type="button"
          disabled={!selectedUuid || profileStore.isLoading}
          class="cod-action-btn min-h-[42px] px-2 py-2 rounded-lg bg-tt-primary text-white border-2 border-tt-text font-black text-xs sm:text-[13px] tracking-wide whitespace-nowrap truncate hover:brightness-110 active:scale-[0.97] transition-[transform,filter] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onclick={handleConfirmSelection}
        >
          {t('mainMenu.actionOk')}
        </button>

        <button
          type="button"
          class="cod-action-btn min-h-[42px] px-2 py-2 rounded-lg bg-tt-surface-elevated hover:bg-tt-surface-2 text-tt-text border border-tt-separator font-bold text-xs sm:text-[13px] tracking-wide whitespace-nowrap truncate active:scale-[0.97] transition-[transform,background-color] cursor-pointer"
          onclick={handleCancelSelection}
        >
          {t('mainMenu.actionCancel')}
        </button>

        <button
          type="button"
          class="cod-action-btn min-h-[42px] px-2 py-2 rounded-lg bg-tt-surface-elevated hover:bg-tt-surface-2 text-tt-text border border-tt-separator font-bold text-xs sm:text-[13px] tracking-wide whitespace-nowrap truncate active:scale-[0.97] transition-[transform,background-color] cursor-pointer"
          onclick={() => {
            playMenuClick();
            showCreateDialog = true;
          }}
        >
          {t('mainMenu.actionNew')}
        </button>

        <button
          type="button"
          class="cod-action-btn min-h-[42px] px-2 py-2 rounded-lg bg-tt-surface-elevated hover:bg-tt-surface-2 text-tt-text border border-tt-separator font-bold text-xs sm:text-[13px] tracking-wide whitespace-nowrap truncate active:scale-[0.97] transition-[transform,background-color] cursor-pointer"
          onclick={openImport}
        >
          {t('mainMenu.actionImport')}
        </button>

        <button
          type="button"
          disabled={!selectedProfile || profileStore.profiles.length <= 1}
          class="cod-action-btn min-h-[42px] px-2 py-2 rounded-lg bg-tt-surface-elevated hover:bg-status-red/15 text-status-red border border-tt-separator font-bold text-xs sm:text-[13px] tracking-wide whitespace-nowrap truncate active:scale-[0.97] transition-[transform,background-color] cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
          onclick={openDeleteSelected}
        >
          {t('mainMenu.actionDelete')}
        </button>
      </div>
    </div>
  </div>

  <!-- Create Profile Dialog -->
  <AppDialog
    opened={showCreateDialog}
    title={t('mainMenu.newProfile')}
    onbackdropClick={() => (showCreateDialog = false)}
  >
    <div class="space-y-3 py-2 text-left">
      <label for="new-profile-input" class="block text-xs font-semibold text-tt-text-secondary">
        {t('profiles.nameLabel')}
      </label>
      <input
        id="new-profile-input"
        bind:value={newProfileName}
        type="text"
        maxlength="32"
        placeholder={t('mainMenu.profilePlaceholder')}
        class="w-full px-3.5 py-2.5 rounded-xl border border-tt-separator bg-tt-surface-2 text-tt-text text-sm font-medium focus:outline-none focus:border-tt-primary transition-colors"
        onkeydown={(e) => {
          if (e.key === 'Enter') handleCreate();
        }}
      />
    </div>

    {#snippet buttonsSlot()}
      <div class="flex items-center justify-end gap-2 p-2">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-tt-surface-2 text-tt-text cursor-pointer transition-colors"
          onclick={() => (showCreateDialog = false)}
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          disabled={!newProfileName.trim() || isCreating}
          class="btn px-4 py-1.5 text-xs font-bold rounded-full bg-tt-primary text-white hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          onclick={handleCreate}
        >
          {isCreating ? t('common.loading') : t('common.save')}
        </button>
      </div>
    {/snippet}
  </AppDialog>

  <!-- Delete Confirmation with Strict 'RM' Type-to-Confirm -->
  <AppTypeConfirmDialog
    opened={showDeleteDialog}
    title={t('mainMenu.deleteTitle')}
    message={t('mainMenu.deleteMessage', { name: profileToDelete?.name ?? '', word: 'RM' })}
    confirmWord="RM"
    loading={isDeleting}
    onconfirm={handleDelete}
    oncancel={() => (showDeleteDialog = false)}
  />

  <!-- Import Profile Database Dialog -->
  <AppDialog
    opened={showImportDialog}
    title={t('mainMenu.importDatabase')}
    onbackdropClick={closeImportDialog}
  >
    <div class="py-2 space-y-4 text-left">
      <input
        bind:this={fileInputRef}
        type="file"
        accept=".db,.sqlite,.sqlite3"
        class="hidden"
        onchange={onFileChange}
      />

      {#if !dbTools.stagedSummary}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="border-2 border-dashed border-tt-separator hover:border-black/30 dark:hover:border-white/30 rounded-2xl p-6 text-center transition-colors cursor-pointer bg-tt-surface-2/40 space-y-2"
          onclick={triggerFileInput}
        >
          <Database class="w-8 h-8 text-tt-primary mx-auto opacity-70" />
          <div class="text-xs font-semibold text-tt-text">
            {t('dataTools.selectBackupFile')}
          </div>
          <div class="text-[11px] text-tt-text-secondary">
            {t('mainMenu.importSupportsExt')}
          </div>
        </div>
      {:else}
        <div class="p-4 rounded-xl bg-tt-surface-2 border border-tt-separator space-y-3">
          <div class="flex items-center justify-between border-b border-tt-separator pb-2 text-xs font-semibold">
            <span>{t('dataTools.readyToImport')}</span>
            <span class="px-2 py-0.5 rounded text-[10px] bg-status-green text-white uppercase font-bold">
              {t('mainMenu.importValidated')}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-2 rounded-lg bg-tt-surface border border-tt-separator/60">
              <div class="text-[10px] text-tt-text-secondary uppercase font-bold">{t('mainMenu.importOriginalProfile')}</div>
              <div class="font-bold truncate text-tt-text">{dbTools.stagedSummary.profile_name}</div>
            </div>
            <div class="p-2 rounded-lg bg-tt-surface border border-tt-separator/60">
              <div class="text-[10px] text-tt-text-secondary uppercase font-bold">{t('dataTools.totalTests')}</div>
              <div class="font-bold font-mono text-tt-text">{dbTools.stagedSummary.test_count}</div>
            </div>
          </div>

          {#if dbTools.stagedSummary.warnings.length > 0}
            <div class="p-2 rounded-lg bg-tt-primary/10 border border-tt-primary/20 text-tt-primary text-xs space-y-0.5">
              <div class="font-bold flex items-center gap-1 text-[11px]">
                <Warning class="w-3 h-3" /> {t('mainMenu.importWarningsLabel')}
              </div>
              {#each dbTools.stagedSummary.warnings as w, idx (idx)}
                <div class="pl-3 text-[10px]">
                  • {w}
                </div>
              {/each}
            </div>
          {/if}

          <div class="space-y-1 pt-1">
            <label for="import-display-name" class="text-xs font-semibold text-tt-text">
              {t('dataTools.profileName')}
            </label>
            <input
              id="import-display-name"
              bind:value={dbTools.importDisplayName}
              type="text"
              maxlength="32"
              class="w-full px-3 py-2 rounded-xl bg-tt-surface border border-tt-separator text-xs focus:outline-none focus:border-tt-primary transition-colors text-tt-text font-medium"
              placeholder={t('dataTools.profileNamePlaceholder')}
            />
          </div>
        </div>
      {/if}

      {#if dbTools.importError}
        <div class="text-xs text-status-red font-medium">
          {dbTools.importError}
        </div>
      {/if}
      {#if dbTools.importSuccess}
        <div class="text-xs text-status-green font-medium flex items-center gap-1.5">
          <CheckCircle class="w-4 h-4" /> {dbTools.importSuccess}
        </div>
      {/if}
    </div>

    {#snippet buttonsSlot()}
      <div class="flex items-center justify-end gap-2 p-2">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-tt-surface-2 text-tt-text cursor-pointer transition-colors"
          onclick={closeImportDialog}
        >
          {dbTools.stagedSummary ? t('dataTools.cancelImport') : t('common.close')}
        </button>
        {#if dbTools.stagedSummary}
          <button
            type="button"
            disabled={dbTools.isImporting || !dbTools.importDisplayName.trim()}
            class="btn px-4 py-1.5 text-xs font-bold rounded-full bg-tt-primary text-white hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            onclick={handleCommitImport}
          >
            {dbTools.isImporting ? t('common.loading') : t('dataTools.commitImport')}
          </button>
        {/if}
      </div>
    {/snippet}
  </AppDialog>
{/if}

<style>
  .cod-profile-modal {
    contain: layout style;
  }

  .cod-header-banner {
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--tt-surface-elevated) 25%,
      var(--tt-surface-elevated) 75%,
      transparent 100%
    );
  }

  .cod-header-line-top,
  .cod-header-line-bottom {
    height: 1.5px;
    width: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--tt-primary) 30%,
      var(--color-status-cyan) 50%,
      var(--tt-primary) 70%,
      transparent 100%
    );
  }

  .cod-header-line-top {
    margin-bottom: 6px;
  }

  .cod-header-line-bottom {
    margin-top: 6px;
  }

  @media (prefers-reduced-motion: no-preference) {
    .cod-profile-modal {
      animation: cod-modal-enter 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
  }

  @keyframes cod-modal-enter {
    from {
      opacity: 0;
      transform: scale(0.96) translate3d(0, 8px, 0);
    }
    to {
      opacity: 1;
      transform: scale(1) translate3d(0, 0, 0);
    }
  }
</style>
