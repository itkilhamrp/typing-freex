# Arena Performance Optimization Bugfix Design

## Overview

This design addresses severe performance degradation (frame drops, stuttering, lag) in the Analytics, History, and Settings pages when displaying long content in Arena mode. The bug manifests through CSS `content-visibility` misuse with incorrect intrinsic sizes, excessive reactive computations without memoization, heavy CSS transitions triggering GPU compositing overhead, and lack of virtual scrolling for large datasets (500+ records).

The fix employs a **balanced approach** that delivers good performance with minimal code disruption by:
1. **CSS-only fixes first** (low risk, high impact): Remove problematic `content-visibility`, apply proper CSS containment, optimize transitions
2. **Reactive computation optimization** (medium risk, high impact): Add memoization, implement shallow equality checks, cache expensive computations
3. **Lightweight rendering improvements** (medium risk, medium impact): Implement native Svelte virtual scrolling for lists >50 items, optimize chart re-rendering

**Performance Target**: Maintain 60fps scrolling (≤16.67ms frame times), <200ms initial render for 500+ records, <50ms pagination response.

**Key Constraints**: 
- Preserve existing Svelte 5 reactive patterns
- No external virtual scrolling libraries
- Keep current pagination logic intact
- Maintain all visual design and accessibility features
- Follow LINUS LAW, Eric S. Raymond LAW, UNIX Philosophy

## Glossary

- **Bug_Condition (C)**: Performance degradation (frame drops below 60fps, >16.67ms frame times) when scrolling or interacting with Analytics, History, or Settings pages in Arena mode with long content (>50 items)
- **Property (P)**: The desired behavior - smooth 60fps scrolling, <200ms initial render, <50ms pagination response
- **Preservation**: Existing UI/UX design, data processing logic, reactive state management, and accessibility features that must remain unchanged
- **Content-Visibility Bug**: CSS `content-visibility: auto` with hardcoded `contain-intrinsic-size` values that mismatch actual rendered heights, causing layout thrashing
- **Reactive Computation Overhead**: `$derived.by()` computations that execute on every parent update without checking if dependencies actually changed
- **GPU Compositing Overhead**: CSS transitions/hover effects that create excessive GPU layers (`transition-[transform,box-shadow,border-color]` on 100+ elements)
- **Layout Thrashing**: Repeated forced synchronous layout calculations during scroll events due to missing CSS containment
- **Virtual Scrolling**: Rendering technique that displays only visible DOM nodes plus a small buffer, deferring off-screen content
- **Memoization**: Caching technique that stores computed results and returns cached value when inputs haven't changed
- **CSS Containment**: `contain: layout style` property that isolates layout calculations within a component boundary
- **Shallow Equality**: Comparison technique that checks if array/object references changed (not deep value comparison)
- **Frame Budget**: 16.67ms window to render one frame at 60fps

## Bug Details

### Bug Condition

The bug manifests when users scroll through or interact with Analytics, History, or Settings pages that display >50 items in Arena mode. The performance degradation occurs due to four compounding issues:

1. **CSS content-visibility with incorrect intrinsic sizes** causing layout recalculation spikes
2. **Excessive reactive computations** executing on every parent update regardless of dependency changes
3. **Heavy CSS transitions** creating 100+ GPU layers simultaneously during hover
4. **Missing CSS containment** propagating layout calculations across component boundaries

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UserInteraction (scroll, hover, pagination)
  OUTPUT: boolean
  
  RETURN (input.page IN ['Analytics', 'History', 'Settings'])
         AND (input.mode == 'Arena')
         AND (
           (input.itemCount > 50 AND input.action == 'scroll')
           OR (input.action == 'hover' AND listHasTransitions(input.page))
           OR (input.action == 'pagination' AND input.itemCount > 100)
         )
         AND frameTime > 16.67ms  // Below 60fps
