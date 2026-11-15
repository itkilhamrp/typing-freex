<script lang="ts">
  import { getTierMeta } from "@/core/achievements/tier-system";

  let {
    fillColor = "currentColor",
    accentColor = "#ffffff",
    gradientId = "medal-grad",
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
  class="medal-svg rank-{rank} {isUnlocked
    ? 'is-unlocked'
    : 'is-locked'} {className}"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="{gradientId}-body" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="28%" stop-color={accentColor} />
      <stop offset="100%" stop-color={fillColor} />
    </linearGradient>
    <linearGradient id="{gradientId}-rim" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color={accentColor} />
      <stop offset="50%" stop-color={fillColor} />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="{gradientId}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="25%" stop-color="#fef08a" />
      <stop offset="65%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#92400e" />
    </linearGradient>
    <linearGradient
      id="{gradientId}-core-dark"
      x1="0%"
      y1="0%"
      x2="0%"
      y2="100%"
    >
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
  </defs>

  <!-- ================= RIBBON / SASH SUSPENSION ================= -->
  <g class="medal-ribbon">
    {#if rank === "locked" || rank === "bronze"}
      <polygon
        points="13,2 22,2 24,15 17,15"
        fill={isUnlocked ? fillColor : "#475569"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="0.6"
      />
      <polygon
        points="35,2 26,2 24,15 31,15"
        fill={isUnlocked ? `url(#${gradientId}-body)` : "#64748b"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="0.6"
      />
      <rect
        x="16"
        y="13.5"
        width="16"
        height="3.2"
        rx="1.2"
        fill={isUnlocked ? accentColor : "#94a3b8"}
        stroke="#0f172a"
        stroke-width="0.6"
      />
    {:else if rank === "silver"}
      <polygon
        points="11,2 21,2 24,15 15,16"
        fill={fillColor}
        stroke="#ffffff"
        stroke-width="0.6"
      />
      <polygon
        points="37,2 27,2 24,15 33,16"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="0.6"
      />
      <polygon points="19,2 29,2 26,15 22,15" fill="#ffffff" opacity="0.55" />
      <rect
        x="15"
        y="14"
        width="18"
        height="3"
        rx="1"
        fill="#e2e8f0"
        stroke={fillColor}
        stroke-width="0.8"
      />
    {:else if rank === "gold"}
      <polygon
        points="10,2 21,2 24,16 14,16"
        fill="#78350f"
        stroke="url(#{gradientId}-gold)"
        stroke-width="0.8"
      />
      <polygon
        points="38,2 27,2 24,16 34,16"
        fill="#92400e"
        stroke="url(#{gradientId}-gold)"
        stroke-width="0.8"
      />
      <polygon points="20,2 28,2 26,15 22,15" fill="url(#{gradientId}-gold)" />
      <rect
        x="14"
        y="14"
        width="20"
        height="3.5"
        rx="1.2"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="0.8"
      />
      <circle cx="24" cy="15.8" r="1.3" fill="#ffffff" />
    {:else if rank === "platinum"}
      <polygon
        points="9,2 20,2 24,15 14,17"
        fill="#0369a1"
        stroke={accentColor}
        stroke-width="0.8"
      />
      <polygon
        points="39,2 28,2 24,15 34,17"
        fill={fillColor}
        stroke={accentColor}
        stroke-width="0.8"
      />
      <polygon
        points="16,13.5 32,13.5 29,18 19,18"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
    {:else if rank === "diamond"}
      <polygon
        points="8,2 20,2 24,15 13,17"
        fill="#0e7490"
        stroke={accentColor}
        stroke-width="0.9"
      />
      <polygon
        points="40,2 28,2 24,15 35,17"
        fill="#0891b2"
        stroke={accentColor}
        stroke-width="0.9"
      />
      <polygon
        points="24,11 29,15 24,19 19,15"
        fill="#ffffff"
        stroke="#06b6d4"
        stroke-width="0.9"
      />
      <polygon points="24,13 26.5,15 24,17 21.5,15" fill="#22d3ee" />
    {:else if rank === "heroic"}
      <path
        d="M8 2 L20 2 L24 16 L13 17 Q10 10 8 2 Z"
        fill="#7c2d12"
        stroke="#f97316"
        stroke-width="0.9"
      />
      <path
        d="M40 2 L28 2 L24 16 L35 17 Q38 10 40 2 Z"
        fill="#9a3412"
        stroke="#f97316"
        stroke-width="0.9"
      />
      <polygon
        points="16,13 32,13 29,18 24,20 19,18"
        fill="url(#{gradientId}-body)"
        stroke="#fef08a"
        stroke-width="0.8"
      />
    {:else if rank === "eliteHeroic"}
      <polygon
        points="7,2 20,2 24,16 12,17"
        fill="#064e3b"
        stroke="#34d399"
        stroke-width="1"
      />
      <polygon
        points="41,2 28,2 24,16 36,17"
        fill="#047857"
        stroke="#34d399"
        stroke-width="1"
      />
      <polygon
        points="15,13 33,13 30,18 18,18"
        fill="#10b981"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <circle cx="24" cy="15.5" r="1.5" fill="#ffffff" />
    {:else if rank === "master"}
      <polygon
        points="6,2 20,2 24,16 12,17"
        fill="#4c1d95"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1"
      />
      <polygon
        points="42,2 28,2 24,16 36,17"
        fill="#581c87"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1"
      />
      <polygon
        points="15,12.5 33,12.5 30,18.5 24,20.5 18,18.5"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
    {:else if rank === "eliteMaster"}
      <polygon
        points="5,2 19,2 24,16 11,18"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.1"
      />
      <polygon
        points="43,2 29,2 24,16 37,18"
        fill="#7f1d1d"
        stroke="#ef4444"
        stroke-width="1.1"
      />
      <polygon
        points="14,12.5 34,12.5 31,18.5 24,21 17,18.5"
        fill="#dc2626"
        stroke="#fecaca"
        stroke-width="0.9"
      />
    {:else}
      <!-- Grandmaster Solar Wing Clasp -->
      <polygon
        points="4,2 19,2 24,16 10,18"
        fill="#701a75"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.2"
      />
      <polygon
        points="44,2 29,2 24,16 38,18"
        fill="#86198f"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.2"
      />
      <polygon
        points="13,12 35,12 32,18.5 24,21.5 16,18.5"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1"
      />
      <circle cx="24" cy="16" r="2.2" fill="#ffffff" />
    {/if}
  </g>

  <!-- ================= MEDALLION BODY & KEYSTROKE CORE (Center y=28) ================= -->
  <g class="medal-disc">
    {#if rank === "locked" || rank === "bronze"}
      <!-- Bronze: Chiseled 8-Facet Valor Medallion with Keycap Center -->
      <circle
        cx="24"
        cy="28"
        r="13.5"
        fill={isUnlocked ? `url(#${gradientId}-rim)` : "#475569"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.5"
      />
      <circle
        cx="24"
        cy="28"
        r="10.2"
        fill="url(#{gradientId}-core-dark)"
        stroke={isUnlocked ? fillColor : "#64748b"}
        stroke-width="1"
      />
      <!-- Sculpted Keycap + Star inside Medallion -->
      <rect
        x="18.2"
        y="22.2"
        width="11.6"
        height="11.6"
        rx="2.6"
        fill={isUnlocked ? `url(#${gradientId}-body)` : "#64748b"}
        stroke={isUnlocked ? accentColor : "#cbd5e1"}
        stroke-width="0.9"
      />
      <polygon
        points="24,24 25.4,26.8 28.5,27.2 26.2,29.3 26.8,32.3 24,30.8 21.2,32.3 21.8,29.3 19.5,27.2 22.6,26.8"
        fill={isUnlocked ? "#ffffff" : "#cbd5e1"}
      />
    {:else if rank === "silver"}
      <!-- Silver: Precision Machined Gear-Bezel Medallion -->
      <rect
        x="11.5"
        y="15.5"
        width="25"
        height="25"
        rx="4"
        transform="rotate(22.5 24 28)"
        fill={fillColor}
        stroke="#ffffff"
        stroke-width="1"
      />
      <circle
        cx="24"
        cy="28"
        r="13"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.4"
      />
      <circle
        cx="24"
        cy="28"
        r="9.5"
        fill="url(#{gradientId}-core-dark)"
        stroke={accentColor}
        stroke-width="1"
      />
      <!-- Compass Key-Star -->
      <polygon
        points="24,19.5 26.2,25.8 32.5,28 26.2,30.2 24,36.5 21.8,30.2 15.5,28 21.8,25.8"
        fill="#ffffff"
      />
      <circle cx="24" cy="28" r="2.2" fill={fillColor} />
    {:else if rank === "gold"}
      <!-- Gold: Royal Sunburst Medallion with Keycap Crown -->
      <polygon
        points="24,12.5 27.5,15.5 32,14 33.5,18.5 38,19.5 37,24 40,28 37,32 38,36.5 33.5,37.5 32,42 27.5,40.5 24,43.5 20.5,40.5 16,42 14.5,37.5 10,36.5 11,32 8,28 11,24 10,19.5 14.5,18.5 16,14 20.5,15.5"
        fill="#78350f"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1"
      />
      <circle
        cx="24"
        cy="28"
        r="12.5"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <circle
        cx="24"
        cy="28"
        r="9.5"
        fill="#451a03"
        stroke="#fef08a"
        stroke-width="1"
        stroke-dasharray="2.5 1.5"
      />
      <!-- Golden Keycap & Star -->
      <rect
        x="18.5"
        y="22.5"
        width="11"
        height="11"
        rx="2.5"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.9"
      />
      <polygon
        points="24,23.8 25.5,26.8 28.8,27.2 26.3,29.4 27,32.6 24,31 21,32.6 21.7,29.4 19.2,27.2 22.5,26.8"
        fill="#ffffff"
      />
    {:else if rank === "platinum"}
      <!-- Platinum: 8-Point Cryo-Cross Medallion -->
      <polygon
        points="24,12 28,20 37,17 33,25 40,28 33,31 37,39 28,36 24,44 20,36 11,39 15,31 8,28 15,25 11,17 20,20"
        fill="#0369a1"
        stroke={accentColor}
        stroke-width="1.1"
      />
      <circle
        cx="24"
        cy="28"
        r="11.8"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.4"
      />
      <polygon
        points="24,18 32,23 32,33 24,38 16,33 16,23"
        fill="url(#{gradientId}-core-dark)"
        stroke={accentColor}
        stroke-width="1"
      />
      <polygon
        points="24,20 26.5,25.5 32,28 26.5,30.5 24,36 21.5,30.5 16,28 21.5,25.5"
        fill="#ffffff"
      />
      <circle cx="24" cy="28" r="2.2" fill="#38bdf8" />
    {:else if rank === "diamond"}
      <!-- Diamond: Brilliant Octagonal Prism Medallion -->
      <polygon
        points="17,14 31,14 38,21 38,35 31,42 17,42 10,35 10,21"
        fill="#0891b2"
        stroke="#ffffff"
        stroke-width="1.5"
      />
      <polygon
        points="18.5,16.5 29.5,16.5 35.5,22.5 35.5,33.5 29.5,39.5 18.5,39.5 12.5,33.5 12.5,22.5"
        fill="url(#{gradientId}-body)"
        stroke={accentColor}
        stroke-width="1"
      />
      <!-- Facet Lines -->
      <line
        x1="17"
        y1="14"
        x2="31"
        y2="42"
        stroke="#ffffff"
        stroke-width="0.7"
        opacity="0.65"
      />
      <line
        x1="31"
        y1="14"
        x2="17"
        y2="42"
        stroke="#ffffff"
        stroke-width="0.7"
        opacity="0.65"
      />
      <polygon
        points="24,19.5 31.5,28 24,36.5 16.5,28"
        fill="#083344"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <polygon points="24,22 29,28 24,34 19,28" fill="#ffffff" />
      <circle cx="24" cy="28" r="2" fill="#06b6d4" />
    {:else if rank === "heroic"}
      <!-- Heroic: Blazing Phoenix Sun-Wheel Medallion -->
      <polygon
        points="24,11 27.5,17 34,13.5 33.5,20.5 40,21 36,26.5 41,31 35,34 36.5,40.5 30,39 27.5,44.5 24,39.5 20.5,44.5 18,39 11.5,40.5 13,34 7,31 12,26.5 8,21 14.5,20.5 14,13.5 20.5,17"
        fill="#ea580c"
        stroke="#fef08a"
        stroke-width="1"
      />
      <circle
        cx="24"
        cy="28"
        r="11.5"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.4"
      />
      <circle
        cx="24"
        cy="28"
        r="8.5"
        fill="#431407"
        stroke="#f97316"
        stroke-width="1"
      />
      <path
        d="M24 20.5 C28 24.5 28.5 29 24 34 C19.5 29 20 24.5 24 20.5 Z"
        fill="#fef08a"
      />
      <path
        d="M24 23.5 C26.2 26 26.5 28.5 24 31.5 C21.5 28.5 21.8 26 24 23.5 Z"
        fill="#ffffff"
      />
    {:else if rank === "eliteHeroic"}
      <!-- Elite Heroic: Overclocked Cyber Hex-Core Medallion -->
      <polygon
        points="24,12 38,20 38,36 24,44 10,36 10,20"
        fill="#064e3b"
        stroke="#34d399"
        stroke-width="1.8"
      />
      <polygon
        points="24,15 35,21.5 35,34.5 24,41 13,34.5 13,21.5"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1"
      />
      <polygon
        points="24,19 31.5,23.5 31.5,32.5 24,37 16.5,32.5 16.5,23.5"
        fill="#022c22"
        stroke="#6ee7b7"
        stroke-width="1"
      />
      <!-- WPM Lightning Keystroke Icon -->
      <polygon
        points="25.5,20.5 20,28.5 24,28.5 22.5,35.5 28,27.5 24,27.5"
        fill="#ffffff"
      />
    {:else if rank === "master"}
      <!-- Master: Imperial Royal Order Medallion with Golden Filigree -->
      <polygon
        points="24,11 28,16 35,14 34,21 40,24 36,29 39,36 32,37 30,43 24,39 18,43 16,37 9,36 12,29 8,24 14,21 13,14 20,16"
        fill="url(#{gradientId}-gold)"
        stroke="#4c1d95"
        stroke-width="1"
      />
      <circle
        cx="24"
        cy="28"
        r="12"
        fill="#3b0764"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.8"
      />
      <circle
        cx="24"
        cy="28"
        r="9"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1"
      />
      <!-- Royal Crown Emblem -->
      <path
        d="M18 32 L17 24 L21 27 L24 21.5 L27 27 L31 24 L30 32 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <circle cx="24" cy="20.5" r="1.3" fill="#ffffff" />
    {:else if rank === "eliteMaster"}
      <!-- Elite Master: Draconic War-Cross Medallion -->
      <polygon
        points="24,10 28,17 37,13 34,22 42,25 35,30 40,38 31,37 29,45 24,39 19,45 17,37 8,38 13,30 6,25 14,22 11,13 20,17"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.3"
      />
      <circle
        cx="24"
        cy="28"
        r="11.5"
        fill="url(#{gradientId}-body)"
        stroke="#fecaca"
        stroke-width="1.5"
      />
      <polygon
        points="24,18.5 32,28 24,37.5 16,28"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.2"
      />
      <polygon points="24,21.5 27,28 24,34.5 21,28" fill="#fef08a" />
      <polygon points="24,23.5 25.2,28 24,32.5 22.8,28" fill="#ffffff" />
    {:else}
      <!-- Grandmaster: Supreme Celestial Astral Order Medallion -->
      <g class="medal-sunburst-spin">
        {#each Array(12) as _, i (i)}
          <polygon
            points="24,10.5 26,16 22,16"
            transform="rotate({i * 30} 24 28)"
            fill="url(#{gradientId}-gold)"
          />
        {/each}
      </g>
      <circle
        cx="24"
        cy="28"
        r="13"
        fill="#701a75"
        stroke="#ffffff"
        stroke-width="1.6"
      />
      <circle
        cx="24"
        cy="28"
        r="10.2"
        fill="url(#{gradientId}-gold)"
        stroke="#fef08a"
        stroke-width="1"
      />
      <circle
        cx="24"
        cy="28"
        r="7.4"
        fill="#4a044e"
        stroke="#ffffff"
        stroke-width="0.9"
      />
      <polygon
        points="24,19.5 26,25.5 32,28 26,30.5 24,36.5 22,30.5 16,28 22,25.5"
        fill="#ffffff"
      />
      <circle cx="24" cy="28" r="2.3" fill="#fef08a" />
    {/if}
  </g>
</svg>

<style>
  .medal-svg.is-unlocked .medal-disc {
    transform-origin: 24px 16px;
    animation: medal-sway 3.8s ease-in-out infinite;
  }

  .medal-sunburst-spin {
    transform-origin: 24px 28px;
    animation: medal-spin 18s linear infinite;
  }

  @keyframes medal-sway {
    0%,
    100% {
      transform: rotate(-1.5deg);
    }
    50% {
      transform: rotate(1.5deg);
    }
  }

  @keyframes medal-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .medal-disc,
    .medal-sunburst-spin {
      animation: none !important;
    }
  }
</style>
