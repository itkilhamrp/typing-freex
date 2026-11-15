<script lang="ts">
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import { useTypingStore } from "../stores/typing.store.svelte";
  import type { Difficulty } from "@/core/typing-engine";
  import type {
    FontSizePreset,
    ArenaWidthPreset,
  } from "#lib/modules/settings/stores/settings.store.svelte.js";
  import {
    ChartLineUp,
    CursorText,
    Eye,
    Sparkle,
    FilmStrip,
  } from "phosphor-svelte";
  import {
    AppSegmented,
    AppSegmentedButton,
    AppChip,
  } from "#lib/shared/ui/index.js";

  interface Props {
    isOpen: boolean;
    onselectfontsize: (fSize: FontSizePreset) => void;
    onselectarenawidth: (w: ArenaWidthPreset) => void;
    onselectvisiblelines: (count: number) => void;
    onselectdifficulty: (diff: Difficulty) => void;
    ontoggletape: () => void;
    ontogglelivestats: () => void;
    ontogglesmoothcaret: () => void;
    ontogglehighlightword: () => void;
    oncyclecaretstyle: () => void;
  }

  let {
    isOpen,
    onselectfontsize,
    onselectarenawidth,
    onselectvisiblelines,
    onselectdifficulty,
    ontoggletape,
    ontogglelivestats,
    ontogglesmoothcaret,
    ontogglehighlightword,
    oncyclecaretstyle,
  }: Props = $props();

  const { t } = useI18n();
  const store = useTypingStore();

  const fontSizes: { id: FontSizePreset; label: string }[] = [
    { id: "xs", label: "xs" },
    { id: "sm", label: "sm" },
    { id: "md", label: "md" },
    { id: "lg", label: "lg" },
    { id: "xl", label: "xl" },
  ];

  const lineOptions = [1, 2, 3, 4, 5];

  const arenaWidthOptions: { id: ArenaWidthPreset; label: string }[] = [
    { id: "sm", label: "sm" },
    { id: "md", label: "md" },
    { id: "lg", label: "lg" },
    { id: "xl", label: "xl" },
  ];

  const difficultyOptions = $derived<
    { id: Difficulty; label: string; description: string }[]
  >([
    {
      id: "normal",
      label: t("arena.diffNormal"),
      description: t("arena.diffNormalDesc"),
    },
    {
      id: "expert",
      label: t("arena.diffExpert"),
      description: t("arena.diffExpertDesc"),
    },
    {
      id: "master",
      label: t("arena.diffMaster"),
      description: t("arena.diffMasterDesc"),
    },
  ]);
</script>

<div
  class={[
    "grid w-full transition-[grid-template-rows,opacity] duration-200 ease-out",
    isOpen
      ? "grid-rows-[1fr] opacity-100"
      : "grid-rows-[0fr] opacity-0 pointer-events-none",
  ].join(" ")}
