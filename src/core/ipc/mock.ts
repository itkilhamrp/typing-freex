import type {
    CustomTextDetail,
    CustomTextSummary,
    DailyActivity,
    ExportFileResult,
    ImportPickSummary,
    IntegrityCheckReport,
    KeyHeatmapEntry,
    PersonalBest,
    ProfileDto,
    ResultSummaryDto,
    RevisionDiffResult,
    SaveResultResponse,
    StatPoint,
    StatsSummary,
    TestResultDto,
    TextRevision,
    BackupExportResult,
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

/**
 * In-memory IPC mock used when the app runs outside Tauri
 * (browser development & vitest).
 */

type Args = Record<string, unknown> | undefined;
type Handler = (args: Args) => unknown;

interface MockStore {
    profiles: ProfileDto[];
    results: TestResultDto[];
    customTexts: CustomTextDetail[];
    settings: Record<string, string>;
    achievements: Map<string, AchievementDto>;
    advancements: Map<string, AdvancementDto>;
    trackingState: Map<string, TrackingStateEntry>;
    trophyShowcase: Map<number, TrophyShowcaseDto>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const nowIso = (): string => new Date().toISOString();

const uid = (prefix: string): string =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const round1 = (n: number): number => Math.round(n * 10) / 10;

const countWords = (text: string): number => text.split(/\s+/).filter(Boolean).length;

const clone = <T>(value: T): T =>
    typeof structuredClone === 'function' ? structuredClone(value) : value;

/** Reads an arg that may be passed as camelCase or snake_case. */
function readArg<T>(args: Args, camel: string, snake: string, fallback: T): T {
    return (args?.[camel] ?? args?.[snake] ?? fallback) as T;
}

function slugify(name: string): string {
    return (
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'profile'
    );
}

function uniqueSlug(profiles: readonly ProfileDto[], name: string): string {
    const base = slugify(name);
    const taken = new Set(profiles.map((p) => p.slug));
    let slug = base;
    for (let n = 2; taken.has(slug); n++) {
        slug = `${base}-${n}`;
    }
    return slug;
}

function createProfile(profiles: readonly ProfileDto[], uuid: string, name: string): ProfileDto {
    const ts = nowIso();
    return {
        uuid,
        name,
        slug: uniqueSlug(profiles, name),
        created_at: ts,
        last_active_at: ts,
        is_active: false,
    };
}

function createInitialStore(): MockStore {
    const ts = nowIso();
    return {
        profiles: [
            {
                uuid: 'mock-profile-default',
                name: 'Default',
                slug: 'default',
                created_at: ts,
                last_active_at: ts,
                is_active: true,
            },
        ],
        results: [],
        customTexts: [
            {
                id: 'mock-text-1',
                title: 'The Quick Brown Fox',
                body: 'The quick brown fox jumps over the lazy dog.',
                word_count: 9,
                char_count: 44,
                language: 'en',
                source: 'Default Library',
                created_at: ts,
                updated_at: ts,
                revision: 1,
            },
        ],
        settings: {
            'app.first_run_done': 'true',
            'ui.theme': 'dark',
            'ui.locale': 'en',
            'test.speed_unit': 'wpm',
            'ui.hand_guide.enabled': 'true',
            'history.filter.enabled': 'false',
            'history.filter.min_speed': '0',
            'history.filter.min_accuracy': '0',
        },
        achievements: new Map(),
        advancements: new Map(),
        trackingState: new Map(),
        trophyShowcase: new Map(
            [1, 2, 3, 4, 5, 6, 7].map((s) => [s, { slot: s, item_id: null, item_type: null, pinned_at: null }])
        ),
    };
}

let store: MockStore = createInitialStore();

export function resetMockStore(): void {
    store = createInitialStore();
}

function requireText(id: unknown): CustomTextDetail {
    const found = store.customTexts.find((t) => t.id === id);
    if (!found) throw new Error('Text not found');
    return found;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

const handlers: Record<string, Handler> = {
    // Profile
    profile_list: () => store.profiles,

    profile_get_active: () => store.profiles.find((p) => p.is_active) ?? store.profiles[0] ?? null,

    profile_create: (args) => {
        const profile = createProfile(store.profiles, uid('mock'), (args?.name as string) || 'New Profile');
        store.profiles.push(profile);
        return profile;
    },

    profile_switch: (args) => {
        const uuid = args?.uuid;
        store.profiles.forEach((p) => {
            p.is_active = p.uuid === uuid;
        });
        return store.profiles.find((p) => p.uuid === uuid);
    },

    profile_rename: (args) => {
        const profile = store.profiles.find((p) => p.uuid === args?.uuid);
        if (profile) profile.name = args?.newName as string;
    },

    profile_delete: (args) => {
        store.profiles = store.profiles.filter((p) => p.uuid !== args?.uuid);
    },

    // Results
    result_save: (args) => {
        const result = args?.result as TestResultDto;
        if (!result.is_completed || result.mode === 'zen') {
            return {
                id: 0,
                uuid: result.uuid,
                is_personal_best: false,
            };
        }
        store.results.unshift(result);
        const response: SaveResultResponse = {
            id: store.results.length,
            uuid: result.uuid,
            is_personal_best: true,
        };
        return response;
    },

    result_list: (args) => {
        const mode = args?.mode as string | undefined;
        const offset = (args?.offset as number | undefined) ?? 0;
        const limit = args?.limit as number | undefined;

        const summaries: ResultSummaryDto[] = store.results
            .filter((r) => r.is_completed !== false && r.mode !== 'zen')
            .map((r, i) => ({
                id: i + 1,
                uuid: r.uuid,
                mode: r.mode,
                mode_variant: r.mode_variant,
                language: r.language,
                wpm: r.wpm,
                raw_wpm: r.raw_wpm,
                accuracy: r.accuracy,
                consistency: r.consistency ?? null,
                duration_seconds: r.duration_seconds,
                completed_at: r.completed_at,
            }))
            .filter((r) => !mode || r.mode === mode);

        return summaries.slice(offset, limit === undefined ? undefined : offset + limit);
    },

    result_get: (args) => store.results.find((r) => r.uuid === args?.uuid) ?? null,

    result_delete: (args) => {
        const uuids = new Set((args?.uuids as string[] | undefined) ?? []);
        store.results = store.results.filter((r) => !uuids.has(r.uuid));
    },

    // Stats
    stats_summary: () => {
        const validResults = store.results.filter(
            (r) => r.is_completed !== false && r.mode !== 'zen' && r.mode !== 'custom'
        );
        const total = validResults.length;
        if (total === 0) {
            const empty: StatsSummary = {
                total_tests: 0,
                total_time_seconds: 0,
                avg_wpm: 0,
                highest_wpm: 0,
                avg_accuracy: 0,
                avg_consistency: null,
                total_words: 0,
            };
            return empty;
        }

        let time = 0;
        let wpm = 0;
        let accuracy = 0;
        let words = 0;
        let highest = -Infinity;
        for (const r of validResults) {
            time += r.duration_seconds;
            wpm += r.wpm;
            accuracy += r.accuracy;
            words += Math.floor(r.character_count / 5);
            if (r.wpm > highest) highest = r.wpm;
        }

        const summary: StatsSummary = {
            total_tests: total,
            total_time_seconds: round1(time),
            avg_wpm: round1(wpm / total),
            highest_wpm: round1(highest),
            avg_accuracy: round1(accuracy / total),
            avg_consistency: 90,
            total_words: words,
        };
        return summary;
    },

    stats_series: () => {
        const points: StatPoint[] = store.results
            .filter((r) => r.is_completed !== false && r.mode !== 'zen' && r.mode !== 'custom')
            .map((r) => ({
                timestamp: r.completed_at,
                wpm: r.wpm,
                raw_wpm: r.raw_wpm,
                accuracy: r.accuracy,
                consistency: r.consistency ?? null,
                cpm: r.wpm * 5,
                raw_cpm: r.raw_wpm * 5,
            }));
        return points;
    },

    stats_key_heatmap: () => {
        const sample: KeyHeatmapEntry[] = [
            { key: 'e', total_presses: 120, errors: 4, error_rate: 3.3, avg_latency_ms: 125 },
            { key: 't', total_presses: 95, errors: 2, error_rate: 2.1, avg_latency_ms: 130 },
            { key: 'a', total_presses: 80, errors: 5, error_rate: 6.2, avg_latency_ms: 145 },
        ];
        return sample;
    },

    stats_personal_bests: () => {
        const pbs: PersonalBest[] = [
            {
                mode: 'time',
                mode_variant: '15',
                language: 'en',
                wpm: 85,
                cpm: 425,
                accuracy: 98,
                achieved_at: nowIso(),
                result_uuid: 'mock-pb-1',
            },
        ];
        return pbs;
    },

    stats_daily_activity: () => {
        const byDate = new Map<
            string,
            { tests: number; time: number; words: number; bestWpm: number; sumWpm: number }
        >();
        for (const r of store.results) {
            if (r.mode === 'zen' || r.mode === 'custom' || r.is_completed === false) continue;
            const date = r.completed_at.slice(0, 10);
            const entry = byDate.get(date) ?? {
                tests: 0,
                time: 0,
                words: 0,
                bestWpm: 0,
                sumWpm: 0,
            };
            entry.tests += 1;
            entry.time += r.duration_seconds;
            entry.words += Math.floor(r.character_count / 5);
            if (r.wpm > entry.bestWpm) entry.bestWpm = r.wpm;
            entry.sumWpm += r.wpm;
            byDate.set(date, entry);
        }

        const list: DailyActivity[] = [];
        for (const [date, data] of byDate.entries()) {
            list.push({
                date,
                tests_completed: data.tests,
                time_spent_seconds: round1(data.time),
                words_typed: data.words,
                best_wpm: round1(data.bestWpm),
                avg_wpm: round1(data.sumWpm / data.tests),
            });
        }
        list.sort((a, b) => a.date.localeCompare(b.date));
        return list;
    },

    // Database & Backup
    db_backup_export: (args) => {
        const destinationPath = args?.destinationPath as string | undefined;
        const fileName = destinationPath
            ? destinationPath.split(/[\\/]/).pop() || 'backup.db'
            : `typing_freex_backup_mock_${Date.now()}.db`;
        const result: BackupExportResult = {
            success: true,
            file_name: fileName,
            destination_path: destinationPath || `/mock/storage/${fileName}`,
            file_size: 10240,
            sha256_hash: 'a'.repeat(64),
            sidecar_created: true,
        };
        return result;
    },

    db_import_pick: () => {
        const summary: ImportPickSummary = {
            staging_token: 'mock-import-token',
            original_filename: 'sample_backup.db',
            profile_name: 'Imported User',
            test_count: 42,
            custom_text_count: 5,
            date_range: '2026-01-01 to 2026-03-30',
            sha256_hash: 'b'.repeat(64),
            warnings: [],
        };
        return summary;
    },

    db_import_commit: (args) => {
        const displayName = (args?.displayName as string) || 'Restored Profile';
        const profile = createProfile(store.profiles, uid('mock-imported'), displayName);
        store.profiles.push(profile);
        return profile;
    },

    db_integrity_check: () => {
        const report: IntegrityCheckReport = { ok: true, errors: [] };
        return report;
    },

    // Custom Text
    custom_text_list: (args) => {
        const query = (args?.query as string | undefined)?.trim()?.toLowerCase();
        const sort = args?.sort as string | undefined;

        let list = store.customTexts;
        if (query) {
            list = list.filter((t) => t.title.toLowerCase().includes(query));
        }

        const summaries: CustomTextSummary[] = list.map((t) => ({
            id: t.id,
            title: t.title,
            word_count: t.word_count,
            char_count: t.char_count,
            language: t.language,
            source: t.source ?? null,
            created_at: t.created_at,
            updated_at: t.updated_at,
            revision: t.revision,
        }));

        if (sort === 'title') {
            summaries.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
        } else if (sort === 'word_count') {
            summaries.sort((a, b) => b.word_count - a.word_count);
        } else {
            // default: updated_at desc, created_at desc
            summaries.sort((a, b) => {
                const diff = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                if (diff !== 0) return diff;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
        }

        return summaries;
    },

    custom_text_get: (args) => store.customTexts.find((t) => t.id === args?.id) ?? null,

    custom_text_create: (args) => {
        const body = args?.body as string;
        const ts = nowIso();
        const created: CustomTextDetail = {
            id: `mock-ct-${Date.now()}`,
            title: args?.title as string,
            body,
            word_count: countWords(body),
            char_count: body.length,
            language: (args?.language as string) || 'en',
            source: (args?.source as string) || null,
            created_at: ts,
            updated_at: ts,
            revision: 1,
        };
        store.customTexts.unshift(created);
        return created;
    },

    custom_text_update: (args) => {
        const text = requireText(args?.id);
        const body = args?.body as string;
        text.title = args?.title as string;
        text.body = body;
        text.word_count = countWords(body);
        text.char_count = body.length;
        text.revision += 1;
        text.updated_at = nowIso();
        return text;
    },

    custom_text_delete: (args) => {
        store.customTexts = store.customTexts.filter((t) => t.id !== args?.id);
    },

    custom_text_duplicate: (args) => {
        const existing = requireText(args?.id);
        const ts = nowIso();
        const copy: CustomTextDetail = {
            ...existing,
            id: `mock-ct-copy-${Date.now()}`,
            title: `${existing.title} (copy)`,
            created_at: ts,
            updated_at: ts,
            revision: 1,
        };
        store.customTexts.unshift(copy);
        return copy;
    },

    custom_text_revisions: () => {
        const revisions: TextRevision[] = [
            {
                revision_number: 1,
                created_at: nowIso(),
                word_count: 9,
                char_count: 45,
                preview: 'The quick brown fox...',
                additions: 1,
                deletions: 0,
            },
        ];
        return revisions;
    },

    custom_text_revision_diff: (args) => {
        const diff: RevisionDiffResult = {
            target_revision: readArg(args, 'targetRevision', 'target_revision', 1),
            base_revision: readArg(args, 'baseRevision', 'base_revision', 1),
            additions: 2,
            deletions: 1,
            equal: 5,
            lines: [
                { tag: 'equal', old_line_num: 1, new_line_num: 1, text: 'The quick brown fox' },
                { tag: 'delete', old_line_num: 2, new_line_num: null, text: 'jumps over the lazy dog' },
                { tag: 'insert', old_line_num: null, new_line_num: 2, text: 'leaps over the sleepy dog' },
                { tag: 'insert', old_line_num: null, new_line_num: 3, text: 'and takes a rest.' },
            ],
            raw_diff:
                '--- a/Text\n+++ b/Text\n@@ -1,2 +1,3 @@\n The quick brown fox\n-jumps over the lazy dog\n+leaps over the sleepy dog\n+and takes a rest.',
        };
        return diff;
    },

    custom_text_restore: (args) => {
        const text = requireText(args?.id);
        text.revision += 1;
        return text;
    },

    custom_text_mark_used: () => undefined,

    custom_text_export: (args) => store.customTexts.find((t) => t.id === args?.id)?.body ?? '',

    custom_text_export_to_file: (args) => {
        const result: ExportFileResult = {
            success: true,
            path: readArg(args, 'destinationPath', 'destination_path', 'mock_export.txt'),
        };
        return result;
    },

    // Settings
    settings_get: (args) => {
        const result: Record<string, string> = {};
        for (const key of (args?.keys as string[] | undefined) ?? []) {
            const value = store.settings[key];
            if (value !== undefined) result[key] = value;
        }
        return result;
    },

    settings_set: (args) => {
        Object.assign(store.settings, (args?.entries as Record<string, string> | undefined) ?? {});
    },

    // Achievements & Trophies
    achievement_list: () => Array.from(store.achievements.values()),

    achievement_batch_upsert: (args) => {
        const updates = (args?.updates as AchievementUpdateDto[]) ?? [];
        const now = nowIso();
        for (const u of updates) {
            const existing = store.achievements.get(u.achievement_id);
            if (existing) {
                existing.current_value = u.current_value;
                existing.target_value = u.target_value;
                existing.unlocked = u.unlocked;
                existing.unlocked_at = u.unlocked_at;
                existing.tier = u.tier;
                existing.updated_at = now;
            } else {
                store.achievements.set(u.achievement_id, {
                    achievement_id: u.achievement_id,
                    category: 'speed',
                    current_value: u.current_value,
                    target_value: u.target_value,
                    tier: u.tier,
                    unlocked: u.unlocked,
                    unlocked_at: u.unlocked_at,
                    updated_at: now,
                });
            }
        }
    },

    achievement_seed: (args) => {
        const defs = (args?.definitions as AchievementSeedDto[]) ?? [];
        const now = nowIso();
        for (const d of defs) {
            if (!store.achievements.has(d.achievement_id)) {
                store.achievements.set(d.achievement_id, {
                    achievement_id: d.achievement_id,
                    category: d.category,
                    current_value: 0,
                    target_value: d.target_value,
                    tier: d.tier,
                    unlocked: false,
                    unlocked_at: null,
                    updated_at: now,
                });
            }
        }
    },

    advancement_list: () => Array.from(store.advancements.values()),

    advancement_batch_upsert: (args) => {
        const updates = (args?.updates as AdvancementUpdateDto[]) ?? [];
        const now = nowIso();
        for (const u of updates) {
            const existing = store.advancements.get(u.advancement_id);
            if (existing) {
                existing.unlocked = u.unlocked;
                existing.unlocked_at = u.unlocked_at;
                existing.updated_at = now;
            } else {
                store.advancements.set(u.advancement_id, {
                    advancement_id: u.advancement_id,
                    category: 'speed',
                    rank: 1,
                    unlocked: u.unlocked,
                    unlocked_at: u.unlocked_at,
                    updated_at: now,
                });
            }
        }
    },

    advancement_seed: (args) => {
        const defs = (args?.definitions as AdvancementSeedDto[]) ?? [];
        const now = nowIso();
        for (const d of defs) {
            if (!store.advancements.has(d.advancement_id)) {
                store.advancements.set(d.advancement_id, {
                    advancement_id: d.advancement_id,
                    category: d.category,
                    rank: d.rank,
                    unlocked: false,
                    unlocked_at: null,
                    updated_at: now,
                });
            }
        }
    },

    tracking_state_load: () => Array.from(store.trackingState.values()),

    tracking_state_save: (args) => {
        const entries = (args?.entries as TrackingStateUpdateDto[]) ?? [];
        const now = nowIso();
        for (const item of entries) {
            store.trackingState.set(item.key, {
                key: item.key,
                value: item.value,
                updated_at: now,
            });
        }
    },

    trophy_showcase_get: () =>
        [1, 2, 3, 4, 5, 6, 7].map(
            (s) => store.trophyShowcase.get(s) ?? { slot: s, item_id: null, item_type: null, pinned_at: null },
        ),

    trophy_showcase_set: (args) => {
        const slot = readArg(args, 'slot', 'slot', 1);
        const itemId = readArg<string | null>(args, 'itemId', 'item_id', null);
        const itemType = readArg<'achievement' | 'advancement' | null>(args, 'itemType', 'item_type', null);
        if (itemId && itemType) {
            if (itemType === 'achievement') {
                const ach = store.achievements.get(itemId);
                if (ach && !ach.unlocked && ach.tier <= 0) {
                    throw new Error('Cannot pin a locked trophy to showcase');
                }
            } else if (itemType === 'advancement') {
                const adv = store.advancements.get(itemId);
                if (adv && !adv.unlocked) {
                    throw new Error('Cannot pin a locked trophy to showcase');
                }
            }
        }
        const now = nowIso();
        for (const [s, data] of store.trophyShowcase.entries()) {
            if (itemId && data.item_id === itemId && s !== slot) {
                data.item_id = null;
                data.item_type = null;
                data.pinned_at = null;
            }
        }
        store.trophyShowcase.set(slot, {
            slot,
            item_id: itemId,
            item_type: itemId ? itemType : null,
            pinned_at: itemId ? now : null,
        });
    },

    // Audio
    audio_register_sample: () => null,
    audio_play: () => null,
    audio_set_volume: () => null,
    audio_clear: () => null,
    audio_status: () => ({ healthy: true, sample_rate: 48000, loaded_samples: 0 }),
    audio_rebuild_stream: () => ({ healthy: true, sample_rate: 48000, loaded_samples: 0 }),
};

/**
 * Dispatches a command to its mock handler. Results are cloned so callers
 * can never mutate the in-memory store by accident. Unknown commands resolve
 * to `{}`, matching the previous behaviour.
 */
export async function handleMockIpc<T>(command: string, args?: Args): Promise<T> {
    const handler = handlers[command];
    return clone(handler ? handler(args) : {}) as T;
}
