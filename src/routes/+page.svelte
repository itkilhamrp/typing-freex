<script lang="ts">
  import { profileStore } from '#lib/modules/profile/stores/profile.store.svelte.js';
  import type { Component } from 'svelte';

  let TypingArenaComponent = $state<Component | null>(null);

  $effect(() => {
    if (profileStore.hasActiveSession && !TypingArenaComponent) {
      import('#lib/modules/modes/classic/components/TypingArena.svelte')
        .then((mod) => {
          TypingArenaComponent = mod.default;
        })
        .catch(() => {
          TypingArenaComponent = null;
        });
    }
  });
</script>

{#if profileStore.hasActiveSession && TypingArenaComponent}
  <TypingArenaComponent />
{/if}

