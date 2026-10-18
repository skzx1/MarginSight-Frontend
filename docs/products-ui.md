# Products — ค้นหา กรอง และอ่านรายการสินค้า

17 ตุลาคม 2026 · ผล source/local เท่านั้น ยังไม่ได้เผยแพร่ AWS

## ขอบเขต

ปรับเฉพาะหน้าสินค้า `/login/#products` โดยสืบทอด tokens ที่ใช้อยู่จริงใน `globals.css`, Noto Sans Thai, IBM Plex Sans, Money และ Icon เดิม ไม่มีการแก้ palette/global stylesheet หรือเพิ่ม dependency. รายละเอียดสินค้า การบันทึกต้นทุน และ Simulation ใช้โค้ดเดิม การแก้ parent ใน `login/page.tsx` ส่ง loading ให้ Products และงด generic spinner เฉพาะ Products เพื่อแสดง skeleton แทน

## ไฟล์และพฤติกรรม

- `app/components/product-catalog.tsx`: summary, toolbar, active chips, native dialog, ตารางและการ์ด, loading/empty states และ hook เก็บตัวเลือกค้นหา/กรอง/เรียงขณะเปิดรายละเอียด
- `app/components/product-catalog.module.css`: สไตล์เฉพาะ catalog, controls สูง 48px รัศมีเดิม, จุดกดอย่างน้อย 44px, container queries และ reduced motion
- `app/components/product-catalog-copy.ts`: ข้อความเฉพาะหน้าทั้ง TH/EN ไม่เปลี่ยนข้อความร่วมของหน้าอื่น
- `lib/catalog-view.ts`: ค้นชื่อ/SKU, price/cost filters, sort ตาม recorded fields และแบ่งข้อความสำหรับ highlight ไม่มีสูตรการเงิน
- `app/screens/products.tsx`: เชื่อม catalog ใหม่กับ detail/cost form เดิม
- `tests/catalog-view.test.mjs`: แยกศูนย์กับข้อมูลขาด, ตัวกรองร่วม, unknown sorting และ literal search/highlight

ช่องค้นหาเต็มแถวบนมือถือและอยู่ข้าง controls บนพื้นที่กว้าง ตัวกรองกับเรียงลำดับกว้างเท่ากัน เปิด dropdown ที่ desktop หรือ bottom sheet บนมือถือ ใช้ radio/checkbox ที่มี label พร้อม Done, Escape, click-outside, focus trap และคืนโฟกัส ชิปค้นหา/ตัวกรองล้างได้ทีละอัน พร้อม Clear all. Badge บนตัวกรองนับ price/cost filters ที่ทำงานอยู่

ค้นหาหน่วง 140ms พร้อม underline/highlight ที่ยังเห็นบน hover. ล้างข้อความแล้วคืนโฟกัสให้ input; เมื่อเปิด detail/cost form และย้อนกลับ ค่าค้นหา/กรอง/เรียงยังอยู่. ราคาที่บันทึกเป็น 0 บาทถือว่าระบุราคาแล้ว ค่าราคา/ต้นทุน/จำนวน/กำไรที่ไม่มีข้อมูลไม่ถูกแทนด้วยศูนย์ และเรียงไปท้ายทั้งขาขึ้น/ลง

Summary และการค้นหาใช้เฉพาะสินค้าที่โหลดแล้ว ไม่อ้างว่าเป็นจำนวนทั้งร้าน หากมี pagination ยังโหลดเพิ่มได้. กำไรใช้ `profitSatang` ที่รับมาเท่านั้น ไม่สร้าง margin/กำไรจากราคาลบต้นทุนใน UI. ถ้าไม่มีรูปภาพใช้ตัวอักษรแรกเป็น placeholder; API contract ปัจจุบันไม่มี image URL

ตั้งแต่ความกว้างเนื้อหา catalog 680px ใช้ตาราง พร้อม sticky header ในพื้นที่เลื่อนและปุ่มหัวคอลัมน์ที่ใช้คีย์บอร์ดได้; พื้นที่แคบกว่านี้เป็นการ์ด 1/2 คอลัมน์. วันที่เพิ่มอยู่ใต้ชื่อเมื่อเนื้อที่จำกัด และเป็นคอลัมน์เมื่อกว้างอย่างน้อย 1050px. บนมือถือ key figures เป็นกริดสองคอลัมน์ ชื่อสินค้า/SKU ยาวตัดบรรทัด ไม่มี ellipsis

## หลักฐานตรวจ

- `npm run verify`: ผ่าน 23 tests, TypeScript, browser policy, preview SHA-256, static export และ packaging
- Edge headless บน static production export: TH/EN ที่ 390, 768, 1024, 1440, 1920px พร้อม iPad drawer ขยาย/ย่อ ไม่มี horizontal overflow; controls สูง 48px และกว้างเท่ากัน; visible buttons อย่างน้อย 44px
- ตรวจค้นชื่อ/SKU/literal brackets, highlight, clear input, no-results recovery, price filters ร่วมกับ missing cost, chip removal, Clear all, summary shortcuts, sorting ผ่านปุ่ม/หัวตาราง, pagination, detail/cost round-trip, skeleton/disabled และ empty catalog
- ตรวจ Tab วนใน dialog, Escape, click-outside, คืนโฟกัสและคืน body scrolling. ตรวจ geometry ของ mobile sheet และ footer อยู่ใน viewport; รอ layout นิ่งก่อนใช้ภาพ sort-mobile-settled.png เป็นหลักฐาน
- detector ตรวจไฟล์ใหม่หนึ่งครั้งไม่พบ findings. ภาพ/ผลตรวจอยู่ `.impeccable/review/products/` และสคริปต์ MOCK อยู่ `.local/` ไม่ใช่ข้อมูลร้านจริงหรือหลักฐาน AWS
- ตรวจขอบเขตด้วย build อ้างอิงจาก HEAD ก่อนแก้ใน `.local/products-reference/` เพราะ preview ที่มีอยู่เดิมเป็นซอร์สคนละรุ่น. หน้าอื่น 11 หน้า × 390/1440px รวม 22 ภาพ: 21 ภาพเหมือนทุกพิกเซล; LINE 1440 ต่างเพียงช่องสีแดง 1 ระดับใน 1 พิกเซลบนตัวอักษร sidebar (97 → 96), ไม่มีการเปลี่ยน layout/styles. โค้ด Simulation และ detail/cost form คงเดิมนอกการย้ายตัวเลือก catalog

ทบทวนภาพในแชตเดียวตามข้อห้าม subagent ของ repository; ไม่ใช่ independent review. เอกสารดีไซน์เดิมมีค่าสีรุ่นเก่าบางส่วน งานนี้ยึด tokens ใน source ปัจจุบันและไม่ได้แก้เอกสารระบบภาพทั้งโครงการ

## ตรวจด้วยมือก่อนเผยแพร่

ทดสอบ Safari บน iPhone/iPad จริง: การแตะ input โดยไม่ auto-zoom, คีย์บอร์ดบนจอ, safe area, scrolling ของ bottom sheet และ VoiceOver. ตรวจข้อมูลร้านจริง/สินค้าที่ไม่มี metadata และการโหลดหลายหน้ากับ API จริง โดยผลการเงินที่ขาดต้องยังเป็น unknown. งานนี้ยังไม่รับรองผล live API หรือเปลี่ยนสถานะ external blockers ของโครงการ
