<script lang="ts">
  import {
    getAdvancementRankMeta,
    type AdvancementRank,
  } from "@/core/achievements/advancement-rank";
  let {
    fillColor = "currentColor",
    accentColor = "#fff",
    gradientId = "atom-grad",
    isUnlocked = true,
    tier,
    rank: rankProp,
    class: className = "",
  }: {
    fillColor?: string;
    accentColor?: string;
    gradientId?: string;
    isUnlocked?: boolean;
    tier?: number;
    rank?: AdvancementRank;
    class?: string;
  } = $props();
  const resolvedTier = $derived(
    typeof tier === "number"
      ? tier
      : parseInt(/-(\d+)$/.exec(gradientId)?.[1] ?? "1", 10),
  );
  const rank = $derived<AdvancementRank>(
    !isUnlocked
      ? "locked"
      : (rankProp ?? getAdvancementRankMeta(resolvedTier).name ?? "common"),
  );
</script>

<svg
  viewBox="0 0 48 48"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class="adv-shape-svg atom-svg rank-{rank} {isUnlocked
    ? 'is-unlocked'
    : 'is-locked'} {className}"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="{gradientId}-b" x1="0%" y1="0%" x2="100%" y2="100%"
      ><stop offset="0%" stop-color="#fff" stop-opacity="0.94" /><stop
        offset="32%"
        stop-color={accentColor}
      /><stop offset="100%" stop-color={fillColor} /></linearGradient
    >
    <linearGradient id="{gradientId}-d" x1="0%" y1="0%" x2="0%" y2="100%"
      ><stop offset="0%" stop-color="#1e293b" /><stop
        offset="100%"
        stop-color="#020617"
      /></linearGradient
    >
    <linearGradient id="{gradientId}-s" x1="0%" y1="0%" x2="100%" y2="100%"
      ><stop offset="0%" stop-color="#f8fafc" /><stop
        offset="45%"
        stop-color={accentColor}
      /><stop offset="100%" stop-color={fillColor} /></linearGradient
    >
    <linearGradient id="{gradientId}-f" x1="0%" y1="100%" x2="0%" y2="0%"
      ><stop offset="0%" stop-color="#ea580c" /><stop
        offset="55%"
        stop-color="#facc15"
      /><stop offset="100%" stop-color="#fff" /></linearGradient
    >
    <g id="{gradientId}-sk">
      <path
        d="M15.5,22.2L16.8,35.8C18.5,39.5 29.5,39.5 31.2,35.8L32.5,22.2ZM14.8,12.5C14.8,5 33.2,5 33.2,12.5C33.2,14.8 36.2,16.5 36.2,19C36.2,21.4 33,22.1 31,22.4H17C15,22.1 11.8,21.4 11.8,19C11.8,16.5 14.8,14.8 14.8,12.5Z"
        fill="url(#{gradientId}-s)"
        stroke="#020617"
        stroke-width="1.25"
      />
      <path
        d="M17.2,22.6H30.8L29.6,34C28,36.5 20,36.5 18.4,34ZM24,16.8L22,20.8L24,20L26,20.8Z"
        fill="#090d16"
      />
      <path
        d="M18.4,33.5C18,27.5 20.5,24.2 22.5,23.2C22,25.8 23.5,24.8 24,22.8C25,25 26,24.8 26.5,23.2C28.5,24.8 30,27.8 29.6,33.5Z"
        fill="url(#{gradientId}-f)"
      />
      <path
        d="M23,6.8L19,14L20.8,10.8L18.2,15M14,13.2Q19.5,17.5 24,16.6Q28.5,17.5 34,13.2"
        stroke="#020617"
        stroke-width="1.35"
        fill="none"
      />
      <path
        d="M16,14.5L22.2,16.4L21.2,19L15.5,17.4ZM32,14.5L25.8,16.4L26.8,19L32.5,17.4Z"
        fill="#facc15"
        stroke="#020617"
        stroke-width="0.7"
      />
      <circle cx="19" cy="16.6" r="0.9" fill="#fff" /><circle
        cx="29"
        cy="16.6"
        r="0.9"
        fill="#fff"
      />
    </g>
    <path
      id="{gradientId}-fn"
      d="M17.8,22.2L19,25.6L20.4,22.2ZM21,22.2L22.2,25.6L23.4,22.2ZM24.6,22.2L25.8,25.6L27,22.2ZM27.6,22.2L29,25.6L30.2,22.2ZM18.2,34.4L19.4,31L20.6,34.4ZM21.2,34.4L22.4,31L23.6,34.4ZM24.4,34.4L25.6,31L26.8,34.4ZM27.4,34.4L28.6,31L29.8,34.4Z"
      fill="#fff"
      stroke="#020617"
      stroke-width="0.6"
    />
  </defs>
  <ellipse
    cx="24"
    cy="24"
    rx="21"
    ry="8"
    transform="rotate(32 24 24)"
    stroke={isUnlocked ? accentColor : "#64748b"}
    stroke-width="1.35"
  /><ellipse
    cx="24"
    cy="24"
    rx="21"
    ry="8"
    transform="rotate(-32 24 24)"
    stroke={isUnlocked ? fillColor : "#64748b"}
    stroke-width="1.35"
  /><polygon
    points="24,5.5 39.5,14.8 39.5,33.2 24,42.5 8.5,33.2 8.5,14.8"
    fill="url(#{gradientId}-d)"
    stroke={isUnlocked ? "#fff" : "#94a3b8"}
    stroke-width="1.3"
  />
  {#if !isUnlocked || rank === "locked" || rank === "common"}
    <rect
      x="16.5"
      y="16.5"
      width="15"
      height="15"
      rx="3"
      fill={isUnlocked ? `url(#${gradientId}-b)` : "#64748b"}
      stroke="#fff"
      stroke-width="1.1"
    />
    <rect
      x="18.6"
      y="18.6"
      width="10.8"
      height="10.8"
      rx="1.8"
      fill="url(#{gradientId}-d)"
    />
    <path
      d="M20.8,22L23.5,24L20.8,26M24.5,26H27.2"
      stroke="#fff"
      stroke-width="1.5"
    />
  {:else if rank === "uncommon"}
    <g class="adv-pulse">
      <rect
        x="16"
        y="18.5"
        width="16"
        height="14"
        rx="2.8"
        fill="url(#{gradientId}-d)"
        stroke="#fff"
        stroke-width="1.2"
      />
      <path
        d="M20.5,23.5L23.5,25.5L20.5,27.5M24.5,27.5H27.5"
        stroke={accentColor}
        stroke-width="1.6"
      />
      <path
        d="M9.5,14L15.5,19.5L13.5,27.5L8.5,23.5ZM38.5,14L32.5,19.5L34.5,27.5L39.5,23.5Z"
        fill="#f8fafc"
        stroke="#020617"
        stroke-width="1.1"
      />
      <circle
        cx="15.5"
        cy="19.5"
        r="1.4"
        fill="#facc15"
        stroke="#020617"
        stroke-width="0.7"
      /><circle
        cx="32.5"
        cy="19.5"
        r="1.4"
        fill="#facc15"
        stroke="#020617"
        stroke-width="0.7"
      />
    </g>
  {:else if rank === "rare"}
    <g class="adv-pulse">
      <g transform="rotate(10 16 31)"
        ><rect
          x="9.5"
          y="27"
          width="13"
          height="8"
          rx="1.8"
          fill="url(#{gradientId}-d)"
          stroke="#fff"
          stroke-width="1.1"
        /><path
          d="M14,27V35M18,27V35"
          stroke={accentColor}
          stroke-width="0.9"
        /></g
      >
      <g transform="rotate(-10 32 31)"
        ><rect
          x="25.5"
          y="27"
          width="13"
          height="8"
          rx="1.8"
          fill="url(#{gradientId}-d)"
          stroke="#fff"
          stroke-width="1.1"
        /><path
          d="M30,27V35M34,27V35"
          stroke={accentColor}
          stroke-width="0.9"
        /></g
      >
      <path
        d="M11,11.5L18.5,14L17,18L10,15.5ZM37,11.5L29.5,14L31,18L38,15.5Z"
        fill="#f8fafc"
        stroke="#020617"
        stroke-width="1.1"
      />
      <path
        d="M11.5,16L11.5,26M14.5,17L15,26.8M17.5,18L18.5,27M36.5,16L36.5,26M33.5,17L33,26.8M30.5,18L29.5,27"
        stroke="#f8fafc"
        stroke-width="2"
      />
      <path
        d="M11.5,16L11.5,26M14.5,17L15,26.8M17.5,18L18.5,27M36.5,16L36.5,26M33.5,17L33,26.8M30.5,18L29.5,27"
        stroke="#020617"
        stroke-width="0.75"
      />
      <circle cx="15" cy="26.8" r="1.2" fill="#facc15" /><circle
        cx="33"
        cy="26.8"
        r="1.2"
        fill="#facc15"
      />
    </g>
  {:else if rank === "epic"}
    <g class="adv-pulse">
      <use href="#{gradientId}-sk" />
      <rect
        x="11.5"
        y="24"
        width="25"
        height="8.5"
        rx="2.2"
        fill="url(#{gradientId}-b)"
        stroke="#fff"
        stroke-width="1.2"
      />
      <rect
        x="13.5"
        y="25.5"
        width="21"
        height="5.5"
        rx="1.2"
        fill="url(#{gradientId}-d)"
      />
      <path
        d="M24,24L21.5,27.5L25.5,29L22.5,32.5M17,28.2H20.5M27.5,28.2H31"
        stroke="#facc15"
        stroke-width="1.4"
        fill="none"
      />
      <use href="#{gradientId}-fn" />
    </g>
  {:else if rank === "legendary"}
    <g class="adv-pulse">
      <use href="#{gradientId}-sk" />
      <rect
        x="17.5"
        y="29"
        width="13"
        height="6.5"
        rx="1.6"
        fill="url(#{gradientId}-d)"
        stroke="#facc15"
        stroke-width="1.1"
      />
      <path
        d="M21,31.2L23,32.4L21,33.6M24.2,33.6H27"
        stroke="#fff"
        stroke-width="1.15"
      />
      <path d="M10.5,25.5H37.5" stroke="#f8fafc" stroke-width="3.2" />
      <path d="M10.5,25.5H37.5" stroke="#020617" stroke-width="1" />
      <circle
        cx="14.5"
        cy="25.5"
        r="1.5"
        fill="#fff"
        stroke="#020617"
        stroke-width="0.8"
      /><circle
        cx="24"
        cy="25.5"
        r="1.6"
        fill="#facc15"
        stroke="#020617"
        stroke-width="0.8"
      /><circle
        cx="33.5"
        cy="25.5"
        r="1.5"
        fill="#fff"
        stroke="#020617"
        stroke-width="0.8"
      />
      <use href="#{gradientId}-fn" />
    </g>
  {:else}
    <g class="adv-pulse">
      <use href="#{gradientId}-sk" />
      <path
        d="M16,15.5C12.2,14 9.8,11.5 9.2,8.5C12,10.6 14.5,12.5 17.5,14.5ZM32,15.5C35.8,14 38.2,11.5 38.8,8.5C36,10.6 33.5,12.5 30.5,14.5Z"
        fill="url(#{gradientId}-f)"
      />
      <g transform="rotate(6 24 28)">
        <rect
          x="16.5"
          y="23.8"
          width="15"
          height="8.5"
          rx="1.8"
          fill="url(#{gradientId}-d)"
          stroke="#facc15"
          stroke-width="1.15"
        />
        <path
          d="M24,23.8L21.8,27.5L25.2,29L22.5,32.3M19,26.8L21,28.2L19,29.6M25.5,29.6H28.5"
          stroke="#fff"
          stroke-width="1.15"
          fill="none"
        />
      </g>
      <use href="#{gradientId}-fn" />
      <path
        d="M7.5,19L13.5,24M6.5,24.5L13,27M8,30L13.5,30M40.5,19L34.5,24M41.5,24.5L35,27M40,30L34.5,30"
        stroke="#f8fafc"
        stroke-width="1.9"
      />
      <circle cx="7.5" cy="19" r="1.1" fill="#facc15" /><circle
        cx="6.5"
        cy="24.5"
        r="1.1"
        fill="#facc15"
      /><circle cx="40.5" cy="19" r="1.1" fill="#facc15" /><circle
        cx="41.5"
        cy="24.5"
        r="1.1"
        fill="#facc15"
      />
    </g>
  {/if}
</svg>

<style>
  .adv-pulse {
    transform-origin: 24px 24px;
    animation: adv-p 2.6s ease-in-out infinite;
  }
  @keyframes adv-p {
    0%,
    100% {
      transform: scale(0.98);
    }
    50% {
      transform: scale(1.03);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .adv-pulse {
      animation: none !important;
    }
  }
</style>
