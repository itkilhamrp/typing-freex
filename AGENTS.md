# AGENTS.md — Typing FreeX

Tata kelola utama untuk semua AI agent (Antigravity, Cursor, Windsurf, Copilot, Codex, Claude Code, dan lainnya), kontributor, dan pengembang repositori **Typing FreeX**. Berlaku juga untuk setiap sub-agent. File ini selalu aktif di setiap percakapan, jadi ditulis literal: ikuti persis, jangan menafsirkan ulang.

**Prioritas jika ada konflik:** instruksi eksplisit pengguna → file ini → `.agent/rules/*` → kebiasaan umum. Untuk batasan shell dan keselamatan, file ini yang menang. Untuk detail teknis per bidang, `.agent/rules/*` yang menang. Jika dua aturan tampak bertentangan dan tidak jelas mana yang menang, pilih yang lebih membatasi, tulis 1 kalimat alasannya, lalu lanjut. Jangan menganalisis lebih lama.

**WAJIB** = harus dilakukan. **DILARANG** = tidak boleh dilakukan, kecuali pengguna mengizinkannya secara eksplisit di pesan yang sama.

---

## 0. Kartu Cepat (baca dulu)

1. **Edit dulu, verifikasi belakangan.** Sebelum edit pertama: 0 perintah shell (termasuk `pnpm`) dan maksimal 8 panggilan baca/cari.
2. **Plan yang sudah disetujui = perintah eksekusi.** Jangan menganalisis ulang, meriset ulang, atau menulis ulang plan. Kerjakan langkahnya berurutan (§4.2).
3. **Satu file dibaca 1 kali** sampai file itu berubah. Panggilan tool dengan argumen yang sama tidak diulang.
4. **Shell hanya untuk gate `pnpm` di §5**, dijalankan 1 kali setelah semua edit selesai.
5. **Gagal sekali → STOP dan lapor** (§1.3). Menunggu persetujuan pengguna bukan kegagalan.
6. **Tidak yakin → cari 1 kali dengan tool native, lalu tanya.** Jangan menebak path, API, versi, atau nama skrip (§1.4).
7. **Berpikir singkat:** maksimal 3 kalimat penalaran sebelum tiap panggilan tool.

---

## 1. Aturan Mutlak

### 1.1 Shell dan terminal
- DILARANG memakai shell untuk membaca, mencari, atau mengedit file: `sed`, `awk`, `grep`, `egrep`, `fgrep`, `find`, `perl`, `python -c`, `node -e`, dan sejenisnya.
- DILARANG menjalankan `ls`, `dir`, `cat`, `less`, `head`, `tail`, `stat`, `file` untuk memeriksa struktur proyek atau isi file. Maksimal 1 kali per tugas, hanya jika tool native tidak mampu. Selebihnya, tanyakan ke pengguna.
- DILARANG perintah yang tidak berhenti sendiri atau membuat loop: `watch`, `tail -f`, pipe rekursif, dan proses panjang seperti `pnpm dev`, `pnpm preview`, `pnpm tauri dev`, `pnpm tauri:mcp` (kecuali diminta pengguna, lihat §9).
- DILARANG menjalankan perintah shell apa pun **sebelum edit pertama**, kecuali diminta pengguna.
- Shell hanya untuk gate di §5 atau skrip yang diminta pengguna. DILARANG memakai `pnpm` untuk eksplorasi atau "sekadar mengecek": `pnpm install`, `pnpm list`, `pnpm ls`, `pnpm why`, `pnpm outdated`, `pnpm --version`, `pnpm build`, `pnpm exec`, `pnpm dlx`. Informasi paket dan skrip dibaca dari `package.json` dengan tool native.
- Perintah lain (misalnya `git`) hanya jika diminta pengguna atau tidak ada tool native yang setara.
- Package manager: **hanya `pnpm`**. DILARANG `npm`, `npx`, dan `yarn`.
- Tulis perintah polos. DILARANG `$(...)`, backtick, brace expansion, dan redirect (`>`, `>>`), karena Antigravity lalu meminta persetujuan manual. Rangkaian `&&` pada gate §5 boleh.

