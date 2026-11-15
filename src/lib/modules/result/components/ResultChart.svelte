<script lang="ts">
  import type { ResultTimelinePoint } from '../controllers/result.controller.svelte';
  import { useI18n } from '#lib/shared/stores/i18n.svelte.js';

  const { t } = useI18n();

  interface Props {
    data: ResultTimelinePoint[];
    unit?: string;
    height?: number;
  }

  let {
    data = [],
    unit = 'WPM',
    height = 220,
  }: Props = $props();

  let showWpm = $state(true);
  let showRaw = $state(true);
  let showErrors = $state(true);
  let hoveredIndex = $state<number | null>(null);

  const viewBoxWidth = 720;
  const viewBoxHeight = $derived(height);
  const padding = { top: 24, right: 36, bottom: 32, left: 44 };

  const plotWidth = $derived(viewBoxWidth - padding.left - padding.right);
  const plotHeight = $derived(viewBoxHeight - padding.top - padding.bottom);

  const totalErrors = $derived(data.reduce((sum, d) => sum + (d.errors || 0), 0));

  const maxSpeed = $derived.by(() => {
    if (data.length === 0) return 60;
    const maxWpm = Math.max(...data.map((d) => Math.max(d.wpm, d.rawWpm)));
    return Math.max(40, Math.ceil((maxWpm + 10) / 20) * 20);
  });

  const minSecond = $derived(data.length === 0 ? 0 : data[0]?.second ?? 0);
  const maxSecond = $derived(data.length === 0 ? 30 : data[data.length - 1]?.second ?? 30);

  const points = $derived.by(() => {
    if (data.length === 0) return [];
    const spanSec = Math.max(1, maxSecond - minSecond);
    const rangeSpeed = maxSpeed;

    return data.map((d, index) => {
      const xRatio = (d.second - minSecond) / spanSec;
      const x = padding.left + (data.length === 1 ? plotWidth / 2 : xRatio * plotWidth);

      const wpmRatio = Math.max(0, Math.min(1, d.wpm / rangeSpeed));
      const yWpm = padding.top + plotHeight - wpmRatio * plotHeight;

      const rawRatio = Math.max(0, Math.min(1, d.rawWpm / rangeSpeed));
      const yRaw = padding.top + plotHeight - rawRatio * plotHeight;

      return {
        index,
        second: d.second,
        wpm: d.wpm,
        rawWpm: d.rawWpm,
        errors: d.errors,
        x,
        yWpm,
        yRaw,
      };
    });
  });

  function buildSmoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0]!.x},${pts[0]!.y}`;

    let path = `M ${pts[0]!.x.toFixed(1)},${pts[0]!.y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1]!;
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1]!;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return path;
  }

  const wpmPathString = $derived.by(() => {
    if (!showWpm || points.length === 0) return '';
    return buildSmoothPath(points.map((p) => ({ x: p.x, y: p.yWpm })));
  });

  const rawPathString = $derived.by(() => {
    if (!showRaw || points.length === 0) return '';
    return buildSmoothPath(points.map((p) => ({ x: p.x, y: p.yRaw })));
  });

  const gradientId = 'result-chart-area-grad-' + Math.random().toString(36).slice(2, 8);

  const wpmAreaPath = $derived.by(() => {
    if (!showWpm || points.length === 0 || !wpmPathString) return '';
    const first = points[0]!;
    const last = points[points.length - 1]!;
    const bottom = padding.top + plotHeight;
    return `${wpmPathString} L ${last.x.toFixed(1)},${bottom} L ${first.x.toFixed(1)},${bottom} Z`;
  });

  const errorPoints = $derived(showErrors ? points.filter((p) => p.errors > 0) : []);

  const yTicks = $derived.by(() => {
    const steps = 4;
    const stepVal = maxSpeed / steps;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const val = Math.round(i * stepVal);
      const y = padding.top + plotHeight - (val / maxSpeed) * plotHeight;
      return { val, y };
    });
  });

  const xTicks = $derived.by(() => {
    if (points.length === 0) return [];
    const max = maxSecond;
    let step = 5;
    if (max <= 15) step = 2;
    else if (max <= 30) step = 5;
    else if (max <= 60) step = 10;
    else step = 15;

    const ticks: { second: number; x: number }[] = [];
    const span = Math.max(1, maxSecond - minSecond);

    for (let s = minSecond; s <= max; s += step) {
      const x = padding.left + ((s - minSecond) / span) * plotWidth;
      ticks.push({ second: s, x });
    }

    const lastTick = ticks[ticks.length - 1];
    if (!lastTick || max - lastTick.second >= step / 2) {
      ticks.push({
        second: max,
        x: padding.left + plotWidth,
      });
    }

    return ticks;
  });

  let svgContainer = $state<HTMLElement | null>(null);
  let cachedRect: DOMRect | null = null;
  let rafPending = false;

  function handlePointerMove(e: MouseEvent) {
    if (points.length === 0 || !svgContainer) return;
    const clientX = e.clientX;
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      if (!svgContainer) return;
      if (!cachedRect) {
        cachedRect = svgContainer.getBoundingClientRect();
      }
      const mouseX = clientX - cachedRect.left;
      const svgX = (mouseX / cachedRect.width) * viewBoxWidth;

      let closestIndex = 0;
      let minDiff = Infinity;
      for (let i = 0; i < points.length; i++) {
        const diff = Math.abs(points[i]!.x - svgX);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }

      hoveredIndex = closestIndex;
    });
  }

  function handlePointerLeave() {
    cachedRect = null;
    hoveredIndex = null;
  }

  const activePoint = $derived(hoveredIndex !== null ? points[hoveredIndex] ?? null : null);

  const tooltipStyle = $derived.by(() => {
    if (!activePoint) return '';
    const x = activePoint.x;
    let transform = 'translateX(-50%)';
    if (x > viewBoxWidth * 0.75) {
      transform = 'translateX(-105%)';
    } else if (x < viewBoxWidth * 0.25) {
      transform = 'translateX(5%)';
    }
    return `left: ${(x / viewBoxWidth) * 100}%; top: 8px; transform: ${transform};`;
  });
