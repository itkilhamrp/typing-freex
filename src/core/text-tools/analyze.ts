/**
 * Text Analysis and Issue Detection Module (§5.11.4, §5.11.5)
 * Analyzes text for typing feasibility, calculates stats and detects issues.
 */

export type IssueSeverity = 'Error' | 'Warning' | 'Info';

export type IssueCode =
  | 'UNTYPEABLE_CHAR'
  | 'SMART_PUNCTUATION'
  | 'EXOTIC_SPACE'
  | 'TAB_CHARACTER'
  | 'MULTIPLE_SPACES'
  | 'TRAILING_WHITESPACE'
  | 'EXTRA_BLANK_LINES'
  | 'LONG_WORD'
  | 'CONTROL_CHAR'
  | 'BIDI_OVERRIDE'
  | 'WHITESPACE_ONLY'
  | 'TOO_LONG_FOR_SESSION';

export interface TextIssue {
  code: IssueCode;
  severity: IssueSeverity;
  messageKey: string;
  startIndex: number;
  endIndex: number;
  sample?: string | undefined;
  count?: number | undefined;
  canAutoFix: boolean;
}

export interface TextAnalysisResult {
  charCount: number;
  wordCount: number;
  lineCount: number;
  longestWordLength: number;
  longestWordSample: string;
  estimatedDurationSeconds: number;
  issues: TextIssue[];
  hasErrors: boolean;
}

const SMART_PUNCT_REGEX = /[\u201C\u201D\u201E\u00AB\u00BB\u2018\u2019\u201A\u2039\u203A\u2013\u2014\u2015\u2026\u2022]/g;
const EXOTIC_SPACE_REGEX = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\u200B-\u200D\uFEFF]/g;
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u0080-\u009F]/g;
const BIDI_REGEX = /[\u202A-\u202E\u2066-\u2069]/g;

export const MAX_SAFE_WORD_LENGTH = 35;

/**
 * Analyzes a text body and returns comprehensive metrics and detected issues.
 */
export function analyzeText(
  text: string,
  referenceWpm: number = 40,
  allowedCharsSet?: Set<string>
): TextAnalysisResult {
  const issues: TextIssue[] = [];
  const charCount = Array.from(text).length;

  // 1. Empty text check: pristine or cleared input has no typing quality issues
  if (text.length === 0) {
    return {
      charCount: 0,
      wordCount: 0,
      lineCount: 0,
      longestWordLength: 0,
      longestWordSample: '',
      estimatedDurationSeconds: 0,
      issues: [],
      hasErrors: false,
    };
  }

  // Whitespace only check: non-empty string that contains exclusively whitespace.
  // Note: a single incidental space or newline while beginning to type is not flagged as a fatal error.
  if (text.trim().length === 0) {
    if (text.length > 1) {
      issues.push({
        code: 'WHITESPACE_ONLY',
        severity: 'Error',
        messageKey: 'custom_text.issues.whitespace_only',
        startIndex: 0,
        endIndex: text.length,
        canAutoFix: false,
      });
    }

    return {
      charCount,
      wordCount: 0,
      lineCount: text.split('\n').length,
      longestWordLength: 0,
      longestWordSample: '',
      estimatedDurationSeconds: 0,
      issues,
      hasErrors: issues.length > 0,
    };
  }

  // 2. Lines & words computation
  const lines = text.split('\n');
  const lineCount = lines.length;

  const rawWords = text.trim().split(/\s+/);
  const wordCount = rawWords.filter(Boolean).length;

  let longestWordLength = 0;
  let longestWordSample = '';

  for (const word of rawWords) {
    if (word.length > longestWordLength) {
      longestWordLength = word.length;
      longestWordSample = word;
    }

    // Long word check (> 35 chars)
    if (word.length > MAX_SAFE_WORD_LENGTH) {
      const idx = text.indexOf(word);
      issues.push({
        code: 'LONG_WORD',
        severity: 'Warning',
        messageKey: 'custom_text.issues.long_word',
        startIndex: idx,
        endIndex: idx + word.length,
        sample: word.length > 25 ? `${word.slice(0, 22)}...` : word,
        canAutoFix: true,
      });
    }
  }

  // 3. Session length suggestion (> 2000 chars)
  if (charCount > 2000) {
    issues.push({
      code: 'TOO_LONG_FOR_SESSION',
      severity: 'Info',
      messageKey: 'custom_text.issues.too_long_for_session',
      startIndex: 2000,
      endIndex: charCount,
      canAutoFix: false,
    });
  }

  // 4. Regex scanning for character-level issues
  // Control characters
  let match: RegExpExecArray | null;
  while ((match = CONTROL_CHAR_REGEX.exec(text)) !== null) {
    issues.push({
      code: 'CONTROL_CHAR',
      severity: 'Error',
      messageKey: 'custom_text.issues.control_char',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      canAutoFix: true,
    });
  }

  // Bidi overrides
  while ((match = BIDI_REGEX.exec(text)) !== null) {
    issues.push({
      code: 'BIDI_OVERRIDE',
      severity: 'Error',
      messageKey: 'custom_text.issues.bidi_override',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      canAutoFix: true,
    });
  }

  // Smart punctuation
  while ((match = SMART_PUNCT_REGEX.exec(text)) !== null) {
    issues.push({
      code: 'SMART_PUNCTUATION',
      severity: 'Warning',
      messageKey: 'custom_text.issues.smart_punctuation',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      sample: match[0],
      canAutoFix: true,
    });
  }

  // Exotic spaces
  while ((match = EXOTIC_SPACE_REGEX.exec(text)) !== null) {
    issues.push({
      code: 'EXOTIC_SPACE',
      severity: 'Warning',
      messageKey: 'custom_text.issues.exotic_space',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      canAutoFix: true,
    });
  }

  // Tab characters
  const tabRegex = /\t+/g;
  while ((match = tabRegex.exec(text)) !== null) {
    issues.push({
      code: 'TAB_CHARACTER',
      severity: 'Info',
      messageKey: 'custom_text.issues.tab_character',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      canAutoFix: true,
    });
  }

  // Multiple spaces (prose)
  const multiSpacesRegex = / {2,}/g;
  while ((match = multiSpacesRegex.exec(text)) !== null) {
    issues.push({
      code: 'MULTIPLE_SPACES',
      severity: 'Info',
      messageKey: 'custom_text.issues.multiple_spaces',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      canAutoFix: true,
    });
  }

  // Trailing whitespace per line
  // Note: A single space at the very end of the document (EOF) is standard typing behavior
  // before entering the next word. We only flag trailing whitespace if:
  // (a) It occurs on an intermediate line before a newline, OR
  // (b) At the end of the text, if it consists of 2+ spaces or contains tabs.
  const trailingWsRegex = /[ \t]+$/gm;
  while ((match = trailingWsRegex.exec(text)) !== null) {
    const isAtEof = match.index + match[0].length === text.length;
    const isSingleTrailingSpaceAtEof = isAtEof && match[0] === ' ';

    if (!isSingleTrailingSpaceAtEof) {
      issues.push({
        code: 'TRAILING_WHITESPACE',
        severity: 'Info',
        messageKey: 'custom_text.issues.trailing_whitespace',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        canAutoFix: true,
      });
    }
  }

  // Extra blank lines (3+ consecutive newlines)
  const extraBlankLinesRegex = /\n{3,}/g;
  while ((match = extraBlankLinesRegex.exec(text)) !== null) {
    issues.push({
      code: 'EXTRA_BLANK_LINES',
      severity: 'Info',
      messageKey: 'custom_text.issues.extra_blank_lines',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      canAutoFix: true,
    });
  }

  // 5. Untypeable characters check against keyboard layout
  if (allowedCharsSet) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char && char !== '\n' && char !== '\r' && char !== '\t' && !allowedCharsSet.has(char)) {
        issues.push({
          code: 'UNTYPEABLE_CHAR',
          severity: 'Warning',
          messageKey: 'custom_text.issues.untypeable_char',
          startIndex: i,
          endIndex: i + 1,
          sample: char,
          canAutoFix: true,
        });
      }
    }
  }

  const estimatedDurationSeconds = Math.ceil((wordCount / Math.max(10, referenceWpm)) * 60);
  const hasErrors = issues.some((i) => i.severity === 'Error');

  return {
    charCount,
    wordCount,
    lineCount,
    longestWordLength,
    longestWordSample,
    estimatedDurationSeconds,
    issues,
    hasErrors,
  };
}

