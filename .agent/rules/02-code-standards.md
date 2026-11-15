<!-- Standar penulisan kode Svelte 5 Runes, TypeScript strict, pemisahan arsitektur HMVC, dan filosofi UNIX -->
# 02 — Code Standards & Engineering Rigor

Dokumen ini mendefinisikan standar penulisan kode Svelte 5, TypeScript, pemisahan logika dari tampilan, dan filosofi rekayasa perangkat lunak.

---

## 1. Standar Svelte 5 (Runes Architecture)

Semua kode komponen Svelte baru dan refaktorisasi **WAJIB** menggunakan Svelte 5 Runes:
- **State Reaktif**: Gunakan `$state(initialValue)`.
- **Nilai Turunan (Computed)**: Gunakan `$derived(expression)` atau `$derived.by(() => { ... })`.
- **Efek Samping (Side Effects)**: Gunakan `$effect(() => { ... })`. Wajib menyertakan cleanup return function untuk listener, timer, atau subscription.
- **Props Komponen**: Gunakan destrukturisasi `$props()`:
  ```svelte
  let { title, active = false, onclick, children }: Props = $props();
  ```
- **Two-way Bindable Props**: Gunakan `$bindable()` (misal: `let { value = $bindable() }: Props = $props();`).
- **Snippets**: Gunakan `{#snippet name(arg)}` dan `{@render name(arg)}` untuk templating modular alih-alih slot usang.

### Dilarang Keras pada Svelte 5:
- **Dilarang** memakai `export let prop` (sintaks Svelte 3/4).
- **Dilarang** memakai reaktivitas label `$:` (sintaks lama).
- **Dilarang** memakai Svelte store lama (`writable`, `readable`) untuk state lokal komponen.
- **Dilarang** memakai `<slot />` usang.

---

## 2. Standar TypeScript & Strict Typing

- **Strict Type Checking**: Seluruh kode wajib lulus `pnpm typecheck` (`svelte-check`) dengan **0 error dan 0 warning**.
- **Larangan Tipe `any`**: Dilarang menggunakan tipe `any`. Gunakan `unknown` jika tipe belum pasti dan lakukan type narrowing / runtime validation.
- **Tanpa Kode Mati & Console Debug**: Dilarang meninggalkan `console.log`, `debugger`, komentar blok kode mati (*commented-out dead code*), atau import yang tidak digunakan (*unused imports*).
- **Subpath Imports**:
  - Gunakan alias subpath Node `#lib/*` (misal: `import { AppButton } from '#lib/shared/ui';`).
  - Gunakan alias `@/*` untuk `src/` dan `$core/*` untuk `src/core/`.
  - Dilarang mengimpor dari alias legacy `$lib`.

---

## 3. Pemisahan Logika Bisnis & Tampilan (HMVC)

Perubahan visual pada UI **TIDAK BOLEH** merusak atau mengubah logika bisnis:
1. **Komponen Tampilan (`.svelte`)**:
   - Hanya bertanggung jawab atas struktur DOM, *layout*, gaya CSS, dan mengikat event ke controller.
   - Tidak boleh memanggil invoke Tauri IPC langsung jika controller sudah tersedia.
2. **Controller (`*.controller.svelte.ts`)**:
   - Mengorkestrasi interaksi pengguna, validasi input, dan memanggil state store atau IPC backend.
3. **Core Engine (`src/core/`)**:
   - Berisi matematika pengetikan murni (WPM, akurasi, PRNG, tokenizer).
   - Bersifat *headless* dan 100% bebas dari framework UI (Svelte/Vite).
4. **Rust Backend (`src-tauri/`)**:
   - Mengelola disk I/O, SQLite, dialog OS, dan operasi sensitif.

