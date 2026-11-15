<script lang="ts">
  import {
    getAdvancementRankMeta,
    type AdvancementRank,
  } from "@/core/achievements/advancement-rank";
  let {
    fillColor = "currentColor",
    accentColor = "#fff",
    gradientId = "hex-grad",
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
  class="adv-hex-svg rank-{rank} {isUnlocked
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
  <polygon
    points="24,2.2 43.5,13.5 43.5,34.5 24,45.8 4.5,34.5 4.5,13.5"
    fill={isUnlocked ? `url(#${gradientId}-b)` : "#475569"}
    stroke={isUnlocked ? "#fff" : "#94a3b8"}
    stroke-width="1.5"
  /><polygon
    points="24,5.8 40,15 40,33 24,42.2 8,33 8,15"
    fill="url(#{gradientId}-d)"
    stroke={isUnlocked ? accentColor : "#64748b"}
    stroke-width="1.1"
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
        x="14.5"
        y="25"
        width="19"
        height="10.5"
        rx="2.5"
        fill="url(#{gradientId}-d)"
        stroke="#fff"
        stroke-width="1.2"
      />
      <path
        d="M20.5,31L24,28L27.5,31M21,33H27"
        stroke={accentColor}
        stroke-width="1.6"
      />
      <path
        d="M12,22.5L15.5,24.8M36,22.5L32.5,24.8M14,19L17,21.8M34,19L31,21.8"
        stroke="#facc15"
        stroke-width="1.3"
      />
      <path
        d="M21.5,7C20.2,7 20,9 21.2,9.6V12.5C20,13.2 20.2,14.8 21.5,15.2V18C20.3,18.5 20.5,20 21.8,20.5L22.4,24.8C22.6,26 25.4,26 25.6,24.8L26.2,20.5C27.5,20 27.7,18.5 26.5,18V15.2C27.8,14.8 28,13.2 26.8,12.5V9.6C28,9 27.8,7 26.5,7Z"
        fill="#f8fafc"
        stroke="#020617"
        stroke-width="1.15"
      />
      <path
        d="M21.2,9.6H26.8M21.5,15.2H26.5M21.8,20.5H26.2"
        stroke="#020617"
        stroke-width="1"
      />
      <circle cx="24" cy="23.8" r="1.2" fill="#facc15" />
    </g>
  {:else if rank === "rare"}
    <g class="adv-pulse">
      <rect
        x="12"
        y="32.5"
        width="24"
        height="6"
        rx="1.8"
        fill="url(#{gradientId}-d)"
        stroke="#fff"
        stroke-width="1.1"
      />
      <path
        d="M18,32.5V38.5M24,32.5V38.5M30,32.5V38.5"
        stroke={accentColor}
        stroke-width="1"
      />
      <path
        d="M18.5,25.5C16.5,26.2 16,29.2 17.5,30.8H30.5C32,29.2 31.5,26.2 29.5,25.5L28,22H20ZM16.8,26.2L12,21.5L13.5,19.8L18.2,24.5M19.5,22.2L16.8,11.8L19.2,11.2L21.5,22M22.8,22V9.5H25.2V22M26.5,22L28.8,11.2L31.2,11.8L28.5,22.2M29.8,24.5L34.5,17.8L36.2,19L31.2,25.8"
        fill="#f8fafc"
        stroke="#020617"
        stroke-width="1.05"
      />
      <path
        d="M19.8,26.2L19,29.6M22.6,25.8V29.8M25.4,25.8V29.8M28.2,26.2L29,29.6M17.6,15.5L19.8,15M22.8,14H25.2M22.8,17.8H25.2M28.2,15L30.4,15.5"
        stroke="#020617"
        stroke-width="0.95"
      />
      <circle cx="12.5" cy="20.5" r="1.1" fill="#facc15" /><circle
        cx="18"
        cy="11"
        r="1.1"
        fill="#facc15"
      /><circle cx="24" cy="9" r="1.2" fill="#facc15" /><circle
        cx="30"
        cy="11"
        r="1.1"
        fill="#facc15"
      /><circle cx="35.5" cy="18" r="1.1" fill="#facc15" />
    </g>
  {:else if rank === "epic"}
    <g class="adv-pulse">
      <use href="#{gradientId}-sk" />
      <g transform="rotate(-7 24 28)">
        <rect
          x="14.5"
          y="22.5"
          width="19"
          height="11"
          rx="2.4"
          fill="url(#{gradientId}-b)"
          stroke="#fff"
          stroke-width="1.2"
        />
        <rect
          x="16.5"
          y="24.2"
          width="15"
          height="7.6"
          rx="1.4"
          fill="url(#{gradientId}-d)"
        />
        <path
          d="M24,22.5L21.5,26.8L25,28.5L22.2,33.5M16.5,26L21.5,26.8M25,28.5L31.5,27"
          stroke="#facc15"
          stroke-width="1.35"
          fill="none"
        />
        <path
          d="M18.2,26.8L20.4,28.4L18.2,30M26.2,30H29.2"
          stroke="#fff"
          stroke-width="1.25"
        />
      </g>
      <use href="#{gradientId}-fn" />
      <path
        d="M10,23.5L13,22L12.2,25.5ZM38,25.5L35,24L36.2,27.5Z"
        fill="#facc15"
        stroke="#020617"
        stroke-width="0.6"
      />
    </g>
  {:else if rank === "legendary"}
    <g class="adv-pulse">
      <use href="#{gradientId}-sk" />
      <path
        d="M9.5,26C9.5,24.4 11.5,24 12.5,25H18.5C19.2,24 21,24 21.5,25H26.5C27,24 28.8,24 29.5,25H35.5C36.5,24 38.5,24.4 38.5,26C38.5,27.6 36.5,28 35.5,27H29.5C28.8,28 27,28 26.5,27H21.5C21,28 19.2,28 18.5,27H12.5C11.5,28 9.5,27.6 9.5,26Z"
        fill="#f8fafc"
        stroke="#020617"
        stroke-width="1"
      />
      <path
        d="M11.5,29.5C11.5,28 13.2,27.8 14,28.6H19.5C20.2,27.8 21.8,27.8 22.2,28.6H25.8C26.2,27.8 27.8,27.8 28.5,28.6H34C34.8,27.8 36.5,28 36.5,29.5C36.5,31 34.8,31.2 34,30.4H28.5C27.8,31.2 26.2,31.2 25.8,30.4H22.2C21.8,31.2 20.2,31.2 19.5,30.4H14C13.2,31.2 11.5,31 11.5,29.5Z"
        fill="#cbd5e1"
        stroke="#020617"
        stroke-width="0.95"
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
      <rect
        x="17.2"
        y="24"
        width="13.6"
        height="8.2"
        rx="1.8"
        fill="url(#{gradientId}-d)"
        stroke="#facc15"
        stroke-width="1.15"
      />
      <path
        d="M24,24L22,27.8L25,29L23,32.2M19.2,26.8L21.2,28.2L19.2,29.6M25.5,29.8H28.2"
        stroke="#fff"
        stroke-width="1.15"
        fill="none"
      />
      <use href="#{gradientId}-fn" />
      <path
        d="M8.5,22L13.5,25.5M7.5,26L13,28M8.5,30L13.5,30.5M39.5,22L34.5,25.5M40.5,26L35,28M39.5,30L34.5,30.5"
        stroke="#f8fafc"
        stroke-width="1.8"
      />
      <circle cx="8.5" cy="22" r="1.1" fill="#facc15" /><circle
        cx="7.5"
        cy="26"
        r="1.1"
        fill="#facc15"
      /><circle cx="39.5" cy="22" r="1.1" fill="#facc15" /><circle
        cx="40.5"
        cy="26"
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
