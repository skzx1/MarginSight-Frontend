# ไฟล์อ้างอิงที่เก็บเฉพาะเครื่อง

ตั้งแต่ 18 ตุลาคม 2026 repo เก็บโค้ด assets ของเว็บ tests CI scripts สัญญาข้อมูล นโยบายคำนวณ คู่มือใช้งาน/ขึ้นระบบ และสถานะการตรวจไว้ตามเดิม.

ภาพใน `docs/design/` และบันทึกงานต่อไปนี้เก็บเฉพาะเครื่อง: `assistant-composer-ui.md`, `assistant-history-ui.md`, `assistant-ui.md`, `design-theme.md`, `finance-ui.md`, `products-ui.md`, `store-settings-ui.md`, `ui-design.md`, `welcome.md`, `release-2026-10-18.md` ภายใต้ `docs/`.

ไฟล์เดิมยังอ่านได้ในเครื่องเจ้าของที่ path เดิม และมีสำเนาสำรองนอกสอง repo ใน `.local/repo-reference-archive/2026-10-18/` ภายใต้ workspace พร้อม manifest SHA-256. `.gitignore` กันนำกลับขึ้น Git โดยไม่ตั้งใจ. เครื่องที่ clone ใหม่ไม่ต้องมีไฟล์เหล่านี้เพื่อ build/test/deploy; ห้ามใช้เป็น dependency ของ scripts.

บันทึกเก่าอาจกล่าวถึงภาพ/รายละเอียดที่เก็บเฉพาะเครื่อง ให้ตรวจหลักฐานและข้อจำกัดใน [verification](verification.md), [สถานะ](status.md), [งบ](cost-log.md) และ [runbook](../AWS-HANDOFF.md). UI ปัจจุบันอ้างอิง source ใน `web/src/app/`, สีใน `globals.css`/`earth-theme.css`; ผลการเงินอ้างอิง Backend API และ canonical engine.

การจัดไฟล์นี้ไม่เปลี่ยน runtime/AWS และไม่ลบประวัติ Git เดิม. หากต้องการนำไฟล์กลับมาเผยแพร่ ต้องเลือกไฟล์และตรวจเนื้อหาก่อนเอาออกจาก ignore list.
