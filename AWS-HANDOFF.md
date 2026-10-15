# MarginSight — ส่งต่องานให้เพื่อนและ AI เพื่อขึ้น AWS

อัปเดต 15 ตุลาคม 2026 · อ่านร่วมกับ `AGENT.md`, `plan.md`, `docs/status.md`

## 1. ระบบนี้มีอะไรและใครดูแลส่วนไหน

| ส่วน | Repository / เจ้าของ | AWS ที่ใช้ |
|---|---|---|
| หน้าเว็บ Next.js, 10 เมนู, login UI, static assets | [MarginSight-Frontend](https://github.com/skzx1/MarginSight-Frontend) | S3 private + CloudFront; Cognito Hosted UI |
| API, สิทธิ์ร้าน, สมัครแล้วสร้างร้าน, เดโมแยกร้าน | [MarginSight-Backend](https://github.com/skzx1/MarginSight-Backend) | API Gateway HTTP API, Lambda, Cognito, DynamoDB |
| สูตรกำไร/margin/TTR, ต้นทุนย้อนหลัง, ค่าบริการ/กระทบยอด | Backend เป็นเจ้าของสูตร | Lambda + DynamoDB; จำนวนเงินเก็บเป็นสตางค์ |
| CSV/XLSX, ภาพบิล, export | Backend | S3 private + presigned URL, SQS/DLQ, Lambda workers |
| ผู้ช่วยไทยและอ่านภาพบิล | Backend | Amazon Bedrock, `amazon.nova-lite-v1:0`, เรียกตรง `us-east-1` |
| LINE | Backend | Lambda webhook/worker, SQS, Secrets Manager; ยังต้องมี Channel จริง |
| โครงสร้าง AWS ทั้งชุด รวม bucket เว็บ/CloudFront/Cognito | Backend: SAM/CloudFormation | stack เดียว `marginsight`; Frontend publish ไฟล์เข้า bucket ที่ stack นี้สร้าง |

**อย่าให้สอง repo deploy stack คนละชุดเพื่อครอบครองทรัพยากรเดียวกัน** การแยก repo เป็นการแยกซอร์สและรอบเผยแพร่ ไม่ได้ย้ายฐานข้อมูลหรือผู้ใช้ ระบบเว็บปัจจุบันคือ <https://d2y04qc334m0rd.cloudfront.net/>.

AI ใช้โมเดลสำเร็จรูป ยังไม่ได้ train/fine-tune ด้วยข้อมูลร้าน โมเดลแปลเจตนาและอธิบายผลจาก domain engine; ไม่ใช้ตัวเลขที่โมเดลคิดเองเป็นผลทางการ OCR ต้องให้คนตรวจและยืนยันก่อนใช้เป็นต้นทุน ข้อมูลสาธิตติดป้าย MOCK; ยังไม่ใช่ native Shopee/Lazada/TikTok integration.

## 2. เป้าหมายที่ใช้อยู่และสิ่งที่ต้องเตรียม

- AWS account **109991964227**, Region ระบบ **ap-southeast-1**, stack **marginsight**.
- Bedrock direct **us-east-1** เท่านั้นสำหรับรุ่นนี้ ห้ามเปลี่ยนเป็น cross-region inference profile ที่ส่งไป Region นอกขอบเขต.
- Region ที่กิจกรรมอนุญาต: us-east-1, ap-southeast-1, ap-southeast-7; CloudFront global ได้รับอนุญาตในงานเดิม.
- เครดิต **350 USD รวมทั้งทีม**, เป้าหมายรอบทดลอง 25 USD ไม่ใช่เครดิตใหม่ต่อคน/ต่อ repo ตรวจ Budgets/Cost Explorer ก่อนงาน cloud ทุกครั้ง Billing มีความล่าช้า.
- เครื่อง deploy: Node.js **24**, npm, Git, AWS CLI v2, SAM CLI, Python 3; scripts operator บางตัวต้องมี `boto3`.
- เข้าบัญชีด้วย SSO/role/CloudShell ของทีม ไม่สร้าง access key ถาวร ไม่ใส่ password/token ใน prompt, Git, `.env.example` หรือ `NEXT_PUBLIC_*`.
- สิทธิ์ใช้งาน stack เดิม, S3 publish, Lambda/CloudFormation update และ `iam:PassRole` เฉพาะ execution roles เดิมตามนโยบายทีม ถ้าถูกปฏิเสธให้รายงาน operation/ทรัพยากรที่ขาด ห้ามขยายสิทธิ์ SSO/องค์กรเอง.

บัญชี/Region ด้านบนเป็นเป้าหมายเดิม **ไม่ใช่สิทธิ์ให้เพื่อนใช้บัญชีอื่นโดยอัตโนมัติ** ค่าบัญชีไม่ใช่ secret ส่วนไฟล์ SSO/credentials และ token เป็น secret.

## 3. Clone และตรวจในเครื่องก่อน

ตัวอย่างคำสั่งส่วน AWS ใช้ Bash เช่น CloudShell; สอง repo วางระดับเดียวกัน:

```bash
git clone https://github.com/skzx1/MarginSight-Backend.git
git clone https://github.com/skzx1/MarginSight-Frontend.git

cd MarginSight-Backend
npm ci
npm run verify

cd ../MarginSight-Frontend
npm ci
npm run verify
```

ไม่ต้อง clone `NTT-DATA` เพื่อ build ทั้งสอง repo แต่ละ repo มี lockfile ของตนเอง Backend สร้าง Lambda bundles ที่ `backend/dist/`; Frontend สร้างเว็บที่ `web/out/`.

Local development เปิดสอง terminal: Backend `npm run dev` ที่ port 4051; Frontend `npm run dev` ที่ port 4050 เปิด <http://localhost:4050> ข้อมูล local เป็นข้อมูลสังเคราะห์และไม่ใช่บัญชี AWS จริง.

ถ้าเปลี่ยนสูตรที่ Backend:

```bash
# ใน Backend หลังตรวจสูตรและทดสอบแล้ว
npm run export:preview
# ใน Frontend อัปเดตเฉพาะ generated snapshot ที่ตรวจ SHA-256
npm run sync:preview -- --from ../MarginSight-Backend/contracts/browser-preview
npm run verify
```

commit contract ฝั่ง Backend และ snapshot ฝั่ง Frontend คู่กัน การ build Frontend ปกติไม่ดึงโค้ดหรือ dependency จาก sibling repo และห้ามแก้สูตรสำเนาด้วยมือ ผลร้านจริงยังคำนวณที่ API.

## 4. อัปเดต Backend ของระบบเดิม

ทำเฉพาะเมื่อเปลี่ยน Backend/IaC ถ้าแก้แต่เว็บข้ามไปข้อ 5:

```bash
cd MarginSight-Backend
export AWS_DEFAULT_REGION=ap-southeast-1
export AWS_PAGER=""
aws sts get-caller-identity --query Account --output text
# ต้องตรง 109991964227

aws budgets describe-budget --account-id 109991964227 \
  --budget-name Hackathon-Team10 --region us-east-1 \
  --query 'Budget.{Limit:BudgetLimit,Spend:CalculatedSpend,Updated:LastUpdatedTime}'

npm ci
npm run verify
python3 scripts/prepare-update.py
```

`prepare-update.py` ตรวจ account/สถานะ stack, validate template, อ่าน parameter ปัจจุบันแล้วส่งต่อครบทุกตัว และเตรียม SAM change set แบบ **ไม่ execute** เพื่อรักษา `DemoEnabled`, `AIEnabled`, `AIRegion`, `LineSecretArn` ของระบบเดิม การเตรียมนี้มีการอัปโหลด artifact ไป AWS แล้ว ไม่ใช่ local dry run.

ใช้ `template-external-roles.yaml` เท่านั้นสำหรับบัญชีทีมนี้ และรักษา 7 roles เดิม (`marginsight-api`, `assistant`, `importworker`, `ocrworker`, `linewebhook`, `lineworker`, `seed` โดยมี prefix `marginsight-` ทุกตัว). ห้ามใช้ `template-foundation.yaml` ทับ stack เต็ม ห้ามใช้ script เก่าที่ชี้ `marginsight-demo` เพื่ออัปเดตระบบหลัก.

อ่านชื่อ change set/ARN ที่ SAM คืนมา แล้วตรวจรายการจริง:

```bash
aws cloudformation describe-change-set --region ap-southeast-1 \
  --stack-name marginsight --change-set-name <CHANGE_SET_ARN>
```

เช็คว่าไม่มี Remove/Replacement ของ DynamoDB, S3, Cognito และไม่มี IAM หรือบริการใหม่เกินขอบเขต ถ้ามีให้หยุดตรวจผลกระทบกับเจ้าของงานก่อน execute ใช้ชื่อจริงที่ได้จากผลลัพธ์ ไม่ใช้ชื่อจากเอกสารรอบก่อน.

เมื่อการเปลี่ยนตรงขอบเขตที่เจ้าของบัญชีอนุญาตแล้ว:

```bash
aws cloudformation execute-change-set --region ap-southeast-1 \
  --stack-name marginsight --change-set-name <CHANGE_SET_ARN>
aws cloudformation wait stack-update-complete \
  --stack-name marginsight --region ap-southeast-1
python3 scripts/cloud-auth-diagnose.py --verify
```

ถ้า SAM แจ้งไม่มีการเปลี่ยนแปลง ไม่ต้อง execute change set เก่า บันทึก commit และผลตรวจแทน ห้าม seed/เขียนข้อมูลร้านจริงเพื่อให้ smoke test ผ่าน; golden tests ใช้ร้าน MOCK แยกเท่านั้น.

## 5. เผยแพร่ Frontend แยกจาก Backend

```bash
cd MarginSight-Frontend
npm ci
npm run verify
bash scripts/cloud-publish.sh
```

Script ตรวจ account, อ่าน outputs จาก stack `marginsight` แล้วเขียน **ค่าที่เปิดเผยได้เท่านั้น** ลง `web/out/config.json`: API URL, Cognito domain, SPA client ID จึงไม่ต้องส่ง token ให้ Frontend และห้ามใช้ Cognito client secret ใน SPA.

Publish ใช้ private bucket เดิม; ไม่เปิด S3 public, ไม่เปลี่ยน CORS เป็น `*`, ไม่ปิด JWT/membership checks ถ้าเจอ Failed to fetch ให้ตรวจ config/CORS/OPTIONS/API และ Cognito callback ก่อน.

ถ้าต้องการให้ไฟล์ HTML/config ใหม่เห็นทันที อ่าน DistributionId ของ stack จริงแล้ว invalidate เฉพาะหน้า:

```bash
distribution=$(aws cloudformation describe-stacks --stack-name marginsight \
  --region ap-southeast-1 --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue | [0]" --output text)
aws cloudfront create-invalidation --distribution-id "$distribution" \
  --paths '/' '/index.html' '/config.json' '/404.html'
```

ไฟล์ assets มี cache 300 วินาที; HTML/config ใช้ no-store อย่า invalidate ทั้งเว็บซ้ำโดยไม่มีเหตุผล การปรับธีม Cognito เป็นงานแยก: `python3 scripts/cloud-brand-auth.py` ใช้เฉพาะเมื่อแก้ branding และมีสิทธิ์ที่ตรง.

## 6. ถ้าต้องการสร้างในบัญชีใหม่

ต้องให้เจ้าของระบุ account/Region/budget/ชื่อ stack/สิทธิ์ก่อน รุ่นนี้ guard ไว้ที่บัญชีทีมและ Singapore **จึงยังสั่ง clone แล้ว deploy ไปบัญชีอื่นตรง ๆ ไม่ได้** AI ต้องเตรียมและตรวจ target ใหม่ให้เป็นการเปลี่ยนที่ review ได้ก่อน:

1. เปลี่ยน target อย่างสอดคล้องใน operator scripts และ frontend `web/src/lib/auth.ts` ซึ่งตรวจ account/domain/API Region อยู่ ห้ามแก้เป็นยอมรับทุก domain เพื่อให้ผ่าน.
2. ตรวจ template outputs, Cognito callback/logout URLs, issuer/audience/resource-server scope, CORS exact origin, CloudFront OAC และ private uploads ให้สัมพันธ์กับ target ใหม่.
3. ตรวจบริการและ Bedrock In-Region ที่เข้าถึงได้จริง ประเมินค่าใช้จ่ายที่ <https://calculator.aws> ปิด AI/LINE ไว้ก่อนหากยังไม่มีสิทธิ์/secret ห้ามสมัคร Marketplace หรือออกองค์กร.
4. เลือกเส้นทางสร้าง IAM ตามสิทธิ์บัญชี: template ปกติมี roles ใน CloudFormation; บัญชีทีมเดิมใช้สองช่วง foundation → scoped roles → full external-role template เพื่อเลี่ยงข้อจำกัดเดิม ไม่รันทั้งสองเส้นทางทับกัน.
5. สำหรับสองช่วง: ตรวจ foundation ใหม่ก่อนสร้าง → สร้างเฉพาะ 7 roles ที่ตรวจ trust/policy → deploy full template ที่อ้าง roles เหล่านั้น → publish Frontend จาก outputs ใหม่ ห้ามใช้ foundation downgrade stack ที่มีอยู่.
6. ทดสอบตามข้อ 7 และบันทึก URL/commit/outputs ที่อ่านจริง แยกสิ่งที่ local ผ่านจากสิ่งที่ AWS ผ่าน การตั้งบัญชีใหม่ไม่ย้ายผู้ใช้/ข้อมูลของระบบเดิมให้อัตโนมัติ.

ขั้นตอนนี้เป็นแผนสำหรับเป้าหมายใหม่ ยังไม่มีหลักฐาน deploy บัญชีใหม่นั้น และไม่มีสิทธิ์ใช้เครดิตของบัญชีใหม่จากเอกสารนี้เพียงอย่างเดียว.

## 7. เช็คก่อนส่งให้ทีมใช้

- Health 200, normal `/me/stores` ไม่ใส่ access token ต้อง 401, private bucket ต้องเข้าตรงไม่ได้ และ OPTIONS/CORS ต้องผ่านสำหรับเว็บต้นทางที่ถูกต้อง.
- กดเข้าเดโมระบบเต็ม ได้ร้าน MOCK ใหม่ กำไร baseline **9 บาท**, margin **4.5%**, TTR **28%**; ลดราคา 15% ได้กำไร **−14.10 บาท**. ไม่เอาค่านี้ไปคาดหวังกับร้านส่วนตัวว่าง.
- สมัคร/ยืนยันอีเมล/ล็อกอิน/สร้างร้านว่างได้ ทดสอบสองผู้ใช้คนละร้านจริงก่อนอ้าง tenant isolation ครบ AWS; ห้ามให้ AI ตั้งหรือรับรหัสผ่านแทนเจ้าของ.
- นำเข้า CSV/XLSX, ไฟล์ซ้ำ/ซ้อน/ขัดแย้ง, ต้นทุนย้อนหลัง, actual fees, หลักฐาน, simulation, reconciliation และ export; ผลเงินตรงสตางค์ ไม่ใช้ tolerance 5% สำหรับ ledger จริง.
- ผู้ช่วยอ้างผล engine; model unavailable/เลขผิดต้อง fallback ภาพ OCR เป็น draft ตรวจยอด/หน่วยแล้วให้คนยืนยัน LINE ต้องมี Channel และ live reply ก่อนอ้างว่าเชื่อมจริง.
- บันทึก commit ของทั้งสอง repo, formula version/hash, stack/change set, เวลาและผลตรวจ, งบที่อ่านพร้อม timestamp ใน `docs/verification.md`, `docs/status.md`, `docs/cost-log.md`. ห้าม commit token, ข้อมูลร้านจริง หรือ screenshot ที่มีข้อมูลส่วนตัว.

สถานะโครงการก่อนแยกคือ **PARTIAL_WITH_EXTERNAL_BLOCKERS**: LINE Channel, native marketplace schemas/สิทธิ์, real receipt ground truth และการตรวจครบ flow ด้วยสองบัญชี Cognito ยังมีข้อจำกัด การผ่าน build ของ repo ใหม่ไม่เปลี่ยนสถานะเหล่านี้เป็นผ่าน AWS.

## 8. หยุดค่าใช้จ่ายและย้อนรุ่น

ถ้า AI เกินงบ/ผิดพลาดให้เตรียม update `AIEnabled=false` ผ่าน full template เดิมและตรวจ change set; หยุด event source mapping เฉพาะ worker ของงานนี้เมื่อจำเป็น ไม่ purge queue/ลบ table/bucket/user pool เพื่อหยุดค่าใช้จ่าย Storage และ log ยังมีค่าใช้จ่ายแม้หยุด worker.

Rollback ด้วย commit/artifact และ parameter รุ่นที่ตรวจผ่าน: Backend เตรียม change set จากรุ่นเดิมโดยรักษาข้อมูล; Frontend build/publish รุ่นเดิม ห้ามย้อน IAM/auth policy หรือเปิดสิทธิ์เพื่อแก้ UI จำไว้ว่าทรัพยากร Retain และ roles ที่สร้างแยกยังอยู่หลังลบ stack; teardown ต้องตรวจรายการจริงและอนุญาตแยก.

## 9. Prompt ที่เพื่อนคัดลอกส่งให้ AI ได้

```text
ช่วยอัปเดต MarginSight บน AWS จากสอง repository:
https://github.com/skzx1/MarginSight-Backend
https://github.com/skzx1/MarginSight-Frontend

อ่าน AGENT.md, plan.md, AWS-HANDOFF.md และ docs/status.md ของแต่ละ repo ก่อน
ใช้เป้าหมายเดิม account 109991964227 / ap-southeast-1 / stack marginsight
Bedrock direct us-east-1 เท่านั้น ตรวจตัวตน SSO และงบล่าสุดก่อนทำงาน cloud
เครดิตทีม 350 USD รวม เป้าหมายทดลอง 25 USD ไม่สร้าง stack/IAM/บริการซ้ำ
ทำ npm ci และ npm run verify แยกทั้งสอง repo ห้ามต้องพึ่งโค้ด sibling ตอน build
สูตรอยู่ Backend; ถ้าแก้สูตรให้ export และ sync generated preview พร้อม hash
ถ้าเปลี่ยน Backend ใช้ template-external-roles.yaml กับ roles เดิม
เตรียม change set โดยรักษา parameter ปัจจุบันทุกตัว ตรวจ replacement/data loss
แล้ว execute เฉพาะงานที่เจ้าของบัญชีอนุญาต หากยังไม่ได้รับสิทธิ์ deploy
ให้ทำโค้ด/tests/แผนทรัพยากรและ change review ที่ไม่ใช้งบให้ครบก่อนขออนุญาต
Frontend publish ไป bucket จาก outputs ของ stack เดิม ไม่สร้างอีก stack
ห้ามใส่ credentials ใน Git/prompt/browser bundle ห้ามปิด auth/CORS เพื่อให้ผ่าน
ห้ามย้ายข้อมูลร้านจริงมาเดโม และห้ามเรียก MOCK ว่าเชื่อมแพลตฟอร์มจริง
ตรวจเว็บจริงและบันทึกผล local/AWS แยกกัน พร้อม commit ทั้งสอง repo
ถ้าขาดสิทธิ์/LINE/ข้อมูลแพลตฟอร์มให้จบงานอิสระและระบุ blocker ที่แน่นอน
รายงานไทยอย่างตรงไปตรงมา ไม่อ้าง FULL_SCOPE_VERIFIED จนมีหลักฐานครบ
```

กรณีจะใช้บัญชีใหม่ ให้เปลี่ยนย่อหน้าเป้าหมายเป็นข้อมูลที่เจ้าของบัญชีแจ้ง และให้ AI ทำข้อ 6 ก่อน ห้ามส่งต่อ session authorization ของบัญชีเดิมเป็นสิทธิ์บัญชีใหม่.
