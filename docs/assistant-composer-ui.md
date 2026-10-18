# Assistant — ปรับพื้นที่สนทนาและช่องพิมพ์

18 ตุลาคม 2026 · local static export · ข้อมูลสังเคราะห์สำหรับดู UI

## สิ่งที่เปลี่ยน

- เฉพาะ Assistant: canvas `#F9F8F6`, forest `#1E2D1B` และสีองค์ประกอบตามคำขอ ไม่แก้ shared theme
- Message column และ composer ใช้ `max-width:48rem`, padding ด้านละ 16px และ gutter ของ scrollbar เท่ากัน ขอบซ้ายคำตอบและขอบขวาข้อความผู้ใช้ตรงกับกล่องพิมพ์
- ตัดเส้นแบ่งเต็มความกว้าง ใช้พื้นที่ว่างรอบกล่องสีขาว ขอบ warm `#E2DEC9`, radius16px, เงาเบา และ focus-within ring
- ย้ายตัวเลือกช่วงวันที่และสินค้าเข้า toolbar ในกล่องพิมพ์ เป็น pill พร้อมไอคอนและ chevron ลง เป้ากด44px ข้อความยาวขึ้นบรรทัดได้
- ปุ่มส่งสีเขียวเข้มเมื่อพร้อมส่ง ปิดใช้งานเป็น gray-green และปุ่มหยุดยังคงใช้ไอคอนหยุด
- User bubble เพิ่ม contrast; avatar28px อยู่ใน byline ทำให้เนื้อหา AI ชิดแนวช่องพิมพ์; metadata มีไอคอนปฏิทินและ badge ที่อ่านง่าย
- Header56px เส้นแบ่งเบาลง ตัดปุ่ม+ที่ซ้ำ แชตใหม่ยังอยู่ใน drawer/history sheet
- ปุ่มกลับไปข้อความล่าสุดอ้างอิงความสูง composer จริงผ่าน ResizeObserver รองรับ textarea และ pills ที่ขึ้นหลายบรรทัด
- เก็บ sessions, ผลลัพธ์, copy/regenerate, context dialogs และ viewport/keyboard logic เดิม

## ไฟล์งานรอบนี้

- `web/src/app/screens/assistant.tsx`
- `web/src/app/components/assistant.module.css`
- เอกสารฉบับนี้ และลิงก์จาก `docs/assistant-ui.md`

## หลักฐานและข้อจำกัด

- Production static build รวม TypeScript และ preview integrity ผ่าน
- เปิดดู TH/EN ที่390,768,1024,1440,1920px: ไม่ล้นแนวนอน ขอบ AI/input และ user/input ตรงกัน (คลาด0px), avatar28px, header56px
- เปิดตัวเลือกสินค้าจาก pill และปิดด้วย Escape ได้; เก็บภาพ disabled/active/focus ของช่องพิมพ์
- Browser page errors:0; รูปและค่าขนาดอยู่ใน ignored `.impeccable/review/composer/`
- งานรอบนี้ไม่ได้รันชุด automated tests หรือเรียกโมเดลจริง และไม่ได้ deploy
- Finish review ทำใน agent หลักตามคำสั่งห้าม subagents

ควรลองบน iPhone/iPad จริง: คีย์บอร์ดขึ้น/ลง, safe area, หมุนจอ และพิมพ์หลายบรรทัดพร้อมเลือกชื่อสินค้ายาว รวมทั้ง VoiceOver/NVDA สำหรับ context dialogs
