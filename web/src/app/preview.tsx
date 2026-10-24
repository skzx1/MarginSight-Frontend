'use client';
import { useEffect, useState } from 'react';
import { preview } from '../lib/auth';
import { parseBaht } from '../lib/format';
import { useAction } from '../lib/use-resource';
import type { Scenario } from '../lib/types';
import { Brand } from './ui';
import { LanguageSwitch, useLanguage } from './language';
import { ErrorNotice, Field, Submit } from './components/forms';
import { DataStatus, EvidencePanel, Money } from './components/ledger';
import { ProfitAmount } from './components/profit-amount';
export default function Preview({ back }: { back: () => void }) {
  const { t } = useLanguage();
  const [price, setPrice] = useState('170.00'), [program, setProgram] = useState(true), [result, setResult] = useState<Scenario>();
  const action = useAction();
  const run = () => action.run(async () => setResult(await preview({ priceSatang: parseBaht(price), program })));
  useEffect(() => { void run(); }, []);
  return <main className="public-page"><div className="public-topbar"><Brand /><LanguageSwitch /></div><div className="public-content"><button className="ghost back-link" onClick={back}>← {t('home')}</button><DataStatus value="MOCK" /><h1>{t('simulation')}</h1><p className="screen-note">{t('previewNote')}</p><div className="two-column"><form className="panel" onSubmit={e => { e.preventDefault(); void run(); }}><Field label={t('price')} inputMode="decimal" required value={price} disabled={action.busy} onChange={e => { setPrice(e.target.value); setResult(undefined); }} /><label className="check-field"><input type="checkbox" checked={program} disabled={action.busy} onChange={e => { setProgram(e.target.checked); setResult(undefined); }} />{t('program')}</label><ErrorNotice error={action.error} /><Submit busy={action.busy}>{t('calculate')}</Submit></form>{result && <div><div className="comparison"><div>{t('before')}<strong><ProfitAmount value={result.baseline?.profitSatang} /></strong></div><div>{t('after')}<strong><ProfitAmount value={result.scenario.profitSatang} /></strong></div></div><EvidencePanel result={result.scenario} /><p>{t('breakEven')}: <Money value={result.breakEven.priceSatang} /></p><p className="caption">{t('breakEvenNote')}</p></div>}</div></div></main>;
}
