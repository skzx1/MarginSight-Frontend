## จัด repository — 18 ตุลาคม 2026

นำภาพและบันทึกอ้างอิง19ไฟล์ออกจาก tracked tree ตาม [reference policy](reference-policy.md); ต้นฉบับและสำเนาสำรอง SHA-256 ยังอยู่ในเครื่อง. Clean snapshot ที่ไม่มีไฟล์เหล่านี้ผ่าน `npm ci` / `npm run verify` (50tests, typecheck, static export, packaging). Runtime/สูตร/assetsของแอป/CIไม่เปลี่ยน และไม่มี AWS deployment รอบนี้. สถานะโครงการยัง PARTIAL_WITH_EXTERNAL_BLOCKERS.

## อัปเดต 18 ตุลาคม 2026 — รุ่นเว็บล่าสุด

**PARTIAL_WITH_EXTERNAL_BLOCKERS**. Pull upstream `69947ed`, คงผู้ช่วยใหม่และแยกแพลตฟอร์ม/แคมเปญไป Playground. แก้ CSV partial cost save/retry/ข้อมูลที่ยังไม่บันทึก, แจ้งเตือนเมื่อรายละเอียดออเดอร์ไม่ครบ และปรับหน้าข้อมูลร้านให้ใช้ shared shell/สีเดียวกับเว็บไซต์.

Frontend sourceล่าสุด **2a358db** ขึ้น AWS เดิมแล้ว13:33UTC; sidebarหน้าภาพรวมใช้แบบเดียวกับสินค้า/ข้อมูลร้าน ย้ายเลือกเปลี่ยนร้านมาในpage headerข้างช่วงเวลา. Invalidation Completed, public releaseตรงcommit, 50tests/buildผ่านlocal/CloudShell; MOCK browserตรวจdesktop/mobile/tabletและช่วงเวลา. ก่อนหน้านี้ตรวจCSVต้นทุน123.45หลังreload, assistant profit9, Playground Lazada profit7.46, finance expense100/CSVexport. หลักฐานแยกรอบและข้อจำกัด (ไฟล์อ้างอิงเฉพาะเครื่อง: `docs/release-2026-10-18.md`).

> บันทึกด้านล่างก่อนหัวข้อ Repository split เป็นประวัติจาก monorepo; ignored evidence อยู่เครื่องต้นทางและไม่ได้เผยแพร่ตามไฟล์ลิงก์เหล่านั้น ดู AWS-HANDOFF.md สำหรับคำสั่งปัจจุบัน.

# สถานะ MarginSight — 15 ตุลาคม 2026 (งานเริ่ม14ตุลาคม)

**PARTIAL_WITH_EXTERNAL_BLOCKERS** บัญชี109991964227 / stack `marginsight` / ap-southeast-1; Bedrock direct us-east-1 ตามผู้ใช้อนุญาต

เว็บ https://d2y04qc334m0rd.cloudfront.net

ยังไม่อ้าง CORE_AWS_VERIFIED หรือ FULL_SCOPE_VERIFIED: มี Cognito user ที่ยืนยันอีเมลและผูก MOCK DEMO-001 แล้วหนึ่งบัญชี แต่ยังต้องตรวจ workflow ร้านผ่านบัญชีนี้/สองผู้ใช้สองร้าน และยังไม่มี LINE channel

