# Arena Performance Optimization - Implementation Plan

## Overview

This implementation plan addresses severe performance degradation (frame drops, stuttering, lag) in Analytics, History, and Settings pages when displaying long content in Arena mode. The fix follows a phased approach prioritizing low-risk CSS optimizations first, then reactive computation improvements, followed by chart rendering optimization.

**Performance Target**: 60fps scrolling (≤16.67ms frame times), <200ms initial render for 500+ records, <50ms pagination response.

---

## Task List

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Performance Degradation on Long Lists
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface performance metrics that demonstrate frame drops and lag
  - **Scoped PBT Approach**: Scope the property to concrete failing cases:
    - Analytics page with 100+ test results (scroll performance)
    - History page with 80+ cards (hover performance)
    - Settings Database tab with 500+ records (load time)
  - Test implementation:
    - Create test file: `src/lib/modules/analytics/components/__tests__/analytics-performance.test.ts`
    - Use `@testing-library/svelte` and performance.now() timing
    - Test case 1: Scroll Analytics page with 100 items, measure frame times
      - Assert: Frame times > 16.67ms (current defect - below 60fps)
      - Expected behavior (post-fix): Frame times ≤ 16.67ms
    - Test case 2: Hover over History cards (80 items), measure response time
      - Assert: Hover response > 100ms (current defect)
      - Expected behavior (post-fix): Hover response ≤ 100ms
    - Test case 3: Load Settings Database tab with 500 records, measure render time
      - Assert: Initial render > 200ms (current defect)
      - Expected behavior (post-fix): Render time ≤ 200ms
  - From Bug Condition in design: isBugCondition(input) where:
    - (input.page IN ['Analytics', 'History', 'Settings'])
    - AND (input.mode == 'Arena')
    - AND (input.itemCount > 50)
    - AND (frameTime > 16.67ms)
  - From Expected Behavior Properties in design:
    - 60fps frame rate (≤16.67ms frame times)
    - <200ms initial render for 500+ records
    - <50ms pagination response
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Record actual frame times during scroll (expected: 40-80ms)
    - Record hover response times (expected: 30-50ms)
    - Record initial load times (expected: 400-600ms)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 1.15_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Visual and Functional Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - Small datasets (<50 items) render correctly
    - Visual design (colors, spacing, animations) appears correct
    - Sort orders produce expected results
    - Filter criteria work correctly
    - Pagination logic functions properly
    - Accessibility features work (keyboard nav, screen reader)
  - Write property-based tests capturing observed behavior patterns:
    - Create test file: `src/lib/modules/analytics/components/__tests__/analytics-preservation.test.ts`
    - Test 1: Small dataset rendering (10 items)
      - Observe: Current visual output and layout
      - Property: Visual design and layout identical to current
    - Test 2: Sort order correctness (newest, oldest, speed, accuracy)
      - Observe: Sort results for sample dataset
      - Property: Same sort results across all modes
    - Test 3: Filter functionality (mode filters: all, time, words, quote, custom)
      - Observe: Filter results for sample dataset
      - Property: Same filter results for all criteria
    - Test 4: Pagination logic (page navigation, items per page)
      - Observe: Pagination state transitions
      - Property: Same pagination behavior
    - Test 5: Analytics calculations (averages, personal bests, streaks)
      - Observe: Calculated statistics for sample data
      - Property: Identical numerical results (no formula changes)
    - Test 6: Accessibility features
      - Observe: ARIA attributes, semantic HTML, tab order
      - Property: Same accessibility tree structure
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14, 3.15, 3.16, 3.17, 3.18_

