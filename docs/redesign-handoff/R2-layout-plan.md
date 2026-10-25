# MarginShot redesign R2: layout, navigation and assistant history (proposal)

Status: **APPROVED by the owner on 2026-10-25** (WP1–WP7, §K, Q1–Q13), with the decisions recorded in "Owner decisions" at the end of this file. Implementation is in progress on the working tree. No commit, push or merge until the owner allows it separately.
Date: 2026-10-25. Branch `feat/marginsight-redesign`. Audit HEAD: `c78ca33`, working tree clean, in sync with origin.
Supersedes nothing silently. Where R2 conflicts with an approved decision in `research/G5/plan.txt` or `HANDOFF.md`, the conflict is listed under "Decisions requested from the owner" and needs an owner decision.
Revision 1 (same day): applied the independent QA review (Agent 6), blocking items B1-B5; see the end of the file.
Revision 2 (same day): added P5 as work package WP7 (§K), with its decisions D-R2-10 to D-R2-14.

Owner requests: P0 remove "อ่านบิลซื้อ" (`receipts`) · P1 Overview uses the full screen · P2 consistent page layout · P3 white sidebar · P4 chat history out of the global sidebar · P5 button/icon spacing and back-navigation correctness (added in revision 2, §K).
QA scope (owner): Desktop + Mobile, Thai only.

Evidence: 4 read-only audit agents (IA, frontend/CSS, overview/pages, assistant), plus lead screenshots of the local build (`web/out` + `qa-tools/serve.mjs` mock API) at 1440×900, 1920×1080 and 390×844 in Thai.

---

## A. Current state (verified)

### Routes and screens
- Hash routing. `Screen` union (`web/src/lib/types.ts:25`), 14 screens, `SCREENS` in `web/src/lib/navigation.ts:7`.
- Unknown hashes fall back to overview (`web/src/lib/routes.ts` `parseHash`).
- All screens are mounted in `web/src/app/login/page.tsx` inside `AppShell` (`web/src/app/components/shell.tsx`).

| Screen | TH label | Reached from | Parent |
|---|---|---|---|
| overview | ภาพรวม | sidebar, tab bar | none |
| products | สินค้า | sidebar, tab bar | none |
| playground | Playground | sidebar sub, products link | products |
| finance | การเงิน | sidebar, tab bar | none |
| orders | ออเดอร์ | sidebar sub, finance and overview links | finance |
| reconciliation | ตรวจยอดรับสินค้า | sidebar sub, **and** a store hub tile | finance |
| imports | นำเข้ารายงาน | sidebar sub (under the "นำเข้าข้อมูล" heading), store hub tile, overview header | store |
| **receipts** | **อ่านบิลซื้อ** | sidebar sub (under "นำเข้าข้อมูล"), store hub tile (`store-settings.tsx:55`) | store |
| rules | กฎและแคมเปญ | sidebar sub (under "นำเข้าข้อมูล"), store hub tile | store |
| line | เชื่อม LINE | sidebar sub, store link | store |
| assistant | ถามผู้ช่วย | sidebar, tab bar | none |
| store | ข้อมูลร้าน | sidebar, tab bar | none |
| addProduct, simulation | เพิ่มสินค้า, ลองราคา | page content only | products |

### Sidebar
- **At 1024 and wider**, the sidebar is 232px wide.
  - Background is `--color-bg-sidebar` = cream-100 `#F4F2EC` (`tokens.css:30`). It has **no border** (`globals.css:221`).
  - Against the canvas `#FAF9F5` the contrast is 1.06:1, so the edge comes from tone only.
  - The sidebar holds 6 groups, 14 items and an account block (language and logout).
  - Measured: the nav fits exactly (720/720 px) on non-assistant screens at 1920×1080.
- **768–1023:** a 72px icon rail, plus an overlay drawer that shows the full grouped list.
- **Below 768:** a white top bar and a bottom tab bar with 5 items (`PRIMARY`). These are already white.
- **The "นำเข้าข้อมูล" group** has no top-level item. Its 3 sub-items are parented to `store`, so on the rail and tab bar they highlight Store, not their own group.

### Chat history in the sidebar (P4)
- On the assistant screen only, `shell.tsx:124` renders `assistantNav` (`<AssistantDrawerNav/>`, `login/page.tsx:99`) under the "ถามผู้ช่วย" item. It holds New chat, up to 8 recent chats, and "View all".
- Measured at 1920×1080: the nav grows to **982px scroll height in a 753px box**. At 1440×900 the "ถามผู้ช่วย" item itself is cut off behind the account block (screenshot `assistant-1440`).
- Storage is **localStorage only**. The key is `marginsight:chat:v1:<sha256(mode|identity|base)>` and the archive is `{version:1, activeId, sessions[]}` (`lib/assistant-sessions.ts:30,81-89`). There is no server history API.
- The page already has the full history UI, `AssistantHistory` in full mode, with:
  - search
  - Today / Yesterday / Week / Older groups
  - roving focus, and the Delete key (opens the delete confirmation)
  - row menu with Rename and Delete
  - skeleton, empty, no-results and storage-note states
- That UI opens as dialog panel `'sheet'`, from the header History button. The button is only visible below 1024 (`assistant.module.css:51-52`).
  - Below 768 it is a bottom sheet.
  - From 768 to 1023 it is a 420px right panel.
- The sidebar's "View all" opens the same component as panel `'allHistory'`, a 680px modal.
- No test asserts the sidebar drawer list (`AssistantDrawerNav`, `viewAll`).

### Overview (P1)
- Data comes from `GET {base}/dashboard?month=` once per month in the period (`use-overview-dashboard.ts`). All figures are derived on the client. **No new data is needed for R2.**
- Layout:
  - `.overview-page`, the header and the context bar are capped at **1440px with no auto margin** (`globals.css:744-745`).
  - The side column is 320px from 1280, and 360px from 1600.
  - At 1920 the usable width is about 1632px. Overview uses 1440, so about 190–220px on the right is empty and the page looks pinned left (screenshot `overview-1920`).
  - Other screens use the full 1632, so the right edge jumps between screens.
- Other problems:
  - The 4 KPI cards sit only in the main column, so each is about 190px wide at 1440.
  - Each KPI shows its own spinner while loading.
  - `Empty` is a `<section>`, and the global rule `section,.panel{border…}` (`globals.css:62`) turns every section into a card. The result is a card inside a card in Recent orders.
  - Negative-margin patches: `.overview-status-bar` and `.overview-scope`.
  - The store name appears 3 times: sidebar, context select, and the eyebrow above the h1.
  - On mobile (390), the launcher, money and channel cards come after the entire orders list.

