## Selected rising-chart logo and border cleanup — 25 October 2026

VERIFIED_LOCAL เท่านั้น ไม่commit/push/deploy. ผู้ใช้เลือกแบบM+RisingLineจากGemini; วาดSVGตามภาพอ้างอิงในpublic/branding (mark, horizontalwordmark, dark/lighticons) และปรับsharedBrand/favicon/จุดกลางHeroDepthให้ใช้แบบใหม่. เป็นSVGที่ถอดแบบเอง ไม่ใช่vectorต้นฉบับที่Geminiexport. CognitoHostedUIและcognito-logo.pngเดิมยังไม่ได้เปลี่ยนบนAWS.

ตามภาพแก้ขอบขาว: เอาสีพื้นwrapperโลโก้ในheader/topbarออก และลบborder/background/glowของcoreในanimation. Browserlocalอ่านกลับwrapper/core background rgba(0,0,0,0), coreBorder0px/coreShadownone; imagesโหลดครบ. `npm run verify` ผ่าน53tests/typecheck/staticexport/package และfinalCSS `npm run build` ผ่าน; XMLparseผ่านSVG5ไฟล์. ไม่มีสูตร/API/auth/ข้อมูลร้านเปลี่ยน. หลักฐานlocal-onlyใน `.local/landing-depth-20261025/logo-borderless-*`; โปรเจคทั้งระบบยังPARTIAL_WITH_EXTERNAL_BLOCKERS.

## Full-viewport landing follow-up — 25 October 2026

VERIFIED_LOCAL เท่านั้น ยังไม่commit/push/deploy. ตามคำขอให้ฉากโลโก้เต็มหน้า เปลี่ยนsceneเป็นabsolute/inset0ไม่มีกรอบหรือมุมโค้ง, heroสูงอย่างน้อย100svhลบheader, เมนูสีเดียวกับฉาก และcopy/CTAอยู่เหนือgradient; ย้ายการ์ดสมมติไปsectionถัดไป. ไม่เปลี่ยนสูตร/API/assetsหรือruntimeAWS.

`npm run verify` รอบนี้ผ่าน53tests/typecheck/previewhash/policy/staticexport/package. Browserdesktop1570×930: sceneและheroleft0/width1555/height850ใต้header80 ตรงพื้นที่ที่เห็น; ไม่มีhorizontaloverflow. Mobile390×844: sceneเต็มcontentwidth375/height776ใต้header68 ทั้งไทยและอังกฤษ; CTAสองปุ่มอยู่ในจอ(bottom742/800), เมนูและlanguage switchอ่านได้. Animationยังrunning; browsererrorlogท้ายงานว่าง. คืนภาษาเดิมENและresetviewportoverrideแล้ว. หลักฐานเพิ่มใน `.local/landing-depth-20261025/fullscreen-*`; สถานะรวมโครงการยังPARTIAL_WITH_EXTERNAL_BLOCKERSเดิม.

## Local landing depth study — 25 October 2026

VERIFIED_LOCAL เฉพาะงานทดลอง landing ที่ยังไม่commit/push/deploy. `git fetch`/`git pull --ff-only origin main` ยืนยันmainตรงoriginที่5eb4fe9 (Already up to date); เก็บlocalanimationครบ. เปลี่ยนheroเป็นcopyคู่กับCSSperspective fly-through ของโลโก้Shopee/Lazada/TikTok/LINEจากassetsเดิม ไม่เพิ่มdependency/backend/formula/API changes. Motionปกติ24s; reduced-motionลดความเร็วเป็น48sและหยุดcamera drift แต่คงlogoเคลื่อนตามคำขอเดิมให้เล่นต่อเนื่อง. Intersection/visibilityหยุดanimationเมื่อพ้นจอหรือtabถูกซ่อน.

`npm run verify` ผ่าน53tests/typecheck/previewhash/policy/staticexport/package; finalCSSแก้แล้วรัน `npm run build` ผ่านอีกครั้ง. รอบแรกsandboxปฏิเสธmkdirใน.next (EPERM); รันlocalbuildนอกsandboxแล้วผ่าน ไม่แก้authหรือสิทธิ์AWS. Browserlocalตรวจ1280pxและ390×844: ภาพโหลดครบ, scrollWidth1265/375ไม่เกินviewport, animationNameflyThroughและtransformเปลี่ยนจริง; sceneRunningfalseเมื่อไป#simulator. ปุ่มลองคำนวณไปsectionได้; ส่วนลด0%แสดงprofit20.00บาทตามfixture แล้วคืน15%. ไม่ใช้AWS/Bedrock/Cognitoหรือข้อมูลร้านจริง. หลักฐานlocal-only `.local/landing-depth-20261025/`; โปรเจคทั้งระบบยังPARTIAL_WITH_EXTERNAL_BLOCKERSตามscopeเดิม.

## Repository cleanup — 18 October 2026

VERIFIED_LOCAL: staged tracked-only snapshot exported with `git checkout-index`; ไม่มี19ไฟล์อ้างอิงที่นำออก. `npm ci` และ `npm run verify` ผ่าน50tests, TypeScript, preview hash/policy, Next static exportและdeploy packaging. ตรวจ34ลิงก์เอกสารหลักรวมสองrepoผ่าน; ลิงก์ไปไฟล์local-onlyแปลงเป็นข้อความกำกับ ไม่ให้เป็นลิงก์เสีย. ต้นฉบับและbackup22ไฟล์รวมสองrepo hashตรงmanifest. ไม่มีruntime/source/fixtures/IaCเปลี่ยนและไม่ได้ทดสอบหรือdeployAWSใหม่. ดู [reference policy](reference-policy.md).

## 18 October 2026 — fresh frontend verification

เพิ่มเติม13:33UTC source2a358db: shared sidebarภาพรวมตรงกับหน้าอื่น, store/period selectorใช้งานได้, responsive390/900/1440px, full50tests/buildผ่านและAWSreadback/invalidationCompleted. หลักฐานอยู่หัวข้อเพิ่มเติมของ release report ด้านล่าง.

ดู release-2026-10-18.md (ไฟล์อ้างอิงเฉพาะเครื่อง: `docs/release-2026-10-18.md`) สำหรับ exact commit, 50 tests, CloudShell build, 4 file hashes matched, invalidation/readback และ AWS browser checks ของผู้ช่วย/Playground/CSV/finance/store desktop/mobile. ทดสอบ guest MOCK เท่านั้น; ไม่ใช่หลักฐานใหม่ของ REAL merchant/OCR/LINE/Cognito สองผู้ใช้.

> บันทึกด้านล่างก่อนหัวข้อ Repository split เป็นประวัติจาก monorepo; ignored evidence อยู่เครื่องต้นทางและไม่ได้เผยแพร่ตามไฟล์ลิงก์เหล่านั้น ดู AWS-HANDOFF.md สำหรับคำสั่งปัจจุบัน.

# Verification — 14–15 October 2026

สถานะ PARTIAL_WITH_EXTERNAL_BLOCKERS; ไม่อ้าง CORE_AWS_VERIFIED/FULL_SCOPE_VERIFIED

## VERIFIED_LOCAL

node scripts/verify.mjs ผ่าน35tests, backend/web TypeScript, browser secret-pattern check, bundled Lambda imports/health/empty-worker, Next16.4.0 static exportและdeployment packaging

35testsครอบคลุม golden15/9/-14.10บาท, missing/zero, history/caps/VAT/rounding/refunds/allocation/exactpayout, Bangkokdate/month, descending150orders, CSV/XLSX validation/1000rows/retry/overlap/conflict, audited partialreview/revision, tenant isolation, Thai fallback, model orchestration/invented-profit rejection/providererror/toolbounds, OCRconfirm/unitmapping, LINEHMAC/atomic single-use linking, atomic AIcounter

Local HTTP smokeหลังแก้review/limits PASS: login/API/two-store403/dashboard900satang/discount15%=-1410satang/Thaifallback/real XLSXexport/privatefile403. Local browserdashboard/simulationตรวจในรอบก่อน ไม่แทน CognitoAWS E2E

Production dependency auditหลังuuid11.1.1 fix: zero vulnerabilitiesในการตรวจครั้งนั้น ไม่อ้างว่าปลอดช่องโหว่ทั้งหมด

## VERIFIED_AWS / ขอบเขตหลักฐาน

CloudShell STS109991964227/SAM1.166.2; stack marginsight ap-southeast-1 UPDATE_COMPLETE, scopedroles7, Node24arm64. [Raw inventory](evidence/aws/aws-deployment-evidence.json)

- /health200, /me/storesไม่มีtoken401, privateuploadsS3bucket403, directwebS3index403, CloudFrontHTTPS200
- Real privateS3/SQS/Lambda/DynamoDB: 1000rowsพร้อมduplicated IMPORTmessages/10chunks complete. accepted1000+duplicate0=1000 ในผลสรุป jobล่าสุด; ส่งซ้ำไม่เพิ่ม canonical orders; overlapping5rowsซ้ำทั้งหมดไม่เพิ่มยอด; changedrevenue PARTIAL/conflict1/คง20000satangเดิม. [Raw import](evidence/aws/import-smoke-result.json)
- Real LambdaOCR -> S3 -> directBedrockus-east-1 -> DynamoDBREVIEW: ภาพสังเคราะห์MOCK1ภาพ จำนวน6 line780.00 total780.00 totalsMatchtrue date14/10/2026; **FAILชื่อสินค้าและหน่วย** ชื่ออ่านเป็นข้อความผิด หน่วยอ่านว่าใน่แทนชิ้น. ไม่ได้confirmต้นทุน. [Raw OCR](evidence/aws/receipt-smoke-result.json), [ภาพ](../../fixtures/mock-v1/receipt-thai-mock.png)
- BasicConverseus-east-1สำเร็จในการpreflight; SingaporemodelmetadataมีเฉพาะINFERENCE_PROFILEและไม่ใช้profileนั้น. [Service smokeจริง](evidence/aws/assistant-smoke-result.json): exactbundle serviceในCloudShell + DynamoDB/Bedrock, modelCalls2/toolNames simulateDiscountและgetCalculationEvidence. Guard DISCOUNT_TOOL_REQUIREDใช้deterministicfallbackตอบขาดทุน14.10บาท/margin-8.29%ตรง. เป็นoperatorIAMscope ไม่ใช่Cognito/Lambdaassistantendpoint E2E

