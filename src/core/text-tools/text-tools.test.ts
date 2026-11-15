import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  sanitizeText,
  validateText,
  sanitizeAndValidate,
  normalizeText,
  smartNormalizeText,
  splitLongWords,
  analyzeText,
  chunkText,
  getPracticeChunk,
} from './index';
import { EventBus } from '../event-bus';

describe('Text Tools - Conformance Vectors', () => {
  const vectorsDir = path.resolve(__dirname, '../../../tests/vectors/text-tools');

  it('passes all sanitize conformance vectors', () => {
    const vectors = JSON.parse(
      fs.readFileSync(path.join(vectorsDir, 'sanitize.json'), 'utf-8')
    );
    for (const v of vectors) {
      const actual = sanitizeText(v.input);
      expect(actual).toBe(v.expected);
    }
  });

  it('passes all normalize conformance vectors', () => {
    const vectors = JSON.parse(
      fs.readFileSync(path.join(vectorsDir, 'normalize.json'), 'utf-8')
    );
    for (const v of vectors) {
      const actual = normalizeText(v.input, v.options);
      expect(actual).toBe(v.expected);
    }
  });
});

describe('Text Sanitizer & Validator', () => {
  it('rejects empty or whitespace-only strings', () => {
    expect(validateText('').isValid).toBe(false);
    expect(validateText('   \n\t  ').isValid).toBe(false);
  });

  it('accepts valid text within bounds', () => {
    const result = sanitizeAndValidate('Hello world');
    expect(result.isValid).toBe(true);
    expect(result.wordCount).toBe(2);
    expect(result.charCount).toBe(11);
  });

  it('rejects strings exceeding 50,000 characters', () => {
    const huge = 'a'.repeat(50001);
    expect(validateText(huge).isValid).toBe(false);
  });
});

