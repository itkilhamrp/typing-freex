import achievementsFeatsEn from './en/achievements/feats.json';
import achievementsUiEn from './en/achievements/ui.json';
import advancementsTiersEn from './en/advancements/tiers.json';
import advancementsUiEn from './en/advancements/ui.json';
import arenaEn from './en/modes/arena.json';
import analyticsHistoryEn from './en/modules/analytics-history.json';
import toolsSettingsEn from './en/modules/tools-settings.json';
import mainMenuEn from './en/pages/main-menu.json';
import commonEn from './en/shared/common.json';

import achievementsFeatsId from './id/achievements/feats.json';
import achievementsUiId from './id/achievements/ui.json';
import advancementsTiersId from './id/advancements/tiers.json';
import advancementsUiId from './id/advancements/ui.json';
import arenaId from './id/modes/arena.json';
import analyticsHistoryId from './id/modules/analytics-history.json';
import toolsSettingsId from './id/modules/tools-settings.json';
import mainMenuId from './id/pages/main-menu.json';
import commonId from './id/shared/common.json';

export const en = {
  ...commonEn,
  ...mainMenuEn,
  ...arenaEn,
  ...analyticsHistoryEn,
  ...toolsSettingsEn,
  achievements: {
    ...achievementsUiEn,
    ...achievementsFeatsEn,
    ...advancementsTiersEn,
  },
  advancements: {
    ...advancementsUiEn,
    ...advancementsTiersEn,
    ...achievementsFeatsEn,
  },
};

export const id = {
  ...commonId,
  ...mainMenuId,
  ...arenaId,
  ...analyticsHistoryId,
  ...toolsSettingsId,
  achievements: {
    ...achievementsUiId,
    ...achievementsFeatsId,
    ...advancementsTiersId,
  },
  advancements: {
    ...advancementsUiId,
    ...advancementsTiersId,
    ...achievementsFeatsId,
  },
};
