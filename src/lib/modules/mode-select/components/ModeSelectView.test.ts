import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import ModeSelectView from "./ModeSelectView.svelte";
import { HUD } from "./ascii-art-data";

describe("ModeSelectView.svelte (Ribbon Layout)", () => {
  it("renders all 3 mode ribbons", () => {
    const { container } = render(ModeSelectView);

    const ribbons = container.querySelectorAll(".mode-ribbon");
    expect(ribbons.length).toBe(3);
  });

  it("renders Classic mode ribbon as available (ready badge)", () => {
    const { container } = render(ModeSelectView);

    const classicRibbon = container.querySelector(".mode-ribbon--classic");
    expect(classicRibbon).not.toBeNull();
    expect(classicRibbon?.textContent).toContain("Classic");
    expect(classicRibbon?.querySelector(".mode-ribbon__badge--ready")).not.toBeNull();

    const classicOrb = container.querySelector(".mode-orb--classic");
    expect(classicOrb).not.toBeNull();
  });

  it("renders Learning and Games ribbons as locked/coming soon", () => {
    const { container } = render(ModeSelectView);

    const learningRibbon = container.querySelector(".mode-ribbon--learning");
    const gamesRibbon = container.querySelector(".mode-ribbon--games");
    expect(learningRibbon?.querySelector(".mode-ribbon__badge--locked")).not.toBeNull();
    expect(gamesRibbon?.querySelector(".mode-ribbon__badge--locked")).not.toBeNull();
  });

  it("applies zigzag stagger classes", () => {
    const { container } = render(ModeSelectView);

    const ribbons = container.querySelectorAll(".mode-ribbon");
    expect(ribbons[0]?.classList.contains("mode-ribbon--stagger-left")).toBe(true);
    expect(ribbons[1]?.classList.contains("mode-ribbon--stagger-right")).toBe(true);
    expect(ribbons[2]?.classList.contains("mode-ribbon--stagger-left")).toBe(true);
  });

  it("provides Classic telemetry tag in ascii HUD data", () => {
    expect(HUD.classic.tag).toBe("CLASSIC :: TYPING ENGINE");
    expect(HUD.arena.tag).toBe("CLASSIC :: TYPING ENGINE");
  });
});
