use super::runner::Migration;

/// Canonical schema version for per-profile databases (`profiles/<uuid>/typing_freex.db`).
pub const CURRENT_SCHEMA_VERSION: u32 = 2;

/// Canonical schema version for the global registry database (`registry.db`).
pub const CURRENT_REGISTRY_SCHEMA_VERSION: u32 = 1;

/// Ordered migration set for per-profile databases (`typing_freex.db`).
pub const PROFILE_MIGRATIONS: &[Migration] = &[
    Migration {
        version: 1,
        name: "0001_baseline",
        sql: include_str!("../../../migrations/profile/0001_baseline.sql"),
    },
    Migration {
        version: 2,
        name: "0002_indexes",
        sql: include_str!("../../../migrations/profile/0002_indexes.sql"),
    },
];

/// Ordered migration set for the global registry database (`registry.db`).
pub const REGISTRY_MIGRATIONS: &[Migration] = &[Migration {
    version: 1,
    name: "0001_baseline",
    sql: include_str!("../../../migrations/registry/0001_baseline.sql"),
}];

