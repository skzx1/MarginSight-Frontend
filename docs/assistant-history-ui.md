# Assistant: ประวัติแชตอ่านชัดและรองรับหน้าจอ — 18 ตุลาคม 2026

## สาเหตุที่อ่านไม่ออก

ตรวจจาก static export ก่อนแก้ด้วย browser และข้อมูลสังเคราะห์ พบสองสาเหตุ:

1. `earth-theme.css` ใช้ `.topbar .primary-nav button` กำหนดตัวอักษรสีอ่อนให้ปุ่มทั้งหมดในเมนู รวมปุ่มแชตที่อยู่ข้างในด้วย selector นี้มี specificity สูงกว่า class ของประวัติ ขณะที่แถว active ใช้พื้น sage สว่าง จึงเหลือตัวอักษร `rgb(228,230,215)` บน `rgb(238,239,229)`
2. ใน modal ปุ่มเปิดแชตไม่ได้ตั้ง foreground เอง จึงรับสีขาวจากกฎ `button` รวม ส่วนชื่อกลุ่มใน drawer ใช้ muted `rgb(101,109,74)` สำหรับพื้นสว่างบนพื้น forest `rgb(51,61,41)`

หลักฐานก่อนแก้อยู่ใน ignored `.impeccable/review/history/before-colors.json`, `before-desktop.png` และ `before-modal.png`

## วิธีแก้และพฤติกรรม

- ใช้ `AssistantHistory` ชุดเดียวสำหรับ recent drawer, iPad/mobile sheet และ “ดูทั้งหมด” กฎ style ของปุ่มประวัติอยู่ในขอบเขตของ component และเจาะจงพอที่จะไม่รับ foreground/hover ของปุ่มเมนูหลัก
- กำหนดคู่สีผ่าน `--history-bg`, `--history-text`, `--history-muted`, `--history-hover`, `--history-hover-text`, `--history-hover-muted`, `--history-active`, `--history-active-text`, `--history-active-muted`, `--history-border`, `--history-active-border`, `--history-focus` ใช้เฉพาะ palette เดิมใน `globals.css`/`earth-theme.css`
- Drawer ใช้ forest + canvas/pale; sheet/modal ใช้ white + ink/muted; แถวปัจจุบันใช้ sage + ink/muted ทุก background state ตั้ง foreground คู่กัน
- แถวมีชื่อหนึ่งบรรทัดพร้อม ellipsis เวลา พรีวิวหนึ่งบรรทัด และเมนู `...` เป้ากดอย่างน้อย 44px แถวสูงอย่างน้อย 64px
- ชื่อกลุ่ม Today/Yesterday/Previous 7 days/Older เป็น sticky ในพื้นที่เลื่อนของรายการเอง ปุ่มแชตใหม่อยู่ด้านบนตลอดและใช้ style เดียวกัน ปุ่มดูทั้งหมดอยู่ด้านล่าง drawer ตลอด เมนูหลักไม่ถูกดันออกจากจอ
- ค้นหาได้ในชื่อ คำถาม คำตอบ และ draft; ล้างการค้นหาได้ ช่องว่างที่ยังไม่เริ่มคุยไม่ถือเป็นประวัติ และแสดง “ยังไม่มีแชต เริ่มถามได้เลย”
- Arrow Up/Down/Home/End ย้าย focus ระหว่างแถว; Enter เปิด; Delete เปิดยืนยันลบ มี aria-current และ focus ring เมนูต่อแถวใช้ native popover เพื่อหนีพื้นที่ตัดของ scroll container; Escape ปิดเมนูก่อนปิด dialog
- เปลี่ยนชื่อ/ลบจาก modal แล้วกลับไปยังหน้าประวัติ ส่วนการลบยังต้องยืนยันและไม่เพิ่ม undo ในรอบนี้
- ประวัติยังใช้ localStorage แยกบัญชี/ร้านตามเดิม เพิ่ม key ให้ provider แยก instance เมื่อเปลี่ยนร้าน ไม่มีการย้าย storage ไป backend
- Desktop ≥1024px: ประวัติใต้เมนูถามผู้ช่วยใน drawer เดิม, chat ใช้พื้นที่ที่เหลือ; iPad 768–1023px: ปุ่ม “ประวัติ” เปิด side sheet; mobile: bottom sheet เต็ม visual viewport มี handle ลากลงเพื่อปิดและปุ่มปิดที่ใช้คีย์บอร์ดได้
- Composer ใช้ dynamic/visual viewport ผ่าน hook เฉพาะ Assistant เมื่อคีย์บอร์ดเปิดจะเว้นจากขอบ visual viewport และซ่อน mobile navigation ชั่วคราวเพื่อเพิ่มพื้นที่ เมื่อออกจาก Assistant จะคืนค่าทั้งหมด มี safe-area สำหรับส่วนล่าง
- คง result cards, copy/regenerate, context chips, typing/stop และคอลัมน์ข้อความกลาง 760px ตัวเลขยาวตัดบรรทัดได้แทนการดันขอบหน้า Motion รองรับ reduced motion

