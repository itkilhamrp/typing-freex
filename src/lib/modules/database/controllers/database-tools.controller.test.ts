import { describe, it, expect, beforeEach } from 'vitest';
import { useDatabaseToolsController } from './database-tools.controller.svelte';
import { resetMockStore } from '@/core/ipc/client';

describe('useDatabaseToolsController (Svelte 5 Runes)', () => {
  beforeEach(() => {
    resetMockStore();
  });

  it('runs backup export successfully', async () => {
    const ctrl = useDatabaseToolsController();
    await ctrl.handleExport();

    expect(ctrl.exportResult).toBeDefined();
    expect(ctrl.exportResult?.success).toBe(true);
    expect(ctrl.exportResult?.sidecar_created).toBe(true);
  });

  it('stages import file and commits successfully', async () => {
    const ctrl = useDatabaseToolsController();
    await ctrl.handleFileSelected('test_backup.db');

    expect(ctrl.stagedSummary).toBeDefined();
    expect(ctrl.stagedSummary?.staging_token).toBeDefined();
    expect(ctrl.importDisplayName).toBe('Imported User');

    await ctrl.commitImport();
    expect(ctrl.importSuccess).toContain('successfully imported');
    expect(ctrl.stagedSummary).toBeNull();
  });

  it('executes database integrity check', async () => {
    const ctrl = useDatabaseToolsController();
    await ctrl.runIntegrityCheck();

    expect(ctrl.integrityReport).toBeDefined();
    expect(ctrl.integrityReport?.ok).toBe(true);
  });
});