## Failure / remediation

marginsight-demo ROLLBACK_COMPLETE: SSOไม่มีiam:GetRolePolicy. Retained4tables/2buckets inventoried; two-phase foundation + exact scopedroles + SAMexternalroleARN deployสำเร็จ ไม่เปลี่ยนSSO/org

AWSoperator assistant smokeพบDynamoDBValidationExceptionจากbegins_with(sortKey,empty-string)ที่localไม่พบ แก้AwsStorageให้งดsort-keyconditionเมื่อprefixว่าง local35tests/buildผ่านหลังแก้; AWSretestผ่าน: อ่านGSI/ledger/catalogและเรียกtoolได้จริง. [AWS Query contract](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.KeyConditionExpressions.html)

## BLOCKED_EXTERNAL / NOT VERIFIED

PositiveCognitologin/logout/callback/verifiedmembership, tworealusers/stores และ deployed browser CSV/XLSX/review/OCRconfirm/rules/calc/simulation/reconciliation/export/assistant. ผู้ใช้เลือกmockก่อน Agentไม่ได้ตั้งCognito password. LINEchannel/live messageยังขาด. AuthorizedREALplatform/settlementsและmerchantOCRaccuracyยังขาด

OperatorIAMsmokeพิสูจน์เฉพาะservicesที่ระบุ ไม่พิสูจน์browserauth/tenantE2E. Localmodelstubsไม่ใช่หลักฐานinferenceจริง

หลังAWStestพบและแก้Thaifallbackคำว่า “ลดราคา 15%” เพิ่มvalidateddiscount/contextและlossamount whitelist โดยคำตอบการเงินยังสร้างจากengineเสมอ ไม่แสดงmodelmathเป็นผลหลัก.

## Browser HTTPS

เว็บCloudFrontเปิดได้และไม่มีlocal-demo-loginบนAWS; publicMOCKpreviewใช้engineclientแบบอ่านอย่างเดียว: ราคา170/โปรแกรม3% -> profit-14.10/margin-8.29/TTR28.88; ราคา200ไม่เข้าโปรแกรม -> profit15/margin7.5/TTR25; ราคา200เข้าโปรแกรม -> profit9/margin4.5/TTR28. ปุ่มloginถึงCognitoemail/password formที่client/scopes/PKCE/callbackถูกบัญชี ไม่มีการใส่password/signup/positivecallback. [Preview screenshot](evidence/aws-web-preview.png), [Cognito form](evidence/aws-cognito-login.png)

[Storage inventory](evidence/aws/aws-storage-inventory.json): canonicalordercount1000, retainedDynamo4tables approximateItemCount/size0 และretainedS3สองbucketemptyAtChecktrue; LINEeventmappingDisabledหลังCFupdateตามHasLineSecret condition.

## Browser local XLSX review

อัปโหลดไฟล์XLSXจริงสองแถวผ่านUI: รับ1/ผิด1(quantity0), PARTIALทำให้dashboardคง9บาทและแสดงorderไม่ทราบกำไร หลังระบุเหตุผล/ยืนยันรับเฉพาะแถวถูกต้อง -> jobCOMPLETEDพร้อมexcluded-rowaudit, dashboard18บาท/2orders/ไม่มีunknownเพิ่มยอดผิด [ภาพ](evidence/local-xlsx-review.png). ไม่ใช่browserAWS positiveCognitotest. Localdbมีสองordersหลังทดสอบนี้; smoke-localเดิมสมมติinitialseed1orderจึงไม่ควรรันซ้ำโดยคาดยอด9บาทจนแยกtestfixture.

margin-v1.1.0: เพิ่มindependentgoldenWHT100satang + knownplatformfee4600 => rawcash4700/itemcash15300/reconcileexact แต่profit/margin/TTR/feeratiounknown ไม่หักWHTเป็นexpense. เพิ่มunordered-map/legacyhashduplicate regression และrawSHA256abcgolden. SnapshotkeysรวมformulaVersion.

## AWS failure / DLQ recovery

[Raw DLQ result](evidence/aws/dlq-smoke-result.json): actualLambda partial-batch failure, SQSredriveผ่านreceivecounts3/4/5และmatchedDLQ. Operatorขับreceivesเพื่อไม่รอautomatic360sครบทุกครั้ง ทดสอบรอบแรกFAILเพราะpollerที่ยังin-flightรับข้อความก่อนmanualreceive กู้ข้อความทดสอบนั้นสำเร็จ ลบเฉพาะgeneratedpoisonตามmarkerhash และคืนImporteventmappingEnabled ไม่มีapplicationrowsเปลี่ยน ไม่อ้างfullautomatic30-minute retry timing. Scriptfirstattemptแก้ให้รอpollerdrain25sก่อนsendและปล่อยvisibilityผ่านreceiptของข้อความตัวเอง

35testsincludes251-orderdashboard: whole-monthprofit225900satangจาก251orders แต่ตอบlatest50รายการพร้อมscope/total ลดcatalogqueriesเหลือ3ต่อrequest ไม่cacheข้ามtenant/request. Hashlegacyheaderที่ปิดค่าบริการแล้วนำเข้าซ้ำไม่resetstatus.


## รุ่นส่งมอบ 15 ตุลาคม 2026

35 backend tests ผ่าน พร้อม web TypeScript/static build หลังแก้หน้า UI. เพิ่มกรณี ledger transaction/reconfirm, infrastructure transient retry, partial seed recovery และประวัติต้นทุนแบบ immutable. เมื่อมี financial ledger row ใหม่/แก้ conflict ระบบเปิดสถานะค่าบริการให้ตรวจใหม่แบบ atomic; settle ต้องใช้ hash ของข้อมูลที่ตรวจล่าสุดและ CAS header version. ต้นทุนแก้ไขสร้าง correction version เก็บต้นฉบับ; seed เติมเฉพาะรายการขาด ไม่ reset หลักฐานร้านเดิม.

AWS รุ่นนี้ทดสอบใหม่ 2026-10-15T03:32Z: worker รับ 1000แถว/10chunks, ซ้อน5แถว duplicateทั้งหมด, conflict1ไม่เปลี่ยนยอด20000satang; canonical1000orders. ยืนยัน transaction-based import ทำงานด้วย IAM roles เดิม. Benchmark exact bundle + DynamoDB inputs/calculation/synthetic snapshot1000รายการ ใช้5357ms catalogqueries3/concurrency8, รายรับ20000000satang กำไร-100000satangตามเฉลยอิสระ. เป็น operator service test ไม่ใช่เวลาตอบผ่าน Cognito/API Gateway หรือ browser. [ผลดิบ](evidence/aws/backend-1000-smoke.json)

Local browserพบและแก้ runtime crash จาก shared data คนละรูปแบบระหว่างสลับเมนู เพิ่ม optional shape guard, ล้างค่าตอนเปลี่ยนหน้า และไม่รับ refresh response ของ contextเก่า. ตรวจครบ10เมนูแล้วไม่พบ runtime error. หน้าค่าบริการ O-BROWSER-001 ซ่อนปุ่มยืนยันก่อนเปิดหลักฐาน; เมื่อเปิดเห็น3รายการ24+16+6บาท พร้อมsource refs แล้วกดยืนยันได้ ผลกำไร9บาท/margin4.5/TTR28 เปลี่ยนเป็น ACTUAL. [ภาพ](evidence/local-fee-review.png) เป็น local MOCK workflow ไม่ใช่ AWS authenticated E2E.

OCR unitsPerPack เริ่มว่าง ต้องกรอกตามหลักฐานเอง. rawCashDeductionSatang เป็น null หากยังประมาณการ ไม่มีการเรียก estimated cash ว่า posted actual. เว็บแจ้งการเก็บภาพ Singapore30วันและประมวลผล us-east-1 ก่อนอัปโหลด.

รอบ Bedrock ส่งมอบเรียก2ครั้ง/tools simulateDiscount+getCalculationEvidence; ระบบเลือก deterministic fallback ด้วย DISCOUNT_TOOL_REQUIRED ให้ผล-14.10/-8.29ตรง. ผล model-generated explanation ยังไม่ถือว่าผ่านเต็ม จึงแสดงที่มาว่าสูตรคำนวณโดยตรง; ไม่อ้างว่าโมเดลตอบถูกเอง.

หลังตรวจเมนูแก้ React row key ของ fee rules เป็น ruleId+version เพราะกฎหลายประเภทใช้ version เดียวกันได้; TypeScript/static build ผ่านหลังแก้.


## Login failure investigation — 15 October 2026

ผู้ใช้สมัครแล้วพบ Failed to fetch. Read-only HTTP diagnosticพบ OPTIONS /me/stores พร้อม OriginและAccess-Control-Request-Headers:authorization ได้401จาก JWT route ANY /{proxy+}; Cognito token endpointตอบ400 invalid_grantพร้อมCORSถูกต้องสำหรับdummy code. จึงระบุสาเหตุเป็น preflightถูกauthก่อนส่งGETจริง ไม่สรุปว่ารหัสผ่านผิด.

แก้templateและgeneratorเพิ่ม OPTIONS /{proxy+} แยก Authorizer:NONE สำหรับpreflightเท่านั้น; GET/POSTข้อมูลร้านและassistantคงJWT/scopes/tenant membership. อ้างอิง [AWS HTTP API CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-cors.html). ผลหลังdeployและbrowserจะบันทึกด้านล่างเมื่อทดสอบจริง.