### 1.2 Tool native
- WAJIB memakai tool bawaan IDE/agent (baca, cari, edit, buat file, indeks workspace) untuk semua operasi file dan pencarian teks.
- Setelah mengedit, DILARANG memverifikasi lewat shell atau membaca ulang file yang baru diedit. Percayai hasil tool edit dan pelacak workspace IDE. Kesalahan akan tertangkap oleh gate §5.
- DILARANG membaca atau menulis file di luar folder workspace proyek.

### 1.3 One-and-Done dan anti-loop
- Jika perintah shell atau tool gagal pada percobaan pertama (error, timeout, atau hasil di luar harapan), DILARANG mengulang atau memvariasikan parameternya. Hentikan eksekusi, hentikan semua sub-agent, lalu lapor ke pengguna: perintah persis, output/error persis, dan dugaan penyebab (diberi label "dugaan").
- Bukan kegagalan: pencarian native dengan hasil kosong (itu informasi); perintah yang menunggu persetujuan pengguna (tunggu, jangan batalkan, jangan ganti perintah); error lint/typecheck/test dari kode yang sedang dikerjakan (lihat §5).
- **Loop nyata** (STOP, lapor 1–2 kalimat, tanya pengguna): tool yang sama dengan argumen yang sama dipanggil 2 kali; atau 2 panggilan berturut-turut tidak menghasilkan informasi baru.
- **Mulai berputar** (berhenti membaca): file yang sama dibaca lagi padahal belum berubah; atau 4 panggilan baca/cari berturut-turut tanpa edit saat mengeksekusi plan. Edit dengan informasi yang sudah ada jika cukup. Jika tidak cukup, ajukan 1 pertanyaan.
- Setelah konteks diringkas atau terasa hilang: DILARANG membaca ulang semuanya dari awal. Buka plan atau Task List yang disetujui, cari langkah pertama yang belum selesai, lanjutkan dari sana.
- DILARANG mencari jalan pintas untuk menerobos larangan, misalnya memakai skrip sementara sebagai pengganti `grep`.

### 1.4 Integritas informasi
- DILARANG mengarang path file, nama fungsi/komponen, prop, API, nama skrip `package.json`, opsi konfigurasi, atau nomor versi. Sebelum merujuknya, pastikan keberadaannya dengan 1 pencarian native.
- API library (Svelte 5, SvelteKit, Skeleton UI, Tailwind v4, Tauri v2): jangan mengandalkan ingatan. Cari pemakaian yang sudah ada di repo. Jika tidak ada, pakai dokumentasi resmi lewat tool web/docs bila tersedia (maksimal 2 pencarian per pertanyaan). Jika tetap tidak terverifikasi, tanya pengguna. DILARANG menulis kode berdasarkan tebakan.
- Jika tidak tahu atau tidak yakin, katakan terus terang lalu cari atau tanyakan. Bedakan "terverifikasi" dari "dugaan".
- Jika file di `.agent/rules/` tidak ada atau tidak terbaca, STOP dan lapor. Jangan menebak isinya.

### 1.5 Keselamatan
- DILARANG operasi destruktif atau tak terbalikkan tanpa persetujuan eksplisit: hapus massal, `git reset --hard`, `git push --force`, menimpa perubahan pengguna yang belum di-commit.
- DILARANG menambah, menghapus, atau mengubah versi dependensi, mengedit `pnpm-lock.yaml` secara manual, atau mengubah konfigurasi build tanpa persetujuan pengguna.
- DILARANG menulis, mencetak, atau meng-commit secret (token, kunci API, kredensial).
- DILARANG menonaktifkan aturan lint, menambah `@ts-ignore` atau `eslint-disable`, melonggarkan konfigurasi TypeScript, atau menghapus/melewati tes demi membuat verifikasi lulus.

---

## 2. Stack Terkunci