- [x] 3. Phase 1: CSS-Only Fixes (Highest Priority - Low Risk, High Impact)

  - [x] 3.1 Remove problematic content-visibility
    - **File**: `src/lib/modules/analytics/components/AnalyticsView.svelte`
    - Remove `content-visibility: auto` from all sections:
      - Charts section (line ~180): Remove `style="content-visibility: auto; contain-intrinsic-size: 0 280px;"`
      - Heatmap section (line ~220): Remove `style="content-visibility: auto; contain-intrinsic-size: 0 340px;"`
      - Recent tests table section (line ~340): Remove `style="content-visibility: auto; contain-intrinsic-size: 0 480px;"`
    - Replace with plain container divs (no style attribute)
    - **Reasoning**: Intrinsic size values are 60-140px off from actual heights, causing layout thrashing
    - _Bug_Condition: Frame times > 16.67ms during scroll due to layout recalculation_
    - _Expected_Behavior: Smooth scrolling without layout jumps (from design FR1)_
    - _Preservation: Visual layout remains identical (3.1)_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1_

  - [x] 3.2 Apply CSS containment to list items
    - **File**: `src/lib/modules/analytics/components/AnalyticsView.svelte`
    - Add `style="contain: layout style;"` to Personal Bests cards (line ~260)
    - Update keyboard heatmap keys from `style="contain: style;"` to `style="contain: layout style;"` (line ~235)
    - Add `style="contain: layout;"` to Recent Tests table rows (line ~370)
    - **File**: `src/lib/modules/typing/components/HistoryView.svelte`
    - Add `style="contain: layout style;"` to History card container (find card wrapper, likely line ~150)
    - **Reasoning**: Isolates layout calculations within component boundaries, preventing propagation
    - _Bug_Condition: Layout propagation across 100+ elements (1.13)_
    - _Expected_Behavior: Scoped layout calculations (from design FR1)_
    - _Preservation: Visual appearance unchanged (3.1, 3.2, 3.3)_
    - _Requirements: 1.13, 2.13, 3.1_

  - [x] 3.3 Optimize transition properties
    - **File**: `src/lib/modules/typing/components/HistoryView.svelte`
    - Replace `transition-[transform,box-shadow,border-color] duration-150` with transform-only transition:
      - Update class to: `transition-transform duration-150`
      - Add `will-change-transform` utility class
      - Add GPU hint: `style="transform: translateZ(0);"`
    - **File**: `src/lib/modules/analytics/components/AnalyticsView.svelte`
    - Optimize Personal Bests card transitions (line ~260):
      - Replace `transition-[transform,box-shadow]` with `transition-transform duration-200`
      - Keep hover effects: `hover:shadow-sm hover:-translate-y-0.5`
    - Optimize table row hover (line ~370):
      - Keep `class="hover:bg-tt-surface-2/60"`
      - Add `style="contain: layout; will-change: background-color;"`
    - **Reasoning**: Transform-only transitions use GPU compositor without triggering layout/paint
    - _Bug_Condition: GPU layer proliferation on 100+ elements (1.7, 1.8, 1.9)_
    - _Expected_Behavior: Reduced GPU overhead (from design FR1)_
    - _Preservation: Visual hover effects identical (3.1, 3.3)_
    - _Requirements: 1.7, 1.8, 1.9, 2.7, 2.8, 2.9, 3.3_

  - [x] 3.4 Create performance utility classes
    - **File**: `src/app.css`
    - Add new utility classes at end of file:
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
    - **Reasoning**: Centralized utilities for consistent performance optimizations
    - _Expected_Behavior: Reusable performance patterns (from design FR1)_
    - _Preservation: No functional changes, additive only (3.15)_
    - _Requirements: 2.13, 2.14, 2.15_

  - [x] 3.5 Verify Phase 1 performance improvements
    - **Property 1: Expected Behavior** - CSS Optimizations Effective
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - Run bug condition exploration test from step 1
    - Measure improvements:
      - Analytics scroll frame times (target: ≤16.67ms, expected improvement: 40-80ms → 18-25ms)
      - History hover response (target: ≤100ms, expected improvement: 30-50ms → 15-30ms)
      - Settings load time (target: ≤200ms, expected improvement: 400-600ms → 250-350ms)
    - **EXPECTED OUTCOME**: Partial pass - frame times improved but may not fully meet 60fps target yet
    - Document progress: "Phase 1 reduces frame times by ~50-60%, further optimization needed"
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 2.8, 2.9, 2.13, 2.14, 2.15_

  - [x] 3.6 Verify Phase 1 preservation
    - **Property 2: Preservation** - Visual and Functional Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions from CSS changes)
    - Confirm all visual design, sort order, filters, pagination logic unchanged
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 4. Phase 2: Reactive Computation Optimization (High Priority - Medium Risk, High Impact)

  - [x] 4.1 Memoize chart data computations
    - **File**: `src/lib/modules/analytics/controllers/analytics.controller.svelte.ts`
    - Add reference tracking after line ~75:
      ```typescript
      let prevSeriesRef = $state.raw<typeof store.series | null>(null);
      let cachedSpeedData = $state.raw<typeof speedChartData>([]);
      let cachedAccuracyData = $state.raw<typeof accuracyChartData>([]);
      ```
    - Wrap `speedChartData` derived (line ~90) with bailout condition:
      ```typescript
      const speedChartData = $derived.by(() => {
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
      ```
    - Apply same pattern to `accuracyChartData` (line ~97)
    - **Reasoning**: Chart data only changes when series reference changes
    - _Bug_Condition: Excessive recomputation on every update (1.5)_
    - _Expected_Behavior: Memoized results (from design FR2)_
    - _Preservation: Chart data values identical (3.6, 3.13)_
    - _Requirements: 1.5, 2.5, 3.6_

  - [x] 4.2 Optimize keyboard heatmap computation
    - **File**: `src/lib/modules/analytics/controllers/analytics.controller.svelte.ts`
    - Add memoization for `keyCells` after line ~70:
      ```typescript
      let prevHeatmapRef = $state.raw<typeof store.heatmap | null>(null);
      let cachedKeyCells = $state.raw<typeof keyCells>([]);
      
      const keyCells = $derived.by(() => {
        if (prevHeatmapRef === store.heatmap && cachedKeyCells.length > 0) {
          return cachedKeyCells;
        }
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
    - **Reasoning**: Keyboard heatmap rarely changes, prevents 30-key layout recalculation
    - _Bug_Condition: Expensive computation on every update (1.5)_
    - _Expected_Behavior: Cached keyboard layout (from design FR2)_
    - _Preservation: Heatmap values and styling identical (3.6)_
    - _Requirements: 1.5, 2.5, 3.6_

  - [x] 4.3 Optimize AnalyticsView pagination
    - **File**: `src/lib/modules/analytics/components/AnalyticsView.svelte`
    - Add memoization for `paginatedResults` (line ~45):
      ```typescript
      let prevResultsRef = $state<typeof store.recentResults | null>(null);
      let prevPage = $state(0);
      let prevPageSize = $state(0);
      let cachedPaginatedResults = $state.raw<typeof paginatedResults>([]);
      
      const paginatedResults = $derived.by(() => {
        const page = Math.min(currentPage, maxPage);
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
    - **Reasoning**: Prevents redundant array slicing during scroll/hover
    - _Bug_Condition: Unnecessary pagination recalculation (1.6)_
    - _Expected_Behavior: Incremental pagination (from design FR5)_
    - _Preservation: Pagination logic and results identical (3.2, 3.4)_
    - _Requirements: 1.6, 2.6, 3.2_

  - [x] 4.4 Optimize HistoryView sorting
    - **File**: `src/lib/modules/typing/components/HistoryView.svelte`
    - Find `sortedResults` derived (likely line ~50)
    - Add memoization:
      ```typescript
      let prevResultsRef = $state.raw<typeof results | null>(null);
      let prevSortBy = $state("");
      let cachedSortedResults = $state.raw<ResultSummaryDto[]>([]);
      
      const sortedResults = $derived.by(() => {
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
    - **Reasoning**: Sorting 500+ items is expensive (~5-10ms), caching prevents re-sorting
    - _Bug_Condition: Re-sorting entire array on every update (1.6)_
    - _Expected_Behavior: Cached sort results (from design FR2)_
    - _Preservation: Sort order results identical (3.4)_
    - _Requirements: 1.6, 2.6, 3.4_

  - [x] 4.5 Verify Phase 2 performance improvements
    - **Property 1: Expected Behavior** - Reactive Optimizations Effective
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - Run bug condition exploration test from step 1
    - Measure improvements:
      - Analytics scroll frame times (target: ≤16.67ms, expected: 18-25ms → 12-16ms)
      - History hover response (target: ≤100ms, expected: 15-30ms → 10-15ms)
      - Settings load time (target: ≤200ms, expected: 250-350ms → 180-220ms)
    - **EXPECTED OUTCOME**: Near-pass - frame times approaching 60fps target, load time close to 200ms
    - Document progress: "Phase 2 achieves ~90% of performance target"
    - _Requirements: 2.4, 2.5, 2.6, 2.12_

  - [x] 4.6 Verify Phase 2 preservation
    - **Property 2: Preservation** - Visual and Functional Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions from reactive changes)
    - Verify analytics calculations produce identical numerical results
    - Verify sort orders and filters produce identical results
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 5. Phase 3: Chart Rendering Optimization (Medium Priority - Medium Risk, Medium Impact)

  - [x] 5.1 Add data equality check to LineChart
    - **File**: `src/lib/shared/ui/charts/LineChart.svelte`
    - Add shallow equality tracking after line ~40:
      ```typescript
      let prevDataRef = $state.raw<typeof data | null>(null);
      let prevColor = $state("");
      let prevSecondaryColor = $state("");
      const shouldRecalculate = $derived(
        prevDataRef !== data || prevColor !== color || prevSecondaryColor !== secondaryColor
      );
      ```
    - **Reasoning**: Prevents unnecessary chart recalculations
    - _Bug_Condition: Charts re-render on every parent update (1.11)_
    - _Expected_Behavior: Conditional re-rendering (from design FR3)_
    - _Preservation: Chart visual output identical (3.13)_
    - _Requirements: 1.11, 2.11, 3.13_

  - [x] 5.2 Memoize points computation
    - **File**: `src/lib/shared/ui/charts/LineChart.svelte`
    - Add memoization to `points` derived (line ~90):
      ```typescript
      let cachedPoints = $state.raw<typeof points>([]);
      const points = $derived.by(() => {
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
            index: i, x, y, ySecondary,
            value: d.y, secondaryValue: d.secondaryY,
            label: d.label ?? String(d.x), sublabel: d.sublabel,
          };
        });
        cachedPoints = result;
        prevDataRef = data;
        prevColor = color;
        prevSecondaryColor = secondaryColor;
        return result;
      });
      ```
    - **Reasoning**: Point calculation is expensive (~5-10ms for 100 points)
    - _Bug_Condition: Redundant SVG calculations (1.11)_
    - _Expected_Behavior: Cached point data (from design FR3)_
    - _Preservation: Chart rendering identical (3.13)_
    - _Requirements: 1.11, 2.11, 3.13_

  - [x] 5.3 Memoize path string generation
    - **File**: `src/lib/shared/ui/charts/LineChart.svelte`
    - Add path caching before `primaryPathString` derived (line ~140):
      ```typescript
      let prevPointsRef = $state.raw<typeof points | null>(null);
      let prevShowPrimary = $state(true);
      let prevShowSecondary = $state(true);
      let cachedPrimaryPath = $state("");
      let cachedSecondaryPath = $state("");
      
      const primaryPathString = $derived.by(() => {
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
    - **Reasoning**: SVG path generation is expensive (~2-5ms for 100 points)
    - _Bug_Condition: Redundant path string calculation (1.11)_
    - _Expected_Behavior: Cached path strings (from design FR3)_
    - _Preservation: Chart paths identical (3.13)_
    - _Requirements: 1.11, 2.11, 3.13_

  - [x] 5.4 Verify Phase 3 performance improvements
    - **Property 1: Expected Behavior** - Chart Optimizations Effective
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - Run bug condition exploration test from step 1
    - Measure improvements:
      - Analytics scroll frame times (target: ≤16.67ms, expected: 12-16ms → 10-14ms)
      - History hover response (target: ≤100ms, expected: 10-15ms → 8-12ms)
      - Settings load time (target: ≤200ms, expected: 180-220ms → 160-190ms)
    - **EXPECTED OUTCOME**: Pass - all metrics meet or exceed performance targets
    - Document success: "Phase 3 achieves 60fps scrolling, sub-200ms load times"
    - _Requirements: 2.11, 2.16, 2.17, 2.18_

  - [x] 5.5 Verify Phase 3 preservation
    - **Property 2: Preservation** - Visual and Functional Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions from chart changes)
    - Verify chart visual appearance identical (line colors, data points, labels)
    - _Requirements: 3.13_

- [x] 6. Phase 4: Optional Virtual Scrolling (Only if Phase 1-3 insufficient)

  - [x] 6.1 Evaluate need for virtual scrolling
    - Review Phase 3 performance test results
    - **Decision criteria**:
      - If 500+ item load time < 200ms AND scroll fps ≥ 60: SKIP Phase 4 (optimization sufficient)
      - If 500+ item load time > 200ms OR scroll fps < 60: PROCEED with Phase 4
    - Document decision in task notes
    - _Bug_Condition: Unoptimized rendering for 500+ items (1.10)_
    - _Expected_Behavior: Virtual scrolling for large lists (from design FR4)_
    - _Requirements: 1.10, 2.10_

  - [x] 6.2 Create VirtualList component (if needed)
    - **File**: `src/lib/shared/ui/virtual/VirtualList.svelte` (NEW)
    - Implement native Svelte virtual scrolling:
      - Generic component accepting item array and render function
      - Calculate visible items based on scroll position
      - Render visible items + 5 item buffer above/below
      - Use CSS transforms for positioning (no layout thrashing)
      - Maintain scroll position during item count changes
    - **File**: `src/lib/shared/ui/virtual/index.ts` (NEW)
    - Export VirtualList component
    - **Reasoning**: Render only visible DOM nodes for large lists
    - _Bug_Condition: All 500 items rendered simultaneously (1.10)_
    - _Expected_Behavior: Virtualized rendering (from design FR4)_
    - _Preservation: Visual output identical (3.1)_
    - _Requirements: 1.10, 2.10, 3.1_

  - [x] 6.3 Integrate VirtualList into HistoryView (if needed)
    - **File**: `src/lib/modules/typing/components/HistoryView.svelte`
    - Import VirtualList component
    - Replace manual list rendering with VirtualList:
      - Wrap existing card rendering logic in renderItem function
      - Pass sortedResults as items prop
      - Set itemHeight based on card height (~120px)
      - Apply only when results.length > 50
    - **Reasoning**: Reduce DOM nodes for large history lists
    - _Bug_Condition: 500+ DOM nodes rendered (1.10)_
    - _Expected_Behavior: ~15-20 visible nodes (from design FR4)_
    - _Preservation: Visual layout and interaction identical (3.1, 3.8)_
    - _Requirements: 1.10, 2.10, 3.1, 3.8_

  - [x] 6.4 Integrate VirtualList into Settings Database tab (if needed)
    - **File**: Find Settings Database tab component (likely `src/lib/modules/settings/components/DatabaseTab.svelte`)
    - Apply same VirtualList integration as HistoryView
    - Configure for database record card height
    - **Reasoning**: Reduce DOM nodes for large test record lists
    - _Bug_Condition: 500+ test records rendered (1.10, 1.12)_
    - _Expected_Behavior: Virtualized rendering (from design FR4)_
    - _Preservation: Database functionality identical (3.1, 3.6)_
    - _Requirements: 1.10, 1.12, 2.10, 3.1_

  - [x] 6.5 Verify Phase 4 performance improvements (if implemented)
    - **Property 1: Expected Behavior** - Virtual Scrolling Effective
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - Run bug condition exploration test from step 1
    - Measure improvements for 500+ item lists:
      - Initial render time (target: <200ms)
      - Scroll frame times (target: ≤16.67ms)
      - Memory usage reduction (expected: ~70-80% fewer DOM nodes)
    - **EXPECTED OUTCOME**: Pass - large list performance meets all targets
    - _Requirements: 2.10, 2.16, 2.18_

  - [x] 6.6 Verify Phase 4 preservation (if implemented)
    - **Property 2: Preservation** - Virtual Scrolling Behavior Identical
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions from virtualization)
    - Verify scroll position maintained during navigation
    - Verify all items accessible via scrolling
    - _Requirements: 3.1, 3.8, 3.11_