| งาน | สถานะและขอบเขต |
|---|---|
| สูตรกำไร / margin / fee ratio / TTR | VERIFIED_LOCAL; golden15/9/-14.10บาท, exact satang, VAT/caps/allocation/refunds/history; engineเดียว |
| CSV/XLSX / import1000rows | VERIFIED_LOCAL; VERIFIED_AWS สำหรับ CSV operator smoke ผ่าน privateS3/SQS/Lambda/DynamoDB รวมซ้ำ/ซ้อน/conflict; positive browser importยังไม่ได้ทดสอบ |
| Review / revision / retry | VERIFIED_LOCAL; AWS conflictพักรายงานและรักษายอดเดิม; UIเปรียบเทียบ คงเดิมหรือใช้ใหม่พร้อมrevision/เหตุผล |
| Infrastructure / worker | VERIFIED_AWS stack UPDATE_COMPLETE, health/import/OCR; ดู docs/evidence/aws |
| Auth / tenant | VERIFIED_LOCAL สองผู้ใช้สองร้าน; VERIFIED_AWS_BROWSER บัญชีจริงสร้างร้านส่วนตัว/เปิดร้านว่างได้; AWSสองผู้ใช้และworkflowครบยังไม่ทดสอบ |
| เว็บ | DEPLOYED_UNVERIFIED สำหรับ workflowร้าน; VERIFIED_AWS public MOCK preview + Cognito form; อ่านอย่างเดียวใช้สูตรจริงในbrowser ไม่อ่านฐานข้อมูลร้าน |
| ต้นทุน / rules / enrollment / reconciliation / export | VERIFIED_LOCAL; authenticatedAWS workflow BLOCKED_EXTERNAL; ยังไม่ใช่ REAL platform adapter |
| ผู้ช่วยไทย | VERIFIED_LOCAL orchestration/เลขผิด/provider error/tool bounds; directConverseเรียกสำเร็จ; VERIFIED_AWS operator service: model2calls/toolsจริง + guardedfallbackตรง-14.10บาท; web/Cognitoassistantendpointยังไม่ได้ทดสอบ |
| OCR / confirm | VERIFIED_LOCAL confirm/units/tenant; VERIFIED_AWS extraction1ภาพสังเคราะห์ จำนวน6 ยอด780.00ตรง แต่ชื่อ/หน่วยผิด ต้องตรวจด้วยคน |
| LINE | VERIFIED_LOCAL HMAC/atomic expiring single-use link/event dedup; handlers/queues deployแล้ว; live BLOCKED_EXTERNAL |
| Deploy / cost | VERIFIED_AWS infrastructure และ scopedroles7; Budget350USD total; actual billing snapshotยังล่าช้า |

## สิ่งที่ต้องมีเพื่อปิดงานจริง

1. ทดสอบข้อมูลร้านจริงผ่านauthenticated workflowครบ และบัญชีที่สองสำหรับAWS isolation; การสร้าง/เปิดร้านว่างของบัญชีจริงผ่านแล้ว. เจ้าของกรอกรหัสผ่านในหน้าล็อกอินเอง ไม่ส่งในแชท
2. LINE channel secret/access tokenใน Secrets Manager ที่อนุญาต ตั้ง secretARNและสิทธิ์อ่านเฉพาะARNให้ webhook/worker พร้อม LINE userสำหรับlink/live reply
3. รายงานสินค้า/ออเดอร์/การเงินและ schemaที่ร้านอนุญาต ต้นทุนพร้อมหน่วย หลักฐานเข้าแคมเปญ/กฎจริง เพื่อทำ REAL adapterและกระทบยอด ห้ามอ้าง mock-v1เป็นรายงานแพลตฟอร์มจริง
4. ภาพบิลจริงที่ได้รับอนุญาตพร้อมเฉลย เพื่อประเมินชื่อสินค้า/หน่วย/ยอดมากกว่าภาพสังเคราะห์หนึ่งภาพ

เพดาน prototype: import50files/ร้าน/วัน receipt20files/ร้าน/วัน AI30calls/ร้าน/วัน output500tokens toolไม่เกิน4/รอบ ไม่เกิน3รอบ ไม่ใช่ hard budget cap ดู docs/verification.md และ docs/cost-log.md


รุ่นปัจจุบัน: margin-v1.1.0 / backend39testsผ่าน; ล่าสุด AWS import1000แถวผ่าน transaction-based worker และคำนวณ1000รายการใน5357msด้วยoperatorIAM. เว็บแก้การสลับเมนูแล้ว ตรวจ10เมนูในlocal และยืนยันค่าบริการหลังอ่าน3รายการจริงจากMOCKreportได้. เงินหักใหม่ทำให้ต้องตรวจยืนยันใหม่; แก้ต้นทุนเก็บเวอร์ชันเดิม. ดูรายละเอียด/ขอบเขตหลักฐานในverification ไม่ยกผลoperatorมาแทนCognitoE2E.

