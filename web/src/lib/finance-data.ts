import type { Calculation } from './types';
import { orderDateTime, periodBounds, summarizeOrders, type OverviewOrder, type OverviewPeriod } from './overview-data.ts';

export const FINANCE_CHANNELS = ['Shopee', 'Lazada', 'TikTok', 'LINE Shop', 'In-store'] as const;
export const expenseCategories = ['product', 'fees', 'shipping', 'ads', 'other'] as const;
export type ExpenseCategory = typeof expenseCategories[number];
export type Expense = { id: string; category: ExpenseCategory; amountSatang: number; date: string; note: string; channel: string };
export type FinanceOrder = OverviewOrder & {
  grossSatang: number | null; reductionsSatang: number | null; adsSatang: number;
  packagingSatang: number; commerceStatus: string; productProfits: { sku: string; name: string; profitSatang: number | null }[];
};
export function fromCalculation(r: Calculation): FinanceOrder {
  return { orderId: r.orderId, platform: r.platform, orderAt: r.orderAt, revenueSatang: r.revenueSatang,
    profitSatang: r.profitSatang, productCostSatang: r.cogsSatang,
    platformFeeSatang: r.missingFields.some(f => f === 'base_fee_rules' || f.startsWith('rule:') || f.startsWith('cash_deduction')) ? null : r.feeSatang,
    shippingSatang: r.sellerShippingSatang, otherCostSatang: r.packagingSatang + r.adsSatang,
    adsSatang: r.adsSatang, packagingSatang: r.packagingSatang, grossSatang: null, reductionsSatang: null,
    productName: r.items.map(i => i.sku).join(', '), skus: r.items.map(i => i.sku), status: r.status,
    missingFields: r.missingFields, commerceStatus: 'UNKNOWN',
    // The API has no per-item net profit or commerce status. Never allocate order profit by guesswork.
    productProfits: r.items.length === 1 ? [{ sku: r.items[0].sku, name: r.items[0].sku, profitSatang: r.profitSatang }] : [] };
}
export function previousPeriod(period: OverviewPeriod, today: string): OverviewPeriod | null {
  const bounds = periodBounds(period, today); if (!bounds) return null;
  const start = Date.parse(bounds.start), end = Date.parse(bounds.end), day = 86400000;
  return { type: 'custom', start: new Date(start - (end - start + day)).toISOString().slice(0, 10), end: new Date(start - day).toISOString().slice(0, 10) };
}
export function selectFinance(orders: FinanceOrder[], expenses: Expense[], period: OverviewPeriod, today: string, channel: string) {
  const bounds = periodBounds(period, today);
  const inRange = (date: string, platform: string) => !!bounds && date >= bounds.start && date <= bounds.end && (channel === 'all' || channel === platform);
  return { orders: orders.filter(o => inRange(orderDateTime(o.orderAt).slice(0, 10), o.platform)), expenses: expenses.filter(e => inRange(e.date, e.channel)) };
}
export function financeTotals(orders: FinanceOrder[], expenses: Expense[]) {
  const totals = summarizeOrders(orders);
  const extra = (category: ExpenseCategory) => expenses.filter(e => e.category === category).reduce((s, e) => s + e.amountSatang, 0);
  const plus = (value: number | null, category: ExpenseCategory) => value == null ? null : value + extra(category);
  const additional = expenses.reduce((sum, e) => sum + e.amountSatang, 0);
  // Summation of recorded ledger amounts; order calculations remain in the canonical engine/API.
  const profitSatang = totals.profitSatang == null ? null : totals.profitSatang - additional;
  return { ...totals, profitSatang,
    totalCostsSatang: totals.totalCostsSatang == null ? null : totals.totalCostsSatang + additional,
    marginPct: totals.revenueSatang > 0 && profitSatang != null ? profitSatang / totals.revenueSatang * 100 : null,
    averageSatang: orders.length ? Math.round(totals.revenueSatang / orders.length) : null,
    grossSatang: orders.some(o => o.grossSatang == null) ? null : orders.reduce((s, o) => s + o.grossSatang!, 0),
    reductionsSatang: orders.some(o => o.reductionsSatang == null) ? null : orders.reduce((s, o) => s + o.reductionsSatang!, 0),
    categories: { product: plus(totals.productCostSatang, 'product'), fees: plus(totals.platformFeeSatang, 'fees'),
      shipping: plus(totals.shippingSatang, 'shipping'), ads: orders.reduce((s, o) => s + o.adsSatang, 0) + extra('ads'),
      other: orders.reduce((s, o) => s + o.packagingSatang, 0) + extra('other') } };
}
export function financeDays(orders: FinanceOrder[], expenses: Expense[]) {
  const dates = [...new Set([...orders.map(o => orderDateTime(o.orderAt).slice(0, 10)), ...expenses.map(e => e.date)])].sort();
  return dates.map(day => ({ day, ...financeTotals(orders.filter(o => orderDateTime(o.orderAt).startsWith(day)), expenses.filter(e => e.date === day)) }));
}
export function readExpenses(raw: string | null): Expense[] {
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length > 1000 || !parsed.every(e => e && typeof e.id === 'string' && expenseCategories.includes(e.category) &&
    Number.isSafeInteger(e.amountSatang) && e.amountSatang > 0 && e.amountSatang <= 100000000000 &&
    typeof e.note === 'string' && e.note.length <= 240 && FINANCE_CHANNELS.includes(e.channel) &&
    /^\d{4}-\d{2}-\d{2}$/.test(e.date) && Number.isFinite(Date.parse(e.date)) && new Date(e.date).toISOString().slice(0, 10) === e.date)) throw Error('INVALID_EXPENSE_STORAGE');
  return parsed;
}
export function financeCsv(rows: (string | number | null)[][]) {
  const escape = (v: string | number | null) => '"' + (typeof v === 'string' ? v.replace(/^[=+@\-\t\r]/, "'$&") : String(v ?? '')).replaceAll('"', '""') + '"';
  return '\uFEFF' + rows.map(row => row.map(escape).join(',')).join('\r\n');
}
