#!/usr/bin/env node

/**
 * Validates i18n parity between modular locale files in src/locales/{en,id}/.
 * Fails on:
 * - Missing keys
 * - Extra keys
 * - Empty string values
 * - Mismatched interpolation placeholders (e.g. {count}, {name})
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, '../src/locales');
const enDir = path.join(localesDir, 'en');
const idDir = path.join(localesDir, 'id');

if (!fs.existsSync(enDir) || !fs.existsSync(idDir)) {
  console.log('Locale directories not present yet. Skipping check until locales are populated.');
  process.exit(0);
}

function listJsonFiles(dir, baseDir = dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(listJsonFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
    }
  }
  return results.sort();
}

function flattenKeys(obj, prefix = '') {
  let keys = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(keys, flattenKeys(v, fullKey));
    } else {
      keys[fullKey] = v;
    }
  }
  return keys;
}

const enFiles = listJsonFiles(enDir);
const idFiles = listJsonFiles(idDir);

let errors = [];

for (const relPath of enFiles) {
  if (!idFiles.includes(relPath)) {
    errors.push(`Missing locale file in id/: "${relPath}"`);
  }
}

for (const relPath of idFiles) {
  if (!enFiles.includes(relPath)) {
    errors.push(`Extra locale file in id/ not found in en/: "${relPath}"`);
  }
}

const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;
let totalKeysVerified = 0;

for (const relPath of enFiles) {
  if (!idFiles.includes(relPath)) continue;

  const enFileObj = JSON.parse(fs.readFileSync(path.join(enDir, relPath), 'utf-8'));
  const idFileObj = JSON.parse(fs.readFileSync(path.join(idDir, relPath), 'utf-8'));

  const filePrefix = relPath.startsWith('achievements/')
    ? 'achievements'
    : relPath.startsWith('advancements/')
      ? 'advancements'
      : '';
  const enFlat = flattenKeys(enFileObj, filePrefix);
  const idFlat = flattenKeys(idFileObj, filePrefix);

  totalKeysVerified += Object.keys(enFlat).length;

  // Check missing or empty keys in id
  for (const [key, enVal] of Object.entries(enFlat)) {
    if (!(key in idFlat)) {
      errors.push(`[id/${relPath}] Missing key: "${key}"`);
    } else if (typeof idFlat[key] === 'string' && idFlat[key].trim() === '') {
      errors.push(`[id/${relPath}] Empty translation for key: "${key}"`);
    } else if (typeof enVal === 'string' && typeof idFlat[key] === 'string') {
      const enMatches = Array.from(enVal.matchAll(placeholderRegex), (m) => m[1]).sort();
      const idMatches = Array.from(idFlat[key].matchAll(placeholderRegex), (m) => m[1]).sort();

      if (JSON.stringify(enMatches) !== JSON.stringify(idMatches)) {
        errors.push(
          `[${relPath}] Placeholder mismatch in "${key}": EN has [${enMatches.join(', ')}], ID has [${idMatches.join(', ')}]`
        );
      }
    }
  }

  // Check extra keys in id
  for (const key of Object.keys(idFlat)) {
    if (!(key in enFlat)) {
      errors.push(`[id/${relPath}] Extra key not found in en/${relPath}: "${key}"`);
    }
  }
}

if (errors.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', `i18n Parity Check FAILED with ${errors.length} error(s):`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
} else {
  console.log('\x1b[32m%s\x1b[0m', `✓ i18n parity check passed (${totalKeysVerified} keys verified across ${enFiles.length} modular files)`);
  process.exit(0);
}
