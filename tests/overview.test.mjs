import test from 'node:test';
import assert from 'node:assert/strict';
import { OVERVIEW_MOCK_ORDERS, orderDateTime, ordersInPeriod, periodBounds, periodMonths, summarizeOrders, channelSummaries } from '../web/src/lib/overview-data.ts';

test('all synthetic order timestamps render Bangkok 24-hour times, including midnight rollover', () => {
  for (const order of OVERVIEW_MOCK_ORDERS) {
    assert.ok(Number.isFinite(Date.parse(order.orderAt)), order.orderId);
    assert.match(orderDateTime(order.orderAt), /^2026-10-\d{2} ([01]\d|2[0-3]):[0-5]\d$/);
    assert.equal(order.revenueSatang, order.productCostSatang + order.platformFeeSatang + order.shippingSatang + order.otherCostSatang + order.profitSatang);
  }
  assert.equal(orderDateTime(OVERVIEW_MOCK_ORDERS.find(order => order.orderId === '#TT-31892').orderAt), '2026-10-17 02:30');
  assert.equal(orderDateTime('2026-10-17T17:00:00Z'), '2026-10-18 00:00');
});

test('one Bangkok period includes local midnight and uses a Monday calendar week', () => {
  const select = type => ordersInPeriod(OVERVIEW_MOCK_ORDERS, { type, start: '', end: '' }, '2026-10-17');
  assert.equal(select('today').length, 3);
  assert.equal(select('week').length, 7);
  assert.equal(select('month').length, 10);
  assert.deepEqual(periodBounds({ type: 'week', start: '', end: '' }, '2026-10-17'), { start: '2026-10-12', end: '2026-10-17' });
  const range = { type: 'custom', start: '2026-10-17', end: '2026-10-17' };
  assert.equal(ordersInPeriod(OVERVIEW_MOCK_ORDERS, range, '2026-10-17').length, 3);
  assert.deepEqual(periodMonths({ type: 'custom', start: '2025-12-31', end: '2026-02-01' }, '2026-10-17'), ['2025-12', '2026-01', '2026-02']);
  for (const bad of [{ start: '2026-02-30', end: '2026-03-01' }, { start: '2026-10-18', end: '2026-10-17' }, { start: '', end: '' }]) {
    assert.equal(periodBounds({ ...bad, type: 'custom' }, '2026-10-17'), null);
  }
});

test('summary completeness and channel totals use the actual order set', () => {
  const summary = summarizeOrders(OVERVIEW_MOCK_ORDERS);
  assert.equal(summary.totalOrders, 10);
  assert.equal(summary.completeOrders, 10);
  assert.equal(summary.revenueSatang, 472600);
  assert.equal(summary.profitSatang, 180830);
  assert.equal(summary.totalCostsSatang + summary.profitSatang, summary.revenueSatang);
  const channels = channelSummaries(OVERVIEW_MOCK_ORDERS);
  assert.equal(channels.reduce((sum, row) => sum + row.profitSatang, 0), summary.profitSatang);
  assert.equal(channels.reduce((sum, row) => sum + row.revenueSatang, 0), summary.revenueSatang);
  assert.ok(channels[0].profitSatang >= channels[1].profitSatang);
});

test('missing costs stay unknown and confirmed zero costs stay complete', () => {
  const orders = OVERVIEW_MOCK_ORDERS.map((order, index) => index < 3 ? { ...order, productCostSatang: null, profitSatang: null, status: 'INCOMPLETE' } : order);
  const summary = summarizeOrders(orders);
  assert.equal(summary.completeOrders, 7);
  assert.equal(summary.missingCostOrders, 3);
  assert.equal(summary.profitSatang, null);
  assert.equal(summary.totalCostsSatang, null);
  assert.equal(summary.marginPct, null);
  const zero = summarizeOrders([{ ...OVERVIEW_MOCK_ORDERS[0], productCostSatang: 0, profitSatang: 48200 }]);
  assert.equal(zero.completeOrders, 1);
  assert.equal(zero.missingCostOrders, 0);
});
