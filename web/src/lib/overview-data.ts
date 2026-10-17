// Overview only aggregates recorded amounts. Fee rules and order profit are owned
// by the API; the explicit fixture amounts below are synthetic, not market rates.
export const OVERVIEW_MOCK_TODAY = '2026-10-17';
export const OVERVIEW_CHANNELS = ['Shopee', 'Lazada', 'TikTok', 'LINE Shop'] as const;
export type PeriodType = 'today' | 'week' | 'month' | 'custom';
export type OverviewPeriod = { type: PeriodType; start: string; end: string };
export interface OverviewOrder {
  orderId: string;
  platform: string;
  orderAt: string;
  revenueSatang: number;
  profitSatang: number | null;
  productCostSatang: number | null;
  platformFeeSatang: number | null;
  shippingSatang: number | null;
  otherCostSatang: number | null;
  productName: string;
  skus: string[];
  status: string;
  missingFields?: string[];
}
const bangkokFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});
export function orderDateTime(iso: string) {
  if (!Number.isFinite(Date.parse(iso))) return '—';
  const parts = Object.fromEntries(bangkokFormatter.formatToParts(new Date(iso)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
function validDay(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function periodBounds(period: OverviewPeriod, today: string) {
  if (period.type === 'custom') return validDay(period.start) && validDay(period.end) && period.start <= period.end ? { start: period.start, end: period.end } : null;
  if (!validDay(today)) return null;
  const day = new Date(today + 'T00:00:00Z');
  if (period.type === 'today') return { start: today, end: today };
  if (period.type === 'month') return { start: today.slice(0, 7) + '-01', end: today };
  // Calendar week starts on Monday, up to the active day, in Bangkok.
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  return { start: day.toISOString().slice(0, 10), end: today };
}
export function ordersInPeriod(orders: OverviewOrder[], period: OverviewPeriod, today: string) {
  const bounds = periodBounds(period, today);
  if (!bounds) return [];
  return orders.filter(order => {
    const date = orderDateTime(order.orderAt).slice(0, 10);
    return date >= bounds.start && date <= bounds.end;
  });
}
export function periodMonths(period: OverviewPeriod, today: string) {
  const bounds = periodBounds(period, today);
  if (!bounds) return [];
  const months: string[] = [];
  const first = Number(bounds.start.slice(0, 4)) * 12 + Number(bounds.start.slice(5, 7)) - 1;
  const last = Number(bounds.end.slice(0, 4)) * 12 + Number(bounds.end.slice(5, 7)) - 1;
  for (let index = first; index <= last; index++) {
    months.push(`${String(Math.floor(index / 12)).padStart(4, '0')}-${String(index % 12 + 1).padStart(2, '0')}`);
  }
  return months;
}
export function missingProductCost(order: OverviewOrder) {
  return order.productCostSatang == null || !!order.missingFields?.some(field => field.startsWith('cost:'));
}
export function orderComplete(order: OverviewOrder) {
  return !missingProductCost(order) && !order.missingFields?.length && order.status !== 'INCOMPLETE' &&
    [order.profitSatang, order.platformFeeSatang, order.shippingSatang, order.otherCostSatang].every(value => value != null);
}
export function summarizeOrders(orders: OverviewOrder[]) {
  const sum = (key: 'profitSatang' | 'productCostSatang' | 'platformFeeSatang' | 'shippingSatang' | 'otherCostSatang') =>
    orders.some(order => order[key] == null) ? null : orders.reduce((total, order) => total + order[key]!, 0);
  const revenueSatang = orders.reduce((total, order) => total + order.revenueSatang, 0);
  const completeOrders = orders.filter(orderComplete).length;
  const profitSatang = completeOrders === orders.length ? sum('profitSatang') : null;
  const productCostSatang = sum('productCostSatang'), platformFeeSatang = sum('platformFeeSatang');
  const shippingSatang = sum('shippingSatang'), otherCostSatang = sum('otherCostSatang');
  const components = [productCostSatang, platformFeeSatang, shippingSatang, otherCostSatang];
  return { revenueSatang, profitSatang, productCostSatang, platformFeeSatang, shippingSatang, otherCostSatang,
    totalCostsSatang: components.some(value => value == null) ? null : components.reduce<number>((total, value) => total + value!, 0),
    marginPct: revenueSatang > 0 && profitSatang != null ? profitSatang / revenueSatang * 100 : null,
    completeOrders, totalOrders: orders.length, missingCostOrders: orders.filter(missingProductCost).length };
}
export function channelSummaries(orders: OverviewOrder[]) {
  const channels = [...new Set([...OVERVIEW_CHANNELS, ...orders.map(order => order.platform)])];
  return channels.map(platform => ({ platform, ...summarizeOrders(orders.filter(order => order.platform === platform)) }))
    .sort((a, b) => (b.profitSatang ?? -Infinity) - (a.profitSatang ?? -Infinity));
}

export const OVERVIEW_MOCK_ORDERS: OverviewOrder[] = [
  {
    orderId: '#SHP-98214',
    platform: 'Shopee',
    orderAt: '2026-10-17T09:42:00.000Z',
    revenueSatang: 58000,
    profitSatang: 22200,
    productCostSatang: 26000,
    platformFeeSatang: 5800,
    shippingSatang: 4000,
    otherCostSatang: 0,
    skus: ['TSHIRT-01'],
    productName: 'เสื้อยืดคอตตอนแท้ x2',
    status: 'COMPLETED'
  },
  {
    orderId: '#LZD-44120',
    platform: 'Lazada',
    orderAt: '2026-10-17T08:15:00.000Z',
    revenueSatang: 59000,
    profitSatang: 22100,
    productCostSatang: 28000,
    platformFeeSatang: 5900,
    shippingSatang: 3000,
    otherCostSatang: 0,
    skus: ['JEANS-02'],
    productName: 'กางเกงยีนส์ขากระบอก x1',
    status: 'COMPLETED'
  },
  {
    orderId: '#TT-31892',
    platform: 'TikTok',
    orderAt: '2026-10-16T19:30:00.000Z',
    revenueSatang: 39800,
    profitSatang: 15820,
    productCostSatang: 17000,
    platformFeeSatang: 3980,
    shippingSatang: 3000,
    otherCostSatang: 0,
    skus: ['BAG-03'],
    productName: 'กระเป๋าผ้าแคนวาส x2',
    status: 'COMPLETED'
  },
  {
    orderId: '#LN-11048',
    platform: 'LINE Shop',
    orderAt: '2026-10-16T14:10:00.000Z',
    revenueSatang: 35000,
    profitSatang: 14500,
    productCostSatang: 16000,
    platformFeeSatang: 0,
    shippingSatang: 4500,
    otherCostSatang: 0,
    skus: ['CUP-04'],
    productName: 'แก้วสแตนเลสเก็บความเย็น x1',
    status: 'COMPLETED'
  },
  {
    orderId: '#SHP-97805',
    platform: 'Shopee',
    orderAt: '2026-10-15T16:55:00.000Z',
    revenueSatang: 88000,
    profitSatang: 33200,
    productCostSatang: 41000,
    platformFeeSatang: 8800,
    shippingSatang: 5000,
    otherCostSatang: 0,
    skus: ['TSHIRT-01', 'JEANS-02'],
    productName: 'เสื้อยืดคอตตอน + ยีนส์',
    status: 'COMPLETED'
  },
  {
    orderId: '#LZD-43899',
    platform: 'Lazada',
    orderAt: '2026-10-14T11:20:00.000Z',
    revenueSatang: 29000,
    profitSatang: 10100,
    productCostSatang: 13000,
    platformFeeSatang: 2900,
    shippingSatang: 3000,
    otherCostSatang: 0,
    skus: ['TSHIRT-01'],
    productName: 'เสื้อยืดคอตตอนแท้ x1',
    status: 'COMPLETED'
  },
  {
    orderId: '#TT-31405',
    platform: 'TikTok',
    orderAt: '2026-10-12T15:40:00.000Z',
    revenueSatang: 70000,
    profitSatang: 26000,
    productCostSatang: 32000,
    platformFeeSatang: 7000,
    shippingSatang: 5000,
    otherCostSatang: 0,
    skus: ['CUP-04'],
    productName: 'แก้วสแตนเลส x2',
    status: 'COMPLETED'
  },
  {
    orderId: '#SHP-96542',
    platform: 'Shopee',
    orderAt: '2026-10-10T10:05:00.000Z',
    revenueSatang: 19900,
    profitSatang: 6910,
    productCostSatang: 8500,
    platformFeeSatang: 1990,
    shippingSatang: 2500,
    otherCostSatang: 0,
    skus: ['BAG-03'],
    productName: 'กระเป๋าผ้าแคนวาส x1',
    status: 'COMPLETED'
  },
  {
    orderId: '#LN-10901',
    platform: 'LINE Shop',
    orderAt: '2026-10-06T13:25:00.000Z',
    revenueSatang: 14900,
    profitSatang: 7900,
    productCostSatang: 4500,
    platformFeeSatang: 0,
    shippingSatang: 2500,
    otherCostSatang: 0,
    skus: ['CASE-05'],
    productName: 'เคสโทรศัพท์ x1',
    status: 'COMPLETED'
  },
  {
    orderId: '#SHP-95211',
    platform: 'Shopee',
    orderAt: '2026-10-02T17:15:00.000Z',
    revenueSatang: 59000,
    profitSatang: 22100,
    productCostSatang: 28000,
    platformFeeSatang: 5900,
    shippingSatang: 3000,
    otherCostSatang: 0,
    skus: ['JEANS-02'],
    productName: 'กางเกงยีนส์ขากระบอก x1',
    status: 'COMPLETED'
  }
];
