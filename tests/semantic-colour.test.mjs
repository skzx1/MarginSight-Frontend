import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readRootProperties, resolve, stripComments } from './lib/css.mjs';

// Criteria L2: the terracotta family (action, link, indicator, brand-bright, focus, chart highlight and their on-dark
// and legacy aliases) never colours a financial value or a status. Values use text / negative / positive / muted;
// statuses use their own tint pair or a neutral pill, plus an icon or a text label.
const ROOT = 'web/src/app';
const props = readRootProperties(join(ROOT, 'tokens.css'));
// Every token that resolves to a terracotta primitive counts, whatever its name (--color-accent, --green, ...).
const TERRACOTTA = new Set([...props.keys()].filter(name => name.startsWith('--terracotta-')).map(name => props.get(name).toLowerCase()));
const COLOUR_PROPS = /^(color|background(-color)?|border(-(top|right|bottom|left))?(-color)?|fill|stroke)$/;
// Matched at the start of a word, camelCase split, so ".kpiProfit" matches and ".inlineTitle" does not ("net").
const PATTERN = /money|profit|loss|net|kpi|floor|ledger|delta|trend|margin|amount|badge|notice|toast|banner|success|alert|warning|error|status/;
const matchesPattern = selector => new RegExp(`(^|[^a-z])(${PATTERN.source})`).test(selector.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase());
// Focus rings mark the focused control, not a value or a status (criteria F5).
const isFocusState = selector => /:focus/.test(selector);

// The 14 selectors that coloured values (6) and statuses (8) with terracotta after P1a, and the colour each must use.
const VALUE = ['var(--color-text)', 'var(--color-text-muted)', 'var(--color-negative)', 'var(--color-positive)', 'var(--color-positive-fg)'];
const L2 = [
  ['components/finance.module.css', '.kpiProfit', VALUE],
  ['components/finance.module.css', '.statement .net', VALUE],
  ['components/product-catalog.module.css', '.profit', VALUE],
  ['globals.css', '.landing-ledger strong', VALUE],
  ['welcome/landing.module.css', '.alertCard b', ['var(--color-negative)']],
  ['welcome/landing.module.css', '.alertFloor strong', VALUE],
  ['globals.css', '.notice.success', ['var(--color-positive-fg)']],
  ['globals.css', '.badge-success', ['var(--color-positive-fg)']],
  ['globals.css', '.success-banner', ['var(--color-positive-fg)', 'var(--color-text)']],
  ['globals.css', '.success-notice', ['var(--color-positive-fg)']],
  ['globals.css', '.channel-badge', ['var(--color-text)']],
  ['components/finance.module.css', '.badge', ['var(--color-text)', 'var(--color-positive-fg)']],
  ['components/store-settings.module.css', '.mockBadge :global(.badge)', ['var(--color-text)']],
  ['components/store-settings.module.css', '.toast', ['var(--color-positive-fg)']],
];

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});
const sheets = walk(ROOT).map(path => path.replaceAll('\\', '/').slice(ROOT.length + 1)).filter(path => path.endsWith('.css') && path !== 'tokens.css');
const rules = path => [...stripComments(readFileSync(join(ROOT, path), 'utf8')).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selector, body]) => ({ path, selectors: selector.trim().split(',').map(s => s.trim()), body }));
const declarations = body => body.split(';').map(d => d.match(/^\s*([\w-]+)\s*:\s*([\s\S]*?)\s*(!important)?\s*$/)).filter(Boolean).map(m => ({ prop: m[1].toLowerCase(), value: m[2] }));
const usesTerracotta = value => {
  const names = [...value.matchAll(/var\((--[\w-]+)/g)].map(m => m[1]);
  return names.some(name => [...resolve(props, `var(${name})`).matchAll(/#[0-9a-f]{6}/gi)].some(h => TERRACOTTA.has(h[0].toLowerCase())));
};
const offenders = list => list.flatMap(({ path, selectors, body }) => declarations(body)
  .filter(({ prop, value }) => COLOUR_PROPS.test(prop) && usesTerracotta(value))
  .map(({ prop, value }) => `${path}: ${selectors.join(',')} ${prop}:${value}`));

test('the terracotta set is the primitive family and its aliases', () => {
  assert.ok(TERRACOTTA.size >= 5);
  for (const name of ['--color-action', '--color-accent', '--color-link', '--color-focus', '--color-indicator', '--color-brand-bright', '--chart-highlight']) assert.ok(usesTerracotta(`var(${name})`), name);
  for (const name of ['--color-text', '--color-negative', '--color-positive', '--color-positive-fg', '--color-bg-subtle']) assert.ok(!usesTerracotta(`var(${name})`), name);
  assert.ok(usesTerracotta('color-mix(in srgb,var(--color-accent) 20%,transparent)'));
});
test('the selector pattern matches whole words, camelCase included', () => {
  for (const s of ['.kpiProfit', '.statement .net', '.success-banner', '.toast', '.landing-ledger strong', '.notice.success', '.countBadge', '.margin-status-tag', '.alertFloor strong']) assert.ok(matchesPattern(s), s);
  for (const s of ['.inlineTitleInput', '.planet', '.channel-key']) assert.ok(!matchesPattern(s), s);
});
test('each of the 14 L2 selectors exists, avoids terracotta and takes an allowed colour', () => {
  for (const [path, selector, allowed] of L2) {
    const matching = rules(path).filter(rule => rule.selectors.includes(selector));
    assert.ok(matching.length, `${path}: ${selector} not found`);
    assert.deepEqual(offenders(matching), [], `${path}: ${selector}`);
    const colours = matching.flatMap(rule => declarations(rule.body)).filter(d => d.prop === 'color').map(d => d.value);
    assert.ok(colours.length && colours.every(c => allowed.includes(c)), `${path}: ${selector} color ${colours.join(' | ') || '(none)'} not in ${allowed.join(', ')}`);
  }
});
test('no value or status selector uses a terracotta-family colour', () => {
  const found = sheets.flatMap(path => offenders(rules(path).filter(rule => rule.selectors.some(s => matchesPattern(s) && !isFocusState(s)))));
  assert.deepEqual(found, []);
});