### 3.1 Batasan Kontrak & Isolasi Modular (Contract Boundaries)
- **TextBuffer.getWords()**: WAJIB mengembalikan shallow copy array (`[...this.words]`), bukan referensi internal langsung, agar komponen atau controller yang mengonsumsinya via `$state.raw` dapat mendeteksi perubahan referensi pada setiap mutasi.
- **Visual Mode Settings vs Arena Visibility**: Pengaturan mode visual (seperti `HandGuideMode` dan `KeymapMode`) bersifat persisten dan HANYA memuat pilihan aktif (`"static" | "react" | "next"`). DILARANG memasukkan nilai `"off"` ke dalam pemilih mode di UI Settings. Status aktif/tidaknya fitur di arena pengetikan dikendalikan secara ortogonal melalui boolean flags (`handGuideEnabled` dan `keymapEnabled`) yang saling eksklusif di arena tanpa merusak atau mengubah konfigurasi mode yang tersimpan.
- **Visual Tape Mode Settings vs Arena Visibility**: Pengaturan visual tape mode (`TapeMode`: `"letter" | "word"` dan `tapeMargin`: 0–100%) bersifat persisten dan HANYA memuat pilihan aktif di UI Settings (`TapeSettingsSection.svelte`). DILARANG memasukkan nilai `"off"` ke dalam pemilih mode di UI Settings. Status aktif/tidaknya fitur tape di arena pengetikan dikendalikan secara ortogonal melalui boolean flag (`tapeEnabled`) di customize bar arena (`ModeBar.svelte`), tanpa merusak atau mengubah konfigurasi mode yang tersimpan.
- **Isolasi Rendering Tape vs Normal**: Logika rendering tape (`syncTape()`) di `WordStream.svelte` terisolasi penuh dari logika rendering normal (`syncNormal()`). DILARANG mencampurkan kalkulasi horizontal scroll tape ke dalam alur vertikal normal atau sebaliknya. Kedua mode rendering hanya berbagi: viewport DOM container, caret `place()` API, dan CSS containment. Pada mode tape, `windowStart` wajib dikunci pada `0` (`tapeEnabled ? 0 : ...`) agar elemen horizontal tidak ter-unmount di awal sesi, mencegah dislokasi koordinat DOM saat pengetikan berlangsung.
- **Arsitektur Viewport-Level Caret (`WordStream.svelte` & `Caret.svelte`)**: Elemen `<Caret>` WAJIB berkedudukan sebagai anak langsung dari `<div bind:this={viewport}>` (bukan di dalam `track`). Hal ini mengisolasi Caret dari translasi animasi CSS horizontal `track` sehingga:
  1. Pada mode tape `letter`: Caret stasioner $100\%$ pada `targetVisualX = (tapeMargin / 100) * viewportWidth` tanpa getaran/jitter horizontal.
  2. Pada mode tape `word`: Kata aktif berlabuh pada `targetVisualX` dan Caret bergerak melintasi karakter kata aktif dengan mulus.
  3. Pada mode normal: Caret ditempatkan pada koordinat viewport `(x, y - scroll)`.
- **Isolasi Headless & Pipeline Modular Tape Mode (`typing-shared/logic/`)**:
  Sistem Tape Mode dirancang sebagai 4-tahap UNIX Pipeline yang terpisah secara ketat:
  1. **Tahap 1 — Segmentasi Baris Murni (`tape-line-segmenter.ts`)**: *Pure-function module* bebas dependensi DOM/Svelte. Fungsi `segmentIntoTapeLines()` mengelompokkan array kata menjadi logical horizontal lines berdasarkan newline sentinels (`target === '\n'`), di mana sentinel menjadi elemen terakhir di baris yang diterminasinya. Fungsi `findLineForWord()` menyediakan pencarian biner $O(\log n)$ untuk menentukan indeks baris aktif (`activeTapeLineIndex`). DILARANG memasukkan logika DOM, reactive state, atau kalkulasi visual ke dalam modul ini.
  2. **Tahap 2 — Pembacaan DOM Terisolasi (`tape-dom-reader.ts`)**: Modul pembacaan DOM khusus Tape (`readTapeMeasurement()`) yang dipisahkan dari `WordStream.svelte` agar tidak bercampur dengan `getVisualLines()` / `measure()` milik mode normal. Seluruh pembacaan offset dilakukan memanfaatkan modul invarian `dom-measurement.ts` (`getOffsetRelativeTo`), sehingga dilarang keras melakukan penjumlahan offset spekulatif (`word.offsetLeft + el.offsetLeft`).
  3. **Tahap 3 — Matematika Layout Murni (`tape-sync.ts`)**: *Pure-function module* tanpa dependensi DOM, Svelte, atau framework (`window`, `document`, `HTMLElement`). Mengekspor konstanta kanonikal `TAPE_LINE_PADDING_Y = 7` sebagai *Single Source of Truth* untuk ruang vertikal atas/bawah setiap baris tape (`2 * TAPE_LINE_PADDING_Y = 14px`), sehingga tinggi DOM 1 baris (`singleLineHeight + 14`) selalu identik 1:1 dengan `viewportHeight`. Kalkulasi koordinat caret (`caretX`, `caretY`), dimensi caret (`caretW`, `caretH`), scroll horizontal (`scrollX`), dan scroll vertikal multi-baris (`scrollY`) terisolasi penuh via antarmuka `TapeMeasurement` (termasuk `lineTrackTop`). `caretY` dihitung relatif terhadap viewport: `(charTrackTop - scrollY) + (charHeight - caretH) / 2`.
  4. **Tahap 4 — Integritas Tata Letak & Anti-Bleed Multi-Line Tape (`WordStream.svelte`)**: Saat `tapeEnabled === true`, kata-kata dikelompokkan ke dalam kontainer baris (`<div data-tape-line>`) di dalam stream vertikal (`flex flex-col gap-y-4 w-full overflow-visible`). Setiap kontainer baris (`data-tape-line`) WAJIB menerapkan:
     - `padding-left: ${tapeMargin}%; padding-right: ${100 - tapeMargin}%;` agar kata pertama di setiap baris selalu sejajar dengan Caret (`targetVisualX`).
     - `padding-top: ${TAPE_LINE_PADDING_Y}px; padding-bottom: ${TAPE_LINE_PADDING_Y}px;` agar teks berada simetris di tengah vertikal viewport dan mencegah baris kedua bocor/mengintip (*vertical line bleed*).
     - Isolasi visibilitas baris aktif: hanya baris aktif (`lineIdx === activeTapeLineIndex`) yang memiliki `opacity-100`, sedangkan baris lainnya WAJIB `opacity-0 pointer-events-none select-none`.
     - Track ditranslasikan dengan GPU-accelerated `translate3d(-${scrollX}px, -${scrollY}px, 0)`. DILARANG menghapus atribut `data-tape-line`, menghapus `TAPE_LINE_PADDING_Y`, menghapus isolasi `opacity-0`, atau mencampurkan logika ini ke dalam `syncNormal()`.
