<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import { resultApi, type ResultSummaryDto } from "@/core/ipc";
  import {
    ClockCounterClockwise,
    Trash,
    ArrowRight,
    Keyboard,
    Calendar,
    HardDrive,
    Gauge,
    Target,
    SlidersHorizontal,
  } from "phosphor-svelte";
  import {
    AppPage,
    AppCard,
    AppSelect,
    AppConfirmDialog,
    AppButton,
    AppSegmented,
    AppSegmentedButton,
    AppPagination,
    AppToggle,
    AppRange,
    AppDialog,
  } from "#lib/shared/ui/index.js";
  import { createConfirmDialog } from "#lib/shared/actions/confirm-dialog.svelte.js";
  import { useSettingsStore } from "#lib/modules/settings/stores/settings.store.svelte.js";
  import { toUnit } from "@/core/typing-engine";
  import { formatModeBadge } from "#lib/shared/utils/index.js";
  import { getLanguageDisplayName } from "@/core/text-tools";

  const { t } = useI18n();
  const settingsStore = useSettingsStore();

  let results = $state.raw<ResultSummaryDto[]>([]);
  let isLoading = $state(true);
  let loadError = $state<string | null>(null);
  let loadSeq = 0;
  let selectedMode = $state<string>("all");
  let sortBy = $state<string>("newest");

  const deleteConfirm = createConfirmDialog<string>();

  const speedUnit = $derived(settingsStore.speedUnit);
  let filterEnabled = $derived(settingsStore.historyFilterEnabled);
  let minSpeed = $derived(settingsStore.historyFilterMinSpeed);
  let minAccuracy = $derived(settingsStore.historyFilterMinAccuracy);

  const maxSpeedSlider = $derived(speedUnit === "cpm" ? 1500 : 300);
  const speedStep = $derived(speedUnit === "cpm" ? 5 : 1);
  const currentSpeedDisplay = $derived(
    speedUnit === "cpm" ? Math.round(minSpeed * 5) : Math.round(minSpeed)
  );

  function handleSpeedChange(val: number) {
    const wpm = speedUnit === "cpm" ? Math.round(val / 5) : Math.round(val);
    settingsStore.historyFilterMinSpeed = wpm;
  }

  function handleAccuracyChange(val: number) {
    settingsStore.historyFilterMinAccuracy = Math.round(val);
  }

  function handleToggleFilter(e: Event) {
    const target = e.target as HTMLInputElement;
    settingsStore.historyFilterEnabled = target.checked;
  }

  let isFilterModalOpen = $state(false);

  const speedPresets = $derived(
    speedUnit === "cpm"
      ? [
          { label: t("history.presetOff"), value: 0 },
          { label: "150 CPM", value: 30 },
          { label: "250 CPM", value: 50 },
          { label: "350 CPM", value: 70 },
          { label: "500 CPM", value: 100 },
        ]
      : [
          { label: t("history.presetOff"), value: 0 },
          { label: "30 WPM", value: 30 },
          { label: "50 WPM", value: 50 },
          { label: "70 WPM", value: 70 },
          { label: "100 WPM", value: 100 },
        ]
  );

  const accuracyPresets = $derived([
    { label: t("history.presetOff"), value: 0 },
    { label: "75%", value: 75 },
    { label: "85%", value: 85 },
    { label: "90%", value: 90 },
    { label: "95%", value: 95 },
  ]);

  function getDisplaySpeed(wpm: number): number {
    return Math.round(toUnit(wpm, speedUnit));
  }

  const modeOptions = $derived([
    { value: "all", label: t("history.allModes") },
    { value: "time", label: t("arena.modeTime") },
    { value: "words", label: t("arena.modeWords") },
    { value: "quote", label: t("arena.modeQuote") },
    { value: "tech", label: t("arena.modeTech") },
    { value: "custom", label: t("arena.modeCustom") },
  ]);

  const sortOptions = $derived([
    { value: "newest", label: t("history.sortNewest") },
    { value: "oldest", label: t("history.sortOldest") },
    { value: "speed", label: t("history.sortSpeed") },
    { value: "accuracy", label: t("history.sortAccuracy") },
  ]);

  const sortedResults = $derived.by(() => {
    const list = [...results];
    if (sortBy === "newest") {
      return list.sort((a, b) =>
        b.completed_at < a.completed_at ? -1 : b.completed_at > a.completed_at ? 1 : 0
      );
    } else if (sortBy === "oldest") {
      return list.sort((a, b) =>
        a.completed_at < b.completed_at ? -1 : a.completed_at > b.completed_at ? 1 : 0
      );
    } else if (sortBy === "speed") {
      return list.sort((a, b) => b.wpm - a.wpm);
    } else if (sortBy === "accuracy") {
      return list.sort((a, b) => b.accuracy - a.accuracy);
    }
    return list;
  });

  let currentPage = $state(1);
  let pageSize = $state(10);

  const maxPage = $derived(Math.max(1, Math.ceil(sortedResults.length / pageSize)));

  const paginatedResults = $derived.by(() => {
    const page = Math.min(currentPage, maxPage);
    const start = (page - 1) * pageSize;
    return sortedResults.slice(start, start + pageSize);
  });

  async function loadHistory() {
    const seq = ++loadSeq;
    isLoading = true;
    loadError = null;
    try {
      const filter = selectedMode === "all" ? undefined : selectedMode;
      const fetched = await resultApi.list(100, 0, filter);
      if (seq !== loadSeq) return;
      results = fetched;
    } catch (err) {
      if (seq !== loadSeq) return;
      console.warn("Failed to load results history:", err);
      loadError = err instanceof Error ? err.message : String(err);
      results = [];
    } finally {
      if (seq === loadSeq) {
        isLoading = false;
      }
    }
  }

  function requestDelete(uuid: string, event: Event) {
    event.stopPropagation();
    deleteConfirm.open(uuid);
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm.item) return;
    const uuid = deleteConfirm.item;
    try {
      await resultApi.delete([uuid]);
      results = results.filter((r) => r.uuid !== uuid);
      if (currentPage > maxPage) {
        currentPage = maxPage;
      }
    } catch (err) {
      console.error("Failed to delete result:", err);
    } finally {
      deleteConfirm.close();
    }
  }

  function formatDate(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  }

  async function goToArena() {
    try {
      await goto("/");
    } catch {
      window.location.href = "/";
    }
  }

  onMount(() => {
    void settingsStore.loadSettings();
    loadHistory();
  });
