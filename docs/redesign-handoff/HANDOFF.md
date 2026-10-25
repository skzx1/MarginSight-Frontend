# MarginShot redesign — handoff to a Claude Code cloud session

Paste the "Prompt" section into the new session. Everything it refers to is in this folder (`docs/redesign-handoff/`) on branch `feat/marginsight-redesign`.

## State at handoff (2026-10-25)

- Branch `feat/marginsight-redesign`. Earlier local commits: b382a6c P0t, 2f23a7c P1a, 725a2b2 P1b, c9b43a3 merge of origin/main 5bc3b9d. The handoff commit on top holds all P2, P3 and part of P4 work plus this folder.
- Verified before handoff: tsc clean; `node --test tests/*.test.mjs` 148/148; full `npm run verify` (incl. next build) run on the handoff commit — see the commit message.
- Nothing was merged into main, deployed, or changed in AWS/Cognito.

### Done (implemented; reviewed where stated)
| Phase | Status |
|---|---|
| P2a/P2b/P2c fonts + typography | done, verified (verify 100/100 at the time), reviewed |
| P3a signed-money helper (`web/src/lib/signed-money.ts`) + copy keys | done, independent code review: no blocker |
| P3b-1/2 on-screen + text outputs (System R: label + U+2212) | done, reviewed, browser QA (semantic probe, R22 clipboard PASS) |
| P3b-3 neutral SVG delta (`components/delta.tsx`) | done, reviewed |
| P3c badges/notices (icons on colour-only notices), L2 14 selectors | done; `tests/semantic-colour.test.mjs`; QA found landing `.alertEyebrow/.alertIcon` on terracotta → fixed to warning tokens; **re-run the computed semantic probe in final QA before calling L2 closed** |
| P3d radii 9/12/16/20, flat cards, control 44 / input 48, focus 3px | done, reviewed, QA PASS |
| P4a light sidebar 232 + indicator | done. Logo swap to `marginshot-icon-light.svg` DROPPED (upstream replaced that asset; it scores 2.75:1 vs 16.17:1 for the current icon — see research/P5-audit.txt) |
| P4b nav groups, account block, parentScreen (orders/reconciliation → finance), `lib/navigation.ts` + tests | done, NOT yet browser-verified |
| P4c top bar + shared header (`ScreenActions` portal in shell.tsx), finance header moved | done, NOT browser-verified |
| P4d tablet rail 72 + overlay drawer; bug N3 (drawer closes on nav/scrim/Escape) | done, NOT browser-verified |
| P4h-1..4 assistant (DA2+DC look, A11 focus-after-ask, A12 100-chat notice, A4 chips fill, A1 IME, A2/D4 touch Enter newline + send button, A3 greeting, A7 recent) | done with tests (`composer-keys`, `greeting`, `assistant-arrival`), NOT browser-verified |

### Remaining (in plan order — `research/G5/plan.txt` §3, REVISION 3 (c)/(d))
1. **P4e-1** overview: 4 KPIs, header actions (L1), always-open money/channel cards, ChannelPanel split, light profit card, right column ≥1280; **D10** alert before profit on mobile.
2. **P4e-2** K1 "ดูที่มา / See breakdown" KPI → finance (copy key `seeSource`). K2 is NOT approved.
3. **P4-G1** launcher card on overview linking to the existing assistant only (no panel, no provider refactor).
4. **Chart labels** (open F1 issue): SVG text in `overview-charts.tsx` / `finance-chart.tsx` renders < 12px at 320–1440 because the viewBox scales; must render ≥ 12px at 320–1920 without overlap; negative y-axis ticks print ASCII "-410" → must be U+2212.
5. **P3 review follow-ups not yet applied**: labels above values that can be losses use `netProfitLoss` instead of `profitCard`/"กำไรสุทธิ" (overview.tsx, overview-charts.tsx, finance.tsx KPI/channel table/orders column); margin LEVELS use `percent()` not `signedPercent()` (finance.tsx, finance-chart.tsx, add-product.tsx); `.composer-form` in globals.css still uses `--radius-lg` (assistant module composer already uses `--radius-composer`).
6. **P4f** products list/detail + focus management (detail h2 focus, back returns focus to the row). Status badges = P4-G2 BLOCKED (no domain field).
7. **P4g** finance sticky section nav + orders/reconciliation cards; fix: jump links clip the focus ring at 1440 and 3 links are < 44px wide.
8. **P4-G3** deep links `#products/<sku>`, `#orders/<id>` (D5 approved): design + pure parse/format module + tests first; refresh, back/forward, invalid id → list + notice; plain `#<screen>` stays working; canLeave and the A11 focus intent still work.
9. **P4i** remaining screens header sweep (imports, receipts, rules, store + store-settings sticky dock, add-product, playground, LINE); fix playground double error notice (~l.217); confirm the language switch is reachable on mobile via Store (finance lost its own switch in P4c).
10. **P5 (a)** only (no new decision): remove dead `.logo` background in `welcome/landing.module.css`; update DESIGN.md colour section + logo-usage rules; add `tests/brand-assets.test.mjs` (favicon = icon, themeColor = canvas token, referenced assets exist). P5 (b)/(c) need the owner (see research/P5-audit.txt).
11. **Final QA** (plan §2 V0–V6): `npm run verify`; empty diffs for `web/src/lib/format.ts`, `tests/frontend.test.mjs`, `web/src/lib/domain.generated.*`; copy.ts additions only; TH+EN at 320, 390, 640, 768, 900, 1024, 1280, 1440, 1920 (overflow, console errors); F1/F2/F3, contrast from computed styles, targets ≥ 44, focus 3px not clipped; CVD (protan/deutan/tritan/achromat) on overview/finance/products; reduced motion; R01–R47 (`research/G7/regression-checklist.txt`) + logout, store switch with an active guard, onboarding; deep-link cases; computed semantic probe (L2); manual IME (Thai Gboard/iOS) and screen-reader checks — mark anything not actually run as unverified.
12. **Final regression review** of the full diff vs `c9b43a3`, then a consolidated Thai report.

