<!-- Protokol keselamatan kerja AI agent, pembatasan eksekusi shell, urutan kerja bertahap, dan checklist verifikasi -->
# 05 — Workflow Safety & AI Agent Governance

Dokumen ini mendefinisikan batasan operasional, etika eksekusi shell, alur kerja bertahap, dan verifikasi wajib bagi AI agent.

---

## 1. Urutan Kerja Wajib (Phased Execution)

Setiap AI agent yang menerima instruksi di repositori ini **WAJIB** mengikuti siklus kerja berikut:
1. **Audit & Analisis (Read-Only)**:
   - Baca file terkait secara langsung menggunakan alat inspeksi bawaan IDE.
   - Pahami dependensi dan jangan membuat asumsi sepihak.
2. **Implementation Plan & Berhenti**:
   - Susun rencana perubahan yang jelas, terukur, dan aman.
   - Tampilkan rencana ke pengguna dan **BERHENTI untuk menunggu persetujuan eksplisit**.
3. **Eksekusi Bertahap (Small & Atomic)**:
   - Terapkan perubahan langkah demi langkah.
   - Jangan melakukan modifikasi massal yang tidak terarah (*no arbitrary mass editing*).
4. **Verifikasi Otomatis**:
   - Jalankan checklist pengujian wajib hingga 100% lulus tanpa peringatan.
5. **Laporan Transparan**:
   - Laporkan hasil kerja nyata, file yang diubah, dan bukti verifikasi.

---

## 2. Batasan Eksekusi Terminal & Shell

Untuk mencegah loop tak terbatas (*infinite loops*) dan kerusakan file:
- **DILARANG Alat Manipulasi Teks Bash**: Dilarang memakai `sed`, `awk`, `grep`, `egrep`, `fgrep`, `find`, `perl`, atau `python -c` inline untuk mengedit/mencari teks file. Gunakan fungsi pencarian dan pengeditan native IDE Antigravity.
- **DILARANG Perintah Loop Penjelajah**: Dilarang mengeksekusi perintah eksplorasi (`ls`, `dir`, `cat`, `less`, `head`, `tail`, `stat`) secara berulang-ulang tanpa jeda. Jalankan sekali atau tanyakan pengguna.
- **The One-and-Done Rule**: Jika perintah shell gagal atau tidak menghasilkan output yang diharapkan, **HENTIKAN** eksekusi segera. Jangan memodifikasi parameter dan mencoba ulang secara looping membabi buta. Laporkan log error aslinya ke pengguna.
- **Dilarang Commit Tanpa Instruksi**: Jangan melakukan `git commit` atau `git push` kecuali diminta secara eksplisit oleh pengguna.

---

## 3. Batasan Lingkup Kerja & Anti-Regresi Modular (Scope Governance)

- **Inspeksi Pra-Edit via `codegraph_explore`**: Sebelum mengubah simbol, fungsi, atau komponen, gunakan tool MCP `codegraph_explore` (bila indeks `.codegraph/` tersedia) untuk memeriksa *blast radius* (siapa pemanggil simbol tersebut dan tes apa yang menjaganya) dalam satu panggilan hemat token.
- **Kepatuhan Kontrak Pipa UNIX**: Dilarang mengubah tanda tangan (*signature*) fungsi publik lintas modul, memutasikan store secara acak di komponen anak, atau mencampurkan logika DOM/Svelte ke dalam modul *headless pure-function* (`src/core/**` dan `src/lib/**/logic/**`).
- **Tugas UI = Hanya UI**: Jika tugasnya adalah perbaikan tampilan atau desain, dilarang mengubah state machine, kontrak IPC, skema database, atau kalkulasi core engine.
- **Dilarang Menghapus File di Luar Lingkup**: Jangan menghapus aset, modul, atau tes tanpa persetujuan tertulis.
- **Jika Ragu, Bertanya**: Jika ada ketidaksesuaian antara spesifikasi lama dan kode nyata, jangan menebak. Berikan opsi dan tanyakan ke pengguna.

---

## 4. Checklist Verifikasi Minimal

Setelah seluruh pengeditan selesai, agent **WAJIB** menjalankan gate verifikasi satu kali dan memastikan status **0 error dan 0 warning** (sesuai `AGENTS.md` §5):

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm run check:i18n && pnpm run check:budget
```

Jika perubahan menyentuh kode sumber frontend atau konfigurasi bundler dan `dist/` perlu diperbarui terlebih dahulu untuk audit ukuran bundle, jalankan `pnpm build` atas persetujuan/kebutuhan tugas sebelum `pnpm run check:budget`.

*Prinsip Kegagalan & Integritas i18n*: Hardcoded string bahasa Inggris di dalam template Svelte atau controller dianggap sebagai cacat (*defect*) i18n yang melanggar standar kualitas, meskipun skrip `check:i18n` hanya memvalidasi paritas kunci antar file JSON. Jika build, lint, atau test gagal, **berhenti segera**, pelajari akar masalah, dan laporkan pesan kesalahan asli. Dilarang menambal (*patching*) secara serampangan.

---

## 5. Tata Kelola Inspeksi UI Desktop & AI MCP Bridge

Untuk menginspeksi tampilan antarmuka webview aplikasi desktop Tauri v2 tanpa bergantung pada browser eksternal:
- AI Agent memanfaatkan MCP server `@hypothesi/tauri-mcp-server` yang terhubung ke plugin `tauri-plugin-hushlor-mcp-bridge`.
- Mode inspeksi hanya dijalankan melalui perintah `pnpm tauri:mcp` yang mengaktifkan flag `--features mcp-dev` dan overlay konfigurasi `src-tauri/tauri.conf.mcp.json`.
- Plugin diikat ketat pada `127.0.0.1` (localhost only) demi keamanan.
- **Isolasi Mutlak**: Dilarang menggabungkan konfigurasi dev MCP (`withGlobalTauri: true`, pelonggaran CSP untuk WebSocket) ke dalam file `src-tauri/tauri.conf.json` utama.
- **Bebas Polusi Rilis**: Dilarang menjalankan build produksi (`pnpm build`, `pnpm tauri build`) dengan feature `mcp-dev` aktif.
