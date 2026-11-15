<script lang="ts">
  import { getTierMeta } from "@/core/achievements/tier-system";
  let {
    fillColor = "currentColor",
    accentColor = "#fff",
    gradientId = "shield-grad",
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
  const rank = $derived(getTierMeta(tier).name);
</script>

<svg
  viewBox="0 0 48 48"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class="shield-svg rank-{rank} {isUnlocked
    ? 'is-unlocked'
    : 'is-locked'} {className}"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="{gradientId}-b" x1="0%" y1="0%" x2="100%" y2="100%"
      ><stop offset="0%" stop-color="#fff" stop-opacity="0.92" /><stop
        offset="28%"
        stop-color={accentColor}
      /><stop offset="100%" stop-color={fillColor} /></linearGradient
    >
    <linearGradient id="{gradientId}-d" x1="0%" y1="0%" x2="0%" y2="100%"
      ><stop offset="0%" stop-color="#1e293b" /><stop
        offset="100%"
        stop-color="#020617"
      /></linearGradient
    >
    <linearGradient id="{gradientId}-g" x1="0%" y1="0%" x2="100%" y2="100%"
      ><stop offset="0%" stop-color="#fff" /><stop
        offset="28%"
        stop-color="#fef08a"
      /><stop offset="68%" stop-color="#eab308" /><stop
        offset="100%"
        stop-color="#92400e"
      /></linearGradient
    >
  </defs>
  <g class="shield-bastion">
    {#if rank === "locked" || rank === "bronze"}
      <path
        d="M24 3.5L8.5 9V22.5C8.5 33.5 15 40 24 43C33 40 39.5 33.5 39.5 22.5V9L24 3.5Z"
        fill={isUnlocked ? `url(#${gradientId}-b)` : "#64748b"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.5"
      />
      <path
        d="M24 3.5L39.5 9V22.5C39.5 33.5 33 40 24 43V3.5Z"
        fill="#0f172a"
        opacity="0.2"
      />
      <path
        d="M24 7.5L12.5 11.8V22C12.5 30.2 17.5 35.5 24 38C30.5 35.5 35.5 30.2 35.5 22V11.8L24 7.5Z"
        fill="url(#{gradientId}-d)"
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="0.9"
        opacity="0.88"
      />
      <circle
        cx="14.5"
        cy="13.5"
        r="1.1"
        fill={isUnlocked ? accentColor : "#cbd5e1"}
      /><circle
        cx="33.5"
        cy="13.5"
        r="1.1"
        fill={isUnlocked ? accentColor : "#cbd5e1"}
      />
      <rect
        x="18.2"
        y="15.2"
        width="11.6"
        height="11.6"
        rx="2.6"
        fill={isUnlocked ? `url(#${gradientId}-b)` : "#475569"}
        stroke={isUnlocked ? "#fff" : "#cbd5e1"}
        stroke-width="1"
      />
      <path
        d="M20.8,18.8L23.4,21L20.8,23.2M24.4,23.2H27.2"
        stroke="#0f172a"
        stroke-width="1.6"
      />
    {:else if rank === "silver"}
      <path
        d="M5,11L9,8L9,23L5,20ZM43,11L39,8L39,23L43,20Z"
        fill={fillColor}
        stroke="#fff"
        stroke-width="0.8"
      />
      <path
        d="M24 2.5L7.5 8.5V23C7.5 34.5 14.5 41 24 44C33.5 41 40.5 34.5 40.5 23V8.5L24 2.5Z"
        fill="url(#{gradientId}-b)"
        stroke="#fff"
        stroke-width="1.6"
      />
      <path
        d="M24 6.5L11 11.2V22.5C11 31.5 16.5 36.8 24 39.5C31.5 36.8 37 31.5 37 22.5V11.2L24 6.5Z"
        fill="url(#{gradientId}-d)"
        stroke={accentColor}
        stroke-width="1"
      />
      <path
        d="M12.5,17L24,11L35.5,17M14,27L24,33L34,27"
        stroke="url(#{gradientId}-b)"
        stroke-width="2"
        fill="none"
      />
      <polygon
        points="24,14.5 30.5,21 24,27.5 17.5,21"
        fill="#0f172a"
        stroke="#fff"
        stroke-width="1.2"
      />
      <polygon
        points="24,16.8 28.2,21 24,25.2 19.8,21"
        fill="#fff"
        class="shield-core-gleam"
      />
    {:else if rank === "gold"}
      <path
        d="M3,10L8,7L8,24L3,20ZM45,10L40,7L40,24L45,20Z"
        fill="url(#{gradientId}-g)"
        stroke="#78350f"
        stroke-width="0.8"
      />
      <path
        d="M24 1.5L6.5 7.8V23C6.5 35 14 41.8 24 44.8C34 41.8 41.5 35 41.5 23V7.8L24 1.5Z"
        fill="url(#{gradientId}-g)"
        stroke="#fff"
        stroke-width="1.6"
      />
      <path
        d="M24 6L10.5 11V22.5C10.5 31.8 16.2 37.4 24 40.2C31.8 37.4 37.5 31.8 37.5 22.5V11L24 6Z"
        fill="#7f1d1d"
        stroke="#fef08a"
        stroke-width="1.1"
      />
      <path
        d="M12,14L24,8.5L36,14M13.5,29L24,35.5L34.5,29"
        stroke="#fde047"
        stroke-width="1.1"
        opacity="0.65"
        fill="none"
      />
      <rect
        x="17.5"
        y="14.5"
        width="13"
        height="13"
        rx="3"
        fill="url(#{gradientId}-g)"
        stroke="#fff"
        stroke-width="1.1"
      />
      <polygon
        points="24,16.2 25.5,19.4 29,19.9 26.4,22.2 27.1,25.6 24,23.9 20.9,25.6 21.6,22.2 19,19.9 22.5,19.4"
        fill="#fff"
        class="shield-core-gleam"
      />
    {:else if rank === "platinum"}
      <path
        d="M2,11L7,6L8,25L3,21ZM46,11L41,6L40,25L45,21Z"
        fill="url(#{gradientId}-b)"
        stroke="#fff"
        stroke-width="0.8"
      />
      <polygon
        points="24,1 6,7.5 8,26.5 24,45 40,26.5 42,7.5"
        fill="url(#{gradientId}-b)"
        stroke="#fff"
        stroke-width="1.6"
      />
      <polygon
        points="24,5.5 10.5,10.5 12,25 24,39.5 36,25 37.5,10.5"
        fill="url(#{gradientId}-d)"
        stroke={accentColor}
        stroke-width="1.1"
      />
      <polyline
        points="13,16 24,24 35,16"
        stroke={accentColor}
        stroke-width="1.8"
      />
      <polyline points="15,22 24,29 33,22" stroke="#fff" stroke-width="1.4" />
      <polygon
        points="24,10 28.5,18.5 24,27 19.5,18.5"
        fill="#fff"
        stroke="#0284c7"
        stroke-width="1"
        class="shield-core-gleam"
      />
      <circle cx="24" cy="18.5" r="2" fill="#38bdf8" />
    {:else if rank === "diamond"}
      <path
        d="M1.5,13L6,7L7.5,23L2.5,20ZM46.5,13L42,7L40.5,23L45.5,20Z"
        fill="#22d3ee"
        stroke="#fff"
        stroke-width="0.9"
      />
      <polygon
        points="24,0.8 5.5,7.5 7.5,26.5 24,45.5 40.5,26.5 42.5,7.5"
        fill="#0891b2"
        stroke="#fff"
        stroke-width="1.8"
      />
      <polygon
        points="24,0.8 42.5,7.5 35.5,13 24,6"
        fill="#cffafe"
        opacity="0.75"
      />
      <polygon
        points="24,0.8 5.5,7.5 12.5,13 24,6"
        fill="#67e8f9"
        opacity="0.75"
      />
      <polygon
        points="24,6 35.5,13 34,25 24,38.5 14,25 12.5,13"
        fill="url(#{gradientId}-b)"
        stroke="#fff"
        stroke-width="1.1"
      />
      <polygon
        points="24,11 31.5,20.5 24,30 16.5,20.5"
        fill="#083344"
        stroke="#fff"
        stroke-width="1.3"
      />
      <polygon
        points="24,13.8 29,20.5 24,27.2 19,20.5"
        fill="#fff"
        class="shield-core-gleam"
      />
      <polygon
        points="24.6,16.5 22,20.8 24,20.8 23.4,24.5 26,20.2 24,20.2"
        fill="#06b6d4"
      />
    {:else if rank === "heroic"}
      <path
        d="M5 26C0 21 0 12 5 5C6 11 8 15 10 18ZM43 26C48 21 48 12 43 5C42 11 40 15 38 18Z"
        fill="#ea580c"
        stroke="#fef08a"
        stroke-width="0.8"
      />
      <path
        d="M24 1L5.5 7.5L7.5 26C9.5 35.5 15.5 41.8 24 45.5C32.5 41.8 38.5 35.5 40.5 26L42.5 7.5L24 1Z"
        fill="url(#{gradientId}-b)"
        stroke="#fed7aa"
        stroke-width="1.8"
      />
      <polygon
        points="24,5.5 10,10.5 11.5,24.5 24,39.5 36.5,24.5 38,10.5"
        fill="#431407"
        stroke="#f97316"
        stroke-width="1.2"
      />
      <path
        d="M24 9.5C30 15 31 23 24 32C17 23 18 15 24 9.5Z"
        fill="#ea580c"
        stroke="#fef08a"
        stroke-width="1"
      />
      <path
        d="M24 13C27.5 17 28 22 24 28C20 22 20.5 17 24 13Z"
        fill="#fef08a"
        class="shield-core-gleam"
      />
      <circle cx="24" cy="21.5" r="2.3" fill="#fff" />
    {:else if rank === "eliteHeroic"}
      <path
        d="M1,14L6,7L7.5,24L2,21ZM47,14L42,7L40.5,24L46,21Z"
        fill="#10b981"
        stroke="#a7f3d0"
        stroke-width="0.9"
      />
      <polygon
        points="24,0.5 5,7 7,26.5 24,46 41,26.5 43,7"
        fill="#064e3b"
        stroke="#6ee7b7"
        stroke-width="1.9"
      />
      <polygon
        points="24,4.5 9,10 10.8,25 24,40.5 37.2,25 39,10"
        fill="url(#{gradientId}-b)"
        stroke="#fff"
        stroke-width="1.1"
      />
      <polygon
        points="24,9 13,13.5 14.2,23.5 24,35 33.8,23.5 35,13.5"
        fill="#022c22"
        stroke="#34d399"
        stroke-width="1"
      />
      <polyline
        points="14.5,20.5 19,20.5 21.2,14.5 24,26.5 26.8,17.5 29,20.5 33.5,20.5"
        stroke="#fff"
        stroke-width="1.7"
        class="shield-core-gleam"
      />
    {:else if rank === "master"}
      <path
        d="M5 8C-1 15 -1 27 8 36L11 28C4 21 4 14 10 10ZM43 8C49 15 49 27 40 36L37 28C44 21 44 14 38 10Z"
        fill="url(#{gradientId}-g)"
        stroke="#fff"
        stroke-width="0.7"
      />
      <path
        d="M24 0.8L5.5 7V23.5C5.5 36 13.5 42.8 24 46C34.5 42.8 42.5 36 42.5 23.5V7L24 0.8Z"
        fill="url(#{gradientId}-b)"
        stroke="url(#{gradientId}-g)"
        stroke-width="2"
      />
      <path
        d="M24 5.5L10 10.5V22.5C10 32 16 37.8 24 40.5C32 37.8 38 32 38 22.5V10.5L24 5.5Z"
        fill="#3b0764"
        stroke="#fef08a"
        stroke-width="1.2"
      />
      <path
        d="M16.5 24.5L15 15.5L19.8 19L24 12.5L28.2 19L33 15.5L31.5 24.5Z"
        fill="url(#{gradientId}-g)"
        stroke="#fff"
        stroke-width="0.9"
        class="shield-core-gleam"
      />
      <circle cx="24" cy="11" r="1.4" fill="#fff" />
      <polygon points="24,26.5 27,29.5 24,32.5 21,29.5" fill="#fef08a" />
    {:else if rank === "eliteMaster"}
      <path
        d="M4,8L-1,18L6,22L0,32L10,30L7,20ZM44,8L49,18L42,22L48,32L38,30L41,20Z"
        fill="#dc2626"
        stroke="#fca5a5"
        stroke-width="0.8"
      />
      <polygon
        points="24,0 4.5,6.8 6.5,26.5 24,46.5 41.5,26.5 43.5,6.8"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="2"
      />
      <polygon
        points="24,4.5 8.5,10 10.5,25.5 24,41 37.5,25.5 39.5,10"
        fill="url(#{gradientId}-b)"
        stroke="#fecaca"
        stroke-width="1.2"
      />
      <polygon
        points="24,9.5 32.5,21 24,32.5 15.5,21"
        fill="#1c0404"
        stroke="#ef4444"
        stroke-width="1.3"
      />
      <polygon
        points="24,12.5 28.5,21 24,29.5 19.5,21"
        fill="#fef08a"
        class="shield-core-gleam"
      />
      <polygon points="24,15 26,21 24,27 22,21" fill="#fff" />
    {:else}
      <circle
        cx="24"
        cy="21"
        r="19"
        stroke="url(#{gradientId}-g)"
        stroke-width="1.1"
        stroke-dasharray="3 2"
        opacity="0.8"
        class="shield-halo-spin"
      />
      <path
        d="M5 6C-3 15 -3 28 8 38L11 30C3 22 3 13 10 9ZM43 6C51 15 51 28 40 38L37 30C45 22 45 13 38 9Z"
        fill="url(#{gradientId}-g)"
        stroke="#fff"
        stroke-width="0.9"
      />
      <path
        d="M24 0L4.5 6.2V23.5C4.5 36.5 13 43.5 24 46.8C35 43.5 43.5 36.5 43.5 23.5V6.2L24 0Z"
        fill="url(#{gradientId}-g)"
        stroke="#fff"
        stroke-width="2.2"
      />
      <path
        d="M24 4.8L9 9.8V22.5C9 32.5 15.2 38.5 24 41.2C32.8 38.5 39 32.5 39 22.5V9.8L24 4.8Z"
        fill="#701a75"
        stroke="#fef08a"
        stroke-width="1.3"
      />
      <rect
        x="17.2"
        y="13.8"
        width="13.6"
        height="13.6"
        rx="3.2"
        fill="url(#{gradientId}-g)"
        stroke="#fff"
        stroke-width="1.1"
      />
      <polygon
        points="24,11 26.5,18.2 33.8,20.6 26.5,23 24,30.2 21.5,23 14.2,20.6 21.5,18.2"
        fill="#fff"
        class="shield-core-gleam"
      />
      <circle
        cx="24"
        cy="20.6"
        r="2.4"
        fill="#e11d48"
        stroke="#fef08a"
        stroke-width="0.8"
      />
    {/if}
  </g>
</svg>

<style>
  .shield-svg.is-unlocked .shield-bastion {
    transform-origin: 24px 23px;
    animation: shield-guard 3.6s ease-in-out infinite;
  }
  .shield-svg.is-unlocked .shield-core-gleam {
    transform-origin: 24px 21px;
    animation: shield-pulse 2.5s ease-in-out infinite;
  }
  .shield-halo-spin {
    transform-origin: 24px 21px;
    animation: shield-spin 20s linear infinite;
  }
  @keyframes shield-guard {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-1.2px);
    }
  }
  @keyframes shield-pulse {
    0%,
    100% {
      opacity: 0.86;
      transform: scale(0.96);
    }
    50% {
      opacity: 1;
      transform: scale(1.06);
    }
  }
  @keyframes shield-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .shield-bastion,
    .shield-core-gleam,
    .shield-halo-spin {
      animation: none !important;
    }
  }
</style>
