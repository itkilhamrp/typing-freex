import { describe, it, expect } from 'vitest';
import { useCapsLock } from './capslock.svelte';

describe('useCapsLock action (Svelte 5)', () => {
  it('initializes with isCapsLock false', () => {
    const { isCapsLock } = useCapsLock();
    expect(isCapsLock).toBe(false);
  });

  it('updates isCapsLock based on getModifierState in checkModifier', () => {
    const { checkModifier } = useCapsLock();

    const mockEventTrue = {
      getModifierState: (key: string) => key === 'CapsLock',
    } as unknown as KeyboardEvent;

    checkModifier(mockEventTrue);
    const storeAfterTrue = useCapsLock();
    expect(storeAfterTrue.isCapsLock).toBe(true);

    const mockEventFalse = {
      getModifierState: () => false,
    } as unknown as KeyboardEvent;

    checkModifier(mockEventFalse);
    const storeAfterFalse = useCapsLock();
    expect(storeAfterFalse.isCapsLock).toBe(false);
  });

  it('handles events without getModifierState gracefully', () => {
    const { isCapsLock, checkModifier } = useCapsLock();
    expect(() => checkModifier({} as unknown as KeyboardEvent)).not.toThrow();
    expect(isCapsLock).toBe(false);
  });

  it('listens to window keydown and keyup events', () => {
    // Simulate window keydown event with CapsLock active
    const eventOn = new KeyboardEvent('keydown', { bubbles: true });
    Object.defineProperty(eventOn, 'getModifierState', {
      value: (key: string) => key === 'CapsLock',
    });
    window.dispatchEvent(eventOn);

    const storeAfterOn = useCapsLock();
    expect(storeAfterOn.isCapsLock).toBe(true);

    // Simulate window keyup event with CapsLock inactive
    const eventOff = new KeyboardEvent('keyup', { bubbles: true });
    Object.defineProperty(eventOff, 'getModifierState', {
      value: () => false,
    });
    window.dispatchEvent(eventOff);

    const storeAfterOff = useCapsLock();
    expect(storeAfterOff.isCapsLock).toBe(false);
  });
});