แก้ Failed to fetch: OPTIONS preflight204/bodyว่างสำหรับoriginเว็บที่อนุญาต, GETข้อมูลร้านไม่มีtokenยัง401 และoriginอื่นไม่มีACAO. ยืนยันCognitoหนึ่งบัญชี CONFIRMED/email_verified และผูก OWNERเฉพาะMOCK DEMO-001 โดยไม่อ่าน/เปลี่ยนรหัสผ่าน. หลังแก้การเชื่อมต่อและผูกสิทธิ์ ผู้ใช้ยืนยันวันที่15ตุลาคม2026ว่าเข้าสู่ร้านได้แล้ว (USER_CONFIRMED). ยังไม่แทนการทดสอบทุกworkflowหรือสองผู้ใช้สองร้านโดยagent.

USER_CONFIRMED 15ตุลาคม2026: เจ้าของแจ้งว่า “เข้าสู่ร้านได้แล้ว” หลังล็อกอินใหม่. ปิดปัญหา Failed to fetch/เข้าร้านสำหรับบัญชีนี้; คงสถานะ PARTIAL_WITH_EXTERNAL_BLOCKERS สำหรับscopeอื่นตามตาราง.


## Self-service — 15 October 2026

VERIFIED_LOCAL: 39tests/typecheck/build/bundledhandlers/staticexport. เพิ่มauthenticated POST /me/store หนึ่งร้านส่วนตัวว่างต่อsubjectแบบatomic; ไม่รับowner/storeIDจากclient; retriesไม่เพิ่มร้านซ้ำ. เพิ่มmanualproductและmerchant-v1 REALcanonicalimportพร้อมownershipack/requiredmoney/unitvalidation. ตัวเชื่อมnativeplatformยังไม่เปิดเมื่อไม่มีsample/mapping.

VERIFIED_AWS_BROWSER: deployรุ่นใหม่แล้ว และสร้าง TonnamShop ผ่านบัญชีที่ล็อกอินจริงได้ เห็นหน้าเริ่มใช้ร้านว่างพร้อมปุ่มสินค้า/นำเข้า. ไม่เติมสินค้า/ออเดอร์/อัตราจำลองในร้านนี้. [ภาพ](evidence/aws-tonnamshop-self-service.png). ยังไม่อ้าง signupใหม่โดยagentหรือทุกworkflowการเงินจริงบนAWS; ผู้ใช้ตั้ง/กรอกรหัสผ่านเอง. ขอบเขตอื่นยัง PARTIAL_WITH_EXTERNAL_BLOCKERS ตามหลักฐาน.

AWS read-backผ่าน: TonnamShopมีPROFILE+OWNERmembershipตรงกัน, CognitoCONFIRMED/emailverified, catalog0/order0 และPOSTสร้างร้านไม่มีtoken401. [หลักฐาน](evidence/aws/self-service-store-evidence.json). ไม่ต้องมีoperatorผูกร้านสำหรับบัญชีใหม่แล้ว.


## Separate full app demo — 15 October 2026

เตรียมบัญชีCognitoเดโมและร้านMOCKเฉพาะDEMO-FULL-20261015แล้ว พร้อมสินค้า/ต้นทุน/กฎ/โปรแกรม/ออเดอร์/เงินหัก13records. VERIFIED_AWS_OPERATOR atomicwrite/read-back; VERIFIED_LOCAL fixtureengineกำไร9บาทและไม่ให้subjectเข้าร้านเดโมอื่น. รอเจ้าของตั้งรหัสผ่านเองและทดสอบล็อกอินใหม่ จึงยังไม่อ้างว่าเข้าใช้งานบัญชีใหม่นี้สำเร็จ. ไม่แก้ระบบauthหรือสิทธิ์ร้านส่วนตัว. LINE/nativeplatform/OCRgroundtruthและexternalblockersอื่นคงตามตารางเดิม.


## One-click guest demo — 15 October 2026

VERIFIED_LOCAL: เพิ่มปุ่มเข้าเดโมระบบเต็ม สร้างร้านMOCKใหม่ต่อรอบโดยไม่ใช้รหัสผ่าน; sameengine/API/domain, tokenhash+expiry/storebinding, ปิดREAL/personalstore/LINElink, quotasและTTL. 43tests/typecheck/fullbuild/bundledhandlersผ่าน; localbrowserกดปุ่มเข้าdashboardกำไร9บาทและสลับ10เมนูไม่พบruntimeerror. AWSdeployment/guestbrowserE2EยังPENDINGในขณะบันทึกนี้. ดูdocs/demo.md.


## One-click demo AWS read-back — 15 October 2026

