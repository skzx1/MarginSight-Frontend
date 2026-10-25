---
name: MarginShot — Landing
description: Reference-led marketing surface with centered copy, channel orbits and readable financial examples.
colors:
  emerald: "#187b62"
  deep: "#152d26"
  canvas: "#fcfcf9"
  surface: "#ffffff"
  ink: "#24392f"
  muted: "#56685e"
  border: "#dfe6df"
  soft-sage: "#f0f5ef"
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
    backgroundColor: "{colors.deep}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
  panel-dark:
    backgroundColor: "{colors.deep}"
    textColor: "#f8fcf9"
    rounded: "{rounded.stage}"
    padding: "44px"
---

# Design System: MarginShot Landing

## Overview

**Creative North Star: “เห็นตัวเลขชัดในพื้นที่ที่สงบ”**

This document applies **only to the public landing route `/`**. It records the reference composition the user selected on 21 October 2026. It does not replace the workspace's earth palette or shared application styles. `web/src/app/globals.css` and `earth-theme.css` remain authoritative inside the app.

Use a light field, centered Thai-first headlines, ample space, a restrained emerald orbit and dark financial/assistant panels. The supplied reference sets composition; the existing MarginShot fonts, channel artwork and verified product limitations supply the identity and content. The image is a low-resolution layout reference, not a readable copy specification.

## Colors

Emerald provides a quiet accent; deep green anchors actions and information panels. Warm white and sage separate sections. Brand colors remain inside the supplied logos, with low-opacity hover accents underneath their artwork.

Use `ink` and `muted` on light surfaces. Dark panels use light text (`#f8fcf9`, `#c6d8cc`) rather than inheriting light-surface muted text. Loss values retain the shared loss semantic color.

## Typography

IBM Plex Sans sets Latin text, figures, the minus sign and the baht sign (equal-width digits); Noto Sans Thai sets Thai letters, marks and Thai digits through a Thai-only unicode-range. Both are self-hosted unmodified TTF files in 400/500/600 with their OFL texts (web/public/fonts), shared with the app through --font-sans, --font-numeric and --font-display. Headings use --font-display, which is the same sans until a Thai serif passes its source and licence review. Thai text keeps letter-spacing 0 and a line height of at least 1.5; tighter tracking or line height is kept only for amounts, counts, codes and Latin-only labels (any Thai state of those elements resets both), and English-only display lines may set a tighter line height. Keep synthetic amounts tabular and readable. Headlines use explicit two-part phrasing without gradient text. At phone widths, display copy is 30–44px; body remains 16px. No rendered text, including preview labels, is smaller than 12px.

## Layout

Main content is at most 1120px with 32px desktop side margins and 20px phone margins. The header reaches 1280px. Desktop sections use 88px vertical padding; phones use 56px. The composition is centered hero → channel strip → light/dark shop example → three workflow cards → dark assistant panel → plans/FAQ → closing action → footer.

Use native document scrolling. The five story beats are a short readable sequence, not a pinned scroll trap. Example and assistant splits become one column on phones. Below 1190px, native details contains section navigation. The trial CTA remains visible; phones move language/sign-in into the menu. All interactive targets are at least 44px.

## Elevation & Depth

Most surfaces use flat tonal layering and fine borders. The hero result preview carries the single subtle ambient shadow (`0 14px 40px #173b2810`); no animated shadow or blur. The soft radial emerald field belongs to the orbit, as requested by the user.

## Shapes

Actions are rounded pills; data cards and panels have modest rounded corners. Orbit rings are thin ellipses on wide screens and circles on compact screens. Brand images retain their original aspect ratios and backgrounds.

## Components

### Navigation and actions

Reuse Brand and LanguageSwitch. Primary links lead to `/login/`. Secondary text links point to real section anchors. Focus uses a visible emerald outline. No unsupported action is styled as a functioning product control.

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

The latest written brief supersedes earlier orbit composition notes. Hero text uses the exact requested two-part headline and solid emerald emphasis. A file-based capability badge replaces ratings/certifications. The static illustration contrasts normal profit20 with discounted loss5.50, safe illustrated price176.47, explicit assumed15% fees and satang rounding. The approximate11.8% threshold is not an actual platform rule.

Desktop: 48-second orbit in fading side lanes around a fixed content column; natural stage height protects longer English. Phone: full-width stacked actions, card, then a 288–340px circular orbit. A stationary outlined channel name accompanies keyboard focus. Default no-JS and reduced-motion arrangements remain static.

Logo provenance is now restricted to public/brands. Until official files arrive, every channel uses a neutral named placeholder. Preserve assets/images files but do not silently substitute them. In-store uses a generic icon. No filters/recoloring of real logos.

Additional local semantics: warning ink #795008 on #fff5df; input/figure labels12–14px, body16px minimum on mobile, money26–30px. Local shape ramp includes6/8/10px marks,12/16px cards,24/26px controls and50% orbit circles. Section rhythm is64px desktop,48px mobile. These are landing-only values.