- **Konsistensi Batasan Nilai (Clamping)**: Semua batasan numerik (misal: slider ukuran atau rentang filter) WAJIB konsisten di seluruh lapisan store dan UI, tanpa nilai batas yang bertentangan.
- **Integritas Semantik Result View (`src/lib/modules/result/`)**:
  1. *Isolasi Prestige Tier*: Tingkat kesulitan permainan (`normal`, `expert`, `master`) adalah atribut aturan sesi hardcore, BUKAN sekadar metadata konten (bahasa/tanda baca) dan BUKAN alert error. Wajib ditampilkan sebagai aksen tipografi murni (`· <DIFFICULTY>`) berukuran besar menyatu di baris heading utama tanpa elemen card/box ataupun ikon dekoratif yang mendorong posisi vertikal judul ke bawah, agar koordinat vertikal judul selalu konsisten 100% dengan mode normal. Dilarang mencampurkannya ke dalam baris flex metadata bersama tag bahasa.
  2. *Dekopling State Kegagalan (Failure State Decoupling)*: Status `controller.isFailed` HANYA mengendalikan warna heading utama (`text-status-red`) dan pengumuman pembaca layar (A11Y). DILARANG mengubah warna aksen tingkat kesulitan menjadi `warning`/`alert` saat sesi gagal; aksen tingkat kesulitan harus mempertahankan gaya teks yang konsisten, bersih, dan bermartabat.
  3. *Disiplin Baris Sumber Teks (Attribution Row)*: Teks sumber kutipan (`quoteSource` atau referensi kustom) yang memiliki panjang dinamis WAJIB berada pada baris kontainer terpisah (*secondary row*) di bawah baris konfigurasi, dengan pemotongan teks aman (`truncate max-w-md sm:max-w-xl`), demi mencegah layout shift atau penumpukan 3–4 badge dalam satu baris horizontal.
- **Isolasi Modular Modul Custom Text (`src/lib/modules/custom-text/`)**:
  1. *Pola Orchestrator*: `TextEditorView.svelte` bertindak eksklusif sebagai orchestrator state dan event (`save`, `restore`, shortcuts). DILARANG menuliskan kembali markup editor raksasa (>50 baris) inline. Semua visual didelegasikan ke komponen mandiri: `EditorToolbar.svelte`, `EditorTextarea.svelte`, `EditorSidebar.svelte`, `RevisionTimeline.svelte`, dan `DiffInspector.svelte`.
  2. *Dekopling Logika Diff*: `logic/diff-tokenizer.ts` adalah modul pure-function bebas dependensi Svelte atau DOM. Dilarang memasukkan efek visual atau reactive store ke dalam modul logika diff.
  3. *Git Diff Color-Words Paradigm*: Perubahan revisi wajib divisualisasikan inline setingkat kata/karakter (bukan sekadar penandaan baris penuh) dan didukung context collapsing untuk teks panjang.
  4. *Komponen Presentasi Murni*: Komponen anak (`EditorToolbar`, `EditorSidebar`, `RevisionTimeline`, `DiffInspector`) menerima state via `$props()` dan memancarkan callback event; dilarang mengimpor atau memutasikan store secara acak di dalam komponen anak.
- **Isolasi Settings Search Pipeline (`src/lib/modules/settings/logic/`)**:
  Sistem pencarian Settings dirancang sebagai 2-modul UNIX Pipeline yang terpisah secara ketat:
  1. **Registry Statis (`settings-registry.ts`)**: Deklarasi metadata seluruh setting items (ID, section, i18n keys, keywords). DILARANG memasukkan logika reaktif, import Svelte, atau kalkulasi dinamis ke dalam modul ini.
  2. **Filter Engine (`settings-search.ts`)**: Pure-function `filterSettings()` yang menerima query, registry, dan fungsi terjemahan, lalu mengembalikan `SettingsFilterResult`. DILARANG memasukkan efek samping, DOM access, atau reactive state ke dalam modul ini.
  
  Komponen `SettingsView.svelte` mengkomposisikan kedua modul via `$derived.by()` dan menggunakan hasilnya untuk conditional rendering (`{#if}`). DILARANG memindahkan logika filter ke dalam controller atau store — pencarian adalah murni urusan presentasi halaman Settings.
- **Modularitas & Isolasi Section Settings (`src/lib/modules/settings/components/`)**:
  Mengikuti *Rule of Modularity* & *Rule of Separation*:
  1. *Sub-Section Terisolasi*: Setiap domain pengaturan atau info informatif (Tape, Keymap, Hand Guide, About/License) WAJIB diekstrak ke dalam file mandiri `*SettingsSection.svelte` (`TapeSettingsSection.svelte`, `KeymapSettingsSection.svelte`, `HandGuideSettingsSection.svelte`, `AboutSettingsSection.svelte`).
  2. *Pola Orchestrator*: `SettingsView.svelte` bertindak eksklusif sebagai orchestrator tab dan conditional rendering visibilitas pencarian (`{#if isSectionVisible('<section>')}`). DILARANG menuliskan card pengaturan kompleks atau blok lisensi/merk secara inline di dalam `SettingsView.svelte`.
  3. *Integritas Lisensi & Merk*: Bagian About & Lisensi (`AboutSettingsSection.svelte`) wajib menampilkan identitas resmi "Typing FreeX" dan lisensi "GNU Affero General Public License v3 (AGPL-3.0-only)" secara presisi, bebas dari hardcode string (wajib menggunakan token lokalisasi `t('settings.about*')`).