เพิ่มเติม: หลังแยก OPTIONS route แล้ว Gatewayส่งถึงLambda แต่handlerยังบังคับsubjectและตอบ401 จึงเพิ่ม early204/bodyว่างเฉพาะOPTIONSก่อนสร้างcloudContextหรืออ่านข้อมูล. Built artifact checksผ่าน OPTIONSสามpath/bodyว่าง และ GET /me/storesไม่มีtokenยัง401. backendTypeScript/buildผ่าน ไม่เปลี่ยนสูตรการเงิน.


ผลหลังแก้จริง: stack UPDATE_COMPLETE; GET/POST preflight204, originเว็บได้ACAOตรงoriginเดียว, originอื่นไม่มีACAO; GET /me/storesไม่มีtoken401 และ protected ANY/assistantยังJWT. [ก่อนแก้](evidence/aws/auth-diagnosis-before.json), [หลังแก้](evidence/aws/auth-diagnosis.json). Built-handler checkครอบคลุมOPTIONS3paths/bodyว่างและGETไม่มีtoken401.

Operatorตรวจอีเมลที่เจ้าของระบุพบหนึ่งบัญชี CONFIRMED/Enabled/email_verified=true แล้วinvoke seedผูก OWNERเฉพาะMOCK DEMO-001; อ่านmembershipกลับจากDynamoตรง; ไม่อ่าน/เปลี่ยนรหัสผ่าน ไม่เก็บemail/subในหลักฐาน. [รายงานยืนยันแบบไม่ระบุตัวตน](evidence/aws/verified-demo-membership.json). Browserเดิมผ่าน APIหลังแก้แล้ว แต่แสดงไม่มีร้านหลังreload จึงให้เจ้าของล็อกอินใหม่ ยังไม่อ้างdashboardของบัญชีที่ผูกสำเร็จจนเห็นผลจริง.


USER_CONFIRMED — 15 October 2026: ผู้ใช้ตอบ “เข้าสู่ร้านได้แล้ว” หลังล็อกอินใหม่ด้วยบัญชีที่ผูกMOCK DEMO-001. เป็นหลักฐานยืนยันจากผู้ใช้หนึ่งบัญชี ไม่ใช่ agent-observed screenshot และไม่ขยายเป็นผลผ่านสองผู้ใช้/สองร้านหรือทุกauthenticated workflow. ปิดissue Failed to fetch/ไม่เห็นร้านสำหรับบัญชีนี้.


## Self-service implementation — 15 October 2026

39 local testsผ่าน รวม15concurrentcreate/oneprivateemptytenant, spoofedowner/storeIDreject, no-auth/cross-tenant/privateuploaddeny, transactionfailureไม่มีorphan, REALcanonicalimportexplicitmoney/units/ownership, independentprofit35บาท/margin35/TTR10จากรายรับ100ต้นทุน50แพ็ก5เงินหัก10. ข้อมูลทดสอบทั้งหมดสังเคราะห์ ใช้ทดสอบเส้นทางREAL ไม่ใช่ข้อมูลร้านจริง/ความแม่นยำplatformadapter.

Local browser: สร้างร้านใหม่จากร้านdemo → เพิ่มสินค้าLOCAL-BAG-1 → ต้นทุน50บาท/ชิ้นวันที่1ตุลาคม → CSVออเดอร์100แพ็ก5 → CSVเงินหัก10 → เปิดหลักฐานก่อนยืนยัน (กำไร/ค่าบริการไม่ทราบเมื่อไม่มีกฎ) → ยืนยันpostedfeesแล้วกำไร35/margin35/TTR10ตรง. เปลี่ยนไฟล์จะresetownershipack. [ภาพ](evidence/local-self-service-ledger.png). AWSรุ่นใหม่นี้รอdeploy/verification ไม่ถือผลlocalเป็นผลAWS.


AWS deploymentของself-service: local39tests/buildผ่านก่อนอัปเดต; เปลี่ยนชื่อinternalschema variableเพื่อหลีกเลี่ยงชื่อชนกันตอนbundle แล้วbuild/built-handlersเช็คผ่านอีกครั้ง (ไม่เปลี่ยนพฤติกรรม). ขึ้น Lambdaรุ่นใหม่และstaticwebผ่านSAM/publishเดิม ไม่มีบริการหรือIAMroleใหม่.

Agent-observed browser: บัญชีCognitoที่มีเซสชันอยู่เปิดหน้าสร้างร้าน กรอก TonnamShop แล้ว POST /me/store สำเร็จ → GET /me/stores/ภาพรวมร้านสำเร็จ เห็นร้านว่างและขั้นตอนเริ่มใช้. [ภาพAWS](evidence/aws-tonnamshop-self-service.png). ไม่มีการกรอก/อ่านpassword/tokenโดยagent. ไม่เอาlocalfixtureมาปนในTonnamShop และไม่อ้างว่าได้ทดสอบสดmerchantfilesหรือfreshregistrationด้วยสองบัญชีแล้ว.

AWSread-back2026-10-15T04:49Z: ตรวจsubjectเจ้าของจากstoreprofileพบCognitoบัญชีจริงCONFIRMED/email_verified=true; PROFILE/membershipOWNER/personal/nameตรงกันและร้านcatalog0/order0. POST /me/storeไม่มีtoken401; GET/POSTpreflight204และforeignoriginไม่มีACAO. StackUPDATE_COMPLETE/Lambda7Successful/privateS3ยัง403. [ผลร้าน](evidence/aws/self-service-store-evidence.json), [inventory](evidence/aws/aws-deployment-evidence.json). หลักฐานไม่บันทึกemail/sub/password/token.


## Full-system demo identity — 15 October 2026

User requested a separate full app demo without a contact email. VERIFIED_LOCAL: generated 13 MOCK seed rows with the existing seed/repository engine; independent assertions revenue20000/fee4600/profit900satang; subject denied membership in DEMO-001 and DEMO-002. VERIFIED_AWS_OPERATOR: dedicated Cognito alias under reserved .invalid domain, SUPPRESS invitation, isolated DEMO-FULL-20261015 tenant; atomic 13-row insert and exact consistent read-back; subject has only this demo membership. No real merchant data or personal-store membership copied. Account currently FORCE_CHANGE_PASSWORD; password activation is handed to user via hidden interactive input. New demo Cognito/browser workflow is NOT_TESTED until password/login completes. No authentication bypass or public write route added. [Evidence](evidence/aws/full-demo-account.json). Overall remains PARTIAL_WITH_EXTERNAL_BLOCKERS.


## One-click full app demo — local verification

43backendtestsผ่านพร้อมtsc/policy/build/staticexport/bundledhandlers. เพิ่ม4testsอิสระ: sessionแต่ละรอบแยกร้าน/hashไม่เก็บtokenplaintext/normalCognitopathdeny/expiry; goldenprofit9บาทและdiscount15%ขาดทุน14.10บาท/evidence/rules/reconciliation/export; MOCK-only/tenant-boundCSVworker/conflictreview/TTL/AIandimportcaps; originboundcreation/global20sessioncap. Localbrowserlocalhost4050กดปุ่มจริงแล้วเห็นdashboard9บาทและทั้ง10เมนูโดยไม่มีruntimeerror. AWSguestflowยังต้องตรวจหลังdeploy.


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

VERIFIED_LOCAL (15 October 2026): npm ci independently installed Backend249 packages / Frontend29 packages from their own pruned workspace lockfiles. Backend npm run verify passed: TypeScript,43 tests,4 built handler loads/auth rejection checks, browser contract export, local template structural checks and deploy packaging. Frontend npm run verify passed: SHA-256 contract check, TypeScript, browser secret policy,5 independently expected financial/artifact checks, Next16.4 static export and packaging. Declaration-only cleanup/portable file URL change passed Frontend tests/typecheck again. SAM/live AWS verification was not run for this source-only split. Previous AWS results above are historical; external blockers remain. Files .local/output/private evidence were excluded.

GitHub Actions VERIFIED (15 October 2026): clean Ubuntu checkout/npm ci/npm run verify completed successfully for initial split commit 55f5d6c. This independently verifies no sibling monorepo/dependencies are required. Run: https://github.com/skzx1/MarginSight-Frontend/actions/runs/38744557321 . This is CI/local build evidence, not AWS deployment evidence.


## Quiet Ledger redesign — 16 October 2026

VERIFIED_LOCAL (source รอบนี้): npm ci สำเร็จ; npm run verify ผ่าน pinned preview SHA-256, TypeScript, browser secret policy, 9 tests, Next16.4 static export และ deployment packaging. ไม่เปลี่ยนสูตร generated หรือ Backend API และไม่ต้องใช้ source ของ repo Backend เพื่อ build

Browser ที่ localhost4050 + local Backend4051 (Edge headless, ร้าน guest MOCK แยก):

- เปิด11หน้าที่390/768/1440px ไม่มีแนวนอนล้นและปุ่มแอปสูงอย่างน้อย44px; ตรวจ11หน้าไทยที่390px; locale/hashคงหลัง reload. ไม่มี pageerror/console error ในรอบ navigation
- Preview และ API: กำไรฐาน9บาท, ลด15%=-14.10บาท, ราคาที่ตรวจแล้วไม่ขาดทุน188.31บาท
- ผู้ช่วยได้ deterministic fallback จาก API; ประวัติอยู่เมื่อสลับเมนูและแยกตามเดือน. ตรวจท้ายคำตอบไม่ทับ composer ที่390px. ไม่อ้างว่าเรียกโมเดลจริงหรือทดสอบคีย์บอร์ดบนอุปกรณ์จริงแล้ว
- เพิ่มสินค้า MOCK และต้นทุนเวอร์ชัน154.50บาท, บันทึกกฎ1.25%และprogram enrollmentผ่านUI
- XLSXรับ1แถว, ส่งซ้ำได้duplicate1, ดาวน์โหลดต้นฉบับชื่อorders.xlsx; importสินค้าขัดแย้งเลือกคงเดิมและยอมรับเฉพาะแถวที่ตรวจแล้วผ่าน
- อัปโหลดภาพสังเคราะห์เข้าสถานะMANUAL_REVIEW, กรอกSKU/จำนวน/หน่วย/ยอด/วันและยืนยันต้นทุนผ่านUI. ไม่ใช่การประเมินOCRภาพบิลจริง
- ส่งออก reconciliation CSV ผ่านUI; local fontsโหลดได้. รายละเอียดและภาพเป็นหลักฐานเฉพาะเครื่องใน .local/quiet-ledger/ ไม่ส่งร้าน/tokenเข้าGit

