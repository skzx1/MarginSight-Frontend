---
name: MarginShot — Landing
description: Reference-led marketing surface with centered copy, channel orbits and readable financial examples.
colors:
  # Mirrors web/src/app/tokens.css (the only source of colour values); names are the semantic tokens.
  canvas: "#faf9f5"        # --color-bg-canvas (cream-50); also viewport themeColor
  surface: "#ffffff"       # --color-bg-surface
  subtle: "#f0eee6"        # --color-bg-subtle
  border: "#e6e2d8"        # --color-border
  border-strong: "#8c877d" # --color-border-strong
  ink: "#141413"           # --color-text
  muted: "#66625a"         # --color-text-muted
  action: "#b04f2c"        # --color-action / --color-focus (terracotta-600)
  action-hover: "#933f22"  # --color-action-hover
  link: "#a2482a"          # --color-link
  indicator: "#c8643f"     # --color-indicator
  brand-bright: "#d97757"  # --color-brand-bright (decoration only, never text)
  dark: "#1f1e1c"          # --color-bg-dark (warm ink surface)
  on-dark: "#faf9f5"       # --color-text-inverse
  profit: "#17735c"        # --color-positive / --chart-profit (D1 gain green)
  profit-fg: "#145f4c"     # --color-positive-fg on --color-positive-bg #e3f1ec
  loss: "#8e1238"          # --color-negative on --color-negative-bg #f7e3e8
  warning: "#735c00"       # --color-warning on --color-warning-bg #f5edcf
  info: "#2f5784"          # --color-info on --color-info-bg #e5ecf4
typography:
  display:
    fontFamily: "IBM Plex Sans, Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif"
    fontSize: "clamp(42px, 4.8vw, 72px)"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0"
  headline:
    fontFamily: "IBM Plex Sans, Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif"
    fontSize: "clamp(30px, 3.2vw, 44px)"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0"
  body:
    fontFamily: "IBM Plex Sans, Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.75
  money:
    fontFamily: "IBM Plex Sans, Noto Sans Thai, Leelawadee UI, Tahoma, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.02em"
rounded:
  control: "26px"
  card: "12px"
  stage: "16px"
spacing:
  small: "12px"
  medium: "24px"
  large: "40px"
  section: "88px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
  panel-dark:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.stage}"
    padding: "44px"
---

# Design System: MarginShot Landing

## Overview

**Creative North Star: “เห็นตัวเลขชัดในพื้นที่ที่สงบ”**

This document applies **only to the public landing route `/`**. It records the reference composition the user selected on 21 October 2026. It does not replace the shared application styles: `web/src/app/tokens.css` (all colour values) and `web/src/app/globals.css` remain authoritative, and the landing uses the same tokens.

Use a warm cream field, centered Thai-first headlines, ample space, a restrained terracotta accent and warm-ink dark financial/assistant panels. The supplied reference sets composition; the existing MarginShot fonts, channel artwork and verified product limitations supply the identity and content. The image is a low-resolution layout reference, not a readable copy specification.

## Colors

The palette is warm cream, ink and terracotta. Every value lives in `web/src/app/tokens.css` as a primitive (`--cream-50`, `--ink-900`, `--terracotta-600`, ...) referenced by a semantic token (`--color-bg-canvas`, `--color-text`, `--color-action`, ...). Components, the landing and the hero use semantic tokens only; `tests/style-policy.test.mjs` rejects colour literals anywhere else (the one exception is `viewport.themeColor` in `layout.tsx`, which must equal `--color-bg-canvas`; `tests/brand-assets.test.mjs` checks it). Contrast pairs are asserted in `tests/tokens.test.mjs`.

