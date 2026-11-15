# ADR 0005: Internationalization Library Selection (OD-04)

## Status
Accepted

## Context
Typing FreeX requires multi-language support (English and Indonesian for v1.0, with extensible locale architecture).
Options considered:
1. `vue-i18n`: Standard Vue ecosystem solution with full pluralization, interpolation, formatting, and Vue devtools integration.
2. In-house custom minimal i18n runtime: Saves ~15 KB raw JS at the expense of maintaining a custom interpolation/pluralization parser.

## Evaluation & Decision
During M0 benchmarking:
- `vue-i18n` gzip size measured: 18.00 KB.
- Total application initial JS bundle measured: 66.26 KB gzip (well below the 150 KB budget cap in NFR-03).
- Since the bundle budget is met with substantial headroom (>80 KB cushion), the maintenance cost and risk of an in-house runtime is not justified.

We adopt `vue-i18n` (Composition API mode, `legacy: false`).

## Parity & Quality Assurance
- Automated CI script `scripts/check-i18n-parity.mjs` verifies 100% key parity, empty translations, and placeholder match between locales.
