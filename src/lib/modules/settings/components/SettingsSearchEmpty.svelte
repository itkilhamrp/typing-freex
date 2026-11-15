<script lang="ts">
  import { MagnifyingGlass } from 'phosphor-svelte';

  interface Props {
    query: string;
    noResultsText: string;
  }

  let { query, noResultsText }: Props = $props();
</script>

<div
  class="flex flex-col items-center justify-center py-16 text-tt-text-secondary"
  role="status"
>
  <MagnifyingGlass class="w-10 h-10 mb-3 opacity-40" aria-hidden="true" />
  <p class="text-sm font-medium text-tt-text">{noResultsText}</p>
  <p class="text-xs mt-1 opacity-75">"{query}"</p>
</div>

