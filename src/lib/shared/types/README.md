# Shared Type Definitions

This directory contains shared TypeScript type definitions used across the Typing FreeX application.

## Event Handler Types

Located in `event-handlers.ts`, these types enforce Svelte 5 compliant lowercase event handler naming.

### Available Types

- **`MouseEventHandler`**: For mouse events (click, mouseenter, mouseleave, etc.)
- **`KeyboardEventHandler`**: For keyboard events (keydown, keyup, keypress)
- **`ClickKeyEventHandler`**: For components handling both mouse and keyboard events
- **`FocusEventHandler`**: For focus/blur events
- **`InputEventHandler`**: For input events
- **`ChangeEventHandler`**: For change events

### Usage

```typescript
import type { ClickKeyEventHandler } from '#lib/shared/types/event-handlers.js';

interface ButtonProps {
  // Use lowercase 'onclick' (Svelte 5 compliant), not 'onClick' (React-style)
  onclick?: ClickKeyEventHandler;
}
```

### Svelte 5 Compliance

**IMPORTANT**: Always use lowercase event handler prop names in Svelte 5:
- ✅ `onclick` (correct)
- ❌ `onClick` (wrong - React-style)

The TypeScript compiler will catch incorrect prop names at build time.

## Domain & Metric Types

Exported from `index.ts`:

- **`ResultUUID`**: Unique identifier string for test results
- **`ProfileID`**: Unique identifier string for user profiles
- **`TypingMode`**: Union type `'time' | 'words' | 'quote' | 'tech' | 'zen' | 'custom'`
- **`SpeedUnit`**: Speed telemetry unit `'wpm' | 'cpm' | 'kph'`
- **`BaseMetricResult`**: Common metrics payload interface (`wpm`, `rawWpm`, `accuracy`, `consistency`, `durationSeconds`)

### Usage

```typescript
import type { TypingMode, SpeedUnit, BaseMetricResult } from '#lib/shared/types/index.js';
```

## Adding New Types

When adding new shared types:

1. Create the type definition file in this directory
2. Export types from `index.ts` for easy importing
3. Add JSDoc documentation explaining the type's purpose
4. Include usage examples in the JSDoc
5. Update this README with the new type information