Stack marginsight UPDATE_COMPLETE หลัง execute change set samcli-deploy1792042662 (source a2aaeb0), LastUpdatedTime 2026-10-15T05:42:09.587Z. ส่ง web/out ไป private web bucket และ CloudFront; health ผ่าน. Change set ไม่มี Remove/IAM resource ใหม่/definite replacement; table keys และ Cognito route security คงเดิม.

VERIFIED_AWS_BROWSER: กด “เข้าเดโมระบบเต็ม” โดยไม่ใช้อีเมล/รหัสผ่าน ได้ร้าน MOCK เฉพาะ session เห็นรายรับ200 กำไร9 margin4.5% TTR28%; จำลองลด15% ได้รายรับ170 ค่าบริการ39.10 กำไร-14.10 ราคาที่ตรวจแล้วไม่ขาดทุน188.31บาท. เปิด10เมนูได้. ผู้ช่วยจากหน้าเว็บคืน MODEL_NUMBERS_REJECTED แล้วใช้ deterministic fallback แสดง-14.10ถูกต้อง; ไม่อ้างว่าคำตอบโมเดลผ่าน numerical validation. LINE แสดงไม่มีChannelและปิดปุ่มlink.

VERIFIED_AWS_HTTP 05:46:47Z: ออก guest capability สองรอบ ได้คนละร้าน, dashboard900สตางค์, scenario-1410สตางค์; cross-store403, guesttokenบนnormalCognito route401, ไม่มีtoken401. ไม่บันทึกtokenหรือรหัสผ่าน. [ภาพเดโม](evidence/aws-oneclick-demo.jpg), [HTTP evidence](evidence/aws/guest-demo-live-evidence.json).

ยังไม่ใช้ผลguestแทนสองบัญชีCognito/ข้อมูลร้านจริง; import/OCR/review/confirm/exportทุกขั้นผ่านguest browserยังไม่ตรวจครบ. Local43testsและผลoperatorเดิมมีขอบเขตตามส่วนก่อนหน้า. สถานะทั้งโครงการ PARTIAL_WITH_EXTERNAL_BLOCKERS; LINE/nativeplatform/realreceipt groundtruth ยังต้องมีข้อมูลภายนอก.


## UI redesign — 15 October 2026

VERIFIED_LOCAL: ดีไซน์ใหม่หน้าเริ่มต้น/onboarding/preview, 10เมนู, error/404; CSS/SVGร่วมกันและresponsive drawer. ตรวจครบ10เมนูบนคอม/390px ไม่มีpageoverflow, Escapeคืนfocus, XLSXรับ1และไฟล์ซ้ำduplicate1, เพิ่มสินค้า/ต้นทุน154.50/หลักฐานแคมเปญผ่านUI. Golden9และ-14.10บาทตรงเดิม. 43tests/typecheck/policy/bundledhandlers/build/packageผ่าน; error/404ที่เพิ่มท้ายรันwebbuildผ่านซ้ำ.

VERIFIED_AWS_BROWSER: เผยแพร่staticจากad7bb9fบนS3/CloudFrontเดิมและhealthผ่าน; เข้าguestMOCK, เปิด10เมนู, dashboard9บาท, simulation15%=-14.10บาท. นำเข้าorders.xlsxผ่านbrowserจริงสำเร็จรับ1/ซ้ำ0/ผิด0/conflict0. Cognitoclassicbrandingจาก26ad3e6อ่านกลับCSSตรง/มีlogo, ตรวจหน้าsignup/signinจริงโดยไม่submitcredentialsหรือสร้างบัญชีใหม่. ไม่อ้างว่าได้ทดสอบทุกmutation, liveOCR, LINEหรือสองบัญชีCognitoครบflowในรอบนี้.

ดูการออกแบบและขอบเขตผลตรวจ (ไฟล์อ้างอิงเฉพาะเครื่อง: `docs/ui-design.md`), ภาพAWS MOCK (ไฟล์อ้างอิงเฉพาะเครื่อง: `docs/design/marginsight-desktop.jpg`). การเปลี่ยนรอบนี้เป็นwebstaticและCognitoappearance ไม่มีIAMroles/บริการใหม่/การเปลี่ยนสูตร. คงPARTIAL_WITH_EXTERNAL_BLOCKERSตามรายการข้อมูลและintegrationเดิม.


