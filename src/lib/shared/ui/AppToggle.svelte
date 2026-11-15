<script lang="ts">
  interface Props {
    checked?: boolean;
    disabled?: boolean;
    class?: string;
    onchange?: (event: Event) => void;
    [key: string]: unknown;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    class: className = '',
    onchange,
    ...rest
  }: Props = $props();

  function handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    checked = target.checked;
    onchange?.(e);
  }
</script>

<label
  class={[
    'relative inline-flex items-center cursor-pointer select-none',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className,
  ].filter(Boolean).join(' ')}
>
  <input
    type="checkbox"
    checked={Boolean(checked)}
    disabled={Boolean(disabled)}
    class="sr-only peer"
    onchange={handleChange}
    {...rest}
  />
  <div
    class="w-11 h-6 bg-tt-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-xs peer-checked:bg-tt-primary transition-colors"
  ></div>
</label>
