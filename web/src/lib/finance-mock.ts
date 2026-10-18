import { calculate, demoFixture } from './domain.generated';
import { INITIAL_MOCK_PRODUCTS } from './mock-data';
import { FINANCE_CHANNELS, fromCalculation, type FinanceOrder } from './finance-data';

/** Synthetic finance demonstration, isolated from API orders and the Overview page. */
export function financeMock(today: string): FinanceOrder[] {
  const rows: FinanceOrder[] = [];
  for (let day = 0; day < 62; day++) {
    for (let channel = 0; channel < FINANCE_CHANNELS.length; channel++) {
      const date = new Date(Date.parse(today) - day * 86400000).toISOString().slice(0, 10);
      const index = Math.floor(Date.parse(date) / 86400000) * 5 + channel, product = INITIAL_MOCK_PRODUCTS[index % INITIAL_MOCK_PRODUCTS.length];
      const origin = { dataOrigin: 'MOCK' as const, sourceRef: 'finance-synthetic-v1' };
      const status = index % 29 === 0 ? 'RETURNED' : index % 23 === 0 ? 'CANCELLED' : index % 17 === 0 ? 'PENDING' : 'COMPLETED';
      const booked = status === 'COMPLETED';
      const gross = booked || status === 'RETURNED' ? product.sellingPriceSatang ?? 14900 : 0;
      const reduction = status === 'RETURNED' ? gross : booked && index % 9 === 0 ? 1500 : 0;
      const revenue = gross - reduction, fee = booked && channel < 3 ? [2400, 3100, 1800][channel] : 0;
      const result = calculate({
        order: { ...origin, orderId: `FIN-${date.replaceAll('-', '')}-${channel + 1}`, platform: FINANCE_CHANNELS[channel], orderAt: `${date}T06:30:00.000Z`, settlementStatus: 'SETTLED', feesConfirmed: true },
        items: [{ ...origin, lineId: '1', sku: product.sku, quantity: booked ? 1 : 0, revenueSatang: revenue, buyerPaymentSatang: revenue,
          platformDiscountSatang: 0, sellerDiscountSatang: reduction, packagingSatang: booked ? 500 : 0,
          adsSatang: booked && channel < 3 ? 1200 : 0, sellerShippingSatang: booked && channel < 4 ? 3000 : 0 }],
        costs: product.cost ? [{ ...product.cost, effectiveFrom: '2000-01-01T00:00:00.000Z' }] : [],
        rules: demoFixture().rules.filter(r => !r.programId).map((r, i) => ({ ...r, ...origin, scope: 'PER_ORDER', rateBps: 0, fixedSatang: i === 0 ? fee : 0, effectiveFrom: '2000-01-01T00:00:00.000Z' })),
        enrollments: [], fees: [{ ...origin, feeId: 'recorded-fee', type: 'COMMISSION', amountSatang: fee, scope: 'PER_ORDER', effectiveAt: `${date}T06:30:00.000Z` }]
      });
      rows.push({ ...fromCalculation(result), grossSatang: gross, reductionsSatang: reduction, commerceStatus: status,
        productName: product.name, productProfits: booked ? [{ sku: product.sku, name: product.name, profitSatang: result.profitSatang }] : [] });
    }
  }
  return rows;
}
