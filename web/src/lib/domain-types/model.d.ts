export type Origin = 'MOCK' | 'REAL';
export interface Evidence {
    dataOrigin: Origin;
    sourceRef: string;
    observedAt?: string;
    importId?: string;
    createdAt?: string;
}
export interface Product extends Evidence {
    sku: string;
    name: string;
    unit: string;
    categoryId?: string;
}
export interface Cost extends Evidence {
    sku: string;
    version: string;
    unitCostSatang: number;
    effectiveFrom: string;
    effectiveTo?: string;
    verifiedBy: string;
    method: 'MERCHANT_CONFIRMED_UNIT_COST';
}
export interface Item extends Evidence {
    lineId: string;
    sku: string;
    quantity: number;
    revenueSatang: number;
    buyerPaymentSatang: number;
    buyerShippingSatang?: number;
    platformDiscountSatang: number;
    sellerDiscountSatang: number;
    packagingSatang: number;
    adsSatang: number;
    sellerShippingSatang: number;
}
export interface Order extends Evidence {
    platform: string;
    orderId: string;
    orderAt: string;
    settlementStatus: 'UNSETTLED' | 'SETTLED';
    feesConfirmed: boolean;
    payoutSatang?: number;
    ledgerVersion?: number;
}
export interface Fee extends Evidence {
    feeId: string;
    type: string;
    amountSatang: number;
    scope: 'PER_ITEM' | 'PER_ORDER' | 'PER_MONTH';
    sku?: string;
    effectiveAt: string;
}
export interface Adjustment extends Evidence {
    transactionId: string;
    revenueDeltaSatang: number;
    cogsDeltaSatang: number;
    reason: string;
    effectiveAt: string;
}
export interface Rule extends Evidence {
    id: string;
    version: string;
    type: string;
    scope: 'PER_ITEM' | 'PER_ORDER' | 'PER_MONTH';
    base: 'REVENUE' | 'BUYER_PLUS_PLATFORM' | 'BUYER_PLUS_PLATFORM_PLUS_SHIPPING';
    rateBps: number;
    fixedSatang: number;
    minSatang?: number;
    maxSatang?: number;
    vat: 'INCLUDED' | 'EXCLUDED' | 'UNKNOWN';
    status: 'MOCK' | 'VERIFIED_FOR_ESTIMATE' | 'CONFLICTING' | 'UNVERIFIED';
    effectiveFrom: string;
    effectiveTo?: string;
    programId?: string;
    sku?: string;
    replacesType?: string;
    sourceUrl: string;
    conflictReason?: string;
}
export interface Enrollment extends Evidence {
    id: string;
    programId: string;
    effectiveFrom: string;
    effectiveTo?: string;
    skus: string[];
    verifiedBy: string;
}
export interface CalculationInput {
    order: Order;
    items: Item[];
    costs: Cost[];
    rules: Rule[];
    enrollments: Enrollment[];
    fees: Fee[];
    adjustments?: Adjustment[];
    simulation?: boolean;
}
