/**
 * Showcase Slot Logic
 * Pure headless utility functions for trophy showcase slot calculations and queries.
 * Strictly adheres to UNIX philosophy: zero DOM/framework dependencies, deterministic, 100% testable.
 */

import type { TrophyShowcaseDto } from '@/core/ipc/contracts';
import type { AchievementItem } from '../stores/achievement.store.svelte';

export interface ShowcaseSlotDisplay {
  slot: number;
  itemId: string | null;
  itemType: 'achievement' | 'advancement' | null;
  currentItem: AchievementItem | null;
  isEmpty: boolean;
  isTargetItem: boolean;
}

/**
 * Returns the 1-based slot number where `itemId` is currently pinned, or null if not pinned.
 */
export function getPinnedSlot(slots: readonly TrophyShowcaseDto[], itemId: string): number | null {
  if (!itemId) return null;
  const match = slots.find((s) => s.item_id === itemId);
  return match ? match.slot : null;
}

/**
 * Checks whether an item is currently pinned in any showcase slot.
 */
export function isItemPinnedInShowcase(slots: readonly TrophyShowcaseDto[], itemId: string): boolean {
  return getPinnedSlot(slots, itemId) !== null;
}

/**
 * Creates an O(1) lookup dictionary of item_id -> slot number for all pinned slots.
 */
export function getPinnedItemsLookup(slots: readonly TrophyShowcaseDto[]): Record<string, number> {
  const lookup: Record<string, number> = {};
  for (const s of slots) {
    if (s.item_id) {
      lookup[s.item_id] = s.slot;
    }
  }
  return lookup;
}

/**
 * Returns the first available empty slot number (1-based), or null if all slots are occupied.
 */
export function getFirstEmptySlot(slots: readonly TrophyShowcaseDto[]): number | null {
  const match = slots.find((s) => !s.item_id);
  return match ? match.slot : null;
}

/**
 * Constructs a normalized 7-slot display list for the slot selection modal.
 */
export function buildSlotDisplayList(
  slots: readonly TrophyShowcaseDto[],
  allItems: readonly AchievementItem[],
  targetItemId: string,
): ShowcaseSlotDisplay[] {
  const itemMap = new Map<string, AchievementItem>();
  for (const item of allItems) {
    itemMap.set(item.definition.id, item);
  }

  // Ensure slots 1 to 7 are represented in order
  const slotMap = new Map<number, TrophyShowcaseDto>();
  for (const s of slots) {
    slotMap.set(s.slot, s);
  }

  const result: ShowcaseSlotDisplay[] = [];
  for (let slotNum = 1; slotNum <= 7; slotNum++) {
    const rawSlot = slotMap.get(slotNum);
    const itemId = rawSlot?.item_id ?? null;
    const itemType = rawSlot?.item_type ?? null;
    const currentItem = itemId ? (itemMap.get(itemId) ?? null) : null;
    const isEmpty = !itemId;
    const isTargetItem = itemId === targetItemId;

    result.push({
      slot: slotNum,
      itemId,
      itemType,
      currentItem,
      isEmpty,
      isTargetItem,
    });
  }

  return result;
}

