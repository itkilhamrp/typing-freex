<script lang="ts">
  import { onMount } from "svelte";
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import { useProfileStore } from "../stores/profile.store.svelte";
  import { useAchievementStore } from "../stores/achievement.store.svelte";
  import {
    AppPage,
    AppCard,
    AppButton,
    AppDialog,
  } from "#lib/shared/ui/index.js";
  import {
    User,
    PencilSimple,
    CalendarBlank,
    Clock,
    Info,
    Trophy,
    Medal,
    Sparkle,
    CaretRight,
  } from "phosphor-svelte";
  import TrophyShowcase from "./TrophyShowcase.svelte";

  const { t } = useI18n();
  const profileStore = useProfileStore();
  const achievementStore = useAchievementStore();

  let showRenameDialog = $state(false);
  let renameValue = $state("");
  let renameError = $state<string | null>(null);
  let isRenaming = $state(false);

  onMount(() => {
    profileStore.loadProfiles();
    if (!achievementStore.isLoaded) {
      achievementStore.loadAll();
    }
  });

  const activeProfile = $derived(profileStore.activeProfile);

  const profileInitial = $derived(
    activeProfile?.name?.trim()?.charAt(0)?.toUpperCase() || "",
  );

  const achievementItems = $derived(
    achievementStore.items.filter(
      (item) => item.definition.category === "achievement",
    ),
  );
  const advancementItems = $derived(
    achievementStore.items.filter(
      (item) => item.definition.category === "advancement",
    ),
  );

  const achievementsUnlocked = $derived(
    achievementItems.reduce((acc, i) => acc + i.currentTier, 0),
  );
  const achievementsTotal = $derived(
    achievementItems.reduce((acc, i) => acc + i.definition.tiers.length, 0),
  );
  const achievementsPercent = $derived(
    achievementsTotal > 0
      ? Math.round((achievementsUnlocked / achievementsTotal) * 100)
      : 0,
  );

  const advancementsUnlocked = $derived(
    advancementItems.filter((i) => i.isUnlocked).length,
  );
  const advancementsTotal = $derived(advancementItems.length);
  const advancementsPercent = $derived(
    advancementsTotal > 0
      ? Math.round((advancementsUnlocked / advancementsTotal) * 100)
      : 0,
  );

  const showcaseFilledCount = $derived(
    achievementStore.showcaseSlots.filter((s) => s.item_id !== null).length,
  );
  const galleryPercent = $derived(
    achievementStore.totalCount > 0
      ? Math.round(
          (achievementStore.unlockedCount / achievementStore.totalCount) * 100,
        )
      : 0,
  );

  const trimmedRenameLength = $derived(renameValue.trim().length);
  const isRenameValid = $derived(
    trimmedRenameLength > 0 &&
      trimmedRenameLength <= 32 &&
      renameValue.trim() !== activeProfile?.name,
  );

  function formatDate(dateStr?: string): string {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  function openRename() {
    if (!activeProfile) return;
    renameValue = activeProfile.name;
    renameError = null;
    showRenameDialog = true;
  }

  async function handleRename(e?: Event) {
    if (e) e.preventDefault();
    const name = renameValue.trim();
    if (!name || !activeProfile || isRenaming) return;
    isRenaming = true;
    renameError = null;
    try {
      await profileStore.renameProfile(activeProfile.uuid, name);
      showRenameDialog = false;
    } catch (err: unknown) {
      renameError = err instanceof Error ? err.message : String(err);
    } finally {
      isRenaming = false;
    }
  }
</script>

<AppPage
  maxWidth="max-w-4xl"
  class="select-none space-y-6 animate-fade-in pb-12"
>
  <!-- Clean Page Header -->
  <header class="border-b border-tt-separator/60 pb-5">
    <h1 class="text-2xl font-bold tracking-tight text-tt-text leading-tight">
      {t("profiles.title")}
    </h1>
    <p class="text-sm text-tt-text-secondary mt-1 leading-relaxed">
      {t("profiles.subtitle")}
    </p>
  </header>

  {#if activeProfile}
    <!-- Active Profile Card (Clean Identity + Created & Last Active) -->
    <section aria-labelledby="active-profile-heading">
      <AppCard
        padding="p-5 sm:p-6"
        class="rounded-2xl border border-tt-separator/40 dark:border-white/5 bg-tt-surface shadow-2xs space-y-5"
      >
        <!-- Identity Row -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4 min-w-0 flex-1">
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-tt-surface-2 border border-tt-separator/40 text-tt-text font-mono font-bold text-lg select-none"
              aria-hidden="true"
            >
              {#if profileInitial}
                <span>{profileInitial}</span>
              {:else}
                <User class="w-6 h-6 text-tt-text" />
              {/if}
            </div>

            <div class="min-w-0 flex-1">
              <h2
                id="active-profile-heading"
                class="font-bold text-xl sm:text-2xl text-tt-text tracking-tight leading-tight truncate"
              >
                {activeProfile.name}
              </h2>
              <p class="text-xs font-mono text-tt-text-secondary mt-1 truncate">
                @{activeProfile.slug}
              </p>
            </div>
          </div>

          <!-- Rename Button -->
          <div class="shrink-0">
            <AppButton
              tonal
              small
              inline
              class="cursor-pointer font-semibold px-3.5 py-2 rounded-xl border border-tt-separator/40 hover:border-tt-text/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tt-primary transition-colors"
              onclick={openRename}
            >
              <PencilSimple class="w-4 h-4" aria-hidden="true" />
              <span>{t("profiles.rename")}</span>
            </AppButton>
          </div>
        </div>

        <!-- Two-Column Essential Metadata (Created & Last Active) -->
        <dl
          class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-tt-separator/30 m-0"
        >
          <div
            class="p-3.5 rounded-xl bg-tt-surface-2/50 border border-tt-separator/30 flex items-center gap-3.5"
          >
            <div
              class="w-9 h-9 rounded-lg bg-tt-surface border border-tt-separator/40 flex items-center justify-center text-tt-text-secondary shrink-0"
              aria-hidden="true"
            >
              <CalendarBlank class="w-4 h-4" />
            </div>
            <div class="min-w-0 flex-1">
              <dt
                class="text-xs uppercase tracking-wider font-semibold text-tt-text-secondary truncate"
              >
                {t("mainMenu.memberSince")}
              </dt>
              <dd
                class="text-sm font-semibold font-mono tabular-nums text-tt-text truncate mt-0.5 m-0"
              >
                {formatDate(activeProfile.created_at)}
              </dd>
            </div>
          </div>

          <div
            class="p-3.5 rounded-xl bg-tt-surface-2/50 border border-tt-separator/30 flex items-center gap-3.5"
          >
            <div
              class="w-9 h-9 rounded-lg bg-tt-surface border border-tt-separator/40 flex items-center justify-center text-tt-text-secondary shrink-0"
              aria-hidden="true"
            >
              <Clock class="w-4 h-4" />
            </div>
            <div class="min-w-0 flex-1">
              <dt
                class="text-xs uppercase tracking-wider font-semibold text-tt-text-secondary truncate"
              >
                {t("mainMenu.lastActive")}
              </dt>
              <dd
                class="text-sm font-semibold font-mono tabular-nums text-tt-text truncate mt-0.5 m-0"
              >
                {formatDate(activeProfile.last_active_at)}
              </dd>
            </div>
          </div>
        </dl>
      </AppCard>
    </section>

    <!-- Trophy Showcase (2 Baris: 3 di Atas + 2 di Bawah, Tengah, Persegi Sama Sisi Presisi 1:1) -->
    <section aria-label={t("achievements.showcaseSlot")}>
      <TrophyShowcase />
    </section>

    <!-- Dedicated Sub-Routes Navigation Hub -->
    <nav
      aria-label={t("profiles.title")}
      class="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      <!-- 1. Achievements Card -->
      <a
        href="/profiles/achievements"
        class="hub-nav-card hub-card-amber group p-5 rounded-2xl bg-tt-surface border border-tt-separator/40 dark:border-white/5 flex flex-col justify-between gap-4 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        <div class="space-y-3.5">
          <div class="flex items-center justify-between gap-2">
            <div
              class="hub-icon-box w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Trophy class="w-5 h-5" />
            </div>
            <span
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold tabular-nums bg-tt-surface-2 text-tt-text border border-tt-separator/40"
            >
              {achievementsUnlocked}/{achievementsTotal}
            </span>
          </div>

          <div class="space-y-1">
            <h3
              class="font-bold text-sm sm:text-base text-tt-text group-hover:text-amber-400 transition-colors"
            >
              {t("achievements.navAchievements")}
            </h3>
            <p
              class="text-xs text-tt-text-secondary line-clamp-2 leading-relaxed"
            >
              {t("achievements.achievementsDesc")}
            </p>
          </div>
        </div>

        <div class="space-y-2.5 pt-3 border-t border-tt-separator/30">
          <div
            class="w-full h-1.5 rounded-full bg-tt-surface-2 overflow-hidden"
            role="progressbar"
            aria-valuenow={achievementsPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="{t(
              'achievements.navAchievements',
            )} {achievementsPercent}% {t('common.done')}"
          >
            <div
              class="hub-progress-fill h-full rounded-full transition-[width] duration-300 ease-out"
              style="width: {achievementsPercent}%;"
            ></div>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span
              class="font-mono font-medium tabular-nums text-tt-text-secondary"
            >
              {achievementsPercent}% {t("common.done")}
            </span>
            <span
              class="inline-flex items-center gap-1 font-semibold text-tt-text group-hover:text-amber-400 transition-colors"
            >
              <span>{t("common.open")}</span>
              <CaretRight
                class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </a>

      <!-- 2. Advancements Card -->
      <a
        href="/profiles/advancements"
        class="hub-nav-card hub-card-emerald group p-5 rounded-2xl bg-tt-surface border border-tt-separator/40 dark:border-white/5 flex flex-col justify-between gap-4 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      >
        <div class="space-y-3.5">
          <div class="flex items-center justify-between gap-2">
            <div
              class="hub-icon-box w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Medal class="w-5 h-5" />
            </div>
            <span
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold tabular-nums bg-tt-surface-2 text-tt-text border border-tt-separator/40"
            >
              {advancementsUnlocked}/{advancementsTotal}
            </span>
          </div>

          <div class="space-y-1">
            <h3
              class="font-bold text-sm sm:text-base text-tt-text group-hover:text-emerald-400 transition-colors"
            >
              {t("achievements.navAdvancements")}
            </h3>
            <p
              class="text-xs text-tt-text-secondary line-clamp-2 leading-relaxed"
            >
              {t("achievements.advancementsDesc")}
            </p>
          </div>
        </div>

        <div class="space-y-2.5 pt-3 border-t border-tt-separator/30">
          <div
            class="w-full h-1.5 rounded-full bg-tt-surface-2 overflow-hidden"
            role="progressbar"
            aria-valuenow={advancementsPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="{t(
              'achievements.navAdvancements',
            )} {advancementsPercent}% {t('common.done')}"
          >
            <div
              class="hub-progress-fill h-full rounded-full transition-[width] duration-300 ease-out"
              style="width: {advancementsPercent}%;"
            ></div>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span
              class="font-mono font-medium tabular-nums text-tt-text-secondary"
            >
              {advancementsPercent}% {t("common.done")}
            </span>
            <span
              class="inline-flex items-center gap-1 font-semibold text-tt-text group-hover:text-emerald-400 transition-colors"
            >
              <span>{t("common.open")}</span>
              <CaretRight
                class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </a>

      <!-- 3. Trophy Gallery Card -->
      <a
        href="/profiles/gallery"
        class="hub-nav-card hub-card-violet group p-5 rounded-2xl bg-tt-surface border border-tt-separator/40 dark:border-white/5 flex flex-col justify-between gap-4 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
      >
        <div class="space-y-3.5">
          <div class="flex items-center justify-between gap-2">
            <div
              class="hub-icon-box w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Sparkle class="w-5 h-5" />
            </div>
            <span
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold tabular-nums bg-tt-surface-2 text-tt-text border border-tt-separator/40"
            >
              {showcaseFilledCount}/{achievementStore.showcaseSlots.length} {t("achievements.showcaseSlot")}
            </span>
          </div>

          <div class="space-y-1">
            <h3
              class="font-bold text-sm sm:text-base text-tt-text group-hover:text-violet-400 transition-colors"
            >
              {t("achievements.navGallery")}
            </h3>
            <p
              class="text-xs text-tt-text-secondary line-clamp-2 leading-relaxed"
            >
              {t("achievements.galleryDesc")}
            </p>
          </div>
        </div>

        <div class="space-y-2.5 pt-3 border-t border-tt-separator/30">
          <div
            class="w-full h-1.5 rounded-full bg-tt-surface-2 overflow-hidden"
            role="progressbar"
            aria-valuenow={galleryPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="{t('achievements.navGallery')} {galleryPercent}%"
          >
            <div
              class="hub-progress-fill h-full rounded-full transition-[width] duration-300 ease-out"
              style="width: {galleryPercent}%;"
            ></div>
          </div>

          <div class="flex items-center justify-between gap-2 text-xs">
            <span
              class="font-mono font-medium tabular-nums text-tt-text-secondary truncate"
            >
              {achievementStore.unlockedCount}/{achievementStore.totalCount}
              {t("achievements.trophiesCollected")}
            </span>
            <span
              class="inline-flex items-center gap-1 font-semibold text-tt-text group-hover:text-violet-400 transition-colors shrink-0"
            >
              <span>{t("common.open")}</span>
              <CaretRight
                class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </a>
    </nav>

    <!-- Centralized Profile Management Notice -->
    <aside
      role="note"
      class="flex items-center gap-3 p-3.5 rounded-xl bg-tt-surface-2/40 border border-tt-separator/30 text-xs text-tt-text-secondary"
    >
      <Info
        class="w-4 h-4 text-tt-text-secondary shrink-0"
        aria-hidden="true"
      />
      <p class="leading-relaxed m-0">{t("profiles.switchNotice")}</p>
    </aside>
  {:else}
    <!-- Empty / Fallback State -->
    <AppCard
      padding="p-8"
      class="text-center space-y-3 rounded-2xl border border-tt-separator/40 dark:border-white/5 bg-tt-surface"
    >
      <User
        class="w-10 h-10 mx-auto text-tt-text-secondary opacity-60"
        aria-hidden="true"
      />
      <p class="text-sm font-medium text-tt-text">{t("mainMenu.noProfiles")}</p>
    </AppCard>
  {/if}

  <!-- Rename Profile Dialog -->
  <AppDialog
    opened={showRenameDialog}
    title={t("profiles.rename")}
    onbackdropClick={() => (showRenameDialog = false)}
  >
    <form onsubmit={handleRename} class="space-y-3 py-2 text-left">
      <div class="flex items-center justify-between gap-2">
        <label
          for="rename-profile-name"
          class="block text-xs font-semibold text-tt-text-secondary"
        >
          {t("profiles.nameLabel")}
        </label>
        <span
          id="rename-char-counter"
          class="text-xs font-mono tabular-nums text-tt-text-secondary"
          aria-live="polite"
        >
          {trimmedRenameLength}/32
        </span>
      </div>

      <input
        id="rename-profile-name"
        bind:value={renameValue}
        type="text"
        maxlength="32"
        required
        autocomplete="off"
        spellcheck="false"
        aria-describedby="rename-char-counter"
        class="w-full px-3.5 py-2.5 rounded-xl border border-tt-separator bg-tt-surface-2 text-tt-text text-sm font-medium focus:outline-none focus:border-tt-primary focus:ring-2 focus:ring-tt-primary/30 transition-colors"
        onkeydown={(e) => {
          if (e.key === "Escape") {
            showRenameDialog = false;
          }
        }}
      />
      {#if renameError}
        <p class="text-xs text-status-red font-medium">{renameError}</p>
      {/if}
    </form>

    {#snippet buttonsSlot()}
      <div class="flex items-center justify-end gap-2 p-2">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-tt-surface-2 text-tt-text cursor-pointer transition-colors"
          onclick={() => (showRenameDialog = false)}
        >
          {t("common.cancel")}
        </button>
        <AppButton
          small
          disabled={!isRenameValid || isRenaming}
          onclick={() => handleRename()}
        >
          {t("common.save")}
        </AppButton>
      </div>
    {/snippet}
  </AppDialog>
</AppPage>

<style>
  /* =========================================================================
   * NAVIGATION HUB CARDS
   * ========================================================================= */
  .hub-nav-card {
    transition:
      transform 0.18s cubic-bezier(0.22, 1, 0.36, 1),
      border-color 0.18s ease;
  }

  .hub-nav-card:hover {
    transform: translateY(-2px);
  }

  .hub-card-amber {
    --hub-accent: #fbbf24;
    --hub-accent-solid: #f59e0b;
    --hub-accent-bg: rgba(245, 158, 11, 0.12);
    --hub-accent-border: rgba(251, 191, 36, 0.32);
  }
  .hub-card-amber:hover {
    border-color: rgba(251, 191, 36, 0.5);
  }

  .hub-card-emerald {
    --hub-accent: #34d399;
    --hub-accent-solid: #10b981;
    --hub-accent-bg: rgba(16, 185, 129, 0.12);
    --hub-accent-border: rgba(52, 211, 153, 0.32);
  }
  .hub-card-emerald:hover {
    border-color: rgba(52, 211, 153, 0.5);
  }

  .hub-card-violet {
    --hub-accent: #a78bfa;
    --hub-accent-solid: #8b5cf6;
    --hub-accent-bg: rgba(139, 92, 246, 0.12);
    --hub-accent-border: rgba(167, 139, 250, 0.32);
  }
  .hub-card-violet:hover {
    border-color: rgba(167, 139, 250, 0.5);
  }

  .hub-icon-box {
    background-color: var(--hub-accent-bg);
    border: 1px solid var(--hub-accent-border);
    color: var(--hub-accent);
  }

  .hub-progress-fill {
    background-color: var(--hub-accent-solid);
  }

  @media (prefers-reduced-motion: reduce) {
    .hub-nav-card,
    .hub-progress-fill {
      transition: none !important;
      transform: none !important;
    }
  }
</style>