### Page-to-page inconsistency (P2)
- **Content width** differs by accident:
  - 760: `.screen-content>form`
  - 960: `.form-grid`, `.evidence`
  - 1440: overview
  - 1920: workspace and finance
  - 820: assistant and playground chat column
  - 560: simulation
- **Primary actions are in different places:**
  - In the header via `ScreenActions`: overview, finance.
  - In the page body: products (Add), rules (+ new), reconciliation (Export).
- **There are 4 card systems:**
  - global `section` / `.panel`
  - `finance.module.css .panel`
  - `store-settings.module.css .card`
  - `product-catalog` styles
- **Loading states differ:** skeletons in finance, store and products; spinners in overview, imports and orders.
- **Records are shown differently:** orders are bare rows, reconciliation is one card per order, products is a table.
- **Breakpoints in use:** 479, 600, 768, 900, 1024, 1100, 1200, 1280, 1600, plus container queries. Viewport media queries and container queries are mixed.
- **Shared primitives that already exist:**
  - `forms.tsx`: `Field`, `Select`, `ErrorNotice`, `Loading`, `Empty`, `Submit`
  - `ledger.tsx`: `DataStatus`, `Money`, `EvidencePanel`
  - `ui.tsx`: `Icon`, `Brand`, `PageIntro`
  - the shared `screen-header` with the `ScreenActions` portal
- **There is no `PageHeader`, `Panel` or `Card` component.** `className="panel"` is hand-written about 30 times.

### "อ่านบิลซื้อ" dependencies (P0)
- **References:**
  - `types.ts:25`, `navigation.ts:7,20,31`
  - `login/page.tsx:25,100,110`
  - `store-settings.tsx:55`
  - `copy.ts:14` (label)
  - the `receipts.tsx` file itself
  - `tests/navigation.test.mjs:13` (14-screen count) and `:21` (parent table)
- **Used only by receipts (provisional, confirm with grep at implementation time):**
  - Copy keys in `copy.ts:25`: `receiptNote`, `imageLimit`, `readReceipt`, `receipt`, `draft`, `unreadable`, `total`, `lineTotal`, `packs`, `unitsPerPack`, `acknowledgeReceipt`, `confirmCost`, `totalsMismatch`.
  - CSS `.receipt-image` and `.receipt-draft` (`globals.css:134-135`).
- **Shared, must keep:**
  - the `receipt` icon (finance export button, `finance.tsx:155`)
  - `validateFile` in `imports.tsx` (receipts only imports it)
  - `REVIEW` / `MANUAL_REVIEW` status labels in `ledger.tsx`
  - the `Job.draft` / `totalsMatch` types
  - the `kind !== 'receipt'` filter in `imports.tsx:23`, because the backend may still return receipt jobs
- **Costs can still be set without receipts**, in three places:
  - the product cost editor (`products.tsx:127`)
  - CSV in add-product
  - `imports` type `costs`

  Only OCR-assisted cost entry is lost.
- **The backend `/receipts` endpoints are not touched** (the other repository owns them).

### Tooling
- `npm run verify` runs: `verify-preview`, `tsc`, `check-policy`, `node --test tests/*.test.mjs`, `next build`, `package-deploy`.
- Policy tests constrain every CSS change. `style-policy` forbids colour literals outside `tokens.css`, sizes below 12px and certain shadows. `tokens.test` sets contrast floors for the sidebar tokens. `semantic-colour` forbids terracotta on values.
- Playwright and Chromium are available. `qa-tools/serve.mjs` serves `web/out` with a mock API, and works in this environment (verified).

---

## B. Target information architecture

```
Sidebar (>=1024, white)                      Tab bar <768 / rail 768-1023 (unchanged: 5 PRIMARY)
  ภาพรวม                                      ภาพรวม · สินค้า · การเงิน · ถามผู้ช่วย · ข้อมูลร้าน
  สินค้า
    สินค้า
    Playground (sub)
  เงิน
    การเงิน
    ออเดอร์ (sub)
    ตรวจยอดรับสินค้า (sub)
  ผู้ช่วย
    ถามผู้ช่วย          ← one item only, no history list
  ร้าน
    ข้อมูลร้าน
    นำเข้ารายงาน (sub)  ← moved from "นำเข้าข้อมูล" (parent was already store)
    กฎและแคมเปญ (sub)   ← moved from "นำเข้าข้อมูล"
    เชื่อม LINE (sub)
  ─ บัญชี: TH/EN · ออกจากระบบ
```

- The "นำเข้าข้อมูล" group is removed. With receipts gone it would hold 2 items that already belong to Store.
- The sidebar keeps global destinations only. In-page objects (chats, orders, products) live on their pages.
- Store hub tiles: remove the `receipts` tile. Keep `imports` and `rules`. **Decision D-R2-4:** keep or remove the `reconciliation` tile, whose parent is finance.
- No new screens or routes. `#receipts` falls back to overview through the existing `parseHash` (decision D-R2-2).

## C. Page-by-page layout plan

**Shared standard (P2)**
- **Header band:**
  - The existing `context-bar` and `screen-header` stay.
  - The eyebrow store name above the h1 is removed. It repeats the store select.
  - At most one filled primary action, placed in `ScreenActions`.
- **Container widths, as 2 explicit classes instead of side effects:**
  - **wide:** `max-width: var(--content-wide)` = 1600px, centred, for overview, finance, products, orders and reconciliation.
  - **readable:** 760px, for forms such as imports, rules, simulation, line and store forms.
  - The chat column keeps its own 820/48rem width.
- **Section rhythm:** one vertical gap, 24px. Remove the negative-margin patches.
- **States:**
  - Skeleton on first load (reuse the finance / store pattern).
  - `Loading` for refreshes.
  - `ErrorNotice` plus Retry at the top of the content.
  - `Empty` must not render as a nested card.
- **Breakpoints:** reuse the existing ones. No new ones are added.