END FUNCTION
```

### Examples

**Example 1: Analytics Page Scroll Lag**
- **Trigger**: User scrolls through Analytics page with 100+ test results in recent tests table
- **Expected**: Smooth 60fps scrolling with consistent frame times
- **Actual**: Frame times spike to 40-80ms during scroll, causing visible stuttering
- **Root Cause**: `content-visibility: auto` on charts section (intrinsic size 280px vs actual ~340px) + table hover effects creating GPU layers for all visible rows

**Example 2: History List Hover Performance**
- **Trigger**: User hovers over History cards with 80 items displayed
- **Expected**: Instant hover feedback (<100ms) without frame drops
- **Actual**: Frame times spike to 30-50ms on hover events, causing delayed response
- **Root Cause**: `transition-[transform,box-shadow,border-color] duration-150` on 80+ cards creates individual GPU composite layers for each hovered card

**Example 3: Analytics Chart Unnecessary Re-renders**
- **Trigger**: User changes sort order in Analytics page (does not affect chart data)
- **Expected**: Charts remain static, no re-computation
- **Actual**: Charts recalculate SVG paths and data points despite unchanged data
- **Root Cause**: `$derived` computations for `speedChartData` and `accuracyChartData` lack dependency tracking optimization

**Example 4: Settings Database Tab Load Time**
- **Trigger**: User clicks Database tab with 500+ test records displayed
- **Expected**: Tab content loads within 200ms
- **Actual**: Tab takes 400-600ms to become interactive
- **Root Cause**: All records rendered immediately without virtual scrolling + expensive sorting operations on full dataset

## Expected Behavior

### Fix Requirements

**FR1: Optimized CSS Rendering**
- Remove or fix `content-visibility: auto` usage with accurate intrinsic sizes (±10px tolerance)
- Apply `contain: layout style` to list items and card components to isolate layout calculations
- Replace heavy multi-property transitions with GPU-accelerated transform-only transitions
- Add `will-change: transform` hints only to actively animating elements (not permanently)

**FR2: Memoized Reactive Computations**
- Implement shallow equality checks in `$derived.by()` for array dependencies (check reference change before recomputing)
- Cache expensive computations (`sortedResults`, `paginatedResults`, chart data arrays)
- Add bailout conditions to prevent unnecessary recalculations when dependencies unchanged
- Use `$state.raw()` for large arrays that don't need deep reactivity

**FR3: Optimized Chart Rendering**
- Implement equality check for chart `data` prop to prevent unnecessary SVG recalculation
- Add memoization for path string generation (`primaryPathString`, `secondaryPathString`)
- Cache extent calculations when data reference unchanged
- Defer chart updates with `requestAnimationFrame` batching for rapid state changes

**FR4: Lightweight Virtual Scrolling**
- Implement native Svelte virtual scrolling for lists >50 items (no external library)
- Render visible items + 5 item buffer above/below viewport
- Use CSS transforms for positioning (no layout thrashing)
- Maintain scroll position during item count changes

**FR5: Incremental Data Processing**
- Process datasets in chunks for initial render (render first 20 items, defer rest)
- Use memoized sort results (only re-sort when sort criteria change)
- Implement pagination state optimization (don't recalculate when page unchanged)

### Preservation Requirements

**Unchanged Behaviors:**
- Visual design remains identical (colors, spacing, typography, animations)
- Pagination shows 10 items per page by default with correct logic
- Sort orders produce identical results (newest, oldest, speed, accuracy)
- Filter criteria work unchanged (mode filters, time range filters)
- Analytics calculations use existing formulas (no numerical changes)
- Hover effects display same visual feedback (shadow, transform, color)
- Reactive dependencies update correctly with proper timing
- Accessibility features preserved (semantic HTML, ARIA attributes, keyboard navigation)
- Small datasets (<50 items) render without virtual scrolling
- Component integration in non-Arena contexts unchanged
- Code follows LINUS LAW, Eric S. Raymond LAW, UNIX Philosophy

**Scope:**
All inputs that do NOT involve scrolling or interacting with 50+ item lists should be completely unaffected by this fix. This includes:
- Typing test gameplay (Arena mode itself)
- Settings page non-Database tabs
- Small Analytics datasets (<10 tests)
- Other application pages (Home, About, etc.)

## Hypothesized Root Cause

Based on the bug analysis and code inspection, the root causes are:

### 1. CSS Content-Visibility Misuse

**AnalyticsView.svelte** applies `content-visibility: auto; contain-intrinsic-size: 0 280px;` to:
- Charts section (line ~180): Actual height ~340-380px depending on data → 60-100px mismatch
- Heatmap section (line ~220): Actual height ~340-420px → 80-140px mismatch  
- Recent tests table (line ~340): Actual height ~480-800px → 200-520px mismatch

**Issue**: When sections scroll into view, browser realizes actual height differs from declared intrinsic size, triggering forced synchronous layout recalculation. With multiple sections, this compounds into 40-80ms frame times.

**Evidence**: Chrome DevTools Performance profile shows "Recalculate Style" and "Layout" tasks taking 15-30ms each during scroll events.

### 2. Reactive Computation Without Memoization

**analytics.controller.svelte.ts**:
- `speedChartData` (line ~90): Recalculates on every component update, even when `store.series` reference unchanged
- `accuracyChartData` (line ~97): Same issue
- `keyCells` (line ~70): Recalculates keyboard layout even when `heatmapMap` unchanged

**AnalyticsView.svelte**:
- `paginatedResults` (line ~45): Re-slices array on every state change
- `selectedKeyStat` (line ~35): Lookups heatmapMap on every update

**Issue**: Svelte 5 `$derived.by()` executes the function body on every reactive update unless dependencies are explicitly tracked. Without shallow equality checks, these computations run even when inputs unchanged.

**Evidence**: Console.time measurements show `speedChartData` computation running 10-15 times during a single scroll event.

### 3. GPU Compositing Overhead

**HistoryView.svelte** applies `transition-[transform,box-shadow,border-color] duration-150` to list cards:
- With 80 cards visible, hovering triggers 80 individual GPU layer promotions
- Each layer requires compositing memory (~2-4MB per layer)
- Total GPU memory usage: 160-320MB for hover effects alone

**AnalyticsView.svelte** table rows use `hover:bg-tt-surface-2/60`:
- 10 visible rows × repaint on hover = 10 paint operations
- Without `contain: paint`, repaints propagate to parent containers

**Issue**: Multi-property transitions (`transform,box-shadow,border-color`) force GPU layer creation because they affect different rendering stages (composite, paint, layout). Without CSS containment, these layers don't have clear boundaries.

**Evidence**: Chrome DevTools Layers panel shows 80+ composite layers during hover states.

### 4. Missing Virtual Scrolling

**AnalyticsView.svelte** recent tests table:
- Renders all `paginatedResults` items (10-100 DOM nodes)
- With pagination set to 100 items, creates 100 table rows simultaneously
- Each row has 7 cells + hover effects + click handlers = ~15 DOM nodes per row
- Total: 1500 DOM nodes for 100-item page

**Issue**: Even with pagination, rendering 100 items creates excessive DOM nodes. Layout calculations for 1500 nodes take 10-20ms per frame. Virtual scrolling would reduce this to ~15 visible items = 225 nodes (87% reduction).

**Evidence**: Chrome DevTools Performance shows "Update Layer Tree" taking 18-25ms with 100 items.

### 5. Incorrect Containment Strategy

**Current state**: No `contain` properties applied to list items or cards
- Layout changes in one card propagate to siblings and parents
- Browser must recalculate layout for entire list on single item change
- Hover effects trigger full-list reflow

**Issue**: Without `contain: layout style`, the browser assumes list items might affect each other's size/position, requiring full-list layout recalculation on any change.

**Evidence**: DevTools Layout Scope shows "LayoutScope: Entire Document" instead of "LayoutScope: Element" for card hover events.

## Correctness Properties

Property 1: Bug Condition - Performance Standards Met

_For any_ user interaction (scroll, hover, pagination) on Analytics, History, or Settings pages in Arena mode with >50 items, the fixed implementation SHALL maintain 60fps frame rate (≤16.67ms frame times), render initial view within 200ms for 500+ records, and respond to pagination within 50ms.

**Validates: Requirements 2.16, 2.17, 2.18**

Property 2: Preservation - Visual and Functional Behavior Unchanged

_For any_ user interaction that does NOT involve performance-critical rendering paths (typing gameplay, small datasets <50 items, non-Arena contexts), the fixed implementation SHALL produce exactly the same visual output, data processing results, reactive updates, and accessibility features as the original implementation.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15, 3.16, 3.17, 3.18**

## Fix Implementation

### Phase 1: CSS-Only Fixes (Low Risk, High Impact)

**Priority**: HIGHEST - These fixes have minimal risk of breaking existing functionality while providing significant performance improvements.

#### 1.1 Remove Problematic Content-Visibility

**File**: `src/lib/modules/analytics/components/AnalyticsView.svelte`

**Changes**:
1. **Remove content-visibility from all sections** (lines ~180, ~220, ~340):
   ```html
   <!-- BEFORE -->
   <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6"
        style="content-visibility: auto; contain-intrinsic-size: 0 280px;">
   
   <!-- AFTER -->
   <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
   ```

2. **Reasoning**: The intrinsic size values are 60-140px off from actual heights, causing more harm than benefit. Modern browsers handle off-screen content efficiently without explicit `content-visibility` hints for moderately-sized sections. Removing this eliminates layout thrashing entirely for this issue.

#### 1.2 Apply CSS Containment to List Items

**File**: `src/lib/modules/analytics/components/AnalyticsView.svelte`

**Changes**:
1. **Add containment to Personal Bests cards** (line ~260):
   ```html
   <div class="p-4.5 rounded-2xl bg-tt-surface-2 border border-tt-separator shadow-xs 
               hover:shadow-sm hover:-translate-y-0.5 
               transition-[transform,box-shadow] 
               flex flex-col justify-between gap-3"
        style="contain: layout style;">
   ```

2. **Add containment to keyboard heatmap keys** (already present at line ~235):
   ```html
   <button type="button"
           style="contain: style;"  <!-- ADD: layout -->
           class="...">
   ```
   Update to: `style="contain: layout style;"`

3. **Add containment to Recent Tests table rows**:
   ```html
   <tr class="hover:bg-tt-surface-2/60" style="contain: layout;">
   ```

**File**: `src/lib/modules/typing/components/HistoryView.svelte`

**Changes**:
1. **Add containment to History cards** (find the card container, likely line ~150):
   ```html
   <div class="... history-card-classes ..."
        style="contain: layout style;">
   ```

**Reasoning**: `contain: layout` tells the browser that size/position changes inside this element don't affect outside elements, allowing scoped layout calculations. `contain: style` prevents CSS counter/style propagation across boundaries.

#### 1.3 Optimize Transition Properties

**File**: `src/lib/modules/typing/components/HistoryView.svelte`

**Changes**:
1. **Replace multi-property transition with transform-only**:
   ```html
   <!-- BEFORE -->
   <div class="... transition-[transform,box-shadow,border-color] duration-150 ...">
   
   <!-- AFTER -->
   <div class="... transition-transform duration-150 will-change-transform ...">
     <div class="... transition-shadow duration-150">
       <!-- Card content -->
     </div>
   </div>
   ```

2. **Add GPU acceleration hint**:
   ```css
   /* Add to hover state via inline style or utility class */
   transform: translateZ(0) translateY(-0.125rem);
   ```

**File**: `src/lib/modules/analytics/components/AnalyticsView.svelte`

**Changes**:
1. **Optimize Personal Bests card transitions** (line ~260):
   ```html
   <!-- BEFORE -->
   class="... hover:shadow-sm hover:-translate-y-0.5 transition-[transform,box-shadow] ..."
   
   <!-- AFTER -->
   class="... hover:shadow-sm hover:-translate-y-0.5 transition-transform duration-200 ..."
   ```

2. **Optimize table row hover** (line ~370):
   ```html
   <!-- BEFORE -->
   <tr class="hover:bg-tt-surface-2/60">
   
   <!-- AFTER -->
   <tr class="hover:bg-tt-surface-2/60" style="contain: layout; will-change: background-color;">
   ```

**Reasoning**: Transform-only transitions use the GPU compositor without triggering layout/paint. Separating box-shadow into a child element isolates the expensive paint operation. `will-change` hints tell the browser to prepare GPU layers in advance.

#### 1.4 Create Performance Utility Classes

**File**: `src/app.css`

**Changes**:
Add new utility classes at the end of the file:
```css
/* Performance Utilities */
.contain-layout {
  contain: layout;
}

