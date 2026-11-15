import { describe, it, expect } from 'vitest';
import { createEngine } from './index';
import type { EngineSnapshot } from './types';

describe('Headless Typing Engine Integration (§5.4)', () => {
  it('runs a complete simulated typing test from start to finish', () => {
    const engine = createEngine(
      {
        mode: 'words',
        wordLimit: 2,
        speedUnit: 'wpm',
      },
      'hi cat'
    );

    let snapshot = engine.getSnapshot(1000);
    expect(snapshot.state).toBe('Ready');
    expect(snapshot.currentWordIndex).toBe(0);

    // Type 'h' at 1000ms -> starts running
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 'h', timestamp: 1000 });
    snapshot = engine.getSnapshot(1000);
    expect(snapshot.state).toBe('Running');
    expect(snapshot.currentCharIndex).toBe(1);

    // Type 'i' at 1200ms
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 'i', timestamp: 1200 });

    // Space at 1400ms -> moves to word 1
    engine.dispatch({ type: 'SPACE', timestamp: 1400 });
    snapshot = engine.getSnapshot(1400);
    expect(snapshot.currentWordIndex).toBe(1);
    expect(snapshot.currentCharIndex).toBe(0);

    // Type 'c', 'a', 't' -> auto-finishes immediately on 't' (MonkeyType behavior)
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 'c', timestamp: 1600 });
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 'a', timestamp: 1800 });
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 2000 });

    snapshot = engine.getSnapshot(2000);
    expect(snapshot.state).toBe('Finished');

    // Subsequent space press when already finished is safely ignored
    engine.dispatch({ type: 'SPACE', timestamp: 2200 });

    // Finalize
    const result = engine.finalize(2000);
    expect(result.accuracy).toBe(100);
    expect(result.durationSeconds).toBeCloseTo(1.0, 1);
    expect(result.wpm).toBeGreaterThan(0);
    expect(result.rawEvents.length).toBe(6); // 'h', 'i', ' ', 'c', 'a', 't'
    expect(result.keyStats['h']?.correct).toBe(1);
    expect(result.keyStats['c']?.correct).toBe(1);
  });

  it('handles pause and resume preserving active elapsed duration', () => {
    const engine = createEngine({ mode: 'time', timeLimit: 30 }, 'test text');

    // Start at 1000ms
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 1000 });
    expect(engine.getSnapshot(1000).state).toBe('Running');

    // Pause at 2000ms (1s active)
    engine.dispatch({ type: 'PAUSE', timestamp: 2000 });
    expect(engine.getSnapshot(2000).state).toBe('Suspended');

    // 5 seconds pass while suspended
    expect(engine.getSnapshot(7000).activeElapsedMs).toBe(1000); // still 1s active!

    // Resume at 7000ms
    engine.dispatch({ type: 'RESUME', timestamp: 7000 });
    expect(engine.getSnapshot(7000).state).toBe('Running');

    // At 8000ms (2s active elapsed total)
    expect(engine.getSnapshot(8000).activeElapsedMs).toBe(2000);
  });

  it('tracks monotonic performance.now() timestamps accurately without Date.now() drift', () => {
    const engine = createEngine({ mode: 'time', timeLimit: 30 }, 'quick brown fox');
    let latestSnapshot: EngineSnapshot = engine.getSnapshot();
    engine.subscribe((snap) => {
      latestSnapshot = snap;
    });

    // Simulate monotonic performance.now() values (~2000ms)
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 'q', timestamp: 2000 });
    expect(latestSnapshot.state).toBe('Running');
    expect(latestSnapshot.activeElapsedMs).toBe(0);
    expect(latestSnapshot.remainingTimeSeconds).toBe(30);

    // After 1.5s of typing (3500ms)
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 'u', timestamp: 3500 });
    expect(latestSnapshot.activeElapsedMs).toBe(1500);
    expect(latestSnapshot.remainingTimeSeconds).toBe(29);
    expect(latestSnapshot.metrics.wpm).toBeGreaterThan(0);

    // RAF TICK at 5000ms (3.0s elapsed)
    engine.dispatch({ type: 'TICK', timestamp: 5000 });
    expect(latestSnapshot.activeElapsedMs).toBe(3000);
    expect(latestSnapshot.remainingTimeSeconds).toBe(27);
  });

  it('supports complete Zen mode lifecycle and finishes on END_ZEN', () => {
    const engine = createEngine({ mode: 'zen' }, '');
    let latestSnapshot: EngineSnapshot = engine.getSnapshot();
    engine.subscribe((snap) => {
      latestSnapshot = snap;
    });

    expect(engine.getSnapshot().words.length).toBe(0);

    // Start typing in Zen mode at 1000ms
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 'h', timestamp: 1000 });
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 'i', timestamp: 1200 });
    expect(latestSnapshot.state).toBe('Running');
    expect(latestSnapshot.words.length).toBe(1);
    expect(latestSnapshot.words[0]?.target).toBe('hi');

    // Space at 1400ms
    engine.dispatch({ type: 'SPACE', timestamp: 1400 });
    expect(latestSnapshot.words.length).toBe(2);

    // Type next word
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 'z', timestamp: 1600 });
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 'e', timestamp: 1800 });
    engine.dispatch({ type: 'CHARACTER_INPUT', char: 'n', timestamp: 2000 });

    // Finish Zen test via END_ZEN (Shift+Enter) at 2500ms
    engine.dispatch({ type: 'END_ZEN', timestamp: 2500 });
    expect(latestSnapshot.state).toBe('Finished');

    const result = engine.finalize(2500);
    expect(result.accuracy).toBe(100);
    expect(result.durationSeconds).toBeCloseTo(1.5, 1);
    expect(result.wpm).toBeGreaterThan(0);
    expect(result.liveMetrics.characterProducingKeystrokes).toBe(6);
  });

  it('reconciles accuracy when forgivingAccuracy is true and mistake is backspaced before space', () => {
    // 1. With forgivingAccuracy: true
    const forgivingEngine = createEngine(
      { mode: 'words', wordLimit: 1, forgivingAccuracy: true },
      'cat'
    );

    // Type 'c' (correct)
    forgivingEngine.dispatch({ type: 'CHARACTER_INPUT', char: 'c', timestamp: 1000 });
    // Type 'x' (mistake!)
    forgivingEngine.dispatch({ type: 'CHARACTER_INPUT', char: 'x', timestamp: 1200 });
    expect(forgivingEngine.getSnapshot().metrics.accuracy).toBe(50); // 1/2

    // Backspace deletes 'x' before space
    forgivingEngine.dispatch({ type: 'BACKSPACE', timestamp: 1300 });
    expect(forgivingEngine.getSnapshot().metrics.accuracy).toBe(100); // Reconciled! 1/1 = 100%

    // Finish word correctly: 'a', 't' -> auto-finishes on 't'
    forgivingEngine.dispatch({ type: 'CHARACTER_INPUT', char: 'a', timestamp: 1400 });
    forgivingEngine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 1600 });
    forgivingEngine.dispatch({ type: 'SPACE', timestamp: 1800 });

    const forgivingResult = forgivingEngine.finalize(1600);
    expect(forgivingResult.accuracy).toBe(100); // 100% accuracy because mistake was fixed before finish!
    expect(forgivingResult.liveMetrics.totalKeystrokes).toBe(5); // c, x, Backspace, a, t (finished without space)

    // 2. Uncorrected mistake before space still penalizes accuracy even in forgiving mode
    const uncorrectedEngine = createEngine(
      { mode: 'words', wordLimit: 1, forgivingAccuracy: true },
      'cat'
    );
    uncorrectedEngine.dispatch({ type: 'CHARACTER_INPUT', char: 'c', timestamp: 1000 });
    uncorrectedEngine.dispatch({ type: 'CHARACTER_INPUT', char: 'x', timestamp: 1200 }); // mistake NOT erased
    uncorrectedEngine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 1400 });
    uncorrectedEngine.dispatch({ type: 'SPACE', timestamp: 1600 });
    const uncorrectedResult = uncorrectedEngine.finalize(1600);
    expect(uncorrectedResult.accuracy).toBeLessThan(100); // penalized!

    // 3. With forgivingAccuracy: false (default strict mode)
    const strictEngine = createEngine(
      { mode: 'words', wordLimit: 1, forgivingAccuracy: false },
      'cat'
    );
    strictEngine.dispatch({ type: 'CHARACTER_INPUT', char: 'c', timestamp: 1000 });
    strictEngine.dispatch({ type: 'CHARACTER_INPUT', char: 'x', timestamp: 1200 }); // mistake
    strictEngine.dispatch({ type: 'BACKSPACE', timestamp: 1300 }); // erased
    strictEngine.dispatch({ type: 'CHARACTER_INPUT', char: 'a', timestamp: 1400 });
    strictEngine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 1600 });
    strictEngine.dispatch({ type: 'SPACE', timestamp: 1800 });
    const strictResult = strictEngine.finalize(1600);
    expect(strictResult.accuracy).toBe(75); // 3 correct (c, a, t) out of 4 producing keystrokes (c, x, a, t)
  });

  describe('Custom Mode Engine Lifecycle', () => {
    it('runs custom mode in infinity mode and finishes when all custom text is completed', () => {
      const engine = createEngine(
        { mode: 'custom', customText: 'hello world' },
        'hello world'
      );

      let snapshot = engine.getSnapshot(1000);
      expect(snapshot.state).toBe('Ready');
      expect(snapshot.remainingTimeSeconds).toBeUndefined();

      // Type 'hello'
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'h', timestamp: 1000 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'e', timestamp: 1100 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'l', timestamp: 1200 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'l', timestamp: 1300 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'o', timestamp: 1400 });
      engine.dispatch({ type: 'SPACE', timestamp: 1500 });

      expect(engine.getSnapshot(1500).state).toBe('Running');

      // Type 'world' -> auto-finishes immediately on 'd'
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'w', timestamp: 1600 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'o', timestamp: 1700 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'r', timestamp: 1800 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'l', timestamp: 1900 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'd', timestamp: 2000 });

      snapshot = engine.getSnapshot(2000);
      expect(snapshot.state).toBe('Finished');

      const result = engine.finalize(2000);
      expect(result.accuracy).toBe(100);
      expect(result.durationSeconds).toBeCloseTo(1.0, 1);
    });

    it('runs timed custom mode and finishes automatically on timeout', () => {
      const engine = createEngine(
        { mode: 'custom', timeLimit: 15, customText: 'a very long custom text that user will not finish in fifteen seconds' },
        'a very long custom text that user will not finish in fifteen seconds'
      );

      // Start at 1000ms
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'a', timestamp: 1000 });
      expect(engine.getSnapshot(1000).state).toBe('Running');
      expect(engine.getSnapshot(1000).remainingTimeSeconds).toBe(15);

      // At 5000ms (4 seconds elapsed)
      engine.dispatch({ type: 'TICK', timestamp: 5000 });
      expect(engine.getSnapshot(5000).remainingTimeSeconds).toBe(11);
      expect(engine.getSnapshot(5000).state).toBe('Running');

      // At 16000ms (15 seconds elapsed since 1000ms)
      engine.dispatch({ type: 'TICK', timestamp: 16000 });
      expect(engine.getSnapshot(16000).state).toBe('Finished');

      const result = engine.finalize(16000);
      expect(result.durationSeconds).toBeCloseTo(15, 0);
    });

    it('finishes early if all custom text is completed before timeLimit expires', () => {
      const engine = createEngine(
        { mode: 'custom', timeLimit: 60, customText: 'quick fox' },
        'quick fox'
      );

      // Start typing at 1000ms
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'q', timestamp: 1000 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'u', timestamp: 1100 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'i', timestamp: 1200 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'c', timestamp: 1300 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'k', timestamp: 1400 });
      engine.dispatch({ type: 'SPACE', timestamp: 1500 });

      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'f', timestamp: 1600 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'o', timestamp: 1700 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'x', timestamp: 1800 });

      // Finished at 1800ms on 'x' without needing space (only 0.8s elapsed, well before 60s limit!)
      const snapshot = engine.getSnapshot(1800);
      expect(snapshot.state).toBe('Finished');
      const result = engine.finalize(1800);
      expect(result.durationSeconds).toBeCloseTo(0.8, 1);
    });

    it('transitions cleanly back to Ready state on RESTART and allows immediate typing', () => {
      const engine = createEngine({ mode: 'words', wordLimit: 2 }, 'hello world');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'h', timestamp: 100 });
      expect(engine.getSnapshot().state).toBe('Running');

      // Restart
      engine.dispatch({ type: 'RESTART', timestamp: 200 });
      expect(engine.getSnapshot().state).toBe('Ready');

      // Can type immediately from Ready
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'h', timestamp: 300 });
      expect(engine.getSnapshot().state).toBe('Running');
    });
  });

  describe('Auto-finish last word without Space (MonkeyType-style)', () => {
    it('finishes immediately when last word is typed fully correct in words mode', () => {
      const engine = createEngine({ mode: 'words', wordLimit: 2 }, 'hi cat');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'h', timestamp: 1000 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'i', timestamp: 1100 });
      engine.dispatch({ type: 'SPACE', timestamp: 1200 });

      // Type last word 'cat' fully correct — no space needed
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'c', timestamp: 1300 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'a', timestamp: 1400 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 1500 });

      const snapshot = engine.getSnapshot(1500);
      expect(snapshot.state).toBe('Finished');
      expect(snapshot.remainingWords).toBe(0);
      expect(snapshot.currentWordIndex).toBe(2);

      const result = engine.finalize(1500);
      expect(result.accuracy).toBe(100);
      expect(result.durationSeconds).toBeCloseTo(0.5, 1);
    });

    it('does NOT auto-finish when last word has errors, but finishes if Space is pressed', () => {
      const engine = createEngine({ mode: 'words', wordLimit: 2 }, 'hi cat');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'h', timestamp: 1000 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'i', timestamp: 1100 });
      engine.dispatch({ type: 'SPACE', timestamp: 1200 });

      // Type last word with mistake
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'c', timestamp: 1300 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'x', timestamp: 1400 }); // mistake
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 1500 });

      expect(engine.getSnapshot(1500).state).toBe('Running'); // NOT finished!

      // Pressing Space now submits word and finishes test
      engine.dispatch({ type: 'SPACE', timestamp: 1600 });
      expect(engine.getSnapshot(1600).state).toBe('Finished');
    });

    it('does NOT auto-finish on non-last words', () => {
      const engine = createEngine({ mode: 'words', wordLimit: 3 }, 'hi cat dog');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'h', timestamp: 1000 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'i', timestamp: 1100 });

      // 'hi' is fully correct but not the last word
      expect(engine.getSnapshot(1100).state).toBe('Running');
    });

    it('does NOT auto-finish in time mode even when words are fully typed', () => {
      const engine = createEngine({ mode: 'time', timeLimit: 30 }, 'hi cat');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'h', timestamp: 1000 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'i', timestamp: 1100 });
      engine.dispatch({ type: 'SPACE', timestamp: 1200 });

      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'c', timestamp: 1300 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'a', timestamp: 1400 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 1500 });

      // In time mode, test only finishes on time limit
      expect(engine.getSnapshot(1500).state).toBe('Running');
    });

    it('finishes immediately on last word in quote mode', () => {
      const engine = createEngine({ mode: 'quote' }, 'to be');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 1000 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'o', timestamp: 1100 });
      engine.dispatch({ type: 'SPACE', timestamp: 1200 });

      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'b', timestamp: 1300 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'e', timestamp: 1400 });

      expect(engine.getSnapshot(1400).state).toBe('Finished');
    });

    it('allows correcting error on last word with backspace and finishes upon correct final letter', () => {
      const engine = createEngine({ mode: 'words', wordLimit: 1 }, 'cat');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'c', timestamp: 1000 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'x', timestamp: 1100 }); // typo
      expect(engine.getSnapshot(1100).state).toBe('Running');

      engine.dispatch({ type: 'BACKSPACE', timestamp: 1200 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'a', timestamp: 1300 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 1400 });

      // Corrected and completed!
      expect(engine.getSnapshot(1400).state).toBe('Finished');
      expect(engine.finalize(1400).accuracy).toBe(75); // 3 correct out of 4 producing keystrokes
    });
  });

  describe('Difficulty Modes (§MonkeyType Difficulty: Normal, Expert, Master)', () => {
    it('Normal mode defaults to classic typing test behavior', () => {
      const engine = createEngine({ mode: 'words', difficulty: 'normal' }, 'apple banana');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'a', timestamp: 1000 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'x', timestamp: 1100 }); // typo
      engine.dispatch({ type: 'SPACE', timestamp: 1200 }); // submit incorrect word

      const snap = engine.getSnapshot(1200);
      expect(snap.state).toBe('Running');
      expect(snap.failedByDifficulty).toBe(false);
      expect(snap.currentWordIndex).toBe(1);
    });

    it('Expert mode allows typos if fixed before Space, but fails upon submitting incorrect word', () => {
      const engine = createEngine({ mode: 'words', difficulty: 'expert' }, 'cat dog');
      // Type 'c', typo 'x', backspace, correct 'a', 't'
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'c', timestamp: 1000 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'x', timestamp: 1100 });
      expect(engine.getSnapshot(1100).state).toBe('Running');

      engine.dispatch({ type: 'BACKSPACE', timestamp: 1200 });
      expect(engine.getSnapshot(1200).state).toBe('Running');

      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'a', timestamp: 1300 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 1400 });
      expect(engine.getSnapshot(1400).state).toBe('Running');

      // Space on correctly typed word advances cleanly
      engine.dispatch({ type: 'SPACE', timestamp: 1500 });
      expect(engine.getSnapshot(1500).state).toBe('Running');
      expect(engine.getSnapshot(1500).currentWordIndex).toBe(1);

      // On word 'dog', type 'd', 'x' (typo) and submit with Space without fixing
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'd', timestamp: 1600 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'x', timestamp: 1700 });
      engine.dispatch({ type: 'SPACE', timestamp: 1800 }); // Submits incorrect word!

      const failedSnap = engine.getSnapshot(1800);
      expect(failedSnap.state).toBe('Finished');
      expect(failedSnap.failedByDifficulty).toBe(true);
      expect(engine.finalize(1800).failedByDifficulty).toBe(true);
    });

    it('Master mode fails immediately on a single incorrect key press', () => {
      const engine = createEngine({ mode: 'words', difficulty: 'master' }, 'hello world');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'h', timestamp: 1000 });
      expect(engine.getSnapshot(1000).state).toBe('Running');

      // Type incorrect letter 'x' instead of 'e'
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'x', timestamp: 1100 });

      const snap = engine.getSnapshot(1100);
      expect(snap.state).toBe('Finished');
      expect(snap.failedByDifficulty).toBe(true);
      expect(engine.finalize(1100).failedByDifficulty).toBe(true);
    });

    it('Master mode fails if Space is pressed on an incomplete word', () => {
      const engine = createEngine({ mode: 'words', difficulty: 'master' }, 'tree rock');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 't', timestamp: 1000 });
      // Premature space
      engine.dispatch({ type: 'SPACE', timestamp: 1100 });

      const snap = engine.getSnapshot(1100);
      expect(snap.state).toBe('Finished');
      expect(snap.failedByDifficulty).toBe(true);
      expect(engine.finalize(1100).failedByDifficulty).toBe(true);
    });

    it('overrides backspaceThroughWords and forgivingAccuracy to false on non-normal difficulties', () => {
      const expertEngine = createEngine({
        mode: 'words',
        difficulty: 'expert',
        backspaceThroughWords: true,
        forgivingAccuracy: true,
      }, 'test');
      expect(expertEngine.getSnapshot().config.backspaceThroughWords).toBe(false);
      expect(expertEngine.getSnapshot().config.forgivingAccuracy).toBe(false);

      const masterEngine = createEngine({
        mode: 'words',
        difficulty: 'master',
        backspaceThroughWords: true,
        forgivingAccuracy: true,
      }, 'test');
      expect(masterEngine.getSnapshot().config.backspaceThroughWords).toBe(false);
      expect(masterEngine.getSnapshot().config.forgivingAccuracy).toBe(false);
    });

    it('RESTART resets failedByDifficulty and readies engine for new test', () => {
      const engine = createEngine({ mode: 'words', difficulty: 'master' }, 'key');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'x', timestamp: 1000 });
      expect(engine.getSnapshot().state).toBe('Finished');
      expect(engine.getSnapshot().failedByDifficulty).toBe(true);

      engine.dispatch({ type: 'RESTART', timestamp: 2000 });
      const snap = engine.getSnapshot();
      expect(snap.state).toBe('Ready');
      expect(snap.failedByDifficulty).toBe(false);
    });

    it('Zen mode does not fail on typos even in master mode', () => {
      const engine = createEngine({ mode: 'zen', difficulty: 'master' });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'a', timestamp: 1000 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'b', timestamp: 1100 });
      engine.dispatch({ type: 'SPACE', timestamp: 1200 });

      const snap = engine.getSnapshot(1200);
      expect(snap.state).toBe('Running');
      expect(snap.failedByDifficulty).toBe(false);
    });

    it('processes ENTER event and advances newlines in quote mode', () => {
      const engine = createEngine({ mode: 'quote' }, 'line1\nline2');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'l', timestamp: 1000 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'i', timestamp: 1100 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'n', timestamp: 1200 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'e', timestamp: 1300 });
      engine.dispatch({ type: 'CHARACTER_INPUT', char: '1', timestamp: 1400 });

      // Enter key
      engine.dispatch({ type: 'ENTER', timestamp: 1500 });
      let snap = engine.getSnapshot(1500);
      expect(snap.currentWordIndex).toBe(2); // on 'line2' (index 0=line1, 1=\n, 2=line2)

      // Finish line2
      for (const ch of 'line2') {
        engine.dispatch({ type: 'CHARACTER_INPUT', char: ch, timestamp: 1600 });
      }
      snap = engine.getSnapshot(1600);
      expect(snap.state).toBe('Finished');
    });

    it('routes bare Enter KEY_DOWN event to ENTER in quote mode', () => {
      const engine = createEngine({ mode: 'quote' }, 'a\nb');
      engine.dispatch({ type: 'CHARACTER_INPUT', char: 'a', timestamp: 1000 });
      engine.dispatch({
        type: 'KEY_DOWN',
        key: 'Enter',
        code: 'Enter',
        timestamp: 1100,
      });
      const snap = engine.getSnapshot(1100);
      expect(snap.currentWordIndex).toBe(2); // advanced to 'b'
    });
  });
});


