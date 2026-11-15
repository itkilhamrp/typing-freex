import { describe, it, expect } from 'vitest';
import {
  IpcError,
  formatErrorMessage,
  normalizeIpcError,
  backupApi,
} from './client';

describe('IPC Error Normalization & Client Tools', () => {
  it('instantiates IpcError with proper code and message', () => {
    const err = new IpcError('Validation failed', 'VALIDATION_ERROR');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(IpcError);
    expect(err.name).toBe('IpcError');
    expect(err.message).toBe('Validation failed');
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('normalizes Tauri error object payload without producing [object Object]', () => {
    const tauriErrorPayload = {
      code: 'IMPORT_ERROR',
      message: 'Source file does not exist: /path/to/missing.db',
    };

    const normalized = normalizeIpcError(tauriErrorPayload);
    expect(normalized).toBeInstanceOf(Error);
    expect(normalized.message).toBe('Source file does not exist: /path/to/missing.db');
    expect((normalized as IpcError).code).toBe('IMPORT_ERROR');

    // formatErrorMessage must extract the human-readable string directly
    const formatted = formatErrorMessage(tauriErrorPayload);
    expect(formatted).toBe('Source file does not exist: /path/to/missing.db');
    expect(formatted).not.toContain('[object Object]');
  });

  it('formats Error instance properly', () => {
    const stdErr = new Error('Disk full');
    expect(formatErrorMessage(stdErr)).toBe('Disk full');
  });

  it('formats unknown primitive types safely', () => {
    expect(formatErrorMessage('Custom text error')).toBe('Custom text error');
    expect(formatErrorMessage(null)).toBe('null');
    expect(formatErrorMessage(undefined)).toBe('undefined');
  });

  it('exports backup with typing_freex default filename in mock storage', async () => {
    const res = await backupApi.export();
    expect(res.success).toBe(true);
    expect(res.file_name).toContain('typing_freex_backup_mock_');
    expect(res.file_name).not.toContain('typing_app');
  });

  it('automatically resolves unique slug when importing profiles with identical names', async () => {
    // First import with name 'Default'
    const p1 = await backupApi.importCommit('token-1', 'Default');
    // Second import with name 'Default'
    const p2 = await backupApi.importCommit('token-2', 'Default');
    // Third import with name 'Default'
    const p3 = await backupApi.importCommit('token-3', 'Default');

    expect(p1.name).toBe('Default');
    expect(p2.name).toBe('Default');
    expect(p3.name).toBe('Default');

    expect(p1.slug).toBe('default-2'); // since initial mock profile already has 'default'
    expect(p2.slug).toBe('default-3');
    expect(p3.slug).toBe('default-4');

    expect(p1.uuid).not.toBe(p2.uuid);
    expect(p2.uuid).not.toBe(p3.uuid);
  });
});
