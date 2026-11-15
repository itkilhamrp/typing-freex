import type { DiffLineDto, DiffSegment, DiffDisplayLine, DiffHunk } from '../types/diff.types';

/**
 * Memecah string menjadi token kata, simbol tanda baca, dan whitespace.
 * Contoh: "hello, world!" -> ["hello", ",", " ", "world", "!"]
 */
export function splitIntoTokens(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/(\s+|[^\s\w]+|\w+)/g);
  return matches ?? [text];
}

/**
 * Menghitung LCS (Longest Common Subsequence) pada array token
 * dan menghasilkan segmen diff inline untuk oldText dan newText.
 */
export function tokenizeWordDiff(
  oldText: string,
  newText: string
): { oldSegments: DiffSegment[]; newSegments: DiffSegment[] } {
  const oldTokens = splitIntoTokens(oldText);
  const newTokens = splitIntoTokens(newText);

  const m = oldTokens.length;
  const n = newTokens.length;

  if (m === 0 && n === 0) {
    return { oldSegments: [], newSegments: [] };
  }
  if (m === 0) {
    return {
      oldSegments: [],
      newSegments: [{ type: 'insert', text: newText }],
    };
  }
  if (n === 0) {
    return {
      oldSegments: [{ type: 'delete', text: oldText }],
      newSegments: [],
    };
  }

  // DP table untuk LCS
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i < m; i++) {
    const oldTok = oldTokens[i];
    const prevRow = dp[i];
    const currRow = dp[i + 1];
    if (!prevRow || !currRow || oldTok === undefined) continue;

    for (let j = 0; j < n; j++) {
      const newTok = newTokens[j];
      if (newTok === undefined) continue;

      if (oldTok === newTok) {
        currRow[j + 1] = (prevRow[j] ?? 0) + 1;
      } else {
        currRow[j + 1] = Math.max(prevRow[j + 1] ?? 0, currRow[j] ?? 0);
      }
    }
  }

  // Backtracking
  const rawOld: DiffSegment[] = [];
  const rawNew: DiffSegment[] = [];

  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    const prevOld = i > 0 ? oldTokens[i - 1] : undefined;
    const prevNew = j > 0 ? newTokens[j - 1] : undefined;
    const rowI = dp[i];
    const rowPrevI = dp[i - 1];
    const valLeft = (rowI && j > 0 ? rowI[j - 1] : undefined) ?? 0;
    const valUp = (rowPrevI ? rowPrevI[j] : undefined) ?? 0;

    if (i > 0 && j > 0 && prevOld !== undefined && prevNew !== undefined && prevOld === prevNew) {
      rawOld.push({ type: 'equal', text: prevOld });
      rawNew.push({ type: 'equal', text: prevOld });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || valLeft >= valUp)) {
      if (prevNew !== undefined) {
        rawNew.push({ type: 'insert', text: prevNew });
      }
      j--;
    } else if (i > 0 && (j === 0 || valLeft < valUp)) {
      if (prevOld !== undefined) {
        rawOld.push({ type: 'delete', text: prevOld });
      }
      i--;
    } else {
      break;
    }
  }

  rawOld.reverse();
  rawNew.reverse();

  // Penggabungan token berurutan yang bertipe sama agar DOM span lebih sedikit & rapi
  const mergeSegments = (segments: DiffSegment[]): DiffSegment[] => {
    const first = segments[0];
    if (!first) return [];
    const merged: DiffSegment[] = [];
    let current = { ...first };

    for (let idx = 1; idx < segments.length; idx++) {
      const seg = segments[idx];
      if (!seg) continue;
      if (seg.type === current.type) {
        current.text += seg.text;
      } else {
        merged.push(current);
        current = { ...seg };
      }
    }
    merged.push(current);
    return merged;
  };

  return {
    oldSegments: mergeSegments(rawOld),
    newSegments: mergeSegments(rawNew),
  };
}

/**
 * Mengubah baris-baris diff kasar dari backend Rust menjadi baris tampilan yang
 * membedakan modified (inline word highlight), insert, delete, dan equal.
 */
