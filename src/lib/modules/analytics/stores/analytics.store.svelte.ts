import {
  statsApi,
  type StatsSummary,
  type StatPoint,
  type KeyHeatmapEntry,
  type PersonalBest,
  type DailyActivity,
} from '@/core/ipc';

type TimeRange = 'all' | 'today' | 'week' | 'month';
type ModeFilter = 'all' | 'time' | 'words' | 'quote' | 'tech';
type Part = 'summary' | 'series' | 'heatmap' | 'bests' | 'activity';

const ALL: readonly Part[] = ['summary', 'series', 'heatmap', 'bests', 'activity'];

class AnalyticsStore {
  // Large payloads are replaced wholesale, never mutated: $state.raw = zero proxy cost.
  summary = $state.raw<StatsSummary | null>(null);
  series = $state.raw<StatPoint[]>([]);
  heatmap = $state.raw<KeyHeatmapEntry[]>([]);
  personalBests = $state.raw<PersonalBest[]>([]);
  dailyActivity = $state.raw<DailyActivity[]>([]);

  timeRange = $state<TimeRange>('all');
  selectedMode = $state<ModeFilter>('all');
  isLoading = $state(false);
  error = $state<string | null>(null);

  // Per-part request counters: a slow, outdated response can never overwrite a newer one.
  #seq: Record<Part, number> = { summary: 0, series: 0, heatmap: 0, bests: 0, activity: 0 };
  #inflight = 0;

  #apply<T>(part: Part, req: Promise<T>, commit: (v: T) => void) {
    const id = ++this.#seq[part];
    return req.then((v) => {
      if (id === this.#seq[part]) commit(v);
    });
  }

  /** Fetches only the requested parts, in parallel; each one renders as soon as it lands. */
  #load = async (parts: readonly Part[]) => {
    const mode = this.selectedMode === 'all' ? undefined : this.selectedMode;
    const range = this.timeRange === 'all' ? undefined : this.timeRange;

    const jobs: Record<Part, () => Promise<void>> = {
      summary: () => this.#apply('summary', statsApi.summary(range, mode), (v) => (this.summary = v)),
      series: () => this.#apply('series', statsApi.series(100, undefined, mode), (v) => (this.series = v)),
      heatmap: () => this.#apply('heatmap', statsApi.keyHeatmap(), (v) => (this.heatmap = v)),
      bests: () => this.#apply('bests', statsApi.personalBests(mode), (v) => (this.personalBests = v)),
      activity: () => this.#apply('activity', statsApi.dailyActivity(), (v) => (this.dailyActivity = v)),
    };

    this.#inflight++;
    this.isLoading = true;
    this.error = null;
    try {
      await Promise.all(parts.map((p) => jobs[p]()));
    } catch (err: unknown) {
      console.error('Failed to load analytics data:', err);
      this.error = err instanceof Error ? err.message : String(err);
    } finally {
      if (--this.#inflight === 0) this.isLoading = false;
    }
  };

  // Actions are arrow fields: safe to destructure or pass as event handlers.
  fetchAll = () => this.#load(ALL);

  // Time range only affects the summary; the other datasets are range-independent.
  setTimeRange = async (range: TimeRange) => {
    if (range === this.timeRange && !this.error) return;
    this.timeRange = range;
    await this.#load(['summary']);
  };

  // The key heatmap and activity graph are not filtered by mode, so only summary, series, and bests refetched.
  setSelectedMode = async (mode: ModeFilter) => {
    if (mode === this.selectedMode && !this.error) return;
    this.selectedMode = mode;
    await this.#load(['summary', 'series', 'bests']);
  };

  resetAnalyticsState = () => {
    for (const p of ALL) this.#seq[p]++; // invalidate in-flight requests
    this.#inflight = 0;
    this.summary = null;
    this.series = [];
    this.heatmap = [];
    this.personalBests = [];
    this.dailyActivity = [];
    this.timeRange = 'all';
    this.selectedMode = 'all';
    this.isLoading = false;
    this.error = null;
  };
}

export const analyticsStore = new AnalyticsStore();

export const useAnalyticsStore = () => analyticsStore;

export const {
  fetchAll,
  setTimeRange,
  setSelectedMode,
  resetAnalyticsState,
} = analyticsStore;