'use client';
import { useId, useState } from 'react';
import { useLanguage } from '../language';
import { useResource } from '../../lib/use-resource';
import { bangkokDate, money } from '../../lib/format';
import type { Calculation, Dashboard, FeatureProps, Screen } from '../../lib/types';
import { DataStatus, EvidencePanel, Money } from '../components/ledger';
import { Empty, ErrorNotice, Loading } from '../components/forms';
import { Icon } from '../ui';
import {
  getPeriodStats,
  OVERVIEW_MOCK_ORDERS,
  type MockOrderRecord,
  type PeriodType
} from '../../lib/mock-data';

export default function Overview({
  base,
  month,
  guest,
  navigate,
  sampleMonth
}: FeatureProps & { navigate: (screen: Screen) => void; sampleMonth: () => void }) {
  const { t, locale } = useLanguage();
  const { data, error, loading, reload } = useResource<Dashboard>(base + '/dashboard?month=' + month);
  const [selected, setSelected] = useState<Calculation | MockOrderRecord>();

  // Summary Card Period States (Independent per card)
  const [profitPeriod, setProfitPeriod] = useState<PeriodType>('month');
  const [profitRange, setProfitRange] = useState({ start: '2026-10-01', end: '2026-10-17' });
  const [salesPeriod, setSalesPeriod] = useState<PeriodType>('month');
  const [salesRange, setSalesRange] = useState({ start: '2026-10-01', end: '2026-10-17' });

  const profitPeriodId = useId();
  const salesPeriodId = useId();

  // Combine loaded calculations and mock orders
  const ordersFromData: MockOrderRecord[] = (data?.results ?? []).map(r => ({
    orderId: r.orderId,
    platform: (r.platform === 'mock-market' ? 'Shopee' : r.platform) as MockOrderRecord['platform'],
    orderAt: r.orderAt,
    revenueSatang: r.revenueSatang,
    profitSatang: r.profitSatang,
    productName: r.items?.[0]?.sku || t('products'),
    status: r.status
  }));

  const allOrders: MockOrderRecord[] = ordersFromData.length > 1
    ? ordersFromData
    : OVERVIEW_MOCK_ORDERS;

  const profitStats = getPeriodStats(allOrders, profitPeriod, profitRange);
  const salesStats = getPeriodStats(allOrders, salesPeriod, salesRange);

  // 5 Most recent orders sorted newest first
  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.orderAt).getTime() - new Date(a.orderAt).getTime())
    .slice(0, 5);

  const formatOrderTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const bDate = bangkokDate(iso);
      const hours = String(d.getUTCHours() + 7).padStart(2, '0');
      const mins = String(d.getUTCMinutes()).padStart(2, '0');
      return `${bDate} ${hours}:${mins}`;
    } catch {
      return iso.slice(0, 16).replace('T', ' ');
    }
  };

  if (selected) {
    const calc = 'formulaVersion' in selected ? (selected as Calculation) : undefined;
    return (
      <div className="evidence-view">
        <button className="back-link ghost" onClick={() => setSelected(undefined)}>
          ← {t('back')}
        </button>
        <div className="section-heading">
          <h2>{selected.orderId}</h2>
          <span className="badge">{selected.platform}</span>
        </div>
        {calc ? (
          <EvidencePanel result={calc} />
        ) : (
          <section className="panel">
            <h3>{'productName' in selected ? selected.productName : selected.orderId}</h3>
            <p className="caption">{formatOrderTime(selected.orderAt)}</p>
            <dl className="ledger-lines">
              <div>
                <dt>{t('revenue')}</dt>
                <dd><Money value={selected.revenueSatang} /></dd>
              </div>
              <div>
                <dt>{t('profit')}</dt>
                <dd><Money value={selected.profitSatang} /></dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="overview-page">
      <ErrorNotice error={error} />
      {Boolean(error) && (
        <button className="secondary" onClick={() => void reload()}>
          {t('retry')}
        </button>
      )}
      {loading && <Loading />}

      <div className="row overview-status-bar">
        <DataStatus value={data?.dataOrigin ?? 'MOCK'} />
        <span className="caption">
          {t('coverage')}: {data?.completeOrders ?? 10}/{data?.totalOrders ?? 10}
        </span>
      </div>

      {/* Two Large Summary Cards */}
      <section className="summary-cards-container" aria-label="สรุปกำไรและยอดขาย">
        {/* Profit Card */}
        <article className="summary-card profit-card">
          <div className="summary-card-header">
            <div className="summary-card-title">
              <span className="summary-mark profit-mark" aria-hidden="true" />
              <h2>{t('profitCard')}</h2>
            </div>
            <div className="period-selector">
              <label htmlFor={profitPeriodId} className="sr-only">
                {t('profitCard')} {t('month')}
              </label>
              <select
                id={profitPeriodId}
                value={profitPeriod}
                onChange={e => setProfitPeriod(e.target.value as PeriodType)}
                className="period-select"
              >
                <option value="today">{t('today')}</option>
                <option value="week">{t('thisWeek')}</option>
                <option value="month">{t('thisMonth')}</option>
                <option value="custom">{t('customRange')}</option>
              </select>
            </div>
          </div>

          {profitPeriod === 'custom' && (
            <div className="custom-range-inputs">
              <label className="field-inline">
                <span className="sr-only">{t('customStartDate')}</span>
                <input
                  type="date"
                  value={profitRange.start}
                  onChange={e => setProfitRange(prev => ({ ...prev, start: e.target.value }))}
                  aria-label={t('customStartDate')}
                />
              </label>
              <span>—</span>
              <label className="field-inline">
                <span className="sr-only">{t('customEndDate')}</span>
                <input
                  type="date"
                  value={profitRange.end}
                  onChange={e => setProfitRange(prev => ({ ...prev, end: e.target.value }))}
                  aria-label={t('customEndDate')}
                />
              </label>
            </div>
          )}

          <div className="summary-main-number">
            <span className="currency-symbol">฿</span>
            <strong className="tabular-number">
              {money(profitStats.currentProfitSatang, locale)}
            </strong>
          </div>

          <div className="summary-comparison">
            {profitStats.profitChangePct != null ? (
              <span
                className={
                  'trend-pill ' + (profitStats.profitChangePct >= 0 ? 'trend-up' : 'trend-down')
                }
              >
                {profitStats.profitChangePct >= 0 ? '↑ +' : '↓ '}
                {profitStats.profitChangePct}%
              </span>
            ) : null}
            <span className="comparison-caption">{t('vsPrevious')}</span>
          </div>
        </article>

        {/* Sales Card */}
        <article className="summary-card sales-card">
          <div className="summary-card-header">
            <div className="summary-card-title">
              <span className="summary-mark sales-mark" aria-hidden="true" />
              <h2>{t('salesCard')}</h2>
            </div>
            <div className="period-selector">
              <label htmlFor={salesPeriodId} className="sr-only">
                {t('salesCard')} {t('month')}
              </label>
              <select
                id={salesPeriodId}
                value={salesPeriod}
                onChange={e => setSalesPeriod(e.target.value as PeriodType)}
                className="period-select"
              >
                <option value="today">{t('today')}</option>
                <option value="week">{t('thisWeek')}</option>
                <option value="month">{t('thisMonth')}</option>
                <option value="custom">{t('customRange')}</option>
              </select>
            </div>
          </div>

          {salesPeriod === 'custom' && (
            <div className="custom-range-inputs">
              <label className="field-inline">
                <span className="sr-only">{t('customStartDate')}</span>
                <input
                  type="date"
                  value={salesRange.start}
                  onChange={e => setSalesRange(prev => ({ ...prev, start: e.target.value }))}
                  aria-label={t('customStartDate')}
                />
              </label>
              <span>—</span>
              <label className="field-inline">
                <span className="sr-only">{t('customEndDate')}</span>
                <input
                  type="date"
                  value={salesRange.end}
                  onChange={e => setSalesRange(prev => ({ ...prev, end: e.target.value }))}
                  aria-label={t('customEndDate')}
                />
              </label>
            </div>
          )}

          <div className="summary-main-number">
            <span className="currency-symbol">฿</span>
            <strong className="tabular-number">
              {money(salesStats.currentSalesSatang, locale)}
            </strong>
          </div>

          <div className="summary-comparison">
            {salesStats.salesChangePct != null ? (
              <span
                className={
                  'trend-pill ' + (salesStats.salesChangePct >= 0 ? 'trend-up' : 'trend-down')
                }
              >
                {salesStats.salesChangePct >= 0 ? '↑ +' : '↓ '}
                {salesStats.salesChangePct}%
              </span>
            ) : null}
            <span className="comparison-caption">{t('vsPrevious')}</span>
          </div>
        </article>
      </section>

      {/* Quick Action Cards */}
      <section className="quick-actions-row" aria-label="การทำงานด่วน">
        <button className="ask-card" onClick={() => navigate('assistant')}>
          <Icon name="assistant" />
          <span>
            <strong>{t('askDiscount')}</strong>
            <small>{t('assistant')}</small>
          </span>
          <Icon name="arrow" />
        </button>
        <button className="list-link quick-link" onClick={() => navigate('addProduct')}>
          <Icon name="plus" />
          <span>{t('addProduct')}</span>
          <Icon name="arrow" />
        </button>
        <button className="list-link quick-link" onClick={() => navigate('imports')}>
          <Icon name="upload" />
          <span>{t('imports')}</span>
          <Icon name="arrow" />
        </button>
      </section>

      {/* Recent Orders Section */}
      <section className="recent-orders-section">
        <div className="section-heading">
          <div>
            <h2>{t('recentOrders')}</h2>
            <p className="caption">{t('loadedOnly')}</p>
          </div>
          <button className="ghost view-all-link" onClick={() => navigate('orders')}>
            {t('allOrders')} →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <Empty title={t('noOrdersInPeriod')}>
            <button className="secondary" onClick={() => setProfitPeriod('month')}>
              {t('thisMonth')}
            </button>
          </Empty>
        ) : (
          <div className="orders-table-wrapper">
            <div className="recent-orders-list" role="list">
              {recentOrders.map((order, idx) => {
                const matchCalc = (data?.results ?? []).find(r => r.orderId === order.orderId);
                return (
                  <button
                    key={order.orderId + idx}
                    type="button"
                    className="order-row-item"
                    onClick={() => setSelected(matchCalc || order)}
                  >
                    <div className="order-col-id">
                      <strong className="order-id-text">{order.orderId}</strong>
                      <span className="order-product-text">{order.productName}</span>
                    </div>

                    <div className="order-col-channel">
                      <span className={`channel-badge channel-${order.platform.toLowerCase().replace(/\s+/g, '')}`}>
                        {order.platform}
                      </span>
                    </div>

                    <div className="order-col-time">
                      <time dateTime={order.orderAt}>{formatOrderTime(order.orderAt)}</time>
                    </div>

                    <div className="order-col-amount">
                      <strong className="order-amount-text">
                        <Money value={order.revenueSatang} />
                      </strong>
                      {order.profitSatang != null && (
                        <small className="order-profit-sub">
                          {t('profit')}: ฿{money(order.profitSatang, locale)}
                        </small>
                      )}
                    </div>

                    <div className="order-col-arrow" aria-hidden="true">
                      <Icon name="arrow" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
