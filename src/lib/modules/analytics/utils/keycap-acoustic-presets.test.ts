import { describe, it, expect } from "vitest";
import {
  getKeycapAcousticProfile,
  playKeycapAcoustic,
  preloadKeycapAcoustics,
  ACOUSTICS_MASTER,
  ACOUSTICS_EXPERT,
  ACOUSTICS_NORMAL,
} from "./keycap-acoustic-presets";

describe("keycap-acoustic-presets", () => {
  it("defines valid acoustic profiles for all 11 tiers (0 to 10) in Master mode", () => {
    for (let tier = 0; tier <= 10; tier++) {
      const profile = ACOUSTICS_MASTER[tier];
      expect(profile).toBeDefined();
      if (!profile) continue;
      expect(profile.name.length).toBeGreaterThan(0);
      expect(profile.profile.length).toBeGreaterThan(0);
      expect(profile.layers.length).toBeGreaterThanOrEqual(2);
      for (const layer of profile.layers) {
        expect(Array.isArray(layer)).toBe(true);
        expect(layer.length).toBeGreaterThan(0);
      }
    }
  });

  it("defines valid acoustic profiles for all 11 tiers (0 to 10) in Expert mode", () => {
    for (let tier = 0; tier <= 10; tier++) {
      const profile = ACOUSTICS_EXPERT[tier];
      expect(profile).toBeDefined();
      if (!profile) continue;
      expect(profile.name.length).toBeGreaterThan(0);
      expect(profile.layers.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("defines valid acoustic profiles for all 11 tiers (0 to 10) in Normal mode", () => {
    for (let tier = 0; tier <= 10; tier++) {
      const profile = ACOUSTICS_NORMAL[tier];
      expect(profile).toBeDefined();
      if (!profile) continue;
      expect(profile.name.length).toBeGreaterThan(0);
      expect(profile.layers.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("getKeycapAcousticProfile correctly resolves profiles and clamps bounds", () => {
    const tier0 = getKeycapAcousticProfile("master", 0);
    expect(tier0.name).toBe("Unranked Bare Red Stem");

    const tierNegative = getKeycapAcousticProfile("master", -5);
    expect(tierNegative.name).toBe("Unranked Bare Red Stem");

    const tier1 = getKeycapAcousticProfile("master", 1);
    expect(tier1.name).toBe("Cherry Red Samurai");

    const tier99 = getKeycapAcousticProfile("master", 99);
    expect(tier99.name).toBe("Apex Zenith Crown");

    const fallback = getKeycapAcousticProfile("unknown", 5);
    expect(fallback.name).toBe("KAT Ergonomic Scoop");
  });

  it("playKeycapAcoustic and preloadKeycapAcoustics execute safely without throwing in test environment", () => {
    expect(() => {
      preloadKeycapAcoustics();
      preloadKeycapAcoustics("master", 0);
      preloadKeycapAcoustics("master", 1);
      playKeycapAcoustic("master", 0);
      playKeycapAcoustic("master", 1);
      playKeycapAcoustic("expert", 5);
      playKeycapAcoustic("normal", 10);
      playKeycapAcoustic(null, 1);
    }).not.toThrow();
  });
});
