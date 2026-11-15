<script lang="ts">
  export interface BarDataPoint {
    label: string | number;
    value: number;
    color?: string;
  }

  interface Props {
    data: BarDataPoint[];
    color?: string;
    height?: number;
    unit?: string;
    maxVal?: number;
    class?: string;
    [key: string]: unknown;
  }

  let {
    data = [],
    color = '#ef4444',
    height = 120,
    unit = '',
    maxVal,
    class: className = '',
    ...rest
  }: Props = $props();

  const viewBoxWidth = 600;
  const viewBoxHeight = $derived(height);
  const padding = { top: 15, right: 15, bottom: 25, left: 30 };

  const plotWidth = $derived(viewBoxWidth - padding.left - padding.right);
  const plotHeight = $derived(viewBoxHeight - padding.top - padding.bottom);

  const maxValue = $derived.by(() => {
    if (maxVal !== undefined) return maxVal;
    if (data.length === 0) return 5;
    const max = Math.max(...data.map((d) => d.value));
    return max > 0 ? Math.ceil(max * 1.1) : 5;
  });

  const bars = $derived.by(() => {
    if (data.length === 0) return [];
    const count = data.length;
    const barSpacing = plotWidth / count;
    const barWidth = Math.max(3, barSpacing * 0.65);
    const maxV = maxValue;

    return data.map((d, i) => {
      const x = padding.left + i * barSpacing + (barSpacing - barWidth) / 2;
      const heightRatio = d.value / maxV;
      const h = Math.max(0, heightRatio * plotHeight);
      const y = padding.top + plotHeight - h;

      return {
        x,
        y,
        width: barWidth,
        height: h,
        value: d.value,
        label: String(d.label),
        color: d.color ?? color,
      };
    });
  });
</script>

<div class={['w-full select-none', className].filter(Boolean).join(' ')} {...rest}>
  <svg
    viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
    class="w-full h-auto overflow-visible"
  >
    <!-- Base baseline -->
    <line
      x1={padding.left}
      y1={padding.top + plotHeight}
      x2={padding.left + plotWidth}
      y2={padding.top + plotHeight}
      stroke="currentColor"
      class="text-tt-separator/50"
    />

    <!-- Y Max Axis label -->
    <text
      x={padding.left - 6}
      y={padding.top + 4}
      text-anchor="end"
      class="text-[10px] fill-tt-text-secondary font-mono font-medium"
    >
      {maxValue}
    </text>

    <!-- Bars -->
    {#each bars as b, i (i)}
      <g>
        <rect
          x={b.x}
          y={b.y}
          width={b.width}
          height={b.height}
          fill={b.color}
          rx="2"
          class="transition-opacity duration-150 hover:opacity-80"
        >
          <title>{b.label}: {b.value} {unit}</title>
        </rect>
        {#if bars.length <= 20}
          <text
            x={b.x + b.width / 2}
            y={padding.top + plotHeight + 14}
            text-anchor="middle"
            class="text-[9px] fill-tt-text-secondary font-mono"
          >
            {b.label}
          </text>
        {/if}
      </g>
    {/each}
  </svg>
</div>
