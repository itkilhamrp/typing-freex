# ADR 0003: PNPM-Only Package Management (Constraint C-02)

## Status
Accepted

## Context
Per PRD Constraint C-02, the project strictly mandates PNPM for frontend dependency management. Deterministic builds, fast installation, and strict peer-dependency validation are required.

## Decision
- Enforce PNPM via `packageManager` field in `package.json`.
- Block non-pnpm package managers via `scripts/enforce-pnpm.mjs` in `preinstall`.
- Use `.npmrc` with `engine-strict=true`, `save-exact=true`, `strict-peer-dependencies=true`.
- Gitignore `package-lock.json` and `yarn.lock`.

## Consequences
- No accidental dirty commits with npm or yarn lockfiles.
- Fast, reproducible, and verifiable builds across development and CI environments.
