<script lang="ts">
  import type { KeyDef } from '@/core/hand-guide';
  import type {
    KeymapGeometryInfo,
    KeymapRow,
    KeymapShowKeys,
    KeymapStyle,
  } from '@/core/keymap';

  interface Props {
    style: Extract<KeymapStyle, 'split' | 'split_matrix'>;
    geom: KeymapGeometryInfo;
    normalRows: readonly KeymapRow[];
    showKeys: KeymapShowKeys;
    spaceLegend: string;
    backquoteKey?: KeyDef;
    backslashKey?: KeyDef;
    bracketLeftKey?: KeyDef;
    quoteKey?: KeyDef;
    keyStateClass: (code: string) => string;
    getLegend: (key: KeyDef) => string;
  }

  let {
    style,
    geom,
    normalRows,
    showKeys,
    spaceLegend,
    backquoteKey,
    backslashKey,
    bracketLeftKey,
    quoteKey,
    keyStateClass,
    getLegend,
  }: Props = $props();
</script>

{#if style === 'split_matrix'}
  <!-- ==================== SPLIT MATRIX (ORTHOLINEAR DUAL MATRIX) ==================== -->
  <div
    class="flex items-start justify-center"
    style:gap="calc(var(--km-unit) * {geom.splitGapU})"
  >
    <!-- Left Ortholinear Half -->
    <div class="flex flex-col items-start" style:gap="var(--km-gap)">
      {#if showKeys === 'full'}
        <!-- Left Full Rows (6 columns) -->
        {#each normalRows as row (row.rowIndex)}
          <div class="flex items-center" style:gap="var(--km-gap)">
            {#if row.rowIndex === 0}
              <div
                class={['keymap-key', keyStateClass('Backquote')].join(' ')}
                data-code="Backquote"
              >
                <span>{backquoteKey ? getLegend(backquoteKey) : '`'}</span>
              </div>
            {:else if row.rowIndex === 1}
              <div
                class={['keymap-key keymap-key-mod', keyStateClass('Tab')].join(' ')}
                data-code="Tab"
              >
                <span>Tab</span>
              </div>
            {:else if row.rowIndex === 2}
              <div
                class={['keymap-key keymap-key-mod', keyStateClass('Escape')].join(' ')}
                data-code="Escape"
              >
                <span>Esc</span>
              </div>
            {:else if row.rowIndex === 3}
              <div
                class={['keymap-key keymap-key-mod', keyStateClass('ShiftLeft')].join(' ')}
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

        <!-- Left Row 4: Modifiers (Ctrl, Super, Alt: 1u each) + Spacebar (3u) -->
        <div class="flex items-center" style:gap="var(--km-gap)">
          <div
            class={['keymap-key keymap-key-mod', keyStateClass('ControlLeft')].join(' ')}
            data-code="ControlLeft"
          >
            <span>Ctrl</span>
          </div>
          <div
            class={['keymap-key keymap-key-mod', keyStateClass('MetaLeft')].join(' ')}
            data-code="MetaLeft"
          >
            <span>Super</span>
          </div>
          <div
            class={['keymap-key keymap-key-mod', keyStateClass('AltLeft')].join(' ')}
            data-code="AltLeft"
          >
            <span>Alt</span>
          </div>
          <div
            class={['keymap-key', keyStateClass('Space')].join(' ')}
            style:width="calc(var(--km-unit) * 3.0 + var(--km-gap) * 2.0)"
            data-code="Space"
          >
            <span class="keymap-space-label">{spaceLegend}</span>
          </div>
        </div>
      {:else}
        <!-- Left Minimal / Minimal Numrow Rows (5 columns) -->
        {#each normalRows as row (row.rowIndex)}
          <div class="flex items-center" style:gap="var(--km-gap)">
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

        <!-- Left Spacebar (3u, offset by 2u under c, v, b) -->
        <div
          class="flex items-center"
          style:margin-left="calc(var(--km-unit) * 2.0 + var(--km-gap) * 2.0)"
          style:gap="var(--km-gap)"
        >
          <div
            class={['keymap-key', keyStateClass('Space')].join(' ')}
            style:width="calc(var(--km-unit) * 3.0 + var(--km-gap) * 2.0)"
            data-code="Space"
          >
            <span class="keymap-space-label">{spaceLegend}</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Right Ortholinear Half -->
    <div class="flex flex-col items-start" style:gap="var(--km-gap)">
      {#if showKeys === 'full'}
        <!-- Right Full Rows (6 columns) -->
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
                data-code="Backspace"
              >
                <span>⌫</span>
              </div>
            {:else if row.rowIndex === 1}
              <div
                class={['keymap-key', keyStateClass('BracketLeft')].join(' ')}
                data-code="BracketLeft"
              >
                <span>{bracketLeftKey ? getLegend(bracketLeftKey) : '['}</span>
              </div>
            {:else if row.rowIndex === 2}
              <div
                class={['keymap-key', keyStateClass('Quote')].join(' ')}
                data-code="Quote"
              >
                <span>{quoteKey ? getLegend(quoteKey) : "'"}</span>
              </div>
            {:else if row.rowIndex === 3}
              <div
                class={['keymap-key keymap-key-mod', keyStateClass('Enter')].join(' ')}
                data-code="Enter"
              >
                <span>↵</span>
              </div>
            {/if}
          </div>
        {/each}

        <!-- Right Row 4: Spacebar (3u, Blank) + Alt + Blank Keycap + Ctrl -->
        <div class="flex items-center" style:gap="var(--km-gap)">
          <div
            class={['keymap-key', keyStateClass('Space')].join(' ')}
            style:width="calc(var(--km-unit) * 3.0 + var(--km-gap) * 2.0)"
            data-code="Space"
          ></div>
          <div
            class={['keymap-key keymap-key-mod', keyStateClass('AltRight')].join(' ')}
            data-code="AltRight"
          >
            <span>Alt</span>
          </div>
          <div class="keymap-key"></div>
          <div
            class={['keymap-key keymap-key-mod', keyStateClass('ControlRight')].join(' ')}
            data-code="ControlRight"
          >
            <span>Ctrl</span>
          </div>
        </div>
      {:else}
        <!-- Right Minimal / Minimal Numrow Rows (5 columns) -->
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
          </div>
        {/each}

        <!-- Right Spacebar (3u, blank, aligned to left / inner edge under n, m, ,) -->
        <div class="flex items-center" style:gap="var(--km-gap)">
          <div
            class={['keymap-key', keyStateClass('Space')].join(' ')}
            style:width="calc(var(--km-unit) * 3.0 + var(--km-gap) * 2.0)"
            data-code="Space"
          ></div>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <!-- ==================== SPLIT (ROW-STAGGERED DUAL SPLIT) ==================== -->
  <div
    class="flex items-start justify-center"
    style:gap="calc(var(--km-unit) * {geom.splitGapU})"
  >
    <!-- Left Split Half (Flush Left) -->
    <div class="flex flex-col items-start" style:gap="var(--km-gap)">
      {#if showKeys === 'full'}
        <!-- Left Full Rows -->
        {#each normalRows as row (row.rowIndex)}
          <div class="flex items-center" style:gap="var(--km-gap)">
            {#if row.rowIndex === 0}
              <div
                class={['keymap-key', keyStateClass('Backquote')].join(' ')}
                data-code="Backquote"
              >
                <span>{backquoteKey ? getLegend(backquoteKey) : '`'}</span>
              </div>
            {:else if row.rowIndex === 1}
              <div
                class={['keymap-key keymap-key-mod', keyStateClass('Tab')].join(' ')}
                style:width="calc(var(--km-unit) * 1.5 + var(--km-gap) * 0.5)"
                data-code="Tab"
              >
                <span>Tab</span>
              </div>
            {:else if row.rowIndex === 2}
              <div
                class={['keymap-key keymap-key-mod', keyStateClass('CapsLock')].join(' ')}
                style:width="calc(var(--km-unit) * 1.75 + var(--km-gap) * 0.75)"
                data-code="CapsLock"
              >
                <span>Caps</span>
              </div>
            {:else if row.rowIndex === 3}
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

        <!-- Left Row 4 (Full Modifiers + Spacebar) -->
        <div class="flex items-center" style:gap="var(--km-gap)">
          <div
            class={['keymap-key keymap-key-mod', keyStateClass('ControlLeft')].join(' ')}
            style:width="calc(var(--km-unit) * 1.25 + var(--km-gap) * 0.25)"
            data-code="ControlLeft"
          >
            <span>Ctrl</span>
          </div>
          <div
            class={['keymap-key keymap-key-mod', keyStateClass('MetaLeft')].join(' ')}
            style:width="calc(var(--km-unit) * 1.25 + var(--km-gap) * 0.25)"
            data-code="MetaLeft"
          >
            <span>Super</span>
          </div>
          <div
            class={['keymap-key keymap-key-mod', keyStateClass('AltLeft')].join(' ')}
            style:width="calc(var(--km-unit) * 1.25 + var(--km-gap) * 0.25)"
            data-code="AltLeft"
          >
            <span>Alt</span>
          </div>
          <div
            class={['keymap-key', keyStateClass('Space')].join(' ')}
            style:width="calc(var(--km-unit) * 3.5 + var(--km-gap) * 2.5)"
            data-code="Space"
          >
            <span class="keymap-space-label">{spaceLegend}</span>
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
            style:width="calc(var(--km-unit) * 3.5 + var(--km-gap) * 2.5)"
            data-code="Space"
          >
            <span class="keymap-space-label">{spaceLegend}</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Right Split Half -->
    <div
      class={['flex flex-col', showKeys === 'full' ? 'items-end' : 'items-start'].join(' ')}
      style:gap="var(--km-gap)"
    >
      {#if showKeys === 'full'}
        <!-- Right Full Rows (Flush Right) -->
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
                <span>Backspace</span>
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
                style:width="calc(var(--km-unit) * 2.75 + var(--km-gap) * 1.75)"
                data-code="ShiftRight"
              >
                <span>⇧</span>
              </div>
            {/if}
          </div>
        {/each}

        <!-- Right Row 4 (Full Modifiers + Blank Spacebar) -->
        <div class="flex items-center" style:gap="var(--km-gap)">
          <div
            class={['keymap-key', keyStateClass('Space')].join(' ')}
            style:width="calc(var(--km-unit) * 2.75 + var(--km-gap) * 1.75)"
            data-code="Space"
          ></div>
          <div
            class={['keymap-key keymap-key-mod', keyStateClass('AltRight')].join(' ')}
            style:width="calc(var(--km-unit) * 1.25 + var(--km-gap) * 0.25)"
            data-code="AltRight"
          >
            <span>Alt</span>
          </div>
          <div
            class={['keymap-key keymap-key-mod', keyStateClass('MetaRight')].join(' ')}
            style:width="calc(var(--km-unit) * 1.25 + var(--km-gap) * 0.25)"
            data-code="MetaRight"
          >
            <span>Super</span>
          </div>
          <div
            class={['keymap-key keymap-key-mod', keyStateClass('ContextMenu')].join(' ')}
            style:width="calc(var(--km-unit) * 1.25 + var(--km-gap) * 0.25)"
            data-code="ContextMenu"
          >
            <span>Monke</span>
          </div>
          <div
            class={['keymap-key keymap-key-mod', keyStateClass('ControlRight')].join(' ')}
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

        <!-- Right Spacebar (Minimal / Minimal Numrow, Blank) -->
        <div
          class="flex items-center"
          style:margin-left="calc(var(--km-unit) * 0.75 + var(--km-gap) * 0.75)"
          style:gap="var(--km-gap)"
        >
          <div
            class={['keymap-key', keyStateClass('Space')].join(' ')}
            style:width="calc(var(--km-unit) * 2.75 + var(--km-gap) * 1.75)"
            data-code="Space"
          ></div>
        </div>
      {/if}
    </div>
  </div>
{/if}
