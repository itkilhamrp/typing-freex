import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import Keymap from "./Keymap.svelte";
import { DEFAULT_KEYBOARD_LAYOUT } from "@/core/keymap";

describe("Keymap Alice Visual Parity", () => {
  it("renders Alice Full mode with unrotated macro keys and flat bottom modifiers", () => {
    const { container } = render(Keymap, {
      props: {
        layout: DEFAULT_KEYBOARD_LAYOUT,
        style: "alice",
        showKeys: "full",
        size: 1.0,
      },
    });

    const aliceContainer = container.querySelector(".keymap-alice-container");
    expect(aliceContainer).not.toBeNull();
    expect(aliceContainer?.getAttribute("style")).toContain("gap: calc(var(--km-unit) * 0.5)");

    // Verify unrotated left macro keys (Esc, PgUp, PgDn) and ControlLeft
    const unrotatedLeft = container.querySelectorAll(".keymap-key-unrotated-left");
    expect(unrotatedLeft.length).toBe(4);
    const codes = Array.from(unrotatedLeft).map((el) => el.getAttribute("data-code"));
    expect(codes).toContain("Escape");
    expect(codes).toContain("PageUp");
    expect(codes).toContain("PageDown");
    expect(codes).toContain("ControlLeft");

    // Verify unrotated right ControlRight
    const unrotatedRight = container.querySelectorAll(".keymap-key-unrotated-right");
    expect(unrotatedRight.length).toBe(1);
    expect(unrotatedRight[0]?.getAttribute("data-code")).toBe("ControlRight");

    // Verify reset icon on right spacebar
    const resetIcon = container.querySelector(".keymap-space-reset");
    expect(resetIcon).not.toBeNull();
    expect(resetIcon?.textContent?.trim()).toBe("↻");
  });

  it("renders Alice Minimal mode with dual B keys and spacebar reset icon", () => {
    const { container } = render(Keymap, {
      props: {
        layout: DEFAULT_KEYBOARD_LAYOUT,
        style: "alice",
        showKeys: "minimal",
        size: 1.0,
      },
    });

    const bKeys = container.querySelectorAll('[data-code="KeyB"]');
    expect(bKeys.length).toBe(2);

    const resetIcon = container.querySelector(".keymap-space-reset");
    expect(resetIcon).not.toBeNull();
    expect(resetIcon?.textContent?.trim()).toBe("↻");
  });

  it("renders Alice Minimal Numrow mode with 1..6 on left and 7..= on right", () => {
    const { container } = render(Keymap, {
      props: {
        layout: DEFAULT_KEYBOARD_LAYOUT,
        style: "alice",
        showKeys: "minimal_numrow",
        size: 1.0,
      },
    });

    expect(container.querySelector('[data-code="Digit1"]')).not.toBeNull();
    expect(container.querySelector('[data-code="Digit6"]')).not.toBeNull();
    expect(container.querySelector('[data-code="Digit7"]')).not.toBeNull();
    expect(container.querySelector('[data-code="Equal"]')).not.toBeNull();

    const resetIcon = container.querySelector(".keymap-space-reset");
    expect(resetIcon).not.toBeNull();
  });

  it("applies zero-lag react and next mode state classes accurately", () => {
    // Next mode
    const { container: nextContainer } = render(Keymap, {
      props: {
        layout: DEFAULT_KEYBOARD_LAYOUT,
        mode: "next",
        nextKeyCode: "KeyF",
      },
    });
    const keyF = nextContainer.querySelector('[data-code="KeyF"]');
    expect(keyF?.classList.contains("is-next")).toBe(true);

    // React mode correct
    const { container: reactCorrectContainer } = render(Keymap, {
      props: {
        layout: DEFAULT_KEYBOARD_LAYOUT,
        mode: "react",
        activeKeyCode: "KeyJ",
        activeKeyCorrect: true,
      },
    });
    const keyJ = reactCorrectContainer.querySelector('[data-code="KeyJ"]');
    expect(keyJ?.classList.contains("is-react-correct")).toBe(true);

    // React mode error
    const { container: reactErrorContainer } = render(Keymap, {
      props: {
        layout: DEFAULT_KEYBOARD_LAYOUT,
        mode: "react",
        activeKeyCode: "KeyK",
        activeKeyCorrect: false,
      },
    });
    const keyK = reactErrorContainer.querySelector('[data-code="KeyK"]');
    expect(keyK?.classList.contains("is-react-error")).toBe(true);
  });

  it("imperative pulse sets and clears data-react attribute", async () => {
    const { container, component } = render(Keymap, {
      props: {
        layout: DEFAULT_KEYBOARD_LAYOUT,
        mode: "react",
      },
    });

    const keyJ = container.querySelector('[data-code="KeyJ"]');
    expect(keyJ?.getAttribute("data-react")).toBeNull();

    // Pulse KeyJ correct
    (component as unknown as { pulse: (code: string, isCorrect: boolean) => void }).pulse("KeyJ", true);
    expect(keyJ?.getAttribute("data-react")).toBe("ok");

    // Wait 80ms for pulse auto-release
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(keyJ?.getAttribute("data-react")).toBeNull();

    // Pulse KeyJ error
    (component as unknown as { pulse: (code: string, isCorrect: boolean) => void }).pulse("KeyJ", false);
    expect(keyJ?.getAttribute("data-react")).toBe("err");

    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(keyJ?.getAttribute("data-react")).toBeNull();
  });
});
