import { Mulberry32 } from '../prng';
import type { QuoteLengthFilter } from '../types';

export interface QuoteItem {
  id: string;
  text: string;
  source: string;
  length?: number;
}

export function classifyQuoteLength(charCount: number): QuoteLengthFilter {
  if (charCount <= 100) return 'short';
  if (charCount <= 250) return 'medium';
  if (charCount <= 600) return 'long';
  return 'thicc';
}

export function pickQuote(
  quotes: readonly QuoteItem[],
  seed: number,
  lengthFilter: QuoteLengthFilter = 'all'
): QuoteItem {
  if (quotes.length === 0) {
    throw new Error('No quotes available');
  }
  const filtered =
    lengthFilter === 'all'
      ? quotes
      : quotes.filter((q) => classifyQuoteLength(q.text.length) === lengthFilter);

  const pool = filtered.length > 0 ? filtered : quotes;
  const prng = new Mulberry32(seed);
  return prng.pick(pool);
}
