export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export interface FormattedModeInfo {
  mode: string;
  variant: string;
  badge: string;
  detail: string;
}

export type ModeTranslator = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export function formatModeInfo(
  mode: string,
  variant?: string | null,
  translate?: ModeTranslator,
): FormattedModeInfo {
  const m = (mode || '').toLowerCase().trim();
  const v = (variant || '').toLowerCase().trim();

  const defaultModeNames: Record<string, string> = {
    time: 'Time',
    words: 'Words',
    quote: 'Quote',
    tech: 'Tech',
    zen: 'Zen',
    custom: 'Custom',
  };
  const modeKeyMap: Record<string, string> = {
    time: 'modeFormat.modeTime',
    words: 'modeFormat.modeWords',
    quote: 'modeFormat.modeQuote',
    tech: 'modeFormat.modeTech',
    zen: 'modeFormat.modeZen',
    custom: 'modeFormat.modeCustom',
  };
  const modeKey = modeKeyMap[m];
  const defaultModeName = defaultModeNames[m];
  const modeName: string =
    modeKey && defaultModeName
      ? translate
        ? translate(modeKey)
        : defaultModeName
      : m
        ? m.charAt(0).toUpperCase() + m.slice(1)
        : translate
          ? translate('modeFormat.modeUnknown')
          : 'Unknown';

  const formatSeconds = (secs: string): string =>
    translate ? translate('modeFormat.secondsSuffix', { seconds: secs }) : `${secs}s`;

  let variantName = '';
  let detail = '';

  if (m === 'time') {
    const secs = v.replace(/s$/, '');
    variantName = formatSeconds(secs || '30');
    detail = variantName;
  } else if (m === 'words') {
    const count = v.replace(/words$/, '').trim();
    variantName = count || '25';
    detail = translate
      ? translate('modeFormat.wordsVariant', { words: variantName }).toLowerCase()
      : `${variantName} words`;
  } else if (m === 'custom') {
    if (!v || v === 'custom' || v === 'infinity' || v === 'inf') {
      const inf = translate ? translate('modeFormat.infinity') : 'Infinity';
      variantName = inf;
      detail = inf;
    } else {
      const secs = v.replace(/s$/, '');
      variantName = formatSeconds(secs);
      detail = variantName;
    }
  } else if (m === 'quote' || m === 'tech' || m === 'zen') {
    // Quote, Tech, and Zen modes do not have sub-variants; suppress redundant variant tags
    variantName = '';
    detail = '';
  } else {
    // Fallback: if variant is identical to mode, suppress duplicate
    if (v && v !== m) {
      variantName = v;
      detail = v;
    }
  }

  const badge = variantName ? `${modeName} · ${variantName}` : modeName;

  return {
    mode: modeName,
    variant: variantName,
    badge,
    detail,
  };
}

export function formatModeBadge(
  mode: string,
  variant?: string | null,
  translate?: ModeTranslator,
): string {
  return formatModeInfo(mode, variant, translate).badge;
}

export function formatModeDetail(
  mode: string,
  variant?: string | null,
  translate?: ModeTranslator,
): string {
  const info = formatModeInfo(mode, variant, translate);
  return info.variant ? `${info.mode} (${info.variant})` : info.mode;
}
