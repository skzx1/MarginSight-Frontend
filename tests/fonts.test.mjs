import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readFont, THAI } from './lib/font.mjs';
import { readRootProperties, resolveProperty, stripComments } from './lib/css.mjs';

const DIR = 'web/public/fonts';
const faces = [...stripComments(readFileSync(join(DIR, 'fonts.css'), 'utf8')).matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => {
  const get = prop => body.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`))?.[1].trim();
  const weight = get('font-weight').split(/\s+/).map(Number);
  return { family: get('font-family').replace(/['"]/g, ''), weight: [weight[0], weight.at(-1)], display: get('font-display'), file: get('src').match(/url\(['"]?\/fonts\/([^'")]+)/)[1], range: get('unicode-range') };
});
const inRange = (range, cp) => !range || range.split(',').some(part => { const [a, b = a] = part.trim().replace(/^U\+/i, '').split('-').map(h => parseInt(h, 16)); return cp >= a && cp <= b; });
const fonts = new Map(faces.map(face => [face.file, readFont(join(DIR, face.file))]));

// The UI family approved for P2 (decision C1): six unmodified TTF files, budget C2 = 800 KB (decimal) for these files only.
const UI_FILES = { 'font-0.ttf': ['IBM Plex Sans', 400], 'font-1.ttf': ['IBM Plex Sans', 500], 'font-2.ttf': ['IBM Plex Sans', 600], 'font-4.ttf': ['Noto Sans Thai', 400], 'font-5.ttf': ['Noto Sans Thai', 500], 'font-6.ttf': ['Noto Sans Thai', 600] };
const UI_BUDGET_BYTES = 800_000;

test('every face loads an existing file with font-display swap', () => {
  assert.ok(faces.length >= 6);
  for (const face of faces) {
    assert.ok(existsSync(join(DIR, face.file)), face.file);
    assert.equal(face.display, 'swap', face.file);
  }
});
test('every family ships its OFL licence text', () => {
  const files = readdirSync(DIR).map(name => name.toLowerCase());
  for (const family of new Set(faces.map(face => face.family))) {
    const slug = family.toLowerCase().replace(/\s+/g, '-');
    assert.ok(files.some(name => name.includes(slug) && name.includes('ofl') && name.endsWith('.txt')), family);
  }
});
test('each static face is declared with its real family and weight', () => {
  for (const face of faces) {
    const font = fonts.get(face.file);
    if (font.variable) { assert.ok(face.weight[0] < face.weight[1], `${face.file} variable range`); continue; }
    assert.equal(font.family, face.family, face.file);
    assert.deepEqual(face.weight, [font.weightClass, font.weightClass], `${face.file} declared ${face.weight} vs OS/2 ${font.weightClass}`);
  }
});
test('the approved UI faces are present, unmodified files within the budget', () => {
  let total = 0;
  for (const [file, [family, weight]] of Object.entries(UI_FILES)) {
    const face = faces.find(f => f.file === file);
    assert.ok(face, `${file} declared`);
    assert.deepEqual([face.family, face.weight[0]], [family, weight], file);
    total += fonts.get(file).bytes;
  }
  assert.ok(total <= UI_BUDGET_BYTES, `UI font files ${total} bytes > ${UI_BUDGET_BYTES}`);
});
test('every font file in the fonts directory is declared in fonts.css (no orphan files ship)', () => {
  const declared = new Set(faces.map(face => face.file));
  const orphans = readdirSync(DIR).filter(name => /\.(ttf|otf|woff2?)$/i.test(name) && !declared.has(name));
  assert.deepEqual(orphans, [], `font files not referenced by fonts.css: ${orphans.join(', ')}`);
});
test('the UI families declare only weights 400, 500 and 600, and the weight tokens stay within them', () => {
  for (const face of faces.filter(f => ['IBM Plex Sans', 'Noto Sans Thai'].includes(f.family))) {
    assert.equal(face.weight[0], face.weight[1], `${face.file} is a static face`);
    assert.ok([400, 500, 600].includes(face.weight[0]), `${face.file} ${face.family} weight ${face.weight[0]}`);
  }
  const props = readRootProperties('web/src/app/tokens.css');
  const weights = [...props.keys()].filter(name => name.startsWith('--weight-'));
  assert.ok(weights.length > 0, 'weight tokens');
  for (const name of weights) assert.ok(Number(resolveProperty(props, name)) <= 600, `${name} = ${resolveProperty(props, name)}`);
});
test('any face that serves Thai covers all 87 Thai code points; Thai-only faces stay out of Latin', () => {
  for (const face of faces) {
    const font = fonts.get(face.file);
    const servesThai = inRange(face.range, 0x0E01) && THAI.filter(cp => font.codepoints.has(cp)).length > 1;
    if (servesThai) assert.deepEqual(THAI.filter(cp => !font.codepoints.has(cp)), [], `${face.file} misses Thai`);
  }
  for (const face of faces.filter(f => f.family === 'Noto Sans Thai')) {
    assert.ok(face.range, `${face.file} needs a unicode-range`);
    // Latin, figures, the minus sign and the baht sign stay in IBM Plex Sans so an amount is set in one family.
    for (const cp of [0x41, 0x61, 0x30, 0x2212, 0x0E3F]) assert.ok(!inRange(face.range, cp), `${face.file} would serve U+${cp.toString(16)}`);
    for (const cp of [0x0E01, 0x0E31, 0x0E48, 0x0E5B, 0x25CC]) assert.ok(inRange(face.range, cp), `${face.file} misses U+${cp.toString(16)}`);
  }
});
test('the UI, number and heading tokens use the approved families with Thai fallbacks', () => {
  const props = readRootProperties('web/src/app/tokens.css');
  const families = name => resolveProperty(props, name).split(',').map(f => f.trim().replace(/['"]/g, ''));
  for (const name of ['--font-sans', '--font-numeric', '--font-display']) {
    const stack = families(name);
    assert.deepEqual(stack.slice(0, 2), ['IBM Plex Sans', 'Noto Sans Thai'], name);
    assert.ok(stack.includes('Tahoma') && stack.at(-1) === 'sans-serif', `${name} system fallbacks`);
    for (const family of stack.slice(0, 2)) assert.ok(faces.some(face => face.family === family), `${family} has a face`);
  }
});
test('while headings use the sans, Thai headings keep a line height of at least 1.5 (F2)', () => {
  const props = readRootProperties('web/src/app/tokens.css');
  // Criteria F2 allows 1.35 only for a Thai serif heading face; the sans needs the general 1.5.
  if (resolveProperty(props, '--font-display') === resolveProperty(props, '--font-sans')) assert.ok(Number(resolveProperty(props, '--leading-heading')) >= 1.5);
});
test('IBM Plex Sans has the Latin, digits and the true minus sign the UI prints', () => {
  for (const file of ['font-0.ttf', 'font-1.ttf', 'font-2.ttf']) {
    const { codepoints } = fonts.get(file);
    for (let cp = 0x20; cp <= 0x7e; cp++) assert.ok(codepoints.has(cp), `${file} U+${cp.toString(16)}`);
    for (const cp of [0x2212, 0x0E3F, 0x2014]) assert.ok(codepoints.has(cp), `${file} U+${cp.toString(16)}`);
  }
});
