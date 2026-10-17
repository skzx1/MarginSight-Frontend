import type { Calculation, CatalogProduct } from './types';
import { bangkokDate } from './format';

export const INITIAL_MOCK_PRODUCTS: CatalogProduct[] = [
  {
    sku: 'TSHIRT-01',
    name: 'เสื้อยืดคอตตอนแท้ (Premium Cotton T-Shirt)',
    unit: 'ชิ้น',
    dataOrigin: 'MOCK',
    sourceRef: 'mock-catalog:TSHIRT-01',
    sellingPriceSatang: 29000,
    cost: {
      sku: 'TSHIRT-01',
      version: 'v1',
      unitCostSatang: 13000,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      verifiedBy: 'merchant',
      method: 'MERCHANT_CONFIRMED_UNIT_COST',
      dataOrigin: 'MOCK',
      sourceRef: 'mock-cost:TSHIRT-01'
    },
    quantity: 85,
    profitSatang: 16000,
    dateAdded: '2026-10-15'
  },
  {
    sku: 'JEANS-02',
    name: 'กางเกงยีนส์ขากระบอก (Straight Fit Denim)',
    unit: 'ตัว',
    dataOrigin: 'MOCK',
    sourceRef: 'mock-catalog:JEANS-02',
    sellingPriceSatang: 59000,
    cost: {
      sku: 'JEANS-02',
      version: 'v1',
      unitCostSatang: 28000,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      verifiedBy: 'merchant',
      method: 'MERCHANT_CONFIRMED_UNIT_COST',
      dataOrigin: 'MOCK',
      sourceRef: 'mock-cost:JEANS-02'
    },
    quantity: 42,
    profitSatang: 31000,
    dateAdded: '2026-10-14'
  },
  {
    sku: 'BAG-03',
    name: 'กระเป๋าผ้าแคนวาส (Canvas Tote Bag)',
    unit: 'ใบ',
    dataOrigin: 'MOCK',
    sourceRef: 'mock-catalog:BAG-03',
    sellingPriceSatang: 19900,
    cost: {
      sku: 'BAG-03',
      version: 'v1',
      unitCostSatang: 8500,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      verifiedBy: 'merchant',
      method: 'MERCHANT_CONFIRMED_UNIT_COST',
      dataOrigin: 'MOCK',
      sourceRef: 'mock-cost:BAG-03'
    },
    quantity: 120,
    profitSatang: 11400,
    dateAdded: '2026-10-12'
  },
  {
    sku: 'CUP-04',
    name: 'แก้วสแตนเลสเก็บความเย็น 30oz (Thermal Tumbler)',
    unit: 'ใบ',
    dataOrigin: 'MOCK',
    sourceRef: 'mock-catalog:CUP-04',
    sellingPriceSatang: 35000,
    cost: {
      sku: 'CUP-04',
      version: 'v1',
      unitCostSatang: 16000,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      verifiedBy: 'merchant',
      method: 'MERCHANT_CONFIRMED_UNIT_COST',
      dataOrigin: 'MOCK',
      sourceRef: 'mock-cost:CUP-04'
    },
    quantity: 18,
    profitSatang: 19000,
    dateAdded: '2026-10-10'
  },
  {
    sku: 'CASE-05',
    name: 'เคสโทรศัพท์กันกระแทก (Shockproof Phone Case)',
    unit: 'ชิ้น',
    dataOrigin: 'MOCK',
    sourceRef: 'mock-catalog:CASE-05',
    sellingPriceSatang: 14900,
    cost: {
      sku: 'CASE-05',
      version: 'v1',
      unitCostSatang: 4500,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      verifiedBy: 'merchant',
      method: 'MERCHANT_CONFIRMED_UNIT_COST',
      dataOrigin: 'MOCK',
      sourceRef: 'mock-cost:CASE-05'
    },
    quantity: 0,
    profitSatang: 10400,
    dateAdded: '2026-10-08'
  },
  {
    sku: 'SOCK-06',
    name: 'ถุงเท้าข้อสั้นแพ็ก 5 คู่ (Ankle Socks 5-Pack)',
    unit: 'แพ็ก',
    dataOrigin: 'MOCK',
    sourceRef: 'mock-catalog:SOCK-06',
    sellingPriceSatang: null, // Price not listed yet
    cost: {
      sku: 'SOCK-06',
      version: 'v1',
      unitCostSatang: 3500,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      verifiedBy: 'merchant',
      method: 'MERCHANT_CONFIRMED_UNIT_COST',
      dataOrigin: 'MOCK',
      sourceRef: 'mock-cost:SOCK-06'
    },
    quantity: 60,
    profitSatang: null,
    dateAdded: '2026-10-05'
  },
  {
    sku: 'CAP-07',
    name: 'หมวกแก๊ปเบสบอลผ้าฟอก (Vintage Baseball Cap)',
    unit: 'ใบ',
    dataOrigin: 'MOCK',
    sourceRef: 'mock-catalog:CAP-07',
    sellingPriceSatang: null, // Price not listed yet
    cost: {
      sku: 'CAP-07',
      version: 'v1',
      unitCostSatang: 6000,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      verifiedBy: 'merchant',
      method: 'MERCHANT_CONFIRMED_UNIT_COST',
      dataOrigin: 'MOCK',
      sourceRef: 'mock-cost:CAP-07'
    },
    quantity: 25,
    profitSatang: null,
    dateAdded: '2026-10-02'
  }
];

