# MarginSight — Quiet Ledger

อัปเดต 17 ตุลาคม 2026 · การเปลี่ยนรอบนี้เป็น source/local เท่านั้น ยังไม่เผยแพร่ AWS

## ทิศทาง

อ่านโจทย์เป็นสมุดกำไรที่เจ้าของร้านอ่านแล้วตัดสินใจได้บนมือถือ ให้ตัวเลขและที่มาชัด แล้วถามต่อในแชตได้ทันที

- DESIGN_VARIANCE 3/10: ใช้รูปแบบบัญชีที่คุ้นเคย มีเส้นเขียวกำกับยอดกำไรเป็นเอกลักษณ์เดียว
- MOTION_INTENSITY 3/10: เฉพาะสถานะรอและปฏิกิริยาปุ่ม 150ms; รองรับ reduced motion ไม่มีตัวเลขวิ่ง
- VISUAL_DENSITY 3/10: ทีละงาน ใช้รายการและรายละเอียดพับได้แทนกริดการ์ดแน่น ๆ
- ไม่ใช้ purple gradients, glassmorphism, cream premium, sidebar บนมือถือ หรือกราฟตกแต่ง

## ระบบภาพ

พื้น #F5F8F7 / กระดาษ #FFFFFF / ตัวอักษร #172D28 / รอง #52665E / emerald #087563 / sage #E6EFEA / เส้นฟอร์ม #73867D. กำไร #116846, ขาดทุน #B42318, ข้อมูลขาด #815300 บน #FFF4D6 พร้อมข้อความสถานะ ไม่สื่อด้วยสีอย่างเดียว

Noto Sans Thai 400–700 สำหรับข้อความ, IBM Plex Sans สำหรับตัวเลขแบบ tabular; เก็บ TTF และ OFL ใน web/public/fonts ไม่โหลดจาก Google ขณะเปิดเว็บ. ข้อความหลัก16px line-height1.65, หัวข้อ26–30px, กำไร40–48px. ปุ่ม/input48px, ปุ่มภาษา44px, โฟกัสเส้นเขียว3px. ช่องว่างรองรับอักษรไทยและ safe area ด้านล่าง

## แผนผังหน้าที่ใช้งานจริง

| เมนูหลัก | หน้าย่อย |
|---|---|
| ภาพรวม | กำไร/coverage, ออเดอร์, หลักฐานตัวเลข, ยืนยันเงินหัก, ตรวจยอดรับสินค้า, ส่งออก |
| สินค้า | ค้นหา/กรอง, รายละเอียด, เพิ่มสินค้า, ต้นทุนตามวันมีผล, ลองราคา, ถามต่อเกี่ยวกับ SKU |
| ถามผู้ช่วย | เลือกสินค้า/เดือน, คำถามแนะนำ, คำตอบ, หลักฐาน, ป้าย fallback |
| ข้อมูลร้าน | นำเข้ารายงาน/ตรวจแถว/ข้อขัดแย้ง, อ่านบิล, กฎและแคมเปญ, LINE, ภาษา, บัญชี |

มือถือ390px: โลโก้ → ชื่อหน้า/บริบทร้านและเดือน → เนื้อหาคอลัมน์เดียว → เมนูล่าง4รายการ. 768–1023px ใช้ drawer ด้านซ้ายเริ่มต้น80pxเฉพาะไอคอน กดขยายเป็น240pxได้; ตั้งแต่1024px แสดง drawer240pxตลอด. Workspace ยืดเต็มพื้นที่ที่เหลือ มี safety cap1920pxเฉพาะจอใหญ่มาก. Dashboard ใช้1/2/3คอลัมน์ตามความกว้างเนื้อหาจริง โดย container query รองรับตอน iPad ขยายเมนู; ฟอร์มทั่วไปจำกัด760pxและแชต760pxเพื่อให้อ่านง่าย. Landing, onboarding, preview, error,404 ใช้ภาษาภาพเดียวกัน. Cognito เป็น hosted UI เดิม; ปรับเฉพาะไฟล์ branding CSS ใน repo ยังไม่ได้ apply cloud

## Drawer และการตรวจ 17 ตุลาคม

