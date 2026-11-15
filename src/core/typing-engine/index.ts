import type {
  EngineConfig,
  EngineEvent,
  EngineSnapshot,
  FinalResult,
  LiveMetrics,
  WordState,
} from './types';
import { EngineStateMachine } from './state-machine';
import { MonotonicTimer } from './timer';
import { TextBuffer } from './text-buffer';
import { KeystrokeRecorder } from './recorder';
import {
  calculateNetWpm,
  calculateRawWpm,
  calculateAccuracy,
  calculateConsistency,
  calculateConsistencyIncremental,
} from './metrics';

import { InputProcessor } from './input-processor';

export * from './types';
export * from './prng';
export * from './timer';
export * from './text-buffer';
export * from './input-processor';
export * from './state-machine';
export * from './recorder';
export * from './metrics';
export * from './generators';

export class TypingEngine {
  private config: EngineConfig;
  private stateMachine: EngineStateMachine;
  private timer: MonotonicTimer;
  private buffer: TextBuffer;
  private recorder: KeystrokeRecorder;
  private inputProcessor: InputProcessor;
  private revision: number = 0;
  private bufferRevision: number = 0;
  private listeners: Set<(snapshot: EngineSnapshot) => void> = new Set();
  private lastSampledSecond: number = 0;
  private lastSampledErrors: number = 0;
  private lastTickNotifyMs: number = 0;
  private characterProducingKeystrokes: number = 0;
  private correctKeystrokes: number = 0;
  private totalKeystrokes: number = 0;
  private testUuid: string;
  private currentTimestamp: number = 0;
  private cachedConsistency: number | null = null;
  private consistencySum: number = 0;
  private consistencySumSq: number = 0;
  private consistencyCount: number = 0;
  private lastNotifiedRevision: number = -1;
  private failedByDifficulty: boolean = false;

