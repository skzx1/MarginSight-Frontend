import type { Locale } from './copy';

export const categories = ['general', 'fashion', 'beauty', 'food', 'home', 'other'] as const;
export const currencies = ['THB', 'USD', 'CNY'] as const;
export const reportingCycles = ['monthly', 'weekly', 'daily'] as const;
export type StoreSettings = {
  storeName: string; category: typeof categories[number]; currency: typeof currencies[number];
  reportingCycle: typeof reportingCycles[number]; language: Locale; marginThreshold: number;
  email: string; dailyDigest: boolean; weeklyDigest: boolean;
};
export type SettingsDraft = Omit<StoreSettings, 'marginThreshold'> & { marginThreshold: string };
export type SettingsErrors = Partial<Record<'storeName' | 'marginThreshold' | 'email', 'requiredName' | 'invalidThreshold' | 'invalidEmail' | 'requiredEmail'>>;
export interface SettingsStorage {
  load(): Promise<{ settings: StoreSettings | null; recovered: boolean }>;
  save(settings: StoreSettings): Promise<void>;
}

export function defaultSettings(storeName: string, language: Locale): StoreSettings {
  return { storeName, language, category: 'general', currency: 'THB', reportingCycle: 'monthly', marginThreshold: 15, email: '', dailyDigest: false, weeklyDigest: false };
}
export function settingsDraft(value: StoreSettings): SettingsDraft { return { ...value, marginThreshold: String(value.marginThreshold) }; }
export function validateSettings(value: SettingsDraft): SettingsErrors {
  const errors: SettingsErrors = {};
  if (!value.storeName.trim() || value.storeName.trim().length > 120) errors.storeName = 'requiredName';
  const threshold = Number(value.marginThreshold);
  if (!value.marginThreshold.trim() || !Number.isFinite(threshold) || threshold < 0 || threshold > 100) errors.marginThreshold = 'invalidThreshold';
  if (value.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) errors.email = 'invalidEmail';
  else if (!value.email.trim() && (value.dailyDigest || value.weeklyDigest)) errors.email = 'requiredEmail';
  return errors;
}
export function normalizedSettings(value: SettingsDraft): StoreSettings {
  return { storeName: value.storeName.trim(), category: value.category, currency: value.currency, reportingCycle: value.reportingCycle, language: value.language, marginThreshold: Number(value.marginThreshold), email: value.email.trim(), dailyDigest: value.dailyDigest, weeklyDigest: value.weeklyDigest };
}
function validSettings(value: unknown): value is StoreSettings {
  if (!value || typeof value !== 'object') return false;
  const v = value as StoreSettings;
  return typeof v.storeName === 'string' && typeof v.email === 'string' && v.email.length <= 254 &&
    typeof v.marginThreshold === 'number' && typeof v.dailyDigest === 'boolean' && typeof v.weeklyDigest === 'boolean' &&
    categories.includes(v.category) && currencies.includes(v.currency) && reportingCycles.includes(v.reportingCycle) &&
    (v.language === 'th' || v.language === 'en') && !Object.keys(validateSettings(settingsDraft(v))).length;
}

/** A browser preference namespace, not an authorization boundary. Never store tokens. */
export async function settingsStorageKey(base: string): Promise<string> {
  const guest = sessionStorage.getItem('demoMode') === '1';
  const token = sessionStorage.getItem(guest ? 'demoToken' : 'token');
  if (!token) throw Error('SETTINGS_SCOPE_UNAVAILABLE');
  let identity = token;
  if (!guest) {
    try { const payload = JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/'))); if (typeof payload.sub === 'string') identity = payload.sub; } catch { /* Opaque local tokens keep a separate scope. */ }
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${guest ? 'demo' : 'account'}|${identity}|${base}`));
  return 'marginsight:store-settings:v1:' + Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
}
export function localSettingsStorage(key: string): SettingsStorage {
  return {
    async load() {
      const raw = localStorage.getItem(key);
      if (raw === null) return { settings: null, recovered: false };
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.version === 1 && validSettings(parsed.settings)) return { settings: normalizedSettings(settingsDraft(parsed.settings)), recovered: false };
      } catch { /* Malformed preferences are recoverable; do not overwrite automatically. */ }
      return { settings: null, recovered: true };
    },
    async save(settings) {
      if (!validSettings(settings)) throw Error('INVALID_SETTINGS');
      localStorage.setItem(key, JSON.stringify({ version: 1, settings: normalizedSettings(settingsDraft(settings)) }));
    },
  };
}
