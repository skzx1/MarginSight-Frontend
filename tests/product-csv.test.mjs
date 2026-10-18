import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCsvText,
  cleanNumberText,
  parseAmountToSatang,
  parseQuantity,
  matchHeaderField,
  processProductCsv,
  generateProductCsvTemplate,
  generateProductCsvSample,
  generateErrorReportCsv
} from '../web/src/lib/product-csv.ts';

test('RFC 4180 CSV parser handles quotes, escaped quotes, commas, and BOM', () => {
  const csv = '\uFEFF"ชื่อสินค้า","ราคาขาย","จำนวน","ต้นทุน"\r\n"เสื้อยืด, สีขาว","150.00","10","80"\r\n"กางเกง ""ยีนส์""","590","5","280"';
  const parsed = parseCsvText(csv);
  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed[0], ['ชื่อสินค้า', 'ราคาขาย', 'จำนวน', 'ต้นทุน']);
  assert.deepEqual(parsed[1], ['เสื้อยืด, สีขาว', '150.00', '10', '80']);
  assert.deepEqual(parsed[2], ['กางเกง "ยีนส์"', '590', '5', '280']);
});

test('CSV parser ignores empty lines and trailing line breaks', () => {
  const csv = 'name,price\n\nitem 1,100\n\n\nitem 2,200\n\n';
  const parsed = parseCsvText(csv);
  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed[1], ['item 1', '100']);
  assert.deepEqual(parsed[2], ['item 2', '200']);
});

test('cleanNumberText and parseAmountToSatang clean currency symbols, commas and whitespace', () => {
  assert.equal(cleanNumberText('฿ 1,200.50'), '1200.50');
  assert.equal(cleanNumberText('THB 500'), '500');

  const valid1 = parseAmountToSatang('฿1,200.50');
  assert.equal(valid1.satang, 120050);
  assert.equal(valid1.error, undefined);

  const valid2 = parseAmountToSatang('290');
  assert.equal(valid2.satang, 29000);

  const blank = parseAmountToSatang('');
  assert.equal(blank.satang, null);
  assert.equal(blank.error, undefined);

  const negative = parseAmountToSatang('-100');
  assert.equal(negative.satang, null);
  assert.match(negative.error, /ต้องไม่เป็นค่าติดลบ/);

  const invalid = parseAmountToSatang('abc');
  assert.equal(invalid.satang, null);
  assert.match(invalid.error, /ไม่ใช่ตัวเลข/);
});

test('parseQuantity handles integer validation', () => {
  assert.equal(parseQuantity('50').quantity, 50);
  assert.equal(parseQuantity('').quantity, 1); // default 1
  assert.equal(parseQuantity('1,000').quantity, 1000);

  const float = parseQuantity('10.5');
  assert.equal(float.quantity, null);
  assert.match(float.error, /จำนวนเต็ม/);

  const negative = parseQuantity('-5');
  assert.equal(negative.quantity, null);
  assert.match(negative.error, /ต้องไม่ติดลบ/);
});

test('matchHeaderField maps Thai and English column variations', () => {
  assert.equal(matchHeaderField('ชื่อสินค้า'), 'name');
  assert.equal(matchHeaderField('Name'), 'name');
  assert.equal(matchHeaderField('product_name'), 'name');
  assert.equal(matchHeaderField('ราคาขาย'), 'sellingPrice');
  assert.equal(matchHeaderField('price'), 'sellingPrice');
  assert.equal(matchHeaderField('selling_price'), 'sellingPrice');
  assert.equal(matchHeaderField('ต้นทุน'), 'cost');
  assert.equal(matchHeaderField('unit_cost'), 'cost');
  assert.equal(matchHeaderField('จำนวน'), 'quantity');
  assert.equal(matchHeaderField('stock'), 'quantity');
  assert.equal(matchHeaderField('รหัสสินค้า'), 'sku');
  assert.equal(matchHeaderField('sku'), 'sku');
  assert.equal(matchHeaderField('หน่วย'), 'unit');
});

