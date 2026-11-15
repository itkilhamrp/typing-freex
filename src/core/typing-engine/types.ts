/**
 * Core Headless Typing Engine Types (§5.3, §5.4, §5.6)
 * Strict zero-DOM, zero-framework definitions.
 */

export type EngineState =
  | 'Idle'
  | 'Preparing'
  | 'Ready'
  | 'Running'
  | 'Suspended'
  | 'Finishing'
  | 'Finished'
  | 'Saving'
  | 'Result'
  | 'Aborted';

export type TypingMode = 'time' | 'words' | 'quote' | 'tech' | 'zen' | 'custom';
export type Difficulty = 'normal' | 'expert' | 'master';
export type SpeedUnit = 'wpm' | 'cpm';
export type StopOnErrorMode = 'off' | 'word' | 'letter';
export type CharStatus = 'untyped' | 'correct' | 'incorrect' | 'extra' | 'missed';
export type QuoteLengthFilter = 'all' | 'short' | 'medium' | 'long' | 'thicc';

export interface CharState {
  char: string;
  status: CharStatus;
  typedChar?: string;
  timestamp?: number;
}

export interface WordState {
  target: string;
  chars: CharState[];
  extraChars: CharState[];
  isCompleted: boolean;
  hasError: boolean;
}

export interface EngineConfig {
  mode: TypingMode;
  difficulty?: Difficulty;
  timeLimit?: number; // seconds, for 'time' mode
  wordLimit?: number; // count, for 'words' mode
  quoteId?: string;
  quoteLengthFilter?: QuoteLengthFilter;
  customText?: string;
  language?: string;
  punctuation?: boolean;
  numbers?: boolean;
  strictSpace?: boolean;
  stopOnError?: StopOnErrorMode;
  backspaceThroughWords?: boolean;
  forgivingAccuracy?: boolean;
  speedUnit?: SpeedUnit;
  seed?: number;
  suspendTimeoutMs?: number; // default 10,000ms
}

export type EngineEvent =
  | { type: 'LOAD_TEST'; config: EngineConfig; targetText: string }
  | { type: 'TEXT_READY' }
  | {
      type: 'KEY_DOWN';
      code: string;
      key: string;
      timestamp: number;
      repeat?: boolean | undefined;
      shiftKey?: boolean | undefined;
      ctrlKey?: boolean | undefined;
      altKey?: boolean | undefined;
      metaKey?: boolean | undefined;
      altGraphKey?: boolean | undefined;
      isComposing?: boolean | undefined;
    }
  | { type: 'CHARACTER_INPUT'; char: string; timestamp: number }
  | { type: 'BACKSPACE'; timestamp: number }
  | { type: 'SPACE'; timestamp: number }
  | { type: 'ENTER'; timestamp: number }
  | { type: 'TICK'; timestamp: number }
  | { type: 'FOCUS_LOST'; timestamp: number; behavior?: 'suspend' | 'abort' }
  | { type: 'FOCUS_GAINED'; timestamp: number }
  | { type: 'PAUSE'; timestamp: number }
  | { type: 'RESUME'; timestamp: number }
  | { type: 'RESTART'; timestamp: number }
  | { type: 'ABORT'; timestamp: number }
  | { type: 'END_ZEN'; timestamp: number };

export interface LiveMetrics {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number | null;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  characterProducingKeystrokes: number;
  totalKeystrokes: number;
}

export interface EngineSnapshot {
  revision: number;
  bufferRevision?: number;
  state: EngineState;
  config: EngineConfig;
  words: WordState[];
  currentWordIndex: number;
  currentCharIndex: number;
  activeElapsedMs: number;
  remainingTimeSeconds?: number | undefined;
  remainingWords?: number | undefined;
  metrics: LiveMetrics;
  failedByDifficulty?: boolean;
}

export interface TimelinePoint {
  second: number;
  wpm: number;
  rawWpm: number;
  errors: number;
}

export interface KeyStat {
  key: string;
  total: number;
  correct: number;
  errors: number;
  totalLatencyMs: number;
}

export interface LatencyStats {
  meanMs: number;
  medianMs: number;
  p95Ms: number;
  pausesCount: number; // intervals > 2000ms
}

export interface RawKeyEventRecord {
  deltaMs: number; // delta from previous keypress (u16)
  key: string;
  code: string;
  isCorrect: boolean;
}

export interface FinalResult {
  uuid: string;
  config: EngineConfig;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number | null;
  durationSeconds: number;
  completedAt: string;
  liveMetrics: LiveMetrics;
  timeline: TimelinePoint[];
  keyStats: Record<string, KeyStat>;
  latencyStats: LatencyStats;
  rawEvents: RawKeyEventRecord[];
  failedByDifficulty?: boolean;
}