| Area | Ketetapan |
| :--- | :--- |
| Framework | SvelteKit 3 (`@sveltejs/kit@3.0.0`) + Svelte 5 (`svelte@^5.57.2`) |
| Sintaks Svelte | Runes murni: `$state`, `$derived`, `$props`, `$effect`, snippets. Hindari sintaks legacy (`export let`, `$:`, `<slot>`) |
| Desktop shell | Tauri v2 (lihat §9) |
| Konfigurasi | Tanpa `svelte.config.js` (jangan dibuat). Adapter statis diatur di `vite.config.ts` |
| UI | Skeleton UI v5 dikunci: `@skeletonlabs/skeleton@5.0.1` dan `@skeletonlabs/skeleton-svelte@5.0.1`. Tanpa downgrade, versi tidak boleh diubah tanpa persetujuan |
| CSS | Tailwind CSS v4 berbasis CSS via `@tailwindcss/vite` |
| Terlarang | Konsta UI (dilarang keras) |
| Package manager | `pnpm` saja |
| Lisensi | GNU Affero General Public License v3 (`AGPL-3.0-only`) terkunci mutlak |
| Target antarmuka | Desktop dan tablet first. Main scroll container wajib `contain: layout style;`. Bebas jank dan input lag |

Versi di atas adalah ketetapan proyek. Rincian lengkap ada di `01-tech-stack.md`.

---

## 3. Indeks Aturan Teknis (`.agent/rules/`)

Baca hanya baris yang cocok dengan tugas, **sekali per tugas**, sebelum edit pertama. Jika ragu, baca `05` dan `02` saja. Jangan membaca ulang kecuali file itu berubah.

| File | Cakupan | Baca bila |
| :--- | :--- | :--- |
| [`00-project-overview.md`](.agent/rules/00-project-overview.md) | Arsitektur HMVC, struktur `src/`, perintah utama PNPM | Baru masuk proyek atau ragu soal lokasi file |
| [`01-tech-stack.md`](.agent/rules/01-tech-stack.md) | Versi resmi, penguncian Skeleton UI v5.0.1, Tailwind CSS v4, daftar larangan | Menyentuh dependensi, konfigurasi, atau memilih library |
| [`02-code-standards.md`](.agent/rules/02-code-standards.md) | Svelte 5 Runes, TypeScript strict, pemisahan UI vs logika, filosofi UNIX | Menulis atau mengubah kode apa pun |
| [`03-ui-ux-design.md`](.agent/rules/03-ui-ux-design.md) | Desktop/tablet-first, Layer Economy, token tema, larangan AI slop | Mengubah tampilan, komponen UI, atau tema |
| [`04-performance.md`](.agent/rules/04-performance.md) | Scrolling zero-latency, isolasi layout (`contain`), bundle budget | Menyentuh list/scroll/rendering atau menambah kode dan dependensi |
| [`05-workflow-safety.md`](.agent/rules/05-workflow-safety.md) | Protokol keselamatan agent, batasan shell, phased execution, verifikasi | **Selalu**, sebelum edit pertama |
| [`06-audio-system.md`](.agent/rules/06-audio-system.md) | Arsitektur audio 7-tahap UNIX pipeline, keep-alive dither, routing speaker eksternal | Menyentuh audio, suara ketikan, sound engine, atau ZzFX |
| [`07-database-schema.md`](.agent/rules/07-database-schema.md) | Arsitektur SQLite dual-DB (`registry.db` & `typing_freex.db`), pipa migrasi modular UNIX, dan invarian skema | Menyentuh database, migrasi SQL, `src-tauri/src/db/`, backup/import, atau persistensi |

---

## 4. Alur Kerja

### 4.1 Orientasi (maksimal 8 panggilan baca/cari sebelum edit pertama)
1. Tentukan jenisnya: (a) plan sudah disetujui → §4.2; (b) tugas kecil dan jelas (1 file) → langsung baca file target lalu edit; (c) tugas lebih besar tanpa plan → §4.3.
2. Baca file aturan dari §3 (`05` selalu, ditambah yang relevan).
3. Baca file target (per rentang baris bila lokasinya sudah diketahui). Lakukan 1 pencarian untuk komponen/util yang sudah ada sebelum membuat yang baru.
4. Mulai edit. Jika batas 8 terlampaui, terapkan §1.3 ("Mulai berputar").

