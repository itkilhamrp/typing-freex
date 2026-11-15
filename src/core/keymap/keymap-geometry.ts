/**
 * Pure TypeScript Keymap Geometry & Layout Engine (§5.12.4)
 * Headless module defining 7 physical geometry variations, row splits,
 * key offsets, legend formatting, and Steno matrix definitions.
 * Zero UI dependencies.
 */

import type { KeyDef, KeyboardLayoutDef } from '@/core/hand-guide';
import defaultLayoutData from '../../../content-packs/keyboard-layouts/qwerty-us.json';

export const DEFAULT_KEYBOARD_LAYOUT = defaultLayoutData as unknown as KeyboardLayoutDef;

export type KeymapStyle =
  | 'staggered'
  | 'alice'
  | 'matrix'
  | 'split'
  | 'split_matrix'
  | 'steno'
  | 'steno_matrix';

export type KeymapMode = 'off' | 'static' | 'react' | 'next';
export type KeymapLegendStyle = 'lowercase' | 'uppercase' | 'blank' | 'dynamic';
export type KeymapShowKeys = 'minimal' | 'minimal_numrow' | 'full';

export interface KeymapRow {
  readonly rowIndex: number;
  readonly offsetU: number;
  readonly rightOffsetU?: number;
  readonly keys: readonly KeyDef[];
  readonly leftKeys: readonly KeyDef[];
  readonly rightKeys: readonly KeyDef[];
}

export interface StenoKeyItem {
  readonly code: string;
  readonly label: string;
  readonly widthU?: number;
}

export interface StenoRow {
  readonly rowIndex: number;
  readonly offsetU: number;
  readonly keys: readonly StenoKeyItem[];
  readonly leftKeys: readonly StenoKeyItem[];
  readonly rightKeys: readonly StenoKeyItem[];
}

export interface KeymapGeometryInfo {
  readonly style: KeymapStyle;
  readonly isSplit: boolean;
  readonly isAlice: boolean;
  readonly isSteno: boolean;
  readonly isMatrix: boolean;
  readonly splitGapU: number;
  readonly leftRotationDeg: number;
  readonly rightRotationDeg: number;
  readonly rowOffsets: readonly number[]; // Row 0..4 offsets in units
}

export const ROW0_CODES = [
  'Backquote',
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
  'Minus',
  'Equal',
] as const;

export const ROW1_CODES = [
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
  'BracketLeft',
  'BracketRight',
  'Backslash',
] as const;

export const ROW2_CODES = [
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
  'Quote',
] as const;

export const ROW3_CODES = [
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
] as const;

export const SPLIT_SPLIT_INDEX = {
  row0: 6, // Split after Digit5 (0..5 left = 6 keys; 6..12 right = 7 keys)
  row1: 5, // Split after KeyT (0..4 left = 5 keys; 5..12 right = 8 keys)
  row2: 5, // Split after KeyG (0..4 left = 5 keys; 5..10 right = 6 keys)
  row3: 5, // Split after KeyB (0..4 left = 5 keys; 5..9 right = 5 keys)
} as const;