ข้อจำกัดผลตรวจรอบนี้: ไม่ทำfreshCognitosignup/การทดสอบสองบัญชี, liveLINE, liveBedrockOCR, native marketplace, stale-hash fee confirmation หรือการกู้workerค้างครบวงจร. ไม่มีAWSdeploy/Cognito branding apply; ผลAWSวันที่15ตุลาคมด้านบนเป็นประวัติของUIรุ่นก่อน. สถานะรวมยังPARTIAL_WITH_EXTERNAL_BLOCKERS


## Desktop / iPad drawer — 17 October 2026

VERIFIED_LOCAL: npm ciสำเร็จหลังหยุดเฉพาะFrontenddevที่ล็อกswcชั่วคราวและเปิดกลับ. npm run verifyผ่านpreviewhash/TypeScript/policy/9tests/Nextstaticexport/deploymentpackaging

EdgeheadlessกับlocalAPI4051/guestMOCK:เก็บbaseline390pxก่อนแก้และหลังแก้11หน้าแล้วเปรียบเทียบภาพด้วยPillow ผลidenticalทุกภาพ รวมgeometry/typography/spacing. ตรวจ11หน้าที่768×1024,834×1194,1023×768ทั้งrail80pxและdrawer240px;1024×768,1440×900,1920×1080แบบpersistent240px. ไม่มีpagehorizontaloverflowหรือdrawerทับmain;mainกินพื้นที่ที่เหลือทั้งหมด;ปุ่มnav/toggleอย่างน้อย44×44px;activeparentเดียวต่อหน้า. Enterขยาย/Escapeย่อคืนfocus,focusring,defaultย่อหลังreload,portrait/landscape resizeและEnglishlabelsผ่าน. Browsererrors=[]

หลักฐานเฉพาะเครื่อง: .local/drawer-layout/ (ภาพก่อน/หลัง, geometryJSON, results.json). ผลรอบนี้เป็นlayoutกับข้อมูลMOCKในเครื่อง ไม่ใช่Safari/iPadphysicaldeviceหรือAWSdeployment. หน้าnested/routes/formulas/APIไม่เปลี่ยนจากรอบก่อน


## Overview UX refinement — 17 October 2026

VERIFIED_LOCAL: npm ciสำเร็จ, npm run verifyผ่าน13tests/TypeScript/previewhash/policy/Nextstaticexport/packaging. เพิ่ม4testsสำหรับทุกmocktimestamp/24-hourmidnightrollover, Bangkokperiod/calendarweek/custominvalid/crossyearmonths, fixture/summary/channelreconciliation, missingcostunknownเทียบconfirmedzero

Browser EdgeheadlessกับlocalguestMOCK: Overview390/768/1024/1440/1920pxรวมiPadexpanded ไม่มีhorizontaloverflowหรือข้อความellipsis, summarywidth/actionsheightเท่ากัน, button/input/selectอย่างน้อย44px. สลับtoday3/week7/month10ออเดอร์, custom6Octได้149บาท, rangeผิดแสดงalert. Search#TT-31892ได้02:30, TikTokfilterค้นทั้งloadedsetได้2ออเดอร์. Headerdatecontrolเดียว ไม่มีperiodselectในการ์ด; coverage10/10จากชุด10ออเดอร์และ5recentrowsพร้อมcounter

ControlledAPIresponsevariantsเฉพาะbrowser: missingcost3ได้7/10, profit/margin/totalcostunknown, amberwarningไปProductsmissingfilterได้1สินค้าที่โหลด; empty/loadingไม่มีfakecoverageหรือแอบแสดงmock. REALresponseถูกใช้ตามจริง; cross-monthSep+Octอ่านทั้ง2APIเดือน รวมcanonical9+9=18บาทและขาย200+200=400บาท. สิ่งนี้เป็นการทดสอบcontractผ่านmockresponse ไม่ใช่ผลรับรองร้านจริงบนAWS

ตรวจEnglish/customrangeและชื่อร้านยาวทุก5ขนาด, Enter/TabเลือกsidebarstoreและEnterเลือกchannelพร้อมfocusringผ่าน. เปรียบเทียบ22ภาพหน้าอื่น(11หน้า×390/1440px)ก่อน/หลังด้วยPillow pixel-identicalทั้งหมด. หลักฐานเฉพาะเครื่อง .local/overview-ux/; ไม่มีtoken/merchantdataในGit. Safari/iPadphysicaldeviceยังต้องตรวจด้วยมือ; ไม่มีAWSdeploymentในรอบนี้


## Frontend feature merge / release — 17 October 2026

VERIFIED_LOCAL 17 October 2026: merged origin/yoshi/new-ui-design (dbb39ac) into main. npm run verify passes17tests/TypeScript/pinned preview integrity/browser policy/static export/package. Added four regression cases for no fabricated catalog metadata, exact pre-expense draft, failed product creation and partial cost-save retry. Removed browser-made assistant responses, dummy catalog enrichment and API-to-fixture overview replacement. Product cost is confirmed by API; unsaved price/quantity are labelled and excluded from stored product. Unsupported settings controls are disabled and visibly unconnected. API errors remain errors. AWS publish/browser verification is pending below; earlier feature-branch browser evidence is historical.


## AWS frontend release verified — 17 October 2026

VERIFIED_AWS release cb11f7f480a08615d7ca0d2b731a3146b975f4ad (17 October 2026): clone the exact public source in Singapore CloudShell, run Node24/npm ci/npm run verify:17tests/typecheck/hash/policy/static export/package passed. GitHub Actions also passed for this same commit: https://github.com/skzx1/MarginSight-Frontend/actions/runs/39027823137 .

Published web/out to the existing private web bucket; SHA-256 read-back matched index.html, login/index.html, config.json and release.json. Public /release.json identifies cb11f7f, publishedAt2026-10-17T11:15:03.509813+00:00. CloudFront invalidation IAP12V4X2C0OYATK4JJLBSM5P8 Completed (7paths). Cognito appearance CSS applied/read back (CSSVersion20261017111745), logo present, authPoliciesChanged=false.

AWS read-back11:20:14Z: health200/protectedNoToken401/privateWebBucket403/web200/login200. Cognito root callback, authorization-code flow and marginsight/api scope preserved; stackUPDATE_COMPLETE. No Backend/IaC update or new resources.

AGENT-OBSERVED AWS_BROWSER: new bilingual landing -> /login/ -> create one isolated MOCK demo session. Overview uses the actual API fixture (profit9THB/margin4.5/revenue200), does not substitute display-only marketplace orders. Simulation15% returns-14.10THB and break-even188.31. Added RELEASE-CHECK-20261017 product plus154.50THB confirmed cost; after reload product and cost remain, unsaved price/quantity/profit stay unknown. Opened all12screens, including assistant/OCR/rules/LINE, without claiming every mutation was tested. Overview390px/1440px and simulation390px have no horizontal overflow. Settings draft fields are explicitly disabled/unconnected. Screenshot: AWS MOCK UI (ไฟล์อ้างอิงเฉพาะเครื่อง: `docs/design/frontend-aws-2026-10-17.jpg`). Local evidence .local/aws-ui-release-20261017/ is excluded from Git.

No AI/model/OCR call, live LINE, real merchant data, fresh Cognito login/signup roundtrip or native marketplace integration test in this release. Opening a screen is not proof of its external integration. Local browser attempt could not reach localhost, so no new local-browser pass is claimed; browser evidence above is the actual AWS site. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains. Source/docs/publish-marker maintenance after cb11f7f does not change the recorded deployed UI commit.

## Site-wide earth theme — 17 October 2026

Source2074a52435728f6408aa13cc862d6e300cc4483e (main), first theme3560e36 plus browser-discovered desktop nav background correction2074a52. Local and CloudShell npm run verify passed19tests/TypeScript/generated-preview-integrity/browser-policy/Nextstaticexport/deploy-packaging; two new cases verify daily Bangkok grouping/exact signed satang and incomplete evidence preserving null. Canonical formula margin-v1.1.0 unchanged.

Published2026-10-17T15:32:52.191265Z to existing Singapore hosting. Seven local/S3 SHA256 matches for index/login/config/release/font CSS/two variable fonts. CloudFront final invalidationI15XW2M5FPJW2E16DPY09FEST Completed. Read-back2026-10-17T15:34:12.093004Z: public release.json matches2074a52, health200, normal no-token stores401, private direct-S3web403, root/login200. Cognito presentation CSSversion20261017152932 readBackMatched=true/authPoliciesChanged=false. Classic-hosted form colors/logo observed; service font/outer gray background remain controlled by Cognito. No credentials entered or sign-in submitted in this slice.

Actual AWS browser on one isolated MOCK session: all12workspace screens opened at390/1440px and used Inter/Anuphan plus earth background. Dashboard desktop/mobile no horizontal overflow; final desktop nav dark with light readable inactive items. Daily chart/table read200THB revenue/9THB profit on14Oct; donut mock-market100%. Month→today correctly showed two empty chart panels, no points/donut; month restored. One transient REQUEST_FAILED after rapid screen navigation cleared with explicit Retry, then correct baseline returned; not hidden with synthetic data. Unit tests cover missing/negative data; no claim of live merchant data or all external operations tested. Images/measurements excluded under.local/earth-theme; only MOCK app screenshots suitable for sharing. Cognito screenshot may contain browser autofill and must not be shared.

