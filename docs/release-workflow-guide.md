# Panduan Rilis CI/CD GitHub Actions & Dokumentasi Artefak

Dokumen ini menjelaskan alur operasional pembuatan rilis aplikasi desktop **Typing FreeX** melalui pipeline GitHub Actions ([`.github/workflows/release.yml`](../.github/workflows/release.yml)), rincian berkas artefak yang dihasilkan di halaman GitHub Release, serta konvensi penamaannya.

---

## 🧭 Ikhtisar Pipeline Rilis

Workflow rilis Typing FreeX beroperasi secara otomatis saat ada tag versi baru (`v*`) yang di-push ke repositori GitHub. Pipeline dirancang dengan prinsip **Linus's Law** ("jangan rilis kode yang rusak") dan **Reproducible Builds**:

```text
Git Tag Push (v*.*.*)
        │
        ▼
┌────────────────────────────────────────────────────────┐
│ Job 1: Pre-release Quality Gate (validate)             │
│ - Fail on foreign lockfiles (PNPM only)                │
│ - pnpm lint, typecheck, check:i18n, test               │
│ - cargo check, clippy, test                            │
│ - pnpm build & check:budget                            │
└────────────────────────────────────────────────────────┘
        │
   (Hanya jika lulus 100%)
        ▼
┌────────────────────────────────────────────────────────┐
│ Job 2: Build & Package Desktop Release (matrix)        │
│                                                        │
│  ├─► Runner Linux (ubuntu-24.04):                      │
│  │    • Tauri build: DEB & AppImage                    │
│  │    • Flatpak build: typing-freex.flatpak            │
│  │    • Generate & Upload SHA256SUMS-linux.txt         │
│  │                                                     │
│  └─► Runner Windows (windows-2022):                    │
│       • Tauri build: NSIS Installer .exe & .msi        │
│       • Generate & Upload SHA256SUMS-windows.txt       │
└────────────────────────────────────────────────────────┘
        │
        ▼
GitHub Releases (Aset biner, kemasan, dan checksums terunggah)
```

---

## 📋 Checklist Persiapan Sebelum Memicu Rilis

Sebelum membuat tag rilis baru, pastikan keselarasan nomor versi pada berkas-berkas berikut:

1. **[`package.json`](../package.json)**:
   ```json
   "version": "0.1.0"
   ```
2. **[`src-tauri/tauri.conf.json`](../src-tauri/tauri.conf.json)**:
   ```json
   "version": "0.1.0"
   ```
3. **[`src-tauri/Cargo.toml`](../src-tauri/Cargo.toml)**:
   ```toml
   [package]
   version = "0.1.0"
   ```
4. **[`CHANGELOG.md`](../CHANGELOG.md)**: Pastikan catatan perubahan untuk versi tersebut sudah tercatat.

### Verifikasi Lokal Wajib (PNPM)

Jalankan seluruh audit lokal untuk memastikan tidak ada kegagalan pada tahap CI:

```bash
# 1. Validasi frontend & integritas arsitektur
pnpm typecheck
pnpm lint
pnpm test
pnpm run check:i18n
pnpm build
pnpm run check:budget

# 2. Validasi Rust backend
cd src-tauri
cargo check
cargo clippy -- -D warnings
cargo test
cd ..
```

---

## 🚀 Tutorial Memicu Rilis di GitHub

Ikuti langkah-langkah Git standar berikut dari terminal:

### Langkah 1: Pastikan Status Git Bersih & Ter-push ke Branch Utama

```bash
git status
# Pastikan tidak ada berkas yang tertinggal, commit perubahan jika ada
git add .
git commit -m "chore(release): prepare v0.1.0"
git push origin main
```

### Langkah 2: Buat Tag Git Beranotasi (Annotated Tag)

Format penamaan tag **WAJIB** diawali huruf `v` diikuti semver, contoh: `v0.1.0`, `v1.0.0`, `v1.2.3`:

