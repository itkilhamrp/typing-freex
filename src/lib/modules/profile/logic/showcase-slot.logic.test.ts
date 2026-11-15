import { describe, it, expect } from 'vitest';
import {
  getPinnedSlot,
  isItemPinnedInShowcase,
  getPinnedItemsLookup,
  getFirstEmptySlot,
  buildSlotDisplayList,
} from './showcase-slot.logic';
import type { TrophyShowcaseDto } from '@/core/ipc/contracts';
import type { AchievementItem } from '../stores/achievement.store.svelte';

function createMockSlots(assignments: Record<number, string | null>): TrophyShowcaseDto[] {
  const result: TrophyShowcaseDto[] = [];
  for (let slot = 1; slot <= 7; slot++) {
    const item_id = assignments[slot] ?? null;
    result.push({
      slot,
      item_id,
      item_type: item_id ? 'achievement' : null,
      pinned_at: item_id ? '2026-01-01T00:00:00Z' : null,
    });
  }
  return result;
}

function createMockItem(id: string): AchievementItem {
  return {
    definition: {
      id,
      category: 'achievement',
      group: 'speed',
      icon: 'trophy',
      trophyShape: 'cup',
      tiers: [
        {
          tier: 1,
          target: 100,
          labelKey: `achievements.${id}`,
          descKey: `achievements.${id}.desc`,
        },
      ],
    },
    progress: {
      achievement_id: id,
      category: 'achievement',
      current_value: 100,
      target_value: 100,
      tier: 1,
      unlocked: true,
      unlocked_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    isUnlocked: true,
    currentTier: 1,
    itemType: 'achievement',
  };
}

describe('showcase-slot.logic', () => {
  describe('getPinnedSlot', () => {
    it('returns the slot number when item is pinned', () => {
      const slots = createMockSlots({ 1: 'speed_100', 3: 'accuracy_master' });
      expect(getPinnedSlot(slots, 'speed_100')).toBe(1);
      expect(getPinnedSlot(slots, 'accuracy_master')).toBe(3);
    });

    it('returns null when item is not pinned or itemId is empty', () => {
      const slots = createMockSlots({ 1: 'speed_100' });
      expect(getPinnedSlot(slots, 'non_existent')).toBeNull();
      expect(getPinnedSlot(slots, '')).toBeNull();
    });
  });

  describe('isItemPinnedInShowcase', () => {
    it('returns true when pinned, false otherwise', () => {
      const slots = createMockSlots({ 2: 'speed_100' });
      expect(isItemPinnedInShowcase(slots, 'speed_100')).toBe(true);
      expect(isItemPinnedInShowcase(slots, 'other_item')).toBe(false);
    });
  });

  describe('getPinnedItemsLookup', () => {
    it('constructs an accurate itemId -> slot mapping', () => {
      const slots = createMockSlots({ 1: 'item_a', 4: 'item_b', 7: 'item_c' });
      const lookup = getPinnedItemsLookup(slots);
      expect(lookup).toEqual({
        item_a: 1,
        item_b: 4,
        item_c: 7,
      });
    });

    it('returns empty object when all slots are empty', () => {
      const slots = createMockSlots({});
      expect(getPinnedItemsLookup(slots)).toEqual({});
    });
  });

  describe('getFirstEmptySlot', () => {
    it('returns the lowest numbered empty slot', () => {
      const slots = createMockSlots({ 1: 'a', 2: 'b' });
      expect(getFirstEmptySlot(slots)).toBe(3);
    });

    it('returns 1 if all slots are empty', () => {
      const slots = createMockSlots({});
      expect(getFirstEmptySlot(slots)).toBe(1);
    });

    it('returns null if all 7 slots are occupied', () => {
      const slots = createMockSlots({
        1: 'a',
        2: 'b',
        3: 'c',
        4: 'd',
        5: 'e',
        6: 'f',
        7: 'g',
      });
      expect(getFirstEmptySlot(slots)).toBeNull();
    });
  });

  describe('buildSlotDisplayList', () => {
    it('generates 7 slot entries with accurate empty and target status', () => {
      const slots = createMockSlots({ 1: 'ach_1', 3: 'ach_2' });
      const items = [createMockItem('ach_1'), createMockItem('ach_2')];

      const list = buildSlotDisplayList(slots, items, 'ach_1');

      expect(list).toHaveLength(7);
      expect(list[0]).toMatchObject({
        slot: 1,
        itemId: 'ach_1',
        isEmpty: false,
        isTargetItem: true,
      });
      expect(list[1]).toMatchObject({
        slot: 2,
        itemId: null,
        isEmpty: true,
        isTargetItem: false,
      });
      expect(list[2]).toMatchObject({
        slot: 3,
        itemId: 'ach_2',
        isEmpty: false,
        isTargetItem: false,
      });
      expect(list[0]?.currentItem?.definition.id).toBe('ach_1');
    });
  });
});