Visual evidence: landing desktop, final desktop Dashboard and mobile Dashboard reviewed. Font assets from official Google Fonts repository include OFL files. No new inference/training/LINE/OCR/import write in this UI verification. Existing PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged.
## Catalog duplicate controls — 17 October 2026

VERIFIED_AWS UI slice: release5c769793245d1ce3adb5d59f6435642c31d41fd4 removes the text plus beside the existing icon, duplicate Products subheading, and Add Product child heading/back link. AppShell owns the single page heading/back navigation. Local/CloudShell verify19tests/static export/policy passed. Published15:42:01.071885Z; release readback15:43:01.057108Z matched; invalidationIEH79079D8I95NB6DQX5W4BSG9 Completed, four S3 hashes matched. Health200/no-token401/privateS3403/root-login200. AWS MOCK browser at1440/390px: one Products heading, add button one SVG/no text plus, one Add Product h1 and one back link, button opens form/back returns Products; no horizontal overflow. Screenshots reviewed under.local/catalog-cleanup. No form submitted, backend/formula/auth unchanged. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged.
## Assistant platform/campaign selection — 18 October 2026 (Bangkok)

Source: Backend5fb6ed2d1a5f139678e48d89db9df36461088278, Frontendf7dcc060b6a5d885f864da9ae42659eb5874d4ef. Full npm run verify passed locally and in Singapore CloudShell using Node24.19.0: Backend50tests, Frontend21tests, TypeScript, handler smoke checks, generated-contract integrity, policy/static export/package. Canonical formula margin-v1.1.0 unchanged. Local unprivileged Windows build first hit EPERM creating a Next output folder; the authorized rerun passed. No build failure is counted as a pass.

Existing stackmarginsight/account109991964227/ap-southeast-1 updated via reviewed change setsamcli-deploy1792262055; UPDATE_COMPLETE. Seven existing Lambda code updates only; API Body was marked Modify but processed Body compared exactly equal. All live stack parameters equal; no additions, replacements, deletions, IAM/auth/Cognito changes. SAM validate --lint passed. Frontend published2026-10-17T18:36:23.195295Z. Four local/S3 SHA256 read-backs matched index.html, login/index.html, config.json, release.json. InvalidationI2LECRHXRN46HIR82SX9RT46GY (7paths) Completed; public release commit matched. API artifact S3 SHA256 equals deployed Lambda CodeSha256. Readback18:39:10.842463Z: health200, no-token options401, root/login200, private direct-S3403.

Actual AWS API with a fresh isolated MOCK session and commission12% including VAT/payment3.21%/buyer shipping0: source order200THB revenue,130THB cost,15THB recorded expenses. Shopee PRIME fee48.61/profit6.39; Lazada Premium fee47.54/profit7.46; TikTok BCD + standard Growth fee53.97/profit1.03. Shopee15% discount profit-16.48; unknown commission gives null profit; break-even returns nonnegative profit. Foreign store options403; wrong-platform campaign, BCD+Flash and unconfirmed payload400. No token printed/stored in evidence. API test did not use Bedrock.

AGENT-OBSERVED AWS_BROWSER: a separate fresh MOCK session selected SKU-DEMO-01 and all three platforms, filled12% commission/included VAT and selected their campaigns; each displayed the same API goldens. Shopee breakdown24.00commission/6.42payment/1.07fixed/17.12PRIME. Switching platforms reset assumptions/history; TikTok BCD→Flash deselected BCD, and BCD again deselected Flash. Controls/results inspected at1440x1000; at390x844 page scrollWidth375/clientWidth375, no horizontal overflow. Mobile campaign checkboxes and desktop screenshot visually reviewed. Screenshot docs/design/assistant-marketplace-20261018.png contains MOCK data only; result/mobile evidence retained under excluded.local/assistant-marketplace. Viewport override reset. No real merchant data, fresh Cognito login/signup, real OCR, LINE messages or native platform enrollment was exercised. This verifies this feature slice, not FULL_SCOPE.
# Landing redesign — local verification, 19 October 2026

เปลี่ยนเฉพาะหน้า `/`: emerald / warm off-white / champagne, Noto Serif Thai แบบ self-hosted พร้อม OFL, เรื่องเล่า4ตอน, จุดเด่น5ด้าน, desktop/phone mockups, ราคาแบบรอยืนยัน และ FAQ6ข้อ. ใช้ Brand/Icon/Money/DataStatus เดิม ไม่แก้ shared styles, app screens, `/login/`, Backend, สูตร หรือ AWS. Metadata/OG ของ root และ language provider เดิมยังใช้ได้. ตัวเลขการตลาดเป็น MOCK: 4726−1400−520−220=2586บาท; ยอดกำไรแยกช่องทางรวม2586บาท. ตัวอย่างสินค้าเป็นส่วนหนึ่งของภาพประกอบ ไม่ใช่รายการสินค้าครบชุด. What-if ใช้ golden MOCK9→−14.10บาท แยกจากตัวอย่างเสื้อยืด.

`npm ci` สำเร็จหลังหยุดเฉพาะ Next dev server ที่ล็อก SWC ชั่วคราว; เปิด dev4050กลับแล้ว Backend ไม่ถูกหยุด. `npm run verify` ผ่าน: SHA-256 contract, TypeScript, secret-pattern policy,50tests, static export และ packaging. รอบแรกที่ไฟล์ล็อกไม่ถูกนับว่าผ่าน. ไม่มี deploy หรือ merchant writes.

ตรวจ production static export ด้วย Edge headless ทั้ง TH/EN ที่320/390/768/1024/1440/1920px: ไม่มี page overflow, text clipping หรือ touch target ต่ำกว่า44px; h1หนึ่งรายการ, FAQ6ข้อ, title/OG และ langถูกต้อง. กรอบ mockup ที่เอียง/ลอยเลยกรอบ parent ตามตั้งใจไม่ clip และไม่เลย viewport. ตรวจภาพ390/768/1440px, skip link→main, FAQด้วยEnter และปุ่มENเปลี่ยนเนื้อหา/langจริง. ไม่มี page errors. Reduced motion: animation0และยอดกำไรสุดท้ายแสดงครบ.

Contrast คำนวณจาก computed foreground/background ที่ composite แล้ว โดยใช้ปลาย gradient ที่สว่างที่สุดเป็นขอบเขตบนสำหรับพื้นมืด: textต่ำสุด5.045:1. แผงข้อความใน mockups เป็นพื้นทึบ; feature glass มี dark fill82%. ทดสอบ fallback โดยเปลี่ยนเงื่อนไข CSS @supports ของ backdrop-filter ให้ไม่รองรับในเบราว์เซอร์จริง: blurเป็นnoneและกรอบใช้solid#335548ตามbranchที่เขียนไว้. นี่เป็นการจำลอง unsupported capability ไม่ใช่การทดสอบบนSafariรุ่นเก่า. ทดสอบ reflowเทียบเท่าzoom200%ที่หน้าต่าง1440px ด้วยCSSviewport720px/DPR2 ไม่มีhorizontal scroll; ยังควรตรวจ browser zoomจริงและSafariบนอุปกรณ์จริงก่อนpublish.

Performance local:16resource requests/0external, ไม่มี raster images หรือ animation dependency ใหม่. JS gzip estimate165322bytes/CSS16593bytes สำหรับทรัพยากรที่หน้าโหลด; ไม่ใช่ค่าถ่ายโอนจากCDNหรือfield Core Web Vitals. ฟอนต์เดิมAnuphan231712/Inter876576bytes; ฟอนต์headlineใหม่292188bytesใช้font-display:swap. ยังควรตรวจ cold-loadบนเครือข่ายมือถือจริง. รูปและผลเครื่องอยู่ในexcluded`.local/landing-luxury/` ไม่เป็นdependencyในการbuild.

ก่อนเผยแพร่ยังต้องยืนยันราคา/โควตา/เงื่อนไขPremium, ช่องทางติดต่อ, privacy/terms และretention/deletionตาม[TBD]. ไม่แต่งคำรับรอง จำนวนผู้ใช้ หรือcertification; เงื่อนไขนำเข้าและLINEยังแสดงตามความสามารถที่มีหลักฐาน. สถานะระบบรวมและexternal blockersเดิมไม่เปลี่ยน.

## Landing refinement — earth palette and compact layout (19 October 2026)

Supersedes the emerald/serif/glass presentation recorded above. Landing only: uses workspace forest/olive/brown/pale tokens and Anuphan headings; removes gradients, blur, rotated/floating hero phone, and the new unused serif font/license. Feature cards become compact proof rows; story chapters reflow into two columns from640px; hero splits from768px; showcase uses a phone below768px, desktop at768px, and desktop+phone from1280px. Other app routes/shared styles/formulas are unchanged.

VERIFIED_LOCAL: npm run verify passed50tests, TypeScript, contract/secret policy, static export and packaging. Production Edge checks TH/EN at320/390/640/768/834/1024/1440/1920px found no page overflow, clipped text, targets below44px or text contrast below4.5:1 (minimum4.704:1). Skip/FAQ keyboard, language toggle and reflow equivalent to200% zoom passed. Both390px and1440px normal-motion runs observed finite dataArrive/barGrow/answerArrive animations; all paragraph/heading opacity stayed1, final profit remained readable, and reduced motion produced0animations. No animation library added.

Compared with the preceding local screenshots at identical widths, page height changed13432→10015px at390 and9402→6791px at1440. The existing15local resource requests contain no external request; removed292188bytes of serif font download. Gzip estimates: JS165301/CSS17721bytes, not CDN transfer measurements or field performance. Evidence stays in ignored.local/landing-earth/. Real-device Safari and browser zoom remain manual checks. No AWS deploy, backend modification or merchant data writes; original[TBD] pricing/privacy/contact and external blockers remain.
## Landing — one merchant story (19 October 2026)