| Page | Problem | Proposal | Desktop / Mobile | Risk |
|---|---|---|---|---|
| Overview | Capped at 1440 and pinned left. KPIs squeezed into the main column. 4 spinners. Nested Empty card. Side cards come last on mobile. | Wide container, centred. Row 1: alert (D10) and the 4 KPIs **across the full width**. Row 2: chart \| money card. Row 3: recent orders \| launcher + channels. Side column 320 / 360 at 1600 (existing). One KPI skeleton. Status and scope merged into one meta line. | Desktop: 2 columns from 1280, 1 column below that. Mobile: alert → KPIs (2 columns from 400px, existing container query) → money card → chart → orders → channels → launcher. | Changes the approved P4e-1 column structure and the mobile order after D10 (D-R2-5). Chart viewBox 720 vs a wider column changes tick sampling (chart label tests). |
| Finance | Workspace 1920 wide. Its own warning style. | Wide container. Keep the module layout. | Unchanged except width. | Low. |
| Products | Add button in the body. | Move "เพิ่มสินค้า" into `ScreenActions`. Wide container. | Mobile: header action wraps under the h1 (existing header behaviour). | Focus and arrival tests. Provisional (D-R2-6). |
| Orders / reconciliation | Bare rows / one card per order. Export in the body. | Wide container. Reconciliation Export goes into `ScreenActions`. Card per row kept for now. | — | Provisional (D-R2-6). |
| Imports, rules, line, simulation | Width set by accident. Rules "+ new" in the body. | Readable container class. Rules "+ new" goes into `ScreenActions`. | — | Low. |
| Store | Its own `s.card` system. | Leave the store module styling. Only the container and header follow the standard. | — | Store save dock is sticky above the tab bar; regression check needed. |
| Add product, playground | Own title class / chat column. | Header standard only. | — | Low. |
| Assistant | See §D. | — | — | — |

Not changed in R2:
- the landing page (`/`)
- any money formatting
- formulas
- `domain.generated.*`
- `lib/format.ts`
- `tests/frontend.test.mjs`

## D. Chat-history UX plan (P4)

**Recommended layout:**
- **1360 and wider:** a persistent **in-page history column** (`<aside aria-label="ประวัติแชต">`, about 288px) on the left of the conversation. It reuses `AssistantHistory` in full mode: New chat, search, groups, rename/delete menu, storage note. The chat column keeps its 48rem width. Arithmetic: 1360 − 232 sidebar − 288 = 840 ≥ 768 + padding.
- **1024–1359:** the existing History header button is shown (its media query moves from `max-width:1023` to `1359`). It opens the existing `'sheet'` dialog, using the 420px right-panel style instead of the 680px modal, so it reads as a drawer.
- **Below 1024:** unchanged. The header button opens a bottom sheet below 768 and a right panel from 768 to 1023.

**Removed:**
- the `assistantNav` prop and slot in `shell.tsx`
- `AssistantDrawerNav` and the `drawer` branch of `AssistantHistory`, with its CSS (`.drawerNav`, `.recentHeading`, `.historyBottom`, `.viewAll`)
- the `'allHistory'` panel, which only the sidebar opens

**Behaviour preserved:**
- **New chat** still reuses an existing empty chat.
- **Switching chats** sets `activeId` and focuses the composer. Pending replies still land in their own session.
- **Rename and delete** work exactly as today.
- **Persistence:** same localStorage key, same version, no data migration.
- **The active row** keeps `aria-current` and the inset bar.

**Fixes inside the scope of the move:**
- Wrap the history in a landmark (`aside`/`nav` plus a label).
- After deleting the focused row, focus goes to the next row, or to New chat if no row is left. Today focus is dropped, because the Dialog `returnTo` node is gone.
- **Breakpoint mechanism (no hydration double-render):** the column is always in the DOM and shown or hidden by CSS only (`display:none` below 1360). This makes it absent from the accessibility tree and tab order when hidden. The sheet is rendered only while `panel==='sheet'`, and its button exists only below 1360. A `matchMedia('(min-width:1360px)')` listener in `assistant.tsx` calls `closePanel()` if the sheet is open when the window grows past 1360. So at most one *visible* instance exists. The hidden column's separate search state is harmless.
- **Focus spec:**
  - **Select or new chat:** the composer (existing).
  - **Rename confirm or cancel:** the row's ⋯ button. The node still exists; existing Dialog `returnTo`.
  - **Delete confirm (column):** the row at the same index (the next one), else the previous one, else New chat. This applies whether the deleted chat was active or not. If it was active, the existing fallback picks the new active chat, but focus still follows the list position.
  - **Delete (sheet):** `returnPanel` re-opens the sheet, and the same index rule applies inside it.
  - **Delete cancel:** the ⋯ button.
  - **Escape:** closes the topmost layer only (row menu, then dialog, then sheet), per G7 §4.5.
- **Tab order (≥1360):** chat header, then the history column (New chat, search, one roving tab stop for the rows), then the conversation, then the composer. The landmark is `<aside aria-label="ประวัติแชต">`, which is distinct from `#main-navigation`.

**States and Thai text:**
- Skeleton, empty, no-results and the `storageError` note already exist.
- Titles stay on one line with an ellipsis, with the full title in `title`.
- The welcome screen's "recent chats" (up to 6) stays (D-R2-7).

**Not done:** no fake history, no server persistence, and no enforcement of a 100-chat cap. The cap copy exists but is not used today; leave as is.

## E. File-level plan (provisional where marked)

| File | Change | WP |
|---|---|---|
| `web/src/lib/types.ts` | Remove `'receipts'` from `Screen`. | WP1 |
| `web/src/lib/navigation.ts` | Remove receipts from `SCREENS` and `PARENT`. Remove the data group; move imports and rules into the store group. | WP1 |
| `web/src/app/login/page.tsx` | Remove the Receipts import and mount, `'receipts'` from the catalog-error list, and `assistantNav` and its import. | WP1, WP4 |
| `web/src/app/screens/receipts.tsx` | **Delete.** | WP1 |
| `web/src/app/components/store-settings.tsx` | Remove the receipts tile (and reconciliation if D-R2-4). | WP1 |
| `web/src/lib/copy.ts` | Remove the `receipts` label, and receipt-only keys after grep confirms them (provisional). `navGroupData` is removed if unused. | WP1 |
| `web/src/app/globals.css` | Remove `.receipt-image` and `.receipt-draft`. Sidebar `border-right`. Wide/readable container classes. Overview grid (KPI row across both columns, centring). Remove the negative margins. Fix nested Empty. | WP1, WP2, WP3 |
| `web/src/app/tokens.css` | `--color-bg-sidebar` → white (`--cream-0`). Add `--content-wide` / `--content-readable` (size tokens). | WP2 |
| `web/src/app/components/shell.tsx` | Remove the `assistantNav` prop and slot. Drop the eyebrow. | WP2, WP4 |
| `web/src/app/screens/overview.tsx` | Reorder the grid wrappers (KPIs out of the main column; side cards as grid areas for mobile order). One KPI skeleton. | WP3 |
| `web/src/app/components/forms.tsx` | `Empty`: render a flat `div` (provisional; also used by `assistant-history.tsx` and `finance-chart.tsx`). **Lead-owned**, landed in WP2 before agents B/C/D start. | WP2 |
| `web/src/app/components/assistant-history.tsx`, `.module.css` | Remove drawer mode. Landmark. Focus after delete. | WP4 |
| `web/src/app/components/assistant.module.css:17-26` | Remove the assistant-shell overrides that let the sidebar nav scroll and pin `.sidebar-account` (no longer needed). | WP4 |
| `web/src/app/screens/assistant.tsx`, `assistant.module.css`, `assistant-provider.tsx` | In-page column at 1360 and wider. Header button below 1360. Drop `'allHistory'`. | WP4 |
| `web/src/app/screens/products.tsx` / `product-catalog.tsx`, `rules.tsx`, `orders.tsx` | Primary actions moved into `ScreenActions` (provisional, D-R2-6). | WP5 |
| `tests/navigation.test.mjs`, `tests/routes.test.mjs:9` | 14 → 13 screens (both files assert the count). Parent table. Group assertions updated, not weakened. | WP1 |
| `docs/redesign-handoff/qa-tools/capture.mjs:19`, `target-audit.mjs`, `typo-audit.mjs`, `weight-audit.mjs` | Remove `receipts` from their SCREENS lists. | WP1 |
| `web/src/app/screens/imports.tsx` | `validateFile` `image` branch has no caller left. Keep it unchanged (no unrelated refactor) unless the owner asks. | none |
| `tests/*` (new) | Navigation: receipts not reachable; no nav group without a top item. Assistant: the shell has no history slot (pure-logic tests only). | WP1, WP4 |
| `DESIGN.md`, `docs/redesign-handoff/HANDOFF.md` | Record the D2 → white change and the R2 outcome. | WP6 |

