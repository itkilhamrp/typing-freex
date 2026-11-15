# 🖥️ Typing FreeX — Tech & Code Content Packs

Dokumentasi arsitektur, panduan kontribusi, dan tata kelola direktori konten teknologi (*Tech Content Packs*) pada Typing FreeX.

---

## 🧭 Struktur Direktori & Taksonomi Domain

Semua paket materi teknologi dimuat secara luring (*strictly offline*) dan dinamis oleh `src/core/text-tools/quote-loader.ts` melalui Vite `import.meta.glob`.

```text
content-packs/tech/
├── _list.json                  # Manifest sentral registrasi seluruh paket materi teknologi
├── README.md                   # Panduan ini
├── INFRA/                      # 🖥️ Tech Infrastructure & Systems (>= 18 berkas)
│   └── spesial/                # Docker, Podman, NGINX, Linux CLI, Git, Bash, SQL, Core Languages
└── CODE/                       # ⚡ Programming Languages & Algorithms
    ├── tiers/                  # Algoritma 1k (Quicksort, Binary Search, Trees, Concurrency)
    └── spesial/                # Bahasa modern (Kotlin, Swift, Dart, C#, Zig, Elixir, Scala, PowerShell, R, Web specs, k8s, vim)
```

---

## 🏛️ Taksonomi Domain: Mode Tech (`category: "tech"`)

Mode `Tech` didedikasikan secara independen untuk pengetikan dan latihan sintaks rekayasa perangkat lunak serta administrasi sistem dengan kurikulum berjenjang yang bervariasi (**Short, Medium, Long, dan Thicc**):

1. **`INFRA/`** (*Tech Infrastructure & Systems*):
   - DevOps, web server/reverse proxy (NGINX), containerization (Docker, Podman Quadlet), sistem operasi (GNU/Linux CLI coreutils), sistem kendali versi (Git), basis data relasional/embedded (MariaDB, SQLite, PostgreSQL), dan pustaka standar bahasa inti.
   - Bersifat dinamis dan kaya (masing-masing berkas memuat >= 10 kutipan bervariasi panjangnya).
   - Setiap berkas disusun secara berjenjang dari fondasi kanonikal (Hello World & perintah dasar) hingga arsitektur sistem tingkat lanjut (konkurensi, snapshot, reverse proxy load balancing).

2. **`CODE/`** (*Programming Languages & Algorithms*):
   - **`tiers/`**: Algoritma dan struktur data 1k (Python, TypeScript, JavaScript, Rust, Go, C, C++, Bash, Java, PHP, SQL).
   - **`spesial/`**: Bahasa pemrograman modern dan manifest konfigurasi (Kotlin, Swift, Dart, C#, Ruby, Lua, Zig, Elixir, Haskell, Scala, PowerShell, R, HTML/CSS, JSON/YAML, Markdown, Kubernetes, Neovim/Vim).
   - Setiap berkas memuat cuplikan autentik pembuka "Hello World" yang berprogresi ke konstruksi mutakhir (async streams, pattern matching, metaprogramming, memory-efficient structs).

---

## 🗺️ Distribusi Variasi Panjang Teks

Setiap berkas materi memuat spektrum panjang kode yang seimbang untuk melatih ritme pengetikan pengguna:

| Kategori | Karakteristik Baris | Contoh Materi |
| :--- | :--- | :--- |
| **Short** | 1–2 baris | `println!("Hello, World!");`, deklarasi variabel, command flags cepat |
| **Medium** | 3–5 baris | Fungsi utilitas, error checking, lambda predicate, struct ringan, filter stream |
| **Long** | 6–9 baris | Generic pipeline, async retry, pattern matching switch, multi-stage stage cache |
| **Thicc** | 10–18 baris | Concurrency worker pool, actor mailbox, circular ring buffer, stateful Quadlet |

---

## 📋 Skema & Format Kutipan JSON

Setiap berkas materi wajib berupa array JSON valid tanpa AI slop dengan atribut `source` yang bersih dan profesional:

```json
[
  {
    "text": "fn main() {\n    println!(\"Hello, World!\");\n}",
    "source": "Rust: Canonical Hello World entrypoint"
  }
]
```