- **Isolasi Keyboard Shortcuts Classic Mode (`src/lib/modules/modes/classic/keyboard-shortcuts/`)**:
  Sistem keyboard shortcut Classic Mode dirancang sebagai 4-tahap UNIX Pipeline yang terpisah secara ketat:
  1. **Tahap 1 — Type Definitions (`shortcut-types.ts`)**: Pure type definitions tanpa dependensi runtime.
  2. **Tahap 2 — Registry Statis (`shortcut-registry.ts`)**: Deklarasi metadata seluruh shortcut (ID, keys, i18n keys, category, context). DILARANG memasukkan logika reaktif, import Svelte, atau kalkulasi dinamis ke dalam modul ini.
  3. **Tahap 3 — Matcher (`shortcut-matcher.ts`)**: Pure-function `matchShortcut()` yang mencocokkan KeyboardEvent terhadap registry berdasarkan konteks aktif. DILARANG memasukkan efek samping, DOM access, atau reactive state ke dalam modul ini.
  4. **Tahap 4 — Controller (`classic-shortcuts.controller.svelte.ts`)**: Orchestrator yang menghubungkan event listener, route guard, typing guard, dan dispatch aksi sinkron (`useTypingStore()`) plus `store.notifyArenaConfigChanged()` untuk regenerasi kata instan di `TypingArena.svelte` dan auto-refocus ke `input[data-typing-arena-input="true"]`.
  5. **Tahap 5 — Provider (`ClassicShortcutsProvider.svelte`)**: Thin wrapper yang di-mount di `+layout.svelte` menggunakan **Window Capture Phase (`window.addEventListener('keydown', handler, true)`)** agar shortcut di-intercept sebelum menyentuh `<input data-typing-arena-input="true">` milik arena.
  6. **Tahap 6 — UI (`ShortcutsHelpPopup.svelte`)**: Komponen presentasi murni yang menerima state via `$props()`. DILARANG mengimpor atau memutasikan store secara langsung.

  **Triple Guard Anti-Conflict**: (1) Route guard — hanya aktif di Classic Mode routes; (2) Typing guard — suppress saat `typingActivity.isTyping === true`; (3) Focus guard (`isRealFormInput`) — bypass saat fokus di elemen input form pengguna, tetapi **WAJIB mengecualikan** hidden capture input arena (`el.hasAttribute('data-typing-arena-input') === false`). DILARANG menghapus atribut `data-typing-arena-input="true"` di `TypingArena.svelte` atau mengubah listener capture phase menjadi bubble phase.
- **Isolasi Sistem Suara Mengetik (`src-tauri/src/audio/`, `src/lib/modules/typing-sound/` & `src/lib/shared/audio/`)**:
  Sistem suara ketikan mekanikal dirancang sebagai 7-tahap UNIX Pipeline yang terisolasi penuh (lihat `06-audio-system.md`):
  1. **Preloader & Baking Layer (`sound-preloader.ts`, `sound-synthesizer.ts`, `wav-encoder.ts`)**: Orkestrator pengambilan aset WAV, sintesis gelombang PCM (`44.1kHz`), dan encoding WAV di memori untuk didaftarkan ke backend native Rust (`audio_register_sample`) maupun cache `AudioBuffer` fallback.
  2. **Data & Registry Layer (`sound-types.ts` & `sound-pack-registry.ts`)**: Kontrak tipe dan katalog deklaratif 27 varian click pack, 4 error pack, dan opsi time warning. DILARANG menambahkan tombol `"off"` di halaman Settings; konfigurasi mode/pack di Settings selalu menyimpan pilihan aktif, sedangkan status aktif/tidaknya suara di arena dikendalikan via `soundEnabled` di `ModeBar.svelte` baris kedua.
  3. **Policy Layer (`typing-sound.controller.svelte.ts`)**: Satu-satunya jembatan reaktif yang menghubungkan `useSettingsStore()`, `TypingArena.svelte`, `ModeBar.svelte`, dan `SoundSettingsSection.svelte`. Rentang volume mendukung `[0.0, 2.0]` (0–200% boost).
  4. **Engine Selector & IPC Dispatch (`audio-backend-probe.ts`, `adaptive-sound-engine.ts`, `native-sound-engine.ts`, `sound-engine.ts`)**: Mengarahkan pemutaran suara ketikan pada Tauri v2 desktop ke backend native Rust via IPC non-blocking (`audio_play`), dengan fallback Web Audio API (`HybridSoundEngine` + `getSharedAudioContext()` dari `audio-context-provider.ts`) untuk lingkungan browser/test headless. DILARANG menggunakan `HTMLAudioElement` pool di WebKitGTK Linux, dan DILARANG membuat `new AudioContext()` di luar `audio-context-provider.ts` atau mengoper `{ latencyHint: 'interactive' }`.
  5. **Native Rust Real-Time Audio Engine (`src-tauri/src/audio/device.rs`, `mixer.rs`, `engine.rs` & `commands/audio.rs`)**: 64-Voice Real-Time Mixer bebas alokasi memori pada callback thread (`zero-allocation hot path`), dilengkapi limiter rational soft-clip (`(x / (1.0 + |x|)) * 1.5`) untuk volume hingga 200%, sub-audible TPDF keep-alive dither (-88 dBFS) agar DAC/Bluetooth A2DP tidak masuk sleep-standby, serta supervisor loop event-driven (`audio_rebuild_stream`) untuk hot-swapping 2-arah instan (internal ⇄ Bluetooth/USB DAC) mengikuti `host.default_output_device()`.
  6. **Presentation Layer (`SoundSettingsSection.svelte`)**: Komponen UI Settings mandiri yang dirender oleh `SettingsView.svelte`. DILARANG mengubah `zzfx.ts`, `menu-sfx.ts`, atau `keycap-acoustic-presets.ts` saat memodifikasi sistem suara mengetik.
