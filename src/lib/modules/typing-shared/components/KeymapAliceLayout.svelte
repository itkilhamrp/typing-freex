<script lang="ts">
  import type { KeyDef } from '@/core/hand-guide';
  import type { KeymapGeometryInfo, KeymapRow, KeymapShowKeys } from '@/core/keymap';

  interface Props {
    geom: KeymapGeometryInfo;
    normalRows: readonly KeymapRow[];
    showKeys: KeymapShowKeys;
    spaceLegend: string;
    backquoteKey?: KeyDef;
    backslashKey?: KeyDef;
    keyStateClass: (code: string) => string;
    getLegend: (key: KeyDef) => string;
  }

  let {
    geom,
    normalRows,
    showKeys,
    spaceLegend,
    backquoteKey,
    backslashKey,
    keyStateClass,
    getLegend,
  }: Props = $props();
</script>

<!-- ==================== ALICE (ANGLED SPLIT) ==================== -->
<div
  class="keymap-alice-container flex items-start justify-center"
  style:--km-alice-left-rot="{geom.leftRotationDeg}deg"
  style:--km-alice-right-rot="{geom.rightRotationDeg}deg"
  style:gap="calc(var(--km-unit) * {geom.splitGapU})"
  style:padding-top="calc(var(--km-unit) * {showKeys === 'minimal' ? 0.2 : 0.35})"
  style:padding-bottom="calc(var(--km-unit) * {showKeys === 'minimal' ? 0.9 : 1.15})"
