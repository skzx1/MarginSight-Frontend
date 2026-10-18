# หน้าถามผู้ช่วย — ปรับ 17 ตุลาคม 2026

การแก้สีและประวัติแชตล่าสุดวันที่ 18 ตุลาคม 2026 ดู [assistant-history-ui.md](assistant-history-ui.md) ส่วนด้านล่างเป็นบันทึกการสร้างรุ่นก่อนหน้า

## ขอบเขตและเส้นทาง

หน้าแอปปัจจุบันอยู่ที่ `/login/#assistant` หลังแยก landing page ไว้ที่ `/` ตามงานก่อนหน้า งานนี้ปรับเฉพาะ Assistant และจุดเชื่อมต่อที่จำเป็นใน shell/workspace ไม่เปลี่ยน routes หรือสูตรการเงิน

## ไฟล์ของงานนี้

| ไฟล์ | หน้าที่ |
| --- | --- |
| `web/src/app/screens/assistant.tsx` | บทสนทนา ประวัติ ปุ่มจัดการแชต composer และ context dialogs |
| `web/src/app/components/assistant.module.css` | รูปแบบเฉพาะ Assistant รวม shell เต็มความสูงและ responsive |
| `web/src/app/components/assistant-copy.ts` | ข้อความ TH/EN ของหน้านี้ |
| `web/src/app/components/use-chat-sessions.ts` | โหลด/บันทึก state ประวัติ และแจ้งเมื่อบันทึกไม่ได้ |
| `web/src/lib/assistant-sessions.ts` | ประเภทข้อมูล ตรวจ archive และ storage interface |
| `web/src/lib/assistant-context.ts` | ช่วงวันที่ บริบทสินค้า และการอ่านคำถามที่ระบุสัปดาห์/เดือนหรือชื่อ/SKU |
| `web/src/lib/assistant-service.ts` | เชื่อม API ผลออเดอร์/ผู้ช่วยและอธิบายขอบเขตข้อมูล |
| `web/src/app/components/shell.tsx` | ใช้เลย์เอาต์เฉพาะ Assistant และย้ายเดือนมาอยู่กับแชต |
| `web/src/app/login/page.tsx` | คง Assistant เมื่อเปลี่ยนเมนู ส่งช่วงเวลาภาพรวม และ draft จากสินค้า |
| `web/src/lib/auth.ts` | เพิ่ม optional AbortSignal ให้ request เดิม เพื่อหยุดรอคำตอบ |
| `tests/assistant-sessions.test.mjs` | ตรวจ storage, context, date groups และชื่อแชต |

ไฟล์ Products ที่ยังไม่ commit เป็นงานก่อนหน้านี้ ไม่ใช่การปรับหน้าอื่นในงาน Assistant

## ประวัติเก็บที่ไหน

- Backend มี `/assistant` และ `/dashboard` แต่ไม่มี endpoint จัดเก็บ/โหลด chat sessions จึงใช้ **localStorage** ผ่าน `ChatStorage` (`load/save/delete`) เพื่อเปลี่ยนเป็น API adapter ได้ภายหลัง
- key รูปแบบ `marginsight:chat:v1:<sha256>` แยกตาม subject ของบัญชีและ store path; guest ใช้ session token ของรอบเดโมเป็นข้อมูลตั้งต้นของ hash ไม่บันทึก token ลง archive/key แบบข้อความอ่านได้
- เก็บ active chat, title, timestamps, preview จากข้อความ, draft, date/product context และคำตอบพร้อมบริบทที่ใช้จริง แยก scope การแสดงผลฝั่ง browser ไม่ใช่หลักฐาน tenant isolation ฝั่งเซิร์ฟเวอร์
- การเปลี่ยนเมนูและ reload คืนข้อมูลได้ใน browser/origin เดิม ไม่ซิงก์ข้ามอุปกรณ์ ข้อมูล localStorage ไม่ได้เข้ารหัสสำหรับผู้ใช้เครื่องเดียวกัน การล้างข้อมูลเว็บไซต์จะลบประวัติ
- จำกัด 100 แชต / 200 คำถามต่อแชต; เตือนเมื่อถึงเพดาน ไม่ลบประวัติเก่าโดยอัตโนมัติ การลบต้องยืนยันก่อน
- หาก storage เสีย/ถูกปิด/เต็ม จะแจ้งว่าข้อความใหม่อยู่ในหน้านี้ชั่วคราว และไม่เขียนทับ archive ที่อ่านไม่ได้ ข้อความ pending หลังเปิดใหม่จะแสดงว่าหยุดแล้ว พร้อมลองใหม่
- Backend ปัจจุบันตอบแต่ละคำถามแยกกัน ประวัตินี้มีไว้ย้อนอ่านและคืนบริบท ไม่ได้ส่งทั้งบทสนทนาเข้าโมเดล คำตอบต่อชื่อ/SKU หลังคำถามจำลองจะใช้คำถามจำลองเดิมประกอบให้
- ไม่รับรองการรวมการแก้ประวัติพร้อมกันหลายแท็บในรุ่น localStorage นี้

