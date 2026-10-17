# หน้าแนะนำ MarginSight

17 ตุลาคม 2026 · source/local เท่านั้น

เส้นทาง `/` เป็นหน้าแนะนำผลิตภัณฑ์สำหรับร้านค้าขนาดเล็ก ภาษาไทยเริ่มต้นและสลับอังกฤษผ่าน LanguageProvider เดิม ใช้ Quiet Ledger ตาม `docs/ui-design.md` และ tokens ใน `globals.css` โดยเพิ่ม CSS Module เฉพาะหน้า หน้าเข้าใช้และ workspace เดิมย้ายไป `/login/` และยกเลิก route `/welcome/`

## ไฟล์

- `web/src/app/page.tsx`: static landing route, title, description และ Open Graph metadata
- `web/src/app/login/page.tsx`: ทางเข้าใช้ เดโม และ workspace เดิม
- `web/src/app/login/layout.tsx` / `login.module.css`: metadata noindex และลิงก์โลโก้กลับหน้าแรก
- `web/src/app/auth-callback.tsx`: ส่งผล OAuth callback จาก `/` ไป `/login/`
- `web/src/app/welcome/welcome.tsx`: โครงหน้า dashboard/แชตสมมติ ปุ่มสมัคร และการเคลื่อนไหว
- `web/src/app/welcome/content.ts`: ข้อความ TH/EN และรายการ placeholder
- `web/src/app/welcome/welcome.module.css`: responsive layout และรูปแบบเฉพาะหน้า
- `web/.impeccable/surfaces/web-src-app-welcome-page-tsx.md`: บริบทการออกแบบเฉพาะเส้นทาง

Reuse: Brand, Icon, LanguageSwitch, Money และ auth login เดิม คงเนื้อหา workspace เดิมตอนย้าย route ไม่เพิ่ม dependency และไม่เปลี่ยนสูตรการเงิน

## เนื้อหาและการทำงาน

มี header, hero, แถบยอดขายสู่กำไร, 3 ขั้นตอน, ประโยชน์, ผู้ช่วย, ช่องทาง, ราคา, FAQ 6 ข้อ และคำชวนเริ่มใช้/ส่วนท้าย ใช้แถบหักค่าใช้จ่ายซ้ำใน dashboard และส่วนอธิบาย ตัวเลขทั้งหมดในหน้าเป็น MOCK; ค่าความกว้างของแถบเป็นค่าภาพที่เตรียมไว้ ไม่ได้เพิ่มตัวคำนวณการเงิน

ตัวอย่างยอดขาย ฿4,726 หักต้นทุน ฿1,400 ค่าบริการ ฿520 ค่าส่ง ฿220 เหลือ ฿2,586 เป็นข้อมูลสมมติ ไม่ใช่อัตราค่าบริการทางการ แถวสินค้าเป็นตัวอย่างที่เลือกมา ไม่ใช่รายการครบของยอดรวม ตัวอย่างแชตใช้ผลจาก fixture ที่ตรวจในชุดทดสอบเดิม: ราคาตั้งต้น ฿200 กำไร ฿9 และลด 15% ขาดทุน ฿14.10

ปุ่ม “ลองใช้ฟรี” ทั้ง 5 จุด รวมถึงลิงก์ “เข้าสู่ระบบ” และเปิดแอปไป `/login/` เพื่อเลือกเข้าสู่ระบบ สมัครบัญชี หรือเดโมเดิม ส่วน “ดูตัวอย่าง” เลื่อนไป dashboard สมมติบนหน้าแรก โลโก้หน้าเข้าใช้พากลับ `/`

Cognito ยังคง authorize/token redirect_uri เป็น origin + `/` ตาม callback ที่ลงทะเบียนอยู่แล้ว หน้าแรกส่ง query code/state หรือ error ต่อไป `/login/` โดยไม่แลก token หรือเปลี่ยน PKCE state ที่หน้าแรก การแลก token และตรวจ state ยังอยู่ใน `session()` เดิม และล้าง query หลังแลกตามเดิม กรณียกเลิก OAuth แสดงข้อผิดพลาดพร้อมให้ลองใหม่ใน `/login/` ไม่มีการเปลี่ยน Cognito/AWS config

ระบุข้อจำกัดกำไรที่ครอบคลุมเฉพาะข้อมูลบันทึก ไม่รวมค่าใช้จ่ายประจำและภาษีที่ยังไม่ได้บันทึก ช่องทางใช้แบบฟอร์มนำเข้า ไม่กล่าวอ้าง automatic API/native export. LINE ต้องตั้งค่าและยังมี external verification gates