```bash
git tag -a v0.1.0 -m "Release Typing FreeX v0.1.0"
```

### Langkah 3: Push Tag ke GitHub

```bash
git push origin v0.1.0
```

> [!NOTE]
> Perintah push tag di atas akan otomatis mengaktifkan workflow `.github/workflows/release.yml` di GitHub Actions.

### Langkah 4: Pantau Proses Build

1. Buka repositori Anda di GitHub melalui browser.
2. Klik tab **Actions**.
3. Pilih workflow **Release** yang sedang berjalan.
4. Anda akan melihat dua tahap:
   - `Pre-release Quality Gate` (berjalan terlebih dahulu ~2-3 menit).
   - `Build & Package Desktop Release (Linux)` dan `(Windows)` berjalan paralel setelah gate lulus (~8-15 menit).

---

## 📦 Berkas Hasil Rilis di GitHub Release

Setelah pipeline selesai, GitHub Release akan dibuat secara otomatis dengan daftar aset biner berikut:

### 1. Berkas untuk Platform GNU/Linux

| Nama Berkas Artefak | Format / Tipe | Kompatibilitas Distro | Keterangan |
| :--- | :--- | :--- | :--- |
| `typing-freex.flatpak` | Flatpak Single-File Bundle | **Universal** (Fedora, Arch, Debian, Ubuntu, openSUSE, SteamOS, NixOS, dll.) | Kemasan terisolasi (sandbox) dengan runtime GNOME 47. Sangat direkomendasikan untuk seluruh distro Linux modern. |
| `Typing FreeX_0.1.0_amd64.AppImage` | Standalone AppImage | Ubuntu 20.04+, Debian 11+, Fedora, Arch, Linux Mint | Binary mandiri portable tanpa instalasi root (cukup `chmod +x`). |
| `typing-freex_0.1.0_amd64.deb` | Debian Package (`.deb`) | Debian, Ubuntu, Linux Mint, Pop!_OS, Zorin OS | Paket installer resmi sistem berbasis APT (`sudo dpkg -i`). |
| `SHA256SUMS-linux.txt` | Plain Text Checksum | Semua distro Linux | Memuat hash kriptografis SHA256 untuk seluruh berkas artefak Linux di atas. |

### 2. Berkas untuk Platform Microsoft Windows

| Nama Berkas Artefak | Format / Tipe | Kompatibilitas OS | Keterangan |
| :--- | :--- | :--- | :--- |
| `Typing FreeX_0.1.0_x64-setup.exe` | NSIS Setup Installer | **Windows 10 & Windows 11** (64-bit) | Installer desktop utama dengan *offline WebView2 installer* tersemat. Dapat dipasang tanpa koneksi internet. |
| `Typing FreeX_0.1.0_x64_en-US.msi` | Windows Installer MSI | **Windows 10 & Windows 11** (64-bit Enterprise/Domain) | Cocok untuk deployment skala korporasi, lab sekolah, atau Active Directory GPO. |
| `Typing FreeX_0.1.0_x64.nsis.zip` *(opsional)* | ZIP Archive Portable | Windows 10 & Windows 11 | Arsip direktori instalasi NSIS portabel. |
| `SHA256SUMS-windows.txt` | Plain Text Checksum | Semua edisi Windows | Memuat hash kriptografis SHA256 untuk seluruh berkas installer Windows di atas. |

### 3. Berkas Kode Sumber (Otomatis dari GitHub)

- `Source code (zip)`: Arsip snapshot repository pohon rilis format ZIP.
- `Source code (tar.gz)`: Arsip snapshot repository pohon rilis format Tarball Gzip.

---

## 🏷️ Rumus Konvensi Penamaan Berkas (Naming Conventions)

Penamaan berkas mengikuti standar baku desktop packaging:

```text
[NamaAplikasi]_[Versi]_[Arsitektur].[Ekstensi]
```

