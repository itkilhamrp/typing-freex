<script lang="ts">
  import { getTierMeta } from "@/core/achievements/tier-system";

  let {
    fillColor = "currentColor",
    accentColor = "#ffffff",
    gradientId = "star-grad",
    isUnlocked = true,
    tier = 0,
    class: className = "",
  }: {
    fillColor?: string;
    accentColor?: string;
    gradientId?: string;
    isUnlocked?: boolean;
    tier?: number;
    class?: string;
  } = $props();

  const meta = $derived(getTierMeta(tier));
  const rank = $derived(meta.name);
</script>

<svg
  viewBox="0 0 48 48"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class="star-svg rank-{rank} {isUnlocked
    ? 'is-unlocked'
    : 'is-locked'} {className}"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="{gradientId}-body" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.92" />
      <stop offset="30%" stop-color={accentColor} />
      <stop offset="100%" stop-color={fillColor} />
    </linearGradient>
    <linearGradient id="{gradientId}-shade" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color={fillColor} />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="{gradientId}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="28%" stop-color="#fef08a" />
      <stop offset="68%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#92400e" />
    </linearGradient>
  </defs>

  <g class="star-emblem">
    {#if rank === "locked" || rank === "bronze"}
      <!-- BRONZE: Chiseled 3D 5-Point Velocity Star with Keycap Core -->
      <path
        d="M24 3 L29.5 14.8 L42.5 16.2 L32.8 25 L35.4 37.8 L24 31.2 L12.6 37.8 L15.2 25 L5.5 16.2 L18.5 14.8 Z"
        fill={isUnlocked ? `url(#${gradientId}-body)` : "#64748b"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.4"
        stroke-linejoin="round"
      />
      <!-- 3D Bevel Ridge Lines -->
      <g
        stroke={isUnlocked ? "#ffffff" : "#cbd5e1"}
        stroke-width="0.75"
        opacity="0.65"
      >
        <line x1="24" y1="3" x2="24" y2="21.5" />
        <line x1="42.5" y1="16.2" x2="24" y2="21.5" />
        <line x1="35.4" y1="37.8" x2="24" y2="21.5" />
        <line x1="12.6" y1="37.8" x2="24" y2="21.5" />
        <line x1="5.5" y1="16.2" x2="24" y2="21.5" />
      </g>
      <!-- Center Keycap Pentagram Core -->
      <circle
        cx="24"
        cy="21.5"
        r="4.5"
        fill="#0f172a"
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.1"
      />
      <circle
        cx="24"
        cy="21.5"
        r="2"
        fill={isUnlocked ? accentColor : "#cbd5e1"}
      />
    {:else if rank === "silver"}
      <!-- SILVER: Machined Compass Polaris Star with Degree Ring -->
      <circle
        cx="24"
        cy="21.5"
        r="16.5"
        stroke={accentColor}
        stroke-width="1"
        stroke-dasharray="3 2.5"
        opacity="0.6"
        class="star-halo-spin"
      />
      <!-- Secondary 4 Diagonal Rays -->
      <polygon
        points="24,21.5 11,9 19,17 24,21.5 37,9 29,17 24,21.5 37,34 29,26 24,21.5 11,34 19,26"
        fill={fillColor}
        stroke="#ffffff"
        stroke-width="0.7"
      />
      <!-- Main 5-Point Star -->
      <path
        d="M24 2 L29.8 14.2 L43 15.6 L33 24.6 L35.8 37.8 L24 31 L12.2 37.8 L15 24.6 L5 15.6 L18.2 14.2 Z"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <polygon
        points="24,14 26.2,19.2 31.5,21.5 26.2,23.8 24,29 21.8,23.8 16.5,21.5 21.8,19.2"
        fill="#ffffff"
        class="star-core-pulse"
      />
    {:else if rank === "gold"}
      <!-- GOLD: 8-Point Golden Radiant Sunburst Star -->
      <polygon
        points="24,1 27,13 39,7 31.5,18 44,21.5 31.5,25 39,36 27,30 24,42 21,30 9,36 16.5,25 4,21.5 16.5,18 9,7 21,13"
        fill="#a16207"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1"
      />
      <path
        d="M24 2.5 L29.8 14.2 L42.8 15.6 L33 24.5 L35.6 37.5 L24 30.8 L12.4 37.5 L15 24.5 L5.2 15.6 L18.2 14.2 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <!-- Center Royal Keycap Medallion -->
      <circle
        cx="24"
        cy="21.5"
        r="5.5"
        fill="#78350f"
        stroke="#fef08a"
        stroke-width="1.2"
      />
      <polygon
        points="24,16.5 25.5,20 29,21.5 25.5,23 24,26.5 22.5,23 19,21.5 22.5,20"
        fill="#ffffff"
        class="star-core-pulse"
      />
    {:else if rank === "platinum"}
      <!-- PLATINUM: Crystalline 6-Point Shuriken Frost Nova -->
      <circle
        cx="24"
        cy="21.5"
        r="17"
        stroke={accentColor}
        stroke-width="1"
        opacity="0.55"
      />
      <polygon
        points="24,1 29.5,13 42.5,11 33.5,21.5 42.5,32 29.5,30 24,42 18.5,30 5.5,32 14.5,21.5 5.5,11 18.5,13"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <!-- Laser Crosshair Lines -->
      <line
        x1="24"
        y1="1"
        x2="24"
        y2="42"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <line
        x1="4"
        y1="21.5"
        x2="44"
        y2="21.5"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <polygon
        points="24,12 28.5,17.5 34,21.5 28.5,25.5 24,31 19.5,25.5 14,21.5 19.5,17.5"
        fill="#0284c7"
        stroke="#ffffff"
        stroke-width="1"
      />
      <polygon
        points="24,15 26.5,19.5 31,21.5 26.5,23.5 24,28 21.5,23.5 17,21.5 21.5,19.5"
        fill="#ffffff"
        class="star-core-pulse"
      />
    {:else if rank === "diamond"}
      <!-- DIAMOND: Brilliant Prismatic Octagram Starburst -->
      <circle
        cx="24"
        cy="21.5"
        r="18"
        stroke="#ffffff"
        stroke-width="1"
        stroke-dasharray="2 2.5"
        opacity="0.75"
        class="star-halo-spin"
      />
      <!-- Background Diamond Square -->
      <polygon
        points="24,3.5 42,21.5 24,39.5 6,21.5"
        fill="#0891b2"
        stroke="#a5f3fc"
        stroke-width="1.2"
      />
      <!-- Foreground Brilliant Star -->
      <polygon
        points="24,0.5 28.8,13 42.5,12 32.5,21.5 37.5,35.5 24,28 10.5,35.5 15.5,21.5 5.5,12 19.2,13"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <polygon
        points="24,9 27.5,17 35.5,21.5 27.5,26 24,34 20.5,26 12.5,21.5 20.5,17"
        fill="#cffafe"
      />
      <polygon
        points="24,13.5 26.2,19.2 32,21.5 26.2,23.8 24,29.5 21.8,23.8 16,21.5 21.8,19.2"
        fill="#ffffff"
        class="star-core-pulse"
      />
    {:else if rank === "heroic"}
      <!-- HEROIC: Blazing Solar-Flare Phoenix Star -->
      <!-- Swirling Fire Blades -->
      <path
        d="M9 9 C2 16 3 27 11 34 L14 26 C8 21 8 15 13 11 Z"
        fill="#ea580c"
        stroke="#fef08a"
        stroke-width="0.8"
      />
      <path
        d="M39 9 C46 16 45 27 37 34 L34 26 C40 21 40 15 35 11 Z"
        fill="#ea580c"
        stroke="#fef08a"
        stroke-width="0.8"
      />
      <path
        d="M24 0.5 L30 13 L43.5 14.5 L33.2 23.8 L36 37 L24 30 L12 37 L14.8 23.8 L4.5 14.5 L18 13 Z"
        fill="url(#{gradientId}-body)"
        stroke="#fef08a"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <polygon
        points="24,8.5 27.5,16.5 35.5,17.5 29.2,22.8 31.2,30.5 24,26 16.8,30.5 18.8,22.8 12.5,17.5 20.5,16.5"
        fill="#fef08a"
        class="star-core-pulse"
      />
      <circle cx="24" cy="21.5" r="3" fill="#ffffff" />
    {:else if rank === "eliteHeroic"}
      <!-- ELITE HEROIC: Overclocked Cyber-Pulsar Star with Rotating Hex Matrix -->
      <polygon
        points="24,1.5 41.5,11.5 41.5,31.5 24,41.5 6.5,31.5 6.5,11.5"
        stroke="#34d399"
        stroke-width="1.2"
        stroke-dasharray="5 2"
        opacity="0.75"
        class="star-halo-spin"
      />
      <path
        d="M24 0 L30.2 12.8 L44 14.2 L33.5 23.6 L36.5 37.2 L24 30 L11.5 37.2 L14.5 23.6 L4 14.2 L17.8 12.8 Z"
        fill="url(#{gradientId}-body)"
        stroke="#a7f3d0"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <!-- Quantum Hex Core -->
      <polygon
        points="24,13.5 31,17.5 31,25.5 24,29.5 17,25.5 17,17.5"
        fill="#022c22"
        stroke="#ffffff"
        stroke-width="1.3"
      />
      <polygon
        points="24,16 26.2,19.8 30,21.5 26.2,23.2 24,27 21.8,23.2 18,21.5 21.8,19.8"
        fill="#ffffff"
        class="star-core-pulse"
      />
    {:else if rank === "master"}
      <!-- MASTER: Imperial Sovereign Winged Star with Amethyst Core -->
      <path
        d="M7 7 C-1 15 -1 27 8 36 L12 29 C5 22 5 14 11 10 Z"
        fill="url(#{gradientId}-gold)"
      />
      <path
        d="M41 7 C49 15 49 27 40 36 L36 29 C43 22 43 14 37 10 Z"
        fill="url(#{gradientId}-gold)"
      />
      <path
        d="M24 0 L30.5 12.8 L44 14.2 L33.8 23.6 L36.8 37.2 L24 30 L11.2 37.2 L14.2 23.6 L4 14.2 L17.5 12.8 Z"
        fill="url(#{gradientId}-body)"
        stroke="url(#{gradientId}-gold)"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <circle
        cx="24"
        cy="21.5"
        r="6"
        fill="#4c1d95"
        stroke="#fef08a"
        stroke-width="1.5"
      />
      <polygon
        points="24,16.5 25.8,20 29.5,21.5 25.8,23 24,26.5 22.2,23 18.5,21.5 22.2,20"
        fill="#fef08a"
        class="star-core-pulse"
      />
    {:else if rank === "eliteMaster"}
      <!-- ELITE MASTER: Abyssal Crimson Supernova with Serrated Obsidian Blades -->
      <polygon
        points="5,7 0,17 8,21 1,31 12,28 8,19"
        fill="#dc2626"
        stroke="#fca5a5"
        stroke-width="0.7"
      />
      <polygon
        points="43,7 48,17 40,21 47,31 36,28 40,19"
        fill="#dc2626"
        stroke="#fca5a5"
        stroke-width="0.7"
      />
      <path
        d="M24 0 L30.8 12.8 L44.5 14.2 L34 23.6 L37 37.5 L24 30 L11 37.5 L14 23.6 L3.5 14.2 L17.2 12.8 Z"
        fill="url(#{gradientId}-body)"
        stroke="#fecaca"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <polygon
        points="24,10.5 29.5,21.5 24,32.5 18.5,21.5"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.2"
      />
      <polygon
        points="24,13.5 27,21.5 24,29.5 21,21.5"
        fill="#ffffff"
        class="star-core-pulse"
      />
    {:else}
      <!-- GRANDMASTER: Supreme Celestial 12-Point Seraphim Supernova -->
      <polygon
        points="24,-1 27.2,13 41,5.5 32.5,18.5 46.5,21.5 32.5,24.5 41,37.5 27.2,30 24,44 20.8,30 7,37.5 15.5,24.5 1.5,21.5 15.5,18.5 7,5.5 20.8,13"
        fill="url(#{gradientId}-gold)"
        opacity="0.85"
        class="star-halo-spin"
      />
      <path
        d="M24 0 L31 12.8 L45 14.2 L34.2 23.6 L37.2 37.5 L24 30 L10.8 37.5 L13.8 23.6 L3 14.2 L17 12.8 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="2.2"
        stroke-linejoin="round"
      />
      <circle
        cx="24"
        cy="21.5"
        r="6.8"
        fill="#701a75"
        stroke="#ffffff"
        stroke-width="1.6"
      />
      <polygon
        points="24,15 26,19.5 30.5,21.5 26,23.5 24,28 22,23.5 17.5,21.5 22,19.5"
        fill="#ffffff"
        class="star-core-pulse"
      />
      <circle cx="24" cy="21.5" r="2" fill="#fef08a" />
    {/if}
  </g>
</svg>

<style>
  .star-svg.is-unlocked .star-core-pulse {
    transform-origin: 24px 21.5px;
    animation: star-pulse 2.4s ease-in-out infinite;
  }

  .star-halo-spin {
    transform-origin: 24px 21.5px;
    animation: star-spin 20s linear infinite;
  }

  @keyframes star-pulse {
    0%,
    100% {
      opacity: 0.85;
      transform: scale(0.92);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  @keyframes star-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .star-core-pulse,
    .star-halo-spin {
      animation: none !important;
    }
  }
</style>