แทนหน้าตาและเนื้อหา landing รอบก่อนด้วยเรื่องร้านตัวอย่าง 5 จังหวะ: ขาย → ยอดขาย10,000 → หัก6,200/1,500/900/1,400 → เหลือ0 → เปิดดูสินค้าและช่องทางใน MarginSight. ตัวอย่างสินค้าและช่องทางต่างรวมยอดขาย10,000/กำไร0 ตรงกัน; เป็น literal display fixtures ไม่แก้หรือเขียน financial engine ซ้ำ. ใช้ Brand/Icon/LanguageSwitch และสี/ฟอนต์เดิม. เปลี่ยนเฉพาะ welcome source และบันทึกนี้; ลบ landing copy เก่าที่ไม่มีผู้ใช้อ้างอิง. Pricing/quotas/contact/privacy/retention/deletion ยังติด [TBD].

Animation: CSS sticky, SVG, transform/opacity, native scroll timeline สำหรับเส้น progress และ passive scroll/requestAnimationFrame controller ขนาดเล็กเพื่อเลือกฉากและตัวเลข. IntersectionObserver จำกัดงานเมื่ออยู่ใกล้จอ; ไม่มี scroll interception/library/ภาพ raster/video/WebGL. ฉากที่ยังไม่แสดงใช้ inert; มี native skip anchor ที่ย้าย focus ไป after-story, จุดบอกขั้น และเนื้อเรื่องสรุปให้ screen reader. รูปแบบพื้นฐานเป็น static panels5แผงซึ่งแสดงได้ตั้งแต่ HTML แรก; no-JS/reduced-motion/no-IntersectionObserver/จอเตี้ยหรือข้อความไม่พอดีใช้แบบนิ่ง. เปลี่ยน reduced motion ระหว่างใช้งานแล้วเห็นครบ5ฉาก/animation0/inert0. Native radio เปลี่ยนตารางสินค้า/ช่องทางได้ด้วยแป้นพิมพ์และไม่ต้องใช้ JavaScript.

VERIFIED_LOCAL: npm run verify ผ่าน50tests, TypeScript, contract SHA/secret policy, static export และ packaging. Edge production browser ตรวจTH/ENที่320/390/768/1024/1440/1920px: pinทำงาน, ไม่มีhorizontal overflow, เป้าสัมผัสต่ำกว่า44px หรือ text contrast ต่ำกว่า4.5:1 (computed minimum4.717:1). ตรวจยอดหักตามลำดับ10,000→3,800→2,300→1,400→0, ทั้งตารางรวมตรง; ช่องทาง5แถวไม่ทับprogress. Keyboard skip/FAQ/radio และ TH/EN/lang ผ่าน. เพิ่ม390pxสูง667/700/740/800px ไม่มีoverflow/clipped text; แนวนอน844×390และreflowเทียบเท่า200%ที่720×500ใช้แบบนิ่งและไม่ล้น. ไม่ใช่การตรวจ native browser zoom จริง.

Fallback checks: ปิดJSจริงในcontext; ลบIntersectionObserver; reduced-motionและการเปลี่ยนระหว่างใช้งาน; บังคับCSS @supportsของanimation-timelineให้ไม่รองรับ (animation none แต่JS progress0.5/ยอด2,300ยังทำงาน). จำลองหน่วงJS700ms: storyสูง3840pxเท่าเดิมก่อน/หลังenhancement, local observed CLSประมาณ0.000301. ใช้ทรัพยากร15requests/0external, ไม่มีdependency/fontใหม่; ฟอนต์Anuphan/Interเดิม. ไม่ใช่field Core Web Vitalsหรือผลทดสอบเครื่องระดับกลางจริง. ภาพ/JSON/scriptsอยู่ ignored .local/landing-story/.

ควรตรวจ Safari/Chrome บนมือถือจริง: address barยุบ–ขยาย, momentum scrollย้อนขึ้นลง, หมุนจอ, system text scaling/zoom, VoiceOver/TalkBack และจังหวะอ่านแต่ละฉาก. ไม่มีการpublish/AWS change/เขียนข้อมูลร้านรอบนี้; สถานะรวมและexternal blockersเดิมไม่เปลี่ยน.

## 21 October 2026 — landing channel orbit

ปรับเฉพาะป้ายช่องทางใน story beat แรกและ benefit “ทุกช่องทางในที่เดียว” เป็น ChannelOrbit ร่วมกัน รายละเอียด/ข้อจำกัดอยู่ docs/landing-channel-orbit.md. ใช้ artwork ผู้ใช้ Shopee/Lazada/TikTok แบบ byte-for-byte; ยังขาด LINE Shop (line.png เป็น LINE ทั่วไป) จึงใช้ placeholder. ไม่มีการแก้ workspace channel badges หรือสูตร.

VERIFIED_LOCAL: npm run verify รอบสุดท้ายผ่าน 50/50 tests, TypeScript, preview integrity, browser-secret policy, static export และ package (รันนอก sandbox หลัง Windows EPERM). Browser ตรวจ 320/390/768/1024/1440/1920px ไม่ล้น, รูปโหลดครบ, ชื่อ14px, target>=66px, วงหมุน48sและcounter-rotation, keyboard focus/pause/Escape, persistent pause/resume และ offscreen/hidden beat pause. Contrast ink/canvas10.55:1, ink/white11.41:1, muted/canvas5.05:1. no-JS ตรวจ production HTML ถอดscriptจริงทุกตัว; reduced-motion ตรวจ forced CSS branch เท่านั้น ยังไม่ได้เปิด OS preference จริง. มือถือจริง/VoiceOver/TalkBack/brand clear-space ยังต้องตรวจ. ไม่มี publish/AWS change.

## 21 October 2026 — reference-led full landing

ผู้ใช้ยืนยันปรับทั้งหน้า รวมส่วนล่าง/footer ตามภาพอ้างอิงใหม่. Welcome route ส่งต่อ Landing ใหม่: centered hero, orbit+example, channel strip, light/dark evidence, three workflow cards, assistant illustration, plans/FAQ, closing/footer. ดู docs/landing-reference-layout.md และ DESIGN.md สำหรับขอบเขต/หลักฐาน; ตัวอย่างบทสนทนาติดป้าย ไม่ใช่ AI live. Formula, workspace badges และ AWS ไม่ได้เปลี่ยน.

VERIFIED_LOCAL รอบสุดท้าย: npm run verify ผ่าน50tests/TypeScript/integrity/secret policy/static export/package. ตรวจ6widthsทั้งTH/ENไม่มีhorizontal overflow, geometryวงโคจรเทียบการ์ดทุก5องศาไม่ชน, hit targets44pxขึ้นไปเมื่อlayoutเข้าที่. แก้ledger dt/dd contrastแล้ว; muted/canvas5.78:1, secondary/deep9.82:1. No-script HTML และ forced reduced-motion CSS branch ผ่าน6widths (ไม่ใช่ OS preferenceจริง). ภาพfull-page/desktop/mobileอยู่tmp/reference-landing-review. ไม่มีindependent reviewerเพราะไม่อนุญาตsubagents; inline reviewสำหรับlocal designเท่านั้น. ยังขาดLINE Shop logoและการตรวจมือถือจริง/OS Reduce Motion/brand clear-space.

## 21 Oct 2026 — discount-first landing / local only

- Latest source: public landing hero/header/orbit and page-only metadata. Other app screens and generated financial contract unchanged.
- Final `npm run verify`: 50/50 tests, TypeScript, preview SHA integrity, browser secret-pattern check, static export and deployment packaging passed. No deploy performed.
- TH and EN at320/390/768/1024/1440/1920: document scrollWidth equals clientWidth; no undersized visible targets (<44px) detected; one h1; no missing local anchors.
- Mobile native details menu opens, stays in viewport, language toggle updates html lang, Escape closes and restores summary focus.
- Keyboard channel activation: selected=true, paused=true, rotor paused, static name shown with solid outline. Escape clears selection.
- After footer focus and browser IntersectionObserver delivery: scrollY4600, moving=false, rotor paused. No JS animation loop.
- FAQ native details opens/closes.
- Production HTML with all scripts removed: scripts0, static paused orbit, final20 figure visible, no overflow at all six widths.
- Reduced-motion **CSS branch** forced in an isolated no-script fixture: orbit and number animation none, no overflow at all six widths. This is not OS/matchMedia emulation; actual system Reduce Motion remains a phone check.
- Evidence: tmp/landing-discount-review/desktop.jpg, mobile.jpg, responsive.json, fallbacks.json. Full-page capture failed in this browser; no full-page image is claimed for this revision.
- Inline review substitutes for a separate agent because user/repository prohibits subagents. See docs/landing-reference-layout.md for fidelity matrix and unresolved inputs. Local review disposition: ship for user design review, pending official logo assets/commercial policy inputs; not a blanket production/accessibility certification.
- Manual phone checks: Safari/Chrome browser chrome resize, text scaling, tap pause/resume, OS Reduce Motion, mid-range animation smoothness.

## 23 October 2026 — latest landing release preparation

Pulled origin/main e7c07018338e9fe5038a8ead25a79249a3808395 by fast-forward. Backend origin/main remains eb7e7f9fcc9b3b472e39f2100cca0f6f1f224583 with no new application changes. This release updates the public landing and its deterministic example calculator; the authenticated workspace and Backend are not changed.

Local npm ci succeeded. The first verify passed 53 tests but the Next16.4.0 build stopped with a security advisory; that attempt is not counted as a completed verification. npm audit independently confirmed affected Next.js dependencies (GHSA-2464-fhr4-w9xw, GHSA-p3m5-59mp-jv5r, GHSA-673q-mjm6-r5xr). Updated only Next to exact16.4.3 and the lockfile; npm audit then reported zero known vulnerabilities. The static export has no deployed Next server; this is dependency remediation, not evidence that the running S3 site was exploited.

