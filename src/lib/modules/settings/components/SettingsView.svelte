<script lang="ts">
  import { onMount } from 'svelte';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useSettingsStore } from '../stores/settings.store.svelte';
  import {
    AppPage,
    AppCard,
    AppSearchbar,
    AppSectionHeader,
    AppSegmented,
    AppSegmentedButton,
    AppToggle,
  } from '#lib/shared/ui/index.js';
  import {
    Gear,
    Database,
    Palette,
    Gauge,
  } from 'phosphor-svelte';
  import DataToolsView from '#lib/modules/database/components/DataToolsView.svelte';
  import KeymapSettingsSection from './KeymapSettingsSection.svelte';
  import HandGuideSettingsSection from './HandGuideSettingsSection.svelte';
  import TapeSettingsSection from './TapeSettingsSection.svelte';
  import AboutSettingsSection from './AboutSettingsSection.svelte';
  import SoundSettingsSection from '#lib/modules/typing-sound/components/SoundSettingsSection.svelte';
  import SettingsSearchEmpty from './SettingsSearchEmpty.svelte';
  import { filterSettings } from '../logic/settings-search.js';
  import { SETTINGS_ITEMS, SETTINGS_SECTIONS } from '../logic/settings-registry.js';

  const { t, setLocale: applyLocale } = useI18n();
  const settingsStore = useSettingsStore();

  let activeTab = $state<'general' | 'database'>('general');
  let searchQuery = $state('');

  const filterResult = $derived.by(() =>
    filterSettings(searchQuery, SETTINGS_ITEMS, SETTINGS_SECTIONS, t)
  );

  function isSectionVisible(sectionId: string): boolean {
    return filterResult.visibleSectionIds.has(sectionId);
  }

  function isItemVisible(itemId: string): boolean {
    return filterResult.matchedItemIds.has(itemId);
  }

  onMount(() => {
    settingsStore.loadSettings();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'database' || tab === 'data') {
        activeTab = 'database';
      }
    }
  });

  function switchTab(tab: 'general' | 'database') {
    activeTab = tab;
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  }

  function setLocale(loc: 'en' | 'id') {
    settingsStore.updateSetting('ui.locale', loc);
    applyLocale(loc);
  }

  function setSpeedUnit(unit: 'wpm' | 'cpm') {
    settingsStore.updateSetting('test.speed_unit', unit);
  }

  function setCaretStyle(style: 'line' | 'block' | 'underline' | 'outline') {
    settingsStore.updateSetting('test.caret_style', style);
  }

  function toggleBackspaceThroughWords(val: boolean) {
    settingsStore.updateSetting('test.backspace_through_words', val ? 'true' : 'false');
  }

  function toggleForgivingAccuracy(val: boolean) {
    settingsStore.updateSetting('test.forgiving_accuracy', val ? 'true' : 'false');
  }
</script>

