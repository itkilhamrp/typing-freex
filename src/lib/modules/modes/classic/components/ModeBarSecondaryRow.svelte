<script lang="ts">
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import { useTypingStore } from "../stores/typing.store.svelte";
  import { useTypingSoundController } from "#lib/modules/typing-sound/controllers/typing-sound.controller.svelte.js";
  import type { QuoteLengthFilter } from "@/core/typing-engine";
  import {
    Hand,
    Keyboard,
    Globe,
    PencilSimple,
    SlidersHorizontal,
    SpeakerHigh,
  } from "phosphor-svelte";
  import {
    AppSegmented,
    AppSegmentedButton,
    AppChip,
  } from "#lib/shared/ui/index.js";

  interface Props {
    currentLanguageDisplay: string;
    currentQuoteLanguageDisplay: string;
    currentTechLanguageDisplay: string;
    isCustomDurationCustom: boolean;
    customTimePresets: readonly number[];
    isCustomBarOpen: boolean;
    onselecttimelimit: (seconds: number) => void;
    onselectwordlimit: (count: number) => void;
    onselectquotelength: (filter: QuoteLengthFilter) => void;
    onselectcustomtimelimit: (seconds: number | null) => void;
    onopencustomduration: () => void;
    ontogglepunctuation: () => void;
    ontogglenumbers: () => void;
    ontogglehandguide: () => void;
    ontogglekeymap: () => void;
    ontogglesound: () => void;
    onopenlanguagemodal: () => void;
    onopenquotelanguagemodal: () => void;
    onopentechlanguagemodal: () => void;
    ontogglecustombar: () => void;
  }

  let {
    currentLanguageDisplay,
    currentQuoteLanguageDisplay,
    currentTechLanguageDisplay,
    isCustomDurationCustom,
    customTimePresets,
    isCustomBarOpen,
    onselecttimelimit,
    onselectwordlimit,
    onselectquotelength,
    onselectcustomtimelimit,
    onopencustomduration,
    ontogglepunctuation,
    ontogglenumbers,
    ontogglehandguide,
    ontogglekeymap,
    ontogglesound,
    onopenlanguagemodal,
    onopenquotelanguagemodal,
    onopentechlanguagemodal,
    ontogglecustombar,
  }: Props = $props();

  const { t } = useI18n();
  const store = useTypingStore();
  const soundController = useTypingSoundController();

  const timeOptions = [15, 30, 60, 120];
  const wordOptions = [10, 25, 50, 100];
  const quoteLengthOptions = $derived<{ id: QuoteLengthFilter; label: string }[]>([
    { id: "all", label: t("arena.quoteLenAll") },
    { id: "short", label: t("arena.quoteLenShort") },
    { id: "medium", label: t("arena.quoteLenMedium") },
    { id: "long", label: t("arena.quoteLenLong") },
    { id: "thicc", label: t("arena.quoteLenThicc") },
  ]);
</script>

<div
  class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full min-h-[34px]"
