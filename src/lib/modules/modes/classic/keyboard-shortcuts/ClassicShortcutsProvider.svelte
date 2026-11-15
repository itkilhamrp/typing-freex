<script lang="ts">
  import type { Component } from 'svelte';
  import { useClassicShortcuts } from './classic-shortcuts.controller.svelte.js';

  const shortcuts = useClassicShortcuts();
  let HelpPopupComponent = $state<Component<{ isOpen?: boolean; onclose?: () => void }> | null>(null);

  $effect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      shortcuts.handleKeyDown(e);
    };
    window.addEventListener('keydown', handler, true);
    return () => {
      window.removeEventListener('keydown', handler, true);
    };
  });

  $effect(() => {
    if (shortcuts.isHelpOpen && !HelpPopupComponent) {
      import('./components/ShortcutsHelpPopup.svelte')
        .then((m) => {
          HelpPopupComponent = m.default;
        })
        .catch(() => {
          HelpPopupComponent = null;
        });
    }
  });
</script>

{#if HelpPopupComponent}
  <HelpPopupComponent
    isOpen={shortcuts.isHelpOpen}
    onclose={shortcuts.closeHelp}
  />
{/if}
