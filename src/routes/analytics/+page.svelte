<script lang="ts">
  import type { Component } from 'svelte';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';

  const { t } = useI18n();
  let ViewComponent = $state<Component | null>(null);
  let hasError = $state(false);

  function loadView() {
    hasError = false;
    import('#lib/modules/analytics/components/AnalyticsView.svelte')
      .then((mod) => {
        ViewComponent = mod.default;
      })
      .catch(() => {
        hasError = true;
      });
  }

  loadView();
</script>

{#if ViewComponent}
  <ViewComponent />
{:else if hasError}
  <div class="flex items-center justify-center min-h-[50vh] w-full">
    <button
      type="button"
      class="px-4 py-2 rounded-xl bg-tt-surface-elevated border border-tt-separator/60 text-tt-text-secondary hover:text-tt-text text-sm font-medium"
      onclick={loadView}
    >
      {t('modeSelect.back')}
    </button>
  </div>
{:else}
  <div class="flex items-center justify-center min-h-[50vh] w-full">
    <div class="w-8 h-8 rounded-full border-2 border-tt-primary/20 border-t-tt-primary animate-spin"></div>
  </div>
{/if}
