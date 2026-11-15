<script lang="ts">
  import { getTierMeta } from "@/core/achievements/tier-system";

  let {
    fillColor = "currentColor",
    accentColor = "#ffffff",
    gradientId = "wreath-grad",
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
  class="wreath-svg rank-{rank} {isUnlocked
    ? 'is-unlocked'
    : 'is-locked'} {className}"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="{gradientId}-body" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color={accentColor} />
      <stop offset="55%" stop-color={fillColor} />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.85" />
    </linearGradient>
    <linearGradient id="{gradientId}-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.92" />
      <stop offset="35%" stop-color={accentColor} />
      <stop offset="100%" stop-color={fillColor} />
    </linearGradient>
    <linearGradient id="{gradientId}-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="28%" stop-color="#fef08a" />
      <stop offset="68%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#a16207" />
    </linearGradient>
    <linearGradient id="{gradientId}-keycap" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
  </defs>

  {#if rank === "locked" || rank === "bronze"}
    <!-- BRONZE: Forged Olive Wreath cradling a Sculpted Mechanical Keycap Core -->
    <g class="wreath-branches">
      <!-- Left & Right Forged Stems -->
      <path
        d="M16 37 C7 30 6 16 14 7"
        stroke={isUnlocked ? `url(#${gradientId}-leaf)` : "#64748b"}
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <path
        d="M32 37 C41 30 42 16 34 7"
        stroke={isUnlocked ? `url(#${gradientId}-leaf)` : "#64748b"}
        stroke-width="2.4"
        stroke-linecap="round"
      />
      <!-- Chiseled Olive Leaves (Left) -->
      <g
        fill={isUnlocked ? `url(#${gradientId}-leaf)` : "#475569"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="0.55"
      >
        <path d="M12 10 C7 10 5 14 9 16 C12 16 14 13 12 10 Z" />
        <path d="M9 17 C4 18 3 23 8 24 C11 24 12 20 9 17 Z" />
        <path d="M9 25 C4 27 5 32 10 32 C13 31 12 27 9 25 Z" />
        <path
          d="M14 14 C16 11 19 12 17 16 C15 17 13 16 14 14 Z"
          opacity="0.85"
        />
        <path
          d="M12 22 C14 19 17 20 15 24 C13 25 11 24 12 22 Z"
          opacity="0.85"
        />
      </g>
      <!-- Chiseled Olive Leaves (Right) -->
      <g
        fill={isUnlocked ? `url(#${gradientId}-leaf)` : "#475569"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="0.55"
      >
        <path d="M36 10 C41 10 43 14 39 16 C36 16 34 13 36 10 Z" />
        <path d="M39 17 C44 18 45 23 40 24 C37 24 36 20 39 17 Z" />
        <path d="M39 25 C44 27 43 32 38 32 C35 31 36 27 39 25 Z" />
        <path
          d="M34 14 C32 11 29 12 31 16 C33 17 35 16 34 14 Z"
          opacity="0.85"
        />
        <path
          d="M36 22 C34 19 31 20 33 24 C35 25 37 24 36 22 Z"
          opacity="0.85"
        />
      </g>
    </g>
    <!-- Center Mechanical Keycap Emblem -->
    <g class="wreath-core">
      <rect
        x="16.5"
        y="14.5"
        width="15"
        height="15"
        rx="3.5"
        fill={isUnlocked ? `url(#${gradientId}-body)` : "#475569"}
        stroke={isUnlocked ? accentColor : "#94a3b8"}
        stroke-width="1.2"
      />
      <rect
        x="18.8"
        y="16.5"
        width="10.4"
        height="10"
        rx="2"
        fill="url(#{gradientId}-keycap)"
        stroke={isUnlocked ? accentColor : "#cbd5e1"}
        stroke-width="0.7"
      />
      <!-- Typing Homing Bar & Prompt -->
      <path
        d="M21.5 20.5 L23.5 22 L21.5 23.5"
        stroke={isUnlocked ? accentColor : "#cbd5e1"}
        stroke-width="1.3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <line
        x1="24.5"
        y1="23.5"
        x2="26.8"
        y2="23.5"
        stroke={isUnlocked ? "#ffffff" : "#cbd5e1"}
        stroke-width="1.3"
        stroke-linecap="round"
      />
    </g>
  {:else if rank === "silver"}
    <!-- SILVER: Classical Argentum Laurel with Tactile Switch Stem & Winged Ribbon -->
    <g class="wreath-branches">
      <path
        d="M15 38 C5 30 5 15 15 6"
        stroke={accentColor}
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <path
        d="M33 38 C43 30 43 15 33 6"
        stroke={accentColor}
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <!-- Faceted Blade Leaves -->
      <g fill="url(#{gradientId}-leaf)" stroke="#ffffff" stroke-width="0.65">
        <polygon points="14,6 7,9 10,14 15,11" />
        <polygon points="10,13 3,17 7,22 13,18" />
        <polygon points="9,21 3,26 8,31 13,26" />
        <polygon points="11,29 7,35 13,37 16,32" />
        <polygon points="34,6 41,9 38,14 33,11" />
        <polygon points="38,13 45,17 41,22 35,18" />
        <polygon points="39,21 45,26 40,31 35,26" />
        <polygon points="37,29 41,35 35,37 32,32" />
      </g>
      <!-- Silver Berries -->
      <circle
        cx="15"
        cy="14"
        r="1.5"
        fill="#ffffff"
        stroke={fillColor}
        stroke-width="0.6"
      />
      <circle
        cx="13"
        cy="22"
        r="1.5"
        fill="#ffffff"
        stroke={fillColor}
        stroke-width="0.6"
      />
      <circle
        cx="33"
        cy="14"
        r="1.5"
        fill="#ffffff"
        stroke={fillColor}
        stroke-width="0.6"
      />
      <circle
        cx="35"
        cy="22"
        r="1.5"
        fill="#ffffff"
        stroke={fillColor}
        stroke-width="0.6"
      />
    </g>
    <!-- Center Tactile Switch Medallion -->
    <g class="wreath-core">
      <polygon
        points="24,12 32,16.5 32,25.5 24,30 16,25.5 16,16.5"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.3"
      />
      <rect
        x="19"
        y="16"
        width="10"
        height="10"
        rx="2"
        fill="url(#{gradientId}-keycap)"
        stroke={accentColor}
        stroke-width="0.8"
      />
      <!-- Mechanical Switch Cross Stem -->
      <path
        d="M24 18.2 V23.8 M21.2 21 H26.8"
        stroke="#ffffff"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </g>
  {:else if rank === "gold"}
    <!-- GOLD: Olympian Victory Laurel with Winged Golden Keycap & Crown Finial -->
    <g class="wreath-branches">
      <path
        d="M15 39 C4 31 3 14 15 4"
        stroke="url(#{gradientId}-gold)"
        stroke-width="2.8"
        stroke-linecap="round"
      />
      <path
        d="M33 39 C44 31 45 14 33 4"
        stroke="url(#{gradientId}-gold)"
        stroke-width="2.8"
        stroke-linecap="round"
      />
      <!-- Layered Golden Feather-Leaves -->
      <g fill="url(#{gradientId}-gold)" stroke="#78350f" stroke-width="0.65">
        <path d="M15 4 C8 5 5 10 11 13 C14 12 16 8 15 4 Z" />
        <path d="M11 11 C4 13 2 19 9 21 C12 20 14 15 11 11 Z" />
        <path d="M9 19 C2 22 2 28 9 29 C12 28 13 23 9 19 Z" />
        <path d="M11 27 C5 31 7 37 14 36 C16 34 15 30 11 27 Z" />
        <path d="M33 4 C40 5 43 10 37 13 C34 12 32 8 33 4 Z" />
        <path d="M37 11 C44 13 46 19 39 21 C36 20 34 15 37 11 Z" />
        <path d="M39 19 C46 22 46 28 39 29 C36 28 35 23 39 19 Z" />
        <path d="M37 27 C43 31 41 37 34 36 C32 34 33 30 37 27 Z" />
      </g>
      <!-- Glowing Golden Berries -->
      <circle
        cx="15"
        cy="12"
        r="1.7"
        fill="#ffffff"
        stroke="#b45309"
        stroke-width="0.6"
      />
      <circle
        cx="13"
        cy="20"
        r="1.7"
        fill="#fef08a"
        stroke="#b45309"
        stroke-width="0.6"
      />
      <circle
        cx="33"
        cy="12"
        r="1.7"
        fill="#ffffff"
        stroke="#b45309"
        stroke-width="0.6"
      />
      <circle
        cx="35"
        cy="20"
        r="1.7"
        fill="#fef08a"
        stroke="#b45309"
        stroke-width="0.6"
      />
    </g>
    <!-- Center Golden Keycap & Star Crest -->
    <g class="wreath-core">
      <circle
        cx="24"
        cy="21"
        r="9.5"
        fill="#78350f"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.5"
      />
      <rect
        x="17.8"
        y="14.8"
        width="12.4"
        height="12.4"
        rx="3"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1"
      />
      <rect
        x="19.6"
        y="16.4"
        width="8.8"
        height="8.4"
        rx="1.8"
        fill="#451a03"
      />
      <polygon
        points="24,17.2 25.2,19.7 28,20 25.9,21.8 26.5,24.5 24,23 21.5,24.5 22.1,21.8 20,20 22.8,19.7"
        fill="#fef08a"
      />
    </g>
  {:else if rank === "platinum"}
    <!-- PLATINUM: Cryo-Blade Crystalline Laurel with Laser Key-Core -->
    <g class="wreath-branches">
      <!-- Outer Frost Blades -->
      <polygon
        points="14,5 6,11 9,15 3,21 8,25 5,32 14,38 12,31 15,24 12,17 16,10"
        fill="#0369a1"
        stroke={accentColor}
        stroke-width="0.8"
      />
      <polygon
        points="34,5 42,11 39,15 45,21 40,25 43,32 34,38 36,31 33,24 36,17 32,10"
        fill="#0369a1"
        stroke={accentColor}
        stroke-width="0.8"
      />
      <!-- Inner Faceted Shards -->
      <g fill="url(#{gradientId}-leaf)" stroke="#ffffff" stroke-width="0.75">
        <polygon points="15,4 7,9 12,13 17,8" />
        <polygon points="12,12 4,18 10,22 15,16" />
        <polygon points="11,20 4,27 11,30 15,24" />
        <polygon points="13,28 8,35 16,37 17,31" />
        <polygon points="33,4 41,9 36,13 31,8" />
        <polygon points="36,12 44,18 38,22 33,16" />
        <polygon points="37,20 44,27 37,30 33,24" />
        <polygon points="35,28 40,35 32,37 31,31" />
      </g>
    </g>
    <!-- Center Octagonal Cryo-Keycap -->
    <g class="wreath-core">
      <polygon
        points="20,12 28,12 33,17 33,25 28,30 20,30 15,25 15,17"
        fill="url(#{gradientId}-body)"
        stroke="#ffffff"
        stroke-width="1.3"
      />
      <polygon
        points="21,14.5 27,14.5 30.5,18 30.5,24 27,27.5 21,27.5 17.5,24 17.5,18"
        fill="url(#{gradientId}-keycap)"
        stroke={accentColor}
        stroke-width="0.8"
      />
      <polygon
        points="24,15.5 26,19.5 30,21 26,22.5 24,26.5 22,22.5 18,21 22,19.5"
        fill="#ffffff"
      />
      <circle cx="24" cy="21" r="1.8" fill={accentColor} />
    </g>
  {:else if rank === "diamond"}
    <!-- DIAMOND: Prismatic Diamond-Cluster Wreath & Refracting Key-Prism -->
    <circle
      cx="24"
      cy="21"
      r="16.5"
      stroke={accentColor}
      stroke-width="1.2"
      stroke-dasharray="4 2.5"
      opacity="0.7"
      class="wreath-ring-spin"
    />
    <g class="wreath-branches">
      <!-- Left & Right Prismatic Gem Clusters -->
      {#each [25, 58, 92, 126, 155] as angle (angle)}
        <polygon
          points="24,3 26.6,7.2 24,11.2 21.4,7.2"
          transform="rotate({-angle} 24 21)"
          fill="url(#{gradientId}-leaf)"
          stroke="#ffffff"
          stroke-width="0.8"
        />
        <polygon
          points="24,3 26.6,7.2 24,11.2 21.4,7.2"
          transform="rotate({angle} 24 21)"
          fill="url(#{gradientId}-leaf)"
          stroke="#ffffff"
          stroke-width="0.8"
        />
      {/each}
    </g>
    <!-- Center Brilliant Diamond Key-Core -->
    <g class="wreath-core">
      <polygon
        points="24,10.5 33.5,16 33.5,26 24,31.5 14.5,26 14.5,16"
        fill="#0891b2"
        stroke="#ffffff"
        stroke-width="1.5"
      />
      <polygon
        points="24,12.5 31,17 31,25 24,29.5 17,25 17,17"
        fill="url(#{gradientId}-leaf)"
      />
      <rect
        x="19.5"
        y="16.5"
        width="9"
        height="9"
        rx="2"
        fill="#083344"
        stroke="#cffafe"
        stroke-width="0.9"
      />
      <!-- Typing Lightning Caret inside Diamond Keycap -->
      <polygon
        points="24.8,17.5 21.5,21.5 24,21.5 23.2,24.8 26.5,20.8 24,20.8"
        fill="#ffffff"
      />
    </g>
  {:else if rank === "heroic"}
    <!-- HEROIC: Valkyrie Blazing Phoenix-Fire Wreath & Molten Key-Core -->
    <g class="wreath-branches">
      <!-- Outer Roaring Flame Arcs -->
      <path
        d="M15 39 C2 31 1 14 13 3 C10 10 13 15 16 19 C11 16 8 22 13 27 C10 27 11 33 16 36 Z"
        fill="#9a3412"
        stroke="#f97316"
        stroke-width="1"
      />
      <path
        d="M33 39 C46 31 47 14 35 3 C38 10 35 15 32 19 C37 16 40 22 35 27 C38 27 37 33 32 36 Z"
        fill="#9a3412"
        stroke="#f97316"
        stroke-width="1"
      />
      <!-- Inner Blazing Feather-Tongues -->
      <g fill="url(#{gradientId}-leaf)" stroke="#fef08a" stroke-width="0.7">
        <path d="M14 5 C7 9 6 15 12 18 C14 14 15 10 14 5 Z" />
        <path d="M10 14 C4 19 5 26 12 27 C13 23 13 18 10 14 Z" />
        <path d="M11 24 C6 29 9 35 16 35 C16 31 14 27 11 24 Z" />
        <path d="M34 5 C41 9 42 15 36 18 C34 14 33 10 34 5 Z" />
        <path d="M38 14 C44 19 43 26 36 27 C35 23 35 18 38 14 Z" />
        <path d="M37 24 C42 29 39 35 32 35 C32 31 34 27 37 24 Z" />
      </g>
    </g>
    <!-- Center Molten Keycap Core -->
    <g class="wreath-core">
      <polygon
        points="24,10 33,15.5 33,26.5 24,32 15,26.5 15,15.5"
        fill="#7c2d12"
        stroke="#fed7aa"
        stroke-width="1.5"
      />
      <rect
        x="18.2"
        y="15.2"
        width="11.6"
        height="11.6"
        rx="2.8"
        fill="url(#{gradientId}-body)"
        stroke="#fef08a"
        stroke-width="1"
      />
      <path
        d="M24 16.5 C27 19.5 27.5 22.5 24 25.5 C20.5 22.5 21 19.5 24 16.5 Z"
        fill="#fef08a"
      />
      <circle cx="24" cy="22" r="2" fill="#ffffff" />
    </g>
  {:else if rank === "eliteHeroic"}
    <!-- ELITE HEROIC: Cybernetic Overclocked Laurel with Circuit Leaves & Holo-Keycap -->
    <circle
      cx="24"
      cy="21"
      r="17.5"
      stroke="#10b981"
      stroke-width="1.2"
      stroke-dasharray="6 2 1.5 2"
      opacity="0.8"
      class="wreath-ring-spin"
    />
    <g class="wreath-branches">
      <!-- Left & Right Mecha Cyber-Blades -->
      <g fill="url(#{gradientId}-leaf)" stroke="#a7f3d0" stroke-width="0.8">
        <polygon points="15,3 6,8 8,13 15,9" />
        <polygon points="11,11 2,17 5,22 13,17" />
        <polygon points="10,20 2,27 7,32 14,26" />
        <polygon points="12,28 7,35 14,38 17,32" />
        <polygon points="33,3 42,8 40,13 33,9" />
        <polygon points="37,11 46,17 43,22 35,17" />
        <polygon points="38,20 46,27 41,32 34,26" />
        <polygon points="36,28 41,35 34,38 31,32" />
      </g>
      <!-- Neon Data Nodes -->
      {#each [[14, 9], [11, 17], [12, 26], [34, 9], [37, 17], [36, 26]] as [cx, cy], idx (idx)}
        <circle
          {cx}
          {cy}
          r="1.5"
          fill="#ffffff"
          stroke="#059669"
          stroke-width="0.7"
        />
      {/each}
    </g>
    <!-- Center Holo-Terminal Keycap Core -->
    <g class="wreath-core">
      <polygon
        points="24,10.5 33.5,16 33.5,26 24,31.5 14.5,26 14.5,16"
        fill="#064e3b"
        stroke="#6ee7b7"
        stroke-width="1.5"
      />
      <rect
        x="18"
        y="15"
        width="12"
        height="12"
        rx="2.5"
        fill="url(#{gradientId}-keycap)"
        stroke="#34d399"
        stroke-width="1"
      />
      <!-- WPM Pulse Waveform inside Keycap -->
      <polyline
        points="19.5,21 21.8,21 23,17.8 24.8,24.2 26.2,21 28.5,21"
        stroke="#ffffff"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  {:else if rank === "master"}
    <!-- MASTER: Imperial Sovereign Acanthus Wreath with Royal Amethyst Key-Throne -->
    <g class="wreath-branches">
      <!-- Royal Purple & Gold Filigree Branches -->
      <path
        d="M15 39 C1 30 0 12 14 2 C10 11 15 17 17 22 C11 26 12 33 17 36 Z"
        fill="#4c1d95"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.4"
      />
      <path
        d="M33 39 C47 30 48 12 34 2 C38 11 33 17 31 22 C37 26 36 33 31 36 Z"
        fill="#4c1d95"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.4"
      />
      <!-- Golden Imperial Leaves -->
      <g fill="url(#{gradientId}-gold)" stroke="#ffffff" stroke-width="0.6">
        <polygon points="14,3 5,9 11,13 16,8" />
        <polygon points="10,12 2,19 9,23 15,17" />
        <polygon points="10,21 3,29 11,32 16,25" />
        <polygon points="34,3 43,9 37,13 32,8" />
        <polygon points="38,12 46,19 39,23 33,17" />
        <polygon points="38,21 45,29 37,32 32,25" />
      </g>
    </g>
    <!-- Center Sovereign Crowned Keycap Medallion -->
    <g class="wreath-core">
      <circle
        cx="24"
        cy="21"
        r="10.5"
        fill="#3b0764"
        stroke="url(#{gradientId}-gold)"
        stroke-width="1.8"
      />
      <rect
        x="17.5"
        y="15"
        width="13"
        height="12.5"
        rx="3"
        fill="url(#{gradientId}-body)"
        stroke="#fef08a"
        stroke-width="1"
      />
      <!-- Mini Sovereign Crown inside Keycap -->
      <path
        d="M19.5 24 L18.5 18.5 L21.5 20.8 L24 16.8 L26.5 20.8 L29.5 18.5 L28.5 24 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="0.7"
      />
      <circle cx="24" cy="16" r="1.2" fill="#ffffff" />
    </g>
  {:else if rank === "eliteMaster"}
    <!-- ELITE MASTER: Abyssal Dragon-Thorn War Wreath & Bloodstone Key-Core -->
    <g class="wreath-branches">
      <!-- Serrated Obsidian & Crimson Horns -->
      <path
        d="M15 40 C0 31 -1 13 13 1 C9 10 15 16 17 22 C10 26 11 33 17 37 Z"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.5"
      />
      <path
        d="M33 40 C48 31 49 13 35 1 C39 10 33 16 31 22 C38 26 37 33 31 37 Z"
        fill="#450a0a"
        stroke="#ef4444"
        stroke-width="1.5"
      />
      <!-- Razor Crimson Dragon Scales -->
      <g fill="url(#{gradientId}-leaf)" stroke="#fecaca" stroke-width="0.65">
        <polygon points="13,2 3,8 10,12 16,7" />
        <polygon points="9,11 0,18 8,22 14,16" />
        <polygon points="9,20 1,28 10,31 15,24" />
        <polygon points="35,2 45,8 38,12 32,7" />
        <polygon points="39,11 48,18 40,22 34,16" />
        <polygon points="39,20 47,28 38,31 33,24" />
      </g>
    </g>
    <!-- Center Dragon-Eye Keycap Core -->
    <g class="wreath-core">
      <polygon
        points="24,9.5 34,15.5 34,26.5 24,32.5 14,26.5 14,15.5"
        fill="#450a0a"
        stroke="#fca5a5"
        stroke-width="1.6"
      />
      <polygon
        points="24,12 31.5,16.5 31.5,25.5 24,30 16.5,25.5 16.5,16.5"
        fill="#991b1b"
        stroke="#ef4444"
        stroke-width="1"
      />
      <!-- Slit Dragon Eye + Keystroke Bolt -->
      <path
        d="M18 21 Q24 15.5 30 21 Q24 26.5 18 21 Z"
        fill="#fef08a"
        stroke="#ffffff"
        stroke-width="0.8"
      />
      <polygon points="24,16.5 25.6,21 24,25.5 22.4,21" fill="#dc2626" />
      <circle cx="24" cy="21" r="1.3" fill="#ffffff" />
    </g>
  {:else}
    <!-- GRANDMASTER: Supreme Celestial Seraphim Sun-Wreath & Divine Supernova Key-Throne -->
    <!-- Rotating 16-Point Celestial Solar Rays -->
    <g class="wreath-ring-spin">
      {#each Array(12) as _, i (i)}
        <line
          x1="24"
          y1="2.5"
          x2="24"
          y2="0"
          transform="rotate({i * 30} 24 21)"
          stroke="url(#{gradientId}-gold)"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      {/each}
    </g>
    <g class="wreath-branches">
      <!-- Heavenly Golden Feather-Laurels -->
      <path
        d="M15 39 C-1 29 -1 11 14 1 C10 10 15 16 17 22 C11 27 12 34 17 37 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1.3"
      />
      <path
        d="M33 39 C49 29 49 11 34 1 C38 10 33 16 31 22 C37 27 36 34 31 37 Z"
        fill="url(#{gradientId}-gold)"
        stroke="#ffffff"
        stroke-width="1.3"
      />
      <g fill="#ffffff" stroke="#f59e0b" stroke-width="0.6">
        <polygon points="14,2 4,8 10,12 16,7" />
        <polygon points="10,11 1,18 8,22 14,16" />
        <polygon points="10,20 2,28 10,31 15,24" />
        <polygon points="34,2 44,8 38,12 32,7" />
        <polygon points="38,11 47,18 40,22 34,16" />
        <polygon points="38,20 46,28 38,31 33,24" />
      </g>
    </g>
    <!-- Center Divine Supernova Key-Throne -->
    <g class="wreath-core">
      <circle
        cx="24"
        cy="21"
        r="11"
        fill="#701a75"
        stroke="#ffffff"
        stroke-width="1.8"
      />
      <rect
        x="16.8"
        y="13.8"
        width="14.4"
        height="14.4"
        rx="3.5"
        fill="url(#{gradientId}-gold)"
        stroke="#fef08a"
        stroke-width="1.1"
      />
      <rect
        x="18.8"
        y="15.8"
        width="10.4"
        height="10.4"
        rx="2.2"
        fill="#4a044e"
        stroke="#f59e0b"
        stroke-width="0.8"
      />
      <!-- 8-Point Supernova Star inside Keycap -->
      <polygon
        points="24,15.2 25.6,19.4 29.8,21 25.6,22.6 24,26.8 22.4,22.6 18.2,21 22.4,19.4"
        fill="#ffffff"
      />
      <circle cx="24" cy="21" r="2.2" fill="#fef08a" />
    </g>
  {/if}
</svg>

<style>
  .wreath-svg.is-unlocked .wreath-branches {
    transform-origin: 24px 24px;
    animation: wreath-breathe 3.6s ease-in-out infinite;
  }

  .wreath-svg.is-unlocked .wreath-core {
    transform-origin: 24px 21px;
    animation: wreath-core-pulse 3s ease-in-out infinite;
  }

  .wreath-ring-spin {
    transform-origin: 24px 21px;
    animation: wreath-spin 20s linear infinite;
  }

  @keyframes wreath-breathe {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.025);
    }
  }

  @keyframes wreath-core-pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.04);
    }
  }

  @keyframes wreath-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .wreath-branches,
    .wreath-core,
    .wreath-ring-spin {
      animation: none !important;
    }
  }
</style>