## พฤติกรรมและขอบเขตคำตอบ

- ถามได้ทันที ค่าเริ่มต้นเป็นช่วงเวลาจาก Overview และทุกสินค้า เปลี่ยนด้วย chips ใต้ composer ได้ รายการสินค้าโหลดเพิ่มได้ หากโหลดไม่ได้มีปุ่มลองใหม่
- อ่านคำถามที่ระบุวันนี้ สัปดาห์นี้/ที่แล้ว เดือนนี้/ที่แล้ว `YYYY-MM` และชื่อเต็มหรือ SKU ที่จับคู่ได้เพียงหนึ่งสินค้า การตีความเป็นกฎจำกัด ไม่ใช่การเข้าใจภาษาธรรมชาติทุกสำนวน
- คำถามยอดรวมอ่าน `/dashboard?month=...` และใช้ตัวรวมผลออเดอร์ที่มีอยู่ใน `overview-data.ts` ไม่มีสูตร fees/discount/profit ใหม่ใน UI
- API ส่งรายละเอียดสูงสุด 50 ออเดอร์ต่อเดือน ถ้าไม่ครบจะบอกว่าตัวเลขครอบคลุมเฉพาะที่โหลดมา ไม่ใช้ยอดบางส่วนอ้างว่าเป็นยอดทั้งร้าน ช่วงค้นได้ไม่เกิน 12 เดือน
- อันดับสินค้าใช้เฉพาะออเดอร์สินค้าเดียวที่มีข้อมูลครบ ออเดอร์หลาย SKU ไม่ถูกยกกำไรทั้งออเดอร์ให้สินค้าใดสินค้าหนึ่ง ข้อมูลขาดยังเป็น unknown และกำไรศูนย์ที่บันทึกจริงแสดง `฿0.00`
- คำถามลดราคา/คุ้มทุน/โปรแกรมเรียก `/assistant` เดิมพร้อม SKU/เดือน สูตรและการเรียกโมเดลยังเป็นของ Backend ผลจำลองอิงออเดอร์ล่าสุดของสินค้าในเดือนนั้น ไม่ใช่ยอดรวมตามช่วงวัน จึงแสดงบริบทเดือนที่ใช้จริงและข้อความกำกับ
- เมื่อยังไม่ระบุสินค้าสำหรับจำลอง ผู้ช่วยถามต่อในบทสนทนา ไม่บังคับเลือกก่อนส่ง ข้อผิดพลาด API ยังคงเป็น failed/retry ไม่สร้างคำตอบสำเร็จปลอมขึ้นมา
- ปุ่ม Stop ยกเลิก fetch/การรอใน browser; คำขอที่เซิร์ฟเวอร์รับไปแล้วอาจยังทำงาน ไม่รับรองการยกเลิกค่าใช้งานโมเดลฝั่งเซิร์ฟเวอร์

## รูปแบบและ accessibility

