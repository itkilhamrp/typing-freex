import { describe, it, expect } from 'vitest';
import type { ClickKeyEventHandler } from '../types/event-handlers.js';

/**
 * Basic type checking tests for CustomTextButton component props
 * These tests verify that the TypeScript interfaces compile correctly
 */

describe('CustomTextButton Types', () => {
	it('should accept valid ClickKeyEventHandler type', () => {
		const validHandler: ClickKeyEventHandler = (event: MouseEvent | KeyboardEvent) => {
			expect(event).toBeDefined();
		};

		expect(typeof validHandler).toBe('function');
	});

	it('should allow undefined onclick prop', () => {
		const undefinedHandler: ClickKeyEventHandler | undefined = undefined;
		expect(undefinedHandler).toBeUndefined();
	});

	it('should correctly type MouseEvent in handler', () => {
		const handler: ClickKeyEventHandler = (event) => {
			if (event instanceof MouseEvent) {
				expect(event.type).toBeDefined();
				expect(event.clientX).toBeDefined();
			}
		};

		const mockMouseEvent = new MouseEvent('click');
		handler(mockMouseEvent);
	});

	it('should correctly type KeyboardEvent in handler', () => {
		const handler: ClickKeyEventHandler = (event) => {
			if (event instanceof KeyboardEvent) {
				expect(event.type).toBeDefined();
				expect(event.key).toBeDefined();
			}
		};

		const mockKeyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
		handler(mockKeyboardEvent);
	});
});