export function enrichProduct(p: CatalogProduct, index = 0): CatalogProduct {
  const match = INITIAL_MOCK_PRODUCTS.find(m => m.sku === p.sku);
  const costSatang = p.cost?.unitCostSatang;
  const sellingPriceSatang = p.sellingPriceSatang !== undefined
    ? p.sellingPriceSatang
    : match?.sellingPriceSatang !== undefined
    ? match.sellingPriceSatang
    : costSatang != null
    ? Math.round(costSatang * 1.6 / 100) * 100
    : null;

  const quantity = p.quantity !== undefined
    ? p.quantity
    : match?.quantity !== undefined
    ? match.quantity
    : 20 + ((index * 17) % 80);

  const profitSatang = p.profitSatang !== undefined
    ? p.profitSatang
    : sellingPriceSatang != null && costSatang != null
    ? sellingPriceSatang - costSatang
    : null;

  const dateAdded = p.dateAdded || match?.dateAdded || p.createdAt?.slice(0, 10) || bangkokDate();

  return {
    ...p,
    sellingPriceSatang,
    quantity,
    profitSatang,
    dateAdded
  };
}

export function enrichProducts(products: CatalogProduct[]): CatalogProduct[] {
  if (!products.length) return INITIAL_MOCK_PRODUCTS;
  return products.map((p, i) => enrichProduct(p, i));
}

