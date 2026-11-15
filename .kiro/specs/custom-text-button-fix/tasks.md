# Implementation Plan: Custom Text Button Event Handler Fix

## Overview

This implementation plan breaks down the custom text button event handler fix into discrete, executable coding tasks. The fix addresses a critical Svelte 5 compliance issue where React-style `onClick` (camelCase) props must be replaced with `onclick` (lowercase) throughout the codebase. Implementation follows a phased approach: fix core component → build tooling → migrate project-wide → integrate CI → verify.

## Tasks

- [x] 1. Set up project structure and type definitions
  - Create TypeScript interfaces for button component props with strict lowercase event handler typing
  - Define shared type definitions: `MouseEventHandler`, `KeyboardEventHandler`, `ClickKeyEventHandler`
  - Set up test infrastructure with Vitest, Testing Library, and fast-check
  - Create directory structure for tooling scripts (`scripts/`)
  - _Requirements: 3.1, 3.3, 3.4_

- [x] 2. Implement CustomTextButton with lowercase onclick prop
  - [x] 2.1 Refactor CustomTextButton component to use Svelte 5 Runes syntax
    - Replace legacy prop declaration with `$props()` destructuring
    - Update interface to define `onclick?: (event: MouseEvent | KeyboardEvent) => void`
    - Implement `handleClick` function for mouse events
    - Implement `handleKeyDown` function for keyboard events (Enter/Space)
    - Remove legacy `onClick` prop (camelCase) from interface
    - Ensure button binding uses lowercase `onclick={handleClick}`
    - Maintain accessibility features (ariaLabel, disabled, type)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.2 Write property test for event handler invocation on click
    - **Property 1: Event handler invocation on click**
    - **Validates: Requirements 1.2, 1.4**
    - Use fast-check to generate arbitrary handler functions
    - Assert handler is invoked exactly once on mouse click
    - Assert handler receives MouseEvent instance
    - _Requirements: 1.2, 1.4, 8.1, 8.2_

  - [ ]* 2.3 Write property test for keyboard event handling
    - **Property 2: Event handler invocation on keyboard**
    - **Validates: Requirements 1.5**
    - Use fast-check to generate arbitrary handler functions and keys (Enter/Space)
    - Assert handler is invoked exactly once on Enter/Space key press
    - Assert handler receives KeyboardEvent instance
    - _Requirements: 1.5, 8.3_

  - [ ]* 2.4 Write unit tests for CustomTextButton core behavior
    - Test rendering without onclick prop (should not error)
    - Test onclick invocation on mouse click
    - Test onclick invocation on Enter key press
    - Test onclick invocation on Space key press
    - Test disabled state prevents handler invocation
    - Achieve 100% branch coverage for event handler logic
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 3. Implement runtime validation guard for development mode
  - [x] 3.1 Add $effect rune for onclick prop type validation
    - Implement `$effect(() => { ... })` block checking `import.meta.env.DEV`
    - Validate `onclick` is either undefined or function type
    - Log console error if validation fails with component name and received type
    - Ensure component renders without throwing exception on invalid prop
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 3.2 Write property test for invalid prop type validation
    - **Property 3: Invalid prop type validation**
    - **Validates: Requirements 5.1, 5.2, 5.4**
    - Use fast-check to generate non-function, non-undefined values (string, number, boolean, null)
    - Assert console.error is called with appropriate message in dev mode
    - Assert component still renders without throwing
    - _Requirements: 5.1, 5.2, 5.4_

