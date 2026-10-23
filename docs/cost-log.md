## Repository cleanup — 18 October 2026

จัดไฟล์อ้างอิงใน Git เท่านั้น ทดสอบ clean snapshot ในเครื่อง ไม่มี AWS API/deploy/invalidation/model call หรือทรัพยากรใหม่. ค่า billing ด้านล่างเป็นผลตรวจรอบก่อน ไม่ใช่การอ่านงบใหม่ของงานจัดไฟล์นี้.

## 18 October 2026 — frontend/Playground bug-fix release

- เพิ่มเติม13:33:48Z: sidebarภาพรวม source2a358db, เพิ่ม2staticpublishesบนbucket/distributionเดิม (รวมรอบวันนี้6publishes), invalidation7pathsต่อครั้ง. Budgetอ่านก่อน/หลัง: limit350USD actual0.023USD LastUpdated10:38:21.973Zยังล่าช้า. ไม่มีmodel/APIwrites/Backend/IAMchangesในรอบappearanceนี้; MOCK UI readsเท่านั้น.

- Account109991964227 / ap-southeast-1; อ่าน Budget `Hackathon-Team10` ก่อน publish และหลัง publish เวลา13:21:50Z. Limit **350USD**, reported actual **0.023USD**; AWS LastUpdated **2026-10-18T10:38:21.973Z** จึงเป็นข้อมูลล่าช้า ไม่ใช่ค่าใช้จ่ายเรียลไทม์หรือค่าใช้จ่ายรอบนี้.
- ใช้ CloudShell, private S3/CloudFront เดิม; 4 static publishes ระหว่างตรวจมือถือ/แก้ CSV/ปรับหน้าข้อมูลร้าน แต่ละครั้ง invalidation7paths. ไม่สร้าง service/IAM/model/Marketplace subscription ใหม่. บันทึกรุ่นล่าสุดและ readback อยู่ release evidence (ไฟล์อ้างอิงเฉพาะเครื่อง: `docs/release-2026-10-18.md`).
- UI tests ใช้ guest MOCK sessions แยก, product+cost1row, deterministic scenario calculations, API reads, browser-local expense และ static asset requests. คำถาม recorded profit อ่าน API; ไม่เรียก Bedrock/OCR/training ในรอบนี้. ไม่มีการเปลี่ยนเพดานทีม350USDหรือยกเลิก trial target25USD.

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


16 ตุลาคม 2026 Quiet Ledger: งานsource, npm install/buildและbrowserกับlocalAPI/MOCKเท่านั้น. ไม่เรียกAWS deploy/billing/model และไม่เพิ่มcloudresource; ไม่มีการอ่านยอดเครดิตใหม่ในรอบนี้. ภาพทดสอบเข้าmanualreviewเมื่อAIปิด ไม่ใช่Bedrockinference


## Frontend feature merge / release — 17 October 2026

17 October 2026 before static publish: verified account109991964227 / ap-southeast-1 / stackmarginsight UPDATE_COMPLETE. BudgetHackathon-Team10 limit350USD; ActualSpend0.02USD, LastUpdatedTime2026-10-17T02:23:35.531000+00:00 (billing delayed). Trial target25USD unchanged. Plan is only static files on the existing private web bucket and a scoped CloudFront invalidation; no new stack/role/service, model call or training.


## AWS frontend release verified — 17 October 2026

### Earth theme preparation — 17 October 2026 15:27 UTC

Read STS account109991964227, Singapore stackmarginsight UPDATE_COMPLETE. BudgetHackathon-Team10 limit350USD; actual0.02USD, budgetLastUpdated2026-10-17T02:23:35.531Z (lagged); checkedAt2026-10-17T15:27:08.654760Z. Existing hosting only: static UI/fonts plus Cognito presentation and scoped invalidation. No new regional service, IAM, model inference/training or backend release in this slice. Trialtarget25USD/total350USD unchanged. Public font downloads and build run locally/CloudShell.

17 October 2026 actual release: one static publish and7-path CloudFront invalidation on existing resources; existing Cognito client appearance applied/read back. No new stack, IAM role, database, reserved capacity or training; Backend not redeployed. CloudShell build/downloads and S3/CloudFront operations may incur standard usage; no dollar spend estimate presented as actual. Billing before release still ActualSpend0.02USD at02:23:35.531Z (lagged), limit350USD total/trialtarget25USD.

Browser used one fresh MOCK demo session, one simulation, two catalog writes (product/cost), data reads/reload/menu checks. No assistant/OCR inference or LINE messages in this slice. Demo records retain normal expiry policies. Existing retained resources still count toward the team budget. Rollback HTML/config was backed up under /tmp/marginsight-fe-20261017-x4guow2_/.local/pre-release in that CloudShell session (ephemeral); durable source rollback is prior main532bceb plus its verified build/publish and Cognito CSS. Do not delete store data to roll back UI.

