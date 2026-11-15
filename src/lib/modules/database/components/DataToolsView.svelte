<script lang="ts">
  import { onDestroy } from 'svelte';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useDatabaseToolsController } from '../controllers/database-tools.controller.svelte';
  import { AppPage, AppCard, AppButton } from '#lib/shared/ui/index.js';
  import {
    DownloadSimple,
    ShieldCheck,
    Export,
    CheckCircle,
    Warning,
    ShieldWarning,
    Copy,
    Check,
    Archive,
    HardDrive,
  } from 'phosphor-svelte';

  interface Props {
    embedded?: boolean;
  }

  let { embedded = false }: Props = $props();

  const { t } = useI18n();
  const dbTools = useDatabaseToolsController();

  let copiedHash = $state(false);
  let copyTimeoutId: ReturnType<typeof setTimeout> | null = null;

  async function copyHash(hash: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(hash);
        copiedHash = true;
        if (copyTimeoutId) clearTimeout(copyTimeoutId);
        copyTimeoutId = setTimeout(() => {
          copiedHash = false;
          copyTimeoutId = null;
        }, 2000);
      } catch (err) {
        console.warn('Failed to copy checksum to clipboard:', err);
      }
    }
  }

  onDestroy(() => {
    if (copyTimeoutId) {
      clearTimeout(copyTimeoutId);
      copyTimeoutId = null;
    }
  });
</script>

