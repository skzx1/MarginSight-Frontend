'use client';
import { Brand } from './ui';
import { LanguageSwitch, useLanguage } from './language';
export default function NotFound() { const { t } = useLanguage(); return <main className="public-page"><div className="public-topbar"><Brand /><LanguageSwitch /></div><section className="public-content narrow"><span className="eyebrow">404</span><h1>{t('notFound')}</h1><a className="button-link" href="/">{t('home')}</a></section></main>; }
