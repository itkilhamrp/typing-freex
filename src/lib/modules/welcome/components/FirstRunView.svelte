<script lang="ts">
  import { goto } from '$app/navigation';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { useProfileStore } from '#lib/modules/profile/stores/profile.store.svelte.js';
  import { useSettingsStore } from '#lib/modules/settings/stores/settings.store.svelte.js';
  import {
    AppCard,
    AppButton,
    AppSegmented,
    AppSegmentedButton,
  } from '#lib/shared/ui/index.js';
  import { ShieldCheck, Sparkle, Globe, User } from 'phosphor-svelte';

  const { t, setLocale } = useI18n();
  const profileStore = useProfileStore();
  const settingsStore = useSettingsStore();

  let profileName = $state('Player 1');
  let selectedLocale = $state<'en' | 'id'>('en');
  let isSubmitting = $state(false);
  let errorMessage = $state('');

  function onLocaleSelect(loc: 'en' | 'id') {
    selectedLocale = loc;
    setLocale(loc);
  }

  async function handleComplete() {
    const name = profileName.trim();
    if (!name) {
      errorMessage = t('firstRun.errorEmptyName');
      return;
    }

    isSubmitting = true;
    errorMessage = '';

    try {
      // 1. Create initial profile
      await profileStore.createProfile(name);

      // 2. Persist app settings
      await settingsStore.updateSetting('ui.locale', selectedLocale);
      await settingsStore.updateSetting('app.first_run_done', 'true');

      // 3. Navigate to main menu (Launcher)
      try {
        await goto('/main-menu');
      } catch {
        window.location.href = '/main-menu';
      }
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : t('firstRun.errorCreateFailed');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="w-full min-h-full flex items-center justify-center p-6 select-none">
  <AppCard
    class="max-w-md w-full !m-0 shadow-2xl text-center animate-fade-in"
    padding="p-8 space-y-6"
  >
    <!-- Icon & Welcome Header -->
    <div class="flex justify-center">
      <div class="w-16 h-16 rounded-2xl bg-tt-primary/10 border border-tt-primary/20 flex items-center justify-center text-tt-primary">
        <Sparkle class="w-8 h-8" />
      </div>
    </div>

    <div class="space-y-2">
      <h1 class="text-2xl font-bold tracking-tight text-tt-text">{t('firstRun.welcome')}</h1>
      <p class="text-sm text-tt-text-secondary leading-relaxed">
        {t('firstRun.tagline')}
      </p>
    </div>

    <!-- Privacy & Offline Guarantee Badge -->
    <div class="flex items-center gap-2.5 p-3 rounded-xl bg-ios-green/10 border border-ios-green/20 text-ios-green text-xs text-left">
      <ShieldCheck class="w-5 h-5 shrink-0" />
      <span>{t('firstRun.privacyNotice')}</span>
    </div>

    <!-- Onboarding Form -->
    <div class="space-y-4 text-left">
      <!-- Profile Name Input -->
      <div>
        <label for="profile-name-input" class="block text-xs font-semibold uppercase tracking-wider text-tt-text-secondary mb-1.5 flex items-center gap-1.5">
          <User class="w-3.5 h-3.5" /> {t('profiles.nameLabel')}
        </label>
        <input
          id="profile-name-input"
          bind:value={profileName}
          type="text"
          maxlength="32"
          class="w-full px-3.5 py-2.5 rounded-xl border border-tt-separator bg-tt-surface-2 focus:outline-none focus:border-tt-primary text-sm font-medium transition-colors text-tt-text"
          placeholder={t('firstRun.profilePlaceholder')}
          onkeydown={(e) => {
            if (e.key === 'Enter') handleComplete();
          }}
        />
      </div>

      <!-- Language Choice -->
      <div>
        <span class="block text-xs font-semibold uppercase tracking-wider text-tt-text-secondary mb-1.5 flex items-center gap-1.5">
          <Globe class="w-3.5 h-3.5" /> {t('firstRun.chooseLanguage')}
        </span>
        <AppSegmented rounded strong class="w-full">
          <AppSegmentedButton
            active={selectedLocale === 'en'}
            onclick={() => onLocaleSelect('en')}
          >
            English
          </AppSegmentedButton>
          <AppSegmentedButton
            active={selectedLocale === 'id'}
            onclick={() => onLocaleSelect('id')}
          >
            Bahasa Indonesia
          </AppSegmentedButton>
        </AppSegmented>
      </div>
    </div>

    <!-- Error Message if any -->
    {#if errorMessage}
      <div class="text-xs text-ios-red font-medium">
        {errorMessage}
      </div>
    {/if}

    <!-- Action Button -->
    <div>
      <AppButton
        class="w-full py-3 text-sm font-bold shadow-lg"
        disabled={isSubmitting || !profileName.trim()}
        onclick={handleComplete}
      >
        {isSubmitting ? t('common.loading') : t('firstRun.getStarted')}
      </AppButton>
    </div>
  </AppCard>
</div>