- [x] 4. Add component documentation and JSDoc comments
  - Add JSDoc to CustomTextButton interface documenting onclick prop
  - Include explicit warning: "Use lowercase `onclick` (Svelte 5 compliant), not `onClick` (React-style)"
  - Document onclick prop type signature with example usage
  - Add code example: `<CustomTextButton onclick={(e) => handleClick(e)}>Click Me</CustomTextButton>`
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 5. Checkpoint - Verify CustomTextButton implementation
  - Run `pnpm typecheck` (must pass with 0 errors)
  - Run `pnpm lint` (must pass with 0 warnings)
  - Run `pnpm test` (all CustomTextButton tests must pass)
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Build component scanner tool
  - [~] 6.1 Create audit-event-handlers.ts script with scanning logic
    - Implement `scanComponents(directory: string)` function
    - Find all `.svelte` files in `src/lib/modules/` recursively
    - Parse each file for `<button>` elements using regex or AST
    - Extract prop bindings and flag camelCase event props (onClick, onChange, etc.)
    - Define detection pattern: `/\b(onClick|onChange|onInput|onKeyDown|onKeyUp|onFocus|onBlur|onSubmit)\b/g`
    - Generate `AuditReport` with scanned file count, issues found, and compliant components list
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [~] 6.2 Implement structured audit report generation
    - Create `ScanResult` interface with filePath, lineNumber, propName, severity
    - Create `AuditReport` interface with scannedFiles, issuesFound, compliantComponents
    - Format report output with file paths, line numbers, and prop names
    - Output report to console and optionally to JSON file
    - _Requirements: 2.4, 2.5_

  - [ ]* 6.3 Write integration tests for scanner tool
    - Create temporary test directory with mock Svelte components
    - Test scanner detects camelCase event props (onClick)
    - Test scanner approves components with lowercase event props (onclick)
    - Test scanner handles edge cases (no button elements, multiple props)
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 6.4 Write property tests for scanner detection accuracy
    - **Property 4: Scanner detection accuracy**
    - **Validates: Requirements 2.2, 2.4**
    - **Property 5: Scanner approval for compliant components**
    - **Validates: Requirements 2.3**
    - Generate arbitrary Svelte component content with mixed prop styles
    - Assert scanner correctly identifies camelCase props
    - Assert scanner correctly approves lowercase props
    - _Requirements: 2.2, 2.3, 2.4_

- [~] 7. Run component scanner and generate audit report
  - Execute scanner on entire codebase: `pnpm tsx scripts/audit-event-handlers.ts`
  - Review generated audit report for all flagged components
  - Document list of components requiring migration
  - Save audit report to `.kiro/specs/custom-text-button-fix/audit-report.json`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 8. Configure ESLint rule for camelCase event prop detection
  - [~] 8.1 Add ESLint naming convention rule to .eslintrc.cjs
    - Configure `@typescript-eslint/naming-convention` rule
    - Set selector to 'property' with filter regex `^on[A-Z]`
    - Require format to match lowercase `^on[a-z]`
    - Set error message: "Use lowercase event handler props (e.g., onclick, not onClick)"
    - Apply rule to all standard DOM event handlers
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [~] 8.2 Verify linter detects camelCase event props
    - Create test component with `onClick` prop
    - Run `pnpm lint` and confirm error is emitted
    - Verify error message suggests lowercase alternative
    - Remove test component after verification
    - _Requirements: 7.2, 7.3_

  - [ ]* 8.3 Write property test for linter detection and suggestions
    - **Property 8: Linter detection and suggestions**
    - **Validates: Requirements 7.2, 7.3**
    - **Property 9: Linter comprehensive coverage**
    - **Validates: Requirements 7.4**
    - Generate arbitrary event handler prop names (both camelCase and lowercase)
    - Assert linter emits error for camelCase variants
    - Assert linter suggests correct lowercase alternative
    - Test coverage for all standard DOM events
    - _Requirements: 7.2, 7.3, 7.4_

