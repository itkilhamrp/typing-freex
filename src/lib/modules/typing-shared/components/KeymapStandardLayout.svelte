<script lang="ts">
  import type { KeyDef } from '@/core/hand-guide';
  import type { KeymapRow, KeymapShowKeys, KeymapStyle } from '@/core/keymap';

  interface Props {
    style: Extract<KeymapStyle, 'matrix' | 'staggered'>;
    normalRows: readonly KeymapRow[];
    showKeys: KeymapShowKeys;
    spaceOffsetU: number;
    spaceLegend: string;
    backquoteKey?: KeyDef;
    bracketLeftKey?: KeyDef;
    quoteKey?: KeyDef;
    keyStateClass: (code: string) => string;
    getLegend: (key: KeyDef) => string;
  }

  let {
    style,
    normalRows,
    showKeys,
    spaceOffsetU,
    spaceLegend,
    backquoteKey,
    bracketLeftKey,
    quoteKey,
    keyStateClass,
    getLegend,
  }: Props = $props();
</script>

{#if style === 'matrix'}
  <!-- ==================== MATRIX (ORTHOLINEAR SINGLE GRID) ==================== -->
  <div class="flex flex-col items-center" style:gap="var(--km-gap)">
    {#if showKeys === 'full'}
      <!-- 12-Column Preonic Ortholinear Grid (Rows 0..3) -->
      {#each normalRows as row (row.rowIndex)}
        <div class="flex items-center justify-center" style:gap="var(--km-gap)">
          <!-- Left Outer Key (Column 0, 1.0u) -->
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

          <!-- 10 Core Ortholinear Keys (Columns 1..10) -->
          {#each row.keys as key (key.code)}
            <div
              class={['keymap-key', keyStateClass(key.code)].join(' ')}
              data-code={key.code}
            >
              <span>{getLegend(key)}</span>
              {#if key.code === 'KeyF' || key.code === 'KeyJ'}
                <span class="keymap-homing-bar"></span>
              {/if}
            </div>
          {/each}

          <!-- Right Outer Key (Column 11, 1.0u) -->
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

      <!-- Row 4: Bottom Modifiers & Centered 6.0u Spacebar (12 Columns Total) -->
      <div class="flex items-center justify-center" style:gap="var(--km-gap)">
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
          style:width="calc(var(--km-unit) * 6.0 + var(--km-gap) * 5.0)"
          data-code="Space"
        >
          <span class="keymap-space-label">{spaceLegend}</span>
        </div>
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
      <!-- 10-Column Minimal / Minimal Numrow Ortholinear Grid -->
      {#each normalRows as row (row.rowIndex)}
        <div class="flex items-center justify-center" style:gap="var(--km-gap)">
          {#each row.keys as key (key.code)}
            <div
              class={['keymap-key', keyStateClass(key.code)].join(' ')}
              data-code={key.code}
            >
              <span>{getLegend(key)}</span>
              {#if key.code === 'KeyF' || key.code === 'KeyJ'}
                <span class="keymap-homing-bar"></span>
              {/if}
            </div>
          {/each}
        </div>
      {/each}

      <!-- Spacebar Row (4.0u centered under 10 columns) -->
      <div class="flex items-center justify-center" style:gap="var(--km-gap)">
        <div
          class={['keymap-key', keyStateClass('Space')].join(' ')}
          style:width="calc(var(--km-unit) * 4.0 + var(--km-gap) * 3.0)"
          data-code="Space"
        >
          <span class="keymap-space-label">{spaceLegend}</span>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <!-- ==================== STAGGERED (STANDARD ANSI 15.0u) ==================== -->
  <div class="flex flex-col items-start" style:gap="var(--km-gap)">
    {#each normalRows as row (row.rowIndex)}
      <div
        class="flex items-center justify-start"
        style:gap="var(--km-gap)"
        style:margin-left="calc(var(--km-unit) * {row.offsetU} + var(--km-gap) * {row.offsetU})"
      >
        <!-- Left Side Modifier (Full mode only) -->
        {#if showKeys === 'full'}
          {#if row.rowIndex === 1}
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
        {/if}

        <!-- Alpha and Punctuation Keys -->
        {#each row.keys as key (key.code)}
          {#if key.code === 'Backslash' && showKeys === 'full'}
            <div
              class={['keymap-key', keyStateClass(key.code)].join(' ')}
              style:width="calc(var(--km-unit) * 1.5 + var(--km-gap) * 0.5)"
              data-code={key.code}
            >
              <span>{getLegend(key)}</span>
            </div>
          {:else}
            <div
              class={['keymap-key', keyStateClass(key.code)].join(' ')}
              data-code={key.code}
            >
              <span>{getLegend(key)}</span>
              {#if key.code === 'KeyF' || key.code === 'KeyJ'}
                <span class="keymap-homing-bar"></span>
              {/if}
            </div>
          {/if}
        {/each}

        <!-- Right Side Modifier (Full mode only) -->
        {#if showKeys === 'full'}
          {#if row.rowIndex === 0}
            <div
              class={['keymap-key keymap-key-mod', keyStateClass('Backspace')].join(' ')}
              style:width="calc(var(--km-unit) * 2.0 + var(--km-gap) * 1.0)"
              data-code="Backspace"
            >
              <span>Backspace</span>
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
        {/if}
      </div>
    {/each}

    <!-- Row 4: Spacebar & Bottom Modifiers -->
    {#if showKeys === 'full'}
      <div class="flex items-center justify-start" style:gap="var(--km-gap)">
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
          style:width="calc(var(--km-unit) * 6.25 + var(--km-gap) * 5.25)"
          data-code="Space"
        >
          <span class="keymap-space-label">{spaceLegend}</span>
        </div>
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
      <!-- Single Continuous Spacebar (Minimal & Minimal Numrow) -->
      <div
        class="flex items-center justify-start"
        style:margin-left="calc(var(--km-unit) * {spaceOffsetU} + var(--km-gap) * {spaceOffsetU})"
      >
        <div
          class={['keymap-key', keyStateClass('Space')].join(' ')}
          style:width="calc(var(--km-unit) * 6.25 + var(--km-gap) * 5.25)"
          data-code="Space"
        >
          <span class="keymap-space-label">{spaceLegend}</span>
        </div>
      </div>
    {/if}
  </div>
{/if}
