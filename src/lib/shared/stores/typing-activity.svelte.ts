/**
 * Lightweight, zero-dependency typing activity state.
 * Decouples root shell layout and navigation dimming from the heavy typing engine.
 */

let active = $state(false);

export const typingActivity = {
  get isTyping(): boolean {
    return active;
  },
  set(val: boolean): void {
    active = val;
  },
};
