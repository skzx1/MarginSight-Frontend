# Calculation policy v1

เงินเก็บ integer satang; Decimal HALF_UP ปัด fee line ก่อนรวม. รายรับคือ seller item receivable หลังส่วนลดร้าน ไม่รวม buyer shipping; ไม่หักส่วนลดซ้ำ. ต้นทุนเลือก merchant-confirmed version ณ วันออเดอร์ (ไม่ใช่ FIFO).

กำไรส่วนที่บันทึก = รายรับ − fee − COGS − packaging − attributable ads − seller shipping. ยังไม่รวม overhead/income tax. Missing cost/rule/unit แสดง unknown. Actual fee แทน estimate ไม่บวกซ้ำ. Monthly fee แสดง excluded แยกจาก order margin.

Margin = profit/revenue; fee ratio = fee/revenue; TTR scope v1 = (fee + attributable ads)/revenue. ฐานศูนย์เป็น null. Incremental TTR เป็น percentage points. Payout reconciliation ตรวจเฉพาะ item settlement (revenue − fee) ไม่มี shipping/tax/WHT mapping จึงไม่อ้าง reconciliation ทั้ง bank statement.

PER_ITEM คิดฐานต่อชิ้นที่เป็น satang ปัด fee ต่อชิ้นแล้วคูณจำนวน; ฐานหารจำนวนไม่ลงตัวเป็น unsupported. PER_ORDER ปัด fee line แล้ว largest-remainder allocation ตามรายรับสินค้า รวมตรงทุก satang. VAT EXCLUDED บวก 7% ในกฎจำลอง; UNKNOWN ไม่เดา.

Break-even ค้นและตรวจกับ engine ภายใต้กฎที่บันทึก; rounding อาจมีหลายราคาที่กำไรศูนย์. ระบุ rangeChecked ไม่อ้าง minimum globally สำหรับกฎ non-monotonic. Refund ต้องมี adjustment evidence.

เก็บ input snapshot/hash/formula/cost/rule versions/provenance/tenant เพื่อ replay. MOCK fee 12/8/3% ไม่ใช่ Shopee rates.

## margin-v1.1.0 — unclassified posted cash

เฉพาะactualfeeชนิดCOMMISSION/TRANSACTION/PROGRAM/SERVICE/AFFILIATE/PAYMENT/PROCESSING/COMMERCE_GROWTH/PLATFORM_FEEถูกจัดเป็นplatformfee. ชนิดอื่นเช่นWHTหรือรายการที่ยังไม่mapped เก็บเป็นunmappedChargesและrawCashDeductionSatang ไม่คิดเป็นoperatingexpense/เครดิตภาษีโดยอัตโนมัติ ผลprofit/margin/TTR/fee ratioเป็นINCOMPLETE/nullจนมีข้อมูลจัดประเภทที่ยืนยันได้. Itemcashreconciliationยังใช้ยอดpostedทุกPER_ITEM/PER_ORDERตรงสตางค์ รวมUNMAPPED แต่แยกPER_MONTH/buyer-shippingออก ไม่อ้างfullbanksettlement. ยอดเงินไม่ถูกทิ้งจากหลักฐาน/export

Calculation snapshot inputHashรวมformulaVersionเพื่อเก็บผลเก่าและใหม่แยกกัน. HashJSONเรียงmapkeysอย่างcanonical และรองรับduplicateที่เก็บlegacyhashเดิม; imageHashรุ่นใหม่นับSHA256rawfilebytes รายงานOCRรอบเก่าเก็บไว้ตามเดิม

merchant-v1 REAL: ไม่ใช้defaultศูนย์สำหรับช่องเงินออเดอร์/adjustmentที่ยังไม่มีข้อมูล ต้องกรอกค่าที่ทราบตามหลักฐานหรือตรวจแก้แถวก่อนรับเข้า. CostunitตรงproductunitและverifiedByเป็นauthenticateduser. ร้านใหม่ไม่มีกฎตัวอย่าง; ก่อนactualfeesครบ/confirmedหรือกฎที่ตรวจแล้ว ผลกำไรยังunknown. Dashboardที่ไม่มีcompleteorderให้profitnull แทนกำไร0จากข้อมูลไม่ครบ และemptyร้านแสดงขั้นเริ่มใช้.
