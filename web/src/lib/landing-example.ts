import { breakEven, simulate } from './domain.generated.js';
import type { CalculationInput } from './domain-types/model.js';
import { parseBaht } from './format.ts';

export const exampleDefaults = { price: '200', cost: '120', shipping: '30', fee: '15', discount: '15' };
export type ExampleFields = typeof exampleDefaults;
export type ExampleKey = keyof ExampleFields;
export function validateExample(fields: ExampleFields) {
  const errors: Partial<Record<ExampleKey, 'amount' | 'price' | 'percent'>> = {};
  for (const key of Object.keys(fields) as ExampleKey[]) {
    try {
      const value = parseBaht(fields[key]);
      if (key === 'fee' || key === 'discount') {
        if (value > (key === 'fee' ? 9999 : 10000)) errors[key] = 'percent';
      } else if (value > 100000000) errors[key] = 'amount';
      else if (key === 'price' && value === 0) errors[key] = 'price';
    } catch { errors[key] = key === 'fee' || key === 'discount' ? 'percent' : 'amount'; }
  }
  return errors;
}

/** UI input adapter. Financial results come from the Backend-owned engine. */
export function calculateExample(fields: ExampleFields) {
  if (Object.keys(validateExample(fields)).length) throw new Error('INVALID_EXAMPLE');
  const price = parseBaht(fields.price);
  const evidence = { dataOrigin: 'MOCK' as const, sourceRef: 'landing:merchant-entered-example' };
  const input: CalculationInput = {
    order: { ...evidence, platform: 'example', orderId: 'LANDING-EXAMPLE', orderAt: '2026-01-01T00:00:00.000Z', settlementStatus: 'UNSETTLED', feesConfirmed: false },
    items: [{ ...evidence, lineId: '1', sku: 'EXAMPLE', quantity: 1, revenueSatang: price, buyerPaymentSatang: price, platformDiscountSatang: 0, sellerDiscountSatang: 0, packagingSatang: 0, adsSatang: 0, sellerShippingSatang: parseBaht(fields.shipping) }],
    costs: [{ ...evidence, sku: 'EXAMPLE', version: 'example-v1', unitCostSatang: parseBaht(fields.cost), effectiveFrom: '2026-01-01T00:00:00.000Z', verifiedBy: 'example', method: 'MERCHANT_CONFIRMED_UNIT_COST' }],
    rules: [{ ...evidence, id: 'example-fee', version: 'example-v1', type: 'COMMISSION', scope: 'PER_ITEM', base: 'REVENUE', rateBps: parseBaht(fields.fee), fixedSatang: 0, vat: 'INCLUDED', status: 'MOCK', effectiveFrom: '2026-01-01T00:00:00.000Z', sourceUrl: 'mock://not-a-platform-rate' }],
    enrollments: [], fees: [],
  };
  // Convert the percentage control to the price-in-satang required by simulate.
  const discountedPrice = Math.round(price * (10000 - parseBaht(fields.discount)) / 10000);
  const result = simulate(input, discountedPrice);
  let safePrice: number | null = null;
  try { safePrice = breakEven(input).priceSatang; } catch { /* Outside the canonical solver's supported range. */ }
  return { result, safePrice };
}