- **Isolasi Keymap React Pipeline (`src/core/keymap/` & `src/lib/modules/typing-shared/components/Keymap.svelte`)**:
  Sistem feedback visual pengetikan Keymap React dirancang sebagai pipeline imperatif zero-lag bebas dari overhead reaktivitas Svelte:
  1. **Evaluation Engine (`keymap-react.ts`)**: Pure headless function `evaluateReactPulse()` untuk memvalidasi ketukan terhadap karakter ekspektasi tanpa dependensi Svelte atau DOM.
  2. **Imperative DOM Pulse (`Keymap.svelte`)**: Metode `pulse(code, isCorrect)` memanipulasi atribut DOM secara instan (`data-react="ok"` atau `data-react="err"`) pada cache elemen pre-indexed (`Map<string, HTMLElement[]>`), membersihkan pulse sebelumnya dan mengatur auto-release 75ms.
  3. **Zero State Mutation on Hot Path**: DILARANG KERAS menyimpan `activeKeyCode` atau `activeKeyCorrect` di dalam `$state` reaktif di `TypingArena.svelte` pada hot path `keydown`. Menulis state reaktif per ketukan memicu invalidasi ekspresi class puluhan hingga ratusan tombol keymap secara simultan dan menyebabkan input delay.
  4. **CSS Compositor Discipline**: DILARANG menambahkan `will-change: transform, background-color` pada selector state react keymap untuk mencegah churn alokasi layer GPU berulang pada setiap ketukan.

### 3.2 Batasan Kontrak Sistem Gamifikasi & Achievement Engine (`src/core/achievements/`)
Sistem misi dan evaluasi pencapaian dirancang headless, deterministik, dan bebas kebocoran state:
1. **Isolasi Mode Hardcore (Expert & Master)**:
   - Misi khusus mode hardcore (`expert_wins`, `expert_speed`, `expert_precision`, `master_wins`, `master_speed`, `master_endurance`) **HANYA** boleh dievaluasi dan bertambah progresnya jika sesi dijalankan pada tingkat kesulitan yang bersangkutan (`ctx.difficulty === 'expert'` atau `'master'`) **DAN** sesi tidak gagal (`!ctx.failedByDifficulty`).
   - Misi kecepatan presisi ekstrem Master (`master_speed`) **WAJIB** memverifikasi nol kesalahan secara mutlak (`ctx.accuracy === 100` dan `(ctx.incorrectChars === undefined || ctx.incorrectChars === 0)`).
2. **Isolasi State Evaluator Internal (`_state_*`)**:
   - Record evaluator yang diawali `_state_` (seperti `_state_pb_*`, `_state_active_day_last_date`, `_state_lang_*`) adalah state internal evaluator, BUKAN misi pencapaian pengguna.
   - Helper `getRecord` internal wajib mengembalikan `unlocked: val > 0` untuk record state internal agar pengecekan multi-kondisi (seperti `tech_completionist`, `tier_explorer`, `comeback_streak`) dapat membaca status historis dengan akurat tanpa membocorkannya ke antarmuka pengguna.
3. **Skalabilitas Tak Terbatas Grandmaster (Endless Overflow Tier System)**:
   - Jenjang misi terdiri dari 9 divisi rank standar (masing-masing 5 sub-tier bintang: Bronze, Silver, Gold, Platinum, Diamond, Heroic, Elite Heroic, Master, Elite Master) hingga Tier 45.
   - Mulai Tier 46 ke atas, sistem beralih ke progresi overflow tanpa batas (*endless prestige*): `starCount` dikunci maksimal pada angka 5, dan kelebihan level direpresentasikan via `overflowCount = tier - 45`, diformat resmi sebagai `Grandmaster 5★ +N` atau `Grandmaster ★★★★★ +N`. Dilarang mengunci atau membatasi batas atas progres pemain pada tier 45.
