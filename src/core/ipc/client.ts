import { invoke } from '@tauri-apps/api/core';
import type {
  BackupExportResult,
  CustomTextDetail,
  CustomTextSummary,
  DailyActivity,
  ExportFileResult,
  ImportPickSummary,
  IntegrityCheckReport,
  KeyHeatmapEntry,
  LanguageInfo,
  PersonalBest,
  ProfileDto,
  QuoteItem,
  ResultSummaryDto,
  RevisionDiffResult,
  SaveResultResponse,
  StatPoint,
  StatsSummary,
  TestResultDto,
  TextImportPickResult,
  TextRevision,
  AchievementDto,
  AchievementSeedDto,
  AchievementUpdateDto,
  AdvancementDto,
  AdvancementSeedDto,
  AdvancementUpdateDto,
  TrackingStateEntry,
  TrackingStateUpdateDto,
  TrophyShowcaseDto,
} from './contracts';
import { handleMockIpc } from './mock';

export { resetMockStore } from './mock';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class IpcError extends Error {
  readonly code: string;

  constructor(message: string, code = 'IPC_ERROR') {
    super(message);
    this.name = 'IpcError';
    this.code = code;
    Object.setPrototypeOf(this, IpcError.prototype);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function extractMessage(obj: Record<string, unknown>): string | null {
  return typeof obj.message === 'string' && obj.message.trim().length > 0 ? obj.message : null;
}

export function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isRecord(err)) {
    const message = extractMessage(err);
    if (message) return message;
    if (typeof err.code === 'string') return `${err.code}: ${safeStringify(err)}`;
  }
  return String(err);
}

export function normalizeIpcError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (isRecord(err)) {
    const code = typeof err.code === 'string' ? err.code : 'IPC_ERROR';
    return new IpcError(extractMessage(err) ?? safeStringify(err), code);
  }
  return new IpcError(String(err));
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

type IpcArgs = Record<string, unknown>;

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

const toSnakeCase = (key: string): string => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/**
 * Sends every argument under both its camelCase and snake_case key, so the
 * call works regardless of the Rust command's `rename_all` setting.
 */
function dual(args: IpcArgs): IpcArgs {
  const out: IpcArgs = {};
  for (const [key, value] of Object.entries(args)) {
    out[key] = value;
    const snake = toSnakeCase(key);
    if (snake !== key) out[snake] = value;
  }
  return out;
}

export async function ipcInvoke<T>(command: string, args?: IpcArgs): Promise<T> {
  if (!isTauriEnvironment()) {
    // Browser fallback for unit testing / development
    return handleMockIpc<T>(command, args);
  }

  try {
    return await invoke<T>(command, args);
  } catch (err: unknown) {
    const normalized = normalizeIpcError(err);
    console.error(`[IPC Error] ${command}:`, normalized.message, err);
    throw normalized;
  }
}

// ---------------------------------------------------------------------------
// Typed API modules
// ---------------------------------------------------------------------------

export const profileApi = {
  list: () => ipcInvoke<ProfileDto[]>('profile_list'),
  getActive: () => ipcInvoke<ProfileDto | null>('profile_get_active'),
  create: (name: string) => ipcInvoke<ProfileDto>('profile_create', { name }),
  rename: (uuid: string, newName: string) => ipcInvoke<void>('profile_rename', { uuid, newName }),
  delete: (uuid: string) => ipcInvoke<void>('profile_delete', { uuid }),
  switch: (uuid: string) => ipcInvoke<ProfileDto>('profile_switch', { uuid }),
};

export const resultApi = {
  save: (result: TestResultDto) => ipcInvoke<SaveResultResponse>('result_save', { result }),
  list: (limit?: number, offset?: number, mode?: string) =>
    ipcInvoke<ResultSummaryDto[]>('result_list', { limit, offset, mode }),
  get: (uuid: string) => ipcInvoke<TestResultDto | null>('result_get', { uuid }),
  delete: (uuids: string[]) => ipcInvoke<void>('result_delete', { uuids }),
};

export const statsApi = {
  summary: (range?: string, mode?: string) =>
    ipcInvoke<StatsSummary>('stats_summary', { range, mode }),
  series: (limit?: number, bucket?: string, mode?: string) =>
    ipcInvoke<StatPoint[]>('stats_series', { limit, bucket, mode }),
  keyHeatmap: () => ipcInvoke<KeyHeatmapEntry[]>('stats_key_heatmap'),
  personalBests: (mode?: string) => ipcInvoke<PersonalBest[]>('stats_personal_bests', { mode }),
  dailyActivity: () => ipcInvoke<DailyActivity[]>('stats_daily_activity'),
};

