# Changelog

All notable changes to Typing FreeX - Offline Typing Test Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Hand Guide & Assistance v2 (100% Keymap Parity)**:
  - Added dedicated `HandGuideSettingsSection` component featuring:
    - **Mode selection**: `off`, `static`, `react`, and `next` with preferred mode memory.
    - **Visual styles**: `robot`, `minimal`, and `cyber` with calibrated light/dark high-contrast tokens (`--tt-hand-idle`, `--tt-hand-target`, `--tt-hand-pressed`, `--tt-hand-error`).
    - **Finger labels (Legend)**: home keys (`keys`), short finger names (`finger_name`), `blank`, and dynamic target letters (`dynamic`).
    - **Hand isolation**: `both`, `left`, and `right` hands.
    - **Scale slider**: 0.5x to 2.0x scale with quick preset chips (0.8x, 1.0x, 1.2x, 1.5x, 2.0x).
    - **Layout selector**: physical layout mapping (`QWERTY (US)`).
    - **Interactive Live Preview Sandbox**: real-time preview responding to mode, style, legend, hands, size, and theme.
  - Added full IPC persistence keys and store synchronization in `settings.store.svelte.ts` and `typing.store.svelte.ts`.
  - Added 100% i18n parity between English (`en`) and Indonesian (`id`) locales for all assistance controls.

### Fixed & Optimized
- **Zero-Latency Keymap Engine (React & Next Modes)**:
  - Eliminated input-output delay during high-speed typing in `Keymap.svelte`:
    - Replaced CPU-heavy 10px blurred `box-shadow` on active keys with GPU-accelerated crisp `outline` and `will-change: transform, background-color`.
    - Removed continuous `km-pulse` animation churn on fast key cycling, eliminating layout thrashing and compositing layer churn.
    - Optimized transition duration to 40ms to prevent frame overlap at 150+ WPM.
    - Eliminated inline array allocations and string joining in key state lookups.
  - Optimized critical typing input-output path in `TypingArena.svelte` and `typing-arena.controller.svelte.ts`:
    - Eliminated per-keystroke full array cloning (`[...snap.words]`) in snapshot listener, switching to direct immutable assignment with dirty-checked index updates.
    - Conditioned `handController.registerKeyPress` only when assistance is enabled and active in `react` or `next` mode.
    - Calibrated active react timer to 75ms to prevent overlapping timers during rapid bursts.
    - Added automated cleanup of expired press animations in `hand-guide.controller.svelte.ts`.
  - Restored `ui.keymap.preferred_mode` in settings loader and unified mutual exclusivity between Hand Guide and Keymap.

- **Comprehensive Quotes Content Pack Expansion**:
  - Added authentic quote content packs for 15 world languages (ES, FR, DE, IT, PT, NL, RU, JA, PL, TR, VI, LA, ZH, KO, AF) with literary, historical, and philosophical sources.
  - Added high-frequency vocabulary tiers for English (`english_1k`, `english_5k`) and Indonesian (`indonesian_1k`, `indonesian_5k`).
  - Added Algorithmic 1k Problem Solving tiers across 11 programming languages in `CODE/tiers/` (Quicksort, Binary Search, Trees, Concurrency Channels, Memory Allocators, In-place Partitioning).
  - Added modern programming languages, mobile frameworks, and markup specs (Kotlin, Swift, Dart, C#, Ruby, Lua, Zig, Elixir, Haskell, HTML/CSS, JSON/YAML, Markdown, Kubernetes, Neovim).
- **Content Taxonomy Disambiguation (TECH vs CODE)**:
  - Dedicated `TECH` exclusively to core technology infrastructure, DevOps (Docker, Podman), systems administration (Linux CLI, Bash), database engines (Postgres, MariaDB, SQLite), and foundational language idioms (18 files, 180 quotes preserved for backward-compatibility).
  - Dedicated `CODE` exclusively to programming languages, 1k algorithmic problem-solving tiers, and modern developer syntax (25 files, 250 quotes).
  - Clarified user-facing titles, native names, flags, and aliases in `content-packs/quotes/_list.json`.
- **Bundle Budget Guard Optimization**:
  - Enhanced `scripts/check-bundle-budget.mjs` to validate the combined wordlist/quote content chunk against its dedicated PRD budget (`<= 3.00 MB uncompressed`, currently ~0.24 MB) while strictly enforcing the `<= 60.00 KB` limit on all lazy route chunks.

### Changed
- **Architectural Restructuring & Mode Isolation**:
  - Split monolithic `typing` module into isolated domain modules:
    - `modes/`: Dedicated game modes namespace with isolated sub-modules:
      - `classic/`: Classic typing arena, mode toolbar, modal selectors, and controllers/stores.
      - `learning/` & `games/`: Clean domain-isolated scaffolding reserved for future mode expansions.
    - `typing-shared/`: Reusable typing infrastructure (`Caret`, `WordStream`, `HandGuide`, `LiveStats`).
    - `result/`: Dedicated post-session result view, charting, and metrics controller.
    - `history/`: Dedicated session history exploration and management view.
    - `main-menu/` & `welcome/`: Promoted application navigation hub and onboarding views from `profile/`.
  - Consolidated duplicate `src/shared/` into `src/lib/shared/` (`styles/`, `types/`, `utils/`, `ui/`, `actions/`, `audio/`, `stores/`).
  - Removed obsolete `src/assets/vue.svg` artifact and centralized ambient types (`src/zzfx.d.ts`).
  - Zero logic changes, zero UI/UX regressions, and 100% test suite parity across all 44 test suites.

## [0.1.0] - 2026-09-30

### Added
- **Headless Typing Engine:** Deterministic monotonic timer, real-time WPM/CPM, accuracy, and consistency calculation based on standard 5 chars/word formula.
- **Typing Arena UI:** Minimalist distraction-free typing view with caret styles, live stats, and word stream containment.
- **Hand Guide Module:** Real-time ASCII robot hands showing finger placement without layout shift (`contain: layout paint style`).
- **Profile Isolation:** Dedicated SQLite database per profile (`typing_app.db`) stored under UUID directory with WAL mode, `PRAGMA application_id = 0x4F545445`, and strict schema constraints.
- **Analytics & Progression:** Summary KPIs, speed & accuracy trajectory charts, personal bests showcase, and virtual QWERTY keyboard accuracy/error heatmap.
- **Database Tools:** Bit-for-bit `VACUUM INTO` backup exports with SHA-256 sidecars, and 10-stage hostile file import validation quarantine pipeline.
- **Custom Text Engine:** Plain textarea editor with live issue detection (smart punctuation, exotic spaces, tabs), NFC normalization, paragraph/size chunking, and optimistic revision tracking.
- **Full Internationalization (i18n):** 1:1 translation parity between English and Bahasa Indonesia with independent content language selection and international speed units (WPM/CPM).
- **Accessibility & Security Hardening:** WCAG 2.2 AA compliant tokens, screen reader announcements, zero external network connectivity, and Brownfield CSP.
