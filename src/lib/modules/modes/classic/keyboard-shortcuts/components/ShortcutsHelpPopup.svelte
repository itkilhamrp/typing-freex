<script lang="ts">
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';
  import { AppButton, AppDialog } from '#lib/shared/ui/index.js';
  import { CLASSIC_SHORTCUTS } from '../logic/shortcut-registry.js';
  import { formatShortcutKeyTokens } from '../logic/shortcut-matcher.js';
  import type {
    ShortcutCategory,
    ShortcutDefinition,
  } from '../logic/shortcut-types.js';

  interface Props {
    isOpen?: boolean;
    onclose?: () => void;
  }

  let { isOpen = false, onclose }: Props = $props();

  const { t } = useI18n();

  interface CategoryGroup {
    readonly id: ShortcutCategory;
    readonly titleKey: string;
    readonly items: readonly ShortcutDefinition[];
  }

  const CATEGORY_META: readonly {
    id: ShortcutCategory;
    titleKey: string;
  }[] = [
    { id: 'navigation', titleKey: 'shortcuts.categoryNavigation' },
    { id: 'arena', titleKey: 'shortcuts.categoryArena' },
    { id: 'typing', titleKey: 'shortcuts.categoryTyping' },
    { id: 'result', titleKey: 'shortcuts.categoryResult' },
    { id: 'app', titleKey: 'shortcuts.categoryApp' },
  ];

  const groupedShortcuts = $derived.by<CategoryGroup[]>(() => {
    return CATEGORY_META.map((meta) => ({
      id: meta.id,
      titleKey: meta.titleKey,
      items: CLASSIC_SHORTCUTS.filter((s) => s.category === meta.id),
    })).filter((group) => group.items.length > 0);
  });
</script>

<AppDialog opened={isOpen} size="lg" onclose={onclose}>
  {#snippet titleSlot()}
    <div class="flex items-center justify-between w-full gap-3">
      <div class="flex items-center gap-2.5">
        <svg
          class="w-5 h-5 text-tt-primary shrink-0"
          viewBox="0 0 256 256"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M224,48H32A24,24,0,0,0,8,72V184a24,24,0,0,0,24,24H224a24,24,0,0,0,24-24V72A24,24,0,0,0,224,48Zm8,136a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8H224a8,8,0,0,1,8,8ZM64,104a8,8,0,0,1,8-8H80a8,8,0,0,1,0,16H72A8,8,0,0,1,64,104Zm40,0a8,8,0,0,1,8-8h8a8,8,0,0,1,0,16h-8A8,8,0,0,1,104,104Zm40,0a8,8,0,0,1,8-8h8a8,8,0,0,1,0,16h-8A8,8,0,0,1,144,104Zm40,0a8,8,0,0,1,8-8h8a8,8,0,0,1,0,16h-8A8,8,0,0,1,184,104ZM56,136a8,8,0,0,1,8-8H72a8,8,0,0,1,0,16H64A8,8,0,0,1,56,136Zm32,0a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H96A8,8,0,0,1,88,136Zm96,0a8,8,0,0,1,8-8h8a8,8,0,0,1,0,16h-8A8,8,0,0,1,184,136Z" />
        </svg>
        <span>{t('shortcuts.title')}</span>
      </div>
      <button
        type="button"
        onclick={onclose}
        aria-label={t('arena.cancel')}
        class="h-9 w-9 flex items-center justify-center rounded-xl text-tt-text-secondary hover:text-tt-text hover:bg-tt-surface-2 transition-colors cursor-pointer"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 256 256"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
        </svg>
      </button>
    </div>
  {/snippet}

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 py-1">
    {#each groupedShortcuts as group (group.id)}
      <section
        aria-labelledby="shortcut-group-{group.id}"
        class="rounded-xl bg-tt-surface p-3.5 border border-tt-separator/40 flex flex-col gap-2.5"
      >
        <h4
          id="shortcut-group-{group.id}"
          class="text-xs font-bold uppercase tracking-wider text-tt-text-secondary border-b border-tt-separator/30 pb-1.5"
        >
          {t(group.titleKey)}
        </h4>

        <ul class="space-y-2">
          {#each group.items as item (item.id)}
            {@const keyTokens = formatShortcutKeyTokens(item.keys)}
            <li class="flex items-center justify-between gap-3 py-0.5">
              <span class="text-sm text-tt-text leading-snug">
                {t(item.i18nKey)}
              </span>

              <span class="inline-flex items-center gap-1 shrink-0" aria-label={keyTokens.join(' + ')}>
                {#each keyTokens as token, idx (`${item.id}-${idx}-${token}`)}
                  {#if idx > 0}
                    <span class="text-xs text-tt-text-secondary select-none" aria-hidden="true">+</span>
                  {/if}
                  <kbd
                    class="px-2 py-0.5 text-center text-xs font-mono font-semibold rounded-md bg-tt-surface-2 text-tt-text border border-tt-separator"
                  >
                    {token}
                  </kbd>
                {/each}
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>

  {#snippet buttonsSlot()}
    <div class="flex items-center justify-between w-full gap-3">
      <span class="text-xs text-tt-text-secondary">
        {t('shortcuts.hintFooter', { key: 'Esc / F1' })}
      </span>
      <AppButton variant="tonal" size="small" onclick={onclose}>
        {t('arena.cancel')}
      </AppButton>
    </div>
  {/snippet}
</AppDialog>
