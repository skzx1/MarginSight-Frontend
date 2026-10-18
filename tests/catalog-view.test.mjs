import test from 'node:test';
import assert from 'node:assert/strict';
import { hasListedPrice, selectCatalog, searchParts } from '../web/src/lib/catalog-view.ts';

const product = (sku, fields = {}) => ({ sku, name: sku, unit: 'ชิ้น', dataOrigin: 'MOCK', sourceRef: 'catalog-view-test', ...fields });
const products = [
  product('UNKNOWN', { name: 'แก้วที่ยังไม่มีข้อมูล' }),
  product('FREE', { name: 'เสื้อ Cotton ฟรี', sellingPriceSatang: 0, quantity: 0, profitSatang: 0, cost: { unitCostSatang: 0 }, dateAdded: '2026-10-02' }),
  product('COTTON', { name: 'เสื้อ Cotton สีขาว', sellingPriceSatang: 29000, quantity: 50, profitSatang: 900, cost: { unitCostSatang: 13000 }, dateAdded: '2026-10-17' }),
  product('LOSS', { name: 'กางเกง', sellingPriceSatang: 59000, quantity: 2, profitSatang: -1410, dateAdded: '2026-10-16' }),
];

test('price filters distinguish a recorded zero price from missing data', () => {
  assert.equal(hasListedPrice(products[1]), true);
  assert.deepEqual(selectCatalog(products, '', 'unlisted', false, 'dateDesc').map(p => p.sku), ['UNKNOWN']);
  assert.equal(selectCatalog(products, '', 'listed', false, 'dateDesc').length, 3);
  assert.deepEqual(selectCatalog(products, '', 'listed', true, 'dateDesc').map(p => p.sku), ['LOSS']);
});

test('search combines with price and cost filters and never changes recorded fields or input order', () => {
  const before = structuredClone(products);
  assert.deepEqual(selectCatalog(products, '  COTTON  ', 'listed', false, 'priceAsc').map(p => p.sku), ['FREE', 'COTTON']);
  assert.deepEqual(selectCatalog(products, 'UNKNOWN', 'all', true, 'dateDesc').map(p => p.sku), ['UNKNOWN']);
  assert.deepEqual(products, before);
});

test('unknown numeric and date values sort last in both directions, while zero and losses retain their order', () => {
  assert.deepEqual(selectCatalog(products, '', 'all', false, 'profitAsc').map(p => p.sku), ['LOSS', 'FREE', 'COTTON', 'UNKNOWN']);
  assert.deepEqual(selectCatalog(products, '', 'all', false, 'profitDesc').map(p => p.sku), ['COTTON', 'FREE', 'LOSS', 'UNKNOWN']);
  for (const column of ['price', 'cost', 'qty', 'profit', 'date']) {
    for (const direction of ['Asc', 'Desc']) {
      const selected = selectCatalog(products, '', 'all', false, column + direction);
      if (column === 'cost') assert.deepEqual(new Set(selected.slice(-2).map(p => p.sku)), new Set(['UNKNOWN', 'LOSS']));
      else assert.equal(selected.at(-1).sku, 'UNKNOWN');
    }
  }
});

test('search highlights every literal match without parsing user text as markup or a regular expression', () => {
  assert.deepEqual(searchParts('Cotton cotton', 'COTTON'), [{ text: 'Cotton', match: true }, { text: ' ', match: false }, { text: 'cotton', match: true }]);
  assert.deepEqual(searchParts('<shirt>[01]', '[01]'), [{ text: '<shirt>', match: false }, { text: '[01]', match: true }]);
  assert.deepEqual(searchParts('เสื้อสีขาว', 'สีขาว').filter(part => part.match).map(part => part.text), ['สีขาว']);
});
