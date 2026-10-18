/**
 * Robust CSV utilities for Product Import
 * Follows RFC 4180 with Thai BOM support, flexible headers, and validation.
 */

import { bangkokDate, money } from './format.ts';
import type { CatalogProduct } from './types.ts';

export interface CsvProductRow {
  index: number; // 1-based data row index
  name: string;
  sellingPriceText: string;
  costText: string;
  quantityText: string;
  skuText: string;
  unitText: string;

  // Parsed / calculated fields
  sellingPriceSatang: number | null;
  costSatang: number | null;
  quantity: number | null;
  sku: string;
  unit: string;

  // Status and messages
  status: 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
  isShopDuplicate?: boolean;
  isInFileDuplicate?: boolean;
  duplicateOfIndex?: number;
}

export type DuplicatePolicy = 'skip' | 'update' | 'new';

export interface CsvParseResult {
  rows: CsvProductRow[];
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  fileError?: string;
  headersFound: string[];
  missingRequiredHeaders: string[];
}

/** Parse raw CSV text into array of rows following RFC 4180 */
export function parseCsvText(text: string): string[][] {
  // Strip UTF-8 BOM if present
  const content = text.startsWith('\uFEFF') ? text.slice(1) : text;
  if (!content.trim()) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = content.length;

  while (i < len) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && content[i + 1] === '"') {
          // Escaped quote: ""
          currentField += '"';
          i += 2;
          continue;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        currentRow.push(currentField);
        currentField = '';
        if (i + 1 < len && content[i + 1] === '\n') {
          i += 2;
        } else {
          i++;
        }
        // Only push non-empty rows
        if (currentRow.some(f => f.trim().length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        if (currentRow.some(f => f.trim().length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push last field & row if pending
  currentRow.push(currentField);
  if (currentRow.some(f => f.trim().length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

/** Clean numeric string like "1,200.50", "฿1,200", " 1,200 " */
export function cleanNumberText(raw: string): string {
  return raw
    .trim()
    .replace(/^฿\s*|^thb\s*/i, '')
    .replaceAll(',', '')
    .trim();
}

/** Parse THB amount to Satang, or null if empty / invalid */
export function parseAmountToSatang(raw: string): { satang: number | null; error?: string } {
  const cleaned = cleanNumberText(raw);
  if (!cleaned) return { satang: null };

  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    if (/^-\d+/.test(cleaned)) {
      return { satang: null, error: 'ต้องไม่เป็นค่าติดลบ' };
    }
    return { satang: null, error: 'ไม่ใช่ตัวเลขที่ถูกต้อง (เช่น 290 หรือ 290.50)' };
  }

  const [whole, fraction = ''] = cleaned.split('.');
  const satang = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(satang) || satang > 1e12) {
    return { satang: null, error: 'จำนวนเงินเกินขอบเขตที่รองรับ' };
  }

  return { satang };
}

/** Parse quantity string to integer, or null if empty / invalid */
export function parseQuantity(raw: string): { quantity: number | null; error?: string } {
  const cleaned = cleanNumberText(raw);
  if (!cleaned) return { quantity: 1 }; // Default to 1 if blank

  if (!/^\d+$/.test(cleaned)) {
    if (/^-\d+/.test(cleaned)) {
      return { quantity: null, error: 'จำนวนต้องไม่ติดลบ' };
    }
    return { quantity: null, error: 'จำนวนต้องเป็นตัวเลขจำนวนเต็ม (เช่น 1, 10, 50)' };
  }

  const val = Number(cleaned);
  if (!Number.isSafeInteger(val) || val > 1e6) {
    return { quantity: null, error: 'จำนวนเกินขอบเขตที่รองรับ (ไม่เกิน 1,000,000)' };
  }

  return { quantity: val };
}

export type KnownField = 'name' | 'sellingPrice' | 'quantity' | 'cost' | 'sku' | 'unit';

const HEADER_ALIASES: Record<KnownField, string[]> = {
  name: ['ชื่อสินค้า', 'ชื่อ', 'name', 'product_name', 'product name', 'item_name', 'item'],
  sellingPrice: ['ราคาขาย', 'ราคา', 'selling_price', 'selling price', 'price', 'sale_price'],
  quantity: ['จำนวน', 'สต็อก', 'จำนวนสต็อก', 'quantity', 'qty', 'stock', 'stock_qty', 'inventory'],
  cost: ['ต้นทุน', 'ต้นทุนสินค้า', 'cost', 'unit_cost', 'unit cost', 'cost_price'],
  sku: ['รหัสสินค้า', 'รหัส', 'sku', 'product_code', 'code'],
  unit: ['หน่วย', 'หน่วยขาย', 'unit', 'selling_unit']
};

export function matchHeaderField(headerText: string): KnownField | null {
  const normalized = headerText.trim().toLowerCase();
  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [KnownField, string[]][]) {
    if (aliases.includes(normalized)) return field;
  }
  return null;
}

/** Validate and process parsed CSV rows */
export function processProductCsv(
  csvRows: string[][],
  existingProducts: CatalogProduct[] = [],
  duplicatePolicy: DuplicatePolicy = 'skip'
): CsvParseResult {
  if (!csvRows.length) {
    return {
      rows: [],
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      fileError: 'ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ที่มีข้อมูลสินค้า',
      headersFound: [],
      missingRequiredHeaders: ['ชื่อสินค้า', 'ราคาขาย', 'จำนวน', 'ต้นทุน']
    };
  }

  const headerRow = csvRows[0];
  const fieldMapping = new Map<KnownField, number>();
  const headersFound: string[] = [];

  headerRow.forEach((col, idx) => {
    headersFound.push(col.trim());
    const matched = matchHeaderField(col);
    if (matched && !fieldMapping.has(matched)) {
      fieldMapping.set(matched, idx);
    }
  });

  const missingRequiredHeaders: string[] = [];
  if (!fieldMapping.has('name')) missingRequiredHeaders.push('ชื่อสินค้า (Name)');
  if (!fieldMapping.has('sellingPrice')) missingRequiredHeaders.push('ราคาขาย (Price)');

  if (missingRequiredHeaders.length > 0) {
    return {
      rows: [],
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      fileError: `ไม่พบคอลัมน์จำเป็น: ${missingRequiredHeaders.join(', ')} กรุณาตรวจสอบหัวตารางหรือใช้เทมเพลตตัวอย่าง`,
      headersFound,
      missingRequiredHeaders
    };
  }

  const dataRows = csvRows.slice(1);
  if (!dataRows.length) {
    return {
      rows: [],
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      fileError: 'ไฟล์มีเฉพาะหัวตาราง ยังไม่มีแถวข้อมูลสินค้า',
      headersFound,
      missingRequiredHeaders: []
    };
  }

  if (dataRows.length > 1000) {
    return {
      rows: [],
      totalRows: dataRows.length,
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      fileError: `ไฟล์มีจำนวน ${dataRows.length} แถว ซึ่งเกินขีดจำกัดที่รองรับ 1,000 แถวต่อไฟล์`,
      headersFound,
      missingRequiredHeaders: []
    };
  }

  const existingNameMap = new Map<string, CatalogProduct>();
  for (const p of existingProducts) {
    existingNameMap.set(p.name.trim().toLowerCase(), p);
  }

  const seenInFileName = new Map<string, number>(); // name -> row index (1-based)
  const resultRows: CsvProductRow[] = [];

  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    const rowIndex = r + 1; // 1-based data row
    const getVal = (f: KnownField) => {
      const idx = fieldMapping.get(f);
      return idx !== undefined && idx < row.length ? row[idx].trim() : '';
    };

    const rawName = getVal('name');
    const rawPrice = getVal('sellingPrice');
    const rawCost = getVal('cost');
    const rawQty = getVal('quantity');
    const rawSku = getVal('sku');
    const rawUnit = getVal('unit') || 'ชิ้น';

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate Name
    if (!rawName) {
      errors.push(`แถว ${rowIndex}: ไม่ได้ระบุชื่อสินค้า`);
    }

    // 2. Validate Selling Price
    const priceParsed = parseAmountToSatang(rawPrice);
    if (!rawPrice) {
      errors.push(`แถว ${rowIndex}: ไม่ได้ระบุราคาขาย`);
    } else if (priceParsed.error) {
      errors.push(`แถว ${rowIndex}: ราคาขาย ${priceParsed.error}`);
    }

    // 3. Validate Cost
    let costSatang: number | null = null;
    if (!rawCost) {
      warnings.push(`ยังไม่ระบุต้นทุน (จะยังคำนวณกำไรไม่ได้)`);
    } else {
      const costParsed = parseAmountToSatang(rawCost);
      if (costParsed.error) {
        errors.push(`แถว ${rowIndex}: ต้นทุน ${costParsed.error}`);
      } else {
        costSatang = costParsed.satang;
      }
    }

    // 4. Selling price vs Cost warning
    if (priceParsed.satang != null && costSatang != null && priceParsed.satang < costSatang) {
      warnings.push(`ราคาขายต่ำกว่าต้นทุน (ขาย ฿${money(priceParsed.satang)} < ทุน ฿${money(costSatang)})`);
    }

    // 5. Validate Quantity
    const qtyParsed = parseQuantity(rawQty);
    if (qtyParsed.error) {
      errors.push(`แถว ${rowIndex}: ${qtyParsed.error}`);
    }

    // 6. Validate SKU if provided
    let finalSku = rawSku;
    if (rawSku && !/^[A-Za-z0-9_.-]{1,100}$/.test(rawSku)) {
      errors.push(`แถว ${rowIndex}: รหัสสินค้า (SKU) ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข ขีด (-) จุด (.) เท่านั้น`);
    }

    // 7. Duplicate Checks
    const normalizedName = rawName.toLowerCase();
    let isShopDuplicate = false;
    let isInFileDuplicate = false;
    let duplicateOfIndex: number | undefined;

    if (rawName) {
      if (existingNameMap.has(normalizedName)) {
        isShopDuplicate = true;
        const existProd = existingNameMap.get(normalizedName)!;
        if (duplicatePolicy === 'skip') {
          warnings.push(`ชื่อซ้ำกับสินค้าในร้าน "${existProd.name}" (${existProd.sku}) — จะถูกข้าม`);
        } else if (duplicatePolicy === 'update') {
          warnings.push(`ชื่อซ้ำกับสินค้าในร้าน — จะอัปเดตต้นทุนไปยัง ${existProd.sku}`);
          if (!finalSku) finalSku = existProd.sku;
        } else {
          warnings.push(`ชื่อซ้ำกับสินค้าในร้าน — จะเพิ่มเป็นสินค้าใหม่`);
        }
      }

      if (seenInFileName.has(normalizedName)) {
        isInFileDuplicate = true;
        duplicateOfIndex = seenInFileName.get(normalizedName)!;
        warnings.push(`ชื่อซ้ำกับแถวที่ ${duplicateOfIndex} ในไฟล์นี้`);
      } else {
        seenInFileName.set(normalizedName, rowIndex);
      }
    }

    // Generate SKU if none
    if (!finalSku && rawName) {
      finalSku = 'SKU-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    }

    const status: 'valid' | 'warning' | 'error' =
      errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';

    resultRows.push({
      index: rowIndex,
      name: rawName,
      sellingPriceText: rawPrice,
      costText: rawCost,
      quantityText: rawQty || '1',
      skuText: rawSku,
      unitText: rawUnit,
      sellingPriceSatang: priceParsed.satang,
      costSatang,
      quantity: qtyParsed.quantity ?? 1,
      sku: finalSku,
      unit: rawUnit,
      status,
      errors,
      warnings,
      isShopDuplicate,
      isInFileDuplicate,
      duplicateOfIndex
    });
  }

  const validCount = resultRows.filter(r => r.status === 'valid').length;
  const warningCount = resultRows.filter(r => r.status === 'warning').length;
  const errorCount = resultRows.filter(r => r.status === 'error').length;

  return {
    rows: resultRows,
    totalRows: resultRows.length,
    validCount,
    warningCount,
    errorCount,
    headersFound,
    missingRequiredHeaders: []
  };
}

/** Generate template CSV (BOM + Header + 1 example row) */
export function generateProductCsvTemplate(): Blob {
  const headers = ['ชื่อสินค้า', 'ราคาขาย', 'จำนวน', 'ต้นทุน', 'รหัสสินค้า', 'หน่วย'];
  const exampleRow = [
    'ตัวอย่าง: เสื้อยืดคอตตอนแท้ (ลบแถวนี้ก่อนใช้)',
    '290',
    '50',
    '130',
    'TSHIRT-EX01',
    'ชิ้น'
  ];

  const escape = (v: string) => '"' + v.replaceAll('"', '""') + '"';
  const csvContent =
    '\uFEFF' +
    [headers.map(escape).join(','), exampleRow.map(escape).join(',')].join('\r\n') +
    '\r\n';

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/** Realistic mock products for Sample CSV */
export const SAMPLE_PRODUCTS: Array<{
  name: string;
  price: number;
  qty: number;
  cost: number | '';
  sku: string;
  unit: string;
}> = [
  { name: 'เสื้อยืดคอตตอนแท้ (Premium Cotton T-Shirt)', price: 290, qty: 85, cost: 130, sku: 'TSHIRT-01', unit: 'ชิ้น' },
  { name: 'กางเกงยีนส์ขากระบอก (Straight Fit Denim)', price: 590, qty: 42, cost: 280, sku: 'JEANS-02', unit: 'ตัว' },
  { name: 'กระเป๋าผ้าแคนวาส (Canvas Tote Bag)', price: 199, qty: 120, cost: 85, sku: 'BAG-03', unit: 'ใบ' },
  { name: 'หมวกแก๊ปมินิมอล (Minimalist Cap)', price: 250, qty: 60, cost: 110, sku: 'CAP-04', unit: 'ใบ' },
  { name: 'ถุงเท้าข้อสั้นคอตตอน (Pack 3 คู่)', price: 120, qty: 200, cost: 45, sku: 'SOCK-05', unit: 'แพ็ค' },
  { name: 'เสื้อเชิ้ตแขนยาว ลินินแท้ (Linen Shirt)', price: 650, qty: 35, cost: 320, sku: 'SHIRT-06', unit: 'ตัว' },
  { name: 'กระบอกน้ำเก็บความเย็น 500ml สแตนเลส', price: 390, qty: 75, cost: 160, sku: 'BOTTLE-07', unit: 'ใบ' },
  { name: 'เคสโทรศัพท์ซิลิโคนกันกระแทก', price: 180, qty: 150, cost: 65, sku: 'CASE-08', unit: 'ชิ้น' },
  { name: 'สมุดโน้ตปกหนัง A5 ถนอมสายตา', price: 149, qty: 90, cost: 55, sku: 'NOTE-09', unit: 'เล่ม' },
  { name: 'พวงกุญแจหนังแท้ งานแฮนด์เมด', price: 129, qty: 110, cost: 40, sku: 'KEY-10', unit: 'ชิ้น' },
  { name: 'แว่นตากันแดด โพลาไรซ์ UV400', price: 490, qty: 50, cost: 210, sku: 'GLASS-11', unit: 'อัน' },
  { name: 'ร่มพับกันแดดกันฝน เคลือบ UV', price: 220, qty: 80, cost: 95, sku: 'UMB-12', unit: 'คัน' },
  { name: 'สินค้าตัวอย่าง: ยังไม่ระบุต้นทุน', price: 350, qty: 25, cost: '', sku: 'PENDING-13', unit: 'ชิ้น' }
];

/** Generate sample CSV with realistic mock products */
export function generateProductCsvSample(): Blob {
  const headers = ['ชื่อสินค้า', 'ราคาขาย', 'จำนวน', 'ต้นทุน', 'รหัสสินค้า', 'หน่วย'];
  const escape = (v: string | number) => '"' + String(v).replaceAll('"', '""') + '"';

  const rows = [
    headers.map(escape).join(','),
    ...SAMPLE_PRODUCTS.map(p =>
      [p.name, p.price, p.qty, p.cost, p.sku, p.unit].map(escape).join(',')
    )
  ];

  const csvContent = '\uFEFF' + rows.join('\r\n') + '\r\n';
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/** Generate error report CSV from failed rows */
export function generateErrorReportCsv(failedRows: CsvProductRow[]): Blob {
  const headers = ['แถวที่', 'ชื่อสินค้า', 'ราคาขาย', 'จำนวน', 'ต้นทุน', 'รหัสสินค้า', 'หน่วย', 'สาเหตุที่ผิดพลาด'];
  const escape = (v: string | number) => '"' + String(v).replaceAll('"', '""') + '"';

  const rows = [
    headers.map(escape).join(','),
    ...failedRows.map(r =>
      [
        r.index,
        r.name,
        r.sellingPriceText,
        r.quantityText,
        r.costText,
        r.skuText,
        r.unitText,
        r.errors.join('; ')
      ].map(escape).join(',')
    )
  ];

  const csvContent = '\uFEFF' + rows.join('\r\n') + '\r\n';
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/** Trigger browser download for a Blob */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
