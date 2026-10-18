'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '../../lib/copy';
import { defaultSettings, localSettingsStorage, normalizedSettings, settingsDraft, settingsStorageKey, validateSettings, type SettingsDraft, type SettingsStorage } from '../../lib/store-settings';

export function useStoreSettings(base: string, storeName: string, language: Locale, setLanguage: (language: Locale) => void, onNameSaved: (name: string) => void) {
  const defaults = useRef(defaultSettings(storeName, language));
  const [saved, setSaved] = useState(defaults.current), [draft, setDraft] = useState(settingsDraft(defaults.current));
  const [ready, setReady] = useState(false), [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState(false), [recovered, setRecovered] = useState(false), [success, setSuccess] = useState(false);
  const storage = useRef<SettingsStorage | null>(null), mounted = useRef(false), busy = useRef(false);
  const callbacks = useRef({ setLanguage, onNameSaved, language });
  useEffect(() => { callbacks.current = { setLanguage, onNameSaved, language }; }, [setLanguage, onNameSaved, language]);
  useEffect(() => {
    mounted.current = true; let active = true;
    void (async () => {
      try {
        const adapter = localSettingsStorage(await settingsStorageKey(base));
        const loaded = await adapter.load();
        if (!active) return;
        storage.current = adapter;
        const value = loaded.settings ?? { ...defaults.current, language: callbacks.current.language };
        setSaved(value); setDraft(settingsDraft(value)); setRecovered(loaded.recovered);
        callbacks.current.setLanguage(value.language); callbacks.current.onNameSaved(value.storeName);
      } catch { if (active) { const value = { ...defaults.current, language: callbacks.current.language }; setSaved(value); setDraft(settingsDraft(value)); setStorageError(true); } }
      finally { if (active) setReady(true); }
    })();
    return () => { active = false; mounted.current = false; storage.current = null; };
  }, [base]);
  useEffect(() => { if (!success) return; const timeout = setTimeout(() => setSuccess(false), 5000); return () => clearTimeout(timeout); }, [success]);
  const effectiveDraft = { ...draft, language };
  const dirty = ready && JSON.stringify(effectiveDraft) !== JSON.stringify(settingsDraft(saved));
  const update = <K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) => { setSuccess(false); setDraft(old => ({ ...old, [key]: value })); };
  const cancel = useCallback(() => { setDraft(settingsDraft(saved)); callbacks.current.setLanguage(saved.language); setSuccess(false); }, [saved]);
  const save = async () => {
    if (busy.current || Object.keys(validateSettings(effectiveDraft)).length) return false;
    busy.current = true; setSaving(true); setSuccess(false);
    try {
      const value = normalizedSettings(effectiveDraft);
      const adapter = storage.current ?? localSettingsStorage(await settingsStorageKey(base));
      await adapter.save(value);
      if (!mounted.current) return false;
      storage.current = adapter; setSaved(value); setDraft(settingsDraft(value)); setStorageError(false); setRecovered(false); setSuccess(true);
      callbacks.current.onNameSaved(value.storeName);
      return true;
    } catch { if (mounted.current) setStorageError(true); return false; }
    finally { busy.current = false; if (mounted.current) setSaving(false); }
  };
  return { ready, saving, draft: effectiveDraft, dirty, storageError, recovered, success: success && !dirty, update, cancel, save };
}