## F. Ownership and parallelism

- **Lead (main session).**
  - Owns the shared hot files: `globals.css`, `tokens.css`, `shell.tsx`, `login/page.tsx`, `copy.ts`, `navigation.ts`.
  - Integrates the work, runs `npm run verify` (agents never build).
  - Commits locally in reviewable steps.
- **Agent A (IA / P0).**
  - Edits: `receipts.tsx` delete, `store-settings.tsx`, `tests/navigation.test.mjs`, the new nav test.
  - Requests changes to lead-owned files.
- **Agent B (Overview / P1).**
  - Edits: `overview.tsx`, `overview-charts.tsx`.
  - Supplies CSS hunks to the lead.
- **Agent C (Assistant / P4).**
  - Edits: `assistant.tsx`, `assistant-history.tsx`, `assistant-provider.tsx`, `assistant*.module.css`.
- **Agent D (pages / P2-WP5).**
  - Edits: `product-catalog.tsx`, `rules.tsx`, `orders.tsx` (`forms.tsx` belongs to the lead, WP2).
- **Agent F (controls and back navigation / P5-WP7).**
  - Edits: `product-catalog.module.css`, `store-settings.module.css`, `products.tsx`, `orders.tsx`, `overview.tsx` (back-link labels only), `playground.tsx`, plus new pure helpers and tests.
  - Runs after WP3–WP5, so it does not share files with agents B and D at the same time.
  - Assistant CSS outliers are handed to Agent C (WP4).
  - `globals.css`, `shell.tsx`, `navigation.ts` and `copy.ts` hunks go through the lead.
- **Agent E (QA).** Read-only. Browser checks against the lead's build. Also the independent reviewer for WP7.
- **Parallel work:**
  - B, C and D can run in parallel after WP1 and WP2 land, because their files are disjoint.
  - All `globals.css` hunks are serialised through the lead.

## G. QA matrix: Thai only

Representative viewports, from the existing capture setup (D-R2-1):
- **Desktop:** 1440×900, plus 1920×1080 for the P1 width check only.
- **Mobile:** 390×844.

| # | Scenario | Desktop TH | Mobile TH |
|---|---|---|---|
| Q1 | Sidebar / tab bar shows no "อ่านบิลซื้อ". `#receipts` lands on overview with no error. Store hub has no receipts tile. | ✓ | ✓ |
| Q2 | Every remaining screen is reachable from navigation, and the active state is correct (including imports and rules → ร้าน). | ✓ | ✓ |
| Q3 | Overview: no left-pinned dead band at 1920. KPI row spans the width. Order is correct on mobile. Loading, empty (`serve.mjs --empty`), error and populated states. | ✓ | ✓ |
| Q4 | Sidebar is white, with a `border-right: 1px solid var(--color-border)` edge (decorative divider, measured as present). Active and hover share the same background (`#E8E5DC`, 1.26:1 on white), so the active item must also show the 3px indicator (≥ 3:1) and semibold weight, not colour alone. Focus ring 3px. Contrast is computed from styles (≥ 4.5 text, ≥ 3 indicator/focus). | ✓ | n/a (tab bar already white) |
| Q5 | Assistant: the sidebar has no history at any width. At 1440 and 1920 the in-page column shows existing chats. At 1359 and 1360 the switch between the button and the column is correct. Resizing across 1360 with the sheet open leaves one visible instance. New chat, select, rename, delete (active and non-active) and search work. Focus follows the §D spec. | ✓ | — |
| Q6 | Assistant mobile: the header History button opens the sheet. Select closes it and focuses the composer. Rename and delete inside the sheet return to the sheet with focus per §D. No overflow. Composer reachable above the tab bar. | — | ✓ |
| Q7 | Persistence: the storage key is hashed from identity, so do not write it by hand. Create chats on the pre-R2 build (`c78ca33`) in a persistent browser profile, then load the R2 build in the same profile and confirm the same chats, titles and active chat appear. Reload keeps the active chat. | ✓ | ✓ |
| Q8 | Send a question (mock API). The reply lands in the right chat after switching mid-request. Stop works. | ✓ | ✓ |
| Q9 | All screens: no horizontal overflow, no console errors, targets ≥ 44px, focus ring 3px not clipped, Thai text not clipped in buttons. | ✓ | ✓ |
| Q10 | Regressions (`research/G7/regression-checklist.txt`): R01 arrival focus, R07 drawer, R10–R14 overview/finance, R45, R47 language switch keeps assistant draft, store switch guard, logout. | ✓ | ✓ |

- **Automated:** `npm run verify` must PASS. Main copy TH/EN parity is checked in `tests/frontend.test.mjs:25` (`copy-parity` covers only assistant and catalog copy). That is a code test, not EN UI testing, so it stays mandatory. `frontend.test.mjs` is not edited.
- **Conflict noted:** HANDOFF "Final QA" previously required TH+EN at 9 widths. R2 follows the owner's narrower scope. EN and other widths are reported as *not run*.

