<!-- Ringkasan arsitektur tingkat tinggi, peta struktur direktori, dan perintah pnpm utama Typing FreeX -->
# 00 — Project Overview & Architecture

Dokumen ini memuat ringkasan proyek Typing FreeX, struktur direktori aplikasi, dan perintah operasional utama.

---

## 1. Ringkasan & Tujuan Proyek

**Typing FreeX** adalah aplikasi desktop pengetikan (*typing test engine*) modern, berkinerja tinggi, dan sepenuhnya luring (*strictly offline*):
- **Tujuan Utama**: Memberikan pengalaman uji ketik berlatensi sub-milidetik, akurat, bebas distraksi, dan aman tanpa telemetri atau dependensi CDN eksternal.
- **Fitur Kunci**: Uji ketik multi-mode (Waktu, Kata, Quote, Tech, Zen, Custom), panduan posisi jari/tangan (*Hand Guide*), metrik komprehensif (WPM, Raw WPM, Akurasi, Konsistensi), analitik perkembangan lokal, dan isolasi data per profil pengguna.
- **Model Distribusi**: Static Single Page Application (SPA) yang dikemas menggunakan Tauri v2 dan backend Rust.

---

## 2. Struktur Direktori Proyek (HMVC)

Aplikasi dibangun dengan pola **Hierarchical Model-View-Controller (HMVC)** yang terpisah secara ketat:

```text
typing_freex_svelte_skeletonUI/
├── .agent/rules/          # Aturan dan standar teknik untuk AI agent & developer (00 s/d 07)
├── .agents/               # Root kustomisasi Antigravity (mcp_config.json, skills)
├── docs/                  # Dokumentasi arsitektur, database-schema.md, spesifikasi metrik, dan ADR
├── scripts/               # Skrip gate kualitas (check-i18n-parity, check-bundle-budget, enforce-pnpm)
├── content-packs/         # Paket konten luring (strictly offline)
│   ├── quotes/            # Kutipan sastra/bahasa dunia (17 bahasa) & manifest _list.json
│   ├── tech/              # Mode Tech: INFRA/ (18 file sistem/DevOps/DB) & CODE/ (28 file algoritma/bahasa)
│   ├── wordlists/         # Daftar kata multi-bahasa & tier kamus
│   ├── keyboard-layouts/  # Definisi geometri dan pemetaan tata letak keyboard
│   └── schema/            # Skema validasi JSON untuk paket konten
├── src/
│   ├── app.css            # Titik masuk CSS (Tailwind v4 @theme & Skeleton imports)
│   ├── app.html           # Template root HTML (data-theme="cerberus")
│   ├── app.d.ts           # Deklarasi tipe global SvelteKit
│   ├── zzfx.d.ts          # Deklarasi tipe ambient procedural audio
│   ├── core/              # Headless Core Engine murni (zero UI/DOM/Svelte dependencies)
│   │   ├── typing-engine/ # State machine, kalkulator metrik, buffer teks, Mulberry32 PRNG
│   │   ├── text-tools/    # Sanitasi, normalisasi teks, pemuat wordlist & quote-loader
│   │   ├── hand-guide/    # Geometri panduan tangan dan pemetaan jari
│   │   ├── keymap/        # Pure function validasi keymap react mode (keymap-react.ts)
│   │   ├── achievements/  # Mesin kalkulasi evaluasi misi, registry misi 45+ tier, dan tier-system
│   │   └── ipc/           # Kontrak tipe dan pemanggil command Tauri
│   ├── lib/
│   │   ├── modules/       # Domain fitur modular terisolasi
│   │   │   ├── modes/     # Wadah domain mode permainan terisolasi
│   │   │   │   ├── classic/   # Mode Classic: TypingArena, ModeBar, controllers, store, keyboard-shortcuts/
│   │   │   │   ├── learning/  # Mode Learning: isolasi terpisah untuk ekspansi fitur
│   │   │   │   └── games/     # Mode Games: isolasi terpisah untuk ekspansi fitur
│   │   │   ├── typing-shared/ # Komponen pengetikan reusable (Caret, WordStream, HandGuide, Keymap, LiveStats) & logic/ (4-stage Tape pipeline)
│   │   │   ├── typing-sound/  # Orkestrasi suara ketikan (controller, SoundSettingsSection, sound-preloader)
│   │   │   ├── result/    # Fitur hasil pasca sesi (ResultView, ResultChart, controller)
│   │   │   ├── history/   # Fitur riwayat sesi (HistoryView)
│   │   │   ├── main-menu/ # Hub navigasi aplikasi (MainMenuView)
│   │   │   ├── welcome/   # Orientasi pengguna baru (FirstRunView)
│   │   │   ├── analytics/ # Analisis & perkembangan lokal
│   │   │   ├── custom-text/# Editor teks kustom modular & diff tokenizer
│   │   │   ├── database/  # Cadangan & pemulihan basis data
│   │   │   ├── mode-select/# Pemilih mode permainan (edge-to-edge chevron ribbon)
│   │   │   ├── profile/   # Manajemen profil pengguna, galeri trofi, & showcase-slot.logic.ts
│   │   │   └── settings/  # Preferensi sistem (*SettingsSection.svelte) & logic/ pencarian
│   │   ├── shared/        # Fondasi & utilitas bersama (styles, types, utils, ui, actions, audio, stores)
│   │   └── shell/         # AppShell dan navigasi desktop/tablet
│   ├── locales/           # Kamus lokalisasi modular (en/, id/)
│   └── routes/            # SvelteKit static SPA file-based router (ssr: false)
├── src-tauri/             # Backend Rust (Tauri v2, SQLite rusqlite, CPAL native audio, 57 IPC commands)
│   ├── migrations/        # Skrip SQL baseline kanonikal (profile/0001_baseline.sql & registry/0001_baseline.sql)
│   ├── src/audio/         # 7-Stage Native Audio Engine (device.rs, mixer.rs, engine.rs)
│   ├── src/db/            # Manajer Dual-DB, pipa migrasi modular UNIX (db/migrate/), custom_text_repo.rs, backup & validasi 10-tahap
│   ├── src/commands/      # Thin async IPC adapter layer (spawn_blocking) untuk 57 command Tauri
│   ├── src/domain/        # Pure business rules & validasi metrik/pengaturan
│   ├── src/text_import/   # Pipeline impor teks kustom (service.rs, reader/encoding/sanitize/split/compress/diff/staging)
│   ├── tauri.conf.json    # Konfigurasi Tauri utama (production & standard dev)
│   └── tauri.conf.mcp.json# Overlay konfigurasi dev-only untuk AI MCP bridge
└── tests/                 # Unit test, golden traces, dan conformance suites
```

