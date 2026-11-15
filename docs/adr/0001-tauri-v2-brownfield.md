# ADR 0001: Tauri v2 Security Architecture & Brownfield Pattern

## Status
Accepted

## Context
Per PRD Constraint C-12, Tauri v2 offers Brownfield and Isolation patterns. In this project (OTTE), all dependencies are strictly controlled, vendored/bundled offline, and no remote code or untrusted scripts are ever loaded.
CSP is enforced with `default-src 'self'`, `withGlobalTauri: false`, and least-privilege IPC command capabilities.

## Decision
We adopt the standard Tauri v2 architecture with `pattern: { "use": "brownfield" }` alongside strict CSP and individual command capabilities in `src-tauri/capabilities/default.json`. The Isolation pattern's cryptographic overhead is unnecessary given strict offline guarantees and zero remote origins.

## Consequences
- Clean IPC messaging between Vue 3 and Rust via `@tauri-apps/api/core`.
- High throughput and low input latency required for 1000 Hz input sampling.
- Least-privilege command execution strictly audited via capabilities.
