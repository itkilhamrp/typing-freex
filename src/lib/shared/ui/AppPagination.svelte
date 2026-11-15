<script lang="ts">
  import { CaretLeft, CaretRight } from "phosphor-svelte";
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";

  const { t } = useI18n();

  interface Props {
    currentPage?: number;
    totalItems: number;
    pageSize?: number;
    disabled?: boolean;
    showItemCount?: boolean;
    itemLabel?: string;
    onpageChange?: (page: number) => void;
  }

  let {
    currentPage = $bindable(1),
    totalItems,
    pageSize = 10,
    disabled = false,
    showItemCount = true,
    itemLabel,
    onpageChange,
  }: Props = $props();

  const resolvedItemLabel = $derived(itemLabel ?? t("common.defaultItemLabel"));

  const NAV_BTN =
    "h-8 px-2.5 rounded-xl border border-tt-separator bg-tt-surface-2 hover:bg-tt-surface-elevated text-tt-text disabled:opacity-30 disabled:pointer-events-none transition-[transform,background-color,border-color,box-shadow,opacity] duration-150 active:scale-[0.96] shadow-2xs flex items-center justify-center cursor-pointer";
  const PAGE_BASE =
    "min-w-[32px] h-8 px-2 rounded-xl text-xs font-mono transition-[transform,background-color,border-color,box-shadow,opacity] duration-150 flex items-center justify-center cursor-pointer";
  const PAGE_ACTIVE =
    "bg-tt-primary text-white font-bold shadow-xs border border-tt-primary/40";
  const PAGE_IDLE =
    "border border-tt-separator/70 bg-tt-surface-2 hover:bg-tt-surface-elevated text-tt-text-secondary hover:text-tt-text active:scale-[0.96] shadow-2xs font-medium";

  const totalPages = $derived(
    totalItems <= 0 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize)),
  );

  const startItem = $derived(
    totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1,
  );

  const endItem = $derived(Math.min(totalItems, currentPage * pageSize));

  type PageToken = number | "...";

  const visiblePages = $derived.by<PageToken[]>(() => {
    const total = totalPages;
    const current = currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", total];
    }

    if (current >= total - 3) {
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, "...", current - 1, current, current + 1, "...", total];
  });

  function setPage(targetPage: number) {
    if (disabled) return;
    const target = Math.max(1, Math.min(targetPage, totalPages));
    if (target !== currentPage) {
      currentPage = target;
      onpageChange?.(target);
    }
  }

  function prevPage() {
    setPage(currentPage - 1);
  }

  function nextPage() {
    setPage(currentPage + 1);
  }
</script>

<div
  class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-tt-separator/50 text-sm select-none"
>
  <!-- Telemetry Count -->
  {#if showItemCount}
    <div class="text-xs text-tt-text-secondary font-mono">
      {#if totalItems > 0}
        {t("common.showingRangePrefix")} <strong class="text-tt-text font-semibold tabular-nums"
          >{startItem}–{endItem}</strong
        >
        {t("common.showingRangeOf")}
        <strong class="text-tt-text font-semibold tabular-nums"
          >{totalItems}</strong
        >
        {resolvedItemLabel}
      {:else}
        {t("common.noItemsFound", { label: resolvedItemLabel })}
      {/if}
    </div>
  {:else}
    <div></div>
  {/if}

  <!-- Pagination Controls -->
  <div class="flex items-center gap-1 sm:gap-1.5">
    <!-- Previous Button -->
    <button
      type="button"
      class={NAV_BTN}
      disabled={currentPage <= 1 || disabled}
      aria-label={t("common.previousPage")}
      onclick={prevPage}
    >
      <CaretLeft class="w-4 h-4" />
    </button>

    <!-- Page Pills -->
    {#each visiblePages as item, idx (idx)}
      {#if item === "..."}
        <span
          class="px-1 text-xs text-tt-text-secondary select-none font-mono"
          aria-hidden="true"
        >
          …
        </span>
      {:else}
        <button
          type="button"
          class="{PAGE_BASE} {currentPage === item
            ? PAGE_ACTIVE
            : PAGE_IDLE}{disabled ? ' opacity-40 pointer-events-none' : ''}"
          {disabled}
          aria-current={currentPage === item ? "page" : undefined}
          onclick={() => setPage(item)}
        >
          {item}
        </button>
      {/if}
    {/each}

    <!-- Next Button -->
    <button
      type="button"
      class={NAV_BTN}
      disabled={currentPage >= totalPages || disabled}
      aria-label={t("common.nextPage")}
      onclick={nextPage}
    >
      <CaretRight class="w-4 h-4" />
    </button>
  </div>
</div>
