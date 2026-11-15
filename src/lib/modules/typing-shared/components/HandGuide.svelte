<script module lang="ts">
  /**
   * Module scope: dijalankan SEKALI per aplikasi (bukan per instance komponen).
   * Semua pose sprite di-join (dan tangan kanan di-mirror) di sini, jadi saat render / keypress
   * tidak ada alokasi, join, atau kalkulasi tambahan: hanya memilih string yang sudah jadi.
   */
  import type {
    HandVisualState,
    VisualFingerState,
    HandGuideMode,
    HandGuideStyle,
    HandGuideLegendStyle,
    HandGuideHands,
  } from "@/core/hand-guide";
  import spriteData from "@/core/hand-guide/sprites/robot-v0.json";

  type RawFinger = {
    normal: string[];
    target?: string[];
    pressed?: string[];
    offsetY?: number;
  };
  type RawPack = {
    mirrorRight?: boolean;
    leftFingers: Record<string, RawFinger>;
    rightFingers?: Record<string, RawFinger>;
    leftPalm: string[];
    rightPalm?: string[];
  };
  type Pose = "normal" | "target" | "pressed";
  type FingerSprite = Record<Pose, string> & { drop: string | undefined };

  const pack = spriteData as unknown as RawPack;

  const LEFT_ORDER = [
    "l_pinky",
    "l_ring",
    "l_middle",
    "l_index",
    "l_thumb",
  ] as const;
  const RIGHT_ORDER = [
    "r_thumb",
    "r_index",
    "r_middle",
    "r_ring",
    "r_pinky",
  ] as const;

  const FINGER_HOME_KEY: Record<string, string> = {
    l_pinky: "A",
    l_ring: "S",
    l_middle: "D",
    l_index: "F",
    l_thumb: "␣",
    r_thumb: "␣",
    r_index: "J",
    r_middle: "K",
    r_ring: "L",
    r_pinky: ";",
  };

  const FINGER_NAMES: Record<string, string> = {
    l_pinky: "PNK",
    l_ring: "RNG",
    l_middle: "MID",
    l_index: "IDX",
    l_thumb: "THM",
    r_thumb: "THM",
    r_index: "IDX",
    r_middle: "MID",
    r_ring: "RNG",
    r_pinky: "PNK",
  };

  /** Sama dengan `leading-none` pada root; tinggi baris jari dihitung dari sini (em). */
  const LINE_HEIGHT = 1;

  // ---- tangan kanan = cermin tangan kiri (pack.mirrorRight): balik tiap baris, tukar / \ dan [ ]
  const MIRROR_GLYPH: Record<string, string> = {
    "/": "\\",
    "\\": "/",
    "[": "]",
    "]": "[",
  };
  function mirrorLine(line: string): string {
    let out = "";
    for (let i = line.length - 1; i >= 0; i--) {
      const ch = line[i] ?? "";
      out += MIRROR_GLYPH[ch] ?? ch;
    }
    return out;
  }
  const mirrorLines = (lines?: string[]) => lines?.map(mirrorLine);

  function buildRightFingers(): Record<string, RawFinger> {
    if (!pack.mirrorRight && pack.rightFingers) return pack.rightFingers;
    const out: Record<string, RawFinger> = {};
    for (const [id, f] of Object.entries(pack.leftFingers)) {
      out["r_" + id.slice(2)] = {
        normal: f.normal.map(mirrorLine),
        target: mirrorLines(f.target),
        pressed: mirrorLines(f.pressed),
        offsetY: f.offsetY,
      };
    }
    return out;
  }
  const rightFingers = buildRightFingers();
  const rightPalm =
    !pack.mirrorRight && pack.rightPalm
      ? pack.rightPalm
      : pack.leftPalm.map(mirrorLine);

  const rawFingers: Record<string, RawFinger> = {
    ...pack.leftFingers,
    ...rightFingers,
  };

  const sprites: Record<string, FingerSprite> = {};
  let rowsAboveBaseline = 1;

  for (const id of [...LEFT_ORDER, ...RIGHT_ORDER]) {
    const raw = rawFingers[id];
    if (!raw) continue;
    const normal = raw.normal.join("\n");
    const offsetY = raw.offsetY ?? 0;
    sprites[id] = {
      normal,
      // Pose opsional jatuh kembali ke `normal` -> sprite pack lama tetap kompatibel.
      target: raw.target ? raw.target.join("\n") : normal,
      pressed: raw.pressed ? raw.pressed.join("\n") : normal,
      // Jari yang menempel lebih rendah (jempol + bantalannya, garis buku jari miring) "menggantung"
      // offsetY baris ke bawah baseline; palm punya sel kosong di area itu.
      drop: offsetY > 0 ? `-${offsetY}em` : undefined,
    };
    for (const lines of [raw.normal, raw.target, raw.pressed]) {
      if (lines)
        rowsAboveBaseline = Math.max(rowsAboveBaseline, lines.length - offsetY);
    }
  }

  /**
   * Tinggi baris jari mengikuti pose tertinggi (jari menjangkau) pada sprite pack,
   * dalam em -> ikut skala font (responsif) dan TIDAK ada layout shift saat pose berganti.
   */
  const FINGER_ROW_HEIGHT = `${(rowsAboveBaseline * LINE_HEIGHT).toFixed(2)}em`;

  const hands = [
    { side: "left", order: LEFT_ORDER, palm: pack.leftPalm.join("\n") },
    { side: "right", order: RIGHT_ORDER, palm: rightPalm.join("\n") },
  ] as const;

  /** Sendi bergerak: idle = rileks, target = jari terulur menjangkau, pressed = jari menekuk. */
  function poseFor(state: VisualFingerState): Pose {
    if (state === "pressed" || state === "pressed_error") return "pressed";
    if (state === "target" || state === "shift_target") return "target";
    return "normal";
  }

  function spriteFor(finger: string, state: VisualFingerState): string {
    const entry = sprites[finger];
    return entry ? entry[poseFor(state)] : "";
  }

  /**
   * Zero-delay: state "pressed*" memakai transition-none (berubah pada frame yang sama
   * dengan keypress). Fade halus hanya saat dilepas / berganti target.
   */
  function fingerClasses(state: VisualFingerState): string {
    switch (state) {
      case "target":
        return "hg-target text-tt-primary font-extrabold opacity-90 transition-[color,opacity] duration-100";
      case "shift_target":
        return "hg-shift-target text-tt-primary/80 font-bold underline [text-shadow:0_0_6px_currentColor] transition-[color,opacity] duration-100";
      case "pressed":
        return "hg-pressed text-ios-green font-extrabold transition-none";
      case "pressed_error":
        return "hg-pressed-error text-ios-red font-extrabold transition-none";
      case "idle":
      default:
        return "hg-idle text-ios-gray transition-[color,opacity] duration-150";
    }
  }
