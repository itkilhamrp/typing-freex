import { en, id } from '@/locales/index.js';

export type Locale = 'en' | 'id';

const messages: Record<Locale, Record<string, unknown>> = { en, id };

let currentLocale = $state<Locale>('en');

function resolveKey(obj: unknown, path: string): string {
  if (!obj) return path;
  const parts = path.split('.');
  let curr: unknown = obj;
  for (const part of parts) {
    if (curr == null || typeof curr !== 'object') return path;
    curr = (curr as Record<string, unknown>)[part];
  }
  return typeof curr === 'string' ? curr : path;
}

export function translate(key: string, params?: Record<string, string | number>): string {
  let str = resolveKey(messages[currentLocale], key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}

export function useI18n() {
  return {
    get locale() {
      return currentLocale;
    },
    set locale(val: Locale) {
      if (val === 'en' || val === 'id') {
        currentLocale = val;
      }
    },
    setLocale(val: Locale) {
      if (val === 'en' || val === 'id') {
        currentLocale = val;
      }
    },
    t: translate,
  };
}

export const i18n = {
  get locale() {
    return currentLocale;
  },
  set locale(val: Locale) {
    if (val === 'en' || val === 'id') {
      currentLocale = val;
    }
  },
  setLocale(val: Locale) {
    if (val === 'en' || val === 'id') {
      currentLocale = val;
    }
  },
  t: translate,
};

export const t = translate;

