# Landing ตามภาพอ้างอิง — 21 ตุลาคม 2026

## ขอบเขตที่ผู้ใช้เลือก

ผู้ใช้เลือกปรับ **ทั้ง landing page รวมส่วนด้านล่างและ footer** จากคำถามเรื่อง scope ภาพอ้างอิงชื่อ `codex-clipboard-104186e9-f842-4c3f-8c2c-24e114d8f9d6.png` เป็นภาพความละเอียดต่ำ จึงใช้ topology และ hierarchy เป็นหลัก ไม่อ้างว่าคัดลอกข้อความเล็กทั้งหมดได้

THESIS: เห็นยอดขายและเงินหักร่วมกัน ก่อนถามต่อหรือตัดสินใจ

OWN-WORLD: ฟอนต์ Anuphan/Inter เดิม, พื้นเกือบขาว, sage บาง, emerald สำหรับวงโคจร และ deep green สำหรับ evidence/assistant panels จำกัด override ที่ landing เท่านั้น

STORY: Header → Hero กึ่งกลางและ result preview ในวงโคจร → ช่องทาง → shop example คู่แผงยอดหักสีเข้ม → workflow 3 ข้อ → assistant example → แพ็กเกจ/FAQ → closing CTA/footer

FIRST VIEWPORT: หัวเรื่องสองบรรทัดอยู่กลาง มี primary CTA และลิงก์ดูตัวอย่าง ต่อด้วยภาพรวมร้านในวงโคจร โดยใช้ native scrolling

FORM: user-pinned reference; ไม่ใช้การสุ่มแนวใหม่ ภาพอ้างอิงมาก่อน template ของ skill และไม่เปลี่ยนระบบสีภายใน workspace

## ไฟล์และความสามารถ

- `welcome.tsx` เป็น entry ที่ส่งต่อไป `landing.tsx`; layout ใหม่อยู่ใน `landing.tsx` และ `landing.module.css`
- ขยาย `channel-orbit.tsx` / CSS ให้ใช้วงรีบนจอกว้าง วงสูงขึ้นช่วงกลาง และวงกลมบนมือถือ; inverse scaling ชดเชยการบีบวงรี ทำให้ภาพไม่ถูกยืด
- มือถือแยกการ์ดผลตัวอย่างไว้ใต้ orbit เครื่องหมายกลางจึงไม่ชนโลโก้
- ทุก CTA หลักไป `/login/`; anchor nav, FAQ และลิงก์ดาวน์โหลด template ใช้ปลายทางที่มีจริง
- ไฟล์ story เก่ายังคงอยู่เพื่อรักษางานเดิม แต่ไม่ได้ mount บนหน้าแรกแล้ว ไม่มี pinned five-beat interaction บน route นี้
- เก็บ c.scope, ข้อจำกัด canonical templates, AI/LINE caveat, ราคา/โควตา/นโยบาย TBD และ trademark note ไว้ ไม่เพิ่ม endorsement หรือ testimonial
- ข้อมูลเงินเป็น synthetic display fixture เดิม ไม่แก้ engine หรือ in-app channel badges
- `shopee.png`, `lazada.png`, `tiktok.png` เป็นไฟล์ผู้ใช้เดิม ไม่ดัดแปลง ยังขาด **LINE Shop** ที่ตรงแบรนด์ จึงใช้วงกลมชื่อ; `line.png` ทั่วไปไม่ถูกนำมาแทน

## ผลตรวจล่าสุด

- `npm run verify` ผ่าน TypeScript, preview integrity, browser-secret policy, tests 50/50, static export และ packaging
- ตรวจ viewport 320/390/768/1024/1440/1920px ทั้ง TH/EN ไม่ล้นแนวนอน รูปโหลดครบ ระยะวงโคจรเทียบกรอบการ์ดตรวจทุก 5 องศาไม่ชนกัน
- CSS hit targets อย่างน้อย44px; จุดหลักที่ตรวจมีขนาดคงที่44–76px เมื่อ layout/entrance เข้าที่ ตรวจ keyboard focus, Escape และ persistent pause/resume แล้ว
- contrast ที่แก้หลังการตรวจภาพ: muted/canvas5.78:1, panel-secondary/deep9.82:1, emerald/white5.19:1; dt/dd รับสีจากแถวของ ledger โดยตรง
- FAQ เปิด/ปิดได้ และไม่ล้นเมื่อไอคอนหมุน
- no-JS ใช้ production HTML ถอดscriptทุกตัว ทดสอบ6ขนาด: 0scripts, rotorpaused และไม่ล้น
- reduced-motion ใช้ fixture บังคับ CSS media branch ของ build ทดสอบ6ขนาด: animation-name:none และไม่ล้น **ไม่ใช่การเปิด OS Reduce Motion จริง**
- Detector เตือนเฉพาะการใช้ Inter ซึ่งคงไว้ตามข้อกำหนด reuse ฟอนต์เดิม
- เอกสารระบบสี/ระยะ/คอมโพเนนต์ของ landing อยู่ `DESIGN.md` และ local `.impeccable/design.json`; ไม่มีการยกระดับ override นี้ไปใช้กับ workspace

