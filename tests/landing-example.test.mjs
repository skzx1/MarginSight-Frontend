import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateExample, exampleDefaults, validateExample } from '../web/src/lib/landing-example.ts';
test('landing example reconciles and finds the safe price to the satang', () => {
  const { result, safePrice } = calculateExample(exampleDefaults);
  assert.equal(result.revenueSatang, 17000);
  assert.equal(result.feeSatang, 2550);
  assert.equal(result.profitSatang, -550);
  assert.equal(safePrice, 17647);
  assert.equal(result.revenueSatang - result.cogsSatang - result.sellerShippingSatang - result.feeSatang, result.profitSatang);
  assert.equal(calculateExample({ ...exampleDefaults, price: '176.46', discount: '0' }).result.profitSatang, -1);
  assert.equal(calculateExample({ ...exampleDefaults, price: '176.47', discount: '0' }).result.profitSatang, 0);
});
test('example rejects missing, negative, ambiguous, excessive and impossible inputs', () => {
  for (const value of ['', '-1', 'NaN', '1e4', '1,000', '1.001', '1000001']) {
    assert.ok(validateExample({ ...exampleDefaults, cost: value }).cost, value);
    assert.throws(() => calculateExample({ ...exampleDefaults, cost: value }));
  }
  assert.ok(validateExample({ ...exampleDefaults, price: '0' }).price);
  assert.ok(validateExample({ ...exampleDefaults, fee: '100' }).fee);
  assert.ok(validateExample({ ...exampleDefaults, discount: '100.01' }).discount);
});
test('zero costs, no discount and a full discount remain valid examples', () => {
  assert.equal(calculateExample({ ...exampleDefaults, discount: '0' }).result.profitSatang, 2000);
  assert.equal(calculateExample({ ...exampleDefaults, discount: '100' }).result.profitSatang, -15000);
  assert.equal(calculateExample({ ...exampleDefaults, cost: '0', shipping: '0', fee: '0', discount: '0' }).result.profitSatang, 20000);
});