export const backupApi = {
  export: (destinationPath?: string) =>
    ipcInvoke<BackupExportResult>('db_backup_export', dual({ destinationPath })),
  importPick: (filePath: string) =>
    ipcInvoke<ImportPickSummary>('db_import_pick', dual({ filePath })),
  importCommit: (stagingToken: string, displayName?: string) =>
    ipcInvoke<ProfileDto>('db_import_commit', dual({ stagingToken, displayName })),
  integrityCheck: () => ipcInvoke<IntegrityCheckReport>('db_integrity_check'),
};

export const customTextApi = {
  list: (query?: string, sort?: string, limit?: number, offset?: number) =>
    ipcInvoke<CustomTextSummary[]>('custom_text_list', { query, sort, limit, offset }),
  get: (id: string) => ipcInvoke<CustomTextDetail | null>('custom_text_get', { id }),
  create: (title: string, body: string, language?: string, source?: string) =>
    ipcInvoke<CustomTextDetail>('custom_text_create', { title, body, language, source }),
  update: (id: string, title: string, body: string, baseRevision: number) =>
    ipcInvoke<CustomTextDetail>('custom_text_update', dual({ id, title, body, baseRevision })),
  delete: (id: string) => ipcInvoke<void>('custom_text_delete', { id }),
  duplicate: (id: string) => ipcInvoke<CustomTextDetail>('custom_text_duplicate', { id }),
  revisions: (id: string) => ipcInvoke<TextRevision[]>('custom_text_revisions', { id }),
  revisionDiff: (id: string, targetRevision: number, baseRevision?: number) =>
    ipcInvoke<RevisionDiffResult>(
      'custom_text_revision_diff',
      dual({ id, targetRevision, baseRevision: baseRevision ?? null }),
    ),
  restore: (id: string, revisionNumber: number) =>
    ipcInvoke<CustomTextDetail>('custom_text_restore', dual({ id, revisionNumber })),
  markUsed: (id: string) => ipcInvoke<void>('custom_text_mark_used', { id }),
  importPick: (filePath: string) =>
    ipcInvoke<TextImportPickResult | null>('custom_text_import_pick', dual({ filePath })),
  importReencode: (stagingId: string, encoding: string) =>
    ipcInvoke<TextImportPickResult>('custom_text_import_reencode', dual({ stagingId, encoding })),
  importCommit: (stagingId: string, title?: string, language?: string, splitStrategy?: string) =>
    ipcInvoke<CustomTextDetail[]>(
      'custom_text_import_commit',
      dual({ stagingId, title, language, splitStrategy }),
    ),
  importCancel: (stagingId: string) =>
    ipcInvoke<void>('custom_text_import_cancel', dual({ stagingId })),
  export: (id: string) => ipcInvoke<string>('custom_text_export', { id }),
  exportToFile: (id: string, destinationPath: string) =>
    ipcInvoke<ExportFileResult>('custom_text_export_to_file', dual({ id, destinationPath })),
};

export const settingsApi = {
  get: (keys: string[]) => ipcInvoke<Record<string, string>>('settings_get', { keys }),
  set: (entries: Record<string, string>) => ipcInvoke<void>('settings_set', { entries }),
};

export const contentApi = {
  listLanguages: () => ipcInvoke<LanguageInfo[]>('content_list_languages'),
  getWordlist: (language: string, tier?: string) =>
    ipcInvoke<string[]>('content_get_wordlist', { language, tier }),
  getQuotes: (language: string, length?: string) =>
    ipcInvoke<QuoteItem[]>('content_get_quotes', { language, length }),
};

export const achievementApi = {
  list: () => ipcInvoke<AchievementDto[]>('achievement_list'),
  batchUpsert: (updates: AchievementUpdateDto[]) =>
    ipcInvoke<void>('achievement_batch_upsert', { updates }),
  seed: (definitions: AchievementSeedDto[]) =>
    ipcInvoke<void>('achievement_seed', { definitions }),
  showcaseGet: () => trophyShowcaseApi.get(),
  showcaseSet: (slot: number, itemId: string | null, itemType?: 'achievement' | 'advancement' | null) =>
    trophyShowcaseApi.set(slot, itemId, itemType ?? null),
};

export const advancementApi = {
  list: () => ipcInvoke<AdvancementDto[]>('advancement_list'),
  batchUpsert: (updates: AdvancementUpdateDto[]) =>
    ipcInvoke<void>('advancement_batch_upsert', { updates }),
  seed: (definitions: AdvancementSeedDto[]) =>
    ipcInvoke<void>('advancement_seed', { definitions }),
};

export const trackingStateApi = {
  load: () => ipcInvoke<TrackingStateEntry[]>('tracking_state_load'),
  save: (entries: TrackingStateUpdateDto[]) =>
    ipcInvoke<void>('tracking_state_save', { entries }),
};

export const trophyShowcaseApi = {
  get: () => ipcInvoke<TrophyShowcaseDto[]>('trophy_showcase_get'),
  set: (slot: number, itemId: string | null, itemType: 'achievement' | 'advancement' | null) =>
    ipcInvoke<void>('trophy_showcase_set', dual({ slot, itemId, itemType })),
};

