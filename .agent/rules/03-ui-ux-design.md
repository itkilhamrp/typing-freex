<!-- Prinsip desain UI/UX, integrasi Skeleton UI v5, hierarki Layer Economy, dan larangan AI slop visual -->
# 03 — UI/UX Design System & Skeleton Guidelines

Dokumen ini mengatur estetika visual, pemanfaatan Skeleton UI v5, token warna, dan batasan anti-gimmick (AI slop).

---

## 1. Filosofi Estetika: Minimalis, Bersih, dan Premium

Typing FreeX mengadopsi estetika desktop modern yang datar (*flat*), tenang, dan elegan:
- **Pemisahan Area**: Pisahkan zona antarmuka menggunakan **spasi (spacing)**, **kontras surface material**, dan **hierarki tipografi** — BUKAN menggunakan outline tebal atau border dekoratif.
- **Responsivitas**: Diutamakan untuk layar desktop dan tablet (minimum viewport lebar 360px hingga layar monitor 4K).
- **Ukuran Sentuh & Klik**: Target sentuh/klik interaktif minimal memiliki tinggi **`44px`** (`min-h-[44px]`).
- **Layout Terstruktur**: Gunakan kombinasi CSS Grid dan Flexbox standar Tailwind dengan breakpoint responsif (`sm:`, `md:`, `lg:`).

---

## 2. Prinsip Layer Economy & Material

Antarmuka dibangun dengan 3 lapisan visual untuk mempertahankan performa GPU optimal:
1. **Layer 1 — Canvas (`bg-tt-bg` / `var(--tt-bg)`)**:
   - Latar belakang dasar aplikasi.
2. **Layer 2 — Content Surfaces (`bg-tt-surface`, `bg-tt-surface-2`, `bg-tt-surface-elevated`)**:
   - Permukaan material solid/semi-opak untuk kartu konten, form input, daftar profil, arena ketik, dan tabel analitik.
3. **Layer 3 — Floating Chrome (`bg-tt-surface-elevated` / `border-tt-separator`)**:
   - Header aplikasi, modal/dialog, toast, popover, dan panel kontrol terapung.

---

## 3. Komponen Bersama Skeleton UI v5

Selalu utamakan komponen yang telah dibungkus di `src/lib/shared/ui/`:
- **Tombol**: `<AppButton>` (varian: `tonal`, `filled`, `outline`, `ghost`).
- **Kartu**: `<AppCard>`, `<AppKpiCard>` dengan surface elevation yang tenang.
- **Dialog & Modal**: `<AppDialog>`, `<AppConfirmDialog>`, `<AppTypeConfirmDialog>`.
- **Segmented Control**: `<AppSegmented>`, `<AppSegmentedButton>`.
- **Input & Slider**: `<AppListInput>`, `<AppSearchbar>`, `<AppRange>`, `<AppToggle>`.
- **Seleksi**: `<AppSelect>`, `<AppChip>`.
- **Badge Status**: `<AppBadge>` (varian: `success`, `primary`, `muted`, `custom`).

*Aturan*: Jika tidak ada padanan komponen Skeleton yang sesuai, bangun menggunakan elemen semantik HTML native (`<button>`, `<input>`, `<article>`) dipadukan dengan token kelas `*-tt-*`.

---

## 4. Tema Terpusat & Token Warna

- **Tema Tunggal**: Dipasang pada tag root HTML via atribut `data-theme="cerberus"`.
- **Mode Gelap & Terang**: Didukung penuh melalui sinkronisasi kelas `.dark` dan `data-mode="dark"|"light"`.
- **Penggunaan Token**:
  - Warna wajib merujuk ke token semantik (`var(--tt-primary)`, `var(--tt-surface)`, `var(--color-status-red)`).
  - Dilarang keras meng-hardcode warna hex arbitrary (misal: `#3b82f6` atau `bg-blue-500 hover:bg-blue-600`) langsung di komponen.

---

## 5. Larangan Keras Gimmick Visual (Anti AI-Slop)

