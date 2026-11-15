#!/usr/bin/env node

/**
 * Validates build output against PRD performance budgets (NFR-03, NFR-04, NFR-05).
 * - Initial JS (entry + vendor) gzip <= 150 KB
 * - Any lazy route chunk gzip <= 60 KB
 * - Initial CSS gzip <= 32 KB
 * - Bundled fonts total <= 120 KB
 * - Word lists + quotes <= 3 MB uncompressed
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  console.log('Dist directory not found. Please run "pnpm build" before checking bundle budget.');
  process.exit(0);
}

function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  return zlib.gzipSync(content).length;
}

function findFiles(dir, exts) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, exts));
    } else if (exts.some((ext) => file.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

let errors = [];
let passed = [];

// Support SvelteKit output (dist/_app/immutable) and standard Vite output (dist/assets)
const scanDir = fs.existsSync(path.join(distDir, '_app/immutable'))
  ? path.join(distDir, '_app/immutable')
  : path.join(distDir, 'assets');

if (fs.existsSync(scanDir)) {
  const allFiles = findFiles(scanDir, ['.js', '.css']);

  const manifestPath = path.resolve(__dirname, '../.svelte-kit/output/client/.vite/manifest.json');
  const initialFiles = new Set();
  const chunkNames = new Map();

  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const initialKeys = Object.keys(manifest).filter(
        (k) =>
          k.includes('start') ||
          k.includes('app.js') ||
          k.includes('nodes/0.js')
      );

      const visited = new Set();
      function addInitial(key) {
        if (visited.has(key)) return;
        visited.add(key);
        const chunk = manifest[key];
        if (!chunk) return;
        if (chunk.file) {
          initialFiles.add(path.basename(chunk.file));
        }
        if (chunk.css && Array.isArray(chunk.css)) {
          for (const c of chunk.css) {
            initialFiles.add(path.basename(c));
          }
        }
        if (chunk.imports && Array.isArray(chunk.imports)) {
          for (const imp of chunk.imports) {
            initialFiles.add(path.basename(imp));
            const impKey = Object.keys(manifest).find((k) => manifest[k].file === imp || k === imp);
            if (impKey) addInitial(impKey);
          }
        }
      }

      for (const k of initialKeys) {
        addInitial(k);
      }

      for (const k of Object.keys(manifest)) {
        const chunk = manifest[k];
        if (chunk && chunk.file && chunk.name) {
          chunkNames.set(path.basename(chunk.file), chunk.name);
        }
      }
    } catch {
      // Fallback to substring matching if manifest read fails
    }
  }

  let initialJsGzip = 0;
  let initialCssGzip = 0;

  for (const filePath of allFiles) {
    const file = path.basename(filePath);
    const gzipSize = getGzipSize(filePath);
    const sizeKb = (gzipSize / 1024).toFixed(2);

    if (file.endsWith('.js')) {
      const isInitial =
        initialFiles.size > 0
          ? initialFiles.has(file)
          : file.includes('start') ||
            file.includes('app') ||
            file.includes('index') ||
            file.includes('vendor') ||
            filePath.includes('/entry/');

      if (isInitial) {
        initialJsGzip += gzipSize;
      } else {
        const chunkName = chunkNames.get(file);
        const isContentPack = chunkName === 'text-tools' || file.includes('text-tools');
        if (isContentPack) {
          const uncompressedBytes = fs.statSync(filePath).size;
          const uncompressedMb = (uncompressedBytes / (1024 * 1024)).toFixed(2);
          if (uncompressedBytes > 3 * 1024 * 1024) {
            errors.push(`Word lists + quotes chunk "${file}" exceeds 3 MB limit: ${uncompressedMb} MB`);
          } else {
            passed.push(`Word lists + quotes chunk "${file}": ${uncompressedMb} MB (<= 3 MB uncompressed, ${sizeKb} KB gzip)`);
          }
        } else {
          // Lazy route or component chunk (e.g. in nodes/ or dynamic component chunks)
          if (gzipSize > 60 * 1024) {
            errors.push(`Lazy chunk "${file}" exceeds 60 KB limit: ${sizeKb} KB`);
          } else {
            passed.push(`Lazy chunk "${file}": ${sizeKb} KB (<= 60 KB)`);
          }
        }
      }
    } else if (file.endsWith('.css')) {
      const isInitial =
        initialFiles.size > 0
          ? initialFiles.has(file)
          : file.startsWith('0.') || file.includes('app') || file.includes('index');

      if (isInitial) {
        initialCssGzip += gzipSize;
      } else {
        // Lazy route or component CSS chunk
        if (gzipSize > 60 * 1024) {
          errors.push(`Lazy CSS chunk "${file}" exceeds 60 KB limit: ${sizeKb} KB`);
        } else {
          passed.push(`Lazy CSS chunk "${file}": ${sizeKb} KB (<= 60 KB)`);
        }
      }
    }
  }

  const initialJsKb = (initialJsGzip / 1024).toFixed(2);
  if (initialJsGzip > 150 * 1024) {
    errors.push(`Initial JS (entry + vendor) exceeds 150 KB limit: ${initialJsKb} KB`);
  } else {
    passed.push(`Initial JS: ${initialJsKb} KB (<= 150 KB)`);
  }

  const initialCssKb = (initialCssGzip / 1024).toFixed(2);
  if (initialCssGzip > 32 * 1024) {
    errors.push(`Initial CSS exceeds 32 KB limit: ${initialCssKb} KB`);
  } else {
    passed.push(`Initial CSS: ${initialCssKb} KB (<= 32 KB)`);
  }
}

// Check bundled fonts if any in dist or public
const fontsDir = path.join(distDir, 'fonts');
if (fs.existsSync(fontsDir)) {
  let fontBytes = 0;
  for (const file of fs.readdirSync(fontsDir)) {
    fontBytes += fs.statSync(path.join(fontsDir, file)).size;
  }
  const fontKb = (fontBytes / 1024).toFixed(2);
  if (fontBytes > 120 * 1024) {
    errors.push(`Bundled fonts total exceeds 120 KB limit: ${fontKb} KB`);
  } else {
    passed.push(`Bundled fonts: ${fontKb} KB (<= 120 KB)`);
  }
}

console.log('--- Bundle Budget Results ---');
for (const p of passed) {
  console.log(`✓ ${p}`);
}

if (errors.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', '\nBundle Budget Checks FAILED:');
  for (const err of errors) {
    console.error(`  ✕ ${err}`);
  }
  process.exit(1);
} else {
  console.log('\x1b[32m%s\x1b[0m', '\n✓ All bundle budget checks passed!');
  process.exit(0);
}
