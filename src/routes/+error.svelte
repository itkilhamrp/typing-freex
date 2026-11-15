<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';

  const { t } = useI18n();

  async function handleBack() {
    try {
      await goto('/');
    } catch {
      window.location.href = '/';
    }
  }
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4 px-4 text-center">
  <div class="text-4xl font-bold font-mono text-ios-red tabular-nums">
    {page.status}
  </div>
  {#if page.error?.message}
    <p class="text-sm text-tt-text-secondary max-w-md">
      {page.error.message}
    </p>
  {/if}
  <button
    type="button"
    class="px-4 py-2 rounded-xl bg-tt-surface-elevated border border-tt-separator/60 text-tt-text hover:border-tt-primary transition-colors text-sm font-medium"
    onclick={handleBack}
  >
    {t('modeSelect.back')}
  </button>
</div>
