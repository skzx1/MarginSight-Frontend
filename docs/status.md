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


## Warm palette + Sign in live — 25 October 2026

VERIFIED_AWS appearance: Frontend2bc06b9 is live with user-provided cream/ink/terracotta tokens on all app pages, light sidebar and warm hero motion. Cognito logo/CSS updated and app client unchanged. Local53 tests/37palette roles/32contrast checks/14screens; clean CloudShell53tests; S3hashes/CDN/public protections and five liveMOCK sections checked. Backend031467b expanded-storefront/Qwen fix remains live. Details in verification.md. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Product listing persistence — 25 October 2026

VERIFIED_LOCAL; AWS pending at this commit. Manual/CSV creation saves price and entered quantity. Existing products have an edit form with conflict protection; unknown remains unknown and historic finance is unchanged. See product-listing.md and verification.md. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Product prices live — 25 October 2026

VERIFIED_AWS for product listing persistence and corrections. Frontendf9bc84e/Backend5b61c6a deployed and checked; local/CloudShell56+70tests/Python6. Price and merchant-entered quantity survive create/edit/refresh; cost/history unaffected; zero/missing and tenant/version guards pass. Existing Fee Rules runtime/parameters preserved. Old discarded inputs require one manual re-entry. See latest verification.md and product-listing.md. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Application usage quotas removed — 25 October 2026

User requested all app usage limits removed: no 2-hour guest lifetime, daily/session/write/AI/import/receipt quotas, 100-chat or 200-turn caps. Guest records no longer receive 24-hour TTL; legacy rows read by the app have TTL removed conditionally without changing financial values/version. Opaque guest tokens remain MOCK-only, origin/tenant-bound, revocable and stored in sessionStorage; Cognito remains unchanged. File/content validation, per-request deadlines/token/context bounds, native browser/provider quotas and the $350 team budget remain. Local verification and AWS release evidence follow; deployment is pending at this source commit. No cloud charges from these local tests. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged.


## AWS verified: app usage quotas and catalog campaign chat — 25 October 2026

Deployed and verified account109991964227 / ap-southeast-1. Runtime Frontend `a8bcfa0f1909b6097631d4b7c4626766f06f8fda`, Backend `83200ebf9c5b46d18fd1d5c508c3a8e105b0d326`. Existing stack UPDATE_COMPLETE; change set `samcli-deploy1792918702` executed08:59:49UTC; frontend published09:01:23UTC; CloudFront invalidation `I8Y1M6P0CYSESHNDP7MOCQTYCY` Completed. Seven Lambda code hashes and18 published object hashes verified. No infrastructure/config/IAM/resource replacement or new services.

Removed app-imposed 2-hour session lifetime and daily/session/write/AI/import/receipt quotas plus100-chat/200-turn caps. Existing global daily quota demonstrably rejected pre-release creation; post-release new sessions succeed with nonExpiring:true. AWS test backdated the old expiry on an agent-owned MOCK session and verified continued access plus removal of obsolete TTL. Origin/tenant binding, revocation, Cognito, payload validation and bounded individual requests remain. Tokens remain in sessionStorage; closing the browser session can still end local access. AWS service quotas and actual team budget remain.

Seven MOCK fixtures have prices/quantities; catalog discounts work without orders. Campaign popup is checkbox/radio-only, with shared Playground rules, seller options and no numeric/select/details form. Unknown base fees stay unknown. Browser BAG-001200→160/cost130 gives30 before expenses; selected Lazada Premium known fee13.70, no fabricated net profit. Monthly all-SKU answer remains268 from6 recorded orders, independent of selected hypothetical campaign. API no-order ASAW-QA250→200/cost120 yields80 before expenses, netProfit:null; historical dashboard/catalog unchanged. No REAL store writes or model/OCR inference in this release verification.

Status remains PARTIAL_WITH_EXTERNAL_BLOCKERS for the previously recorded real receipt/OCR evaluation, LINE live credentials/message, native platform evidence and two real Cognito-account acceptance gates. These feature-specific checks do not claim full-system/live-merchant verification.


## Requested answer cards and listed-fee subtotal — local verification

Frontend70 and Backend81 tests/builds pass. Catalog answers now include a separate summary card with original/discounted price, cost, calculated fees and backend-owned remaining-after-known-fees subtotal. Monthly result cards remain actual-order measures. Removed the requested long base-fee warning; the numeric subtotal explicitly deducts only calculated fee lines, while missingFields and netProfit:null remain unchanged. Unknown fees/costs are not converted to zero or described as complete net profit. Verified hypothetical200THB discounted price,120cost,24.19known fees gives55.81remaining; complete44.19fees gives35.81. No financial history or campaign enrollment mutation. Deployment pending at this source commit.


## AWS verified: numeric answer cards and listed-fee subtotal — 25 October 2026