export function getGeometryInfo(style: KeymapStyle): KeymapGeometryInfo {
  switch (style) {
    case 'alice':
      return {
        style,
        isSplit: true,
        isAlice: true,
        isSteno: false,
        isMatrix: false,
        splitGapU: 0.5,
        leftRotationDeg: 12,
        rightRotationDeg: -12,
        rowOffsets: [0, 0.25, 0.5, 0.75, 0],
      };
    case 'split':
      return {
        style,
        isSplit: true,
        isAlice: false,
        isSteno: false,
        isMatrix: false,
        splitGapU: 2.5,
        leftRotationDeg: 0,
        rightRotationDeg: 0,
        rowOffsets: [0, 0.25, 0.5, 0.75, 0],
      };
    case 'split_matrix':
      return {
        style,
        isSplit: true,
        isAlice: false,
        isSteno: false,
        isMatrix: true,
        splitGapU: 2.5,
        leftRotationDeg: 0,
        rightRotationDeg: 0,
        rowOffsets: [0, 0, 0, 0, 0],
      };
    case 'matrix':
      return {
        style,
        isSplit: false,
        isAlice: false,
        isSteno: false,
        isMatrix: true,
        splitGapU: 0,
        leftRotationDeg: 0,
        rightRotationDeg: 0,
        rowOffsets: [0, 0, 0, 0, 0],
      };
    case 'steno':
      return {
        style,
        isSplit: true,
        isAlice: false,
        isSteno: true,
        isMatrix: false,
        splitGapU: 1.2,
        leftRotationDeg: 0,
        rightRotationDeg: 0,
        rowOffsets: [0, 0.5, 0.75, 3.25],
      };
    case 'steno_matrix':
      return {
        style,
        isSplit: true,
        isAlice: false,
        isSteno: true,
        isMatrix: true,
        splitGapU: 1.8,
        leftRotationDeg: 0,
        rightRotationDeg: 0,
        rowOffsets: [0, 0, 0, 0],
      };
    case 'staggered':
    default:
      return {
        style: 'staggered',
        isSplit: false,
        isAlice: false,
        isSteno: false,
        isMatrix: false,
        splitGapU: 0,
        leftRotationDeg: 0,
        rightRotationDeg: 0,
        rowOffsets: [0, 0.25, 0.5, 0.75, 0],
      };
  }
}

/**
 * Calculates row container offset in unit measurements (u)
 * avoiding double-stagger when physical modifier keys are present.
 */
export function calculateRowOffset(
  rowIndex: number,
  style: KeymapStyle,
  showKeys: KeymapShowKeys,
): number {
  const geom = getGeometryInfo(style);
  if (geom.isMatrix) {
    return 0;
  }

  // In full mode, modifier keys (Tab 1.5u, Caps 1.75u, Shift 2.25u)
  // intrinsically define the row offsets. Container offset must be 0!
  if (showKeys === 'full') {
    return 0;
  }

  if (showKeys === 'minimal_numrow') {
    switch (rowIndex) {
      case 0:
        return 0;
      case 1:
        return 0.5;
      case 2:
        return 0.75;
      case 3:
        return 1.25;
      case 4:
        return 2.75;
      default:
        return 0;
    }
  }

  // minimal (Rows 1, 2, 3, 4)
  switch (rowIndex) {
    case 1:
      return 0;
    case 2:
      return 0.25;
    case 3:
      return 0.75;
    case 4:
      return 2.25;
    default:
      return 0;
  }
}

/**
 * Organizes layout key definitions into rows according to style and showKeys configuration.
 */