4. **Nomenklatur Sekuler Bebas AI Slop & Religiusitas**:
   - Dilarang keras menggunakan terminologi keagamaan, mistisisme, atau sakralitas (misalnya: "God", "Deity", "Trinity", "Divine", "Holy") di seluruh ID feat, nama tier, maupun deskripsi lokalisasi (EN/ID).
   - Gunakan selalu istilah prestasi berbasis kemahiran teknis dan keunggulan murni (seperti: "Apex", "Zenith", "Pinnacle", "Mastermind", "Legend").
5. **Integritas Metrik Kumulatif**:
   - Misi kehadiran aktif (`total_active_days`) wajib dihitung secara kumulatif berbasis tanggal unik lokal (`YYYY-MM-DD`), bukan streak berturut-turut yang rapuh terhadap perbedaan zona waktu atau jadwal pengguna.
6. **Integritas Kontrak Showcase Slots & Aksi Pin Trofi (`src/lib/modules/profile/`)**:
   - Kontrak `TrophyShowcaseDto` secara kanonikal menggunakan properti `item_id: string | null` (dan `slot: number`, `item_type: 'achievement' | 'advancement' | null`, `pinned_at: string | null`). DILARANG KERAS menggunakan atau mengasumsikan nama properti fiktif `achievement_id` pada slot showcase.
   - Aksi interaksi Pin pada kartu trofi di galeri/koleksi (`LazyTrophyCard.svelte`, `TrophyCard.svelte`) **WAJIB** membuka modal pemilih slot (`ShowcasePinSlotModal.svelte`), memberikan kendali penuh kepada pengguna untuk memilih slot tujuan (1–7), menukar posisi trofi (*swap*), atau melepas sematan (*unpin*). DILARANG melakukan penulisan sembunyi-sembunyi (*silent background auto-pinning*) yang menimpa slot secara sepihak tanpa antarmuka pemilihan bagi pengguna.
   - Mengikuti filosofi UNIX (Rule of Separation & Modularity), seluruh kalkulasi dan kueri status slot showcase wajib berkedudukan sebagai *headless pure-function* di `src/lib/modules/profile/logic/showcase-slot.logic.ts` bebas dari dependensi DOM/framework UI.

---

## 4. Konvensi Penamaan File & Folder

| Entitas | Konvensi | Contoh Nyata di Repo |
| :--- | :--- | :--- |
| **Komponen UI** | PascalCase `.svelte` | `MainMenuView.svelte`, `AppButton.svelte` |
| **Controller** | kebab-case `.controller.svelte.ts` | `typing-arena.controller.svelte.ts` |
| **Store** | kebab-case `.store.svelte.ts` | `typing.store.svelte.ts`, `profile.store.svelte.ts` |
| **Modul Core** | kebab-case `.ts` | `input-processor.ts`, `wordlist-loader.ts` |
| **Unit Test** | `*.test.ts` (co-located) | `AppButton.test.ts`, `metrics.test.ts` |
| **Ikon Phosphor** | Named import dari `phosphor-svelte` | `import { Keyboard, Play, Trash } from 'phosphor-svelte';` |

---

## 5. Filosofi UNIX & Rekayasa Linus (Eric S. Raymond & Linus Torvalds)

1. **Rule of Modularity**: Buat bagian-bagian sederhana yang terhubung melalui antarmuka bersih (*clean interfaces*). Jangan pernah membuat "god class" atau "god component" multi-tanggung jawab.
2. **Rule of Clarity**: Kode harus jelas, transparan, dan mudah dibaca oleh manusia sebelum mesin. Kejelasan struktural jauh lebih unggul daripada trik kode yang cerdik (*clarity is better than cleverness*).
3. **Rule of Composition**: Buat satu modul/komponen yang melakukan satu tugas dengan sangat baik (*do one thing and do it well*), dan rancang agar dapat digabungkan dengan modul lain melalui pipa data searah (*UNIX pipeline pattern*).
4. **Rule of Separation**: Pisahkan kebijakan (*policy*) dari mekanisme (*mechanism*); pisahkan antarmuka (*interface*) dari mesin engine (*engine*). Logika komputasi murni tidak boleh bergantung pada antarmuka pengguna grafis.
5. **Rule of Parsimony**: Tulis kode yang ramping, hemat alokasi, dan bebas dari kelebihan abstraksi (*no premature over-engineering, no bloated code, NO AI SLOP*).
6. **Linus's Law & Anti-Regression AI Directive**:
   - *"Given enough eyeballs, all bugs are shallow."* Kode yang modular, terisolasi, dan mudah diaudit mencegah munculnya efek samping yang tak terduga (*unexpected side-effects*).
   - **Isolasi Mutlak AI Agent**: AI agent **DILARANG KERAS** memodifikasi sembarang kode di luar lingkup tugas langsungnya yang berisiko merusak (*ripple effect*) fungsi atau modul lain. Setiap modifikasi harus terlokalisasi, berstatus atomik, dan diverifikasi melalui test suite.

---

## 6. Standar Skema Basis Data & Migrasi SQLite (Filosofi UNIX & Linus Law)

Struktur data adalah fondasi utama integritas sistem (*"Bad programmers worry about the code. Good programmers worry about data structures and their relationships" — Linus Torvalds*):