### 4.2 Eksekusi plan yang sudah disetujui
- Plan disetujui bila pengguna menekan Proceed, menyetujui, atau berkata "eksekusi" atau "lanjut". Plan itu final. DILARANG menulis ulang plan, membuka kembali keputusan di dalamnya, atau menganalisis ulang seluruh basis kode.
- Jadikan langkah plan sebagai daftar kerja (perbarui Task List jika ada). Per langkah: baca file target 1 kali → edit → tandai selesai → langkah berikutnya.
- Satu panggilan edit per perubahan logis. Ganti bagian yang perlu saja, jangan menulis ulang seluruh file jika cukup mengganti sebagian.
- Pencarian tambahan maksimal 2 per langkah.
- Jika sebuah langkah tidak cocok dengan kenyataan (file atau simbol tidak ada, langkah saling bertentangan): berhenti di langkah itu, lapor 1–2 kalimat plus 1 usulan, lalu tanya. DILARANG berimprovisasi diam-diam atau menambah langkah di luar plan.
- Gate §5 dijalankan 1 kali setelah **semua** langkah selesai, bukan per langkah.

### 4.3 Tugas tanpa plan
- Jika menyentuh lebih dari 1 file atau arsitektur, tulis rencana maksimal 10 baris (file yang diubah, urutan, risiko), lalu kerjakan. Jika ada ambiguitas, ajukan 1 pertanyaan ringkas. Jangan menebak keputusan yang sulit dibatalkan.
- Diff minimal, satu perubahan logis per langkah, ikuti pola kode yang sudah ada.

### 4.4 Cara berpikir
- Maksimal 3 kalimat penalaran sebelum tiap panggilan tool.
- Jika dua opsi sama-sama valid, pilih yang diff-nya lebih kecil dan sesuai pola kode yang ada. Jangan menimbang ulang.
- Tanya pengguna hanya untuk keputusan yang sulit dibatalkan atau informasi yang tidak bisa ditemukan sendiri.

---

## 5. Verifikasi dan Definition of Done