## สิ่งที่เจ้าของต้องเติม

- โควตาและเงื่อนไขแพ็กเกจฟรี
- ราคา รอบชำระ ความสามารถ โควตา AI/LINE และวันเปิดใช้ Premium
- อีเมล/ช่องทางติดต่อ
- นโยบายความเป็นส่วนตัว ระยะเวลาเก็บ/ลบข้อมูล และเงื่อนไขบริการ
- เมื่อมี public URL ที่ยืนยันแล้ว ให้ตัดสินใจ canonical URL และภาพแชร์เพิ่มเติม

รายการที่ยังไม่ทราบแสดง `[TBD]` ในทั้งสองภาษา ไม่มี testimonial/user count ปลอม ใช้ product mockups เป็นหลักฐานอธิบายการทำงาน

## หลักฐานในเครื่อง

การตรวจหลังย้ายเส้นทาง: `npm run verify` ผ่านทั้ง 13 tests และ static export มี `/` กับ `/login/`. Browser ตรวจ root ทั้งสองภาษาที่ 390/768/1024/1440/1920px ไม่มี horizontal overflow; CTA ทั้ง 5 จุดเชื่อม `/login/`. ตรวจคลิก CTA → หน้าเข้าใช้ → เครื่องคำนวณเดิม → กลับหน้าเข้าใช้ → โลโก้กลับ `/`. ตรวจ signup → callback เดิม `/` → `/login/` → token exchange โดยคง redirect_uri `/`, state และ PKCE verifier ด้วย config/Cognito/API จำลอง พร้อมกรณียกเลิก OAuth และปุ่มลองใหม่ ไม่มีบัญชีจริงหรือ AWS changes หลักฐานอยู่ `.impeccable/review/routes/results.json`

ข้อความถัดไปเป็นหลักฐานรอบสร้างหน้าเดิมก่อนย้ายเส้นทาง:

`npm run verify` ผ่าน: preview SHA-256, TypeScript, browser policy, 13 tests, static export และ deploy packaging. ไม่ต้องใช้ Backend source. `npm ci` ครั้งแรกติด Windows file lock; กู้ dependencies ด้วย `npm install --ignore-scripts --package-lock=false` โดยไม่มีการเปลี่ยน manifest/lockfile

ตรวจ static production export ผ่าน Edge headless ทั้งภาษา TH/EN ที่ 390, 768, 1024, 1440, 1920px: ไม่มี page horizontal overflow และทุก interactive target ที่แสดงมีขนาดอย่างน้อย 44px ตรวจฟอนต์ไทย, หนึ่ง h1, metadata, FAQ ด้วย Enter, focus ที่มองเห็นจากคีย์บอร์ด, locale หลัง reload, demo anchor และ reduced motion

ตรวจเส้นทางสมัครด้วย config/Cognito จำลองในเบราว์เซอร์: config fail → ข้อความ → retry → `/signup` พร้อม PKCE S256, state, scope และ callback ไป `/`. ไม่ได้สมัครบัญชีจริงและไม่ได้อ้างผล live Cognito. Impeccable detector ตรวจไฟล์ใหม่หนึ่งครั้งไม่พบ findings

ภาพและรายงานอยู่ใน `.impeccable/review/welcome/` ของเครื่องนี้ ทบทวนภาพภายในแชตเดียวตามข้อห้าม subagent ของ repository; ไม่ใช่ independent review. ตรวจการใช้ระบบสี ฟอนต์ ปุ่ม ขอบ และตัวเลขเทียบกับ `docs/ui-design.md`, `globals.css`, `ui.tsx`, `language.tsx`, `components/ledger.tsx`; คงเอกสารดีไซน์เดิม เนื่องจากหน้าใหม่นี้สืบทอดระบบเดิม

ก่อนเผยแพร่ควรตรวจบน Safari/iPhone/iPad จริงและ screen reader พร้อมตรวจ Cognito flow กับ config ของ deployment และทบทวนราคา/กฎหมาย/ข้อมูลติดต่อกับเจ้าของ ผลในเครื่องไม่เปลี่ยนสถานะระบบรวม `PARTIAL_WITH_EXTERNAL_BLOCKERS`. งานนี้ยังไม่มี AWS publish
