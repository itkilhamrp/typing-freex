import { describe, it, expect } from 'vitest';
import {
  splitIntoTokens,
  tokenizeWordDiff,
  pairModifiedLines,
  groupIntoHunks,
} from './diff-tokenizer';
import type { DiffLineDto } from '../types/diff.types';

describe('diff-tokenizer: splitIntoTokens', () => {
  it('splits sentence into words, punctuation, and spaces', () => {
    const text = 'Hello, world! 123';
    const tokens = splitIntoTokens(text);
    expect(tokens).toEqual(['Hello', ',', ' ', 'world', '!', ' ', '123']);
  });

  it('handles empty string gracefully', () => {
    expect(splitIntoTokens('')).toEqual([]);
  });
});

describe('diff-tokenizer: tokenizeWordDiff (git diff --color-words)', () => {
  it('identifies word replacement accurately', () => {
    const oldText = 'The quick brown fox';
    const newText = 'The fast brown fox';

    const { oldSegments, newSegments } = tokenizeWordDiff(oldText, newText);

    expect(oldSegments).toEqual([
      { type: 'equal', text: 'The ' },
      { type: 'delete', text: 'quick' },
      { type: 'equal', text: ' brown fox' },
    ]);

    expect(newSegments).toEqual([
      { type: 'equal', text: 'The ' },
      { type: 'insert', text: 'fast' },
      { type: 'equal', text: ' brown fox' },
    ]);
  });

  it('handles additions at the end of string', () => {
    const oldText = 'apple orange';
    const newText = 'apple orange banana';

    const { oldSegments, newSegments } = tokenizeWordDiff(oldText, newText);

    expect(oldSegments).toEqual([
      { type: 'equal', text: 'apple orange' },
    ]);

    expect(newSegments).toEqual([
      { type: 'equal', text: 'apple orange' },
      { type: 'insert', text: ' banana' },
    ]);
  });

  it('handles empty inputs', () => {
    const result = tokenizeWordDiff('', '');
    expect(result.oldSegments).toEqual([]);
    expect(result.newSegments).toEqual([]);
  });
});

describe('diff-tokenizer: pairModifiedLines', () => {
  it('pairs adjacent delete and insert into modified line with word diff', () => {
    const lines: DiffLineDto[] = [
      { tag: 'equal', old_line_num: 1, new_line_num: 1, text: 'Hello' },
      { tag: 'delete', old_line_num: 2, new_line_num: null, text: 'Old line' },
      { tag: 'insert', old_line_num: null, new_line_num: 2, text: 'New line' },
      { tag: 'equal', old_line_num: 3, new_line_num: 3, text: 'World' },
    ];

    const displayLines = pairModifiedLines(lines);

    expect(displayLines).toHaveLength(3);
    expect(displayLines[0]?.tag).toBe('equal');
    expect(displayLines[1]?.tag).toBe('modified');
    expect(displayLines[1]?.oldLineNum).toBe(2);
    expect(displayLines[1]?.newLineNum).toBe(2);
    expect(displayLines[1]?.oldSegments).toBeDefined();
    expect(displayLines[1]?.newSegments).toBeDefined();
    expect(displayLines[2]?.tag).toBe('equal');
  });

  it('preserves standalone insert and delete lines', () => {
    const lines: DiffLineDto[] = [
      { tag: 'delete', old_line_num: 1, new_line_num: null, text: 'Deleted' },
      { tag: 'equal', old_line_num: 2, new_line_num: 1, text: 'Kept' },
      { tag: 'insert', old_line_num: null, new_line_num: 2, text: 'Added' },
    ];

    const displayLines = pairModifiedLines(lines);

    expect(displayLines).toHaveLength(3);
    expect(displayLines[0]?.tag).toBe('delete');
    expect(displayLines[1]?.tag).toBe('equal');
    expect(displayLines[2]?.tag).toBe('insert');
  });
});

describe('diff-tokenizer: groupIntoHunks', () => {
  it('collapses middle unchanged lines when exceeding context size', () => {
    const lines: DiffLineDto[] = [
      { tag: 'insert', old_line_num: null, new_line_num: 1, text: 'Change top' },
      ...Array.from({ length: 15 }, (_, i) => ({
        tag: 'equal' as const,
        old_line_num: i + 1,
        new_line_num: i + 2,
        text: `Equal line ${i + 1}`,
      })),
      { tag: 'delete', old_line_num: 16, new_line_num: null, text: 'Change bottom' },
    ];

    const display = pairModifiedLines(lines);
    const hunks = groupIntoHunks(display, 3);

    // Harus terbagi menjadi hunks change dan context collapsed
    expect(hunks.some((h) => h.type === 'context')).toBe(true);
  });
});