- [ ] 9. Build migration utility for automated prop renaming
  - [~] 9.1 Create migrate-event-handlers.ts script with migration logic
    - Implement `migrateComponent(filePath: string)` function
    - Read component source and parse for camelCase event props
    - Replace camelCase props with lowercase equivalents (onClick → onclick)
    - Update TypeScript interfaces in script tags
    - Run Prettier formatter on modified file
    - Generate `MigrationResult` with file path, changes, and success status
    - _Requirements: 4.1, 4.2_

  - [~] 9.2 Implement batch migration with verification checkpoints
    - Create `batchMigrate(componentPaths: string[])` function
    - Iterate through component list from audit report
    - For each component: migrate, verify TypeScript compilation, verify tests
    - Halt migration on first failure and log error details
    - Generate migration log with timestamp, changes, and verification results
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 10.2, 10.3_

  - [~] 9.3 Implement parent-child prop interface update logic
    - Detect components that pass event handler props to child components
    - Update both parent prop passing and child prop interface
    - Verify TypeScript compilation after parent-child updates
    - _Requirements: 4.4_

  - [ ]* 9.4 Write integration tests for migration utility
    - Create temporary test components with onClick props
    - Run migration and verify props renamed to onclick
    - Verify TypeScript interfaces updated correctly
    - Verify Prettier formatting applied
    - Test parent-child prop update scenarios
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ]* 9.5 Write property test for migration behavior preservation
    - **Property 6: Migration behavior preservation**
    - **Validates: Requirements 4.1, 4.3**
    - **Property 7: Migration parent-child prop updates**
    - **Validates: Requirements 4.4**
    - Generate arbitrary component structures with event handlers
    - Assert handler logic remains identical post-migration
    - Assert parent-child prop interfaces both updated correctly
    - _Requirements: 4.1, 4.3, 4.4_

- [~] 10. Checkpoint - Verify tooling implementation
  - Run `pnpm typecheck` on all scripts (must pass with 0 errors)
  - Run `pnpm lint` on all scripts (must pass with 0 warnings)
  - Run integration tests for scanner and migration tools
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Execute project-wide migration in batches
  - [~] 11.1 Migrate shared module components
    - Run migration utility on `src/lib/modules/shared/` components
    - Verify each component: `pnpm typecheck && pnpm test`
    - Document migration results in migration log
    - _Requirements: 4.1, 4.2, 4.5, 10.1, 10.2_

  - [~] 11.2 Migrate arena module components
    - Run migration utility on `src/lib/modules/arena/` components
    - Verify each component: `pnpm typecheck && pnpm test`
    - Document migration results in migration log
    - _Requirements: 4.1, 4.2, 4.5, 10.1, 10.2_

  - [x] 11.3 Migrate text-pack module components
    - Run migration utility on `src/lib/modules/text-pack/` components
    - Verify each component: `pnpm typecheck && pnpm test`
    - Document migration results in migration log
    - _Requirements: 4.1, 4.2, 4.5, 10.1, 10.2_

  - [~] 11.4 Migrate challenge module components
    - Run migration utility on `src/lib/modules/challenge/` components
    - Verify each component: `pnpm typecheck && pnpm test`
    - Document migration results in migration log
    - _Requirements: 4.1, 4.2, 4.5, 10.1, 10.2_

  - [~] 11.5 Migrate stats module components
    - Run migration utility on `src/lib/modules/stats/` components
    - Verify each component: `pnpm typecheck && pnpm test`
    - Document migration results in migration log
    - _Requirements: 4.1, 4.2, 4.5, 10.1, 10.2_

  - [~] 11.6 Migrate settings module components
    - Run migration utility on `src/lib/modules/settings/` components
    - Verify each component: `pnpm typecheck && pnpm test`
    - Document migration results in migration log
    - _Requirements: 4.1, 4.2, 4.5, 10.1, 10.2_

- [~] 12. Checkpoint - Verify project-wide migration
  - Run `pnpm typecheck` (must pass with 0 errors)
  - Run `pnpm lint` (must pass with 0 warnings)
  - Run `pnpm test` (all tests must pass)
  - Run `pnpm build` (production build must succeed)
  - Ensure all verification passes, ask the user if questions arise.

- [ ] 13. Integrate linter rule into CI pipeline
  - [~] 13.1 Update GitHub Actions CI workflow
    - Add linter check to `.github/workflows/ci.yml`
    - Ensure `pnpm lint` runs on all pull requests
    - Configure CI to fail if camelCase event props detected
    - Test CI pipeline with dummy PR containing onClick prop (should fail)
    - _Requirements: 7.5, 10.1_

  - [~] 13.2 Add scanner check to pre-commit hook
    - Create pre-commit hook script that runs scanner on staged `.svelte` files
    - Configure hook to fail if camelCase event props detected
    - Test hook with staged file containing onClick prop (should fail)
    - _Requirements: 7.5_

  - [~] 13.3 Document rollback procedure
    - Create rollback guide in `.kiro/specs/custom-text-button-fix/rollback.md`
    - Document git revert commands for each migration phase
    - Document verification steps after rollback
    - Include contact information for escalation
    - _Requirements: 10.3, 10.4_

