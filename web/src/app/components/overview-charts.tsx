'use client';
import { useState, type ReactNode } from 'react';
import { useLanguage } from '../language';
import { dailySummaries, channelSummaries, type OverviewOrder } from '../../lib/overview-data';
import { baht, profitParts } from '../../lib/signed-money';
import { chartLayout } from '../../lib/chart-axis';
import { Money } from './ledger';
import { ProfitAmount } from './profit-amount';
import { SeriesMark, SeriesSwatch, useChartWidth } from './chart-marks';
import { channelColorClass } from '../../lib/chart-roles';

/** 2px surface-coloured gap between donut segments, in pathLength (100) units of the r=76 ring. */
const DONUT_GAP = 2 / (2 * Math.PI * 76) * 100;

/** Daily sales and profit/loss line chart with a date readout and the full values table (C8). */
export function OverviewCharts({ orders }: { orders: OverviewOrder[] }) {
  const { locale, t } = useLanguage();
  const th = locale === 'th';
  const days = dailySummaries(orders);
  const [selectedDay, selectDay] = useState('');
  const [svgRef, chartWidth] = useChartWidth(720);
  const active = days.find(day => day.day === selectedDay) ?? days.at(-1);
  // The axis is in baht; the drawing is 1 user unit = 1 CSS px (lib/chart-axis), so 12px labels render at 12px.
  const values = days.flatMap(day => [day.revenueSatang, ...(day.profitSatang == null ? [] : [day.profitSatang])]).map(v => v / 100);
  const layout = chartLayout({ width: chartWidth, height: chartWidth < 480 ? 220 : 270, min: Math.min(0, ...values), max: Math.max(1, ...values), count: days.length, xLabelSample: '00/00', locale });
  const x = layout.x, y = (satang: number) => layout.y(satang / 100), plotEnd = layout.width - layout.right;
  const path = (key: 'revenueSatang' | 'profitSatang') => {
    let continuous = false;
    return days.map((day, i) => { const v = day[key]; if (v == null) { continuous = false; return ''; } const point = `${continuous ? 'L' : 'M'}${x(i)},${y(v)}`; continuous = true; return point; }).join(' ');
  };
  return <div className="dashboard-charts">
    <section className="performance-panel">
      <div className="chart-heading"><div><span className="eyebrow">{th ? 'ร้านของคุณในช่วงนี้' : 'Your store this period'}</span><h2>{th ? 'ยอดขายและกำไร' : 'Sales & profit'}</h2></div><span className="chart-unit">{th ? 'บาท · รายวัน' : 'THB · Daily'}</span></div>
      <div className="chart-legend"><span><SeriesSwatch series="revenue" />{t('salesCard')}</span><span><SeriesSwatch series="profit" />{t('netProfitLoss')}</span></div>
      {!days.length ? <p className="chart-empty">{t('noOrdersInPeriod')}</p> : <>
        <svg ref={svgRef} className="sales-chart" viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label={th ? 'กราฟยอดขายและกำไรรายวัน ดูตัวเลขครบได้ในตารางด้านล่าง' : 'Daily sales and profit; exact values in the table below'}>
          {layout.ticks.map(tick => <g key={tick.value}><line x1={layout.left} x2={plotEnd} y1={layout.y(tick.value)} y2={layout.y(tick.value)} className="chart-grid" /><text x={layout.left - 8} y={layout.y(tick.value) + 4} textAnchor="end" className="chart-axis">{tick.label}</text></g>)}
          {layout.lo < 0 && <line x1={layout.left} x2={plotEnd} y1={layout.y(0)} y2={layout.y(0)} className="chart-zero" />}
          <path d={path('revenueSatang')} className="series-line series-revenue" /><path d={path('profitSatang')} className="series-line series-profit" />
          {days.map((day, i) => <g key={day.day}>
            <SeriesMark series="revenue" x={x(i)} y={y(day.revenueSatang)}><title>{day.day} · {t('salesCard')}: {baht(day.revenueSatang, locale)}</title></SeriesMark>
            {day.profitSatang != null && <SeriesMark series="profit" x={x(i)} y={y(day.profitSatang)} loss={day.profitSatang < 0}><title>{day.day} · {t('netProfitLoss')}: {profitParts(day.profitSatang, locale).text}</title></SeriesMark>}
            {layout.labels.includes(i) && <text x={x(i)} y={layout.xLabelY} textAnchor="middle" className="chart-axis">{day.day.slice(8)}/{day.day.slice(5, 7)}</text>}
          </g>)}
        </svg>
        <div className="chart-readout"><label>{th ? 'ดูวันที่' : 'View date'}<select value={active?.day} onChange={e => selectDay(e.target.value)}>{days.map(day => <option key={day.day}>{day.day}</option>)}</select></label><div><small>{t('salesCard')}</small><strong><Money value={active?.revenueSatang} /></strong></div><div><small>{t('netProfitLoss')}</small><strong><ProfitAmount value={active?.profitSatang} /></strong></div></div>
        <details className="chart-data"><summary>{th ? 'ดูตัวเลขทั้งหมด' : 'View all values'}</summary><div className="table-scroll"><table><thead><tr><th>{th ? 'วันที่' : 'Date'}</th><th>{t('salesCard')}</th><th>{t('netProfitLoss')}</th></tr></thead><tbody>{days.map(day => <tr key={day.day}><th>{day.day}</th><td><Money value={day.revenueSatang} /></td><td><ProfitAmount value={day.profitSatang} /></td></tr>)}</tbody></table></div></details>
      </>}
      <p className="caption chart-note">{t('loadedOnly')} · {days.length === 1 && (th ? 'มีข้อมูล 1 วัน จึงแสดงเป็นจุด · ' : 'One recorded day is shown as points · ')}{th ? 'วันที่ข้อมูลไม่ครบจะแสดงกำไรเป็น — และเว้นเส้นกราฟ' : 'Incomplete days show no profit value and a gap in the line.'}</p>
    </section>
  </div>;
}

