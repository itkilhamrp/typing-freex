/**
 * @file keycap-acoustic-presets.ts
 * @description High-definition procedural acoustic presets for all 30 mechanical keycap variants.
 * Engineered for pristine clarity and full-spectrum presence on both internal and external audio hardware:
 * Bluetooth A2DP headsets/speakers, USB DACs, wired 3.5mm jacks, and laptop stereo speakers.
 * Crisp tactile switch leaf snaps (2.2 kHz - 3.8 kHz), distinct bottom-out resonances, and authentic material chimes.
 * 100% offline, zero assets, sub-millisecond execution.
 */

import {
  playZzFXComposite,
  bakeZzFXComposite,
  type ZzFXSoundParams,
} from "@/lib/shared/audio/zzfx";

export interface KeycapAcousticProfile {
  name: string;
  profile: string;
  layers: ZzFXSoundParams[];
}

/**
 * MASTER MODE ACOUSTIC PROFILES (Tiers 1 to 10)
 * Aggressive, high-density, exotic luxury materials.
 */
export const ACOUSTICS_MASTER: Record<number, KeycapAcousticProfile> = {
  0: {
    name: "Unranked Bare Red Stem",
    profile: "BARE STEM",
    layers: [
      // Raw unmounted switch stem click (spring bite without keycap mass)
      [0.32, 0.01, 2100, 0.001, 0.003, 0.01, 1, 1, -1.2, 0, 0, 0, 0, 0.15],
      // Light switch housing spring tick
      [0.25, 0.01, 750, 0.001, 0.006, 0.02, 0, 1, -0.5, 0, 0, 0, 0, 0.04],
    ],
  },
  1: {
    name: "Cherry Red Samurai",
    profile: "CHERRY PBT",
    layers: [
      // Tactile leaf snap (crisp katana blade bite)
      [0.42, 0.01, 2800, 0.001, 0.004, 0.012, 2, 1, -1, 0, 0, 0, 0, 0.28],
      // Dense PBT bottom-out
      [0.48, 0.02, 380, 0.002, 0.014, 0.038, 1, 1, -1.2, 0, 0, 0, 0, 0.08],
      // Blade harmonic swipe
      [0.25, 0.01, 1200, 0.001, 0.008, 0.022, 0, 1, 0, 0, 0, 0, 0, 0.02],
    ],
  },
  2: {
    name: "SA Berserk Crimson",
    profile: "SA SPHERICAL",
    layers: [
      // Heavy tactile switch leaf
      [0.38, 0.02, 2400, 0.001, 0.005, 0.015, 1, 1, -1.2, 0, 0, 0, 0, 0.22],
      // Cavernous hollow SA deep thock
      [0.55, 0.03, 140, 0.003, 0.02, 0.065, 0, 1.2, -2.5, 0, 0, 0, 0, 0.08],
      // Tall housing internal cavity reverberation
      [0.24, 0.01, 240, 0.004, 0.015, 0.045, 1, 1, -1, 0, 0, 0, 0, 0.1],
    ],
  },
  3: {
    name: "MT3 Obsidian Scoop",
    profile: "MT3 DEEP-DISH",
    layers: [
      // Tactile switch actuation
      [0.35, 0.02, 2200, 0.001, 0.005, 0.014, 1, 1, -1.2, 0, 0, 0, 0, 0.18],
      // Ultra-deep sub-bass scoop thock
      [0.58, 0.02, 105, 0.003, 0.022, 0.068, 0, 1.3, -3.0, 0, 0, 0, 0, 0.06],
      // Dense heavy scoop damping
      [0.26, 0.01, 160, 0.002, 0.014, 0.042, 1, 1, -1.5, 0, 0, 0, 0, 0.04],
    ],
  },
  4: {
    name: "Ruby Polycarbonate",
    profile: "PC TRANSLUCENT",
    layers: [
      // High-frequency crystal snap
      [0.45, 0.01, 3400, 0.001, 0.003, 0.01, 2, 1, -1, 0, 0, 0, 0, 0.3],
      // High-tension polycarbonate housing clack
      [0.5, 0.02, 650, 0.002, 0.01, 0.032, 1, 1.1, -1.0, 0, 0, 0, 0, 0.1],
      // Translucent pop
      [0.28, 0.01, 1500, 0.001, 0.006, 0.018, 0, 1, 0, 0, 0, 0, 0, 0.02],
    ],
  },
  5: {
    name: "Crimson Glazed Ceramic",
    profile: "CERAKEY GLOSS",
    layers: [
      // Porcelain edge contact
      [0.42, 0.01, 3000, 0.001, 0.004, 0.012, 1, 1, 0, 0, 0, 0, 0, 0.15],
      // High-density ceramic thud
      [0.48, 0.02, 520, 0.002, 0.014, 0.038, 1, 1, -1.5, 0, 0, 0, 0, 0.06],
      // Pristine ceramic porcelain chime & ring
      [0.32, 0.01, 2100, 0.002, 0.02, 0.065, 0, 1, 0, 0, 0, 0, 0, 0, 10],
    ],
  },
  6: {
    name: "Aerospace CNC Aluminum",
    profile: "6063 CNC ALLOY",
    layers: [
      // Metal alloy contact snap
      [0.44, 0.01, 3100, 0.001, 0.004, 0.012, 2, 1, -1, 0, 0, 0, 0, 0.2],
      // Rigid CNC chassis bottom-out
      [0.48, 0.02, 540, 0.002, 0.012, 0.034, 1, 1, -1.2, 0, 0, 0, 0, 0.08],
      // Aerospace aluminum metallic harmonic ring
      [0.35, 0.01, 1850, 0.003, 0.02, 0.07, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0.12],
    ],
  },
  7: {
    name: "Damascus Steel Forged",
    profile: "DAMASCUS STEEL",
    layers: [
      // Forged steel strike
      [0.45, 0.02, 2600, 0.001, 0.005, 0.015, 2, 1, -2, 0, 0, 0, 0, 0.35],
      // Heavy iron mass bottom-out
      [0.52, 0.02, 300, 0.003, 0.016, 0.05, 1, 1.1, -2.0, 0, 0, 0, 0, 0.1],
      // Sword blade sharp clink
      [0.3, 0.01, 1600, 0.001, 0.01, 0.045, 1, 1, 0, 0, 0, 0, 0, 0.02],
    ],
  },
  8: {
    name: "Ruby Crystal Geode",
    profile: "MINERAL CRYSTAL",
    layers: [
      // Mineral facet impact
      [0.42, 0.01, 3500, 0.001, 0.003, 0.01, 1, 1, 0, 0, 0, 0, 0, 0.22],
      // Crystal internal refraction thud
      [0.46, 0.02, 740, 0.002, 0.012, 0.038, 0, 1, -1.0, 0, 0, 0, 0, 0.06],
      // Shimmering dual-harmonic crystal sparkle chime
      [0.36, 0.01, 2400, 0.002, 0.025, 0.08, 0, 1, 0, 0, 0, 0, 0, 0, 16],
    ],
  },
  9: {
    name: "Meteorite Magma Vein",
    profile: "WIDMANSTÄTTEN",
    layers: [
      // Celestial nickel-iron crust fracture
      [0.45, 0.03, 2200, 0.002, 0.006, 0.016, 2, 1.1, -2.5, 0, 0, 0, 0, 0.38],
      // Seismic deep planetary impact thock
      [0.6, 0.02, 92, 0.004, 0.028, 0.082, 0, 1.4, -3.5, 0, 0, 0, 0, 0.08],
      // Widmanstätten magnetic friction buzz
      [0.26, 0.02, 340, 0.003, 0.014, 0.038, 3, 1, -1, 0, 0, 0, 0, 0.08, 0, 1],
    ],
  },
  10: {
    name: "Apex Zenith Crown",
    profile: "TITANIUM CROWN",
    layers: [
      // Supreme royal titanium laser-crisp snap
      [0.48, 0.01, 3800, 0.001, 0.003, 0.01, 2, 1, -1.2, 0, 0, 0, 0, 0.25],
      // Grade-5 Titanium dense acoustic body
      [0.52, 0.02, 460, 0.002, 0.014, 0.042, 1, 1.1, -1.8, 0, 0, 0, 0, 0.06],
      // Pristine titanium crown harmonic chime with delay
      [0.4, 0.01, 2600, 0.002, 0.028, 0.085, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0.01],
    ],
  },
};

