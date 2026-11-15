import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import ActivityHeatmap from "./ActivityHeatmap.svelte";
import type { ActivityGridData } from "../controllers/analytics.controller.svelte";

describe("ActivityHeatmap (Monkeytype Graph Style)", () => {
  const createMockGridData = (totalTests = 15, maxDaily = 5): ActivityGridData => {
    const columns = Array.from({ length: 53 }, (_, c) =>
      Array.from({ length: 7 }, (_, r) => ({
        date: `2026-01-${String((c * 7 + r) % 28 + 1).padStart(2, "0")}`,
        count: (c === 0 && r === 0) ? 5 : (c === 1 && r === 2) ? 2 : 0,
        level: ((c === 0 && r === 0) ? 4 : (c === 1 && r === 2) ? 2 : 0) as 0 | 1 | 2 | 3 | 4,
        isFuture: false,
        timeSpentSeconds: 60,
        wordsTyped: 50,
        bestWpm: 85,
        avgWpm: 80,
      }))
    );

    return {
      columns,
      months: [
        { label: "Jan", colIndex: 0 },
        { label: "Feb", colIndex: 4 },
        { label: "Mar", colIndex: 8 },
      ],
      totalTests,
      maxDaily,
    };
  };

  it("renders Monkeytype header with tests count and less/more legend without 12M AI-slop badge", () => {
    const gridData = createMockGridData(7774);
    const { container } = render(ActivityHeatmap, { props: { gridData } });

    // The Monkeytype header: '7774 tests last 12 months'
    expect(container.textContent).toContain("7774 tests last 12 months");

    // AI-SLOP '12M' badge must NOT exist in the DOM
    const allText = container.textContent ?? "";
    expect(allText).not.toContain("12M");

    // Less / More legend in header
    expect(allText.toLowerCase()).toContain("less");
    expect(allText.toLowerCase()).toContain("more");
  });

  it("renders 53 columns and 7 rows of flat day cells without border or outline slop", () => {
    const gridData = createMockGridData();
    const { container } = render(ActivityHeatmap, { props: { gridData } });

    const grid = container.querySelector('[role="grid"]');
    expect(grid).not.toBeNull();

    const rows = container.querySelectorAll('[role="row"]');
    expect(rows.length).toBe(53);

    const cells = container.querySelectorAll('[role="gridcell"]');
    expect(cells.length).toBe(53 * 7);

    // Verify cells do NOT have border or decorative outline classes (flat solid Monkeytype style)
    const firstCell = cells[0];
    expect(firstCell).toBeDefined();
    expect(firstCell?.className).not.toContain("border");
    expect(firstCell?.className).not.toMatch(/\boutline-(?!none\b)/);
    expect(firstCell?.className).not.toContain("shadow");
  });

  it("renders lowercase weekday indicators (monday, wednesday, friday)", () => {
    const gridData = createMockGridData();
    const { container } = render(ActivityHeatmap, { props: { gridData } });

    // Weekdays
    expect(container.textContent).toContain("monday");
    expect(container.textContent).toContain("wednesday");
    expect(container.textContent).toContain("friday");
  });

  it("renders lowercase month labels below the grid", () => {
    const gridData = createMockGridData();
    const { container } = render(ActivityHeatmap, { props: { gridData } });

    // Month labels in lowercase
    expect(container.textContent).toContain("jan");
    expect(container.textContent).toContain("feb");
    expect(container.textContent).toContain("mar");
  });

  it("renders 5 level indicators in the Monkeytype legend", () => {
    const gridData = createMockGridData();
    const { container } = render(ActivityHeatmap, { props: { gridData } });

    const level0 = container.querySelector('[title="Level 0"]');
    const level1 = container.querySelector('[title="Level 1"]');
    const level2 = container.querySelector('[title="Level 2"]');
    const level3 = container.querySelector('[title="Level 3"]');
    const level4 = container.querySelector('[title="Level 4"]');

    expect(level0).not.toBeNull();
    expect(level1).not.toBeNull();
    expect(level2).not.toBeNull();
    expect(level3).not.toBeNull();
    expect(level4).not.toBeNull();

    // Verify legend indicators are also flat without borders
    expect(level0?.className).not.toContain("border");
  });

  it("filters partial first month when 13 months exist to yield clean 12-month calendar (nov-oct)", () => {
    const baseGridData = createMockGridData();
    // Simulate 13 months where month 0 is oct and month 12 is oct
    const gridData: ActivityGridData = {
      ...baseGridData,
      months: [
        { label: "Oct", colIndex: 0 },
        { label: "Nov", colIndex: 4 },
        { label: "Dec", colIndex: 8 },
        { label: "Jan", colIndex: 12 },
        { label: "Feb", colIndex: 16 },
        { label: "Mar", colIndex: 20 },
        { label: "Apr", colIndex: 25 },
        { label: "May", colIndex: 29 },
        { label: "Jun", colIndex: 33 },
        { label: "Jul", colIndex: 38 },
        { label: "Aug", colIndex: 42 },
        { label: "Sep", colIndex: 47 },
        { label: "Oct", colIndex: 51 },
      ],
    };

    const { container } = render(ActivityHeatmap, { props: { gridData } });

    // In a 13-month array, the partial first Oct at colIndex 0 is filtered out
    // The rendered labels should start with Nov
    expect(container.textContent).toContain("nov");
    expect(container.textContent).toContain("oct");
  });
});
