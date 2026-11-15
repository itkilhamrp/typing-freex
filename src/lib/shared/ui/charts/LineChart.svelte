<script lang="ts">
  import { useI18n } from "#lib/shared/stores/i18n.svelte.js";

  const { t } = useI18n();

  export interface DataPoint {
    x: number | string;
    y: number;
    secondaryY?: number;
    label?: string;
    sublabel?: string;
  }

  interface Props {
    data: DataPoint[];
    color?: string;
    secondaryColor?: string;
    primaryLabel?: string;
    secondaryLabel?: string;
    height?: number;
    showArea?: boolean;
    showPoints?: boolean;
    showLegend?: boolean;
    interactive?: boolean;
    smooth?: boolean;
    unit?: string;
    minY?: number;
    maxY?: number;
    class?: string;
    [key: string]: unknown;
  }

  let {
    data = [],
    color = "#007aff",
    secondaryColor = "#8e8e93",
    primaryLabel = "",
    secondaryLabel,
    height = 170,
    showArea = true,
    showPoints = false,
    showLegend = true,
    interactive = true,
    smooth = true,
    unit = "",
    minY,
    maxY,
    class: className = "",
    ...rest
  }: Props = $props();

  let showPrimary = $state(true);
  let showSecondary = $state(true);
  let hoveredIndex = $state<number | null>(null);
  let svgContainer: HTMLElement | undefined;

  const LEGEND_BTN =
    "flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] transition-[background-color,opacity,transform] duration-150 cursor-pointer active:scale-95";
  const LEGEND_ON =
    "bg-tt-surface-2 border-tt-separator font-semibold text-tt-text";
  const LEGEND_OFF =
    "opacity-40 border-tt-separator hover:opacity-70 text-tt-text-secondary line-through";

  const viewBoxWidth = 640;
  const viewBoxHeight = $derived(height);
  const padding = { top: 20, right: 28, bottom: 28, left: 40 };

  const plotWidth = $derived(viewBoxWidth - padding.left - padding.right);
  const plotHeight = $derived(viewBoxHeight - padding.top - padding.bottom);

  const hasSecondaryData = $derived(
    data.some((d) => d.secondaryY !== undefined),
  );

  // Single pass, no temporary arrays, no spread into Math.min/max.
  const extent = $derived.by(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const d of data) {
      if (d.y < lo) lo = d.y;
      if (d.y > hi) hi = d.y;
      const s = d.secondaryY;
      if (s !== undefined) {
        if (s < lo) lo = s;
        if (s > hi) hi = s;
      }
    }
    return { lo, hi };
  });

  const computedMinY = $derived(
    minY !== undefined
      ? minY
      : data.length === 0
        ? 0
        : Math.max(0, Math.floor(extent.lo * 0.9)),
  );

  const computedMaxY = $derived(
    maxY !== undefined
      ? maxY
      : data.length === 0
        ? 100
        : Math.ceil(extent.hi * 1.1) || 10,
  );

  const points = $derived.by(() => {
    if (data.length === 0) return [];
    const minVal = computedMinY;
    const maxVal = computedMaxY;
    const rangeY = maxVal - minVal || 1;
    const count = data.length;
    const stepX = count > 1 ? plotWidth / (count - 1) : 0;

    return data.map((d, i) => {
      const x = padding.left + (count === 1 ? plotWidth / 2 : i * stepX);
      const yRatio = (d.y - minVal) / rangeY;
      const y = padding.top + plotHeight - yRatio * plotHeight;

      let ySecondary: number | undefined;
      if (d.secondaryY !== undefined) {
        const secRatio = (d.secondaryY - minVal) / rangeY;
        ySecondary = padding.top + plotHeight - secRatio * plotHeight;
      }

      return {
        index: i,
        x,
        y,
        ySecondary,
        value: d.y,
        secondaryValue: d.secondaryY,
        label: d.label ?? String(d.x),
        sublabel: d.sublabel,
      };
    });
  });

  function buildSmoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length === 0) return "";
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

  function buildPolylinePath(pts: { x: number; y: number }[]): string {
    let path = "";
    for (let i = 0; i < pts.length; i++) {
      path += `${i === 0 ? "M" : " L"} ${pts[i]!.x.toFixed(1)},${pts[i]!.y.toFixed(1)}`;
    }
    return path;
  }

  const primaryPathString = $derived.by(() => {
    const pts = points;
    if (!showPrimary || pts.length === 0) return "";
    return smooth ? buildSmoothPath(pts) : buildPolylinePath(pts);
  });

  const secondaryPathString = $derived.by(() => {
    const pts = points;
    if (!showSecondary || pts.length === 0 || !hasSecondaryData) return "";
    const validPts = pts
      .filter((p) => p.ySecondary !== undefined)
      .map((p) => ({ x: p.x, y: p.ySecondary! }));
    if (validPts.length === 0) return "";
    return smooth ? buildSmoothPath(validPts) : buildPolylinePath(validPts);
  });

  const gradientId =
    "line-chart-grad-" + Math.random().toString(36).slice(2, 9);

  const areaString = $derived.by(() => {
    const pts = points;
    const primPath = primaryPathString;
    if (!showArea || !showPrimary || pts.length === 0 || !primPath) return "";
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    const bottom = padding.top + plotHeight;
    return `${primPath} L ${last.x.toFixed(1)},${bottom} L ${first.x.toFixed(1)},${bottom} Z`;
  });

  const yTicks = $derived.by(() => {
    const steps = 3;
    const minVal = computedMinY;
    const maxVal = computedMaxY;
    const range = maxVal - minVal;
    const stepVal = range / steps;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const val = Math.round(minVal + i * stepVal);
      const y =
        padding.top + plotHeight - ((val - minVal) / (range || 1)) * plotHeight;
      return { val, y };
    });
  });

  const xTicks = $derived.by(() => {
    const pts = points;
    if (pts.length === 0) return [];
    const count = pts.length;
    if (count <= 10) return pts;

    const step = Math.ceil(count / 6);
    const result: typeof pts = [];
    for (let i = 0; i < count; i += step) {
      result.push(pts[i]!);
    }
    const last = pts[count - 1]!;
    if (result[result.length - 1]?.index !== last.index) {
      result.push(last);
    }
    return result;
  });

  function handlePointerMove(e: MouseEvent) {
    const n = points.length;
    if (!interactive || n === 0 || !svgContainer) return;
    if (n === 1) {
      hoveredIndex = 0;
      return;
    }
    const rect = svgContainer.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * viewBoxWidth;
    const i = Math.round(((svgX - padding.left) * (n - 1)) / plotWidth);
    hoveredIndex = i < 0 ? 0 : i > n - 1 ? n - 1 : i; // $state ignores same-value writes
  }

  function handlePointerLeave() {
    hoveredIndex = null;
  }

  const activePoint = $derived.by(() => {
    if (hoveredIndex === null) return null;
    return points[hoveredIndex] ?? null;
  });

  const tooltipStyle = $derived.by(() => {
    const pt = activePoint;
    if (!pt) return "";
    const x = pt.x;
    let transform = "translateX(-50%)";
    if (x > viewBoxWidth * 0.72) {
      transform = "translateX(-100%)";
    } else if (x < viewBoxWidth * 0.28) {
      transform = "translateX(0%)";
    }
    return `left: ${(x / viewBoxWidth) * 100}%; top: 4px; transform: ${transform};`;
  });