</script>

<AppPage maxWidth="max-w-5xl" class="select-none animate-fade-in">
  <!-- Header -->
  <div
    class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-tt-separator/50 pb-5"
  >
    <div class="min-w-0">
      <h1
        class="text-2xl font-bold tracking-tight flex items-center gap-2.5 text-tt-text"
      >
        <ClockCounterClockwise class="w-6 h-6 text-tt-primary shrink-0" />
        {t("nav.history")}
      </h1>
      <p class="text-xs text-tt-text-secondary/90 mt-1 font-normal">
        {t("history.subtitle")}
      </p>
    </div>

    <!-- Controls: Mode filter & (Sort + Save Filter column) -->
    <div class="flex flex-wrap sm:flex-nowrap items-center gap-3.5 shrink-0">
      <!-- Desktop Mode Segmented Buttons -->
      <AppSegmented
        rounded
        strong
        class="hidden sm:flex sm:w-[520px] sm:shrink-0"
      >
        {#each modeOptions as opt (opt.value)}
          <AppSegmentedButton
            active={selectedMode === opt.value}
            class="whitespace-nowrap"
            onclick={() => {
              selectedMode = opt.value;
              currentPage = 1;
              loadHistory();
            }}
          >
            {opt.label}
          </AppSegmentedButton>
        {/each}
      </AppSegmented>

      <!-- Mobile Mode Dropdown -->
      <div class="sm:hidden w-36 shrink-0">
        <AppSelect
          bind:modelValue={selectedMode}
          options={modeOptions}
          size="sm"
          class="w-full"
          onchange={() => {
            currentPage = 1;
            loadHistory();
          }}
        />
      </div>

      <!-- Sort & Save Filter Stack: Save Filter neatly placed right below Sort -->
      <div class="flex flex-col items-end gap-1.5 shrink-0">
        <div class="flex items-center gap-2">
          <span
            class="text-xs text-tt-text-secondary font-medium shrink-0 font-ios"
          >{t("history.sort")}</span>
          <AppSelect
            bind:modelValue={sortBy}
            options={sortOptions}
            size="sm"
            class="!w-40 sm:!w-44 shrink-0"
            onchange={() => {
              currentPage = 1;
            }}
          />
        </div>

        <AppButton
          variant={filterEnabled ? "tonal" : "outline"}
          size="small"
          class="h-7 gap-1.5 shrink-0 px-2.5 cursor-pointer text-[11px] {filterEnabled ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-tt-text-secondary hover:text-tt-text border-tt-separator/60'}"
          onclick={() => (isFilterModalOpen = true)}
          title={t("history.filterButtonTitle")}
        >
          <SlidersHorizontal class="w-3 h-3" />
          <span>{t("history.filterButton")}</span>
          {#if filterEnabled}
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
          {/if}
        </AppButton>
      </div>
    </div>
  </div>

  <!-- Active Filter Status Notice (Pill ber-kontras tajam & jelas saat filter aktif) -->
  {#if filterEnabled}
    <div
      class="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/25 text-xs animate-fade-in"
    >
      <div class="flex items-center gap-2 text-tt-text font-medium truncate">
        <HardDrive class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span class="truncate">
          {t("history.activeFilterNotice", {
            speed: `${currentSpeedDisplay} ${speedUnit.toUpperCase()}`,
            acc: `${minAccuracy}%`,
          })}
        </span>
      </div>
      <button
        type="button"
        class="text-xs font-semibold text-tt-primary hover:text-tt-primary/80 transition-colors cursor-pointer shrink-0 ml-3"
        onclick={() => (isFilterModalOpen = true)}
      >
        {t("history.configureFilter")}
      </button>
    </div>
  {/if}

  {#if loadError}
    <div
      class="p-3.5 rounded-xl bg-status-red/10 border border-status-red/30 text-status-red text-xs font-semibold flex items-center justify-between animate-fade-in"
    >
      <span>{t("common.error", { message: loadError })}</span>
    </div>
  {/if}

  <!-- Loading State -->
  {#if isLoading}
    <div class="text-center py-16 text-tt-text-secondary/90 font-medium text-sm">
      <div
        class="inline-block w-6 h-6 border-2 border-tt-primary border-t-transparent rounded-full animate-spin mb-2"
      ></div>
      <div>{t("history.loadingRecords")}</div>
    </div>
  {:else if sortedResults.length === 0}
    <!-- Empty State -->
    <AppCard class="text-center py-16 px-4 space-y-4" padding="p-8">
      <div
        class="w-12 h-12 mx-auto rounded-2xl bg-tt-primary/10 flex items-center justify-center text-tt-primary"
      >
        <Keyboard class="w-6 h-6" />
      </div>
      <div>
        <h3 class="text-base font-bold text-tt-text">{t("history.noHistoryTitle")}</h3>
        <p class="text-xs text-tt-text-secondary/90 mt-1 max-w-sm mx-auto">
          {t("history.noHistoryDesc")}
        </p>
      </div>
      <div>
        <AppButton
          rounded
          class="bg-tt-primary text-white text-xs font-semibold px-4 py-2 inline-flex items-center gap-2 cursor-pointer shadow-xs hover:opacity-95"
          onclick={goToArena}
        >
          {t("history.startTyping")} <ArrowRight class="w-4 h-4" />
        </AppButton>
      </div>
    </AppCard>
  {:else}
    <!-- Results List -->
    <div class="flex flex-col gap-3">
      {#each paginatedResults as item (item.uuid)}
        <AppCard
          padding="p-4 sm:p-5"
          class="transition-transform duration-150 hover:shadow-md hover:border-black/15 dark:hover:border-white/20 hover:-translate-y-0.5"
          style="contain: layout style; content-visibility: auto; contain-intrinsic-size: 0 96px; transform: translateZ(0);"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <!-- Left: Speed & Mode Info -->
            <div class="flex items-center gap-4 sm:gap-6">
              <div
                class="flex flex-col items-center justify-center min-w-[72px] px-3 py-2 rounded-xl bg-tt-primary/10 text-tt-primary"
              >
                <span
                  class="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums"
                >
                  {getDisplaySpeed(item.wpm)}
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider"
                  >{speedUnit.toUpperCase()}</span
                >
              </div>

              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-tt-surface-2 text-tt-text border border-tt-separator/40"
                  >
                    {formatModeBadge(item.mode, item.mode_variant, t)}
                  </span>
                  {#if item.difficulty === "expert"}
                    <span
                      class="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold font-mono uppercase tracking-wider bg-amber-500/12 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                    >
                      {t("history.expert")}
                    </span>
                  {:else if item.difficulty === "master"}
                    <span
                      class="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold font-mono uppercase tracking-wider bg-red-400/12 text-red-500 dark:text-red-400 border border-red-400/25"
                    >
                      {t("history.master")}
                    </span>
                  {/if}
                  {#if item.mode !== 'custom' && item.language}
                    <span
                      class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-tt-surface-2 text-tt-text-secondary border border-tt-separator/40"
                    >
                      {getLanguageDisplayName(item.language)}
                    </span>
                  {/if}
                  <span
                    class="text-xs text-tt-text-secondary flex items-center gap-1 font-mono"
                  >
                    <Calendar class="w-3.5 h-3.5" />
                    {formatDate(item.completed_at)}
                  </span>
                </div>
                <div
                  class="text-xs text-tt-text-secondary/85 flex items-center gap-4 tabular-nums"
                >
                  <span
                    >{t("history.raw")}: <strong class="text-tt-text font-semibold"
                      >{getDisplaySpeed(item.raw_wpm)}</strong
                    ></span
                  >
                  <span
                    >{t("history.acc")}: <strong class="text-tt-text font-semibold"
                      >{item.accuracy.toFixed(1)}%</strong
                    ></span
                  >
                  {#if item.consistency !== null && item.consistency !== undefined}
                    <span
                      >{t("history.cons")}: <strong class="text-tt-text font-semibold"
                        >{item.consistency.toFixed(1)}%</strong
                      ></span
                    >
                  {/if}
                  <span
                    >{t("history.duration")}: <strong class="text-tt-text font-semibold"
                      >{item.duration_seconds.toFixed(0)}s</strong
                    ></span
                  >
                </div>
              </div>
            </div>

            <!-- Right: Actions -->
            <div
              class="flex items-center justify-end gap-2 border-t sm:border-t-0 border-tt-separator/40 pt-2 sm:pt-0"
            >
              <button
                class="p-2 rounded-xl text-tt-text-secondary hover:text-ios-red hover:bg-ios-red/10 transition-colors cursor-pointer"
                title={t("history.deleteRecordTitle")}
                aria-label={t("history.deleteRecordTitle")}
                onclick={(e) => requestDelete(item.uuid, e)}
              >
                <Trash class="w-4 h-4" />
              </button>
            </div>
          </div>
        </AppCard>
      {/each}

      <!-- AppPagination Control -->
      {#if sortedResults.length > 0}
        <AppPagination
          bind:currentPage
          totalItems={sortedResults.length}
          {pageSize}
        />
      {/if}
    </div>
  {/if}

  <!-- Delete Confirmation Dialog -->
  <AppConfirmDialog
    opened={deleteConfirm.isOpen}
    title={t("common.delete")}
    message={t("analytics.deleteConfirm")}
    onconfirm={handleConfirmDelete}
    oncancel={deleteConfirm.close}
  />

  <!-- History Save Filter Modal Dialog -->
  <AppDialog
    opened={isFilterModalOpen}
    title={t("history.filterTitle")}
    onclose={() => (isFilterModalOpen = false)}
    maxWidth="max-w-lg"
  >
    <div class="py-1 space-y-4 text-left select-none">
      <!-- Master Toggle Row -->
      <div
        class="flex items-center justify-between gap-4 p-3 rounded-xl bg-tt-surface-2 border border-tt-separator/50"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-tt-text">
              {t("history.filterEnabled")}
            </span>
            <span
              class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium {filterEnabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-tt-surface-3 text-tt-text-secondary'}"
            >
              {filterEnabled ? t("history.filterStatusActive") : t("history.filterStatusOff")}
            </span>
          </div>
          <p class="text-xs text-tt-text-secondary mt-0.5 leading-relaxed">
            {t("history.filterDescription")}
          </p>
        </div>
        <div class="shrink-0">
          <AppToggle
            checked={filterEnabled}
            onchange={handleToggleFilter}
            aria-label={t("history.filterEnabled")}
          />
        </div>
      </div>

      <!-- Settings Sliders & Quick Presets -->
      <div
        class="space-y-3.5 transition-opacity duration-150 {filterEnabled
          ? 'opacity-100'
          : 'opacity-40 pointer-events-none'}"
      >
        <!-- Min Speed Control -->
        <div
          class="p-3.5 rounded-xl bg-tt-surface-2 border border-tt-separator/50 space-y-2.5"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-tt-text flex items-center gap-1.5">
              <Gauge class="w-4 h-4 text-tt-primary" />
              {t("history.minSpeed")}
            </span>
            <span
              class="font-mono font-semibold text-tt-primary bg-tt-primary/10 px-2 py-0.5 rounded text-xs"
            >
              {currentSpeedDisplay}
              {speedUnit.toUpperCase()}
            </span>
          </div>

          <AppRange
            value={currentSpeedDisplay}
            min={0}
            max={maxSpeedSlider}
            step={speedStep}
            disabled={!filterEnabled}
            oninput={handleSpeedChange}
          />

          <!-- Quick Preset Chips -->
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            {#each speedPresets as preset (preset.value)}
              <button
                type="button"
                disabled={!filterEnabled}
                class={[
                  "px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer select-none",
                  minSpeed === preset.value
                    ? "bg-tt-primary text-white border-tt-primary shadow-xs"
                    : "bg-tt-surface-3/60 hover:bg-tt-surface-3 text-tt-text-secondary hover:text-tt-text border-tt-separator/50",
                ].join(" ")}
                onclick={() => {
                  settingsStore.historyFilterMinSpeed = preset.value;
                }}
              >
                {preset.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Min Accuracy Control -->
        <div
          class="p-3.5 rounded-xl bg-tt-surface-2 border border-tt-separator/50 space-y-2.5"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-tt-text flex items-center gap-1.5">
              <Target class="w-4 h-4 text-tt-primary" />
              {t("history.minAccuracy")}
            </span>
            <span
              class="font-mono font-semibold text-tt-primary bg-tt-primary/10 px-2 py-0.5 rounded text-xs"
            >
              {minAccuracy}%
            </span>
          </div>

          <AppRange
            value={minAccuracy}
            min={0}
            max={100}
            step={1}
            disabled={!filterEnabled}
            oninput={handleAccuracyChange}
          />

          <!-- Quick Preset Chips -->
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            {#each accuracyPresets as preset (preset.value)}
              <button
                type="button"
                disabled={!filterEnabled}
                class={[
                  "px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer select-none",
                  minAccuracy === preset.value
                    ? "bg-tt-primary text-white border-tt-primary shadow-xs"
                    : "bg-tt-surface-3/60 hover:bg-tt-surface-3 text-tt-text-secondary hover:text-tt-text border-tt-separator/50",
                ].join(" ")}
                onclick={() => {
                  settingsStore.historyFilterMinAccuracy = preset.value;
                }}
              >
                {preset.label}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Explanatory note -->
      <p class="text-[11px] text-tt-text-secondary/80 leading-relaxed px-1">
        {t("history.filterExplanation")}
      </p>
    </div>

    {#snippet buttonsSlot()}
      <div class="flex items-center justify-end p-2">
        <AppButton
          variant="primary"
          size="small"
          rounded
          class="px-5 py-2 text-xs font-semibold cursor-pointer"
          onclick={() => (isFilterModalOpen = false)}
        >
          {t("history.done")}
        </AppButton>
      </div>
    {/snippet}
  </AppDialog>
</AppPage>
