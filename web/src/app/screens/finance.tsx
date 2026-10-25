'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeatureProps, Screen } from '../../lib/types';
import { bangkokDate, money, parseBaht } from '../../lib/format';
import { periodBounds, type OverviewPeriod } from '../../lib/overview-data';
import { useOverviewDashboard } from '../../lib/use-overview-dashboard';
import type {DashboardCoverage} from '../../lib/dashboard-coverage';
import { settingsStorageKey } from '../../lib/store-settings';
import { FINANCE_CHANNELS, expenseCategories, financeCsv, financeDays, financeTotals, fromCalculation, previousPeriod, readExpenses, selectFinance, type Expense, type ExpenseCategory, type FinanceOrder } from '../../lib/finance-data';
import { useLanguage } from '../language';
import { Empty, ErrorNotice } from '../components/forms';
import { ScreenActions } from '../components/shell';
import FinanceChart from '../components/finance-chart';
import { Icon } from '../ui';
import { Delta } from '../components/delta';
import { baht, percent, profitParts } from '../../lib/signed-money';
import s from '../components/finance.module.css';

type Props = FeatureProps & { period: OverviewPeriod; onPeriodChange: (period: OverviewPeriod) => void; navigate: (screen: Screen) => void; onMissingCosts: () => void };
type Resource = { orders: FinanceOrder[]; coverage?:DashboardCoverage; loading: boolean; error?: unknown; retry: () => void };
export default function Finance(props: Props) {
  return props.origin === 'MOCK' ? <MockFinance {...props} /> : <LiveFinance {...props} />;
}
function MockFinance(props: Props) {
  const [attempt, retry] = useState(0), [state, setState] = useState<Resource>({ orders: [], loading: true, retry: () => {} });
  const today = bangkokDate();
  useEffect(() => { let active = true; setState({ orders: [], loading: true, retry: () => {} });
    void import('../../lib/finance-mock').then(({ financeMock }) => { if (active) setState({ orders: financeMock(today), loading: false, retry: () => {} }); }).catch(error => { if (active) setState({ orders: [], loading: false, error, retry: () => {} }); });
    return () => { active = false; };
  }, [today, attempt]);
  return <FinanceView {...props} resource={{ ...state, retry: () => retry(n => n + 1) }} />;
}
function LiveFinance(props: Props) {
  const today = bangkokDate(), bounds = periodBounds(props.period, today), previous = previousPeriod(props.period, today);
  const requested = previous && bounds ? { type: 'custom' as const, start: previous.start, end: bounds.end } : props.period;
  const resource = useOverviewDashboard(props.base, requested, today, props.origin);
  const orders = useMemo(() => (resource.data?.results ?? []).map(fromCalculation), [resource.data]);
  return <FinanceView {...props} resource={{ orders, coverage:resource.coverage, loading: resource.loading, error: resource.error, retry: resource.reload }} />;
}

function Sparkline({ values, label }: { values: (number | null)[]; label: string }) {
  const known = values.filter((n): n is number => n != null), min = Math.min(0, ...known), max = Math.max(1, ...known);
  let connected = false;
  if (known.length < 2) return <small>{label}</small>;
  return <svg className={s.spark} viewBox="0 0 160 24" role="img" aria-label={label}><path d={values.map((v, i) => { if (v == null) { connected = false; return ''; } const point = `${connected ? 'L' : 'M'}${i / Math.max(1, values.length - 1) * 160},${22 - (v - min) / (max - min) * 20}`; connected = true; return point; }).join(' ')} /></svg>;
}