/**
 * EXPERT MODE ACOUSTIC PROFILES (Tiers 1 to 10)
 * Classic vintage, heavy brass, electrostatic Topre, refined acoustics.
 */
export const ACOUSTICS_EXPERT: Record<number, KeycapAcousticProfile> = {
  0: {
    name: "Generic Amber ABS",
    profile: "GENERIC ABS",
    layers: [
      // Loose hollow ABS plastic rattle
      [0.32, 0.01, 1850, 0.001, 0.004, 0.012, 1, 1, -1.0, 0, 0, 0, 0, 0.16],
      // Hollow un-damped bottom-out
      [0.36, 0.02, 320, 0.002, 0.012, 0.035, 0, 1, -1.0, 0, 0, 0, 0, 0.05],
    ],
  },
  1: {
    name: "Vintage Dolch Cherry",
    profile: "CHERRY DOLCH",
    layers: [
      // Classic vintage tactile switch leaf
      [0.4, 0.01, 2700, 0.001, 0.004, 0.012, 2, 1, -1.2, 0, 0, 0, 0, 0.25],
      // Thick vintage Cherry PBT clack
      [0.48, 0.02, 350, 0.002, 0.014, 0.038, 1, 1, -1.2, 0, 0, 0, 0, 0.08],
    ],
  },
  2: {
    name: "SA Retro Spherical",
    profile: "SA 1970s",
    layers: [
      // 1970s vintage tactile actuation
      [0.38, 0.02, 2300, 0.002, 0.006, 0.016, 1, 1, -1.5, 0, 0, 0, 0, 0.22],
      // Tall hollow retro SA clack
      [0.52, 0.03, 175, 0.003, 0.018, 0.058, 0, 1.2, -2.0, 0, 0, 0, 0, 0.09],
      // Vintage switch spring ping
      [0.22, 0.01, 950, 0.001, 0.008, 0.03, 1, 1, 0, 0, 0, 0, 0, 0.03],
    ],
  },
  3: {
    name: "MT3 Carbon Deep-Dish",
    profile: "MT3 CARBON",
    layers: [
      // Carbon scoop tactile snap
      [0.35, 0.02, 2100, 0.001, 0.005, 0.015, 1, 1, -1.2, 0, 0, 0, 0, 0.18],
      // Carbon deep-dish warm thock
      [0.55, 0.02, 125, 0.003, 0.022, 0.062, 0, 1.3, -2.8, 0, 0, 0, 0, 0.08],
    ],
  },
  4: {
    name: "Double-Shot Amber PBT",
    profile: "DOUBLE-SHOT PBT",
    layers: [
      // Dense double-shot snap
      [0.44, 0.01, 2900, 0.001, 0.004, 0.012, 2, 1, -1.2, 0, 0, 0, 0, 0.2],
      // Extra-thick dual-layer bottom-out
      [0.5, 0.02, 420, 0.002, 0.014, 0.04, 1, 1.1, -1.4, 0, 0, 0, 0, 0.08],
    ],
  },
  5: {
    name: "Topre Electrostatic Cap",
    profile: "TOPRE SILENT",
    layers: [
      // Soft rubber dome tactile collapse
      [0.38, 0.01, 950, 0.003, 0.008, 0.022, 0, 1, -0.8, 0, 0, 0, 0, 0.1],
      // Signature cushioned Topre thock-pop
      [0.48, 0.02, 170, 0.003, 0.018, 0.048, 0, 1.2, -1.0, 0, 0, 0, 0, 0.06],
      // Slider return damping
      [0.22, 0.01, 280, 0.002, 0.008, 0.028, 1, 1, 0, 0, 0, 0, 0, 0.03],
    ],
  },
  6: {
    name: "Smoky Frosted Acrylic",
    profile: "SMOKY ACRYLIC",
    layers: [
      // Snappy acrylic slap
      [0.45, 0.01, 3200, 0.001, 0.003, 0.01, 2, 1, -1, 0, 0, 0, 0, 0.28],
      // Bright acrylic housing clack
      [0.48, 0.02, 600, 0.002, 0.01, 0.03, 1, 1, -0.8, 0, 0, 0, 0, 0.12],
    ],
  },
  7: {
    name: "Machined Brass Artisan",
    profile: "SOLID BRASS",
    layers: [
      // Brass metal contact
      [0.42, 0.01, 2800, 0.001, 0.005, 0.014, 2, 1, -1, 0, 0, 0, 0, 0.18],
      // Heavy solid brass bottom-out
      [0.5, 0.02, 490, 0.002, 0.015, 0.042, 1, 1.1, -1.5, 0, 0, 0, 0, 0.08],
      // Golden brass bell-like chime
      [0.36, 0.01, 1550, 0.003, 0.025, 0.075, 0, 1, 0, 0, 0, 0, 0, 0, 6],
    ],
  },
  8: {
    name: "Amber Honeycomb Lattice",
    profile: "SKELETON HEX",
    layers: [
      // Open-frame airy click
      [0.42, 0.02, 3100, 0.001, 0.004, 0.012, 2, 1, -1.2, 0, 0, 0, 0, 0.35],
      // Ventilated lattice thock
      [0.46, 0.02, 330, 0.002, 0.012, 0.036, 1, 1, -1.0, 0, 0, 0, 0, 0.14],
    ],
  },
  9: {
    name: "Golden Enamel Relief",
    profile: "ENAMEL GOLD",
    layers: [
      // Enamel relief porcelain tap
      [0.42, 0.01, 3200, 0.001, 0.004, 0.012, 1, 1, 0, 0, 0, 0, 0, 0.2],
      // Enamel-on-bronze pop
      [0.48, 0.02, 740, 0.002, 0.012, 0.036, 1, 1, -1.0, 0, 0, 0, 0, 0.08],
      // Refined warm chime
      [0.3, 0.01, 1800, 0.002, 0.018, 0.05, 0, 1, 0, 0, 0, 0, 0, 0.02],
    ],
  },
  10: {
    name: "Forged Carbon & 24K Gold",
    profile: "FORGED CARBON",
    layers: [
      // Instantaneous high-rigidity carbon crack
      [0.48, 0.01, 3600, 0.001, 0.003, 0.008, 2, 1, -1.5, 0, 0, 0, 0, 0.24],
      // Ultra-stiff composite snap
      [0.52, 0.01, 640, 0.002, 0.008, 0.028, 1, 1.2, -1.5, 0, 0, 0, 0, 0.06],
      // 24K Gold fleck acoustic tick
      [0.28, 0.01, 2200, 0.001, 0.005, 0.018, 0, 1, 0, 0, 0, 0, 0, 0.03],
    ],
  },
};