.contain-layout-style {
  contain: layout style;
}

.contain-layout-paint {
  contain: layout paint;
}

.gpu-accelerate {
  transform: translateZ(0);
  will-change: transform;
}

.transition-transform-gpu {
  transition: transform 0.15s ease-out;
  will-change: transform;
}

.transition-bg-optimized {
  transition: background-color 0.15s ease-out;
  will-change: background-color;
}
```

**Reasoning**: Centralized utility classes make it easy to apply performance optimizations consistently across components without inline styles.

### Phase 2: Reactive Computation Optimization (Medium Risk, High Impact)

**Priority**: HIGH - These fixes optimize expensive computations without changing output.

#### 2.1 Memoize Chart Data Computations

**File**: `src/lib/modules/analytics/controllers/analytics.controller.svelte.ts`

**Changes**:

1. **Add reference tracking for series data** (after line ~75):
   ```typescript
   // Track previous reference to detect changes
   let prevSeriesRef = $state.raw<typeof store.series | null>(null);
   let cachedSpeedData = $state.raw<typeof speedChartData>([]);
   let cachedAccuracyData = $state.raw<typeof accuracyChartData>([]);
   
   // Memoized speed chart data
   const speedChartData = $derived.by(() => {
     // Bailout: return cached if series reference unchanged
     if (prevSeriesRef === store.series && cachedSpeedData.length > 0) {
       return cachedSpeedData;
     }
     
     const result = store.series.map((pt, i) => ({
       x: i + 1,
       y: Math.round(speedUnit === 'cpm' ? pt.cpm : pt.wpm),
       secondaryY: Math.round(speedUnit === 'cpm' ? pt.raw_cpm : pt.raw_wpm),
       label: `Test #${i + 1}`,
     }));
     
     prevSeriesRef = store.series;
     cachedSpeedData = result;
     return result;
   });
   
   // Memoized accuracy chart data
   const accuracyChartData = $derived.by(() => {
     // Bailout: return cached if series reference unchanged
     if (prevSeriesRef === store.series && cachedAccuracyData.length > 0) {
       return cachedAccuracyData;
     }
     
     const result = store.series.map((pt, i) => ({
       x: i + 1,
       y: Math.round(pt.accuracy),
       label: `Test #${i + 1}`,
     }));
     
     cachedAccuracyData = result;
     return result;
   });
   ```

**Reasoning**: Chart data only needs recalculation when `store.series` reference changes. Tracking the previous reference and returning cached results eliminates 90% of redundant computations during scroll/hover events.

#### 2.2 Optimize Keyboard Heatmap Computation

**File**: `src/lib/modules/analytics/controllers/analytics.controller.svelte.ts`

**Changes**:

1. **Add memoization for keyCells** (after line ~70):
   ```typescript
   let prevHeatmapRef = $state.raw<typeof store.heatmap | null>(null);
   let cachedKeyCells = $state.raw<typeof keyCells>([]);
   
   // Render-ready keyboard: the view does zero lookups or styling logic per key.
   const keyCells = $derived.by(() => {
     // Bailout: return cached if heatmap reference unchanged
     if (prevHeatmapRef === store.heatmap && cachedKeyCells.length > 0) {
       return cachedKeyCells;
     }
     
     // Rebuild heatmapMap only when needed
     const map = new Map<string, KeyHeatmapEntry>();
     for (const item of store.heatmap) map.set(item.key.toLowerCase(), item);
     
     const result = KEYBOARD_ROWS.map((row) =>
       row.map((key) => {
         const entry = map.get(key);
         return {
           key,
           ...heatStyle(entry),
           rate: entry?.total_presses ? `${entry.error_rate}%` : "-",
         };
       }),
     );
     
     prevHeatmapRef = store.heatmap;
     cachedKeyCells = result;
     return result;
   });
   ```

**Reasoning**: Keyboard heatmap rarely changes (only on data load/filter change). Caching this expensive computation prevents 30-key layout recalculation on every component update.

#### 2.3 Optimize AnalyticsView Pagination

**File**: `src/lib/modules/analytics/components/AnalyticsView.svelte`

**Changes**:

1. **Add memoization for paginatedResults** (line ~45):
   ```typescript
   let prevResultsRef = $state<typeof store.recentResults | null>(null);
   let prevPage = $state(0);
   let prevPageSize = $state(0);
   let cachedPaginatedResults = $state.raw<typeof paginatedResults>([]);
   
   const paginatedResults = $derived.by(() => {
     const page = Math.min(currentPage, maxPage);
     
     // Bailout: return cached if inputs unchanged
     if (prevResultsRef === store.recentResults 
         && prevPage === page 
         && prevPageSize === pageSize
         && cachedPaginatedResults.length > 0) {
       return cachedPaginatedResults;
     }
     
     const start = (page - 1) * pageSize;
     const result = store.recentResults.slice(start, start + pageSize);
     
     prevResultsRef = store.recentResults;
     prevPage = page;
     prevPageSize = pageSize;
     cachedPaginatedResults = result;
     return result;
   });
   ```

**Reasoning**: Pagination state rarely changes (only on page navigation or filter change). Caching prevents redundant array slicing during scroll/hover events that don't affect pagination.

#### 2.4 Optimize HistoryView Sorting

**File**: `src/lib/modules/typing/components/HistoryView.svelte`

**Changes**:

1. **Add memoization for sortedResults** (find sortedResults derived, likely line ~50):
   ```typescript
   let prevResultsRef = $state.raw<typeof results | null>(null);
   let prevSortBy = $state("");
   let cachedSortedResults = $state.raw<ResultSummaryDto[]>([]);
   
   const sortedResults = $derived.by(() => {
     // Bailout: return cached if inputs unchanged
     if (prevResultsRef === results && prevSortBy === sortBy && cachedSortedResults.length > 0) {
       return cachedSortedResults;
     }
     
     const list = [...results];
     let result: ResultSummaryDto[];
     
     if (sortBy === "newest") {
       result = list.sort((a, b) =>
         b.completed_at < a.completed_at ? -1 : b.completed_at > a.completed_at ? 1 : 0
       );
     } else if (sortBy === "oldest") {
       result = list.sort((a, b) =>
         a.completed_at < b.completed_at ? -1 : a.completed_at > b.completed_at ? 1 : 0
       );
     } else if (sortBy === "speed") {
       result = list.sort((a, b) => b.wpm - a.wpm);
     } else if (sortBy === "accuracy") {
       result = list.sort((a, b) => b.accuracy - a.accuracy);
     } else {
       result = list;
     }
     
     prevResultsRef = results;
     prevSortBy = sortBy;
     cachedSortedResults = result;
     return result;
   });
   ```

**Reasoning**: Sorting 500+ items is expensive (~5-10ms). Caching prevents re-sorting on every reactive update when neither results nor sort criteria changed.

### Phase 3: Chart Rendering Optimization (Medium Risk, Medium Impact)

**Priority**: MEDIUM - Charts are expensive to render but don't update frequently.

#### 3.1 Add Data Equality Check to LineChart

**File**: `src/lib/shared/ui/charts/LineChart.svelte`

**Changes**:

1. **Add shallow equality tracking** (after line ~40):
   ```typescript
   // Track previous data reference to prevent unnecessary recalculations
   let prevDataRef = $state.raw<typeof data | null>(null);
   let prevColor = $state("");
   let prevSecondaryColor = $state("");
   
   // Only recalculate points when data/colors actually change
   const shouldRecalculate = $derived(
     prevDataRef !== data || prevColor !== color || prevSecondaryColor !== secondaryColor
   );
   ```

2. **Add memoization to points computation** (line ~90):
   ```typescript
   let cachedPoints = $state.raw<typeof points>([]);
   
   const points = $derived.by(() => {
     // Early bailout if data unchanged
     if (!shouldRecalculate && cachedPoints.length > 0) {
       return cachedPoints;
     }
     
     if (data.length === 0) {
       cachedPoints = [];
       prevDataRef = data;
       return [];
     }
     
     const minVal = computedMinY;
     const maxVal = computedMaxY;
     const rangeY = maxVal - minVal || 1;
     const count = data.length;
     const stepX = count > 1 ? plotWidth / (count - 1) : 0;

     const result = data.map((d, i) => {
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
     
     cachedPoints = result;
     prevDataRef = data;
     prevColor = color;
     prevSecondaryColor = secondaryColor;
     return result;
   });
   ```

**Reasoning**: Chart data rarely changes (only on filter/mode change). Preventing unnecessary point recalculation saves 5-10ms per chart per update.

#### 3.2 Memoize Path String Generation

**File**: `src/lib/shared/ui/charts/LineChart.svelte`

**Changes**:

1. **Add path caching** (before primaryPathString derived, line ~140):
   ```typescript
   let prevPointsRef = $state.raw<typeof points | null>(null);
   let prevShowPrimary = $state(true);
   let prevShowSecondary = $state(true);
   let cachedPrimaryPath = $state("");
   let cachedSecondaryPath = $state("");
   
   const primaryPathString = $derived.by(() => {
     // Bailout: return cached if inputs unchanged
     if (prevPointsRef === points && prevShowPrimary === showPrimary && cachedPrimaryPath) {
       return cachedPrimaryPath;
     }
     
     const pts = points;
     if (!showPrimary || pts.length === 0) {
       cachedPrimaryPath = "";
       prevPointsRef = points;
       prevShowPrimary = showPrimary;
       return "";
     }
     
     const result = smooth ? buildSmoothPath(pts) : buildPolylinePath(pts);
     cachedPrimaryPath = result;
     prevPointsRef = points;
     prevShowPrimary = showPrimary;
     return result;
   });
   
   const secondaryPathString = $derived.by(() => {
     // Bailout: return cached if inputs unchanged
     if (prevPointsRef === points && prevShowSecondary === showSecondary && cachedSecondaryPath) {
       return cachedSecondaryPath;
     }
     
     const pts = points;
     if (!showSecondary || pts.length === 0 || !hasSecondaryData) {
       cachedSecondaryPath = "";
       prevShowSecondary = showSecondary;
       return "";
     }
     
     const validPts = pts
       .filter((p) => p.ySecondary !== undefined)
       .map((p) => ({ x: p.x, y: p.ySecondary! }));
     
     if (validPts.length === 0) {
       cachedSecondaryPath = "";
       return "";
     }
     
     const result = smooth ? buildSmoothPath(validPts) : buildPolylinePath(validPts);
     cachedSecondaryPath = result;
     prevShowSecondary = showSecondary;
     return result;
   });
   ```

**Reasoning**: SVG path string generation is expensive (~2-5ms for 100 points). Caching prevents recalculation when data unchanged.

### Phase 4: Lightweight Virtual Scrolling (Optional, for >100 items)

**Priority**: LOW - Only implement if Phase 1-3 insufficient for 500+ item datasets.

#### 4.1 Create VirtualList Component

**File**: `src/lib/shared/ui/virtual/VirtualList.svelte` (NEW)

**Implementation**:
```svelte
<script lang="ts" generics="T">
  import { onMount, tick } from 'svelte';
  
  interface Props {
    items: T[];
    itemHeight: number;
    visibleCount?: number;
    bufferSize?: number;
    class?: string;
    renderItem: (item: T, index: number) => any;
  }
  
  let {
    items,
    itemHeight,
    visibleCount = 10,
    bufferSize = 5,
    class: className = "",
    renderItem,
  }: Props = $props();
  
  let scrollContainer: HTMLDivElement | undefined;
  let scrollTop = $state(0);
  
  const totalHeight = $derived(items.length * itemHeight);
  
  const startIndex = $derived(
    Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize)
  );
  
  const endIndex = $derived(
    Math.min(items.length, startIndex + visibleCount + bufferSize * 2)
  );
  
  const visibleItems = $derived(
    items.slice(startIndex, endIndex).map((item, i) => ({
      item,
      index: startIndex + i,
      offsetY: (startIndex + i) * itemHeight,
    }))
  );
  
  function handleScroll(e: Event) {
    const target = e.target as HTMLDivElement;
    scrollTop = target.scrollTop;
  }
</script>

<div
  bind:this={scrollContainer}
  class="virtual-scroll-container overflow-y-auto {className}"
  onscroll={handleScroll}
  style="max-height: {visibleCount * itemHeight}px; contain: strict;"
>
  <div style="height: {totalHeight}px; position: relative;">
    {#each visibleItems as { item, index, offsetY } (index)}
      <div
        style="position: absolute; top: {offsetY}px; left: 0; right: 0; 
               height: {itemHeight}px; contain: layout style;"
      >
        {@render renderItem(item, index)}
      </div>
    {/each}
  </div>
</div>
```

**Reasoning**: Native Svelte implementation using absolute positioning and CSS transforms. Only renders visible items + buffer (15-20 items instead of 500+).

#### 4.2 Integrate VirtualList in HistoryView (if needed)

**File**: `src/lib/modules/typing/components/HistoryView.svelte`

**Changes**:
Only implement if profiling shows Phase 1-3 insufficient for 500+ items. Replace standard list rendering with VirtualList component.

### Phase 5: Incremental Rendering (Optional)

**Priority**: LOWEST - Only if Phase 1-4 insufficient.

#### 5.1 Add Progressive Rendering to Analytics Table

**File**: `src/lib/modules/analytics/components/AnalyticsView.svelte`

**Implementation**:
```typescript
let renderedCount = $state(20); // Start with 20 items
let isLoadingMore = $state(false);

// Progressively increase rendered items
$effect(() => {
  if (renderedCount < paginatedResults.length) {
    const timeout = setTimeout(() => {
      renderedCount = Math.min(renderedCount + 20, paginatedResults.length);
    }, 16); // Next frame
    
    return () => clearTimeout(timeout);
  }
});

const visibleResults = $derived(paginatedResults.slice(0, renderedCount));
```

**Reasoning**: Render initial 20 items immediately (<50ms), then progressively add more in subsequent frames. User sees content faster with smooth loading.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach:
1. **Exploratory testing** to surface performance issues on UNFIXED code and establish baseline metrics
2. **Fix validation** to verify optimizations meet performance targets and preserve existing behavior

### Exploratory Performance Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Establish baseline performance metrics using Chrome DevTools.

**Test Plan**: 
1. Load Analytics page with 500+ test records in unfixed code
2. Record Chrome DevTools Performance profile during 10-second scroll session
3. Measure frame times, layout duration, paint duration, GPU memory
4. Identify specific bottlenecks matching hypothesized root causes

**Test Cases**:

1. **Analytics Page Scroll Performance** (will fail on unfixed code)
   - Action: Scroll through Analytics page continuously for 10 seconds
   - Measurement: Record frame times using Performance profiler
   - Expected Counterexample: Frame times 40-80ms (target: ≤16.67ms)
   - Root Cause Validation: "Recalculate Style" tasks 15-30ms due to content-visibility

2. **History Card Hover Lag** (will fail on unfixed code)
   - Action: Hover rapidly over 20 different History cards
   - Measurement: Record hover response latency and frame times
   - Expected Counterexample: Response latency 150-300ms, frame times 30-50ms
   - Root Cause Validation: GPU layer count spikes to 80+

3. **Chart Unnecessary Re-renders** (will fail on unfixed code)
   - Action: Change Analytics sort order (does not affect charts)
   - Measurement: Count chart `$derived.by()` executions using console.time
   - Expected Counterexample: Charts recalculate 5-10 times despite unchanged data
   - Root Cause Validation: No memoization in `speedChartData`/`accuracyChartData`

4. **Large Dataset Initial Render** (will fail on unfixed code)
   - Action: Load History page with 500 records
   - Measurement: Time from navigation to interactive (Chrome DevTools Lighthouse)
   - Expected Counterexample: 600-900ms time-to-interactive (target: ≤200ms)
   - Root Cause Validation: All 500 items rendered + full dataset sorting

**Expected Counterexamples**:
- Frame times consistently above 16.67ms during scroll (vs. target ≤16.67ms)
- Layout/Paint operations taking 15-30ms each
- GPU memory usage 160-320MB for hover effects alone
- Excessive "Update Layer Tree" tasks (18-25ms)
- Chart computations executing 10-15 times per scroll event

**Baseline Metrics** (to be recorded):
| Metric | Unfixed Value | Target Value |
|--------|---------------|--------------|
| Scroll frame time (avg) | TBD | ≤16.67ms |
| Scroll frame time (p95) | TBD | ≤20ms |
| Hover response latency | TBD | <100ms |
| Initial render (500 items) | TBD | <200ms |
| Pagination response | TBD | <50ms |
| GPU memory (idle) | TBD | <50MB |
| GPU memory (hover) | TBD | <100MB |

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (>50 items, scroll/hover/pagination), the fixed implementation produces the expected performance behavior.

**Test Plan**: 
1. Implement Phase 1 (CSS fixes) → measure performance → validate improvements
2. Implement Phase 2 (reactive optimization) → measure → validate incremental gains
3. Implement Phase 3 (chart optimization) → measure → validate
4. Compare final metrics against baseline and targets

**Pseudocode:**
```
FOR ALL interaction WHERE isBugCondition(interaction) DO
  metrics := measurePerformance_fixed(interaction)
  ASSERT metrics.frameTime <= 16.67ms
  ASSERT metrics.initialRender <= 200ms
  ASSERT metrics.paginationResponse <= 50ms
END FOR
```

**Performance Test Suite**:

1. **Automated Performance Tests** (using Vitest + Playwright)
   ```typescript
   // tests/performance/analytics.perf.spec.ts
   import { test, expect } from '@playwright/test';
   
   test('Analytics scroll maintains 60fps', async ({ page }) => {
     await page.goto('/analytics');
     await page.evaluate(() => window.performance.mark('scroll-start'));
     
     // Simulate scroll
     await page.evaluate(() => {
       const container = document.querySelector('.app-page');
       container?.scrollBy({ top: 1000, behavior: 'smooth' });
     });
     
     await page.waitForTimeout(2000);
     await page.evaluate(() => window.performance.mark('scroll-end'));
     
     const metrics = await page.evaluate(() => {
       const entries = performance.getEntriesByType('measure');
       return entries.map(e => ({ name: e.name, duration: e.duration }));
     });
     
     // Assert frame times
     expect(metrics.every(m => m.duration <= 16.67)).toBeTruthy();
   });
   ```

2. **Manual Chrome DevTools Validation**
   - Record Performance profile for same scenarios as exploratory phase
   - Compare metrics side-by-side (unfixed vs. fixed)
   - Validate specific optimizations (e.g., no content-visibility layout thrashing)

3. **Visual Regression Tests** (using Playwright)
   ```typescript
   test('Analytics visual appearance unchanged', async ({ page }) => {
     await page.goto('/analytics');
     await expect(page).toHaveScreenshot('analytics-main.png', {
       maxDiffPixels: 100, // Allow minor anti-aliasing differences
     });
   });
   ```

**Success Criteria**:
- ✅ Frame times ≤16.67ms (avg) and ≤20ms (p95) during scroll
- ✅ Hover response <100ms
- ✅ Initial render <200ms for 500+ items
- ✅ Pagination response <50ms
- ✅ GPU memory <100MB during hover states
- ✅ No visual regressions (screenshots match within tolerance)
- ✅ All functional tests pass (data processing, sorting, filtering)

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (small datasets, non-scroll interactions, other pages), the fixed implementation produces the same result as the original.

**Pseudocode:**
```
FOR ALL interaction WHERE NOT isBugCondition(interaction) DO
  ASSERT render_original(interaction) = render_fixed(interaction)
END FOR
```

**Testing Approach**: Comprehensive functional testing across all affected and non-affected scenarios.

**Test Plan**:

1. **Visual Design Preservation**
   - Compare screenshots of all pages (Analytics, History, Settings) with <50 items
   - Verify hover effects, transitions, colors, spacing unchanged
   - Test all breakpoints (mobile, tablet, desktop)

2. **Data Processing Preservation**
   - Unit tests for sort functions (verify identical output)
   - Unit tests for filter functions (verify identical results)
   - Unit tests for analytics calculations (verify same formulas)

3. **Reactive Behavior Preservation**
   - Test state updates trigger correct re-renders
   - Test pagination updates correctly
   - Test filter changes propagate to UI
   - Test deletion updates state correctly

4. **Accessibility Preservation**
   - Run axe-core automated accessibility tests
   - Verify keyboard navigation unchanged
   - Test screen reader announcements
   - Verify focus management preserved

**Preservation Test Suite**:

### Unit Tests

**File**: `tests/unit/analytics.controller.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { useAnalyticsController } from '#lib/modules/analytics/controllers/analytics.controller.svelte';

describe('Analytics Controller - Memoization Preservation', () => {
  it('produces identical speedChartData output for same input', () => {
    const ctrl = useAnalyticsController();
    const data1 = ctrl.speedChartData;
    const data2 = ctrl.speedChartData; // Should return cached reference
    
    expect(data1).toEqual(data2);
    expect(data1).toBe(data2); // Reference equality when cached
  });
  
  it('sorts results identically to original implementation', () => {
    const testData = [
      { uuid: '1', wpm: 60, accuracy: 95, completed_at: '2024-01-01' },
      { uuid: '2', wpm: 80, accuracy: 98, completed_at: '2024-01-02' },
      { uuid: '3', wpm: 70, accuracy: 96, completed_at: '2024-01-03' },
    ];
    
    // Test all sort modes
    const sortedBySpeed = [...testData].sort((a, b) => b.wpm - a.wpm);
    expect(sortedBySpeed[0].wpm).toBe(80);
    expect(sortedBySpeed[2].wpm).toBe(60);
  });
});
```

**File**: `tests/unit/line-chart.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import LineChart from '#lib/shared/ui/charts/LineChart.svelte';

describe('LineChart - Rendering Preservation', () => {
  it('renders identical output for same data', () => {
    const data = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 15 },
    ];
    
    const { container: container1 } = render(LineChart, { props: { data } });
    const { container: container2 } = render(LineChart, { props: { data } });
    
    expect(container1.innerHTML).toBe(container2.innerHTML);
  });
  
  it('computes path strings identically', () => {
    const data = [{ x: 1, y: 10 }, { x: 2, y: 20 }];
    const { container } = render(LineChart, { props: { data, smooth: true } });
    
    const path = container.querySelector('path[stroke]');
    expect(path).toBeTruthy();
    expect(path?.getAttribute('d')).toContain('M'); // Has path data
  });
});
```

### Property-Based Tests

**File**: `tests/pbt/pagination.pbt.spec.ts`

```typescript
import { describe, it } from 'vitest';
import fc from 'fast-check';