{#snippet dataToolsContent()}
  <!-- macOS Window Header: Typography & Status Pill -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tt-separator/50 pb-6">
    <div>
      <div class="flex items-center gap-2.5">
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-tt-text">
          {t('dataTools.title')}
        </h2>
        <span
          class="badge bg-tt-primary/15 text-tt-primary text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full inline-flex items-center"
        >
          SQLite WAL
        </span>
      </div>
      <p class="text-xs sm:text-sm text-tt-text-secondary mt-1 font-medium">
        {t('dataTools.subtitle')}
      </p>
    </div>

    <!-- Status Chrome Pill -->
    <div
      class="px-4 py-1.5 rounded-full border border-[var(--tt-glass-border)] bg-[var(--tt-glass-bg)] shadow-glass flex items-center gap-2 text-xs font-semibold self-start sm:self-auto shrink-0"
    >
      <span class="w-2 h-2 rounded-full bg-status-green"></span>
      <span class="text-tt-text font-bold">{t('dataTools.engineActive')}</span>
    </div>
  </div>

  <!-- Alert / Status Notifications -->
  {#if dbTools.exportError || dbTools.integrityError}
    <div
      class="p-4 rounded-2xl bg-status-red/10 border border-status-red/30 text-status-red flex items-center justify-between animate-fade-in text-xs font-semibold my-4"
    >
      <div class="flex items-center gap-2.5">
        <Warning class="w-4 h-4 shrink-0" />
        <span>{dbTools.exportError || dbTools.integrityError}</span>
      </div>
    </div>
  {/if}

  <!-- Symmetrical Content Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch my-6">
    <!-- Card 1: Backup & Export -->
    <AppCard padding="p-6" class="h-full flex flex-col justify-between border border-tt-separator/50 shadow-sm">
      <div>
        <!-- Card Header -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-tt-primary/10 border border-tt-primary/20 flex items-center justify-center text-tt-primary shrink-0 shadow-xs">
              <DownloadSimple class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-tt-text">{t('dataTools.exportTitle')}</h3>
              <p class="text-xs text-tt-text-secondary font-medium">{t('dataTools.exportSubtitle')}</p>
            </div>
          </div>
          <span
            class="badge bg-tt-surface-2 text-tt-text-secondary text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md inline-flex items-center"
          >
            VACUUM INTO
          </span>
        </div>

        <p class="text-xs text-tt-text-secondary leading-relaxed min-h-[36px]">
          {t('dataTools.exportDesc')}
        </p>

        <!-- Middle Inspection / Status Area -->
        <div class="my-4">
          {#if dbTools.exportResult}
            <div
              class="p-3.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green space-y-2 min-h-[110px] flex flex-col justify-between animate-fade-in"
            >
              <div class="flex items-center justify-between font-bold border-b border-status-green/20 pb-1.5">
                <span class="flex items-center gap-1.5">
                  <CheckCircle class="w-4 h-4 shrink-0" />
                  <span>{t('dataTools.exportSavedTitle')}</span>
                </span>
                <span class="text-[10px] font-mono uppercase bg-status-green/20 px-1.5 py-0.5 rounded">{t('dataTools.badgeReady')}</span>
              </div>
              <div class="space-y-1 text-[11px]">
                <div class="flex items-start justify-between gap-2">
                  <span class="text-tt-text-secondary shrink-0">{t('dataTools.fileLabel')}</span>
                  <span class="truncate font-mono text-tt-text" title={dbTools.exportResult.destination_path || dbTools.exportResult.file_name}>
                    {dbTools.exportResult.file_name}
                  </span>
                </div>
                {#if dbTools.exportResult.destination_path}
                  <div class="flex items-start justify-between gap-2 text-[10px]">
                    <span class="text-tt-text-secondary shrink-0">{t('dataTools.locationLabel')}</span>
                    <span class="truncate font-mono text-tt-text" title={dbTools.exportResult.destination_path}>
                      {dbTools.exportResult.destination_path}
                    </span>
                  </div>
                {/if}
                <div class="flex items-center justify-between gap-2 pt-1 border-t border-status-green/20">
                  <span class="text-tt-text-secondary shrink-0">SHA-256:</span>
                  <span class="truncate font-mono text-tt-text" title={dbTools.exportResult.sha256_hash}>
                    {dbTools.exportResult.sha256_hash.slice(0, 16)}...
                  </span>
                  <button
                    type="button"
                    class="p-1 rounded hover:bg-status-green/20 cursor-pointer transition-colors"
                    title={copiedHash ? t('dataTools.copiedTooltip') : t('dataTools.copyChecksumTooltip')}
                    onclick={() => dbTools.exportResult && copyHash(dbTools.exportResult.sha256_hash)}
                  >
                    {#if copiedHash}
                      <Check class="w-3.5 h-3.5 text-status-green" />
                    {:else}
                      <Copy class="w-3.5 h-3.5 text-status-green" />
                    {/if}
                  </button>
                </div>
              </div>
            </div>
          {:else}
            <div
              class="p-3.5 rounded-xl bg-tt-surface-2/50 border border-tt-separator/50 text-xs space-y-2 min-h-[110px] flex flex-col justify-center"
            >
              <div class="flex items-center gap-2 text-tt-text font-semibold">
                <Archive class="w-4 h-4 text-tt-primary shrink-0" />
                <span>{t('dataTools.destinationTitle')}</span>
              </div>
              <p class="text-[11px] text-tt-text-secondary leading-relaxed">
                {t('dataTools.destinationDesc')}
              </p>
              <div class="flex items-center gap-2 pt-1 text-[10px] text-tt-text-secondary font-mono">
                <span class="px-2 py-0.5 rounded bg-tt-surface border border-tt-separator/40 font-semibold">{t('dataTools.badgeAtomicVacuum')}</span>
                <span class="px-2 py-0.5 rounded bg-tt-surface border border-tt-separator/40 font-semibold">{t('dataTools.badgeSidecarHash')}</span>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Card Action Footer -->
      <div class="pt-2">
        <AppButton
          large
          rounded
          variant="primary"
          block
          disabled={dbTools.isExporting}
          onclick={dbTools.handleExport}
        >
          <Export class="w-4 h-4" />
          <span>{dbTools.isExporting ? t('common.loading') : t('dataTools.exportButton')}</span>
        </AppButton>
      </div>
    </AppCard>

    <!-- Card 2: Database Integrity Audit -->
    <AppCard padding="p-6" class="h-full flex flex-col justify-between border border-tt-separator/50 shadow-sm">
      <div>
        <!-- Card Header -->
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-tt-primary/10 border border-tt-primary/20 flex items-center justify-center text-tt-primary shrink-0 shadow-xs">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-tt-text">{t('dataTools.integrityTitle')}</h3>
              <p class="text-xs text-tt-text-secondary font-medium">{t('dataTools.integritySubtitle')}</p>
            </div>
          </div>
          <span
            class="badge bg-tt-surface-2 text-tt-text-secondary text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md inline-flex items-center"
          >
            PRAGMA check
          </span>
        </div>

        <p class="text-xs text-tt-text-secondary leading-relaxed min-h-[36px]">
          {t('dataTools.integrityDesc')}
        </p>

        <!-- Middle Inspection / Status Area -->
        <div class="my-4">
          {#if dbTools.integrityReport}
            <div
              class={[
                'p-3.5 rounded-xl border text-xs min-h-[110px] flex flex-col justify-between animate-fade-in',
                dbTools.integrityReport.ok ? 'bg-status-green/10 border-status-green/30 text-status-green' : 'bg-status-red/10 border-status-red/30 text-status-red'
              ].join(' ')}
            >
              <div>
                <div class={[
                  'flex items-center justify-between border-b pb-1.5 font-bold mb-2',
                  dbTools.integrityReport.ok ? 'border-status-green/20' : 'border-status-red/20',
                ].join(' ')}>
                  <span class="flex items-center gap-1.5">
                    {#if dbTools.integrityReport.ok}
                      <CheckCircle class="w-4 h-4 shrink-0 text-status-green" />
                    {:else}
                      <ShieldWarning class="w-4 h-4 shrink-0 text-status-red" />
                    {/if}
                    <span>{dbTools.integrityReport.ok ? t('dataTools.databaseHealthy') : t('dataTools.issuesDetected')}</span>
                  </span>
                  <span class={[
                    'text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold',
                    dbTools.integrityReport.ok ? 'bg-status-green/20 text-status-green' : 'bg-status-red/20 text-status-red',
                  ].join(' ')}>
                    {dbTools.integrityReport.ok ? t('dataTools.statusPassed') : t('dataTools.statusFailed')}
                  </span>
                </div>
                {#if dbTools.integrityReport.ok}
                  <div class="text-[11px] text-tt-text space-y-1">
                    <div class="flex items-center gap-1.5 text-status-green font-medium">
                      <span>✓</span> {t('dataTools.checkBtree')}
                    </div>
                    <div class="flex items-center gap-1.5 text-status-green font-medium">
                      <span>✓</span> {t('dataTools.checkFk')}
                    </div>
                    <div class="flex items-center gap-1.5 text-status-green font-medium">
                      <span>✓</span> {t('dataTools.checkWhitelist')}
                    </div>
                  </div>
                {:else}
                  <div class="text-[11px] space-y-1 mt-1 font-mono text-status-red">
                    {#each dbTools.integrityReport.errors as err, i (i)}
                      <div>• {err}</div>
                    {/each}
                  </div>
                {/if}
              </div>
              <div class="text-[10px] text-tt-text-secondary font-mono pt-1 text-right">
                {t('dataTools.auditComplete')}
              </div>
            </div>
          {:else}
            <div
              class="p-3.5 rounded-xl bg-tt-surface-2/50 border border-tt-separator/50 text-xs space-y-2 min-h-[110px] flex flex-col justify-center"
            >
              <div class="flex items-center gap-2 text-tt-text font-semibold">
                <HardDrive class="w-4 h-4 text-tt-primary shrink-0" />
                <span>{t('dataTools.diagnosticScopeTitle')}</span>
              </div>
              <p class="text-[11px] text-tt-text-secondary leading-relaxed">
                {t('dataTools.diagnosticScopeDesc')}
              </p>
              <div class="flex items-center gap-2 pt-1 text-[10px] text-tt-text-secondary font-mono">
                <span class="px-2 py-0.5 rounded bg-tt-surface border border-tt-separator/40 font-semibold">{t('dataTools.badgeBtreeCheck')}</span>
                <span class="px-2 py-0.5 rounded bg-tt-surface border border-tt-separator/40 font-semibold">{t('dataTools.badgeSchemaWhitelist')}</span>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Card Action Footer -->
      <div class="pt-2">
        <AppButton
          large
          rounded
          variant="tonal"
          block
          disabled={dbTools.isCheckingIntegrity}
          onclick={dbTools.runIntegrityCheck}
        >
          <ShieldCheck class="w-4 h-4 text-tt-primary" />
          <span>{dbTools.isCheckingIntegrity ? t('common.loading') : t('dataTools.runCheck')}</span>
        </AppButton>
      </div>
    </AppCard>
  </div>
{/snippet}

{#if embedded}
  <div class="w-full select-none space-y-6 animate-fade-in">
    {@render dataToolsContent()}
  </div>
{:else}
  <AppPage maxWidth="max-w-5xl" class="select-none space-y-6 animate-fade-in pb-12">
    {@render dataToolsContent()}
  </AppPage>
{/if}
