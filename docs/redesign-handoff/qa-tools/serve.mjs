// QA harness: static server for a `next build` export (127.0.0.1:4060) + mock API (127.0.0.1:4051).
// Usage: node serve.mjs <outDir> [--empty]   (--empty => store with no orders/products: empty-state run)
// Read-only w.r.t. the repo: imports the frontend's generated canonical engine for realistic Calculation objects.
import http from 'node:http';
import { readFileSync, existsSync, statSync, appendFileSync, writeFileSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = process.env.REPO || join(HERE, '../../..');
const outDir = process.argv[2];
const EMPTY = process.argv.includes('--empty');
if (!outDir || !existsSync(outDir)) { console.error('usage: node serve.mjs <outDir> [--empty]'); process.exit(1); }
const { calculate, simulate, breakEven, demoFixture } = await import(pathToFileURL(join(REPO, 'web/src/lib/domain.generated.js')).href);
const UNKNOWN_LOG = join(HERE, 'unknown-endpoints.log');
writeFileSync(UNKNOWN_LOG, '');

// ---------- static server ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.csv': 'text/csv', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.map': 'application/json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = normalize(join(outDir, p));
  if (!f.startsWith(normalize(outDir))) { res.writeHead(403).end(); return; }
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  else if (!existsSync(f) && existsSync(f + '.html')) f = f + '.html';
  if (!existsSync(f)) { const nf = join(outDir, '404.html'); res.writeHead(404, { 'content-type': TYPES['.html'] }).end(existsSync(nf) ? readFileSync(nf) : 'not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(readFileSync(f));
}).listen(4060, '127.0.0.1', () => console.log('static  http://127.0.0.1:4060  <-', outDir));

// ---------- mock data (built with the canonical engine, not re-implemented formulas) ----------
const O = { dataOrigin: 'REAL', sourceRef: 'qa-mock-v1' };
const bkk = (d = new Date()) => new Date(d.getTime() + 7 * 3600000).toISOString().slice(0, 10);
const TODAY = bkk();
// Mirrors web/src/lib/mock-data.ts INITIAL_MOCK_PRODUCTS (+ one loss SKU and one missing-cost SKU).
const PRODUCTS = [
  ['TSHIRT-01', 'เสื้อยืดคอตตอนแท้ (Premium Cotton T-Shirt)', 'ชิ้น', 29000, 13000, 85],
  ['JEANS-02', 'กางเกงยีนส์ขากระบอก (Straight Fit Denim)', 'ตัว', 59000, 28000, 42],
  ['BAG-03', 'กระเป๋าผ้าแคนวาส (Canvas Tote Bag)', 'ใบ', 19900, 8500, 120],
  ['CUP-04', 'แก้วสแตนเลสเก็บความเย็น 30oz (Thermal Tumbler)', 'ใบ', 35000, 16000, 18],
  ['CASE-05', 'เคสโทรศัพท์กันกระแทก (Shockproof Phone Case)', 'ชิ้น', 14900, 4500, 64],
  ['LAMP-06', 'โคมไฟตั้งโต๊ะ LED พับได้ (Foldable LED Desk Lamp) — ขายต่ำกว่าทุน', 'ชิ้น', 39000, 36000, 9],
  ['SOCK-07', 'ถุงเท้าข้อสั้น แพ็ก 3 คู่ (Ankle Socks 3-pack)', 'แพ็ก', 9900, null, 0],
];
const PLATFORMS = ['Shopee', 'Lazada', 'TikTok', 'LINE Shop'];
const rulesBase = demoFixture().rules.filter(r => !r.programId).map(r => ({ ...r, ...O, effectiveFrom: '2000-01-01T00:00:00.000Z' }));
const cost = (sku, unit) => unit == null ? null : { ...O, sku, version: 'v1', unitCostSatang: unit, effectiveFrom: '2000-01-01T00:00:00.000Z', verifiedBy: 'merchant', method: 'MERCHANT_CONFIRMED_UNIT_COST' };
function makeOrder(month, i) {
  const day = 1 + ((i * 9) % 28); const date = `${month}-${String(day).padStart(2, '0')}`;
  if (date > TODAY) return null;
  // Current month: every order has a cost (profit card populated). Older months keep the missing-cost SKU (incomplete-data warning state).
  const pick = PRODUCTS[i % PRODUCTS.length][4] == null && month === TODAY.slice(0, 7) ? PRODUCTS[(i + 2) % PRODUCTS.length] : PRODUCTS[i % PRODUCTS.length];
  const [sku, , , price, unit] = pick;
  const platform = PLATFORMS[i % PLATFORMS.length];
  const qty = 1 + (i % 3);
  const lossy = sku === 'LAMP-06' || i % 11 === 0; // heavy ads/discount => negative profit
  const sellerDiscount = lossy ? Math.round(price * qty * 0.25) : (i % 5 === 0 ? 1500 : 0);
  const revenue = price * qty - sellerDiscount;
  const input = {
    order: { ...O, platform, orderId: `${platform.slice(0, 2).toUpperCase()}-${month.replace('-', '')}-${String(i + 1).padStart(3, '0')}`, orderAt: `${date}T0${3 + (i % 6)}:15:00.000Z`, settlementStatus: i % 4 === 0 ? 'UNSETTLED' : 'SETTLED', feesConfirmed: i % 4 !== 0, ...(i % 4 !== 0 ? { payoutSatang: Math.round(revenue * 0.78) } : {}) },
    items: [{ ...O, lineId: '1', sku, quantity: qty, revenueSatang: revenue, buyerPaymentSatang: revenue, platformDiscountSatang: 0, sellerDiscountSatang: sellerDiscount, packagingSatang: 500 * qty, adsSatang: lossy ? 6000 : 1000, sellerShippingSatang: platform === 'LINE Shop' ? 3500 : 0 }],
    costs: unit == null ? [] : [cost(sku, unit)],
    rules: rulesBase, enrollments: [], fees: [],
  };
  return { input, result: { ...calculate(input), inputHash: 'qa' + month + i } };
}
const monthCache = new Map();
function monthOrders(month) {
  if (EMPTY) return [];
  if (!monthCache.has(month)) {
    const n = month === TODAY.slice(0, 7) ? 34 : 26 + (Number(month.slice(5)) % 5) * 3;
    monthCache.set(month, Array.from({ length: n }, (_, i) => makeOrder(month, i)).filter(Boolean));
  }
  return monthCache.get(month);
}
function dashboard(month) {
  const rows = monthOrders(month).map(o => o.result);
  const complete = rows.filter(r => r.profitSatang != null);
  const sum = k => rows.reduce((a, r) => a + (r[k] ?? 0), 0);
  const rev = sum('revenueSatang'), profit = complete.length ? complete.reduce((a, r) => a + r.profitSatang, 0) : null;
  return { totalOrders: rows.length, completeOrders: complete.length, incompleteOrders: rows.length - complete.length, revenueSatang: rev, feeSatang: sum('feeSatang'), profitSatang: profit, marginPct: profit == null || !rev ? null : Math.round(profit / rev * 1000) / 10, ttrPct: null, dataOrigin: 'REAL', results: rows };
}
function catalog() {
  if (EMPTY) return [];
  return PRODUCTS.map(([sku, name, unitName, price, unit, quantity], i) => ({ ...O, sku, name, unit: unitName, sellingPriceSatang: price, cost: cost(sku, unit), quantity, profitSatang: unit == null ? null : price - unit - Math.round(price * 0.2) - 500, dateAdded: `2026-10-${String(15 - i).padStart(2, '0')}` }));
}
const findOrder = key => { for (const m of monthCache.values()) { const o = m.find(x => x.result.orderId === key || x.result.orderId === decodeURIComponent(key)); if (o) return o; } return null; };
const jobs = EMPTY ? [] : [
  { id: 'job-1', kind: 'orders', fileName: 'shopee-orders-2026-10.csv', status: 'COMPLETED', accepted: 128, duplicate: 3, rejected: 2, conflict: 1, errors: [{ row: 14, field: 'orderAt', code: 'INVALID_INPUT' }, { row: 52, field: 'sku', code: 'UNKNOWN_SKU' }] },
  { id: 'job-2', kind: 'costs', fileName: 'costs.csv', status: 'COMPLETED', accepted: 7, duplicate: 0, rejected: 0, conflict: 0 },
  { id: 'job-3', kind: 'fees', fileName: 'lazada-fees-sep.xlsx', status: 'FAILED', error: 'HEADER', accepted: 0, rejected: 0 },
  { id: 'rcpt-1', kind: 'receipt', fileName: 'receipt-oct-12.jpg', status: 'REVIEW', totalsMatch: false, draft: { date: '2026-10-12', totalTHB: '1,480.00', items: [{ name: 'กล่องพัสดุ ขนาด D', quantity: 100, unit: 'ใบ', lineTotalTHB: '780.00' }, { name: 'เทปกาว OPP', quantity: 10, unit: 'ม้วน', lineTotalTHB: '650.00' }] } },
  { id: 'rcpt-2', kind: 'receipt', fileName: 'receipt-oct-02.png', status: 'CONFIRMED', totalsMatch: true, draft: { date: '2026-10-02', totalTHB: '13,000.00', items: [{ name: 'เสื้อยืดคอตตอน', quantity: 100, unit: 'ชิ้น', lineTotalTHB: '13,000.00' }] } },
];
const conflicts = EMPTY ? [] : [{ id: 'cf-1', orderId: 'SH-202610-005', key: 'Shopee#SH-202610-005', existing: { revenueSatang: 29000, quantity: 1 }, incoming: { revenueSatang: 27500, quantity: 1 } }];
const feeRules = [
  ...rulesBase.map((r, i) => ({ ...r, status: i ? 'VERIFIED_FOR_ESTIMATE' : 'MOCK', sourceUrl: 'https://example.invalid/fee-' + r.id })),
  { ...rulesBase[0], id: 'tiktok-commission', type: 'COMMISSION', rateBps: 600, status: 'CONFLICTING', conflictReason: 'แหล่งข้อมูลสองแหล่งระบุอัตราไม่ตรงกัน', sourceUrl: 'https://example.invalid/tiktok' },
];
const enrollments = [{ ...O, id: 'enr-1', programId: 'FREE-SHIP-XTRA', effectiveFrom: '2026-09-01T00:00:00.000Z', skus: ['TSHIRT-01', 'JEANS-02'], verifiedBy: 'merchant' }];
const marketplace = { version: 'qa-2026-10', reviewedAt: '2026-10-01', platforms: [
  { id: 'shopee', name: 'Shopee', categories: [{ id: 'general', name: 'ทั่วไป' }, { id: 'fashion', name: 'แฟชั่น' }], campaigns: [{ id: 'fsx', name: 'Free Shipping Xtra', sourceUrl: 'https://example.invalid/fsx', note: 'mock', effectiveFrom: '2026-01-01' }] },
  { id: 'lazada', name: 'Lazada', categories: [{ id: 'general', name: 'ทั่วไป' }], campaigns: [] },
  { id: 'tiktok', name: 'TikTok Shop', categories: [{ id: 'general', name: 'ทั่วไป' }], campaigns: [] },
] };
const stores = [{ id: 'qa-store', name: 'ร้านคุณมะลิ (QA mock)', personal: true, dataOrigin: 'REAL' }, { id: 'demo-mock', name: 'ร้านตัวอย่าง', dataOrigin: 'MOCK' }];

// ---------- mock API ----------
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, POST, PUT, OPTIONS', 'access-control-max-age': '600' };
const json = (res, status, body) => res.writeHead(status, { ...CORS, 'content-type': 'application/json' }).end(JSON.stringify(body));
function route(method, path, q, body) {
  if (path === '/dev/login' || path === '/demo/session') return [200, { accessToken: 'qa-token', expiresAt: Math.floor(Date.now() / 1000) + 3600 }];
  if (path === '/me/stores') return [200, { items: stores }];
  if (path === '/me/store') return [200, stores[0]];
  const m = path.match(/^\/stores\/([^/]+)(\/.*)?$/); if (!m) return null;
  const rest = m[2] ?? '/'; const month = q.get('month') ?? TODAY.slice(0, 7);
  if (rest === '/dashboard') return [200, dashboard(month)];
  if (rest === '/products' && method === 'GET') return [200, { items: catalog() }];
  if (rest === '/products' && method === 'POST') return [200, { ...O, ...body, cost: null }];
  if (/^\/products\/[^/]+\/cost-versions$/.test(rest)) return [200, cost(body?.sku ?? 'X', body?.unitCostSatang ?? 0)];
  if (rest === '/orders') return [200, { items: monthOrders(month).map(o => ({ key: o.result.orderId, orderId: o.result.orderId, platform: o.result.platform, orderAt: o.result.orderAt, feesConfirmed: o.input.order.feesConfirmed })) }];
  let mm = rest.match(/^\/orders\/([^/]+)\/(calculation|settle)$/);
  if (mm) { const o = findOrder(mm[1]) ?? monthOrders(TODAY.slice(0, 7))[0]; return o ? [200, o.result] : [404, { error: 'NOT_FOUND' }]; }
  if (rest === '/reconciliation') return [200, { items: monthOrders(month).slice(0, 12).map((o, i) => { const est = o.result.feeSatang, act = o.input.order.feesConfirmed ? est + (i % 3 === 0 ? 450 : 0) : null; return { key: o.result.orderId, orderId: o.result.orderId, estimatedFeeSatang: est, actualFeeSatang: act, varianceSatang: act == null ? null : act - est, payoutReconciled: act == null ? null : i % 3 !== 0 }; }) }];
  if (rest === '/jobs') return [200, { items: jobs }];
  if (rest === '/conflicts') return [200, { items: conflicts }];
  if (rest === '/fee-rules') return [200, { items: feeRules }];
  if (rest === '/enrollments') return [200, { items: enrollments }];
  if (rest === '/integrations') return [200, { line: { configured: false } }];
  if (rest === '/line/link') return [200, { code: 'QA-123456', instruction: 'ส่งรหัสนี้ใน LINE OA ภายใน 10 นาที' }];
  if (rest === '/assistant-options') return [200, marketplace];
  if (rest === '/assistant' || rest === '/assistant-scenarios') { const o = monthOrders(TODAY.slice(0, 7))[1]; return [200, { answer: 'เดือนนี้กำไรสุทธิเป็นบวก แต่ SKU LAMP-06 ขาดทุนต่อชิ้นเพราะต้นทุนสูงกว่าราคาหลังหักค่าธรรมเนียม (คำตอบจำลองจาก QA mock)', provider: 'qa-mock', result: o?.result }]; }
  if (rest === '/simulations') { const o = monthOrders(TODAY.slice(0, 7)).find(x => x.input.items[0].sku === body?.sku) ?? monthOrders(TODAY.slice(0, 7))[0]; if (!o) return [404, { error: 'NO_ORDERS' }]; const price = body?.priceSatang ?? o.input.items[0].revenueSatang; const be = breakEven(o.input); return [200, { baseline: o.result, scenario: simulate(o.input, price), breakEven: { priceSatang: be.priceSatang, rangeChecked: be.rangeChecked }, incrementalTtrPercentagePoints: null }]; }
  if (rest === '/imports' || rest === '/receipts') return [200, { id: 'up-1', uploadUrl: 'http://localhost:4051/dev/upload/up-1', contentType: 'text/csv' }];
  if (/^\/(imports|receipts|conflicts)\//.test(rest)) return [200, { ok: true, downloadUrl: 'http://localhost:4051/dev/download/x.csv' }];
  if (rest === '/reports/export') return [200, { downloadUrl: 'http://localhost:4051/dev/download/report.csv' }];
  if (rest === '/' && method === 'POST') return [200, { ok: true }];
  return null;
}
const api = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS).end(); return; }
  let raw = ''; req.on('data', c => raw += c); req.on('end', () => {
    const u = new URL(req.url, 'http://x'); let body; try { body = raw ? JSON.parse(raw) : undefined; } catch { body = undefined; }
    if (u.pathname.startsWith('/dev/')) { res.writeHead(200, { ...CORS, 'content-type': 'text/csv' }).end('a,b\n1,2\n'); return; }
    let out = null; try { out = route(req.method, u.pathname, u.searchParams, body); } catch (e) { console.error(e); out = [500, { error: 'MOCK_ERROR', detail: String(e) }]; }
    if (!out) {
      const line = `${new Date().toISOString()} ${req.method} ${u.pathname}${u.search}\n`; appendFileSync(UNKNOWN_LOG, line); console.warn('UNKNOWN', line.trim());
      out = [200, req.method === 'GET' ? { items: [] } : { ok: true }];
    }
    json(res, ...out);
  });
});
api.listen(4051, '127.0.0.1', () => console.log('mockapi http://127.0.0.1:4051 (localhost:4051)', EMPTY ? '[EMPTY]' : ''));
// localhost may resolve to ::1 first on Windows; answer there too (loopback only).
const api6 = http.createServer((q, r) => api.emit('request', q, r)); api6.on('error', () => {}); api6.listen(4051, '::1');
