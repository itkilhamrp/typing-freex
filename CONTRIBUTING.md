# Contributing to Typing FreeX

Thank you for your interest in contributing to the Offline Typing Test Engine!

## 1. Development Principles

- **Offline Only**: No remote telemetry, network requests, or external CDN dependencies are permitted.
- **PNPM Only (Constraint C-02)**: Do not use `npm` or `yarn`. Never commit `package-lock.json` or `yarn.lock`.
- **Architectural Boundaries**:
  - `src/core/` is a pure headless engine with zero UI dependencies and must not import from `src/lib/`.
  - `src/lib/modules/` may import from `src/core/` and `src/lib/shared/`.
  - No `{@html ...}` unescaped HTML injection is allowed without strict sanitization (SEC-07).
  - All Phosphor icon imports must be named from `phosphor-svelte` (e.g. `import { Keyboard, Play } from 'phosphor-svelte'`).
- **UI Design System & Aesthetics**:
  - Mandatory use of **Skeleton UI v5.0.1** and shared UI components (`AppButton`, `AppCard`, `AppDialog`, `AppSelect`, etc.) with semantic `--tt-*` design tokens.
  - Adhere to the **Layer Economy principle**:
    - Layer 1 (Canvas): `var(--tt-bg)`
    - Layer 2 (Content): Solid elevated surfaces `var(--tt-surface)`
    - Layer 3 (Chrome): Floating chrome/navigation/modals.
  - No raw standard Tailwind CSS classes or AI slop for interactive components.
  - Review detailed rules in [`.agent/rules/`](.agent/rules/) and [`AGENTS.md`](AGENTS.md).

## 2. Definition of Done Checklist (§8.4)

Before submitting a Pull Request, verify all checks pass:

```bash
# 1. Type check
pnpm typecheck

# 2. Linting (boundaries & styling)
pnpm lint

# 3. Unit tests
pnpm test

# 4. i18n parity check
pnpm run check:i18n

# 5. Production build & bundle budgets
pnpm build
pnpm run check:budget

# 6. Rust checks
cd src-tauri && cargo check && cargo clippy -- -D warnings
```
