<script lang="ts">
  import { getTierMeta } from "@/core/achievements/tier-system";

  let {
    fillColor = "currentColor",
    accentColor = "#ffffff",
    gradientId = "flame-grad",
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
  class="flame-svg rank-{rank} {isUnlocked
    ? 'is-unlocked'
    : 'is-locked'} {className}"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="{gradientId}-body" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color={fillColor} />
      <stop offset="65%" stop-color={accentColor} />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95" />
    </linearGradient>
    <linearGradient id="{gradientId}-core" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color={accentColor} />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>
    <linearGradient id="{gradientId}-gold" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#92400e" />
      <stop offset="40%" stop-color="#eab308" />
      <stop offset="80%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>
    <linearGradient id="{gradientId}-brazier" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
  </defs>

  <g class="flame-plume">
    {#if rank === "locked" || rank === "bronze"}
      <!-- BRONZE: Forged Keycap Brazier Igniter with Twin-Layered WPM Flame -->
      <!-- Keycap Brazier Base -->
      <polygon
        points="14,34 34,34 37,40 11,40"
        fill="url(#{gradientId}-brazier)"
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.2"
        stroke-linejoin="round"
      />
      <!-- Main Flame Plume -->
      <path
        d="M24 3.5 C26.5 10.5 35.5 15 35.5 24.5 C35.5 32 29.8 36.5 23.5 36.5 C16.5 36.5 11.5 31.5 11.5 24 C11.5 16.5 16.5 11.5 19 8.5 C20.5 12 22 13.5 23.5 13.5 C25.5 9.5 26 6.5 24 3.5 Z"
        fill={isUnlocked ? `url(#${gradientId}-body)` : "#64748b"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.4"
        stroke-linejoin="round"
      />
      <!-- Inner Hot Core -->
      <path
        d="M24 14.5 C26 19 30 22 30 27 C30 31.5 26.8 34.5 23.5 34.5 C19.8 34.5 17 31.5 17 27 C17 22.5 20.5 19 24 14.5 Z"
        fill={isUnlocked ? `url(#${gradientId}-core)` : "#94a3b8"}
        opacity={isUnlocked ? "0.88" : "0.4"}
        class="flame-core"
      />
    {:else if rank === "silver"}
      <!-- SILVER: Argentum Twin-Jet Blowtorch Flame with Rising Sparks -->
      <circle cx="8.5" cy="22" r="1.5" fill="#ffffff" class="flame-embers" />
      <circle
        cx="39.5"
        cy="18"
        r="1.4"
        fill={accentColor}
        class="flame-embers"
      />
      <!-- Machined Nozzle Collar -->
      <polygon
        points="13,34 35,34 38,39.5 10,39.5"
        fill="url(#{gradientId}-brazier)"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <!-- Outer Twin-Tongue Silver Flame -->
      <path
        d="M24 2 C27.5 10 38 14.5 38 25 C38 33.5 31.5 38 24 38 C16.5 38 10 33.5 10 25 C10 16 16 10 18.5 5.5 C20.5 10 22 11.8 24 11.8 C26 7.5 26.5 4.5 24 2 Z"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <!-- Inner White-Hot Jet Core -->
      <path
        d="M24 12 C27 17.5 31.5 21.5 31.5 27 C31.5 32 28 35.5 24 35.5 C20 35.5 16.5 32 16.5 27 C16.5 21.5 21 17.5 24 12 Z"
        fill="#ffffff"
        opacity="0.85"
        class="flame-core"
      />
      <polygon points="24,20 26.5,26.5 24,33 21.5,26.5" fill={fillColor} />
    {:else if rank === "gold"}
      <!-- GOLD: Olympian Solar Pyre with Winged Golden Brazier & Star Heart -->
      <!-- Flanking Golden Fire Spirals -->
      <path
        d="M9 31 C4 25 5 16 11 11 C10 18 12 23 16 26 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="0.7"
      />
      <path
        d="M39 31 C44 25 43 16 37 11 C38 18 36 23 32 26 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="0.7"
      />
      <!-- Main Triple-Crown Golden Flame -->
      <path
        d="M24 1 C28 9 39 14.5 39 25.5 C39 34.5 32 39 24 39 C16 39 9 34.5 9 25.5 C9 15 15.5 9 18.5 4.5 C20.5 9 22 11 24 11 C26 6.5 26.5 3.5 24 1 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <path
        d="M24 11 C27.5 17 32 21 32 27.5 C32 33 28.5 36.5 24 36.5 C19.5 36.5 16 33 16 27.5 C16 21 20.5 17 24 11 Z"
        fill="#78350f"
        opacity="0.55"
      />
      <!-- Radiant Solar Star Core -->
      <polygon
        points="24,16 26.2,23 33,25.2 26.2,27.4 24,34.4 21.8,27.4 15,25.2 21.8,23"
        fill="#ffffff"
        class="flame-core"
      />
      <circle cx="24" cy="25.2" r="2.5" fill="#fef08a" />
    {:else if rank === "platinum"}
      <!-- PLATINUM: Cryo-Plasma Frostfire Shard with Geometric Crystalline Blades -->
      <!-- Floating Ice-Fire Embers -->
      <polygon
        points="6,15 8.5,19 6,23 3.5,19"
        fill={accentColor}
        stroke="#ffffff"
        stroke-width="0.6"
        class="flame-embers"
      />
      <polygon
        points="42,15 44.5,19 42,23 39.5,19"
        fill={accentColor}
        stroke="#ffffff"
        stroke-width="0.6"
        class="flame-embers"
      />
      <!-- Crystalline Angular Flame Body -->
      <polygon
        points="24,1 35,13 31.5,21 39.5,24.5 32,39 16,39 8.5,24.5 16.5,21 13,13"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <!-- Inner Faceted Frost Core -->
      <polygon
        points="24,9 31,17.5 28.5,23 33.5,26 28.5,36 19.5,36 14.5,26 19.5,23 17,17.5"
        fill="#0284c7"
        stroke="#e0f2fe"
        stroke-width="1"
      />
      <polygon
        points="24,14 28.5,25.5 24,34.5 19.5,25.5"
        fill="#ffffff"
        class="flame-core"
      />
    {:else if rank === "diamond"}
      <!-- DIAMOND: Prismatic Superheated Refraction Flame with Twin Prism Jets -->
      <!-- Flanking Diamond Jets -->
      <polygon
        points="4,24 9,13 13,22 9,31"
        fill="#22d3ee"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <polygon
        points="44,24 39,13 35,22 39,31"
        fill="#22d3ee"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <!-- Main Prismatic Flame -->
      <polygon
        points="24,0.5 36.5,12.5 32.5,21 41,24.5 33,40 15,40 7,24.5 15.5,21 11.5,12.5"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <!-- Prismatic Facet Lines -->
      <line
        x1="24"
        y1="0.5"
        x2="24"
        y2="40"
        stroke="#ffffff"
        stroke-width="1.1"
        opacity="0.8"
      />
      <polygon
        points="24,8.5 31.5,17.5 28.5,23.5 34,26.5 28.5,37 19.5,37 14,26.5 19.5,23.5 16.5,17.5"
        fill="#cffafe"
        opacity="0.85"
      />
      <!-- Brilliant Diamond Key-Spark Core -->
      <polygon
        points="24,15 29,25.5 24,35 19,25.5"
        fill="#083344"
        stroke="#ffffff"
        stroke-width="1.1"
      />
      <polygon
        points="24,18 26.8,25.5 24,32 21.2,25.5"
        fill="#ffffff"
        class="flame-core"
      />
    {:else if rank === "heroic"}
      <!-- HEROIC: Hellfire Phoenix Inferno with Sweeping Fire-Wings -->
      <!-- Sweeping Fire Wings -->
      <path
        d="M12 35 C3 32 0 22 5 11 C6 18 9 23 15 26 Z"
        fill="#ea580c"
        stroke="#fef08a"
        stroke-width="0.8"
      />
      <path
        d="M36 35 C45 32 48 22 43 11 C42 18 39 23 33 26 Z"
        fill="#ea580c"
        stroke="#fef08a"
        stroke-width="0.8"
      />
      <!-- Main Blazing Inferno Plume -->
      <path
        d="M24 0 C29.5 9.5 40.5 15.5 40.5 26.5 C40.5 36 32.5 40.5 24 40.5 C15.5 40.5 7.5 36 7.5 26.5 C7.5 15.5 15 9 18.5 3.5 C20.5 8.5 22 10.5 24 10.5 C26 5.5 27 2.5 24 0 Z"
        fill="url(#{gradientId}-body)"
        stroke="#fef08a"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <!-- Molten Magma Vortex Core -->
      <path
        d="M24 9.5 C29.5 17.5 31.5 24.5 28.5 33.5 C26 37 22 37 19.5 33.5 C16.5 24.5 18.5 17.5 24 9.5 Z"
        fill="#fef08a"
        class="flame-core"
      />
      <path
        d="M24 15.5 C27.2 21 28 25.5 26 31.5 C24.8 33.5 23.2 33.5 22 31.5 C20 25.5 20.8 21 24 15.5 Z"
        fill="#ffffff"
      />
    {:else if rank === "eliteHeroic"}
      <!-- ELITE HEROIC: Overclocked Cyber-Plasma Thruster with WPM Telemetry Core -->
      <!-- Cyber Plasma Side Fins -->
      <polygon
        points="9,34 1,24 6,11 11,21 15,25"
        fill="#10b981"
        stroke="#a7f3d0"
        stroke-width="0.9"
      />
      <polygon
        points="39,34 47,24 42,11 37,21 33,25"
        fill="#10b981"
        stroke="#a7f3d0"
        stroke-width="0.9"
      />
      <!-- Main Emerald Plasma Plume -->
      <path
        d="M24 0 C29.5 9.5 41 15.5 41 26.5 C41 36.5 32.8 40.5 24 40.5 C15.2 40.5 7 36.5 7 26.5 C7 15 15 8.5 18.5 3 C20.5 8 22 10 24 10 C26 5 27 2 24 0 Z"
        fill="url(#{gradientId}-body)"
        stroke="#a7f3d0"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <!-- Inner Hex Reactor Chamber -->
      <polygon
        points="24,11 32,18 32,30 24,36 16,30 16,18"
        fill="#022c22"
        stroke="#34d399"
        stroke-width="1.2"
      />
      <!-- High-Speed Keystroke Bolt inside Plasma Flame -->
      <polygon
        points="25.5,14 19.5,24.5 24,24.5 22.5,33.5 28.5,23 24,23"
        fill="#ffffff"
        class="flame-core"
      />
    {:else if rank === "master"}
      <!-- MASTER: Imperial Sovereign Phoenix Pyre with Golden Winged Plumes -->
      <!-- Imperial Golden Fire Wings -->
      <path
        d="M10 36 C0 30 -1 18 7 7 C7 16 11 23 16 27 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <path
        d="M38 36 C48 30 49 18 41 7 C41 16 37 23 32 27 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <!-- Royal Amethyst & Gold Flame -->
      <path
        d="M24 0 C30 9 41.5 15 41.5 26.5 C41.5 36.5 33 41 24 41 C15 41 6.5 36.5 6.5 26.5 C6.5 15 14.5 8.5 18.5 3 C20.5 8 22 10 24 10 C26 5 27 2 24 0 Z"
        fill="url(#{gradientId}-body)"
        stroke="url(#{gradientId}-gold)"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- Sovereign Crowned Heart -->
      <path
        d="M17.5 29 L16 19.5 L20.5 23 L24 15.5 L27.5 23 L32 19.5 L30.5 29 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1"
        class="flame-core"
      />
      <circle cx="24" cy="13.5" r="1.5" fill="#ffffff" />
    {:else if rank === "eliteMaster"}
      <!-- ELITE MASTER: Abyssal Dragon-Breath Bloodflame with Serrated Claws -->
      <!-- Serrated Crimson Dragon Claws -->
      <polygon
        points="9,37 0,25 7,21 1,10 11,15 11,24"
        fill="#dc2626"
        stroke="#fca5a5"
        stroke-width="0.8"
      />
      <polygon
        points="39,37 48,25 41,21 47,10 37,15 37,24"
        fill="#dc2626"
        stroke="#fca5a5"
        stroke-width="0.8"
      />
      <!-- Main Abyssal Bloodflame -->
      <path
        d="M24 0 C30.5 9 42 15 42 26.5 C42 36.8 33.2 41 24 41 C14.8 41 6 36.8 6 26.5 C6 15 14.5 8.5 18.5 2.5 C20.5 8 22 10 24 10 C26 5 27.5 2 24 0 Z"
        fill="url(#{gradientId}-body)"
        stroke="#fecaca"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- Dragon Slit-Eye Core -->
      <polygon
        points="24,10 31,24.5 24,36.5 17,24.5"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.3"
      />
      <polygon
        points="24,13.5 28,24.5 24,33 20,24.5"
        fill="#fef08a"
        class="flame-core"
      />
      <polygon points="24,16.5 25.6,24.5 24,30 22.4,24.5" fill="#ffffff" />
    {:else}
      <!-- GRANDMASTER: Supreme Celestial Solar-Nova Flame with Seraphic Fire-Wings -->
      <path
        d="M9 37 C-2 29 -2 15 8 5 C7 16 12 24 17 28 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.9"
      />
      <path
        d="M39 37 C50 29 50 15 40 5 C41 16 36 24 31 28 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.9"
      />
      <path
        d="M24 -0.5 C31 8.5 42.5 15 42.5 26.5 C42.5 37 33.5 41.5 24 41.5 C14.5 41.5 5.5 37 5.5 26.5 C5.5 14.5 14.5 8 18.5 2.5 C20.5 8 22 10 24 10 C26 4.5 27.5 1.5 24 -0.5 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="2.2"
        stroke-linejoin="round"
      />
      <!-- Inner Celestial Sanctuary -->
      <path
        d="M24 10 C29.5 17.5 32 23.5 29.5 33 C26.8 36.8 21.2 36.8 18.5 33 C16 23.5 18.5 17.5 24 10 Z"
        fill="#701a75"
        stroke="#fef08a"
        stroke-width="1.2"
      />
      <!-- 8-Point Supernova Star Heart -->
      <polygon
        points="24,13.5 26.5,21.8 34.5,24.5 26.5,27.2 24,35.5 21.5,27.2 13.5,24.5 21.5,21.8"
        fill="#ffffff"
        class="flame-core"
      />
      <circle
        cx="24"
        cy="24.5"
        r="2.6"
        fill="#e11d48"
        stroke="#fef08a"
        stroke-width="0.8"
      />
    {/if}
  </g>
</svg>

<style>
  .flame-svg.is-unlocked .flame-plume {
    transform-origin: 24px 38px;
    animation: flame-surge 2.8s ease-in-out infinite;
  }

  .flame-svg.is-unlocked .flame-core {
    transform-origin: 24px 26px;
    animation: flame-core-pulse 2s ease-in-out infinite;
  }

  .flame-svg.is-unlocked .flame-embers {
    animation: ember-float 2.4s ease-in-out infinite;
  }

  @keyframes flame-surge {
    0%,
    100% {
      transform: scaleY(1) scaleX(1);
    }
    50% {
      transform: scaleY(1.035) scaleX(0.985);
    }
  }

  @keyframes flame-core-pulse {
    0%,
    100% {
      opacity: 0.85;
      transform: scale(0.95);
    }
    50% {
      opacity: 1;
      transform: scale(1.06);
    }
  }

  @keyframes ember-float {
    0%,
    100% {
      opacity: 0.4;
      transform: translateY(1px);
    }
    50% {
      opacity: 1;
      transform: translateY(-2px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .flame-plume,
    .flame-core,
    .flame-embers {
      animation: none !important;
    }
  }
</style>