- **Nama Aplikasi**: Diambil dari `productName` di `tauri.conf.json` (`Typing FreeX`) atau `package.name` di `Cargo.toml` (`typing-freex` / `typing_freex`).
- **Versi**: Mengikuti format Semantic Versioning `MAJOR.MINOR.PATCH` (misal: `0.1.0`).
- **Arsitektur**: `amd64` (Linux x86_64) atau `x64` (Windows 64-bit).
- **Kemasan Flatpak**: Diberi nama deterministik `typing-freex.flatpak`.

---

## 🛡️ Cara Memverifikasi Integritas Checksum (Integritas Rilis)

Pengguna atau administrator dapat memverifikasi bahwa file unduhan tidak mengalami kerusakan atau manipulasi transmisi jaringan:

### Pada GNU/Linux

Unduh file installer dan `SHA256SUMS-linux.txt` ke dalam satu folder yang sama, lalu jalankan:

```bash
sha256sum --check --ignore-missing SHA256SUMS-linux.txt
```

Hasil yang valid akan menampilkan:
```text
typing-freex_0.1.0_amd64.flatpak: OK
Typing FreeX_0.1.0_amd64.AppImage: OK
typing-freex_0.1.0_amd64.deb: OK
```

### Pada Windows (PowerShell)

Unduh installer (misalnya `Typing FreeX_0.1.0_x64-setup.exe`) dan periksa hash SHA256-nya:

```powershell
Get-FileHash -Algorithm SHA256 ".\Typing FreeX_0.1.0_x64-setup.exe"
```

Bandingkan output string hash dengan isi dari berkas `SHA256SUMS-windows.txt`.

---

## 💻 Panduan Instalasi Cepat untuk Pengguna Akhir

### 1. Memasang Kemasan Flatpak (Linux)

```bash
# Instalasi bundle satu berkas
flatpak install --user ./typing-freex_0.1.0_amd64.flatpak

# Menjalankan aplikasi
flatpak run com.typing_freex.i18n
```

### 2. Menjalankan AppImage (Linux)

```bash
chmod +x "Typing FreeX_0.1.0_amd64.AppImage"
./"Typing FreeX_0.1.0_amd64.AppImage"
```

### 3. Memasang Paket DEB (Debian/Ubuntu)

```bash
sudo dpkg -i typing-freex_0.1.0_amd64.deb
sudo apt-get install -f # Jika ada dependensi sistem yang belum terpenuhi
```

### 4. Memasang di Windows 10/11

1. Klik ganda pada berkas `Typing FreeX_0.1.0_x64-setup.exe`.
2. Ikuti instruksi pada wizard instalasi desktop.
3. Aplikasi siap digunakan luring (*strictly offline*) tanpa memerlukan instalasi WebView2 terpisah.

---

## ❓ Troubleshooting & Penanganan Masalah Rilis

### 1. Bagaimana jika Job `Pre-release Quality Gate` Gagal?
- **Penyebab**: Ada tes yang gagal, peringatan linter, paritas i18n tidak cocok, atau bundle size melebihi anggaran.
- **Tindakan**: Rilis **TIDAK AKAN DIBUAT** (tidak ada draft atau biner yang diunggah). Periksa log kegagalan pada tab Actions, perbaiki kodenya secara lokal, lakukan commit baru, hapus tag lama, dan buat tag baru.

### 2. Cara Menghapus Tag yang Salah / Gagal

Jika tag perlu dibatalkan sebelum atau setelah diperbaiki:

```bash
# Hapus tag lokal
git tag -d v0.1.0

# Hapus tag remote di GitHub
git push --delete origin v0.1.0
```

Setelah perbaikan di-commit ke `main`, buat tag ulang dan push kembali.

### 3. Izin GitHub Token (`403 Resource not accessible`)
Pastikan pada pengaturan repositori GitHub:
- Buka **Settings** -> **Actions** -> **General**.
- Pada bagian **Workflow permissions**, pilih opsi **Read and write permissions**.
- Simpan perubahan.