เฉพาะ authenticated app shell ช่วง768pxขึ้นไป ใช้ CSS Grid แบ่ง drawer กับ content; padding24/28pxและgap28pxตามชุดเดิม. Drawer transition180msและเคารพ reduced motion. มี brand/ร้านด้านบน, nav landmark, active state ตาม parentScreen เดิม, aria-current, toggle aria-expanded/aria-controls, accessible label แม้ซ่อนข้อความ, focus ring และ Escape ย่อเมนูพร้อมคืนโฟกัส. สถานะขยายอยู่เฉพาะ component; reload เริ่มย่อบน iPad. หน้า nested และ4routesหลักคงโครงเดิม

ตรวจ Edge headlessกับlocalAPI/MOCK:11หน้าที่768/834/1023pxทั้งย่อและขยาย และ1024/1440/1920pxแบบdrawerเต็ม ไม่มี horizontal overflow/ทับเนื้อหา. ภาพมือถือ390pxทั้ง11หน้า pixel-identicalกับก่อนแก้ พร้อมตำแหน่ง/typography/spacingเท่าเดิม. ทดสอบคีย์บอร์ด Enter/Escape/focus, resizeแนวตั้ง–แนวนอนและภาษาอังกฤษ. ไม่ใช้ผล browser emulation อ้างว่าได้ตรวจSafariบนiPadเครื่องจริงแล้ว

## โครงสร้างและข้อมูล

- page.tsx ประกอบหน้าและบริบทร้าน/เดือน; components/shell.tsx จัด hash navigation และโฟกัสหัวข้อ รองรับ Back/Forward
- screens/ แยกแต่ละงาน; components/forms.tsx ใช้ label/error/loading ร่วมกัน; ledger.tsx รวมตัวเลข สถานะ และหลักฐาน
- lib/copy.ts กับ app/language.tsx ดูแล TH/EN. เก็บเฉพาะ locale ใน localStorage; ภาษาเริ่มต้นไทย
- lib/use-resource.ts ป้องกัน response เก่าเขียนทับ มี retry แบบกดเองและ polling เฉพาะงานค้าง; useAction ป้องกัน submit ซ้ำ
- API client เดิมใช้ Cognito PKCE/guest token. ผลเงินจริงทั้งหมดจาก Backend; domain.generated.js ใช้เฉพาะ MOCK preview และตรวจ SHA-256 เดิม
- แชตเก็บประวัติในหน่วยความจำแยกร้านและเดือน ไม่ persist หลัง reload และไม่ส่งบทสนทนาย้อนหลังเสมือน backend มี memory. แต่ละคำถามส่ง message/SKU/month ตาม contract เดิม
- Import ใช้ canonical CSV/XLSX หรือ mock-v1 ตามชนิดร้าน, ตรวจไฟล์, แสดง accepted/duplicate/rejected/conflict, review พร้อมเหตุผล. ไม่มี native marketplace adapter ใหม่
- Receipt ต้องตรวจ SKU/หน่วย/ยอด/วันมีผลและยืนยันด้วยคนเสมอ เปิดต้นฉบับย้อนหลังได้. ฟอร์มปัจจุบันยืนยันหนึ่งรายการต่อครั้งตาม UI เดิม

## ขอบเขตและความคลาดเคลื่อนที่ไม่ปิดบัง

- “กำไรจากข้อมูลที่บันทึก / Profit from recorded sales” ยังไม่รวมค่าใช้จ่ายประจำและภาษีเงินได้ จึงไม่เรียกว่า net profit after all costs
- API catalog มีต้นทุน ไม่มียอดกำไรแยก SKU สำหรับแสดงทุกสินค้าพร้อมกัน หน้าสินค้าแสดงต้นทุน และเชื่อมไปการจำลอง/ผู้ช่วย ไม่สร้างสูตรรวมยอดใหม่ใน browser
- ค้นหา/กรองเฉพาะสินค้าที่โหลดแล้ว มีปุ่มโหลดเพิ่ม; การ refresh คงจำนวนรายการที่เคยโหลดและตามหารายการที่เพิ่งบันทึก
- คุ้มทุนเป็นราคาที่ตรวจในช่วงที่สูตรรองรับ ไม่รับรอง global minimum; ตรวจยอดรับสินค้าไม่เท่ากับกระทบยอดธนาคารครบทั้งหมด
- ชื่อสินค้าจากร้าน, ข้อความ API, คำตอบผู้ช่วย และรายละเอียดหลักฐานไม่ถูกแปลอัตโนมัติ การสลับภาษาครอบคลุม UI; backend assistant ปัจจุบันตอบภาษาไทย
- LINE และ OCR จริงยังมี external gates เดิม; local deterministic fallback ไม่ใช่หลักฐานเรียกโมเดลจริง