function ProfitValue({ value, locale }: { value: number | null; locale: string }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (value == null || matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    let frame = 0; const start = performance.now();
    const tick = (now: number) => { const progress = Math.min(1, (now - start) / 380); setShown(Math.round(value * (1 - (1 - progress) ** 3))); if (progress < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [value]);
  // Label and sign follow the final value, so they do not flip while the number animates.
  const parts = profitParts(value, locale), prefix = parts.text.slice(0, parts.text.indexOf('฿'));
  return <><span aria-hidden="true">{shown == null || parts.kind === 'missing' ? '—' : prefix + '฿' + money(Math.abs(shown), locale)}</span><span className="sr-only">{parts.spoken}</span></>;
}

function FinanceView({ resource, base, origin, period, onPeriodChange, navigate, onMissingCosts }: Props & { resource: Resource }) {
  const { locale, t } = useLanguage(), th = locale === 'th', mock = origin === 'MOCK', today = bangkokDate();
  const text = (thai: string, english: string) => th ? thai : english;
  // Display only (lib/signed-money): a true minus sign before ฿ (−฿11,390.00); values are unchanged.
  const cash = (v: number | null) => baht(v, locale);
  const profitCash = (v: number | null) => profitParts(v, locale).text;
  const pct = (v: number | null) => percent(v, locale);
  // A margin is a level, not a change: no "+" (only a negative margin carries a sign).
  const margin = (v: number | null) => percent(v, locale);
  const channelName = (name: string) => name === 'TikTok' ? 'TikTok Shop' : name === 'In-store' ? text('หน้าร้าน', 'In-store') : name;
  const categoryNames: Record<ExpenseCategory, string> = { product: text('ต้นทุนสินค้า', 'Product costs'), fees: text('ค่าธรรมเนียมแพลตฟอร์ม', 'Platform fees'), shipping: text('ค่าขนส่ง', 'Shipping'), ads: text('ค่าโฆษณา', 'Advertising'), other: text('ค่าใช้จ่ายอื่น', 'Other expenses') };
  const statusNames: Record<string, string> = { COMPLETED: text('สำเร็จ', 'Completed'), PENDING: text('รอดำเนินการ', 'Pending'), CANCELLED: text('ยกเลิก', 'Cancelled'), RETURNED: text('คืนสินค้า', 'Returned'), UNKNOWN: text('ยังไม่มีสถานะจากระบบ', 'Status unavailable') };
  const [channel, setChannel] = useState('all'), [compare, setCompare] = useState(false);
  const [search, setSearch] = useState(''), [status, setStatus] = useState('all'), [limit, setLimit] = useState(10);
  const [expenses, setExpenses] = useState<Expense[]>([]), [storageKey, setStorageKey] = useState(''), [storageReady, setStorageReady] = useState(!mock), [storageError, setStorageError] = useState(false);
  const [showForm, setShowForm] = useState(false), [category, setCategory] = useState<ExpenseCategory>('other'), [amount, setAmount] = useState(''), [date, setDate] = useState(today), [note, setNote] = useState(''), [expenseChannel, setExpenseChannel] = useState<string>('In-store');
  const [formError, setFormError] = useState(''), [saved, setSaved] = useState(false);
  const expenseInput = useRef<HTMLInputElement>(null), addButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!mock) return; let active = true;
    void settingsStorageKey(base).then(key => { if (!active) return; const scoped = key.replace('store-settings', 'finance-expenses'); setStorageKey(scoped); try { setExpenses(readExpenses(localStorage.getItem(scoped))); } catch { setStorageError(true); } }).catch(() => { if (active) setStorageError(true); }).finally(() => { if (active) setStorageReady(true); });
    return () => { active = false; };
  }, [base, mock]);
  useEffect(() => { setLimit(10); }, [channel, period.type, period.start, period.end, search, status]);
  useEffect(() => { if (showForm) expenseInput.current?.focus(); }, [showForm]);
  useEffect(() => { if (!saved) return; const timer = setTimeout(() => setSaved(false), 4000); return () => clearTimeout(timer); }, [saved]);
  const bounds = periodBounds(period, today), previous = previousPeriod(period, today);
  const sampleStart = new Date(Date.parse(today) - 61 * 86400000).toISOString().slice(0, 10);
  const previousCovered = !mock ? !resource.coverage?.partial : !!previous && previous.start >= sampleStart && previous.end <= today;
  const current = selectFinance(resource.orders, expenses, period, today, channel);
  const prior = previous ? selectFinance(resource.orders, expenses, previous, today, channel) : { orders: [], expenses: [] };
  const totals = financeTotals(current.orders, current.expenses), old = financeTotals(prior.orders, prior.expenses), days = financeDays(current.orders, current.expenses);
  const estimated = totals.completeOrders !== totals.totalOrders;
  const channels = [...new Set([...FINANCE_CHANNELS, ...resource.orders.map(o => o.platform)])].filter(c => channel === 'all' || channel === c).map(platform => ({ platform, ...financeTotals(current.orders.filter(o => o.platform === platform), current.expenses.filter(e => e.channel === platform)) }));
  const best = channels.filter(c => c.marginPct != null).sort((a, b) => b.marginPct! - a.marginPct!)[0];
  const matches = current.orders.filter(o => (status === 'all' || o.commerceStatus === status) && `${o.orderId} ${o.productName}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).sort((a, b) => b.orderAt.localeCompare(a.orderAt));
  const productMap = new Map<string, { sku: string; name: string; profitSatang: number | null }>();
  current.orders.flatMap(o => o.productProfits).forEach(p => { const previous = productMap.get(p.sku); productMap.set(p.sku, { ...p, profitSatang: p.profitSatang == null || previous?.profitSatang === null ? null : (previous?.profitSatang ?? 0) + p.profitSatang }); });
  const products = [...productMap.values()].filter(p => p.profitSatang != null).sort((a, b) => b.profitSatang! - a.profitSatang!);
  const pnl: [string, number | null, string][] = [
    [text('ยอดขายก่อนหัก', 'Gross sales'), totals.grossSatang, ''],
    [text('ส่วนลด / คืนสินค้า', 'Discounts / returns'), totals.reductionsSatang == null ? null : -totals.reductionsSatang, ''],
    [text('ยอดขายสุทธิ', 'Net sales'), totals.revenueSatang, s.subtotal],
    ...expenseCategories.map(key => [categoryNames[key], totals.categories[key] == null ? null : -totals.categories[key]!, ''] as [string, number | null, string]),
    [t('netProfitLoss'), totals.profitSatang, s.net + (totals.profitSatang != null && totals.profitSatang < 0 ? ' ' + s.negative : '')]
  ];
  const kpis = [
    { label: text('ยอดขายรวม', 'Total sales'), key: 'revenueSatang' as const },
    { label: t('netProfitLoss'), key: 'profitSatang' as const },
    { label: text('อัตรากำไรสุทธิ', 'Net margin'), key: 'marginPct' as const },
    { label: text('จำนวนออเดอร์', 'Orders'), key: 'totalOrders' as const },
    { label: text('ยอดเฉลี่ยต่อออเดอร์', 'Average order value'), key: 'averageSatang' as const },
    { label: text('ต้นทุนและค่าใช้จ่ายรวม', 'Total costs & expenses'), key: 'totalCostsSatang' as const }
  ];
  const delta = (key: typeof kpis[number]['key']) => { const value = totals[key], before = old[key];
    if (!previousCovered || !prior.orders.length || value == null || before == null || before === 0) return null;
    return key === 'marginPct' ? value - before : (value - before) / Math.abs(before) * 100;
  };
  const exportReport = () => {
    const rows: (string | number | null)[][] = [['MarginShot', text('รายงานการเงิน', 'Finance report'), origin], ['Period', bounds?.start ?? '', bounds?.end ?? ''], ['Channel', channel === 'all' ? text('ทุกช่องทาง', 'All channels') : channelName(channel)], ['Currency', 'THB'], ['Scope', text('เฉพาะรายการที่บันทึก ค่าใช้จ่ายเพิ่มเติมอยู่ในเบราว์เซอร์', 'Recorded entries only; added expenses are local')], [], ['Metric', 'Value (THB, percent, or count)']];
    if(resource.coverage?.partial)rows.splice(5,0,['INCOMPLETE_API_COVERAGE',resource.coverage.loaded,resource.coverage.total,'Loaded orders only; monthly counts include the requested comparison months. Not whole-store totals.']);
    kpis.forEach(k => rows.push([k.label, totals[k.key] == null ? null : ['totalOrders', 'marginPct'].includes(k.key) ? totals[k.key] : totals[k.key]! / 100]));
    rows.push([], ['Profit & loss', 'THB']); pnl.forEach(([label, value]) => rows.push([label, value == null ? null : value / 100]));
    rows.push([], ['Channel', 'Net sales THB', 'Orders', 'Fees THB', 'Net profit THB', 'Margin %']); channels.forEach(c => rows.push([channelName(c.platform), c.revenueSatang / 100, c.totalOrders, c.categories.fees == null ? null : c.categories.fees / 100, c.profitSatang == null ? null : c.profitSatang / 100, c.marginPct]));
    rows.push([], ['Order', 'Date', 'Channel', 'Status', 'Sales THB', 'Profit THB']); current.orders.forEach(o => rows.push([o.orderId, o.orderAt, channelName(o.platform), statusNames[o.commerceStatus], o.revenueSatang / 100, o.profitSatang == null ? null : o.profitSatang / 100]));
    rows.push([], ['Product', 'Profit THB (before additional expenses)']); [...productMap.values()].forEach(p => rows.push([p.name, p.profitSatang == null ? null : p.profitSatang / 100]));
    rows.push([], ['Day', 'Sales THB', 'Costs THB', 'Profit THB']); days.forEach(d => rows.push([d.day, d.revenueSatang / 100, d.totalCostsSatang == null ? null : d.totalCostsSatang / 100, d.profitSatang == null ? null : d.profitSatang / 100]));
    rows.push([], ['Expense date', 'Channel', 'Category', 'Amount THB', 'Note']); current.expenses.forEach(e => rows.push([e.date, channelName(e.channel), categoryNames[e.category], e.amountSatang / 100, e.note]));
    if (compare && previousCovered) { rows.push([], ['Previous period', previous?.start ?? '', previous?.end ?? '']); kpis.forEach(k => rows.push([k.label, old[k.key] == null ? null : ['totalOrders', 'marginPct'].includes(k.key) ? old[k.key] : old[k.key]! / 100])); }
    const url = URL.createObjectURL(new Blob([financeCsv(rows)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = `MarginShot-finance-${bounds?.start}-${bounds?.end}-${channel.replace(/[^a-z0-9]/gi, '-')}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const saveExpense = (event: React.FormEvent) => {
    event.preventDefault(); setFormError('');
    try {
      const amountSatang = parseBaht(amount);
      const entry: Expense = { id: crypto.randomUUID(), category, amountSatang, date, note: note.trim(), channel: expenseChannel };
      const next = readExpenses(JSON.stringify([...expenses, entry]));
      if (!storageKey || storageError) throw Error('STORAGE');
      localStorage.setItem(storageKey, JSON.stringify(next)); setExpenses(next); setAmount(''); setNote(''); setShowForm(false); setSaved(true); addButton.current?.focus();
    } catch { setFormError(text('บันทึกไม่ได้ ตรวจจำนวนเงิน (มากกว่า 0 ไม่เกิน 1,000 ล้านบาท) วันที่ และสิทธิ์จัดเก็บของเบราว์เซอร์ แล้วลองอีกครั้ง', 'Could not save. Check a positive amount up to THB 1 billion, the date, and browser storage permissions, then retry.')); }
  };
  const busy = resource.loading || !storageReady;
  return <div className={s.page} aria-busy={busy}>
    {!busy && resource.coverage?.partial && <p className="notice" role="alert"><Icon name="warning" />{text(`API ส่งรายละเอียดมา ${resource.coverage.loaded} จาก ${resource.coverage.total} ออเดอร์ในเดือนที่ขอ รวมเดือนที่ใช้เปรียบเทียบ ตัวเลขและไฟล์ส่งออกครอบคลุมเฉพาะรายการที่โหลดได้ ไม่ใช่ยอดรวมทั้งร้าน ปิดการเทียบช่วงก่อนหน้าจนข้อมูลครบ`,`The API returned ${resource.coverage.loaded} of ${resource.coverage.total} orders across requested months, including comparison months. Figures and exports cover loaded entries only, not the whole store. Previous-period comparison is unavailable until coverage is complete.`)}</p>}
    <p className={s.lead}>{text('ดูว่าเงินไปไหน และช่องทางไหนทำกำไรให้ร้าน', 'See where the money goes, and which channels earn it.')}</p>
    <ScreenActions><button className="secondary" disabled={busy || !!resource.error || !bounds} onClick={exportReport}><Icon name="receipt" />{text('ส่งออกรายงาน', 'Export report')}</button></ScreenActions>
    <div className={s.controls}><label>{text('ช่องทางขาย', 'Sales channel')}<select aria-label={text('ช่องทางขาย', 'Sales channel')} value={channel} onChange={e => setChannel(e.target.value)}><option value="all">{text('ทุกช่องทาง', 'All channels')}</option>{[...new Set([...FINANCE_CHANNELS, ...resource.orders.map(o => o.platform)])].map(c => <option key={c} value={c}>{channelName(c)}</option>)}</select></label><label className={s.compare}><input type="checkbox" checked={compare && previousCovered} disabled={!previousCovered} onChange={e => setCompare(e.target.checked)} />{text('เทียบกับช่วงก่อนหน้า', 'Compare previous period')}</label></div>
    <p className={s.scope}><span>{bounds ? `${bounds.start} — ${bounds.end}` : t('invalidRange')}{compare && previousCovered && previous ? ` · ${text('เทียบ', 'vs')} ${previous.start} — ${previous.end}` : ''}</span><span>{mock ? text(`ตัวอย่าง ${sampleStart} — ${today} · แยกจากออเดอร์นำเข้า`, `Sample ${sampleStart} — ${today} · Separate from imported orders`) : text('เฉพาะข้อมูลที่บันทึก · ไม่รวมภาษีเงินได้ที่ยังไม่บันทึก', 'Recorded entries only · Excludes unrecorded income tax')}</span></p>
    {!bounds && <p className="notice" role="alert"><Icon name="warning" />{t('invalidRange')}</p>}
    <ErrorNotice error={resource.error} />{!!resource.error && <button className="secondary" onClick={resource.retry}>{t('retry')}</button>}
    {busy ? <div className={s.loading} role="status"><span>{t('loading')}</span><div className={s.kpis}>{Array.from({ length: 6 }, (_, i) => <div key={i} className={s.skeleton} />)}</div><div className={s.skeleton} /></div> : !resource.error && bounds && <>
      {totals.missingCostOrders > 0 && <div className={s.warning}><span>{text(`มี ${totals.missingCostOrders} ออเดอร์ที่ยังไม่ระบุต้นทุน — ตัวเลขกำไรอาจไม่ครบ`, `${totals.missingCostOrders} orders are missing costs — profit may be incomplete`)}</span><button className="ghost" onClick={onMissingCosts}>{text('เพิ่มต้นทุนสินค้า', 'Add product costs')}<Icon name="arrow" /></button></div>}
      {estimated && !totals.missingCostOrders && <p className={s.muted}>{text('ข้อมูลเงินหักยังไม่ครบ กำไรจะแสดงเมื่อมีข้อมูลครบ', 'Some deductions are missing. Profit is available when records are complete.')}</p>}
      <section className={s.kpis} aria-label={text('สรุปการเงิน', 'Finance summary')}>{kpis.map(k => <article className={s.kpi + (k.key === 'profitSatang' ? ' ' + s.kpiProfit : '')} key={k.key}><h2 title={k.key === 'averageSatang' ? text('ยอดขายสุทธิหารด้วยจำนวนออเดอร์ทุกสถานะ', 'Net sales divided by orders of all statuses') : undefined}>{k.label}{estimated && ['profitSatang', 'marginPct', 'totalCostsSatang'].includes(k.key) ? ' · ' + text('ประมาณการ', 'Incomplete estimate') : ''}</h2><strong className={totals[k.key] != null && totals[k.key]! < 0 ? s.negative : ''}>{k.key === 'profitSatang' ? <ProfitValue value={totals[k.key]} locale={locale} /> : k.key === 'marginPct' ? margin(totals[k.key]) : k.key === 'totalOrders' ? totals[k.key].toLocaleString(locale) : cash(totals[k.key])}</strong>{compare && previousCovered && <Delta className={s.delta} change={delta(k.key)} unit={k.key === 'marginPct' ? 'pp' : 'pct'} />}<Sparkline values={days.map(d => d[k.key])} label={text('แนวโน้มรายวัน · ดูตัวเลขในกราฟด้านล่าง', 'Daily trend · Exact values in chart below')} /></article>)}</section>
      {!current.orders.length && !current.expenses.length && <Empty title={t('noOrdersInPeriod')} action={<button className="secondary" onClick={() => { setChannel('all'); onPeriodChange({ ...period, type: 'month' }); }}>{text('ดูทุกช่องทางในเดือนนี้', 'View all channels this month')}</button>} />}
      <nav className={s.jumpLinks} aria-label={text('ส่วนต่าง ๆ ของการเงิน', 'Finance sections')}>{[['finance-summary', text('สรุป / กำไรขาดทุน', 'Summary / Profit & loss')], ['finance-channels', text('ช่องทางขาย', 'Channels')], ['finance-orders', text('ออเดอร์', 'Orders')], ['finance-products', text('สินค้า', 'Products')], ['finance-expenses', text('ค่าใช้จ่าย', 'Expenses')]].map(([id, label]) => <a key={id} href={'#' + id} onClick={e => { e.preventDefault(); const section = document.getElementById(id); section?.scrollIntoView({ behavior: 'instant', block: 'start' }); section?.focus({ preventScroll: true }); }}>{label}</a>)}</nav>
      <div id="finance-summary" tabIndex={-1} className={s.summaryGrid}>
        <section className={s.panel}><div className={s.sectionHeading}><h2>{text('งบกำไรขาดทุน', 'Profit & loss')}</h2><span className={s.muted}>{text('บาท / % ยอดขายสุทธิ', 'THB / % net sales')}</span></div>
          <div className={s.allocation} aria-hidden="true">{totals.totalCostsSatang != null && totals.revenueSatang > 0 && <><span style={{ width: `${Math.min(100, Math.max(0, (totals.profitSatang ?? 0) / totals.revenueSatang * 100))}%` }} /><span style={{ flex: 1 }} /></>}</div>
          <dl className={s.statement}>{pnl.map(([label, value, cls]) => <div key={label} className={cls}><dt>{label}</dt><dd>{cls?.startsWith(s.net) ? profitCash(value) : cash(value)}</dd><dd className={s.muted}>{value == null || !totals.revenueSatang ? '—' : pct(value / totals.revenueSatang * 100)}</dd></div>)}</dl>
          <p className={s.muted}>{text('ยอดขายสุทธิ − ค่าใช้จ่ายที่บันทึก = กำไรสุทธิ', 'Net sales − recorded costs = net profit')}{estimated ? ' · ' + text('ประมาณการ: ข้อมูลไม่ครบแสดง —', 'Incomplete estimate: missing values shown as —') : ''}</p>
          {!mock && <p className={s.muted}>{text('API ให้ยอดขายสุทธิแล้ว แต่ยังไม่แยกยอดก่อนหักและส่วนลด/คืนสินค้า จึงแสดง —', 'The API provides net sales, but not separate gross sales or discounts/returns. These are shown as —.')}</p>}
        </section><FinanceChart orders={current.orders} expenses={current.expenses} />
      </div>
      <section id="finance-channels" tabIndex={-1} className={s.panel}><div className={s.sectionHeading}><h2>{text('ช่องทางไหนทำกำไร', 'Which channels earn their keep?')}</h2>{best && <span className={s.badge}>{text('มาร์จินสูงสุด', 'Highest margin')} · {channelName(best.platform)}</span>}</div><div className={s.tableScroll} tabIndex={0} role="region" aria-label={text('ตารางช่องทางขาย', 'Channel table')}><table><caption>{text('รวมค่าใช้จ่ายเพิ่มเติมของช่องทางนั้นแล้ว · สัดส่วนเทียบยอดขายสุทธิทั้งหมดที่เลือก', 'Includes added channel expenses · Share of selected net sales')}</caption><thead><tr>{[text('ช่องทาง', 'Channel'), text('ยอดขาย / สัดส่วน', 'Sales / share'), text('ออเดอร์', 'Orders'), text('ค่าธรรมเนียม', 'Fees'), t('netProfitLoss'), text('มาร์จิน', 'Margin')].map(n => <th key={n} scope="col">{n}</th>)}</tr></thead><tbody>{channels.map(c => <tr key={c.platform} className={c.platform === best?.platform ? s.best : ''}><th scope="row">{channelName(c.platform)}</th><td><span className={s.share}><meter min="0" max="100" value={totals.revenueSatang > 0 ? Math.max(0, c.revenueSatang / totals.revenueSatang * 100) : 0} aria-label={channelName(c.platform)} />{cash(c.revenueSatang)} <small>{totals.revenueSatang > 0 ? pct(c.revenueSatang / totals.revenueSatang * 100) : '—'}</small></span></td><td>{c.totalOrders}</td><td>{cash(c.categories.fees)}</td><td className={(c.profitSatang ?? 0) < 0 ? s.negative : s.positive}>{profitCash(c.profitSatang)}{c.completeOrders < c.totalOrders && <small> · {text('ประมาณการ', 'Incomplete')}</small>}</td><td>{margin(c.marginPct)}</td></tr>)}</tbody><tfoot><tr><th scope="row">{text('รวม', 'Total')}</th><td>{cash(totals.revenueSatang)}</td><td>{totals.totalOrders}</td><td>{cash(totals.categories.fees)}</td><td>{profitCash(totals.profitSatang)}</td><td>{margin(totals.marginPct)}</td></tr></tfoot></table></div></section>
      <section id="finance-orders" tabIndex={-1} className={s.panel}><div className={s.sectionHeading}><h2>{text('ออเดอร์ในช่วงนี้', 'Orders in this period')}</h2><button className="ghost" onClick={() => navigate('orders')}>{t('allOrders')}<Icon name="arrow" /></button></div><div className={s.statusCounts}>{Object.entries(statusNames).filter(([key]) => key !== 'UNKNOWN' || current.orders.some(o => o.commerceStatus === 'UNKNOWN')).map(([key, label]) => <button key={key} aria-pressed={status === key} onClick={() => setStatus(status === key ? 'all' : key)}>{label}<strong>{current.orders.filter(o => o.commerceStatus === key).length}</strong></button>)}</div>
        <div className={s.orderFilters}><label>{text('ค้นหาออเดอร์', 'Search orders')}<input type="search" placeholder={text('เลขออเดอร์หรือชื่อสินค้า', 'Order ID or product name')} value={search} onChange={e => setSearch(e.target.value)} /></label><label>{text('สถานะ', 'Status')}<select aria-label={text('สถานะ', 'Status')} value={status} onChange={e => setStatus(e.target.value)}><option value="all">{text('ทุกสถานะ', 'All statuses')}</option>{Object.entries(statusNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label></div>
        {!matches.length ? <Empty title={text('ไม่พบออเดอร์ที่ตรงกัน', 'No matching orders')} action={<button className="secondary" onClick={() => { setSearch(''); setStatus('all'); }}>{text('ล้างการค้นหา', 'Clear search')}</button>} /> : <><div className={s.tableScroll} tabIndex={0} role="region" aria-label={text('รายการออเดอร์', 'Orders list')}><table><caption>{text(`แสดง ${Math.min(limit, matches.length)} จาก ${matches.length} ออเดอร์ · ใช้ช่องทางที่เลือกด้านบน`, `Showing ${Math.min(limit, matches.length)} of ${matches.length} orders · Uses the channel selected above`)}</caption><thead><tr>{[text('ออเดอร์ / สินค้า', 'Order / product'), text('วันที่', 'Date'), text('ช่องทาง', 'Channel'), text('สถานะ', 'Status'), text('ยอดขายสุทธิ', 'Net sales'), t('netProfitLoss')].map(n => <th key={n} scope="col">{n}</th>)}</tr></thead><tbody>{matches.slice(0, limit).map(o => <tr key={o.platform + o.orderId}><th scope="row">{o.orderId}<br /><small>{o.productName}</small></th><td>{bangkokDate(o.orderAt)}</td><td>{channelName(o.platform)}</td><td>{statusNames[o.commerceStatus]}</td><td>{cash(o.revenueSatang)}</td><td className={(o.profitSatang ?? 0) < 0 ? s.negative : ''}>{profitCash(o.profitSatang)}{o.profitSatang == null && <small> · {text('ประมาณการ', 'Incomplete')}</small>}</td></tr>)}</tbody></table></div>{matches.length > limit && <button className="secondary" onClick={() => setLimit(n => n + 10)}>{text('ดูอีก 10 ออเดอร์', 'Show 10 more orders')}</button>}</>}
      </section>
      <section id="finance-products" tabIndex={-1} className={s.panel}><div className={s.sectionHeading}><h2>{text('กำไรแยกตามสินค้า', 'Profit by product')}</h2><button className="ghost" onClick={() => navigate('products')}>{text('ดูสินค้าทั้งหมด', 'All products')}<Icon name="arrow" /></button></div><p className={s.muted}>{text('ก่อนค่าใช้จ่ายเพิ่มเติมที่ไม่ได้ผูกสินค้า · แสดงเฉพาะสินค้าที่มีข้อมูลกำไรครบ', 'Before additional expenses not assigned to products · Only products with complete profit records')}</p>{!mock && <p className={s.muted}>{text('ออเดอร์หลายสินค้ารอข้อมูลกำไรแยกรายการจาก API', 'Multi-product orders require item-level profit from the API.')}</p>}
        {!products.length ? <Empty title={text('ยังไม่มีข้อมูลกำไรสินค้าในช่วงนี้', 'No product profit data in this period')} /> : <div className={s.rankingGrid}>{[[text('กำไรสูงสุด 5 อันดับ', 'Top 5 by profit'), products.slice(0, 5)], [text('กำไรต่ำสุด 5 อันดับ', 'Bottom 5 by profit'), [...products].reverse().slice(0, 5)]].map(([label, list]) => <div key={String(label)}><h3>{String(label)}</h3><ol className={s.ranking}>{(list as typeof products).map(p => <li key={p.sku}><span>{p.name}</span><strong className={p.profitSatang! < 0 ? s.negative : s.positive}>{profitCash(p.profitSatang)}</strong></li>)}</ol></div>)}</div>}
      </section>
      <section id="finance-expenses" tabIndex={-1} className={s.panel}><div className={s.sectionHeading}><h2>{text('ค่าใช้จ่ายของร้าน', 'Store expenses')}</h2><button ref={addButton} disabled={!mock || !storageReady || storageError} aria-expanded={showForm} aria-controls="finance-expense-form" onClick={() => { setShowForm(v => !v); setExpenseChannel(channel === 'all' ? 'In-store' : channel); setDate(bounds?.end ?? today); }}><Icon name="plus" />{text('เพิ่มค่าใช้จ่าย', 'Add expense')}</button></div><p className={s.muted}>{mock ? text('รายการที่เพิ่มบันทึกในเบราว์เซอร์นี้ และรวมในรายงานการเงินหน้านี้', 'Added entries are stored in this browser and included in this finance report.') : text('บัญชีร้านค้ายังไม่รองรับการบันทึกค่าใช้จ่ายผ่าน API', 'Saving expenses for a store account requires an API that is not yet available.')}</p>
        {storageError && <p className="notice" role="alert"><Icon name="warning" />{text('อ่านพื้นที่จัดเก็บไม่ได้หรือข้อมูลเดิมไม่ถูกต้อง ยังไม่เขียนทับข้อมูลเดิม โปรดลองโหลดหน้าใหม่หรือตรวจสิทธิ์เบราว์เซอร์', 'Storage is unavailable or saved entries are invalid. Existing data has not been overwritten. Reload or check browser permissions.')}</p>}
        {saved && <p role="status" className={s.badge}>{text('บันทึกค่าใช้จ่ายแล้ว · ยอดรวมอัปเดตตามช่วงเวลาและช่องทางที่เลือก', 'Expense saved · Totals follow the selected period and channel')}</p>}
        {showForm && <form id="finance-expense-form" className={s.expenseForm} onSubmit={saveExpense}><label>{text('จำนวนเงิน (บาท)', 'Amount (THB)')}<input ref={expenseInput} inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required maxLength={16} /></label><label>{text('หมวดหมู่', 'Category')}<select aria-label={text('หมวดหมู่', 'Category')} value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>{expenseCategories.map(c => <option key={c} value={c}>{categoryNames[c]}</option>)}</select></label><label>{text('วันที่', 'Date')}<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label><label>{text('ช่องทางของค่าใช้จ่าย', 'Expense channel')}<select aria-label={text('ช่องทางของค่าใช้จ่าย', 'Expense channel')} value={expenseChannel} onChange={e => setExpenseChannel(e.target.value)}>{FINANCE_CHANNELS.map(c => <option key={c} value={c}>{channelName(c)}</option>)}</select></label><label>{text('หมายเหตุ (ไม่บังคับ)', 'Note (optional)')}<input value={note} onChange={e => setNote(e.target.value)} maxLength={240} /></label>{formError && <p className={s.formMessage} role="alert">{formError}</p>}<div className={s.formActions}><button type="button" className="secondary" onClick={() => { setShowForm(false); setFormError(''); addButton.current?.focus(); }}>{text('ยกเลิก', 'Cancel')}</button><button type="submit">{text('บันทึกค่าใช้จ่าย', 'Save expense')}</button></div></form>}
        {expenseCategories.map(key => <div className={s.expenseRow} key={key}><span>{categoryNames[key]}</span><meter aria-label={categoryNames[key]} value={totals.categories[key] ?? 0} min="0" max={Math.max(1, ...Object.values(totals.categories).filter((v): v is number => v != null))} /><strong>{cash(totals.categories[key])}</strong></div>)}
        {!!current.expenses.length && <details className={s.details}><summary>{text(`รายการที่เพิ่ม ${current.expenses.length} รายการ`, `${current.expenses.length} added entries`)}</summary><ul className={s.ranking}>{current.expenses.map(e => <li key={e.id}><span>{e.date} · {channelName(e.channel)} · {categoryNames[e.category]}<br /><small>{e.note}</small></span><strong>{cash(e.amountSatang)}</strong></li>)}</ul></details>}
      </section>
    </>}
    {/* P4g: entries to the money sub-screens (same routes as the sidebar items; navigate() so a leave guard fires once). */}
    <section className={s.panel} aria-labelledby="finance-records-title"><h2 id="finance-records-title">{t('financeRecords')}</h2>
      <div className={s.recordCards}>{([['orders', 'orders', 'ordersCardBody'], ['reconciliation', 'reconcile', 'reconciliationCardBody']] as const).map(([screen, icon, body]) => <button key={screen} type="button" className={'secondary ' + s.recordCard} onClick={() => navigate(screen)}><Icon name={icon} /><span><strong>{t(screen)}</strong><small>{t(body)}</small></span><Icon name="chevronRight" /></button>)}</div>
    </section>
  </div>;
}
