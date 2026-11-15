import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import HandGuide from './HandGuide.svelte';
import type { HandVisualState } from '@/core/hand-guide';

const mockVisualState: HandVisualState = {
  fingerStates: {
    l_pinky: 'target',
    l_ring: 'idle',
    l_middle: 'idle',
    l_index: 'pressed',
    l_thumb: 'idle',
    r_thumb: 'idle',
    r_index: 'pressed_error',
    r_middle: 'shift_target',
    r_ring: 'idle',
    r_pinky: 'idle',
  },
  targetChar: 'a',
  isSuspended: false,
};

describe('HandGuide (Svelte 5)', () => {
  it('renders with zero layout shift structure and aria-hidden', () => {
    const { container } = render(HandGuide, {
      props: {
        visualState: mockVisualState,
      },
    });

    const root = container.firstElementChild;
    expect(root?.getAttribute('aria-hidden')).toBe('true');
    expect(root?.classList.contains('pointer-events-none')).toBe(true);
    expect(root?.classList.contains('select-none')).toBe(true);
  });

  it('renders all 10 fingers across both hands', () => {
    const { container } = render(HandGuide, {
      props: {
        visualState: mockVisualState,
      },
    });

    const fingerNodes = container.querySelectorAll('[data-finger]');
    expect(fingerNodes).toHaveLength(10);
  });

  it('applies correct visual classes for each finger state', () => {
    const { container } = render(HandGuide, {
      props: {
        visualState: mockVisualState,
      },
    });

    // Left pinky is target
    const leftPinky = container.querySelector('[data-finger="l_pinky"]');
    expect(leftPinky?.classList.contains('text-tt-primary')).toBe(true);
    expect(leftPinky?.classList.contains('opacity-90')).toBe(true);

    // Left index is pressed
    const leftIndex = container.querySelector('[data-finger="l_index"]');
    expect(leftIndex?.classList.contains('text-ios-green')).toBe(true);

    // Right index is pressed_error
    const rightIndex = container.querySelector('[data-finger="r_index"]');
    expect(rightIndex?.classList.contains('text-ios-red')).toBe(true);

    // Right middle is shift_target
    const rightMiddle = container.querySelector('[data-finger="r_middle"]');
    expect(rightMiddle?.classList.contains('underline')).toBe(true);
  });

  it('isolates hands when showHands is left or right', () => {
    const { container: leftContainer } = render(HandGuide, {
      props: {
        visualState: mockVisualState,
        showHands: 'left',
      },
    });
    expect(leftContainer.querySelectorAll('[data-hand]')).toHaveLength(1);
    expect(leftContainer.querySelector('[data-hand="left"]')).not.toBeNull();
    expect(leftContainer.querySelector('[data-hand="right"]')).toBeNull();

    const { container: rightContainer } = render(HandGuide, {
      props: {
        visualState: mockVisualState,
        showHands: 'right',
      },
    });
    expect(rightContainer.querySelectorAll('[data-hand]')).toHaveLength(1);
    expect(rightContainer.querySelector('[data-hand="right"]')).not.toBeNull();
    expect(rightContainer.querySelector('[data-hand="left"]')).toBeNull();
  });

  it('renders home key labels when legendStyle is keys', () => {
    const { container } = render(HandGuide, {
      props: {
        visualState: mockVisualState,
        legendStyle: 'keys',
      },
    });
    const leftPinky = container.querySelector('[data-finger="l_pinky"]');
    expect(leftPinky?.textContent).toContain('A');
  });

  it('renders nothing when mode is off', () => {
    const { container } = render(HandGuide, {
      props: {
        visualState: mockVisualState,
        mode: 'off',
      },
    });
    expect(container.querySelector('.handguide-root')).toBeNull();
  });
});