## ตรวจภาพแบบ inline

ทำเองตาม workflow แบบ degraded เพราะไม่มีการอนุญาต subagents ไม่ใช่การตรวจโดย reviewer อิสระ

disposition: ship — สำหรับ local design review เท่านั้น

### persistence

PRODUCT.md และ DESIGN.md ระบุขอบเขตชัด แผนผัง source สอดคล้องกับหน้า build

### fidelity

| จุด | ผล | หลักฐาน/เหตุผล |
|---|---|---|
| Header และ headline กึ่งกลาง | match | ภาพ desktop และ full-page |
| วงโคจรและ result preview | adaptation | ใช้ emerald/sage ที่ตกลงไว้ และคง supplied logos; มือถือแยก preview เพื่อให้อ่านได้ |
| คู่แผง light/dark | match | ผลตัวอย่างชุดเดียวกันและเงินหักครบ |
| workflow 3 คอลัมน์ | match | จัดตามภาพ; เป็นขั้นตอนนำเข้าที่มีอยู่จริง |
| dark assistant panel | adaptation | ใช้ตัวอย่างบทสนทนาที่ติดป้าย แทนการอ้างคำตอบสด |
| แพ็กเกจและ FAQ | adaptation | รักษาข้อมูลเดิมที่ผู้ใช้ต้องรู้ เพิ่มจากภาพอ้างอิงโดยไม่เดาราคา |
| TYPE | adaptation | Anuphan/Inter เดิมตามข้อกำหนด reuse และรองรับไทย |
| MATERIAL | match | UI records, vector orbit lines และ supplied raster logos ไม่มีภาพลูกค้าหรือคำรับรองที่แต่งขึ้น |
| GROUND | adaptation | เปลี่ยนฐานอ้างอิงไปเป็น warm white/sage/deep green ตามแบรนด์ที่ตกลง |
| CTA และ footer | match | ลิงก์จริงและ trademark/policy caveats |

### ceiling

ภาพรวมใช้ hierarchy และจังหวะ light/dark ตามภาพอ้างอิง ขอบเขตนี้ไม่ได้อ้าง pixel-perfect fidelity จากภาพขนาดเล็ก

### material_fixes

แก้แล้ว: ledger contrast, เป้ากด header, การชนการ์ดที่1024px และขอบล้นจาก transformed orbit/FAQ ในภาษาอังกฤษ ไม่พบรายการเปิดจากชุดตรวจที่ระบุข้างต้น

### keep

คงภาพตัวเลขที่อ่านได้ ข้อจำกัดข้อมูล และวงโคจรที่หยุดได้ ไม่เพิ่มเสียงรบกวนหรือ commercial claims

## หลักฐานภาพและข้อจำกัด

ภาพ/JSON อยู่ใน ignored `tmp/reference-landing-review/`: `desktop.jpg` (EN hero), `mobile.jpg` (TH hero), `full-page.jpg` (EN ทั้งหน้า), checks และ fallback-checks. เป็นภาพจาก production static build ในเครื่อง ไม่มี AWS publish

ยังต้องตรวจบนโทรศัพท์จริง: แตะเลือก/แตะด้านนอก, address bar, VoiceOver/TalkBack, system text scaling, OS Reduce Motion และความลื่นในโหมดประหยัดพลังงาน. เจ้าของต้องยืนยันไฟล์ LINE Shop และคู่มือ clear-space ก่อนอ้างว่าผ่านข้อกำหนดแบรนด์ครบถ้วน

## 21 October 2026 — discount-first reference update

Supersedes the earlier hero description above. The supplied brief is the authority for copy and semantics; the screenshot is a layout reference, not a source of claims or assets.

