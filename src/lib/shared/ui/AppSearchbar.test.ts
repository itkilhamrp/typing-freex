import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import AppSearchbar from './AppSearchbar.svelte';

describe('AppSearchbar (Svelte 5)', () => {
  it('renders input with placeholder and initial value', () => {
    const { container } = render(AppSearchbar, {
      props: {
        value: 'Initial text',
        placeholder: 'Search items...',
      },
    });

    const input = container.querySelector('input');
    expect(input).not.toBeNull();
    expect(input?.getAttribute('placeholder')).toBe('Search items...');
    expect(input?.value).toBe('Initial text');
  });

  it('handles input events cleanly', async () => {
    const oninput = vi.fn();
    const { container } = render(AppSearchbar, {
      props: {
        value: '',
        oninput,
      },
    });

    const input = container.querySelector('input');
    expect(input).not.toBeNull();

    await fireEvent.input(input!, { target: { value: 'typing query' } });
    expect(oninput).toHaveBeenCalled();
  });

  it('triggers onclear and ondisable when cancel/disable action occurs', async () => {
    const onclear = vi.fn();
    const ondisable = vi.fn();
    const { container } = render(AppSearchbar, {
      props: {
        value: 'hello',
        disableButton: true,
        onclear,
        ondisable,
      },
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    if (buttons.length > 0) {
      const cancelBtn = buttons[buttons.length - 1];
      await fireEvent.click(cancelBtn!);
      expect(onclear).toHaveBeenCalled();
      expect(ondisable).toHaveBeenCalled();
    }
  });
});
