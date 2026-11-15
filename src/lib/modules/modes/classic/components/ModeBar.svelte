<script lang="ts">
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import { useTypingStore } from "../stores/typing.store.svelte";
  import type {
    TypingMode,
    QuoteLengthFilter,
    Difficulty,
  } from "@/core/typing-engine";
  import type {
    FontSizePreset,
    ArenaWidthPreset,
  } from "#lib/modules/settings/stores/settings.store.svelte.js";
  import { useTypingSoundController } from "#lib/modules/typing-sound/controllers/typing-sound.controller.svelte.js";
  import {
    AppSegmented,
    AppSegmentedButton,
  } from "#lib/shared/ui/index.js";
  import CustomDurationModal from "./CustomDurationModal.svelte";
  import LanguageSelectorDialog from "./LanguageSelectorDialog.svelte";
  import ModeBarSecondaryRow from "./ModeBarSecondaryRow.svelte";
  import ModeBarCustomizeDrawer from "./ModeBarCustomizeDrawer.svelte";
  import {
    getLanguageByCode,
    resolveLanguageId,
    getQuoteLanguageDisplayName,
  } from "@/core/text-tools";

  interface Props {
    onchange?: () => void;
    onrefocus?: () => void;
    isAnyModalOpen?: boolean;
  }

  let {
    onchange,
    onrefocus,
    isAnyModalOpen = $bindable(false),
  }: Props = $props();

  const { t } = useI18n();
  const store = useTypingStore();
  const soundController = useTypingSoundController();

  let isCustomModalOpen = $state(false);
  let isLanguageModalOpen = $state(false);
  let isQuoteLanguageModalOpen = $state(false);
  let isTechLanguageModalOpen = $state(false);
  let isCustomBarOpen = $state(false);

  $effect(() => {
    if (store.isTyping) {
      isCustomBarOpen = false;
    }
  });

  const modalOpen = $derived(
    isCustomModalOpen ||
      isLanguageModalOpen ||
      isQuoteLanguageModalOpen ||
      isTechLanguageModalOpen,
  );

  $effect(() => {
    isAnyModalOpen = modalOpen;
  });

  function handleLanguageSelect(newLangId: string) {
    if (store.mode === "words") {
      if (store.wordsLanguage !== newLangId) {
        store.setWordsLanguage(newLangId);
        onchange?.();
      }
    } else {
      if (store.timeLanguage !== newLangId) {
        store.setTimeLanguage(newLangId);
        onchange?.();
      }
    }
  }

  function handleQuoteLanguageSelect(newLangId: string) {
    if (store.quoteLanguage !== newLangId) {
      store.setQuoteLanguage(newLangId);
      onchange?.();
    }
  }

  function handleTechLanguageSelect(newLangId: string) {
    if (store.techLanguage !== newLangId) {
      store.setTechLanguage(newLangId);
      onchange?.();
    }
  }

  const currentQuoteLanguageDisplay = $derived.by(() => {
    if (!store.quoteLanguage || store.quoteLanguage.toLowerCase() === 'random') {
      return 'RANDOM';
    }
    return getQuoteLanguageDisplayName(store.quoteLanguage);
  });

  const currentTechLanguageDisplay = $derived.by(() => {
    if (!store.techLanguage || store.techLanguage.toLowerCase() === 'random' || store.techLanguage.toLowerCase() === 'tech') {
      return 'RANDOM';
    }
    return getQuoteLanguageDisplayName(store.techLanguage);
  });

  const activeWordlistLanguage = $derived.by(() => {
    return store.mode === "words" ? store.wordsLanguage : store.timeLanguage;
  });

  const currentLanguageDisplay = $derived.by(() => {
    const lang = activeWordlistLanguage;
    if (!lang || lang.toLowerCase() === 'random') {
      return 'RANDOM';
    }
    const canonical = resolveLanguageId(lang);
    const entry = getLanguageByCode(lang);
    if (!entry) return lang;
    const variant = entry.variants.find(
      (v) => v.id === canonical || v.id === lang,
    );
    return variant ? variant.name : entry.name;
  });

  const modes = $derived<{ id: TypingMode; label: string }[]>([
    { id: "time", label: t("arena.modeTime") },
    { id: "words", label: t("arena.modeWords") },
    { id: "quote", label: t("arena.modeQuote") },
    { id: "tech", label: t("arena.modeTech") },
    { id: "zen", label: t("arena.modeZen") },
    { id: "custom", label: t("arena.modeCustom") },
  ]);

  const customTimePresets = [15, 30, 60, 120];

  const isCustomDurationCustom = $derived(
    store.customTimeLimit !== null &&
      !customTimePresets.includes(store.customTimeLimit),
  );

  function selectMode(newMode: TypingMode) {
    if (store.mode !== newMode) {
      store.setMode(newMode);
      onchange?.();
    }
  }

  function selectTimeLimit(seconds: number) {
    if (store.timeLimit !== seconds) {
      store.setTimeLimit(seconds);
      onchange?.();
    }
  }

  function selectWordLimit(count: number) {
    if (store.wordLimit !== count) {
      store.setWordLimit(count);
      onchange?.();
    }
  }

  function selectQuoteLength(filter: QuoteLengthFilter) {
    if (store.quoteLengthFilter !== filter) {
      store.setQuoteLengthFilter(filter);
      onchange?.();
    }
  }

  function selectCustomTimeLimit(seconds: number | null) {
    if (store.customTimeLimit !== seconds) {
      store.setCustomTimeLimit(seconds);
      onchange?.();
    }
  }

  function openCustomDurationModal() {
    isCustomModalOpen = true;
  }

  function onCustomDurationConfirm(seconds: number) {
    store.setCustomTimeLimit(seconds);
    onchange?.();
  }

  function togglePunctuation() {
    store.togglePunctuation();
    onchange?.();
  }

  function toggleNumbers() {
    store.toggleNumbers();
    onchange?.();
  }

  function toggleHandGuide() {
    store.toggleHandGuide();
    onrefocus?.();
  }

  function toggleKeymap() {
    store.toggleKeymap();
    onrefocus?.();
  }

  function toggleSound() {
    soundController.toggleSound();
    onrefocus?.();
  }

  function selectDifficulty(diff: Difficulty) {
    if (store.difficulty !== diff) {
      store.setDifficulty(diff);
      onchange?.();
    }
  }

  function toggleCustomBar() {
    isCustomBarOpen = !isCustomBarOpen;
    onrefocus?.();
  }

  function selectArenaWidth(w: ArenaWidthPreset) {
    if (store.arenaWidth !== w) {
      store.setArenaWidth(w);
    }
    onrefocus?.();
  }

  function selectFontSize(fSize: FontSizePreset) {
    if (store.fontSizePreset !== fSize) {
      store.setFontSizePreset(fSize);
    }
    onrefocus?.();
  }

  function selectVisibleLines(count: number) {
    if (store.visibleLines !== count) {
      store.setVisibleLines(count);
    }
    onrefocus?.();
  }

  function toggleLiveStats() {
    store.toggleShowLiveStats();
    onrefocus?.();
  }

  function toggleTape() {
    store.toggleTape();
    onrefocus?.();
  }

  function toggleSmoothCaret() {
    store.toggleSmoothCaret();
    onrefocus?.();
  }

  function toggleHighlightWord() {
    store.toggleHighlightActiveWord();
    onrefocus?.();
  }

  function cycleCaretStyle() {
    store.cycleCaretStyle();
    onrefocus?.();
  }
