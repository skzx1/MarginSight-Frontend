import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readRootProperties, resolve, stripComments } from './lib/css.mjs';

// Colours live in web/src/app/tokens.css only. Every other stylesheet and component uses var(--token).
const ROOT = 'web/src';
const TOKENS = 'app/tokens.css';
// Temporary: the browser theme colour is a Next.js viewport string, not CSS; it changes with the other brand surfaces (P5).
const ALLOWED = { 'app/layout.tsx': ["'#FAF9F5'"] };
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g;
const QUOTED_HEX = /(['"`])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\1/g;

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});
const sources = walk(ROOT).map(path => path.replaceAll('\\', '/').slice(ROOT.length + 1))
  .filter(path => /\.(css|tsx|ts)$/.test(path) && path !== TOKENS && !/(^|\/)domain\.generated\./.test(path) && !path.endsWith('.d.ts'));

// CSS: colour literals inside declaration values (selectors such as #id are not values).
const cssLiterals = text => stripComments(text).match(/:[^;{}]*/g)?.flatMap(value => [...value.matchAll(HEX), ...value.matchAll(FUNCTION)].map(m => m[0])) ?? [];
// TS/TSX: a string that is a hex colour, or a colour function anywhere (route hashes such as '#add-product' are not colours).
const scriptLiterals = text => [...text.matchAll(QUOTED_HEX), ...text.matchAll(FUNCTION)].map(m => m[0]);

