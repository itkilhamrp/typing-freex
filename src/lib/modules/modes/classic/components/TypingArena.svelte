<script lang="ts">
  import "#lib/shared/styles/typing-arena.css";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";
  import { useTypingStore } from "#lib/modules/modes/classic/stores/typing.store.svelte.js";
  import type { ArenaWidthPreset } from "#lib/modules/settings/stores/settings.store.svelte.js";
  import { useTypingArenaController } from "#lib/modules/modes/classic/controllers/typing-arena.controller.svelte.js";
  import { useHandGuideController } from "#lib/modules/modes/classic/controllers/hand-guide.controller.svelte.js";
  import { useTypingSoundController } from "#lib/modules/typing-sound/controllers/typing-sound.controller.svelte.js";
  import { useSettingsStore } from "#lib/modules/settings/stores/settings.store.svelte.js";
  import { useCapsLock, useMouseCursorHider } from "#lib/shared/actions/index.js";
  import {
    Lock,
    BookOpen,
    ArrowsClockwise,
    Cursor,
  } from "phosphor-svelte";
  import { AppCard } from "#lib/shared/ui/index.js";
  import type { CustomTextDetail } from "@/core/ipc";
  import ModeBar from "./ModeBar.svelte";
  import LiveStats from "#lib/modules/typing-shared/components/LiveStats.svelte";
  import WordStream from "#lib/modules/typing-shared/components/WordStream.svelte";
  import CustomTextSelector from "./CustomTextSelector.svelte";
  import HandGuide from "#lib/modules/typing-shared/components/HandGuide.svelte";
  import Keymap from "#lib/modules/typing-shared/components/Keymap.svelte";
  import {
    DEFAULT_KEYBOARD_LAYOUT as keymapLayout,
    resolveNextKeyCode,
    evaluateReactPulse,
  } from "@/core/keymap";

  const { t } = useI18n();

  const store = useTypingStore();
  const controller = useTypingArenaController();
  const handController = useHandGuideController();
  const soundController = useTypingSoundController();
  const settingsStore = useSettingsStore();
  const capsLock = useCapsLock();

  const arenaWidthClasses: Record<ArenaWidthPreset, string> = {
    sm: "max-w-2xl",
    md: "max-w-3xl",
    lg: "max-w-5xl",
    xl: "max-w-7xl",
  };

  let inputElement = $state<HTMLInputElement | null>(null);
  let isSelectingCustomText = $state(false);
  let isWindowBlurred = $state(false);
  let isModeBarModalOpen = $state(false);
  let isInputBlurredDebounced = $state(false);
  let showCapsLockWarning = $derived(capsLock.isCapsLock);
  let keymapRef = $state<{ pulse: (code: string, isCorrect: boolean) => void } | null>(null);
  let isShiftActive = $state(false);
  let isComposing = false;
  let lastTabTimestamp = 0;

  const isRunning = $derived(controller.engineState === "Running");

  let blurTimer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    if (controller.isFocused) {
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
      isInputBlurredDebounced = false;
    } else {
      if (isWindowBlurred) {
        isInputBlurredDebounced = true;
      } else {
        if (!blurTimer) {
          blurTimer = setTimeout(() => {
            if (!controller.isFocused) {
              isInputBlurredDebounced = true;
            }
            blurTimer = null;
          }, 100);
        }
      }
    }
    return () => {
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
    };
  });

  const showFocusOverlay = $derived(
    !isModeBarModalOpen &&
    !isSelectingCustomText &&
    !(store.mode === "custom" && !store.customText) &&
    (isWindowBlurred || isInputBlurredDebounced)
  );

  const cursorHider = useMouseCursorHider({
    canHide: () =>
      !showFocusOverlay &&
      !isModeBarModalOpen &&
      !isSelectingCustomText,
  });

  $effect(() => {
    if (showFocusOverlay || isModeBarModalOpen || isSelectingCustomText) {
      cursorHider.showCursor();
    }
  });

  let warningPlayedForSession = false;

  $effect(() => {
    if (controller.engineState !== "Running") {
      cursorHider.showCursor();
      warningPlayedForSession = false;
    } else if (
      (store.mode === "time" || (store.mode === "custom" && !!store.customTimeLimit)) &&
      !warningPlayedForSession &&
      controller.timeRemainingSeconds > 0 &&
      controller.timeRemainingSeconds <= settingsStore.soundWarningSeconds
    ) {
      warningPlayedForSession = true;
      soundController.playWarning();
    }
  });

  const checkModifier = capsLock.checkModifier;

  $effect(() => {
    if (store.mode === "custom" && !store.customText) {
      isSelectingCustomText = true;
    } else if (store.mode !== "custom") {
      isSelectingCustomText = false;
    }
  });

  $effect(() => {
    if (inputElement) {
      controller.setInputRef(inputElement);
      if (!(store.mode === "custom" && isSelectingCustomText)) {
        controller.focusInput();
      }
    }
  });

  function handleWindowKeyDown(e: KeyboardEvent) {
    if (e.defaultPrevented) return;
    if (isModeBarModalOpen || isSelectingCustomText) return;
    if (e.target === inputElement) return;
    if (isComposing || e.isComposing || e.key === "Dead" || e.key === "Process") return;

    // Shift + Enter in Zen mode must ALWAYS trigger completion, even if a button or container was focused
    if (
      store.mode === "zen" &&
      (e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter") &&
      e.shiftKey
    ) {
      e.preventDefault();
      controller.handleKeyDown(e);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      controller.focusInput();
      controller.handleKeyDown(e);
      return;
    }

    // Tab must always be captured for the Tab -> Enter quick-restart sequence
    // instead of shifting focus onto ModeBar or shell buttons
    if (e.key === "Tab" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      lastTabTimestamp = typeof performance !== "undefined" ? performance.now() : Date.now();
      controller.focusInput();
      controller.handleKeyDown(e);
      return;
    }

    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    // If a button is focused, only let Space/Enter activate the button;
    // any printable character key should immediately refocus the arena and start typing.
    if (
      e.target instanceof HTMLButtonElement &&
      (e.key === " " || e.code === "Space" || e.key === "Enter" || e.code === "NumpadEnter")
    ) {
      return;
    }

    const isAltGr = Boolean(
      (typeof e.getModifierState === "function" && e.getModifierState("AltGraph")) ||
        (e.ctrlKey && e.altKey && !e.metaKey),
    );
    const hasBlockingModifier =
      e.metaKey || ((e.ctrlKey || e.altKey) && !(isAltGr && e.key.length === 1));

    if (
      !hasBlockingModifier &&
      (e.key.length === 1 || e.code === "Space" || e.key === "Enter")
    ) {
      controller.focusInput();
      handleKeyInput(e);
    }
  }

  function handleWindowBlur() {
    cursorHider.showCursor();
    if (!isModeBarModalOpen && !isSelectingCustomText) {
      isWindowBlurred = true;
      controller.handleBlur();
    }
  }

  function handleWindowFocus() {
    isWindowBlurred = false;
  }

  $effect(() => {
    if (!isModeBarModalOpen && !isSelectingCustomText && inputElement) {
      controller.focusInput();
    }
  });

  let lastConfigVersion = store.arenaConfigVersion;

  $effect(() => {
    const ver = store.arenaConfigVersion;
    if (ver !== lastConfigVersion) {
      lastConfigVersion = ver;
      controller.initTest();
      if (!(store.mode === "custom" && !store.customText)) {
        controller.focusInput();
      }
    }
  });

  onMount(() => {
    controller.initTest();
    return () => {
      controller.destroy();
      handController.destroy();
      cursorHider.destroy();
    };
  });

  function handleSelectCustomText(detail: CustomTextDetail) {
    store.setCustomPractice(detail.body, detail.title, detail.id);
    isSelectingCustomText = false;
    controller.initTest();
    controller.focusInput();
  }

  function openCustomTextSelector() {
    if (store.mode === "custom") {
      isSelectingCustomText = true;
    }
  }

  function closeCustomTextSelector() {
    isSelectingCustomText = false;
    controller.focusInput();
  }

  const nextExpectedChar = $derived.by(() => {
    if (store.mode === "zen") {
      const currentWord = controller.words[controller.currentWordIndex];
      // Zen mode: guided to press space once 36 characters are typed
      if (currentWord && currentWord.chars.length >= 36) {
        return " ";
      }
      return null;
    }
    const words = controller.words;
    const wIdx = controller.currentWordIndex;
    const cIdx = controller.currentCharIndex;

    if (wIdx < words.length) {
      const currentWord = words[wIdx];
      if (currentWord) {
        if (currentWord.target === '\n') {
          return '\n';
        }
        if (cIdx < currentWord.chars.length) {
          return currentWord.chars[cIdx]?.char ?? null;
        }
        const nextWord = words[wIdx + 1];
        if (nextWord && nextWord.target === '\n') {
          return '\n';
        }
        return " ";
      }
    }
    return null;
  });

  const handVisualState = $derived.by(() => {
    if (!store.handGuideEnabled) return null;
    return handController.getVisualState(
      nextExpectedChar,
      controller.engineState,
      store.handGuideMode,
    );
  });

  const keymapNextKeyCode = $derived.by(() => {
    if (store.keymapMode !== "next" || !nextExpectedChar) return null;
    return resolveNextKeyCode(nextExpectedChar);
  });

  const opticalOffsetClass = $derived.by(() => {
    if (store.tapeEnabled) {
      return "translate-y-0";
    }
    if (store.handGuideEnabled || store.keymapVisible) {
      return "translate-y-0";
    }
    if (store.visibleLines >= 4) {
      return "translate-y-0";
    }
    if (store.visibleLines === 3) {
      return "-translate-y-2 sm:-translate-y-3";
    }
    return "-translate-y-4 sm:-translate-y-6 md:-translate-y-8";
  });

  function handleKeyInput(e: KeyboardEvent) {
    if (
      store.mode === "custom" &&
      (!store.customText || isSelectingCustomText)
    ) {
      return;
    }

    if (isShiftActive !== e.shiftKey) {
      isShiftActive = e.shiftKey;
    }
    checkModifier(e);

    if (isComposing || e.isComposing || e.key === "Dead" || e.key === "Process") {
      return;
    }

    const nowTs = typeof performance !== "undefined" ? performance.now() : Date.now();
    const isEnterKey = e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter";

    if (e.key === "Tab") {
      lastTabTimestamp = nowTs;
      controller.handleKeyDown(e);
      return;
    }

    const isTabEnterRestart =
      isEnterKey && !e.shiftKey && lastTabTimestamp > 0 && nowTs - lastTabTimestamp < 1500;
    const isZenShiftEnter = store.mode === "zen" && isEnterKey && e.shiftKey;

    if (
      e.key !== "Shift" &&
      e.code !== "ShiftLeft" &&
      e.code !== "ShiftRight"
    ) {
      lastTabTimestamp = 0;
    }

    const isAltGr = Boolean(
      (typeof e.getModifierState === "function" && e.getModifierState("AltGraph")) ||
        (e.ctrlKey && e.altKey && !e.metaKey),
    );
    const hasBlockingModifier =
      e.metaKey || ((e.ctrlKey || e.altKey) && !(isAltGr && e.key.length === 1));

    if (
      !hasBlockingModifier &&
      (e.key.length === 1 || e.code === "Space" || e.key === "Backspace" || isEnterKey)
    ) {
      cursorHider.hideCursor();
    }

    const expected = nextExpectedChar;
    // Critical path first: engine consumes the key before any secondary work.
    controller.handleKeyDown(e);

    if (hasBlockingModifier || isTabEnterRestart || isZenShiftEnter || e.key === "Escape") {
      return;
    }

    // Fire typing sound synchronously (pure Web Audio API <0.01ms fire-and-forget, zero lag, zero delay)
    if (
      e.key.length === 1 || e.code === "Space" || e.key === "Backspace" || isEnterKey
    ) {
      const keyCode = e.code;
      const isBackspace = e.key === "Backspace";
      const isCorrect =
        isBackspace ||
        store.mode === "zen" ||
        expected === null ||
        (isEnterKey ? expected === "\n" : e.key === expected);

      if (isCorrect) {
        soundController.playClick(keyCode);
      } else {
        soundController.playError();
      }
    }

    if (e.key.length === 1 || e.code === "Space" || isEnterKey) {
      // The keydown is the single source of truth, so the browser must never
      // insert the character: no input event, no value churn, no IME work.
      if (!e.isComposing) e.preventDefault();
      if (store.handGuideEnabled && (store.handGuideMode === "react" || store.handGuideMode === "next")) {
        handController.registerKeyPress(
          e.code,
          store.mode !== "zen" && expected !== null && (isEnterKey ? expected !== "\n" : e.key !== expected),
        );
      }
    }
    if (store.keymapMode === "react" && keymapRef) {
      const pulseResult = evaluateReactPulse(e, expected, store.mode);
      keymapRef.pulse(pulseResult.code, pulseResult.isCorrect);
    }
  }

  function handleCompositionStart() {
    isComposing = true;
  }

  function handleCompositionEnd(e: CompositionEvent) {
    isComposing = false;
    const target = e.currentTarget as HTMLInputElement | null;
    const data = e.data || target?.value || "";
    if (target) {
      target.value = "";
    }
    if (data) {
      cursorHider.hideCursor();
      controller.handleComposedInput(data);
    }
  }

  // Fallback only (mobile / IME paths that bypass keydown preventDefault).
  function clearBuffer(e: Event) {
    if (isComposing || (e as InputEvent).isComposing) return;
    const target = e.currentTarget as HTMLInputElement;
    if (target.value) {
      target.value = "";
    }
  }

  function handleContainerPointerDown(e: PointerEvent) {
    if (
      store.mode === "custom" &&
      (!store.customText || isSelectingCustomText)
    ) {
      return;
    }
    const target = e.target as HTMLElement | null;
    if (
      target?.closest("button") ||
      target?.closest("input") ||
      target?.closest("select") ||
      target?.closest("textarea") ||
      target?.closest("a")
    ) {
      return;
    }
    e.preventDefault();
    controller.focusInput();
  }

  function handleContainerClick() {
    if (
      store.mode === "custom" &&
      (!store.customText || isSelectingCustomText)
    ) {
      return;
    }
    controller.focusInput();
  }
</script>

<svelte:window
  onkeydown={handleWindowKeyDown}
  onblur={handleWindowBlur}
  onfocus={handleWindowFocus}
  onmousemove={cursorHider.handleMouseMove}
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="flex flex-col h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2 justify-between select-none relative overflow-hidden"
  onpointerdown={handleContainerPointerDown}
  onclick={handleContainerClick}
>
  <!-- Hidden keyboard capture input (zero-overhead buffer clearing) -->
  <input
    bind:this={inputElement}
    data-typing-arena-input="true"
    type="text"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    class="sr-only"
    aria-hidden="true"
    onkeydown={handleKeyInput}
    oncompositionstart={handleCompositionStart}
    oncompositionend={handleCompositionEnd}
    oninput={clearBuffer}
    onkeyup={checkModifier}
    onfocus={controller.handleFocus}
    onblur={controller.handleBlur}
  />

  <!-- Top Mode Bar (Stable height slot, auto-dims on Running with hover restore) -->
  <div
    class="w-full flex-shrink-0 min-h-[64px] sm:min-h-[70px] relative z-30 flex items-center justify-center transition-opacity duration-150 {isRunning
      ? 'opacity-20 hover:opacity-100'
      : 'opacity-100'}"
  >
    <ModeBar
      onchange={controller.initTest}
      onrefocus={controller.focusInput}
      bind:isAnyModalOpen={isModeBarModalOpen}
    />
  </div>

  <!-- Central Typing Arena Stage (Consistent Centering Anchor) -->
  <div
    class="flex-1 min-h-0 w-full flex flex-col items-center justify-center relative select-none"
  >
    <!-- Centered Card Container (Dynamic Optical Centering Anchor) -->
    <div
      class={[
        "w-full flex flex-col items-center justify-center transition-[max-width,transform] duration-200 ease-out",
        arenaWidthClasses[store.arenaWidth] ?? "max-w-5xl",
        opticalOffsetClass,
      ].join(" ")}
    >
      <AppCard
        class="w-full relative !m-0 min-h-[160px] transition-[border-color,box-shadow] duration-150 z-10 bg-tt-surface shadow-sm"
        padding="p-0 flex flex-col justify-between"
        style="contain: layout style;"
      >
    <!-- Top Quiet Header: Mode & Countdown/Progress Only (Zero Visual Noise) -->
    <div
      class="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 select-none border-b border-tt-separator/30 font-mono text-xs"
    >
      <div class="flex items-center gap-2 text-tt-text-secondary">
        <span
          class="inline-block w-1.5 h-1.5 rounded-full {isRunning
            ? 'bg-ios-green'
            : 'bg-tt-text-secondary/40'}"
        ></span>
        <span class="uppercase tracking-wider font-semibold text-[11px]"
          >{store.mode}</span
        >
        {#if store.mode !== "zen" && store.difficulty !== "normal"}
          <span class="text-tt-separator/80">·</span>
          <span
            class="uppercase tracking-wider font-semibold text-[11px] {store.difficulty === 'master' ? 'text-ios-red' : 'text-ios-orange'}"
          >
            {store.difficulty}
          </span>
        {/if}

        <!-- Custom Mode Active Passage Interactive Pill (Click to switch passage) -->
        {#if store.mode === "custom" && store.customText && !isSelectingCustomText}
          <span class="text-tt-separator/80">·</span>
          <button
            type="button"
            class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-tt-surface-2/70 hover:bg-tt-surface-2 border border-tt-separator/40 hover:border-tt-primary/50 text-tt-text transition-all duration-150 cursor-pointer text-xs font-sans font-medium group select-none"
            title={t("arena.changeText")}
            onclick={(e) => {
              e.stopPropagation();
              openCustomTextSelector();
            }}
          >
            <BookOpen class="w-3.5 h-3.5 text-tt-primary shrink-0" />
            <span class="truncate max-w-[140px] sm:max-w-[220px] font-semibold"
              >{store.customTextTitle}</span
            >
            <ArrowsClockwise
              class="w-3 h-3 text-tt-text-secondary group-hover:text-tt-primary transition-colors shrink-0"
            />
          </button>
        {/if}
      </div>

      <!-- Timer / Words Progress KPI (Hidden if custom mode text not yet selected or currently selecting) -->
      {#if (store.mode !== "custom" || Boolean(store.customText)) && !isSelectingCustomText}
        <div class="flex items-center gap-2">
          <!-- Words Progress (in words mode) -->
          {#if store.mode === "words" && controller.remainingWordsCount !== null}
            <div class="flex items-center gap-1.5">
              <span
                class="text-[10px] uppercase font-semibold text-tt-text-secondary tracking-wider"
              >
                {t("arena.kpiWords")}
              </span>
              <span
                class="text-xs font-bold text-tt-text tabular-nums px-2 py-0.5 rounded-md bg-tt-surface-2 border border-tt-separator/40"
              >
                {controller.remainingWordsCount}
              </span>
            </div>
          {/if}

          <!-- Quote/Tech Word Progress Counter (Monkeytype style) -->
          {#if (store.mode === "quote" || store.mode === "tech") && controller.quoteWordsCount != null}
            <div class="flex items-center gap-1.5 animate-fade-in">
              <span
                class="text-[10px] uppercase font-semibold text-tt-text-secondary tracking-wider"
              >
                {t("arena.kpiWords")}
              </span>
              <span
                class="text-xs font-bold text-tt-text tabular-nums px-2 py-0.5 rounded-md bg-tt-surface-2 border border-tt-separator/40"
              >
                {controller.quoteWordsCount}
              </span>
            </div>
          {/if}

          <!-- Zen Mode: Spaces Counter (to the left of ELAPSED) -->
          {#if store.mode === "zen"}
            <div class="flex items-center gap-1.5 animate-fade-in">
              <span
                class="text-[10px] uppercase font-semibold text-tt-text-secondary tracking-wider"
              >
                {t("arena.kpiSpaces")}
              </span>
              <span
                class="text-xs font-bold text-tt-text tabular-nums px-2 py-0.5 rounded-md bg-tt-surface-2 border border-tt-separator/40"
              >
                {controller.zenSpacesCount}
              </span>
            </div>
          {/if}

          <!-- Time: REMAINING for Time / timed Custom mode, ELAPSED for Words/Quote/Zen/Infinity Custom -->
          <div class="flex items-center gap-1.5">
            <span
              class="text-[10px] uppercase font-semibold text-tt-text-secondary tracking-wider"
            >
              {store.mode === "time" ||
              (store.mode === "custom" && !!store.customTimeLimit)
                ? t("arena.kpiRemaining")
                : t("arena.kpiElapsed")}
            </span>
            <span
              class="text-xs font-bold text-tt-text tabular-nums px-2 py-0.5 rounded-md bg-tt-surface-2 border border-tt-separator/40"
            >
              {controller.timeRemainingSeconds}s
            </span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Caps Lock Floating Warning Badge (Zero Layout Shift) -->
    {#if showCapsLockWarning}
      <div
        transition:fly={{ y: -8, duration: 200 }}
        class="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-tt-surface-elevated border border-tt-separator/60 text-ios-orange text-xs font-semibold shadow-sm"
      >
        <span
          class="inline-flex items-center justify-center w-4 h-4 rounded bg-ios-orange/25 text-[10px] font-mono font-bold leading-none"
          >⇪</span
        >
        <Lock class="w-3.5 h-3.5 shrink-0" />
        <span>{t("arena.capsLock")}</span>
      </div>
    {/if}


    <!-- Word Stream View (Pure Focus Zone) OR Direct Passage Selector (Typing Master Flow) -->
    {#if store.mode === "custom" && (!store.customText || isSelectingCustomText)}
      <div class="w-full my-auto">
        <CustomTextSelector
          embedded
          currentTextId={store.customTextId}
          canCancel={Boolean(store.customText)}
          onselect={handleSelectCustomText}
          onclose={closeCustomTextSelector}
        />
      </div>
    {:else}
      <div
        class={[
          "my-auto py-1.5 sm:py-2 transition-[filter,opacity] duration-200",
          showFocusOverlay ? "blur-[3px] opacity-25 select-none pointer-events-none" : "",
        ].filter(Boolean).join(" ")}
      >
        <WordStream
          words={controller.words}
          currentWordIndex={controller.currentWordIndex}
          currentCharIndex={controller.currentCharIndex}
          caretStyle={store.caretStyle}
          mode={store.mode}
          isTyping={isRunning}
          fontSizePreset={store.fontSizePreset}
          visibleLines={store.visibleLines}
          smoothCaret={store.smoothCaret}
          highlightActiveWord={store.highlightActiveWord}
          tapeEnabled={store.tapeEnabled}
          tapeMode={store.tapeMode}
          tapeMargin={store.tapeMargin}
        />
      </div>
    {/if}

    <!-- Focus Lost Overlay (Monkeytype Style) -->
    {#if showFocusOverlay}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="absolute inset-0 z-30 flex items-center justify-center cursor-pointer select-none animate-fade-in"
        onclick={(e) => {
          e.stopPropagation();
          controller.focusInput();
        }}
      >
        <div
          class="flex items-center gap-2.5 font-mono text-sm sm:text-base text-tt-text-secondary hover:text-tt-text transition-colors duration-150 select-none"
        >
          <Cursor size={18} weight="fill" class="shrink-0 text-tt-text-secondary" />
          <span>{t("arena.clickToFocus")}</span>
        </div>
      </div>
    {/if}

    <!-- Bottom Card Footer: Refined Live Telemetry (WPM/CPM & ACC) -->
    {#if store.showLiveStats && (store.mode !== "custom" || Boolean(store.customText)) && !isSelectingCustomText}
      <LiveStats
        speed={controller.speedDisplay}
        accuracy={controller.accuracyDisplay}
        {isRunning}
      />
    {/if}
  </AppCard>

      <!-- Hand Guide Integrated Sub-Stage (Direct natural document flow below AppCard) -->
      {#if store.handGuideEnabled && handVisualState}
        <div class="w-full flex justify-center pointer-events-none transition-opacity duration-200 mt-2 sm:mt-2.5">
          <HandGuide
            visualState={handVisualState}
            mode={store.handGuideMode}
            style={store.handGuideStyle}
            legendStyle={store.handGuideLegendStyle}
            showHands={store.handGuideHands}
            size={store.handGuideSize}
          />
        </div>
      {/if}

      <!-- Keymap Visual (mutually exclusive with HandGuide) -->
      {#if store.keymapVisible}
        <div class="w-full flex justify-center pointer-events-none transition-opacity duration-200 mt-6 sm:mt-8 md:mt-10 relative z-10">
          <Keymap
            bind:this={keymapRef}
            layout={keymapLayout}
            mode={store.keymapMode}
            style={store.keymapStyle}
            legendStyle={store.keymapLegendStyle}
            showKeys={store.keymapShowKeys}
            size={store.keymapSize}
            nextKeyCode={keymapNextKeyCode}
            {isShiftActive}
          />
        </div>
      {/if}
    </div>
  </div>

  <!-- Bottom Navigation & Shortcuts Hint (Fixed-height quiet footer) -->
  <div
    class="w-full flex-shrink-0 text-center text-xs text-tt-text-secondary py-1.5 transition-opacity duration-150 {isRunning
      ? 'opacity-20 hover:opacity-100'
      : 'opacity-100'}"
  >
    {#if store.mode === "zen"}
      <span class="mr-1">
        {t("arena.hintPress")} <kbd
          class="px-1.5 py-0.5 bg-tt-surface-2 rounded-md text-tt-text font-mono border border-tt-separator text-[11px]"
          >Shift</kbd
        >
        +
        <kbd
          class="px-1.5 py-0.5 bg-tt-surface-2 rounded-md text-tt-text font-mono border border-tt-separator text-[11px]"
          >Enter</kbd
        > {t("arena.hintToFinishZen")} ·
      </span>
    {/if}
    {t("arena.hintPress")}
    <kbd
      class="px-1.5 py-0.5 bg-tt-surface-2 rounded-md text-tt-text font-mono border border-tt-separator text-[11px]"
      >Tab</kbd
    >
    +
    <kbd
      class="px-1.5 py-0.5 bg-tt-surface-2 rounded-md text-tt-text font-mono border border-tt-separator text-[11px]"
      >Enter</kbd
    >
    {t("arena.hintToRestart")} ·
    <kbd
      class="px-1.5 py-0.5 bg-tt-surface-2 rounded-md text-tt-text font-mono border border-tt-separator text-[11px]"
      >Esc</kbd
    > {t("arena.hintToAbort")}
  </div>
</div>
