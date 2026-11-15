/**
 * Headless Replay Tool for OTTE (§5.4, AC-02, Task M1.5.1)
 * Replays keystroke and clock events against the headless typing engine,
 * verifying deterministic metric calculation.
 *
 * Usage:
 *   tsx scripts/tool-replay.ts <trace.json>
 *   cat trace.json | tsx scripts/tool-replay.ts
 *   cat trace.json | pnpm tool:replay | jq .wpm
 */

import fs from 'node:fs';
import { TypingEngine, type EngineConfig, type EngineEvent } from '../src/core/typing-engine';

export interface TraceFile {
  version: number;
  test_uuid?: string;
  description?: string;
  config: EngineConfig;
  targetText: string;
  events: EngineEvent[];
  expected?: {
    wpm?: number;
    rawWpm?: number;
    accuracy?: number;
    consistency?: number | null;
    durationSeconds?: number;
    correctChars?: number;
    incorrectChars?: number;
    extraChars?: number;
  };
}

export function replayTrace(trace: TraceFile) {
  const engine = new TypingEngine(trace.config, trace.targetText);

  let lastTimestamp = 0;
  for (const event of trace.events) {
    engine.dispatch(event);
    if ('timestamp' in event && typeof event.timestamp === 'number') {
      lastTimestamp = Math.max(lastTimestamp, event.timestamp);
    }
  }

  return engine.finalize(lastTimestamp);
}

async function readInput(): Promise<string> {
  const argPath = process.argv[2];
  if (argPath && argPath !== '-') {
    if (!fs.existsSync(argPath)) {
      console.error(`Error: File not found: ${argPath}`);
      process.exit(1);
    }
    return fs.readFileSync(argPath, 'utf-8');
  }

  // Read from standard input
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    process.stdin.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    const rawInput = await readInput();
    if (!rawInput.trim()) {
      console.error('Usage: tsx scripts/tool-replay.ts <path-to-trace.json> or pipe via stdin');
      process.exit(1);
    }

    const trace = JSON.parse(rawInput) as TraceFile;
    if (!trace.targetText && (!trace.config || !trace.config.mode)) {
      console.error('Error: Invalid trace file: missing targetText or config');
      process.exit(1);
    }

    const result = replayTrace(trace);
    // Output strictly JSON to stdout for piping (Unix philosophy)
    console.log(JSON.stringify(result, null, 2));
  } catch (err: unknown) {
    console.error('Replay failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
