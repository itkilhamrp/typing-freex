import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ThemeFab from './ThemeFab.svelte';
import { settingsStore } from '#lib/modules/settings/stores/settings.store.svelte.js';
import { resetMockStore } from '@/core/ipc/client';

describe('ThemeFab (Svelte 5 Runes)', () => {
  beforeEach(async () => {
    localStorage.clear();
    resetMockStore();
    settingsStore.resetSettingsState();
    await settingsStore.updateSetting('ui.theme', 'dark');
  });

  it('renders theme fab button with correct attributes', () => {
    const { container } = render(ThemeFab);
    const button = container.querySelector('#theme-fab-button');
    expect(button).not.toBeNull();
    expect(button?.getAttribute('type')).toBe('button');
  });

  it('expands capsule menu on click and toggles theme via sub-button', async () => {
    const { container } = render(ThemeFab);
    const button = container.querySelector('#theme-fab-button') as HTMLButtonElement;
    expect(button).not.toBeNull();

    // Default theme is 'dark' and capsule is closed
    expect(settingsStore.theme).toBe('dark');
    expect(container.querySelector('#fab-capsule-menu')).toBeNull();

    // Click primary FAB to expand capsule upward
    await fireEvent.pointerDown(button, { clientX: 100, clientY: 100, button: 0 });
    await fireEvent.pointerUp(button, { clientX: 100, clientY: 100, button: 0 });

    const capsule = container.querySelector('#fab-capsule-menu');
    expect(capsule).not.toBeNull();

    const themeSubBtn = container.querySelector('#fab-action-theme') as HTMLButtonElement;
    expect(themeSubBtn).not.toBeNull();

    // Click theme action inside capsule
    await fireEvent.click(themeSubBtn);
    expect(settingsStore.theme).toBe('light');

    // Click theme action again to toggle back to 'dark'
    await fireEvent.click(themeSubBtn);
    expect(settingsStore.theme).toBe('dark');
  });

  it('toggles capsule menu when pressing Enter or Space key', async () => {
    const { container } = render(ThemeFab);
    const button = container.querySelector('#theme-fab-button') as HTMLButtonElement;
    expect(button).not.toBeNull();

    expect(container.querySelector('#fab-capsule-menu')).toBeNull();

    await fireEvent.keyDown(button, { key: 'Enter' });
    expect(container.querySelector('#fab-capsule-menu')).not.toBeNull();

    const themeSubBtn = container.querySelector('#fab-action-theme') as HTMLButtonElement;
    await fireEvent.click(themeSubBtn);
    expect(settingsStore.theme).toBe('light');

    await fireEvent.keyDown(button, { key: ' ' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('does not open capsule menu if pointer moved significantly (dragging)', async () => {
    const { container } = render(ThemeFab);
    const button = container.querySelector('#theme-fab-button') as HTMLButtonElement;
    expect(button).not.toBeNull();

    expect(container.querySelector('#fab-capsule-menu')).toBeNull();

    // Pointer down at 100, 100
    await fireEvent.pointerDown(button, { clientX: 100, clientY: 100, button: 0 });
    // Pointer move to 200, 200 (delta 100px > 5px threshold)
    await fireEvent.pointerMove(button, { clientX: 200, clientY: 200 });
    // Pointer up
    await fireEvent.pointerUp(button, { clientX: 200, clientY: 200 });

    // Capsule should remain closed because it was a drag operation
    expect(container.querySelector('#fab-capsule-menu')).toBeNull();
  });

  it('applies dimmed opacity when dimmed prop is true', () => {
    const { container } = render(ThemeFab, {
      props: {
        dimmed: true,
      },
    });
    const rootEl = container.firstElementChild as HTMLElement;
    expect(rootEl).not.toBeNull();
    expect(rootEl.className).toContain('opacity-20');
  });

  it('automatically closes open capsule menu when typing starts (dimmed becomes true)', async () => {
    const { container, rerender } = render(ThemeFab, {
      props: { dimmed: false },
    });
    const button = container.querySelector('#theme-fab-button') as HTMLButtonElement;

    await fireEvent.pointerDown(button, { clientX: 100, clientY: 100, button: 0 });
    await fireEvent.pointerUp(button, { clientX: 100, clientY: 100, button: 0 });
    expect(container.querySelector('#fab-capsule-menu')).not.toBeNull();

    await rerender({ dimmed: true });
    expect(container.querySelector('#fab-capsule-menu')).toBeNull();
  });
});
