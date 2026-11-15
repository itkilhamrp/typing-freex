#!/usr/bin/env node

/**
 * Enforces the use of PNPM as the package manager for Typing FreeX.
 * Per PRD Constraint C-02: PNPM only.
 */

const userAgent = process.env.npm_config_user_agent || '';

if (!userAgent.startsWith('pnpm/')) {
  console.error('\x1b[31m%s\x1b[0m', '══════════════════════════════════════════════════════════════════════');
  console.error('\x1b[31m%s\x1b[0m', '  ERROR: This project strictly requires PNPM (Constraint C-02).');
  console.error('\x1b[31m%s\x1b[0m', '  Please run "pnpm install" instead of "npm install" or "yarn".');
  console.error('\x1b[31m%s\x1b[0m', '══════════════════════════════════════════════════════════════════════');
  process.exit(1);
}
