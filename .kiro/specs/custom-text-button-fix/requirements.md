# Requirements Document

## Introduction

This document specifies requirements for fixing a project-wide event handler prop mismatch in custom button components. The root cause is the use of `onClick` (React-style camelCase) instead of `onclick` (Svelte 5 compliant lowercase), causing click events to fail silently. The fix will standardize all event handler props to lowercase, audit all button components, and add validation to prevent future regressions.

## Glossary

- **CustomTextButton**: The primary affected component located at `src/lib/modules/shared/components/CustomTextButton.svelte`
- **Event_Handler_Prop**: A Svelte component property that binds to DOM events (e.g., `onclick`, `onkeydown`)
- **Svelte_Compiler**: The Svelte 5 compilation toolchain that enforces lowercase event handler naming
- **HMVC_Module**: A self-contained Hierarchical Model-View-Controller module within `src/lib/modules/`
- **TypeScript_Validator**: The TypeScript strict mode type checker that validates component prop types
- **Component_Scanner**: A codebase analysis tool or script that identifies all button-like components

## Requirements

### Requirement 1: Event Handler Prop Standardization

**User Story:** As a developer, I want all button components to use lowercase event handler props, so that click events work correctly in Svelte 5.

#### Acceptance Criteria

1. THE CustomTextButton SHALL accept an `onclick` prop of type `((event: MouseEvent | KeyboardEvent) => void) | undefined`
2. WHEN the CustomTextButton receives an `onclick` prop, THE CustomTextButton SHALL bind it to the underlying button element's `onclick` event
3. THE CustomTextButton SHALL NOT accept an `onClick` prop (uppercase C)
4. WHEN a user clicks the CustomTextButton, THE CustomTextButton SHALL invoke the provided `onclick` handler with the native MouseEvent
5. WHEN a user presses Enter or Space key while the CustomTextButton is focused, THE CustomTextButton SHALL invoke the provided `onclick` handler with the native KeyboardEvent

### Requirement 2: Project-Wide Button Component Audit

**User Story:** As a maintainer, I want all button-like components across all HMVC modules audited for event handler prop mismatches, so that no silent failures remain in the codebase.

#### Acceptance Criteria

1. THE Component_Scanner SHALL identify all `.svelte` files within `src/lib/modules/` that contain `<button>` elements or button-like interactive elements
2. WHEN the Component_Scanner finds a component with `onClick` prop (camelCase), THE Component_Scanner SHALL flag it for correction
3. THE Component_Scanner SHALL verify that all identified button components use lowercase event handler props (`onclick`, `onkeydown`, `onfocus`, `onblur`)
4. WHERE a button component uses deprecated camelCase event props, THE Component_Scanner SHALL report the file path, line number, and prop name
5. THE Component_Scanner SHALL produce a complete audit report before any code modifications begin

### Requirement 3: Type Safety for Event Handler Props

**User Story:** As a TypeScript developer, I want strict type definitions for event handler props, so that the compiler catches prop naming errors at build time.

#### Acceptance Criteria

1. THE CustomTextButton SHALL define a TypeScript interface for its props that includes `onclick?: (event: MouseEvent | KeyboardEvent) => void`
2. WHEN a developer passes an `onClick` prop (uppercase C) to CustomTextButton, THE TypeScript_Validator SHALL emit a compile-time error
3. THE CustomTextButton SHALL use Svelte 5 Runes syntax (`$props()`) for prop declaration
4. THE TypeScript_Validator SHALL enforce strict mode checks on all event handler prop types
5. WHERE a component accepts multiple event handler props, THE component SHALL declare each handler with its specific event type (e.g., `onclick?: (event: MouseEvent) => void`, `onkeydown?: (event: KeyboardEvent) => void`)

### Requirement 4: Backward Compatibility Migration Path

**User Story:** As a developer working on existing code, I want clear migration guidance for updating camelCase event props, so that I can fix components without breaking existing functionality.

#### Acceptance Criteria

1. WHERE a component currently uses `onClick`, THE migration SHALL rename it to `onclick` without altering the handler logic
2. WHEN updating a component's event handler prop, THE Svelte_Compiler SHALL successfully compile the component without errors
3. THE migration SHALL preserve all existing event handler behaviors (click, keyboard navigation, focus management)
4. WHERE a component passes event handler props to child components, THE migration SHALL update both parent and child prop interfaces
5. WHEN the migration is complete, THE project SHALL pass `pnpm typecheck && pnpm lint && pnpm build` with zero errors and zero warnings

### Requirement 5: Runtime Event Handler Validation

**User Story:** As a quality assurance engineer, I want runtime validation for event handler props in development mode, so that improper prop usage is caught during testing.

