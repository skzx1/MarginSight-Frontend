'use client';
import { useState } from 'react';
import { logout } from '../lib/auth';
import { Brand } from './ui';
import { LanguageSwitch, useLanguage } from './language';
import { ErrorNotice, Field, Submit } from './components/forms';
export default function Onboarding({ create, busy, error, back }: { create: (name: string) => Promise<void>; busy: boolean; error: unknown; back?: () => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  return <main className="public-page"><div className="public-topbar"><Brand /><LanguageSwitch /></div><div className="public-content narrow"><span className="eyebrow">01 / MARGINSIGHT</span><h1>{t('setup')}</h1><p>{t('setupBody')}</p><form className="panel" onSubmit={e => { e.preventDefault(); void create(name.trim()); }}><Field label={t('storeName')} value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="organization" /><ErrorNotice error={error} /><Submit busy={busy} disabled={name.trim().length < 2}>{t('createStore')}</Submit><p className="caption">{t('setupNote')}</p></form>{back && <button className="ghost" onClick={back}>← {t('back')}</button>}<button className="ghost" onClick={logout}>{t('logout')}</button></div></main>;
}
