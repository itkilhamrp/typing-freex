import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalyticsStore } from './analytics.store.svelte';
import { resultApi } from '@/core/ipc';
import { resetMockStore } from '@/core/ipc/client';

describe('analytics.store (Svelte 5 Runes)', () => {
  beforeEach(() => {
    resetMockStore();
    const store = useAnalyticsStore();
    store.resetAnalyticsState();
  });

  it('initializes with default empty state', () => {
    const store = useAnalyticsStore();
    expect(store.summary).toBeNull();
    expect(store.series).toEqual([]);
    expect(store.timeRange).toBe('all');
    expect(store.selectedMode).toBe('all');
  });

  it('fetches analytics summary, series, and daily activity', async () => {
    const store = useAnalyticsStore();
    await store.fetchAll();

    expect(store.summary).toBeDefined();
    expect(store.series).toBeDefined();
    expect(store.heatmap).toBeDefined();
    expect(store.personalBests).toBeDefined();
    expect(store.dailyActivity).toBeDefined();
  });

  it('updates timeRange and mode correctly', async () => {
    const store = useAnalyticsStore();
    await store.setTimeRange('week');
    expect(store.timeRange).toBe('week');

    await store.setSelectedMode('words');
    expect(store.selectedMode).toBe('words');
  });

  it('aggregates dailyActivity upon test result save and fetchAll', async () => {
    const store = useAnalyticsStore();
    // Save a mock result first
    await resultApi.save({
      uuid: 'test-act-uuid',
      mode: 'time',
      mode_variant: '15',
      language: 'en',
      wpm: 70,
      raw_wpm: 75,
      accuracy: 98,
      duration_seconds: 15,
      character_count: 80,
      keystroke_count: 85,
      correct_keystrokes: 80,
      error_keystrokes: 2,
      completed_at: new Date().toISOString(),
      is_completed: true,
      payload_json: '{}',
    });

    await store.fetchAll();

    expect(store.dailyActivity.length).toBeGreaterThan(0);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayAct = store.dailyActivity.find((a) => a.date === todayStr);
    expect(todayAct).toBeDefined();
    expect(todayAct?.tests_completed).toBeGreaterThanOrEqual(1);
  });
});
