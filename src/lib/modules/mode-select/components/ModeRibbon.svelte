<script lang="ts">
  import './ModeRibbon.css';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import {
    Keyboard,
    BookOpen,
    GameController,
    LockSimple,
  } from 'phosphor-svelte';
  import AsciiArtCanvas from './AsciiArtCanvas.svelte';
  import type { ModeConfig, RibbonFocusState } from './mode-select-types';

  interface Props {
    config: ModeConfig;
    focusState: RibbonFocusState;
    onselect: () => void;
    onfocus: () => void;
  }

  let { config, focusState, onselect, onfocus }: Props = $props();

  const { t } = useI18n();
  const titleKey = $derived(`${config.i18nPrefix}.title`);
  const subtitleKey = $derived(`${config.i18nPrefix}.subtitle`);
  const descKey = $derived(`${config.i18nPrefix}.desc`);
</script>

<div
  class={[
    'mode-ribbon',
    `mode-ribbon--${config.key}`,
    `mode-ribbon--stagger-${config.stagger}`,
    !config.available ? 'mode-ribbon--locked' : '',
    focusState === 'focused' ? 'mode-ribbon--focused' : '',
    focusState === 'flash' ? 'mode-ribbon--flash' : '',
  ]
    .filter(Boolean)
    .join(' ')}
  style="--ribbon-accent: {config.accentVar};"
  role="button"
  tabindex={0}
  aria-label={t(titleKey)}
  onclick={onselect}
  onfocus={onfocus}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onselect();
    }
  }}
>
  <div class="mode-ribbon__body">
    <!-- Mode Info Section (Text + Icon + Status Badge) -->
    <div class="mode-ribbon__info">
      <div class="mode-ribbon__icon" aria-hidden="true">
        {#if config.key === 'classic' || config.key === 'arena'}
          <Keyboard class="w-7 h-7" weight="fill" />
        {:else if config.key === 'learning'}
          <BookOpen class="w-7 h-7" weight="fill" />
        {:else}
          <GameController class="w-7 h-7" weight="fill" />
        {/if}
      </div>

      <div class="mode-ribbon__text">
        <div class="mode-ribbon__header-line">
          <h2 class="mode-ribbon__title">{t(titleKey)}</h2>
          <div class="mode-ribbon__status">
            {#if config.available}
              <span class="mode-ribbon__badge mode-ribbon__badge--ready">
                {t('modeSelect.statusReady')}
              </span>
            {:else}
              <span class="mode-ribbon__badge mode-ribbon__badge--locked">
                <LockSimple class="w-3 h-3" aria-hidden="true" />
                {t('modeSelect.statusComingSoon')}
              </span>
            {/if}
          </div>
        </div>
        <p class="mode-ribbon__subtitle">{t(subtitleKey)}</p>
        <p class="mode-ribbon__desc">{t(descKey)}</p>
      </div>
    </div>

    <!-- ASCII Art Preview Box (positioned near the pointed chevron tip) -->
    <div class="mode-ribbon__preview">
      <AsciiArtCanvas mode={config.asciiMode} />
    </div>
  </div>

  <!-- Pointed Chevron Tip (Right for stagger-left, Left for stagger-right) -->
  <div class="mode-ribbon__chevron" aria-hidden="true"></div>
</div>

