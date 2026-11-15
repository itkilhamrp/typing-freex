<!-- Spesifikasi teknologi resmi, penguncian versi, larangan keras dependensi, dan aturan penambahan library -->
# 01 — Tech Stack & Dependency Governance

Dokumen ini mendefinisikan tech stack resmi proyek, batasan versi, larangan dependensi, serta tata kelola penambahan pustaka.

---

## 1. Tabel Teknologi & Versi Resmi

Semua versi diambil langsung dari `package.json`, `Cargo.toml`, dan konfigurasi build nyata:

| Kategori | Paket / Teknologi | Versi Resmi | Catatan Teknis |
| :--- | :--- | :--- | :--- |
| **Desktop Shell** | Tauri CLI & API | `^2.12.4` / `^2.12.4` | Pola Brownfield luring, CSP ketat, `@tauri-apps/plugin-dialog@^2.8.4`. |
| **Frontend Core** | Svelte | `^5.57.3` | Menggunakan arsitektur Runes murni (`$state`, `$derived`, `$props`, `$effect`, snippets). |
| **App Framework** | SvelteKit | `3.0.0` | Static SPA mode (`adapter-static@4.0.1`), subpath imports (`#lib/*`). |
| **Build & Bundler**| Vite | `^8.3.8` | Zero `svelte.config.js` (konfigurasi terpusat di `vite.config.ts`). |
| **Design System** | Skeleton UI Svelte | **`5.0.1` (Terkunci)** | `@skeletonlabs/skeleton` & `@skeletonlabs/skeleton-svelte`, tema `cerberus`. |
| **Utility CSS** | Tailwind CSS | `^4.3.5` | `@tailwindcss/vite` plugin resmi, konfigurasi deklaratif berbasis CSS di `src/app.css`. |
| **Ikonografi** | Phosphor Icons | `^3.1.1` | `phosphor-svelte` dengan named imports wajib (SF Symbols desktop alignment). |
| **Audio Engine** | Rust CPAL + ZzFX | `cpal@0.18.2` / `^1.4.0` | `features = ["pulseaudio"]` (mendukung PulseAudio, `pipewire-pulse`, & ALSA tanpa header `libpipewire-0.3-dev`) + Web Audio fallback. |
| **Database** | SQLite (Rust) | `rusqlite@0.41.1` (Bundled) | Arsitektur Dual-DB (`registry.db` & `profiles/<uuid>/typing_freex.db`) dengan pipa migrasi UNIX. |
| **Typecheck** | svelte-check & TS | `^4.7.8` / `^6.0.3` | Mode ketat (`strict: true`) tanpa tipe `any`. |
| **Testing** | Vitest | `^5.1.0` | DOM runner `happy-dom@^21.0.4`, property-based testing `fast-check@^3.23.2`. |
| **Package Mgr** | PNPM | `12.11.2` (`>=10.0.0`) | Ditegakkan lewat script `enforce-pnpm.mjs` di tahap `preinstall`. |
| **MCP Dev Bridge**| `tauri-plugin-hushlor-mcp-bridge` | Dev-Only (`mcp-dev`) | Bridge WebSocket MCP untuk AI inspection (`mcp-dev` Cargo feature). **Dilarang keras masuk rilis**. |

---

## 2. Ketentuan Khusus UI Stack

### Skeleton UI v5.0.1 (Kunci Mutlak)
- **WAJIB**: Skeleton UI dikunci pada versi `5.0.1`. **Dilarang keras melakukan downgrade** ke v2/v3.
- **Rujukan Dokumentasi**: Selalu ikuti dokumentasi resmi Skeleton v5: [https://www.skeleton.dev/docs/svelte/get-started/introduction](https://www.skeleton.dev/docs/svelte/get-started/introduction).
- Komponen dibungkus dalam abstraksi bersama di `src/lib/shared/ui/` (`AppButton`, `AppCard`, `AppDialog`, `AppRange`, `AppSegmented`, dll.).

### Tailwind CSS v4 (Arsitektur CSS Murni)
- **Konfigurasi Berbasis CSS**: Tailwind v4 dikonfigurasi melalui arahan `@import "tailwindcss";` dan `@theme` di dalam `src/app.css`.
- **Dilarang**:
  - Dilarang membuat atau mengembalikan file konfigurasi `tailwind.config.js` atau `tailwind.config.ts` gaya v3.
  - Dilarang menambahkan PostCSS ganda atau plugin `@tailwindcss/postcss`.
  - Dilarang membuat safelist kelas CSS yang besar.
  - Minimalkan penggunaan `@apply`; utamakan utilitas modular atau token CSS native.

---

## 3. Daftar Larangan Keras (Blacklist)

Setiap AI agent dan kontributor **DILARANG KERAS** memasukkan atau menggunakan hal berikut:
1. **Konsta UI**: Konsta UI beserta seluruh tema iOS-nya (`k-*`, `k-color-*`) telah **dihapus total** dan tidak boleh dikembalikan.
2. **NPM & Yarn**: Penggunaan perintah `npm` atau `yarn` dilarang. Jangan pernah commit `package-lock.json` atau `yarn.lock`.
3. **Pustaka UI Eksternal Lain**: Dilarang menginstal library UI lain (seperti Flowbite, DaisyUI, Radix, Shadcn port, dll.) tanpa izin tertulis dari pengguna.
4. **Library Ikon Selain Phosphor**: Dilarang menginstal `lucide-svelte`, `font-awesome`, atau icon pack lainnya.

---

## 4. Aturan Penambahan Dependensi Baru

Sebelum menambahkan paket baru ke `package.json` atau `Cargo.toml`:
1. **Justifikasi Tertulis**: Wajib memberikan alasan mengapa fungsionalitas tersebut tidak dapat dibangun dengan dependensi yang sudah ada.
2. **Audit Ukuran Bundle**: Pastikan paket tidak melebihi batas bundle budget (Initial JS `<= 150 KB`, Initial CSS `<= 32.00 KB`, Lazy Chunk `<= 60 KB`).
3. **Kompatibilitas Lisensi**: Lisensi paket wajib permisif (MIT, Apache 2.0, BSD) dan kompatibel dengan lisensi proyek `AGPL-3.0-only`.
4. **Persetujuan Pengguna**: Wajib meminta persetujuan eksplisit dari pengguna sebelum menjalankan `pnpm add` atau `cargo add`.
5. **Isolasi Penuh Dependensi Development/AI**: Dependensi pembantu inspeksi seperti AI MCP bridge (`tauri-plugin-hushlor-mcp-bridge`) WAJIB ditandai `optional = true` di Cargo, diisolasi di bawah cargo feature terpisah (misalnya `mcp-dev`), dan tidak boleh disertakan pada default features maupun profil rilis.

---

## 5. Lisensi Resmi & Tata Kelola Lisensi (AGPL v3)

- **Lisensi**: Proyek ini secara resmi dan mutlak dilisensikan di bawah **GNU Affero General Public License Version 3 (`AGPL-3.0-only`)**.
- **Integritas Lisensi**: Dilarang melakukan relisensi, penurunan lisensi (*downgrade*), atau menambahkan kode berlisensi yang tidak kompatibel dengan `AGPL-3.0-only`. Seluruh kontribusi dan artefak baru otomatis terikat di bawah `AGPL-3.0-only`.