#### Acceptance Criteria

1. WHERE the application runs in development mode (`import.meta.env.DEV === true`), THE CustomTextButton SHALL validate that the `onclick` prop is either undefined or a function
2. IF the `onclick` prop is neither undefined nor a function, THEN THE CustomTextButton SHALL log a console error with the prop name and received value type
3. THE runtime validation SHALL NOT execute in production builds (`import.meta.env.PROD === true`)
4. WHEN an invalid `onclick` prop is detected, THE CustomTextButton SHALL render without throwing an exception
5. THE validation logic SHALL use Svelte 5 `$effect` rune to check props during component mounting

### Requirement 6: Component Documentation Update

**User Story:** As a new team member, I want updated component documentation that explains event handler prop naming conventions, so that I don't repeat past mistakes.

#### Acceptance Criteria

1. THE CustomTextButton component file SHALL include JSDoc comments documenting the `onclick` prop type and usage
2. THE documentation SHALL explicitly state: "Use lowercase `onclick` (Svelte 5 compliant), not `onClick` (React-style)"
3. WHERE a component accepts multiple event handler props, THE documentation SHALL list each handler with an example usage
4. THE documentation SHALL include a code example showing correct prop binding: `<CustomTextButton onclick={(e) => handleClick(e)}>Click Me</CustomTextButton>`
5. WHERE the project has a component library or style guide, THE documentation SHALL be added to the official reference

### Requirement 7: Linter Rule Enforcement

**User Story:** As a CI/CD pipeline maintainer, I want automated linter rules that prevent camelCase event handler props, so that future commits cannot introduce the same bug.

#### Acceptance Criteria

1. THE project linter configuration SHALL include a rule that flags camelCase event handler props in `.svelte` files
2. WHEN a developer writes `onClick` in a Svelte component, THE linter SHALL emit an error during `pnpm lint`
3. THE linter rule SHALL suggest the correct lowercase alternative (e.g., "Use `onclick` instead of `onClick`")
4. THE linter SHALL enforce this rule for all standard DOM event handlers (`onclick`, `onchange`, `oninput`, `onkeydown`, `onkeyup`, `onfocus`, `onblur`, `onsubmit`)
5. WHEN the linter rule is active, THE CI pipeline SHALL fail if any camelCase event handler props are detected

### Requirement 8: Test Coverage for Event Handler Binding

**User Story:** As a test engineer, I want unit tests that verify event handler props are correctly bound, so that regressions are caught automatically.

#### Acceptance Criteria

1. THE CustomTextButton test suite SHALL include a test that verifies `onclick` prop binding to the button element
2. WHEN the test simulates a click event, THE test SHALL assert that the provided `onclick` handler is invoked exactly once
3. THE test suite SHALL verify keyboard event handling (Enter and Space keys trigger the `onclick` handler)
4. WHERE the `onclick` prop is undefined, THE test SHALL verify that the button renders without errors
5. THE test suite SHALL achieve 100% branch coverage for event handler prop logic in CustomTextButton

### Requirement 9: Performance Impact Assessment

**User Story:** As a performance engineer, I want to ensure that event handler standardization does not introduce latency or jank, so that the desktop-first zero-latency requirement is maintained.

#### Acceptance Criteria

1. WHEN the CustomTextButton is clicked, THE event handler SHALL execute within the same frame (< 16ms response time)
2. THE event handler binding logic SHALL NOT allocate additional memory compared to the pre-fix implementation
3. WHERE runtime validation is enabled in development mode, THE validation overhead SHALL NOT exceed 1ms per component mount
4. THE Svelte_Compiler SHALL optimize the lowercase event handler props to direct DOM event binding without wrapper functions
5. WHEN the fix is deployed, THE application SHALL maintain 60fps scrolling performance in the main Arena view (per 04-performance.md requirements)

### Requirement 10: Rollout and Verification Strategy

**User Story:** As a release manager, I want a phased rollout plan with verification checkpoints, so that the fix can be deployed safely without breaking production.

#### Acceptance Criteria

1. THE fix SHALL be applied first to CustomTextButton, followed by project-wide audit and batch updates
2. WHEN each component is updated, THE developer SHALL run `pnpm typecheck && pnpm lint && pnpm test` to verify the change
3. WHERE a component update causes test failures, THE developer SHALL halt the rollout and investigate the root cause
4. THE final verification SHALL include a full regression test suite covering all HMVC modules
5. WHEN the rollout is complete, THE project SHALL pass all CI checks including `pnpm build`, `pnpm check:i18n`, and `pnpm check:budget` with zero errors