test('the policy scans every stylesheet, including the landing and hero', () => {
  for (const path of ['app/globals.css', 'app/welcome/landing.module.css', 'app/welcome/hero-depth.module.css', 'app/login/login.module.css']) assert.ok(sources.includes(path), path);
  assert.ok(sources.filter(path => path.endsWith('.css')).length >= 8);
});
// Design tokens (colour, chart, type, shape, shadow, motion) must be defined, or the declaration silently drops
// (after the main merge the landing hero lost its background, lines and glow this way).
test('every design token a stylesheet uses is defined in tokens.css', () => {
  const defined = new Set(stripComments(readFileSync(join(ROOT, TOKENS), 'utf8')).match(/--[\w-]+(?=\s*:)/g));
  const missing = sources.filter(path => path.endsWith('.css')).flatMap(path =>
    [...stripComments(readFileSync(join(ROOT, path), 'utf8')).matchAll(/var\((--(?:color|chart|text|font|radius|shadow|space|ease|duration)-[\w-]+)/g)]
      .map(m => m[1]).filter(name => !defined.has(name)).map(name => `${path}: ${name}`));
  assert.deepEqual([...new Set(missing)], []);
});
test('no colour literal outside tokens.css', () => {
  const found = {};
  for (const path of sources) {
    const text = readFileSync(join(ROOT, path), 'utf8');
    const literals = path.endsWith('.css') ? cssLiterals(text) : scriptLiterals(text);
    const unexpected = literals.filter(literal => !(ALLOWED[path] ?? []).includes(literal));
    if (unexpected.length) found[path] = unexpected;
  }
  assert.deepEqual(found, {});
});
test('the allowlist holds only what is still present', () => {
  for (const [path, literals] of Object.entries(ALLOWED)) {
    const text = readFileSync(join(ROOT, path), 'utf8');
    assert.deepEqual(scriptLiterals(text), literals, path);
  }
});
test('the checks catch the patterns they guard against', () => {
  assert.deepEqual(cssLiterals('.a{color:#0d2923;background:rgb(0 0 0/.2)} #ab12cd{color:var(--x)} /* #fff */'), ['#0d2923', 'rgb(']);
  assert.deepEqual(scriptLiterals(`const a='#fff'; const b="#add-product"; const c=\`#0d2923\`; navigate('#products')`), ["'#fff'", '`#0d2923`']);
});

// Rendered text is never below 12px (criteria F1). rem/em count at the 16px root; var() resolves through tokens.css.
// max() is as large as its largest argument and clamp() as small as its first, so those set the floor; any other
// value fails on any length literal below the minimum.
const MIN_FONT_PX = 12;
const TOKEN_PROPS = readRootProperties(join(ROOT, TOKENS));
const splitArgs = inner => { const out = []; let depth = 0, start = 0; for (let i = 0; i < inner.length; i++) { const c = inner[i]; if (c === '(') depth++; else if (c === ')') depth--; else if (c === ',' && depth === 0) { out.push(inner.slice(start, i).trim()); start = i + 1; } } return [...out, inner.slice(start).trim()]; };
const lengths = value => [...value.matchAll(/(\d*\.?\d+)(px|rem|em)\b/g)].map(([literal, n, unit]) => ({ literal, px: unit === 'px' ? Number(n) : Number(n) * 16 }));
function tooSmall(value) {
  const v = value.replace(/!important/, '').trim();
  const fn = v.match(/^(max|clamp)\((.*)\)$/s);
  if (fn) {
    const args = splitArgs(fn[2]);
    const parts = (fn[1] === 'max' ? args : args.slice(0, 1)).map(tooSmall);
    return fn[1] === 'max' && parts.some(p => !p.length) ? [] : parts.flat();
  }
  if (/^var\(--[\w-]+\)$/.test(v)) { try { return tooSmall(resolve(TOKEN_PROPS, v)); } catch { return []; } }
  return lengths(v).filter(l => l.px < MIN_FONT_PX).map(l => l.literal);
}
const smallFonts = text => [...stripComments(text).matchAll(/(?:^|[;{\s])(font(?:-size)?)\s*:\s*([^;{}]*)/g)]
  .flatMap(([, prop, value]) => prop === 'font' ? lengths(value).filter(l => l.px < MIN_FONT_PX).map(l => l.literal) : tooSmall(value));

test('no font size below 12px in any stylesheet', () => {
  const found = {};
  for (const path of sources.filter(path => path.endsWith('.css'))) {
    const small = smallFonts(readFileSync(join(ROOT, path), 'utf8'));
    if (small.length) found[path] = small;
  }
  const tokens = smallFonts(readFileSync(join(ROOT, TOKENS), 'utf8'));
  if (tokens.length) found[TOKENS] = tokens;
  assert.deepEqual(found, {});
});
// Typography rules (criteria F3, F7, X5). Each rule body is read per selector list.
const cssRules = text => [...stripComments(text).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim().replace(/^@media[^{]*$/, ''), body }));
const stylesheets = () => sources.filter(path => path.endsWith('.css')).flatMap(path => cssRules(readFileSync(join(ROOT, path), 'utf8')).map(rule => ({ ...rule, path })));
// Letter-spacing (F3) and line-heights below 1.5 (F2) are allowed only on text that never holds Thai: numbers, codes,
// Latin-only names and single-line labels. Where such an element has a Thai state, THAI_STATE_RESETS must undo it.
const LETTER_SPACING_ALLOWED = {
  'app/globals.css': ['.money', '.tabular-number', '.summary-main-number', '.link-code>strong', '.link-code-box strong'],
  'app/components/product-catalog.module.css': ['.numeric :global(.money),.metrics :global(.money)'],
  'app/components/assistant.module.css': ['.resultMain>strong'], // amount; the Thai "missing" state is reset below
  'app/welcome/landing.module.css': ['.resultSummary strong'],
  'app/welcome/hero-depth.module.css': ['.sceneFooter > span'], // platform names
};
const LINE_HEIGHT_TIGHT_ALLOWED = {
  'app/globals.css': ['.brand', '.profit-value', '.link-code>strong', '.tabular-number', '.preview-profit-number', '.overview-page .summary-main-number'], // wordmark, amounts, codes
  'app/components/assistant.module.css': ['.headerTitleText', '.resultMain>strong'], // one-line ellipsis title; amount
  'app/components/product-catalog.module.css': ['.summary strong', '.countBadge'], // counts
};
const THAI_STATE_RESETS = [
  ['app/components/assistant.module.css', '.resultMain>.missing,.missing', /letter-spacing:0/, /line-height:1\.5/],
  ['app/components/profit-amount.module.css', '.label', /letter-spacing:0/, /line-height:1\.5/],
  ['app/globals.css', '.profit-value.muted', /line-height:var\(--leading-heading\)/],
  ['app/globals.css', '.brand small', /line-height:1\.5/],
];
const LEADING = { 'var(--leading-tight)': 1.2, 'var(--leading-heading)': 1.5, 'var(--leading-body)': 1.6 };
const lineHeights = body => [...body.matchAll(/line-height\s*:\s*([^;]+)/g)].map(m => m[1].trim()).concat(body.match(/(?:^|;)\s*font\s*:[^;]*\/\s*([^\s;]+)/)?.[1] ?? [])
  .map(v => LEADING[v] ?? (/^[\d.]+$/.test(v) ? Number(v) : null)).filter(n => n !== null);
const allowedHere = (list, path, selector) => (list[path] ?? []).includes(selector);
test('letter-spacing is only used on number, code and Latin-only selectors (F3)', () => {
  const found = [];
  for (const { selector, body, path } of stylesheets()) {
    for (const [, value] of body.matchAll(/letter-spacing\s*:\s*([^;]+)/g)) {
      if (!/^(0|normal)$/.test(value.trim()) && !allowedHere(LETTER_SPACING_ALLOWED, path, selector)) found.push(`${path}: ${selector} ${value.trim()}`);
    }
  }
  assert.deepEqual(found, []);
});
test('line heights below 1.5 are only used on numbers, codes, one-line labels or English-only rules (F2)', () => {
  const found = stylesheets().filter(({ selector, body, path }) => lineHeights(body).some(n => n < 1.5) && !/:lang\(en\)/.test(selector) && !allowedHere(LINE_HEIGHT_TIGHT_ALLOWED, path, selector));
  assert.deepEqual(found.map(({ path, selector }) => `${path}: ${selector}`), []);
});
test('typography allowlists name rules that still exist, and Thai states inside them are reset', () => {
  const rules = stylesheets();
  for (const [list, property] of [[LETTER_SPACING_ALLOWED, /letter-spacing/], [LINE_HEIGHT_TIGHT_ALLOWED, /line-height|font\s*:/]]) {
    for (const [path, selectors] of Object.entries(list)) for (const selector of selectors) {
      assert.ok(rules.some(r => r.path === path && r.selector === selector && property.test(r.body)), `${path}: ${selector} is stale`);
    }
  }
  for (const [path, selector, ...patterns] of THAI_STATE_RESETS) {
    const rule = rules.find(r => r.path === path && r.selector === selector);
    assert.ok(rule, `${path}: ${selector} missing`);
    for (const pattern of patterns) assert.match(rule.body, pattern, `${path}: ${selector}`);
  }
});
test('the heading family is only used by headings (F7)', () => {
  const misuse = stylesheets().filter(({ selector, body }) => /var\(--font-display\)/.test(body) && !selector.split(',').every(s => /(^|[\s>])h[1-3]$/.test(s.trim())));
  assert.deepEqual(misuse.map(({ path, selector }) => `${path}: ${selector}`), []);
});
// The UI faces exist only in 400/500/600; a heavier request would be faux-bolded, which smears Thai marks.
const heavyWeights = body => [...body.matchAll(/font-weight\s*:\s*([^;]+)/g)].map(m => m[1].trim())
  .concat([...body.matchAll(/(?:^|;)\s*font\s*:\s*([^;]+)/g)].map(m => m[1].trim().split(/\s+/)[0]))
  .filter(v => /^(bold|bolder)$/i.test(v) || (/^\d+$/.test(v) && Number(v) > 600));
test('no stylesheet asks for a weight above 600 (bold, bolder, 700+)', () => {
  const heavy = stylesheets().filter(({ body }) => heavyWeights(body).length);
  assert.deepEqual(heavy.map(({ path, selector, body }) => `${path}: ${selector} ${heavyWeights(body)}`), []);
  assert.deepEqual(heavyWeights('color:red;font-weight:700;font:bold 16px/1.5 x;font-weight:var(--weight-semibold);font-weight:600'), ['700', 'bold']);
});
test('no monospace family name stands in for the UI or SKU font (X5)', () => {
  const mono = stylesheets().filter(({ body }) => /font(-family)?\s*:[^;]*\bmono\b/i.test(body.replace(/\bmonospace\b/gi, '')));
  assert.deepEqual(mono.map(({ path, selector }) => `${path}: ${selector}`), []);
});
test('the font-size check catches px, rem, clamp and the font shorthand', () => {
  assert.deepEqual(smallFonts('.a{font-size:11px}.b{font-size: 10px }.c{font-size:var(--text-xs)}.d{font-size:12px}'), ['11px', '10px']);
  assert.deepEqual(smallFonts('.a{font-size:.625rem}.b{font-size:clamp(10px,2vw,14px)}.c{font:600 11px/1.5 sans-serif}.d{line-height:10px}'), ['.625rem', '10px', '11px']);
  // A floor of 12px is satisfied; a max() whose arguments are all small is not; tokens resolve.
  assert.deepEqual(smallFonts('.a{font-size:max(var(--text-xs),.55em)}.b{font-size:max(10px,.5em)}.c{font-size:var(--text-xs)!important}.d{font-size:.6em}'), ['10px', '.5em', '.6em']);
});

// Channel names are identities, not statuses: a platform pill never borrows a status colour (X9).
test('no channel selector uses a status colour (X9)', () => {
  const found = stylesheets().filter(({ selector, body }) => /channel-/.test(selector) && /var\(--color-(warning|info|negative|positive)/.test(body));
  assert.deepEqual(found.map(({ path, selector }) => `${path}: ${selector}`), []);
});
// Terracotta on values and statuses (criteria L2) is checked in tests/semantic-colour.test.mjs.

// Depth (P3d): surfaces are flat. A shadow is none, the floating-layer or composer token, or a zero-blur inset bar
// (selected-row indicator). The landing hero (welcome/) keeps its depth effects through tokens only (D7, P5 scope).
const SHADOW_OK = /^(none|var\(--shadow-lg\)|var\(--shadow-composer\)|inset\s+-?\d+(px)?\s+-?\d+(px)?\s+0\s+var\(--[\w-]+\))$/;
const badShadows = rules => rules.filter(({ path, body }) => !path.startsWith('app/welcome/'))
  .flatMap(({ path, selector, body }) => [...body.matchAll(/box-shadow\s*:\s*([^;]+)/g)].map(m => m[1].replace(/!important/, '').trim())
    .filter(value => !SHADOW_OK.test(value)).map(value => `${path}: ${selector} ${value}`));
test('box-shadow is none, --shadow-lg, --shadow-composer or an inset indicator bar', () => {
  assert.deepEqual(badShadows(stylesheets()), []);
  assert.deepEqual(badShadows(cssRules('.a{box-shadow:var(--shadow-sm)}.b{box-shadow:none}.c{box-shadow:inset 3px 0 0 var(--color-selected)}.d{box-shadow:0 1px 2px var(--color-shadow)}').map(r => ({ ...r, path: 'app/x.css' }))).length, 2);
});
// Ordinary buttons use the 9px control radius (D8); chips, toggles, tags and in-field icon buttons keep the pill.
const PILL_BUTTONS = {
  'app/globals.css': ['.segmented button', '.overview-channel-filters button', '.filter-chip button', '.clear-search-btn'],
  'app/components/assistant.module.css': ['.root .context button'],
  'app/components/finance.module.css': ['.segmented button', '.statusCounts button'],
  'app/components/store-settings.module.css': ['.root .language button'],
};
test('ordinary buttons are not pills (D8)', () => {
  const rules = stylesheets().filter(({ path }) => !path.startsWith('app/welcome/'));
  const pills = rules.filter(({ path, selector, body }) => /border-radius[^;]*var\(--radius-pill\)/.test(body)
    && selector.split(',').some(s => /(button|-btn|Btn|Button)\b/.test(s) && !/:global\(\.language-switch/.test(s) && !(PILL_BUTTONS[path] ?? []).includes(s.trim())));
  assert.deepEqual(pills.map(({ path, selector }) => `${path}: ${selector}`), []);
  assert.ok(rules.some(({ path, selector, body }) => path === 'app/globals.css' && selector === 'button,.button-link' && /border-radius:var\(--radius-md\)/.test(body)));
  for (const [path, selectors] of Object.entries(PILL_BUTTONS)) for (const selector of selectors) {
    assert.ok(rules.some(r => r.path === path && r.selector === selector && /var\(--radius-pill\)/.test(r.body)), `${path}: ${selector} is stale`);
  }
});
