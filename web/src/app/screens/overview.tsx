'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '../language';
import { useOverviewDashboard } from '../../lib/use-overview-dashboard';
import { bangkokDate } from '../../lib/format';
import type { Calculation, FeatureProps, Screen } from '../../lib/types';
import { DataStatus, EvidencePanel, Money } from '../components/ledger';
import { Empty, ErrorNotice, Field, Loading } from '../components/forms';
import { Icon } from '../ui';
import { OverviewCharts } from '../components/overview-charts';
import {
  channelSummaries, orderDateTime, ordersInPeriod, periodBounds, summarizeOrders,
  OVERVIEW_CHANNELS,
  type OverviewOrder, type OverviewPeriod
} from '../../lib/overview-data';

export default function Overview({ base, origin, period, navigate, onMissingCosts }: FeatureProps & {
  period: OverviewPeriod; navigate: (screen: Screen) => void; onMissingCosts: () => void;
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
  const percent = (value: number | null) => value == null ? '—' : new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-GB', { maximumFractionDigits: 1 }).format(value) + '%';
  const breakdown = [
    { label: t('costs'), value: stats.productCostSatang },
    { label: t('platformFees'), value: stats.platformFeeSatang },
    { label: t('overviewShipping'), value: stats.shippingSatang },
    ...(stats.otherCostSatang !== 0 ? [{ label: t('otherCosts'), value: stats.otherCostSatang }] : []),
    { label: t('profitCard'), value: stats.profitSatang }
  ];

  if (selected) {
    const calculation = data?.results.find(result => result.orderId === selected.orderId && result.platform === selected.platform);
    return <div className="overview-page evidence-view"><button className="back-link ghost" onClick={() => setSelected(undefined)}>← {t('back')}</button><div className="section-heading"><h2>{selected.orderId}</h2><span className="badge">{selected.platform}</span></div>{calculation && <EvidencePanel result={calculation} />}</div>;
  }

  return <div className="overview-page" aria-busy={loading}>
    <ErrorNotice error={error} />{Boolean(error) && <button className="secondary" onClick={() => void reload()}>{t('retry')}</button>}
    {!bounds && <p className="notice" role="alert">{t('invalidRange')}</p>}
    {!loading && coverage?.partial && <p className="notice" role="alert">{locale==='th'?`API ส่งรายละเอียดมา ${coverage.loaded} จาก ${coverage.total} ออเดอร์ในเดือนที่เลือก ตัวเลขและกราฟด้านล่างรวมเฉพาะรายการที่โหลดได้ ไม่ใช่ยอดรวมทั้งร้าน`:`The API returned ${coverage.loaded} of ${coverage.total} orders in the selected months. Figures and charts cover loaded entries only, not the whole store.`}</p>}
    {data && !loading && <>
      <div className="row overview-status-bar"><DataStatus value={data.dataOrigin} /><span className="caption" data-testid="overview-coverage">{t('coverage')}: {stats.completeOrders}/{stats.totalOrders}</span></div>
      {stats.missingCostOrders > 0 && <button className="overview-cost-warning" onClick={onMissingCosts}><span>{t('missingCostPrefix')} {stats.missingCostOrders} {t('missingCostSuffix')}</span><Icon name="arrow" /></button>}
    </>}

    {(loading || data) && <section className="summary-cards-container" aria-label={t('overviewSummary')}>
      <article className="summary-card profit-card">
        <div className="summary-card-header"><div className="summary-card-title"><span className="summary-mark profit-mark" aria-hidden="true" /><h2>{t('profitCard')}</h2></div><small className="overview-active-period">{periodLabel}</small></div>
        {loading ? <Loading /> : <><div className={'summary-main-number' + (stats.profitSatang != null && stats.profitSatang < 0 ? ' negative' : '')} data-testid="overview-profit"><Money value={bounds ? stats.profitSatang : null} /></div><dl className="overview-card-metric"><div><dt>{t('netMargin')}</dt><dd>{percent(bounds ? stats.marginPct : null)}</dd></div></dl>{stats.profitSatang == null && <p className="caption">{t('missingProfitNote')}</p>}</>}
      </article>
      <article className="summary-card sales-card">
        <div className="summary-card-header"><div className="summary-card-title"><span className="summary-mark sales-mark" aria-hidden="true" /><h2>{t('salesCard')}</h2></div><small className="overview-active-period">{periodLabel}</small></div>
        {loading ? <Loading /> : <><div className="summary-main-number" data-testid="overview-sales"><Money value={bounds ? stats.revenueSatang : null} /></div><dl className="overview-card-metric"><div><dt>{t('totalCostsFees')}</dt><dd><Money value={bounds ? stats.totalCostsSatang : null} /></dd></div></dl></>}
      </article>
    </section>}
    <p className="caption overview-scope">{t('scope')}{' · ' + t('loadedOnly')}</p>
    {!loading && data && bounds && <OverviewCharts orders={orders} />}

    <section className="quick-actions-row" aria-label={t('quickActions')}>
      {[
        { screen: 'assistant' as const, icon: 'assistant' as const, title: t('assistant'), helper: t('askDiscount') },
        { screen: 'addProduct' as const, icon: 'plus' as const, title: t('addProduct'), helper: t('overviewAddHelper') },
        { screen: 'imports' as const, icon: 'upload' as const, title: t('imports'), helper: t('overviewImportHelper') }
      ].map(action => <button key={action.screen} className={'overview-quick-action' + (action.screen === 'assistant' ? ' assistant-action' : '')} onClick={() => navigate(action.screen)}><Icon name={action.icon} /><span><strong>{action.title}</strong><small>{action.helper}</small></span><Icon name="arrow" /></button>)}
    </section>
    <details className="overview-insights"><summary>{t('salesAllocation')} · {t('channelInsight')}</summary>
      <p className="caption">{periodLabel}</p>
      <div className="overview-insight-grid">
        <div><h3>{t('salesAllocation')}</h3>{loading ? <Loading /> : !orders.length ? <p className="caption">{t('noOrdersInPeriod')}</p> : <dl className="ledger-lines">{breakdown.map(row => <div key={row.label}><dt>{row.label}</dt><dd><Money value={row.value} /></dd></div>)}</dl>}</div>
        <div><h3>{t('channelInsight')}</h3>{loading ? <Loading /> : !orders.length ? <p className="caption">{t('noOrdersInPeriod')}</p> : <ul className="overview-channels">{channels.map(row => <li className="overview-channel-row" key={row.platform}><strong>{row.platform}</strong><span className={row.profitSatang != null && row.profitSatang < 0 ? 'negative' : ''}><small>{t('profitCard')}</small>{row.totalOrders ? <Money value={row.profitSatang} /> : '—'}</span><span><small>{t('netMargin')}</small>{row.totalOrders ? percent(row.marginPct) : '—'}{!row.totalOrders && <small>{t('noChannelOrders')}</small>}</span></li>)}</ul>}</div>
      </div><p className="caption">{t('overviewImportNote')}</p>
    </details>

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
          <span className="order-col-amount"><strong className="order-amount-text"><Money value={order.revenueSatang} /></strong><small className={'order-profit-sub' + (order.profitSatang != null && order.profitSatang < 0 ? ' negative' : '')}>{t('profitCard')}: <Money value={order.profitSatang} /></small></span>
          <span className="order-col-arrow" aria-hidden="true"><Icon name="arrow" /></span>
        </button></li>)}</ul>
        {matches.length > visibleCount && <button className="secondary" onClick={() => setVisibleCount(count => count + 5)}>{t('showMoreOrders')}</button>}
      </>}
    </section>
  </div>;
}
