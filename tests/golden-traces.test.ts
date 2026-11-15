/**
 * Golden Trace Replay Suite & Acceptance Criteria Tests (§5.4, AC-01, AC-02, AC-03)
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { replayTrace, type TraceFile } from '../scripts/tool-replay';
import {
  TypingEngine,
  generateTimeText,
  generateWordsText,
  pickQuote,
  classifyQuoteLength,
  type QuoteItem,
} from '../src/core/typing-engine';

describe('Golden Trace Replay Suite (AC-02)', () => {
  const tracesDir = path.resolve(__dirname, './golden-traces');
  const traceFiles = fs.readdirSync(tracesDir).filter((file) => file.endsWith('.json'));

  it('contains at least 5 golden trace files', () => {
    expect(traceFiles.length).toBeGreaterThanOrEqual(5);
  });

  traceFiles.forEach((file) => {
    it(`replays ${file} matching expected golden metrics`, () => {
      const fullPath = path.join(tracesDir, file);
      const trace = JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as TraceFile;

      const result = replayTrace(trace);

      if (trace.expected) {
        if (trace.expected.wpm !== undefined) {
          expect(result.wpm).toBeCloseTo(trace.expected.wpm, 2);
        }
        if (trace.expected.rawWpm !== undefined) {
          expect(result.rawWpm).toBeCloseTo(trace.expected.rawWpm, 2);
        }
        if (trace.expected.accuracy !== undefined) {
          expect(result.accuracy).toBeCloseTo(trace.expected.accuracy, 2);
        }
        if (trace.expected.consistency !== undefined && trace.expected.consistency !== null) {
          expect(result.consistency).toBeCloseTo(trace.expected.consistency, 1);
        }
        if (trace.expected.durationSeconds !== undefined) {
          expect(result.durationSeconds).toBeCloseTo(trace.expected.durationSeconds, 2);
        }
        if (trace.expected.correctChars !== undefined) {
          expect(result.liveMetrics.correctChars).toBe(trace.expected.correctChars);
        }
        if (trace.expected.incorrectChars !== undefined) {
          expect(result.liveMetrics.incorrectChars).toBe(trace.expected.incorrectChars);
        }
        if (trace.expected.extraChars !== undefined) {
          expect(result.liveMetrics.extraChars).toBe(trace.expected.extraChars);
        }
      }
    });
  });
});

describe('AC-01: Time-60 mode timer starts on first keystroke and ends at 60.000s active time (± 1 frame)', () => {
  it('measures exactly 60.000s active time when ticking to 60s', () => {
    const engine = new TypingEngine({ mode: 'time', timeLimit: 60 }, 'the quick brown fox');

    // Idle / Ready state before first keystroke
    expect(engine.getSnapshot(1000).state).toBe('Ready');
    expect(engine.getSnapshot(1000).activeElapsedMs).toBe(0);

    // First keystroke at t=1000 starts timer
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 1000 });
    expect(engine.getSnapshot(1000).state).toBe('Running');
    expect(engine.getSnapshot(1000).activeElapsedMs).toBe(0);

    // Keystroke at t=1500 -> 500ms active
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 'h', timestamp: 1500 });
    expect(engine.getSnapshot(1500).activeElapsedMs).toBe(500);

    // Tick to 30.000s (t=31000)
    engine.dispatch({ type: 'TICK', timestamp: 31000 });
    expect(engine.getSnapshot(31000).activeElapsedMs).toBe(30000);

    // Tick to 60.000s (t=61000)
    engine.dispatch({ type: 'TICK', timestamp: 61000 });
    const snapshot = engine.getSnapshot(61000);
    expect(snapshot.state).toBe('Finished');
    expect(snapshot.activeElapsedMs).toBe(60000);

    const result = engine.finalize(61000);
    // 60.000s within 1 frame (16.7ms = 0.0167s)
    expect(result.durationSeconds).toBe(60);
  });
});

describe('AC-03: Deterministic Generation', () => {
  const wordlist = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew'];
  const quotes: QuoteItem[] = [
    { id: 'q1', text: 'To be or not to be.', source: 'Shakespeare', length: 19 },
    { id: 'q2', text: 'The only thing we have to fear is fear itself.', source: 'FDR', length: 46 },
    { id: 'q3', text: 'I think, therefore I am.', source: 'Descartes', length: 24 },
  ];

  it('generateWordsText produces identical outputs with identical seed', () => {
    const textA = generateWordsText(wordlist, 5, 12345);
    const textB = generateWordsText(wordlist, 5, 12345);
    const textDiff = generateWordsText(wordlist, 5, 54321);

    expect(textA).toBe(textB);
    expect(textA).not.toBe(textDiff);
  });

  it('generateTimeText produces identical outputs with identical seed', () => {
    const textA = generateTimeText(wordlist, 30, 99999);
    const textB = generateTimeText(wordlist, 30, 99999);

    expect(textA).toBe(textB);
  });

  it('pickQuote produces identical quote with identical seed', () => {
    const quoteA = pickQuote(quotes, 777);
    const quoteB = pickQuote(quotes, 777);

    expect(quoteA).toEqual(quoteB);
  });

  it('classifies quote lengths accurately according to monkeytype standards', () => {
    expect(classifyQuoteLength(50)).toBe('short');
    expect(classifyQuoteLength(100)).toBe('short');
    expect(classifyQuoteLength(101)).toBe('medium');
    expect(classifyQuoteLength(250)).toBe('medium');
    expect(classifyQuoteLength(251)).toBe('long');
    expect(classifyQuoteLength(600)).toBe('long');
    expect(classifyQuoteLength(601)).toBe('thicc');
  });

  it('filters quotes by length category', () => {
    const mixedQuotes: QuoteItem[] = [
      { id: 'q1', text: 'Short quote', source: 'A', length: 11 },
      { id: 'q2', text: 'Medium quote '.repeat(10), source: 'B', length: 130 },
      { id: 'q3', text: 'Long quote '.repeat(30), source: 'C', length: 330 },
      { id: 'q4', text: 'Thicc quote '.repeat(60), source: 'D', length: 720 },
    ];

    const shortPicked = pickQuote(mixedQuotes, 42, 'short');
    expect(shortPicked.id).toBe('q1');

    const mediumPicked = pickQuote(mixedQuotes, 42, 'medium');
    expect(mediumPicked.id).toBe('q2');

    const longPicked = pickQuote(mixedQuotes, 42, 'long');
    expect(longPicked.id).toBe('q3');

    const thiccPicked = pickQuote(mixedQuotes, 42, 'thicc');
    expect(thiccPicked.id).toBe('q4');
  });
});

