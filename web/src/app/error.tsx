'use client';
import { Brand } from './ui';
import { LanguageSwitch, useLanguage } from './language';
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useLanguage();
  return <main className="public-page"><div className="public-topbar"><Brand /><LanguageSwitch /></div><section className="public-content narrow" role="alert"><span className="eyebrow">MARGINSHOT</span><h1>{t('errorTitle')}</h1><p>{t('recoverNote')}</p><div className="actions"><button onClick={retry}>{t('retry')}</button><a className="button-link secondary" href="/">{t('home')}</a></div></section></main>;
}
