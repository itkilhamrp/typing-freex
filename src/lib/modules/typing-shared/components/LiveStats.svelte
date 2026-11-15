<script lang="ts">
  import { useTypingStore } from '#lib/modules/modes/classic/stores/typing.store.svelte.js';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { Lightning, Target } from 'phosphor-svelte';

  interface Props {
    speed: string;
    accuracy: string;
    isRunning?: boolean;
  }

  let { speed, accuracy, isRunning = false }: Props = $props();

  const store = useTypingStore();
  const { t } = useI18n();
</script>

<div
  class={[
    'flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 select-none border-t border-tt-separator/30 font-mono transition-opacity duration-300',
    isRunning ? 'opacity-35 hover:opacity-100' : 'opacity-100',
  ].join(' ')}
>
  <!-- Left: Speed & Accuracy Telemetry Pills -->
  <div class="flex items-center gap-2">
    <!-- Speed Telemetry Pill -->
    <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-tt-surface-2/60 border border-tt-separator/30 text-xs">
      <Lightning class="w-3.5 h-3.5 text-tt-primary shrink-0" weight="fill" />
      <span class="text-[11px] font-semibold text-tt-text-secondary uppercase tracking-wider">
        {store.speedUnit.toUpperCase()}
      </span>
      <span class="font-bold text-sm text-tt-primary tabular-nums">
        {speed}
      </span>
    </div>

    <!-- Accuracy Telemetry Pill -->
    <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-tt-surface-2/60 border border-tt-separator/30 text-xs">
      <Target class="w-3.5 h-3.5 text-ios-green shrink-0" weight="fill" />
      <span class="text-[11px] font-semibold text-tt-text-secondary uppercase tracking-wider">
        {t('arena.accuracy')}
      </span>
      <span class="font-bold text-sm text-tt-text tabular-nums">
        {accuracy}%
      </span>
    </div>
  </div>

  <!-- Right: Subtle Live Telemetry Status -->
  <div class="text-[11px] font-medium text-tt-text-secondary/70 flex items-center gap-1.5">
    <span
      class={[
        'inline-block w-1.5 h-1.5 rounded-full',
        isRunning ? 'bg-ios-green' : 'bg-tt-text-secondary/40',
      ].join(' ')}
    ></span>
    <span>{isRunning ? t('arena.statusLive') : t('arena.statusReady')}</span>
  </div>
</div>