## Repository split — 15 October 2026

VERIFIED_LOCAL: standalone install/build/test completed for both repositories. Backend43 tests and bundled handlers pass; Frontend5 golden/artifact checks, TypeScript and Next static export pass. No new AWS deployment or resources in this split. Project remains PARTIAL_WITH_EXTERNAL_BLOCKERS. See AWS-HANDOFF.md for current runbook.


## Quiet Ledger — 16 October 2026

Frontend source redesign เสร็จ:4เมนูหลัก mobile-first, TH/EN, แชตเต็มหน้า, ledger/หลักฐาน, ฟอร์มทุกงาน, local fonts และ Cognito CSS source. npm run verify ผ่าน9tests/typecheck/policy/staticexport/packaging. Browser local MOCK ผ่าน11หน้าที่390/768/1440px และงานสินค้า/ต้นทุน/rule/enrollment/importซ้ำ/ข้อขัดแย้ง/manualreceipt/export ตาม docs/verification.md

ยังไม่publishAWS; cloudUIและCognitoappearanceยังเป็นรุ่นก่อน. ไม่เปลี่ยนBackend/สูตรหรืออ้างliveintegrationใหม่. คงPARTIAL_WITH_EXTERNAL_BLOCKERS; ดู docs/ui-design.md สำหรับระบบภาพและข้อจำกัดAPI/การแปล


## Frontend feature merge / release — 17 October 2026

VERIFIED_LOCAL: merged yoshi/new-ui-design and prepared production static build. Seventeen tests pass. New landing and /login/ preserve the existing origin-root Cognito callback via a client redirect. API/catalog/assistant writes use confirmed responses; unsupported settings are visibly disabled. AWS release remains pending until publish/read-back/browser verification is recorded.


## AWS frontend release verified — 17 October 2026

VERIFIED_AWS (17 October 2026): yoshi/new-ui-design merged through d11f935; releasecb11f7f is live at https://d2y04qc334m0rd.cloudfront.net/ (workspace /login/). Seventeen tests passed locally/CloudShell/GitHub Actions. Static asset read-back/invalidation/Cognito appearance/HTTP denials passed. AWS browser confirmed MOCK9THB baseline,15%=-14.10THB, confirmed product+154.50cost after reload and all12screens opening. Screens use API-confirmed data; offline save/assistant fabrication and dummy catalog enrichment removed. Price/quantity form inputs are unsaved pre-expense drafts only; settings profile/notifications are visibly disabled until a real save API exists. Backend/resources/auth policies unchanged. FULL_SCOPE is not claimed; LINE/native platform/real OCR/two-user workflow blockers remain. See verification for exact evidence and scope.

## Site-wide earth theme — 17 October 2026

VERIFIED_LOCAL / VERIFIED_AWS for this UI slice: source2074a52435728f6408aa13cc862d6e300cc4483e is live. Anuphan + Inter self-hosted, selected earth palette throughout landing and12workspace screens, dark desktop navigation/KPI, daily sales/profit chart and channel donut. Cognito classic colors/logo applied; external hosted auth retains service-controlled fonts/background outside the form. Dashboard aggregates API engine outputs only; one day is shown as points, incomplete profit is unknown/gapped and no loaded orders produce no points/donut. Nineteen tests and static export/package passed locally and CloudShell. Read-back, CDN completion and AWS browser checks recorded in verification. Overall remains PARTIAL_WITH_EXTERNAL_BLOCKERS (existing LINE/native platform/real OCR/two-user full workflow evidence unchanged).

17Oct2026 catalog UI VERIFIED_AWS release5c76979: duplicated plus/page headings/back link removed; verified click/back and layout at390/1440px. See verification; overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged.

## Assistant platform/campaign selection — 18 October 2026

VERIFIED_LOCAL / VERIFIED_AWS for this feature slice: Frontend f7dcc060b6a5d885f864da9ae42659eb5874d4ef and Backend 5fb6ed2d1a5f139678e48d89db9df36461088278 are deployed. Assistant supports Shopee PRIME/LiveXtra, Lazada Premium and TikTok BCD/Flash Sales with merchant-confirmed base fees, VAT, category and exemptions. Deterministic engine margin-v1.1.0 calculates hypothetical selected-SKU scenarios, discount, break-even and comparison without changing actual orders or joining campaigns. Unknown rates remain incomplete. Local/CloudShell verification: Backend50 and Frontend21 tests pass, builds and packaging pass. Actual AWS browser tested all three platform calculations and TikTok exclusivity at1440/390px; no horizontal overflow. See assistant-marketplace.md and verification.md for boundaries/evidence. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains; existing LINE/native-platform/real-OCR/two-Cognito-user full workflow evidence is unchanged.

