/**
 * Persistent Cross-Route Fullscreen Manager (Tauri v2 Native Window + Web Fullscreen Fallback)
 *
 * Why this exists:
 * Browser DOM `document.documentElement.requestFullscreen()` automatically exits whenever
 * the user presses `Escape` (used in TypingArena to restart/abort a typing test), or when
 * focus/top-layer/cursor-hiding mutates during typing.
 *
 * By using Tauri v2's native OS window fullscreen (`getCurrentWindow().setFullscreen(...)`)
 * as the primary engine, fullscreen remains 100% locked and stable across all pages,
 * typing sessions, `Escape` presses, and route transitions, while still supporting
 * standard Web Fullscreen fallback in non-Tauri browser environments.
 */

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

class FullscreenController {
  isFullscreen = $state(false);
  private initialized = false;
  private desiredFullscreen = false;

  init(): () => void {
    if (typeof window === 'undefined' || this.initialized) {
      return () => {};
    }
    this.initialized = true;

    void this.syncState();

    const onDomFullscreenChange = () => {
      if (!isTauriRuntime() && typeof document !== 'undefined') {
        this.isFullscreen = Boolean(document.fullscreenElement);
      }
    };

    const onWindowResize = () => {
      void this.syncState();
    };

    document.addEventListener('fullscreenchange', onDomFullscreenChange);
    window.addEventListener('resize', onWindowResize);

    return () => {
      document.removeEventListener('fullscreenchange', onDomFullscreenChange);
      window.removeEventListener('resize', onWindowResize);
      this.initialized = false;
    };
  }

  async syncState(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (isTauriRuntime()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        const current = await win.isFullscreen();
        this.isFullscreen = current;
        this.desiredFullscreen = current;
        return current;
      } catch {
        // Fallback to DOM check below
      }
    }

    if (typeof document !== 'undefined') {
      const domFs = Boolean(document.fullscreenElement);
      this.isFullscreen = domFs || this.desiredFullscreen;
      return this.isFullscreen;
    }

    return false;
  }

  async setFullscreen(target: boolean): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    this.desiredFullscreen = target;

    if (isTauriRuntime()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        await win.setFullscreen(target);
        // If DOM fullscreen was active from an earlier fallback, exit it cleanly when leaving fullscreen
        if (!target && typeof document !== 'undefined' && document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }
        this.isFullscreen = target;
        return target;
      } catch {
        // Fallback to Web Fullscreen API if Tauri window call fails
      }
    }

    if (typeof document !== 'undefined') {
      try {
        if (target && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
          this.isFullscreen = true;
        } else if (!target && document.fullscreenElement) {
          await document.exitFullscreen();
          this.isFullscreen = false;
        } else {
          this.isFullscreen = target;
        }
      } catch {
        this.isFullscreen = Boolean(document.fullscreenElement);
      }
    }

    return this.isFullscreen;
  }

  async toggle(): Promise<boolean> {
    const current = await this.syncState();
    return this.setFullscreen(!current);
  }
}

export const fullscreenStore = new FullscreenController();