describe('Text Analyzer & Issue Detection', () => {
  it('detects smart punctuation and tabs', () => {
    const text = '“Quotes” and ‘single’ with\ttab';
    const analysis = analyzeText(text);

    expect(analysis.issues.some((i) => i.code === 'SMART_PUNCTUATION')).toBe(true);
    expect(analysis.issues.some((i) => i.code === 'TAB_CHARACTER')).toBe(true);
  });

  it('detects long words (> 35 chars) with auto-fix enabled', () => {
    const text = 'short ' + 'x'.repeat(40) + ' word';
    const analysis = analyzeText(text);

    expect(analysis.issues.some((i) => i.code === 'LONG_WORD')).toBe(true);
    expect(analysis.issues.find((i) => i.code === 'LONG_WORD')?.canAutoFix).toBe(true);
  });

  it('smartNormalizeText breaks long words (> 35 chars) into typeable words', () => {
    const raw = 'Here is a glued.SentenceMissingSpace and very_long_identifier_that_exceeds_thirty_five_characters and ' + 'y'.repeat(50);
    const initialAnalysis = analyzeText(raw);
    expect(initialAnalysis.issues.some((i) => i.code === 'LONG_WORD')).toBe(true);

    const split = splitLongWords(raw, 35);
    expect(split.split(/\s+/).every((w) => w.length <= 35)).toBe(true);

    const normalized = smartNormalizeText(raw);
    const afterAnalysis = analyzeText(normalized);

    // Must no longer have any LONG_WORD issue
    expect(afterAnalysis.issues.some((i) => i.code === 'LONG_WORD')).toBe(false);
    expect(afterAnalysis.longestWordLength).toBeLessThanOrEqual(35);
  });

  it('detects untypeable characters when layout set is provided', () => {
    const allowed = new Set(['a', 'b', 'c', ' ']);
    const text = 'abc z';
    const analysis = analyzeText(text, 40, allowed);

    expect(analysis.issues.some((i) => i.code === 'UNTYPEABLE_CHAR')).toBe(true);
  });

  it('detects control chars, bidi overrides, exotic spaces, multi spaces, and trailing whitespace', () => {
    const complexText = 'Line 1 \nLine 2\u00A0more  spaces\u202A\x01\n\n\n\nNext line';
    const analysis = analyzeText(complexText);

    expect(analysis.issues.some((i) => i.code === 'CONTROL_CHAR')).toBe(true);
    expect(analysis.issues.some((i) => i.code === 'BIDI_OVERRIDE')).toBe(true);
    expect(analysis.issues.some((i) => i.code === 'EXOTIC_SPACE')).toBe(true);
    expect(analysis.issues.some((i) => i.code === 'MULTIPLE_SPACES')).toBe(true);
    expect(analysis.issues.some((i) => i.code === 'TRAILING_WHITESPACE')).toBe(true);
    expect(analysis.issues.some((i) => i.code === 'EXTRA_BLANK_LINES')).toBe(true);
    expect(analysis.hasErrors).toBe(true);
  });

  it('detects too long for session (> 2000 chars)', () => {
    const longText = 'word '.repeat(500);
    const analysis = analyzeText(longText);

    expect(analysis.issues.some((i) => i.code === 'TOO_LONG_FOR_SESSION')).toBe(true);
  });

  it('detects whitespace only text', () => {
    const analysis = analyzeText('   \n\t  ');
    expect(analysis.hasErrors).toBe(true);
    expect(analysis.issues.some((i) => i.code === 'WHITESPACE_ONLY')).toBe(true);
  });

  it('handles empty text cleanly with zero issues', () => {
    const analysis = analyzeText('');
    expect(analysis.issues.length).toBe(0);
    expect(analysis.hasErrors).toBe(false);
    expect(analysis.charCount).toBe(0);
    expect(analysis.wordCount).toBe(0);
  });

  it('does not flag single space in empty editor or single trailing space at EOF while typing next word', () => {
    // Single space in empty editor
    const singleSpace = analyzeText(' ');
    expect(singleSpace.issues.some((i) => i.code === 'WHITESPACE_ONLY')).toBe(false);

    // Single trailing space at EOF while typing next word
    const typingWord = analyzeText('Hello world ');
    expect(typingWord.issues.some((i) => i.code === 'TRAILING_WHITESPACE')).toBe(false);

    // Double trailing space at EOF should still be flagged
    const doubleTrailing = analyzeText('Hello world  ');
    expect(doubleTrailing.issues.some((i) => i.code === 'TRAILING_WHITESPACE')).toBe(true);

    // Trailing space on intermediate line before newline should still be flagged
    const intermediateTrailing = analyzeText('Line 1 \nLine 2');
    expect(intermediateTrailing.issues.some((i) => i.code === 'TRAILING_WHITESPACE')).toBe(true);
  });
});

describe('Chunker Engine', () => {
  it('chunks text along sentence and paragraph boundaries', () => {
    const text = `This is the first sentence. It has some words in it. Here is another sentence.\n\nThis is a second paragraph with more sentences. It continues here with additional details.`;
    const chunks = chunkText(text, 10);

    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should not be empty
    chunks.forEach((c) => expect(c.length).toBeGreaterThan(0));
  });

  it('returns whole text if under word target threshold', () => {
    const text = 'Short text here.';
    const chunk = getPracticeChunk(text, { mode: 'whole' });
    expect(chunk.totalChunks).toBe(1);
    expect(chunk.text).toBe(text);
  });

  it('supports sequential resume', () => {
    const text = Array(120).fill('word').join(' ');
    const chunk = getPracticeChunk(text, { mode: 'sequential', targetWords: 50, offsetWords: 60 });
    expect(chunk.index).toBe(1);
  });
});

describe('Event Bus', () => {
  it('emits and receives events with unsubscription', () => {
    const bus = new EventBus();
    let callCount = 0;

    const unsub = bus.on('test-event', () => {
      callCount++;
    });

    bus.emit('test-event', {});
    expect(callCount).toBe(1);

    unsub();
    bus.emit('test-event', {});
    expect(callCount).toBe(1);
  });

  it('supports once() listener', () => {
    const bus = new EventBus();
    let callCount = 0;

    bus.once('once-event', () => {
      callCount++;
    });

    bus.emit('once-event', {});
    bus.emit('once-event', {});
    expect(callCount).toBe(1);
  });
});