Final local npm run verify passed53/53 tests, TypeScript, generated-preview SHA-256 integrity, browser secret-pattern policy, Next16.4.3 static export and deployment packaging. Domain version remains margin-v1.1.0. AWS publication and browser results will be recorded separately after actual verification; no new live OCR/LINE/native marketplace/two-Cognito-user proof is claimed here.

## 23 October 2026 — AWS landing publication verified

Runtime source e26e30e7e0e5bfe35287544ad6ea282d0e21dc10 (includes origin/main e7c0701 and exact Next16.4.3 security patch) published2026-10-23T14:33:10.258700Z to existing account109991964227/ap-southeast-1 hosting. Clean CloudShell npm ci and npm run verify passed53/53 tests, TypeScript, generated-contract integrity, browser secret policy, static export and packaging using Node24.19.0. The initial CloudShell attempt used its default Node20.20.2 and failed TypeScript-module tests; it is not counted as a pass. Downloaded Node24.19.0 from nodejs.org and verified archive SHA-256 against the vendor SHASUMS256 before rerunning.

S3 SHA-256 read-back matched8 files: index.html, login/index.html, config.json, release.json and four channel PNGs. CloudFront invalidation I90EMAWHZPODI5AA50XYX3Y9D4 (7 paths) reached Completed. Public release marker matches e26e30e. Read-back2026-10-23T14:36:23.7049933Z: root/login/health200, normal no-token stores401, direct private S3 index403. No Backend/SAM/Cognito/IAM/resource update was performed.

AGENT-OBSERVED AWS_BROWSER: new landing title, one h1, channel images loaded; default example discount15% gives revenue170/fee25.50/profit-5.50 and break-even176.47. Setting discount0 gives20THB profit; discount100 gives-150THB; clearing cost displays unknown with validation rather than fabricated zero; restoring inputs recovers-5.50. This landing example differs from the existing app MOCK fixture and is labelled illustrative. At1440x1000 TH and390x844 TH/EN, page scrollWidth equals clientWidth. Mobile menu opens; EN changes document language; Escape closes menu and restores SUMMARY focus. Desktop/mobile screenshots were visually inspected. Viewport override reset and prior English language preference restored.

A fresh isolated MOCK demo session opened the app after publication: October baseline revenue200/profit9/margin4.5 and1/1 complete order. Ask assistant opened with its composer/context controls; no question submitted and no model inference performed. Browser error log empty in this check. This does not verify new Cognito registration, real OCR, LINE, native platform access or the full two-user workflow. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.

Local evidence is excluded under .local/aws-release-20261023 (screenshots, local artifact hashes, public-readback.json). CloudShell logs, S3 pre-release backups and hash evidence are under /tmp/marginsight-fe-20261023-9e7vqeai and are ephemeral. Deployed source marker remains e26e30e; later documentation-only commits do not change runtime code.


## Product rename to MarginShot — 23 October 2026

VERIFIED_LOCAL / VERIFIED_AWS for branding: Frontend330cf092062f0894c9c2dc41a6a25eb07c665523 and Backend4405954bcb9eec00d3155a6c70f9cd84bf6954f3. Updated visible product names, metadata, assistant/Playground labels, client CSV names, backend XLSX sheet name/assistant prompt/LINE linking copy, README/product design titles and Cognito SVG/PNG logo. Preserved repository URLs, AWS resource identities, OAuth scope, browser storage keys, generated financial contract and legacy health-service identifier for compatibility. No formula or financial policy change.

Local and clean CloudShell npm run verify passed Frontend53 and Backend50 tests, TypeScript, bundled handlers/integrity/policy checks, static export and packages under Node24.19.0; SAM validate --lint passed during preparation. Stackmarginsight updated with reviewed samcli-deploy1792770100; UPDATE_COMPLETE. Seven existing Lambda code updates only; HttpApi Body compared exactly equal and parameters preserved. No additions, removals, replacements, IAM or auth policy changes. API Lambda CodeSha256 matches the uploaded SAM code artifact.

Frontend published2026-10-23T15:46:08.146093Z. S3 read-back matches index/login/config/release. Cognito presentation applied/read back; hosted logo SHA-256 equals the renamed PNG; CSSVersion20261023154606. InvalidationI3DU8YUUDB01V9YILGTXHX1LP6 (7paths) Completed. Public read-back15:47:30.3489132Z: web/login/health200, no-token stores401, direct private S3403, release marker330cf09.

AGENT-OBSERVED AWS_BROWSER: landing brand and title MarginShot with no MarginSight visible in its body. Login shows MarginShot/MARGINSHOT. Reused the existing isolated MOCK session; overview still shows9THB profit/4.5% margin and assistant heading/title says MarginShot with no old brand visible. Browser error log empty; no question/model invocation, OCR, LINE message or real merchant write. Cognito logo confirmed by image hash, not a new credential-entry/signup test. Existing shop names and saved historical conversations were not rewritten. Evidence screenshots/public-readback.json are local-only under Frontend.local/marginshot-rename-20261023; CloudShell logs/backups under /tmp/marginshot-brand-20261023-pmmu_rmz are ephemeral. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.

## Landing hero orbit - 24 October 2026 (local only)

VERIFIED_LOCAL: replaced fixed-position hero symbols with CSS transform orbits on the existing 720px/960px circles (64s/88s). Counter-rotation keeps all logos upright. User requested continuous autoplay and removal of pause/play controls; this hero intentionally animates even with reduced-motion enabled. Other page animations keep their existing reduced-motion policy. No requestAnimationFrame loop or new dependency. IntersectionObserver/document visibility suspend offscreen/hidden work and resume the same phase. Mobile <=767px retains the existing circle background and a static four-logo row.

Browser: observed all six rotor animations running automatically with no orbit control after the final change. Measured radii ~360px/~480px agree with their tracks. No horizontal page overflow at the inspected desktop state. Scrolling beyond the hero changed data-running to false. Inspected local 320px/390px iframe previews visually: heading, CTAs, four logos and example cards fit; no assertion of a real-device test. No AWS/model calls, financial/auth changes, commit-triggered deployment, or merchant data changes in this slice. GitHub workflow only verifies source. Earlier pause-button checks are superseded by the requested autoplay behavior.

## Landing orbit AWS publication - 24 October 2026 (Bangkok)

VERIFIED_AWS for this UI slice: Frontend runtime e9ef662226b5f9fb16448464863ed01b9d49232c published 2026-10-23T18:39:24.445704Z (24 October 01:39 Thai) on the existing private S3/CloudFront hosting in account109991964227 / ap-southeast-1. Clean CloudShell npm ci and npm run verify passed all53 tests, TypeScript, preview SHA-256 integrity, browser secret-pattern policy, static export and packaging under Node24.19.0. The Node archive was checked against the vendor SHASUMS256 before execution.

S3 SHA-256 read-back matched12 files: index/login/config/release, three CSS chunks, the hero JavaScript chunk and four channel images. Public index SHA-256 is 3a027060f315ab17b15faa9381a6312c3ed25b59563a6514657c906754c169fd, matching the CloudShell build/S3 object. Scoped7-path CloudFront invalidation IF09BG4JWMVD0092Y50N5RT1XD reached Completed. HTTP read-back18:40:23.966737Z: root/login/config/release/health200, protected no-token stores401, direct private S3 index403. Public release marker matches e9ef662 and formula margin-v1.1.0.

AGENT-OBSERVED AWS_BROWSER: all six decorative satellites animate automatically along the existing circles with no pause/play control. Inner/outer durations64s/88s; measured radii~360/~480px match their tracks, paired transforms keep logos upright, and transforms advance between observations. Desktop1625x930 has no horizontal page overflow; browser error log empty. Existing English preference restored by normal hydration; no language setting change was saved by the operator. The default illustrative calculator still displays loss5.50THB and break-even176.47THB. No guest session, Cognito credential entry, merchant write, AI/OCR inference or LINE message in this release test. Local mobile visual checks remain distinct from AWS real-device testing.

No Backend/SAM/Cognito/IAM/resource update. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains; no additional real OCR/LINE/native marketplace/two-Cognito-user evidence is claimed. Local evidence: .local/hero-orbit-20261024/public-readback.json and aws/browser-check.json, aws/landing-live.png. CloudShell logs, checksum evidence and pre-release index/login/config/release backups: /tmp/marginshot-orbit-20261024-lr8kfe7q (ephemeral). Prior deployed Frontend330cf092062f0894c9c2dc41a6a25eb07c665523 remains a durable source rollback point; preserve private storage/auth and rebuild/publish rather than delete store data.

## Emerald Unified latest feature publication - 24 October 2026, 20:49 Bangkok

VERIFIED_LOCAL / VERIFIED_AWS for this UI release. origin/main had no new code; latest feature branch claude/design-tokens contained5 commits and included main as an ancestor. Reviewed and fast-forwarded main from7ecf99d to34ec54dadc1594c41f5adf841e3d5e7ce557299a, then pushed. Changes unify semantic tokens/typography/surfaces across landing/login/workspace, add signed profit/loss labels, restyle charts/cards and Cognito/favicon, remove unused story files, hide unfinished pricing/contact sections and retain sign-in between768-1100px. Generated domain snapshot, auth/API code and dependencies unchanged. Backend origin/main has no new commit; no Backend deployment.

Final local npm ci/npm run verify and clean CloudShell npm ci/npm run verify passed53 tests, TypeScript, preview SHA-256 integrity, browser secret policy, static export and packaging with Node24.19.0. Initial sandbox npm ci failed DNS resolution; it was rerun successfully with network access before counting final verification. CloudShell Node archive checked against vendor SHA-256. Local read-only calculator preview displayed baseline+9.00, scenario-14.10 and checked price188.31, with visible Profit/Loss labels; missing product values remain unknown.