>
  <!-- Left Rotated Half -->
  <div
    class="flex flex-col items-start"
    style:transform="rotate({geom.leftRotationDeg}deg)"
    style:transform-origin="top left"
    style:gap="var(--km-gap)"
  >
    {#if showKeys === 'full'}
      <!-- Left Full Rows -->
      {#each normalRows as row (row.rowIndex)}
        <div class="flex items-center" style:gap="var(--km-gap)">
          {#if row.rowIndex === 0}
            <div
              class={['keymap-key keymap-key-mod keymap-key-unrotated-left', keyStateClass('Escape')].join(' ')}
              data-code="Escape"
            >
              <span>Esc</span>
            </div>
            <div
              class={['keymap-key', keyStateClass('Backquote')].join(' ')}
              data-code="Backquote"
            >
              <span>{backquoteKey ? getLegend(backquoteKey) : '`'}</span>
            </div>
          {:else if row.rowIndex === 1}
            <div
              class={['keymap-key keymap-key-mod keymap-key-unrotated-left', keyStateClass('PageUp')].join(' ')}
              data-code="PageUp"
            >
              <span>PgUp</span>
            </div>
            <div
              class={['keymap-key keymap-key-mod', keyStateClass('Tab')].join(' ')}
              style:width="calc(var(--km-unit) * 1.5 + var(--km-gap) * 0.5)"
              data-code="Tab"
            >
              <span>Tab</span>
            </div>
          {:else if row.rowIndex === 2}
            <div
              class={['keymap-key keymap-key-mod keymap-key-unrotated-left', keyStateClass('PageDown')].join(' ')}
              data-code="PageDown"
            >
              <span>PgDn</span>
            </div>
            <div
              class={['keymap-key keymap-key-mod', keyStateClass('CapsLock')].join(' ')}
              style:width="calc(var(--km-unit) * 1.75 + var(--km-gap) * 0.75)"
              data-code="CapsLock"
            >
              <span>Caps</span>
            </div>
          {:else if row.rowIndex === 3}
            <div style:width="var(--km-unit)"></div>
            <div
              class={['keymap-key keymap-key-mod', keyStateClass('ShiftLeft')].join(' ')}
              style:width="calc(var(--km-unit) * 2.25 + var(--km-gap) * 1.25)"
              data-code="ShiftLeft"
            >
              <span>⇧</span>
            </div>
          {/if}

          {#each row.leftKeys as key (key.code)}
            <div
              class={['keymap-key', keyStateClass(key.code)].join(' ')}
              data-code={key.code}
            >
              <span>{getLegend(key)}</span>
              {#if key.code === 'KeyF'}
                <span class="keymap-homing-bar"></span>
              {/if}
            </div>
          {/each}
        </div>
      {/each}

      <!-- Left Row 4 (Full Thumb Cluster) -->
      <div class="flex items-center" style:gap="var(--km-gap)">
        <div style:width="var(--km-unit)"></div>
        <div
          class={['keymap-key keymap-key-mod keymap-key-unrotated-left', keyStateClass('ControlLeft')].join(' ')}
          style:width="calc(var(--km-unit) * 1.25 + var(--km-gap) * 0.25)"
          data-code="ControlLeft"
        >
          <span>Ctrl</span>
        </div>
        <div style:width="calc(var(--km-unit) * 1.25 + var(--km-gap) * 1.25)"></div>
        <div
          class={['keymap-key keymap-key-mod', keyStateClass('AltLeft')].join(' ')}
          style:width="calc(var(--km-unit) * 1.25 + var(--km-gap) * 0.25)"
          data-code="AltLeft"
        >
          <span>Alt</span>
        </div>
        <div
          class={['keymap-key', keyStateClass('Space')].join(' ')}
          style:width="calc(var(--km-unit) * 2.25 + var(--km-gap) * 1.25)"
          data-code="Space"
        ></div>
        <div
          class={['keymap-key keymap-key-mod', keyStateClass('MetaLeft')].join(' ')}
          style:width="calc(var(--km-unit) * 1.25 + var(--km-gap) * 0.25)"
          data-code="MetaLeft"
        >
          <span>Super</span>
        </div>
      </div>
    {:else}
      <!-- Left Minimal / Minimal Numrow Rows -->
      {#each normalRows as row (row.rowIndex)}
        <div
          class="flex items-center"
          style:gap="var(--km-gap)"
          style:margin-left="calc(var(--km-unit) * {row.offsetU} + var(--km-gap) * {row.offsetU})"
        >
          {#each row.leftKeys as key (key.code)}
            <div
              class={['keymap-key', keyStateClass(key.code)].join(' ')}
              data-code={key.code}
            >
              <span>{getLegend(key)}</span>
              {#if key.code === 'KeyF'}
                <span class="keymap-homing-bar"></span>
              {/if}
            </div>
          {/each}
        </div>
      {/each}

      <!-- Left Spacebar (Minimal / Minimal Numrow) -->
      <div
        class="flex items-center"
        style:margin-left="calc(var(--km-unit) * {showKeys === 'minimal_numrow' ? 2.75 : 2.25} + var(--km-gap) * {showKeys === 'minimal_numrow' ? 2.75 : 2.25})"
        style:gap="var(--km-gap)"
      >
        <div
          class={['keymap-key', keyStateClass('Space')].join(' ')}
          style:width="calc(var(--km-unit) * 2.25 + var(--km-gap) * 1.25)"
          data-code="Space"
        ></div>
      </div>
    {/if}
  </div>

  <!-- Right Rotated Half -->
  <div
    class="flex flex-col items-start"
    style:transform="rotate({geom.rightRotationDeg}deg)"
    style:transform-origin="top right"
    style:gap="var(--km-gap)"
  >
    {#if showKeys === 'full'}
      <!-- Right Full Rows -->
      {#each normalRows as row (row.rowIndex)}
        <div class="flex items-center" style:gap="var(--km-gap)">
          {#each row.rightKeys as key (key.code)}
            <div
              class={['keymap-key', keyStateClass(key.code)].join(' ')}
              data-code={key.code}
            >
              <span>{getLegend(key)}</span>
              {#if key.code === 'KeyJ'}
                <span class="keymap-homing-bar"></span>
              {/if}
            </div>
          {/each}

          {#if row.rowIndex === 0}
            <div
              class={['keymap-key keymap-key-mod', keyStateClass('Backspace')].join(' ')}
              style:width="calc(var(--km-unit) * 2.0 + var(--km-gap) * 1.0)"
              data-code="Backspace"
            >
              <span class="whitespace-nowrap">Backspace</span>
            </div>
          {:else if row.rowIndex === 1}
            <div
              class={['keymap-key', keyStateClass('Backslash')].join(' ')}
              style:width="calc(var(--km-unit) * 1.5 + var(--km-gap) * 0.5)"
              data-code="Backslash"
            >
              <span>{backslashKey ? getLegend(backslashKey) : '\\'}</span>
            </div>
          {:else if row.rowIndex === 2}
            <div
              class={['keymap-key keymap-key-mod', keyStateClass('Enter')].join(' ')}
              style:width="calc(var(--km-unit) * 2.25 + var(--km-gap) * 1.25)"
              data-code="Enter"
            >
              <span>Enter</span>
            </div>
          {:else if row.rowIndex === 3}
            <div
              class={['keymap-key keymap-key-mod', keyStateClass('ShiftRight')].join(' ')}
              style:width="calc(var(--km-unit) * 1.75 + var(--km-gap) * 0.75)"
              data-code="ShiftRight"
            >
              <span>⇧</span>
            </div>
            <div
              class={['keymap-key keymap-key-mod', keyStateClass('Fn')].join(' ')}
              data-code="Fn"
            >
              <span>fn</span>
            </div>
          {/if}
        </div>
      {/each}

      <!-- Right Row 4 (Full Thumb Cluster) -->
      <div class="flex items-center" style:gap="var(--km-gap)">
        <div
          class={['keymap-key', keyStateClass('Space')].join(' ')}
          style:width="calc(var(--km-unit) * 2.75 + var(--km-gap) * 1.75)"
          data-code="Space"
        >
          <span class="keymap-space-label">{spaceLegend}</span>
          {#if spaceLegend}
            <span class="keymap-space-reset" aria-hidden="true">↻</span>
          {/if}
        </div>
        <div
          class={['keymap-key keymap-key-mod', keyStateClass('AltRight')].join(' ')}
          style:width="calc(var(--km-unit) * 1.25 + var(--km-gap) * 0.25)"
          data-code="AltRight"
        >
          <span>Alt</span>
        </div>
        <div style:width="calc(var(--km-unit) * 3.5 + var(--km-gap) * 3.5)"></div>
        <div
          class={['keymap-key keymap-key-mod keymap-key-unrotated-right', keyStateClass('ControlRight')].join(' ')}
          style:width="calc(var(--km-unit) * 1.25 + var(--km-gap) * 0.25)"
          data-code="ControlRight"
        >
          <span>Ctrl</span>
        </div>
      </div>
    {:else}
      <!-- Right Minimal / Minimal Numrow Rows -->
      {#each normalRows as row (row.rowIndex)}
        <div
          class="flex items-center"
          style:gap="var(--km-gap)"
          style:margin-left="calc(var(--km-unit) * {row.rightOffsetU ?? 0} + var(--km-gap) * {row.rightOffsetU ?? 0})"
        >
          {#each row.rightKeys as key (key.code)}
            <div
              class={['keymap-key', keyStateClass(key.code)].join(' ')}
              data-code={key.code}
            >
              <span>{getLegend(key)}</span>
              {#if key.code === 'KeyJ'}
                <span class="keymap-homing-bar"></span>
              {/if}
            </div>
          {/each}
        </div>
      {/each}

      <!-- Right Spacebar (Minimal / Minimal Numrow) -->
      <div class="flex items-center" style:gap="var(--km-gap)">
        <div
          class={['keymap-key', keyStateClass('Space')].join(' ')}
          style:width="calc(var(--km-unit) * 2.75 + var(--km-gap) * 1.75)"
          data-code="Space"
        >
          <span class="keymap-space-label">{spaceLegend}</span>
          {#if spaceLegend}
            <span class="keymap-space-reset" aria-hidden="true">↻</span>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
