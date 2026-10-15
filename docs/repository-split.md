# แยก repository — 15 October 2026

Frontend: https://github.com/skzx1/MarginSight-Frontend
Backend: https://github.com/skzx1/MarginSight-Backend

แต่ละ repo มี package.json/lockfile/CI ของตัวเอง ใช้ Node24 และ npm ci/npm run verify.
Frontend มี workspace web; Backend มี workspace backend เพื่อรักษา CodeUri: backend/dist/ และ relative fixture paths เดิม ไม่ต้องมี sibling ตอนติดตั้ง/build.

## Ownership และ release

Backend เป็นเจ้าของ domain/API/AI/OCR/LINE/storage/IaC รวมเว็บ hosting/auth ทั้งหมด ไม่แยก CloudFormation stack หรือย้าย resources/data. Frontend เป็นเจ้าของหน้าจอ/static assets และ Cognito appearance. เผยแพร่จากสอง repo แยกกัน แต่รักษา API compatibility และ exact origin เดิม. ไม่มี AWS changes จากการแยก source นี้.

ตัวคำนวณ preview ไม่ใช่สูตรเขียนซ้ำ: Backend npm run export:preview สร้าง bundled browser JS + declarations + manifest SHA-256/sourceHashes/formulaVersion. Frontend npm run sync:preview -- --from ../MarginSight-Backend/contracts/browser-preview แล้ว review/commit snapshot และ npm run verify. ปกติ build ตรวจ snapshot ที่เก็บไว้ ไม่ fetch GitHub ไม่ใช้ sibling source. Hash ตรวจความเสียหาย/แก้ไฟล์แต่ไม่ใช่ digital signature; รับ artifact จาก repo/commit ที่ review แล้วเท่านั้น.

เมื่อเปลี่ยนสูตรให้อัปเดต version ตาม policy และ sync snapshot ทั้งสอง repo ใน release เดียวกัน ผลร้านจริงใช้ API เสมอ Golden baseline9บาท/no-program15บาท/discount15%=-14.10บาท/unknown cost ยังต้องผ่าน.

เมื่อเปลี่ยน API ให้รักษา backward compatibility หรือส่ง Frontend/Backend เป็น release คู่ และบันทึก commit ของทั้งคู่ใน verification. Frontend templates/fixtures เป็นข้อมูล MOCK ที่ติด repo มา หากเปลี่ยน schema ต้องอัปเดต public templates/fixtures พร้อม data-contracts ทั้งสองด้าน ไม่แอบเรียกข้อมูลแพลตฟอร์มจริง.

## ประวัติและความปลอดภัย

NTT-DATA เก็บ history เดิมและ source รุ่นก่อนแยก ไม่ลบ/force-push. สอง repo เริ่มจาก snapshot ที่อ้าง commit เดิมใน SOURCE.md. ไม่ copy node_modules/.local/.aws/.env/tokens/merchant files/private evidence/output/tmp. เอกสารต้นฉบับ output/ ยังอยู่ใน workspace เดิม.

ใช้ AWS-HANDOFF.md เป็น runbook ปัจจุบัน scripts cloud-* บางตัวเป็นเครื่องมือ operator ของการส่งมอบเดิม อ่าน target/side effects ก่อนใช้ ไม่ถือว่า script ทุกตัวต้องรันทุก release. cloud-deploy.sh ที่สร้าง marginsight-demo ถูกปิดไม่ให้ใช้ผิด; การอัปเดตหลักใช้ prepare-update.py ใน Backend.
