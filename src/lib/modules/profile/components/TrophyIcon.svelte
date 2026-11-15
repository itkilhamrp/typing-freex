<script lang="ts">
  import type { TrophyShape, AdvancementShape, AchievementCategory } from '@/core/achievements';
  import { TrophySvg, AdvancementTrophySvg } from './trophies';

  interface Props {
    uniqueId?: string;
    icon?: string;
    shape?: TrophyShape;
    advancementShape?: AdvancementShape;
    category?: AchievementCategory;
    tier?: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    unlocked?: boolean;
    class?: string;
  }

  let {
    uniqueId,
    icon = 'Trophy',
    shape,
    advancementShape,
    category,
    tier = 0,
    size = 'md',
    unlocked = false,
    class: className = '',
  }: Props = $props();

  const ICON_TO_SHAPE: Record<string, TrophyShape> = {
    Lightning: 'bolt',
    Flame: 'flame',
    Fire: 'flame',
    Rocket: 'star',
    AirplaneTilt: 'star',
    Sparkle: 'gem',
    Target: 'shield',
    CheckCircle: 'star',
    Medal: 'medal',
    Crosshair: 'shield',
    ShieldCheck: 'shield',
    ShieldStar: 'shield',
    CheckSquareOffset: 'cup',
    Keyboard: 'scroll',
    HourglassHigh: 'wreath',
    SneakerMove: 'medal',
    HandFist: 'shield',
    WaveSine: 'wreath',
    Scales: 'star',
    Timer: 'crown',
    Compass: 'medal',
    Translate: 'scroll',
    Quotes: 'scroll',
    Terminal: 'bolt',
    FileText: 'scroll',
    GlobeHemisphereWest: 'crown',
    Trophy: 'cup',
    TrendUp: 'cup',
    CalendarStar: 'medal',
    CalendarCheck: 'medal',
    Crown: 'crown',
    Moon: 'star',
    Sun: 'star',
    Coffee: 'star',
    FlowerLotus: 'gem',
    ArrowFatLinesUp: 'medal',
    ChartLineUp: 'crown',
    DiamondsFour: 'gem',
    Infinity: 'crown',
  };

  const ICON_TO_ADVANCEMENT_SHAPE: Record<string, AdvancementShape> = {
    Rocket: 'hex_badge',
    AirplaneTilt: 'chevron',
    Crosshair: 'pentagon',
    CheckCircle: 'hex_badge',
    CheckSquareOffset: 'sigil',
    SneakerMove: 'chevron',
    HandFist: 'pentagon',
    Scales: 'crest',
    Timer: 'gear',
    Translate: 'rune',
    Quotes: 'rune',
    Terminal: 'atom',
    FileText: 'rune',
    CalendarStar: 'crest',
    CalendarCheck: 'hex_badge',
    Moon: 'sigil',
    Sun: 'prism',
    Coffee: 'gear',
    FlowerLotus: 'prism',
    ArrowFatLinesUp: 'chevron',
    DiamondsFour: 'prism',
    Compass: 'compass',
    Sparkle: 'sigil',
    Target: 'pentagon',
    HourglassHigh: 'gear',
  };

  const isAdvancement = $derived(category === 'advancement' || !!advancementShape);
  const resolvedShape = $derived(shape ?? ICON_TO_SHAPE[icon] ?? 'cup');
  const resolvedAdvancementShape = $derived(
    advancementShape ?? ICON_TO_ADVANCEMENT_SHAPE[icon] ?? 'hex_badge',
  );
  const isActuallyUnlocked = $derived(
    isAdvancement ? unlocked : (unlocked || tier > 0),
  );

  const sizeClasses = $derived.by(() => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'lg':
        return 'w-16 h-16';
      case 'xl':
        return 'w-20 h-20';
      case 'md':
      default:
        return 'w-12 h-12';
    }
  });
</script>

<div
  class="relative inline-flex items-center justify-center shrink-0 transition-opacity duration-200 {sizeClasses} {!isActuallyUnlocked ? 'opacity-40 grayscale' : ''} {className}"
  aria-hidden="true"
>
  {#if isAdvancement}
    <AdvancementTrophySvg
      {uniqueId}
      shape={resolvedAdvancementShape}
      {tier}
      unlocked={isActuallyUnlocked}
      {size}
      class="w-full h-full"
    />
  {:else}
    <TrophySvg
      {uniqueId}
      shape={resolvedShape}
      {tier}
      unlocked={isActuallyUnlocked}
      {size}
      class="w-full h-full"
    />
  {/if}
</div>

