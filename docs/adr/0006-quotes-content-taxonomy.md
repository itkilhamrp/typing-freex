# ADR 0006: Quotes Content Taxonomy & TECH vs CODE Disambiguation

## Status
Accepted

## Context
Typing FreeX requires an extensive, strictly offline collection of typing quotes comparable to modern platforms like Monkeytype. As quotes expanded across 17 world country languages, vocabulary tiers (1k, 5k), and technical domains, an ambiguity arose between `TECH` and `CODE` folders:
- Both contained programming language snippets and were labeled ambiguously in UI manifests.
- Pre-existing integration tests in `src/core/text-tools/quote-loader.test.ts` strictly asserted `expect(allTech.length).toBe(180)`.
- Modifying files inside `TECH` indiscriminately risked violating Linus's Law ("Never break userspace").

## Decision
1. **Domain Delineation**:
   - `INFRA` (renamed from `TECH` to eliminate `content-packs/tech/TECH` naming redundancy) is dedicated strictly to **Technology Infrastructure & Systems Foundations** (DevOps tools, NGINX reverse proxy, containerization, operating systems CLI, version control, relational databases, and core language standard library idioms). Preserved at exactly 18 files and 180 quotes.
   - `CODE` is dedicated strictly to **Programming Languages & Algorithmic 1k Tiers** (Monkeytype Code mode equivalent: Quicksort, Binary Search, Trees, Concurrency Channels, Memory Allocators, In-place Partitioning across 11 languages, plus modern mobile, functional, and web specifications).
2. **Centralized Manifest Governance**:
   - Manifest `content-packs/quotes/_list.json` serves as the single source of truth for language codes, flags, native names, and aliases.
   - Umbrella entry `tech` is labeled `"Code & Tech (All)"` with nativeName `"Tech Infrastructure & Systems"`.
   - Umbrella entry `code` is labeled `"Code & Algorithms (All)"` with nativeName `"Programming Languages & Algorithms (1k)"`.
3. **Dynamic Discovery**:
   - Quotes loader uses Vite `import.meta.glob` dynamically without hardcoded file lists. Subfolders and length classification (`short`, `medium`, `long`, `thicc`) are evaluated on demand.

## Consequences
- Crystal clear separation of concerns for users in the quote language selection dialog.
- 100% backward compatibility with existing tests and userspace.
- Scalable foundation for community and offline content pack contributions without regressions.
