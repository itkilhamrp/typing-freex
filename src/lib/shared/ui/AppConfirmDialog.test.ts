import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import AppConfirmDialog from "./AppConfirmDialog.svelte";
import { useConfirmDialog } from "#lib/shared/actions/confirm-dialog.svelte.js";

describe("AppConfirmDialog (Svelte 5)", () => {
  it("renders title and message correctly when opened", () => {
    const { container } = render(AppConfirmDialog, {
      props: {
        opened: true,
        title: "Delete Confirmation",
        message: "Are you sure you want to delete this item?",
      },
    });

    expect(container.textContent).toContain("Delete Confirmation");
    expect(container.textContent).toContain(
      "Are you sure you want to delete this item?",
    );
  });

  it("triggers onconfirm when confirm button is clicked", async () => {
    const onconfirm = vi.fn();
    const { container } = render(AppConfirmDialog, {
      props: {
        opened: true,
        title: "Delete Item",
        confirmText: "Yes, Delete",
        onconfirm,
      },
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const confirmBtn = buttons.find((b) =>
      b.textContent?.includes("Yes, Delete"),
    );
    expect(confirmBtn).toBeDefined();

    await fireEvent.click(confirmBtn!);
    expect(onconfirm).toHaveBeenCalled();
  });

  it("triggers oncancel when cancel button is clicked", async () => {
    const oncancel = vi.fn();
    const { container } = render(AppConfirmDialog, {
      props: {
        opened: true,
        cancelText: "No, Keep",
        oncancel,
      },
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const cancelBtn = buttons.find((b) => b.textContent?.includes("No, Keep"));
    expect(cancelBtn).toBeDefined();

    await fireEvent.click(cancelBtn!);
    expect(oncancel).toHaveBeenCalled();
  });

  it("disables buttons when loading is true", () => {
    const { container } = render(AppConfirmDialog, {
      props: {
        opened: true,
        loading: true,
      },
    });

    const buttons = container.querySelectorAll("button");
    for (const btn of buttons) {
      expect(btn.hasAttribute("disabled")).toBe(true);
    }
  });
});

describe("useConfirmDialog action helper", () => {
  it("manages open, target payload, and close cleanly", () => {
    const dialog = useConfirmDialog<{ id: string; name: string }>();

    expect(dialog.isOpen).toBe(false);
    expect(dialog.item).toBeNull();

    dialog.open({ id: "123", name: "Test Item" });
    expect(dialog.isOpen).toBe(true);
    expect(dialog.item).toEqual({ id: "123", name: "Test Item" });

    dialog.close();
    expect(dialog.isOpen).toBe(false);
    expect(dialog.item).toBeNull();
  });
});