- **Surfaces.** Canvas `#faf9f5` behind everything, white surface cards with a `#e6e2d8` hairline, subtle `#f0eee6` for tracks and quiet fills, sidebar white `#ffffff` with a `#e6e2d8` right hairline (R2 D-R2-3, 25 October 2026; replaced the earlier cream `#f4f2ec`). Dark scenes (landing header and hero, result panels) use warm ink `#1f1e1c` with `--color-text-inverse` / `--color-text-inverse-muted` text and the `*-on-dark` variants of focus, positive, negative and warning.
- **Text.** Ink `#141413` and muted `#66625a` on light surfaces; never inherit light-surface muted text on a dark panel.
- **Terracotta = action, never meaning.** `--color-action` `#b04f2c` (hover `#933f22`) fills the one primary button per region (criterion L1); `--color-link`, `--color-indicator`, `--color-focus` (3px outline) and `--color-brand-bright` (decoration only, never text) complete the family. **L2 rule:** the terracotta family (action, action-hover, link, indicator, brand-bright, focus, chart-highlight, and the retired `--color-accent` alias) never colours a financial number, a status badge, a delta or a chart data fill. `tests/semantic-colour.test.mjs` pins the financial and status selectors.
- **Gain and loss.** Profit/gain green is `#17735c` (`--color-positive`, `--chart-profit`; text on its tint uses `--color-positive-fg` `#145f4c`). Loss is burgundy `#8e1238` (`--color-negative`). Colour is never the only signal: amounts carry a label and the true minus sign U+2212 ("ขาดทุน −฿53.00"), and status notices carry an icon and a bold title. Financial numbers use only ink, loss, profit green for gains, and muted for "—" (criterion L3).
- **Status.** Warning mustard `#735c00` on `#f5edcf`, info navy `#2f5784` on `#e5ecf4` (text/status only, never a chart series), success = positive on its tint.
- **Chart roles.** Measures and channels are separate palettes and never share a chart. Measures: revenue `--chart-revenue` (ink-800), cost `--chart-cost` (stone-500), profit `--chart-profit` (green), loss `--chart-loss` (burgundy-600, drawn below the zero line). Channels are assigned by platform name (`web/src/lib/chart-roles.ts`), never by index: Shopee, Lazada, TikTok, LINE, in-store, other (`--chart-ch-*`). Lines also differ by dash and marker, the selected point is a 3px terracotta ring (`--chart-highlight`), never a fill, and every chart has a text alternative.
- **Channel artwork.** Brand colours remain inside the supplied channel logos; do not recolour them.

### Logo usage

- The app icon is `web/public/branding/marginshot-icon.svg` (near-black tile, cream M, orange rising line). It is the only logo the web uses: `Brand` in `ui.tsx` (sidebar, top bar, login, landing header/footer, error pages) and the hero core. `web/public/favicon.svg` is a byte-identical copy (checked by `tests/brand-assets.test.mjs`).
- Use the icon at 16px or larger. At 16px (favicon) the silhouette and the orange line read but the M breaks up; use 32px or more wherever the letter must be legible. The default in-app size is 40px (32px in the landing header).
- On light surfaces (canvas, surface, the light sidebar) the dark tile carries the mark (about 16:1). On dark surfaces (`--color-bg-dark`) the tile edge disappears and the cream and orange glyph carry the mark; do not add a coloured backing plate behind it.
- Do not swap in `marginshot-icon-light.svg`: it scores about 2.75:1 against the sidebar and was dropped. The transparent mark/logo/wordmark files (`marginshot-mark.svg`, `marginshot-logo*.svg`) are for light backgrounds only; their black stroke is invisible on dark. They are not used by the web; the horizontal logo is the source of the Cognito hosted-UI logo (`web/branding/`, AWS-owned).
- Logo art keeps its own colours (its orange gradient is not a token and must not be used for UI). Never recolour, filter, stretch or re-letter it.

## Typography

IBM Plex Sans sets Latin text, figures, the minus sign and the baht sign (equal-width digits); Noto Sans Thai sets Thai letters, marks and Thai digits through a Thai-only unicode-range. Both are self-hosted unmodified TTF files in 400/500/600 with their OFL texts (web/public/fonts), shared with the app through --font-sans, --font-numeric and --font-display. Headings use --font-display, which is the same sans until a Thai serif passes its source and licence review. Thai text keeps letter-spacing 0 and a line height of at least 1.5; tighter tracking or line height is kept only for amounts, counts, codes and Latin-only labels (any Thai state of those elements resets both), and English-only display lines may set a tighter line height. Keep synthetic amounts tabular and readable. Headlines use explicit two-part phrasing without gradient text. At phone widths, display copy is 30–44px; body remains 16px. No rendered text, including preview labels, is smaller than 12px.

