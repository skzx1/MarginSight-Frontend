# MarginShot Frontend

Frontend repository ที่ติดตั้ง/ทดสอบ/build ได้ด้วยตัวเอง แยกจาก [MarginSight-Backend](https://github.com/skzx1/MarginSight-Backend).
ต้นทางและประวัติเดิมอยู่ [NTT-DATA](https://github.com/skzx1/NTT-DATA) ดู [SOURCE.md](SOURCE.md).

## เริ่มใช้งาน

ใช้ Node.js 24:

```bash
npm ci
npm run dev
npm run verify
```

เปิด http://localhost:4050; API สำหรับ local อยู่ http://localhost:4051 ให้เปิด Backend dev อีก terminal. หน้าลองคำนวณ read-only ใช้ snapshot ใน repo นี้ได้เอง; การใช้งานร้านเต็มต้องมี API. เว็บ production อ่าน public config.json จาก publish script.

`npm run build` สร้าง `web/out/`; `npm run package:deploy` เตรียม `artifacts/deploy/` (ไม่ใช่การ deploy).

## โครงสร้างและขอบเขต

- `web/`: หน้าจอ Next.js, assets, Cognito branding, แบบฟอร์มและตัวอย่างไฟล์ MOCK
- `web/src/lib/domain.generated.*`, `domain-types/`, `manifest.json`: snapshot จาก canonical engine ที่ตรวจ hash ก่อน build
- `scripts/cloud-publish.sh`: publish S3/CloudFront เดิม; ไม่สร้าง infrastructure
- `web/src/app/screens/`, `components/`: หน้างานและ UI ร่วมแบบ Quiet Ledger; 6 เมนูหลักและ TH/EN
- `web/src/lib/copy.ts`, `use-resource.ts`: คำแปลและการโหลดข้อมูล; สีและ UI ปัจจุบันอยู่ใน [globals.css](web/src/app/globals.css) และ [earth-theme.css](web/src/app/earth-theme.css)
- `tests/`: golden checks ของ artifact, เงิน/วันที่ และความครบถ้วนของคำแปล

## ขึ้น AWS / ส่งต่อให้ AI

เริ่มที่ [AWS-HANDOFF.md](AWS-HANDOFF.md): target/config, build, change set, publish, acceptance, rollback และ prompt พร้อมส่งให้ AI.
บัญชีเดิม 109991964227 / ap-southeast-1 / stack marginsight; AI direct us-east-1.
Backend เป็นเจ้าของ AWS stack ทั้งชุด Frontend publish ไฟล์เข้า bucket เดิม ไม่มี stack ที่สอง.
ไม่ต้อง deploy AWS เพียงเพราะแยก repo. บัญชีใหม่ต้องตรวจ guard/config/สิทธิ์ก่อนตามคู่มือ.

## สัญญาระหว่าง repo และหลักฐาน

- [วิธีแยก repo / sync สูตร / ownership](docs/repository-split.md)
- [รูปแบบไฟล์](docs/data-contracts.md), [นโยบายคำนวณ](docs/calculation-policy.md), [วิธีใช้](docs/usage.md)
- [สถานะ](docs/status.md), [ผลตรวจ](docs/verification.md), [งบ](docs/cost-log.md)
- [แผนทั้งระบบ](plan.md), [ข้อกำหนด agent](AGENT.md)
- [นโยบายภาพ/บันทึกอ้างอิงที่เก็บเฉพาะเครื่อง](docs/reference-policy.md)

สถานะทั้งโครงการยัง **PARTIAL_WITH_EXTERNAL_BLOCKERS** ตามข้อจำกัด LINE/native platform/real OCR ground truth และการตรวจครบ flow ด้วยสองบัญชี Cognito. โมเดลสำเร็จรูป Nova Lite ยังไม่ได้ fine-tune; สูตรการเงินมาจาก deterministic engine.
เอกสารประวัติที่คัดมามีผลตรวจ monorepo ก่อนแยก และอาจอ้างหลักฐานที่เก็บเฉพาะเครื่องต้นทาง ไม่ได้ส่งข้อมูลส่วนตัว/ignored evidence เข้า repo นี้. ผลตรวจ repo ที่แยกอยู่ท้าย docs/verification.md.
