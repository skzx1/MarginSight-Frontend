'use client';
import { useState } from 'react';
import { request, download } from '../../lib/auth';
import { useAction, useResource } from '../../lib/use-resource';
import { bangkokDate } from '../../lib/format';
import type { Calculation, FeatureProps, OrderSummary, PageResult, Reconciliation } from '../../lib/types';
import { useLanguage } from '../language';
import { Empty, ErrorNotice, Loading, Submit } from '../components/forms';
import { DataStatus, EvidencePanel, Money } from '../components/ledger';
export function Orders({ base, month }: FeatureProps) {
  const { t } = useLanguage();
  const [cursor, setCursor] = useState('');
  const { data, error, loading, reload } = useResource<PageResult<OrderSummary>>(base + '/orders?month=' + month + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
  const action = useAction();
  const [selected, setSelected] = useState<{ order: OrderSummary; result: Calculation }>();
  const [checked, setChecked] = useState(false);
  const open = (order: OrderSummary) => action.run(async () => { const result = await request<Calculation>(base + '/orders/' + order.key + '/calculation'); setChecked(false); setSelected({ order, result }); });
  if (selected) return <><button className="ghost back-link" onClick={() => setSelected(undefined)}>← {t('orders')}</button><h2>{selected.order.orderId}</h2><ErrorNotice error={action.error} /><EvidencePanel result={selected.result} />{!selected.order.feesConfirmed && !!selected.result.postedFees?.length && <form className="confirm-panel" onSubmit={e => { e.preventDefault(); void action.run(async () => { const result = await request<Calculation>(base + '/orders/' + selected.order.key + '/settle', { confirmAllFeeLines: true, expectedInputHash: selected.result.inputHash }); setSelected({ order: { ...selected.order, feesConfirmed: true }, result }); setChecked(false); await reload(); }); }}><label className="check-field"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />{t('feeReview')}</label><Submit busy={action.busy} disabled={!checked}>{t('confirmFees')}</Submit></form>}<button className="secondary" disabled={action.busy} onClick={() => void open(selected.order)}>{t('refresh')}</button></>;
  return <><ErrorNotice error={error || action.error} />{error && <button className="secondary" onClick={() => void reload()}>{t('retry')}</button>}{loading && <Loading />}{data?.items.length === 0 && <Empty title={t('noOrders')} />}{data?.items.map(order => <button className="list-link" key={order.key} disabled={action.busy} onClick={() => void open(order)}><span><strong>{order.orderId}</strong><small>{bangkokDate(order.orderAt)} · {order.platform}</small></span><DataStatus value={order.feesConfirmed ? 'CONFIRMED' : 'ESTIMATED'} /><span aria-hidden="true">→</span></button>)}{data?.next && <button className="secondary" onClick={() => setCursor(data.next!)}>{t('next')}</button>}</>;
}
export function Settlement({ base, month }: FeatureProps) {
  const { t } = useLanguage();
  const { data, error, loading, reload } = useResource<PageResult<Reconciliation>>(base + '/reconciliation?month=' + month);
  const action = useAction();
  return <><p className="screen-note">{t('settlementNote')}</p><div className="actions">{['csv', 'xlsx'].map(format => <button key={format} className="secondary" disabled={action.busy} onClick={() => void action.run(async () => { const response = await request<{ downloadUrl: string }>(base + '/reports/export?month=' + month + '&format=' + format); await download(response.downloadUrl); })}>{t('export')} {format.toUpperCase()}</button>)}</div><ErrorNotice error={error || action.error} />{error && <button className="secondary" onClick={() => void reload()}>{t('retry')}</button>}{loading && <Loading />}{data?.items.length === 0 && <Empty title={t('noOrders')} />}{data?.items.map(row => <section key={row.key}><div className="section-heading"><h2>{row.orderId}</h2><span className={'badge ' + (row.payoutReconciled === true ? '' : 'warn')}>{t(row.payoutReconciled == null ? 'noEvidence' : row.payoutReconciled ? 'matches' : 'mismatch')}</span></div><dl className="ledger-lines"><div><dt>{t('estimated')}</dt><dd><Money value={row.estimatedFeeSatang} /></dd></div><div><dt>{t('actualFees')}</dt><dd><Money value={row.actualFeeSatang} /></dd></div><div><dt>{t('variance')}</dt><dd><Money value={row.varianceSatang} /></dd></div></dl></section>)}</>;
}