## การตรวจและการรัน

ดูผลล่าสุดที่ docs/verification.md. ใช้ npm ci แล้ว npm run dev จากราก repo (port4050); backend เป็น repo แยก port4051. npm run verify ตรวจ contract, TypeScript, policy, tests, static export และ packaging. ไม่ต้องใช้ backend source ใน frontend build

---

## ประวัติดีไซน์และหลักฐานก่อน Quiet Ledger

เนื้อหาต่อไปนี้เป็นผลวันที่15ตุลาคมของ UI รุ่นก่อน ไม่ใช่ผล deploy ของ source รอบ16ตุลาคม

# MarginSight UI — 15 October 2026

## แนวทางที่ส่งมอบ

ปรับหน้าเริ่มต้น สร้างร้าน ลองคำนวณ และทั้ง 10 เมนูร้าน ให้ใช้ชุดสีเขียวอมฟ้า พื้นสว่าง ฟอร์ม การ์ด ตาราง และป้ายสถานะร่วมกัน รวมหน้า 404 และหน้ากู้คืนข้อผิดพลาดของ Next.js ด้วย

ใช้แนวทางจัดข้อมูลจาก shadcn/ui dashboard, FlowAccount และ sellerboard เป็นแรงบันดาลใจ เขียน CSS และ SVG ภายในโครงการ ไม่เพิ่ม Tailwind Plus หรือ dependency เชิงพาณิชย์ และไม่คัดลอกภาพ/โลโก้ของบริการอื่นมาเป็น UI สินค้า

- เมนูแบ่งเป็นข้อมูลร้าน วิเคราะห์ เอกสาร และช่องทาง; มือถือใช้ drawer มี focus trap, Escape, คืนโฟกัส และล็อกการเลื่อนพื้นหลัง
- Dashboard ให้กำไรส่วนที่บันทึกเด่น แสดง coverage และข้อมูลที่ต้องตรวจ แถบเปรียบเทียบมาจากผล API ที่มีจริง ไม่สร้างแนวโน้มย้อนหลังที่ยังไม่มีข้อมูล
- ตารางสินค้าและกระทบยอดเป็นการ์ดมีชื่อฟิลด์บนมือถือ; ตารางหลักฐานเลื่อนเฉพาะภายใน panel
- นำเข้า/OCR มีคำอธิบายขั้นตอนและ empty states; OCR draft เปลี่ยนจาก JSON เป็นตารางที่คนอ่านตรวจได้ ยังต้องยืนยันด้วยคน
- กฎและหลักฐานเข้าร่วมมีตัวเลือกประเภทแยกจากประเภทนำเข้า เพื่อไม่ส่งผิด endpoint; JSON ยังเป็นเครื่องมือสำหรับผู้ดูแลตามสัญญาข้อมูลเดิม
- วันเข้าร่วมแสดงตามวันประเทศไทยเช่นเดียวกับต้นทุน; สูตรคำนวณและการเก็บวันที่ backend คงเดิม
- ข้อมูล MOCK/REAL, ประมาณการ, ข้อมูลขาด และ LINE ที่ยังไม่ตั้งค่ามีข้อความกำกับ ไม่ใช้สีอย่างเดียว

หน้าล็อกอิน/สมัครที่ Amazon Cognito โฮสต์เองปรับสี ปุ่ม input และโลโก้ผ่าน classic branding ของ app client เดิม โครงฟอร์มและข้อความยังเป็นของ Cognito; ไม่เปลี่ยน auth policy, scopes, credentials หรือสิทธิ์ร้าน ใช้ `scripts/cloud-brand-auth.py` กับ `web/branding/` เพื่อทำซ้ำ และเก็บ customization เดิมใน `.local/cognito-ui-before.json` ของเครื่อง deploy ก่อนเปลี่ยน โค้ดนี้แยกจาก CloudFormation และต้องรันเมื่อสร้างบัญชี/stack ใหม่

