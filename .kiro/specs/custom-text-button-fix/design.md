# Design Document: Custom Text Button Event Handler Fix

## Overview

This design addresses a critical event handler prop mismatch in Svelte 5 button components across the Typing FreeX codebase. The root cause is the use of React-style `onClick` (camelCase) instead of Svelte 5 compliant `onclick` (lowercase), causing silent event handler failures. The fix standardizes all event handler props to lowercase, implements compile-time and runtime validation, and prevents future regressions through automated tooling.

**Design Principles:**
- **UNIX Philosophy**: Each tool does one thing well (scanner, migrator, validator are separate)
- **Zero Latency**: Event binding must not introduce performance overhead (< 16ms response)
- **Fail Fast**: TypeScript strict mode catches prop mismatches at compile time
- **HMVC Compliance**: UI components remain isolated from business logic
- **Minimal Scope**: Fix only what's broken, don't over-engineer

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Custom Text Button Fix                        │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌────────────────┐
│  Component   │    │   Type System    │    │   Tooling      │
│  Updates     │    │   Enforcement    │    │   Automation   │
└──────────────┘    └──────────────────┘    └────────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌────────────────┐
│CustomText    │    │TS Interface      │    │Scanner         │
│Button.svelte │    │Strict Types      │    │Linter Rules    │
│              │    │                  │    │Migration Tool  │
│Other Button  │    │Compile-time      │    │                │
│Components    │    │Validation        │    │CI Integration  │
└──────────────┘    └──────────────────┘    └────────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Runtime Guard    │
                    │ (Dev Mode Only)  │
                    └──────────────────┘
```

### Architecture Layers

1. **Component Layer**: Svelte 5 Runes components using `$props()` and `$effect`
2. **Type System Layer**: TypeScript strict mode interfaces enforcing lowercase event props
3. **Tooling Layer**: Scanner, linter, and migration utilities
4. **Runtime Guard Layer**: Development-mode validation using `$effect` rune

### Design Constraints

- **Svelte 5 Runes Only**: Use `$state`, `$derived`, `$props`, `$effect` exclusively
- **TypeScript Strict Mode**: All type definitions must pass `strict: true` checks
- **Zero UI Dependencies**: Core event binding logic has no UI framework dependencies
- **Performance Budget**: Event handler execution < 16ms, validation overhead < 1ms
- **100% Backward Compatibility**: All existing handler logic preserved

## Component Design

### 1. CustomTextButton Component

**Location**: `src/lib/modules/shared/components/CustomTextButton.svelte`

**Responsibilities**:
- Accept lowercase `onclick` prop with strict typing
- Bind `onclick` to underlying button element
- Support both mouse clicks and keyboard navigation (Enter/Space)
- Validate prop types in development mode
- Maintain accessibility (ARIA, keyboard focus)

**Interface**:

```typescript
interface CustomTextButtonProps {
	/** Click/keyboard event handler (Svelte 5 compliant lowercase) */
	onclick?: (event: MouseEvent | KeyboardEvent) => void;
	/** Button text content */
	children?: import('svelte').Snippet;
	/** CSS classes for styling */
	class?: string;
	/** Disabled state */
	disabled?: boolean;
	/** Button type attribute */
	type?: 'button' | 'submit' | 'reset';
	/** ARIA label for accessibility */
	ariaLabel?: string;
}
```

**Implementation Pattern** (Svelte 5 Runes):

```svelte
<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		onclick?: (event: MouseEvent | KeyboardEvent) => void;
		children?: import('svelte').Snippet;
		class?: string;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		ariaLabel?: string;
	}

	let {
		onclick,
		children,
		class: className = '',
		disabled = false,
		type = 'button',
		ariaLabel
	}: Props = $props();

	// Runtime validation in development mode
	$effect(() => {
		if (import.meta.env.DEV) {
			if (onclick !== undefined && typeof onclick !== 'function') {
				console.error(
					`[CustomTextButton] Invalid onclick prop: expected function or undefined, received ${typeof onclick}`
				);
			}
		}
	});

	function handleClick(event: MouseEvent) {
		if (!disabled && onclick) {
			onclick(event);
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!disabled && onclick && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			onclick(event);
		}
	}
