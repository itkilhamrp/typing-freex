/**
 * Text Normalization Module (§5.11.6)
 * Configurable normalizations for custom text imports and editing.
 */

export interface NormalizationOptions {
  /** Replace exotic Unicode spaces with U+0020 and strip zero-width spaces (default: true) */
  exoticSpaces?: boolean;
  /** Replace smart quotes, typographic dashes, ellipses with ASCII equivalents (default: false) */
  typographicToAscii?: boolean;
  /** Tab conversion mode: 'spaces-1', 'spaces-4', or 'preserve' (default: 'spaces-1') */
  tabs?: 'spaces-1' | 'spaces-4' | 'preserve';
  /** Collapse runs of multiple spaces into a single space (default: false) */
  collapseWhitespace?: boolean;
  /** Trim trailing whitespace per line and collapse 3+ blank lines into 1 (default: true) */
  trimBlankLines?: boolean;
  /** Strip common Markdown syntax markers while retaining content (default: false) */
  stripMarkdown?: boolean;
  /** Fold Latin diacritics into base ASCII (e.g. é -> e, ñ -> n) (default: false) */
  asciiFoldDiacritics?: boolean;
}

export const DEFAULT_NORMALIZATION_OPTIONS: Required<NormalizationOptions> = {
  exoticSpaces: true,
  typographicToAscii: false,
  tabs: 'spaces-1',
  collapseWhitespace: false,
  trimBlankLines: true,
  stripMarkdown: false,
  asciiFoldDiacritics: false,
};

// Unicode exotic spaces (excluding standard space 0x20 and tab 0x09)
const EXOTIC_SPACES_REGEX = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;
// Zero-width characters to strip
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g;

/**
 * Normalizes text according to the provided options.
 */
export function normalizeText(input: string, options: NormalizationOptions = {}): string {
  const opts = { ...DEFAULT_NORMALIZATION_OPTIONS, ...options };
  let text = input;

  // 1. Strip Markdown (if requested, before other transformations)
  if (opts.stripMarkdown) {
    text = stripMarkdownSyntax(text);
  }

  // 2. Exotic spaces
  if (opts.exoticSpaces) {
    text = text.replace(ZERO_WIDTH_REGEX, '');
    text = text.replace(EXOTIC_SPACES_REGEX, ' ');
  }

  // 3. Typographic punctuation -> ASCII
  if (opts.typographicToAscii) {
    text = text
      .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"') // Curly double quotes & guillemets
      .replace(/[\u2018\u2019\u201A\u2039\u203A]/g, "'") // Curly single quotes
      .replace(/[\u2013\u2014\u2015]/g, '-')              // En-dash, Em-dash, horizontal bar
      .replace(/\u2026/g, '...')                           // Ellipsis
      .replace(/\u2022/g, '-');                            // Bullet
  }

  // 4. Tab expansion
  if (opts.tabs === 'spaces-1') {
    text = text.replace(/\t/g, ' ');
  } else if (opts.tabs === 'spaces-4') {
    text = text.replace(/\t/g, '    ');
  }

  // 5. Diacritics folding
  if (opts.asciiFoldDiacritics) {
    text = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  }

  // 6. Collapse consecutive horizontal whitespace
  if (opts.collapseWhitespace) {
    text = text.replace(/[^\S\r\n]+/g, ' ');
  }

  // 7. Trim line ends and collapse excessive blank lines
  if (opts.trimBlankLines) {
    // Trim trailing whitespace on each line
    text = text.replace(/[ \t]+$/gm, '');
    // Collapse 3 or more consecutive newlines into 2 (i.e., at most one blank line)
    text = text.replace(/\n{3,}/g, '\n\n');
    // Trim leading and trailing newlines
    text = text.trim();
  }

  return text;
}

/**
 * Strips basic Markdown syntax while keeping text content intact.
 */