<AppPage maxWidth="max-w-5xl" class="select-none space-y-6 animate-fade-in pb-12">
  <!-- Header with Segmented Navigation -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tt-separator/50 pb-5">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-tt-text">{t('settings.title')}</h1>
      <p class="text-sm text-tt-text-secondary mt-1">
        {t('settings.subtitle')}
      </p>
    </div>

    <!-- Segmented Tab Switcher -->
    <AppSegmented rounded strong class="w-full sm:w-80 shrink-0">
      <AppSegmentedButton
        active={activeTab === 'general'}
        onclick={() => switchTab('general')}
      >
        <div class="flex items-center justify-center gap-1.5">
          <Gear class="w-3.5 h-3.5" />
          <span>{t('settings.tabGeneral')}</span>
        </div>
      </AppSegmentedButton>
      <AppSegmentedButton
        active={activeTab === 'database'}
        onclick={() => switchTab('database')}
      >
        <div class="flex items-center justify-center gap-1.5">
          <Database class="w-3.5 h-3.5" />
          <span>{t('settings.tabDatabase')}</span>
        </div>
      </AppSegmentedButton>
    </AppSegmented>
  </div>

  <!-- Tab 1: General Preferences -->
  {#if activeTab === 'general'}
    <div class="space-y-6 animate-fade-in">
      <!-- Real-time Settings Search Bar -->
      <AppSearchbar
        bind:value={searchQuery}
        placeholder={t('settings.search.placeholder')}
        onclear={() => {
          searchQuery = '';
        }}
      />

      {#if isSectionVisible('appearance')}
        <!-- Appearance Section -->
        <div class="flex flex-col gap-3">
          <AppSectionHeader
            title={t('settings.appearance')}
            icon={Palette}
          />

          <AppCard padding="p-4 sm:p-5">
            <div class="space-y-5">
              <!-- Interface Language -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div class="font-semibold text-sm text-tt-text">{t('settings.interfaceLanguage')}</div>
                  <div class="text-xs text-tt-text-secondary">{t('settings.interfaceLanguageDesc')}</div>
                </div>
                <AppSegmented rounded strong class="w-full sm:w-72 sm:shrink-0">
                  <AppSegmentedButton
                    active={settingsStore.locale === 'en'}
                    onclick={() => setLocale('en')}
                  >
                    English
                  </AppSegmentedButton>
                  <AppSegmentedButton
                    active={settingsStore.locale === 'id'}
                    onclick={() => setLocale('id')}
                  >
                    Bahasa Indonesia
                  </AppSegmentedButton>
                </AppSegmented>
              </div>
            </div>
          </AppCard>
        </div>
      {/if}

      {#if isSectionVisible('engine')}
        <!-- Arena Preferences -->
        <div class="flex flex-col gap-3">
          <AppSectionHeader
            title={t('settings.engineAndUnits')}
            icon={Gauge}
          />

          <AppCard padding="p-4 sm:p-5">
            <div class="divide-y divide-tt-separator/40">
              {#if isItemVisible('speed_unit')}
                <!-- Speed Unit Toggle -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-5 first:pt-0 last:pb-0">
                  <div>
                    <div class="font-semibold text-sm text-tt-text">{t('settings.speedUnit')}</div>
                    <div class="text-xs text-tt-text-secondary">{t('settings.speedUnitDesc')}</div>
                  </div>
                  <AppSegmented rounded strong class="w-full sm:w-72 sm:shrink-0">
                    <AppSegmentedButton
                      active={settingsStore.speedUnit === 'wpm'}
                      onclick={() => setSpeedUnit('wpm')}
                    >
                      {t('unit.wpm')}
                    </AppSegmentedButton>
                    <AppSegmentedButton
                      active={settingsStore.speedUnit === 'cpm'}
                      onclick={() => setSpeedUnit('cpm')}
                    >
                      {t('unit.cpm')}
                    </AppSegmentedButton>
                  </AppSegmented>
                </div>
              {/if}

              {#if isItemVisible('caret_style')}
                <!-- Caret Style -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-5 first:pt-0 last:pb-0">
                  <div>
                    <div class="font-semibold text-sm text-tt-text">{t('settings.caretStyle')}</div>
                    <div class="text-xs text-tt-text-secondary">{t('settings.caretStyleDesc')}</div>
                  </div>
                  <AppSegmented rounded strong class="w-full sm:w-72 sm:shrink-0">
                    {#each ['line', 'block', 'underline', 'outline'] as const as st (st)}
                      <AppSegmentedButton
                        active={settingsStore.caretStyle === st}
                        class="capitalize"
                        onclick={() => setCaretStyle(st)}
                      >
                        {st}
                      </AppSegmentedButton>
                    {/each}
                  </AppSegmented>
                </div>
              {/if}

              {#if isItemVisible('backspace_through_words')}
                <!-- Backspace Across Words -->
                <div class="flex items-center justify-between py-5 first:pt-0 last:pb-0">
                  <div>
                    <div class="font-semibold text-sm text-tt-text">{t('settings.backspaceThroughWords')}</div>
                    <div class="text-xs text-tt-text-secondary">{t('settings.backspaceThroughWordsDesc')}</div>
                  </div>
                  <AppToggle
                    checked={settingsStore.backspaceThroughWords}
                    onchange={(e) => {
                      const target = e.target as HTMLInputElement;
                      toggleBackspaceThroughWords(target.checked);
                    }}
                  />
                </div>
              {/if}

              {#if isItemVisible('forgiving_accuracy')}
                <!-- Forgiving Accuracy -->
                <div class="flex items-center justify-between py-5 first:pt-0 last:pb-0">
                  <div>
                    <div class="font-semibold text-sm text-tt-text">{t('settings.forgivingAccuracy')}</div>
                    <div class="text-xs text-tt-text-secondary">{t('settings.forgivingAccuracyDesc')}</div>
                  </div>
                  <AppToggle
                    checked={settingsStore.forgivingAccuracy}
                    onchange={(e) => {
                      const target = e.target as HTMLInputElement;
                      toggleForgivingAccuracy(target.checked);
                    }}
                  />
                </div>
              {/if}
            </div>
          </AppCard>
        </div>
      {/if}

      {#if isSectionVisible('sound')}
        <!-- Sound Section -->
        <SoundSettingsSection />
      {/if}

      {#if isSectionVisible('tape')}
        <!-- Tape Mode Section -->
        <TapeSettingsSection />
      {/if}

      {#if isSectionVisible('hand_guide')}
        <!-- Hand Guide & Assistance Section -->
        <HandGuideSettingsSection />
      {/if}

      {#if isSectionVisible('keymap')}
        <!-- Keymap Section -->
        <KeymapSettingsSection />
      {/if}

      {#if isSectionVisible('about')}
        <!-- About & License Section -->
        <AboutSettingsSection />
      {/if}

      {#if filterResult.isEmpty && searchQuery}
        <SettingsSearchEmpty
          query={searchQuery}
          noResultsText={t('settings.search.noResults')}
        />
      {/if}
    </div>
  {:else}
    <!-- Tab 2: Database & Data Tools -->
    <div class="animate-fade-in">
      <DataToolsView embedded={true} />
    </div>
  {/if}
</AppPage>
