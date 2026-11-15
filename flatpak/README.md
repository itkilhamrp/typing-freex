# Typing FreeX — Flatpak Packaging

Direktori ini memuat spesifikasi kemasan Flatpak resmi untuk Typing FreeX (`com.typing_freex.i18n`).

## Arsitektur Kemasan

- **Runtime**: `org.gnome.Platform//47` (Menyediakan WebKitGTK 4.1 dan GTK3 tanpa overhead kompilasi)
- **SDK**: `org.gnome.Sdk//47`
- **Model**: Post-build packaging dari binary Tauri rilis mandiri (`src-tauri/target/release/typing_freex`)
- **Isolasi**: Strictly offline, sandboxed sandbox XDG (data lokal di `~/.var/app/com.typing_freex.i18n/`)

## Cara Membangun Secara Mandiri (Lokal)

```bash
# 1. Pastikan flatpak dan flatpak-builder terpasang
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install --user -y flathub org.gnome.Platform//47 org.gnome.Sdk//47

# 2. Salin binary rilis dan ikon ke folder flatpak/
cp ../src-tauri/target/release/typing_freex typing_freex
cp ../src-tauri/icons/128x128.png icon-128.png

# 3. Bangun repositori dan berkas bundle
flatpak-builder --user --force-clean --repo=repo build-dir com.typing_freex.i18n.yml
flatpak build-bundle repo typing-freex_0.1.0_amd64.flatpak com.typing_freex.i18n

# 4. Uji instalasi bundle
flatpak install --user ./typing-freex_0.1.0_amd64.flatpak
flatpak run com.typing_freex.i18n
```