/** Sales share by channel (donut + labelled list). `children` renders inside the same card, after the list. */
export function ChannelPanel({ orders, children }: { orders: OverviewOrder[]; children?: ReactNode }) {
  const { locale, t } = useLanguage();
  const th = locale === 'th';
  const channels = channelSummaries(orders).filter(row => row.totalOrders);
  const total = channels.reduce((sum, row) => sum + row.revenueSatang, 0);
  const canShare = total > 0 && channels.every(row => row.revenueSatang >= 0);
  let offset = 0;
  return <section className="channel-panel" aria-labelledby="overview-channel-title"><span className="eyebrow">{th ? 'ช่องทางขาย' : 'Sales channels'}</span><h2 id="overview-channel-title">{th ? 'ยอดขายมาจากไหน' : 'Where sales come from'}</h2>
    {canShare && <div className="channel-donut"><svg viewBox="0 0 200 200" role="img" aria-label={th ? 'สัดส่วนยอดขายตามช่องทาง ดูตัวเลขในรายการด้านล่าง' : 'Sales share by channel; values listed below'}><circle cx="100" cy="100" r="76" className="donut-track" />{channels.map(row => { const share = row.revenueSatang / total * 100; const start = offset; offset += share; const visible = channels.length > 1 ? Math.max(share - DONUT_GAP, 0) : share; return <circle key={row.platform} cx="100" cy="100" r="76" pathLength="100" fill="none" strokeWidth="18" className={channelColorClass(row.platform)} strokeDasharray={`${visible} ${100 - visible}`} strokeDashoffset={-start} transform="rotate(-90 100 100)" />; })}</svg><div><small>{t('salesCard')}</small><strong><Money value={total} /></strong></div></div>}
    {!channels.length ? <p className="chart-empty">{t('noOrdersInPeriod')}</p> : <ul className="channel-key">{channels.map(row => <li key={row.platform}><span><i className={channelColorClass(row.platform)} />{row.platform}<small>{row.totalOrders} {t('orders')}</small></span><strong><Money value={row.revenueSatang} />{canShare && <small>{new Intl.NumberFormat(th ? 'th-TH' : 'en-GB', { maximumFractionDigits: 1 }).format(row.revenueSatang / total * 100)}%</small>}</strong></li>)}</ul>}
    {!canShare && channels.length > 0 && <p className="caption">{th ? 'แสดงยอดตามบันทึก ไม่แปลงยอดติดลบหรือยอดรวมศูนย์เป็นสัดส่วน' : 'Recorded signed amounts are listed without a percentage for negative or zero totals.'}</p>}
    {children}
  </section>;
}
