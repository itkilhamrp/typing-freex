# 📜 Typing FreeX — Quotes Content Packs

Dokumentasi arsitektur, panduan kontribusi, dan tata kelola direktori kutipan (*Quotes Content Packs*) pada Typing FreeX.

---

## 🧭 Struktur Direktori & Taksonomi Domain

Semua paket kutipan dimuat secara luring (*strictly offline*) dan dinamis oleh `src/core/text-tools/quote-loader.ts` melalui Vite `import.meta.glob`.

```text
content-packs/quotes/
├── _list.json                  # Manifest sentral registrasi seluruh paket kutipan
├── README.md                   # Panduan ini
├── EN/                         # Kutipan Bahasa Inggris (short, medium, long, thicc, special)
├── ID/                         # Kutipan Bahasa Indonesia (short, medium, long, thicc, special)
├── ES/, FR/, DE/, IT/, PT/     # Bahasa-bahasa Eropa Barat & Latin
├── NL/, RU/, PL/, TR/, VI/     # Bahasa Belanda, Rusia, Polandia, Turki, Vietnam
├── JA/, ZH/, KO/               # Bahasa Asia Timur (Romaji, Pinyin, Romaja)
└── LA/, AF/                    # Bahasa Latin Klasik & Afrikaans
```

> [!NOTE]
> Paket konten teknis (DevOps, CLI, basis data, dan bahasa pemrograman) telah dipisahkan ke repositori konten mandiri di [`content-packs/tech/`](../tech/).

---

## 🏛️ Taksonomi Domain: Quotes vs Tech Mode

Mulai versi 2.1+, antarmuka pengetikan memisahkan kutipan sastra/bahasa dan materi teknis ke dalam dua mode independen:

### 1. 📜 Mode `Quote` (`content-packs/quotes/`, `category: "quote"`)
- **Fokus**: Murni kutipan sastra, filsafat, peribahasa, dan teks bahasa dari berbagai negara (`EN/`, `ID/`, `ES/`, `FR/`, `DE/`, `IT/`, `PT/`, `NL/`, `RU/`, `JA/`, `PL/`, `TR/`, `VI/`, `LA/`, `ZH/`, `KO/`, `AF/`).
- **Isolasi Penuh**: Mode ini dan mode acak (*RANDOM*) di dalamnya terisolasi sepenuhnya dari potongan kode dan sintaks komputasi.

### 2. 🖥️ Mode `Tech` (`content-packs/tech/`, `category: "tech"`)
- **Fokus**: Semua konten teknologi informasi, mandiri di [`content-packs/tech/`](../tech/), mencakup infrastruktur, pemrograman, dan algoritma:
  - **`INFRA/`** (*Tech Infrastructure & Systems*): DevOps, sistem operasi, CLI, basis data, dan idiom pustaka standar (18 berkas / 180 kutipan terkunci untuk kompatibilitas unit test `allTech.length === 180`).
  - **`CODE/`** (*Programming Languages & Algorithms*): Pengetikan algoritma 1k (`tiers/`) dan bahasa pemrograman modern/spesialisasi (`spesial/` seperti Rust, Kotlin, Swift, Zig, Kubernetes, dll).

---

## 📋 Skema & Format Kutipan JSON

Setiap berkas kutipan wajib berupa array JSON valid tanpa AI slop:

```json
[
  {
    "text": "Konten teks kutipan atau potongan kode program yang valid dan bersih.",
    "source": "Nama Penulis atau Deskripsi Konteks Kode"
  }
]
```

### Klasifikasi Panjang Kutipan Otomatis
Mesin pengetikan Typing FreeX secara otomatis mengklasifikasikan kutipan ke dalam filter panjang di UI:
- **`short`**: $\le 100$ karakter
- **`medium`**: $\le 250$ karakter
- **`long`**: $\le 600$ karakter
- **`thicc`**: $> 600$ karakter

---

## ⚙️ Cara Menambahkan Bahasa atau Varian Baru

1. Buat berkas JSON di folder bahasa terkait (misal: `content-packs/quotes/ES/short/frases.json`).
2. Daftarkan entri baru di `content-packs/quotes/_list.json`:
   ```json
   {
     "code": "spanish_frases",
     "folder": "ES",
     "file": "frases.json",
     "name": "Spanish Frases",
     "nativeName": "Frases Célebres en Español",
     "flag": "🇪🇸",
     "aliases": ["es_frases"]
   }
   ```
3. Jalankan verifikasi otomatis:
   ```bash
   pnpm test && pnpm typecheck && pnpm lint && pnpm run check:i18n && pnpm run check:budget
   ```
