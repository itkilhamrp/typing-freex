<!--
  @file KeycapEvolutionBadge.svelte
  @description Procedural 3D mechanical keyboard keycap badge for personal best evolution cards.
  Renders genuine mechanical keyboard profiles (Cherry, OEM, DSA, XDA, KAT, SA, MT3, Ceramic,
  CNC Aluminum, Damascus Steel, Crystal Geode, etc.) with isometric depth and authentic finishes.
  Zero external assets, 100% lightweight SVG vector, 60 FPS performance.
-->
<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    playKeycapAcoustic,
    preloadKeycapAcoustics,
  } from "../utils/keycap-acoustic-presets";
  import { unlockAudioContext } from "@/lib/shared/audio/zzfx";

  interface Props {
    difficulty: string | null | undefined;
    tier: number; // 0 to 10
    class?: string;
  }

  const { difficulty, tier, class: className = "" }: Props = $props();

  const diffKey = $derived(
    difficulty === "master"
      ? "master"
      : difficulty === "expert"
        ? "expert"
        : "normal",
  );

  const clampedTier = $derived(Math.max(0, Math.min(10, tier ?? 0)));

  // Keycap profile meta and visual styling for each of the 30 combinations
  interface KeycapMeta {
    name: string;
    profile: string;
    topFill: string;
    leftFill: string;
    rightFill: string;
    dishFill: string;
    accentFill: string;
    borderColor: string;
    motif: "stem" | "spherical" | "cylindrical" | "kanji" | "pudding" | "botanical" | "brass" | "damascus" | "crystal" | "meteorite" | "crown" | "carbon" | "hex" | "ceramic";
    label: string;
  }

  const META_MASTER: Record<number, KeycapMeta> = {
    0: {
      name: "Unranked Bare Red Stem",
      profile: "BARE STEM",
      topFill: "#2d0606",
      leftFill: "#1a0303",
      rightFill: "#0c0101",
      dishFill: "#3e0a0a",
      accentFill: "#ef4444",
      borderColor: "rgba(239, 68, 68, 0.3)",
      motif: "stem",
      label: "BARE STEM",
    },
    1: {
      name: "Cherry Red Samurai",
      profile: "CHERRY PBT",
      topFill: "#450a0a",
      leftFill: "#2d0606",
      rightFill: "#1a0303",
      dishFill: "#5e0f0f",
      accentFill: "#fbbf24",
      borderColor: "rgba(239, 68, 68, 0.4)",
      motif: "kanji",
      label: "SAMURAI",
    },
    2: {
      name: "SA Berserk Crimson",
      profile: "SA SPHERICAL",
      topFill: "#7f1d1d",
      leftFill: "#450a0a",
      rightFill: "#2d0606",
      dishFill: "#991b1b",
      accentFill: "#f87171",
      borderColor: "rgba(239, 68, 68, 0.5)",
      motif: "spherical",
      label: "SA BERSERK",
    },
    3: {
      name: "MT3 Obsidian Scoop",
      profile: "MT3 DEEP-DISH",
      topFill: "#1c1917",
      leftFill: "#0c0a09",
      rightFill: "#050404",
      dishFill: "#292524",
      accentFill: "#ef4444",
      borderColor: "rgba(239, 68, 68, 0.6)",
      motif: "spherical",
      label: "MT3 OBSIDIAN",
    },
    4: {
      name: "Ruby Polycarbonate",
      profile: "PC TRANSLUCENT",
      topFill: "#991b1b",
      leftFill: "#5a0e0e",
      rightFill: "#380808",
      dishFill: "#b91c1c",
      accentFill: "#fca5a5",
      borderColor: "rgba(248, 113, 113, 0.6)",
      motif: "stem",
      label: "RUBY FROST",
    },
    5: {
      name: "Crimson Glazed Ceramic",
      profile: "CERAKEY GLOSS",
      topFill: "#b91c1c",
      leftFill: "#7f1d1d",
      rightFill: "#450a0a",
      dishFill: "#dc2626",
      accentFill: "#ffffff",
      borderColor: "rgba(252, 165, 165, 0.8)",
      motif: "ceramic",
      label: "CERAKEY",
    },
    6: {
      name: "Aerospace CNC Aluminum",
      profile: "6063 CNC ALLOY",
      topFill: "#991b1b",
      leftFill: "#5b0d0d",
      rightFill: "#350707",
      dishFill: "#7f1d1d",
      accentFill: "#fecaca",
      borderColor: "rgba(255, 255, 255, 0.7)",
      motif: "cylindrical",
      label: "CNC ALLOY",
    },
    7: {
      name: "Damascus Steel Forged",
      profile: "DAMASCUS STEEL",
      topFill: "#292524",
      leftFill: "#1c1917",
      rightFill: "#0c0a09",
      dishFill: "#3a3431",
      accentFill: "#ef4444",
      borderColor: "rgba(239, 68, 68, 0.8)",
      motif: "damascus",
      label: "DAMASCUS",
    },
    8: {
      name: "Ruby Crystal Geode",
      profile: "MINERAL CRYSTAL",
      topFill: "#b91c1c",
      leftFill: "#881337",
      rightFill: "#4c0519",
      dishFill: "#dc2626",
      accentFill: "#fde047",
      borderColor: "rgba(254, 202, 202, 0.9)",
      motif: "crystal",
      label: "RUBY GEODE",
    },
    9: {
      name: "Meteorite Magma Vein",
      profile: "WIDMANSTÄTTEN",
      topFill: "#18181b",
      leftFill: "#09090b",
      rightFill: "#030303",
      dishFill: "#27272a",
      accentFill: "#f97316",
      borderColor: "rgba(249, 115, 22, 0.9)",
      motif: "meteorite",
      label: "METEORITE",
    },
    10: {
      name: "Apex Zenith Crown",
      profile: "TITANIUM CROWN",
      topFill: "#3f0a14",
      leftFill: "#220409",
      rightFill: "#0d0103",
      dishFill: "#5c0e1e",
      accentFill: "#e11d48",
      borderColor: "rgba(255, 255, 255, 0.95)",
      motif: "crown",
      label: "APEX CROWN",
    },
  };

  const META_EXPERT: Record<number, KeycapMeta> = {
    0: {
      name: "Generic Amber ABS",
      profile: "GENERIC ABS",
      topFill: "#451a03",
      leftFill: "#290f02",
      rightFill: "#140701",
      dishFill: "#542307",
      accentFill: "#d97706",
      borderColor: "rgba(217, 119, 6, 0.3)",
      motif: "cylindrical",
      label: "GENERIC",
    },
    1: {
      name: "Vintage Dolch Cherry",
      profile: "CHERRY DOLCH",
      topFill: "#334155",
      leftFill: "#1e293b",
      rightFill: "#0f172a",
      dishFill: "#475569",
      accentFill: "#f59e0b",
      borderColor: "rgba(245, 158, 11, 0.4)",
      motif: "cylindrical",
      label: "DOLCH PBT",
    },
    2: {
      name: "SA Retro Spherical",
      profile: "SA 1970s",
      topFill: "#78350f",
      leftFill: "#451a03",
      rightFill: "#240e02",
      dishFill: "#92400e",
      accentFill: "#fbbf24",
      borderColor: "rgba(245, 158, 11, 0.5)",
      motif: "spherical",
      label: "SA RETRO",
    },
    3: {
      name: "MT3 Carbon Deep-Dish",
      profile: "MT3 CARBON",
      topFill: "#262626",
      leftFill: "#171717",
      rightFill: "#0a0a0a",
      dishFill: "#383838",
      accentFill: "#f59e0b",
      borderColor: "rgba(245, 158, 11, 0.6)",
      motif: "spherical",
      label: "MT3 CARBON",
    },
    4: {
      name: "Double-Shot Amber PBT",
      profile: "DOUBLE-SHOT PBT",
      topFill: "#92400e",
      leftFill: "#592305",
      rightFill: "#331402",
      dishFill: "#b45309",
      accentFill: "#fef3c7",
      borderColor: "rgba(245, 158, 11, 0.65)",
      motif: "cylindrical",
      label: "DOUBLE-SHOT",
    },
    5: {
      name: "Topre Electrostatic Cap",
      profile: "TOPRE SILENT",
      topFill: "#3f3f46",
      leftFill: "#27272a",
      rightFill: "#18181b",
      dishFill: "#52525b",
      accentFill: "#d97706",
      borderColor: "rgba(217, 119, 6, 0.7)",
      motif: "cylindrical",
      label: "TOPRE CAP",
    },
    6: {
      name: "Smoky Frosted Acrylic",
      profile: "SMOKY ACRYLIC",
      topFill: "#524838",
      leftFill: "#332c22",
      rightFill: "#1c1711",
      dishFill: "#6d604b",
      accentFill: "#fbbf24",
      borderColor: "rgba(251, 191, 36, 0.75)",
      motif: "stem",
      label: "FROST SMOKE",
    },
    7: {
      name: "Machined Brass Artisan",
      profile: "SOLID BRASS",
      topFill: "#b45309",
      leftFill: "#78350f",
      rightFill: "#451a03",
      dishFill: "#d97706",
      accentFill: "#fef08a",
      borderColor: "rgba(254, 240, 138, 0.8)",
      motif: "brass",
      label: "BRASS CNC",
    },
    8: {
      name: "Amber Honeycomb Lattice",
      profile: "SKELETON HEX",
      topFill: "#1f1708",
      leftFill: "#120d03",
      rightFill: "#080501",
      dishFill: "#31230a",
      accentFill: "#f59e0b",
      borderColor: "rgba(245, 158, 11, 0.85)",
      motif: "hex",
      label: "HONEYCOMB",
    },
    9: {
      name: "Golden Enamel Relief",
      profile: "ENAMEL GOLD",
      topFill: "#d97706",
      leftFill: "#92400e",
      rightFill: "#592305",
      dishFill: "#f59e0b",
      accentFill: "#ffffff",
      borderColor: "rgba(255, 255, 255, 0.85)",
      motif: "ceramic",
      label: "GOLD ENAMEL",
    },
    10: {
      name: "Forged Carbon & 24K Gold",
      profile: "FORGED CARBON",
      topFill: "#171717",
      leftFill: "#0a0a0a",
      rightFill: "#030303",
      dishFill: "#262626",
      accentFill: "#fbbf24",
      borderColor: "rgba(251, 191, 36, 0.95)",
      motif: "carbon",
      label: "FORGED GOLD",
    },
  };

  const META_NORMAL: Record<number, KeycapMeta> = {
    0: {
      name: "Stock Membrane Flat",
      profile: "MEMBRANE",
      topFill: "#1e293b",
      leftFill: "#0f172a",
      rightFill: "#020617",
      dishFill: "#334155",
      accentFill: "#64748b",
      borderColor: "rgba(100, 116, 139, 0.3)",
      motif: "cylindrical",
      label: "MEMBRANE",
    },
    1: {
      name: "ABS OEM Classic",
      profile: "OEM ABS",
      topFill: "#334155",
      leftFill: "#1e293b",
      rightFill: "#0f172a",
      dishFill: "#475569",
      accentFill: "#94a3b8",
      borderColor: "rgba(148, 163, 184, 0.3)",
      motif: "cylindrical",
      label: "OEM ABS",
    },
    2: {
      name: "Cherry PBT Minimal",
      profile: "CHERRY PBT",
      topFill: "#134e4a",
      leftFill: "#042f2e",
      rightFill: "#021c1b",
      dishFill: "#115e59",
      accentFill: "#2dd4bf",
      borderColor: "rgba(20, 184, 166, 0.4)",
      motif: "cylindrical",
      label: "CHERRY PBT",
    },
    3: {
      name: "DSA Workstation",
      profile: "DSA UNIFORM",
      topFill: "#1e293b",
      leftFill: "#0f172a",
      rightFill: "#020617",
      dishFill: "#334155",
      accentFill: "#14b8a6",
      borderColor: "rgba(20, 184, 166, 0.5)",
      motif: "spherical",
      label: "DSA RETRO",
    },
    4: {
      name: "XDA Cyber Minimal",
      profile: "XDA FLAT-DISH",
      topFill: "#0f766e",
      leftFill: "#115e59",
      rightFill: "#042f2e",
      dishFill: "#14b8a6",
      accentFill: "#ccfbf1",
      borderColor: "rgba(20, 184, 166, 0.6)",
      motif: "spherical",
      label: "XDA FLAT",
    },
    5: {
      name: "KAT Ergonomic Scoop",
      profile: "KAT SCULPTED",
      topFill: "#115e59",
      leftFill: "#042f2e",
      rightFill: "#021c1b",
      dishFill: "#0f766e",
      accentFill: "#5eead4",
      borderColor: "rgba(45, 212, 191, 0.65)",
      motif: "cylindrical",
      label: "KAT SCULPT",
    },
    6: {
      name: "Dual-Tone Pudding Cap",
      profile: "PUDDING PBT",
      topFill: "#0f172a",
      leftFill: "#134e4a",
      rightFill: "#115e59",
      dishFill: "#1e293b",
      accentFill: "#2dd4bf",
      borderColor: "rgba(45, 212, 191, 0.7)",
      motif: "pudding",
      label: "PUDDING",
    },
    7: {
      name: "KAM Satin Uniform",
      profile: "KAM SILK",
      topFill: "#134e4a",
      leftFill: "#0f766e",
      rightFill: "#042f2e",
      dishFill: "#14b8a6",
      accentFill: "#e6fffa",
      borderColor: "rgba(45, 212, 191, 0.75)",
      motif: "spherical",
      label: "KAM SATIN",
    },
    8: {
      name: "Botanical Dye-Sub",
      profile: "BOTANICAL PBT",
      topFill: "#064e3b",
      leftFill: "#022c22",
      rightFill: "#011712",
      dishFill: "#065f46",
      accentFill: "#a7f3d0",
      borderColor: "rgba(52, 211, 153, 0.8)",
      motif: "botanical",
      label: "BOTANICAL",
    },
    9: {
      name: "Glazed Cyan Ceramic",
      profile: "CERAKEY CYAN",
      topFill: "#0d9488",
      leftFill: "#0f766e",
      rightFill: "#115e59",
      dishFill: "#14b8a6",
      accentFill: "#ffffff",
      borderColor: "rgba(255, 255, 255, 0.85)",
      motif: "ceramic",
      label: "CERAKEY",
    },
    10: {
      name: "CNC Anodized Teal",
      profile: "6063 CNC TEAL",
      topFill: "#042f2e",
      leftFill: "#021c1b",
      rightFill: "#010e0e",
      dishFill: "#0f766e",
      accentFill: "#2dd4bf",
      borderColor: "rgba(255, 255, 255, 0.95)",
      motif: "crown",
      label: "CNC TEAL",
    },
  };

  const DEFAULT_META: KeycapMeta = {
    name: "Stock Membrane Flat",
    profile: "MEMBRANE",
    topFill: "#1e293b",
    leftFill: "#0f172a",
    rightFill: "#020617",
    dishFill: "#334155",
    accentFill: "#64748b",
    borderColor: "rgba(100, 116, 139, 0.3)",
    motif: "cylindrical",
    label: "MEMBRANE",
  };

  const meta = $derived.by<KeycapMeta>(() => {
    if (diffKey === "master") return META_MASTER[clampedTier] ?? META_MASTER[0] ?? DEFAULT_META;
    if (diffKey === "expert") return META_EXPERT[clampedTier] ?? META_EXPERT[0] ?? DEFAULT_META;
    return META_NORMAL[clampedTier] ?? META_NORMAL[0] ?? DEFAULT_META;
  });
  let isActuated = $state(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let rafId: number | null = null;

  // Lazy pre-baking audio buffer on hover avoids thread blocking during render
  function handlePointerEnter() {
    preloadKeycapAcoustics(diffKey, clampedTier);
  }

  function handleActuation(e: Event) {
    e.stopPropagation();
    if (e.cancelable) {
      e.preventDefault();
    }
    void unlockAudioContext();
    playKeycapAcoustic(diffKey, clampedTier);

    // Spam-click visual re-trigger
    isActuated = false;
    if (timeoutId) clearTimeout(timeoutId);
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = null;
      isActuated = true;
      timeoutId = setTimeout(() => {
        isActuated = false;
        timeoutId = null;
      }, 65);
    });
  }

  onDestroy(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });
