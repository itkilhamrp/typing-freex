/**
 * Svelte 5 Runes state helper for confirm dialogs
 */
export function createConfirmDialog<T = unknown>() {
  let isOpen = $state(false);
  let item = $state<T | null>(null);

  function open(targetItem?: T) {
    item = targetItem !== undefined ? targetItem : null;
    isOpen = true;
  }

  function close() {
    isOpen = false;
    item = null;
  }

  return {
    get isOpen() {
      return isOpen;
    },
    set isOpen(v: boolean) {
      isOpen = v;
    },
    get item() {
      return item;
    },
    set item(v: T | null) {
      item = v;
    },
    open,
    close,
  };
}

export const useConfirmDialog = createConfirmDialog;

