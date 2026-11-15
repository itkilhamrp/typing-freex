<!-- Aturan performa komputasi, zero-latency rendering, batas bundle budget, dan isolasi layout -->
# 04 — Performance & Rendering Constraints

Dokumen ini mendefinisikan batasan performa latensi rendah, pencegahan jank rendering, dan kepatuhan anggaran ukuran bundle.

---

## 1. Zero-Latency Scrolling & Layout Containment

- **Larangan `will-change: scroll-position`**: Dilarang keras pada kontainer scroll. Properti ini memaksa GPU mengalokasikan tekstur memori raksasa untuk seluruh tinggi konten yang memicu spike memori dan stutter.
- **Larangan `scroll-behavior: smooth`**: Dilarang pada kontainer aplikasi utama karena menambahkan input lag artifisial pada wheel mouse dan trackpad gesture.
- **Wajib Layout Containment**: Kontainer scroll utama (`<main>`), header tetap, dan wrapper halaman (`<AppPage>`) **WAJIB** mendeklarasikan:
  ```css
  contain: layout style;
  ```
  Ini mengisolasi kalkulasi reflow dan restyle dari document root.
- **Larangan Transisi Global**: Dilarang menempelkan transisi CSS global (`transition: all` atau `transition: background-color`) pada elemen root (`html`, `body`, `#app`).

---

## 2. Larangan Efek Berat GPU & CSS

1. **Backdrop Blur Overhead**: Dilarang menerapkan `backdrop-filter: blur(...)` pada elemen yang sering di-scroll atau kartu berkali-kali. Gunakan warna solid semi-opak bertingkat (`var(--tt-surface-elevated)`).
2. **Animasi Geometri Layout**: Dilarang menganimasikan properti geometri layout (`width`, `height`, `top`, `left`, `margin`, `padding`). Gunakan hanya `transform: translate3d(...)` dan `opacity`.
3. **Pengecualian `will-change: transform`**: Hanya diizinkan pada elemen mikro arena pengetikan aktif (`Caret.svelte`, `WordStream.svelte`) untuk menjamin presisi gerak kursor sub-milidetik.
4. **Mandat Viewport Lazy Mounting untuk Grid Grafis/SVG Kompleks**:
   - Dilarang me-render lebih dari 15 elemen grafis berat (kartu SVG berlapis, trofi bergradien multi-layer, canvas kompleks, emblem) sekaligus ke dalam DOM tanpa lazy-mounting.
   - Pada desktop Tauri v2 / WebKitGTK Linux, puluhan hingga ratusan SVG dengan `<defs>` gradien simultan memicu GPU/CPU rasterization choke dan input delay fatal.
   - Komponen grid berulang wajib mengadopsi native `IntersectionObserver` (buffer `rootMargin: '300px 0px'`) serta properti CSS modern `[contain:layout_style_paint] [content-visibility:auto] [contain-intrinsic-size:auto_<height>]` agar node off-screen tidak membebani WebKit rendering tree.

---

## 3. Efisiensi Reaktivitas & Memori (Svelte 5)

- **Keyed Each Blocks**: Setiap perulangan `{#each list as item (item.id)}` **WAJIB** memiliki unique key identifier untuk mencegah re-rendering DOM yang tidak perlu.
- **Hindari `$effect` Berlebihan**: Jangan gunakan `$effect` untuk state yang dapat dihitung secara murni dengan `$derived`.
- **Objek JavaScript Murni vs Svelte Wrappers**:
  - Untuk kalkulasi lokal di dalam `$derived.by()` atau helper sementara, gunakan struktur data native (`Date`, `Set`, `Map`, array).
  - Gunakan `SvelteSet` / `SvelteMap` hanya untuk state persisten yang memang harus memicu reaktivitas lintas batas komponen.
- **Kontrak Referensi Reaktif (Reactive Reference Contract)**:
  - Mesin headless/core yang menyuplai data ke consumer Svelte 5 via `$state.raw` WAJIB mengembalikan referensi baru (shallow copy seperti `[...array]`) pada setiap mutasi data buffer.
  - DILARANG mengembalikan referensi internal yang dimutasi in-place karena `$state.raw` mengandalkan *referential equality* (`===`) untuk mendeteksi perubahan; jika referensi tidak berubah, render DOM tidak terpicu.

---

## 4. Sub-Millisecond Typing Arena Latency