Runtime Frontend `d2f12d52433ecae3b2ccafbffd4a6fd7c91ca7ed`, Backend `8ee733d91fa95af292fbf63d621c9a6f9ff48195`. Reviewed exact logged change set `samcli-deploy1792919770` executed09:17:57UTC; stack UPDATE_COMPLETE, seven Lambda hashes match reviewed bundle. Frontend published09:19:53UTC,18object hashes verified; invalidation `I78F5Y93IWBFWO9FPFJ046THQ6` Completed, public release commit matches. No resource/parameter/IAM changes.

AWS API09:21:06UTC: catalog250→200, cost120, known Lazada fees17.12, remaining62.88. Full platform fee total and net profit remain null when base rates/other expenses are missing; no zero substitution or financial-history writes. Requested long warning removed from new answers, replaced with numeric subtotal and a clear listed-deductions scope. Browser existing session survives reload; BAG-001200→160, cost130, fees13.70, card remaining16.30. Card has per-unit scope, rows and collapsed calculation detail; monthly recorded268/6orders unchanged. Old historical replies remain unchanged; ask again or regenerate to see the new card.

All earlier usage-quota removals remain active. PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged for external acceptance inputs previously listed.


## General conversation — local verification, 25 October 2026

Frontend75 / Backend87 tests and builds pass. User-authorized general conversation uses existing Qwen3 32B direct us-east-1, no new model/training/service/role. Existing /assistant POST accepts strict mode:chat; server classifies actual shop calculations without generation, which continue to the deterministic catalog/order adapters. General text generation has no tools, retrieval, SKU, store records or live web access. Only four completed general exchanges are sent as bounded untrusted context, with per-request size/deadline limits. General answers have separate provenance, no fake financial card/monthly reference. Provider failure is an honest retry notice; membership/origin isolation unchanged. AWS deployment and real inference pending at this source commit. PARTIAL_WITH_EXTERNAL_BLOCKERS remains for existing external integrations.


## AWS verified: general Qwen conversation — 25 October 2026

Runtime Frontend `4855e61665991fbe9f7ff9a7f35928598fb962b7`, Backend `8c3708d017d39be6be14d594559ab3cd984e5bd3`. Account109991964227/Singapore. Exact logged change set `samcli-deploy1792921559` executed09:47:01UTC, stack UPDATE_COMPLETE. Seven Lambda code hashes verified; static publication09:48:57UTC,18object hashes match. Invalidation `I2V29V9UJ7J9LEM3AOEIK7N13S` Completed; public release commit matches. No new resources/roles, parameter/route/model changes or training.

Real AWS API09:50:32UTC: Qwen3 32B directly generated a Thai greeting and an English follow-up using conversational context. Both provider=bedrock-chat/model=qwen.qwen3-32b-v1:0, no financial result/card or attached tools/shop data. Financial question returns STORE_DATA without generation; existing catalog subtotal62.88 and monthly268/6orders remain exact. API tenant/origin/no-auth/private-S3/spoofed-input checks still pass. Browser asks general questions without selecting a SKU; actual greeting and five-example answer display AI-only provenance and no fake financial card. Previous general replies are retained; only general conversation text is sent as model context. General advice/creative requests are separate from actual shop amount queries.

User-requested AWS Lambda Environment variables page opened and filtered to ASSISTANT_MODEL_ID; visible actual value qwen.qwen3-32b-v1:0, with BEDROCK_REGION=us-east-1 separately verified. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged for previously documented external acceptance inputs. See general-chat.md for usage/boundaries.


## Ranking correction and 100 merchant questions — local verified

Frontend82 / Backend88 tests pass, including all100 curated intent cases. Corrected requested rank2/3 instead of always selecting first place; Thai ordinals/digits, lowest rank, unknown/mixed exclusions, stable ties, out-of-range notices and follow-ups are covered. Added100 distinct questions in10 categories as a searchable draft picker; selection does not send/infer automatically. No-discount campaign wording explicitly maps to0percent. Question fixture copies have matching SHA; this is content/routing validation, not training or100 live-model evaluations. AWS deployment pending at this source commit.


## AWS verified: 100 merchant questions and ordinal ranking — 25 October 2026

Runtime Frontend `04527bafd537a8809e187bfb4124b62c9eaff126`, Backend `c68b3b4a0a2f1854dcdf5ca26a757a0216c75617`. Account109991964227 / ap-southeast-1. Exact logged change set `samcli-deploy1792923276` executed10:18:18UTC; stack UPDATE_COMPLETE, seven Lambda hashes match reviewed bundle. Frontend published10:20:22UTC,18object hashes verified; invalidation `IA1BKDQTG1EAOARJW0KQPMINDF` Completed, public release commit matches. No resource/role/model/parameter changes, replacement or training.

