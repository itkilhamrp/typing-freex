<script lang="ts">
  import "../app.css";
  import { onMount, onDestroy } from "svelte";
  import SplashScreen from "#lib/shell/SplashScreen.svelte";
  import { settingsStore } from "#lib/modules/settings/stores/settings.store.svelte.js";
  import { profileStore } from "#lib/modules/profile/stores/profile.store.svelte.js";
  import { typingActivity } from "#lib/shared/stores/typing-activity.svelte.js";
  import { fullscreenStore } from "#lib/shared/utils/fullscreen.svelte.js";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import type { Component, Snippet } from "svelte";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  let AppShellComponent = $state<Component | null>(null);
  let ThemeFabComponent = $state<Component | null>(null);
  let isInitialized = $state(false);
  let initProgress = $state(0.15);
  let splashExiting = $state(false);
  let splashDone = $state(false);
  let cleanupFullscreen: (() => void) | null = null;

  function handleGlobalF11Keydown(e: KeyboardEvent) {
    if (e.key === "F11" || e.code === "F11") {
      e.preventDefault();
      e.stopPropagation();
      void fullscreenStore.toggle();
    }
  }

  onDestroy(() => {
    cleanupFullscreen?.();
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleGlobalF11Keydown, true);
    }
  });

  onMount(async () => {
    cleanupFullscreen = fullscreenStore.init();
    window.addEventListener("keydown", handleGlobalF11Keydown, true);
    const bootStart = performance.now();
    try {
      const settingsPromise = settingsStore.loadSettings().then(() => {
        initProgress = Math.max(initProgress, 0.55);
      });
      const profilesPromise = profileStore.loadProfiles().then(() => {
        initProgress = Math.max(initProgress, 0.85);
      });
      const appShellPromise = import("#lib/shell/AppShell.svelte").then((m) => {
        AppShellComponent = m.default;
      });
      const themeFabPromise = import("#lib/shared/ui/ThemeFab.svelte").then((m) => {
        ThemeFabComponent = m.default;
      });
      const mainMenuPrefetch = import(
        "#lib/modules/main-menu/components/MainMenuView.svelte"
      ).catch(() => null);

      await Promise.all([
        settingsPromise,
        profilesPromise,
        appShellPromise,
        themeFabPromise,
        mainMenuPrefetch,
      ]);
    } catch (e) {
      console.error("Failed to initialize app settings/profiles:", e);
    } finally {
      initProgress = 1;
      const currentPath: string = page?.url?.pathname ?? "/";
      if (!settingsStore.firstRunDone && currentPath !== "/welcome") {
        await goto("/welcome");
      } else if (settingsStore.firstRunDone && currentPath === "/welcome") {
        await goto("/main-menu");
      } else if (
        settingsStore.firstRunDone &&
        !profileStore.hasActiveSession &&
        currentPath !== "/main-menu" &&
        currentPath !== "/mode-select"
      ) {
        await goto("/main-menu");
      }
      isInitialized = true;

      const elapsed = performance.now() - bootStart;
      const remainingHold = Math.max(0, 650 - elapsed);
      setTimeout(() => {
        splashExiting = true;
        setTimeout(() => {
          splashDone = true;
        }, 180);
      }, remainingHold);
    }
  });

  // Keep html class and data-mode in sync with dark mode
  $effect(() => {
    if (typeof document !== "undefined") {
      if (settingsStore.isDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-mode", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-mode", "light");
      }
    }
  });

  // Session and route guards
  $effect(() => {
    if (!isInitialized) return;
    const currentPath: string = page?.url?.pathname ?? "/";

    // 1. If first run is not done and target is not welcome, redirect to welcome
    if (!settingsStore.firstRunDone && currentPath !== "/welcome") {
      goto("/welcome");
      return;
    }

    // 2. If first run is done, but visiting welcome, redirect to main-menu
    if (settingsStore.firstRunDone && currentPath === "/welcome") {
      goto("/main-menu");
      return;
    }

    // 3. If user does not have an active game session and not on main-menu or mode-select,
    // redirect to main-menu so they must pick a profile first.
    if (
      settingsStore.firstRunDone &&
      !profileStore.hasActiveSession &&
      currentPath !== "/main-menu" &&
      currentPath !== "/mode-select"
    ) {
      goto("/main-menu");
      return;
    }
  });
</script>

<div class="h-full w-full relative">
  {#if isInitialized && AppShellComponent}
    <AppShellComponent>
      {@render children?.()}
    </AppShellComponent>
    {#if ThemeFabComponent}
      <ThemeFabComponent dimmed={typingActivity.isTyping} />
    {/if}
  {/if}
  {#if !splashDone}
    <SplashScreen progress={initProgress} exiting={splashExiting} />
  {/if}
</div>