Published runtime34ec54d at2026-10-24T13:49:02.129579Z (20:49 Thai) using existing Singapore private S3/CloudFront. S3 read-back matched13 objects (index/login/config/release/favicon, three CSS chunks, hero JS and four logos). Public index SHA-2566a8575ab758ad10cee5440e387e922e49f924c70fc6a3b99d30a97c53376b48e matches build/S3. CloudFront7-path invalidation I4L4NPTRPCLXDFM1Y06XU9XHN7 Completed. Cognito appearance-only update read back exact CSS (SHA397f3a5bb664c3e5110d5312410c399b01b21603f864a9c1f585d0e77fb631f3), CSSVersion20261024134859 and logo SHAaf02550a33663df3a8430e784629fceb4f0ff2ae31c9ac8e86169cc49357cd13. No auth policy/client-scope/user changes. Public read-back13:49:55.403443Z: root/login/config/release/health200; no-token stores401; direct private S3403; marker34ec54d/formula margin-v1.1.0.

AGENT-OBSERVED AWS_BROWSER: shared Emerald action token/background loaded, unfinished pricing hidden, orbit running; sign-in visible at the inspected827px landing width with no horizontal overflow. Created one fresh isolated MOCK demo session and inspected Overview, Products, Finance, Ask assistant and Store. Overview baseline200THB sales/+9THB profit/4.5% unchanged. Products showed2 records and one missing cost without invented prices/profit. Finance clearly used its separate synthetic fixture (120orders for the selected month), not the backend demo order. Screenshot review passed for all five sections; assistant and store had no page overflow; app error log empty. No question, model/OCR/LINE call, import, real merchant write, signup or real-device acceptance test in this slice.

Evidence excluded under .local/emerald-release-20261024 (public-readback.json and aws screenshots). CloudShell logs/hash evidence/pre-release files and Cognito CSS backup: /tmp/marginshot-emerald-20261024-lrumkmxb (ephemeral). Prior deployed sourcee9ef662 is the durable rollback source; restore its static build and appearance without deleting stores or weakening auth. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains for prior real OCR/LINE/native marketplace/two-Cognito-user gates.


## Store wording and five additional products — 25 October 2026 (local only)

VERIFIED_LOCAL. Replaced visible Thai/English Demo wording in entry buttons, landing copy, usage descriptions, LINE guidance, finance availability notes and session error messages with ordinary store wording (เข้าสู่ร้าน / Open store). Kept explicit MOCK provenance. The one-click capability flow, expiry, quotas and merchant sign-in remain intact. Fresh guest tenants use Backend storefront labels and readable SKU/order/program identifiers. Existing personal stores and saved historical data are not rewritten.

Frontend npm run verify passed 53 tests, TypeScript, generated-domain SHA-256 integrity, browser secret policy, static export and packaging. Backend verification passed 61 tests including expanded catalog, exact costs, idempotence, tenant isolation, imports and unchanged financial goldens. Browser observed local one-click entry, seven products with six known costs and one unknown, names/SKUs without Demo, and baseline 9 THB / 4.5%. Inspected all five main sections in English and the corresponding Thai entry/catalog/finance/assistant/store screens; no Demo/เดโม/สาธิต text in inspected views. Missing product price/stock/profit stays unknown. Browser automation briefly stalled after leaving unsaved language settings; closing that disposable test tab restored interaction and the fresh flow passed. No new cloud/model/OCR call, push, commit or deployment. Evidence: .local/storefront-20261025/products.png and checks.json. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains.


## Assistant storefront data repair — 25 October 2026

Supersedes the catalog-only limitation in the earlier local entry: added five linked, settled single-SKU MOCK orders with posted fees/payouts so every newly added product can use assistant discount scenarios. Existing local MOCK guest sessions are upgraded at local API startup, preserving chat/session history; personal/REAL data is excluded. Browser retried the existing CAP-005 chat successfully: discounted revenue135.15THB, fees27.03THB, profit28.12THB, margin20.81% (card20.8%); console errors empty. Local AI remains disabled, so this verifies deterministic fallback rather than a new Bedrock invocation. Evidence: .local/storefront-20261025/assistant-fixed.png. Backend62 tests and6 Python parameter tests passed; Frontend code unchanged since its53-test verification. Both heuristic secret audits reported0 candidates; that is not a guarantee covering every secret format. User authorized pushing all changes after the local verification; no AWS deployment is included.


## Orange M + Rising Line SVG — 25 October 2026

VERIFIED_LOCAL: redrew the user's first logo reference as vector-only SVG in orange, warm gray and black. Mark and stacked/horizontal wordmarks have transparent backgrounds; dark/light app icons and favicon use the same geometry. Wordmark uses outlined Inter750 glyphs from the bundled OFL font, so no external font or embedded raster is needed. Reused shared asset paths for web Brand/HeroDepth; no auth/formula/API changes. SVG XML/path checks passed; sharp-rendered preview visually inspected. npm run verify passed53 tests, TypeScript, domain SHA/policy, static export and package. Browser local/live inspection is currently unavailable because the browser tool reports disabled even though user screenshot shows enabled. Not a verified live logo deployment. Cognito Hosted UI logo files are unchanged. Evidence: .local/logo-orange-20261025/preview.png; source deliverables web/public/branding/*.svg.

AWS preparation earlier in this session verified account109991964227, Singapore stack stable and lagged BudgetActualSpend0.033USD/limit350USD, then clean CloudShell verification Frontend53/Backend62 with backups at /tmp/marginshot-release-20261025-342jc837. SAM prepare stage was submitted; change set creation/review/execution has NOT been confirmed after browser access became unavailable. No execute/publish command was issued by this agent. Do not claim current local designs are live; resume by reading fresh CloudShell state, prepared.json and change-id.txt. The orange-logo revision supersedes prepared frontend96dbb96 and must be rebuilt/reviewed before publish.


## Warm cream / ink / terracotta theme and Cognito sign-in — 25 October 2026

VERIFIED_LOCAL: applied the user-provided tokens.json/tokens.css across every page. Source palette retained in web/src/app/theme-palette.json; one tokens.css root maps all37 explicit JSON roles. Where upstream CSS left legacy chart/gain roles, the JSON roles win: neutral-ink gain, burgundy loss, slate/sand channel charts and terracotta highlights. Sidebar/assistant history use light navigation roles; full-screen moving hero uses cream surfaces and warm glows, retaining existing motion. Component CSS contains no raw hex/rgb colours; colours are semantic. Independent calculation passed32 contrast pairs at their declared thresholds. Local browser inspected five main and nine secondary screens: expected canvas/text/sidebar RGB, no horizontal overflow. npm run verify53 tests/typecheck/domain SHA/policy/static export/package passed. Cognito SVG/PNG now shares the orange first-reference vector mark and outlined wordmark; classic allowed CSS uses the same palette. Branding operator adds timestamped backups and compares app-client configuration before/after; no auth flow/policy change intended. Live publication of this palette/sign-in is pending at this commit. Source for Cognito limits: https://docs.aws.amazon.com/cognito/latest/developerguide/hosted-ui-classic-branding.html . Local evidence .local/theme-20261025.

Preceding release is VERIFIED_AWS: Frontend9f3edfe/Backend031467b published25Oct06:29:52UTC after reviewed samcli-deploy1792909584 execute06:28:44UTC. Seven LambdaCode updates and dynamic HttpApi Body reference refresh only; processed HttpApi properties and all non-Code Lambda properties exactly equal, parameters preserved, no Add/Remove/Replacement/IAM/auth changes. Stack UPDATE_COMPLETE. Lambda artifact SHA matches all7functions;18S3object hashes match;8path invalidation I8H43DTGZ2VYDJG7JHXVFER1QR Completed. API/protected guest test25Oct06:31:30UTC:7products/6orders/profit268THB; all6SKU discount goldens correct; CAP-005 Qwen bedrock-tools/modelqwen.qwen3-32b-v1:0 returned profit28.12THB/margin20.81%; tenant/origin403, noauth/guest-normalroute401, privateS3403, missingSKU404. Browser reproduced CAP-005 selection and15% question successfully, no missing-order error; landing motion/loaded orange SVG and390px CTA fit verified. Proof in .local/aws-release-20261025/evidence, CloudShell backups /tmp/marginshot-release-20261025-a0nn9bsd. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS remains for prior realOCR/LINE/nativeplatform/twoCognito workflows.


## Final warm palette + Sign in publication — 25 October 2026

VERIFIED_AWS for this appearance release. Frontend runtime2bc06b97b19c1a460bfcbc49992e3db7ad092e90 published2026-10-25T06:45:23.423378+00:00 after clean CloudShell npm ci/verify53tests/build. Backend runtime031467b remains as deployed earlier this session; no second stack/code update for theme. All18S3object readbacks match build;8path invalidationI615ZICUQLD4WENLVHV65VL3Z5 Completed. Public readback2026-10-25T06:49:40.703708+00:00: index/login/config/release/favicon/icon hashes match; health200, no-token stores401, privateS3403. Browser live landing canvas/heroFAF9F5 and ink141413, motion running; freshMOCK session Overview/Products/Finance/Assistant/Store all use cream canvas/ink/lightF4F2ECsidebar with no horizontal overflow. Local14screens and390px CTA fit checked separately; no real-device claim.

Cognito presentation-only CSSVersion20261025064501; CSSSHA2f2e074a3a5f03f68c12fb621efea82de4a90c7698cffcc7b7dace54aa74a443; logoSHAb41fce5b9c17c5065ef3bbfc4bb135b74190894801561fd97d7a62931287814f read from public image matches sourcePNG. App-client configuration compared equal before/after; no auth/callback/scope/password/user change by agent. Live Cognito cached-session view displays loaded orange rising-line logo, cream card and primaryRGB176/79/44 with white text, no overflow. Existing credential autofill was cleared only in disposable audit forms; no credential submit/signup/reset performed. User subsequently used/closed audit tabs; final isolated read-only appearance check stored cropped logo only without account text. Evidence .local/theme-20261025/published-verification.json, browser-report.json and evidence/*.png. Overall PARTIAL_WITH_EXTERNAL_BLOCKERS unchanged.