## Layout

Main content is at most 1120px with 32px desktop side margins and 20px phone margins. The header reaches 1280px. Desktop sections use 88px vertical padding; phones use 56px. The composition is centered hero → channel strip → light/dark shop example → three workflow cards → dark assistant panel → plans/FAQ → closing action → footer.

Use native document scrolling. The five story beats are a short readable sequence, not a pinned scroll trap. Example and assistant splits become one column on phones. Below 1190px, native details contains section navigation. The trial CTA remains visible; phones move language/sign-in into the menu. All interactive targets are at least 44px.

## Elevation & Depth

Most surfaces use flat tonal layering and fine borders. Floating layers use the single `--shadow-lg`; cards are flat. The soft radial field behind the hero uses `color-mix()` of a token, never a literal.

## Shapes

Actions are rounded pills; data cards and panels have modest rounded corners. Orbit rings are thin ellipses on wide screens and circles on compact screens. Brand images retain their original aspect ratios and backgrounds.

## Components

### Navigation and actions

Reuse Brand and LanguageSwitch. Primary links lead to `/login/`. Secondary text links point to real section anchors. Focus uses a visible 3px terracotta outline (`--color-focus`, `--color-focus-on-dark` on dark scenes). No unsupported action is styled as a functioning product control.

### Channel orbit

One CSS rotation lasts 48 seconds; a synchronized inverse rotation and inverse vertical scaling keep logos upright and undistorted on elliptical paths. Pause on hover, keyboard focus, tap selection, the persistent pause control, document hiding and viewport exit. Reserve geometry before scripts load. Reduced motion and no scripts leave a static arrangement.

The result card stays in a fixed central zone. Phones show the MarginShot mark at the center and move the result card below the orbit. Names remain in a static readable line. At tablet/intermediate widths, make the orbit taller to maintain clearance rather than shrinking the result text. Keep focus outlines inside the orbit's safe paint area.

### Evidence panels

The hero uses the user-supplied fixed 200/120/30/15% example; it is not a financial engine. The story and shop breakdown reuse the existing synthetic shop fixture. Product profits sum to the displayed zero, and the deduction panel uses the matching existing amounts. Label examples visibly. The assistant illustration is marked as a conversation example, not a live response. Pricing, contact and policy details remain TBD where not confirmed.

## Do's and Don'ts

- **Do** preserve the user's supplied logos byte-for-byte and show a neutral named placeholder when the appropriate logo is missing.
- **Do** say “รองรับการนำเข้าข้อมูลจาก” and retain the file-template limitation and trademark note.
- **Do** reflow Thai/English and maintain keyboard, reduced-motion and no-script paths.
- **Don't** invent customers, endorsements, conversion figures, native marketplace integrations, prices or testimonials.
- **Don't** apply these landing-only tokens to in-app channel badges or financial formulas.

## Discount-first reference revision (21 October 2026)

The latest written brief supersedes earlier orbit composition notes. Hero text uses the exact requested two-part headline with a solid emphasis colour from tokens (`--color-emphasis-on-dark` on the dark hero). A file-based capability badge replaces ratings/certifications. The static illustration contrasts normal profit20 with discounted loss5.50, safe illustrated price176.47, explicit assumed15% fees and satang rounding. The approximate11.8% threshold is not an actual platform rule.

Desktop: 48-second orbit in fading side lanes around a fixed content column; natural stage height protects longer English. Phone: full-width stacked actions, card, then a 288–340px circular orbit. A stationary outlined channel name accompanies keyboard focus. Default no-JS and reduced-motion arrangements remain static.

Logo provenance is now restricted to public/brands. Until official files arrive, every channel uses a neutral named placeholder. Preserve assets/images files but do not silently substitute them. In-store uses a generic icon. No filters/recoloring of real logos.

Additional local semantics: warning uses `--color-warning` on `--color-warning-bg`; input/figure labels12–14px, body16px minimum on mobile, money26–30px. Local shape ramp includes6/8/10px marks,12/16px cards,24/26px controls and50% orbit circles. Section rhythm is64px desktop,48px mobile. These are landing-only values.