/**
 * NORMAL MODE ACOUSTIC PROFILES (Tiers 1 to 10)
 * Classic ABS, Cherry PBT, DSA, XDA, KAT, Pudding, Botanical, Ceramic, Teal CNC.
 */
export const ACOUSTICS_NORMAL: Record<number, KeycapAcousticProfile> = {
  0: {
    name: "Stock Membrane Flat",
    profile: "MEMBRANE",
    layers: [
      // Muffled rubber dome squish contact
      [0.28, 0.01, 800, 0.002, 0.008, 0.025, 1, 1, -0.8, 0, 0, 0, 0, 0.12],
      // Soft silicone pad dampening
      [0.35, 0.02, 220, 0.003, 0.016, 0.045, 0, 1, -1.2, 0, 0, 0, 0, 0.04],
    ],
  },
  1: {
    name: "ABS OEM Classic",
    profile: "OEM ABS",
    layers: [
      // Standard tactile plastic switch leaf
      [0.38, 0.01, 2600, 0.001, 0.004, 0.012, 2, 1, -1.0, 0, 0, 0, 0, 0.25],
      // Standard OEM lightweight plastic clack
      [0.46, 0.02, 270, 0.002, 0.014, 0.042, 1, 1, -1.0, 0, 0, 0, 0, 0.12],
    ],
  },
  2: {
    name: "Cherry PBT Minimal",
    profile: "CHERRY PBT",
    layers: [
      // Crisp PBT tactile click
      [0.4, 0.01, 2700, 0.001, 0.004, 0.012, 2, 1, -1.2, 0, 0, 0, 0, 0.2],
      // Clean Cherry profile bottom-out
      [0.48, 0.02, 330, 0.002, 0.014, 0.038, 1, 1, -1.2, 0, 0, 0, 0, 0.08],
    ],
  },
  3: {
    name: "DSA Workstation",
    profile: "DSA UNIFORM",
    layers: [
      // Low-travel snappy click
      [0.42, 0.01, 3000, 0.001, 0.003, 0.01, 2, 1, -1.1, 0, 0, 0, 0, 0.22],
      // Snappy uniform DSA clack
      [0.48, 0.02, 400, 0.002, 0.012, 0.034, 1, 1, -1.1, 0, 0, 0, 0, 0.08],
    ],
  },
  4: {
    name: "XDA Cyber Minimal",
    profile: "XDA FLAT-DISH",
    layers: [
      // Muted flat tactile bump
      [0.35, 0.02, 2300, 0.001, 0.005, 0.015, 1, 1, -1.6, 0, 0, 0, 0, 0.15],
      // Flat uniform muted thock
      [0.5, 0.02, 220, 0.003, 0.016, 0.042, 0, 1.2, -1.6, 0, 0, 0, 0, 0.08],
    ],
  },
  5: {
    name: "KAT Ergonomic Scoop",
    profile: "KAT SCULPTED",
    layers: [
      // Smooth tactile scoop actuation
      [0.38, 0.01, 2500, 0.001, 0.004, 0.014, 1, 1, -1.3, 0, 0, 0, 0, 0.18],
      // Ergonomic scoop clack
      [0.48, 0.02, 290, 0.002, 0.015, 0.042, 1, 1, -1.3, 0, 0, 0, 0, 0.08],
    ],
  },
  6: {
    name: "Dual-Tone Pudding Cap",
    profile: "PUDDING PBT",
    layers: [
      // Dual-density translucent click
      [0.42, 0.01, 2900, 0.001, 0.003, 0.011, 2, 1, -1.0, 0, 0, 0, 0, 0.28],
      // Translucent bottom-out clack
      [0.48, 0.02, 450, 0.002, 0.012, 0.036, 1, 1, -1.0, 0, 0, 0, 0, 0.12],
      // Acrylic wall chime
      [0.24, 0.01, 1100, 0.001, 0.006, 0.022, 0, 1, 0, 0, 0, 0, 0, 0.03],
    ],
  },
  7: {
    name: "KAM Satin Uniform",
    profile: "KAM SILK",
    layers: [
      // Silky smooth uniform pop
      [0.38, 0.01, 2600, 0.001, 0.004, 0.013, 1, 1, -1.2, 0, 0, 0, 0, 0.16],
      // Satin smooth bottom-out
      [0.46, 0.02, 310, 0.002, 0.014, 0.04, 1, 1, -1.2, 0, 0, 0, 0, 0.06],
    ],
  },
  8: {
    name: "Botanical Dye-Sub",
    profile: "BOTANICAL PBT",
    layers: [
      // Dense botanical tactile bump
      [0.36, 0.02, 2200, 0.002, 0.006, 0.016, 1, 1, -2.0, 0, 0, 0, 0, 0.18],
      // Heavy organic deep thock
      [0.55, 0.02, 190, 0.003, 0.02, 0.052, 0, 1.3, -2.0, 0, 0, 0, 0, 0.08],
    ],
  },
  9: {
    name: "Glazed Cyan Ceramic",
    profile: "CERAKEY CYAN",
    layers: [
      // Porcelain ceramic contact tap
      [0.42, 0.01, 3200, 0.001, 0.003, 0.01, 1, 1, 0, 0, 0, 0, 0, 0.16],
      // Glazed ceramic clink
      [0.48, 0.02, 840, 0.002, 0.01, 0.032, 1, 1, -1.2, 0, 0, 0, 0, 0.06],
      // Cyan porcelain chime
      [0.32, 0.01, 1950, 0.002, 0.016, 0.048, 0, 1, 0, 0, 0, 0, 0, 0.02],
    ],
  },
  10: {
    name: "CNC Anodized Teal",
    profile: "6063 CNC TEAL",
    layers: [
      // Aluminum anodized tap
      [0.44, 0.01, 3100, 0.001, 0.004, 0.012, 2, 1, -1, 0, 0, 0, 0, 0.2],
      // Metallic CNC body impact
      [0.46, 0.02, 550, 0.002, 0.012, 0.036, 1, 1, -1.2, 0, 0, 0, 0, 0.08],
      // Crisp metallic anodized ping
      [0.35, 0.01, 1700, 0.002, 0.018, 0.06, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0.08],
    ],
  },
};

