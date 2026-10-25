'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '../language';
import { useOverviewDashboard } from '../../lib/use-overview-dashboard';
import { bangkokDate } from '../../lib/format';
import type { FeatureProps, Screen } from '../../lib/types';
import { DataStatus, EvidencePanel, Money } from '../components/ledger';
import { Empty, ErrorNotice, Field, Loading } from '../components/forms';
import { Icon } from '../ui';
import { ChannelPanel, OverviewCharts } from '../components/overview-charts';
import { ScreenActions, type NavigateOptions } from '../components/shell';
import { ProfitAmount } from '../components/profit-amount';
import { percent as formatPercent } from '../../lib/signed-money';
import {
  channelSummaries, orderDateTime, ordersInPeriod, periodBounds, summarizeOrders,
  OVERVIEW_CHANNELS,
  type OverviewOrder, type OverviewPeriod
} from '../../lib/overview-data';

export default function Overview({ base, origin, period, navigate, onMissingCosts }: FeatureProps & {
  period: OverviewPeriod; navigate: (screen: Screen, options?: NavigateOptions) => void; onMissingCosts: () => void;
}) {
  const { t, locale } = useLanguage();
  const today = bangkokDate();
  const { data, coverage, error, loading, reload } = useOverviewDashboard(base, period, today, origin);
  const [selected, setSelected] = useState<OverviewOrder>();
  const [search, setSearch] = useState(''), [channel, setChannel] = useState('all'), [visibleCount, setVisibleCount] = useState(5);
  useEffect(() => { setSelected(undefined); setVisibleCount(5); }, [period.type, period.start, period.end]);

  const allOrders: OverviewOrder[] = (data?.results ?? []).map(result => ({
    orderId: result.orderId, platform: result.platform, orderAt: result.orderAt,
    revenueSatang: result.revenueSatang, profitSatang: result.profitSatang,
    productCostSatang: result.cogsSatang, platformFeeSatang: result.missingFields?.some(field => field === 'base_fee_rules' || field.startsWith('rule:') || field.startsWith('cash_deduction')) ? null : result.feeSatang,
    shippingSatang: result.sellerShippingSatang, otherCostSatang: result.packagingSatang + result.adsSatang,
    productName: result.items.map(item => item.sku).join(', '), skus: result.items.map(item => item.sku),
    status: result.status, missingFields: result.missingFields
  }));
  const bounds = periodBounds(period, today);
  const periodLabel = bounds ? `${t(period.type === 'today' ? 'today' : period.type === 'week' ? 'thisWeek' : period.type === 'month' ? 'thisMonth' : 'customRange')} · ${bounds.start}${bounds.end !== bounds.start ? ' – ' + bounds.end : ''}` : t('invalidRange');
  const orders = ordersInPeriod(allOrders, period, today);
  const stats = summarizeOrders(orders);
  const channels = channelSummaries(orders);
  const channelOptions = [...new Set([...OVERVIEW_CHANNELS, ...orders.map(order => order.platform)])];
  const matches = orders.filter(order => (channel === 'all' || order.platform === channel) &&
    `${order.orderId} ${order.productName} ${order.skus.join(' ')}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    .sort((a, b) => Date.parse(b.orderAt) - Date.parse(a.orderAt));
  const percent = (value: number | null) => formatPercent(value, locale);
  const breakdown = [
    { label: t('costs'), value: stats.productCostSatang },
    { label: t('platformFees'), value: stats.platformFeeSatang },
    { label: t('overviewShipping'), value: stats.shippingSatang },
    ...(stats.otherCostSatang !== 0 ? [{ label: t('otherCosts'), value: stats.otherCostSatang }] : []),
    { label: t('netProfitLoss'), value: stats.profitSatang, profit: true }
  ];
  // Four KPIs from the same summary (no new formulas). Each has its own "see breakdown" control (K1) → finance, same period.
  const kpis = [
    { id: 'profit', title: t('netProfitLoss'), mark: 'profit-mark', negative: bounds != null && stats.profitSatang != null && stats.profitSatang < 0, testId: 'overview-profit', value: <ProfitAmount value={bounds ? stats.profitSatang : null} />, note: stats.profitSatang == null ? t('missingProfitNote') : undefined },
    { id: 'sales', title: t('salesCard'), mark: 'sales-mark', negative: false, testId: 'overview-sales', value: <Money value={bounds ? stats.revenueSatang : null} /> },
    { id: 'margin', title: t('netMargin'), mark: '', negative: bounds != null && stats.marginPct != null && stats.marginPct < 0, testId: 'overview-margin', value: percent(bounds ? stats.marginPct : null) },
    { id: 'costs', title: t('totalCostsFees'), mark: 'cost-mark', negative: false, testId: 'overview-costs', value: <Money value={bounds ? stats.totalCostsSatang : null} /> }
  ];
  // Page header actions (G6 #14, L1: one filled button): add product = primary, import = secondary.
  const headerActions = <ScreenActions><button type="button" onClick={() => navigate('addProduct')}><Icon name="plus" />{t('addProduct')}</button><button type="button" className="secondary" onClick={() => navigate('imports')}><Icon name="upload" />{t('imports')}</button></ScreenActions>;

  if (selected) {
    const calculation = data?.results.find(result => result.orderId === selected.orderId && result.platform === selected.platform);
    return <div className="overview-page evidence-view">{headerActions}<button className="back-link ghost" onClick={() => setSelected(undefined)}>← {t('back')}</button><div className="section-heading"><h2>{selected.orderId}</h2><span className="badge">{selected.platform}</span></div>{calculation && <EvidencePanel result={calculation} />}</div>;
  }

  return <div className="overview-page" aria-busy={loading}>
    {headerActions}
    <ErrorNotice error={error} />{Boolean(error) && <button className="secondary" onClick={() => void reload()}>{t('retry')}</button>}
    {!bounds && <p className="notice" role="alert"><Icon name="warning" />{t('invalidRange')}</p>}
    {!loading && coverage?.partial && <p className="notice" role="alert"><Icon name="warning" />{locale==='th'?`API ส่งรายละเอียดมา ${coverage.loaded} จาก ${coverage.total} ออเดอร์ในเดือนที่เลือก ตัวเลขและกราฟด้านล่างรวมเฉพาะรายการที่โหลดได้ ไม่ใช่ยอดรวมทั้งร้าน`:`The API returned ${coverage.loaded} of ${coverage.total} orders in the selected months. Figures and charts cover loaded entries only, not the whole store.`}</p>}
    <div className="overview-layout">
    <div className="overview-main">
    {/* D10: the missing-cost alert comes before the profit figures, so it is read first on small screens. */}
    {data && !loading && stats.missingCostOrders > 0 && <button className="overview-cost-warning" onClick={onMissingCosts}><span>{t('missingCostPrefix')} {stats.missingCostOrders} {t('missingCostSuffix')}</span><Icon name="arrow" /></button>}

    {(loading || data) && <section className="overview-kpis" aria-label={t('overviewSummary')}>
      <p className="caption overview-active-period">{periodLabel}</p>
      <div className="overview-kpi-grid">{kpis.map(kpi => <article key={kpi.id} className="summary-card overview-kpi">
        <div className="summary-card-title">{kpi.mark && <span className={'summary-mark ' + kpi.mark} aria-hidden="true" />}<h2 id={'overview-kpi-' + kpi.id}>{kpi.title}</h2></div>
        {loading ? <Loading /> : <>
          <div className={'summary-main-number' + (kpi.negative ? ' negative' : '')} data-testid={kpi.testId}>{kpi.value}</div>
          {kpi.note && <p className="caption">{kpi.note}</p>}
          <button type="button" className="ghost overview-source-link" aria-describedby={'overview-kpi-' + kpi.id} onClick={() => navigate('finance')}>{t('seeSource')}<Icon name="chevronRight" /></button>
        </>}
      </article>)}</div>
    </section>}
    {data && !loading && <div className="row overview-status-bar"><DataStatus value={data.dataOrigin} /><span className="caption" data-testid="overview-coverage">{t('coverage')}: {stats.completeOrders}/{stats.totalOrders}</span></div>}
    <p className="caption overview-scope">{t('scope')}{' · ' + t('loadedOnly')}</p>
    {!loading && data && bounds && <OverviewCharts orders={orders} />}

    <section className="recent-orders-section">
      <div className="section-heading"><div><h2>{t('recentOrders')}</h2><p className="caption">{t('loadedOnly')} · {orders.length} {t('orders')}</p></div><button className="ghost view-all-link" onClick={() => navigate('orders')}>{t('allOrders')} →</button></div>
      <div className="overview-order-filters"><Field label={t('overviewSearch')} type="search" value={search} onChange={e => { setSearch(e.target.value); setVisibleCount(5); }} />
        <div className="overview-channel-filters" role="group" aria-label={t('channel')}>{['all', ...channelOptions].map(value => <button type="button" className="secondary" key={value} aria-pressed={channel === value} onClick={() => { setChannel(value); setVisibleCount(5); }}>{value === 'all' ? t('all') : value}</button>)}</div>
      </div>
      {loading ? <Loading /> : !matches.length ? <Empty title={orders.length ? t('noMatchingOrders') : t('noOrdersInPeriod')} action={(search || channel !== 'all') ? <button className="secondary" onClick={() => { setSearch(''); setChannel('all'); }}>{t('clearFilters')}</button> : undefined} /> : <>
        <p className="caption" aria-live="polite">{Math.min(visibleCount, matches.length)} / {matches.length} · {t('overviewLoaded')}: {orders.length}</p>
        <ul className="recent-orders-list">{matches.slice(0, visibleCount).map(order => <li key={order.platform + order.orderId}><button type="button" className="order-row-item" onClick={() => setSelected(order)}>
          <span className="order-col-id"><strong className="order-id-text">{order.orderId}</strong><span className="order-product-text">{order.productName}</span></span>
          <span className="order-col-channel"><span className="channel-badge">{order.platform}</span></span>
          <time className="order-col-time" dateTime={order.orderAt}>{orderDateTime(order.orderAt)}</time>
          <span className="order-col-amount"><strong className="order-amount-text"><Money value={order.revenueSatang} /></strong><small className={'order-profit-sub' + (order.profitSatang != null && order.profitSatang < 0 ? ' negative' : '')}>{order.profitSatang == null ? <>{t('netProfitLoss')}: —</> : <ProfitAmount value={order.profitSatang} />}</small></span>
          <span className="order-col-arrow" aria-hidden="true"><Icon name="arrow" /></span>
        </button></li>)}</ul>
        {matches.length > visibleCount && <button className="secondary" onClick={() => setVisibleCount(count => count + 5)}>{t('showMoreOrders')}</button>}
      </>}
    </section>
    </div>

    <div className="overview-side">
      <section className="overview-launcher" aria-labelledby="overview-launcher-title">
        <h2 id="overview-launcher-title"><Icon name="assistant" />{t('assistantLauncherTitle')}</h2>
        <p className="caption">{t('assistantLauncherHelper')}</p>
        <button type="button" className="secondary" onClick={() => navigate('assistant', { focus: 'assistant-input' })}>{t('assistantLauncherAction')}<Icon name="arrow" /></button>
      </section>
      {(loading || data) && <section className="overview-money" aria-labelledby="overview-money-title">
        <h2 id="overview-money-title">{t('salesAllocation')}</h2><p className="caption">{periodLabel}</p>
        {loading ? <Loading /> : !orders.length ? <p className="caption">{t('noOrdersInPeriod')}</p> : <dl className="ledger-lines">{breakdown.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{'profit' in row ? <ProfitAmount value={row.value} /> : <Money value={row.value} />}</dd></div>)}</dl>}
        <p className="caption">{t('overviewImportNote')}</p>
      </section>}
      {loading ? <section aria-busy="true"><Loading /></section> : data && <ChannelPanel orders={orders}>
        {orders.length > 0 && <><h3>{t('channelInsight')}</h3><ul className="overview-channels">{channels.map(row => <li className="overview-channel-row" key={row.platform}><strong>{row.platform}</strong><span className={row.profitSatang != null && row.profitSatang < 0 ? 'negative' : ''}><small>{t('netProfitLoss')}</small>{row.totalOrders ? <ProfitAmount value={row.profitSatang} /> : '—'}</span><span><small>{t('netMargin')}</small>{row.totalOrders ? percent(row.marginPct) : '—'}{!row.totalOrders && <small>{t('noChannelOrders')}</small>}</span></li>)}</ul></>}
      </ChannelPanel>}
    </div>
    </div>
  </div>;
}
