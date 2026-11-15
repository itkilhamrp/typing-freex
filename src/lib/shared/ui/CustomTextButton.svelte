<script lang="ts">
	import type { ClickKeyEventHandler } from '../types/event-handlers.js';

	/**
	 * CustomTextButton Component Props
	 * 
	 * A button component with strict Svelte 5 compliant event handler typing.
	 * Use lowercase `onclick` (NOT `onClick`) for click/keyboard event handling.
	 * 
	 * @example
	 * ```svelte
	 * <CustomTextButton onclick={(e) => handleClick(e)}>Click Me</CustomTextButton>
	 * ```
	 */
	interface Props {
		/** 
		 * Click/keyboard event handler (Svelte 5 compliant lowercase)
		 * Use lowercase `onclick` (Svelte 5 compliant), not `onClick` (React-style)
		 */
		onclick?: ClickKeyEventHandler;
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

<style>
	/* Minimal styling - can be extended via class prop */
	button {
		cursor: pointer;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
</style>