## ผลตรวจในเครื่อง

- `node scripts/verify.mjs`: 43 backend tests, TypeScript, browser secret-pattern policy, bundled Lambda checks, production static export และ packaging ผ่าน หลังปรับหน้าหลัก; หลังเพิ่ม error/404 รัน web typecheck/build ผ่านซ้ำ
- Browser เปิดครบ 10 เมนูบนคอม และครบ 10 เมนูที่ 390px; ตรวจ scrollWidth ไม่เกิน clientWidth; เมนูปิดหลังเลือก และ Escape คืนโฟกัสที่ปุ่มเมนู
- Golden demo กำไร 9 บาท; ลด 15% ได้ -14.10 บาท และคุ้มทุนที่ระบบค้นได้ 188.31 บาท ไม่เปลี่ยนสูตร
- นำเข้า `orders.xlsx` ผ่านหน้าเว็บ รับ 1 แถว; นำเข้าไฟล์เดิมซ้ำเป็น duplicate 1 ไม่เพิ่มยอดซ้ำ
- เพิ่มสินค้า MOCK `UI-VERIFY`, บันทึกต้นทุน 154.50 บาทมีผล 15 ต.ค. และหลักฐาน MOCK ผ่านหน้าเว็บ; บันทึก enrollment `UI-CAMPAIGN` ผ่าน endpoint ที่แยกถูกต้อง
- หน้าลองคำนวณอ่านอย่างเดียวแสดงผลจริงจาก browser domain engine; ไม่ทำ fresh Cognito signup หรือสร้างร้านจริงเพิ่มในรอบนี้
- ช่วงทดสอบครั้งแรกเกิด `Failed to fetch` ระหว่าง dev reload; ตรวจ health และเลือกไฟล์ใหม่หลัง reload แล้ว positive/duplicate XLSX ผ่าน ไม่ใช้ความสำเร็จหลัง retry อ้างว่าไม่เคยเกิดปัญหา

หลักฐานภาพ/ผล AWS ล่าสุดและขอบเขตที่ยังไม่ได้ทดสอบอยู่ใน `status.md` / `verification.md`. สถานะทั้งโครงการยัง **PARTIAL_WITH_EXTERNAL_BLOCKERS**: LINE live, native marketplace samples และการประเมินบิลร้านจริงยังต้องมีข้อมูลภายนอก

## ผลบน AWS — 15 ตุลาคม 2026

- เว็บเผยแพร่จาก `ad7bb9f` บน S3/CloudFront เดิม; health ผ่าน และเปิดร้าน guest MOCK ใหม่ได้ กำไร9บาท/ส่วนลด15%ขาดทุน14.10บาท
- เปิดครบ10เมนูบนเว็บจริง ไม่พบ Failed to fetch ในรอบตรวจ; บาง operation/ฟอร์มยังตรวจในเครื่องตามรายการข้างบน ไม่อ้างว่า submit ทุก operation บน AWS ครบแล้ว
- อัปโหลด `orders.xlsx` ผ่านเว็บจริงสำเร็จ รับ1 แถว/ซ้ำ0/ผิด0/ขัดแย้ง0 ผ่าน S3/worker เดิม ไม่ใช่การ invoke worker แทน browser
- Cognito branding จาก `26ad3e6` apply/read-back ผ่าน; CSSVersion `20261015071504`; ตรวจหน้า signup และ sign-in จริง เห็นโลโก้และปุ่มสี `rgb(8,123,104)` สูง44px ไม่กรอก credentials หรือสร้างบัญชีเพิ่ม
- รูปด้านล่างเป็นข้อมูล MOCK ของ guest บนเว็บ AWS ไม่มีข้อมูลร้านจริงหรือ credential

![MarginSight dashboard บน AWS](design/marginsight-desktop.jpg)

## แหล่งอ้างอิงดีไซน์

- [shadcn/ui Dashboard](https://ui.shadcn.com/examples/dashboard)
- [FlowAccount Dashboard](https://flowaccount.com/help-center/category/dashboard/guide-business-dashboard)
- [sellerboard Profitability Dashboard](https://blog.sellerboard.com/2025/06/28/mastering-sellerboards-profitability-dashboard-tiles-charts-pl-map-and-trends/)