</script>

<script lang="ts">
  interface Props {
    visualState: HandVisualState;
    mode?: HandGuideMode;
    style?: HandGuideStyle;
    legendStyle?: HandGuideLegendStyle;
    showHands?: HandGuideHands;
    size?: number;
  }

  let {
    visualState,
    mode = "next",
    style = "robot",
    legendStyle = "blank",
    showHands = "both",
    size = 1.0,
  }: Props = $props();

  const visibleHands = $derived(
    showHands === "left"
      ? hands.filter((h) => h.side === "left")
      : showHands === "right"
        ? hands.filter((h) => h.side === "right")
        : hands
  );

  function getFingerLabel(finger: string, state: VisualFingerState): string {
    if (legendStyle === "blank") return "";
    if (legendStyle === "keys") return FINGER_HOME_KEY[finger] ?? "";
    if (legendStyle === "finger_name") return FINGER_NAMES[finger] ?? "";
    if (legendStyle === "dynamic") {
      if (state === "target" || state === "shift_target") {
        return visualState.targetChar ? (visualState.targetChar === " " ? "␣" : visualState.targetChar.toUpperCase()) : "";
      }
      return "";
    }
    return "";
  }
</script>

{#if mode !== "off"}
  <div
    class={[
      "handguide-root flex items-end justify-center select-none pointer-events-none font-mono leading-none motion-safe:transition-all duration-150",
      style === "cyber" ? "hg-cyber" : "",
      style === "minimal" ? "opacity-90" : "",
    ].join(" ")}
    style:--hg-scale={size}
    style:font-size="calc(5.8px * var(--hg-scale))"
    style:gap="calc(1.5rem * var(--hg-scale))"
    style:padding-top="calc(0.25rem * var(--hg-scale))"
    style:padding-bottom="calc(0.25rem * var(--hg-scale))"
    aria-hidden="true"
  >
    {#each visibleHands as hand (hand.side)}
      <div class="flex flex-col items-start" data-hand={hand.side}>
        <!-- 5 Fingers -->
        <div class="flex items-end" style:height={FINGER_ROW_HEIGHT}>
          {#each hand.order as finger (finger)}
            {@const state = visualState.fingerStates[finger]}
            {@const label = getFingerLabel(finger, state)}
            <div
              data-finger={finger}
              data-state={state}
              class={[
                "relative block overflow-visible",
                fingerClasses(state),
              ].join(" ")}
              style:margin-bottom={sprites[finger]?.drop}
            >
              {#if label}
                <span
                  class={[
                    "absolute -top-3.5 left-1/2 -translate-x-1/2 text-[0.75em] font-bold px-0.5 rounded motion-safe:transition-all duration-100",
                    state === "target" || state === "shift_target"
                      ? "bg-tt-primary text-tt-bg shadow-sm"
                      : "text-tt-text-secondary/70",
                  ].join(" ")}
                >
                  {label}
                </span>
              {/if}
              <pre class="m-0 inline-block align-top">{spriteFor(
                  finger,
                  state,
                )}</pre>
            </div>
          {/each}
        </div>

        <!-- Palm -->
        <pre class="m-0 hg-palm text-ios-gray">{hand.palm}</pre>
      </div>
    {/each}
  </div>
{/if}

<style>
  .handguide-root {
    contain: layout style;
  }

  /* High contrast calibration in light and dark mode */
  :global(:root) .handguide-root .hg-idle,
  :global(:root) .handguide-root pre.hg-palm {
    color: var(--tt-hand-idle, #475569);
  }
  :global(.dark) .handguide-root .hg-idle,
  :global(.dark) .handguide-root pre.hg-palm,
  :global([data-theme="dark"]) .handguide-root .hg-idle,
  :global([data-theme="dark"]) .handguide-root pre.hg-palm {
    color: var(--tt-hand-idle, #98989d);
  }

  :global(:root) .handguide-root .hg-target {
    color: var(--tt-hand-target, #0066cc);
  }
  :global(.dark) .handguide-root .hg-target,
  :global([data-theme="dark"]) .handguide-root .hg-target {
    color: var(--tt-hand-target, #0a84ff);
    text-shadow: 0 0 6px var(--tt-hand-target-glow, rgba(10, 132, 255, 0.45));
  }

  .hg-cyber {
    filter: drop-shadow(0 0 4px var(--tt-hand-target-glow, rgba(10, 132, 255, 0.25)));
  }
</style>