export function pairModifiedLines(lines: DiffLineDto[]): DiffDisplayLine[] {
  const result: DiffDisplayLine[] = [];
  let idx = 0;

  while (idx < lines.length) {
    const current = lines[idx];
    if (!current) {
      idx++;
      continue;
    }

    const next = lines[idx + 1];

    // Deteksi pasangan delete diikuti insert (modifikasi baris)
    if (current.tag === 'delete' && next && next.tag === 'insert') {
      const { oldSegments, newSegments } = tokenizeWordDiff(current.text, next.text);

      result.push({
        tag: 'modified',
        oldLineNum: current.old_line_num,
        newLineNum: next.new_line_num,
        text: null,
        oldSegments,
        newSegments,
      });

      idx += 2;
      continue;
    }

    if (current.tag === 'equal') {
      result.push({
        tag: 'equal',
        oldLineNum: current.old_line_num,
        newLineNum: current.new_line_num,
        text: current.text,
        oldSegments: null,
        newSegments: null,
      });
    } else if (current.tag === 'insert') {
      result.push({
        tag: 'insert',
        oldLineNum: null,
        newLineNum: current.new_line_num,
        text: current.text,
        oldSegments: null,
        newSegments: null,
      });
    } else if (current.tag === 'delete') {
      result.push({
        tag: 'delete',
        oldLineNum: current.old_line_num,
        newLineNum: null,
        text: current.text,
        oldSegments: null,
        newSegments: null,
      });
    }

    idx++;
  }

  return result;
}

/**
 * Mengelompokkan baris ke dalam hunks untuk mendukung context collapse
 * pada baris-baris equal yang panjang (> 2 * contextSize).
 */
export function groupIntoHunks(
  lines: DiffDisplayLine[],
  contextSize = 3
): DiffHunk[] {
  if (lines.length === 0) return [];

  const hunks: DiffHunk[] = [];
  let currentGroup: DiffDisplayLine[] = [];
  let hunkId = 0;

  // Temukan indeks baris yang bukan equal
  const changedIndices = new Set<number>();
  lines.forEach((line, i) => {
    if (line.tag !== 'equal') {
      for (let offset = -contextSize; offset <= contextSize; offset++) {
        const target = i + offset;
        if (target >= 0 && target < lines.length) {
          changedIndices.add(target);
        }
      }
    }
  });

  // Jika tidak ada perubahan sama sekali, atau semua baris masuk konteks
  if (changedIndices.size === 0) {
    if (lines.length > contextSize * 2) {
      return [
        {
          id: `hunk-${++hunkId}`,
          type: 'context',
          lines,
          collapsedCount: lines.length,
          expanded: false,
        },
      ];
    }
    return [
      {
        id: `hunk-${++hunkId}`,
        type: 'change',
        lines,
      },
    ];
  }

  let inCollapsed = false;
  let collapsedLines: DiffDisplayLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const isVisibleContext = changedIndices.has(i);
    const line = lines[i];
    if (!line) continue;

    if (isVisibleContext) {
      if (inCollapsed) {
        hunks.push({
          id: `hunk-${++hunkId}`,
          type: 'context',
          lines: collapsedLines,
          collapsedCount: collapsedLines.length,
          expanded: false,
        });
        collapsedLines = [];
        inCollapsed = false;
      }
      currentGroup.push(line);
    } else {
      if (!inCollapsed) {
        if (currentGroup.length > 0) {
          hunks.push({
            id: `hunk-${++hunkId}`,
            type: 'change',
            lines: currentGroup,
          });
          currentGroup = [];
        }
        inCollapsed = true;
      }
      collapsedLines.push(line);
    }
  }

  if (inCollapsed && collapsedLines.length > 0) {
    hunks.push({
      id: `hunk-${++hunkId}`,
      type: 'context',
      lines: collapsedLines,
      collapsedCount: collapsedLines.length,
      expanded: false,
    });
  } else if (currentGroup.length > 0) {
    hunks.push({
      id: `hunk-${++hunkId}`,
      type: 'change',
      lines: currentGroup,
    });
  }

  return hunks;
}
