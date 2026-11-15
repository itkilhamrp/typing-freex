/**
 * Text Sanitization Module (§5.11.6, C-16, SEC-18)
 * Canonical TypeScript implementation mirroring Rust authoritative sanitizer.
 */

// Bidi control characters to strip unconditionally
const BIDI_REGEX = /[\u202A-\u202E\u2066-\u2069]/g;

// C0 and C1 control characters (excluding newline \n (0x0A) and tab \t (0x09))
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u0080-\u009F]/g;

export const MAX_TEXT_LENGTH = 50_000;
export const MIN_TEXT_LENGTH = 1;

export interface SanitizationResult {
  text: string;
  charCount: number;
  wordCount: number;
  isValid: boolean;
  error?: string | undefined;
}

/**
 * Strips disallowed control characters, bidi overrides, standardizes newlines,
 * and normalizes unicode into NFC form.
 */
export function sanitizeText(input: string): string {
  if (!input) return '';

  // 1. CRLF / CR -> LF
  let result = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Unicode normalization to NFC
  result = result.normalize('NFC');

  // 3. Remove C0 and C1 control characters (preserve \n and \t)
  result = result.replace(CONTROL_CHARS_REGEX, '');

  // 4. Remove Bidi overrides (U+202A–U+202E, U+2066–U+2069)
  result = result.replace(BIDI_REGEX, '');

  return result;
}

/**
 * Checks if text is empty or contains only whitespace.
 */
export function isWhitespaceOnly(text: string): boolean {
  return text.trim().length === 0;
}

/**
 * Validates text length against PRD limits (1 - 50,000 chars)
 * and verifies it is not empty or whitespace-only.
 */
export function validateText(text: string): { isValid: boolean; error?: string } {
  if (text.length === 0 || isWhitespaceOnly(text)) {
    return {
      isValid: false,
      error: 'Text cannot be empty or whitespace-only.',
    };
  }

  // Count unicode scalar values / code points
  const codePointsCount = Array.from(text).length;

  if (codePointsCount > MAX_TEXT_LENGTH) {
    return {
      isValid: false,
      error: `Text length (${codePointsCount} characters) exceeds maximum allowed length of ${MAX_TEXT_LENGTH} characters.`,
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes input and returns derived metrics and validity.
 */
export function sanitizeAndValidate(raw: string): SanitizationResult {
  const text = sanitizeText(raw);
  const validation = validateText(text);

  const trimmed = text.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = Array.from(text).length;

  return {
    text,
    charCount,
    wordCount,
    isValid: validation.isValid,
    error: validation.error,
  };
}