## H. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Removing a `Screen` breaks the 14-screen test contract and old `#receipts` links. | Medium | Update the tests deliberately. Rely on the existing fallback. Grep the whole repo for `receipts`. |
| The global `section` card rule is used everywhere (EvidencePanel and others). | High if changed globally | **Do not change it globally in R2.** Fix only `Empty` and the overview nesting. |
| `globals.css` has very long lines, and edits can collide. | Medium | Only the lead edits it. One rule per edit. Diff review. |
| White sidebar without a border loses the shell edge (1.05:1). The token is shared with the assistant drawer CSS (removed in WP4) and the tablet drawer. | Medium | Add `border-right`. Check the tablet drawer. `tokens.test` contrast floors pass on white (6.07 / 18.43 / 3.92 computed). |
| Overview regrid changes approved P4e-1 and the mobile reading order. The chart measures its width (`useChartWidth(720)`, `overview-charts.tsx:21`), so tick density changes on its own when the column widens. | Medium | Owner decision D-R2-5. Run the `chart-axis` tests and the label probe (≥ 12px, no overlap) at 1440 and 1920. |
| Chat state: two history instances; the hidden-but-mounted assistant host; `closePanel` on hide. | Medium | CSS-only visibility for the column, plus a new `matchMedia` listener that closes the sheet at 1360 and above (§D). No such breakpoint hook exists today. Persistence untouched. Q7/Q8. |
| Losing chat data. | High | No change to `assistant-sessions.ts` or the storage key. Q7 seed test. |
| Moving actions into the header changes focus order and arrival. | Low–medium | Provisional WP5. Keep A11. Test R01. |
| Existing user changes. | — | The tree was clean at audit. Re-check before each WP. Never reset or stash. |

## I. Acceptance criteria (pass/fail)

- **P0:**
  - `grep -rn "receipts" web/src` returns 0 hits. `grep -rnw "receipt" web/src` returns only an allow-list: the `receipt` icon (ui.tsx, finance.tsx), the `kind` filter (imports.tsx:23) and the Job types.
  - No nav item or tile for it.
  - `#receipts` renders overview with no console error.
  - The cost editor, CSV import and `imports` still work.
- **P1:**
  - At 1920×1080 the overview content is centred, with left and right gutters equal ±2px, or it fills ≥ 95% of the workspace content box.
  - The KPI row spans both columns at 1280 and wider.
  - No negative margins remain in the overview CSS.
  - On mobile the order is alert, KPIs, money, chart, orders, channels, launcher.
  - No fabricated values; every figure traces to the `dashboard` response.
- **P2:**
  - Every wide screen uses the same max width and the same left/right edge (measured, ±1px).
  - Every form screen uses the readable class.
  - At most one filled primary action per header.
  - No nested card from `Empty`.
- **P3:**
  - The computed sidebar background is `rgb(255,255,255)`.
  - The sidebar has a right border.
  - Text ≥ 4.5:1 and indicator/focus ≥ 3:1, from computed styles.
  - `tokens.test` passes.
- **P4:**
  - `#main-navigation` contains no `[data-chat-row]` at any width.
  - Nav scrollHeight is at most its clientHeight at 1440×900 and 1920×1080 on the assistant screen.
  - The in-page history is visible at 1440, and reachable in 1 tap on mobile.
  - New, select, rename, delete and search work.
  - A seeded archive survives.
- **Global:**
  - `npm run verify` passes.
  - Q1–Q13 are recorded with evidence.
  - Empty diff for `format.ts`, `domain.generated.*` and `tests/frontend.test.mjs`.
  - No push, merge or deploy without the owner.

## J. Execution sequence

1. **WP1: P0 receipts removal and nav regroup.** Lead + Agent A. Checkpoint: tests, plus Q1 and Q2.
2. **WP2: P3 white sidebar, container tokens and classes, header eyebrow removal.** Lead. Checkpoint: `tokens`, `style-policy` and Q4 screenshots.
3. **WP3: P1 overview.** Agent B, with CSS through the lead. **WP4: P4 assistant.** Agent C. These run in parallel. Checkpoint: Q3, Q5–Q8.
4. **WP5: P2 page sweep.** Agent D. Widths and action placement. Checkpoint: Q9.
4b. **WP7: P5 buttons, icons and back navigation (§K).** Agent F, with shared CSS through the lead. Checkpoint: Q11–Q13, plus Agent E's independent review.
5. **WP6: docs, full `npm run verify`, independent QA (Agent E), consolidated Thai report.** Then stop for owner review. Commit locally per WP. Push only on the owner's instruction.

## K. P5: buttons, icons and back navigation (WP7)

### K1. Scope of the audit
- **Controls inspected:**
  - every visible `button`, `a.button-link`, `select` and `summary` on all 13 remaining screens (playground included, receipts excluded after WP1)
  - the sidebar, rail and tab bar items
  - the assistant header and chips
  - store hub tiles
  - product catalog controls and sort headers
- **Shared sources:**
  - base `button` rules (`globals.css` l.7–17, `gap:10px`, `padding:11px 20px`, `min-height:var(--control-height)`)
  - sidebar and tab-bar button rules
  - `Icon` (`web/src/app/ui.tsx`, 20px) and `ChatIcon` (`assistant-provider.tsx`, 18px, one hard-coded size shared by 11 call sites)
  - the `Field` and `Select` components (`forms.tsx`)
  - the module overrides in `product-catalog`, `store-settings`, `assistant` and `assistant-history` CSS
- **Method:**
  - A computed-style probe ran on the local build in Thai, at 1440×900 and 390×844: 360 controls.
  - It measured height, padding, the icon-to-text gap, icon size, the vertical offset between icon and text centres, select width versus label width, and Thai wrapping.
  - It also ran browser flows for every back link.

### K2. Findings (measured)
- **Spacing between icon and text, by role:**

| Role | Where | Icon | Gap | Status |
|---|---|---|---|---|
| Action buttons (primary, secondary, ghost) | base rule, most screens | 20 | 10 | standard |
| | products filter and sort `.control` | 20 | **9** | outlier |
| | store `.secondary` (logout in store) | 20 | **8** | outlier |
| | assistant `headerTitleBtn` | 18, trailing | **8** | outlier |
| | assistant `historyHeaderButton` | 18 | **6** | outlier |
| Navigation items (sidebar, rail, logout) | `globals.css` sidebar rules | 20 | 12 | consistent |
| Compact chips | assistant context chips | 14 | 6 | consistent |
| Inline text links with a trailing chevron | overview "ดูที่มา", product sort headers | 16 / 14 | 4 | consistent. Sort headers sit 0.9px off the text centre. |
| Rows with a trailing chevron | assistant suggestions, product cards, store tiles | 16–20 | pinned to the row end | by design. On mobile the assistant suggestion chevron centres on the row, not the first text line. |

