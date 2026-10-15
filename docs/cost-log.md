> บันทึกด้านล่างก่อนหัวข้อ Repository split เป็นประวัติจาก monorepo; ignored evidence อยู่เครื่องต้นทางและไม่ได้เผยแพร่ตามไฟล์ลิงก์เหล่านั้น ดู AWS-HANDOFF.md สำหรับคำสั่งปัจจุบัน.

# Cost log — 14–15 October 2026

บัญชี109991964227 / ap-southeast-1; directAIus-east-1ตามผู้ใช้อนุญาต ไม่มีMarketplace/ออกองค์กร/แก้SSOpermissions

Budget Hackathon-Team10 limitUSD350 total / ANNUALLY. ActualSpend0.008USD LastUpdated2026-10-15T03:55:27.194000Z จาก inventoryรอบแก้login15ตุลาคม ยอดยังล่าช้า จึงไม่รับรองว่านี่คือค่าใช้จ่ายปัจจุบันหรือเหลือ350เต็ม Creditspage0ไม่แทนเครดิตองค์กร

งบทดลองเป้าหมาย25USD; [rough estimate](cost-estimate.md)1–5USD/monthสำหรับworkloadเล็ก. AWSCalculatorLambda0.25USD/monthเป็นเพียงLambda ไม่ใช่ราคาทั้งระบบ. ค่าใช้จ่ายจริงตรวจBills/CostExplorerหลังอัปเดต

สร้างstackmarginsight: CloudFront/staticweb + protectedAPI, Cognito, on-demandDynamoDB4, privateS3สองbucket, Lambda7, SQS/DLQ3, logs7days และSAMartifactbucket. [รายการจริง](evidence/aws/aws-deployment-evidence.json)

Lambdaaccountconcurrency10; ไม่reserveเพราะขั้นต่ำ100unreserved คิวworker max2/batch1/visibility360s/timeout60s ไม่ใช้provisioned/EC2/NAT/RDS/GPU

AI30calls/ร้าน/วัน output500tokens/round/timebounds; import50files/ร้าน/วัน receipt20files/ร้าน/วัน CSVXLSX5MB/1000rows image3MB/20MP. Failedattemptsนับด้วย ไม่ใช่ hardfinancialcap. Kill switch AIEnabled=false และpauseeventmappingsตามrunbook

ทดลองMOCKimport1000rows/overlap/conflict/OCR1image และmodelcallsปริมาณเล็ก ข้อมูลสังเคราะห์ยังเก็บเพื่อตรวจหลักฐาน คิดstorageตามจริง

## Retained resources จาก rollback

DELETE_SKIPPED; ไม่ได้ลบหรือถือว่าstorageฟรี ต้องตรวจจำนวน/ขนาดและขออนุญาตก่อนลบถาวร

- marginsight-demo-Catalog-KAHQ7RFX7KK5
- marginsight-demo-Jobs-1IC9LFAVI5ZR6
- marginsight-demo-Ledger-GASBWU5GT3BK
- marginsight-demo-Memberships-89V12HT7I5UV
- marginsight-demo-uploadsbucket-dxd0qamvvx2x
- marginsight-demo-webbucket-sjcknej1cgqr

IAMroles7ของstackใหม่สร้างแยกจากCloudFormation ต้องจัดการแยกเมื่อได้รับอนุญาตteardown

ตรวจ2026-10-14T17:01:29Z (15ตุลาคมเวลาไทย): retainedDynamo approximatecount/size0 และS3emptyAtChecktrue; LINEqueuepollerDisabledเมื่อsecretว่างผ่านIaC ไม่ลบdata [storageevidence](evidence/aws/aws-storage-inventory.json). การเรียกAIserviceรอบสุดท้าย2callsพร้อมtoolsและguardedfallbackเป็นMOCK ไม่ใช่training.


รอบส่งมอบ15ตุลาคม: อัปเดตโค้ด Lambda7ตัวและไฟล์เว็บบนทรัพยากรชุดเดิม ไม่เพิ่มบริการ/roles/paid capacity. ทำ MOCK import1000อีก1ชุด พร้อมoverlap5/conflict1 และอ่าน/คำนวณ/เก็บsynthetic snapshots1000รายการ benchmark5357ms. เก็บรายงานตามstore IDsเพื่อแยกการทดสอบ. ภาพบิลและข้อมูลทดสอบยังมี storage cost; LINEpollerยังDisabled. ไม่มีการฝึกโมเดล.