Untuk menjaga aplikasi tetap cepat dan terasa seperti perangkat lunak desktop profesional:
- **Dilarang** gradient pelangi atau gradasi latar belakang yang menyolok.
- **Dilarang** efek glassmorphism/blur berat (`backdrop-filter: blur(...)`) yang membebani rasterisasi GPU saat scrolling.
- **Dilarang** bayangan tebal/kasar (*heavy drop-shadows*).
- **Dilarang** animasi dekoratif melayang (*floating/bouncing idle animations*).
- **Dilarang** animasi idle berulang (`animate-pulse`, `animate-bounce`, dsb.) pada indikator status atau elemen non-loading.
- **Dilarang** formula AI-slop pada badge/tag: outline tipis dengan background transparan keruh (`border border-color/20-40 bg-color/10-20 rounded-full`). Desain badge wajib solid tanpa border (`border-0`), menggunakan preset resmi Skeleton UI v5 (`preset-filled-*`) atau flat surface tone (`bg-tt-surface-2`).
- **Dilarang** membuat ad-hoc inline badge/pill `<span>` dengan kombinasi utilitas arbitrary copy-paste. Gunakan komponen `<AppBadge>` terstandarisasi dari `#lib/shared/ui`.
- **Standar Pola Layout Header & Prestige Typography (Result View)**:
  - *Minimalist Title Accent*: Tingkat kesulitan hardcore (`Expert` dan `Master`) wajib disajikan secara murni tipografi berukuran besar (`text-xl sm:text-2xl font-mono font-bold tracking-wider`) sebagai aksen judul (`· EXPERT` / `· MASTER`) menyatu di samping judul status, TANPA ikon dekoratif dan TANPA kotak card/pill. Posisi vertikal judul status wajib selalu konsisten di koordinat puncak antara mode normal dan mode hardcore.
  - *Anti-Bleed Status*: Kegagalan tes (`Test Failed`) tidak boleh mewarnai aksen teks tingkat kesulitan dengan warna alert/warning. Tingkat kesulitan adalah pilihan mode pemain, bukan indikator kesalahan.
  - *Dedicated Secondary Attribution*: Sumber kutipan/penulis dilarang digabung dalam baris yang sama dengan tag mode/bahasa. Wajib menggunakan baris kedua tersendiri agar baris pertama tidak berdesakan 3–4 pill dan tidak merusak estetika saat dibagikan/screenshot.
- **Dilarang** menaruh emoji atau ikon acak tanpa fungsi interaksi atau status yang jelas.
- **Dilarang** teks pengisi sembrono (*placeholder slop*).

---

## 6. Animasi & Aksesibilitas (A11y)

- **Animasi Fungsional Saja**: Durasi transisi singkat (100–200ms), hanya animasikan properti GPU-friendly (`transform`, `opacity`).
- **Prefers-Reduced-Motion**: Wajib menghormati preferensi pengguna tanpa animasi berlebih (`@media (prefers-reduced-motion: reduce)`).
- **Keyboard Navigation**: Setiap elemen interaktif harus memiliki fokus yang jelas dan dapat diakses dengan keyboard (`Tab`, `Enter`, `Escape`).
- **Label & Kontrol**: Setiap form input wajib memiliki asosiasi label yang valid (`<label for={id}>`).

---

## 7. Standar Aksesibilitas (WCAG 2.2 Level AA)

Semua komponen UI di Typing FreeX **WAJIB** memenuhi kriteria WCAG 2.2 Level AA sebagai standar minimum tanpa toleransi regresi:

1. **Kontras Warna (1.4.3 & 1.4.11)**:
   - Teks normal: rasio kontras minimum **4.5:1** terhadap latar belakang langsung.
   - Teks besar/tebal (≥ 14pt bold): rasio kontras minimum **3:1**.
   - Komponen non-teks antarmuka (batas border, ikon status fungsional): rasio kontras minimum **3:1**.
   - Dilarang keras mengandalkan opasitas sangat rendah (<50%) pada teks atau ikon yang menyampaikan informasi status.

