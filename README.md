# Typing FreeX — Offline Typing Test Engine

[![License: AGPL-3.0-only](https://img.shields.io/badge/License-AGPL--3.0--only-blue.svg)](LICENSE)
[![Package Manager: PNPM](https://img.shields.io/badge/pnpm-only-orange.svg)](#package-management-strict-pnpm)
[![Framework: Svelte 5 + SvelteKit 3](https://img.shields.io/badge/Svelte%205-Runes%20Architecture-ff3e00.svg)](https://svelte.dev)
[![Desktop Shell: Tauri v2](https://img.shields.io/badge/Tauri%20v2-Rust%20Backend-24c8db.svg)](https://v2.tauri.app)

**Typing FreeX** is a high-performance, desktop-first, strictly offline typing test engine built with **Tauri v2, SvelteKit 3 (Svelte 5 Runes in static SPA mode), and Rust**. It delivers instant startup, sub-millisecond input responsiveness, comprehensive typing metrics (Net WPM, Raw WPM, Accuracy, Consistency), native real-time mechanical keystroke audio via **Rust CPAL**, isolated **Dual-Database SQLite** persistence, a **45+ Tier Endless Overflow Achievement & Trophy Showcase System**, and interactive hand/finger & keymap guidance with zero network telemetry.

The user interface follows a refined desktop-first aesthetic powered by **Skeleton UI v5.0.1**, **Tailwind CSS v4**, and **Phosphor Icons**, structured around a GPU-friendly 3-tier **Layer Economy** (`Canvas -> Solid Content Surfaces -> Floating Chrome`).

---

## ✨ Key Features & Capabilities

- **6 Typing Modes**: Time (`15s`, `30s`, `60s`, `120s`, custom), Words (`10`, `25`, `50`, `100`, custom), Quote (literature across 17 languages), Tech (`INFRA` systems/DevOps/databases & `CODE` algorithms/programming languages), Zen (free-form practice), and Custom Text (with adaptive delta revision history and unified git-style word diffing).
- **Sub-Millisecond Arena & Multi-Line Tape Mode**: Viewport-level stationary/smooth Caret decoupled from CSS track translations (`translate3d(-scrollX, -scrollY, 0)`), supporting both multi-line normal scrolling and a 4-stage UNIX pipeline **Tape Mode** (`letter` and `word` anchoring with strict active-line opacity isolation).
- **7-Stage Native Rust CPAL Audio Engine**: 64-voice real-time lock-free mixer (`src-tauri/src/audio/`) with 27 mechanical click packs and 4 error sound packs, `[0.0, 2.0]` (0–200% boost) volume range protected by an analog-style rational soft-clipping limiter, sub-audible `-88 dBFS` TPDF keep-alive dither for Bluetooth A2DP/USB DACs, and event-driven 2-way hot-swapping across OS default audio outputs (`PipeWire` / `PulseAudio` / `ALSA`), plus a Web Audio API fallback for browser/headless testing.
- **Interactive Keymap & Hand Guide**: Orthogonal visual learning aids (`static`, `react`, `next` modes) with zero-lag imperative DOM pulse feedback (`[data-react="ok"|"err"]`) and ergonomic 10-finger SVG hand posture guidance.
- **Gamification, Achievements & Trophy Showcase**: 17 multi-tier progressive missions (Bronze through Grandmaster 5★ with endless `+N` overflow tiers), rarity-based one-shot advancements, and a 7-slot customizable profile **Trophy Showcase**.
- **Dual-Tier SQLite Persistence & 10-Stage Quarantine Import**: Global registry database (`registry.db`) and isolated per-profile databases (`profiles/<uuid>/typing_freex.db`) managed by a schema-agnostic UNIX migration pipeline, atomic `VACUUM INTO` backups with SHA-256 sidecars, and a 10-stage read-only quarantine validator.

---

## ⚡ Prerequisites

- **Node.js**: `>= 22.17.0` (v22.17+ / v24 LTS required by SvelteKit 3)
- **PNPM**: `>= 10.0.0` (`pnpm@12.11.2` pinned via `packageManager`)
- **Rust**: `stable` (Rust 2024 edition)
- **System Libraries (GNU/Linux)**:
  ```bash
  sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libgtk-3-dev libasound2-dev libpulse-dev
  ```

---

## 📦 Package Management (Strict PNPM)

This repository strictly mandates **PNPM**. Any attempt to run `npm` or `yarn` is blocked by `scripts/enforce-pnpm.mjs`.

```bash
# Install dependencies
pnpm install

# Run frontend web dev server (localhost:1420)
pnpm dev

# Run Tauri v2 desktop app in debug mode
pnpm tauri dev

# Run Tauri v2 desktop app with optimized Rust release profile
pnpm tauri dev --release

# Run Tauri v2 desktop app with AI MCP inspection bridge (dev-only)
pnpm tauri:mcp

# Validate TypeScript & Svelte 5 Runes types (svelte-check)
pnpm typecheck

# Validate ESLint & architectural module boundaries
pnpm lint

# Run Vitest unit, property-based, and conformance test suites
pnpm test

# Validate English/Indonesian i18n key parity (100% parity required)
pnpm run check:i18n

# Build static SPA production bundle & verify strict size budgets
pnpm build
pnpm run check:budget
```

---

## 🏛 Architecture & UNIX Modular Pipelines

Typing FreeX combines **Hierarchical Model-View-Controller (HMVC)** with the **UNIX Philosophy** (*Rule of Modularity*, *Rule of Separation*, *Rule of Composition*) and **Linus's Law** (*clean data structures and strict contract boundaries*) so that modifying one module never causes cascading regressions in another:

```text
typing_freex_svelte_skeletonUI/
├── .agent/rules/          # Mandatory engineering & safety governance (00 through 07)
├── docs/                  # Architecture references & canonical database-schema.md
├── content-packs/         # Strictly offline quotes (17 languages), tech (INFRA & CODE), wordlists, layouts
├── src/
│   ├── core/              # Pure headless TypeScript engine (zero Svelte/DOM/window imports)
│   │   ├── typing-engine/ # State machine, WPM/accuracy/consistency math, TextBuffer, Mulberry32 PRNG
│   │   ├── text-tools/    # Sanitizer, tokenizer, wordlist & quote loader
│   │   ├── hand-guide/    # Finger geometry & key-to-finger mapping
│   │   ├── keymap/        # Pure keystroke validation for Keymap React mode (keymap-react.ts)
│   │   ├── achievements/  # Deterministic mission evaluator & 45+ endless overflow tier system
│   │   └── ipc/           # Type-safe Tauri IPC command contracts
│   ├── lib/
│   │   ├── modules/       # Self-contained feature domains
│   │   │   ├── modes/classic/ # Classic arena, ModeBar, controllers, store, & 4-stage keyboard-shortcuts/
│   │   │   ├── typing-shared/ # Caret, WordStream, HandGuide, Keymap, LiveStats & 4-stage Tape logic/
│   │   │   ├── typing-sound/  # Sound policy controller, preloader, & SoundSettingsSection
│   │   │   ├── mode-select/   # Edge-to-edge horizontal chevron ribbons & ASCII art canvas
│   │   │   ├── result/, history/, analytics/, profile/, custom-text/, database/, settings/, main-menu/, welcome/
│   │   ├── shared/        # Skeleton v5 UI wrappers (AppButton, AppCard, etc.), audio engines, tokens, stores
│   │   └── shell/         # Responsive desktop/tablet AppShell
│   ├── locales/           # Modular English (en/) and Indonesian (id/) localization dictionaries
│   └── routes/            # SvelteKit static SPA router (ssr: false, csr: true)
└── src-tauri/             # Rust backend (57 sandboxed IPC commands, zero external network access)
    ├── migrations/        # Canonical baseline DDL (profile/0001_baseline.sql & registry/0001_baseline.sql)
    └── src/
        ├── audio/         # Native CPAL audio stream supervisor (device.rs), 64-voice mixer (mixer.rs), engine.rs
        ├── db/            # Dual-DB manager, 5-module UNIX migration engine (db/migrate/), backup, 10-stage validator
        ├── commands/      # Thin #[tauri::command] IPC adapters
        ├── domain/        # Pure validation rules (metrics, settings, profile slugs)
        └── text_import/   # Encoding detection, compression, and compact line-delta diffing
```

### Core Modular Pipeline Contracts (Anti-Regression Boundaries)

| Subsystem | Unidirectional UNIX Pipeline | Strict Isolation Invariant |
| :--- | :--- | :--- |
| **Multi-Line Tape Mode** | `tape-line-segmenter.ts` → `tape-dom-reader.ts` → `tape-sync.ts` (`TAPE_LINE_PADDING_Y = 7`) → `WordStream.svelte` | `logic/` modules are pure functions (no DOM/Svelte). `<Caret>` sits at viewport level. Active line is `opacity-100`; inactive lines are `opacity-0 pointer-events-none`. Never mix `syncTape()` and `syncNormal()`. |
| **Typing Audio (7-Stage)** | `sound-preloader.ts` → `sound-synthesizer.ts` → `typing-sound.controller.svelte.ts` → `adaptive-sound-engine.ts` → `commands/audio.rs` → `audio/mixer.rs` → `audio/device.rs` (CPAL) | `playClick()` is synchronous fire-and-forget (no `await` on hot path). Rust callback is lock-free & zero-allocation with `[0.0, 2.0]` soft-clip limiter, `-88 dBFS` TPDF dither, and instant 2-way hot-swap via `host.default_output_device()`. |
| **SQLite Dual-DB & Migrate** | `migrations/{profile,registry}/0001_baseline.sql` → `db/migrate/sets.rs` → `runner.rs` (`connection.rs`, `timestamp.rs`) → `db/migrate/mod.rs` | No inline `CREATE`/`ALTER TABLE` in Rust outside `schema_migration` in `runner.rs`. Canonical table names only (no `_v1`/`_v2` suffixes). Synchronize schema updates with `validate.rs` (`ALLOWED_TABLES`) and `docs/database-schema.md`. |
| **Classic Shortcuts** | `shortcut-types.ts` → `shortcut-registry.ts` → `shortcut-matcher.ts` → `classic-shortcuts.controller.svelte.ts` → `ClassicShortcutsProvider.svelte` | Window Capture Phase listener (`true`) guarded by Triple Guard: Route Guard (Classic Mode only), Typing Guard (`!typingActivity.isTyping`), and Focus Guard (excludes `input[data-typing-arena-input="true"]`). |
| **Keymap React Pulse** | `keymap-react.ts` (`evaluateReactPulse`) → `Keymap.svelte` (`pulse(code, isCorrect)`) | Imperative DOM attribute updates (`[data-react="ok"\|"err"]`) with 75ms auto-release. Never mutate reactive `$state` on the `keydown` hot path in `TypingArena.svelte`. |
| **Settings & Search** | `settings-registry.ts` → `settings-search.ts` (`filterSettings`) → `SettingsView.svelte` → `*SettingsSection.svelte` | `SettingsView.svelte` orchestrates tabs and search visibility only; each domain card lives in its own `*SettingsSection.svelte`. Visual mode settings never include an `"off"` option (toggles live on `ModeBar.svelte`). |

### Performance & Bundle Budgets
Enforced automatically via `pnpm run check:budget` (`scripts/check-bundle-budget.mjs`):
- **Initial JS (entry + vendor, gzip)**: `<= 150 KB`
- **Initial CSS (gzip)**: `<= 32 KB`
- **Lazy Route / Component Chunks (gzip)**: `<= 60 KB` per chunk
- **Bundled Fonts Total**: `<= 120 KB`
- **Wordlists + Quotes Chunk (`text-tools`)**: `<= 3.00 MB` uncompressed

---

## 📚 Offline Content Packs (`content-packs/`)

All typing content is bundled locally for 100% offline reliability:

- **🌍 17 World Languages & Literature (`content-packs/quotes/_list.json`)**:
  - Literary, philosophical, and historical quotes (`short`, `medium`, `long`, `thicc`) across 17 languages: English, Indonesian, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Japanese (Romaji), Polish, Turkish, Vietnamese, Latin, Chinese (Pinyin), Korean (Romaja), and Afrikaans.
- **🖥️ Tech Infrastructure & Systems (`content-packs/tech/INFRA/`, 18 canonical packs)**:
  - *Containers, Web Servers & Virtualization*: Docker, Podman, NGINX
  - *Systems, Shell & Version Control*: GNU/Linux CLI, Bash, Git
  - *Relational Databases*: MariaDB SQL, PostgreSQL, SQLite
  - *Foundational Language Idioms*: C, C++, Rust, Go, Python, Java, JavaScript, TypeScript, PHP
- **⚡ Programming Languages & Algorithms (`content-packs/tech/CODE/`, 28 canonical packs)**:
  - *Algorithmic 1k Problem Solving (11 packs)*: Python 1k, TypeScript 1k, JavaScript 1k, Rust 1k, Go 1k, C 1k, C++ 1k, Bash 1k, Java 1k, PHP 1k, SQL 1k.
  - *Modern, Functional, Statistical & Systems Languages (12 packs)*: Kotlin, Swift, Dart, C# (.NET Core), Ruby, Lua, Zig, Elixir, Haskell, Scala 3, PowerShell, R.
  - *Markup, Configs & Editor Scripting (5 packs)*: HTML5 & CSS3, JSON & YAML, Markdown, Kubernetes Manifests (YAML), Neovim & Vim (Lua).

---

## 🤖 AI Agent & Developer Governance

All contributors and AI coding agents must strictly follow [`AGENTS.md`](AGENTS.md), the modular rules in [`.agent/rules/`](.agent/rules/), and the architecture references in [`docs/`](docs/):

- [`AGENTS.md`](AGENTS.md) — Master AI Agent Governance, Shell Safety, and Anti-Regression Laws
- [`.agent/rules/00-project-overview.md`](.agent/rules/00-project-overview.md) — HMVC Directory Map, Commands & UNIX Pipeline Contracts
- [`.agent/rules/01-tech-stack.md`](.agent/rules/01-tech-stack.md) — Official Versions, Locked Skeleton UI v5.0.1, Tailwind CSS v4 & Dependency Rules
- [`.agent/rules/02-code-standards.md`](.agent/rules/02-code-standards.md) — Svelte 5 Runes, Strict TypeScript, UNIX Philosophy & Module Boundaries
- [`.agent/rules/03-ui-ux-design.md`](.agent/rules/03-ui-ux-design.md) — Layer Economy, Semantic Tokens, WCAG 2.2 AA & Mode Select Ribbon Layout
- [`.agent/rules/04-performance.md`](.agent/rules/04-performance.md) — Zero-Latency Arena, CSS Containment, Lazy SVG Mounting & Bundle Budgets
- [`.agent/rules/05-workflow-safety.md`](.agent/rules/05-workflow-safety.md) — Phased Execution, Terminal Restrictions, Verification Gate & MCP Bridge Isolation
- [`.agent/rules/06-audio-system.md`](.agent/rules/06-audio-system.md) — 7-Stage Native Rust CPAL Audio Pipeline, Soft-Clip Limiter & Bluetooth Hot-Swap
- [`.agent/rules/07-database-schema.md`](.agent/rules/07-database-schema.md) — Dual-DB SQLite Architecture & Modular UNIX Migration Governance
- [`docs/database-schema.md`](docs/database-schema.md) — Canonical SQLite ER Diagrams, Table Reference & 10-Stage Quarantine Import Pipeline

---

## 📜 License

Licensed strictly under the **[GNU Affero General Public License v3.0 only (`AGPL-3.0-only`)](LICENSE)**.

