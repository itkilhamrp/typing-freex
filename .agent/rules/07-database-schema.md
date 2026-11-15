<!-- Aturan arsitektur database SQLite, modularitas pipa migrasi UNIX, dan larangan regresi skema -->
# 07 — Database Architecture & Migration Governance

Dokumen ini menetapkan aturan mutlak untuk arsitektur database SQLite (`registry.db` dan `profiles/<uuid>/typing_freex.db`), pipa migrasi modular UNIX di `src-tauri/src/db/`, serta protokol perubahan skema bagi setiap AI agent dan pengembang.

---

## 1. Arsitektur Modular UNIX (`src-tauri/src/db/`)

Lapisan database dipisahkan secara ketat berdasarkan prinsip **Rule of Separation** (mekanisme vs kebijakan) dan **Rule of Modularity**:

```text
src-tauri/
├── migrations/
│   ├── profile/
│   │   ├── 0001_baseline.sql      # DDL kanonikal database per-profil (typing_freex.db)
│   │   └── 0002_indexes.sql       # Indeks analitik & riwayat (idx_test_result_stats)
│   └── registry/
│       └── 0001_baseline.sql      # DDL kanonikal database registri global (registry.db)
└── src/db/
    ├── mod.rs                     # Ekspor submodul db dan helper collect_rows
    ├── migrate/
    │   ├── mod.rs                 # Fasad publik (run_migrations, run_registry_migrations, re-exports)
    │   ├── connection.rs          # PRAGMA koneksi SQLite & validasi APPLICATION_ID (0x54465258 "TFRX")
    │   ├── timestamp.rs           # Pure function chrono_now_iso & civil_from_days (zero external crate)
    │   ├── runner.rs              # Mesin migrasi generik bebas-domain (schema_migration, SHA-256, user_version)
    │   └── sets.rs                # Kebijakan daftar migrasi (PROFILE_MIGRATIONS, REGISTRY_MIGRATIONS)
    ├── registry.rs                # Operasi CRUD pada registry.db (profile, active_profile, app_setting)
    ├── custom_text_repo.rs        # Repositori CRUD & rekonstruksi revisi custom_text pada registry.db
    ├── manager.rs                 # Orkestrator thread-safe koneksi registry.db & active_profile
    ├── legacy_migrate.rs          # Migrasi satu-kali direktori data aplikasi legacy (com.typing_freex.i18n -> com.typing-freex.app)
    ├── backup.rs                  # Ekspor cadangan atomik via VACUUM INTO + sidecar SHA-256
    └── validate.rs                # Pipa karantina 10-tahap & pemeriksaan integritas database
```

Direktori runtime `<app_data_dir>/` memuat `registry.db`, `profiles/<uuid>/typing_freex.db`, `backups/`, `quarantine/`, `content_cache/`, `logs/` (rotasi berkas log `typing_freex.log`), dan `temp/`.

---

## 2. Invarian & Larangan Mutlak Bagi AI Agent

1. **DILARANG Menulis DDL (`CREATE TABLE` / `ALTER TABLE`) Inline di Kode Rust**:
   - Seluruh definisi tabel dan indeks aplikasi wajib berada di dalam file `.sql` pada folder `src-tauri/migrations/profile/` atau `src-tauri/migrations/registry/`.
   - Satu-satunya tabel yang boleh dibuat oleh kode Rust adalah `schema_migration` di dalam `src-tauri/src/db/migrate/runner.rs`.
   - Dilarang keras menambahkan hack `let _ = conn.execute("ALTER TABLE ...")` di `registry.rs` atau `manager.rs`.

2. **Isolasi Mekanisme vs Kebijakan (`runner.rs` vs `sets.rs`)**:
   - `runner.rs` adalah mesin generik murni. **DILARANG** memasukkan logika spesifik tabel domain (`test_result`, `achievements`, `custom_text`, dll.) ke dalam `runner.rs`.
   - Kebijakan file SQL mana yang dijalankan wajib dideklarasikan hanya di `sets.rs`.

3. **Kontrak Antarmuka Publik (`db::migrate`)**:
   - Simbol publik yang diekspor oleh `src-tauri/src/db/migrate/mod.rs` (`run_migrations`, `run_registry_migrations`, `configure_connection`, `chrono_now_iso`, `is_valid_application_id`, `APPLICATION_ID`, `CURRENT_SCHEMA_VERSION`) adalah kontrak yang dipakai oleh modul `commands/*` dan `db/*`. Dilarang mengubah tanda tangan (*signature*) fungsi-fungsi tersebut tanpa persetujuan eksplisit pengguna.

4. **Penamaan Tabel & Kolom Kanonikal (Linus's Law)**:
   - **DILARANG** membuat nama tabel atau kolom dengan akhiran versi seperti `_v1`, `_v2`, `_old`, atau `_temp`.
   - Jika migrasi di masa depan membutuhkan rekonstruksi tabel SQLite, gunakan pola standar: buat `<nama_tabel>_new`, salin data, `DROP TABLE <nama_tabel>`, lalu `ALTER TABLE <nama_tabel>_new RENAME TO <nama_tabel>`.

5. **Larangan Tabel Redundan / Write-Only**:
   - `test_result` adalah *single source of truth* untuk riwayat ketikan, Personal Bests, dan Daily Activity. Dilarang membuat kembali tabel duplikat yang hanya ditulis namun tidak pernah dibaca (seperti tabel legacy `personal_best`, `daily_stat`, `custom_wordlist`, atau `achievement_progress`).
   - Koleksi `custom_text` dan `custom_text_revision` berada secara eksklusif di `registry.db` agar dapat diakses lintas profil. Dilarang menduplikasi tabel `custom_text` ke dalam skema database profil.

6. **Sinkronisasi Wajib Saat Mengubah Skema**:
   Setiap kali ada perubahan skema yang disetujui pengguna, AI agent **WAJIB** memperbarui keempat titik berikut secara serentak:
   - File migrasi SQL di `src-tauri/migrations/{profile,registry}/` dan `src-tauri/src/db/migrate/sets.rs`.
   - Daftar `ALLOWED_TABLES` di `src-tauri/src/db/validate.rs` (jika menyentuh tabel profil).
   - Unit test verifikasi skema di `src-tauri/src/db/migrate/mod.rs`.
   - Dokumentasi resmi di [`docs/database-schema.md`](../../docs/database-schema.md).