export function buildKeymapRows(
  layout: KeyboardLayoutDef,
  style: KeymapStyle,
  showKeys: KeymapShowKeys,
): KeymapRow[] {
  const keyMap = new Map<string, KeyDef>();
  for (const k of layout.keys) {
    keyMap.set(k.code, k);
  }

  const rows: KeymapRow[] = [];

  const mapCodes = (codes: readonly string[]): KeyDef[] => {
    const list: KeyDef[] = [];
    for (const code of codes) {
      const def = keyMap.get(code);
      if (def) {
        list.push(def);
      }
    }
    return list;
  };

  if (style === 'alice') {
    const isFull = showKeys === 'full';
    const isNumrow = showKeys === 'minimal_numrow';

    // Row 0: Number row (Digit keys)
    if (showKeys !== 'minimal') {
      const leftCodes = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'];
      const rightCodes = ['Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'];
      const leftKeys = mapCodes(leftCodes);
      const rightKeys = mapCodes(rightCodes);
      rows.push({
        rowIndex: 0,
        offsetU: 0,
        rightOffsetU: isNumrow ? 0.5 : 0,
        keys: [...leftKeys, ...rightKeys],
        leftKeys,
        rightKeys,
      });
    }

    // Row 1: QWERTY row (Left: Q..T [5], Right: Y..BracketRight [7])
    {
      const leftCodes = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT'];
      const rightCodes = [
        'KeyY',
        'KeyU',
        'KeyI',
        'KeyO',
        'KeyP',
        'BracketLeft',
        'BracketRight',
      ];
      const leftKeys = mapCodes(leftCodes);
      const rightKeys = mapCodes(rightCodes);
      rows.push({
        rowIndex: 1,
        offsetU: isFull ? 0 : isNumrow ? 0.5 : 0,
        rightOffsetU: 0,
        keys: [...leftKeys, ...rightKeys],
        leftKeys,
        rightKeys,
      });
    }

    // Row 2: ASDF row (Left: A..G [5], Right: H..Quote [6])
    {
      const leftCodes = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'];
      const rightCodes = ['KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'];
      const leftKeys = mapCodes(leftCodes);
      const rightKeys = mapCodes(rightCodes);
      rows.push({
        rowIndex: 2,
        offsetU: isFull ? 0 : isNumrow ? 0.75 : 0.25,
        rightOffsetU: isFull ? 0 : 0.25,
        keys: [...leftKeys, ...rightKeys],
        leftKeys,
        rightKeys,
      });
    }

    // Row 3: ZXCV row (Left: Z..B [5], Right: B, N..Slash [6])
    {
      const leftCodes = ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB'];
      const rightCodes = ['KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'];
      const leftKeys = mapCodes(leftCodes);
      const rightKeys = mapCodes(rightCodes);
      rows.push({
        rowIndex: 3,
        offsetU: isFull ? 0 : isNumrow ? 1.25 : 0.75,
        rightOffsetU: 0,
        keys: [...leftKeys, ...rightKeys],
        leftKeys,
        rightKeys,
      });
    }

    return rows;
  }

  if (style === 'matrix') {
    // Row 0: Number row (Digit1..Digit0, exactly 10 keys)
    if (showKeys !== 'minimal') {
      const codes = [
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
      ];
      const all = mapCodes(codes);
      rows.push({
        rowIndex: 0,
        offsetU: 0,
        keys: all,
        leftKeys: all.slice(0, 5),
        rightKeys: all.slice(5),
      });
    }

    // Row 1: QWERTY row (KeyQ..KeyP, exactly 10 keys)
    {
      const codes = [
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
      ];
      const all = mapCodes(codes);
      rows.push({
        rowIndex: 1,
        offsetU: 0,
        keys: all,
        leftKeys: all.slice(0, 5),
        rightKeys: all.slice(5),
      });
    }

    // Row 2: ASDF row (KeyA..Semicolon, exactly 10 keys)
    {
      const codes = [
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
      ];
      const all = mapCodes(codes);
      rows.push({
        rowIndex: 2,
        offsetU: 0,
        keys: all,
        leftKeys: all.slice(0, 5),
        rightKeys: all.slice(5),
      });
    }

    // Row 3: ZXCV row (KeyZ..Slash, exactly 10 keys)
    {
      const codes = [
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
      ];
      const all = mapCodes(codes);
      rows.push({
        rowIndex: 3,
        offsetU: 0,
        keys: all,
        leftKeys: all.slice(0, 5),
        rightKeys: all.slice(5),
      });
    }

    return rows;
  }

  if (style === 'split_matrix') {
    // Row 0: Number row (Digit keys: 5 left, 5 right)
    if (showKeys !== 'minimal') {
      const leftCodes = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'];
      const rightCodes = ['Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];
      const leftKeys = mapCodes(leftCodes);
      const rightKeys = mapCodes(rightCodes);
      rows.push({
        rowIndex: 0,
        offsetU: 0,
        rightOffsetU: 0,
        keys: [...leftKeys, ...rightKeys],
        leftKeys,
        rightKeys,
      });
    }

    // Row 1: QWERTY row (Left: Q..T [5], Right: Y..P [5])
    {
      const leftCodes = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT'];
      const rightCodes = ['KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'];
      const leftKeys = mapCodes(leftCodes);
      const rightKeys = mapCodes(rightCodes);
      rows.push({
        rowIndex: 1,
        offsetU: 0,
        rightOffsetU: 0,
        keys: [...leftKeys, ...rightKeys],
        leftKeys,
        rightKeys,
      });
    }

    // Row 2: ASDF row (Left: A..G [5], Right: H..; [5])
    {
      const leftCodes = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'];
      const rightCodes = ['KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];
      const leftKeys = mapCodes(leftCodes);
      const rightKeys = mapCodes(rightCodes);
      rows.push({
        rowIndex: 2,
        offsetU: 0,
        rightOffsetU: 0,
        keys: [...leftKeys, ...rightKeys],
        leftKeys,
        rightKeys,
      });
    }

    // Row 3: ZXCV row (Left: Z..B [5], Right: N../ [5])
    {
      const leftCodes = ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB'];
      const rightCodes = ['KeyN', 'KeyM', 'Comma', 'Period', 'Slash'];
      const leftKeys = mapCodes(leftCodes);
      const rightKeys = mapCodes(rightCodes);
      rows.push({
        rowIndex: 3,
        offsetU: 0,
        rightOffsetU: 0,
        keys: [...leftKeys, ...rightKeys],
        leftKeys,
        rightKeys,
      });
    }

    return rows;
  }

  if (style === 'split') {
    const isFull = showKeys === 'full';
    const isNumrow = showKeys === 'minimal_numrow';

    // Row 0: Number row (Digit keys)
    if (showKeys !== 'minimal') {
      const leftCodes = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'];
      const rightCodes = ['Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'];
      const leftKeys = mapCodes(leftCodes);
      const rightKeys = mapCodes(rightCodes);
      rows.push({
        rowIndex: 0,
        offsetU: 0,
        rightOffsetU: isFull ? 0 : 0.5,
        keys: [...leftKeys, ...rightKeys],
        leftKeys,
        rightKeys,
      });
    }

    // Row 1: QWERTY row (Left: Q..T [5], Right: Y..BracketRight [7])
    {
      const leftCodes = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT'];
      const rightCodes = [
        'KeyY',
        'KeyU',
        'KeyI',
        'KeyO',
        'KeyP',
        'BracketLeft',
        'BracketRight',
      ];
      const leftKeys = mapCodes(leftCodes);
      const rightKeys = mapCodes(rightCodes);
      rows.push({
        rowIndex: 1,
        offsetU: isFull ? 0 : isNumrow ? 0.5 : 0,
        rightOffsetU: 0,
        keys: [...leftKeys, ...rightKeys],
        leftKeys,
        rightKeys,
      });
    }

    // Row 2: ASDF row (Left: A..G [5], Right: H..Quote [6])
    {
      const leftCodes = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'];
      const rightCodes = ['KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote'];
      const leftKeys = mapCodes(leftCodes);
      const rightKeys = mapCodes(rightCodes);
      rows.push({
        rowIndex: 2,
        offsetU: isFull ? 0 : isNumrow ? 0.75 : 0.25,
        rightOffsetU: isFull ? 0 : 0.25,
        keys: [...leftKeys, ...rightKeys],
        leftKeys,
        rightKeys,
      });
    }

    // Row 3: ZXCV row (Left: Z..B [5], Right: N..Slash [5])
    {
      const leftCodes = ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB'];
      const rightCodes = ['KeyN', 'KeyM', 'Comma', 'Period', 'Slash'];
      const leftKeys = mapCodes(leftCodes);
      const rightKeys = mapCodes(rightCodes);
      rows.push({
        rowIndex: 3,
        offsetU: isFull ? 0 : isNumrow ? 1.25 : 0.75,
        rightOffsetU: isFull ? 0 : 0.75,
        keys: [...leftKeys, ...rightKeys],
        leftKeys,
        rightKeys,
      });
    }

    return rows;
  }

  // Row 0: Number row (Digit keys)
  if (showKeys !== 'minimal') {
    const codes =
      showKeys === 'minimal_numrow'
        ? ROW0_CODES.filter((c) => c !== 'Backquote')
        : ROW0_CODES;
    const all = mapCodes(codes);
    const splitIdx =
      showKeys === 'minimal_numrow'
        ? SPLIT_SPLIT_INDEX.row0 - 1
        : SPLIT_SPLIT_INDEX.row0;
    rows.push({
      rowIndex: 0,
      offsetU: calculateRowOffset(0, style, showKeys),
      keys: all,
      leftKeys: all.slice(0, splitIdx),
      rightKeys: all.slice(splitIdx),
    });
  }

  // Row 1: QWERTY row
  {
    const codes =
      showKeys === 'full'
        ? ROW1_CODES
        : ROW1_CODES.filter((c) => c !== 'Backslash');
    const all = mapCodes(codes);
    const splitIdx = SPLIT_SPLIT_INDEX.row1;
    rows.push({
      rowIndex: 1,
      offsetU: calculateRowOffset(1, style, showKeys),
      keys: all,
      leftKeys: all.slice(0, splitIdx),
      rightKeys: all.slice(splitIdx),
    });
  }

  // Row 2: ASDF row
  {
    const all = mapCodes(ROW2_CODES);
    const splitIdx = SPLIT_SPLIT_INDEX.row2;
    rows.push({
      rowIndex: 2,
      offsetU: calculateRowOffset(2, style, showKeys),
      keys: all,
      leftKeys: all.slice(0, splitIdx),
      rightKeys: all.slice(splitIdx),
    });
  }

  // Row 3: ZXCV row
  {
    const all = mapCodes(ROW3_CODES);
    const splitIdx = SPLIT_SPLIT_INDEX.row3;
    rows.push({
      rowIndex: 3,
      offsetU: calculateRowOffset(3, style, showKeys),
      keys: all,
      leftKeys: all.slice(0, splitIdx),
      rightKeys: all.slice(splitIdx),
    });
  }

  return rows;
}

/**
 * Returns formatted keycap legend text according to legend style and dynamic shift state.
 */
export function resolveKeyLegend(
  key: KeyDef,
  legendStyle: KeymapLegendStyle,
  isShiftActive: boolean = false,
): string {
  if (legendStyle === 'blank') return '';
  if (legendStyle === 'uppercase') {
    return (key.shift ?? key.base).toUpperCase();
  }
  if (legendStyle === 'dynamic') {
    if (isShiftActive) {
      return key.shift ?? key.base.toUpperCase();
    }
    return key.base;
  }
  // 'lowercase'
  return key.base;
}

/**
 * Pre-defined Steno Layout definitions mapping to standard physical keyboard codes.
 * Supports both standard typewriter steno (Plover QWERTY) and pure stenotype hardware matrix.
 */
export function buildStenoRows(
  showKeys: KeymapShowKeys,
  style: KeymapStyle = 'steno_matrix',
): StenoRow[] {
  const rows: StenoRow[] = [];
  const isMatrix = style === 'steno_matrix';

  // Row 0: Number Bar (optional based on showKeys)
  if (showKeys !== 'minimal') {
    const numKeys: StenoKeyItem[] = [
      { code: 'Digit1', label: '#' },
      { code: 'Digit2', label: '#' },
      { code: 'Digit3', label: '#' },
      { code: 'Digit4', label: '#' },
      { code: 'Digit5', label: '#' },
      { code: 'Digit6', label: '#' },
      { code: 'Digit7', label: '#' },
      { code: 'Digit8', label: '#' },
      { code: 'Digit9', label: '#' },
      { code: 'Digit0', label: '#' },
    ];
    rows.push({
      rowIndex: 0,
      offsetU: 0,
      keys: numKeys,
      leftKeys: numKeys.slice(0, 5),
      rightKeys: numKeys.slice(5),
    });
  }

  // Row 1: Upper Row (S T P H * | * F P L T D)
  const upperLeft: StenoKeyItem[] = [
    { code: 'KeyQ', label: 'S' },
    { code: 'KeyW', label: 'T' },
    { code: 'KeyE', label: 'P' },
    { code: 'KeyR', label: 'H' },
    { code: 'KeyT', label: '*' },
  ];
  const upperRight: StenoKeyItem[] = [
    { code: 'KeyY', label: '*' },
    { code: 'KeyU', label: 'F' },
    { code: 'KeyI', label: 'P' },
    { code: 'KeyO', label: 'L' },
    { code: 'KeyP', label: 'T' },
    { code: 'BracketLeft', label: 'D' },
  ];
  rows.push({
    rowIndex: 1,
    offsetU: isMatrix ? 0 : 0.5,
    keys: [...upperLeft, ...upperRight],
    leftKeys: upperLeft,
    rightKeys: upperRight,
  });

  // Row 2: Lower Row (S K W R * | * R B G S Z)
  const lowerLeft: StenoKeyItem[] = [
    { code: 'KeyA', label: 'S' },
    { code: 'KeyS', label: 'K' },
    { code: 'KeyD', label: 'W' },
    { code: 'KeyF', label: 'R' },
    { code: 'KeyG', label: '*' },
  ];
  const lowerRight: StenoKeyItem[] = [
    { code: 'KeyH', label: '*' },
    { code: 'KeyJ', label: 'R' },
    { code: 'KeyK', label: 'B' },
    { code: 'KeyL', label: 'G' },
    { code: 'Semicolon', label: 'S' },
    { code: 'Quote', label: 'Z' },
  ];
  rows.push({
    rowIndex: 2,
    offsetU: isMatrix ? 0 : 0.75,
    keys: [...lowerLeft, ...lowerRight],
    leftKeys: lowerLeft,
    rightKeys: lowerRight,
  });

  // Row 3: Thumb Vowels (A O | E U)
  const thumbWidth = isMatrix ? 1.25 : 1.35;
  const vowelsLeft: StenoKeyItem[] = [
    { code: 'KeyC', label: 'A', widthU: thumbWidth },
    { code: 'KeyV', label: 'O', widthU: thumbWidth },
  ];
  const vowelsRight: StenoKeyItem[] = [
    { code: 'KeyN', label: 'E', widthU: thumbWidth },
    { code: 'KeyM', label: 'U', widthU: thumbWidth },
  ];
  rows.push({
    rowIndex: 3,
    offsetU: isMatrix ? 2.5 : 3.25,
    keys: [...vowelsLeft, ...vowelsRight],
    leftKeys: vowelsLeft,
    rightKeys: vowelsRight,
  });

  return rows;
}

export interface StenoKeyDefinition {
  readonly codes: readonly string[];
  readonly label: string;
  readonly col: number;
  readonly row: number;
  readonly rowSpan?: number;
}

/**
 * Authentic Stenotype Hardware Matrix (10 columns × 3 rows, exactly 22 keys)
 * Modeled after physical Stenotype machines (Stentura, Georgi, EcoSteno) as in Monkeytype.
 */
export const STENO_KEYS: readonly StenoKeyDefinition[] = [
  // Left initial S (tall key spanning rows 1 & 2)
  { codes: ['KeyQ', 'KeyA'], label: 's', col: 1, row: 1, rowSpan: 2 },
  // Left bank (columns 2..4)
  { codes: ['KeyW'], label: 't', col: 2, row: 1 },
  { codes: ['KeyS'], label: 'k', col: 2, row: 2 },
  { codes: ['KeyE'], label: 'p', col: 3, row: 1 },
  { codes: ['KeyD'], label: 'w', col: 3, row: 2 },
  { codes: ['KeyR'], label: 'h', col: 4, row: 1 },
  { codes: ['KeyF'], label: 'r', col: 4, row: 2 },
  // Center * (tall key spanning rows 1 & 2)
  { codes: ['KeyT', 'KeyG', 'KeyY', 'KeyH'], label: '*', col: 5, row: 1, rowSpan: 2 },
  // Right bank (columns 6..10)
  { codes: ['KeyU'], label: 'f', col: 6, row: 1 },
  { codes: ['KeyJ'], label: 'r', col: 6, row: 2 },
  { codes: ['KeyI'], label: 'p', col: 7, row: 1 },
  { codes: ['KeyK'], label: 'b', col: 7, row: 2 },
  { codes: ['KeyO'], label: 'l', col: 8, row: 1 },
  { codes: ['KeyL'], label: 'g', col: 8, row: 2 },
  { codes: ['KeyP'], label: 't', col: 9, row: 1 },
  { codes: ['Semicolon'], label: 's', col: 9, row: 2 },
  { codes: ['BracketLeft'], label: 'd', col: 10, row: 1 },
  { codes: ['Quote'], label: 'z', col: 10, row: 2 },
  // Thumb keys (row 3)
  { codes: ['KeyC'], label: 'a', col: 3, row: 3 },
  { codes: ['KeyV'], label: 'o', col: 4, row: 3 },
  { codes: ['KeyN'], label: 'e', col: 6, row: 3 },
  { codes: ['KeyM'], label: 'u', col: 7, row: 3 },
];

/**
 * Resolves formatted legend for Steno keys based on legendStyle and shift state.
 */
export function resolveStenoLegend(
  label: string,
  legendStyle: KeymapLegendStyle,
  isShiftActive: boolean = false,
): string {
  if (legendStyle === 'blank') return '';
  if (legendStyle === 'uppercase') return label.toUpperCase();
  if (legendStyle === 'dynamic' && isShiftActive) return label.toUpperCase();
  return label.toLowerCase();
}

export interface StenoMatrixKeyItem {
  readonly code: string;
  readonly label: string;
}

/**
 * Authentic Stenotype Matrix Left Bank (5 columns: s t p h *, s k w r *, _ _ _ a o)
 */
export const STENO_MATRIX_LEFT: {
  readonly row1: readonly StenoMatrixKeyItem[];
  readonly row2: readonly StenoMatrixKeyItem[];
  readonly row3: readonly StenoMatrixKeyItem[];
} = {
  row1: [
    { code: 'KeyQ', label: 's' },
    { code: 'KeyW', label: 't' },
    { code: 'KeyE', label: 'p' },
    { code: 'KeyR', label: 'h' },
    { code: 'KeyT', label: '*' },
  ],
  row2: [
    { code: 'KeyA', label: 's' },
    { code: 'KeyS', label: 'k' },
    { code: 'KeyD', label: 'w' },
    { code: 'KeyF', label: 'r' },
    { code: 'KeyG', label: '*' },
  ],
  row3: [
    { code: 'KeyC', label: 'a' },
    { code: 'KeyV', label: 'o' },
  ],
};

/**
 * Authentic Stenotype Matrix Right Bank (5 columns: f p l t d, r b g s z, e u _ _ _)
 */
export const STENO_MATRIX_RIGHT: {
  readonly row1: readonly StenoMatrixKeyItem[];
  readonly row2: readonly StenoMatrixKeyItem[];
  readonly row3: readonly StenoMatrixKeyItem[];
} = {
  row1: [
    { code: 'KeyU', label: 'f' },
    { code: 'KeyI', label: 'p' },
    { code: 'KeyO', label: 'l' },
    { code: 'KeyP', label: 't' },
    { code: 'BracketLeft', label: 'd' },
  ],
  row2: [
    { code: 'KeyJ', label: 'r' },
    { code: 'KeyK', label: 'b' },
    { code: 'KeyL', label: 'g' },
    { code: 'Semicolon', label: 's' },
    { code: 'Quote', label: 'z' },
  ],
  row3: [
    { code: 'KeyN', label: 'e' },
    { code: 'KeyM', label: 'u' },
  ],
};

// Pre-computed O(1) character-to-keycode cache for zero-latency next-key lookups
const CHAR_TO_KEY_CODE_MAP = new Map<string, string>();
for (const key of DEFAULT_KEYBOARD_LAYOUT.keys) {
  if (key.base) {
    CHAR_TO_KEY_CODE_MAP.set(key.base, key.code);
    CHAR_TO_KEY_CODE_MAP.set(key.base.toLowerCase(), key.code);
  }
  if (key.shift) {
    CHAR_TO_KEY_CODE_MAP.set(key.shift, key.code);
  }
}

/**
 * Resolves the physical key code for the next expected character in O(1) time.
 */
export function resolveNextKeyCode(char: string | null): string | null {
  if (!char) return null;
  if (char === ' ') return 'Space';
  if (char === '\n') return 'Enter';
  return (
    CHAR_TO_KEY_CODE_MAP.get(char) ??
    CHAR_TO_KEY_CODE_MAP.get(char.toLowerCase()) ??
    null
  );
}
