import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useMouseCursorHider } from './mouse-cursor-hider.svelte.js';

describe('useMouseCursorHider (Svelte 5 Runes)', () => {
  beforeEach(() => {
    document.body.classList.remove('cursor-hidden');
  });

  afterEach(() => {
    document.body.classList.remove('cursor-hidden');
  });

  it('initializes with isHidden false and clean body class', () => {
    const hider = useMouseCursorHider();
    expect(hider.isHidden).toBe(false);
    expect(document.body.classList.contains('cursor-hidden')).toBe(false);
  });

  it('hides cursor by setting isHidden and adding body class', () => {
    const hider = useMouseCursorHider();
    hider.hideCursor();

    expect(hider.isHidden).toBe(true);
    expect(document.body.classList.contains('cursor-hidden')).toBe(true);
  });

  it('shows cursor by resetting isHidden and removing body class', () => {
    const hider = useMouseCursorHider();
    hider.hideCursor();
    expect(hider.isHidden).toBe(true);

    hider.showCursor();
    expect(hider.isHidden).toBe(false);
    expect(document.body.classList.contains('cursor-hidden')).toBe(false);
  });

  it('respects canHide predicate when false', () => {
    let canHide = false;
    const hider = useMouseCursorHider({
      canHide: () => canHide,
    });

    hider.hideCursor();
    expect(hider.isHidden).toBe(false);
    expect(document.body.classList.contains('cursor-hidden')).toBe(false);

    canHide = true;
    hider.hideCursor();
    expect(hider.isHidden).toBe(true);
    expect(document.body.classList.contains('cursor-hidden')).toBe(true);
  });

  it('reveals cursor on mouse movement when coordinates change', () => {
    const hider = useMouseCursorHider();
    hider.hideCursor();
    expect(hider.isHidden).toBe(true);

    const moveEvent = new MouseEvent('mousemove', {
      clientX: 100,
      clientY: 150,
    });
    hider.handleMouseMove(moveEvent);

    expect(hider.isHidden).toBe(false);
    expect(document.body.classList.contains('cursor-hidden')).toBe(false);
  });

  it('ignores synthetic mousemove events with zero coordinate delta', () => {
    const hider = useMouseCursorHider();

    // Initial movement sets reference position
    const move1 = new MouseEvent('mousemove', {
      clientX: 50,
      clientY: 50,
    });
    hider.handleMouseMove(move1);

    // Now hide cursor
    hider.hideCursor();
    expect(hider.isHidden).toBe(true);

    // Synthetic mousemove with identical coordinates (browser hover reflow artifact)
    const syntheticMove = new MouseEvent('mousemove', {
      clientX: 50,
      clientY: 50,
    });
    hider.handleMouseMove(syntheticMove);

    // Cursor must still remain hidden
    expect(hider.isHidden).toBe(true);
    expect(document.body.classList.contains('cursor-hidden')).toBe(true);

    // Real movement with new coordinates
    const realMove = new MouseEvent('mousemove', {
      clientX: 52,
      clientY: 50,
    });
    hider.handleMouseMove(realMove);

    // Now cursor must be revealed
    expect(hider.isHidden).toBe(false);
    expect(document.body.classList.contains('cursor-hidden')).toBe(false);
  });

  it('destroy restores cursor visibility', () => {
    const hider = useMouseCursorHider();
    hider.hideCursor();
    expect(hider.isHidden).toBe(true);
    expect(document.body.classList.contains('cursor-hidden')).toBe(true);

    hider.destroy();
    expect(hider.isHidden).toBe(false);
    expect(document.body.classList.contains('cursor-hidden')).toBe(false);
  });
});
