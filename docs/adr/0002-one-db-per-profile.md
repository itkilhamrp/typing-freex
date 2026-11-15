# ADR 0002: One SQLite File Per User Profile (AD-03)

## Status
Accepted

## Context
Typing FreeX requires offline multi-profile management where users may want to share, backup, or reset a single profile without affecting other users on the same machine.
Approaches considered:
1. Single monolithic database (`data.db`) with `profile_id` column in all tables.
2. Central `registry.db` managing profiles and shared custom text library, with individual `profiles/<profile_uuid>/typing_freex.db` SQLite databases per profile.

## Decision
We adopt the one-database-per-profile pattern with unified migration tracking (`db/migrate/`):
- `registry.db` (`migrations/registry/0001_baseline.sql`): Stores profile metadata (`profile`), active profile pointer (`active_profile`), global application settings (`app_setting`), and the shared custom text collection (`custom_text`, `custom_text_revision`).
- `profiles/<profile_uuid>/typing_freex.db` (`migrations/profile/0001_baseline.sql`): Stores self-describing profile metadata (`profile_meta`), profile-scoped settings (`setting`), all typing test results (`test_result`), cumulative key statistics (`key_stat`), achievements/advancements (`achievements`, `advancements`, `tracking_state`), and the 7-slot trophy showcase (`trophy_showcase`) for that specific profile.

## Consequences
- Clean data isolation: A corrupted profile does not compromise other profiles.
- Exporting a profile is as simple as running `VACUUM INTO` on that profile's `typing_freex.db` file.
- Custom texts are shared across all local profiles in `registry.db` and have dedicated `.txt` import/export tools rather than being duplicated in per-profile backups.
- Profiles can be deleted simply by unlinking their directory and removing their entry from `registry.db`.
- Both `registry.db` and per-profile databases are versioned and verified by the same schema-agnostic migration runner (`src-tauri/src/db/migrate/runner.rs`). See [`docs/database-schema.md`](../database-schema.md) for the full specification.
