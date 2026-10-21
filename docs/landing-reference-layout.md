# Landing page — reference-led redesign

ปรับ public landing route `/` ตามภาพอ้างอิงที่ผู้ใช้เลือก โดยปรับทั้งหน้า รวมส่วนล่างและ footer โครงสร้างเป็น header และ hero ที่จัดกึ่งกลางพร้อมวงโคจรช่องทางและตัวอย่างกำไร, แถบช่องทางนำเข้า, ตัวอย่างร้านคู่แผงข้อมูล, ขั้นตอน 3 ข้อ, ตัวอย่างผู้ช่วย, แพ็กเกจ, FAQ, CTA ปิดท้าย และ footer

## ข้อเท็จจริงของเนื้อหา

- ตัวเลขใน hero เป็นตัวอย่างคงที่: ราคา ฿200, ต้นทุน ฿120, ค่าส่ง ฿30 และสมมติค่าธรรมเนียม 15% ไม่ใช่อัตราจริงของแพลตฟอร์ม
- ตัวอย่างกำไร ฿20, ขาดทุน ฿5.50 เมื่อให้ส่วนลด 15% และราคาครอบคลุมต้นทุน ฿176.47 คำนวณตามค่าตัวอย่างที่แสดง
- ช่องทางใช้วงกลม placeholder ที่มีชื่อ เนื่องจากไฟล์โลโก้อย่างเป็นทางการไม่ได้อยู่ใน `public/brands/`; ไม่ใช้โลโก้จากแหล่งอื่นแทน
- ข้อมูลร้านและบทสนทนาเป็นภาพตัวอย่าง ไม่อ้างการเชื่อมต่อหรือคำตอบสดจากแพลตฟอร์ม/AI
- ราคา Premium, โควตา, ข้อมูลติดต่อ และนโยบายที่ยังไม่สรุปคงเครื่องหมาย `[TBD]`
- หน้าใช้ native scrolling; เนื้อหาเก่าที่ไม่ mount บนหน้า landing ยังคงเป็นไฟล์เดิมใน repository

## ไฟล์หลัก

- `web/src/app/page.tsx`: metadata ของหน้า public
- `web/src/app/welcome/welcome.tsx`: entry point
- `web/src/app/welcome/landing.tsx` และ `landing.module.css`: โครงหน้าและรูปแบบเฉพาะ landing
- `web/src/app/welcome/channel-orbit.tsx` และ `channel-orbit.module.css`: วงโคจรที่หยุดเมื่อ hover/focus/เลือกหรืออยู่นอก viewport; no-JS และ reduced-motion ใช้การจัดวางนิ่ง
- `web/src/app/welcome/story-content.ts`: ข้อความ TH/EN และตัวเลขตัวอย่างเพื่อการแสดงผลเท่านั้น

## ผลตรวจ local

`npm ci` และ `npm run verify` ผ่านใน isolated worktree: 50/50 tests, TypeScript, ตรวจ contract/hash, browser secret pattern, static export และ deployment packaging. ไม่มี deployment หรือการเปลี่ยนสูตร/API ในงานนี้. ผลตรวจ viewport/interaction และรายการตรวจบนโทรศัพท์อยู่ในบันทึก verification ของ repository; การตรวจ iOS/Android จริงและ OS Reduce Motion ยังต้องทำบนอุปกรณ์จริง.
