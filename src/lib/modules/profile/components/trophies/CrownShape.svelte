<script lang="ts">
  import { getTierMeta } from "@/core/achievements/tier-system";

  let {
    fillColor = "currentColor",
    accentColor = "#ffffff",
    gradientId = "crown-grad",
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
  class="crown-svg rank-{rank} {isUnlocked
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
    <linearGradient id="{gradientId}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="28%" stop-color="#fef08a" />
      <stop offset="68%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#92400e" />
    </linearGradient>
    <linearGradient id="{gradientId}-band" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
  </defs>

  <g class="crown-diadem">
    {#if rank === "locked" || rank === "bronze"}
      <!-- BRONZE: Forged Vanguard Circlet with Chiseled Key-Blade Peaks -->
      <path
        d="M7 33 L5 15 L15 23 L24 8 L33 23 L43 15 L41 33 Z"
        fill={isUnlocked ? `url(#${gradientId}-body)` : "#64748b"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <!-- 3D Facet Splits -->
      <polygon points="24,8 24,33 15,23" fill="#0f172a" opacity="0.22" />
      <polygon points="43,15 41,33 33,23" fill="#0f172a" opacity="0.22" />
      <!-- Brow Band with Keycap Studs -->
      <rect
        x="6.5"
        y="32"
        width="35"
        height="6.5"
        rx="2"
        fill="url(#{gradientId}-band)"
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.3"
      />
      <rect
        x="21.5"
        y="33.5"
        width="5"
        height="3.5"
        rx="0.8"
        fill={isUnlocked ? accentColor : "#cbd5e1"}
      />
      <circle
        cx="13"
        cy="35.2"
        r="1.4"
        fill={isUnlocked ? fillColor : "#64748b"}
      />
      <circle
        cx="35"
        cy="35.2"
        r="1.4"
        fill={isUnlocked ? fillColor : "#64748b"}
      />
      <circle
        cx="5"
        cy="14"
        r="2.2"
        fill={isUnlocked ? accentColor : "#94a3b8"}
      />
      <circle
        cx="24"
        cy="7"
        r="2.8"
        fill={isUnlocked ? "#ffffff" : "#cbd5e1"}
      />
      <circle
        cx="43"
        cy="14"
        r="2.2"
        fill={isUnlocked ? accentColor : "#94a3b8"}
      />
    {:else if rank === "silver"}
      <!-- SILVER: Knight's 5-Spire Argentum Coronet -->
      <path d="M10 32 C10 19 38 19 38 32 Z" fill={fillColor} opacity="0.45" />
      <path
        d="M6 33 L4 14 L12.5 23 L17.5 13 L24 6 L30.5 13 L35.5 23 L44 14 L42 33 Z"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
      <rect
        x="5.5"
        y="32"
        width="37"
        height="6.5"
        rx="2"
        fill="url(#{gradientId}-band)"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <!-- Brow Diamonds -->
      <polygon points="24,33 26.5,35.2 24,37.5 21.5,35.2" fill="#ffffff" />
      <circle cx="13" cy="35.2" r="1.5" fill={accentColor} />
      <circle cx="35" cy="35.2" r="1.5" fill={accentColor} />
      <!-- Spire Pearls -->
      <circle cx="4" cy="13" r="2.2" fill="#ffffff" />
      <circle cx="17.5" cy="12" r="2" fill={accentColor} />
      <circle cx="24" cy="5" r="3" fill="#ffffff" class="crown-jewel-pulse" />
      <circle cx="30.5" cy="12" r="2" fill={accentColor} />
      <circle cx="44" cy="13" r="2.2" fill="#ffffff" />
    {:else if rank === "gold"}
      <!-- GOLD: Royal Champion's Crown with Velvet Cap & Precious Jewels -->
      <!-- Crimson Royal Velvet Inner Cap -->
      <path
        d="M8 32 C8 16 20 13 24 18 C28 13 40 16 40 32 Z"
        fill="#991b1b"
        stroke="#fde047"
        stroke-width="0.8"
      />
      <!-- 5 Ornate Golden Spires -->
      <path
        d="M5 33 L3 13 L11.5 23 L17.5 12 L24 4 L30.5 12 L36.5 23 L45 13 L43 33 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
      <!-- Chiseled Golden Brow Band -->
      <rect
        x="4.5"
        y="32"
        width="39"
        height="7"
        rx="2.2"
        fill="#78350f"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.5"
      />
      <rect
        x="7"
        y="33.8"
        width="34"
        height="3.4"
        rx="1"
        fill="url(#{gradientId}-gold)"
      />
      <!-- Royal Jewels -->
      <polygon
        points="24,14 27,19 24,24 21,19"
        fill="#ef4444"
        stroke="#ffffff"
        stroke-width="0.9"
        class="crown-jewel-pulse"
      />
      <circle
        cx="13"
        cy="35.5"
        r="1.6"
        fill="#10b981"
        stroke="#ffffff"
        stroke-width="0.5"
      />
      <circle
        cx="24"
        cy="35.5"
        r="1.9"
        fill="#ef4444"
        stroke="#ffffff"
        stroke-width="0.6"
      />
      <circle
        cx="35"
        cy="35.5"
        r="1.6"
        fill="#10b981"
        stroke="#ffffff"
        stroke-width="0.5"
      />
      <polygon
        points="24,0.8 26.2,3.8 24,6.5 21.8,3.8"
        fill="#ffffff"
        stroke="#eab308"
        stroke-width="0.7"
      />
    {:else if rank === "platinum"}
      <!-- PLATINUM: Valkyrie Cryo-Crest Tiara with Swept Wing-Blades -->
      <polygon
        points="5,33 1,10 11,21 17,11 24,3 31,11 37,21 47,10 43,33"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.4"
        stroke-linejoin="round"
      />
      <!-- Inner Frost Facets -->
      <polygon
        points="24,3 28.5,19 24,31 19.5,19"
        fill="#0284c7"
        stroke="#e0f2fe"
        stroke-width="0.9"
      />
      <polygon
        points="24,7 26.8,19 24,27 21.2,19"
        fill="#ffffff"
        class="crown-jewel-pulse"
      />
      <polygon
        points="4.5,32 43.5,32 41,39 7,39"
        fill="#0369a1"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <line
        x1="11"
        y1="35.5"
        x2="37"
        y2="35.5"
        stroke="#ffffff"
        stroke-width="1.4"
        stroke-linecap="round"
      />
    {:else if rank === "diamond"}
      <!-- DIAMOND: Prismatic Archon Diadem with Floating Diamond Finials -->
      <polygon
        points="4,33 1,11 11,22 24,2 37,22 47,11 44,33"
        fill="#0891b2"
        stroke="#ffffff"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <polygon
        points="8,33 11,17 18,24 24,6 30,24 37,17 40,33"
        fill="url(#{gradientId}-body)"
        stroke="#cffafe"
        stroke-width="1"
      />
      <!-- Center Brilliant Prism -->
      <polygon
        points="24,6 29,18 24,28 19,18"
        fill="#ffffff"
        stroke="#06b6d4"
        stroke-width="1"
        class="crown-jewel-pulse"
      />
      <!-- Floating Diamond Satellites -->
      <polygon
        points="11,8 13,11 11,14 9,11"
        fill="#ffffff"
        stroke="#22d3ee"
        stroke-width="0.7"
      />
      <polygon
        points="37,8 39,11 37,14 35,11"
        fill="#ffffff"
        stroke="#22d3ee"
        stroke-width="0.7"
      />
      <polygon
        points="4,32 44,32 41,39 7,39"
        fill="#083344"
        stroke="#67e8f9"
        stroke-width="1.3"
      />
      <polygon points="24,33 26.5,35.5 24,38 21.5,35.5" fill="#ffffff" />
    {:else if rank === "heroic"}
      <!-- HEROIC: Infernal Warlord Horned Flame-Crown -->
      <path
        d="M4 33 C0 21 0 11 4 4 C6 12 10 18 14 22 C16 14 20 8 24 1 C28 8 32 14 34 22 C38 18 42 12 44 4 C48 11 48 21 44 33 Z"
        fill="#9a3412"
        stroke="#fed7aa"
        stroke-width="1.4"
      />
      <path
        d="M9 33 C11 22 15 16 18 23 C20 15 22 10 24 5 C26 10 28 15 30 23 C33 16 37 22 39 33 Z"
        fill="url(#{gradientId}-body)"
      />
      <!-- Roaring Flame Core -->
      <path
        d="M24 11 C27.5 16 28 22 24 27 C20 22 20.5 16 24 11 Z"
        fill="#fef08a"
        class="crown-jewel-pulse"
      />
      <circle cx="24" cy="21" r="2.2" fill="#ffffff" />
      <polygon
        points="4,32 44,32 40.5,39 7.5,39"
        fill="#431407"
        stroke="#f97316"
        stroke-width="1.4"
      />
      <line
        x1="12"
        y1="35.5"
        x2="36"
        y2="35.5"
        stroke="#fef08a"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    {:else if rank === "eliteHeroic"}
      <!-- ELITE HEROIC: Cyber-Emperor Neural Visor Crown -->
      <polygon
        points="4,32 0,7 10,19 16,9 24,1 32,9 38,19 48,7 44,32"
        fill="#064e3b"
        stroke="#6ee7b7"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <polygon
        points="8,32 5,13 13,22 18,13 24,5 30,13 35,22 43,13 40,32"
        fill="url(#{gradientId}-body)"
      />
      <!-- Cyber HUD Visor Slit -->
      <polygon
        points="4,31 44,31 40,39 8,39"
        fill="#022c22"
        stroke="#34d399"
        stroke-width="1.4"
      />
      <rect x="11" y="33.5" width="26" height="3" rx="1.5" fill="#10b981" />
      <line
        x1="14"
        y1="35"
        x2="34"
        y2="35"
        stroke="#ffffff"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <!-- Quantum Core Jewel -->
      <polygon
        points="24,12 28.5,19 24,26 19.5,19"
        fill="#ffffff"
        stroke="#059669"
        stroke-width="1"
        class="crown-jewel-pulse"
      />
    {:else if rank === "master"}
      <!-- MASTER: Imperial Sovereign Double-Arch Coronation Crown -->
      <!-- Velvet Royal Dome & Golden Arches -->
      <path
        d="M6 32 C6 14 16 7 24 7 C32 7 42 14 42 32"
        fill="#4c1d95"
        stroke="url(#{gradientId}-gold)"
        stroke-width="2"
      />
      <line
        x1="24"
        y1="5"
        x2="24"
        y2="32"
        stroke="url(#{gradientId}-gold)"
        stroke-width="2.2"
      />
      <!-- Front 5 Imperial Spires -->
      <path
        d="M4 33 L2 14 L11 23 L17.5 12 L24 4 L30.5 12 L37 23 L46 14 L44 33 Z"
        fill="url(#{gradientId}-body)"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <!-- Sovereign Brow Band -->
      <rect
        x="4"
        y="32"
        width="40"
        height="7"
        rx="2.2"
        fill="#3b0764"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.6"
      />
      <polygon
        points="24,13 27.5,19 24,25 20.5,19"
        fill="#ffffff"
        stroke="#fef08a"
        stroke-width="1"
        class="crown-jewel-pulse"
      />
      <circle cx="12" cy="35.5" r="1.6" fill="#fef08a" />
      <circle cx="24" cy="35.5" r="2" fill="#ffffff" />
      <circle cx="36" cy="35.5" r="1.6" fill="#fef08a" />
    {:else if rank === "eliteMaster"}
      <!-- ELITE MASTER: Abyssal Dragon-Emperor Horned Crown -->
      <!-- Sweeping Serrated Obsidian Dragon Horns -->
      <path
        d="M4 33 C-3 17 1 3 10 -1 C8 9 11 16 16 21 L24 3 L32 21 C37 16 40 9 38 -1 C47 3 51 17 44 33 Z"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <polygon
        points="9,32 15,13 20,24 24,8 28,24 33,13 39,32"
        fill="url(#{gradientId}-body)"
        stroke="#fca5a5"
        stroke-width="1"
      />
      <!-- Crimson Bloodstone Eye -->
      <polygon
        points="24,12 28.5,19.5 24,27 19.5,19.5"
        fill="#dc2626"
        stroke="#ffffff"
        stroke-width="1.1"
        class="crown-jewel-pulse"
      />
      <polygon points="24,15 26,19.5 24,24 22,19.5" fill="#fef08a" />
      <polygon
        points="3,32 45,32 40.5,39.5 7.5,39.5"
        fill="#1c0404"
        stroke="#ef4444"
        stroke-width="1.5"
      />
      <circle cx="14" cy="35.8" r="1.5" fill="#ef4444" />
      <circle cx="24" cy="35.8" r="2" fill="#ffffff" />
      <circle cx="34" cy="35.8" r="1.5" fill="#ef4444" />
    {:else}
      <!-- GRANDMASTER: Supreme Celestial God-King Seraphim Crown -->
      <!-- Celestial Halo Behind Spires -->
      <circle
        cx="24"
        cy="18"
        r="14"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.2"
        stroke-dasharray="3 2"
        opacity="0.8"
      />
      <!-- Grand 7-Peak Seraphim Wing-Crown -->
      <path
        d="M3 33 L0 10 L8.5 21 L14 9 L19.5 18 L24 0 L28.5 18 L34 9 L39.5 21 L48 10 L45 33 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <!-- Royal Astral Center Jewel -->
      <polygon
        points="24,10 28.5,18.5 24,27 19.5,18.5"
        fill="#701a75"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <polygon
        points="24,13 26.5,18.5 24,24 21.5,18.5"
        fill="#ffffff"
        class="crown-jewel-pulse"
      />
      <!-- Imperial Base Band -->
      <rect
        x="3"
        y="32"
        width="42"
        height="7.5"
        rx="2.5"
        fill="#701a75"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.8"
      />
      <rect
        x="5.5"
        y="34"
        width="37"
        height="3.5"
        rx="1.2"
        fill="url(#{gradientId}-gold)"
      />
      <circle cx="11" cy="35.8" r="1.6" fill="#ffffff" />
      <circle cx="17.5" cy="35.8" r="1.6" fill="#e11d48" />
      <circle cx="24" cy="35.8" r="2.1" fill="#ffffff" />
      <circle cx="30.5" cy="35.8" r="1.6" fill="#e11d48" />
      <circle cx="37" cy="35.8" r="1.6" fill="#ffffff" />
    {/if}
  </g>
</svg>

<style>
  .crown-svg.is-unlocked .crown-diadem {
    transform-origin: 24px 22px;
    animation: crown-float 3.5s ease-in-out infinite;
  }

  .crown-svg.is-unlocked .crown-jewel-pulse {
    transform-origin: 24px 18px;
    animation: jewel-gleam 2.4s ease-in-out infinite;
  }

  @keyframes crown-float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-1.4px);
    }
  }

  @keyframes jewel-gleam {
    0%,
    100% {
      opacity: 0.85;
      transform: scale(0.95);
    }
    50% {
      opacity: 1;
      transform: scale(1.08);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .crown-diadem,
    .crown-jewel-pulse {
      animation: none !important;
    }
  }
</style>
