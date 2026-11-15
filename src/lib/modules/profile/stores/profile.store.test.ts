import { describe, it, expect, beforeEach } from 'vitest';
import { useProfileStore } from './profile.store.svelte';
import { resetMockStore } from '@/core/ipc/client';

describe('profile.store (Svelte 5 Runes)', () => {
  beforeEach(() => {
    resetMockStore();
  });

  it('loads profiles and sets active profile', async () => {
    const store = useProfileStore();
    await store.loadProfiles();

    expect(store.profiles.length).toBeGreaterThan(0);
    expect(store.activeProfile).not.toBeNull();
  });

  it('creates new profile and adds to list', async () => {
    const store = useProfileStore();
    await store.loadProfiles();
    const countBefore = store.profiles.length;

    const created = await store.createProfile('Test User');
    expect(created.name).toBe('Test User');
    expect(store.profiles.length).toBe(countBefore + 1);
  });

  it('switches active profile cleanly', async () => {
    const store = useProfileStore();
    await store.loadProfiles();

    const created = await store.createProfile('Switch Target');
    const switched = await store.switchProfile(created.uuid);

    expect(switched.uuid).toBe(created.uuid);
    expect(store.activeProfile?.uuid).toBe(created.uuid);
  });

  it('renames profile', async () => {
    const store = useProfileStore();
    await store.loadProfiles();

    const created = await store.createProfile('Old Name');
    await store.renameProfile(created.uuid, 'Renamed Name');

    const found = store.profiles.find((p) => p.uuid === created.uuid);
    expect(found?.name).toBe('Renamed Name');
  });

  it('deletes profile', async () => {
    const store = useProfileStore();
    await store.loadProfiles();

    const created = await store.createProfile('To Delete');
    const count = store.profiles.length;

    await store.deleteProfile(created.uuid);
    expect(store.profiles.length).toBe(count - 1);
    expect(store.profiles.find((p) => p.uuid === created.uuid)).toBeUndefined();
  });

  it('manages active session state on enterSession and exitSession', async () => {
    const store = useProfileStore();
    await store.loadProfiles();

    expect(store.hasActiveSession).toBe(false);
    const created = await store.createProfile('Session Player');

    await store.enterSession(created.uuid);
    expect(store.hasActiveSession).toBe(true);
    expect(store.activeProfile?.uuid).toBe(created.uuid);

    store.exitSession();
    expect(store.hasActiveSession).toBe(false);
  });
});
