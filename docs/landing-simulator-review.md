# Landing redesign verification — 22 October 2026

Scope: public landing only. Reference: user-supplied Untitled.png. The screenshot supplies composition, not copy, claims, brand artwork or financial rules. This is a close layout adaptation with the requested emerald/sage identity, Thai copy, added pricing/FAQ and omitted testimonial, not a pixel-identical copy.

## Changed files
- web/src/app/welcome/landing.tsx: requested sections, original bilingual copy, supplied logo paths, conditional unpublished testimonial.
- web/src/app/welcome/landing.module.css: page-scoped styling, responsive layout, focus and reduced-motion rules.
- web/src/app/welcome/discount-simulator.tsx: editable inputs, inline errors, live results, sticky mobile summary.
- web/src/lib/landing-example.ts: input validation and MOCK adapter to the existing generated engine. No changes to generated financial formulas.
- web/public/assets/images/line.png: byte-identical copy of supplied public/assets/images/line.png (SHA-256 01AD3725AB5FC04523191BD53F0DFF905BFC408EC9577D618A50505A735195BA).
- tests/landing-example.test.mjs: financial boundary, validation, zero/full-discount checks.
- This report.

Pre-existing working-tree changes were present before this task. No backend, global design tokens, workspace screens, cloud deployment, commit or push performed.

## Acceptance results
| Requirement | Result | Evidence |
|---|---|---|
| Nav, centered pill/two-tone Thai hero, CTAs, floating alert | PASS | Desktop/mobile screenshots; reference composition adapted to approved palette |
| Channel strip and supplied official asset files | PASS | Shopee, Lazada, TikTok, LINE; no missing images at 12 language/width combinations; template-only clarification |
| Functional light/dark simulator | PASS | Browser input changes update results; shared canonical engine |
| Defaults and reconciled amounts | PASS | 200/120/30/15%/15% gives 170.00 revenue, 25.50 fee, -5.50 profit, 176.47 safe price |
| Safe-price boundary | PASS | At176.46 profit=-0.01; at176.47 profit=0.00 |
| Validation and empty/error/success states | PASS | Blank price and fee100 clear result; inline descriptions/aria-invalid; valid corrections restore result; profit/loss/break-even labels |
| Loading treatment | PASS | Calculation is synchronous and initial example is prerendered; no asynchronous loading spinner required |
| Three existing features only | PASS | Discount simulation, template CSV/Excel imports and Thai assistant; no native integration or fee-audit promises |
| Testimonial hidden without real quote | PASS | Placeholder template exists; zero rendered blockquotes |
| Pricing [TBD], FAQ, closing CTA, footer | PASS | Rendered; native FAQ opens/closes via Enter; all local anchors resolve |
| Thai first and English toggle | PASS | document.lang changes; both language layouts tested |
| 320/390/768/1024/1440 plus1920 | PASS | Both languages, no document overflow; also tested amounts of1million at320 |
| Mobile stacking and persistent result | PASS | Sticky summary top0/bottom60.3 while discount input top421.8/bottom470.8 at390x844 |
| 44px targets | PASS | Final production DOM audit: no visible target below44px in either dimension at12 combinations |
| Contrast | PASS (checked palette pairs) | Muted on white6.14:1/on sage5.62:1; green on pale5.58:1; input border on white3.64:1/on sage3.33:1; dark panel text10.97:1, badge7.92:1 |
| Keyboard and accessible status | PASS (browser checks) | Visible focus; named inputs; polite atomic live result; slider arrow15->15.5% gives-6.35; Escape closes menu and restores summary focus |
| Reduced-motion fallback | PASS (CSS branch) | Forced reduced-motion stylesheet fixture: animation none, no overflow at6 widths; only opacity/transform entrance motion |
| Script-free rendering | PASS | Script-stripped static export retains default result; no overflow at6 widths |
| Build and regression checks | PASS | npm run verify:53/53 tests, TypeScript, SHA integrity, secret-pattern check, static export and packaging |

## Evidence and limits
Local browser evidence: tmp/landing-simulator-review/{desktop.png,mobile.png,mobile-simulator.png,responsive.json,interactions.json,fallbacks.json}. Full-page screenshot capture was unavailable; individual viewport screenshots were captured. Browser console returned no warnings/errors. Reduced-motion testing forced the CSS branch in an isolated fixture; it did not emulate an actual OS preference. Script-stripped fixtures verify static rendering, not a physical phone with scripting disabled. Hardware phones, software keyboards, actual screen-reader announcements and exhaustive WCAG certification were not verified.

No quote supplied, so the testimonial is intentionally hidden. Pricing/contact/policies remain [TBD]. No claims of security certification, ratings, user counts, partners, native marketplace import support or deployment are made.

Local setup: npm ci initially hit a locked Next SWC file. Stopped only this frontend's identified Next processes, restored lockfile dependencies with npm ci successfully, and restarted the existing development server at localhost:4050. A separate static preview runs at localhost:4173. Package and lockfile unchanged. Test-only fallback fixtures were created in generated web/out after deployment packaging; they are not included in artifacts/deploy.