>
  <div class="overflow-hidden">
    <div
      class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 py-1.5 rounded-xl bg-tt-surface-2/80 border border-tt-separator/40"
    >
      <!-- Font Size Presets -->
      <div class="flex items-center gap-1.5">
        <span
          class="text-[10px] sm:text-[11px] font-semibold text-tt-text-secondary uppercase tracking-wider"
        >
          {t("arena.fontSize")}
        </span>
        <AppSegmented rounded strong class="w-auto">
          {#each fontSizes as f (f.id)}
            <AppSegmentedButton
              active={store.fontSizePreset === f.id}
              onclick={() => onselectfontsize(f.id)}
              class="px-2 py-0.5 text-xs font-medium"
            >
              {f.label}
            </AppSegmentedButton>
          {/each}
        </AppSegmented>
      </div>

      <div class="hidden sm:block h-4 w-[1px] bg-tt-separator/50"></div>

      <!-- Arena Card Width -->
      <div class="flex items-center gap-1.5">
        <span
          class="text-[10px] sm:text-[11px] font-semibold text-tt-text-secondary uppercase tracking-wider"
        >
          {t("arena.arenaWidth")}
        </span>
        <AppSegmented rounded strong class="w-auto">
          {#each arenaWidthOptions as w (w.id)}
            <AppSegmentedButton
              active={store.arenaWidth === w.id}
              onclick={() => onselectarenawidth(w.id)}
              class="px-2 py-0.5 text-xs font-medium"
            >
              {w.label}
            </AppSegmentedButton>
          {/each}
        </AppSegmented>
      </div>

      <div class="hidden sm:block h-4 w-[1px] bg-tt-separator/50"></div>

      <!-- Visible Lines Count -->
      <div class="flex items-center gap-1.5">
        <span
          class="text-[10px] sm:text-[11px] font-semibold text-tt-text-secondary uppercase tracking-wider"
        >
          {t("arena.visibleLines")}
        </span>
        <AppSegmented
          rounded
          strong
          class="w-auto overflow-x-auto max-w-full"
        >
          {#each lineOptions as lVal (lVal)}
            <AppSegmentedButton
              active={store.visibleLines === lVal}
              onclick={() => onselectvisiblelines(lVal)}
              class="px-1.5 sm:px-2 py-0.5 text-xs font-medium tabular-nums"
            >
              {lVal}
            </AppSegmentedButton>
          {/each}
        </AppSegmented>
      </div>

      <div class="hidden sm:block h-4 w-[1px] bg-tt-separator/50"></div>

      <!-- Difficulty Mode (Normal / Expert / Master) -->
      {#if store.mode !== "zen"}
        <div class="flex items-center gap-1.5">
          <span
            class="text-[10px] sm:text-[11px] font-semibold text-tt-text-secondary uppercase tracking-wider"
          >
            {t("arena.difficulty")}
          </span>
          <AppSegmented rounded strong class="w-auto">
            {#each difficultyOptions as diff (diff.id)}
              <AppSegmentedButton
                active={store.difficulty === diff.id}
                onclick={() => onselectdifficulty(diff.id)}
                title={diff.description}
                aria-label={diff.label}
                class="px-2 py-0.5 text-xs font-medium"
              >
                {diff.label}
              </AppSegmentedButton>
            {/each}
          </AppSegmented>
        </div>

        <div class="hidden sm:block h-4 w-[1px] bg-tt-separator/50"></div>
      {/if}

      <!-- Quick Action Toggles -->
      <div class="flex items-center gap-1.5">
        <!-- Tape Mode Toggle -->
        <AppChip
          active={store.tapeEnabled}
          onclick={ontoggletape}
          title={`${t("arena.tapeToggle")}: ${store.tapeEnabled ? t("arena.stateOn") : t("arena.stateOff")}`}
          aria-label={t("arena.tapeToggle")}
        >
          <FilmStrip class="w-3.5 h-3.5" />
          <span class="text-[11px] uppercase font-mono"
            >{t("arena.tapeToggle")}</span
          >
        </AppChip>

        <!-- Live Telemetry Toggle -->
        <AppChip
          active={store.showLiveStats}
          onclick={ontogglelivestats}
          title={t("arena.liveStatsToggle")}
          aria-label={t("arena.liveStatsToggle")}
        >
          <ChartLineUp class="w-3.5 h-3.5" />
        </AppChip>

        <!-- Smooth Caret Toggle -->
        <AppChip
          active={store.smoothCaret}
          onclick={ontogglesmoothcaret}
          title={t("arena.smoothCaret")}
          aria-label={t("arena.smoothCaret")}
        >
          <Sparkle class="w-3.5 h-3.5" />
        </AppChip>

        <!-- Highlight Active Word Toggle -->
        <AppChip
          active={store.highlightActiveWord}
          onclick={ontogglehighlightword}
          title={t("arena.highlightWord")}
          aria-label={t("arena.highlightWord")}
        >
          <Eye class="w-3.5 h-3.5" />
        </AppChip>

        <!-- Caret Style Cycler -->
        <AppChip
          active={true}
          onclick={oncyclecaretstyle}
          title={`${t("arena.caretStyleToggle")}: ${store.caretStyle}`}
          aria-label={`${t("arena.caretStyleToggle")}: ${store.caretStyle}`}
        >
          <CursorText class="w-3.5 h-3.5" />
          <span class="text-[11px] uppercase font-mono"
            >{store.caretStyle}</span
          >
        </AppChip>
      </div>
    </div>
  </div>
</div>
