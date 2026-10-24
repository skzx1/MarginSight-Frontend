'use client';
import { useState } from 'react';
import { useLanguage } from '../language';
import { dailySummaries, channelSummaries, type OverviewOrder } from '../../lib/overview-data';
import { money } from '../../lib/format';
import { Money } from './ledger';
import { ProfitAmount } from './profit-amount';

/** 2px surface-coloured gap between donut segments, in pathLength (100) units of the r=76 ring. */
const DONUT_GAP = 2 / (2 * Math.PI * 76) * 100;

export function OverviewCharts({ orders }: { orders: OverviewOrder[] }) {
  const { locale, t } = useLanguage();
  const th = locale === 'th';
  const days = dailySummaries(orders);
  const [selectedDay, selectDay] = useState('');
  const active = days.find(day => day.day === selectedDay) ?? days.at(-1);
  const channels = channelSummaries(orders).filter(row => row.totalOrders);
  const total = channels.reduce((sum, row) => sum + row.revenueSatang, 0);
  const canShare = total > 0 && channels.every(row => row.revenueSatang >= 0);
  const values = days.flatMap(day => [day.revenueSatang, ...(day.profitSatang == null ? [] : [day.profitSatang])]);
  const min = Math.min(0, ...values), max = Math.max(100, ...values);
  const x = (i: number) => days.length === 1 ? 370 : 64 + i / (days.length - 1) * 616;
  const y = (v: number) => 222 - (v - min) / (max - min) * 184;
  const path = (key: 'revenueSatang' | 'profitSatang') => {
    let continuous = false;
    return days.map((day, i) => { const v = day[key]; if (v == null) { continuous = false; return ''; } const point = `${continuous ? 'L' : 'M'}${x(i)},${y(v)}`; continuous = true; return point; }).join(' ');
  };
  let offset = 0;
  return <div className="dashboard-charts">
    <section className="performance-panel">
      <div className="chart-heading"><div><span className="eyebrow">{th ? 'ร้านของคุณในช่วงนี้' : 'Your store this period'}</span><h2>{th ? 'ยอดขายและกำไร' : 'Sales & profit'}</h2></div><span className="chart-unit">{th ? 'บาท · รายวัน' : 'THB · Daily'}</span></div>
      <div className="chart-legend"><span><i className="sales-dot" />{t('salesCard')}</span><span><i className="profit-dot" />{t('profitCard')}</span></div>
      {!days.length ? <p className="chart-empty">{t('noOrdersInPeriod')}</p> : <>
        <svg className="sales-chart" viewBox="0 0 720 270" role="img" aria-label={th ? 'กราฟยอดขายและกำไรรายวัน ดูตัวเลขครบได้ในตารางด้านล่าง' : 'Daily sales and profit; exact values in the table below'}>
          {[0, 1, 2, 3, 4].map(i => { const value = min + (max - min) * i / 4; return <g key={i}><line x1="64" x2="680" y1={y(value)} y2={y(value)} className="chart-grid" /><text x="54" y={y(value) + 4} textAnchor="end" className="chart-axis">{new Intl.NumberFormat(th ? 'th-TH' : 'en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(value / 100)}</text></g>; })}
          <path d={path('revenueSatang')} className="sales-line" /><path d={path('profitSatang')} className="profit-line" />
          {days.map((day, i) => <g key={day.day}>
            <circle cx={x(i)} cy={y(day.revenueSatang)} r="4" className="sales-point"><title>{day.day}: {money(day.revenueSatang, locale)} THB</title></circle>
            {day.profitSatang != null && <circle cx={x(i)} cy={y(day.profitSatang)} r="4" className="profit-point"><title>{day.day}: {money(day.profitSatang, locale)} THB</title></circle>}
            {(i === 0 || i === days.length - 1 || (days.length > 4 && i === Math.floor(days.length / 2))) && <text x={x(i)} y="252" textAnchor="middle" className="chart-axis">{day.day.slice(8)}/{day.day.slice(5, 7)}</text>}
          </g>)}
        </svg>
        <div className="chart-readout"><label>{th ? 'ดูวันที่' : 'View date'}<select value={active?.day} onChange={e => selectDay(e.target.value)}>{days.map(day => <option key={day.day}>{day.day}</option>)}</select></label><div><small>{t('salesCard')}</small><strong><Money value={active?.revenueSatang} /></strong></div><div><small>{t('profitCard')}</small><strong><ProfitAmount value={active?.profitSatang} /></strong></div></div>
        <details className="chart-data"><summary>{th ? 'ดูตัวเลขทั้งหมด' : 'View all values'}</summary><div className="table-scroll"><table><thead><tr><th>{th ? 'วันที่' : 'Date'}</th><th>{t('salesCard')}</th><th>{t('profitCard')}</th></tr></thead><tbody>{days.map(day => <tr key={day.day}><th>{day.day}</th><td><Money value={day.revenueSatang} /></td><td><ProfitAmount value={day.profitSatang} /></td></tr>)}</tbody></table></div></details>
      </>}
      <p className="caption chart-note">{t('loadedOnly')} · {days.length === 1 && (th ? 'มีข้อมูล 1 วัน จึงแสดงเป็นจุด · ' : 'One recorded day is shown as points · ')}{th ? 'วันที่ข้อมูลไม่ครบจะแสดงกำไรเป็น — และเว้นเส้นกราฟ' : 'Incomplete days show no profit value and a gap in the line.'}</p>
    </section>
    <section className="channel-panel"><span className="eyebrow">{th ? 'ช่องทางขาย' : 'Sales channels'}</span><h2>{th ? 'ยอดขายมาจากไหน' : 'Where sales come from'}</h2>
      {canShare && <div className="channel-donut"><svg viewBox="0 0 200 200" role="img" aria-label={th ? 'สัดส่วนยอดขายตามช่องทาง ดูตัวเลขในรายการด้านล่าง' : 'Sales share by channel; values listed below'}><circle cx="100" cy="100" r="76" className="donut-track" />{channels.map((row, i) => { const share = row.revenueSatang / total * 100; const start = offset; offset += share; const visible = channels.length > 1 ? Math.max(share - DONUT_GAP, 0) : share; return <circle key={row.platform} cx="100" cy="100" r="76" pathLength="100" fill="none" strokeWidth="18" className={`channel-color-${i % 5}`} strokeDasharray={`${visible} ${100 - visible}`} strokeDashoffset={-start} transform="rotate(-90 100 100)" />; })}</svg><div><small>{t('salesCard')}</small><strong><Money value={total} /></strong></div></div>}
      {!channels.length ? <p className="chart-empty">{t('noOrdersInPeriod')}</p> : <ul className="channel-key">{channels.map((row, i) => <li key={row.platform}><span><i className={`channel-color-${i % 5}`} />{row.platform}<small>{row.totalOrders} {t('orders')}</small></span><strong><Money value={row.revenueSatang} />{canShare && <small>{new Intl.NumberFormat(th ? 'th-TH' : 'en-GB', { maximumFractionDigits: 1 }).format(row.revenueSatang / total * 100)}%</small>}</strong></li>)}</ul>}
      {!canShare && channels.length > 0 && <p className="caption">{th ? 'แสดงยอดตามบันทึก ไม่แปลงยอดติดลบหรือยอดรวมศูนย์เป็นสัดส่วน' : 'Recorded signed amounts are listed without a percentage for negative or zero totals.'}</p>}
    </section>
  </div>;
}