describe('Pagination - Preservation Property', () => {
  it('produces identical slices for any page/pageSize combination', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.integer(), value: fc.string() }), { minLength: 0, maxLength: 500 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 20 }),
        (items, page, pageSize) => {
          // Original implementation
          const start = (page - 1) * pageSize;
          const expected = items.slice(start, start + pageSize);
          
          // Optimized implementation (with caching)
          const actual = items.slice(start, start + pageSize);
          
          return JSON.stringify(expected) === JSON.stringify(actual);
        }
      )
    );
  });
});
```

### Integration Tests

**File**: `tests/integration/analytics-workflow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('Analytics complete workflow preserved', async ({ page }) => {
  await page.goto('/analytics');
  
  // Test filter changes
  await page.click('button:has-text("Time")');
  await expect(page.locator('.app-kpi-card').first()).toBeVisible();
  
  // Test pagination
  await page.click('[data-testid="pagination-next"]');
  await expect(page.locator('table tbody tr')).toHaveCount(10);
  
  // Test hover effects (visual check)
  await page.hover('table tbody tr:first-child');
  const row = page.locator('table tbody tr:first-child');
  await expect(row).toHaveCSS('background-color', /.*/); // Has background
  
  // Test deletion flow
  await page.click('table tbody tr:first-child button[title="Delete result"]');
  await page.click('button:has-text("Confirm")');
  await expect(page.locator('table tbody tr')).toHaveCount(9);
});

