/**
 * Native Audio Backend Probe (UNIX Pipeline Stage 4b).
 *
 * Checks whether the Tauri native Rust CPAL audio engine is running and healthy.
 * Pure mechanism layer with dependency injection for deterministic unit testing.
 */

import { invoke } from '@tauri-apps/api/core';

export interface AudioStatusDto {
  readonly healthy: boolean;
  readonly sample_rate: number;
  readonly loaded_samples: number;
}

export type InvokeFn = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

export async function probeNativeAudio(
  invokeFn: InvokeFn = invoke as InvokeFn,
  timeoutMs = 800
): Promise<boolean> {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
    return false;
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });

  const checkPromise = (async (): Promise<boolean> => {
    try {
      const status = (await invokeFn('audio_status')) as AudioStatusDto | undefined;
      return Boolean(status && status.healthy === true);
    } catch {
      return false;
    }
  })();

  const result = await Promise.race([checkPromise, timeoutPromise]);
  if (timer) clearTimeout(timer);
  return result;
}