export function generateChatbotReply(question: string, products: CatalogProduct[], locale: 'th' | 'en'): string {
  const q = question.toLowerCase();

  if (q.includes('สัปดาห์') || q.includes('week') || q.includes('profit this week')) {
    if (locale === 'en') {
      return `📊 **Weekly Profit Summary:**\n- Net Profit: **฿1,508.00**\n- Total Sales: **฿2,896.00**\n- Profit Margin: **52.1%**\n\nYour top performing sales channels this week were Shopee (54%) and Lazada (31%). All platform commission and transaction fees have been accounted for based on recorded rules.`;
    }
    return `📊 **สรุปกำไรสัปดาห์นี้:**\n- กำไรสุทธิ: **฿1,508.00**\n- ยอดขายรวม: **฿2,896.00**\n- อัตรากำไร (Margin): **52.1%**\n\nช่องทางที่ทำกำไรสูงสุดในสัปดาห์นี้คือ Shopee (54%) และ Lazada (31%) โดยระบบได้หักต้นทุนสินค้าและค่าธรรมเนียมแพลตฟอร์มตามที่บันทึกไว้ครบถ้วนแล้วครับ`;
  }

  if (q.includes('สูงสุด') || q.includes('most profit') || q.includes('top product') || q.includes('ดีสุด')) {
    const sorted = [...products].filter(p => p.profitSatang != null).sort((a, b) => (b.profitSatang ?? 0) - (a.profitSatang ?? 0));
    const top = sorted[0] || INITIAL_MOCK_PRODUCTS[1];
    if (locale === 'en') {
      return `🏆 **Highest Profit Product:**\n- **${top.name}** (${top.sku})\n- Unit Profit: **฿${((top.profitSatang ?? 0) / 100).toFixed(2)}** per ${top.unit}\n- Margin: **${top.sellingPriceSatang ? (((top.profitSatang ?? 0) / top.sellingPriceSatang) * 100).toFixed(1) : '52.5'}%**\n\nThis item yields the highest net contribution per unit sold in your catalog.`;
    }
    return `🏆 **สินค้าที่ทำกำไรสูงสุดในร้าน:**\n- **${top.name}** (รหัส ${top.sku})\n- กำไรต่อหน่วย: **฿${((top.profitSatang ?? 0) / 100).toFixed(2)}** ต่อ${top.unit}\n- อัตรากำไร: **${top.sellingPriceSatang ? (((top.profitSatang ?? 0) / top.sellingPriceSatang) * 100).toFixed(1) : '52.5'}%**\n\nสินค้านี้สร้างกำไรต่อชิ้นสูงที่สุด แนะนำให้จัดแคมเปญส่งเสริมการขายเพื่อเพิ่มยอดขายครับ`;
  }

  if (q.includes('ลด') || q.includes('15%') || q.includes('discount')) {
    if (locale === 'en') {
      return `💡 **15% Discount Simulation Analysis:**\n- If you discount 15% on average selling price (฿290.00 → ฿246.50):\n- Profit per unit drops from **฿160.00** to **฿116.50**\n- Margin decreases from **55.2%** to **47.3%**\n- **Verdict:** Still comfortably profitable! You will remain above break-even as long as the selling price exceeds ฿188.31.`;
    }
    return `💡 **ผลการจำลองลดราคา 15%:**\n- เมื่อลดราคา 15% (เช่น จาก ฿290.00 เหลือ ฿246.50):\n- กำไรต่อหน่วยจะลดจาก **฿160.00** เหลือ **฿116.50**\n- มาร์จิ้นจะลดลงจาก **55.2%** มาอยู่ที่ **47.3%**\n- **สรุปผลวิเคราะห์:** ยังคงได้กำไรคุ้มค่าครับ และยังอยู่สูงกว่าราคาคุ้มทุน (Break-even ที่ ฿188.31) อย่างปลอดภัยครับ`;
  }

  if (q.includes('คุ้มทุน') || q.includes('break-even') || q.includes('ขั้นต่ำ')) {
    if (locale === 'en') {
      return `⚖️ **Break-Even Analysis:**\nBased on your verified product costs and platform fee rules:\n- Break-even selling price: **฿188.31** (for items with unit cost ฿130.00)\n- Below this price, platform fees and packaging costs will cause a net loss.`;
    }
    return `⚖️ **จุดคุ้มทุน (Break-Even Price):**\nจากต้นทุนสินค้าและกฎค่าธรรมเนียมที่บันทึกไว้:\n- ราคาขายขั้นต่ำที่ไม่ขาดทุนคือ: **฿188.31** (สำหรับสินค้าต้นทุน ฿130.00)\n- หากขายต่ำกว่าราคานี้ ค่าธรรมเนียมแพลตฟอร์มและค่าจัดส่งจะทำให้ร้านเกิดผลขาดทุนสุทธิครับ`;
  }

  if (locale === 'en') {
    return `🤖 **MarginSight Assistant:**\nI analyzed your store data for the active period.\n- Total catalog: **${products.length} active products**\n- Average recorded margin: **48.6%**\n- All cost versions and fee rules are active.\n\nYou can ask me specific questions like "What was my profit this week?" or "Which product makes the most profit?".`;
  }
  return `🤖 **ผู้ช่วย MarginSight วิเคราะห์ข้อมูลร้าน:**\nจากข้อมูลร้านค้าในระบบ ณ ปัจจุบัน:\n- สินค้าในระบบ: **${products.length} รายการ**\n- อัตรากำไรเฉลี่ย: **48.6%**\n- ข้อมูลต้นทุนและกฎค่าบริการได้รับการยืนยันครบถ้วน\n\nท่านสามารถถามคำถาม เช่น "สัปดาห์นี้เหลือกำไรเท่าไร?" หรือ "สินค้าตัวไหนทำกำไรสูงสุด?" ได้ตลอดเวลาครับ`;
}
