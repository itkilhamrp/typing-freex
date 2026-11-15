import { describe, it, expect, beforeEach } from 'vitest';
import { useCustomTextStore } from './custom-text.store.svelte';
import { resetMockStore } from '@/core/ipc/client';

describe('custom-text.store (Svelte 5 Runes)', () => {
  beforeEach(() => {
    resetMockStore();
    const store = useCustomTextStore();
    store.resetCustomTextState();
  });

  it('initializes with default state and fetches texts', async () => {
    const store = useCustomTextStore();
    await store.fetchTexts();
    expect(store.texts.length).toBeGreaterThan(0);
    expect(store.texts[0]?.title).toBe('The Quick Brown Fox');
  });

  it('creates, loads, and updates a custom text', async () => {
    const store = useCustomTextStore();
    const created = await store.createText(
      'Vitest Story',
      'This is a sample story created during vitest testing.'
    );

    expect(created.title).toBe('Vitest Story');
    expect(created.revision).toBe(1);

    const loaded = await store.loadText(created.id);
    expect(loaded).toBeDefined();
    expect(loaded?.title).toBe('Vitest Story');

    const updated = await store.updateText(
      created.id,
      'Vitest Story (Edited)',
      'This is an edited story with more words.',
      created.revision
    );
    expect(updated.title).toBe('Vitest Story (Edited)');
    expect(updated.revision).toBe(2);
  });

  it('duplicates and deletes a custom text', async () => {
    const store = useCustomTextStore();
    const created = await store.createText(
      'To Duplicate',
      'Content to duplicate.'
    );

    await store.duplicateText(created.id);
    expect(store.texts.some((t) => t.title.includes('(copy)'))).toBe(true);

    await store.deleteText(created.id);
    expect(store.texts.some((t) => t.id === created.id)).toBe(false);
  });

  it('loads revisions and revision diff with Git changeset telemetry', async () => {
    const store = useCustomTextStore();
    const created = await store.createText('Revision Test', 'Initial content.');
    const revs = await store.loadRevisions(created.id);
    expect(revs.length).toBeGreaterThan(0);
    expect(revs[0]?.revision_number).toBe(1);

    const diff = await store.loadRevisionDiff(created.id, 1);
    expect(diff).toBeDefined();
    expect(diff?.lines.length).toBeGreaterThan(0);
    expect(diff?.additions).toBeGreaterThanOrEqual(0);
  });
});
