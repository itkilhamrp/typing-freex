import type { DiffLineDto } from '@/core/ipc';

/** Satu segmen dalam word-level diff (inline highlight ala git diff --color-words) */
export interface DiffSegment {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

/** Representasi baris diff untuk rendering UI visual */
export interface DiffDisplayLine {
  tag: 'equal' | 'insert' | 'delete' | 'modified';
  oldLineNum: number | null;
  newLineNum: number | null;
  /** Teks baris mentah untuk equal, insert, atau delete murni */
  text: string | null;
  /** Word-level segments jika baris bertipe 'modified' (pasangan delete + insert) */
  oldSegments: DiffSegment[] | null;
  newSegments: DiffSegment[] | null;
}

/** Context-collapsed group untuk memotong baris unchanged yang terlalu panjang */
export interface DiffHunk {
  id: string;
  type: 'context' | 'change';
  lines: DiffDisplayLine[];
  /** Jumlah baris tersembunyi pada hunk context */
  collapsedCount?: number;
  expanded?: boolean;
}

export type { DiffLineDto };

