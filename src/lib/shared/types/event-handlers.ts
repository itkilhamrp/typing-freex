/**
 * Shared TypeScript type definitions for event handler props
 * 
 * These types enforce Svelte 5 compliant lowercase event handler naming.
 * Use these types in component prop interfaces to ensure compile-time safety.
 * 
 * @see https://svelte.dev/docs/svelte/event-handling
 */

/**
 * Standard event handler prop type for mouse events
 * 
 * @example
 * ```typescript
 * interface ButtonProps {
 *   onclick?: MouseEventHandler;
 * }
 * ```
 */
export type MouseEventHandler = (event: MouseEvent) => void;

/**
 * Standard event handler prop type for keyboard events
 * 
 * @example
 * ```typescript
 * interface InputProps {
 *   onkeydown?: KeyboardEventHandler;
 * }
 * ```
 */
export type KeyboardEventHandler = (event: KeyboardEvent) => void;

/**
 * Combined event handler for components that handle both click and keyboard events
 * 
 * Useful for button-like components that respond to both mouse clicks
 * and keyboard navigation (Enter/Space keys).
 * 
 * @example
 * ```typescript
 * interface InteractiveProps {
 *   onclick?: ClickKeyEventHandler;
 * }
 * ```
 */
export type ClickKeyEventHandler = (event: MouseEvent | KeyboardEvent) => void;

/**
 * Standard event handler prop type for focus events
 */
export type FocusEventHandler = (event: FocusEvent) => void;

/**
 * Standard event handler prop type for input events
 */
export type InputEventHandler = (event: Event) => void;

/**
 * Standard event handler prop type for change events
 */
export type ChangeEventHandler = (event: Event) => void;