ใช้ค่าจาก `globals.css` และ `earth-theme.css` ปัจจุบัน: canvas/off-white, white, sage, muted olive/green, thin borders; amber เฉพาะคำเตือน/ข้อมูลขาด ใช้ Anuphan/Inter ที่ self-host อยู่แล้ว และ tabular numerals

เดสก์ท็อปมี history pane 288px ยุบได้; iPad portrait เริ่มยุบ; มือถือเปิด history sheet คอลัมน์ข้อความกว้างไม่เกิน 780px มี scroll region ของตัวเองและ composer อยู่ด้านล่าง ไม่เพิ่ม fixed-height chat box ภายในหน้า

มี input label, native dialog, focus trap/คืน focus, Escape, เป้ากดอย่างน้อย 44px, keyboard/IME handling, Enter/Shift+Enter, aria-live สำหรับคำตอบ และ reduced-motion ข้อความยาวตัดบรรทัดในเนื้อหา ส่วน title/preview ใช้ line clamp ในประวัติตามพื้นที่

ไม่แก้เอกสารระบบดีไซน์รวม: พบว่า `docs/ui-design.md` บางส่วนยังระบุ emerald palette รุ่นก่อน แต่ source ปัจจุบันเป็น olive/sage จากงานก่อนหน้า งานนี้ยึดค่าจริงใน source และไม่ซ่อม drift นอกขอบเขต

## ผลตรวจในเครื่อง

- `npm run verify`: ผ่าน 27 tests, TypeScript, pinned preview SHA-256, browser source policy, static export และ deploy packaging
- Edge/Chromium + synthetic API fixtures: TH/EN ที่ 390, 768, 1024, 1440, 1920px ไม่มี horizontal overflow; document สูงตาม viewport, targets ผ่าน 44px และ scroll region ใช้งานได้
- ตรวจส่งจาก prompt, กำไรศูนย์/อันดับสินค้า, copy/context, ข้อความร่าง, navigation/reload, คืน context, rename/new/delete confirmation, SKU inference, regenerate, error/retry/abort, multiline, scroll-to-latest, focus trap/Escape
- ตรวจ loading skeleton, storage quota warning, กลุ่มประวัติทั้งสี่กลุ่ม, รับช่วงเวลาจาก Overview และไม่แสดงประวัติข้ามรอบเดโมที่มี identity ต่างกัน
- เทียบหน้าอื่น 11 หน้า × 390/1440px กับ static export ก่อนแก้: 21 ภาพเหมือนกันทุก byte; Rules/390 ต่าง 1 pixel ที่ red channel 234→233 จาก anti-aliasing ไม่มี layout/style เปลี่ยน
- Impeccable detector หนึ่งรอบ: `[]`; finish review แบบ inline: `ship` ตามข้อกำหนดผู้ใช้ห้าม subagent ไม่ใช่ independent review
- หลักฐานอยู่ใน ignored `.impeccable/review/assistant/` และ `.local/assistant-scope/` ไม่ใช่หลักฐาน AWS/live-model

## ตรวจด้วยตนเองก่อนเผยแพร่

การปรับแนวข้อความและกล่องพิมพ์ล่าสุด: [Assistant composer UI](assistant-composer-ui.md)

1. Safari บน iPhone/iPad จริง โดยเปิดคีย์บอร์ด หมุนจอ และใช้ split view ตรวจ composer กับ safe area
2. VoiceOver/NVDA ตรวจคำตอบใหม่ focus และการเปิด/ปิด history/context dialogs
3. บัญชีและร้านที่ได้รับอนุญาตจริง: ยอดออเดอร์มากกว่า 50/เดือน, ออเดอร์หลาย SKU, ต้นทุนขาด และ API ผู้ช่วย/โควตาจริง
4. ยืนยันความเหมาะสมของการเก็บข้อมูลสนทนาใน browser ที่ใช้ร่วมกัน และวาง API สำหรับ cross-device history เมื่อต้องการ

งานนี้ยังไม่ได้เผยแพร่ AWS หรือทดสอบเรียกโมเดลจริง
