import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import ProfilesView from './ProfilesView.svelte';
import { useProfileStore } from '../stores/profile.store.svelte';
import { resetMockStore } from '@/core/ipc/client';

describe('ProfilesView.svelte (Minimalist Active Profile)', () => {
  beforeEach(async () => {
    resetMockStore();
    const store = useProfileStore();
    await store.loadProfiles();
  });

  it('renders active profile information and metadata badges', async () => {
    const store = useProfileStore();
    const active = store.activeProfile;
    expect(active).not.toBeNull();

    const { container } = render(ProfilesView);

    // Profile name should be rendered
    expect(container.textContent).toContain(active!.name);
    // Slug should be rendered
    expect(container.textContent).toContain(active!.slug);
    // "Active" badge should be rendered
    expect(container.textContent).toContain('Active');
    // Created date metadata should be rendered
    expect(container.textContent).toContain('Created');
  });

  it('does not contain redundant exit or new profile buttons', () => {
    const { container } = render(ProfilesView);

    const buttons = Array.from(container.querySelectorAll('button'));
    const btnTexts = buttons.map((b) => b.textContent?.trim() || '');

    // Must NOT contain exit to main menu or new profile
    expect(btnTexts.some((t) => t.toLowerCase().includes('exit'))).toBe(false);
    expect(btnTexts.some((t) => t.toLowerCase().includes('new profile'))).toBe(false);
    // Must NOT contain delete buttons
    expect(btnTexts.some((t) => t.toLowerCase().includes('delete'))).toBe(false);
  });

  it('allows renaming the active profile through modal dialog', async () => {
    const store = useProfileStore();
    const initialName = store.activeProfile?.name;

    const { container } = render(ProfilesView);

    // Find Rename button
    const buttons = Array.from(container.querySelectorAll('button'));
    const renameBtn = buttons.find((b) => b.textContent?.includes('Rename'));
    expect(renameBtn).toBeDefined();

    await fireEvent.click(renameBtn!);

    // Dialog input should be visible
    const input = container.querySelector('#rename-profile-name') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    expect(input?.value).toBe(initialName);

    // Type new name and trigger save
    await fireEvent.input(input!, { target: { value: 'MasterTyper' } });
    const saveBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Save')
    );
    expect(saveBtn).toBeDefined();

    await fireEvent.click(saveBtn!);

    // Store should be updated asynchronously
    await waitFor(() => {
      expect(store.activeProfile?.name).toBe('MasterTyper');
    });
  });
});