## ไฟล์ของงานนี้

| ไฟล์ | การเปลี่ยนแปลง |
| --- | --- |
| `web/src/app/components/assistant-history.tsx` | รายการร่วม ปุ่มแชตใหม่ search/empty/skeleton และเมนูต่อแถว |
| `web/src/app/components/assistant-history.module.css` | โทเค็นคู่สี dark/light, states, sticky labels และรูปแบบรายการ |
| `web/src/lib/assistant-history.ts` | คัดประวัติที่มีเนื้อหา ค้นหาและเรียงเวลาโดยไม่แก้ข้อมูลต้นฉบับ |
| `web/src/app/components/assistant-provider.tsx` | ย้าย drawer ออกจาก provider และคืน history panel หลัง rename/delete |
| `web/src/app/components/use-assistant-viewport.ts` | ปรับความสูงตาม visual viewport เฉพาะ Assistant และคืนค่าตอนออก |
| `web/src/app/components/assistant.module.css` | Shell scroll, sheet/modal responsive, composer/targets และตัวเลขไม่ล้น |
| `web/src/app/screens/assistant.tsx` | ใช้รายการร่วม, drag handle, controlled rename, heading และ viewport hook |
| `web/src/app/components/assistant-copy.ts` | ป้ายประวัติแบบสั้นและสถานะว่าง/ล้างค้นหา TH/EN |
| `web/src/app/login/page.tsx` | เปลี่ยน import drawer และ key ของ provider ตามร้าน |
| `tests/assistant-history.test.mjs` | ทดสอบลำดับ/การค้นหา/ประวัติว่างและ input immutability |
| `docs/assistant-history-ui.md` | บันทึกสาเหตุ การแก้ และผลตรวจ |

ไม่แก้ shared theme หรือหน้าอื่น ไฟล์ Products/shell/auth ที่มีการแก้ค้างอยู่ก่อนเริ่มรอบนี้เป็นงานเดิม

## ผลตรวจล่าสุด

- `npm run verify` ผ่าน: 29 tests, TypeScript, pinned preview integrity, browser source policy, static export และ deploy packaging
- Edge/Chromium ในเครื่อง พร้อม synthetic API/chat fixtures; TH และ EN ที่ 390, 768, 1024, 1440, 1920px ไม่มี document horizontal overflow; touch targets ที่ตรวจผ่าน 44px
- ตรวจ foreground/background จริงของ title, timestamp, preview, ชื่อกลุ่ม และรายการเมนู ใน default/hover/active/focus และทุก surface คอนทราสต์ต่ำสุด **4.7174:1** (AA 4.5:1)
- ผ่าน Arrow/Home/End/Enter/Delete, rename, cancel/delete/return-to-list, search/clear, focus trap/Escape, sticky labels, pinned New chat, independent scrolling, iPad expanded drawer, drag dismissal, empty/loading, copy/regenerate และการคืน viewport state หลังเปลี่ยนหน้า
- จำลอง `visualViewport.height=480` บนจอ 390×900: composer อยู่ภายในพื้นที่ที่มองเห็น mobile nav ซ่อน และคืนค่าเมื่อปิดคีย์บอร์ด เป็นการทดสอบ hook ไม่ใช่หลักฐานคีย์บอร์ด iPhone จริง
- หน้าอื่น 11 หน้า × 390/1440px: **22 ภาพตรงกับก่อนแก้ทุก byte** (`.local/history-scope/comparison.json`)
- Impeccable detector หนึ่งรอบ: `[]`; ตรวจภาพรอบสุดท้ายแบบ inline ตามข้อกำหนดห้าม subagent: `ship` ไม่ใช่ independent review

หลักฐาน local อยู่ใน ignored `.impeccable/review/history/` (`results.json`, ภาพแต่ละ viewport และ loading/empty/keyboard/menu) ไม่ใช่ผลตรวจ AWS หรือการเรียกโมเดลจริง

## ตรวจด้วยตนเอง

1. Safari บน iPhone/iPad จริง: เปิด/ปิดคีย์บอร์ด หมุนจอ split view และ safe area
2. VoiceOver/NVDA: อ่าน title/time/preview, ย้าย focus ในรายการ เมนูต่อแถว และการกลับจาก confirmation
3. Browser ที่ร้านใช้จริง: native popover, การลาก sheet และข้อความยาวในประวัติของบัญชี/ร้านที่ได้รับอนุญาต

งานนี้ยังไม่เผยแพร่ AWS ระบบดีไซน์รวมคงอ้างอิงค่าที่ใช้อยู่ใน source; drift ของ emerald palette ใน `docs/ui-design.md` เป็นของก่อนหน้าและไม่ได้ซ่อมในงานเฉพาะหน้านี้
