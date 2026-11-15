import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeText } from '../src/core/text-tools/sanitize';

interface ConformanceVector {
  name: string;
  input: string;
  expected_sanitized: string;
  expected_issues: string[];
}

describe('Sanitization Conformance Vectors (Task M4.4.2)', () => {
  const vectorFile = path.resolve(
    __dirname,
    './vectors/text-tools/sanitization.json'
  );
  const vectors = JSON.parse(
    fs.readFileSync(vectorFile, 'utf-8')
  ) as ConformanceVector[];

  it('contains test vectors', () => {
    expect(vectors.length).toBeGreaterThanOrEqual(5);
  });

  vectors.forEach((v) => {
    it(`correctly normalizes vector '${v.name}'`, () => {
      const sanitized = sanitizeText(v.input);
      expect(sanitized).toBe(v.expected_sanitized);
    });
  });
});