export type IssueCategory = 'invisible' | 'typography' | 'spacing' | 'structure';

export interface GroupedIssueSummary {
  code: IssueCode;
  category: IssueCategory;
  title: string;
  count: number;
  severity: IssueSeverity;
  samples: string[];
}

export function groupIssues(issues: TextIssue[]): GroupedIssueSummary[] {
  const map = new Map<IssueCode, GroupedIssueSummary>();
  for (const issue of issues) {
    if (!map.has(issue.code)) {
      let category: IssueCategory = 'spacing';
      let title = 'Spacing issue';

      switch (issue.code) {
        case 'CONTROL_CHAR':
        case 'BIDI_OVERRIDE':
          category = 'invisible';
          title = issue.code === 'BIDI_OVERRIDE' ? 'BiDi direction marker' : 'Invisible control char';
          break;
        case 'SMART_PUNCTUATION':
          category = 'typography';
          title = 'Smart punctuation (quotes/dashes)';
          break;
        case 'EXOTIC_SPACE':
          category = 'spacing';
          title = 'Non-breaking / exotic space';
          break;
        case 'TAB_CHARACTER':
          category = 'spacing';
          title = 'Tab character';
          break;
        case 'MULTIPLE_SPACES':
          category = 'spacing';
          title = 'Multiple consecutive spaces';
          break;
        case 'TRAILING_WHITESPACE':
          category = 'spacing';
          title = 'Trailing whitespace';
          break;
        case 'EXTRA_BLANK_LINES':
          category = 'structure';
          title = 'Excessive blank lines';
          break;
        case 'LONG_WORD':
          category = 'structure';
          title = 'Overly long word (> 35 chars)';
          break;
        case 'UNTYPEABLE_CHAR':
          category = 'invisible';
          title = 'Unrecognized layout character';
          break;
        case 'WHITESPACE_ONLY':
          category = 'structure';
          title = 'Text contains only whitespace';
          break;
        case 'TOO_LONG_FOR_SESSION':
          category = 'structure';
          title = 'Very long text for single test';
          break;
      }

      map.set(issue.code, {
        code: issue.code,
        category,
        title,
        count: 0,
        severity: issue.severity,
        samples: [],
      });
    }

    const item = map.get(issue.code)!;
    item.count += 1;
    if (issue.sample && item.samples.length < 3 && !item.samples.includes(issue.sample)) {
      item.samples.push(issue.sample);
    }
  }

  return Array.from(map.values());
}