</script>

<div class="w-full select-none {className}" {...rest}>
  <!-- Optional Interactive Legend for Dual-Series or Toggled Series -->
  {#if showLegend && hasSecondaryData}
    <div
      class="flex items-center justify-between text-xs px-1 mb-1.5 select-none"
    >
      <div class="flex items-center gap-2.5">
        <!-- Primary Series Toggle -->
        <button
          type="button"
          class="{LEGEND_BTN} {showPrimary ? LEGEND_ON : LEGEND_OFF}"
          onclick={() => (showPrimary = !showPrimary)}
        >
          <span
            class="w-2 h-2 rounded-full inline-block shrink-0 shadow-xs"
            style="background-color: {color};"
          ></span>
          <span>{(primaryLabel || unit || t("common.chartNetFallback")).toLowerCase()}</span>
        </button>

        <!-- Secondary Series Toggle -->
        <button
          type="button"
          class="{LEGEND_BTN} {showSecondary ? LEGEND_ON : LEGEND_OFF}"
          onclick={() => (showSecondary = !showSecondary)}
        >
          <span
            class="w-3 h-0 border-t-2 border-dashed inline-block shrink-0"
            style="border-color: {secondaryColor};"
          ></span>
          <span>{(secondaryLabel || t("common.chartRawFallback")).toLowerCase()}</span>
        </button>
      </div>

      <span
        class="text-[10px] text-tt-text-secondary/70 font-mono hidden sm:inline-block"
      >
        {t("common.chartHoverHint")}
      </span>
    </div>
  {/if}

  <!-- Chart Canvas Container -->
  <div
    bind:this={svgContainer}
    class="relative w-full overflow-hidden {interactive
      ? 'cursor-crosshair'
      : ''}"
    onmousemove={handlePointerMove}
    onmouseleave={handlePointerLeave}
    role="region"
    aria-label={t("common.lineChartAriaLabel")}
  >
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      class="w-full h-auto overflow-visible block"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color={color} stop-opacity="0.32" />
          <stop offset="70%" stop-color={color} stop-opacity="0.06" />
          <stop offset="100%" stop-color={color} stop-opacity="0.0" />
        </linearGradient>
      </defs>

      <!-- Background Grid lines -->
      <g class="grid-lines">
        {#each yTicks as tick, i (i)}
          <line
            x1={padding.left}
            y1={tick.y}
            x2={padding.left + plotWidth}
            y2={tick.y}
            stroke="currentColor"
            class="text-tt-separator/40"
            stroke-dasharray="3,3"
            stroke-width="1"
          />
          <text
            x={padding.left - 6}
            y={tick.y + 3.5}
            text-anchor="end"
            class="text-[10px] fill-tt-text-secondary font-mono font-medium"
          >
            {tick.val}{unit === "%" ? "%" : ""}
          </text>
        {/each}
      </g>

      <!-- X Axis Labels -->
      <g class="x-ticks">
        {#each xTicks as tick (tick.index)}
          <text
            x={tick.x}
            y={padding.top + plotHeight + 16}
            text-anchor="middle"
            class="text-[10px] fill-tt-text-secondary font-mono"
          >
            {tick.label}
          </text>
        {/each}
      </g>

      <!-- Area fill -->
      {#if showArea && areaString}
        <path
          d={areaString}
          fill={`url(#${gradientId})`}
          class="pointer-events-none transition-opacity duration-200"
        />
      {/if}

      <!-- Secondary Line -->
      {#if hasSecondaryData && showSecondary && secondaryPathString}
        <path
          d={secondaryPathString}
          fill="none"
          stroke={secondaryColor}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-dasharray="4,4"
          class="transition-opacity duration-200"
        />
      {/if}

      <!-- Primary Line -->
      {#if showPrimary && primaryPathString}
        <path
          d={primaryPathString}
          fill="none"
          stroke={color}
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="transition-opacity duration-200"
        />
      {/if}

      <!-- Points (if enabled) -->
      {#if showPoints && showPrimary}
        {#each points as p, i (i)}
          <circle
            cx={p.x}
            cy={p.y}
            r="3"
            fill={color}
            class="stroke-tt-surface stroke-1.5 hover:scale-150 transition-transform"
          >
            <title>{p.label}: {p.value} {unit}</title>
          </circle>
        {/each}
      {/if}

      <!-- Active Tracking Crosshair Guide Line -->
      {#if interactive && activePoint}
        {@const pt = activePoint}
        <g class="crosshair-guide pointer-events-none">
          <line
            x1={pt.x}
            y1={padding.top}
            x2={pt.x}
            y2={padding.top + plotHeight}
            stroke="currentColor"
            class="text-tt-text-secondary/50"
            stroke-width="1.5"
            stroke-dasharray="3,3"
          />

          {#if hasSecondaryData && showSecondary && pt.ySecondary !== undefined}
            <circle
              cx={pt.x}
              cy={pt.ySecondary}
              r="3.5"
              class="fill-tt-surface stroke-tt-text-secondary stroke-2"
            />
          {/if}

          {#if showPrimary}
            <circle
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill={color}
              class="stroke-tt-surface stroke-2 shadow-sm"
            />
          {/if}
        </g>
      {/if}
    </svg>

    <!-- Floating Liquid Glass Hover Tooltip -->
    {#if interactive && activePoint}
      {@const pt = activePoint}
      <div
        class="absolute pointer-events-none z-30 transition-[transform,left,top] duration-75 ease-out"
        style={tooltipStyle}
      >
        <div
          class="px-2.5 py-1.5 rounded-xl bg-tt-surface-elevated border border-[var(--tt-glass-border)] shadow-md text-xs font-mono select-none space-y-1 min-w-[110px]"
        >
          <!-- Label & Sublabel -->
          <div
            class="flex items-center justify-between text-[11px] pb-1 border-b border-tt-separator/40 font-semibold text-tt-text gap-2"
          >
            <span>{pt.label}</span>
            {#if pt.sublabel}
              <span class="text-tt-text-secondary text-[10px] font-normal">
                {pt.sublabel}
              </span>
            {/if}
          </div>

          <!-- Primary Metric -->
          {#if showPrimary}
            <div
              class="flex items-center justify-between gap-3 font-bold"
              style="color: {color};"
            >
              <span class="text-[11px] flex items-center gap-1 font-medium">
                <span
                  class="w-1.5 h-1.5 rounded-full inline-block"
                  style="background-color: {color};"
                ></span>
                {primaryLabel || unit || t("common.chartValueFallback")}:
              </span>
              <span class="tabular-nums"
                >{pt.value}{unit === "%" ? "%" : ""}</span
              >
            </div>
          {/if}

          <!-- Secondary Metric -->
          {#if hasSecondaryData && showSecondary && pt.secondaryValue !== undefined}
            <div
              class="flex items-center justify-between gap-3 text-tt-text-secondary font-medium"
            >
              <span class="text-[11px] flex items-center gap-1">
                <span
                  class="w-2 h-0.5 border-t border-dashed inline-block"
                  style="border-color: {secondaryColor};"
                ></span>
                {secondaryLabel || t("common.chartRawFallback")}:
              </span>
              <span class="tabular-nums font-semibold"
                >{pt.secondaryValue}{unit === "%" ? "%" : ""}</span
              >
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