export function stripMarkdownSyntax(markdown: string): string {
  let res = markdown;

  // Fenced code blocks ```...``` -> keep interior content
  res = res.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, '$1');

  // Inline code `...` -> ...
  res = res.replace(/`([^`]+)`/g, '$1');

  // Images ![alt](url) -> alt
  res = res.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Links [text](url) -> text
  res = res.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Headers # Header -> Header
  res = res.replace(/^#{1,6}\s+(.+)$/gm, '$1');

  // Blockquotes > quote -> quote
  res = res.replace(/^>\s+(.+)$/gm, '$1');

  // Bold & italic (***text***, **text**, *text*, ___text___, __text__, _text_)
  res = res.replace(/(\*\*|__)(.*?)\1/g, '$2');
  res = res.replace(/(\*|_)(.*?)\1/g, '$2');

  // Strikethrough ~~text~~ -> text
  res = res.replace(/~~(.*?)~~/g, '$1');

  return res;
}

/**
 * Intelligently decomposes an overly long word (> 35 characters) into typable segments <= 35 chars.
 * Prioritizes natural semantic boundaries:
 * 1. Missing spaces after punctuation (e.g. `word.Another`, `item,next`)
 * 2. Glued delimiters (slashes `/`, pipes `|`, hyphens `-`, underscores `_`)
 * 3. CamelCase / PascalCase word boundaries
 * 4. Runaway repeated characters
 * 5. Deterministic clean chunking (fallback for unbroken arbitrary strings)
 */
export function smartSplitLongWord(word: string, maxLen: number = 35): string {
  if (word.length <= maxLen) return word;

  let result = word;

  // 1. Missing spaces after common sentence punctuation: e.g. "sentence.NextSentence" or "one,two,three"
  result = result.replace(/([a-zA-Z0-9])([,;:!?.])([a-zA-Z])/g, '$1$2 $3');
  if (result.split(/\s+/).every((w) => w.length <= maxLen)) {
    return result;
  }

  // 2. Glued slashes, pipes, hyphens, or underscores in long compound identifiers / paths
  if (/[/|\\_]/.test(result) || result.includes('--')) {
    result = result
      .replace(/([/|\\_])/g, ' $1 ')
      .replace(/--+/g, ' - ')
      .replace(/\s+/g, ' ')
      .trim();

    if (result.split(/\s+/).every((w) => w.length <= maxLen)) {
      return result;
    }
  }

  // 3. CamelCase / PascalCase boundaries: e.g. "ThisIsAnUnbrokenSequenceOfCamelCaseWords"
  const camelSplit = result.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  if (camelSplit !== result && camelSplit.split(/\s+/).every((w) => w.length <= maxLen)) {
    return camelSplit;
  }

  // 4. Repeated runaway character sequences: e.g. "----------------------------------------" or "aaaaaaaaaaaaaaaaaaaaa..."
  if (/^(.)\1{30,}$/.test(result)) {
    return result.slice(0, 20);
  }

  // 5. Fallback for unbroken arbitrary strings (e.g. continuous long hash or unbroken foreign word):
  // Split each unbroken sub-word exceeding maxLen into clean 25-28 character segments
  const subWords = result.split(/\s+/);
  const normalizedSubWords = subWords.map((sub) => {
    if (sub.length <= maxLen) return sub;

    const chunks: string[] = [];
    for (let i = 0; i < sub.length; i += 28) {
      chunks.push(sub.slice(i, i + 28));
    }
    return chunks.join(' ');
  });

  return normalizedSubWords.join(' ');
}

/**
 * Scans text and breaks any token exceeding maxLen into typeable pieces <= maxLen.
 */
export function splitLongWords(text: string, maxLen: number = 35): string {
  const lines = text.split('\n');
  const processedLines = lines.map((line) => {
    if (!line.split(/\s+/).some((w) => w.length > maxLen)) {
      return line;
    }

    const tokens = line.split(/(\s+)/);
    return tokens
      .map((token) => {
        if (/^\s+$/.test(token) || token.length <= maxLen) {
          return token;
        }
        return smartSplitLongWord(token, maxLen);
      })
      .join('');
  });

  return processedLines.join('\n');
}

/**
 * Intelligent normalization tailored specifically for typing practice texts.
 * Converts typographic quotes/dashes, eliminates invisible zero-width and BiDi markers,
 * replaces exotic spaces, cleans redundant multiple spaces, normalizes tabs,
 * splits overly long words (> 35 chars), and fixes line endings.
 */
export function smartNormalizeText(input: string): string {
  // 1. Unify CRLF -> LF
  let text = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Remove invisible zero-width characters and BiDi overrides
  text = text.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
  text = text.replace(/[\u202A-\u202E\u2066-\u2069]/g, '');

  // 3. Remove unprintable control characters (keep newline \n and tab \t)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u0080-\u009F]/g, '');

  // 4. Convert exotic spaces to standard spaces
  text = text.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');

  // 5. Convert smart typographic quotes and punctuation to standard ASCII equivalents
  text = text
    .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u201A\u2039\u203A]/g, "'")
    .replace(/[\u2013\u2014\u2015]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '-');

  // 6. Convert tabs to 2 spaces
  text = text.replace(/\t/g, '  ');

  // 7. Intelligently break overly long words (> 35 chars) into typable segments
  text = splitLongWords(text, 35);

  // 8. Collapse runs of multiple spaces on each line
  text = text.replace(/ {2,}/g, ' ');

  // 9. Trim trailing whitespace on each line
  text = text.replace(/[ \t]+$/gm, '');

  // 10. Collapse 3+ consecutive newlines into 2 (single blank line)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}