1. **Konvensi Penamaan Tabel & Kolom**:
   - Nama tabel harus selalu menggunakan kata benda deskriptif murni dalam format `snake_case` (misal: `profiles`, `test_result`, `app_setting`, `custom_text`, `achievements`, `advancements`, `tracking_state`, `trophy_showcase`, `schema_migration`).
   - **DILARANG KERAS** menambahkan sufiks penomoran versi seperti `_v1`, `_v2`, `_v3` pada nama tabel, baik untuk tabel permanen maupun penamaan sementara. Penamaan versi di tabel adalah bentuk *AI Slop* yang merusak kejelasan dan konsistensi skema.

2. **Prosedur Rekonstruksi Tabel SQLite (Migration Staging Pattern)**:
   - Ketika migrasi SQLite memerlukan modifikasi `CHECK` constraint atau struktur tabel tanpa dukungan `ALTER TABLE` langsung, gunakan pola staging seragam:
     1. Buat tabel sementara dengan akhiran `_new` (misal: `trophy_showcase_new` atau `test_result_new`).
     2. Salin data yang valid: `INSERT INTO <nama_tabel>_new SELECT ... FROM <nama_tabel>;`
     3. Hapus tabel lama: `DROP TABLE <nama_tabel>;`
     4. Ganti nama ke nama kanonikal: `ALTER TABLE <nama_tabel>_new RENAME TO <nama_tabel>;`
     5. Buat ulang indeks jika diperlukan.
   - **Dilarang** memakai nama staging arbitrer, acak, atau bertag versi (`_v2`, `_temp`, `_backup_tbl`). Gunakan selalu `<nama_tabel>_new`.

3. **Isolasi Domain Misi (Achievements vs Advancements vs Tracking State)**:
   - Misi pengetikan dipisahkan secara modular ke dalam 3 tabel mandiri:
     - `achievements`: Progresi bertingkat (*multi-tier progressive*, Bronze→Grandmaster 45 level) yang memiliki `current_value`, `target_value`, dan `tier`.
     - `advancements`: Pencapaian sekali buka (*one-shot feats*, Common→Mythic) yang ramping tanpa overhead kolom target dan memiliki `rank`.
     - `tracking_state`: State evaluator internal (`_state_*`) yang terisolasi dari data antarmuka pengguna.
   - Dilarang menggabungkan kembali ketiga entitas ini ke dalam satu tabel tunggal atau merusak isolasi modulnya.

4. **Standar Arsitektur Backend Rust Modular & Isolasi IPC (`src-tauri/src/`)**:
   - Struktur modul backend Rust dipisahkan secara ketat menurut prinsip modularitas UNIX:
     - `commands/`: Thin IPC adapter layer. Hanya mengekspos fungsi bertag `#[tauri::command]` sebagai perantara antara frontend dan engine. Dilarang menaruh kalkulasi komputasi berat atau manipulasi data kompleks langsung di handler commands.
     - `db/`: Manajemen koneksi SQLite Dual-DB (`registry.db` dan `profiles/<uuid>/typing_freex.db`), pipa migrasi modular UNIX (`db/migrate/connection.rs`, `timestamp.rs`, `runner.rs`, `sets.rs`, `mod.rs`), backup atomik (`VACUUM INTO`), dan validasi karantina 10-tahap (`validate.rs`). Seluruh pengumpulan iterasi `query_map` wajib menggunakan pure helper `crate::db::collect_rows` untuk mengeliminasi boilerplate duplikat dan menjamin penanganan error seragam.
     - `domain/`: Pure business rules, validasi display name/slug, sanitasi pengaturan sistem, dan validasi metrik pengetikan.
     - `audio/`: 7-tahap native audio pipeline CPAL (`device.rs`, `mixer.rs`, `engine.rs` — 64-voice mixer, rational soft-clip limiter 0–200%, TPDF dither -88 dBFS, event-driven 2-way hot-swapping device loop) sesuai `06-audio-system.md`.
     - `text_import/`: Pipeline impor teks modular (deteksi encoding, dekompresi RLE/LZ, diffing unified git, isolasi staging).
   - Penanganan error wajib menggunakan enum `AppError` berbasis `thiserror` dengan serialisasi JSON aman yang menyembunyikan detail sensitif database internal.

5. **Protokol Keselamatan Migrasi Skema Basis Data SQLite (`src-tauri/migrations/` & `src-tauri/src/db/migrate/`)**:
   - File migrasi SQL (`src-tauri/migrations/profile/0001_baseline.sql` dan `src-tauri/migrations/registry/0001_baseline.sql`) bersifat *immutable append-only* setelah rilis. Dilarang menulis DDL (`CREATE TABLE` / `ALTER TABLE`) secara inline di kode Rust di luar tabel `schema_migration` milik `runner.rs`.
   - Setiap perubahan skema baru di masa depan wajib dibuat sebagai file migrasi bernomor urut berikutnya pada `migrations/profile/` atau `migrations/registry/` dan didaftarkan di `src-tauri/src/db/migrate/sets.rs`.
   - Nilai konstanta `CURRENT_SCHEMA_VERSION` dan `CURRENT_REGISTRY_SCHEMA_VERSION` di `src-tauri/src/db/migrate/sets.rs` wajib selalu sinkron dengan versi migrasi aktif tertinggi, serta wajib menyinkronkan `ALLOWED_TABLES` di `src-tauri/src/db/validate.rs` dan `docs/database-schema.md` sesuai `07-database-schema.md`.
   - Integritas Application ID: Identitas kanonikal `APPLICATION_ID` (`0x54465258` - `"TFRX"`) dan validator `is_valid_application_id()` di `src-tauri/src/db/migrate/connection.rs` wajib dipertahankan untuk memvalidasi keaslian file database saat impor.

