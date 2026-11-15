export interface ProfileDto {
  uuid: string;
  name: string;
  slug: string;
  created_at: string;
  last_active_at: string;
  is_active: boolean;
}

export interface TestResultDto {
  uuid: string;
  mode: string;
  mode_variant: string;
  language: string;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  consistency?: number | null;
  duration_seconds: number;
  character_count: number;
  keystroke_count: number;
  correct_keystrokes: number;
  error_keystrokes: number;
  completed_at: string;
  is_completed: boolean;
  payload_json: string;
}

export interface SaveResultResponse {
  id: number;
  uuid: string;
  is_personal_best: boolean;
}

export interface ResultSummaryDto {
  id: number;
  uuid: string;
  mode: string;
  mode_variant: string;
  language: string;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  consistency?: number | null;
  duration_seconds: number;
  completed_at: string;
  difficulty?: string | null;
}

export interface LanguageInfo {
  code: string;
  name: string;
  wordlist_available: boolean;
  quotes_available: boolean;
}

export interface QuoteItem {
  id: string;
  text: string;
  source: string;
  length?: number;
}

export interface StatsSummary {
  total_tests: number;
  total_time_seconds: number;
  avg_wpm: number;
  highest_wpm: number;
  avg_accuracy: number;
  avg_consistency: number | null;
  total_words: number;
}

export interface StatPoint {
  timestamp: string;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  consistency: number | null;
  cpm: number;
  raw_cpm: number;
}

export interface KeyHeatmapEntry {
  key: string;
  total_presses: number;
  errors: number;
  error_rate: number;
  avg_latency_ms: number;
}

export interface PersonalBest {
  mode: string;
  mode_variant: string;
  language: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  achieved_at: string;
  result_uuid?: string | null;
  difficulty?: string | null;
}

export interface DailyActivity {
  date: string;
  tests_completed: number;
  time_spent_seconds: number;
  words_typed: number;
  best_wpm: number;
  avg_wpm: number;
}

export interface BackupExportResult {
  success: boolean;
  file_name: string;
  destination_path?: string;
  file_size: number;
  sha256_hash: string;
  sidecar_created: boolean;
}

export interface ImportPickSummary {
  staging_token: string;
  original_filename: string;
  profile_name: string;
  test_count: number;
  custom_text_count: number;
  date_range?: string | null;
  sha256_hash: string;
  warnings: string[];
}

export interface IntegrityCheckReport {
  ok: boolean;
  errors: string[];
}

export interface CustomTextSummary {
  id: string;
  title: string;
  word_count: number;
  char_count: number;
  language: string;
  source?: string | null;
  created_at: string;
  updated_at: string;
  revision: number;
}

export interface CustomTextDetail {
  id: string;
  title: string;
  body: string;
  word_count: number;
  char_count: number;
  language: string;
  source?: string | null;
  created_at: string;
  updated_at: string;
  revision: number;
}

export interface TextRevision {
  revision_number: number;
  created_at: string;
  word_count: number;
  char_count?: number;
  preview: string;
  additions?: number;
  deletions?: number;
}

export interface DiffLineDto {
  tag: 'equal' | 'insert' | 'delete';
  old_line_num: number | null;
  new_line_num: number | null;
  text: string;
}

export interface RevisionDiffResult {
  target_revision: number;
  base_revision: number;
  additions: number;
  deletions: number;
  equal: number;
  lines: DiffLineDto[];
  raw_diff: string;
}

export interface TextImportPickResult {
  staging_id: string;
  filename: string;
  detected_encoding: string;
  preview_text: string;
  total_chars: number;
  total_words: number;
  issues: string[];
}

export interface ExportFileResult {
  success: boolean;
  path: string;
}

export interface AchievementDto {
  achievement_id: string;
  category: string;
  current_value: number;
  target_value: number;
  tier: number;
  unlocked: boolean;
  unlocked_at: string | null;
  updated_at: string;
}

export interface AchievementUpdateDto {
  achievement_id: string;
  current_value: number;
  target_value: number;
  tier: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface AchievementSeedDto {
  achievement_id: string;
  category: string;
  target_value: number;
  tier: number;
}

export interface AdvancementDto {
  advancement_id: string;
  category: string;
  rank: number;
  unlocked: boolean;
  unlocked_at: string | null;
  updated_at: string;
}

export interface AdvancementUpdateDto {
  advancement_id: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface AdvancementSeedDto {
  advancement_id: string;
  category: string;
  rank: number;
}

export interface TrackingStateEntry {
  key: string;
  value: number;
  updated_at: string;
}

export interface TrackingStateUpdateDto {
  key: string;
  value: number;
}

export interface TrophyShowcaseDto {
  slot: number;
  item_id: string | null;
  item_type: 'achievement' | 'advancement' | null;
  pinned_at: string | null;
}

export interface AudioStatusDto {
  healthy: boolean;
  sample_rate: number;
  loaded_samples: number;
}

// Backward compatibility alias during migration
export type AchievementProgressDto = AchievementDto;