test('processProductCsv validates rows, missing costs, loss warnings and duplicates', () => {
  const existing = [
    { sku: 'OLD-01', name: 'เสื้อยืดคอตตอนแท้', unit: 'ชิ้น', dataOrigin: 'REAL', sourceRef: 'ref' }
  ];

  const rows = [
    ['ชื่อสินค้า', 'ราคาขาย', 'จำนวน', 'ต้นทุน', 'รหัสสินค้า'],
    // 1. Valid row
    ['หมวกแก๊ป', '250', '20', '100', 'CAP-01'],
    // 2. Missing cost -> warning "ยังไม่ระบุต้นทุน"
    ['กระเป๋าผ้า', '199', '15', '', 'BAG-01'],
    // 3. Selling price < cost -> calm warning
    ['สินค้าราคาพิเศษ', '100', '10', '150', 'SALE-01'],
    // 4. Invalid price -> error
    ['ของเสีย', 'bad_price', '5', '50', 'ERR-01'],
    // 5. Duplicate in shop
    ['เสื้อยืดคอตตอนแท้', '300', '10', '140', 'OLD-01'],
    // 6. Duplicate in file
    ['หมวกแก๊ป', '250', '5', '100', 'CAP-02']
  ];

  const result = processProductCsv(rows, existing, 'skip');
  assert.equal(result.totalRows, 6);
  assert.equal(result.errorCount, 1); // Row 4 has error

  // Row 1: Valid
  assert.equal(result.rows[0].status, 'valid');

  // Row 2: Warning (no cost)
  assert.equal(result.rows[1].status, 'warning');
  assert.ok(result.rows[1].warnings.some(w => w.includes('ยังไม่ระบุต้นทุน')));

  // Row 3: Warning (selling < cost)
  assert.equal(result.rows[2].status, 'warning');
  assert.ok(result.rows[2].warnings.some(w => w.includes('ราคาขายต่ำกว่าต้นทุน')));

  // Row 4: Error (bad price)
  assert.equal(result.rows[3].status, 'error');
  assert.ok(result.rows[3].errors.some(e => e.includes('ราคาขาย')));

  // Row 5: Duplicate shop
  assert.equal(result.rows[4].isShopDuplicate, true);
  assert.ok(result.rows[4].warnings.some(w => w.includes('ซ้ำกับสินค้าในร้าน')));

  // Row 6: Duplicate in file
  assert.equal(result.rows[5].isInFileDuplicate, true);
  assert.equal(result.rows[5].duplicateOfIndex, 1);
});

test('processProductCsv detects empty and invalid files', () => {
  // Empty
  const empty = processProductCsv([]);
  assert.ok(empty.fileError);

  // Missing required columns
  const noPrice = processProductCsv([['ชื่อสินค้า', 'จำนวน'], ['เสื้อ', '10']]);
  assert.ok(noPrice.fileError.includes('ราคาขาย'));

  // Header only
  const headerOnly = processProductCsv([['ชื่อสินค้า', 'ราคาขาย', 'จำนวน', 'ต้นทุน']]);
  assert.ok(headerOnly.fileError.includes('เฉพาะหัวตาราง'));
});

test('Blob generators produce valid UTF-8 BOM CSV files', async () => {
  const checkBom = async (blob) => {
    const bytes = await blob.bytes();
    assert.equal(bytes[0], 0xEF);
    assert.equal(bytes[1], 0xBB);
    assert.equal(bytes[2], 0xBF);
  };

  const template = generateProductCsvTemplate();
  await checkBom(template);
  const templateText = await template.text();
  assert.ok(templateText.includes('ตัวอย่าง:'));

  const sample = generateProductCsvSample();
  await checkBom(sample);
  const sampleText = await sample.text();
  assert.ok(sampleText.includes('เสื้อยืดคอตตอนแท้'));
  assert.ok(sampleText.includes('กางเกงยีนส์ขากระบอก'));

  const failedRows = [{
    index: 3,
    name: 'ของเสีย',
    sellingPriceText: 'xxx',
    costText: '10',
    quantityText: '1',
    skuText: 'ERR-1',
    unitText: 'ชิ้น',
    errors: ['ราคาขายไม่ใช่ตัวเลข']
  }];
  const errReport = generateErrorReportCsv(failedRows);
  await checkBom(errReport);
  const errText = await errReport.text();
  assert.ok(errText.includes('สาเหตุที่ผิดพลาด'));
  assert.ok(errText.includes('ราคาขายไม่ใช่ตัวเลข'));
});
