import test from 'node:test';
import assert from 'node:assert/strict';
import { cr, CVD, de2000, lab, sim } from './lib/color.mjs';
import { readRootProperties, resolveProperty } from './lib/css.mjs';

// Pair IDs follow the redesign contrast criteria (T = text >= 4.5:1, N = non-text >= 3:1).
const props = readRootProperties('web/src/app/tokens.css');
const hex = name => {
  const value = resolveProperty(props, name);
  assert.match(value, /^#[0-9a-f]{6}$/i, `${name} resolves to ${value}`);
  return value;
};
const LIGHT = ['--color-bg-surface', '--color-bg-canvas', '--color-bg-subtle', '--color-bg-sidebar', '--color-nav-active-bg'];
const TINTS = ['--color-negative-bg', '--color-warning-bg', '--color-info-bg', '--color-positive-bg'];
const DARK = ['--color-bg-dark', '--color-bg-dark-hover'];
const expectPairs = (min, fgs, bgs) => {
  for (const fg of fgs) for (const bg of bgs) {
    const ratio = cr(hex(fg), hex(bg));
    assert.ok(ratio >= min, `${fg} on ${bg} = ${ratio.toFixed(2)} (min ${min})`);
  }
};

test('every colour token resolves to a hex value', () => {
  const names = [...props.keys()].filter(name => /^--(color|chart)-/.test(name));
  assert.ok(names.length > 40);
  for (const name of names) hex(name);
});
test('text tokens reach 4.5:1 on every surface they are drawn on (T1-T13)', () => {
  expectPairs(4.5, ['--color-text', '--color-text-muted', '--color-link', '--color-positive'], LIGHT); // T1-T3, T8
  expectPairs(4.5, ['--color-text', '--color-text-muted', '--color-link'], TINTS); // T1-T3 on tints
  expectPairs(4.5, ['--color-negative'], [...LIGHT, '--color-negative-bg']); // T4
  expectPairs(4.5, ['--color-warning'], [...LIGHT, '--color-warning-bg']); // T5
  expectPairs(4.5, ['--color-info'], [...LIGHT, '--color-info-bg']); // T6
  expectPairs(4.5, ['--color-positive-fg'], ['--color-positive-bg']); // T8 badge
  expectPairs(4.5, ['--color-on-action'], ['--color-action', '--color-action-hover']); // T9
  expectPairs(4.5, ['--color-count-fg'], ['--color-count-bg', '--color-selected']); // T10
  expectPairs(4.5, ['--color-text-inverse', '--color-text-inverse-muted', '--color-negative-on-dark', '--color-warning-on-dark', '--color-info-on-dark', '--color-positive-on-dark', '--color-emphasis-on-dark'], DARK); // T12
  expectPairs(4.5, ['--color-text'], ['--color-text-inverse']); // landing primary button on dark (inverse fill)
  expectPairs(4.5, ['--color-disabled-text'], ['--color-disabled-bg']); // T13
});
test('the bright brand colour never carries text (T14)', () => {
  const bright = hex('--color-brand-bright').toLowerCase();
  const textRoles = ['--color-text', '--color-text-muted', '--color-link', '--color-positive', '--color-positive-fg', '--color-negative', '--color-warning', '--color-info', '--color-on-action', '--color-count-fg', '--color-text-inverse', '--color-text-inverse-muted', '--color-emphasis-on-dark', '--color-negative-on-dark', '--color-warning-on-dark', '--color-info-on-dark', '--color-positive-on-dark'];
  for (const name of textRoles) assert.notEqual(hex(name).toLowerCase(), bright, name);
});
test('control boundaries, indicators and focus rings reach 3:1 (N1-N6)', () => {
  expectPairs(3, ['--color-border-strong'], ['--color-bg-surface', '--color-bg-canvas', '--color-bg-subtle', '--color-bg-sidebar']); // N1
  expectPairs(3, ['--color-action', '--color-indicator', '--color-count-bg', '--color-selected'], LIGHT); // N2, N3, N6
  expectPairs(3, ['--color-focus'], [...LIGHT, ...TINTS]); // N4
  expectPairs(3, ['--color-focus-on-dark', '--color-indicator-on-dark'], DARK); // N5
});
test('semantic token names describe a role, not a hue', () => {
  // Whole name segments, so role words that merely contain a hue ("link" ⊃ "ink") are not flagged.
  const hues = new Set(['green', 'emerald', 'orange', 'red', 'blue', 'amber', 'purple', 'terracotta', 'burgundy', 'mustard', 'navy', 'cream', 'ink', 'stone', 'olive', 'sage']);
  for (const name of props.keys()) if (/^--(color|chart)-/.test(name)) assert.ok(!name.slice(2).split('-').some(part => hues.has(part)), name);
});
test('the approved gain colour is the muted green #17735C', () => {
  assert.equal(hex('--color-positive').toLowerCase(), '#17735c');
});

// Chart series (criteria C1-C3, C3b, C9, N8). CVD = Machado 2009 at full severity.
const MEASURES = ['--chart-revenue', '--chart-cost', '--chart-profit', '--chart-loss'];
const CHANNELS = ['--chart-ch-shopee', '--chart-ch-lazada', '--chart-ch-tiktok', '--chart-ch-line', '--chart-ch-store', '--chart-ch-other'];
const CVD_MODES = ['protan(Machado09,s=1)', 'deutan(Machado09,s=1)', 'tritan(Machado09,s=1)'];
const pairs = list => list.flatMap((a, i) => list.slice(i + 1).map(b => [a, b]));
const dE = (a, b) => de2000(lab(hex(a)), lab(hex(b)));
const dECvd = (a, b, mode) => de2000(lab(sim(hex(a), CVD[mode])), lab(sim(hex(b), CVD[mode])));

test('every chart series reaches 3:1 on the plot background (N8)', () => {
  expectPairs(3, [...MEASURES, ...CHANNELS], ['--color-bg-surface', '--color-bg-canvas']);
});
test('measure series stay distinct in colour, under colour-vision deficiency and in grey (C3)', () => {
  for (const [a, b] of pairs(MEASURES)) {
    assert.ok(dE(a, b) >= 15, `${a} vs ${b} dE2000 ${dE(a, b).toFixed(1)}`);
    // Profit and loss are one series split at the zero line (position, sign and label carry it), so only the normal-vision gap applies.
    if (a === '--chart-profit' && b === '--chart-loss') continue;
    for (const mode of CVD_MODES) assert.ok(dECvd(a, b, mode) >= 10, `${a} vs ${b} ${mode} ${dECvd(a, b, mode).toFixed(1)}`);
    assert.ok(Math.abs(lab(hex(a))[0] - lab(hex(b))[0]) >= 5, `${a} vs ${b} |dL*|`);
  }
});
test('channel series stay distinct, step in luminance and do not read as text (C3, C3b)', () => {
  for (const [a, b] of pairs(CHANNELS)) {
    assert.ok(dE(a, b) >= 15, `${a} vs ${b} dE2000 ${dE(a, b).toFixed(1)}`);
    for (const mode of CVD_MODES) assert.ok(dECvd(a, b, mode) >= 10, `${a} vs ${b} ${mode} ${dECvd(a, b, mode).toFixed(1)}`);
    assert.ok(cr(hex(a), hex(b)) >= 1.2, `${a} vs ${b} luminance ratio ${cr(hex(a), hex(b)).toFixed(2)}`);
  }
  expectPairs(2, CHANNELS, ['--color-text']);
});
test('info stays a status colour, far from every series (C9)', () => {
  for (const name of [...MEASURES, ...CHANNELS]) assert.ok(dE(name, '--color-info') >= 12, `${name} vs info ${dE(name, '--color-info').toFixed(1)}`);
  const info = hex('--color-info').toLowerCase();
  for (const name of props.keys()) if (name.startsWith('--chart-')) assert.notEqual(hex(name).toLowerCase(), info, name);
});

// Shape and depth (P3d; criteria F4, F5, X4). Cards 12, controls and ordinary buttons 9, composer 20, dialogs 16.
const px = name => {
  const value = resolveProperty(props, name);
  assert.match(value, /^\d+(\.\d+)?px$/, `${name} resolves to ${value}`);
  return Number.parseFloat(value);
};
test('targets, buttons and inputs are at least 44px tall; the focus ring is 3px with a 3px offset (F4, F5)', () => {
  for (const name of ['--target-min', '--control-height', '--input-height']) assert.ok(px(name) >= 44, `${name} = ${px(name)}px`);
  assert.equal(px('--control-height'), 44);
  assert.equal(px('--input-height'), 48);
  assert.equal(px('--focus-width'), 3);
  assert.ok(px('--focus-offset') >= 3);
});
test('radii follow the shape scale', () => {
  assert.deepEqual(['--radius-md', '--radius-lg', '--radius-composer', '--radius-dialog'].map(px), [9, 12, 20, 16]);
  assert.equal(resolveProperty(props, '--radius-card'), resolveProperty(props, '--radius-lg'));
  assert.ok(px('--radius-pill') >= 999);
});
test('surfaces are flat; only floating layers and the composer keep a shadow', () => {
  assert.equal(resolveProperty(props, '--shadow-sm'), 'none');
  assert.equal(resolveProperty(props, '--shadow-md'), 'none');
  for (const name of ['--shadow-lg', '--shadow-composer']) assert.match(resolveProperty(props, name), /rgb\(20 20 19\/\.\d+\)/, name);
});
