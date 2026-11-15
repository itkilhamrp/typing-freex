import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import AppTypeConfirmDialog from './AppTypeConfirmDialog.svelte';

describe('AppTypeConfirmDialog (Svelte 5)', () => {
  it('renders title, message, and prompt with default confirmWord RM', () => {
    const { container } = render(AppTypeConfirmDialog, {
      props: {
        opened: true,
        title: 'Delete Profile',
        message: 'Are you sure you want to delete profile Test?',
        confirmWord: 'RM',
      },
    });

    expect(container.textContent).toContain('Delete Profile');
    expect(container.textContent).toContain('Are you sure you want to delete profile Test?');
    const input = container.querySelector('input');
    expect(input).not.toBeNull();
    expect(input?.getAttribute('placeholder')).toBe('RM');
  });

  it('keeps confirm button disabled until exact confirmation word is entered', async () => {
    const onconfirm = vi.fn();
    const { container } = render(AppTypeConfirmDialog, {
      props: {
        opened: true,
        confirmWord: 'RM',
        confirmText: 'Delete Permanently',
        onconfirm,
      },
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const confirmBtn = buttons.find((b) => b.textContent?.includes('Delete Permanently'));
    expect(confirmBtn).toBeDefined();
    expect(confirmBtn?.hasAttribute('disabled')).toBe(true);

    const input = container.querySelector('input');
    expect(input).not.toBeNull();

    await fireEvent.input(input!, { target: { value: 'wrong' } });
    expect(confirmBtn?.hasAttribute('disabled')).toBe(true);

    await fireEvent.input(input!, { target: { value: 'RM' } });
    expect(confirmBtn?.hasAttribute('disabled')).toBe(false);

    await fireEvent.click(confirmBtn!);
    expect(onconfirm).toHaveBeenCalled();
  });

  it('triggers oncancel on cancel button click', async () => {
    const oncancel = vi.fn();
    const { container } = render(AppTypeConfirmDialog, {
      props: {
        opened: true,
        cancelText: 'Cancel Action',
        oncancel,
      },
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const cancelBtn = buttons.find((b) => b.textContent?.includes('Cancel Action'));
    expect(cancelBtn).toBeDefined();

    await fireEvent.click(cancelBtn!);
    expect(oncancel).toHaveBeenCalled();
  });
});
