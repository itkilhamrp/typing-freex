import { describe, it, expect } from 'vitest';
import { useConfirmDialog } from './confirm-dialog.svelte';

describe('useConfirmDialog action (Svelte 5 Runes)', () => {
  it('manages open, target payload, and close cleanly', () => {
    const dialog = useConfirmDialog<{ id: string; name: string }>();

    expect(dialog.isOpen).toBe(false);
    expect(dialog.item).toBeNull();

    dialog.open({ id: '123', name: 'Test Item' });
    expect(dialog.isOpen).toBe(true);
    expect(dialog.item).toEqual({ id: '123', name: 'Test Item' });

    dialog.close();
    expect(dialog.isOpen).toBe(false);
    expect(dialog.item).toBeNull();
  });
});
