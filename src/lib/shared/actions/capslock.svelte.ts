class CapsLockState {
  capsLock = $state<boolean>(false);

  checkModifier = (e: KeyboardEvent | MouseEvent) => {
    if (typeof e.getModifierState === 'function') {
      this.capsLock = e.getModifierState('CapsLock');
    }
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.checkModifier);
      window.addEventListener('keyup', this.checkModifier);
    }
  }
}

const capsLockState = new CapsLockState();

export function useCapsLock() {
  return {
    get isCapsLock() {
      return capsLockState.capsLock;
    },
    checkModifier: capsLockState.checkModifier,
  };
}