/**
 * Fallback profile (OEM ABS Classic)
 */
const DEFAULT_ACOUSTIC: KeycapAcousticProfile = ACOUSTICS_NORMAL[0]!;

/**
 * Resolves the acoustic profile for a given mode and tier.
 */
export function getKeycapAcousticProfile(
  difficulty: string | null | undefined,
  tier: number,
): KeycapAcousticProfile {
  const clampedTier = Math.max(0, Math.min(10, tier ?? 0));
  const diffKey =
    difficulty === "master"
      ? "master"
      : difficulty === "expert"
        ? "expert"
        : "normal";

  if (diffKey === "master") {
    return ACOUSTICS_MASTER[clampedTier] ?? DEFAULT_ACOUSTIC;
  }
  if (diffKey === "expert") {
    return ACOUSTICS_EXPERT[clampedTier] ?? DEFAULT_ACOUSTIC;
  }
  return ACOUSTICS_NORMAL[clampedTier] ?? DEFAULT_ACOUSTIC;
}

/**
 * Plays the tailored mechanical switch acoustic for a keycap profile.
 * High-speed polyphonic playback using memoized ZzFXM AudioBuffers.
 */
export function playKeycapAcoustic(
  difficulty: string | null | undefined,
  tier: number,
  volume = 0.95,
): void {
  const clampedTier = Math.max(0, Math.min(10, tier ?? 0));
  const diffKey =
    difficulty === "master"
      ? "master"
      : difficulty === "expert"
        ? "expert"
        : "normal";

  const profile = getKeycapAcousticProfile(diffKey, clampedTier);
  const cacheKey = `keycap-${diffKey}-${clampedTier}`;

  playZzFXComposite(cacheKey, profile.layers, volume);
}

