'use client';
import { useState } from 'react';
import { useLanguage } from '../language';
import { money } from '../../lib/format';
import { financeDays, type Expense, type FinanceOrder } from '../../lib/finance-data';
import { ProfitAmount } from './profit-amount';
import s from './finance.module.css';

type Metric = 'profitSatang' | 'revenueSatang' | 'totalCostsSatang' | 'marginPct';
export default function FinanceChart({ orders, expenses }: { orders: FinanceOrder[]; expenses: Expense[] }) {
  const { locale } = useLanguage(), th = locale === 'th';
  const [mode, setMode] = useState('profit'), [selected, setSelected] = useState('');
  const days = financeDays(orders, expenses), active = days.find(d => d.day === selected) ?? days.at(-1);
  const names: Record<Metric, string> = { profitSatang: th ? 'กำไร' : 'Profit', revenueSatang: th ? 'ยอดขาย' : 'Sales', totalCostsSatang: th ? 'ค่าใช้จ่าย' : 'Costs', marginPct: th ? 'มาร์จิน' : 'Margin' };
  const metrics: Metric[] = mode === 'sales' ? ['revenueSatang', 'totalCostsSatang'] : mode === 'margin' ? ['marginPct'] : ['profitSatang'];
  const values = days.flatMap(d => metrics.map(k => d[k]).filter((v): v is number => v != null));
  const min = Math.min(0, ...values), max = Math.max(mode === 'margin' ? 1 : 100, ...values), span = max - min;
  const x = (i: number) => days.length === 1 ? 350 : 58 + i / (days.length - 1) * 584;
  const y = (value: number) => 210 - (value - min) / span * 180;
  const fmt = (value: number | null, metric: Metric) => value == null ? '—' : metric === 'marginPct' ? value.toFixed(1) + '%' : '฿' + money(value, locale);
  return <section className={s.panel} aria-labelledby="finance-trend-title">
    <div className={s.sectionHeading}><h2 id="finance-trend-title">{th ? 'เงินของร้านในแต่ละวัน' : 'Your money, day by day'}</h2><span className={s.muted}>{mode === 'margin' ? '%' : 'THB'}</span></div>
    <div className={s.segmented} role="group" aria-label={th ? 'ข้อมูลในกราฟ' : 'Chart metric'}>{[['profit', th ? 'กำไร' : 'Profit'], ['sales', th ? 'ยอดขาย vs ค่าใช้จ่าย' : 'Sales vs costs'], ['margin', th ? 'มาร์จิน %' : 'Margin %']].map(([key, label]) => <button className="secondary" key={key} aria-pressed={mode === key} onClick={() => setMode(key)}>{label}</button>)}</div>
    {!days.length ? <p className={s.chartEmpty}>{th ? 'ยังไม่มีรายการในช่วงนี้' : 'No entries in this period'}</p> : <>
      <svg viewBox="0 0 680 250" className={s.chart} role="img" aria-label={th ? 'แนวโน้มรายวัน ตัวเลขทั้งหมดอยู่ในตารางด้านล่าง' : 'Daily trend. All values are available in the table below.'}>
        {[0, 1, 2, 3].map(i => { const value = min + span * i / 3; return <g key={i}><line x1="58" x2="642" y1={y(value)} y2={y(value)} className={s.gridLine} /><text x="50" y={y(value) + 4} textAnchor="end">{new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(mode === 'margin' ? value : value / 100)}</text></g>; })}
        {metrics.map((metric, j) => { let continuous = false; return <g key={metric} className={j ? s.secondaryLine : s.mainLine}><path d={days.map((d, i) => { const value = d[metric]; if (value == null) { continuous = false; return ''; } const p = `${continuous ? 'L' : 'M'} ${x(i)} ${y(value)}`; continuous = true; return p; }).join(' ')} />{days.map((d, i) => d[metric] != null && <circle key={d.day} cx={x(i)} cy={y(d[metric]!)} r="3"><title>{d.day} · {names[metric]} {fmt(d[metric], metric)}</title></circle>)}</g>; })}
        {days.map((d, i) => <g key={d.day} onMouseEnter={() => setSelected(d.day)}><rect x={x(i) - Math.max(5, 292 / days.length)} y="15" width={Math.max(10, 584 / days.length)} height="200" fill="transparent"><title>{d.day}: {metrics.map(k => `${names[k]} ${fmt(d[k], k)}`).join(' · ')}</title></rect>{(i === 0 || i === days.length - 1 || i === Math.floor(days.length / 2)) && <text x={x(i)} y="240" textAnchor="middle">{d.day.slice(5)}</text>}</g>)}
      </svg>
      <div className={s.chartReadout}><label>{th ? 'วันที่' : 'Date'}<select value={active?.day} onChange={e => setSelected(e.target.value)}>{days.map(d => <option key={d.day}>{d.day}</option>)}</select></label>{metrics.map((metric, i) => <div key={metric}><small>{i > 0 ? '– – ' : '━━ '}{names[metric]}</small><strong>{metric === 'profitSatang' ? <ProfitAmount value={active?.profitSatang} /> : fmt(active?.[metric] ?? null, metric)}</strong></div>)}</div>
      <details className={s.details}><summary>{th ? 'ดูตารางตัวเลขรายวัน' : 'View daily data table'}</summary><div className={s.tableScroll} tabIndex={0} role="region" aria-label={th ? 'ตารางรายวัน' : 'Daily table'}><table><caption>{th ? 'ยอดตามวันที่มีรายการ · วันที่ข้อมูลไม่ครบแสดง —' : 'Dates with entries · Incomplete values are shown as —'}</caption><thead><tr><th>{th ? 'วันที่' : 'Date'}</th>{Object.values(names).map(n => <th key={n}>{n}</th>)}</tr></thead><tbody>{days.map(d => <tr key={d.day}><th>{d.day}</th>{(Object.keys(names) as Metric[]).map(k => <td key={k}>{fmt(d[k], k)}</td>)}</tr>)}</tbody></table></div></details>
    </>}
  </section>;
}
