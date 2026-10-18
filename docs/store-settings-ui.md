# ข้อมูลร้าน — ฟอร์มใช้งานได้และ layout เต็มพื้นที่

18 ตุลาคม 2026 · local static export · ข้อมูลตรวจทั้งหมดเป็นข้อมูลสังเคราะห์

ฉบับนี้แทนข้อจำกัด UI แบบล็อกในงานรอบก่อน ผู้ใช้อนุญาตให้เก็บ preferences ใน localStorage โดยไม่เพิ่ม backend API

## หน้าและพฤติกรรม

- หน้าใช้พื้นที่ข้าง drawer เต็มความกว้าง มี safety cap1920px และ padding24px
- เครื่องมือเป็น4คอลัมน์บนจอกว้างตั้งแต่1280px,2คอลัมน์บนแท็บเล็ต/หน้าต่าง768–1279px และ1คอลัมน์บนมือถือ
- ฟอร์มข้อมูลร้านกับการแจ้งเตือนอยู่ข้างกันบนจอกว้าง และซ้อนกันบนแท็บเล็ต/มือถือ ช่องด้านในเป็น2คอลัมน์ตั้งแต่768px
- ชื่อร้าน หมวดหมู่ สกุลเงิน รอบสรุป ภาษา เกณฑ์มาร์จิน อีเมล และ checkboxทั้งสองรายการแก้ไขได้ ไม่มีไอคอนล็อกหรือ unavailable badges
- ชื่อร้านเป็น display preference เฉพาะหน้านี้และ sidebar บนหน้านี้ ไม่เรียก API เปลี่ยนชื่อร้าน ส่วนตัวเลขเงินจริงยังเป็นTHB ไม่มีการแปลงเงินตามสกุลเงินที่เลือก
- ภาษาใช้ i18n เดิม สลับทั้ง interface ทันที และไม่เลื่อนหน้าเมื่อเปลี่ยนภาษา
- Save bar แสดงเฉพาะเมื่อค่าเปลี่ยน อยู่เหนือ mobile navigation/safe area หรือที่ขอบล่างพื้นที่ข้าง drawer พร้อมCancel/Save
- Cancel คืนค่าที่บันทึก รวมภาษา; Saveมีtoastและซ่อนแถบเมื่อสำเร็จ; หากบันทึกไม่ได้ แบบร่างและแถบยังอยู่ให้ลองใหม่
- ชื่อร้านจำเป็นต้องมี1–120ตัวอักษร, มาร์จิน0–100, อีเมลต้องมีรูปแบบถูกต้อง ถ้าเลือกรายงานต้องกรอกอีเมล มีinline errors,aria-invalidและfocusช่องแรกที่ผิด
- เตือนก่อนเปลี่ยนหน้า สลับร้าน สร้างร้าน ออกจากระบบ หรือ browserback; beforeunloadใช้คำเตือนมาตรฐานของเบราว์เซอร์
- ข้อมูลจำลองมีbadgeเดียวในheaderพร้อมtooltip ส่วนเพดาน3importsและ3AI/OCRแบบใช้ร่วมกันแสดงบนการ์ดที่เกี่ยวข้อง ไม่สร้างยอดใช้แล้วขึ้นมาเพราะAPIไม่ได้ส่งตัวนับโควตา
- Sidebarแสดง “ร้านของคุณ” และชื่อขนาดอ่านได้ ถ้ามีร้านเดียวไม่มีcaret ถ้าหลายร้านใช้native selectพร้อมlabel
- การแจ้งเตือนอีเมลมีnoteเดียวว่าระบบยังไม่ส่งอีเมลจริง

## เก็บค่าที่ไหน

`SettingsStorage` มี `load` / `save` แบบPromise ปัจจุบันใช้ `localSettingsStorage` เปลี่ยนเป็นAPI adapterได้ภายหลัง