</script>

<button
  type="button"
  class="group/keycap relative flex flex-col items-center justify-center select-none cursor-pointer p-0.5 rounded-xl transition-[transform,filter] duration-75 hover:scale-105 active:scale-90 active:translate-y-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-tt-primary/40 {className}"
  onpointerenter={handlePointerEnter}
  onpointerdown={handleActuation}
  onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") handleActuation(e); }}
  onclick={(e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); }}
  title={`${meta.name} (${meta.profile}) — Click to actuate mechanical switch`}
>
  <!-- 3D Mechanical Keycap SVG Isometric Projection (viewBox: 104 x 88) -->
  <svg
    viewBox="0 0 104 88"
    class={[
      "w-20 h-16 sm:w-24 sm:h-19 lg:w-26 lg:h-20 overflow-visible filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] transition-transform duration-75",
      isActuated ? "scale-90 translate-y-1.5" : ""
    ].join(" ")}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <!-- Base glow / shadow -->
      <filter id="key-blur-{diffKey}-{clampedTier}" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>

      <!-- Dish scoop linear gradient -->
      <linearGradient id="dish-grad-{diffKey}-{clampedTier}" x1="26" y1="20" x2="78" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color={meta.dishFill} stop-opacity="0.9" />
        <stop offset="50%" stop-color={meta.topFill} stop-opacity="1" />
        <stop offset="100%" stop-color={meta.dishFill} stop-opacity="0.8" />
      </linearGradient>

      <!-- Specular ridge highlight gradient -->
      <linearGradient id="ridge-grad-{diffKey}-{clampedTier}" x1="24" y1="34" x2="80" y2="31" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4" />
        <stop offset="50%" stop-color="#ffffff" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.2" />
      </linearGradient>
    </defs>

    <!-- Keycap Ambient Ground Shadow -->
    <ellipse cx="52" cy="74" rx="36" ry="7" fill="black" fill-opacity="0.35" filter="url(#key-blur-{diffKey}-{clampedTier})" />

    <!-- 1. Left Skirt Face -->
    <polygon
      points="12,62 54,77 54,43 24,34"
      fill={meta.leftFill}
      stroke={meta.borderColor}
      stroke-width="0.75"
      stroke-linejoin="round"
    />

    <!-- 2. Right Skirt Face -->
    <polygon
      points="54,77 94,57 80,31 54,43"
      fill={meta.rightFill}
      stroke={meta.borderColor}
      stroke-width="0.75"
      stroke-linejoin="round"
    />

    <!-- 3. Top Keycap Surface / Bevel -->
    <polygon
      points="24,34 54,43 80,31 50,22"
      fill={meta.topFill}
      stroke={meta.borderColor}
      stroke-width="0.75"
      stroke-linejoin="round"
    />

    <!-- 4. Sculpted Dish Scoop (Cylindrical or Spherical Scoop) -->
    <ellipse
      cx="52"
      cy="32.5"
      rx="21"
      ry="7"
      fill="url(#dish-grad-{diffKey}-{clampedTier})"
    />

    <!-- Specular Highlight Ridge Lines (1px crisp edge lighting) -->
    <path
      d="M 24 34 L 54 43 L 80 31"
      stroke="url(#ridge-grad-{diffKey}-{clampedTier})"
      stroke-width="1"
      stroke-linecap="round"
    />
    <path
      d="M 54 43 L 54 76"
      stroke="#ffffff"
      stroke-opacity="0.25"
      stroke-width="0.75"
      stroke-linecap="round"
    />

    <!-- Motif / Profile Signature Details -->
    {#if meta.motif === "stem"}
      <!-- Cherry MX Cross Stem Core (Mechanical Switch Stem) -->
      <g transform="translate(52, 32.5)">
        <circle r="4.5" fill={meta.topFill} stroke={meta.accentFill} stroke-width="0.75" />
        <rect x="-0.8" y="-3.2" width="1.6" height="6.4" fill={meta.accentFill} rx="0.3" />
        <rect x="-3.2" y="-0.8" width="6.4" height="1.6" fill={meta.accentFill} rx="0.3" />
      </g>
    {:else if meta.motif === "kanji"}
      <!-- Japanese Sub-Legend Artisan (Samurai Kanji: 侍) -->
      <g transform="translate(52, 32.5)">
        <text
          x="0"
          y="2.5"
          text-anchor="middle"
          fill={meta.accentFill}
          font-family="monospace"
          font-size="7.5"
          font-weight="900"
          letter-spacing="0"
        >
          侍
        </text>
      </g>
    {:else if meta.motif === "damascus"}
      <!-- Damascus Steel Acid-Etched Wave Veins -->
      <g stroke={meta.accentFill} stroke-width="0.75" stroke-opacity="0.8" stroke-linecap="round" fill="none">
        <path d="M 37 32 Q 44 28, 52 32 T 67 32" />
        <path d="M 39 35 Q 46 31, 54 35 T 65 35" />
      </g>
    {:else if meta.motif === "crystal"}
      <!-- Faceted Crystal Refraction Lines -->
      <g stroke={meta.accentFill} stroke-width="0.75" stroke-opacity="0.85" fill="none">
        <polygon points="52,28 60,32 52,36 44,32" stroke-width="0.75" />
        <line x1="52" y1="28" x2="52" y2="36" />
        <line x1="44" y1="32" x2="60" y2="32" />
      </g>
    {:else if meta.motif === "meteorite"}
      <!-- Widmanstätten Crystalline Magma Veins -->
      <g stroke={meta.accentFill} stroke-width="0.75" stroke-opacity="0.9" stroke-linecap="round">
        <line x1="42" y1="30" x2="62" y2="35" />
        <line x1="46" y1="35" x2="58" y2="29" />
        <circle cx="52" cy="32.5" r="1.5" fill={meta.accentFill} />
      </g>
    {:else if meta.motif === "crown"}
      <!-- Apex Crown / Hex Titanium Cage -->
      <g transform="translate(52, 32.5)">
        <polygon
          points="0,-4 3.5,-2 3.5,2 0,4 -3.5,2 -3.5,-2"
          fill="none"
          stroke={meta.accentFill}
          stroke-width="1"
        />
        <circle cx="0" cy="0" r="1.2" fill={meta.accentFill} />
      </g>
    {:else if meta.motif === "hex"}
      <!-- Honeycomb Hex Core -->
      <g transform="translate(52, 32.5)">
        <polygon
          points="0,-3.5 3,-1.7 3,1.7 0,3.5 -3,1.7 -3,-1.7"
          fill="none"
          stroke={meta.accentFill}
          stroke-width="0.75"
        />
      </g>
    {:else if meta.motif === "botanical"}
      <!-- Botanical Leaf Emblem -->
      <g transform="translate(52, 32.5)">
        <path
          d="M 0 3.5 C -3 1, -3 -2, 0 -3.5 C 3 -2, 3 1, 0 3.5 Z"
          fill={meta.accentFill}
        />
        <line x1="0" y1="3" x2="0" y2="-3" stroke={meta.topFill} stroke-width="0.5" />
      </g>
    {:else if meta.motif === "ceramic"}
      <!-- Glazed Reflection Arc -->
      <path
        d="M 40 31 Q 52 27, 64 31"
        stroke={meta.accentFill}
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-opacity="0.9"
      />
    {:else if meta.motif === "carbon"}
      <!-- Forged Gold Foil Flakes -->
      <g fill={meta.accentFill}>
        <polygon points="46,31 48,30 47,33" />
        <polygon points="56,32 58,34 55,35" />
        <polygon points="51,33 53,32 52,34" />
      </g>
    {:else}
      <!-- Standard Authentic Keycap Sculpt Dish Indicator -->
      <ellipse
        cx="52"
        cy="32.5"
        rx="9"
        ry="3"
        fill="none"
        stroke={meta.accentFill}
        stroke-opacity="0.35"
        stroke-width="0.6"
      />
    {/if}
  </svg>

  <!-- Profile Name Pill below Keycap -->
  <span
    class={[
      "mt-1 px-1.5 py-0.5 rounded-sm text-3xs font-black font-mono tracking-widest uppercase transition-colors shadow-2xs whitespace-nowrap",
      isActuated
        ? "bg-tt-primary/25 text-tt-primary"
        : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10"
    ].join(" ")}
  >
    {isActuated ? "ACTUATED!" : meta.label}
  </span>
</button>