>
  <!-- Sub-options for Time -->
  {#if store.mode === "time"}
    <div class="flex items-center">
      <AppSegmented rounded strong class="w-[200px] sm:w-[220px]">
        {#each timeOptions as tVal (tVal)}
          <AppSegmentedButton
            active={store.timeLimit === tVal}
            onclick={() => onselecttimelimit(tVal)}
          >
            {tVal}s
          </AppSegmentedButton>
        {/each}
      </AppSegmented>
    </div>
  {/if}

  <!-- Sub-options for Words -->
  {#if store.mode === "words"}
    <div class="flex items-center">
      <AppSegmented rounded strong class="w-[200px] sm:w-[220px]">
        {#each wordOptions as w (w)}
          <AppSegmentedButton
            active={store.wordLimit === w}
            onclick={() => onselectwordlimit(w)}
          >
            {w}
          </AppSegmentedButton>
        {/each}
      </AppSegmented>
    </div>
  {/if}

  <!-- Sub-options for Quote & Tech -->
  {#if store.mode === "quote" || store.mode === "tech"}
    <div class="flex items-center">
      <AppSegmented
        rounded
        strong
        class="w-auto min-w-[310px] sm:min-w-[360px]"
      >
        {#each quoteLengthOptions as opt (opt.id)}
          <AppSegmentedButton
            active={store.quoteLengthFilter === opt.id}
            class="px-2.5 sm:px-3.5 min-w-[56px] sm:min-w-[66px]"
            onclick={() => onselectquotelength(opt.id)}
          >
            {opt.label}
          </AppSegmentedButton>
        {/each}
      </AppSegmented>
    </div>
  {/if}

  <!-- Sub-options for Custom -->
  {#if store.mode === "custom"}
    <div class="flex items-center">
      <AppSegmented rounded strong class="w-auto">
        {#each customTimePresets as tVal (tVal)}
          <AppSegmentedButton
            active={store.customTimeLimit === tVal}
            onclick={() => onselectcustomtimelimit(tVal)}
          >
            {tVal}s
          </AppSegmentedButton>
        {/each}

        <!-- Infinity (Text Completion) -->
        <AppSegmentedButton
          active={store.customTimeLimit === null}
          title={t("arena.customInfinity")}
          onclick={() => onselectcustomtimelimit(null)}
        >
          <span class="text-sm font-bold">∞</span>
        </AppSegmentedButton>

        <!-- Custom Duration Input -->
        <AppSegmentedButton
          active={isCustomDurationCustom}
          title={t("arena.customTimeLimit")}
          onclick={onopencustomduration}
        >
          {#if isCustomDurationCustom}
            <span class="text-xs font-semibold tabular-nums"
              >{store.customTimeLimit}s</span
            >
          {:else}
            <PencilSimple class="w-3.5 h-3.5" />
          {/if}
        </AppSegmentedButton>
      </AppSegmented>
    </div>
  {/if}

  <!-- Modifiers & Tools (Punctuation, Numbers, Hand Guide, Keymap, Sound) -->
  <div
    class={[
      "flex items-center gap-1.5",
      store.mode === "time" ||
      store.mode === "words" ||
      store.mode === "quote" ||
      store.mode === "tech" ||
      store.mode === "custom"
        ? "border-l border-tt-separator/60 pl-2 sm:pl-3"
        : "",
    ].join(" ")}
  >
    {#if store.mode === "time" || store.mode === "words"}
      <AppChip active={store.punctuation} onclick={ontogglepunctuation}>
        @ {t("arena.punctuation")}
      </AppChip>

      <AppChip active={store.numbers} onclick={ontogglenumbers}>
        # {t("arena.numbers")}
      </AppChip>
    {/if}

    <!-- Quick Hand Guide Toggle -->
    <AppChip active={store.handGuideEnabled} onclick={ontogglehandguide}>
      <Hand class="w-3.5 h-3.5" />
    </AppChip>

    <!-- Quick Keymap Toggle -->
    <AppChip active={store.keymapVisible} onclick={ontogglekeymap}>
      <Keyboard class="w-3.5 h-3.5" />
    </AppChip>

    <!-- Quick Sound Toggle -->
    <AppChip
      active={soundController.isEnabled}
      onclick={ontogglesound}
      title={t("arena.soundToggle")}
      aria-label={t("arena.soundToggle")}
    >
      <SpeakerHigh class="w-3.5 h-3.5" />
    </AppChip>
  </div>

  <!-- Language Selector Button (Wordlist / Quote / Tech) -->
  {#if store.mode === "time" || store.mode === "words"}
    <div
      class="flex items-center gap-1.5 border-l border-tt-separator/60 pl-2 sm:pl-3"
    >
      <button
        type="button"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text-secondary hover:text-tt-text border border-tt-separator/50 transition-all duration-150 active:scale-95 cursor-pointer select-none"
        onclick={onopenlanguagemodal}
        title={t("arena.selectLanguage")}
        aria-label={t("arena.selectLanguage")}
      >
        <Globe class="w-3.5 h-3.5 text-tt-primary shrink-0" />
        <span class="font-sans font-semibold tracking-wide text-tt-text">
          {currentLanguageDisplay}
        </span>
      </button>
    </div>
  {:else if store.mode === "quote"}
    <div
      class="flex items-center gap-1.5 border-l border-tt-separator/60 pl-2 sm:pl-3"
    >
      <button
        type="button"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text-secondary hover:text-tt-text border border-tt-separator/50 transition-all duration-150 active:scale-95 cursor-pointer select-none"
        onclick={onopenquotelanguagemodal}
        title={t("arena.selectQuoteLanguage")}
        aria-label={t("arena.selectQuoteLanguage")}
      >
        <Globe class="w-3.5 h-3.5 text-tt-primary shrink-0" />
        <span class="font-sans font-semibold tracking-wide text-tt-text">
          {currentQuoteLanguageDisplay}
        </span>
      </button>
    </div>
  {:else if store.mode === "tech"}
    <div
      class="flex items-center gap-1.5 border-l border-tt-separator/60 pl-2 sm:pl-3"
    >
      <button
        type="button"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-tt-surface-2 hover:bg-tt-surface-3 text-tt-text-secondary hover:text-tt-text border border-tt-separator/50 transition-all duration-150 active:scale-95 cursor-pointer select-none"
        onclick={onopentechlanguagemodal}
        title={t("arena.selectTechLanguage")}
        aria-label={t("arena.selectTechLanguage")}
      >
        <Globe class="w-3.5 h-3.5 text-tt-primary shrink-0" />
        <span class="font-sans font-semibold tracking-wide text-tt-text">
          {currentTechLanguageDisplay}
        </span>
      </button>
    </div>
  {/if}

  <!-- Row 3 Customization Toggle Button -->
  <div class="flex items-center border-l border-tt-separator/60 pl-2 sm:pl-3">
    <AppChip
      active={isCustomBarOpen}
      onclick={ontogglecustombar}
      title={t("arena.customizeBar")}
      aria-label={t("arena.customizeBar")}
    >
      <SlidersHorizontal class="w-3.5 h-3.5" />
      <span class="hidden md:inline text-xs font-medium"
        >{t("arena.customizeBar")}</span
      >
    </AppChip>
  </div>
</div>