</script>

<div
  class="select-none flex flex-col items-center justify-center gap-2 sm:gap-2.5 w-full py-1"
>
  <!-- Row 1: Primary Mode Selectors (Strong Segmented Control) -->
  <div class="flex items-center justify-center w-full">
    <AppSegmented
      rounded
      strong
      class="w-full sm:w-auto sm:min-w-[510px] md:min-w-[540px]"
    >
      {#each modes as m (m.id)}
        <AppSegmentedButton
          active={store.mode === m.id}
          onclick={() => selectMode(m.id)}
        >
          {m.label}
        </AppSegmentedButton>
      {/each}
    </AppSegmented>
  </div>

  <!-- Row 2: Sub-options, Modifiers & Language Toggle -->
  <ModeBarSecondaryRow
    {currentLanguageDisplay}
    {currentQuoteLanguageDisplay}
    {currentTechLanguageDisplay}
    {isCustomDurationCustom}
    {customTimePresets}
    {isCustomBarOpen}
    onselecttimelimit={selectTimeLimit}
    onselectwordlimit={selectWordLimit}
    onselectquotelength={selectQuoteLength}
    onselectcustomtimelimit={selectCustomTimeLimit}
    onopencustomduration={openCustomDurationModal}
    ontogglepunctuation={togglePunctuation}
    ontogglenumbers={toggleNumbers}
    ontogglehandguide={toggleHandGuide}
    ontogglekeymap={toggleKeymap}
    ontogglesound={toggleSound}
    onopenlanguagemodal={() => (isLanguageModalOpen = true)}
    onopenquotelanguagemodal={() => (isQuoteLanguageModalOpen = true)}
    onopentechlanguagemodal={() => (isTechLanguageModalOpen = true)}
    ontogglecustombar={toggleCustomBar}
  />

  <!-- Row 3: Collapsible Customization Bar -->
  <ModeBarCustomizeDrawer
    isOpen={isCustomBarOpen}
    onselectfontsize={selectFontSize}
    onselectarenawidth={selectArenaWidth}
    onselectvisiblelines={selectVisibleLines}
    onselectdifficulty={selectDifficulty}
    ontoggletape={toggleTape}
    ontogglelivestats={toggleLiveStats}
    ontogglesmoothcaret={toggleSmoothCaret}
    ontogglehighlightword={toggleHighlightWord}
    oncyclecaretstyle={cycleCaretStyle}
  />
</div>

<!-- Custom Duration Modal -->
<CustomDurationModal
  opened={isCustomModalOpen}
  initialSeconds={store.customTimeLimit}
  onclose={() => (isCustomModalOpen = false)}
  onconfirm={onCustomDurationConfirm}
/>

<!-- Wordlist Language Selector Modal -->
<LanguageSelectorDialog
  opened={isLanguageModalOpen}
  activeId={store.mode === "words" ? store.wordsLanguage : store.timeLanguage}
  onclose={() => (isLanguageModalOpen = false)}
  onselect={handleLanguageSelect}
/>

<!-- Quote Language Selector Modal -->
<LanguageSelectorDialog
  opened={isQuoteLanguageModalOpen}
  activeId={store.quoteLanguage}
  mode="quotes"
  onclose={() => (isQuoteLanguageModalOpen = false)}
  onselect={handleQuoteLanguageSelect}
/>

<!-- Tech Language Selector Modal -->
<LanguageSelectorDialog
  opened={isTechLanguageModalOpen}
  activeId={store.techLanguage}
  mode="tech"
  onclose={() => (isTechLanguageModalOpen = false)}
  onselect={handleTechLanguageSelect}
/>
