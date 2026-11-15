import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/svelte";
import Navigation from "./Navigation.svelte";
import { useTypingStore } from "#lib/modules/modes/classic/stores/typing.store.svelte.js";

describe("Navigation.svelte (Svelte 5 + Skeleton UI)", () => {
  beforeEach(() => {
    const store = useTypingStore();
    store.resetTypingState();
  });

  it("renders desktop toolbar mode with toolbar header", () => {
    const { container } = render(Navigation, { props: { mode: "toolbar" } });
    const header = container.querySelector("header");
    expect(header).not.toBeNull();
    expect(header?.classList.contains("shadow-glass")).toBe(true);
    expect(header?.textContent).toContain("Typing FreeX");
    expect(header?.textContent).toContain("Classic");
  });

  it("renders primary navigation items", () => {
    const { container } = render(Navigation, { props: { mode: "toolbar" } });
    const navButtons = container.querySelectorAll(
      'nav[aria-label="Main Navigation"] button',
    );
    expect(navButtons.length).toBe(5);
  });

  it("renders mobile tabbar mode when mode is tabbar-full", () => {
    const { container } = render(Navigation, {
      props: { mode: "tabbar-full" },
    });
    const header = container.querySelector("header");
    expect(header).toBeNull();
    const links = container.querySelectorAll("a, button");
    expect(links.length).toBeGreaterThan(0);
  });

  it("adjusts opacity when typing is active", async () => {
    const store = useTypingStore();
    const { container, rerender } = render(Navigation, {
      props: { mode: "toolbar" },
    });

    const header = container.querySelector("header");
    expect(header?.classList.contains("opacity-100")).toBe(true);

    store.setIsTyping(true);
    await rerender({ mode: "toolbar" });
    expect(header?.classList.contains("opacity-20")).toBe(true);
  });
});
