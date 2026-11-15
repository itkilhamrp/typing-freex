## Summary of Changes
<!-- Describe what this PR achieves and reference relevant issue numbers -->

## Definition of Done (§8.4 Checklist)
- [ ] Strictly adheres to PNPM only (no `package-lock.json` or `yarn.lock` committed)
- [ ] Code passes `pnpm lint` and `pnpm typecheck` without warnings or suppressions
- [ ] Unit tests added / updated and pass with `pnpm test`
- [ ] Bundle size verified against budgets via `pnpm run check:budget`
- [ ] i18n parity verified via `pnpm run check:i18n` (no untranslated or missing keys)
- [ ] No remote network calls, tracking, or telemetry added (NFR-09, SEC-05)
- [ ] Rust changes pass `cargo check` and `cargo clippy -- -D warnings`
- [ ] Security boundaries preserved (HMVC layer rules intact, no `v-html` used)
