<script lang="ts">
  import type { AdvancementRank } from "@/core/achievements/advancement-rank";
  let {
    rank = "common",
    fillColor = "#64748b",
    accentColor = "#94a3b8",
    gradientId = "adv-frame",
    isUnlocked = true,
    class: className = "",
  }: {
    rank?: AdvancementRank;
    fillColor?: string;
    accentColor?: string;
    gradientId?: string;
    isUnlocked?: boolean;
    class?: string;
  } = $props();
</script>

{#if isUnlocked && rank !== "common" && rank !== "locked"}
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="adv-rank-frame rank-frame-{rank} absolute inset-0 w-full h-full pointer-events-none overflow-visible {className}"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="{gradientId}-b" x1="0%" y1="0%" x2="100%" y2="100%"
        ><stop offset="0%" stop-color="#fff" stop-opacity="0.92" /><stop
          offset="45%"
          stop-color={accentColor}
        /><stop offset="100%" stop-color={fillColor} /></linearGradient
      >
      <linearGradient id="{gradientId}-s" x1="0%" y1="0%" x2="0%" y2="100%"
        ><stop offset="0%" stop-color="#f8fafc" /><stop
          offset="55%"
          stop-color="#cbd5e1"
        /><stop offset="100%" stop-color="#475569" /></linearGradient
      >
      <linearGradient id="{gradientId}-d" x1="0%" y1="0%" x2="0%" y2="100%"
        ><stop offset="0%" stop-color="#1e293b" /><stop
          offset="100%"
          stop-color="#020617"
        /></linearGradient
      >
      <linearGradient id="{gradientId}-f" x1="0%" y1="100%" x2="0%" y2="0%"
        ><stop offset="0%" stop-color="#ea580c" /><stop
          offset="55%"
          stop-color="#facc15"
        /><stop offset="100%" stop-color="#fff" /></linearGradient
      >
    </defs>
    {#if rank === "uncommon"}
      <path
        d="M4 12V5.5L6.5 4H12M44 12V5.5L41.5 4H36M4 36V42.5L6.5 44H12M44 36V42.5L41.5 44H36"
        stroke={accentColor}
        stroke-width="1.2"
        opacity="0.88"
      />
      <circle cx="2" cy="24" r="1.2" fill={accentColor} /><circle
        cx="46"
        cy="24"
        r="1.2"
        fill={accentColor}
      />
      <circle cx="24" cy="2" r="1.2" fill={accentColor} /><circle
        cx="24"
        cy="46"
        r="1.2"
        fill={accentColor}
      />
    {:else if rank === "rare"}
      <path
        d="M15 2.5L18.5 5.5H29.5L33 2.5"
        stroke="url(#{gradientId}-b)"
        stroke-width="1.3"
      />
      <path
        d="M4.5 12L1.5 16.5V31.5L4.5 36M43.5 12L46.5 16.5V31.5L43.5 36"
        stroke={accentColor}
        stroke-width="1.35"
      />
      <circle
        cx="4.5"
        cy="12"
        r="1.4"
        fill="url(#{gradientId}-s)"
        stroke="#020617"
        stroke-width="0.7"
      /><circle
        cx="4.5"
        cy="36"
        r="1.4"
        fill="url(#{gradientId}-s)"
        stroke="#020617"
        stroke-width="0.7"
      />
      <circle
        cx="43.5"
        cy="12"
        r="1.4"
        fill="url(#{gradientId}-s)"
        stroke="#020617"
        stroke-width="0.7"
      /><circle
        cx="43.5"
        cy="36"
        r="1.4"
        fill="url(#{gradientId}-s)"
        stroke="#020617"
        stroke-width="0.7"
      />
      <polygon
        points="15,41 33,41 35,46.5 13,46.5"
        fill="url(#{gradientId}-d)"
        stroke={accentColor}
        stroke-width="1.1"
      />
      <path
        d="M20.5,42.6L23,43.8L20.5,45M24.5,45H28"
        stroke="#fff"
        stroke-width="1.2"
      />
    {:else if rank === "epic"}
      <g class="frame-claw-pulse">
        <path
          d="M4.5 34L1 26L3.5 17.5L8 13M43.5 34L47 26L44.5 17.5L40 13"
          stroke="url(#{gradientId}-s)"
          stroke-width="2.1"
        />
        <circle
          cx="1"
          cy="26"
          r="1.45"
          fill="#f8fafc"
          stroke="#020617"
          stroke-width="0.75"
        /><circle
          cx="3.5"
          cy="17.5"
          r="1.35"
          fill="#f8fafc"
          stroke="#020617"
          stroke-width="0.75"
        />
        <circle
          cx="47"
          cy="26"
          r="1.45"
          fill="#f8fafc"
          stroke="#020617"
          stroke-width="0.75"
        /><circle
          cx="44.5"
          cy="17.5"
          r="1.35"
          fill="#f8fafc"
          stroke="#020617"
          stroke-width="0.75"
        />
        <path d="M8,13L11,10.5L6.5,11ZM40,13L37,10.5L41.5,11Z" fill="#fff" />
      </g>
      <path
        d="M40,1.5L46,5.5L46.5,1ZM1.5,42.5L7,46.5L1,47Z"
        fill="url(#{gradientId}-b)"
        stroke="#fff"
        stroke-width="0.5"
        class="frame-debris-float"
      />
    {:else if rank === "legendary"}
      <path
        d="M7.5 17L0.5 12V4L5.5 9L10 12.5ZM40.5 17L47.5 12V4L42.5 9L38 12.5Z"
        fill="url(#{gradientId}-b)"
        stroke="#fff"
        stroke-width="0.85"
      />
      <g class="frame-claw-pulse">
        <path
          d="M5.5 34L1 26L3.5 18L8.5 14M42.5 34L47 26L44.5 18L39.5 14"
          stroke="url(#{gradientId}-s)"
          stroke-width="2.1"
        />
        <circle
          cx="1"
          cy="26"
          r="1.5"
          fill="#f8fafc"
          stroke="#020617"
          stroke-width="0.8"
        /><circle
          cx="3.5"
          cy="18"
          r="1.4"
          fill="#f8fafc"
          stroke="#020617"
          stroke-width="0.8"
        />
        <circle
          cx="47"
          cy="26"
          r="1.5"
          fill="#f8fafc"
          stroke="#020617"
          stroke-width="0.8"
        /><circle
          cx="44.5"
          cy="18"
          r="1.4"
          fill="#f8fafc"
          stroke="#020617"
          stroke-width="0.8"
        />
      </g>
      <path
        d="M4.5,35L9.5,33L11.5,38L6.5,40ZM43.5,35L38.5,33L36.5,38L41.5,40Z"
        fill="url(#{gradientId}-b)"
        stroke="#020617"
        stroke-width="0.7"
      />
      <path
        d="M12 46.5L16.5 40.5L21 43L24 40L27 43L31.5 40.5L36 46.5L24 44.8Z"
        fill="url(#{gradientId}-d)"
        stroke="url(#{gradientId}-b)"
        stroke-width="1.25"
      />
    {:else if rank === "mythic"}
      <path
        d="M8.5 16.5L0 11V2L6 7.5L11.5 11.5ZM39.5 16.5L48 11V2L42 7.5L36.5 11.5Z"
        fill="url(#{gradientId}-b)"
        stroke="#fff"
        stroke-width="0.95"
      />
      <path
        d="M1,24L6,23L7,28L1.8,29.5ZM47,24L42,23L41,28L46.2,29.5ZM3.8,33.5L9,31.5L11.2,36.5L6,39ZM44.2,33.5L39,31.5L36.8,36.5L42,39Z"
        fill="url(#{gradientId}-b)"
        stroke="#fff"
        stroke-width="0.65"
      />
      <g class="frame-claw-pulse">
        <path
          d="M5 38L0.8 29L2.2 18L8 13M43 38L47.2 29L45.8 18L40 13"
          stroke="url(#{gradientId}-s)"
          stroke-width="2.2"
        />
        <circle
          cx="0.8"
          cy="29"
          r="1.5"
          fill="#fff"
          stroke="#020617"
          stroke-width="0.8"
        /><circle
          cx="2.2"
          cy="18"
          r="1.4"
          fill="#fff"
          stroke="#020617"
          stroke-width="0.8"
        />
        <circle
          cx="47.2"
          cy="29"
          r="1.5"
          fill="#fff"
          stroke="#020617"
          stroke-width="0.8"
        /><circle
          cx="45.8"
          cy="18"
          r="1.4"
          fill="#fff"
          stroke="#020617"
          stroke-width="0.8"
        />
      </g>
      <polygon
        points="16.5,5.5 18.2,0.8 21.4,3.8 24,-1 26.6,3.8 29.8,0.8 31.5,5.5"
        fill="url(#{gradientId}-f)"
        stroke="#020617"
        stroke-width="0.85"
        class="frame-debris-float"
      />
      <path
        d="M10 44.5L15.5 40.2L20.5 43.2L24 39.8L27.5 43.2L32.5 40.2L38 44.5L32.5 47.5L24 45.8L15.5 47.5Z"
        fill="url(#{gradientId}-d)"
        stroke="url(#{gradientId}-b)"
        stroke-width="1.3"
      />
      <polygon points="24,41 26,43.8 24,46.5 22,43.8" fill="#facc15" />
    {/if}
  </svg>
{/if}

<style>
  .frame-claw-pulse {
    transform-origin: 24px 24px;
    animation: adv-claw-grip 3.2s ease-in-out infinite;
  }
  .frame-debris-float {
    transform-origin: 24px 4px;
    animation: adv-debris-levitate 2.8s ease-in-out infinite;
  }
  @keyframes adv-claw-grip {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(0.97);
    }
  }
  @keyframes adv-debris-levitate {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-1.2px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .frame-claw-pulse,
    .frame-debris-float {
      animation: none !important;
    }
  }
</style>