Gate wajib, dijalankan **1 kali** setelah semua edit selesai:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm run check:i18n && pnpm run check:budget
```

Lulus berarti **0 error dan 0 warning**.

- Sebelum menjalankan gate, pastikan skrip di atas ada di `package.json` (baca native, 1 kali). Skrip yang tidak ada: jangan dijalankan dan jangan diganti, laporkan sebagai "tidak ada".
- **Error dari kode yang dikerjakan**: perbaiki akar masalahnya, lalu jalankan ulang gate. Maksimal 3 siklus perbaikan untuk error yang sama. Setelah itu STOP dan lapor dengan log persis.
- **Kegagalan lingkungan** (`pnpm` tidak terpasang, timeout, izin ditolak): berlaku One-and-Done (§1.3). STOP dan lapor.
- DILARANG menyatakan "lulus" atau "sudah diuji" jika perintahnya tidak dijalankan. Laporkan mana yang dijalankan, mana yang tidak.
- Tugas selesai bila: (1) gate lulus, atau status sebenarnya dilaporkan jujur; (2) tidak ada TODO, placeholder, kode mati, atau log debugging yang tertinggal; (3) hanya file yang relevan yang berubah.

---

## 6. Kualitas Kode (anti-slop)

- Diff minimal. Tanpa refactor, fitur, atau abstraksi yang tidak diminta.
- Tanpa data mock, placeholder, lorem ipsum, atau TODO di kode produksi.
- Komentar menjelaskan *mengapa*, bukan mengulang apa yang dilakukan kode.
- TypeScript strict. Hindari `any`, kecuali ada alasan yang tertulis di kode.
- Pisahkan UI dari logika. Terapkan filosofi UNIX (Rule of Separation & Modularity) sesuai `02-code-standards.md`. Modul logika matematika pengetikan dan kalkulasi layout tape wajib berstatus *pure-function* bebas dependensi DOM/Svelte. Komponen presentasi UI dilarang melakukan spekulasi koordinat atau manipulasi state yang merembet ke modul lain.
- **Filosofi UNIX & Linus Law (Anti-Regresi & Isolasi Modular Mutlak)**:
  1. *Rule of Modularity*: Setiap modul dirancang sederhana dan terisolasi dengan kontrak antarmuka yang bersih (*clean interfaces*). Dilarang menyatukan logika komputasi, controller interaksi, dan presentasi DOM ke dalam satu file raksasa (*no god components*).
  2. *Rule of Separation*: Pisahkan mekanisme (core headless math/logic) dari kebijakan (UI presentation & user interaction). Modul di `src/core/` dan `src/lib/**/logic/` dilarang mengimpor modul Svelte, DOM API (`window`, `document`, `HTMLElement`), atau reactive store.
  3. *Rule of Composition*: Hubungkan modul melalui antarmuka bersih dan pipa data searah (*UNIX pipeline pattern*).
  4. *Anti-Regresi AI*: AI agent **DILARANG KERAS** mengutak-atik kode di luar cakupan tugas langsung. Dilarang merombak antarmuka publik (*breaking signatures*) atau memutasikan state store secara acak yang berisiko menimbulkan efek merembet (*cascading bugs/ripple effects*).
  5. *Linus's Law & Data Integrity*: *"Bad programmers worry about the code. Good programmers worry about data structures and their relationships."* Jaga konsistensi struktur data SQLite kanonikal, skema tipe TypeScript strict, dan eliminasi seluruh bentuk AI slop.
- Integritas Caret & Multi-Line Tape Mode (4-Stage UNIX Pipeline): Caret arena pengetikan berkedudukan di tingkat viewport, independen dari translasi CSS track (`translate3d(-scrollX, -scrollY, 0)`) untuk menjamin paritas 100% Monkeytype (zero jitter, zero delay, dan zero displacement). Sistem Tape Mode wajib mempertahankan pemisahan 4 modul pipa: (1) `tape-line-segmenter.ts` untuk segmentasi kata per sentinel `\n` dan penentuan `activeTapeLineIndex` via `findLineForWord`, (2) `tape-dom-reader.ts` untuk pembacaan DOM via `getOffsetRelativeTo`, (3) `tape-sync.ts` untuk kalkulasi headless dual-axis (`scrollX`, `scrollY`, dan konstanta kanonikal `TAPE_LINE_PADDING_Y = 7`), serta (4) `WordStream.svelte` di mana stream tape memakai `flex flex-col gap-y-4 w-full` dan setiap `<div data-tape-line>` wajib menerapkan padding horizontal (`padding-left: ${tapeMargin}%; padding-right: ${100 - tapeMargin}%;`), padding vertikal simetris (`padding-top/bottom: ${TAPE_LINE_PADDING_Y}px`), dan isolasi visibilitas baris aktif (`opacity-100` pada baris aktif, `opacity-0 pointer-events-none` pada baris non-aktif) agar tidak pernah terjadi kebocoran visual baris kedua di dalam `AppCard`. DILARANG mencampurkan logika `syncTape()` dan `syncNormal()`.
- Skema Basis Data & Isolasi Pipa Migrasi (`src-tauri/migrations/` & `src-tauri/src/db/`): Wajib mempertahankan pemisahan modular UNIX pada lapisan migrasi (`db/migrate/connection.rs`, `db/migrate/timestamp.rs`, `db/migrate/runner.rs`, `db/migrate/sets.rs`, `db/migrate/mod.rs`) dan pemisahan dua database (`registry.db` via `migrations/registry/0001_baseline.sql` dan `profiles/<uuid>/typing_freex.db` via `migrations/profile/0001_baseline.sql`) sesuai `07-database-schema.md` dan `docs/database-schema.md`. DILARANG menulis DDL (`CREATE TABLE` / `ALTER TABLE`) secara inline di dalam file Rust (`registry.rs`, `manager.rs`, dll.) di luar tabel `schema_migration` milik `runner.rs`. DILARANG mencampurkan logika nama tabel domain ke dalam `runner.rs`. DILARANG membuat nama tabel atau kolom database dengan akhiran penomoran versi (misalnya `_v1`, `_v2`, `_v3`) atau menghidupkan kembali tabel legacy/write-only yang telah dihapus (`personal_best`, `daily_stat`, `custom_wordlist`, `achievement_progress`, atau duplikat `custom_text` di DB profil). Nama tabel harus selalu menggunakan nama domain kanonikal murni yang konsisten. Rekonstruksi tabel SQLite dalam migrasi hanya diizinkan memakai staging table seragam `<nama_tabel>_new` yang langsung di-rename ke nama kanonikal, serta wajib menyinkronkan `ALLOWED_TABLES` di `validate.rs` dan `docs/database-schema.md`.
- Modularitas Halaman Settings & Integritas Lisensi: Seluruh section pengaturan di `SettingsView.svelte` (Sound, Tape, Keymap, Hand Guide, About/License) wajib diisolasi dalam modul mandiri `*SettingsSection.svelte`. DILARANG menuliskan card pengaturan kompleks atau lisensi secara inline di file orchestrator. Elemen About & Lisensi di bagian bawah Settings wajib menampilkan identitas resmi "Typing FreeX" dan lisensi "GNU Affero General Public License v3 (`AGPL-3.0-only`)" melalui token lokalisasi `t('settings.about*')` tanpa hardcoded string.
- Isolasi Sistem Suara Mengetik (`src-tauri/src/audio/`, `src/lib/modules/typing-sound/`, & `src/lib/shared/audio/`): Wajib mempertahankan pemisahan UNIX Pipeline (`audio/device.rs`, `audio/mixer.rs`, `audio/engine.rs`, `audio-backend-probe.ts`, `adaptive-sound-engine.ts`, `native-sound-engine.ts`, `sound-engine.ts`, `wav-encoder.ts`, `sound-synthesizer.ts`, `sound-types.ts`, `sound-pack-registry.ts`, `sound-preloader.ts`, `typing-sound.controller.svelte.ts`, `SoundSettingsSection.svelte`) sesuai `06-audio-system.md`. Pemutaran audio ketikan desktop Tauri v2 dijalankan secara native oleh backend Rust menggunakan library audio CPAL (`src-tauri/src/audio/`) dengan 64-Voice Real-Time Mixer, rentang volume penuh [0.0, 2.0] (0–200% boost) terproteksi limiter analog-style rational soft-saturation (`x / (1.0 + |x|) * 1.5`) bebas distorsi/clipping, sub-audible TPDF keep-alive dither (-88 dBFS) untuk menjaga sink Bluetooth A2DP/DAC tidak masuk sleep-standby, supervisor loop non-blocking untuk hot swapping 2-arah real-time event-driven (internal ⇄ bluetooth) via instant wake-up channel tanpa perlu restart/reload aplikasi, zero allocation pada hot path callback, dan automatic routing ke output default OS (Bluetooth A2DP, 3.5mm jack, USB DAC, Wi-Fi), dengan fallback Web Audio API (`AudioBufferSourceNode`) untuk pengujian headless / browser. DILARANG menggunakan ring buffer `HTMLAudioElement` di webview WebKitGTK yang membebani thread GStreamer dan memicu lag serta CPU panas. DILARANG membuat `new AudioContext()` di luar `audio-context-provider.ts` dan dilarang mengoper `{ latencyHint: 'interactive' }`. Halaman Settings tidak menampilkan tombol `off` untuk sound; toggle on/off (`soundEnabled`) berada secara eksklusif pada bar baris kedua di `ModeBar.svelte`. Pemutaran suara di `TypingArena.svelte` wajib sinkron *fire-and-forget* tepat setelah `controller.handleKeyDown(e)` tanpa `queueMicrotask`, tanpa menyentuh `typing-arena.controller.svelte.ts` atau mengubah `zzfx.ts`/`menu-sfx.ts`. DILARANG menggunakan `await` di hot path pengetikan.
- Isolasi Keyboard Shortcuts Classic Mode (`src/lib/modules/modes/classic/keyboard-shortcuts/`): Wajib mempertahankan pemisahan 4-stage UNIX Pipeline (`shortcut-types.ts`, `shortcut-registry.ts`, `shortcut-matcher.ts`, `classic-shortcuts.controller.svelte.ts`, `ShortcutsHelpPopup.svelte`), Capture Phase listener (`window.addEventListener('keydown', ..., true)` di `ClassicShortcutsProvider.svelte`), serta Triple Guard Anti-Conflict (Route Guard khusus Classic Mode, Typing Guard via `typingActivity.isTyping`, dan Focus Guard `isRealFormInput` yang mengecualikan `input[data-typing-arena-input="true"]` kecuali `F1`, ditambah guard penolakan saat ada modal/dialog/sheet terbuka). DILARANG menghapus atribut `data-typing-arena-input="true"` pada hidden input di `TypingArena.svelte`, mencampurkan logika shortcut global ke dalam handler `typing-arena.controller.svelte.ts`, atau membocorkannya ke luar rute Classic Mode (`/welcome`, `/main-menu`, `/mode-select`).
- Invarian Lintas Profil, Lock Ordering, & Cross-OS (Linux/Windows): (a) *Cross-Profile Invalidation*: Pergantian/penghapusan profil wajib me-reset/me-reload store dependen (`settingsStore`, `achievementStore`, `analyticsStore`, `customTextStore`) dan mem-prefix cache `localStorage` dengan UUID profil aktif; (b) *Single Lock Ordering*: `DatabaseManager` (`src-tauri/src/db/manager.rs`) wajib mengunci `registry_conn` sebelum `active_profile` (atau melepas guard `active_profile` terlebih dahulu) guna mencegah deadlock AB-BA; (c) *Cross-OS Linux/Windows*: Deteksi BOM UTF-16LE/BE di `text_import` wajib mendahului pemeriksaan byte NUL (`0x00`), rotasi log di `logger.rs` wajib men-drop handle `File` sebelum `fs::rename` untuk kompatibilitas file lock Windows, dan pipeline input wajib mendukung komposisi IME (`isComposing`/`Dead`) serta karakter cetak `AltGr` (`Ctrl+Alt` / `AltGraph`).
- Isolasi Keymap React Mode (`src/core/keymap/` & `Keymap.svelte`): Validasi ketukan keymap react mode dipisahkan sebagai pure function `evaluateReactPulse()` (`keymap-react.ts`). Feedback visual tombol per-ketukan WAJIB bersifat imperatif via `pulse(code, isCorrect)` langsung ke atribut DOM `[data-react="ok"]` / `[data-react="err"]` dengan cache pre-indexed dan auto-release 75ms. DILARANG menambahkan `$state` reaktif di hot path `handleKeyInput` di `TypingArena.svelte` untuk animasi/pulse keymap, dan DILARANG menambahkan `will-change: transform, background-color` pada selector state react keymap guna mencegah lag alokasi layer GPU.
- Isolasi Halaman Mode Select (`src/lib/modules/mode-select/`): Wajib mempertahankan pemisahan modular UNIX (`mode-select-types.ts`, `ModeRibbon.svelte`, `ModeRibbon.css`, `ModeSelectView.svelte`, `ModeSelectView.css`, `AsciiArtCanvas.svelte`, `ascii-art-data.ts`) dengan tata letak **edge-to-edge horizontal chevron ribbon** bertumpuk vertikal dan pola zigzag stagger. Ribbon `Classic` dan `Games` (`stagger-left`) wajib menempel mentok ke tepi sisi kiri viewport (tanpa margin/padding horizontal), dan ribbon `Learning` (`stagger-right`) wajib menempel mentok ke tepi sisi kanan viewport (tanpa margin/padding horizontal) sesuai `03-ui-ux-design.md` §8. DILARANG menambahkan margin/padding horizontal pada `.mode-select-page` atau `.mode-ribbon-stage` yang memisahkan pangkal ribbon dari tepi layar.
- Larangan Mutlak Hardcoded String UI: DILARANG menulis string UI literal di template Svelte atau controller logika. Gunakan token lokalisasi `t('namespace.key')` atau `translate('namespace.key')` untuk seluruh teks visible-to-user, termasuk judul dialog native OS (`@tauri-apps/plugin-dialog`), filter berkas, teks pembantu (*hints*), label form, dan notifikasi status/error. Ikuti pola i18n yang sudah ada di kode (cari dulu sebelum menambah kunci).
- Tampilan mengikuti `03-ui-ux-design.md`. Jangan memakai gaya templat generik hasil AI.

---

## 7. Hemat Token & CodeGraph MCP

- **Utamakan `codegraph_explore`**: Bila indeks `.codegraph/` tersedia dan tool MCP `codegraph_explore` aktif, panggil `codegraph_explore` terlebih dahulu untuk menemukan simbol, membaca kode sumber terindeks, dan memeriksa *blast radius* (pemanggil & unit test terkait) dalam 1 panggilan hemat token sebelum membuka banyak file.
- Jika lokasi sudah diketahui, baca per rentang baris. Jangan membaca ulang file yang tidak berubah.
- Jangan membuka seluruh file besar di `content-packs/`. Cari dengan tool native, lalu baca potongan terkait saja.
- Jangan menempel ulang isi file, plan, atau log penuh di balasan. Rujuk path dan nomor baris. Pengecualian: log error yang diwajibkan oleh §1.3.
- Balasan ringkas: hasil, bukan narasi proses. Satu pertanyaan klarifikasi per giliran.

---

## 8. Konten Luring (`content-packs/`)

- Seluruh konten luring berada di `content-packs/`.
- Mode **Quote**: kutipan sastra/bahasa dari berbagai belahan dunia, `category: "quote"`.
- Mode **Tech**: infrastruktur teknologi, DevOps, CLI, basis data. Folder `INFRA/` (sebelumnya `TECH/`) dan `CODE/` bersifat dinamis (masing-masing berkas memuat >= 10 kutipan bervariasi: short, medium, long, thicc) dari dasar hingga lanjutan. Registrasi manifest diatur terpusat di `content-packs/tech/_list.json`.
- Registrasi manifest kutipan sastra diatur di `content-packs/quotes/_list.json`.

---

## 9. MCP Inspection (khusus dev)

Untuk inspeksi dan kendali webview Tauri v2 secara visual oleh AI agent selama pengembangan, gunakan MCP server `@hypothesi/tauri-mcp-server`. Jalankan **hanya jika pengguna memintanya**:

```bash
pnpm tauri:mcp
```

atau

```bash
pnpm tauri:mcp --release
```

- Bridge plugin `tauri-plugin-hushlor-mcp-bridge` diisolasi dengan *double gate* `#[cfg(all(debug_assertions, feature = "mcp-dev"))]` dan overlay config `src-tauri/tauri.conf.mcp.json`.
- DILARANG KERAS memasukkan fitur ini ke build rilis/produksi. Jangan mengubah gate atau overlay tersebut, dan jangan mendistribusikan hasil build `tauri:mcp`.

---

## 10. Mode Otonom, Sub-agent, dan Laporan

**Mode otonom (misalnya `/goal`) dan sub-agent**
- Sertakan §0, §1, dan §4.2 secara utuh dalam prompt setiap sub-agent.
- Sub-agent DILARANG membuat loop terminal atau menerobos batasan agent utama.
- Jika sub-agent gagal, ia melapor ke agent utama. Agent utama menerapkan One-and-Done lalu melapor ke pengguna.
- Mode otonom tidak menghapus kewajiban meminta persetujuan untuk tindakan di §1.5.

**Format laporan akhir**
1. Ringkasan hasil (1–3 kalimat) dalam bentuk walkthrough dengan tool native anda, jangan berikan di panel chat agent lagi.
2. Daftar file yang berubah (path).
3. Verifikasi: perintah yang dijalankan dan hasilnya (lulus, gagal, atau tidak dijalankan).
4. Risiko atau hal yang membutuhkan keputusan pengguna.
