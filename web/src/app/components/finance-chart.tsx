'use client';
import { useState } from 'react';
import { useLanguage } from '../language';
import { baht, percent, profitParts } from '../../lib/signed-money';
import { chartLayout } from '../../lib/chart-axis';
import { financeDays, type Expense, type FinanceOrder } from '../../lib/finance-data';
import { ProfitAmount } from './profit-amount';
import { SeriesMark, SeriesSwatch, useChartWidth, type Series } from './chart-marks';
import s from './finance.module.css';

type Metric = 'profitSatang' | 'revenueSatang' | 'totalCostsSatang' | 'marginPct';
/** Margin is profit relative to sales, so it draws as the profit series. */
const SERIES: Record<Metric, Series> = { profitSatang: 'profit', revenueSatang: 'revenue', totalCostsSatang: 'cost', marginPct: 'profit' };
export default function FinanceChart({ orders, expenses }: { orders: FinanceOrder[]; expenses: Expense[] }) {
  const { locale } = useLanguage(), th = locale === 'th';
  const [mode, setMode] = useState('profit'), [selected, setSelected] = useState('');
  const [svgRef, chartWidth] = useChartWidth(680);
  const days = financeDays(orders, expenses), active = days.find(d => d.day === selected) ?? days.at(-1), activeIndex = active ? days.indexOf(active) : -1;
  const names: Record<Metric, string> = { profitSatang: th ? 'กำไร/ขาดทุน' : 'Profit / loss', revenueSatang: th ? 'ยอดขาย' : 'Sales', totalCostsSatang: th ? 'ค่าใช้จ่าย' : 'Costs', marginPct: th ? 'มาร์จิน' : 'Margin' };
  const metrics: Metric[] = mode === 'sales' ? ['revenueSatang', 'totalCostsSatang'] : mode === 'margin' ? ['marginPct'] : ['profitSatang'];
  // Axis in baht (or percent for margin); the drawing is 1 user unit = 1 CSS px (lib/chart-axis), so 12px labels render at 12px.
  const unit = mode === 'margin' ? 1 : 100;
  const values = days.flatMap(d => metrics.map(k => d[k]).filter((v): v is number => v != null)).map(v => v / unit);
  const layout = chartLayout({ width: chartWidth, height: chartWidth < 480 ? 220 : 250, min: Math.min(0, ...values), max: Math.max(1, ...values), count: days.length, xLabelSample: '00-00', locale });
  const x = layout.x, y = (value: number) => layout.y(value / unit), plotEnd = layout.width - layout.right, band = layout.plotWidth / Math.max(days.length, 1);
  // Display only (lib/signed-money): profit carries its label, money and a margin level a true minus sign (no "+" on a level).
  const fmt = (value: number | null, metric: Metric) => metric === 'marginPct' ? percent(value, locale) : metric === 'profitSatang' ? profitParts(value, locale).text : baht(value, locale);
  return <section className={s.panel} aria-labelledby="finance-trend-title">
    <div className={s.sectionHeading}><h2 id="finance-trend-title">{th ? 'เงินของร้านในแต่ละวัน' : 'Your money, day by day'}</h2><span className={s.muted}>{mode === 'margin' ? '%' : 'THB'}</span></div>
    <div className={s.segmented} role="group" aria-label={th ? 'ข้อมูลในกราฟ' : 'Chart metric'}>{[['profit', th ? 'กำไร' : 'Profit'], ['sales', th ? 'ยอดขาย vs ค่าใช้จ่าย' : 'Sales vs costs'], ['margin', th ? 'มาร์จิน %' : 'Margin %']].map(([key, label]) => <button className="secondary" key={key} aria-pressed={mode === key} onClick={() => setMode(key)}>{label}</button>)}</div>
    {!days.length ? <p className={s.chartEmpty}>{th ? 'ยังไม่มีรายการในช่วงนี้' : 'No entries in this period'}</p> : <>
      <svg ref={svgRef} viewBox={`0 0 ${layout.width} ${layout.height}`} className={s.chart} role="img" aria-label={th ? 'แนวโน้มรายวัน ตัวเลขทั้งหมดอยู่ในตารางด้านล่าง' : 'Daily trend. All values are available in the table below.'}>
        {layout.ticks.map(tick => <g key={tick.value}><line x1={layout.left} x2={plotEnd} y1={layout.y(tick.value)} y2={layout.y(tick.value)} className={s.gridLine} /><text x={layout.left - 8} y={layout.y(tick.value) + 4} textAnchor="end">{tick.label}</text></g>)}
        {layout.lo < 0 && <line x1={layout.left} x2={plotEnd} y1={layout.y(0)} y2={layout.y(0)} className="chart-zero" />}
        {metrics.map(metric => { let continuous = false; return <g key={metric}><path className={`series-line series-${SERIES[metric]}`} d={days.map((d, i) => { const value = d[metric]; if (value == null) { continuous = false; return ''; } const p = `${continuous ? 'L' : 'M'} ${x(i)} ${y(value)}`; continuous = true; return p; }).join(' ')} />{days.map((d, i) => d[metric] != null && <SeriesMark key={d.day} series={SERIES[metric]} x={x(i)} y={y(d[metric]!)} loss={SERIES[metric] === 'profit' && d[metric]! < 0}><title>{d.day} · {names[metric]}: {fmt(d[metric], metric)}</title></SeriesMark>)}</g>; })}
        {active?.[metrics[0]] != null && <circle cx={x(activeIndex)} cy={y(active[metrics[0]]!)} r="8" className="chart-highlight-ring" aria-hidden="true" />}
        {days.map((d, i) => <g key={d.day} onMouseEnter={() => setSelected(d.day)}><rect x={x(i) - Math.max(5, band / 2)} y={layout.top} width={Math.max(10, band)} height={layout.plotHeight} fill="transparent"><title>{d.day}: {metrics.map(k => `${names[k]}: ${fmt(d[k], k)}`).join(' · ')}</title></rect>{layout.labels.includes(i) && <text x={x(i)} y={layout.xLabelY} textAnchor="middle">{d.day.slice(5)}</text>}</g>)}
      </svg>
      <div className={s.chartReadout}><label>{th ? 'วันที่' : 'Date'}<select value={active?.day} onChange={e => setSelected(e.target.value)}>{days.map(d => <option key={d.day}>{d.day}</option>)}</select></label>{metrics.map(metric => <div key={metric}><small><SeriesSwatch series={SERIES[metric]} />{names[metric]}</small><strong>{metric === 'profitSatang' ? <ProfitAmount value={active?.profitSatang} /> : fmt(active?.[metric] ?? null, metric)}</strong></div>)}</div>
      <details className={s.details}><summary>{th ? 'ดูตารางตัวเลขรายวัน' : 'View daily data table'}</summary><div className={s.tableScroll} tabIndex={0} role="region" aria-label={th ? 'ตารางรายวัน' : 'Daily table'}><table><caption>{th ? 'ยอดตามวันที่มีรายการ · วันที่ข้อมูลไม่ครบแสดง —' : 'Dates with entries · Incomplete values are shown as —'}</caption><thead><tr><th>{th ? 'วันที่' : 'Date'}</th>{Object.values(names).map(n => <th key={n}>{n}</th>)}</tr></thead><tbody>{days.map(d => <tr key={d.day}><th>{d.day}</th>{(Object.keys(names) as Metric[]).map(k => <td key={k}>{k === 'profitSatang' ? <ProfitAmount value={d[k]} /> : fmt(d[k], k)}</td>)}</tr>)}</tbody></table></div></details>
    </>}
  </section>;
}