รอบแก้login: อัปเดตAPI route/permissionเฉพาะOPTIONS และhandler204 พร้อม invoke seedสำหรับverified Cognito userหนึ่งบัญชีในMOCK DEMO-001. ไม่มีmodelcalls/บริการคำนวณใหม่/paid capacity. Public financial APIsยังprotected.

Self-service15ตุลาคม: deployโค้ดLambda/เว็บบนบริการเดิม ไม่มีIAMroleหรือบริการใหม่; เพิ่มprivatePROFILE/OWNERmembershipของTonnamShop2rowsและอ่านตรวจร้านว่าง. ไม่มีmodeltraining/modelcallsจากflowนี้. Budgetอ่าน04:49ZยังActualSpendUSD0.008 timestamp03:55:27.194Z จึงไม่ใช้เป็นยอดreal-time. หนึ่งร้านส่วนตัวต่อบัญชีและimport/AIlimitsยังใช้เดิม.


15ตุลาคม2026 12:16น.ไทย: ตรวจบัญชี109991964227และBudget Hackathon-Team10ซ้ำก่อนเตรียมเดโม. limit350USD; ActualSpendยัง0.008USDจากsnapshot03:55:27.194Zเดิม ยอดล่าช้าไม่ใช่ยอดคงเหลือทันที. สร้างCognitoเดโม1บัญชีและMOCK13recordsในDynamoDBตารางเดิม ไม่มีstack/role/paidcapacityใหม่ ไม่เรียกAIหรือส่งอีเมลในรอบเตรียม. รอตั้งรหัสโดยผู้ใช้และทดสอบCognito/browser; เมื่อทดลองAI/OCRยังอยู่ภายใต้limiterเดิม.


15ตุลาคม2026 รอบone-clickdemo: อัปเดตstack/7Lambdaบนบริการเดิม ไม่เพิ่มIAMrole/paidcapacity/trainingjob. เปิดDemoEnabled พร้อมTTL4ตาราง/lifecycleS3guest1วันและglobal/sessionquotas. ทดสอบguest3sessions (browser1+HTTP2), จำลองราคา2ครั้ง และผู้ช่วยผ่านbrowser1request; อาจมีหลายmodelcallsภายใต้orchestrationlimit จึงไม่อ้าง1request=1inference. ทำCloudFrontinvalidation3paths. Budgetก่อนเริ่มยังActualSpend0.008USDจากsnapshot03:55:27.194Z ไม่ใช่ยอดreal-time. กำหนดเป้าหมายทดลอง25USDภายใต้เครดิตทีม350USDรวม; ไม่รับรองhardcapจากBudgets.


15ตุลาคม2026 รอบUIredesign: ตรวจBudgetHackathon-Team10ก่อนpublish limit350USD; ActualSpendยัง0.008USD snapshot03:55:27.194Z จึงไม่รับรองยอดปัจจุบัน. BuildในCloudShellและอัปเดตไฟล์S3/CloudFrontเดิมจากad7bb9f, invalidation4paths IWA6VTMIP623AYBMJGS8C50GH. ปรับCognitoappearanceของappclientเดิมด้วย26ad3e6 ไม่มีนโยบายauthใหม่/roleใหม่/paidcapacity/trainingjob. ทดสอบAWSguest1รอบ/จำลองราคา1request/XLSX1ไฟล์1แถว และเปิดเมนูอ่านข้อมูล; ไม่มีAI/OCRinferenceในรอบUIนี้. การทดสอบlocalไม่คิดเป็นAWSverificationหรือAWSmodelusage. เพดานทีม350USDรวม/เป้าหมายทดลอง25USDและquotasเดิมยังใช้.


## Repository split — 15 October 2026

15 October 2026 repository split: local installs/builds/tests and GitHub source publication only; no AWS API/model/deploy/resource actions performed in this slice. No new spend/credit reading claimed. Team total cap350USD and trial target25USD remain; re-read billing before the next cloud operation.