- Header: five real section anchors, text sign-in, one primary Try for free action. Native details menu below 1190px, CTA remains visible; TH/EN inside the phone menu.
- Hero: checkable file-based badge, exact requested Thai/English headline, solid emerald accent, primary action and an outlined link to the real static example. No fabricated video button.
- Example: fixed illustration, price200 / product120 / shipping30 / illustrative15% fee. Profit20; discounted170 loses5.50; price176.47 covers the illustrated costs after rounding fees to satang. The 11.8% threshold is explicitly approximate. No live alert, Auto-Fix, certification or actual marketplace rate is claimed.
- Desktop rings circulate over48s in side lanes, fading behind the fixed copy zone. Stage height follows content so English is not clipped. Phones move the complete static example before a compact circular orbit. This responsive adaptation avoids moving artwork over text.
- Latest brief restricts logo provenance to `public/brands/`. That directory and its four official channel files are absent. All four channel badges now use neutral named placeholders; earlier `assets/images` files are preserved but not used. In-store uses a generic shop icon. No grayscale filter is applied to a real brand logo.
- Channel strip says รองรับการนำเข้าข้อมูลจาก; includes the four channels and in-store. File-template limitations and owner trademark notice remain.
- The five story beats are a short native-scroll sequence using the existing10000/6200/1500/900/1400/0 fixture, followed by its existing shop breakdown. Three steps, four benefits, illustrative assistant, pricing TBD, five FAQs, closing CTA and footer follow.
- Buttons leading to login consistently use ลองใช้ฟรี / Try for free. Other links identify the real local section they open.

### Review contract and scope

THESIS: understand the risk of discounting before clicking the real sign-in flow.
OWN-WORLD: existing Anuphan/Inter, warm white, emerald and sage; amber only for illustrative losses.
STORY: price200 gives20, discount15% loses5.50, shop sales10000 can still net0; inspect the recorded costs.
FIRST VIEWPORT: centered copy, calm peripheral orbits, concrete example without invented endorsements.
FORM: user supplied precise composition and written brief; no concept tournament or pixel-copy claim.

Review is performed inline because repository/user instructions prohibit subagents. It is a local source/render review, not production or a fresh independent reviewer certification.

| Reference element | Result | Reason |
|---|---|---|
| TYPE | Adapted | Existing Thai-capable Anuphan bold; Inter money, per reuse requirement |
| MATERIAL | Matched | Real HTML sample card and simple CSS rings; no borrowed screenshot assets |
| GROUND | Adapted | Warm white and emerald/sage required by brief instead of navy/blue |
| Header and centered hierarchy | Matched | Real anchors, language toggle, sign-in and trial entry |
| Rating/certification/partner proof | Omitted intentionally | No supporting MarginSight evidence |
| Alert + assistant | Adapted | Clearly labelled, fixed numerical example; no unsupported control |
| Orbit behind hero | Adapted | Side-lane fade protects text; phone ring follows card |
| Logo strip | Placeholder | No files in the latest allowed source directory |

Detector ran once: font reuse warnings for Inter retained by user direction; token-size/radius/color advisories reflect the now documented example UI and responsive ramp. No new library. React check: effects cleaned up, IntersectionObserver only, static default, no JS animation loop or new request waterfall.

Outstanding inputs: official Shopee/Lazada/TikTok Shop/LINE Shop files and clear-space guidance in `public/brands/`; Premium prices/limits; final policy/contact. No fabricated rating/user-count/certification placeholders are displayed.

Real-phone check: Safari/Chrome address-bar resize, tap pause/resume, visible focus and Thai wrapping under increased text size, Reduce Motion at OS level, and perceived animation smoothness on a mid-range device. These cannot be certified by a desktop viewport check.

### Final review disposition

1. Fidelity: centered hero/header/card/strip match the written composition; fresh Thai-first copy, emerald palette, no invented proof. Mobile ordering and side-lane fade are deliberate accessibility adaptations.
2. Craft: six widths in both languages have no document overflow and no visible targets smaller than44px in the DOM check. Focus label, menu Escape and native FAQ verified. Contrast tokens remain dark-on-light; this is not a complete WCAG audit.
3. Product truth: fixed hero numbers visibly labelled illustrative and15% hypothetical; existing fee/formula contract untouched; import limitations and TBD business details retained.
4. Behavior: keyboard selection pauses orbit, IO pauses after leaving viewport; no-script/reduced CSS branches static. Actual OS reduced motion and real-phone performance unverified.
5. Disposition: ship for local user review. Missing brand artwork, commercial terms and final policy/contact remain explicit. Full-page screenshot capture failed; desktop/mobile viewport images and numeric checks are the recorded evidence. No independent agent review or production deployment claimed.
