<script lang="ts">
  import type { TierMeta } from "@/core/achievements/tier-system";

  interface Props {
    meta: TierMeta;
    gradientId: string;
    isUnlocked: boolean;
    layer: "background" | "foreground";
  }

  let { meta, gradientId, isUnlocked, layer }: Props = $props();

  const rank = $derived(meta.name);
  const stars = $derived(meta.starCount);
</script>

{#if !isUnlocked || rank === "locked"}
  <!-- Locked state: subtle tactical keycap silhouette frame in background only -->
  {#if layer === "background"}
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="absolute inset-0 w-full h-full pointer-events-none overflow-visible opacity-35"
      aria-hidden="true"
    >
      <rect
        x="7"
        y="7"
        width="34"
        height="34"
        rx="7"
        stroke="#475569"
        stroke-width="1"
        stroke-dasharray="3 3"
      />
    </svg>
  {/if}
{:else if layer === "background"}
  <!-- BACKGROUND LAYER: Esports Rank Wings, Tactical Keycap Chassis, Halos & Sunbursts -->
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="rank-fx-bg absolute inset-0 w-full h-full pointer-events-none overflow-visible rank-fx-{rank}"
    aria-hidden="true"
  >
    <defs>
      <!-- Lightweight Wing Gradients (Zero heavy filter blur for 120fps performance) -->
      <linearGradient
        id="{gradientId}-wing-l"
        x1="100%"
        y1="100%"
        x2="0%"
        y2="0%"
      >
        <stop offset="0%" stop-color={meta.fillColor} stop-opacity="0.95" />
        <stop offset="65%" stop-color={meta.accentColor} stop-opacity="0.95" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.9" />
      </linearGradient>
      <linearGradient
        id="{gradientId}-wing-r"
        x1="0%"
        y1="100%"
        x2="100%"
        y2="0%"
      >
        <stop offset="0%" stop-color={meta.fillColor} stop-opacity="0.95" />
        <stop offset="65%" stop-color={meta.accentColor} stop-opacity="0.95" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.9" />
      </linearGradient>
      <linearGradient
        id="{gradientId}-gold-wing"
        x1="0%"
        y1="100%"
        x2="100%"
        y2="0%"
      >
        <stop offset="0%" stop-color="#92400e" />
        <stop offset="50%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#fef08a" />
      </linearGradient>
      <radialGradient id="{gradientId}-halo-rad" cx="50%" cy="46%" r="50%">
        <stop offset="0%" stop-color={meta.accentColor} stop-opacity="0.28" />
        <stop offset="65%" stop-color={meta.fillColor} stop-opacity="0.14" />
        <stop offset="100%" stop-color={meta.fillColor} stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- 0. BRONZE: Forged Mechanical Keycap Bezel Brackets -->
    {#if rank === "bronze"}
      <g
        opacity="0.55"
        stroke={meta.accentColor}
        stroke-width="1"
        stroke-linecap="round"
      >
        <path d="M9 14 V10 A2 2 0 0 1 11 8 H15" />
        <path d="M39 14 V10 A2 2 0 0 0 37 8 H33" />
        <path d="M9 30 V34 A2 2 0 0 0 11 36 H15" />
        <path d="M39 30 V34 A2 2 0 0 1 37 36 H33" />
      </g>
    {/if}

    <!-- 1. SILVER: Machined WPM Tachometer Ring & Precision Corner Ticks -->
    {#if rank === "silver"}
      <circle
        cx="24"
        cy="21"
        r="17.5"
        stroke={meta.accentColor}
        stroke-width="0.9"
        stroke-dasharray="4 2 1 2"
        opacity="0.45"
        class="fx-orbit-slow"
      />
      <g
        stroke={meta.accentColor}
        stroke-width="1.1"
        stroke-linecap="round"
        opacity="0.65"
      >
        <line x1="6" y1="21" x2="3.5" y2="21" />
        <line x1="42" y1="21" x2="44.5" y2="21" />
        <line x1="24" y1="3" x2="24" y2="1" />
      </g>
    {/if}

    <!-- 2. GOLD: Radiant Golden Sun-Compass Ring & Mini Wing Chevrons -->
    {#if rank === "gold"}
      <circle
        cx="24"
        cy="21"
        r="19"
        fill="url(#{gradientId}-halo-rad)"
        class="fx-aura-breathe"
      />
      <circle
        cx="24"
        cy="21"
        r="17.5"
        stroke={meta.accentColor}
        stroke-width="1"
        stroke-dasharray="3 2"
        opacity="0.65"
        class="fx-orbit-slow"
      />
      <!-- Golden Side Speed Chevrons -->
      <g class="fx-wings-subtle">
        <polygon
          points="8,16 2,13 5,20 1,22 7,25"
          fill="url(#{gradientId}-gold-wing)"
          opacity="0.85"
        />
        <polygon
          points="40,16 46,13 43,20 47,22 41,25"
          fill="url(#{gradientId}-gold-wing)"
          opacity="0.85"
        />
      </g>
    {/if}

    <!-- 3. PLATINUM: Cryo-Blade Winglet Frame & Laser-Etched Octagon Ring -->
    {#if rank === "platinum"}
      <circle
        cx="24"
        cy="21"
        r="19.5"
        fill="url(#{gradientId}-halo-rad)"
        class="fx-aura-breathe"
      />
      <polygon
        points="24,2 37.5,7.5 43,21 37.5,34.5 24,40 10.5,34.5 5,21 10.5,7.5"
        stroke={meta.accentColor}
        stroke-width="1"
        opacity="0.55"
        class="fx-orbit-slow"
      />
      <!-- Cryo Wing Blades -->
      <g class="fx-wings-float">
        <polygon
          points="11,25 1,17 5,15 0,9 9,13 13,18"
          fill="url(#{gradientId}-wing-l)"
        />
        <polygon
          points="37,25 47,17 43,15 48,9 39,13 35,18"
          fill="url(#{gradientId}-wing-r)"
        />
      </g>
    {/if}

    <!-- 4. DIAMOND: Prismatic Refraction Halo, Dual Crystal Wings & Floating Shards -->
    {#if rank === "diamond"}
      <circle
        cx="24"
        cy="21"
        r="21"
        fill="url(#{gradientId}-halo-rad)"
        class="fx-aura-breathe"
      />
      <polygon
        points="24,2 38,8 44,21 38,34 24,40 10,34 4,21 10,8"
        fill="url(#{gradientId}-halo-rad)"
        stroke={meta.accentColor}
        stroke-width="1.2"
        opacity="0.7"
      />
      <circle
        cx="24"
        cy="21"
        r="16.5"
        stroke="#ffffff"
        stroke-width="0.9"
        stroke-dasharray="1.5 3"
        opacity="0.7"
        class="fx-orbit-reverse"
      />
      <!-- Prismatic Crystal Wings -->
      <g class="fx-wings-float">
        <polygon
          points="12,26 1,19 6,16 0,10 8,11 4,4 12,11 14,19"
          fill="url(#{gradientId}-wing-l)"
          stroke="#ffffff"
          stroke-width="0.5"
        />
        <polygon
          points="36,26 47,19 42,16 48,10 40,11 44,4 36,11 34,19"
          fill="url(#{gradientId}-wing-r)"
          stroke="#ffffff"
          stroke-width="0.5"
        />
      </g>
    {/if}

    <!-- 5. HEROIC: Blazing Phoenix Battle-Wings, Molten Rune Halo & Rising Embers -->
    {#if rank === "heroic"}
      <circle
        cx="24"
        cy="21"
        r="21.5"
        fill="url(#{gradientId}-halo-rad)"
        class="fx-aura-breathe"
      />
      <circle
        cx="24"
        cy="21"
        r="18"
        stroke={meta.accentColor}
        stroke-width="1.2"
        stroke-dasharray="5 2"
        opacity="0.7"
        class="fx-orbit-slow"
      />

      <!-- Left Blazing Phoenix Wing -->
      <g class="fx-wings-flap-l">
        <path
          d="M 14 28 C 7 27, 2 21, 0.5 13 C 2.5 14, 5 16, 7.5 19 C 3 13, 1 6, 3 1 C 6 5, 9 10, 12 14 C 9 8, 9 3, 12 0 C 13 5, 14 11, 15 17 Z"
          fill="url(#{gradientId}-wing-l)"
        />
        <path
          d="M 14 24 C 9 22, 5 16, 4 9 C 7 12, 10 15, 14 18 Z"
          fill="#fef08a"
          opacity="0.85"
        />
      </g>

      <!-- Right Blazing Phoenix Wing -->
      <g class="fx-wings-flap-r">
        <path
          d="M 34 28 C 41 27, 46 21, 47.5 13 C 45.5 14, 43 16, 40.5 19 C 45 13, 47 6, 45 1 C 42 5, 39 10, 36 14 C 39 8, 39 3, 36 0 C 35 5, 34 11, 33 17 Z"
          fill="url(#{gradientId}-wing-r)"
        />
        <path
          d="M 34 24 C 39 22, 43 16, 44 9 C 41 12, 38 15, 34 18 Z"
          fill="#fef08a"
          opacity="0.85"
        />
      </g>

      <!-- Rising Flame Embers -->
      <circle cx="6" cy="6" r="1.3" fill="#fef08a" class="fx-ember-a" />
      <circle cx="42" cy="5" r="1.2" fill="#f97316" class="fx-ember-b" />
    {/if}

    <!-- 6. ELITE HEROIC: Overclocked Cyber-Valkyrie Wings, Hex HUD Halo & Neon Nodes -->
    {#if rank === "eliteHeroic"}
      <circle
        cx="24"
        cy="21"
        r="22"
        fill="url(#{gradientId}-halo-rad)"
        class="fx-aura-breathe"
      />
      <polygon
        points="24,1.5 41,11 41,31 24,40.5 7,31 7,11"
        stroke={meta.accentColor}
        stroke-width="1.2"
        stroke-dasharray="6 2"
        opacity="0.75"
        class="fx-orbit-slow"
      />
      <circle
        cx="24"
        cy="21"
        r="16"
        stroke={meta.fillColor}
        stroke-width="0.9"
        stroke-dasharray="2 3"
        opacity="0.65"
        class="fx-orbit-reverse"
      />

      <!-- Left Cyber Mecha Wing -->
      <g class="fx-wings-flap-l">
        <polygon
          points="14,29 2,22 0,15 8,18 1,9 3,3 11,11 7,2 12,0 15,13"
          fill="url(#{gradientId}-wing-l)"
          stroke="#a7f3d0"
          stroke-width="0.5"
        />
        <polyline
          points="3,16 9,19 6,9 12,13"
          stroke="#ffffff"
          stroke-width="0.9"
          stroke-linecap="round"
        />
      </g>

      <!-- Right Cyber Mecha Wing -->
      <g class="fx-wings-flap-r">
        <polygon
          points="34,29 46,22 48,15 40,18 47,9 45,3 37,11 41,2 36,0 33,13"
          fill="url(#{gradientId}-wing-r)"
          stroke="#a7f3d0"
          stroke-width="0.5"
        />
        <polyline
          points="45,16 39,19 42,9 36,13"
          stroke="#ffffff"
          stroke-width="0.9"
          stroke-linecap="round"
        />
      </g>
    {/if}

    <!-- 7. MASTER: Imperial Sovereign Armored Arch-Wings & Double Royal Astrolabe -->
    {#if rank === "master"}
      <circle
        cx="24"
        cy="21"
        r="22.5"
        fill="url(#{gradientId}-halo-rad)"
        class="fx-aura-breathe"
      />
      <circle
        cx="24"
        cy="21"
        r="20"
        stroke={meta.accentColor}
        stroke-width="1.3"
        opacity="0.75"
      />
      <circle
        cx="24"
        cy="21"
        r="17"
        stroke="#fef08a"
        stroke-width="1"
        stroke-dasharray="3 2.5"
        opacity="0.7"
        class="fx-orbit-slow"
      />

      <!-- Left Imperial Wing with Gold Filigree Spine -->
      <g class="fx-wings-flap-l">
        <path
          d="M 14 31 C 6 30, 0.5 24, -0.5 15 C 2 16, 6 19, 9 22 C 3 15, 0 8, 1.5 1 C 5 6, 9 11, 12 15 C 8 8, 8 2, 11 -1 C 13 4, 14 11, 15 18 Z"
          fill="url(#{gradientId}-wing-l)"
          stroke="#fef08a"
          stroke-width="0.6"
        />
        <path
          d="M 13 20 C 7 15, 4 9, 5 2"
          stroke="#fef08a"
          stroke-width="1.1"
          stroke-linecap="round"
        />
      </g>

      <!-- Right Imperial Wing with Gold Filigree Spine -->
      <g class="fx-wings-flap-r">
        <path
          d="M 34 31 C 42 30, 47.5 24, 48.5 15 C 46 16, 42 19, 39 22 C 45 15, 48 8, 46.5 1 C 43 6, 39 11, 36 15 C 40 8, 40 2, 37 -1 C 35 4, 34 11, 33 18 Z"
          fill="url(#{gradientId}-wing-r)"
          stroke="#fef08a"
          stroke-width="0.6"
        />
        <path
          d="M 35 20 C 41 15, 44 9, 43 2"
          stroke="#fef08a"
          stroke-width="1.1"
          stroke-linecap="round"
        />
      </g>
    {/if}

    <!-- 8. ELITE MASTER: Abyssal Dragon-Lord Serrated Wings & Crimson Lightning Sunburst -->
    {#if rank === "eliteMaster"}
      <circle
        cx="24"
        cy="21"
        r="23"
        fill="url(#{gradientId}-halo-rad)"
        class="fx-aura-breathe"
      />
      <polygon
        points="24,0 26.5,15 39,7 30,19 45,21 30,23 39,35 26.5,27 24,42 21.5,27 9,35 18,23 3,21 18,19 9,7 21.5,15"
        fill="none"
        stroke={meta.accentColor}
        stroke-width="0.9"
        opacity="0.55"
        class="fx-orbit-reverse"
      />
      <circle
        cx="24"
        cy="21"
        r="20"
        stroke="#ef4444"
        stroke-width="1.5"
        stroke-dasharray="5 2"
        opacity="0.85"
        class="fx-orbit-slow"
      />

      <!-- Left Serrated Dragon Wing -->
      <g class="fx-wings-flap-l">
        <path
          d="M 14 32 C 5 31, -1 25, -1.5 15 C 2 17, 6 20, 9 24 C 2 16, -1 8, 0.5 0 C 4 5, 8 11, 11 16 C 7 8, 7 1, 10 -2 C 12 4, 14 11, 15 19 Z"
          fill="url(#{gradientId}-wing-l)"
          stroke="#fca5a5"
          stroke-width="0.6"
        />
        <polyline
          points="0,15 6,17 2,6 9,11"
          stroke="#fef08a"
          stroke-width="0.9"
          opacity="0.85"
        />
      </g>

      <!-- Right Serrated Dragon Wing -->
      <g class="fx-wings-flap-r">
        <path
          d="M 34 32 C 43 31, 49 25, 49.5 15 C 46 17, 42 20, 39 24 C 46 16, 49 8, 47.5 0 C 44 5, 40 11, 37 16 C 41 8, 41 1, 38 -2 C 36 4, 34 11, 33 19 Z"
          fill="url(#{gradientId}-wing-r)"
          stroke="#fca5a5"
          stroke-width="0.6"
        />
        <polyline
          points="48,15 42,17 46,6 39,11"
          stroke="#fef08a"
          stroke-width="0.9"
          opacity="0.85"
        />
      </g>
    {/if}

    <!-- 9. GRANDMASTER: Supreme 6-Wing Seraphim Spread, Rotating Celestial Astrolabe & Supernova Rays -->
    {#if rank === "grandmaster"}
      <circle
        cx="24"
        cy="21"
        r="24"
        fill="url(#{gradientId}-halo-rad)"
        class="fx-aura-breathe"
      />
      <!-- Rotating 16-Ray Celestial Sunburst -->
      <polygon
        points="24,-1 26,15 42,3 28,19 49,21 28,23 42,39 26,27 24,43 22,27 6,39 20,23 -1,21 20,19 6,3 22,15"
        fill="url(#{gradientId}-halo-rad)"
        stroke={meta.accentColor}
        stroke-width="1"
        opacity="0.7"
        class="fx-orbit-slow"
      />
      <!-- Counter-Rotating Sacred Astrolabe Rings -->
      <circle
        cx="24"
        cy="21"
        r="21"
        stroke="url(#{gradientId}-gold-wing)"
        stroke-width="1.8"
        opacity="0.9"
      />
      <circle
        cx="24"
        cy="21"
        r="18"
        stroke="#ffffff"
        stroke-width="1.1"
        stroke-dasharray="3 2 1 2"
        opacity="0.85"
        class="fx-orbit-reverse"
      />

      <!-- Left Grand 3-Tier Seraphim Wings -->
      <g class="fx-wings-flap-l">
        <!-- Lower Golden Plumage -->
        <path
          d="M 14 35 C 5 35, -1 28, -2 19 C 1 20, 5 23, 8 27 C 11 30, 12 32, 14 32 Z"
          fill="url(#{gradientId}-gold-wing)"
          stroke="#ffffff"
          stroke-width="0.5"
        />
        <!-- Mid Prismatic Plumage -->
        <path
          d="M 14 29 C 4 27, -1.5 19, -1.5 9 C 2 12, 6 16, 10 21 C 12 24, 13 26, 14 26 Z"
          fill="url(#{gradientId}-wing-l)"
          stroke="#fef08a"
          stroke-width="0.6"
        />
        <!-- High Archangel Pinion -->
        <path
          d="M 14 22 C 5 16, 0.5 8, 1 -2 C 5 3, 9 9, 12 15 C 10 8, 10 2, 12 -3 C 14 3, 14.5 11, 15 18 Z"
          fill="url(#{gradientId}-gold-wing)"
          stroke="#ffffff"
          stroke-width="0.7"
        />
      </g>

      <!-- Right Grand 3-Tier Seraphim Wings -->
      <g class="fx-wings-flap-r">
        <!-- Lower Golden Plumage -->
        <path
          d="M 34 35 C 43 35, 49 28, 50 19 C 47 20, 43 23, 40 27 C 37 30, 36 32, 34 32 Z"
          fill="url(#{gradientId}-gold-wing)"
          stroke="#ffffff"
          stroke-width="0.5"
        />
        <!-- Mid Prismatic Plumage -->
        <path
          d="M 34 29 C 44 27, 49.5 19, 49.5 9 C 46 12, 42 16, 38 21 C 36 24, 35 26, 34 26 Z"
          fill="url(#{gradientId}-wing-r)"
          stroke="#fef08a"
          stroke-width="0.6"
        />
        <!-- High Archangel Pinion -->
        <path
          d="M 34 22 C 43 16, 47.5 8, 47 -2 C 43 3, 39 9, 36 15 C 38 8, 38 2, 36 -3 C 34 3, 33.5 11, 33 18 Z"
          fill="url(#{gradientId}-gold-wing)"
          stroke="#ffffff"
          stroke-width="0.7"
        />
      </g>

      <!-- Floating Celestial Starlight Motes -->
      <polygon
        points="4,4 5,6 7,7 5,8 4,10 3,8 1,7 3,6"
        fill="#ffffff"
        class="fx-ember-a"
      />
      <polygon
        points="44,4 45,6 47,7 45,8 44,10 43,8 41,7 43,6"
        fill="#fef08a"
        class="fx-ember-b"
      />
    {/if}
  </svg>
{:else if layer === "foreground"}
  <!-- FOREGROUND LAYER: Apex Crowns, Crest Jewels & Sculpted Mechanical Keycap Rank Plaque -->
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="rank-fx-fg absolute inset-0 w-full h-full pointer-events-none overflow-visible rank-fx-{rank}"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        id="{gradientId}-crest-bevel"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="100%"
      >
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
        <stop offset="25%" stop-color={meta.accentColor} />
        <stop offset="100%" stop-color={meta.fillColor} />
      </linearGradient>
      <linearGradient
        id="{gradientId}-crest-bg"
        x1="0%"
        y1="0%"
        x2="0%"
        y2="100%"
      >
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="45%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient
        id="{gradientId}-star-grad"
        x1="0%"
        y1="0%"
        x2="0%"
        y2="100%"
      >
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="35%" stop-color="#fef08a" />
        <stop offset="100%" stop-color="#eab308" />
      </linearGradient>
    </defs>

    <!-- ========================================== -->
    <!-- APEX CROWNS, JEWELS & TOP ORNAMENTS (y: -1 to 8) -->
    <!-- ========================================== -->
    <g class="fx-apex-ornament">
      {#if rank === "gold"}
        <polygon
          points="24,1.2 25,3.8 27.8,3.8 25.5,5.4 26.4,8 24,6.4 21.6,8 22.5,5.4 20.2,3.8 23,3.8"
          fill="url(#{gradientId}-star-grad)"
          stroke="#78350f"
          stroke-width="0.45"
        />
      {:else if rank === "platinum"}
        <polygon
          points="17.5,2.8 19.2,4.5 17.5,6.2 15.8,4.5"
          fill={meta.accentColor}
          stroke="#0369a1"
          stroke-width="0.45"
        />
        <polygon
          points="30.5,2.8 32.2,4.5 30.5,6.2 28.8,4.5"
          fill={meta.accentColor}
          stroke="#0369a1"
          stroke-width="0.45"
        />
        <polygon
          points="24,0.4 26,3.2 24,6 22,3.2"
          fill="#ffffff"
          stroke="#0284c7"
          stroke-width="0.55"
        />
      {:else if rank === "diamond"}
        <polygon
          points="16.5,2.5 18.8,4.8 16.5,7.1 14.2,4.8"
          fill="#a5f3fc"
          stroke="#0891b2"
          stroke-width="0.45"
        />
        <polygon
          points="31.5,2.5 33.8,4.8 31.5,7.1 29.2,4.8"
          fill="#a5f3fc"
          stroke="#0891b2"
          stroke-width="0.45"
        />
        <polygon
          points="24,-0.5 26.8,2.8 24,6.2 21.2,2.8"
          fill="#ffffff"
          stroke="#06b6d4"
          stroke-width="0.65"
        />
      {:else if rank === "heroic"}
        <path
          d="M 19 6.5 L 17 2.5 L 21.5 4.5 L 24 -0.5 L 26.5 4.5 L 31 2.5 L 29 6.5 Z"
          fill={meta.accentColor}
          stroke="#7c2d12"
          stroke-width="0.5"
        />
        <polygon
          points="24,1 24.9,3.4 27.4,3.4 25.3,4.9 26.1,7.3 24,5.8 21.9,7.3 22.7,4.9 20.6,3.4 23.1,3.4"
          fill="url(#{gradientId}-star-grad)"
          stroke="#7c2d12"
          stroke-width="0.4"
        />
      {:else if rank === "eliteHeroic"}
        <path
          d="M 17 6.5 L 19.5 1.5 L 24 4.8 L 28.5 1.5 L 31 6.5 Z"
          fill={meta.accentColor}
          stroke="#064e3b"
          stroke-width="0.6"
        />
        <circle cx="19.5" cy="1.5" r="1.2" fill="#ffffff" />
        <circle cx="28.5" cy="1.5" r="1.2" fill="#ffffff" />
        <polygon
          points="24,0.4 24.8,2.6 27,2.6 25.2,3.9 25.9,6 24,4.7 22.1,6 22.8,3.9 21,2.6 23.2,2.6"
          fill="url(#{gradientId}-star-grad)"
        />
      {:else if rank === "master"}
        <path
          d="M 16.5 6.8 L 18.5 1.2 L 21.8 4.4 L 24 0 L 26.2 4.4 L 29.5 1.2 L 31.5 6.8 Z"
          fill="url(#{gradientId}-crest-bevel)"
          stroke="#4c1d95"
          stroke-width="0.65"
        />
        <circle cx="18.5" cy="1.2" r="1.15" fill="#fef08a" />
        <circle cx="24" cy="0" r="1.45" fill="#ffffff" />
        <circle cx="29.5" cy="1.2" r="1.15" fill="#fef08a" />
        <polygon
          points="24,2.2 25.6,3.9 24,5.6 22.4,3.9"
          fill="#f3e8ff"
          stroke="#6b21a8"
          stroke-width="0.45"
        />
      {:else if rank === "eliteMaster"}
        <path
          d="M 15.5 7 L 17.5 0.5 L 21 4.8 L 24 -0.8 L 27 4.8 L 30.5 0.5 L 32.5 7 Z"
          fill="url(#{gradientId}-crest-bevel)"
          stroke="#450a0a"
          stroke-width="0.7"
        />
        <polygon
          points="24,1.5 26.2,4.2 24,6.9 21.8,4.2"
          fill="#ffffff"
          stroke="#991b1b"
          stroke-width="0.5"
        />
        <circle cx="17.5" cy="0.5" r="1.25" fill="#fef08a" />
        <circle cx="30.5" cy="0.5" r="1.25" fill="#fef08a" />
      {:else if rank === "grandmaster"}
        <path
          d="M 14.5 7.2 L 16.5 0.5 L 20.2 4.5 L 24 -1.2 L 27.8 4.5 L 31.5 0.5 L 33.5 7.2 Z"
          fill="url(#{gradientId}-star-grad)"
          stroke="#78350f"
          stroke-width="0.75"
        />
        <circle
          cx="24"
          cy="-1.2"
          r="1.85"
          fill="#ffffff"
          stroke="#b45309"
          stroke-width="0.45"
        />
        <circle
          cx="16.5"
          cy="0.5"
          r="1.35"
          fill="#fef08a"
          stroke="#b45309"
          stroke-width="0.4"
        />
        <circle
          cx="31.5"
          cy="0.5"
          r="1.35"
          fill="#fef08a"
          stroke="#b45309"
          stroke-width="0.4"
        />
        <polygon
          points="24,1.2 26.2,3.7 24,6.2 21.8,3.7"
          fill="#ffffff"
          stroke="#e11d48"
          stroke-width="0.55"
        />
      {/if}
    </g>

    <!-- ========================================== -->
    <!-- BOTTOM MECHANICAL KEYCAP / ESPORTS RANK PLAQUE (y: 26.5 to 47) -->
    <!-- ========================================== -->
    <g class="fx-plaque-group">
      <!-- Outer Drop Shadow Base (Pure vector shadow, zero filter cost) -->
      <polygon
        points="6.5,37 12.5,31.2 24,27.2 35.5,31.2 41.5,37 35.5,43.2 24,47.6 12.5,43.2"
        fill="#020617"
        opacity="0.78"
      />

      <!-- Flanking Tactical Key-Switch Wing Guards -->
      <polygon
        points="6.5,35.5 13,29.8 13,42.2 6.5,38.5"
        fill="url(#{gradientId}-crest-bevel)"
      />
      <polygon
        points="41.5,35.5 35,29.8 35,42.2 41.5,38.5"
        fill="url(#{gradientId}-crest-bevel)"
      />
      <!-- Wing Guard Precision Slits -->
      <line
        x1="8.2"
        y1="36.2"
        x2="11.8"
        y2="33.2"
        stroke="#020617"
        stroke-width="0.75"
        opacity="0.65"
      />
      <line
        x1="39.8"
        y1="36.2"
        x2="36.2"
        y2="33.2"
        stroke="#020617"
        stroke-width="0.75"
        opacity="0.65"
      />

      <!-- Main Chiseled Hexagonal Keycap Plaque (Outer Metallic Bevel Rim) -->
      <polygon
        points="12.6,30.2 24,26.2 35.4,30.2 35.4,42.2 24,46.8 12.6,42.2"
        fill="url(#{gradientId}-crest-bevel)"
      />

      <!-- Inner Sculpted Keycap Dish Plate -->
      <polygon
        points="14.3,31.5 24,27.8 33.7,31.5 33.7,41.1 24,45.1 14.3,41.1"
        fill="url(#{gradientId}-crest-bg)"
        stroke={meta.accentColor}
        stroke-width="0.85"
        stroke-opacity="0.75"
      />

      <!-- Subtle Keycap Top Specular Edge & Typing Homing Bar -->
      <polyline
        points="15.5,32.2 24,29 32.5,32.2"
        fill="none"
        stroke="#ffffff"
        stroke-width="0.65"
        stroke-linecap="round"
        opacity="0.45"
      />
      <line
        x1="21"
        y1="43.2"
        x2="27"
        y2="43.2"
        stroke={meta.accentColor}
        stroke-width="0.9"
        stroke-linecap="round"
        opacity="0.75"
      />

      {#if !meta.isStarRank}
        <!-- ROMAN NUMERAL CREST: Bronze, Silver, Gold, Platinum, Diamond -->
        <text
          x="24"
          y="37.4"
          text-anchor="middle"
          dominant-baseline="central"
          fill={meta.accentColor}
          stroke="#020617"
          stroke-width="0.85"
          paint-order="stroke fill"
          font-family="ui-serif, Georgia, 'Times New Roman', Times, serif"
          font-weight="900"
          font-size={meta.romanLevel.length >= 3
            ? "8.8"
            : meta.romanLevel.length === 2
              ? "9.8"
              : "11.2"}
          letter-spacing={meta.romanLevel.length >= 3 ? "-0.06em" : "-0.02em"}
        >
          {meta.romanLevel}
        </text>
      {:else}
        <!-- STAR-BASED GAMING RANK CREST: Heroic, Elite Heroic, Master, Elite Master, Grandmaster -->
        {#if stars === 1}
          <polygon
            points="24,32.2 25.5,35.2 29,35.2 26.2,37.2 27.2,40.5 24,38.5 20.8,40.5 21.8,37.2 19,35.2 22.5,35.2"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.45"
            class="fx-star-twinkle-1"
          />
        {:else if stars === 2}
          <polygon
            points="20.5,33.2 21.6,35.5 24.2,35.5 22.1,37 22.9,39.5 20.5,38 18.1,39.5 18.9,37 16.8,35.5 19.4,35.5"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.35"
            class="fx-star-twinkle-1"
          />
          <polygon
            points="27.5,33.2 28.6,35.5 31.2,35.5 29.1,37 29.9,39.5 27.5,38 25.1,39.5 25.9,37 23.8,35.5 26.4,35.5"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.35"
            class="fx-star-twinkle-2"
          />
        {:else if stars === 3}
          <polygon
            points="18.5,34.8 19.4,36.6 21.4,36.6 19.8,37.8 20.4,39.8 18.5,38.6 16.6,39.8 17.2,37.8 15.6,36.6 17.6,36.6"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.32"
            class="fx-star-twinkle-1"
          />
          <polygon
            points="24,32.6 25.1,34.7 27.4,34.7 25.5,36.1 26.2,38.4 24,37 21.8,38.4 22.5,36.1 20.6,34.7 22.9,34.7"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.35"
            class="fx-star-twinkle-2"
          />
          <polygon
            points="29.5,34.8 30.4,36.6 32.4,36.6 30.8,37.8 31.4,39.8 29.5,38.6 27.6,39.8 28.2,37.8 26.6,36.6 28.6,36.6"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.32"
            class="fx-star-twinkle-3"
          />
        {:else if stars === 4}
          <polygon
            points="17,35.2 17.8,36.8 19.6,36.8 18.1,37.9 18.7,39.7 17,38.6 15.3,39.7 15.9,37.9 14.4,36.8 16.2,36.8"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.28"
            class="fx-star-twinkle-1"
          />
          <polygon
            points="21.5,33.6 22.3,35.2 24.1,35.2 22.6,36.3 23.2,38.1 21.5,37 19.8,38.1 20.4,36.3 18.9,35.2 20.7,35.2"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.28"
            class="fx-star-twinkle-2"
          />
          <polygon
            points="26.5,33.6 27.3,35.2 29.1,35.2 27.6,36.3 28.2,38.1 26.5,37 24.8,38.1 25.4,36.3 23.9,35.2 25.7,35.2"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.28"
            class="fx-star-twinkle-3"
          />
          <polygon
            points="31,35.2 31.8,36.8 33.6,36.8 32.1,37.9 32.7,39.7 31,38.6 29.3,39.7 29.9,37.9 28.4,36.8 30.2,36.8"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.28"
            class="fx-star-twinkle-1"
          />
        {:else}
          <!-- 5 Stars Arched (Apex 5★ Grandmaster Crest) -->
          <polygon
            points="16,36.2 16.7,37.6 18.3,37.6 17,38.6 17.5,40.2 16,39.2 14.5,40.2 15,38.6 13.7,37.6 15.3,37.6"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.24"
            class="fx-star-twinkle-1"
          />
          <polygon
            points="20,34.5 20.7,35.9 22.3,35.9 21,36.9 21.5,38.5 20,37.5 18.5,38.5 19,36.9 17.7,35.9 19.3,35.9"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.24"
            class="fx-star-twinkle-2"
          />
          <polygon
            points="24,33.1 24.8,34.7 26.6,34.7 25.1,35.8 25.7,37.6 24,36.5 22.3,37.6 22.9,35.8 21.4,34.7 23.2,34.7"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.32"
            class="fx-star-twinkle-3"
          />
          <polygon
            points="28,34.5 28.7,35.9 30.3,35.9 29,36.9 29.5,38.5 28,37.5 26.5,38.5 27,36.9 25.7,35.9 27.3,35.9"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.24"
            class="fx-star-twinkle-2"
          />
          <polygon
            points="32,36.2 32.7,37.6 34.3,37.6 33,38.6 33.5,40.2 32,39.2 30.5,40.2 31,38.6 29.7,37.6 31.3,37.6"
            fill="url(#{gradientId}-star-grad)"
            stroke="#451a03"
            stroke-width="0.24"
            class="fx-star-twinkle-1"
          />
        {/if}
      {/if}
    </g>
  </svg>
{/if}

<!-- All infinite idle animations removed to eliminate compositor thread explosion and UI lag -->
