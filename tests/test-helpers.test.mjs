import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cr, de2000, lab, sim, CVD } from './lib/color.mjs';
import { readRootProperties, resolve, resolveProperty, rootProperties } from './lib/css.mjs';

test('colour helpers match published reference values', () => {
  assert.equal(cr('#000000', '#FFFFFF').toFixed(2), '21.00');
  assert.equal(cr('#777777', '#FFFFFF').toFixed(2), '4.48');
  // Sharma, Wu & Dalal (2005), table 1, pair 1.
  assert.equal(de2000([50, 2.6772, -79.7751], [50, 0, -82.7485]).toFixed(4), '2.0425');
  assert.equal(de2000(lab('#17735C'), lab('#17735C')), 0);
  assert.equal(sim('#FFFFFF', CVD['deutan(Machado09,s=1)']), '#FFFFFF');
});
test('css helpers read :root properties and resolve var() chains', () => {
  const props = rootProperties('/* :root{--x:1} */ :root{--a:#111;--b:var(--a);--c:var(--missing, var(--b)) 1px} .x{--d:2}');
  assert.deepEqual([...props.keys()], ['--a', '--b', '--c']);
  assert.equal(resolveProperty(props, '--c'), '#111 1px');
  assert.throws(() => resolve(props, 'var(--missing)'), /Unknown custom property --missing/);
  assert.throws(() => resolve(rootProperties(':root{--a:var(--b);--b:var(--a)}'), 'var(--a)'), /Cycle/);
});
test('every design token in tokens.css resolves', () => {
  const props = readRootProperties('web/src/app/tokens.css');
  assert.ok(props.size > 50);
  for (const name of props.keys()) assert.ok(resolveProperty(props, name).length > 0, name);
});
test('money() stays byte-identical to the approved implementation', () => {
  const source = readFileSync('web/src/lib/format.ts', 'utf8');
  assert.ok(source.startsWith("export function money(value: number | null | undefined, locale = 'th') {\n  return value == null ? '—' : new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);\n}\n"));
});
