<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'value' | 'type' | 'oninput'> {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    class?: string;
    oninput?: (val: number) => void;
    onchange?: (event: Event) => void;
    [key: string]: unknown;
  }

  let {
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    class: className = '',
    oninput,
    onchange,
    ...rest
  }: Props = $props();

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const num = Number(target.value);
    value = num;
    oninput?.(num);
  }
</script>

<input
  type="range"
  value={value}
  min={Number(min ?? 0)}
  max={Number(max ?? 100)}
  step={Number(step ?? 1)}
  disabled={Boolean(disabled)}
  class={[
    'w-full h-2 bg-tt-surface-3 rounded-lg appearance-none cursor-pointer accent-tt-primary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity',
    className,
  ].filter(Boolean).join(' ')}
  oninput={handleInput}
  onchange={onchange}
  {...rest}
/>
