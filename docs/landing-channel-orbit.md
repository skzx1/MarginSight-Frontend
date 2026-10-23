# วงโคจรช่องทางบน landing — 21 ตุลาคม 2026

> บันทึกรอบแรก: layout ปัจจุบันปรับตามภาพอ้างอิงทั้งหน้าแล้ว ดู `docs/landing-reference-layout.md` และ `DESIGN.md`. วงโคจรอยู่ใน Hero และมี channel strip แบบนิ่งใต้ Hero; story จังหวะแรกเดิมไม่ได้ mount แล้ว

## ตำแหน่งที่เปลี่ยน

1. `web/src/app/welcome/shop-story.tsx` — story จังหวะแรก เปลี่ยนป้ายออเดอร์ชื่อช่องทางรอบภาพร้านเป็น `ChannelOrbit` รอบเครื่องหมาย MarginSight เดิม
2. `web/src/app/welcome/welcome.tsx` — benefit “ทุกช่องทางในที่เดียว” เปลี่ยนแถบชื่อช่องทางเป็นคอมโพเนนต์เดียวกัน รุ่น compact; เก็บข้อความนำเข้าข้อมูลหน้าร้านแยกไว้

ตารางตัวอย่างรายได้ตามช่องทางยังเป็นตารางข้อมูล ป้าย channel ภายใน workspace และ global channel styles ไม่ได้แก้ไข

## ไฟล์ภาพ

ใช้ไฟล์ผู้ใช้จาก root `public/assets/images` เท่านั้น คัดลอกแบบ byte-for-byte ไป `web/public/assets/images` เพราะ Next app root อยู่ที่ `web` ไม่มีการดาวน์โหลด วาดโลโก้ ดัดสี ตัดภาพ หรือแปลงไฟล์

| ช่องทาง | ไฟล์ที่ใช้ | สถานะ |
|---|---|---|
| Shopee | `shopee.png` | ไฟล์ผู้ใช้ |
| Lazada | `lazada.png` | ไฟล์ผู้ใช้ |
| TikTok Shop | `tiktok.png` | ไฟล์ผู้ใช้ มีพื้นหลังดำในต้นฉบับ เก็บไว้ตามเดิม |
| LINE Shop | ไม่มี | แสดงวงกลมกลางพร้อมชื่อ; `line.png` เป็นเครื่องหมาย LINE ทั่วไป จึงไม่ใช้แทน LINE Shop |

ไม่มีคู่มือ clear-space หรือหลักฐานเวอร์ชันแบรนด์แนบมากับไฟล์ จึงยังไม่ยืนยันการผ่านคู่มือแบรนด์โดยครบถ้วน มีพื้นที่ว่างรอบ artwork และคงอัตราส่วนด้วย `object-fit: contain`; เจ้าของควรยืนยันไฟล์/ระยะขั้นต่ำก่อนเผยแพร่ เมื่อมี LINE Shop ให้คัดลอกไฟล์ตรงแบรนด์และกำหนด `image` ในรายการ `channels` ไม่เปลี่ยนไฟล์ LINE ทั่วไปให้เป็นแบรนด์อื่น

## การเคลื่อนไหวและการเข้าถึง

