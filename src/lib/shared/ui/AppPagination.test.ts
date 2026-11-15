import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import AppPagination from './AppPagination.svelte';

describe('AppPagination (Svelte 5)', () => {
  it('renders telemetry showing items range and total correctly', () => {
    const { container } = render(AppPagination, {
      props: {
        currentPage: 1,
        totalItems: 45,
        pageSize: 10,
      },
    });

    expect(container.textContent).toContain('Showing 1–10 of 45 runs');
  });

  it('renders correct telemetry on intermediate pages', () => {
    const { container } = render(AppPagination, {
      props: {
        currentPage: 3,
        totalItems: 45,
        pageSize: 10,
      },
    });

    expect(container.textContent).toContain('Showing 21–30 of 45 runs');
  });

  it('renders correct telemetry on the last page', () => {
    const { container } = render(AppPagination, {
      props: {
        currentPage: 5,
        totalItems: 45,
        pageSize: 10,
      },
    });

    expect(container.textContent).toContain('Showing 41–45 of 45 runs');
  });

  it('disables previous button on the first page', () => {
    const { container } = render(AppPagination, {
      props: {
        currentPage: 1,
        totalItems: 30,
        pageSize: 10,
      },
    });

    const prevBtn = container.querySelector('button[aria-label="Previous page"]');
    expect(prevBtn?.hasAttribute('disabled')).toBe(true);
  });

  it('enables previous button on subsequent pages', () => {
    const { container } = render(AppPagination, {
      props: {
        currentPage: 2,
        totalItems: 30,
        pageSize: 10,
      },
    });

    const prevBtn = container.querySelector('button[aria-label="Previous page"]');
    expect(prevBtn?.hasAttribute('disabled')).toBe(false);
  });

  it('disables next button on the last page', () => {
    const { container } = render(AppPagination, {
      props: {
        currentPage: 3,
        totalItems: 30,
        pageSize: 10,
      },
    });

    const nextBtn = container.querySelector('button[aria-label="Next page"]');
    expect(nextBtn?.hasAttribute('disabled')).toBe(true);
  });

  it('triggers onpageChange when clicking next button', async () => {
    const onpageChange = vi.fn();
    const { container } = render(AppPagination, {
      props: {
        currentPage: 1,
        totalItems: 30,
        pageSize: 10,
        onpageChange,
      },
    });

    const nextBtn = container.querySelector('button[aria-label="Next page"]');
    expect(nextBtn).not.toBeNull();
    await fireEvent.click(nextBtn!);

    expect(onpageChange).toHaveBeenCalledWith(2);
  });

  it('triggers onpageChange when clicking a specific page button', async () => {
    const onpageChange = vi.fn();
    const { container } = render(AppPagination, {
      props: {
        currentPage: 1,
        totalItems: 50,
        pageSize: 10,
        onpageChange,
      },
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const page3Btn = buttons.find((btn) => btn.textContent?.trim() === '3');
    expect(page3Btn).toBeDefined();

    await fireEvent.click(page3Btn!);
    expect(onpageChange).toHaveBeenCalledWith(3);
  });

  it('renders ellipsis for large page counts', () => {
    const { container } = render(AppPagination, {
      props: {
        currentPage: 1,
        totalItems: 100,
        pageSize: 10,
      },
    });

    expect(container.textContent).toContain('…');
  });

  it('handles 0 items gracefully', () => {
    const { container } = render(AppPagination, {
      props: {
        currentPage: 1,
        totalItems: 0,
        pageSize: 10,
      },
    });

    expect(container.textContent).toContain('No runs found');
    const prevBtn = container.querySelector('button[aria-label="Previous page"]');
    const nextBtn = container.querySelector('button[aria-label="Next page"]');
    expect(prevBtn?.hasAttribute('disabled')).toBe(true);
    expect(nextBtn?.hasAttribute('disabled')).toBe(true);
  });

  it('respects disabled prop on all controls', () => {
    const { container } = render(AppPagination, {
      props: {
        currentPage: 2,
        totalItems: 30,
        pageSize: 10,
        disabled: true,
      },
    });

    const buttons = container.querySelectorAll('button');
    for (const btn of buttons) {
      expect(btn.hasAttribute('disabled')).toBe(true);
    }
  });

  it('renders custom itemLabel when provided', () => {
    const { container } = render(AppPagination, {
      props: {
        currentPage: 1,
        totalItems: 24,
        pageSize: 9,
        itemLabel: 'texts',
      },
    });

    expect(container.textContent).toContain('Showing 1–9 of 24 texts');
  });

  it('renders custom itemLabel in empty state when provided', () => {
    const { container } = render(AppPagination, {
      props: {
        currentPage: 1,
        totalItems: 0,
        pageSize: 9,
        itemLabel: 'texts',
      },
    });

    expect(container.textContent).toContain('No texts found');
  });
});