  constructor(config: EngineConfig, initialText: string = '') {
    const difficulty = config.difficulty ?? 'normal';
    this.config = {
      strictSpace: false,
      stopOnError: 'off',
      backspaceThroughWords: false,
      forgivingAccuracy: false,
      speedUnit: 'wpm',
      ...config,
      difficulty,
      ...(difficulty !== 'normal'
        ? {
            backspaceThroughWords: false,
            forgivingAccuracy: false,
          }
        : {}),
    };
    this.stateMachine = new EngineStateMachine(this.config.suspendTimeoutMs);
    this.timer = new MonotonicTimer();
    this.buffer = new TextBuffer('', this.config.mode === 'zen', this.config.mode === 'quote' || this.config.mode === 'tech' || this.config.mode === 'custom');
    this.recorder = new KeystrokeRecorder();
    this.inputProcessor = new InputProcessor();
    this.testUuid = `test-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    if (initialText || this.config.mode === 'zen') {
      this.loadText(initialText);
    }
  }

  loadText(text: string, timestamp?: number): void {
    this.failedByDifficulty = false;
    this.stateMachine.transition('LOAD_TEST');
    const preserveNewlines = this.config.mode === 'quote' || this.config.mode === 'tech' || this.config.mode === 'custom';
    this.buffer.loadText(text, this.config.mode === 'zen', preserveNewlines);
    this.stateMachine.transition('TEXT_READY');
    this.bufferRevision++;
    this.revision++;
    this.notify(timestamp);
  }

  dispatch(event: EngineEvent): void {
    if ('timestamp' in event && typeof event.timestamp === 'number') {
      this.currentTimestamp = event.timestamp;
    }

    const currentState = this.stateMachine.getState();

    switch (event.type) {
      case 'LOAD_TEST': {
        const merged = { ...this.config, ...event.config };
        const diff = merged.difficulty ?? 'normal';
        merged.difficulty = diff;
        if (diff !== 'normal') {
          merged.backspaceThroughWords = false;
          merged.forgivingAccuracy = false;
        }
        this.config = merged;
        this.loadText(event.targetText);
        break;
      }

      case 'KEY_DOWN': {
        const processed = this.inputProcessor.processKey({
          code: event.code,
          key: event.key,
          timestamp: event.timestamp,
          repeat: event.repeat,
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          altGraphKey: event.altGraphKey,
          isComposing: event.isComposing,
        });
        if (processed) {
          this.dispatch(processed);
        }
        break;
      }

      case 'CHARACTER_INPUT':
        this.handleCharInput(event.char, event.timestamp);
        break;

      case 'SPACE':
        this.handleSpaceInput(event.timestamp);
        break;

      case 'ENTER':
        this.handleEnterInput(event.timestamp);
        break;

      case 'BACKSPACE':
        this.handleBackspaceInput(event.timestamp);
        break;

      case 'TICK':
        this.handleTick(event.timestamp);
        break;

      case 'FOCUS_LOST':
        if (currentState === 'Running') {
          const behavior = event.behavior ?? 'suspend';
          if (behavior === 'suspend') {
            this.timer.suspend(event.timestamp);
            this.stateMachine.transition('FOCUS_LOST_SUSPEND', event.timestamp);
          } else {
            this.stateMachine.transition('FOCUS_LOST_ABORT', event.timestamp);
          }
          this.revision++;
          this.notify(event.timestamp);
        }
        break;

      case 'FOCUS_GAINED':
      case 'RESUME':
        if (currentState === 'Suspended') {
          this.timer.resume(event.timestamp);
          this.stateMachine.transition('FOCUS_GAINED', event.timestamp);
          this.revision++;
          this.notify(event.timestamp);
        }
        break;

      case 'PAUSE':
        if (currentState === 'Running') {
          this.timer.suspend(event.timestamp);
          this.stateMachine.transition('FOCUS_LOST_SUSPEND', event.timestamp);
          this.revision++;
          this.notify(event.timestamp);
        }
        break;

      case 'END_ZEN':
        if (this.config.mode === 'zen') {
          if (currentState === 'Running' || currentState === 'Suspended' || currentState === 'Ready') {
            this.finishTest(event.timestamp);
          }
        } else {
          this.handleEnterInput(event.timestamp);
        }
        break;

      case 'ABORT':
        this.stateMachine.transition('ABORT', event.timestamp);
        this.revision++;
        this.notify(event.timestamp);
        break;

      case 'RESTART':
        this.failedByDifficulty = false;
        this.timer.reset();
        this.recorder.clear();
        this.characterProducingKeystrokes = 0;
        this.correctKeystrokes = 0;
        this.totalKeystrokes = 0;
        this.lastSampledSecond = 0;
        this.lastSampledErrors = 0;
        this.lastTickNotifyMs = 0;
        this.cachedConsistency = null;
        this.consistencySum = 0;
        this.consistencySumSq = 0;
        this.consistencyCount = 0;
        this.lastNotifiedRevision = -1;
        this.currentTimestamp = event.timestamp ?? 0;
        this.buffer.loadText(
          this.buffer.getRawTargetText(),
          this.config.mode === 'zen',
          this.config.mode === 'quote' || this.config.mode === 'tech' || this.config.mode === 'custom'
        );
        this.stateMachine.transition('RESTART', event.timestamp);
        this.stateMachine.transition('TEXT_READY', event.timestamp);
        this.bufferRevision++;
        this.revision++;
        this.notify(event.timestamp);
        break;
    }
  }

  private failTest(timestamp: number): void {
    this.failedByDifficulty = true;
    this.finishTest(timestamp);
  }

  private handleCharInput(char: string, timestamp: number): void {
    let state = this.stateMachine.getState();

    // Start running on first keystroke from Ready state
    if (state === 'Ready') {
      this.timer.start(timestamp);
      this.stateMachine.transition('FIRST_KEYSTROKE');
      state = this.stateMachine.getState();
    }

    if (state !== 'Running') return;

    this.totalKeystrokes++;
    this.characterProducingKeystrokes++;

    const expectedChar = this.buffer.getCurrentTargetChar();
    const result = this.buffer.inputChar(char, timestamp);

    if (!result.isIgnored) {
      if (result.isCorrect) {
        this.correctKeystrokes++;
      }
      this.recorder.recordKeystroke(
        char,
        `Key${char.toUpperCase()}`,
        result.isCorrect,
        timestamp,
        expectedChar ?? undefined
      );
    }

    // Master mode: test fails immediately on a single incorrect key
    if (this.config.mode !== 'zen' && this.config.difficulty === 'master' && !result.isCorrect) {
      this.bufferRevision++;
      this.failTest(timestamp);
      return;
    }

    this.bufferRevision++;
    this.revision++;
    this.checkCompletion(timestamp);
    this.notify(timestamp);
  }

  private handleSpaceInput(timestamp: number): void {
    let state = this.stateMachine.getState();

    if (state === 'Ready') {
      this.timer.start(timestamp);
      this.stateMachine.transition('FIRST_KEYSTROKE');
      state = this.stateMachine.getState();
    }

    if (state !== 'Running') return;

    this.totalKeystrokes++;
    this.characterProducingKeystrokes++;

    const expectedChar = this.buffer.getCurrentTargetChar();
    const result = this.buffer.handleSpace(timestamp, this.config.strictSpace);

    if (result.advanced) {
      if (result.isCorrect) {
        this.correctKeystrokes++;
      }
      this.recorder.recordKeystroke(
        ' ',
        'Space',
        result.isCorrect,
        timestamp,
        expectedChar ?? undefined
      );
    }

    // Difficulty checks on space:
    // - Master fails on any incorrect key (including invalid space)
    // - Expert fails if user submits an incorrect word
    if (this.config.mode !== 'zen') {
      if (this.config.difficulty === 'master' && !result.isCorrect) {
        this.bufferRevision++;
        this.failTest(timestamp);
        return;
      }
      if (this.config.difficulty === 'expert' && result.advanced && !result.isCorrect) {
        this.bufferRevision++;
        this.failTest(timestamp);
        return;
      }
    }

    this.bufferRevision++;
    this.revision++;
    this.checkCompletion(timestamp);
    this.notify(timestamp);
  }

  private handleEnterInput(timestamp: number): void {
    let state = this.stateMachine.getState();

    if (state === 'Ready') {
      this.timer.start(timestamp);
      this.stateMachine.transition('FIRST_KEYSTROKE');
      state = this.stateMachine.getState();
    }

    if (state !== 'Running') return;

    this.totalKeystrokes++;
    this.characterProducingKeystrokes++;

    const expectedChar = this.buffer.getCurrentTargetChar();
    const result = this.buffer.handleEnter(timestamp, this.config.strictSpace);

    if (result.advanced) {
      if (result.isCorrect) {
        this.correctKeystrokes++;
      }
      this.recorder.recordKeystroke(
        '\n',
        'Enter',
        result.isCorrect,
        timestamp,
        expectedChar ?? undefined
      );
    }

    // Difficulty checks on enter:
    // - Master fails on any incorrect key (including invalid enter)
    // - Expert fails if user submits an incorrect word
    if (this.config.mode !== 'zen') {
      if (this.config.difficulty === 'master' && !result.isCorrect) {
        this.bufferRevision++;
        this.failTest(timestamp);
        return;
      }
      if (this.config.difficulty === 'expert' && result.advanced && !result.isCorrect) {
        this.bufferRevision++;
        this.failTest(timestamp);
        return;
      }
    }

    this.bufferRevision++;
    this.revision++;
    this.checkCompletion(timestamp);
    this.notify(timestamp);
  }

  private handleBackspaceInput(timestamp: number): void {
    if (this.stateMachine.getState() !== 'Running') return;

    this.totalKeystrokes++;
    const res = this.buffer.handleBackspace(this.config.backspaceThroughWords);
    this.recorder.recordKeystroke('Backspace', 'Backspace', true, timestamp);

    // If forgivingAccuracy is active, mistakes corrected before advancing with space do not reduce accuracy
    if (this.config.forgivingAccuracy && res.moved && res.deletedStatus) {
      if (res.deletedStatus === 'incorrect' || res.deletedStatus === 'extra') {
        this.characterProducingKeystrokes = Math.max(0, this.characterProducingKeystrokes - 1);
      } else if (res.deletedStatus === 'correct') {
        this.correctKeystrokes = Math.max(0, this.correctKeystrokes - 1);
        this.characterProducingKeystrokes = Math.max(0, this.characterProducingKeystrokes - 1);
      }
    }

    this.bufferRevision++;
    this.revision++;
    this.notify(timestamp);
  }

  private handleTick(timestamp: number): void {
    const state = this.stateMachine.getState();

    if (state === 'Suspended') {
      if (this.stateMachine.checkSuspendTimeout(timestamp)) {
        this.revision++;
        this.notify(timestamp);
      }
      return;
    }

    if (state !== 'Running') return;

    const activeSeconds = this.timer.getActiveElapsedSeconds(timestamp);

    // Timeline sampling per full second
    const currentSecond = Math.floor(activeSeconds);
    if (currentSecond > this.lastSampledSecond) {
      const counts = this.buffer.getCharCounts();
      const liveWpm = calculateNetWpm(counts.correct, currentSecond);
      const liveRawWpm = calculateRawWpm(this.characterProducingKeystrokes, currentSecond);
      const totalErrors = this.characterProducingKeystrokes - this.correctKeystrokes;
      const deltaErrors = Math.max(0, totalErrors - this.lastSampledErrors);
      this.recorder.recordTimelinePoint(
        currentSecond,
        liveWpm,
        liveRawWpm,
        deltaErrors
      );
      this.lastSampledErrors = totalErrors;
      // Incremental O(1) consistency: maintain running sum/sumSq
      this.consistencySum += liveRawWpm;
      this.consistencySumSq += liveRawWpm * liveRawWpm;
      this.consistencyCount++;
      if (this.consistencyCount >= 3) {
        this.cachedConsistency = calculateConsistencyIncremental(
          this.consistencySum,
          this.consistencySumSq,
          this.consistencyCount,
        );
      }
      this.lastSampledSecond = currentSecond;
    }

    // Time & timed Custom mode timeout check
    if (
      (this.config.mode === 'time' || this.config.mode === 'custom') &&
      this.config.timeLimit &&
      activeSeconds >= this.config.timeLimit
    ) {
      this.finishTest(timestamp);
      return;
    }

    // Throttle UI snapshot notifications during pure ticks to ~30fps (~33ms)
    // Non-tick events (keystrokes, spaces, backspaces) notify immediately
    if (this.lastTickNotifyMs > 0 && timestamp - this.lastTickNotifyMs < 33) {
      return;
    }
    this.lastTickNotifyMs = timestamp;

    this.revision++;
    this.notify(timestamp);
  }

  private checkCompletion(timestamp: number): void {
    if (this.config.mode === 'words' || this.config.mode === 'quote' || this.config.mode === 'tech' || this.config.mode === 'custom') {
      if (this.buffer.isAllCompleted()) {
        this.finishTest(timestamp);
      } else if (this.buffer.isLastWordFullyCorrect()) {
        this.buffer.completeLastWord();
        this.finishTest(timestamp);
      }
    }
  }

  private finishTest(timestamp: number): void {
    this.timer.suspend(timestamp);
    const transitionEvent = this.config.mode === 'zen' ? 'END_ZEN' : 'TARGET_REACHED';
    this.stateMachine.transition(transitionEvent, timestamp);
    this.stateMachine.transition('METRICS_FROZEN');
    this.revision++;
    this.notify(timestamp);
  }

  getSnapshot(nowTimestamp?: number): EngineSnapshot {
    const effectiveTimestamp =
      nowTimestamp ??
      (this.currentTimestamp > 0
        ? this.currentTimestamp
        : typeof performance !== 'undefined'
          ? performance.now()
          : Date.now());
    const elapsedMs = this.timer.getActiveElapsedMs(effectiveTimestamp);
    const elapsedSeconds = elapsedMs / 1000;
    const counts = this.buffer.getCharCounts();

    const wpm = calculateNetWpm(counts.correct, elapsedSeconds);
    const rawWpm = calculateRawWpm(this.characterProducingKeystrokes, elapsedSeconds);
    const accuracy = calculateAccuracy(this.correctKeystrokes, this.characterProducingKeystrokes);

    const consistency = this.cachedConsistency;

    const metrics: LiveMetrics = {
      wpm,
      rawWpm,
      accuracy,
      consistency,
      correctChars: counts.correct,
      incorrectChars: counts.incorrect,
      extraChars: counts.extra,
      missedChars: counts.missed,
      characterProducingKeystrokes: this.characterProducingKeystrokes,
      totalKeystrokes: this.totalKeystrokes,
    };

    let remainingTimeSeconds: number | undefined;
    if ((this.config.mode === 'time' || this.config.mode === 'custom') && this.config.timeLimit) {
      remainingTimeSeconds = Math.max(0, Math.ceil(this.config.timeLimit - elapsedSeconds));
    }

    let remainingWords: number | undefined;
    if (this.config.mode === 'words') {
      const remaining = this.buffer.getWords().length - this.buffer.getCurrentWordIndex();
      remainingWords = Math.max(0, remaining);
    }

    return {
      revision: this.revision,
      bufferRevision: this.bufferRevision,
      state: this.stateMachine.getState(),
      config: this.config,
      words: this.buffer.getWords(),
      currentWordIndex: this.buffer.getCurrentWordIndex(),
      currentCharIndex: this.buffer.getCurrentCharIndex(),
      activeElapsedMs: elapsedMs,
      remainingTimeSeconds,
      remainingWords,
      metrics,
      failedByDifficulty: this.failedByDifficulty,
    };
  }

  finalize(finalTimestamp?: number): FinalResult {
    const effectiveTimestamp =
      finalTimestamp ??
      (this.currentTimestamp > 0
        ? this.currentTimestamp
        : typeof performance !== 'undefined'
          ? performance.now()
          : Date.now());
    const snapshot = this.getSnapshot(effectiveTimestamp);
    const durationSeconds = snapshot.activeElapsedMs / 1000;

    const timeline = this.recorder.getTimeline();
    const consistency =
      snapshot.metrics.consistency ??
      (timeline.length > 0 ? calculateConsistency(timeline.map((t) => t.rawWpm)) : null);

    return {
      uuid: this.testUuid,
      config: this.config,
      wpm: snapshot.metrics.wpm,
      rawWpm: snapshot.metrics.rawWpm,
      accuracy: snapshot.metrics.accuracy,
      consistency,
      durationSeconds: Math.round(durationSeconds * 100) / 100,
      completedAt: new Date().toISOString(),
      liveMetrics: { ...snapshot.metrics, consistency },
      timeline,
      keyStats: this.recorder.getKeyStats(),
      latencyStats: this.recorder.getLatencyStats(),
      rawEvents: this.recorder.getRawEvents(),
      failedByDifficulty: this.failedByDifficulty,
    };
  }

  getWords(): WordState[] {
    return this.buffer.getWords();
  }

  subscribe(listener: (snapshot: EngineSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(timestamp?: number): void {
    if (this.listeners.size === 0) return;
    if (this.revision === this.lastNotifiedRevision) return;
    this.lastNotifiedRevision = this.revision;
    const snapshot = this.getSnapshot(timestamp);
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export function createEngine(config: EngineConfig, initialText: string = ''): TypingEngine {
  return new TypingEngine(config, initialText);
}
