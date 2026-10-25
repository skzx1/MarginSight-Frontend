import test from 'node:test';
import assert from 'node:assert/strict';
import { cr } from './lib/color.mjs';
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