- **Icon sizes:** 12, 14, 16, 17, 18 and 20px are in use.
  - 18px: `ChatIcon`, and `.welcomeMark svg` via CSS.
  - 17px: `.avatar svg`.
  - 12px: `.contextChevron svg`.
- **Heights:**
  - All controls are at least 44px (F4 passes; no control was smaller).
  - Approved spec X4 sets buttons and chips to a **minimum** of 44 (`--control-height`) and inputs to 48. Default and secondary buttons render at **48px**, from `padding:11px` plus a 24px line height, which is allowed (X4 is a floor). Some same-role buttons are 44 or 45. Module overrides set `product-catalog .control` to `height:48px` and `store .secondary` to `padding:9px 16px`.
  - Font sizes for the same role vary between 12, 13, 14 and 16px.
- **Dropdown chevrons:**
  - All selects use the native chevron (no `appearance:none`), so the chevron sits at the field's right edge.
  - In wide selects the chevron is far from the label:
    - context-bar store select: 360px wide, chevron about 170px from the label
    - period select: 440px wide, about 360px
    - imports type select at 1440: 702px wide, about 615px
  - **Collision:** at 390 the playground select "ผู้ซื้อจ่ายค่าสินค้า + ส่วนลดแพลตฟอร์ม + …" is wider than its field, so the Thai label is clipped under the chevron (`shots/pg-select-390.png`).
- **Thai wrapping:** no button label collides with its icon at 390. Multi-line labels exist only in row or card buttons by design (orders list, imports list, suggestion chips, finance record cards).

### K3. Proposed shared rules (existing tokens, no new framework)
1. **One icon gap per role, set in shared CSS. No per-page overrides.**
   - Action buttons: `gap:10px` (the existing base rule). Remove the module overrides 9, 8, 8 and 6, so the base applies.
   - Nav items: 12px (unchanged).
   - Compact chips: 6px (unchanged).
   - Inline text links: 4px (unchanged).
   - Rows: chevron at the row end, vertically centred on the row (unchanged).
   - Codify these as size tokens in `tokens.css`: `--icon-gap-control:10px`, `--icon-gap-nav:12px`, `--icon-gap-chip:6px`, `--icon-gap-inline:4px`, `--icon-md:20px`, `--icon-sm:16px`. The existing rules then point at the tokens. Values stay as they render today; only the outliers change.
2. **Icon size by role.**
   - 20px in action buttons and navigation.
   - Assistant header buttons use 20px through a CSS override scoped to `.headerTitleBtn svg` and `.historyHeaderButton svg`, if D-R2-10 is approved. `ChatIcon`'s default stays 18px, so its other 9 call sites (row menu, copy, stop, calendar chip and so on) do not change.
   - 14–16px for inline chevrons and chips.
   - Icons are centred with `align-items:center`. Sort headers are fixed to the text centre (within ±0.5px).
3. **Button height and padding:**
   - Height is decision D-R2-11, a consistency choice; X4 is only a floor.
   - Option A: keep 48 for every action button. This is today's majority, and the 44/45 outliers rise to 48.
   - Option B: 44 everywhere (`padding:9px 20px`, which gives 9+9+24+2 = 44 at 16px).
   - The `product-catalog .control` and `store .secondary` height and padding follow the chosen option.
   - Ghost and back links keep `padding-left:0` (approved).
   - **The base button font size is not changed** (16px stays). Only same-role outliers at 12, 13 or 14px are aligned to their role's existing size.
4. **Selects:**
   - Keep the native chevron (no new asset, consistent across platforms).
   - Toolbar and context selects size to their content: `width:auto`, with a min and max from size tokens such as `min-width:12rem`, `max-width:22rem`. The chevron then sits next to the label.
   - Form selects keep the full field width. This is the standard form pattern, and the readable container (P2) caps the width.
   - Every select gets `padding-right` that reserves the chevron area, plus `text-overflow:ellipsis`, so a long Thai label never runs under the chevron. The full text stays in the option list.
   - Fix for the playground select at 390: the ellipsis rule above. If the option texts are too long to be useful, shorter labels are a copy change for the owner (D-R2-14).

### K4. Back-navigation inventory (verified in the browser, direct load + refresh + alternative arrival)
Two behaviours are kept distinct:
- **Explicit parent:** the shell header back link calls `navigate(parentScreen(screen))`. It never uses `history.back()` (approved: G7 inventory, "not history.back").
- **In-page "return to list":** local state or a detail route on the same screen.

| # | Where | Label | Destination today | Correct? | Proposal |
|---|---|---|---|---|---|
| N1 | header on `#imports`, `#rules`, `#line` | ← ข้อมูลร้าน | `#store` | Yes. Matches the IA, including after the R2 regroup. Works on direct load and refresh. | Keep. Arriving from the overview "นำเข้ารายงาน" action still goes to Store: that is the parent, not the previous page (by design). |
| N2 | header on `#orders`, `#reconciliation` | ← การเงิน | `#finance` | Yes | Keep. |
| N3 | header on `#playground`, `#addProduct`, `#simulation` | ← สินค้า | `#products` | Yes for playground and addProduct. **Simulation** opened from a product detail (`#products/<sku>`) returns to the list, so the product is lost. | D-R2-13 (see the details below). |
| N4 | `#orders/<key>` detail | **Two** links stacked: header "← การเงิน" and in-page "← ออเดอร์" | `#finance` and `#orders` | Each is correct, but two back links compete. | D-R2-12: hide the header parent link **only while the detail is actually rendered** (the in-page link exists only after the order loads, `orders.tsx:36,56`). During loading, after a failed fetch or for an unknown id, the header link stays, so a back link is always present. Keep the in-page "← ออเดอร์" (approved F2 focus return; no conflict with F2). Amends G7 `inventory.txt:13`. |
| N5 | `#products/<sku>` detail | ← สินค้า (in-page) | `#products` (list, focus to row) | Yes | Keep. |
| N6 | product cost form and listing form | **← กลับ** (generic) | product detail (local state) | Destination is correct, label is vague | Label "← {product name}" (data, no new copy key), or a new copy key "รายละเอียดสินค้า". |
| N7 | overview order evidence | **← กลับ** (generic) | overview (local state). Browser Back leaves overview entirely, because the view is not in the URL. | Label is vague. History behaviour is surprising. | D-R2-14: label "← ภาพรวม" (existing key `overview`). Keep it as local state; moving it to a `#orders/<key>` route would change the approved in-page evidence view. |
| N8 | imports job detail | ← นำเข้ารายงาน | imports list (local state) | Yes | Keep. |
| N9 | store hub tile → `#reconciliation` | header shows ← การเงิน | `#finance` | Parent is correct, but it is not where the user came from | Resolved by D-R2-4 (remove the tile). |
| N10 | public preview | ← หน้าแรก | landing | Yes | Keep (outside the app shell). |

