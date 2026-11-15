<script lang="ts">
  import { getTierMeta } from "@/core/achievements/tier-system";

  let {
    fillColor = "currentColor",
    accentColor = "#ffffff",
    gradientId = "gem-grad",
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
  class="gem-svg rank-{rank} {isUnlocked
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
    <linearGradient id="{gradientId}-deep" x1="0%" y1="0%" x2="100%" y2="100%">
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

  <g class="gem-crystal">
    {#if rank === "locked" || rank === "bronze"}
      <!-- BRONZE: Precision Cut Octahedral Key-Crystal -->
      <polygon
        points="14,7 34,7 43,19 24,41 5,19"
        fill={isUnlocked ? `url(#${gradientId}-body)` : "#64748b"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <polygon
        points="17,7 31,7 34,19 14,19"
        fill={isUnlocked ? accentColor : "#94a3b8"}
        opacity="0.45"
      />
      <polygon
        points="14,19 34,19 24,41"
        fill={isUnlocked ? `url(#${gradientId}-deep)` : "#475569"}
        opacity="0.55"
      />
      <polyline
        points="5,19 43,19"
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.2"
      />
      <polyline
        points="14,7 14,19 24,41 34,19 34,7"
        stroke={isUnlocked ? "#ffffff" : "#cbd5e1"}
        stroke-width="1"
        opacity="0.7"
      />
      <!-- Tactile Key-Switch Cross Reflection on Table -->
      <path
        d="M24 10.5 V15.5 M21.5 13 H26.5"
        stroke="#ffffff"
        stroke-width="1.4"
        stroke-linecap="round"
        opacity={isUnlocked ? "0.9" : "0.4"}
      />
    {:else if rank === "silver"}
      <!-- SILVER: Step-Cut Argentum Emerald with Claw Prongs -->
      <polygon
        points="12,5 36,5 43,13 43,31 36,39 12,39 5,31 5,13"
        fill="url(#{gradientId}-deep)"
        stroke="#ffffff"
        stroke-width="1.4"
      />
      <polygon
        points="15,8.5 33,8.5 38.5,15 38.5,29 33,35.5 15,35.5 9.5,29 9.5,15"
        fill="url(#{gradientId}-body)"
        stroke={accentColor}
        stroke-width="1"
      />
      <rect
        x="15.5"
        y="13.5"
        width="17"
        height="17"
        rx="2.5"
        fill="#0f172a"
        opacity="0.45"
        stroke="#ffffff"
        stroke-width="1"
      />
      <!-- Bevel Corner Miters -->
      <line
        x1="12"
        y1="5"
        x2="15.5"
        y2="13.5"
        stroke="#ffffff"
        stroke-width="1"
      />
      <line
        x1="36"
        y1="5"
        x2="32.5"
        y2="13.5"
        stroke="#ffffff"
        stroke-width="1"
      />
      <line
        x1="12"
        y1="39"
        x2="15.5"
        y2="30.5"
        stroke="#ffffff"
        stroke-width="1"
      />
      <line
        x1="36"
        y1="39"
        x2="32.5"
        y2="30.5"
        stroke="#ffffff"
        stroke-width="1"
      />
      <!-- Inner Silver Star Glint -->
      <polygon
        points="24,15.5 25.8,20.2 30.5,22 25.8,23.8 24,28.5 22.2,23.8 17.5,22 22.2,20.2"
        fill="#ffffff"
        class="gem-glint"
      />
    {:else if rank === "gold"}
      <!-- GOLD: Royal Imperial Topaz in 4-Prong Golden Filigree Setting -->
      <polygon
        points="15,3 33,3 44,14 44,29 33,40 15,40 4,29 4,14"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="1.4"
      />
      <polygon
        points="17,6.5 31,6.5 40,15.5 40,27.5 31,36.5 17,36.5 8,27.5 8,15.5"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <!-- Golden Corner Prongs -->
      <circle
        cx="9.5"
        cy="9.5"
        r="2.2"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="0.8"
      />
      <circle
        cx="38.5"
        cy="9.5"
        r="2.2"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="0.8"
      />
      <circle
        cx="38.5"
        cy="33.5"
        r="2.2"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="0.8"
      />
      <circle
        cx="9.5"
        cy="33.5"
        r="2.2"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="0.8"
      />
      <!-- Brilliant Table & Starburst -->
      <polygon
        points="24,10.5 32.5,16 32.5,27 24,32.5 15.5,27 15.5,16"
        fill="#fef08a"
        opacity="0.32"
        stroke="#ffffff"
        stroke-width="1"
      />
      <polygon
        points="24,13 26.2,19.2 32.5,21.5 26.2,23.8 24,30 21.8,23.8 15.5,21.5 21.8,19.2"
        fill="#ffffff"
        class="gem-glint"
      />
    {:else if rank === "platinum"}
      <!-- PLATINUM: Cryo-Lance Marquise Crystal with Floating Side Shards -->
      <!-- Floating Satellite Shards -->
      <polygon
        points="6,12 10,16 6,21 3,16"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <polygon
        points="42,12 45,16 42,21 38,16"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <!-- Main Marquise Crystal -->
      <polygon
        points="24,2 38,15 35,29 24,42 13,29 10,15"
        fill="url(#{gradientId}-deep)"
        stroke="#ffffff"
        stroke-width="1.5"
      />
      <polygon
        points="24,5 34.5,16 32,27.5 24,38.5 16,27.5 13.5,16"
        fill="url(#{gradientId}-body)"
        stroke={accentColor}
        stroke-width="1"
      />
      <line
        x1="24"
        y1="2"
        x2="24"
        y2="42"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <line x1="10" y1="15" x2="38" y2="15" stroke="#ffffff" stroke-width="1" />
      <polygon
        points="24,10 30,21 24,32 18,21"
        fill="#ffffff"
        opacity="0.9"
        class="gem-glint"
      />
    {:else if rank === "diamond"}
      <!-- DIAMOND: Sovereign 16-Facet Brilliant Diamond with Orbiting Micro-Gems -->
      <polygon
        points="11,6 37,6 46,17 24,43 2,17"
        fill="#0891b2"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <!-- Upper Crown Facets -->
      <polygon
        points="15,6 33,6 38,17 10,17"
        fill="#cffafe"
        stroke="#ffffff"
        stroke-width="1"
      />
      <polygon points="11,6 15,6 10,17 2,17" fill="#22d3ee" />
      <polygon points="37,6 33,6 38,17 46,17" fill="#06b6d4" />
      <!-- Lower Pavilion Facets -->
      <polygon points="10,17 24,17 24,43" fill="url(#{gradientId}-body)" />
      <polygon points="38,17 24,17 24,43" fill="#0e7490" />
      <polygon points="2,17 10,17 24,43" fill="#0891b2" opacity="0.85" />
      <polygon points="46,17 38,17 24,43" fill="#155e75" opacity="0.9" />
      <!-- Center Brilliant Refraction Star -->
      <polygon
        points="24,8.5 26.5,14.5 32.5,17 26.5,19.5 24,25.5 21.5,19.5 15.5,17 21.5,14.5"
        fill="#ffffff"
        class="gem-glint"
      />
    {:else if rank === "heroic"}
      <!-- HEROIC: Phoenix-Heart Molten Magma Gem in Obsidian Claws -->
      <path
        d="M24 2 C36 10 45 20 41 32 C37 40 24 43 15 40 C6 35 4 23 11 13 C15 8 19 5 24 2 Z"
        fill="#431407"
        stroke="#f97316"
        stroke-width="1.6"
      />
      <polygon
        points="24,5 37,15 35,30 24,39 13,30 11,15"
        fill="url(#{gradientId}-body)"
        stroke="#fed7aa"
        stroke-width="1.2"
      />
      <!-- Obsidian Armor Talons -->
      <polygon
        points="8,14 14,12 12,19"
        fill="#7c2d12"
        stroke="#fef08a"
        stroke-width="0.7"
      />
      <polygon
        points="40,14 34,12 36,19"
        fill="#7c2d12"
        stroke="#fef08a"
        stroke-width="0.7"
      />
      <!-- Inner Blazing Core -->
      <polygon
        points="24,9.5 31,21 24,33.5 17,21"
        fill="#ea580c"
        stroke="#fef08a"
        stroke-width="0.9"
      />
      <polygon
        points="24,13 28,21 24,29 20,21"
        fill="#fef08a"
        class="gem-glint"
      />
      <circle cx="24" cy="21" r="2.2" fill="#ffffff" />
    {:else if rank === "eliteHeroic"}
      <!-- ELITE HEROIC: Quantum Overclock Hex-Reactor Crystal -->
      <polygon
        points="24,2 43,12.5 43,31.5 24,42 5,31.5 5,12.5"
        fill="#022c22"
        stroke="#34d399"
        stroke-width="1.8"
      />
      <polygon
        points="24,5.5 39.5,14.5 39.5,29.5 24,38.5 8.5,29.5 8.5,14.5"
        fill="url(#{gradientId}-body)"
        stroke="#a7f3d0"
        stroke-width="1.1"
      />
      <!-- Circuit Matrix Facet Lines -->
      <line
        x1="24"
        y1="2"
        x2="24"
        y2="42"
        stroke="#ffffff"
        stroke-width="1"
        opacity="0.8"
      />
      <line
        x1="5"
        y1="12.5"
        x2="43"
        y2="31.5"
        stroke="#6ee7b7"
        stroke-width="1"
        opacity="0.8"
      />
      <line
        x1="43"
        y1="12.5"
        x2="5"
        y2="31.5"
        stroke="#6ee7b7"
        stroke-width="1"
        opacity="0.8"
      />
      <!-- Inner Hex Keycap Core -->
      <polygon
        points="24,12 32.5,17 32.5,27 24,32 15.5,27 15.5,17"
        fill="#064e3b"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <polygon
        points="24,15.5 29,18.5 29,25.5 24,28.5 19,25.5 19,18.5"
        fill="#34d399"
        class="gem-glint"
      />
      <circle cx="24" cy="22" r="2.5" fill="#ffffff" />
    {:else if rank === "master"}
      <!-- MASTER: Imperial Crown-Mounted Sovereign Amethyst -->
      <rect
        x="5"
        y="4"
        width="38"
        height="36"
        rx="9"
        fill="#3b0764"
        stroke="url(#{gradientId}-gold)"
        stroke-width="2"
      />
      <polygon
        points="15,7 33,7 40,14 40,30 33,37 15,37 8,30 8,14"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <!-- Golden Fleur Prongs -->
      <polygon
        points="24,2 27,6 24,9 21,6"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.7"
      />
      <polygon
        points="5,22 9,19 12,22 9,25"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.7"
      />
      <polygon
        points="43,22 39,19 36,22 39,25"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.7"
      />
      <!-- Cushion Core & Star -->
      <rect
        x="15"
        y="14"
        width="18"
        height="16"
        rx="3.5"
        fill="#581c87"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.2"
      />
      <polygon
        points="24,15 26.2,20 31.5,22 26.2,24 24,29 21.8,24 16.5,22 21.8,20"
        fill="#ffffff"
        class="gem-glint"
      />
    {:else if rank === "eliteMaster"}
      <!-- ELITE MASTER: Crimson Bloodstone Dragon-Shard -->
      <polygon
        points="24,1 41,10 46,23 39,38 24,43 9,38 2,23 7,10"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.8"
      />
      <polygon
        points="24,4.5 37.5,12 41.5,23 35.5,35 24,39.5 12.5,35 6.5,23 10.5,12"
        fill="url(#{gradientId}-body)"
        stroke="#fecaca"
        stroke-width="1.2"
      />
      <!-- Crimson Fracture Lines -->
      <line
        x1="24"
        y1="1"
        x2="24"
        y2="43"
        stroke="#ef4444"
        stroke-width="1.3"
      />
      <line
        x1="7"
        y1="10"
        x2="41.5"
        y2="23"
        stroke="#fca5a5"
        stroke-width="1"
      />
      <line
        x1="41"
        y1="10"
        x2="6.5"
        y2="23"
        stroke="#fca5a5"
        stroke-width="1"
      />
      <!-- Dragon Slit Core -->
      <polygon
        points="24,11 32,22 24,33 16,22"
        fill="#7f1d1d"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <polygon
        points="24,14.5 28,22 24,29.5 20,22"
        fill="#fef08a"
        class="gem-glint"
      />
      <polygon points="24,17 25.5,22 24,27 22.5,22" fill="#ffffff" />
    {:else}
      <!-- GRANDMASTER: Astral Philosopher's Nova Core with Golden Wing Mounts -->
      <polygon
        points="24,0 28,6 38,4 38,13 47,17 42,25 46,34 36,36 33,43 24,40 15,43 12,36 2,34 6,25 1,17 10,13 10,4 20,6"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1.3"
      />
      <polygon
        points="24,5 36,11 40,22 36,33 24,39 12,33 8,22 12,11"
        fill="#701a75"
        stroke="#fef08a"
        stroke-width="1.6"
      />
      <polygon
        points="24,8 33,13 36,22 33,31 24,36 15,31 12,22 15,13"
        fill="url(#{gradientId}-gold)"
      />
      <!-- Cosmic 8-Point Star Sapphire Heart -->
      <polygon
        points="24,10 26.8,18.8 35.5,22 26.8,25.2 24,34 21.2,25.2 12.5,22 21.2,18.8"
        fill="#ffffff"
        class="gem-glint"
      />
      <circle
        cx="24"
        cy="22"
        r="3.2"
        fill="#fef08a"
        stroke="#e11d48"
        stroke-width="0.9"
      />
    {/if}
  </g>
</svg>

<style>
  .gem-svg.is-unlocked .gem-crystal {
    transform-origin: 24px 22px;
    animation: gem-levitate 3.4s ease-in-out infinite;
  }

  .gem-svg.is-unlocked .gem-glint {
    transform-origin: 24px 22px;
    animation: gem-refract 2.6s ease-in-out infinite;
  }

  @keyframes gem-levitate {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-1.5px);
    }
  }

  @keyframes gem-refract {
    0%,
    100% {
      opacity: 0.82;
      transform: scale(0.95);
    }
    50% {
      opacity: 1;
      transform: scale(1.06);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .gem-crystal,
    .gem-glint {
      animation: none !important;
    }
  }
</style>