Added100 distinct merchant questions in10 categories, searchable and selectable as an editable draft. Browser verified100buttons/count100,10categories, no horizontal overflow, search ordinal2 finds2questions and selection does not send automatically. Ranking now respects requested2/3 rather than always selecting first place; live browser rank2 BAG-002profit54.20, follow-up rank3 CASE-004profit50.20. Financial ranking remains complete single-SKU recorded orders with stable SKU ties; unknown and mixed baskets excluded. Out-of-range ranks return notices; follow-ups do not accumulate oversized hidden prompts.

100-question fixture routing benchmark passes; this is not fine-tuning or100 live-model evaluations. Campaign no-discount wording correctly means0percent; missing campaign choice prompts selection; recorded-loss questions use actual amounts. Existing general chat/model page and all prior quota removals remain available. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged for earlier realOCR/LINE/nativeplatform/two-real-Cognito acceptance inputs.

## Website AI message router — 25 October 2026

DEPLOYED / VERIFIED_LOCAL; browser chat acceptance PARTIAL. All website chat messages now reach the existing authorized AWS assistant endpoint with mode chat and last5completed messages from the same conversation. Normal chat uses no tools; fee/profit goes RAG + bounded deterministic tools; ambiguous/low-confidence asks one question. Legacy scenario UI remains separate. No financial formulas added to Frontend.

57tests/typecheck/static export and clean isolated npm-ci verification passed. Published76files08:40:48UTC from5bc3b9d plus uncommitted router source; release.json feature message-router-v3 records dirty state/source hashes. CloudFront four-file public200/hash checks and invalidationCompleted08:41:35UTC. Backend final reviewed code SHA2w+JsdfaYTcW/Qbfyy2BoRNlV5qe643aGWOQhCYcXkU=;86tests. Preserved latest theme/product listing functionality. No commit/push in this slice.

Latest Qwen development classifier score61/68=89.71%, seven excess clarifications; not production accuracy. Final browser financial acceptance is pending: existing-session tab offered by user showed login daily-openings quota error, not active MOCK chat. No quota expansion/token extraction/new-session workaround. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains. Full design/evaluation resides in Backend docs/message-router/README.md.

## Local merge completed — 25 October 2026

LOCAL_MERGED / VERIFIED_LOCAL / NOT_DEPLOYED: base d2f12d5 + preserved local router, campaign payload and catalog-summary integration. Quota removal, current-product calculations and numeric answer cards retained;71tests/full build pass. Backend8ee733d + local router100tests pass. User chose local-only completion; no merged-release upload, commit or push. All conflicts resolved. See latest verification.md; do not treat previous AWS reports as evidence for this combined release.

## Router release ready for deployment — 25 October 2026

READY_FOR_DEPLOY: user explicitly requested commit/push/deploy. Source95ca8fb integrates all latestda63091 features with server routing;83tests/full build pass. Backend5f3c19f/108tests and compatibility path ready. Implementation pushed as a separate batch; final deployed acceptance is recorded after publication, not inferred from source.

## Routed chat published and checked — 25 October 2026

VERIFIED_AWS_API / VERIFIED_BROWSER_MOCK: clean Frontend release4c6880d live, CloudFront invalidationCompleted; Backend5f3c19f runtime with reviewed hash/config preserved.83Frontend/108Backend/9Python checks pass, API8/8plusauth/tenant401/403pass. Browser rank2andfollow-up rank3correct; latest100questions/campaign controls retained. See latest verification.md. Original project external blockers and research/classifier limitations remain distinct.


## AWS verified: latest main and frontend redesign — 25 October 2026

Frontend runtime 8a6a954375f4ed4fdad2c9ef3804b985f1db3a37 published13:10:32UTC (20:10:32Bangkok),74S3objects SHA256 verified, invalidation IE4416BDKY8FOT5NN9C3JNXU8T Completed. Pulled Backend43531e3 including the concurrent cited MOCK fee-answer corrections; deployed API source maps normalize to the same35runtime sources/fingerprint50ed624d0bd7b97cbdeef2624885964690d9fce3cf8d12b967b6e01096a4f007. Existing7Lambda code hash gLZBGYg1m8qxTK8lu/hp/k05ZDv6AliRhHZpdciqyM0= observed after concurrent backend publication. This operation published Frontend only; did not overwrite that backend release or execute CloudFormation.

Browser on a newly opened isolatedMOCK shop: landing/login configuration, enter shop, overview1075THBsales/268THBrecordedprofit/6completeorders,7products with prices and assistant navigation/composer pass. Frontend196/Backend112 tests andPython9 pass. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged: real receipt evaluation, liveLINE, native marketplace mapping, two-real-Cognito-user acceptance. Ignored evidence .local/redesign-release-20261025/release-verification.json; screenshots in Frontend evidence directory.