- key: `marginsight:store-settings:v1:<SHA-256 scope>`
- scope: account subjectจากaccess token (หรือopaque tokenสำหรับlocal demo), หรือdemo session identity รวมกับstore path
- เก็บJSON `{ version:1, settings:{...} }` เฉพาะpreferences ไม่เก็บtokenลงlocalStorage
- ภาษาinterfaceยังใช้ `marginsight.locale.v1` ของระบบเดิม และมีlanguage preferenceในsettingsของแต่ละร้าน
- หากไม่มีข้อมูลใช้ค่าเริ่มต้น ถ้าข้อมูลเสีย/ผิดschemaใช้ค่าเริ่มต้นพร้อมคำอธิบาย โดยไม่เขียนทับอัตโนมัติ
- หากพื้นที่เก็บข้อมูลถูกบล็อก ยังแก้ไขได้และแสดงข้อความผิดพลาด บันทึกสำเร็จจริงจึงแสดงtoast
- ข้อมูลอยู่เฉพาะเบราว์เซอร์นี้ ไม่มีcross-device sync หรือการอัปเดตprofileบนเซิร์ฟเวอร์ และdemoรอบใหม่มีscopeใหม่

## การ์ดเครื่องมือ

ทั้ง4การ์ดหลักไม่มีplaceholder: ไปยัง `#imports`, `#receipts`, `#rules`, `#reconciliation` ซึ่งเป็นflowที่มีอยู่แล้ว LINEไปหน้าเชื่อมต่อเดิม ยังต้องมีconfigurationของบริการก่อนใช้งานจริง

## ไฟล์เปลี่ยน

- `web/src/app/components/store-settings.tsx`: ฟอร์ม, validation, tools, save bar, notices, toast
- `web/src/app/components/store-settings.module.css`: responsive layout, typography, statesและsidebarเฉพาะหน้านี้
- `web/src/app/components/use-store-settings.ts`: load/save/draft/cancelและสถานะการจัดเก็บ
- `web/src/lib/store-settings.ts`: schema, validation, scopeและstorage adapter
- `web/src/app/components/shell.tsx`: navigation guardเมื่อมีregistrationจากSettings, store blockและรักษาตำแหน่งเมื่อเปลี่ยนภาษาบนหน้านี้
- `web/src/app/login/page.tsx`: เชื่อมguard/store scope/ชื่อที่บันทึกกับSettings
- เอกสารฉบับนี้; ไม่มีการแก้Backendหรือสูตรการเงิน

## ผลตรวจล่าสุด

- Production buildผ่าน รวมTypeScriptและpinned preview SHA-256 integrity
- Browser TH/ENครบ390,768,1024,1440,1920px: ไม่มีhorizontal page overflow,H1หนึ่งตัว,ฟอร์มแก้ไขได้และเป้ากดปุ่มอย่างน้อย44px
- ข้อความรองที่วัดจากcomputed stylesมีcontrastต่ำสุด5.40:1
- ตรวจvalidation,save/reload,Cancel/ภาษา,แถบบันทึกเหนือmobile nav,warningก่อนsidebar/hash/back/ปิดหน้า,ทั้ง4tools,save failureและcorrupt recoveryผ่าน
- ตรวจการแยกหลายร้าน/คนละdemo identity,ภาษาENที่บันทึกไว้,loading skeleton,missingและblocked storageผ่าน
- ตรวจlocale changeรักษาscrollและไม่แสดงtoastซ้อนแถบบันทึกผ่าน;ไม่มีbrowser runtime errorsในรอบหลัก
- หลักฐานอยู่ในignored `.impeccable/review/store-working/`: ภาพสองภาษา, `results.json`, `extra-results.json`, `final-check.json`
- ไม่เพิ่มหรือรันชุดunit-testของrepoในงานรอบนี้; finish reviewแบบinlineตามข้อห้ามsubagents;ไม่ได้deployAWS

## ควรตรวจด้วยตนเอง

1. SafariบนiPhone/iPadจริง เปิดคีย์บอร์ด หมุนจอ และตรวจแถบบันทึกกับsafe area
2. VoiceOver/NVDA ตรวจlabel,inline error,confirmationและtoast
3. บัญชี/ร้านที่ได้รับอนุญาตจริง ตรวจชื่อlocal,สลับร้านและstorage policyของเบราว์เซอร์
4. ยืนยันรายการหมวดหมู่/สกุลเงิน/รอบสรุปสำหรับผลิตภัณฑ์ก่อนเชื่อมAPI และใช้backendเป็นเจ้าของการส่งอีเมล/แปลงเงินในอนาคต