### Open decisions / tracked risks (do not close silently)
- NOT approved: K2 channel preselect, F1 unsaved guards (P4-G4), P4-G2 status badges (blocked), P5 (b)/(c), any Cognito/AWS change.
- D12: Anuphan/Inter @font-face + files still shipped but unused (removal open). C8: Cognito hosted UI cannot match the web fonts (classic UI has no font-family; only Managed Login could).
- Noto Serif Thai headings deferred (C3); Plex conversion/subsetting on hold (C6, legal).
- Assistant: DA2 month summary / DC data-source line not built (would need overview data passed from `login/page.tsx` — owner decision); DC mark change in `ui.tsx` not done; suggestions/recent precede the composer in tab order.
- Known risks: deuteranopia Shopee/LINE similarity; expense meter 3.08:1; 768px landing hero tile overlaps lead text; production AWS runs upstream 2bc06b9 theme values.
- The owner floated Tailwind; recommendation given: not in this redesign (token/test architecture is CSS-module based); revisit later.

## Prompt

```
Continue the MarginShot (MarginSight frontend) redesign on branch feat/marginsight-redesign. Communicate results in Thai.
Read first: AGENT.md, AGENTS.md, docs/redesign-handoff/HANDOFF.md (state + remaining list), docs/redesign-handoff/research/G5/plan.txt (master plan; REVISION 1-3 override older text), docs/redesign-handoff/research/G4/criteria.txt (acceptance criteria), docs/redesign-handoff/agent-rules.txt (rules for implementation agents; paths in it and in the plan that point to local Windows temp folders map to docs/redesign-handoff/).
Goal: finish items 1-12 of "Remaining" in HANDOFF.md until the redesign is implementation-complete, independently reviewed and verified. Use subagents with non-overlapping file ownership (overview+charts / products+finance+deep links / remaining screens / QA-a11y / regression reviewer); the lead integrates shared files and runs npm run verify (agents must not run builds concurrently).
Follow the approved decisions recorded in the plan (D1 green #17735C, D2 light sidebar, D3 DA2+DC, D4, D5 deep links, D7, D8 9px buttons, D10, D11 K1 only, System R, G1 launcher only). Do not invent new design direction; do not adopt Tailwind. Do not change money() (web/src/lib/format.ts), tests/frontend.test.mjs, domain.generated.*, financial formulas, auth, or Cognito/AWS. Do not weaken tests. Keep the L2 production blocker tracked until the computed semantic probe passes in the final build.
QA tools in docs/redesign-handoff/qa-tools/ were written for Windows (Chrome path, C:/ repo path): adapt them to this environment (headless Chrome/Chromium via CDP) before use; serve.mjs serves a build (web/out) + a mock API.
Boundaries: work only on this branch; commit locally in reviewable steps; do not push, open a PR, merge into main, or deploy unless the owner explicitly says so. Final output: one consolidated Thai report (status per phase, agents used and review findings, files changed, verification actually run, skipped checks, risks/blockers/open decisions, branch/HEAD/diff summary, and the distinction between implementation-complete, ready-for-release and deployed). Then stop and wait for owner review.
```
