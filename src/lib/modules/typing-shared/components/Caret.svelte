<script lang="ts">
  interface Props {
    styleType?: "line" | "block" | "underline" | "outline";
    visible?: boolean;
    isTyping?: boolean;
    smooth?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }

  let {
    styleType = "line",
    visible = true,
    isTyping = false,
    smooth = false,
    x,
    y,
    width,
    height,
  }: Props = $props();

  let el: HTMLDivElement | undefined;

  const SHAPES = {
    line: "bg-tt-primary rounded-full",
    block: "bg-tt-primary/35 rounded-sm",
    underline: "border-b-2 border-tt-primary",
    outline: "border-2 border-tt-primary rounded-sm",
  } as const;

  /**
   * Zero-latency placement: writes straight to the element's compositor-only
   * transform. No $state, no re-render, no second reactive flush per keystroke.
   */
  export function place(newX: number, newY: number, newW: number, newH: number) {
    if (!el) return;
    const s = el.style;
    s.transform = `translate3d(${newX}px, ${newY}px, 0)`;
    s.width = styleType === "line" ? "2.5px" : `${Math.max(12, newW)}px`;
    s.height = `${newH}px`;
  }

  const computedWidth = $derived(
    styleType === "line" ? "2.5px" : `${Math.max(12, width ?? 2.5)}px`
  );
  const initialStyle = $derived(
    x !== undefined && y !== undefined
      ? ` transform: translate3d(${x}px, ${y}px, 0); width: ${computedWidth}; height: ${height ?? 28}px;`
      : ""
  );
</script>

<div
  bind:this={el}
  class={[
    "absolute top-0 left-0 pointer-events-none z-10",
    SHAPES[styleType] ?? SHAPES.line,
    smooth ? "transition-transform duration-75 ease-out" : "transition-none",
  ].join(" ")}
  class:caret-pulse={styleType === "line" && !isTyping}
  class:hidden={!visible}
  style="will-change: transform;{initialStyle}"
></div>