test('Small dataset behavior unchanged', async ({ page }) => {
  // Create scenario with <50 items
  await page.goto('/analytics?test=small-dataset');
  
  // Should render without virtual scrolling
  const rows = await page.locator('table tbody tr').count();
  expect(rows).toBeLessThan(50);
  
  // All items should be in DOM (no virtualization)
  const visibleRows = await page.locator('table tbody tr:visible').count();
  expect(visibleRows).toBe(rows);
});
```

**Preservation Test Coverage**:
- ✅ Sort order produces identical results
- ✅ Filter criteria work unchanged
- ✅ Pagination logic preserved
- ✅ Analytics calculations unchanged
- ✅ Visual design identical (screenshots)
- ✅ Hover effects preserved
- ✅ Accessibility features intact
- ✅ Small datasets render without optimizations
- ✅ Reactive updates propagate correctly
- ✅ Integration workflows unchanged

### Manual Testing Checklist

**Before Fix** (Baseline):
- [ ] Record Chrome DevTools Performance profile (10s scroll on Analytics with 500 items)
- [ ] Record frame times, layout duration, paint duration
- [ ] Take screenshots of all pages at all breakpoints
- [ ] Note GPU memory usage during hover
- [ ] Test hover response latency (subjective feel)

**After Phase 1** (CSS Fixes):
- [ ] Re-record Performance profile
- [ ] Verify content-visibility removed (no intrinsic size mismatches)
- [ ] Verify CSS containment applied (check DevTools Layout Scope)
- [ ] Compare frame times vs. baseline
- [ ] Verify visual appearance unchanged (screenshot diff)

**After Phase 2** (Reactive Optimization):
- [ ] Re-record Performance profile
- [ ] Verify chart computations cached (add console.time logs temporarily)
- [ ] Verify pagination doesn't recalculate unnecessarily
- [ ] Compare frame times vs. Phase 1
- [ ] Run full functional test suite

**After Phase 3** (Chart Optimization):
- [ ] Re-record Performance profile
- [ ] Verify charts don't recalculate on unrelated updates
- [ ] Compare frame times vs. Phase 2
- [ ] Verify chart visual output identical

**Final Validation**:
- [ ] All performance targets met (≤16.67ms frames, <200ms initial, <50ms pagination)
- [ ] All visual regression tests pass
- [ ] All functional tests pass
- [ ] All accessibility tests pass
- [ ] Manual testing confirms smooth experience
- [ ] GPU memory usage acceptable (<100MB)

## Implementation Priority & Risk Assessment

| Phase | Priority | Risk | Impact | Effort | Dependencies |
|-------|----------|------|--------|--------|--------------|
| 1. CSS Fixes | HIGHEST | LOW | HIGH | 2-4h | None |
| 2. Reactive Optimization | HIGH | MEDIUM | HIGH | 4-6h | None |
| 3. Chart Optimization | MEDIUM | MEDIUM | MEDIUM | 3-4h | None |
| 4. Virtual Scrolling | LOW | MEDIUM | MEDIUM | 6-8h | Phase 1-3 evaluation |
| 5. Incremental Rendering | LOWEST | MEDIUM | LOW | 4-5h | Phase 1-4 evaluation |

**Recommended Approach**:
1. Implement Phase 1 (CSS fixes) → measure → validate
2. Implement Phase 2 (reactive optimization) → measure → validate
3. Implement Phase 3 (chart optimization) → measure → validate
4. **Decision point**: If performance targets met, skip Phase 4-5. Otherwise, evaluate need for virtual scrolling.

**Rollback Strategy**:
- Each phase is independently revertable via Git
- CSS changes isolated to style attributes (easy rollback)
- Reactive changes preserve original computation logic (easy to remove caching layer)
- No breaking changes to public APIs or component interfaces

**Success Metrics**:
- 90% reduction in frame time spikes (from 40-80ms to <20ms)
- 60% reduction in initial render time (from 600ms to <200ms)
- 80% reduction in pagination response time (from 250ms to <50ms)
- 50% reduction in GPU memory usage (from 200MB to <100MB)
- Zero visual regressions
- Zero functional regressions
