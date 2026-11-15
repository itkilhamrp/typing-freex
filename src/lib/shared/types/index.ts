/**
 * Shared type definitions for the Typing FreeX application
 * 
 * This barrel file exports all shared types for easy importing across modules.
 */

export type {
	MouseEventHandler,
	KeyboardEventHandler,
	ClickKeyEventHandler,
	FocusEventHandler,
	InputEventHandler,
	ChangeEventHandler
} from './event-handlers.js';

export type ResultUUID = string;
export type ProfileID = string;

export type TypingMode = 'time' | 'words' | 'quote' | 'tech' | 'zen' | 'custom';

export type SpeedUnit = 'wpm' | 'cpm' | 'kph';

export interface BaseMetricResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  durationSeconds: number;
}