6. **Invarian Anti-Regresi Lintas Profil, Lock Ordering, & Cross-OS (Linux/Windows)**:
   - **Cross-Profile Store Invalidation & UUID-Scoped `localStorage`**: Pergantian atau penghapusan profil (`switchProfile`, `deleteProfile`) wajib memicu reset/reload tersinkronisasi pada store dependen (`settingsStore`, `achievementStore`, `analyticsStore`, `customTextStore`) dan mem-prefix cache `localStorage` dengan UUID profil aktif guna mencegah kebocoran state antar profil.
   - **Single Lock Ordering (`DatabaseManager`)**: Di dalam `src-tauri/src/db/manager.rs`, akuisisi mutex ganda wajib mengikuti urutan tunggal (`registry_conn` sebelum `active_profile`, atau lepaskan guard `active_profile` sebelum mengunci `registry_conn`) untuk mencegah deadlock AB-BA.
   - **Invarian Cross-OS (Linux & Windows)**:
     1. *UTF-16 BOM Before Binary Check*: Deteksi BOM UTF-16LE/BE (`src-tauri/src/text_import/`) wajib dijalankan sebelum pemeriksaan byte NUL (`0x00`) agar file teks UTF-16 dari Windows tidak ditolak sebagai file biner.
     2. *Windows Log Handle Drop*: Saat merotasi file log (`src-tauri/src/logger.rs`), handle `File` aktif wajib di-drop (`Option<File>::take()`) sebelum `fs::rename` dijalankan agar tidak gagal karena file locking pada Windows.
     3. *IME, Dead Keys & AltGr Support*: Pipeline input arena (`input-processor.ts` & `TypingArena.svelte`) wajib mengisolasi sesi komposisi IME (`isComposing`, `Dead`, `Process`) serta mengizinkan karakter cetak dari kombinasi `AltGr` (`Ctrl+Alt` / `AltGraph`).
     4. *Open-Modal Guard pada Classic Shortcuts*: `ClassicShortcutsProvider` / `classic-shortcuts.controller.svelte.ts` wajib menonaktifkan eksekusi shortcut arena ketika terdapat dialog/modal/sheet terbuka (`[role="dialog"]`, `[aria-modal="true"]`).



---

## 7. Standar Arsitektur Lokalisasi (i18n) & Pencegahan AI Slop

Struktur lokalisasi bahasa (`src/locales/`) harus mematuhi prinsip UNIX Modularity dan Linus Law:

1. **Pemisahan Folder Domain Gamifikasi**:
   - Direktori `src/locales/{en,id}/achievements/` HANYA menampung antarmuka trofi dan feats diskrit (`ui.json`, `feats.json`).
   - Direktori `src/locales/{en,id}/advancements/` HANYA menampung pohon progres dan jenjang bertingkat (`ui.json`, `tiers.json`).
   - Dilarang keras menggabungkan kembali kedua domain ini ke dalam satu folder tunggal.
2. **Larangan Raw Fallback Identifier**:
   - Dilarang membiarkan antarmuka menampilkan identifier mentah `snake_case` (misal: `raw_speed_tier`, `speed_tier`).
   - Setiap ID misi wajib memiliki label dan deskripsi kanonikal di kamus bahasa (`en` dan `id`), serta dilengkapi defensive resolution pipeline di komponen Svelte (`t(labelKey) || t(advancements[id]) || t(achievements[id])`).
3. **Paritas Paripurna (100% Zero-Defect Parity)**:
   - Setiap kunci baru di `en/` wajib memiliki pasangan di `id/` dengan terjemahan natural berkualitas tinggi (bukan teks kosong, bukan terjemahan mesin serampangan).
   - Validasi melalui `pnpm run check:i18n` wajib lulus dengan status 0 error dan 0 warning.
4. **Larangan Mutlak Hardcoded String UI & Disiplin Dialog Native**:
   - DILARANG KERAS menuliskan teks/string bahasa Inggris literal secara langsung di dalam template Svelte (`{#if}`, `{#each}`, teks antar elemen HTML), atribut visual (`placeholder`, `title`, `aria-label`), maupun controller logika.
   - Seluruh teks yang terlihat oleh pengguna WAJIB dipetakan ke dalam kamus lokalisasi melalui pemanggilan `t('namespace.key')` atau fungsi headless `translate('namespace.key')`.
   - Disiplin ini mencakup seluruh judul dialog berkas native OS (`@tauri-apps/plugin-dialog`), nama filter ekstensi (`name: t('...')`), hint teks pembantu, label form, serta notifikasi sukses/gagal.
   - Sebelum menandai tugas selesai, agent wajib melakukan audit mandiri untuk memastikan nol string literal baru yang membocorkan bahasa mentah ke UI.