- CSS หมุน 48 วินาที/รอบ พร้อม counter-rotation ระยะเวลาเดียวกัน; ทุก keyframe เปลี่ยนเฉพาะ transform/opacity ไม่มีไลบรารีหรือ JS animation loop เพิ่ม
- ใช้ Anuphan/Inter และ tokens canvas/surface/sage/olive/ink เดิม; เพิ่ม emerald เฉพาะ background/glow ของคอมโพเนนต์
- สีแบรนด์บน ring/glow เป็น overlay จางที่อยู่ใต้ artwork เปลี่ยนเฉพาะ opacity โลโก้ไม่เปลี่ยนสี
- หยุดเมื่อ hover ด้วยเมาส์, focus-visible ด้วยคีย์บอร์ด หรือแตะเลือก; แตะอีกครั้ง/แตะด้านนอกเพื่อปล่อยการเลือก; Escape ออกจาก focus ของโลโก้ได้
- ปุ่มพัก/เล่นทำให้หยุดต่อเนื่องได้ ไม่จำเป็นต้องค้าง pointer หรือ focus
- IntersectionObserver หยุดเมื่อพ้น viewport; ตรวจ document visibility และ inert/active beat ของ sticky story ด้วย เพื่อไม่หมุนในฉากที่ซ่อนอยู่
- ชื่อที่เลือกแสดงในพื้นที่คงที่ใต้ board ไม่ลอยทับเครื่องหมายกลาง ชื่อทั้งสี่แสดงเสมออย่างน้อย 14px
- กลุ่มมี accessible name ตามรายการช่องทาง; รูปมี alt และปุ่มมีชื่อ ไม่มี live region หรือการประกาศซ้ำตามการหมุน
- ไม่รองรับ JavaScript: SSR markup แสดงครบแบบ static, rotor เริ่ม paused; reduced-motion ปิด animations/transitions ทั้งหมดและแสดง arrangement เดียวกัน
- ขนาด board สูงสุด 520px (compact 480px), มือถือสูงสุด 340px; ปุ่มมือถือ 66px และพื้นที่ถูกจองตั้งแต่ HTML แรก
- ข้อความใช้ “รองรับการนำเข้าข้อมูลจาก” พร้อมข้อจำกัดการใช้ไฟล์ตามแบบ MarginSight และ footer เรื่องเจ้าของเครื่องหมายการค้า

## หลักฐานตรวจ local

- `npm run verify`: ผ่าน TypeScript, preview integrity, browser-secret policy, tests 50/50, static export และ package; รอบท้ายรันนอก sandbox หลังพบ Windows EPERM ใน build directory โดยไม่แก้ source เพื่อลดการตรวจ
- ตรวจ Chromium viewport กว้าง 320, 390, 768, 1024, 1440, 1920px: ทั้งสอง orbit ไม่ล้นแนวนอน ปุ่มอยู่ภายใน board และไม่ชนเครื่องหมายกลางในตำแหน่งที่ตรวจ รูปทั้งสามโหลดครบ ชื่อ 14px, duration 48s
- ตรวจการเลือกโลโก้, keyboard focus ring และพักขณะ focus, Escape, ปุ่มพัก/เล่น, counter-rotation และหยุดเมื่อ story ถูกซ่อน/พ้น viewport แล้ว
- no-JS: ใช้ production HTML ที่ถอด script ทุกตัว (0 scripts) ทดสอบทั้ง 6 ขนาด แสดงทั้งสี่ช่องทางและรูปครบ ไม่มี overflow และ rotor paused
- reduced-motion: ทดสอบ CSS branch ของ build โดยเปลี่ยนเงื่อนไข media เป็นเงื่อนไขจริงเฉพาะ fixture ทั้ง 6 ขนาด computed animation-name เป็น `none` ทุกส่วน และไม่มี overflow **ยังไม่ใช่การทดสอบเปิด Reduce Motion ของ OS จริง**
- ภาพและผลตรวจอยู่ใน `tmp/orbit-*` (local-only); fixture อยู่ใน output ที่ไม่ติด Git ไม่ใช่ route ของแอป
- Impeccable detector ของคอมโพเนนต์ใหม่: ไม่พบรายการเตือน

## ตรวจด้วยเครื่องจริงก่อนเผยแพร่

1. iOS Safari/Android Chrome: แตะเลือก/แตะนอกเพื่อเล่นต่อ, เลื่อนหรือเปลี่ยนแท็บแล้วการหมุนหยุด, กลับมาแล้วโลโก้ยังตั้งตรง
2. เปิด Reduce Motion ที่ OS แล้ว reload: ไม่มี orbit/pulse/stagger, ยังอ่านชื่อและใช้คีย์บอร์ด/VoiceOver/TalkBack ได้
3. มือถือระดับกลางและโหมดประหยัดพลังงาน: ดูความลื่น ความร้อน และการแตะระหว่างหมุน; ทดสอบขยายตัวอักษรและ browser address bar
4. เจ้าของตรวจเวอร์ชันภาพและ clear-space ตามคู่มือแบรนด์ โดยเฉพาะ LINE Shop ที่ยังขาด ไม่มีหลักฐานยืนยันสิทธิ์หรือการเป็นพาร์ตเนอร์จากงานนี้

ไม่ได้ deploy AWS หรืออ้าง native integration ใหม่ งานนี้เปลี่ยนการนำเสนอ landing เท่านั้น
