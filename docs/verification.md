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

ดู[การออกแบบและขอบเขตผลตรวจ](ui-design.md), [ภาพAWS MOCK](design/marginsight-desktop.jpg). การเปลี่ยนรอบนี้เป็นwebstaticและCognitoappearance ไม่มีIAMroles/บริการใหม่/การเปลี่ยนสูตร. คงPARTIAL_WITH_EXTERNAL_BLOCKERSตามรายการข้อมูลและintegrationเดิม.


## Repository split — 15 October 2026

VERIFIED_LOCAL (15 October 2026): npm ci independently installed Backend249 packages / Frontend29 packages from their own pruned workspace lockfiles. Backend npm run verify passed: TypeScript,43 tests,4 built handler loads/auth rejection checks, browser contract export, local template structural checks and deploy packaging. Frontend npm run verify passed: SHA-256 contract check, TypeScript, browser secret policy,5 independently expected financial/artifact checks, Next16.4 static export and packaging. Declaration-only cleanup/portable file URL change passed Frontend tests/typecheck again. SAM/live AWS verification was not run for this source-only split. Previous AWS results above are historical; external blockers remain. Files .local/output/private evidence were excluded.
