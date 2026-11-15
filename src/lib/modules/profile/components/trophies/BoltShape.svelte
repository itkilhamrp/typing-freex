<script lang="ts">
  import { getTierMeta } from "@/core/achievements/tier-system";

  let {
    fillColor = "currentColor",
    accentColor = "#ffffff",
    gradientId = "bolt-grad",
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
  class="bolt-svg rank-{rank} {isUnlocked
    ? 'is-unlocked'
    : 'is-locked'} {className}"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="{gradientId}-body" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="28%" stop-color={accentColor} />
      <stop offset="100%" stop-color={fillColor} />
    </linearGradient>
    <linearGradient id="{gradientId}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="28%" stop-color="#fef08a" />
      <stop offset="68%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#92400e" />
    </linearGradient>
    <linearGradient id="{gradientId}-dark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
  </defs>

  <g class="bolt-lance">
    {#if rank === "locked" || rank === "bronze"}
      <!-- BRONZE: Chiseled 3D Keystroke Velocity Bolt with Tactile Switch Node -->
      <path
        d="M27.5 3 L10.5 25 H22.5 L18 43 L37.5 19.5 H25.5 L29.5 3 Z"
        fill={isUnlocked ? `url(#${gradientId}-body)` : "#64748b"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <!-- 3D Inner Bevel Spine -->
      {#if isUnlocked}
        <polygon
          points="27,6.5 14,23.5 23.5,23.5 20.5,36.5 33.5,21 24.5,21"
          fill="#ffffff"
          opacity="0.45"
        />
      {/if}
      <!-- Tactile Key-Switch Fulcrum Node -->
      <rect
        x="20.5"
        y="19.5"
        width="6.5"
        height="6.5"
        rx="1.5"
        fill="url(#{gradientId}-dark)"
        stroke={isUnlocked ? "#ffffff" : "#cbd5e1"}
        stroke-width="0.9"
      />
      <circle
        cx="23.75"
        cy="22.75"
        r="1.3"
        fill={isUnlocked ? accentColor : "#94a3b8"}
      />
    {:else if rank === "silver"}
      <!-- SILVER: Machined Twin-Blade Kinetic Bolt with Arc Sparks -->
      <!-- Flanking Kinetic Sparks -->
      <polygon
        points="5,18 11,22 7,27"
        fill={accentColor}
        stroke="#ffffff"
        stroke-width="0.6"
        class="bolt-arcs"
      />
      <polygon
        points="43,16 37,20 41,25"
        fill={accentColor}
        stroke="#ffffff"
        stroke-width="0.6"
        class="bolt-arcs"
      />
      <path
        d="M28 2 L9 25 H22.5 L17.5 44 L39 19 H25.5 L30.5 2 Z"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <polygon
        points="27,5.5 13.5,23.5 23.5,23.5 20,37.5 34.5,20.5 24.5,20.5"
        fill="#ffffff"
        opacity="0.55"
      />
      <polygon
        points="24,17.5 28.5,22 24,26.5 19.5,22"
        fill="#0f172a"
        stroke="#ffffff"
        stroke-width="1.1"
      />
      <circle cx="24" cy="22" r="1.8" fill="#ffffff" class="bolt-core" />
    {:else if rank === "gold"}
      <!-- GOLD: Olympian Zeus Thunderbolt with Twin Golden Wing-Arcs -->
      <!-- Left & Right Golden Wing Bolts -->
      <path
        d="M12 10 L5 22 H12 L8 32 L17 20 H11 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="0.7"
        class="bolt-arcs"
      />
      <path
        d="M36 10 L43 22 H36 L40 32 L31 20 H37 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="0.7"
        class="bolt-arcs"
      />
      <!-- Center Royal Golden Bolt -->
      <path
        d="M28.5 1.5 L9.5 24.5 H22.5 L17.5 44.5 L39.5 18.5 H26 L31 1.5 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <polygon
        points="27.5,5 14,23 23.5,23 20,38 35,20 25,20"
        fill="#ffffff"
        opacity="0.65"
      />
      <!-- Golden Keycap Star Core -->
      <circle
        cx="24"
        cy="22"
        r="4.5"
        fill="#78350f"
        stroke="#fef08a"
        stroke-width="1.1"
      />
      <polygon
        points="24,18.2 25.2,20.8 28,22 25.2,23.2 24,25.8 22.8,23.2 20,22 22.8,20.8"
        fill="#ffffff"
        class="bolt-core"
      />
    {:else if rank === "platinum"}
      <!-- PLATINUM: Cryo-Laser Railgun Lance with Angular Ice-Shard Stabilizers -->
      <polygon
        points="4,14 13,22 8,28 2,21"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="0.8"
        class="bolt-arcs"
      />
      <polygon
        points="44,14 35,22 40,28 46,21"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="0.8"
        class="bolt-arcs"
      />
      <path
        d="M28.5 1 L8.5 24.5 H22.5 L17 45 L40 19 H25.5 L31 1 Z"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.7"
        stroke-linejoin="round"
      />
      <!-- Laser Spine & Diamond Reticle -->
      <line
        x1="28.5"
        y1="1"
        x2="22.5"
        y2="24.5"
        stroke="#ffffff"
        stroke-width="1.4"
      />
      <line
        x1="22.5"
        y1="24.5"
        x2="17"
        y2="45"
        stroke="#ffffff"
        stroke-width="1.4"
      />
      <polygon
        points="24,16 29,22 24,28 19,22"
        fill="#0284c7"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <polygon
        points="24,18.5 26.8,22 24,25.5 21.2,22"
        fill="#ffffff"
        class="bolt-core"
      />
    {:else if rank === "diamond"}
      <!-- DIAMOND: Prismatic Quad-Refraction Lightning Burst with Diamond Capacitors -->
      <!-- 4 Floating Diamond Capacitors -->
      <polygon
        points="4,16 12,23 7,29 2,22"
        fill="#22d3ee"
        stroke="#ffffff"
        stroke-width="0.8"
        class="bolt-arcs"
      />
      <polygon
        points="44,16 36,23 41,29 46,22"
        fill="#22d3ee"
        stroke="#ffffff"
        stroke-width="0.8"
        class="bolt-arcs"
      />
      <polygon
        points="11,4 16,12 11,16 8,9"
        fill="#a5f3fc"
        stroke="#ffffff"
        stroke-width="0.7"
      />
      <polygon
        points="37,4 32,12 37,16 40,9"
        fill="#a5f3fc"
        stroke="#ffffff"
        stroke-width="0.7"
      />
      <!-- Main Prismatic Thunderbolt -->
      <path
        d="M29 0.5 L7.5 24.5 H22.5 L16.5 45.5 L41 18.5 H25.5 L31.5 0.5 Z"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.9"
        stroke-linejoin="round"
      />
      <polygon
        points="27.5,5.5 13.5,23 23.5,23 19.5,38.5 35.5,20 25,20"
        fill="#cffafe"
        opacity="0.8"
      />
      <polygon
        points="24,15.5 30,22 24,28.5 18,22"
        fill="#083344"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <polygon
        points="24,18 27.5,22 24,26 20.5,22"
        fill="#ffffff"
        class="bolt-core"
      />
    {:else if rank === "heroic"}
      <!-- HEROIC: Hellfire Storm-Cleaver Bolt with Blazing Magma Side-Blades -->
      <path
        d="M12 7 C4 14 3 24 11 33 L14 26 C8 20 9 13 15 10 Z"
        fill="#ea580c"
        stroke="#fef08a"
        stroke-width="0.8"
        class="bolt-arcs"
      />
      <path
        d="M36 7 C44 14 45 24 37 33 L34 26 C40 20 39 13 33 10 Z"
        fill="#ea580c"
        stroke="#fef08a"
        stroke-width="0.8"
        class="bolt-arcs"
      />
      <path
        d="M29 0.5 L7.5 25 H22.5 L16.5 46 L41.5 18.5 H25.5 L32 0.5 Z"
        fill="url(#{gradientId}-body)"
        stroke="#fed7aa"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <polygon
        points="27.5,5 14.5,23.5 23.5,23.5 19.5,39.5 35.5,20 25,20"
        fill="#fef08a"
        class="bolt-core"
      />
      <circle
        cx="24"
        cy="22"
        r="2.6"
        fill="#ffffff"
        stroke="#ea580c"
        stroke-width="1"
      />
    {:else if rank === "eliteHeroic"}
      <!-- ELITE HEROIC: Overclocked Cyber-Conduit Hyper-Bolt with Neon Circuit Trace -->
      <polygon
        points="10,7 1,23 10,23 4,35 15,21 8,21"
        fill="#10b981"
        stroke="#a7f3d0"
        stroke-width="0.8"
        class="bolt-arcs"
      />
      <polygon
        points="38,7 47,23 38,23 44,35 33,21 40,21"
        fill="#10b981"
        stroke="#a7f3d0"
        stroke-width="0.8"
        class="bolt-arcs"
      />
      <path
        d="M29.5 0.5 L6.5 25 H22.5 L16 46 L42 18.5 H25.5 L32.5 0.5 Z"
        fill="url(#{gradientId}-body)"
        stroke="#a7f3d0"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- Inner Neon Circuit Trace & Quantum Nodes -->
      <polyline
        points="29.5,4.5 14,23.5 23.5,23.5 18.5,40.5 36.5,20 25.5,20 31,4.5"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="bolt-core"
      />
      <polygon
        points="24,17 28.5,22 24,27 19.5,22"
        fill="#022c22"
        stroke="#6ee7b7"
        stroke-width="1.2"
      />
      <circle cx="24" cy="22" r="2" fill="#ffffff" />
    {:else if rank === "master"}
      <!-- MASTER: Imperial Sovereign Sceptre-Bolt with Golden Eagle Wings -->
      <path
        d="M12 4 C1 11 0 23 10 34 L14 27 C6 19 7 12 16 8 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.8"
        class="bolt-arcs"
      />
      <path
        d="M36 4 C47 11 48 23 38 34 L34 27 C42 19 41 12 32 8 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.8"
        class="bolt-arcs"
      />
      <path
        d="M30 0 L6 25.5 H22.5 L15.5 46.5 L43 18 H25.5 L33 0 Z"
        fill="url(#{gradientId}-body)"
        stroke="url(#{gradientId}-gold)"
        stroke-width="2.1"
        stroke-linejoin="round"
      />
      <polygon
        points="27.5,4.5 13.5,23.5 23.5,23.5 18.5,40.5 37,19.5 25.5,19.5 31,4.5"
        fill="#f3e8ff"
        opacity="0.85"
      />
      <!-- Royal Amethyst & Gold Core -->
      <circle
        cx="24"
        cy="22"
        r="5"
        fill="#3b0764"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.5"
      />
      <polygon
        points="24,18 25.5,20.8 28.5,22 25.5,23.2 24,26 22.5,23.2 19.5,22 22.5,20.8"
        fill="#fef08a"
        class="bolt-core"
      />
    {:else if rank === "eliteMaster"}
      <!-- ELITE MASTER: Abyssal Dragon-Slayer Blood-Lightning Spear -->
      <polygon
        points="11,5 0,15 8,21 1,31 13,31 8,23 14,17"
        fill="#dc2626"
        stroke="#fca5a5"
        stroke-width="0.8"
        class="bolt-arcs"
      />
      <polygon
        points="37,5 48,15 40,21 47,31 35,31 40,23 34,17"
        fill="#dc2626"
        stroke="#fca5a5"
        stroke-width="0.8"
        class="bolt-arcs"
      />
      <path
        d="M30.5 0 L5 25.5 H22.5 L15 47 L44 18 H25.5 L34 0 Z"
        fill="url(#{gradientId}-body)"
        stroke="#fecaca"
        stroke-width="2.2"
        stroke-linejoin="round"
      />
      <polygon
        points="27.5,4.5 13,23.5 23.5,23.5 18,40.5 38,19.5 26,19.5 31.5,4.5"
        fill="#ffffff"
        opacity="0.9"
      />
      <!-- Dragon Slit-Eye Core -->
      <polygon
        points="24,15 30,22 24,29 18,22"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.2"
      />
      <polygon
        points="24,17.5 26.2,22 24,26.5 21.8,22"
        fill="#fef08a"
        class="bolt-core"
      />
    {:else}
      <!-- GRANDMASTER: Supreme Celestial Astral Thunderbolt with Seraphim Wings -->
      <circle
        cx="24"
        cy="22"
        r="17.5"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.1"
        stroke-dasharray="3 2"
        opacity="0.8"
      />
      <path
        d="M10 2 C-2 11 -2 24 10 35 L14 28 C4 20 5 11 15 6 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.9"
        class="bolt-arcs"
      />
      <path
        d="M38 2 C50 11 50 24 38 35 L34 28 C44 20 43 11 33 6 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.9"
        class="bolt-arcs"
      />
      <path
        d="M31 0 L4 25.5 H22.5 L14.5 47 L45 18 H26 L35 0 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="2.4"
        stroke-linejoin="round"
      />
      <polygon
        points="28.5,3.8 11.5,23.5 23.5,23.5 17.5,41 39,19.5 26.5,19.5 32.5,3.8"
        fill="#ffffff"
      />
      <!-- Supernova Core -->
      <circle
        cx="24"
        cy="22"
        r="5"
        fill="#701a75"
        stroke="#ffffff"
        stroke-width="1.3"
      />
      <polygon
        points="24,16 26,20 30,22 26,24 24,28 22,24 18,22 22,20"
        fill="#fef08a"
        class="bolt-core"
      />
    {/if}
  </g>
</svg>

<style>
  .bolt-svg.is-unlocked .bolt-lance {
    transform-origin: 24px 23px;
    animation: bolt-surge 2.6s ease-in-out infinite;
  }

  .bolt-svg.is-unlocked .bolt-arcs {
    transform-origin: 24px 22px;
    animation: bolt-crackle 1.8s ease-in-out infinite;
  }

  .bolt-svg.is-unlocked .bolt-core {
    transform-origin: 24px 22px;
    animation: bolt-gleam 2s ease-in-out infinite;
  }

  @keyframes bolt-surge {
    0%,
    100% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-1.2px) scale(1.02);
    }
  }

  @keyframes bolt-crackle {
    0%,
    100% {
      opacity: 0.72;
      transform: scale(0.96);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
  }

  @keyframes bolt-gleam {
    0%,
    100% {
      opacity: 0.82;
    }
    50% {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bolt-lance,
    .bolt-arcs,
    .bolt-core {
      animation: none !important;
    }
  }
</style>