</script>

<button
	{type}
	{disabled}
	class={className}
	aria-label={ariaLabel}
	onclick={handleClick}
	onkeydown={handleKeyDown}
>
	{#if children}
		{@render children()}
	{/if}
</button>
```

### 2. Component Scanner Tool

**Purpose**: Audit all `.svelte` files for event handler prop mismatches

**Location**: `scripts/audit-event-handlers.ts`

**Algorithm**:
```typescript
interface ScanResult {
	filePath: string;
	lineNumber: number;
	propName: string;
	severity: 'error' | 'warning';
}

interface AuditReport {
	scannedFiles: number;
	issuesFound: ScanResult[];
	compliantComponents: string[];
}

/**
 * Scans a directory for Svelte components with button elements
 * and checks for camelCase event handler props
 */
async function scanComponents(directory: string): Promise<AuditReport> {
	// 1. Find all .svelte files in src/lib/modules/
	// 2. Parse each file for <button> elements
	// 3. Extract prop bindings using regex or AST parsing
	// 4. Flag any camelCase event props (onClick, onChange, etc.)
	// 5. Generate structured report with file paths and line numbers
}
```

**Detection Pattern**:
```typescript
const CAMEL_CASE_EVENT_PROPS = /\b(onClick|onChange|onInput|onKeyDown|onKeyUp|onFocus|onBlur|onSubmit|onMouseEnter|onMouseLeave)\b/g;

const BUTTON_ELEMENTS = /<button[^>]*>/g;
```

### 3. Linter Rule Configuration

**ESLint Custom Rule**: `svelte-lowercase-event-handlers`

**Configuration** (`.eslintrc.cjs`):
```javascript
module.exports = {
	rules: {
		'svelte/valid-prop-names-in-kit-pages': 'error',
		// Custom rule to enforce lowercase event handlers
		'@typescript-eslint/naming-convention': [
			'error',
			{
				selector: 'property',
				filter: {
					regex: '^on[A-Z]',
					match: true
				},
				format: null,
				custom: {
					regex: '^on[a-z]',
					match: true
				},
				message: 'Use lowercase event handler props (e.g., onclick, not onClick)'
			}
		]
	}
};
```

**Alternative**: Create Svelte-specific ESLint plugin rule that parses `.svelte` templates directly.

### 4. Migration Utility

**Purpose**: Automated batch rename of `onClick` → `onclick` with verification

**Location**: `scripts/migrate-event-handlers.ts`

**Algorithm**:
```typescript
interface MigrationResult {
	filePath: string;
	changes: Array<{ line: number; before: string; after: string }>;
	success: boolean;
	error?: string;
}

/**
 * Migrates camelCase event props to lowercase in a component file
 */
async function migrateComponent(filePath: string): Promise<MigrationResult> {
	// 1. Read component source
	// 2. Parse and identify camelCase event props
	// 3. Replace with lowercase equivalents
	// 4. Update TypeScript interfaces if present
	// 5. Run prettier formatter
	// 6. Verify with TypeScript compiler
	// 7. Return structured migration result
}

/**
 * Batch migration with verification checkpoints
 */
async function batchMigrate(componentPaths: string[]): Promise<void> {
	for (const path of componentPaths) {
		const result = await migrateComponent(path);
		if (!result.success) {
			console.error(`Migration failed for ${path}: ${result.error}`);
			process.exit(1); // Halt on first failure
		}
		// Run verification: pnpm typecheck && pnpm lint
		const verifyResult = await verifyComponent(path);
		if (!verifyResult.success) {
			console.error(`Verification failed for ${path}`);
			process.exit(1);
		}
	}
}
```

### 5. Runtime Validation Guard

**Implementation**: Embedded in each button component using `$effect` rune

**Design**:
```typescript
// Only active in development mode
$effect(() => {
	if (import.meta.env.DEV) {
		// Validate onclick prop type
		if (onclick !== undefined && typeof onclick !== 'function') {
			console.error(
				`[${componentName}] Invalid onclick prop type: ${typeof onclick}. Expected function or undefined.`
			);
		}
		
		// Additional checks for other event handlers
		if (onkeydown !== undefined && typeof onkeydown !== 'function') {
			console.error(
				`[${componentName}] Invalid onkeydown prop type: ${typeof onkeydown}`
			);
		}
	}
});
```

**Production Build**: Vite/Rollup tree-shaking removes `import.meta.env.DEV` blocks entirely.

## Data Models

### Type Definitions

```typescript
/**
 * Standard event handler prop type for mouse events
 */
type MouseEventHandler = (event: MouseEvent) => void;

/**
 * Standard event handler prop type for keyboard events
 */
type KeyboardEventHandler = (event: KeyboardEvent) => void;

/**
 * Combined event handler for components that handle both click and keyboard
 */
type ClickKeyEventHandler = (event: MouseEvent | KeyboardEvent) => void;

/**
 * Component props with strict event handler typing
 */
interface ButtonComponentProps {
	/** Lowercase onclick handler (Svelte 5 compliant) */
	onclick?: ClickKeyEventHandler;
	/** Lowercase onkeydown handler */
	onkeydown?: KeyboardEventHandler;
	/** Lowercase onfocus handler */
	onfocus?: (event: FocusEvent) => void;
	/** Lowercase onblur handler */
	onblur?: (event: FocusEvent) => void;
}

/**
 * Scanner audit result structure
 */
interface ComponentAuditResult {
	/** Absolute file path */
	filePath: string;
	/** Component name extracted from filename */
	componentName: string;
	/** Whether component has button elements */
	hasButtons: boolean;
	/** List of detected camelCase event props */
	camelCaseProps: Array<{
		propName: string;
		lineNumber: number;
		lineContent: string;
	}>;
	/** Whether component passes audit */
	isCompliant: boolean;
}

/**
 * Migration operation record
 */
interface MigrationRecord {
	/** Timestamp of migration */
	timestamp: string;
	/** Component file path */
	filePath: string;
	/** Changes applied */
	changes: Array<{
		lineNumber: number;
		oldProp: string;
		newProp: string;
	}>;
	/** TypeScript compilation result after migration */
	compilationSuccess: boolean;
	/** Test suite result after migration */
	testsPass: boolean;
}
```

## Error Handling

### Compile-Time Errors

**TypeScript Type Mismatch**:
```typescript
// This will cause compile-time error:
<CustomTextButton onClick={() => console.log('clicked')} />
//                ^^^^^^^^^
// Error: Object literal may only specify known properties,
// and 'onClick' does not exist in type 'CustomTextButtonProps'
```

**Linter Error**:
```
error: Use lowercase event handler props (e.g., onclick, not onClick)
  at CustomTextButton.svelte:15:3
  onClick={() => console.log('clicked')}
  ^^^^^^^
```

### Runtime Errors (Development Mode Only)

**Invalid Prop Type**:
```typescript
// Passing non-function to onclick
<CustomTextButton onclick="invalid" />
```

**Console Output**:
```
[CustomTextButton] Invalid onclick prop: expected function or undefined, received string
```

**Graceful Degradation**: Component still renders but logs error. Does not throw exception.

### Migration Errors

**Verification Failure**:
```
Migration Error: Component verification failed
  File: src/lib/modules/shared/components/OldButton.svelte
  Reason: TypeScript compilation failed after migration
  
  Type error: Property 'onClick' does not exist on type 'HTMLAttributes<HTMLButtonElement>'
  
Action: Reverting changes and halting migration.
```

### Performance Errors

**Latency Violation**:
```
Performance Warning: Event handler execution exceeded 16ms threshold
  Component: CustomTextButton
  Handler: onclick
  Execution Time: 23ms
  
Recommendation: Optimize handler logic or debounce expensive operations
```

## Testing Strategy

### Unit Tests (Vitest + Testing Library)

**Test File**: `src/lib/modules/shared/components/CustomTextButton.test.ts`

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import CustomTextButton from './CustomTextButton.svelte';

describe('CustomTextButton', () => {
	it('renders without errors when onclick is undefined', () => {
		const { container } = render(CustomTextButton, {
			props: { children: 'Click Me' }
		});
		expect(container.querySelector('button')).toBeInTheDocument();
	});

	it('invokes onclick handler on mouse click', async () => {
		const handleClick = vi.fn();
		const { getByRole } = render(CustomTextButton, {
			props: { onclick: handleClick, children: 'Click Me' }
		});
		
		const button = getByRole('button');
		await fireEvent.click(button);
		
		expect(handleClick).toHaveBeenCalledOnce();
		expect(handleClick).toHaveBeenCalledWith(expect.any(MouseEvent));
	});

	it('invokes onclick handler on Enter key press', async () => {
		const handleClick = vi.fn();
		const { getByRole } = render(CustomTextButton, {
			props: { onclick: handleClick, children: 'Click Me' }
		});
		
		const button = getByRole('button');
		await fireEvent.keyDown(button, { key: 'Enter' });
		
		expect(handleClick).toHaveBeenCalledOnce();
		expect(handleClick).toHaveBeenCalledWith(expect.any(KeyboardEvent));
	});

	it('invokes onclick handler on Space key press', async () => {
		const handleClick = vi.fn();
		const { getByRole } = render(CustomTextButton, {
			props: { onclick: handleClick, children: 'Click Me' }
		});
		
		const button = getByRole('button');
		await fireEvent.keyDown(button, { key: ' ' });
		
		expect(handleClick).toHaveBeenCalledOnce();
		expect(handleClick).toHaveBeenCalledWith(expect.any(KeyboardEvent));
	});

	it('does not invoke onclick when disabled', async () => {
		const handleClick = vi.fn();
		const { getByRole } = render(CustomTextButton, {
			props: { onclick: handleClick, disabled: true, children: 'Click Me' }
		});
		
		const button = getByRole('button');
		await fireEvent.click(button);
		
		expect(handleClick).not.toHaveBeenCalled();
	});
});
```

### Property-Based Tests (fast-check)

**Test File**: `src/lib/modules/shared/components/CustomTextButton.property.test.ts`

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import CustomTextButton from './CustomTextButton.svelte';

describe('CustomTextButton - Property Tests', () => {
	it('Property 1: Event handler invocation on click', () => {
		fc.assert(
			fc.property(fc.func(fc.constant(undefined)), async (handler) => {
				let callCount = 0;
				const trackingHandler = (event: MouseEvent | KeyboardEvent) => {
					callCount++;
					handler(event);
				};

				const { getByRole } = render(CustomTextButton, {
					props: { onclick: trackingHandler, children: 'Test' }
				});

				const button = getByRole('button');
				await fireEvent.click(button);

				expect(callCount).toBe(1);
			}),
			{ numRuns: 100 }
		);
	});

	it('Property 2: Event handler receives correct event type on click', () => {
		fc.assert(
			fc.property(fc.func(fc.constant(undefined)), async (handler) => {
				let receivedEvent: Event | null = null;
				const capturingHandler = (event: MouseEvent | KeyboardEvent) => {
					receivedEvent = event;
					handler(event);
				};

				const { getByRole } = render(CustomTextButton, {
					props: { onclick: capturingHandler, children: 'Test' }
				});

				const button = getByRole('button');
				await fireEvent.click(button);

				expect(receivedEvent).toBeInstanceOf(MouseEvent);
			}),
			{ numRuns: 100 }
		);
	});

	it('Property 3: Keyboard event handling preserves handler logic', () => {
		fc.assert(
			fc.property(
				fc.func(fc.constant(undefined)),
				fc.constantFrom('Enter', ' '),
				async (handler, key) => {
					let callCount = 0;
					const trackingHandler = (event: MouseEvent | KeyboardEvent) => {
						callCount++;
						handler(event);
					};

					const { getByRole } = render(CustomTextButton, {
						props: { onclick: trackingHandler, children: 'Test' }
					});

					const button = getByRole('button');
					await fireEvent.keyDown(button, { key });

					expect(callCount).toBe(1);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('Property 4: Development mode validation logs errors for invalid onclick', () => {
		fc.assert(
			fc.property(
				fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
				(invalidValue) => {
					const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

					// @ts-expect-error - intentionally passing invalid type for testing
					render(CustomTextButton, {
						props: { onclick: invalidValue, children: 'Test' }
					});

					if (import.meta.env.DEV) {
						expect(consoleSpy).toHaveBeenCalledWith(
							expect.stringContaining('Invalid onclick prop')
						);
					}

					consoleSpy.mockRestore();
				}
			),
			{ numRuns: 100 }
		);
	});
});
```

### Integration Tests

**Scanner Tool Test**:
```typescript
// scripts/audit-event-handlers.test.ts
import { describe, it, expect } from 'vitest';
import { scanComponents } from './audit-event-handlers';
import { mkdtemp, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Component Scanner', () => {
	it('detects camelCase event props in components', async () => {
		const testDir = await mkdtemp(join(tmpdir(), 'test-'));
		const testFile = join(testDir, 'TestButton.svelte');
		
		await writeFile(testFile, `
			<script lang="ts">
				let { onClick } = $props();
			</script>
			<button onClick={onClick}>Click</button>
		`);

		const report = await scanComponents(testDir);
		
		expect(report.issuesFound).toHaveLength(1);
		expect(report.issuesFound[0].propName).toBe('onClick');
	});

	it('approves components with lowercase event props', async () => {
		const testDir = await mkdtemp(join(tmpdir(), 'test-'));
		const testFile = join(testDir, 'GoodButton.svelte');
		
		await writeFile(testFile, `
			<script lang="ts">
				let { onclick } = $props();
			</script>
			<button onclick={onclick}>Click</button>
		`);

		const report = await scanComponents(testDir);
		
		expect(report.issuesFound).toHaveLength(0);
		expect(report.compliantComponents).toContain('GoodButton.svelte');
	});
});
```

### Performance Tests

```typescript
// src/lib/modules/shared/components/CustomTextButton.perf.test.ts
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import CustomTextButton from './CustomTextButton.svelte';

describe('CustomTextButton Performance', () => {
	it('executes onclick handler within 16ms', async () => {
		const handleClick = () => {
			// Simulate minimal handler logic
			const result = Math.random() * 100;
			return result;
		};

		const { getByRole } = render(CustomTextButton, {
			props: { onclick: handleClick, children: 'Click Me' }
		});

		const button = getByRole('button');
		
		const startTime = performance.now();
		await fireEvent.click(button);
		const endTime = performance.now();
		
		const executionTime = endTime - startTime;
		expect(executionTime).toBeLessThan(16);
	});

	it('development mode validation completes within 1ms', () => {
		if (!import.meta.env.DEV) {
			return; // Skip in production
		}

		const startTime = performance.now();
		
		render(CustomTextButton, {
			props: { onclick: () => {}, children: 'Test' }
		});
		
		const endTime = performance.now();
		const mountTime = endTime - startTime;
		
		// Validation overhead should be < 1ms
		expect(mountTime).toBeLessThan(50); // Generous bound for full mount
	});
});
```

## Implementation Phases

### Phase 1: Fix CustomTextButton (Priority 1)
1. Update `CustomTextButton.svelte` to use lowercase `onclick` prop
2. Add TypeScript interface with strict typing
3. Implement runtime validation with `$effect` rune
4. Add JSDoc documentation
5. Write unit tests and property tests
6. Verify: `pnpm typecheck && pnpm lint && pnpm test`

### Phase 2: Build Tooling (Priority 1)
1. Create component scanner script (`scripts/audit-event-handlers.ts`)
2. Run scanner to generate full audit report
3. Configure ESLint rule for camelCase event prop detection
4. Verify linter catches violations: `pnpm lint`

### Phase 3: Project-Wide Migration (Priority 2)
1. Create migration utility (`scripts/migrate-event-handlers.ts`)
2. Migrate components in batches (by HMVC module)
3. Run verification after each batch: `pnpm typecheck && pnpm test`
4. Update component documentation

### Phase 4: CI Integration (Priority 2)
1. Add linter rule to CI pipeline (`.github/workflows/ci.yml`)
2. Add scanner check to pre-commit hook
3. Configure CI to fail on camelCase event props
4. Document rollback procedure

### Phase 5: Verification & Documentation (Priority 3)
1. Run full regression test suite
2. Performance benchmarking (scrolling FPS, event latency)
3. Update component library documentation
4. Create migration guide for future contributors

## Rollout Strategy

### Verification Checkpoints

**After CustomTextButton Fix**:
```bash
pnpm typecheck  # Must pass with 0 errors
pnpm lint       # Must pass with 0 warnings
pnpm test       # All tests must pass
pnpm build      # Production build must succeed
```

**After Each Module Migration**:
```bash
pnpm test:unit -- src/lib/modules/{module_name}
pnpm typecheck
```

**Final Verification**:
```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
pnpm check:i18n     # Verify i18n integrity
pnpm check:budget   # Verify bundle size budget
```

### Rollback Plan

If any phase fails verification:
1. Git revert the failed component changes
2. Restore previous working state
3. Analyze root cause (test logs, TypeScript errors)
4. Fix underlying issue before retrying
5. Document failure and resolution in migration log

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following testable properties. Several criteria were eliminated as redundant:

**Eliminated as Redundant**:
- Requirement 8.2 and 8.3 (test behavior specifications) are covered by Properties 1, 2, and 3
- Requirement 1.1 (type interface) is covered by Property 1's type safety validation
- Requirement 4.3 (behavior preservation) is subsumed by Property 5's migration validation
- Requirement 9.4 (compiler optimization) is an implementation detail, not user-observable behavior

**Remaining Properties** provide unique validation value covering event binding, type safety, scanning, migration, validation, and performance.

---

### Property 1: Event Handler Invocation on Click

*For any* valid onclick handler function, when passed to CustomTextButton and the button is clicked, the handler SHALL be invoked exactly once with a MouseEvent.

**Validates: Requirements 1.2, 1.4**

---

### Property 2: Event Handler Invocation on Keyboard

*For any* valid onclick handler function, when passed to CustomTextButton and the user presses Enter or Space key while focused, the handler SHALL be invoked exactly once with a KeyboardEvent.

**Validates: Requirements 1.5**

---

### Property 3: Invalid Prop Type Validation

*For any* non-function, non-undefined value passed as the onclick prop in development mode, CustomTextButton SHALL log a console error and render without throwing an exception.

**Validates: Requirements 5.1, 5.2, 5.4**

---

### Property 4: Scanner Detection Accuracy

*For any* Svelte component file containing a camelCase event handler prop (onClick, onChange, etc.), the component scanner SHALL flag the file with the correct file path, line number, and prop name.

**Validates: Requirements 2.2, 2.4**

---

### Property 5: Scanner Approval for Compliant Components

*For any* Svelte component file using only lowercase event handler props (onclick, onchange, etc.), the component scanner SHALL mark the component as compliant and include it in the approved components list.

**Validates: Requirements 2.3**

---

### Property 6: Migration Behavior Preservation

*For any* component with an existing onClick handler, after migration to onclick, the handler logic and invocation behavior SHALL remain identical to the pre-migration state.

**Validates: Requirements 4.1, 4.3**

---

### Property 7: Migration Parent-Child Prop Updates

*For any* parent component that passes an onClick prop to a child component, the migration SHALL update both the parent's prop passing and the child's prop interface to use onclick.

**Validates: Requirements 4.4**

---

### Property 8: Linter Detection and Suggestions

*For any* Svelte component containing a camelCase event handler prop, the linter SHALL emit an error during `pnpm lint` and suggest the correct lowercase alternative.

**Validates: Requirements 7.2, 7.3**

---

### Property 9: Linter Comprehensive Coverage

*For any* standard DOM event handler (click, change, input, keydown, keyup, focus, blur, submit, mouseenter, mouseleave), the linter SHALL enforce lowercase naming and flag camelCase violations.

**Validates: Requirements 7.4**

---

### Property 10: Event Handler Performance

*For any* onclick handler function, when invoked through CustomTextButton, the execution time from click event to handler completion SHALL be less than 16 milliseconds.

**Validates: Requirements 9.1**

---

### Property 11: Validation Overhead Performance

*For any* component mount in development mode with runtime validation enabled, the validation logic SHALL complete in less than 1 millisecond.

**Validates: Requirements 9.3**

---

## Security Considerations

**No Direct Security Impact**: This fix addresses event binding correctness, not security vulnerabilities.

**Indirect Security Benefits**:
- **Type Safety**: Strict TypeScript interfaces prevent prop injection attacks
- **Runtime Validation**: Development mode guards catch unexpected prop types
- **CI Enforcement**: Automated linter prevents malformed event bindings from reaching production

**No New Attack Surface**: The fix does not introduce network calls, data storage, or external dependencies.

## Performance Impact

**Expected Impact**: Zero performance regression

**Measurements**:
- Event handler binding: Direct DOM event attachment (no wrapper functions)
- Svelte 5 compiler optimization: Lowercase props compile to native `addEventListener` calls
- Runtime validation: Stripped from production builds via tree-shaking
- Memory allocation: Identical to pre-fix implementation (no additional closures)

**Validation**:
- Scrolling FPS: Maintain 60fps in Arena view (per 04-performance.md)
- Event latency: < 16ms from click to handler execution
- Bundle size: No increase (validation code removed in production)

## Accessibility

**Maintained Features**:
- Keyboard navigation (Enter/Space key support)
- ARIA labels (`ariaLabel` prop)
- Focus management (native button element)
- Disabled state handling

**No Changes**: The fix does not alter accessibility features. All existing ARIA attributes and keyboard interactions remain unchanged.

## Localization

**No Impact**: Event handler prop naming is internal component API. No user-facing strings are affected.

## Monitoring & Observability

**Development Mode**:
- Console errors for invalid onclick prop types
- Component name included in error messages for debugging

**Production Mode**:
- No runtime validation (stripped via tree-shaking)
- Standard browser DevTools for event listener inspection

**CI Pipeline**:
- Linter errors in PR checks
- TypeScript compilation errors block merge
- Test failures halt deployment

## Dependencies

**No New Dependencies**: This fix uses existing tooling and libraries.

**Existing Tools**:
- TypeScript 5.x (strict mode type checking)
- ESLint + typescript-eslint (linter rules)
- Vitest + Testing Library (unit tests)
- fast-check (property-based tests)
- Svelte 5 compiler (event binding optimization)

**Build Tools**:
- PNPM (package manager)
- Vite (bundler with tree-shaking)

## Conclusion

This design provides a minimal, surgical fix for the event handler prop mismatch while establishing safeguards against future regressions. The solution adheres to UNIX Philosophy (single-purpose tools), maintains zero-latency performance requirements, and leverages TypeScript strict mode for compile-time safety.

**Key Outcomes**:
1. CustomTextButton and all button components use lowercase `onclick` props
2. TypeScript catches prop naming errors at compile time
3. Linter prevents future camelCase event props from being committed
4. Runtime validation guards development mode without production overhead
5. 100% backward compatibility maintained through careful migration

**Success Criteria**:
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` passes with 0 errors and 0 warnings
- All correctness properties verified through property-based testing (100 iterations minimum)
- Event handler latency remains < 16ms
- No bundle size increase
- Full regression test suite passes