</script>

<div class="w-full select-none">
  <!-- Header / Interactive Legend -->
  <div class="flex flex-wrap items-center justify-between text-xs px-2 mb-2 select-none gap-2">
    <div class="flex items-center gap-3">
      <!-- WPM Toggle -->
      <button
        type="button"
        title={t('result.chartToggleNet', {
          action: showWpm ? t('result.chartActionHide') : t('result.chartActionShow'),
        })}
        class={[
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-[background-color,opacity,transform] duration-150 cursor-pointer active:scale-95',
          showWpm
            ? 'bg-tt-primary/10 border-tt-primary/30 text-tt-primary font-semibold'
            : 'opacity-40 border-tt-separator hover:opacity-70 text-tt-text-secondary line-through'
        ].join(' ')}
        onclick={() => showWpm = !showWpm}
      >
        <span class="w-2.5 h-2.5 rounded-full bg-tt-primary inline-block shrink-0 shadow-xs"></span>
        <span>{(unit || 'WPM').toLowerCase()}</span>
      </button>

      <!-- Raw WPM Toggle -->
      <button
        type="button"
        title={t('result.chartToggleRaw', {
          action: showRaw ? t('result.chartActionHide') : t('result.chartActionShow'),
        })}
        class={[
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-[background-color,opacity,transform] duration-150 cursor-pointer active:scale-95',
          showRaw
            ? 'bg-tt-surface-2 border-tt-separator text-tt-text font-semibold'
            : 'opacity-40 border-tt-separator hover:opacity-70 text-tt-text-secondary line-through'
        ].join(' ')}
        onclick={() => showRaw = !showRaw}
      >
        <span class="w-3.5 h-0 border-t-2 border-dashed border-tt-text-secondary inline-block shrink-0"></span>
        <span>{t('result.chartRawLabel')}</span>
      </button>

      <!-- Errors Toggle -->
      <button
        type="button"
        title={t('result.chartToggleErrors', {
          action: showErrors ? t('result.chartActionHide') : t('result.chartActionShow'),
        })}
        class={[
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-[background-color,opacity,transform] duration-150 cursor-pointer active:scale-95',
          showErrors
            ? 'bg-ios-red/10 border-ios-red/30 text-ios-red font-semibold'
            : 'opacity-40 border-tt-separator hover:opacity-70 text-tt-text-secondary line-through'
        ].join(' ')}
        onclick={() => showErrors = !showErrors}
      >
        <span class="font-bold text-xs leading-none">✕</span>
        <span>{t('result.chartErrorsLabel', { count: totalErrors })}</span>
      </button>
    </div>

    <!-- Quick hint -->
    <span class="text-[11px] text-tt-text-secondary/70 font-mono hidden sm:inline-block">
      {t('result.chartScrubHint')}
    </span>
  </div>

  <!-- Chart SVG Container -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={svgContainer}
    class="relative w-full overflow-hidden cursor-crosshair"
    onmousemove={handlePointerMove}
    onmouseleave={handlePointerLeave}
  >
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      class="w-full h-auto overflow-visible block"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--tt-primary, #007aff)" stop-opacity="0.32" />
          <stop offset="60%" stop-color="var(--tt-primary, #007aff)" stop-opacity="0.08" />
          <stop offset="100%" stop-color="var(--tt-primary, #007aff)" stop-opacity="0.0" />
        </linearGradient>
      </defs>

      <!-- Y Axis Gridlines and Labels -->
      <g class="grid-lines">
        {#each yTicks as tick (tick.val)}
          <line
            x1={padding.left}
            y1={tick.y}
            x2={padding.left + plotWidth}
            y2={tick.y}
            stroke="currentColor"
            class="text-tt-separator/40"
            stroke-dasharray={tick.val === 0 ? undefined : '3,3'}
            stroke-width="1"
          />
          <text
            x={padding.left - 8}
            y={tick.y + 3.5}
            text-anchor="end"
            class="text-[10px] fill-tt-text-secondary font-mono font-medium"
          >
            {tick.val}
          </text>
        {/each}
      </g>

      <!-- X Axis Labels -->
      <g class="x-ticks">
        {#each xTicks as tick (tick.second)}
          <text
            x={tick.x}
            y={padding.top + plotHeight + 18}
            text-anchor="middle"
            class="text-[10px] fill-tt-text-secondary font-mono"
          >
            {tick.second}s
          </text>
        {/each}
      </g>

      <!-- WPM Area Gradient Fill -->
      {#if showWpm && wpmAreaPath}
        <path
          d={wpmAreaPath}
          fill={`url(#${gradientId})`}
          class="pointer-events-none transition-opacity duration-200"
        />
      {/if}

      <!-- Raw WPM Curve (Dashed line) -->
      {#if showRaw && rawPathString}
        <path
          d={rawPathString}
          fill="none"
          stroke="currentColor"
          class="text-tt-text-secondary/60 transition-opacity duration-200"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-dasharray="4,4"
        />
      {/if}

      <!-- Net WPM Curve (Solid line) -->
      {#if showWpm && wpmPathString}
        <path
          d={wpmPathString}
          fill="none"
          stroke="var(--tt-primary, #007aff)"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="transition-opacity duration-200"
        />
      {/if}

      <!-- Error Markers (Red ✕ marks on timeline) -->
      {#if showErrors}
        <g class="error-markers pointer-events-none">
          {#each errorPoints as err (err.second)}
            <circle
              cx={err.x}
              cy={err.yWpm}
              r="7"
              class="fill-ios-red/25"
            />
            <circle
              cx={err.x}
              cy={err.yWpm}
              r="4.5"
              class="fill-ios-red stroke-tt-surface stroke-1.5"
            />
            <text
              x={err.x}
              y={err.yWpm + 3}
              text-anchor="middle"
              class="text-[7px] font-black fill-white"
            >
              ✕
            </text>
          {/each}
        </g>
      {/if}

      <!-- Active Tracking Crosshair Guide Line -->
      {#if activePoint}
        <g class="crosshair-guide pointer-events-none">
          <!-- Vertical Line -->
          <line
            x1={activePoint.x}
            y1={padding.top}
            x2={activePoint.x}
            y2={padding.top + plotHeight}
            stroke="currentColor"
            class="text-tt-primary/60"
            stroke-width="1.5"
            stroke-dasharray="3,3"
          />

          <!-- Raw WPM Focal Dot -->
          {#if showRaw}
            <circle
              cx={activePoint.x}
              cy={activePoint.yRaw}
              r="4"
              class="fill-tt-surface-2 stroke-tt-text stroke-2"
            />
          {/if}

          <!-- Net WPM Focal Dot -->
          {#if showWpm}
            <circle
              cx={activePoint.x}
              cy={activePoint.yWpm}
              r="5"
              class="fill-tt-primary stroke-tt-surface stroke-2 shadow-sm"
            />
          {/if}
        </g>
      {/if}
    </svg>

    <!-- Floating Liquid Glass Hover Tooltip (Positioned relative to SVG width) -->
    {#if activePoint}
      <div
        class="absolute pointer-events-none z-30 transition-[transform,left,top] duration-75 ease-out"
        style={tooltipStyle}
      >
        <div class="px-3 py-2 rounded-xl bg-tt-surface-elevated border border-[var(--tt-glass-border)] shadow-lg text-xs font-mono select-none space-y-1 min-w-[130px]">
          <!-- Second Stamp -->
          <div class="flex items-center justify-between text-[11px] pb-1 border-b border-tt-separator/40 font-semibold text-tt-text">
            <span>{t('result.chartTimeAxis', { second: activePoint.second })}</span>
            {#if activePoint.errors > 0}
              <span class="text-ios-red text-[10px] font-bold">
                {t('result.chartErrCount', { count: activePoint.errors })}
              </span>
            {/if}
          </div>

          <!-- Net WPM -->
          {#if showWpm}
            <div class="flex items-center justify-between gap-3 text-tt-primary font-bold">
              <span class="text-[11px] flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-tt-primary inline-block"></span>
                {unit}:
              </span>
              <span class="tabular-nums">{activePoint.wpm}</span>
            </div>
          {/if}

          <!-- Raw WPM -->
          {#if showRaw}
            <div class="flex items-center justify-between gap-3 text-tt-text-secondary">
              <span class="text-[11px] flex items-center gap-1">
                <span class="w-2 h-0.5 border-t border-dashed border-tt-text-secondary inline-block"></span>
                {t('result.chartRawTooltip')}
              </span>
              <span class="tabular-nums font-semibold">{activePoint.rawWpm}</span>
            </div>
          {/if}

          <!-- Errors Info if any -->
          {#if showErrors && activePoint.errors > 0}
            <div class="flex items-center justify-between gap-3 text-ios-red text-[11px] font-semibold pt-0.5">
              <span>{t('result.chartErrorsTooltip')}</span>
              <span class="tabular-nums font-bold">✕ {activePoint.errors}</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
