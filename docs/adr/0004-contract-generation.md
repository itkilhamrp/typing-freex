# ADR 0004: Type Contract Generation Strategy (OD-03)

## Status
Accepted

## Context
OTTE requires strong type synchronization between Rust IPC commands and frontend TypeScript code without runtime overhead or complex server orchestration.
Options evaluated:
1. `ts-rs`: Derives TypeScript type definitions from Rust structs/enums via procedural macros directly during `cargo test`.
2. `specta`: Provides schema export, but introduces higher complexity and coupling with specific RPC layers.
3. Manual contract maintenance: Prone to drift across 38 commands.

## Decision
We select `ts-rs` for contract generation.
- Rust structs derive `serde::Serialize`, `serde::Deserialize`, and `ts_rs::TS`.
- Contracts are exported to `src/core/ipc/contracts.ts` during build or test phases.
- CI validates that generated contracts match repository state without uncommitted changes.

## Consequences
- Guaranteed compile-time type safety across IPC boundary.
- Zero runtime footprint in the client.
