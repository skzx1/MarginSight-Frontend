import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readRootProperties, resolve, stripComments } from './lib/css.mjs';

// Colours live in web/src/app/tokens.css only. Every other stylesheet and component uses var(--token).
const ROOT = 'web/src';
const TOKENS = 'app/tokens.css';
// Temporary: the browser theme colour is a Next.js viewport string, not CSS; it changes with the other brand surfaces (P5).
const ALLOWED = { 'app/layout.tsx': ["'#152d26'"] };
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
test('the font-size check catches px, rem, clamp and the font shorthand', () => {
  assert.deepEqual(smallFonts('.a{font-size:11px}.b{font-size: 10px }.c{font-size:var(--text-xs)}.d{font-size:12px}'), ['11px', '10px']);
  assert.deepEqual(smallFonts('.a{font-size:.625rem}.b{font-size:clamp(10px,2vw,14px)}.c{font:600 11px/1.5 sans-serif}.d{line-height:10px}'), ['.625rem', '10px', '11px']);
  // A floor of 12px is satisfied; a max() whose arguments are all small is not; tokens resolve.
  assert.deepEqual(smallFonts('.a{font-size:max(var(--text-xs),.55em)}.b{font-size:max(10px,.5em)}.c{font-size:var(--text-xs)!important}.d{font-size:.6em}'), ['10px', '.5em', '.6em']);
});
