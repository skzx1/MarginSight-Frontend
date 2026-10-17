import test from 'node:test';
import assert from 'node:assert/strict';
import { dailySummaries, OVERVIEW_MOCK_ORDERS } from '../web/src/lib/overview-data.ts';

test('chart groups recorded satang by Bangkok day without fabricating empty dates', () => {
  const sample = OVERVIEW_MOCK_ORDERS[0];
  const result = dailySummaries([
    { ...sample, orderAt: '2026-10-17T17:00:00Z', revenueSatang: 10001, profitSatang: -55 },
    { ...sample, orderAt: '2026-10-18T01:00:00Z', revenueSatang: 201, profitSatang: 5 },
    { ...sample, orderAt: '2026-10-15T10:00:00Z', revenueSatang: 300, profitSatang: 20 },
  ]);
  assert.deepEqual(result.map(r => [r.day, r.revenueSatang, r.profitSatang]), [['2026-10-15', 300, 20], ['2026-10-18', 10202, -50]]);
});
test('incomplete evidence leaves a profit gap even when an amount was supplied', () => {
  const sample = OVERVIEW_MOCK_ORDERS[0];
  const [day] = dailySummaries([sample, { ...sample, productCostSatang: null, missingFields: ['cost:SKU'], profitSatang: 500 }]);
  assert.equal(day.profitSatang, null);
  assert.equal(day.revenueSatang, 116000);
  assert.deepEqual(dailySummaries([]), []);
});