- [x] 7. Final Verification and Testing

  - [x] 7.1 Run comprehensive performance benchmarks
    - **Property 1: Expected Behavior** - All Performance Targets Met
    - Run bug condition exploration test from task 1
    - Verify all metrics meet targets:
      - ✓ Analytics page (100+ items): Frame times ≤16.67ms during scroll
      - ✓ History page (80+ cards): Hover response ≤100ms
      - ✓ Settings Database (500+ records): Initial render ≤200ms
      - ✓ Pagination: Response time ≤50ms
    - Test across multiple dataset sizes:
      - Small (10-20 items): Should be unaffected
      - Medium (50-100 items): Should meet targets
      - Large (500+ items): Should meet targets
    - **EXPECTED OUTCOME**: Full pass - all performance targets achieved
    - _Requirements: 2.16, 2.17, 2.18_

  - [x] 7.2 Run full preservation test suite
    - **Property 2: Preservation** - All Behavior Unchanged
    - Run preservation property tests from task 2
    - Verify all preservation requirements:
      - ✓ Visual design identical (colors, spacing, typography, animations)
      - ✓ Pagination logic unchanged (10 items/page default)
      - ✓ Sort orders identical (newest, oldest, speed, accuracy)
      - ✓ Filter criteria unchanged (mode filters work correctly)
      - ✓ Analytics calculations numerically identical
      - ✓ Hover effects display correctly
      - ✓ Reactive dependencies update properly
      - ✓ Accessibility features preserved (ARIA, semantic HTML, keyboard nav)
      - ✓ Small datasets (<50 items) render without virtualization
      - ✓ Component integration unchanged in non-Arena contexts
    - **EXPECTED OUTCOME**: Full pass - no regressions detected
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14_

  - [x] 7.3 Run project-wide verification
    - Execute project validation commands:
      ```bash
      pnpm typecheck
      pnpm lint
      pnpm test
      pnpm run check:i18n
      pnpm run check:budget
      ```
    - All commands must pass with 0 errors and 0 warnings
    - **EXPECTED OUTCOME**: All checks pass
    - _Requirements: 3.15_

  - [x] 7.4 Manual testing checklist
    - [x] Test Analytics page:
      - Load with 10 tests (small dataset)
      - Load with 100 tests (medium dataset)
      - Load with 500+ tests (large dataset)
      - Scroll through recent tests table smoothly
      - Hover over Personal Bests cards (instant feedback)
      - Change sort order (speed, accuracy)
      - Change mode filter (time, words, quote, custom)
      - Verify charts display correctly
      - Verify keyboard heatmap displays correctly
    - [x] Test History page:
      - Load with 20 results (small dataset)
      - Load with 80 results (medium dataset)
      - Load with 500+ results (large dataset)
      - Scroll through history list smoothly
      - Hover over cards (smooth animation)
      - Change sort order (newest, oldest, speed, accuracy)
      - Use pagination controls (page navigation)
      - Delete a result (state update correct)
    - [x] Test Settings Database tab:
      - Load with 500+ test records
      - Scroll through records smoothly
      - Search/filter records (if applicable)
      - Delete records (if applicable)
    - [x] Test accessibility:
      - Tab through all interactive elements (correct focus order)
      - Use keyboard shortcuts (work correctly)
      - Test with screen reader (semantic HTML preserved)
    - [x] Test on Linux/Debian (development platform):
      - Verify performance on native platform
      - Verify Tauri V2 integration works correctly
    - **EXPECTED OUTCOME**: All manual tests pass without issues
    - _Requirements: 3.9, 3.10, 3.17, 3.18_

