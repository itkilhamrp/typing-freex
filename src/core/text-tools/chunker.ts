/**
 * Chunked Practice Engine (§5.11.8)
 * Implements deterministic sentence- and paragraph-aware text chunking.
 */

import { Mulberry32 } from '../typing-engine/prng';

export type ChunkMode = 'whole' | 'sequential' | 'random';

export interface ChunkOptions {
  mode?: ChunkMode;
  targetWords?: number; // 25, 50, 100, 200 (default 50)
  seed?: number;        // For random mode
  offsetWords?: number; // For sequential resume
}

export interface TextChunk {
  index: number;
  totalChunks: number;
  text: string;
  wordCount: number;
  startWordOffset: number;
}

/**
 * Splits text into deterministic, sentence- and paragraph-aware chunks.
 */
export function chunkText(
  text: string,
  targetWords: number = 50
): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Parse words and their positions in the text
  const wordRegex = /\S+/g;
  const wordMatches: { word: string; index: number; end: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = wordRegex.exec(trimmed)) !== null) {
    wordMatches.push({ word: m[0], index: m.index, end: m.index + m[0].length });
  }

  const totalWords = wordMatches.length;
  if (totalWords <= targetWords * 1.2) {
    return [trimmed];
  }

  const chunks: string[] = [];
  let currentWordIdx = 0;

  while (currentWordIdx < totalWords) {
    const remainingWords = totalWords - currentWordIdx;
    const startMatch = wordMatches[currentWordIdx];
    if (!startMatch) break;

    // If remaining words are close to target (<= 1.2 * target), take all remaining
    if (remainingWords <= targetWords * 1.2) {
      chunks.push(trimmed.slice(startMatch.index).trim());
      break;
    }

    const minBound = Math.min(totalWords - 1, currentWordIdx + Math.floor(targetWords * 0.8));
    const maxBound = Math.min(totalWords - 1, currentWordIdx + Math.floor(targetWords * 1.2));
    const targetIdx = Math.min(totalWords - 1, currentWordIdx + targetWords);

    let bestCutWordIdx = targetIdx;
    let bestScore = -1; // Higher is better

    // Search window [0.8 * N, 1.2 * N] for best boundary
    for (let i = minBound; i <= maxBound; i++) {
      const currentMatch = wordMatches[i];
      const nextMatch = wordMatches[i + 1];

      if (!currentMatch || !nextMatch) {
        bestCutWordIdx = i;
        break;
      }

      const between = trimmed.slice(currentMatch.end, nextMatch.index);

      let score = 0;
      // 1. Paragraph boundary: double newline (\n\n) -> highest score 100
      if (between.includes('\n\n')) {
        score = 100;
      }
      // 2. Sentence boundary: punctuation followed by space/newline -> score 50
      else if (/[.?!][)"']?$/.test(currentMatch.word)) {
        score = 50;
      }
      // 3. Clause boundary: comma, semicolon, colon -> score 20
      else if (/[,;:][)"']?$/.test(currentMatch.word)) {
        score = 20;
      }
      // 4. Single newline -> score 10
      else if (between.includes('\n')) {
        score = 10;
      } else {
        score = 1;
      }

      // Penalize distance from targetIdx
      const distancePenalty = Math.abs(i - targetIdx) * 1.5;
      const finalScore = score - distancePenalty;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestCutWordIdx = i;
      }
    }

    const endMatch = wordMatches[bestCutWordIdx];
    if (endMatch) {
      chunks.push(trimmed.slice(startMatch.index, endMatch.end).trim());
    }

    currentWordIdx = bestCutWordIdx + 1;
  }

  return chunks;
}

/**
 * Returns a specific practice chunk based on ChunkOptions.
 */
export function getPracticeChunk(text: string, options: ChunkOptions = {}): TextChunk {
  const mode = options.mode ?? 'whole';
  const targetWords = options.targetWords ?? 50;
  const trimmed = text.trim();

  if (mode === 'whole' || !trimmed) {
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    return {
      index: 0,
      totalChunks: 1,
      text: trimmed,
      wordCount: words,
      startWordOffset: 0,
    };
  }

  const chunks = chunkText(trimmed, targetWords);
  const totalChunks = chunks.length;

  if (mode === 'random') {
    const prng = new Mulberry32(options.seed ?? Date.now());
    const idx = prng.nextInt(0, Math.max(0, totalChunks - 1));
    const chunk = chunks[idx] ?? '';
    return {
      index: idx,
      totalChunks,
      text: chunk,
      wordCount: chunk ? chunk.split(/\s+/).length : 0,
      startWordOffset: idx * targetWords,
    };
  }

  // Sequential mode
  const resumeWord = options.offsetWords ?? 0;
  let accumulatedWords = 0;
  let targetChunkIdx = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunkLine = chunks[i] ?? '';
    const count = chunkLine.split(/\s+/).length;
    if (accumulatedWords + count > resumeWord) {
      targetChunkIdx = i;
      break;
    }
    accumulatedWords += count;
  }

  const selected = chunks[targetChunkIdx] ?? '';
  return {
    index: targetChunkIdx,
    totalChunks,
    text: selected,
    wordCount: selected ? selected.split(/\s+/).length : 0,
    startWordOffset: accumulatedWords,
  };
}