---

## 3. Perintah Utama PNPM

Setiap AI agent dan pengembang **WAJIB** menggunakan `pnpm`. Penggunaan `npm` dan `yarn` dilarang keras.

| Perintah | Deskripsi |
| :--- | :--- |
| `pnpm dev` | Menjalankan Vite development server web (`localhost:1420`). |
| `pnpm tauri dev` | Menjalankan aplikasi desktop Tauri v2 dalam mode debug standar. |
| `pnpm tauri dev --release` | Menjalankan desktop Tauri dengan profil rilis Rust (optimalisasi tinggi). |
| `pnpm tauri:mcp` | Menjalankan desktop Tauri dengan MCP Bridge (`tauri-plugin-hushlor-mcp-bridge`) untuk inspeksi webview oleh AI Agent. |
| `pnpm typecheck` | Menjalankan validasi tipe TypeScript & Svelte (`svelte-check`). |
| `pnpm lint` | Menjalankan ESLint (termasuk validasi batasan modul `eslint-plugin-boundaries`). |
| `pnpm test` | Menjalankan seluruh test suite Vitest. |
| `pnpm test:coverage` | Menjalankan test suite dengan audit coverage kode v8. |
| `pnpm run check:i18n` | Memvalidasi paritas kunci terjemahan antara bahasa Inggris dan Indonesia. |
| `pnpm run check:budget` | Memvalidasi batas ukuran bundle JS, CSS, font, dan content-pack produksi. |
| `pnpm build` | Membangun artefak static SPA ke direktori `dist/`. |
| `pnpm run tool:replay` | Menjalankan utilitas deterministik replay sesi pengetikan (`scripts/tool-replay.ts`). |