2. **Tidak Mengandalkan Warna Semata (1.4.1)**:
   - Setiap indikator status visual yang dibedakan oleh warna WAJIB disertai indikator pendukung kedua: teks deskriptif eksplisit, ikon semantik, atau pola grafis terpisah.

3. **Semantik & Screen Reader (4.1.2)**:
   - Ikon yang mendampingi teks deskriptif wajib ditandai `aria-hidden="true"` untuk mencegah pengumuman ganda pada screen reader.
   - Elemen status dinamis (seperti counter mastered yang berubah saat pengujian) wajib menggunakan `role="status"` agar perubahan terbaca secara live.

4. **Kepatuhan Gerak & Transisi (2.3.1)**:
   - Semua transisi CSS wajib menghormati `motion-safe:` agar pengguna dengan gangguan vestibular terlindungi sepenuhnya.
   - Dilarang keras menggunakan kedipan berulang atau pulsating effect pada chip/badge.

5. **Skalabilitas Teks (1.4.4)**:
   - Ukuran font dan padding badge/chip menggunakan unit relatif (`rem`) sehingga dapat diskalakan hingga 200% tanpa terjadi layout breaking atau teks terpotong (*text truncation*).

---

## 8. Isolasi Modul Mode Select (`src/lib/modules/mode-select/`)

Halaman Mode Select menggunakan layout **edge-to-edge horizontal ribbon chevron** terinspirasi menu konsol PS2:
- **Layout & Edge-Docking (Tanpa Margin Horizontal)**: 3 ribbon horizontal bertumpuk vertikal dengan pola zigzag stagger (kiri-kanan-kiri). Kontainer `.mode-select-page` dan `.mode-ribbon-stage` wajib bebas dari padding/margin horizontal (`padding-left: 0; padding-right: 0; max-width: none`) agar ribbon `Classic` dan `Games` (`stagger-left`) menempel mentok 100% ke sisi kiri layar, dan ribbon `Learning` (`stagger-right`) menempel mentok 100% ke sisi kanan layar. Setiap ribbon berbentuk chevron (ujung kanan lancip untuk `stagger-left`, ujung kiri lancip untuk `stagger-right`) via CSS `clip-path: polygon()`, dengan pangkal siku (`border-radius: 0`) yang menyatu dengan tepi layar.
- **Orchestrator**: `ModeSelectView.svelte` hanya mengorkestrasi keyboard navigation (↑↓/←→), routing, dan state fokus. Tidak mengimpor store domain lain.
- **Presentasi**: `ModeRibbon.svelte` adalah komponen ribbon tunggal terisolasi yang menerima konfigurasi via `$props()`. DILARANG mengimpor store secara langsung.
- **Type**: `mode-select-types.ts` menyimpan kontrak tipe murni (`ModeConfig`, `RibbonFocusState`) tanpa runtime dependency.
- **Data Art**: `ascii-art-data.ts` menyimpan data ASCII art landscape 128×42. DILARANG mengubah data art tanpa persetujuan.
- **CSS**: Stylesheet terpisah per layer — `ModeSelectView.css` (page layout, backdrop, header) vs `ModeRibbon.css` (ribbon shape, animation, interaction). DILARANG mencampurkan class ribbon ke dalam stylesheet page atau sebaliknya, dan DILARANG menambahkan margin/padding kiri-kanan pada `.mode-ribbon-stage` yang memisahkan pangkal ribbon dari tepi layar.
- **Animasi**: Hanya GPU-friendly properties (`transform`, `opacity`, `filter`). Menggunakan teknik *pre-bleed* (`translateX(-10px)` pada `stagger-left` dan `translateX(10px)` pada `stagger-right` saat idle, lalu `translateX(0)` saat hover/focus) agar saat meluncur pangkal ribbon tidak pernah meninggalkan celah dari sisi layar. Wajib menghormati `prefers-reduced-motion: reduce`.
- **Aksesibilitas**: Setiap ribbon memiliki `role="button"`, `tabindex={0}`, `aria-label`, dan `focus-visible` ring. Keyboard ↑↓/←→ navigasi siklis + Enter/Space select + Escape back.


