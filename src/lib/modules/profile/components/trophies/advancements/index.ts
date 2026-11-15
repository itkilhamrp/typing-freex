export { default as HexBadgeShape } from './HexBadgeShape.svelte';
export { default as PentagonShape } from './PentagonShape.svelte';
export { default as CompassShape } from './CompassShape.svelte';
export { default as SigilShape } from './SigilShape.svelte';
export { default as ChevronShape } from './ChevronShape.svelte';
export { default as CrestShape } from './CrestShape.svelte';
export { default as PrismShape } from './PrismShape.svelte';
export { default as GearShape } from './GearShape.svelte';
export { default as AtomShape } from './AtomShape.svelte';
export { default as RuneShape } from './RuneShape.svelte';
export { default as AdvancementRankFrame } from './AdvancementRankFrame.svelte';

/**
 * Dark-Typing Esports Rank Evolution Presets for Advancement Emblem SVGs.
 * Pure GPU transform/opacity animations — zero SVG filter blur, zero layout thrashing.
 */
export type AdvancementHorrorStage =
    | 'locked-shell'
    | 'forged-keycap'
    | 'pcb-overclock'
    | 'fractured-switch'
    | 'phalange-claws'
    | 'reaper-skull'
    | 'abyssal-lich-king';

export const ADVANCEMENT_RANK_STAGE_MAP: Record<string, AdvancementHorrorStage> = {
    locked: 'locked-shell',
    common: 'forged-keycap',
    uncommon: 'pcb-overclock',
    rare: 'fractured-switch',
    epic: 'phalange-claws',
    legendary: 'reaper-skull',
    mythic: 'abyssal-lich-king',
};