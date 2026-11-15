<script lang="ts">
  import { getTierMeta } from "@/core/achievements/tier-system";

  let {
    fillColor = "currentColor",
    accentColor = "#ffffff",
    gradientId = "scroll-grad",
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
  class="scroll-svg rank-{rank} {isUnlocked
    ? 'is-unlocked'
    : 'is-locked'} {className}"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="{gradientId}-body" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color={accentColor} />
      <stop offset="65%" stop-color={fillColor} />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.85" />
    </linearGradient>
    <linearGradient id="{gradientId}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="30%" stop-color="#fef08a" />
      <stop offset="70%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#92400e" />
    </linearGradient>
    <linearGradient id="{gradientId}-slate" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
  </defs>

  <g class="scroll-codex">
    {#if rank === "locked" || rank === "bronze"}
      <!-- BRONZE: Scribe's Typing Charter with Rolled Cylinders & Blinking Cursor Caret -->
      <rect
        x="6"
        y="4"
        width="36"
        height="5"
        rx="2.5"
        fill={isUnlocked ? fillColor : "#475569"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1"
      />
      <rect
        x="6"
        y="37"
        width="36"
        height="5"
        rx="2.5"
        fill={isUnlocked ? fillColor : "#475569"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1"
      />
      <rect
        x="9"
        y="8"
        width="30"
        height="30"
        rx="2"
        fill={isUnlocked ? `url(#${gradientId}-body)` : "#64748b"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.3"
      />
      <rect
        x="12"
        y="11"
        width="24"
        height="24"
        rx="1.5"
        fill="url(#{gradientId}-slate)"
        opacity="0.82"
      />
      <!-- Typing Prompt & Script Lines -->
      <path
        d="M15 16 L17.5 18 L15 20"
        stroke={isUnlocked ? accentColor : "#cbd5e1"}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <line
        x1="20"
        y1="18"
        x2="32"
        y2="18"
        stroke={isUnlocked ? "#ffffff" : "#cbd5e1"}
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <line
        x1="15"
        y1="23.5"
        x2="30"
        y2="23.5"
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.4"
        stroke-linecap="round"
      />
      <line
        x1="15"
        y1="29"
        x2="25"
        y2="29"
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.4"
        stroke-linecap="round"
      />
      <!-- Blinking Typing Caret -->
      <line
        x1="28"
        y1="27"
        x2="28"
        y2="31"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linecap="round"
        class="scroll-caret"
      />
    {:else if rank === "silver"}
      <!-- SILVER: Classical Argentum Manuscript with Feather Quill & Wax Seal -->
      <rect
        x="5"
        y="4"
        width="38"
        height="4.8"
        rx="2.4"
        fill={fillColor}
        stroke="#ffffff"
        stroke-width="1"
      />
      <circle cx="5" cy="6.4" r="2.6" fill="#ffffff" />
      <circle cx="43" cy="6.4" r="2.6" fill="#ffffff" />
      <rect
        x="5"
        y="37"
        width="38"
        height="4.8"
        rx="2.4"
        fill={fillColor}
        stroke="#ffffff"
        stroke-width="1"
      />
      <circle cx="5" cy="39.4" r="2.6" fill="#ffffff" />
      <circle cx="43" cy="39.4" r="2.6" fill="#ffffff" />
      <rect
        x="9"
        y="8"
        width="30"
        height="30"
        rx="2"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.3"
      />
      <rect
        x="11.5"
        y="10.5"
        width="25"
        height="25"
        rx="1.5"
        fill="url(#{gradientId}-slate)"
        stroke={accentColor}
        stroke-width="0.8"
      />
      <!-- Illuminated Keycap Initial [T] -->
      <rect
        x="14"
        y="13"
        width="7"
        height="7"
        rx="1.5"
        fill={fillColor}
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <path
        d="M16 15 H19 M17.5 15 V18.5"
        stroke="#ffffff"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <line
        x1="23.5"
        y1="15"
        x2="33"
        y2="15"
        stroke="#ffffff"
        stroke-width="1.4"
        stroke-linecap="round"
      />
      <line
        x1="23.5"
        y1="19"
        x2="31"
        y2="19"
        stroke={accentColor}
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <line
        x1="14"
        y1="24"
        x2="32"
        y2="24"
        stroke="#ffffff"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <line
        x1="14"
        y1="28.5"
        x2="24"
        y2="28.5"
        stroke={accentColor}
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <!-- Crimson Wax Seal -->
      <circle
        cx="31"
        cy="29.5"
        r="3.8"
        fill="#dc2626"
        stroke="#ffffff"
        stroke-width="0.9"
      />
      <polygon points="31,27.2 32.2,29.5 31,31.8 29.8,29.5" fill="#fef08a" />
    {:else if rank === "gold"}
      <!-- GOLD: Royal Golden Decree Charter with Winged Finials & Golden Keycap Crest -->
      <rect
        x="4"
        y="3.5"
        width="40"
        height="5.2"
        rx="2.6"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="1"
      />
      <polygon
        points="1,6 4,3 4,9"
        fill="#fef08a"
        stroke="#78350f"
        stroke-width="0.6"
      />
      <polygon
        points="47,6 44,3 44,9"
        fill="#fef08a"
        stroke="#78350f"
        stroke-width="0.6"
      />
      <rect
        x="4"
        y="37"
        width="40"
        height="5.2"
        rx="2.6"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="1"
      />
      <rect
        x="8"
        y="8"
        width="32"
        height="30"
        rx="2"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1.2"
      />
      <rect
        x="10.5"
        y="10.2"
        width="27"
        height="25.5"
        rx="1.5"
        fill="#451a03"
        stroke="#fde047"
        stroke-width="0.9"
      />
      <!-- Golden Keycap Header -->
      <rect
        x="19"
        y="12"
        width="10"
        height="7.5"
        rx="2"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <polygon
        points="24,13.2 25.1,15.4 27.5,15.7 25.7,17.2 26.2,19.4 24,18.2 21.8,19.4 22.3,17.2 20.5,15.7 22.9,15.4"
        fill="#78350f"
      />
      <!-- Golden Script Lines -->
      <line
        x1="14"
        y1="22.5"
        x2="34"
        y2="22.5"
        stroke="#fef08a"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <line
        x1="14"
        y1="26.5"
        x2="32"
        y2="26.5"
        stroke="#fde047"
        stroke-width="1.4"
        stroke-linecap="round"
      />
      <line
        x1="14"
        y1="30.5"
        x2="26"
        y2="30.5"
        stroke="#fef08a"
        stroke-width="1.4"
        stroke-linecap="round"
      />
      <line
        x1="29"
        y1="29"
        x2="29"
        y2="32"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linecap="round"
        class="scroll-caret"
      />
    {:else if rank === "platinum"}
      <!-- PLATINUM: Cryo-Crystal Laser Data Tablet with Holographic Code Rows -->
      <polygon
        points="4,4 44,4 41,9 7,9"
        fill="#0369a1"
        stroke="#ffffff"
        stroke-width="1"
      />
      <polygon
        points="7,37 41,37 44,42 4,42"
        fill="#0369a1"
        stroke="#ffffff"
        stroke-width="1"
      />
      <polygon
        points="7,8.5 41,8.5 39,37.5 9,37.5"
        fill="url(#{gradientId}-body)"
        stroke={accentColor}
        stroke-width="1.4"
      />
      <polygon
        points="10,11 38,11 36.5,35 11.5,35"
        fill="url(#{gradientId}-slate)"
        stroke="#38bdf8"
        stroke-width="0.9"
      />
      <!-- Crystal Terminal Header & Caret -->
      <polygon
        points="24,12.5 28,16 24,19.5 20,16"
        fill="#ffffff"
        stroke="#0284c7"
        stroke-width="0.8"
      />
      <line
        x1="14"
        y1="22.5"
        x2="34"
        y2="22.5"
        stroke="#ffffff"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <line
        x1="14"
        y1="26.5"
        x2="30"
        y2="26.5"
        stroke={accentColor}
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <line
        x1="14"
        y1="30.5"
        x2="26"
        y2="30.5"
        stroke="#ffffff"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <rect
        x="28.5"
        y="29"
        width="2.2"
        height="3.2"
        fill={accentColor}
        class="scroll-caret"
      />
    {:else if rank === "diamond"}
      <!-- DIAMOND: Prismatic Octagonal Astral Codex with Refracting Seal -->
      <polygon
        points="5,3 43,3 46,6.5 43,9.5 5,9.5 2,6.5"
        fill="#0891b2"
        stroke="#ffffff"
        stroke-width="1.1"
      />
      <polygon
        points="5,36.5 43,36.5 46,39.5 43,43 5,43 2,39.5"
        fill="#0891b2"
        stroke="#ffffff"
        stroke-width="1.1"
      />
      <polygon
        points="7,8.5 41,8.5 43,12 43,34 41,37.5 7,37.5 5,34 5,12"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.4"
      />
      <rect
        x="10"
        y="11"
        width="28"
        height="24"
        rx="2"
        fill="#083344"
        stroke="#67e8f9"
        stroke-width="1"
      />
      <!-- Diamond Key-Prism Crest -->
      <polygon
        points="24,12.5 29.5,17 24,21.5 18.5,17"
        fill="#ffffff"
        stroke="#06b6d4"
        stroke-width="1"
      />
      <circle cx="24" cy="17" r="2" fill="#22d3ee" />
      <line
        x1="14"
        y1="25"
        x2="34"
        y2="25"
        stroke="#ffffff"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <line
        x1="14"
        y1="29.5"
        x2="28"
        y2="29.5"
        stroke="#a5f3fc"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <polygon
        points="32,27.5 34,29.5 32,31.5 30,29.5"
        fill="#ffffff"
        class="scroll-caret"
      />
    {:else if rank === "heroic"}
      <!-- HEROIC: Volcanic Obsidian Battle-Scroll with Blazing Keystroke Runes -->
      <polygon
        points="3,3.5 45,3.5 42,9 6,9"
        fill="#7c2d12"
        stroke="#f97316"
        stroke-width="1.2"
      />
      <polygon
        points="6,37 42,37 45,42.5 3,42.5"
        fill="#7c2d12"
        stroke="#f97316"
        stroke-width="1.2"
      />
      <path
        d="M7 8.5 L41 8.5 Q39 16 42 23 Q38 30 41 37.5 L7 37.5 Q10 30 6 23 Q9 16 7 8.5 Z"
        fill="url(#{gradientId}-body)"
        stroke="#fed7aa"
        stroke-width="1.4"
      />
      <rect
        x="10.5"
        y="11"
        width="27"
        height="24"
        rx="1.5"
        fill="#431407"
        stroke="#f97316"
        stroke-width="1"
      />
      <!-- Blazing Phoenix Flame Emblem -->
      <path
        d="M24 12.5 C27.5 16 28 19.5 24 22 C20 19.5 20.5 16 24 12.5 Z"
        fill="#fef08a"
        stroke="#ea580c"
        stroke-width="0.8"
      />
      <line
        x1="14"
        y1="25.5"
        x2="34"
        y2="25.5"
        stroke="#fef08a"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <line
        x1="14"
        y1="30"
        x2="28"
        y2="30"
        stroke="#fb923c"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <circle cx="32" cy="30" r="1.8" fill="#ffffff" class="scroll-caret" />
    {:else if rank === "eliteHeroic"}
      <!-- ELITE HEROIC: Cybernetic Holo-Terminal Scroll with Live WPM Waveform -->
      <polygon
        points="4,3 44,3 46,6.5 42,9.5 6,9.5 2,6.5"
        fill="#064e3b"
        stroke="#34d399"
        stroke-width="1.3"
      />
      <polygon
        points="6,36.5 42,36.5 46,39.5 44,43 4,43 2,39.5"
        fill="#064e3b"
        stroke="#34d399"
        stroke-width="1.3"
      />
      <rect
        x="6.5"
        y="8.5"
        width="35"
        height="29"
        rx="2.5"
        fill="url(#{gradientId}-body)"
        stroke="#a7f3d0"
        stroke-width="1.4"
      />
      <rect
        x="9.5"
        y="11"
        width="29"
        height="24"
        rx="1.8"
        fill="#022c22"
        stroke="#10b981"
        stroke-width="1"
      />
      <!-- Live WPM Telemetry Waveform -->
      <polyline
        points="12.5,19 17,19 19.5,14 22.5,24 25.5,16.5 28,19 35.5,19"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <line
        x1="13"
        y1="26.5"
        x2="35"
        y2="26.5"
        stroke="#34d399"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-dasharray="4 2"
      />
      <line
        x1="13"
        y1="30.5"
        x2="27"
        y2="30.5"
        stroke="#a7f3d0"
        stroke-width="1.4"
        stroke-linecap="round"
      />
      <rect
        x="30"
        y="29"
        width="3"
        height="3"
        rx="0.6"
        fill="#ffffff"
        class="scroll-caret"
      />
    {:else if rank === "master"}
      <!-- MASTER: Imperial Sovereign Grimoire with Golden Sceptre Rollers -->
      <rect
        x="3"
        y="3"
        width="42"
        height="5.5"
        rx="2.75"
        fill="url(#{gradientId}-gold)"
        stroke="#4c1d95"
        stroke-width="1.2"
      />
      <polygon points="0,5.8 3.5,2.5 3.5,9" fill="#ffffff" />
      <polygon points="48,5.8 44.5,2.5 44.5,9" fill="#ffffff" />
      <rect
        x="3"
        y="37"
        width="42"
        height="5.5"
        rx="2.75"
        fill="url(#{gradientId}-gold)"
        stroke="#4c1d95"
        stroke-width="1.2"
      />
      <rect
        x="7"
        y="8"
        width="34"
        height="30"
        rx="2"
        fill="#3b0764"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.6"
      />
      <rect
        x="10"
        y="10.8"
        width="28"
        height="24.4"
        rx="1.5"
        fill="#1e1b4b"
        stroke="#c084fc"
        stroke-width="0.9"
      />
      <!-- Imperial Crown Header -->
      <path
        d="M18 19.5 L17 14 L20.5 16.5 L24 12.5 L27.5 16.5 L31 14 L30 19.5 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <line
        x1="14"
        y1="24"
        x2="34"
        y2="24"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <line
        x1="14"
        y1="28"
        x2="31"
        y2="28"
        stroke="#e9d5ff"
        stroke-width="1.4"
        stroke-linecap="round"
      />
      <line
        x1="14"
        y1="32"
        x2="25"
        y2="32"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.4"
        stroke-linecap="round"
      />
      <polygon
        points="29,30 31,32 29,34 27,32"
        fill="#fef08a"
        class="scroll-caret"
      />
    {:else if rank === "eliteMaster"}
      <!-- ELITE MASTER: Abyssal Dragon-Bone Forbidden Codex -->
      <polygon
        points="0,6 4,2 44,2 48,6 44,9.5 4,9.5"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.3"
      />
      <polygon
        points="0,40 4,36.5 44,36.5 48,40 44,44 4,44"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.3"
      />
      <rect
        x="6.5"
        y="8.5"
        width="35"
        height="29"
        rx="1.5"
        fill="url(#{gradientId}-body)"
        stroke="#fca5a5"
        stroke-width="1.5"
      />
      <rect
        x="9.5"
        y="11"
        width="29"
        height="24"
        rx="1"
        fill="#1c0404"
        stroke="#dc2626"
        stroke-width="1"
      />
      <!-- Dragon Blood-Rune Crest -->
      <polygon
        points="24,12.5 29.5,17.5 24,22.5 18.5,17.5"
        fill="#dc2626"
        stroke="#ffffff"
        stroke-width="0.9"
      />
      <polygon points="24,14.5 26,17.5 24,20.5 22,17.5" fill="#fef08a" />
      <line
        x1="13.5"
        y1="26"
        x2="34.5"
        y2="26"
        stroke="#f87171"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-dasharray="5 2 2 2"
      />
      <line
        x1="13.5"
        y1="30.5"
        x2="28.5"
        y2="30.5"
        stroke="#fef08a"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <polygon
        points="32,28.5 34,30.5 32,32.5 30,30.5"
        fill="#ffffff"
        class="scroll-caret"
      />
    {:else}
      <!-- GRANDMASTER: Supreme Akashic Celestial Codex with Solar Wing Rollers -->
      <rect
        x="2"
        y="2.5"
        width="44"
        height="6"
        rx="3"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1.3"
      />
      <circle
        cx="2"
        cy="5.5"
        r="2.8"
        fill="#ffffff"
        stroke="#f59e0b"
        stroke-width="0.8"
      />
      <circle
        cx="46"
        cy="5.5"
        r="2.8"
        fill="#ffffff"
        stroke="#f59e0b"
        stroke-width="0.8"
      />
      <rect
        x="2"
        y="37"
        width="44"
        height="6"
        rx="3"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1.3"
      />
      <circle
        cx="2"
        cy="40"
        r="2.8"
        fill="#ffffff"
        stroke="#f59e0b"
        stroke-width="0.8"
      />
      <circle
        cx="46"
        cy="40"
        r="2.8"
        fill="#ffffff"
        stroke="#f59e0b"
        stroke-width="0.8"
      />
      <rect
        x="6"
        y="8"
        width="36"
        height="30"
        rx="2.5"
        fill="#701a75"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.8"
      />
      <rect
        x="9"
        y="10.8"
        width="30"
        height="24.4"
        rx="1.8"
        fill="#2e0532"
        stroke="#ffffff"
        stroke-width="1"
      />
      <!-- Supernova Keycap & Star Crest -->
      <polygon
        points="24,12 26,16 30,17.5 26,19 24,23 22,19 18,17.5 22,16"
        fill="#ffffff"
      />
      <circle cx="24" cy="17.5" r="2" fill="#fef08a" />
      <line
        x1="13"
        y1="25.5"
        x2="35"
        y2="25.5"
        stroke="#ffffff"
        stroke-width="1.7"
        stroke-linecap="round"
      />
      <line
        x1="13"
        y1="29.5"
        x2="31"
        y2="29.5"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.7"
        stroke-linecap="round"
      />
      <line
        x1="13"
        y1="33"
        x2="25"
        y2="33"
        stroke="#f5d0fe"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <polygon
        points="29.5,31 31.5,33 29.5,35 27.5,33"
        fill="#ffffff"
        class="scroll-caret"
      />
    {/if}
  </g>
</svg>

<style>
  .scroll-svg.is-unlocked .scroll-caret {
    animation: caret-blink 1.15s steps(2, start) infinite;
  }

  .scroll-svg.is-unlocked .scroll-codex {
    transform-origin: 24px 23px;
    animation: scroll-hover 3.6s ease-in-out infinite;
  }

  @keyframes caret-blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.15;
    }
  }

  @keyframes scroll-hover {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-1px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .scroll-caret,
    .scroll-codex {
      animation: none !important;
    }
  }
</style>