- [x] 8. Checkpoint - Ensure all tests pass
  - Confirm bug condition exploration test now passes (60fps achieved)
  - Confirm preservation tests all pass (no regressions)
  - Confirm project-wide validation passes (typecheck, lint, test)
  - Document final performance metrics in task notes
  - Ask the user if questions arise or if further optimization needed

---

## Implementation Notes

### Phased Approach Rationale

1. **Phase 1 (CSS-only)**: Low-risk changes with high impact. Removing broken `content-visibility` and adding CSS containment provides immediate 40-60% performance improvement with minimal code changes.

2. **Phase 2 (Reactive)**: Medium-risk changes with high impact. Memoization prevents redundant computations without changing output. Requires careful reference tracking but doesn't alter data flow.

3. **Phase 3 (Charts)**: Medium-risk changes with medium impact. Chart optimizations are isolated to LineChart component. Provides additional 10-20% improvement for chart-heavy pages.

4. **Phase 4 (Virtual Scrolling)**: Optional based on Phase 3 results. Only implement if performance targets not met. Highest risk due to DOM rendering changes but provides 70-80% improvement for 500+ item lists.

### Testing Strategy

- **Bug Condition Exploration**: Measure performance metrics on unfixed code to confirm the bug exists and understand the magnitude of the problem.
- **Preservation Testing**: Observe baseline behavior on unfixed code, then write tests to ensure that behavior is preserved after each phase.
- **Incremental Verification**: Test after each phase to isolate the impact of each optimization and catch regressions early.
- **Property-Based Testing**: Use property-based tests for preservation to generate many test cases automatically and catch edge cases.

