'use client';
import { useEffect, useRef, useState } from 'react';
import { request, download } from '../../lib/auth';
import { useAction, useResource } from '../../lib/use-resource';
import { bangkokDate } from '../../lib/format';
import type { Calculation, FeatureProps, OrderSummary, PageResult, Reconciliation } from '../../lib/types';
import { useLanguage } from '../language';
import { Empty, ErrorNotice, Loading, Submit } from '../components/forms';
import { DataStatus, EvidencePanel, Money } from '../components/ledger';
import { Icon } from '../ui';
import { SCREEN_TITLE_ID } from '../../lib/navigation';
import { DETAIL_TITLE_ID, detailMayTakeFocus } from '../../lib/routes';
/** Orders list and evidence detail. The open order is the route (#orders/<key>, P4-G3): refresh, Back/Forward and links reopen it. */
export function Orders({ base, month, detail, onDetail }: FeatureProps & { detail: string | null; onDetail: (key: string | null, options?: { replace?: boolean }) => void }) {
  const { t } = useLanguage();
  const [cursor, setCursor] = useState('');
  const { data, error, loading, reload } = useResource<PageResult<OrderSummary>>(base + '/orders?month=' + month + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
  const action = useAction();
  const [selected, setSelected] = useState<{ order: OrderSummary; result: Calculation }>();
  const [checked, setChecked] = useState(false), [linkMissing, setLinkMissing] = useState(false);
  const wanted = useRef(detail), pending = useRef<string | null>(null); wanted.current = detail;
  /**
   * Fetch the calculation; true when it is shown (false after an error, or when the route moved on meanwhile).
   * A key that is not in the loaded list (another month or page, e.g. after a refresh) is fetched directly; its list
   * fields are read from the calculation (orderId, platform, orderAt; fees count as confirmed when feeStatus is ACTUAL).
   */
  const open = async (order: OrderSummary | string) => { let shownNow = false; await action.run(async () => {
    const key = typeof order === 'string' ? order : order.key;
    const result = await request<Calculation>(base + '/orders/' + (typeof order === 'string' ? encodeURIComponent(key) : key) + '/calculation');
    if (wanted.current !== key) return;
    const summary: OrderSummary = typeof order === 'string' ? { key, orderId: result.orderId, platform: result.platform, orderAt: result.orderAt, feesConfirmed: result.feeStatus === 'ACTUAL' } : order;
    setChecked(false); setSelected({ order: summary, result }); shownNow = true;
  }); return shownNow; };
  // Route → detail: use the loaded list row when there is one, otherwise fetch the key directly. The fetch failed for an
  // unlisted key → list + "not found" notice; failed for a listed one → list + the error.
  const shown = selected && selected.order.key === detail ? selected : undefined;
  useEffect(() => {
    if (!detail || shown || (!data && !error) || pending.current === detail) return;
    const listed = data?.items.find(item => item.key === detail);
    setLinkMissing(false); pending.current = detail;
    void open(listed ?? detail).then(ok => {
      pending.current = null;
      if (ok || wanted.current !== detail) return;
      if (!listed) { action.clearError(); setLinkMissing(true); }
      onDetail(null, { replace: true });
    });
  }, [detail, data, error]); // eslint-disable-line react-hooks/exhaustive-deps
  // Focus (G7 F2): the detail heading on open; the originating list button on close.
  const returnTo = useRef<string | null>(null);
  useEffect(() => {
    if (shown) { returnTo.current = shown.order.key; if (detailMayTakeFocus(document.activeElement as HTMLElement | null, shown.order.key)) document.getElementById(DETAIL_TITLE_ID)?.focus(); return; }
    const key = returnTo.current; if (!key) return; returnTo.current = null;
    const row = [...document.querySelectorAll<HTMLElement>('[data-order-key]')].find(element => element.dataset.orderKey === key);
    (row ?? document.getElementById(SCREEN_TITLE_ID))?.focus();
  }, [shown?.order.key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (shown) return <><button className="ghost back-link" onClick={() => onDetail(null)}>← {t('orders')}</button><h2 id={DETAIL_TITLE_ID} tabIndex={-1}>{shown.order.orderId}</h2><ErrorNotice error={action.error} /><EvidencePanel result={shown.result} />{!shown.order.feesConfirmed && !!shown.result.postedFees?.length && <form className="confirm-panel" onSubmit={e => { e.preventDefault(); void action.run(async () => { const result = await request<Calculation>(base + '/orders/' + shown.order.key + '/settle', { confirmAllFeeLines: true, expectedInputHash: shown.result.inputHash }); setSelected({ order: { ...shown.order, feesConfirmed: true }, result }); setChecked(false); await reload(); }); }}><label className="check-field"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />{t('feeReview')}</label><Submit busy={action.busy} disabled={!checked}>{t('confirmFees')}</Submit></form>}<button className="secondary" disabled={action.busy} onClick={() => void open(shown.order)}>{t('refresh')}</button></>;
  return <><div role="status" aria-live="polite">{linkMissing && <p className="notice info"><Icon name="info" />{t('orderLinkMissing')}</p>}</div><ErrorNotice error={error || action.error} />{error && <button className="secondary" onClick={() => void reload()}>{t('retry')}</button>}{loading && <Loading />}{data?.items.length === 0 && <Empty title={t('noOrders')} />}{data?.items.map(order => <button className="list-link" key={order.key} data-order-key={order.key} disabled={action.busy} onClick={() => { setLinkMissing(false); onDetail(order.key); }}><span><strong>{order.orderId}</strong><small>{bangkokDate(order.orderAt)} · {order.platform}</small></span><DataStatus value={order.feesConfirmed ? 'CONFIRMED' : 'ESTIMATED'} /><span aria-hidden="true">→</span></button>)}{data?.next && <button className="secondary" onClick={() => setCursor(data.next!)}>{t('next')}</button>}</>;
}
export function Settlement({ base, month }: FeatureProps) {
  const { t } = useLanguage();
  const { data, error, loading, reload } = useResource<PageResult<Reconciliation>>(base + '/reconciliation?month=' + month);
  const action = useAction();
  return <><p className="screen-note">{t('settlementNote')}</p><div className="actions">{['csv', 'xlsx'].map(format => <button key={format} className="secondary" disabled={action.busy} onClick={() => void action.run(async () => { const response = await request<{ downloadUrl: string }>(base + '/reports/export?month=' + month + '&format=' + format); await download(response.downloadUrl); })}>{t('export')} {format.toUpperCase()}</button>)}</div><ErrorNotice error={error || action.error} />{error && <button className="secondary" onClick={() => void reload()}>{t('retry')}</button>}{loading && <Loading />}{data?.items.length === 0 && <Empty title={t('noOrders')} />}{data?.items.map(row => <section key={row.key}><div className="section-heading"><h2>{row.orderId}</h2><span className={'badge ' + (row.payoutReconciled === true ? '' : 'warn')}>{t(row.payoutReconciled == null ? 'noEvidence' : row.payoutReconciled ? 'matches' : 'mismatch')}</span></div><dl className="ledger-lines"><div><dt>{t('estimated')}</dt><dd><Money value={row.estimatedFeeSatang} /></dd></div><div><dt>{t('actualFees')}</dt><dd><Money value={row.actualFeeSatang} /></dd></div><div><dt>{t('variance')}</dt><dd><Money value={row.varianceSatang} /></dd></div></dl></section>)}</>;
}
