<script lang="ts">
  import TextEditorView from '#lib/modules/custom-text/components/TextEditorView.svelte';
  import { page } from '$app/state';

  let id = $derived(page?.params?.id ?? null);
</script>

<TextEditorView {id} />
