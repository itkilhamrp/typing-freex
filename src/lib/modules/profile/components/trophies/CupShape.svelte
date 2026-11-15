<script lang="ts">
  import { getTierMeta } from "@/core/achievements/tier-system";

  let {
    fillColor = "currentColor",
    accentColor = "#ffffff",
    gradientId = "cup-grad",
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
  class="cup-svg rank-{rank} {isUnlocked
    ? 'is-unlocked'
    : 'is-locked'} {className}"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="{gradientId}-body" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.92" />
      <stop offset="28%" stop-color={accentColor} />
      <stop offset="100%" stop-color={fillColor} />
    </linearGradient>
    <linearGradient id="{gradientId}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="28%" stop-color="#fef08a" />
      <stop offset="68%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#92400e" />
    </linearGradient>
    <linearGradient id="{gradientId}-dark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
  </defs>

  <!-- ================= BASE / PEDESTAL (Transforming per tier) ================= -->
  <g class="cup-pedestal">
    {#if rank === "locked" || rank === "bronze"}
      <path
        d="M14 42h20v2.5a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 14 44.5V42z"
        fill={isUnlocked ? fillColor : "#475569"}
        opacity="0.9"
      />
      <path
        d="M17 38h14l-2 4H19l-2-4z"
        fill={isUnlocked ? `url(#${gradientId}-body)` : "#64748b"}
      />
      <path
        d="M21.5 27.5h5v10.5h-5z"
        fill={isUnlocked ? fillColor : "#475569"}
      />
    {:else if rank === "silver"}
      <path
        d="M12 43h24v2a1 1 0 0 1-1 1h-22a1 1 0 0 1-1-1v-2z"
        fill={fillColor}
      />
      <path
        d="M15 40h18l-1.5 3h-15l-1.5-3z"
        fill={accentColor}
        opacity="0.85"
      />
      <path d="M18 36h12l-1.5 4h-9l-1.5-4z" fill={fillColor} />
      <path d="M21.5 27h5v9h-5z" fill="url(#{gradientId}-body)" />
    {:else if rank === "gold"}
      <path
        d="M11 43h26v2.5a1 1 0 0 1-1 1h-24a1 1 0 0 1-1-1V43z"
        fill="#78350f"
      />
      <rect
        x="13"
        y="40.5"
        width="22"
        height="2.5"
        rx="0.5"
        fill="url(#{gradientId}-gold)"
      />
      <path d="M16 36h16l-2 4.5h-12l-2-4.5z" fill={fillColor} />
      <path d="M21 27h6v9h-6z" fill="url(#{gradientId}-gold)" />
    {:else if rank === "platinum"}
      <polygon points="10,44 38,44 35,46 13,46" fill="#0369a1" />
      <polygon
        points="13,41 35,41 38,44 10,44"
        fill={accentColor}
        opacity="0.85"
      />
      <polygon points="16,36 32,36 34,41 14,41" fill={fillColor} />
      <polygon
        points="21,26 27,26 25.5,36 22.5,36"
        fill="url(#{gradientId}-body)"
      />
    {:else if rank === "diamond"}
      <polygon points="9,44 39,44 36,46.5 12,46.5" fill="#0e7490" />
      <polygon points="12,40 36,40 39,44 9,44" fill={fillColor} />
      <polygon
        points="15,35 33,35 36,40 12,40"
        fill={accentColor}
        opacity="0.9"
      />
      <polygon points="21,26 27,26 26,35 22,35" fill="#ecfeff" />
    {:else if rank === "heroic"}
      <path d="M9 44 L39 44 L37 46.5 L11 46.5 Z" fill="#7c2d12" />
      <polygon points="11,40 37,40 39,44 9,44" fill={fillColor} />
      <polygon points="15,35 33,35 36,40 12,40" fill={accentColor} />
      <path d="M21 26 L27 26 L25.5 35 L22.5 35 Z" fill="#f97316" />
    {:else if rank === "eliteHeroic"}
      <polygon points="8,44 40,44 37,46.5 11,46.5" fill="#064e3b" />
      <polygon points="11,39 37,39 40,44 8,44" fill={fillColor} />
      <polygon points="14,35 34,35 37,39 11,39" fill={accentColor} />
      <polygon points="21,25 27,25 26,35 22,35" fill="#a7f3d0" />
    {:else if rank === "master"}
      <path d="M8 44h32v2.5H8z" fill="#4c1d95" />
      <path d="M10 41h28v3H10z" fill="url(#{gradientId}-gold)" />
      <path d="M13 37h22v4H13z" fill={fillColor} />
      <polygon
        points="21,25 27,25 26,37 22,37"
        fill="url(#{gradientId}-gold)"
      />
    {:else if rank === "eliteMaster"}
      <polygon points="7,44 41,44 38,47 10,47" fill="#450a0a" />
      <polygon points="10,39 38,39 41,44 7,44" fill={fillColor} />
      <polygon points="13,35 35,35 38,39 10,39" fill={accentColor} />
      <polygon points="20,25 28,25 26,35 22,35" fill="#fecaca" />
    {:else}
      <polygon points="6,44 42,44 39,47 9,47" fill="#78350f" />
      <polygon points="9,40 39,40 42,44 6,44" fill="url(#{gradientId}-gold)" />
      <polygon points="12,36 36,36 39,40 9,40" fill={fillColor} />
      <polygon points="20,24 28,24 26,36 22,36" fill="#fef08a" />
    {/if}
  </g>

  <!-- ================= CUP BOWL & TYPING CHAMPIONSHIP CORE (y: 1 to 29) ================= -->
  <g class="cup-chalice">
    {#if rank === "locked" || rank === "bronze"}
      <!-- BRONZE: Forged Championship Goblet with Sculpted Keycap Inlay -->
      <!-- Forged C-Handles -->
      <path
        d="M13 10.5 H7.5 A3 3 0 0 0 4.5 13.5 V16 C4.5 20.5 8 24 12.5 24 H13.5 V21 H12.5 C9.5 21 7.5 18.8 7.5 16 V13.8 C7.5 13.4 7.8 13 8.2 13 H13 V10.5 Z M35 10.5 H40.5 A3 3 0 0 1 43.5 13.5 V16 C43.5 20.5 40 24 35.5 24 H34.5 V21 H35.5 C38.5 21 40.5 18.8 40.5 16 V13.8 C40.5 13.4 40.2 13 39.8 13 H35 V10.5 Z"
        fill={isUnlocked ? fillColor : "#475569"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="0.6"
      />
      <!-- Main Chalice Bowl -->
      <path
        d="M12.5 7.5 H35.5 V17.5 C35.5 24.2 30.4 29 24 29 C17.6 29 12.5 24.2 12.5 17.5 V7.5 Z"
        fill={isUnlocked ? `url(#${gradientId}-body)` : "#64748b"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.3"
      />
      <rect
        x="10.5"
        y="5.2"
        width="27"
        height="3.2"
        rx="1.6"
        fill={isUnlocked ? accentColor : "#94a3b8"}
      />
      <!-- Sculpted Mechanical Keycap Emblem on Bowl -->
      <rect
        x="18.8"
        y="11.2"
        width="10.4"
        height="10.4"
        rx="2.4"
        fill="url(#{gradientId}-dark)"
        stroke={isUnlocked ? "#ffffff" : "#cbd5e1"}
        stroke-width="0.9"
      />
      <path
        d="M24 13.8 V19 M21.4 16.4 H26.6"
        stroke={isUnlocked ? accentColor : "#cbd5e1"}
        stroke-width="1.5"
        stroke-linecap="round"
      />
    {:else if rank === "silver"}
      <!-- SILVER: Machined Argentum Chalice with Winged Handles & Compass Key-Core -->
      <path
        d="M12 9.5 H5.5 C3.5 9.5 2 11 2 13 V16.5 C2 21.5 6 25 11.5 25 H13.5 V22 H11.5 C8 22 5 19.5 5 16.5 V13.2 C5 12.8 5.3 12.5 5.7 12.5 H12 V9.5 Z M36 9.5 H42.5 C44.5 9.5 46 11 46 13 V16.5 C46 21.5 42 25 36.5 25 H34.5 V22 H36.5 C40 22 43 19.5 43 16.5 V13.2 C43 12.8 42.7 12.5 42.3 12.5 H36 V9.5 Z"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <path
        d="M11.5 7.5 H36.5 V17.5 C36.5 24.5 31 29.2 24 29.2 C17 29.2 11.5 24.5 11.5 17.5 V7.5 Z"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.4"
      />
      <rect
        x="9.5"
        y="5"
        width="29"
        height="3.5"
        rx="1.75"
        fill="#ffffff"
        stroke={fillColor}
        stroke-width="0.8"
      />
      <!-- Silver Keycap Medallion -->
      <polygon
        points="24,10.5 30,16.5 24,22.5 18,16.5"
        fill="url(#{gradientId}-dark)"
        stroke="#ffffff"
        stroke-width="1.1"
      />
      <polygon
        points="24,12.5 28,16.5 24,20.5 20,16.5"
        fill="#ffffff"
        class="cup-bowl-gleam"
      />
    {:else if rank === "gold"}
      <!-- GOLD: Royal Golden Grand-Slam Chalice with Swan-Wing Handles & Crown Rim -->
      <!-- Filigree Wing Handles -->
      <path
        d="M12 8.5 C5 8.5 1.5 12.5 1.5 17 C1.5 23 7 26 13 26 V22.8 C9 22.8 5 20.5 5 17 C5 14 8 11.5 12 11.5 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="0.8"
      />
      <path
        d="M36 8.5 C43 8.5 46.5 12.5 46.5 17 C46.5 23 41 26 35 26 V22.8 C39 22.8 43 20.5 43 17 C43 14 40 11.5 36 11.5 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#78350f"
        stroke-width="0.8"
      />
      <!-- Fluted Golden Bowl -->
      <path
        d="M11.5 6.8 H36.5 V17.5 C36.5 24.8 31 29.5 24 29.5 C17 29.5 11.5 24.8 11.5 17.5 V6.8 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1.5"
      />
      <!-- Ornate Crowned Rim -->
      <polygon
        points="8.5,4.2 15,6 24,3.2 33,6 39.5,4.2 37.5,8 10.5,8"
        fill="#fef08a"
        stroke="#b45309"
        stroke-width="0.9"
      />
      <!-- Golden Keycap & Star Inlay -->
      <rect
        x="18"
        y="10.8"
        width="12"
        height="12"
        rx="2.8"
        fill="#78350f"
        stroke="#fef08a"
        stroke-width="1.1"
      />
      <polygon
        points="24,12.2 25.4,15.1 28.6,15.5 26.2,17.6 26.8,20.8 24,19.2 21.2,20.8 21.8,17.6 19.4,15.5 22.6,15.1"
        fill="#ffffff"
        class="cup-bowl-gleam"
      />
    {:else if rank === "platinum"}
      <!-- PLATINUM: Cryo-Crystal Polygon Chalice with Angular Laser Handles -->
      <polyline
        points="12.5,9.5 3,12.5 3,20.5 13.5,24.5"
        stroke={accentColor}
        stroke-width="2.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <polyline
        points="35.5,9.5 45,12.5 45,20.5 34.5,24.5"
        stroke={accentColor}
        stroke-width="2.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <polygon
        points="11.5,6.5 36.5,6.5 34.5,20.5 24,28.5 13.5,20.5"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <polygon
        points="16,8 32,8 30,19 24,24.5 18,19"
        fill="#0284c7"
        stroke="#e0f2fe"
        stroke-width="0.9"
      />
      <polygon
        points="8.5,4.2 39.5,4.2 37,7.5 11,7.5"
        fill="#ffffff"
        stroke="#0284c7"
        stroke-width="0.8"
      />
      <polygon
        points="24,10.5 27.5,16.5 24,22.5 20.5,16.5"
        fill="#ffffff"
        class="cup-bowl-gleam"
      />
    {:else if rank === "diamond"}
      <!-- DIAMOND: 16-Facet Brilliant Diamond Championship Cup -->
      <!-- Crystal Shard Wing Handles -->
      <polygon
        points="12,8.5 1,12.5 2.5,21.5 13,25.5 11,21 5.5,18 5.5,14.5 12,11.5"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="0.9"
      />
      <polygon
        points="36,8.5 47,12.5 45.5,21.5 35,25.5 37,21 42.5,18 42.5,14.5 36,11.5"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="0.9"
      />
      <!-- Faceted Diamond Bowl -->
      <polygon
        points="10.5,6 37.5,6 35,21 24,29 13,21"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <polygon
        points="17.5,7 30.5,7 28.5,19 24,25 19.5,19"
        fill="#cffafe"
        opacity="0.75"
      />
      <line
        x1="24"
        y1="6"
        x2="24"
        y2="29"
        stroke="#ffffff"
        stroke-width="1.1"
      />
      <!-- Spiked Diamond Rim -->
      <polygon
        points="8,3.2 13.5,6.5 24,2.8 34.5,6.5 40,3.2 37.5,7 10.5,7"
        fill="#ffffff"
        stroke="#06b6d4"
        stroke-width="0.8"
      />
      <!-- Diamond Keystroke Prism Core -->
      <polygon
        points="24,10.5 29.5,16.5 24,22.5 18.5,16.5"
        fill="#083344"
        stroke="#ffffff"
        stroke-width="1.1"
      />
      <polygon
        points="24,12.5 27.5,16.5 24,20.5 20.5,16.5"
        fill="#ffffff"
        class="cup-bowl-gleam"
      />
    {:else if rank === "heroic"}
      <!-- HEROIC: Blazing Phoenix War-Chalice with Roaring Flame-Wing Handles -->
      <!-- Phoenix Flame Wing Handles -->
      <path
        d="M12 8.5 C2 9.5 0 15.5 0.5 20.5 C1 25.5 6.5 28 13 26 C7.5 24.5 4 20.5 4 16.5 C4 13.5 7.5 11 12 11 Z"
        fill="url(#{gradientId}-body)"
        stroke="#fef08a"
        stroke-width="0.8"
      />
      <path
        d="M36 8.5 C46 9.5 48 15.5 47.5 20.5 C47 25.5 41.5 28 35 26 C40.5 24.5 44 20.5 44 16.5 C44 13.5 40.5 11 36 11 Z"
        fill="url(#{gradientId}-body)"
        stroke="#fef08a"
        stroke-width="0.8"
      />
      <!-- Volcanic Chalice Bowl -->
      <path
        d="M11 6 H37 V17.5 C37 25 31.2 29.5 24 29.5 C16.8 29.5 11 25 11 17.5 V6 Z"
        fill="url(#{gradientId}-body)"
        stroke="#fed7aa"
        stroke-width="1.6"
      />
      <!-- Blazing Phoenix Heart on Bowl -->
      <path
        d="M24 9.5 C28.5 14 29.5 19.5 24 25.5 C18.5 19.5 19.5 14 24 9.5 Z"
        fill="#fef08a"
        class="cup-bowl-gleam"
      />
      <path
        d="M24 13 C26.5 16 27 19.5 24 23 C21 19.5 21.5 16 24 13 Z"
        fill="#ffffff"
      />
      <!-- Flame Crown Rim -->
      <path
        d="M8.5 4 Q16 1.5 24 3.8 Q32 1.5 39.5 4 L37.5 7.5 H10.5 Z"
        fill="#fef08a"
        stroke="#ea580c"
        stroke-width="0.9"
      />
    {:else if rank === "eliteHeroic"}
      <!-- ELITE HEROIC: Cyber-Overclocked Esports Championship Cup with WPM Waveform -->
      <!-- Cyber Mecha Fin Handles -->
      <polygon
        points="12,8 0,12.5 2,22 13,26 11,21 5,18 4,13.5 12,11"
        fill="#10b981"
        stroke="#a7f3d0"
        stroke-width="0.9"
      />
      <polygon
        points="36,8 48,12.5 46,22 35,26 37,21 43,18 44,13.5 36,11"
        fill="#10b981"
        stroke="#a7f3d0"
        stroke-width="0.9"
      />
      <!-- Cyber Hex Bowl -->
      <polygon
        points="10.5,5.5 37.5,5.5 35.5,20.5 24,29 12.5,20.5"
        fill="url(#{gradientId}-body)"
        stroke="#a7f3d0"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <polygon
        points="14.5,8 33.5,8 32,19 24,25 16,19"
        fill="#022c22"
        stroke="#34d399"
        stroke-width="1"
      />
      <!-- Live WPM Telemetry Pulse on Cup Bowl -->
      <polyline
        points="16.5,16 20,16 21.8,11.5 24,20.5 26.2,13.5 28,16 31.5,16"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="cup-bowl-gleam"
      />
      <polygon
        points="8.5,3.5 39.5,3.5 37.5,7 10.5,7"
        fill="#6ee7b7"
        stroke="#064e3b"
        stroke-width="0.8"
      />
    {:else if rank === "master"}
      <!-- MASTER: Imperial Sovereign Emperor's Goblet with 5-Peak Crown Rim -->
      <!-- Grand Imperial Wing Handles -->
      <path
        d="M12 6.8 C1.5 8.5 -0.5 15.5 0 22 C0.5 27.5 6.5 29.5 13 26.5 C6.5 25.5 3.5 21.5 3.5 16.5 C3.5 12.5 8 9.8 12 9 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <path
        d="M36 6.8 C46.5 8.5 48.5 15.5 48 22 C47.5 27.5 41.5 29.5 35 26.5 C41.5 25.5 44.5 21.5 44.5 16.5 C44.5 12.5 40 9.8 36 9 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <!-- Royal Amethyst & Gold Chalice Bowl -->
      <path
        d="M10.5 5 H37.5 V17.5 C37.5 25.2 31.5 29.8 24 29.8 C16.5 29.8 10.5 25.2 10.5 17.5 V5 Z"
        fill="url(#{gradientId}-body)"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.8"
      />
      <!-- Golden Laurel & Amethyst Core -->
      <path
        d="M16.5 11 C14 16 15.5 22.5 24 25 C32.5 22.5 34 16 31.5 11"
        stroke="#fef08a"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <polygon
        points="24,11 27.5,16.5 24,22 20.5,16.5"
        fill="#ffffff"
        stroke="#7e22ce"
        stroke-width="1"
        class="cup-bowl-gleam"
      />
      <!-- Royal 5-Peak Crown Rim -->
      <polygon
        points="7.5,2.2 13,5.5 18,1.2 24,4.8 30,1.2 35,5.5 40.5,2.2 38,6.8 10,6.8"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.8"
      />
    {:else if rank === "eliteMaster"}
      <!-- ELITE MASTER: Abyssal Dragon-Lord War Goblet with Serrated Wyvern Handles -->
      <!-- Serrated Wyvern Wing Handles -->
      <polygon
        points="12,6.5 -0.5,11.5 3,17.5 -0.5,23.5 13,26.5 8,21.5 7,15.5 12,10.5"
        fill="#dc2626"
        stroke="#fca5a5"
        stroke-width="0.8"
      />
      <polygon
        points="36,6.5 48.5,11.5 45,17.5 48.5,23.5 35,26.5 40,21.5 41,15.5 36,10.5"
        fill="#dc2626"
        stroke="#fca5a5"
        stroke-width="0.8"
      />
      <!-- Spiked Obsidian & Blood-Ruby Bowl -->
      <polygon
        points="10,5 38,5 35.5,20.5 24,29 12.5,20.5"
        fill="url(#{gradientId}-body)"
        stroke="#fecaca"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <polygon
        points="15.5,7.5 32.5,7.5 30.5,19 24,24.5 17.5,19"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.1"
      />
      <!-- Dragon Slit-Eye Gem -->
      <polygon
        points="24,10.5 28,16.5 24,22.5 20,16.5"
        fill="#fef08a"
        class="cup-bowl-gleam"
      />
      <polygon points="24,12.5 25.5,16.5 24,20.5 22.5,16.5" fill="#ffffff" />
      <!-- Serrated Dragon Horn Rim -->
      <polygon
        points="6.5,1.5 12,5.5 18,0.5 24,4.5 30,0.5 36,5.5 41.5,1.5 38.5,6.8 9.5,6.8"
        fill="#dc2626"
        stroke="#fecaca"
        stroke-width="0.8"
      />
    {:else}
      <!-- GRANDMASTER: Supreme Celestial Holy Grail of Typing with Seraphic Wings -->
      <!-- Supreme Celestial Wing Handles -->
      <path
        d="M11 5.5 C-0.5 7.5 -2.5 15.5 -1 23.5 C0 29.5 6.5 31 13 27.5 C4.5 26.5 1.5 21.5 2.5 15.5 C3.5 10.5 7.5 8 11 8 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.9"
      />
      <path
        d="M37 5.5 C48.5 7.5 50.5 15.5 49 23.5 C48 29.5 41.5 31 35 27.5 C43.5 26.5 46.5 21.5 45.5 15.5 C44.5 10.5 40.5 8 37 8 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.9"
      />
      <!-- Divine Golden Grail Bowl -->
      <path
        d="M9.5 4 H38.5 V17.5 C38.5 25.8 32 30.2 24 30.2 C16 30.2 9.5 25.8 9.5 17.5 V4 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="2"
      />
      <!-- Inner Astral Sanctuary & Supernova Keycap Star -->
      <rect
        x="16.8"
        y="9.2"
        width="14.4"
        height="13.5"
        rx="3.2"
        fill="#701a75"
        stroke="#fef08a"
        stroke-width="1.2"
      />
      <polygon
        points="24,10.2 26,14.5 30.5,16 26,17.5 24,21.8 22,17.5 17.5,16 22,14.5"
        fill="#ffffff"
        class="cup-bowl-gleam"
      />
      <circle
        cx="24"
        cy="16"
        r="2"
        fill="#e11d48"
        stroke="#fef08a"
        stroke-width="0.7"
      />
      <!-- Supreme Radiant Crown Rim with Pearl Finials -->
      <polygon
        points="5.5,0.8 11.5,4.8 18,0 24,3.8 30,0 36.5,4.8 42.5,0.8 39.5,6 8.5,6"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.9"
      />
      <circle cx="18" cy="0" r="1.4" fill="#ffffff" />
      <circle cx="30" cy="0" r="1.4" fill="#ffffff" />
    {/if}
  </g>
</svg>

<style>
  .cup-svg.is-unlocked .cup-chalice {
    transform-origin: 24px 18px;
    animation: cup-float 3.4s ease-in-out infinite;
  }

  .cup-svg.is-unlocked .cup-bowl-gleam {
    transform-origin: 24px 16.5px;
    animation: cup-gleam 2.4s ease-in-out infinite;
  }

  @keyframes cup-float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-1.2px);
    }
  }

  @keyframes cup-gleam {
    0%, 100% {
      opacity: 0.86;
      transform: scale(0.95);
    }
    50% {
      opacity: 1;
      transform: scale(1.07);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cup-chalice,
    .cup-bowl-gleam {
      animation: none !important;
    }
  }
</style>
