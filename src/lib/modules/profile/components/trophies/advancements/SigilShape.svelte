<script lang="ts">
  import {
    getAdvancementRankMeta,
    type AdvancementRank,
  } from "@/core/achievements/advancement-rank";
  let {
    fillColor = "currentColor",
    accentColor = "#fff",
    gradientId = "sigil-grad",
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
  class="adv-shape-svg sigil-svg rank-{rank} {isUnlocked
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
    points="24,1.8 30.8,13.5 44.5,16.2 34.5,26.2 36.8,40.5 24,34.2 11.2,40.5 13.5,26.2 3.5,16.2 17.2,13.5"
    fill={isUnlocked ? `url(#${gradientId}-b)` : "#475569"}
    stroke={isUnlocked ? "#fff" : "#94a3b8"}
    stroke-width="1.4"
  /><polygon
    points="24,6.8 37.5,15 37.5,33 24,41.2 10.5,33 10.5,15"
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
        x="11.5"
        y="25.5"
        width="11.5"
        height="9.5"
        rx="2"
        fill="url(#{gradientId}-d)"
        stroke="#fff"
        stroke-width="1.15"
      />
      <rect
        x="25"
        y="25.5"
        width="11.5"
        height="9.5"
        rx="2"
        fill="url(#{gradientId}-d)"
        stroke={accentColor}
        stroke-width="1.15"
      />
      <path
        d="M15,28.5L17.5,30.2L15,32M28.5,31.5L30.8,29L33,31.5"
        stroke="#fff"
        stroke-width="1.4"
      />
      <path
        d="M14,8.5L19.5,24.5L16.5,25.2L11,9.5ZM34,8.5L28.5,24.5L31.5,25.2L37,9.5Z"
        fill="#f8fafc"
        stroke="#020617"
        stroke-width="1.1"
      />
      <path
        d="M12.5,14L15.8,13.2M14.5,19.5L17.8,18.8M35.5,14L32.2,13.2M33.5,19.5L30.2,18.8"
        stroke="#020617"
        stroke-width="1"
      />
      <circle cx="17.8" cy="24.5" r="1.3" fill="#facc15" /><circle
        cx="30.2"
        cy="24.5"
        r="1.3"
        fill="#facc15"
      />
    </g>
  {:else if rank === "rare"}
    <g class="adv-pulse">
      <rect
        x="10.5"
        y="31.5"
        width="8"
        height="6.5"
        rx="1.5"
        fill="url(#{gradientId}-d)"
        stroke="#fff"
        stroke-width="1"
      />
      <rect
        x="20"
        y="29.5"
        width="8"
        height="8.5"
        rx="1.5"
        fill="url(#{gradientId}-b)"
        stroke="#fff"
        stroke-width="1.1"
      />
      <rect
        x="29.5"
        y="31.5"
        width="8"
        height="6.5"
        rx="1.5"
        fill="url(#{gradientId}-d)"
        stroke="#fff"
        stroke-width="1"
      />
      <path
        d="M11,16C11,11.5 18,10 23,12.5L32,17.5L30,20.5L22,16.5L14.5,20.5Z"
        fill="#f8fafc"
        stroke="#020617"
        stroke-width="1.15"
      />
      <path
        d="M14.5,20.5L14,29.5M22,16.5L24,28M30,19.5L33.5,29.5"
        stroke="#f8fafc"
        stroke-width="2.6"
      />
      <path
        d="M14.5,20.5L14,29.5M22,16.5L24,28M30,19.5L33.5,29.5"
        stroke="#020617"
        stroke-width="0.9"
      />
      <circle
        cx="14.2"
        cy="24.5"
        r="1.3"
        fill="#fff"
        stroke="#020617"
        stroke-width="0.8"
      /><circle
        cx="23.2"
        cy="22.5"
        r="1.4"
        fill="#fff"
        stroke="#020617"
        stroke-width="0.8"
      /><circle
        cx="31.8"
        cy="24.5"
        r="1.3"
        fill="#fff"
        stroke="#020617"
        stroke-width="0.8"
      />
      <circle cx="24" cy="28.5" r="1.4" fill="#facc15" />
    </g>
  {:else if rank === "epic"}
    <g class="adv-pulse">
      <use href="#{gradientId}-sk" />
      <g transform="rotate(-12 18 28)"
        ><rect
          x="11.5"
          y="23.5"
          width="11"
          height="9.5"
          rx="2"
          fill="url(#{gradientId}-b)"
          stroke="#fff"
          stroke-width="1.1"
        /><path
          d="M14.5,26.8L17,28.5L14.5,30.2"
          stroke="#020617"
          stroke-width="1.4"
        /></g
      >
      <g transform="rotate(12 30 28)"
        ><rect
          x="25.5"
          y="23.5"
          width="11"
          height="9.5"
          rx="2"
          fill="url(#{gradientId}-d)"
          stroke="#facc15"
          stroke-width="1.1"
        /><path d="M28.5,30H33" stroke="#fff" stroke-width="1.4" /></g
      >
      <polygon
        points="24.8,20.5 21.5,27.5 24.5,27.5 22.8,35 27,26.8 24,26.8"
        fill="#facc15"
        stroke="#020617"
        stroke-width="0.6"
      />
      <use href="#{gradientId}-fn" />
    </g>
  {:else if rank === "legendary"}
    <g class="adv-pulse">
      <use href="#{gradientId}-sk" />
      <path
        d="M18.5,25.5H29.5L31,30.5H17Z"
        fill="#e2e8f0"
        stroke="#020617"
        stroke-width="1"
      />
      <path
        d="M18,26.5L10,23.5M18,28.5L9.5,28.5M18.5,30.2L11,33.5M30,26.5L38,23.5M30,28.5L38.5,28.5M29.5,30.2L37,33.5"
        stroke="#f8fafc"
        stroke-width="2.1"
      />
      <circle
        cx="13.5"
        cy="24.8"
        r="1.2"
        fill="#fff"
        stroke="#020617"
        stroke-width="0.7"
      /><circle
        cx="13"
        cy="28.5"
        r="1.2"
        fill="#fff"
        stroke="#020617"
        stroke-width="0.7"
      /><circle
        cx="34.5"
        cy="24.8"
        r="1.2"
        fill="#fff"
        stroke="#020617"
        stroke-width="0.7"
      /><circle
        cx="35"
        cy="28.5"
        r="1.2"
        fill="#fff"
        stroke="#020617"
        stroke-width="0.7"
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
      <path
        d="M9.5,26.5C9.5,24.8 11.5,24.4 12.5,25.4H35.5C36.5,24.4 38.5,24.8 38.5,26.5C38.5,28.2 36.5,28.6 35.5,27.6H12.5C11.5,28.6 9.5,28.2 9.5,26.5Z"
        fill="#f8fafc"
        stroke="#020617"
        stroke-width="1"
      />
      <use href="#{gradientId}-fn" />
      <rect
        x="11.5"
        y="35.2"
        width="25"
        height="5.8"
        rx="1.6"
        fill="url(#{gradientId}-d)"
        stroke="#facc15"
        stroke-width="1.1"
      />
      <path
        d="M19.5,35.2V41M28.5,35.2V41M14.5,37.2L16.5,38.2L14.5,39.2M22.5,39L24,37L25.5,39M31,38.8H34"
        stroke="#fff"
        stroke-width="1.1"
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
