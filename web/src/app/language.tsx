'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { copy, type CopyKey, type Locale } from '../lib/copy';
const LanguageContext = createContext({ locale: 'th' as Locale, setLocale: (_locale: Locale) => {}, t: (key: CopyKey): string => copy[key][0] });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('th');
  useEffect(() => { try { if (localStorage.getItem('marginsight.locale.v1') === 'en') setLocale('en'); } catch {} }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const change = (value: Locale) => { setLocale(value); try { localStorage.setItem('marginsight.locale.v1', value); } catch {} };
  return <LanguageContext.Provider value={{ locale, setLocale: change, t: key => copy[key][locale === 'th' ? 0 : 1] }}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
export function LanguageSwitch() {
  const { locale, setLocale, t } = useLanguage();
  return <div className="language-switch" role="group" aria-label={t('language')}>{(['th', 'en'] as const).map(value => <button key={value} type="button" className="ghost" lang={value} aria-pressed={locale === value} onClick={() => setLocale(value)}>{value.toUpperCase()}</button>)}</div>;
}
