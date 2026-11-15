<script lang="ts">
  /**
   * About & License Information Section
   * Modular sub-component adhering to UNIX Rule of Modularity & Rule of Separation.
   * Displays canonical Typing FreeX branding, AGPL-3.0 copyleft license, and core architecture stack.
   */

  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { AppCard, AppBadge, AppSectionHeader } from '#lib/shared/ui/index.js';
  import { Info, Keyboard, Scales, Cpu, ShieldCheck } from 'phosphor-svelte';

  const { t } = useI18n();

  const techBadges = [
    'Tauri v2',
    'Rust Core',
    'SvelteKit 3',
    'Svelte 5 Runes',
    'Skeleton UI v5',
    'Tailwind v4',
    'SQLite Local',
  ];
</script>

<div class="flex flex-col gap-3">
  <AppSectionHeader
    title={t('settings.about')}
    icon={Info}
  />

  <AppCard padding="p-6">
    <!-- Brand Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-surface-200-800">
      <div class="flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-xl bg-tt-primary/10 flex items-center justify-center text-tt-primary shrink-0 border border-tt-primary/20">
          <Keyboard class="w-6 h-6" />
        </div>
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h3 class="text-base font-bold text-tt-text tracking-wide">Typing FreeX</h3>
            <AppBadge variant="primary" size="sm" shape="pill">
              {t('settings.aboutVersion')}
            </AppBadge>
            <AppBadge variant="success" size="sm" shape="pill">
              <span class="flex items-center gap-1">
                <ShieldCheck class="w-3.5 h-3.5" />
                <span>{t('settings.aboutStatus')}</span>
              </span>
            </AppBadge>
          </div>
          <p class="text-xs text-tt-text-secondary mt-1 leading-relaxed">
            {t('settings.aboutDesc')}
          </p>
        </div>
      </div>
    </div>

    <!-- Details Grid: License & Core Architecture -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
      <!-- License Box -->
      <div class="rounded-lg bg-surface-100-900/60 p-4 border border-surface-200-800 flex flex-col justify-between">
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-xs font-semibold text-tt-text">
            <Scales class="w-4 h-4 text-tt-primary" />
            <span>{t('settings.aboutLicenseTitle')}</span>
          </div>
          <div class="text-xs font-medium text-tt-primary bg-tt-primary/10 px-2.5 py-1 rounded inline-block">
            {t('settings.aboutLicenseType')}
          </div>
          <p class="text-[11px] text-tt-text-secondary leading-relaxed">
            {t('settings.aboutLicenseDesc')}
          </p>
        </div>
      </div>

      <!-- Architecture Box -->
      <div class="rounded-lg bg-surface-100-900/60 p-4 border border-surface-200-800 flex flex-col justify-between">
        <div class="space-y-2.5">
          <div class="flex items-center gap-2 text-xs font-semibold text-tt-text">
            <Cpu class="w-4 h-4 text-tt-primary" />
            <span>{t('settings.aboutArchitectureTitle')}</span>
          </div>
          <p class="text-[11px] text-tt-text-secondary leading-relaxed">
            {t('settings.aboutArchitectureDesc')}
          </p>
          <div class="flex flex-wrap gap-1.5 pt-1">
            {#each techBadges as badge (badge)}
              <AppBadge variant="surface" size="sm" shape="pill">
                <span class="font-mono text-[10px]">{badge}</span>
              </AppBadge>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </AppCard>
</div>
