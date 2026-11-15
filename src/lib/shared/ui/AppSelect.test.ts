import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import AppSelect from './AppSelect.svelte';

describe('AppSelect Component (Svelte 5)', () => {
  const sampleOptions = [
    { value: 'en', label: 'English (en)' },
    { value: 'id', label: 'Bahasa Indonesia (id)' },
    { value: 'es', label: 'Español (es)' },
  ];

  it('renders selected option label on trigger button', () => {
    const { container } = render(AppSelect, {
      props: {
        value: 'en',
        options: sampleOptions,
      },
    });

    expect(container.textContent).toContain('English (en)');
  });

  it('toggles dropdown visibility when trigger button is clicked', async () => {
    const { container } = render(AppSelect, {
      props: {
        value: 'en',
        options: sampleOptions,
      },
    });

    // Initially closed
    expect(container.querySelector('[role="listbox"]')).toBeNull();

    // Click trigger button
    const trigger = container.querySelector('button');
    expect(trigger).not.toBeNull();
    await fireEvent.click(trigger!);
    expect(container.querySelector('[role="listbox"]')).not.toBeNull();

    // Click again to close
    await fireEvent.click(trigger!);
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });

  it('triggers onchange and updates when an option is clicked', async () => {
    const onchange = vi.fn();
    const { container } = render(AppSelect, {
      props: {
        value: 'en',
        options: sampleOptions,
        onchange,
      },
    });

    // Open dropdown
    const trigger = container.querySelector('button');
    await fireEvent.click(trigger!);

    // Click second option ('id')
    const options = Array.from(container.querySelectorAll('[role="option"]'));
    expect(options.length).toBe(3);
    await fireEvent.click(options[1]!);

    expect(onchange).toHaveBeenCalledWith('id');
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });

  it('closes dropdown when Escape key is pressed', async () => {
    const { container } = render(AppSelect, {
      props: {
        value: 'en',
        options: sampleOptions,
      },
    });

    const trigger = container.querySelector('button');
    await fireEvent.click(trigger!);
    expect(container.querySelector('[role="listbox"]')).not.toBeNull();

    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });
});
