import { describe, it, expect } from 'vitest';
import {
  getGeometryInfo,
  buildKeymapRows,
  buildStenoRows,
  resolveKeyLegend,
  STENO_KEYS,
  STENO_MATRIX_LEFT,
  STENO_MATRIX_RIGHT,
  resolveStenoLegend,
  resolveNextKeyCode,
  type KeymapStyle,
} from './keymap-geometry';
import defaultLayoutData from '../../../content-packs/keyboard-layouts/qwerty-us.json';
import type { KeyboardLayoutDef } from '@/core/hand-guide';

const layout = defaultLayoutData as unknown as KeyboardLayoutDef;

describe('Keymap Geometry Engine', () => {
  it('defines correct geometry configuration for all 7 styles', () => {
    const styles: KeymapStyle[] = [
      'staggered',
      'alice',
      'matrix',
      'split',
      'split_matrix',
      'steno',
      'steno_matrix',
    ];

    for (const style of styles) {
      const geom = getGeometryInfo(style);
      expect(geom.style).toBe(style);

      if (style === 'alice') {
        expect(geom.isAlice).toBe(true);
        expect(geom.isSplit).toBe(true);
        expect(geom.isMatrix).toBe(false);
        expect(geom.leftRotationDeg).toBe(12);
        expect(geom.rightRotationDeg).toBe(-12);
        expect(geom.splitGapU).toBe(0.5);
      } else if (style === 'split') {
        expect(geom.isSplit).toBe(true);
        expect(geom.isAlice).toBe(false);
        expect(geom.isMatrix).toBe(false);
        expect(geom.leftRotationDeg).toBe(0);
        expect(geom.splitGapU).toBe(2.5);
      } else if (style === 'split_matrix') {
        expect(geom.isSplit).toBe(true);
        expect(geom.isMatrix).toBe(true);
        expect(geom.rowOffsets.every((o) => o === 0)).toBe(true);
      } else if (style === 'matrix') {
        expect(geom.isSplit).toBe(false);
        expect(geom.isMatrix).toBe(true);
        expect(geom.rowOffsets.every((o) => o === 0)).toBe(true);
      } else if (style === 'steno') {
        expect(geom.isSteno).toBe(true);
        expect(geom.isSplit).toBe(true);
        expect(geom.isMatrix).toBe(false);
        expect(geom.rowOffsets).toEqual([0, 0.5, 0.75, 3.25]);
      } else if (style === 'steno_matrix') {
        expect(geom.isSteno).toBe(true);
        expect(geom.isSplit).toBe(true);
        expect(geom.isMatrix).toBe(true);
        expect(geom.rowOffsets).toEqual([0, 0, 0, 0]);
      } else {
        // staggered
        expect(geom.isSplit).toBe(false);
        expect(geom.isAlice).toBe(false);
        expect(geom.isMatrix).toBe(false);
        expect(geom.rowOffsets).toEqual([0, 0.25, 0.5, 0.75, 0]);
      }
    }
  });

  it('builds rows based on showKeys filter and calculates exact mathematical offsets', () => {
    // minimal: only alpha rows (Rows 1, 2, 3) with relative ANSI typewriter stagger
    const minimalRows = buildKeymapRows(layout, 'staggered', 'minimal');
    expect(minimalRows.length).toBe(3);
    expect(minimalRows[0]?.rowIndex).toBe(1);
    expect(minimalRows[0]?.offsetU).toBe(0);
    expect(minimalRows[1]?.rowIndex).toBe(2);
    expect(minimalRows[1]?.offsetU).toBe(0.25);
    expect(minimalRows[2]?.rowIndex).toBe(3);
    expect(minimalRows[2]?.offsetU).toBe(0.75);

    // minimal_numrow: Row 0 (Digit1..Equal) + alpha rows with offsets relative to Digit1
    const numrowRows = buildKeymapRows(layout, 'staggered', 'minimal_numrow');
    expect(numrowRows.length).toBe(4);
    expect(numrowRows[0]?.rowIndex).toBe(0);
    expect(numrowRows[0]?.offsetU).toBe(0);
    expect(numrowRows[0]?.keys.length).toBe(12);
    expect(numrowRows[0]?.keys[0]?.code).toBe('Digit1');
    expect(numrowRows[0]?.keys[11]?.code).toBe('Equal');
    expect(numrowRows[0]?.keys.some((k) => k.code === 'Backquote')).toBe(false);

    expect(numrowRows[1]?.rowIndex).toBe(1);
    expect(numrowRows[1]?.offsetU).toBe(0.5);
    expect(numrowRows[1]?.keys.length).toBe(12);
    expect(numrowRows[1]?.keys.some((k) => k.code === 'Backslash')).toBe(false);

    expect(numrowRows[2]?.rowIndex).toBe(2);
    expect(numrowRows[2]?.offsetU).toBe(0.75);
    expect(numrowRows[3]?.rowIndex).toBe(3);
    expect(numrowRows[3]?.offsetU).toBe(1.25);

    // minimal: Row 1 excludes Backslash (12 keys total)
    expect(minimalRows[0]?.keys.length).toBe(12);
    expect(minimalRows[0]?.keys.some((k) => k.code === 'Backslash')).toBe(false);

    // full: all rows with zero container offset because modifiers provide the stagger
    const fullRows = buildKeymapRows(layout, 'staggered', 'full');
    expect(fullRows.length).toBe(4);
    expect(fullRows.every((r) => r.offsetU === 0)).toBe(true);
    expect(fullRows[0]?.keys.length).toBe(13); // Backquote + 12 digits/symbols
    expect(fullRows[1]?.keys.length).toBe(13); // KeyQ..BracketRight + Backslash

    // matrix and split_matrix: strictly zero offset across all modes
    const matrixMinimal = buildKeymapRows(layout, 'matrix', 'minimal');
    expect(matrixMinimal.every((r) => r.offsetU === 0)).toBe(true);
    const splitMatrixFull = buildKeymapRows(layout, 'split_matrix', 'full');
    expect(splitMatrixFull.every((r) => r.offsetU === 0)).toBe(true);
  });

  it('correctly splits keys into left and right halves for split_matrix', () => {
    // minimal: 3 rows (Rows 1..3), strictly 5 keys left and 5 keys right
    const minRows = buildKeymapRows(layout, 'split_matrix', 'minimal');
    expect(minRows.length).toBe(3);
    for (const row of minRows) {
      expect(row.leftKeys.length).toBe(5);
      expect(row.rightKeys.length).toBe(5);
      expect(row.offsetU).toBe(0);
      expect(row.rightOffsetU).toBe(0);
    }

    // minimal_numrow: 4 rows (Rows 0..3), strictly 5 keys left (1..5) and 5 keys right (6..0)
    const numrowRows = buildKeymapRows(layout, 'split_matrix', 'minimal_numrow');
    expect(numrowRows.length).toBe(4);
    const row0 = numrowRows[0]!;
    expect(row0.leftKeys.map((k) => k.code)).toEqual([
      'Digit1',
      'Digit2',
      'Digit3',
      'Digit4',
      'Digit5',
    ]);
    expect(row0.rightKeys.map((k) => k.code)).toEqual([
      'Digit6',
      'Digit7',
      'Digit8',
      'Digit9',
      'Digit0',
    ]);

    // full: 4 rows (Rows 0..3), 5 core keys left and 5 core keys right
    const fullRows = buildKeymapRows(layout, 'split_matrix', 'full');
    expect(fullRows.length).toBe(4);
    const row1 = fullRows[1]!;
    const row2 = fullRows[2]!;
    const row3 = fullRows[3]!;

    // Row 1: q w e r t | y u i o p
    expect(row1.leftKeys.map((k) => k.code)).toEqual([
      'KeyQ',
      'KeyW',
      'KeyE',
      'KeyR',
      'KeyT',
    ]);
    expect(row1.rightKeys.map((k) => k.code)).toEqual([
      'KeyY',
      'KeyU',
      'KeyI',
      'KeyO',
      'KeyP',
    ]);

    // Row 2: a s d f g | h j k l ;
    expect(row2.leftKeys.map((k) => k.code)).toEqual([
      'KeyA',
      'KeyS',
      'KeyD',
      'KeyF',
      'KeyG',
    ]);
    expect(row2.rightKeys.map((k) => k.code)).toEqual([
      'KeyH',
      'KeyJ',
      'KeyK',
      'KeyL',
      'Semicolon',
    ]);

    // Row 3: z x c v b | n m , . /
    expect(row3.leftKeys.map((k) => k.code)).toEqual([
      'KeyZ',
      'KeyX',
      'KeyC',
      'KeyV',
      'KeyB',
    ]);
    expect(row3.rightKeys.map((k) => k.code)).toEqual([
      'KeyN',
      'KeyM',
      'Comma',
      'Period',
      'Slash',
    ]);
  });

  it('builds Split rows with ANSI typewriter stagger and symmetrical number row', () => {
    // minimal: 3 rows (Rows 1, 2, 3)
    const minimalRows = buildKeymapRows(layout, 'split', 'minimal');
    expect(minimalRows.length).toBe(3);

    // Row 1: Left (Q..T, 5 keys), Right (Y..], 7 keys)
    expect(minimalRows[0]?.leftKeys.length).toBe(5);
    expect(minimalRows[0]?.rightKeys.length).toBe(7);
    expect(minimalRows[0]?.offsetU).toBe(0);
    expect(minimalRows[0]?.rightOffsetU).toBe(0);

    // Row 2: Left (A..G, 5 keys), Right (H..', 6 keys)
    expect(minimalRows[1]?.leftKeys.length).toBe(5);
    expect(minimalRows[1]?.rightKeys.length).toBe(6);
    expect(minimalRows[1]?.offsetU).toBe(0.25);
    expect(minimalRows[1]?.rightOffsetU).toBe(0.25);

    // Row 3: Left (Z..B, 5 keys), Right (N../, 5 keys) - Single B on Left!
    expect(minimalRows[2]?.leftKeys.length).toBe(5);
    expect(minimalRows[2]?.rightKeys.length).toBe(5);
    expect(minimalRows[2]?.offsetU).toBe(0.75);
    expect(minimalRows[2]?.rightOffsetU).toBe(0.75);
    expect(minimalRows[2]?.leftKeys.some((k) => k.code === 'KeyB')).toBe(true);
    expect(minimalRows[2]?.rightKeys.some((k) => k.code === 'KeyB')).toBe(false);

    // minimal_numrow: Row 0 split 6 left (1..6) / 6 right (7..=)
    const numrowRows = buildKeymapRows(layout, 'split', 'minimal_numrow');
    expect(numrowRows.length).toBe(4);
    expect(numrowRows[0]?.leftKeys.map((k) => k.code)).toEqual([
      'Digit1',
      'Digit2',
      'Digit3',
      'Digit4',
      'Digit5',
      'Digit6',
    ]);
    expect(numrowRows[0]?.rightKeys.map((k) => k.code)).toEqual([
      'Digit7',
      'Digit8',
      'Digit9',
      'Digit0',
      'Minus',
      'Equal',
    ]);
    expect(numrowRows[0]?.offsetU).toBe(0);
    expect(numrowRows[0]?.rightOffsetU).toBe(0.5);
    expect(numrowRows[1]?.offsetU).toBe(0.5);
    expect(numrowRows[1]?.rightOffsetU).toBe(0);
    expect(numrowRows[2]?.offsetU).toBe(0.75);
    expect(numrowRows[2]?.rightOffsetU).toBe(0.25);
    expect(numrowRows[3]?.offsetU).toBe(1.25);
    expect(numrowRows[3]?.rightOffsetU).toBe(0.75);

    // full: zero container offsets (physical modifiers intrinsically provide flush layout)
    const fullRows = buildKeymapRows(layout, 'split', 'full');
    expect(fullRows.length).toBe(4);
    expect(fullRows.every((r) => r.offsetU === 0 && r.rightOffsetU === 0)).toBe(true);
  });

  it('resolves key legend correctly according to legendStyle and shift state', () => {
    const keyQ = layout.keys.find((k) => k.code === 'KeyQ')!;
    const digit1 = layout.keys.find((k) => k.code === 'Digit1')!;

    // lowercase
    expect(resolveKeyLegend(keyQ, 'lowercase')).toBe('q');
    expect(resolveKeyLegend(digit1, 'lowercase')).toBe('1');

    // uppercase
    expect(resolveKeyLegend(keyQ, 'uppercase')).toBe('Q');
    expect(resolveKeyLegend(digit1, 'uppercase')).toBe('!');

    // blank
    expect(resolveKeyLegend(keyQ, 'blank')).toBe('');
    expect(resolveKeyLegend(digit1, 'blank')).toBe('');

    // dynamic: unshifted vs shifted
    expect(resolveKeyLegend(keyQ, 'dynamic', false)).toBe('q');
    expect(resolveKeyLegend(keyQ, 'dynamic', true)).toBe('Q');
    expect(resolveKeyLegend(digit1, 'dynamic', false)).toBe('1');
    expect(resolveKeyLegend(digit1, 'dynamic', true)).toBe('!');
  });

  it('builds Steno rows with distinct layouts for typewriter steno vs steno_matrix', () => {
    // Typewriter Steno: QWERTY physical stagger
    const steno = buildStenoRows('full', 'steno');
    expect(steno.length).toBe(4);
    expect(steno[1]?.offsetU).toBe(0.5);
    expect(steno[2]?.offsetU).toBe(0.75);
    expect(steno[3]?.offsetU).toBe(3.25);

    // Steno Matrix: Hardware Stenotype ortholinear matrix
    const stenoMatrix = buildStenoRows('full', 'steno_matrix');
    expect(stenoMatrix.length).toBe(4);
    expect(stenoMatrix[1]?.offsetU).toBe(0);
    expect(stenoMatrix[2]?.offsetU).toBe(0);
    expect(stenoMatrix[3]?.offsetU).toBe(2.5);

    // Key mappings parity
    const upperCodes = stenoMatrix[1]?.keys.map((k) => k.code);
    expect(upperCodes).toContain('KeyQ');
    expect(upperCodes).toContain('KeyW');
    expect(upperCodes).toContain('KeyE');
    expect(upperCodes).toContain('KeyR');
    expect(upperCodes).toContain('KeyT');
    expect(upperCodes).toContain('KeyY');
    expect(upperCodes).toContain('BracketLeft');

    const lowerCodes = stenoMatrix[2]?.keys.map((k) => k.code);
    expect(lowerCodes).toContain('KeyA');
    expect(lowerCodes).toContain('KeyS');
    expect(lowerCodes).toContain('KeyD');
    expect(lowerCodes).toContain('KeyF');
    expect(lowerCodes).toContain('Quote');

    const vowelCodes = stenoMatrix[3]?.keys.map((k) => k.code);
    expect(vowelCodes).toEqual(['KeyC', 'KeyV', 'KeyN', 'KeyM']);
  });

  it('defines 22 authentic Stenotype hardware keys matching Monkeytype grid topology', () => {
    expect(STENO_KEYS.length).toBe(22);

    // Initial S (tall key spanning row 1 & 2)
    const initialS = STENO_KEYS.find((k) => k.label === 's' && k.col === 1);
    expect(initialS).toBeDefined();
    expect(initialS?.rowSpan).toBe(2);
    expect(initialS?.codes).toEqual(['KeyQ', 'KeyA']);

    // Center Asterisk (tall key spanning row 1 & 2)
    const asterisk = STENO_KEYS.find((k) => k.label === '*' && k.col === 5);
    expect(asterisk).toBeDefined();
    expect(asterisk?.rowSpan).toBe(2);
    expect(asterisk?.codes).toEqual(['KeyT', 'KeyG', 'KeyY', 'KeyH']);

    // Thumb vowels (row 3)
    const thumbKeys = STENO_KEYS.filter((k) => k.row === 3);
    expect(thumbKeys.map((k) => k.label)).toEqual(['a', 'o', 'e', 'u']);
    expect(thumbKeys.map((k) => k.col)).toEqual([3, 4, 6, 7]);

    // Legend resolution
    expect(resolveStenoLegend('s', 'lowercase')).toBe('s');
    expect(resolveStenoLegend('s', 'uppercase')).toBe('S');
    expect(resolveStenoLegend('s', 'blank')).toBe('');
    expect(resolveStenoLegend('s', 'dynamic', false)).toBe('s');
    expect(resolveStenoLegend('s', 'dynamic', true)).toBe('S');
  });

  it('defines authentic dual 5-column Steno Matrix banks matching Monkeytype parity', () => {
    // Left Bank
    expect(STENO_MATRIX_LEFT.row1.length).toBe(5);
    expect(STENO_MATRIX_LEFT.row1.map((k) => k.label)).toEqual(['s', 't', 'p', 'h', '*']);
    expect(STENO_MATRIX_LEFT.row1.map((k) => k.code)).toEqual(['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT']);

    expect(STENO_MATRIX_LEFT.row2.length).toBe(5);
    expect(STENO_MATRIX_LEFT.row2.map((k) => k.label)).toEqual(['s', 'k', 'w', 'r', '*']);
    expect(STENO_MATRIX_LEFT.row2.map((k) => k.code)).toEqual(['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG']);

    expect(STENO_MATRIX_LEFT.row3.length).toBe(2);
    expect(STENO_MATRIX_LEFT.row3.map((k) => k.label)).toEqual(['a', 'o']);
    expect(STENO_MATRIX_LEFT.row3.map((k) => k.code)).toEqual(['KeyC', 'KeyV']);

    // Right Bank
    expect(STENO_MATRIX_RIGHT.row1.length).toBe(5);
    expect(STENO_MATRIX_RIGHT.row1.map((k) => k.label)).toEqual(['f', 'p', 'l', 't', 'd']);
    expect(STENO_MATRIX_RIGHT.row1.map((k) => k.code)).toEqual(['KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft']);

    expect(STENO_MATRIX_RIGHT.row2.length).toBe(5);
    expect(STENO_MATRIX_RIGHT.row2.map((k) => k.label)).toEqual(['r', 'b', 'g', 's', 'z']);
    expect(STENO_MATRIX_RIGHT.row2.map((k) => k.code)).toEqual(['KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote']);

    expect(STENO_MATRIX_RIGHT.row3.length).toBe(2);
    expect(STENO_MATRIX_RIGHT.row3.map((k) => k.label)).toEqual(['e', 'u']);
    expect(STENO_MATRIX_RIGHT.row3.map((k) => k.code)).toEqual(['KeyN', 'KeyM']);

    // Geometry split gap is 1.8u
    const geom = getGeometryInfo('steno_matrix');
    expect(geom.splitGapU).toBe(1.8);
  });

  it('builds Alice rows with dual B keys, exact row counts, and ergonomic offsets', () => {
    const rows = buildKeymapRows(layout, 'alice', 'minimal');
    expect(rows.length).toBe(3);

    // Row 1: Left (Q W E R T) = 5 keys, Right (Y U I O P [ ]) = 7 keys
    const row1 = rows[0]!;
    expect(row1.rowIndex).toBe(1);
    expect(row1.offsetU).toBe(0);
    expect(row1.rightOffsetU).toBe(0);
    expect(row1.leftKeys.map((k) => k.code)).toEqual([
      'KeyQ',
      'KeyW',
      'KeyE',
      'KeyR',
      'KeyT',
    ]);
    expect(row1.rightKeys.map((k) => k.code)).toEqual([
      'KeyY',
      'KeyU',
      'KeyI',
      'KeyO',
      'KeyP',
      'BracketLeft',
      'BracketRight',
    ]);
    expect(row1.rightKeys.map((k) => k.code)).not.toContain('Backslash');

    // Row 2: Left (A S D F G) = 5 keys, Right (H J K L ; ') = 6 keys
    const row2 = rows[1]!;
    expect(row2.rowIndex).toBe(2);
    expect(row2.offsetU).toBe(0.25);
    expect(row2.rightOffsetU).toBe(0.25);
    expect(row2.leftKeys.map((k) => k.code)).toEqual([
      'KeyA',
      'KeyS',
      'KeyD',
      'KeyF',
      'KeyG',
    ]);
    expect(row2.rightKeys.map((k) => k.code)).toEqual([
      'KeyH',
      'KeyJ',
      'KeyK',
      'KeyL',
      'Semicolon',
      'Quote',
    ]);

    // Row 3: Left (Z X C V B) = 5 keys, Right (B N M , . /) = 6 keys (DUAL 'B' KEY!)
    const row3 = rows[2]!;
    expect(row3.rowIndex).toBe(3);
    expect(row3.offsetU).toBe(0.75);
    expect(row3.rightOffsetU).toBe(0);
    expect(row3.leftKeys.map((k) => k.code)).toEqual([
      'KeyZ',
      'KeyX',
      'KeyC',
      'KeyV',
      'KeyB',
    ]);
    expect(row3.rightKeys.map((k) => k.code)).toEqual([
      'KeyB',
      'KeyN',
      'KeyM',
      'Comma',
      'Period',
      'Slash',
    ]);

    // Distinct Alice feature: KeyB is in BOTH leftKeys and rightKeys
    expect(row3.leftKeys.some((k) => k.code === 'KeyB')).toBe(true);
    expect(row3.rightKeys.some((k) => k.code === 'KeyB')).toBe(true);

    // minimal_numrow: Row 0 split 6 left / 6 right, calibrated offsets
    const numrowRows = buildKeymapRows(layout, 'alice', 'minimal_numrow');
    expect(numrowRows.length).toBe(4);
    expect(numrowRows[0]?.leftKeys.map((k) => k.code)).toEqual([
      'Digit1',
      'Digit2',
      'Digit3',
      'Digit4',
      'Digit5',
      'Digit6',
    ]);
    expect(numrowRows[0]?.rightKeys.map((k) => k.code)).toEqual([
      'Digit7',
      'Digit8',
      'Digit9',
      'Digit0',
      'Minus',
      'Equal',
    ]);
    expect(numrowRows[0]?.offsetU).toBe(0);
    expect(numrowRows[0]?.rightOffsetU).toBe(0.5);
    expect(numrowRows[1]?.offsetU).toBe(0.5);
    expect(numrowRows[1]?.rightOffsetU).toBe(0);
    expect(numrowRows[2]?.offsetU).toBe(0.75);
    expect(numrowRows[2]?.rightOffsetU).toBe(0.25);
    expect(numrowRows[3]?.offsetU).toBe(1.25);
    expect(numrowRows[3]?.rightOffsetU).toBe(0);

    // full: zero container offsets (intrinsic physical modifiers supply stagger)
    const fullRows = buildKeymapRows(layout, 'alice', 'full');
    expect(fullRows.length).toBe(4);
    expect(fullRows.every((r) => r.offsetU === 0 && r.rightOffsetU === 0)).toBe(true);
  });

  it('builds Matrix rows with uniform 10-key ortholinear grid and zero offsets', () => {
    // minimal: 3 rows (Rows 1, 2, 3), exactly 10 keys per row
    const minimalRows = buildKeymapRows(layout, 'matrix', 'minimal');
    expect(minimalRows.length).toBe(3);
    expect(minimalRows.every((r) => r.offsetU === 0)).toBe(true);
    expect(minimalRows.every((r) => r.keys.length === 10)).toBe(true);

    // Row 1: KeyQ..KeyP (no BracketLeft, BracketRight, Backslash)
    expect(minimalRows[0]?.keys.map((k) => k.code)).toEqual([
      'KeyQ',
      'KeyW',
      'KeyE',
      'KeyR',
      'KeyT',
      'KeyY',
      'KeyU',
      'KeyI',
      'KeyO',
      'KeyP',
    ]);

    // Row 2: KeyA..Semicolon (no Quote)
    expect(minimalRows[1]?.keys.map((k) => k.code)).toEqual([
      'KeyA',
      'KeyS',
      'KeyD',
      'KeyF',
      'KeyG',
      'KeyH',
      'KeyJ',
      'KeyK',
      'KeyL',
      'Semicolon',
    ]);

    // Row 3: KeyZ..Slash
    expect(minimalRows[2]?.keys.map((k) => k.code)).toEqual([
      'KeyZ',
      'KeyX',
      'KeyC',
      'KeyV',
      'KeyB',
      'KeyN',
      'KeyM',
      'Comma',
      'Period',
      'Slash',
    ]);

    // minimal_numrow: 4 rows (Row 0: Digit1..Digit0, Rows 1..3: 10 keys each)
    const numrowRows = buildKeymapRows(layout, 'matrix', 'minimal_numrow');
    expect(numrowRows.length).toBe(4);
    expect(numrowRows.every((r) => r.offsetU === 0)).toBe(true);
    expect(numrowRows.every((r) => r.keys.length === 10)).toBe(true);
    expect(numrowRows[0]?.keys.map((k) => k.code)).toEqual([
      'Digit1',
      'Digit2',
      'Digit3',
      'Digit4',
      'Digit5',
      'Digit6',
      'Digit7',
      'Digit8',
      'Digit9',
      'Digit0',
    ]);
    expect(numrowRows[0]?.keys.some((k) => k.code === 'Backquote')).toBe(false);
    expect(numrowRows[0]?.keys.some((k) => k.code === 'Minus')).toBe(false);
    expect(numrowRows[0]?.keys.some((k) => k.code === 'Equal')).toBe(false);

    // full: 4 rows (Row 0..3: 10 core keys each, 0 offset)
    const fullRows = buildKeymapRows(layout, 'matrix', 'full');
    expect(fullRows.length).toBe(4);
    expect(fullRows.every((r) => r.offsetU === 0)).toBe(true);
    expect(fullRows.every((r) => r.keys.length === 10)).toBe(true);
  });

  describe('resolveNextKeyCode', () => {
    it('returns null for null or empty string', () => {
      expect(resolveNextKeyCode(null)).toBeNull();
      expect(resolveNextKeyCode('')).toBeNull();
    });

    it('resolves space and newline correctly', () => {
      expect(resolveNextKeyCode(' ')).toBe('Space');
      expect(resolveNextKeyCode('\n')).toBe('Enter');
    });

    it('resolves lowercase and uppercase alpha characters', () => {
      expect(resolveNextKeyCode('a')).toBe('KeyA');
      expect(resolveNextKeyCode('A')).toBe('KeyA');
      expect(resolveNextKeyCode('z')).toBe('KeyZ');
      expect(resolveNextKeyCode('Z')).toBe('KeyZ');
    });

    it('resolves digit and shifted symbols', () => {
      expect(resolveNextKeyCode('1')).toBe('Digit1');
      expect(resolveNextKeyCode('!')).toBe('Digit1');
      expect(resolveNextKeyCode('?')).toBe('Slash');
      expect(resolveNextKeyCode('/')).toBe('Slash');
      expect(resolveNextKeyCode('{')).toBe('BracketLeft');
      expect(resolveNextKeyCode('[')).toBe('BracketLeft');
    });

    it('returns null for unmapped characters', () => {
      expect(resolveNextKeyCode('§')).toBeNull();
      expect(resolveNextKeyCode('€')).toBeNull();
    });
  });
});