---

## 4. Peta Kontrak Modul & Isolasi Pipa UNIX (Anti-Regresi AI)

Untuk mencegah perubahan di satu fitur merembet dan merusak fitur lain (*cascading regressions*), setiap subsistem utama dibangun sebagai **UNIX Pipeline** searah dengan kontrak antarmuka publik yang terkunci:

| Subsistem | Urutan Pipa Modular (Hulu → Hilir) | Invarian & Batas Isolasi Mutlak |
| :--- | :--- | :--- |
| **Multi-Line Tape Mode** | `tape-line-segmenter.ts` → `tape-dom-reader.ts` → `tape-sync.ts` (`TAPE_LINE_PADDING_Y = 7`) → `WordStream.svelte` | Modul `logic/` bebas DOM/Svelte. `<Caret>` berkedudukan di level viewport. Hanya baris aktif yang `opacity-100`; baris lain wajib `opacity-0 pointer-events-none`. Dilarang mencampur `syncTape()` dan `syncNormal()`. |
| **Audio Ketikan (7-Stage)** | `sound-preloader.ts` → `sound-synthesizer.ts` → `typing-sound.controller.svelte.ts` → `adaptive-sound-engine.ts` (`native-sound-engine.ts` / `sound-engine.ts`) → `commands/audio.rs` → `audio/engine.rs` & `mixer.rs` → `audio/device.rs` (CPAL) | Hot path `playClick` wajib sinkron *fire-and-forget* tanpa `await`. Backend Rust 64-voice zero-allocation, limiter soft-clip `[0.0, 2.0]` (0–200%), TPDF dither `-88 dBFS`, dan hot-swap 2-arah via `host.default_output_device()`. |
| **Database & Migrasi** | `migrations/{profile,registry}/0001_baseline.sql` → `db/migrate/sets.rs` → `runner.rs` (`connection.rs`, `timestamp.rs`) → `db/migrate/mod.rs` → `manager.rs` / `registry.rs` / `validate.rs` | Dilarang menulis DDL inline di Rust (selain `schema_migration` di `runner.rs`). `runner.rs` bebas nama tabel domain. Nama tabel wajib kanonikal tanpa akhiran `_v1`/`_v2`. |
| **Classic Shortcuts** | `shortcut-types.ts` → `shortcut-registry.ts` → `shortcut-matcher.ts` → `classic-shortcuts.controller.svelte.ts` → `ClassicShortcutsProvider.svelte` + `ShortcutsHelpPopup.svelte` | Listener wajib di Window Capture Phase (`true`) dengan Triple Guard (Route Guard, Typing Guard, Focus Guard yang mengecualikan `input[data-typing-arena-input="true"]`). |
| **Keymap React Mode** | `src/core/keymap/keymap-react.ts` (`evaluateReactPulse`) → `Keymap.svelte` (`pulse(code, isCorrect)`) | Wajib imperatif via atribut DOM `[data-react="ok"\|"err"]` dengan auto-release 75ms. Dilarang menaruh `$state` reaktif per ketukan di `TypingArena.svelte`. |
| **Settings & Search** | `settings-registry.ts` → `settings-search.ts` (`filterSettings`) → `SettingsView.svelte` → `*SettingsSection.svelte` | `SettingsView.svelte` hanya mengorkestrasi tab dan visibilitas section. Setiap grup pengaturan wajib terisolasi di `*SettingsSection.svelte`. |
| **Mode Select** | `mode-select-types.ts` + `ascii-art-data.ts` → `ModeSelectView.svelte` → `ModeRibbon.svelte` + `AsciiArtCanvas.svelte` | Tata letak edge-to-edge horizontal chevron ribbon tanpa margin/padding horizontal pada `.mode-select-page` dan `.mode-ribbon-stage`. |
