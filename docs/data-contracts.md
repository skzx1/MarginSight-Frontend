# mock-v1 contract

CSV UTF-8 (BOM allowed) / XLSX หนึ่ง sheet ≤1,000 data rows/40 columns/5 MB. Headers ไม่ซ้ำ, formulas/macros/external links ปฏิเสธ. Money strings ≤2 decimals, dates ISO, stable IDs `[A-Za-z0-9_.-]`. มีไฟล์ตัวอย่างใน fixtures/mock-v1 และเว็บ.

Products: sku,name,unit. Costs: sku,cost_thb,effective_from. Orders: platform,order_id,line_id,sku,quantity,order_at,revenue_thb (required); buyer_payment_thb defaults revenue; packaging_thb,ads_thb,seller_shipping_thb,buyer_shipping_thb,seller_discount_thb,platform_discount_thb optional defaults 0 **เฉพาะสมมติฐาน canonical MOCK**. revenue_thb คือ normalized seller item receivable ห้ามส่ง payout แทน. Fees: platform,order_id,fee_id,fee_type,scope,amount_thb,effective_at,sku optional. Adjustment: platform,order_id,transaction_id,revenue_delta_thb,cogs_delta_thb,reason,effective_at.

ไฟล์ mock-v1 เป็น synthetic schema ไม่ใช่ real Shopee/TikTok/Lazada export. ตัวเชื่อม export/API ของแพลตฟอร์มจริงต้องมี authorized sample และ verified mapping ก่อนเปิดใช้. Missing required money ไม่แทนด้วย 0.

Import writes stable keys, stores conflicts without overwriting accepted data, conditional chunk completion prevents duplicate counting. Imported ledger is readable only when source import completes; PARTIAL blocks calculation pending review. Actual fee activation is separate merchant confirmation that fee lines are complete. Actual amounts are imported as posted to satang; no 5% tolerance.

S3 key selected server side under store partition; completion reads owned job/key after membership check. OCR drafts require reviewed quantity and unitsPerPack before unit cost version. Uploaded files/text are data, never instructions.

Unclassifiedactualcash: unknownfee_type/WHTยังเก็บยอดpostedและsourceRefครบในunmappedChargesและrawCashDeductionSatang แต่profit/margin/TTR/feeratiounknown ห้ามเปลี่ยนWHTเป็นPLATFORM_FEEเพียงเพื่อให้ได้ตัวเลข ต้องมีmerchanttaxprofile/evidenceและverifiedREALmappingก่อนรองรับtax/pass-throughประเภทนั้น. ExportแยกunmappedIDs/missingFields/payoutBasis/rawpostedcashแล้ว


## merchant-v1 — ข้อมูลจริงที่ร้านจัดเตรียมตามแบบ MarginSight

เพิ่มตามคำขอสมัครแล้วเริ่มใช้งานเอง15ตุลาคม2026. นี่คือ canonical manual-entry contract ของแอป ไม่ใช่ Shopee/Lazada/TikTok native export adapter. ร้านเป็นผู้แปลง/ตรวจข้อมูลและยืนยันสิทธิ์ใช้งานก่อนส่ง. ใช้ adapter=merchant-v1, dataOrigin=REAL, acknowledgeOwnership=true; createdBy/verifiedBy มาจากผู้ใช้ที่serverตรวจaccess tokenแล้ว. เก็บไฟล์ต้นฉบับ+job+sourceRefพร้อมadapterและแถว. mock-v1 ยังคงเฉพาะMOCKและไม่ใส่ข้อมูลจำลองในร้านส่วนตัว.

- สินค้า: sku,name,unit. กรอกหน่วยขายจริง; มีAPIกรอกสินค้ารายการเดียวด้วย.
- ต้นทุน: sku,cost_thb,unit,effective_from. cost_thbคือต้นทุนบาทต่อหนึ่งหน่วยขาย; unitต้องตรงกับหน่วยสินค้าที่นำเข้าก่อนหน้า ห้ามเอาราคาแพ็กมาใช้เป็นราคาชิ้นโดยไม่แปลง. วันที่มีผลเลือกตามหลักฐาน.
- ออเดอร์: platform,order_id,line_id,sku,quantity,order_at,revenue_thb,buyer_payment_thb,buyer_shipping_thb,platform_discount_thb,seller_discount_thb,packaging_thb,ads_thb,seller_shipping_thb ต้องกรอกทั้งหมด. revenue_thbคือยอดรับสินค้าของร้านหลังส่วนลดร้าน ไม่ใช่ยอดโอนธนาคาร; seller_discount_thbเป็นข้อมูลประกอบ ไม่หักซ้ำ. ไม่ทราบค่าใช้จ่ายต้องตรวจหลักฐาน ไม่ใส่0แทนข้อมูลที่ไม่ทราบ. 0ใช้ได้เมื่อยืนยันว่าไม่มีรายการนั้น.
- เงินหัก: platform,order_id,fee_id,fee_type,scope,amount_thb,effective_at และskuเมื่อPER_ITEM. ใช้ยอดpostedตามหลักฐาน ตรวจชุดครบก่อนยืนยันออเดอร์. ชนิดเงินหักที่ไม่รู้จัก/WHTยังไม่จัดเป็นค่าใช้จ่ายอัตโนมัติ.
- ปรับปรุง: platform,order_id,transaction_id,revenue_delta_thb,cogs_delta_thb,reason,effective_at; เงินทั้งสองช่องต้องระบุ รวม0ที่ยืนยันแล้ว.

ไฟล์แบบฟอร์มว่างอยู่ web/public/templates และเสิร์ฟที่ /templates/<kind>.csv. รองรับชื่อไฟล์ไทยแต่ไม่รับ path separator/control characters. ข้อจำกัดCSV/XLSX5MB/1000แถว/1sheetและการตรวจเนื้อหายังคงเดิม. ค่าบริการที่ยังไม่มีกฎหรือยังไม่ยืนยันครบชุดแสดงไม่ทราบ ไม่เดาอัตราของแพลตฟอร์ม.

## Self-service tenant creation

POST /me/store รับเฉพาะ name (2–80ตัวอักษร), ต้องauthenticated; ownerและstore IDมาจากserver. หนึ่งpersonalstoreต่อsubject ใช้IDคงที่และtransactionสร้างmembershipOWNERกับPROFILEพร้อมกัน. กดซ้ำ/ส่งซ้ำไม่เพิ่มร้าน/ไม่เปลี่ยนชื่อหรือสิทธิ์. ไม่มีการseedสินค้า/ต้นทุน/กฎ/ออเดอร์MOCKในร้านใหม่. ทุกเส้นทางข้อมูลร้านยังตรวจmembership. POST /stores/<id>/productsรับsku/name/unitและสร้างรายการใหม่เท่านั้น ไม่overwriteสินค้าเดิม.
