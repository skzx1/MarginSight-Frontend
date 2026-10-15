# เดโมระบบร้านแบบกดเข้าได้ทันที

สถานะล่าสุด 15 ตุลาคม 2026: VERIFIED_AWS_BROWSER สำหรับกดปุ่มเข้าเดโม ดู dashboard จำลองราคา และเปิดเมนูหลัก; VERIFIED_AWS_HTTP สำหรับสอง session แยกร้านและปฏิเสธการเข้าข้ามร้าน. การ import/OCR ผ่าน guest browser ยังไม่ได้ตรวจครบทุกขั้น. ขอบเขตทั้งโครงการยัง PARTIAL_WITH_EXTERNAL_BLOCKERS.

เปิดเว็บ กด **เข้าเดโมระบบเต็ม**. ระบบออก session แบบสุ่มอายุ 2 ชั่วโมงและสร้างร้าน MOCK ของรอบนั้น ไม่ขออีเมลหรือรหัสผ่าน. เมนูร้านใช้ API/domain engine/import worker/assistant/OCR ชุดเดียวกับร้านจริง ภายใต้ session และ membership ของร้านนั้น. ตัวเลขตั้งต้น: รายรับ200บาท ค่าบริการ46บาท ต้นทุน130บาท แพ็ก5บาท โฆษณา10บาท กำไร9บาท margin4.5% TTR28%.

ทดลองนำเข้า แก้ต้นทุน เปิดหลักฐาน จำลองราคา เพิ่มกฎ กระทบยอด และส่งออกได้. ดาวน์โหลดไฟล์ตัวอย่าง CSV/XLSX จากเมนูนำเข้า. ไฟล์สินค้าตัวอย่างมีชื่อ SKU เดิมต่างจาก seed จึงอาจต้องเลือกคงข้อมูลเดิมแล้วตรวจรับไฟล์ ซึ่งเป็น workflow ตรวจความขัดแย้งจริง. ใช้เฉพาะไฟล์จำลอง. ผู้ช่วยและ OCR ใช้ Bedrock เมื่อเปิด AI; OCR ต้องตรวจและยืนยันด้วยคน. LINE แสดงยังไม่เชื่อมและไม่สร้างรหัสผูกใน guest. Native marketplace ยังไม่เชื่อม.

## การแยกร้านและอายุข้อมูล

- Tokenสุ่ม256bits เก็บเฉพาะSHA256ที่server; ไม่ฝังรหัสผ่าน/statickeyในเว็บ. Tokenจริงอยู่เฉพาะsessionStorageของแท็บผู้ทดลองและไม่บันทึกลงlog/evidence.
- แต่ละรอบมีsubject/storeใหม่. Guesttokenใช้ได้เฉพาะ `/demo/api/*` ของร้านที่ผูกไว้. เส้นทางร้านปกติยังตรวจCognitoJWTและmembership; tokenเดโมเข้าไม่ได้.
- Guestสร้างร้านส่วนตัว/ส่งREALinput/ผูกLINEไม่ได้. Sessionหมดอายุแม้TTLยังไม่ลบข้อมูล.
- Membership/catalog/ledger/jobsของguestมีTTLประมาณ24ชั่วโมง; DynamoDBลบภายหลังแบบasynchronous. ไฟล์S3prefixDEMO-GUEST-ใช้lifecycle1วัน; ไม่ใช่รับประกันลบทันทีเมื่อปิดแท็บ.

## ขีดจำกัดเพื่อลดค่าใช้จ่าย

ต่อรอบ: import3ไฟล์, ผู้ช่วย+บิลรวม3requests, POST40ครั้ง. ทั้งระบบguestต่อวันUTC: session20รอบ, import10ไฟล์, ผู้ช่วย+บิลรวม20requests, POST200ครั้ง. เริ่มนับวันใหม่07:00เวลาไทย. ขีดจำกัดmodelcalls/tokens/retriesและfilelimitsเดิมยังทำงาน. เป็นขีดจำกัดprototype ไม่ใช่hardcreditcap. ร้านจริงไม่ใช้quotaguestนี้.

## เปิด/ปิด

SAM parameter `DemoEnabled` ค่าเริ่มต้นfalse. บัญชีที่อนุญาต109991964227 / ap-southeast-1 เปิดด้วย `DemoEnabled=true` ในtemplate-external-roles.yamlของstackmarginsight. ตั้งfalseเพื่อหยุดออกและตรวจรับsessionเดโม. ห้ามเอาAuthorizerNONEไปใช้กับrouteร้านจริง. PublicguestLambdaตรวจOrigin/token/expiry/store/provenance/quotaก่อนเรียกdispatchเดิม. ไม่เพิ่มIAMrolesหรือModeltraining.

Local43tests/typecheck/build/bundledhandlersผ่าน พร้อมตรวจสลับ10เมนูในbrowser. ดูสถานะAWSล่าสุดในstatus/verification; ห้ามนับlocalผลเป็นAWSverification.
