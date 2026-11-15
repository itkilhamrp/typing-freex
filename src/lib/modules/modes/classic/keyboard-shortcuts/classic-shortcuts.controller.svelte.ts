import { goto } from '$app/navigation';
import { page } from '$app/state';
import { typingActivity } from '#lib/shared/stores/typing-activity.svelte.js';
import { useTypingStore } from '#lib/modules/modes/classic/stores/typing.store.svelte.js';
import { CLASSIC_SHORTCUTS } from './logic/shortcut-registry.js';
import { matchShortcut } from './logic/shortcut-matcher.js';
import type { ShortcutContext } from './logic/shortcut-types.js';

/** Exact routes belonging to the Classic Mode flow */
const CLASSIC_ROUTES = new Set([
  '/',
  '/custom-text',
  '/analytics',
  '/history',
  '/profiles',
  '/settings',
]);

/** Route prefixes belonging to the Classic Mode flow (e.g. /result/[uuid], /profiles/achievements) */
const CLASSIC_ROUTE_PREFIXES = ['/result', '/custom-text/', '/profiles/'];

export function isClassicRoute(pathname: string): boolean {
  if (CLASSIC_ROUTES.has(pathname)) return true;
  return CLASSIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Checks whether the focused element is a user-facing form input/textarea/select,
 * explicitly excluding the hidden typing arena capture input (`data-typing-arena-input="true"`).
 */
function isRealFormInput(el: Element | null): boolean {
  if (!el) return false;
  if (el.hasAttribute('data-typing-arena-input')) {
    return false;
  }
  const tagName = el.tagName;
  if (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  ) {
    return true;
  }
  return Boolean((el as HTMLElement).isContentEditable);
}

function refocusArenaInputIfOnArena(pathname: string) {
  if (pathname !== '/' || typeof document === 'undefined') return;
  const arenaInput = document.querySelector<HTMLInputElement>(
    'input[data-typing-arena-input="true"]',
  );
  arenaInput?.focus();
}

/**
 * Classic Mode Keyboard-Driven Controller.
 * Orchestrates route guard, typing guard, focus guard, and zero-delay synchronous action dispatch.
 *
 * Strictly isolated from non-Classic routes (/welcome, /main-menu, /mode-select).
 */
export function useClassicShortcuts() {
  const store = useTypingStore();
  let isHelpOpen = $state(false);

  function getCurrentPathname(): string {
    return (
      page?.url?.pathname ??
      (typeof window !== 'undefined' ? window.location.pathname : '/')
    );
  }

  function toggleHelp() {
    const next = !isHelpOpen;
    isHelpOpen = next;
    if (!next) {
      refocusArenaInputIfOnArena(getCurrentPathname());
    }
  }

  function closeHelp() {
    if (!isHelpOpen) return;
    isHelpOpen = false;
    refocusArenaInputIfOnArena(getCurrentPathname());
  }

  function resolveContext(pathname: string): ShortcutContext {
    if (pathname === '/') {
      return typingActivity.isTyping ? 'arena-typing' : 'arena-idle';
    }
    if (pathname.startsWith('/result')) return 'result';
    return 'global';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.defaultPrevented) return;

    const pathname = getCurrentPathname();

    // Gate 1: Route Guard — Strictly active ONLY on Classic Mode routes
    if (!isClassicRoute(pathname)) {
      if (isHelpOpen) isHelpOpen = false;
      return;
    }

    // Gate 2: Typing Guard — Zero-latency passthrough while actively typing
    if (typingActivity.isTyping) {
      if (isHelpOpen) isHelpOpen = false;
      return;
    }

    // Modal Isolation Gate: When the Shortcuts Help Popup is open, intercept Escape/F1/Ctrl+/
    // in capture phase so Escape never leaks down to TypingArena to reset the test.
    if (isHelpOpen) {
      if (
        e.key === 'Escape' ||
        e.key === 'F1' ||
        ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === '/' || e.code === 'Slash'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        closeHelp();
        return;
      }

      const modalMatch = matchShortcut(e, CLASSIC_SHORTCUTS, 'global');
      if (modalMatch && modalMatch.id.startsWith('nav.')) {
        e.preventDefault();
        e.stopPropagation();
        dispatch(modalMatch.id, pathname);
        return;
      }

      // Block background typing while modal is open (allow Tab for accessibility inside modal)
      if (e.key !== 'Tab') {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }

    // Gate 3: Focus Guard — Bypass when user is typing into a real form/search input (except F1 for help)
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    if (isRealFormInput(active) && e.key !== 'F1') {
      return;
    }

    // Gate 4: Modal Guard — Bypass global shortcuts when a dialog/modal is open
    if (
      typeof document !== 'undefined' &&
      document.querySelector('[role="dialog"], [aria-modal="true"]')
    ) {
      return;
    }

    const context = resolveContext(pathname);
    const match = matchShortcut(e, CLASSIC_SHORTCUTS, context);

    if (!match) return;

    e.preventDefault();
    e.stopPropagation();

    dispatch(match.id, pathname);
  }

  function navigateSafe(targetPath: string, currentPathname: string) {
    if (isHelpOpen) {
      isHelpOpen = false;
    }
    if (currentPathname === targetPath) {
      refocusArenaInputIfOnArena(currentPathname);
      return;
    }
    void goto(targetPath);
  }

  function dispatch(actionId: string, currentPathname: string) {
    switch (actionId) {
      case 'help.toggle':
      case 'help.toggle.alt':
        toggleHelp();
        break;

      case 'nav.arena':
        navigateSafe('/', currentPathname);
        break;
      case 'nav.customText':
        navigateSafe('/custom-text', currentPathname);
        break;
      case 'nav.analytics':
        navigateSafe('/analytics', currentPathname);
        break;
      case 'nav.history':
        navigateSafe('/history', currentPathname);
        break;
      case 'nav.profiles':
        navigateSafe('/profiles', currentPathname);
        break;
      case 'nav.settings':
        navigateSafe('/settings', currentPathname);
        break;

      case 'arena.cycleMode':
        store.cycleMode();
        refocusArenaInputIfOnArena(currentPathname);
        break;
      case 'arena.cycleDifficulty':
        store.cycleDifficulty();
        refocusArenaInputIfOnArena(currentPathname);
        break;
      case 'arena.toggleHandGuide':
        store.toggleHandGuide();
        refocusArenaInputIfOnArena(currentPathname);
        break;
      case 'arena.toggleKeymap':
        store.toggleKeymap();
        refocusArenaInputIfOnArena(currentPathname);
        break;
      case 'arena.toggleTape':
        store.toggleTape();
        refocusArenaInputIfOnArena(currentPathname);
        break;
      case 'arena.toggleLiveStats':
        store.toggleShowLiveStats();
        refocusArenaInputIfOnArena(currentPathname);
        break;
      case 'arena.togglePunctuation':
        store.togglePunctuation();
        store.notifyArenaConfigChanged();
        refocusArenaInputIfOnArena(currentPathname);
        break;
      case 'arena.toggleNumbers':
        store.toggleNumbers();
        store.notifyArenaConfigChanged();
        refocusArenaInputIfOnArena(currentPathname);
        break;
    }
  }

  return {
    get isHelpOpen() {
      return isHelpOpen;
    },
    handleKeyDown,
    toggleHelp,
    closeHelp,
  };
}