- **D-R2-13 details (feasibility checked):**
  - `#simulation` has no detail route, and the SKU lives in page state (`selectedSku`, `login/page.tsx`), which the shell does not receive. Simulation also keeps its own `sku`, which the user can change.
  - Proposal: pass the simulation's **current** SKU (not `initialSku`) to the shell through a small prop or callback.
  - If that SKU is known, the back link targets `#products/<sku>` with the label "← {product name}".
  - On a direct load or refresh of `#simulation` the SKU is unknown, so the link falls back to "← สินค้า" → `#products`.
  - If the product name is not loaded, the label falls back to "← สินค้า" too.
  - Adding a `#simulation/<sku>` route is **not** proposed (it would add a detail route).
- All header links pass the `canLeave()` guard, through `navigate`.
- T3 (links underlined or chevron-marked) is met by the kept `←` glyph. Back links use `--color-action` (ghost button), not `--color-link`; unchanged.
- The `←` text glyph in labels is kept. It is approved and matches the copy.

### K5. Files (provisional)
| File | Change |
|---|---|
| `web/src/app/tokens.css` | Icon size and gap tokens (K3-1). Select min and max width tokens. |
| `web/src/app/globals.css` | Base button and select rules use the tokens. Select `padding-right` and ellipsis. Context-bar and toolbar select sizing. |
| `web/src/app/components/product-catalog.module.css`, `store-settings.module.css` | Remove the gap overrides (9 and 8). Sort header alignment. |
| `web/src/app/components/assistant.module.css`, `assistant-provider.tsx` (`ChatIcon`) | Gap overrides (8 and 6). Icon size if D-R2-10. Done by Agent C inside WP4, to avoid a file clash. |
| `web/src/app/components/shell.tsx` | Hide the header parent link on detail routes (N4, D-R2-12). |
| `web/src/lib/navigation.ts` or `routes.ts` | Pure `backTarget(route, context)` used by the shell, so the rules for N3 and N4 are unit-testable. |
| `web/src/app/screens/products.tsx`, `overview.tsx` | Back labels for N6 and N7. Simulation back for N3, if approved. |
| `tests/navigation.test.mjs`, `tests/routes.test.mjs` | Cover `backTarget` for every screen and detail route (labels equal the destination screen; no history dependence). Existing assertions are not weakened. |
| `tests/style-policy.test.mjs` (provisional) | Add a check that module CSS does not override `gap` on `button` with values outside the role tokens. Only if it can be written without false positives; otherwise rely on the probe. |
| `docs/redesign-handoff/qa-tools/` | Add the button and back probes used for this audit (from the scratchpad), adapted for Linux. |

### K6. Acceptance criteria (P5)
- **Spacing:** the probe reports every action button with icon gap 10±1, nav 12±1, chips 6±1, inline 4±1. Icon-to-text vertical offset ≤ 1px for single-line labels. 0 outliers outside the role table.
- **Sizes:** every control ≥ 44px. Within each role, one height and one font size, per D-R2-11.
- **Selects:** no select whose label is wider than its text box: rendered label width ≤ field width − padding − chevron area, or it ellipsises. Context and toolbar selects: distance from label to chevron ≤ 48px at 1440. Playground at 390 is not clipped under the chevron.
- **Back links:** for every row N1–N10, clicking the link lands on the stated destination after a direct load, after a refresh, and after arriving from a different route. Documented fallbacks count as a pass: N3 simulation falls back to `#products` when the SKU is unknown, and N4 shows the header link while a detail is not rendered. At least one back link is visible on every sub-screen and detail at all times. The label equals the destination's screen title, or the named object. No screen shows two back links. `backTarget` unit tests pass.
- Thai, Desktop 1440 and Mobile 390. No horizontal overflow. `npm run verify` passes.

### K7. QA additions
| # | Scenario | Desktop TH | Mobile TH |
|---|---|---|---|
| Q11 | Button and select probe (K6 spacing, sizes and selects) on all 13 screens | ✓ | ✓ |
| Q12 | Back-link flows N1–N10: direct load, refresh, alternative arrival, then browser Back after an explicit back (history stays coherent: one new entry, no loop) | ✓ | ✓ |
| Q13 | Visual check of icon alignment in header actions, assistant header and chips, product controls and the context bar (screenshots) | ✓ | ✓ |

Independent reviewer: Agent E (read-only), separate from implementer Agent F.

## Decisions requested from the owner

- **D-R2-1:** QA sizes. Desktop 1440×900 (plus 1920×1080 for the overview width check), Mobile 390×844?
- **D-R2-2:** `#receipts` silently falls back to overview (no code), or redirects to products?
- **D-R2-3:** The white sidebar replaces approved **D2** (cream `#F4F2EC`). Pure white `#FFFFFF` + 1px border (recommended), or near-white?
- **D-R2-4:** Remove the `reconciliation` tile from the store hub? (Recommended: yes. It belongs to การเงิน.)
- **D-R2-5:** Overview: KPI row across the full width, wide container 1600 centred, and the mobile order alert → KPIs → money → chart → orders → channels → launcher. This changes approved P4e-1.
- **D-R2-6:** Include WP5 action moves (Products Add, Rules +new, Reconciliation Export → header), or limit P2 to widths, headers and states?
- **D-R2-7:** Assistant history column from 1360 (recommended) or 1280? Keep the welcome-screen "recent chats" list?
- **D-R2-8:** Removing receipts is a frontend-only change. The backend `/receipts` API stays in place (owned by the other repository). Confirm.
- **D-R2-10:** Normalise the assistant header buttons' icons from 18 to 20px, to match action buttons? This is a scoped CSS override; the other `ChatIcon` uses stay 18px. (Recommended: yes.)
- **D-R2-11:** Button height consistency. X4 is a minimum of 44, so both options are compliant.
  - Option A: 48 everywhere. This is today's majority; only the 44/45 outliers change.
  - Option B: 44 everywhere. This is visible on almost every screen.
  - Recommended: **A**, because it changes the fewest correct components.