Earth theme published17Oct2026: two static publishes/two7-path invalidations during visual QA, one existing Cognito presentation update; finalcommit2074a52. No new AWS resource/backend/IAM/model capacity/training. One fresh MOCK demo session and screen/data reads; no AI inference or merchant data writes. Before-release budget reading0.02USD is lagged at02:23:35.531Z, not a current remaining-credit figure. Temporary rollback snapshots under/tmp/marginsight-earth-091owfib/.local/pre-release and pre-release-final; source rollbackcb11f7f/3560e36 available in Git. No store data deleted for UI rollback.

17Oct2026 catalog cleanup: before publish STS109991964227 and BudgetHackathon-Team10 read15:41:48.566470Z, limit350USD/actual0.02USD lastUpdated02:23:35.531Z (lagged). One static publish/7-path invalidation on existing Singapore hosting, no new resource/backend/Cognito change, no inference/training or merchant writes. Reused existing MOCK session. Rollback under/tmp/marginsight-earth-091owfib/.local/pre-catalog-cleanup; source2074a52 remains in Git.

## Assistant platform/campaign release — 18 October 2026 (Bangkok)

Before preparation: STS109991964227, marginsight Singapore UPDATE_COMPLETE; BudgetHackathon-Team10 limit350USD/ActualSpend0.02USD, lastUpdated2026-10-17T02:23:35.531Z (lagged, not current remaining credit). Trial target25USD and total350USD unchanged. Built both repos in CloudShell/tmp; SAM prepared then executed reviewed code-only existing-resource update, published static frontend once and one7-path CloudFront invalidation. No new resources, IAM roles, regional service, model capacity or training. All scenario calculations use the existing API deterministic engine; no inference/OCR/LINE call. Verification created two isolated MOCK sessions (API/browser) with bounded scenario posts and reads, no real merchant writes. Standard CloudShell/S3/Lambda/DynamoDB/CDN usage may accrue; no estimate is represented as actual spend. Existing retained services still count toward budget.

Frontend rollback snapshots: /tmp/marginsight-campaign-kybr58m0/pre-release in the current ephemeral CloudShell. Durable prior frontend release5c769793245d1ce3adb5d59f6435642c31d41fd4 and backend parent22872bf remain in Git; rebuild/review/redeploy preserved parameters to roll back, never delete store data. Current runtime Frontendf7dcc06/Backend5fb6ed2; later docs-only commits do not change published release markers.

## Latest landing release — 23 October 2026

Before cloud preparation verified STS account109991964227 and existing Singapore stackmarginsight UPDATE_COMPLETE. BudgetHackathon-Team10 limit350USD; ActualSpend0.026USD, LastUpdated2026-10-23T12:43:59.593000Z. This is a lagged billing snapshot, not current remaining credit. Team total cap350USD/trial target25USD remain.

Published Frontend e26e30e once to the existing private web bucket and created one7-path CloudFront invalidation I90EMAWHZPODI5AA50XYX3Y9D4 (Completed). Standard CloudShell/build downloads, S3 reads/writes, CloudFront and API/DynamoDB usage may accrue. No new resource, Backend deployment, IAM/Cognito change, paid reserved capacity, model training, AI/OCR inference or LINE call. One fresh isolated MOCK demo session was created for the app smoke check; no real merchant records were changed. Guest expiry policies remain unchanged.

Prior HTML/config/release backups and build logs are in /tmp/marginsight-fe-20261023-9e7vqeai on this ephemeral CloudShell. Prior frontend source0293124 (runtime2a358db) remains in Git for reviewed rebuild/rollback; preserve the security patch when preparing a rollback. No store data deletion or queue purge is part of rollback. Retained resources from earlier work still count toward the team budget.


## MarginShot branding release — 23 October 2026

Re-read STS109991964227 and BudgetHackathon-Team10 before preparation: limit350USD/ActualSpend0.026USD, LastUpdated2026-10-23T12:43:59.593Z (lagged, not current remaining credit). Existing Singapore stack only; team total350USD/trial target25USD unchanged. One reviewed code-only stack update, one static publish/7-path invalidation, and presentation-only Cognito logo customization. No new resource/role/reserved capacity/training/inference/OCR/LINE message or new demo seeding. Standard CloudShell/S3/Lambda/CDN/API usage may accrue. Previous release backup and logs in /tmp/marginshot-brand-20261023-pmmu_rmz are ephemeral; prior source Frontend3219d16/Backendeb7e7f9 remains in Git for reviewed rollback. Do not delete store data or change OAuth/resource identities to roll back branding.
