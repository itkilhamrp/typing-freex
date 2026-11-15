import { describe, it, expect, beforeEach } from "vitest";
import { useProfileStore } from "./profile.store.svelte";
import { useAchievementStore } from "./achievement.store.svelte";
import { useSettingsStore } from "#lib/modules/settings/stores/settings.store.svelte.js";
import { resetMockStore } from "@/core/ipc/client";

describe("Cross-Profile State Invalidation & Scoped Storage", () => {
  beforeEach(() => {
    localStorage.clear();
    resetMockStore();
    useSettingsStore().resetSettingsState();
  });

  it("resets stale achievement progress/showcase/toasts and scopes settings localStorage per UUID on switchProfile", async () => {
    const profileStore = useProfileStore();
    const achievementStore = useAchievementStore();
    const settingsStore = useSettingsStore();

    await profileStore.loadProfiles();
    const profileA = await profileStore.createProfile("Player Alpha");
    const profileB = await profileStore.createProfile("Player Beta");

    // 1. Enter Profile A and mutate achievements + settings
    await profileStore.switchProfile(profileA.uuid);
    await settingsStore.updateSetting("test.speed_unit", "cpm");
    await settingsStore.updateSetting("ui.theme", "light");

    expect(localStorage.getItem(`typingfreex_setting_${profileA.uuid}_test.speed_unit`)).toBe("cpm");
    expect(localStorage.getItem(`typing_freex_theme_${profileA.uuid}`)).toBe("light");

    // Seed stale in-memory state on Profile A: pinned showcase slot + active toast + updated achievement
    await achievementStore.setShowcase(1, "speed_demon", "achievement");
    const firstItem = achievementStore.items[0];
    expect(firstItem).toBeDefined();
    if (firstItem) {
      const firstTier = firstItem.definition.tiers[0];
      achievementStore.applyUpdates(
        [
          {
            achievement_id: firstItem.definition.id,
            current_value: 999,
            target_value: firstItem.progress.target_value,
            unlocked: true,
            unlocked_at: "2026-01-01T00:00:00.000Z",
            tier: 1,
          },
        ],
        firstTier
          ? [
              {
                achievementId: firstItem.definition.id,
                tier: firstTier.tier,
                category: firstItem.definition.category,
                labelKey: firstTier.labelKey,
                descKey: firstTier.descKey,
                icon: firstItem.definition.icon,
                trophyShape: firstItem.definition.trophyShape,
              },
            ]
          : undefined,
      );
    }
    expect(achievementStore.toastQueue.length).toBeGreaterThan(0);

    // 2. Switch to Profile B -> must invalidate Profile A's in-memory achievement state & switch localStorage scope
    await profileStore.switchProfile(profileB.uuid);

    expect(profileStore.activeProfile?.uuid).toBe(profileB.uuid);
    expect(achievementStore.isLoaded).toBe(true);
    expect(achievementStore.toastQueue).toEqual([]);

    // Update a setting under Profile B and confirm UUID isolation vs Profile A
    await settingsStore.updateSetting("test.speed_unit", "wpm");
    expect(localStorage.getItem(`typingfreex_setting_${profileB.uuid}_test.speed_unit`)).toBe("wpm");
    expect(localStorage.getItem(`typingfreex_setting_${profileA.uuid}_test.speed_unit`)).toBe("cpm");
  });
});
