import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { portal } from './portal.svelte.js';

describe('portal action', () => {
  let parentEl: HTMLElement;
  let nodeEl: HTMLElement;

  beforeEach(() => {
    parentEl = document.createElement('div');
    parentEl.id = 'parent-container';
    nodeEl = document.createElement('div');
    nodeEl.id = 'portal-node';
    parentEl.appendChild(nodeEl);
    document.body.appendChild(parentEl);
  });

  afterEach(() => {
    if (parentEl.parentNode) {
      parentEl.parentNode.removeChild(parentEl);
    }
    if (nodeEl.parentNode) {
      nodeEl.parentNode.removeChild(nodeEl);
    }
  });

  it('keeps node in place in test environment when target is true/default', () => {
    const action = portal(nodeEl, true);
    expect(nodeEl.parentElement).toBe(parentEl);
    action?.destroy();
  });

  it('moves node to explicit HTMLElement target', () => {
    const targetDiv = document.createElement('div');
    targetDiv.id = 'custom-target';
    document.body.appendChild(targetDiv);

    const action = portal(nodeEl, targetDiv);
    expect(nodeEl.parentElement).toBe(targetDiv);

    action?.destroy();
    expect(nodeEl.parentElement).toBeNull();
    targetDiv.remove();
  });

  it('moves node to string selector target', () => {
    const targetDiv = document.createElement('div');
    targetDiv.id = 'selector-target';
    document.body.appendChild(targetDiv);

    const action = portal(nodeEl, '#selector-target');
    expect(nodeEl.parentElement).toBe(targetDiv);

    action?.destroy();
    expect(nodeEl.parentElement).toBeNull();
    targetDiv.remove();
  });

  it('does nothing when target is false', () => {
    const action = portal(nodeEl, false);
    expect(nodeEl.parentElement).toBe(parentEl);
    action?.destroy();
    expect(nodeEl.parentElement).toBe(parentEl);
  });
});