- [ ] 14. Run performance benchmarks
  - [ ]* 14.1 Write performance test for event handler execution time
    - **Property 10: Event handler performance**
    - **Validates: Requirements 9.1**
    - Create test that measures onclick handler execution time
    - Assert execution completes within 16ms (60fps requirement)
    - Run test with various handler complexities
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ]* 14.2 Write performance test for validation overhead
    - **Property 11: Validation overhead performance**
    - **Validates: Requirements 9.3**
    - Create test that measures component mount time in dev mode
    - Assert runtime validation completes within 1ms
    - Verify validation is stripped in production build
    - _Requirements: 9.3_

  - [~] 14.3 Verify zero-latency scrolling in Arena view
    - Load Arena view with 50+ text cards
    - Measure scrolling FPS using Chrome DevTools Performance profiler
    - Assert 60fps maintained during scroll (per 04-performance.md)
    - Test button click responsiveness during active scrolling
    - _Requirements: 9.5_

  - [~] 14.4 Verify production build tree-shaking
    - Run `pnpm build` and inspect output bundle
    - Confirm `import.meta.env.DEV` blocks removed from production code
    - Verify bundle size has not increased compared to baseline
    - Run `pnpm check:budget` to confirm bundle budget compliance
    - _Requirements: 5.3, 9.2_

- [ ] 15. Final verification and regression testing
  - [~] 15.1 Run full verification suite
    - Execute `pnpm typecheck` (must pass with 0 errors)
    - Execute `pnpm lint` (must pass with 0 warnings)
    - Execute `pnpm test` (all tests must pass)
    - Execute `pnpm build` (production build must succeed)
    - Execute `pnpm check:i18n` (i18n integrity verified)
    - Execute `pnpm check:budget` (bundle size within budget)
    - _Requirements: 4.5, 10.4, 10.5_

  - [~] 15.2 Run regression test suite across all HMVC modules
    - Test arena module: typing flow, text rendering, timer
    - Test text-pack module: content selection, filtering
    - Test challenge module: challenge creation, validation
    - Test stats module: data display, charts
    - Test settings module: theme switching, preferences
    - Verify all button interactions work correctly
    - _Requirements: 10.4_

  - [~] 15.3 Update component library documentation
    - Add event handler prop naming section to style guide
    - Document migration process for future contributors
    - Include examples of correct lowercase prop usage
    - Link to requirements and design documents
    - _Requirements: 6.5_

- [~] 16. Checkpoint - Final verification complete
  - All verification checks passed with 0 errors and 0 warnings
  - All 11 correctness properties validated through property-based testing
  - Performance benchmarks confirm zero-latency requirement maintained
  - CI pipeline configured and tested
  - Documentation updated
  - Ensure all verification passes, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at critical milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Migration is executed in batches by HMVC module with verification after each batch
- All changes must pass `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before proceeding
- Performance tests verify zero-latency requirement (< 16ms event response, 60fps scrolling)
- CI integration prevents future regressions through automated linter checks

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2"] },
    { "id": 3, "tasks": ["6.1", "8.1"] },
    { "id": 4, "tasks": ["6.2", "6.3", "6.4", "8.2", "8.3"] },
    { "id": 5, "tasks": ["7", "9.1"] },
    { "id": 6, "tasks": ["9.2", "9.3"] },
    { "id": 7, "tasks": ["9.4", "9.5"] },
    { "id": 8, "tasks": ["11.1", "11.2", "11.3"] },
    { "id": 9, "tasks": ["11.4", "11.5", "11.6"] },
    { "id": 10, "tasks": ["13.1", "13.2", "13.3"] },
    { "id": 11, "tasks": ["14.1", "14.2", "14.3", "14.4"] },
    { "id": 12, "tasks": ["15.1", "15.2", "15.3"] }
  ]
}
```