## Latest landing publication — 23 October 2026

VERIFIED_LOCAL / VERIFIED_AWS for this release slice: latest landing source e7c0701 plus security patch e26e30e is published on existing S3/CloudFront. Next16.4.3,53 tests/local and clean CloudShell verification pass; local npm audit reports zero known dependency vulnerabilities. Actual browser checked the editable illustrative discount example, missing cost, TH/EN mobile layout/menu and a fresh MOCK app overview9THB/4.5% with assistant screen opening. Backend/runtime formulas remain unchanged (margin-v1.1.0). No new AWS resources or auth policy changes. Details in verification.md and cost-log.md; overall PARTIAL_WITH_EXTERNAL_BLOCKERS and prior real OCR/LINE/native-platform/two-Cognito-user limitations remain.


## Product name — 23 October 2026

MarginShot is the current user-facing product name. VERIFIED_AWS branding source Frontend330cf09/Backend4405954 includes website, assistant/export copy and Cognito logo. Existing GitHub repository names/AWS identities/API health identifier remain compatible. Local/CloudShell53+50 tests and published name checks pass; see verification.md/cost-log.md. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS and prior external integration limitations remain.

## Landing logo animation - 24 October 2026 (Bangkok)

VERIFIED_LOCAL / VERIFIED_AWS for this UI slice: runtimee9ef662 is live. Desktop logos orbit on the existing circles automatically, remain upright and have no pause/play control, as requested. Mobile retains a static four-logo row. Local and clean CloudShell53 tests/build checks pass; S3 twelve-file hashes, completed CloudFront invalidation, public release/HTTP protection and live browser motion checks pass. Existing Backend/auth/formula remain unchanged. See verification.md and cost-log.md. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.

## Emerald Unified release - 24 October 2026, 20:49 Bangkok

VERIFIED_LOCAL / VERIFIED_AWS for this UI slice: latest feature claude/design-tokens fast-forwarded to main34ec54d and deployed. Shared Emerald tokens, signed profit/loss, cards/charts, landing/login/workspace, favicon and Cognito presentation are live. Local/CloudShell53 tests and static build pass;13-file S3 hashes, completed CloudFront invalidation, public protections and five MOCK workspace sections checked. Backend/formula/auth policies unchanged. See verification.md/cost-log.md for exact boundaries; overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Local store wording/catalog — 25 October 2026

VERIFIED_LOCAL only: ordinary Thai/English store wording replaces visible Demo text; entry still opens an isolated MOCK store in one click. Five more products and costs are supplied by Backend for fresh guest sessions (seven products total). Frontend 53 / Backend 61 tests and builds passed. Not committed, pushed or deployed; AWS is unchanged. See verification.md. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Assistant data repair and source publication — 25 October 2026

VERIFIED_LOCAL: linked sales now let all five new products use assistant scenarios. Existing CAP-005 chat retry returned28.12THB profit after15% discount. Backend62 tests plus6 Python tests pass; Frontend53 tests pass. User authorized commit/push of the current landing/logo/store wording and catalog/assistant changes. AWS remains unchanged; overall PARTIAL_WITH_EXTERNAL_BLOCKERS. See latest verification entry.


## Orange logo and pending publication — 25 October 2026

New first-reference M + Rising Line SVG assets are VERIFIED_LOCAL (53 tests/build and vector rendering). AWS build/backups completed for the earlier source, but change-set review/execute and static publish remain unverified/unissued; browser control is blocked. Rebuild the new frontend revision before publication. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## 25 October source and release status

Frontend9f3edfe/Backend031467b are VERIFIED_AWS for landing/logo and expanded storefront assistant fix. Real Qwen API/browser CAP-005 discount28.12THB passed; see verification.md. Subsequent user-provided cream/ink/terracotta palette applies all pages and Cognito branding assets locally;53 tests,37role/32contrast checks and14screens pass, live publication pending at this commit. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.