- Pipeline event `keydown` pada sesi ketik memiliki prioritas latensi tertinggi.
- Dilarang memicu pembacaan DOM sinkron yang berat, disk I/O, IPC invoke, atau parsing analitik di dalam event handler pengetikan real-time.
- Simpan kalkulasi histori, penyimpanan SQLite, dan analitik kompleks secara asinkron setelah sesi pengetikan berakhir.
- **Visual Pulse Zero-Latency Rules**:
  - Feedback visual tombol per-ketukan pada `Keymap.svelte` WAJIB bersifat imperatif (`pulse(code, isCorrect)`) memanipulasi atribut DOM (`data-react="ok"` atau `"err"`) secara instan.
  - DILARANG menggunakan `$state` reaktif (`keymapActiveKeyCode`, `keymapActiveKeyCorrect`) atau reactive timer di hot path `handleKeyInput` di `TypingArena.svelte`. Perubahan state reaktif memicu siklus flush render ganda dan evaluasi ulang ekspresi style ratusan tombol keycap di frame yang sama.
  - DILARANG menambahkan `will-change: transform, background-color` pada style keymap react mode; isolasi layout dicapai secara murni melalui `contain: layout style;` pada `.keymap-root`.
- **Audio Playback Zero-Latency Rules (7-Stage Native CPAL + Web Audio Fallback)**:
  - `soundController.playClick()` dan `soundController.playError()` WAJIB bersifat sinkron *fire-and-forget* tepat setelah `controller.handleKeyDown(e)` selesai dieksekusi di `TypingArena.svelte`, tanpa `queueMicrotask` dan tanpa `await` di dalam keydown path.
  - Pada aplikasi desktop Tauri v2, pemutaran suara ketikan ditangani secara native oleh backend Rust CPAL (`src-tauri/src/audio/device.rs`, `mixer.rs`, `engine.rs`) melalui 64-Voice Real-Time Mixer bebas alokasi memori (*zero-allocation hot path*), buffer latensi rendah (`BufferSize::Fixed(256.clamp(min, max))`), dan limiter rational soft-clip (`(x / (1.0 + |x|)) * 1.5`) yang mendukung rentang volume `[0.0, 2.0]` (0–200% boost) tanpa distorsi.
  - **DILARANG KERAS `HTMLAudioElement` Pool**: Dilarang menggunakan `new Audio()` atau elemen audio HTML5 untuk suara ketikan. Di WebKitGTK Linux/Tauri v2, setiap elemen `HTMLAudioElement` memicu pipeline GStreamer `playbin` terpisah yang membocorkan thread, menyebabkan lonjakan CPU parah, input delay 50–80ms, dan potensi crash.
  - **Integritas Speaker Eksternal & Hot-Swapping 2-Arah (Bluetooth A2DP, USB DAC, 3.5mm, Wi-Fi)**: Backend Rust CPAL menjaga sub-audible TPDF keep-alive dither (-88 dBFS) selama 30 detik pasca-ketukan agar DAC/Bluetooth A2DP tidak masuk sleep-standby, serta menjalankan supervisor loop non-blocking (`audio_rebuild_stream`) yang memigrasikan stream secara otomatis saat `host.default_output_device()` berubah tanpa perlu restart aplikasi (lihat `06-audio-system.md`).
  - Pada fallback Web Audio API (`sound-engine.ts` untuk browser/pengujian headless), wajib menggunakan `getSharedAudioContext()` dari `audio-context-provider.ts` tanpa opsi `{ latencyHint: 'interactive' }`.

---

## 5. Batas Anggaran Bundle (Bundle Budget)

Aplikasi memiliki pengujian kepatuhan otomatis yang dijalankan via `pnpm run check:budget`:

| Kategori Bundle | Batas Maksimal | Status Aktual |
| :--- | :--- | :--- |
| **Initial JS (Gzip)** | `<= 150.00 KB` | ~115.00 KB ✓ |
| **Initial CSS (Gzip)** | `<= 32.00 KB` | ~31.12 KB ✓ |
| **Lazy Route Chunks (Gzip)** | `<= 60.00 KB` per chunk | Semua route chunk <= 26 KB ✓ |
| **Word lists + Quotes Chunk** | `<= 3.00 MB uncompressed` | ~0.24 MB (97.69 KB gzip) ✓ |

*Aturan*: Selalu ukur dampak ukuran bundle sebelum dan sesudah perubahan signifikan dengan menjalankan `pnpm build && pnpm run check:budget`. Chunk data kamus dan kutipan (`text-tools`) diisolasi secara khusus pada batas anggaran 3 MB uncompressed dan tidak boleh tercampur dengan *lazy route chunks*.
