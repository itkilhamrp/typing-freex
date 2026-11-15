export { default as TrophySvg } from './TrophySvg.svelte';
export { default as AdvancementTrophySvg } from './AdvancementTrophySvg.svelte';
export { default as CupShape } from './CupShape.svelte';
export { default as StarShape } from './StarShape.svelte';
export { default as MedalShape } from './MedalShape.svelte';
export { default as ShieldShape } from './ShieldShape.svelte';
export { default as CrownShape } from './CrownShape.svelte';
export { default as BoltShape } from './BoltShape.svelte';
export { default as FlameShape } from './FlameShape.svelte';
export { default as GemShape } from './GemShape.svelte';
export { default as ScrollShape } from './ScrollShape.svelte';
export { default as WreathShape } from './WreathShape.svelte';
export { default as TrophyRankEffects } from './TrophyRankEffects.svelte';
export * from './advancements';

/**
 * Rank animation intensity profile for Typing Achievement & Esports Emblem SVGs.
 * Kept lightweight (pure CSS transform/opacity) for zero-lag rendering across large grids.
 */
export type TrophyRankAnimationPreset =
    | 'locked'
    | 'metallic-gleam'
    | 'royal-shimmer'
    | 'cryo-pulse'
    | 'prismatic-refract'
    | 'phoenix-blaze'
    | 'cyber-overclock'
    | 'imperial-sovereign'
    | 'draconic-surge'
    | 'celestial-supernova';

export const TROPHY_RANK_ANIMATION_MAP: Record<string, TrophyRankAnimationPreset> = {
    locked: 'locked',
    bronze: 'metallic-gleam',
    silver: 'metallic-gleam',
    gold: 'royal-shimmer',
    platinum: 'cryo-pulse',
    diamond: 'prismatic-refract',
    heroic: 'phoenix-blaze',
    eliteHeroic: 'cyber-overclock',
    master: 'imperial-sovereign',
    eliteMaster: 'draconic-surge',
    grandmaster: 'celestial-supernova',
};