/**
 * Pre-synthesizes and memoizes AudioBuffers into RAM for instant zero-latency playback.
 */
export function preloadKeycapAcoustics(
  difficulty?: string | null,
  tier?: number,
): void {
  if (typeof window === "undefined") return;

  if (difficulty && tier !== undefined) {
    const clampedTier = Math.max(0, Math.min(10, tier ?? 0));
    const diffKey =
      difficulty === "master"
        ? "master"
        : difficulty === "expert"
          ? "expert"
          : "normal";
    const profile = getKeycapAcousticProfile(diffKey, clampedTier);
    bakeZzFXComposite(`keycap-${diffKey}-${clampedTier}`, profile.layers);
    return;
  }

  // Pre-bake all 33 profiles (Tiers 0 to 10) into memory
  for (let t = 0; t <= 10; t++) {
    const masterProf = getKeycapAcousticProfile("master", t);
    bakeZzFXComposite(`keycap-master-${t}`, masterProf.layers);

    const expertProf = getKeycapAcousticProfile("expert", t);
    bakeZzFXComposite(`keycap-expert-${t}`, expertProf.layers);

    const normalProf = getKeycapAcousticProfile("normal", t);
    bakeZzFXComposite(`keycap-normal-${t}`, normalProf.layers);
  }
}