- **D-R2-12:** While an order detail is rendered, hide the header "← การเงิน" and keep only the in-page "← ออเดอร์"? The header link stays during loading and on errors. (Recommended: yes.)
- **D-R2-13:** Should simulation's back link return to the product it was simulating (`#products/<sku>`, with the current SKU) and fall back to "← สินค้า" after a refresh or direct load? This needs a new shell prop. (Recommended: yes. Alternative: keep "← สินค้า" → list everywhere, with no code change.)
- **D-R2-14:** Back labels: overview evidence "← กลับ" → "← ภาพรวม", and the product forms' "← กลับ" → "← {product name}". Also, is shortening the long playground select options acceptable if the ellipsis is not enough?
- **D-R2-9:** R2 contradicts these approved records. Confirm that R2 overrides them, and the lead will update the records in WP6:
  - HANDOFF Final QA: "copy.ts additions only". R2 removes the receipt-only keys and `navGroupData`.
  - G7 §2: assistant history nested under ถามผู้ช่วย in the sidebar.
  - G7 §4 and §4.5: header History button below 1024 only (R2 makes it below 1360 and adds a column), and the tab order.
  - G7 A5 and line 109: "Receipt reading stays on #receipts", and the optional "อ่านบิลซื้อ ›" link.
  - D2: cream sidebar.
  - P4e-1: the overview column structure.

## Revision log
- **R1 (Agent 6 QA review):**
  - B1: added `routes.test.mjs` and the qa-tools lists.
  - B2: added D-R2-9.
  - B3: §D breakpoint mechanism.
  - B4: `forms.tsx` is lead-owned in WP2.
  - B5: §D focus spec and Q5/Q6.
  - Non-blocking fixes: P0 grep criterion, border token and active-vs-hover check, chart width statement, matchMedia, Delete key, the §9 reference, assistant shell CSS, `validateFile`, the 1359/1360 check.
- **R2 (owner request P5):**
  - Added §K / WP7 (button, icon and select audit with measurements; back-navigation inventory N1–N10).
  - Agent F as implementer, Agent E as independent reviewer.
  - Added Q11–Q13 and D-R2-10 to D-R2-14.
  - Conflicts with approved records: G7 `inventory.txt:13` "Sub-screen header: ← parent" is amended by D-R2-12. F2 in-page back is kept. G7 "← parent, not history.back" is kept. X4 is not in conflict (it is a minimum).
- **R3 (independent review of §K):**
  - D-R2-12 now hides the header link only when the detail is rendered.
  - D-R2-13 now has a data flow and fallbacks.
  - D-R2-10 is a scoped override.
  - D-R2-11 is reworded as a consistency choice.
  - The base button font is unchanged.
  - Icon-size inventory corrected.
  - `.control` and `.secondary` height and padding included.

## Owner decisions (2026-10-25)
- **D-R2-1:** viewport scope approved: Desktop 1440×900 (plus 1920×1080 for the overview width check, and 1359/1360 for the assistant column switch), Mobile 390×844, Thai only.
- **D-R2-2:** `#receipts` falls back to overview through the existing `parseHash` rule. No alias.
- **D-R2-3:** white sidebar `#FFFFFF` with a right border. Supersedes D2 (cream).
- **D-R2-4:** remove the "ตรวจยอดรับสินค้า" tile from the store hub. Reconciliation stays under การเงิน (sidebar sub, finance record card).
- **D-R2-5:** new overview layout and mobile order approved. Supersedes the P4e-1 column structure.
- **D-R2-6:** primary actions move to the page header where that fits the page's context (products Add, rules New, reconciliation Export).
- **D-R2-7:** history column from 1360. The welcome-screen recent-chats list stays where it is not redundant. Lead interpretation: the list is hidden at 1360 and wider, where the history column already shows the same chats; it stays below 1360.
- **D-R2-8:** frontend page and navigation removed only. The backend `/receipts` API stays.
- **D-R2-9:** R2 supersedes only the records it directly contradicts (HANDOFF "copy.ts additions only" for the removed receipt keys and `navGroupData`; G7 §2, §4/§4.5 and A5; D2; P4e-1; G7 `inventory.txt:13` via D-R2-12). Reasons are recorded here and cross-referenced in HANDOFF.md in WP6.
- **D-R2-10:** 20px icons for the two assistant header buttons only (`.headerTitleBtn`, `.historyHeaderButton`).
- **D-R2-11:** 48px is the standard height for buttons with text. Icon-only controls are not resized unless needed. Touch targets stay ≥ 44px.
- **D-R2-12:** hide the header "← การเงิน" once an order detail renders successfully. It stays during loading and on errors, so there is always a clear way back.
- **D-R2-13:** simulation returns to the product it was actually opened for (current SKU) when that context exists. Otherwise it falls back to the products list.
- **D-R2-14:** overview evidence uses "← ภาพรวม". Product forms use the product name when it is available. Select options are shortened only when necessary, keeping their meaning.

## Implementation result (2026-10-25, working tree on HEAD c78ca33, not committed)
- WP1–WP7 implemented. Lead: WP1, WP2, shared files and back-link wiring. Agents: B overview, C assistant, D page actions, F buttons/icons/selects. E did independent QA plus a re-check after fixes.
- `npm run verify` PASS on the final tree: 204/204 tests, build, package-deploy. Empty diff for `format.ts`, `domain.generated.*`, `tests/frontend.test.mjs`, `assistant-sessions.ts`, `use-chat-sessions.ts`, `assistant-service.ts`.
- QA (Thai; 1440×900, 1920×1080, 1359/1360, 390×844): Q1–Q13 pass after the fix rounds. Evidence is in the session scratchpad (`qaE/`, `r2/`) and is not committed.
- The final three re-check items (period select label-to-chevron, imports focus return, resize focus) were verified by the lead, not by Agent E.
- Deviations, recorded here:
  - The imports job detail also hides the header link, so no screen shows two back links (§K6).
  - Role exceptions to the 48px text-button height: ghost "view all" links are inline links (45px), segmented controls are their own role (44/45px), and `.headerTitleBtn` is the editable chat title (44px).
  - The `receipt` allow-list also contains `ledger.tsx`'s "Review receipt" status label (unchanged file).
- Not run: EN, tablet, R07 drawer (out of scope); chart-label probe; loading/error states on screens other than overview; R11/R12; R47 at 390 (the language switch there sits inside the store form guard); manual IME and screen readers.
- Also fixed: the QA mock (`qa-tools/serve.mjs`) now returns `decision.route`, as `assistant-service.ts` requires.
