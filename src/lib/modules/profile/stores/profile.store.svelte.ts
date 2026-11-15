import { profileApi } from '@/core/ipc/client';
import type { ProfileDto } from '@/core/ipc/contracts';
import { loadAchievements } from './achievement.store.svelte';
import {
  loadSettings,
  setSettingsProfileScope,
} from '@/lib/modules/settings/stores/settings.store.svelte';

let profiles = $state<ProfileDto[]>([]);
let activeProfile = $state<ProfileDto | null>(null);
let isLoading = $state<boolean>(false);
let hasActiveSession = $state<boolean>(false);

export async function loadProfiles(): Promise<void> {
  isLoading = true;
  try {
    const [list, active] = await Promise.all([
      profileApi.list(),
      profileApi.getActive(),
    ]);
    profiles = list;
    activeProfile = active ?? list[0] ?? null;
    setSettingsProfileScope(activeProfile?.uuid ?? null);
  } finally {
    isLoading = false;
  }
}

export async function createProfile(name: string): Promise<ProfileDto> {
  isLoading = true;
  try {
    const created = await profileApi.create(name);
    await loadProfiles();
    return created;
  } finally {
    isLoading = false;
  }
}

export async function switchProfile(uuid: string): Promise<ProfileDto> {
  isLoading = true;
  try {
    const switched = await profileApi.switch(uuid);
    activeProfile = switched;
    setSettingsProfileScope(switched.uuid);
    await loadProfiles();
    await Promise.all([loadSettings(), loadAchievements(true)]);
    return switched;
  } finally {
    isLoading = false;
  }
}

export async function renameProfile(uuid: string, newName: string): Promise<void> {
  isLoading = true;
  try {
    await profileApi.rename(uuid, newName);
    await loadProfiles();
  } finally {
    isLoading = false;
  }
}

export async function deleteProfile(uuid: string): Promise<void> {
  isLoading = true;
  try {
    await profileApi.delete(uuid);
    await loadProfiles();
    await Promise.all([loadSettings(), loadAchievements(true)]);
  } finally {
    isLoading = false;
  }
}

export async function enterSession(uuid: string): Promise<ProfileDto> {
  const switched = await switchProfile(uuid);
  hasActiveSession = true;
  return switched;
}

export function exitSession(): void {
  hasActiveSession = false;
}

export function useProfileStore() {
  return {
    get profiles() {
      return profiles;
    },
    set profiles(v: ProfileDto[]) {
      profiles = v;
    },
    get activeProfile() {
      return activeProfile;
    },
    set activeProfile(v: ProfileDto | null) {
      activeProfile = v;
    },
    get isLoading() {
      return isLoading;
    },
    set isLoading(v: boolean) {
      isLoading = v;
    },
    get hasActiveSession() {
      return hasActiveSession;
    },
    set hasActiveSession(v: boolean) {
      hasActiveSession = v;
    },
    loadProfiles,
    fetchProfiles: loadProfiles,
    createProfile,
    switchProfile,
    enterSession,
    exitSession,
    renameProfile,
    deleteProfile,
  };
}

export const profileStore = useProfileStore();

