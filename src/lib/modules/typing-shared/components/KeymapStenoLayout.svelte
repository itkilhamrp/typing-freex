<script lang="ts">
  import {
    type KeymapGeometryInfo,
    type KeymapLegendStyle,
    type KeymapStyle,
    STENO_KEYS,
    STENO_MATRIX_LEFT,
    STENO_MATRIX_RIGHT,
    resolveStenoLegend,
  } from '@/core/keymap';

  interface Props {
    style: Extract<KeymapStyle, 'steno' | 'steno_matrix'>;
    geom: KeymapGeometryInfo;
    legendStyle: KeymapLegendStyle;
    isShiftActive: boolean;
    keyStateClass: (code: string) => string;
    stenoKeyStateClass: (codes: readonly string[]) => string;
  }

  let {
    style,
    geom,
    legendStyle,
    isShiftActive,
    keyStateClass,
    stenoKeyStateClass,
  }: Props = $props();
</script>

{#if style === 'steno'}
  <!-- ==================== STENO (STENOTYPE MACHINE HARDWARE GRID) ==================== -->
  <div
    class="grid items-center justify-center"
    style:grid-template-columns="repeat(10, var(--km-unit))"
    style:grid-template-rows="repeat(3, var(--km-unit))"
    style:gap="var(--km-gap)"
  >
    {#each STENO_KEYS as key (key.label + key.col + key.row)}
      <div
        class={['keymap-key', stenoKeyStateClass(key.codes)].join(' ')}
        style:grid-column={key.col}
        style:grid-row="{key.row}{key.rowSpan ? ` / span ${key.rowSpan}` : ''}"
        style:height={key.rowSpan ? `calc(var(--km-unit) * ${key.rowSpan} + var(--km-gap) * ${key.rowSpan - 1})` : 'var(--km-unit)'}
        data-code={key.codes[0]}
        data-codes={key.codes.join(' ')}
      >
        <span>{resolveStenoLegend(key.label, legendStyle, isShiftActive)}</span>
      </div>
    {/each}
  </div>
{:else}
  <!-- ==================== STENO MATRIX (DUAL 5-COLUMN MATRIX) ==================== -->
  <div
    class="flex items-start justify-center"
    style:gap="calc(var(--km-unit) * {geom.splitGapU})"
  >
    <!-- Left Bank (5 columns: s t p h *, s k w r *, _ _ _ a o) -->
    <div class="flex flex-col items-start" style:gap="var(--km-gap)">
      <!-- Row 1: s t p h * -->
      <div class="flex items-center" style:gap="var(--km-gap)">
        {#each STENO_MATRIX_LEFT.row1 as key (key.code)}
          <div
            class={['keymap-key', keyStateClass(key.code)].join(' ')}
            data-code={key.code}
          >
            <span>{resolveStenoLegend(key.label, legendStyle, isShiftActive)}</span>
          </div>
        {/each}
      </div>

      <!-- Row 2: s k w r * -->
      <div class="flex items-center" style:gap="var(--km-gap)">
        {#each STENO_MATRIX_LEFT.row2 as key (key.code)}
          <div
            class={['keymap-key', keyStateClass(key.code)].join(' ')}
            data-code={key.code}
          >
            <span>{resolveStenoLegend(key.label, legendStyle, isShiftActive)}</span>
          </div>
        {/each}
      </div>

      <!-- Row 3: Thumbs a, o (aligned to cols 4 & 5 under h, *) -->
      <div
        class="flex items-center"
        style:margin-left="calc(var(--km-unit) * 3.0 + var(--km-gap) * 3.0)"
        style:gap="var(--km-gap)"
      >
        {#each STENO_MATRIX_LEFT.row3 as key (key.code)}
          <div
            class={['keymap-key', keyStateClass(key.code)].join(' ')}
            data-code={key.code}
          >
            <span>{resolveStenoLegend(key.label, legendStyle, isShiftActive)}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Right Bank (5 columns: f p l t d, r b g s z, e u _ _ _) -->
    <div class="flex flex-col items-start" style:gap="var(--km-gap)">
      <!-- Row 1: f p l t d -->
      <div class="flex items-center" style:gap="var(--km-gap)">
        {#each STENO_MATRIX_RIGHT.row1 as key (key.code)}
          <div
            class={['keymap-key', keyStateClass(key.code)].join(' ')}
            data-code={key.code}
          >
            <span>{resolveStenoLegend(key.label, legendStyle, isShiftActive)}</span>
          </div>
        {/each}
      </div>

      <!-- Row 2: r b g s z -->
      <div class="flex items-center" style:gap="var(--km-gap)">
        {#each STENO_MATRIX_RIGHT.row2 as key (key.code)}
          <div
            class={['keymap-key', keyStateClass(key.code)].join(' ')}
            data-code={key.code}
          >
            <span>{resolveStenoLegend(key.label, legendStyle, isShiftActive)}</span>
          </div>
        {/each}
      </div>

      <!-- Row 3: Thumbs e, u (aligned to cols 1 & 2 under f, p) -->
      <div class="flex items-center" style:gap="var(--km-gap)">
        {#each STENO_MATRIX_RIGHT.row3 as key (key.code)}
          <div
            class={['keymap-key', keyStateClass(key.code)].join(' ')}
            data-code={key.code}
          >
            <span>{resolveStenoLegend(key.label, legendStyle, isShiftActive)}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
