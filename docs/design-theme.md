# Earth theme — 17 October 2026

User-selected palette: https://coolors.co/582f0e-7f4f24-936639-a68a64-b6ad90-c2c5aa-a4ac86-656d4a-414833-333d29

ใช้ทั้ง landing และทุกหน้า workspace: พื้นขาวอุ่น, ข้อความ/เมนูเขียวมะกอกเข้ม, น้ำตาลสำหรับยอดขาย, olive สำหรับกำไร และ sage/beige สำหรับพื้นรอง เสียเงิน/ข้อผิดพลาดยังมีสีแดงแยกความหมาย ไม่ใช้สีอย่างเดียวเพื่ออธิบายกราฟ.

Inter เป็นฟอนต์ Latin/ตัวเลขและ Anuphan เป็น fallback ภาษาไทย เก็บ variable TTF และ OFL จาก Google Fonts repository ไว้ใน public/fonts; ไม่มี runtime request ไป Google Fonts. ใช้ font-display:swap และ tabular numbers สำหรับจำนวนเงิน. Cognito classic เป็นบริการภายนอก: ปรับสีและโลโก้ผ่าน CSS ที่บริการอนุญาต; ไม่อ้างว่าใช้ custom webfonts ภายในหน้าของ Cognito.

Dashboard อ้างอิงรูปแบบที่ผู้ใช้ส่ง: KPI กำไรเข้ม, ยอดขายสว่าง, กราฟเส้นรายวันและวงแหวนช่องทาง โดยรวมเฉพาะรายการที่ API โหลดในช่วงเวลาที่เลือก ไม่สร้างประวัติสังเคราะห์ กำไรจาก backend engine เท่านั้น ข้อมูลไม่ครบเป็น null และเว้นเส้น; ไม่มีออเดอร์ไม่สร้างวันที่ยอดศูนย์. วงแหวนใช้เฉพาะยอดรวมบวกและแต่ละช่องทางไม่ติดลบ กรณีอื่นแสดงยอด signed ในรายการแทนสัดส่วน.

กราฟมีเส้นทึบ/ประ, legend, รายการตัวเลข/ตาราง และตัวเลือกวันที่ใช้คีย์บอร์ดได้. Local tests ตรวจการรวม satang/วันกรุงเทพและ incomplete evidence. ไม่เปลี่ยนสูตรหรือ generated preview.