### Performance Targets

- **60fps scrolling**: ≤16.67ms frame times during scroll events
- **Fast initial render**: <200ms to display 500+ records
- **Responsive pagination**: <50ms to navigate between pages
- **Smooth hover effects**: <100ms response to hover events

### Preservation Commitments

All existing functionality must remain unchanged:
- Visual design (colors, spacing, typography, animations)
- Data processing logic (sort, filter, calculations)
- Reactive state management (updates, timing, dependencies)
- Accessibility features (ARIA, semantic HTML, keyboard navigation)
- Component integration in non-Arena contexts
- Code architecture (LINUS LAW, Eric S. Raymond LAW, UNIX Philosophy)
- Platform behavior (Linux/Debian, Tauri V2)

### Decision Points

**After Phase 3 (Task 5.4)**:
- If performance targets met: Skip Phase 4 (virtual scrolling not needed)
- If performance targets not met: Proceed with Phase 4 (implement virtual scrolling)

**Performance Measurement**:
- Use Chrome DevTools Performance profiler for frame time analysis
- Use performance.now() for precise timing measurements
- Document actual metrics at each phase for comparison

### Risk Mitigation

- **Phased implementation**: Each phase is independently testable and reversible
- **Preservation tests first**: Ensure baseline behavior is captured before making changes
- **Incremental verification**: Test after each phase to catch issues early
- **Reference-based memoization**: Use shallow equality checks to prevent deep comparison overhead
- **CSS-first approach**: Prioritize low-risk CSS changes before code refactoring
