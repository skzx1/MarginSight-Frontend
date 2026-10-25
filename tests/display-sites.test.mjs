import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Static scan of display code (System R): signed money and percentages go through web/src/lib/signed-money.ts,
// so a negative value never prints as "฿-53.00" or "-3.2%" with an ASCII hyphen.
const ROOT = 'web/src';
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});
const files = walk(ROOT).map(path => path.replaceAll('\\', '/').slice(ROOT.length + 1))
  .filter(path => /\.(tsx|ts)$/.test(path) && !/(^|\/)domain\.generated\./.test(path) && !path.endsWith('.d.ts'));
const read = path => readFileSync(join(ROOT, path), 'utf8');

// "฿" glued to money(x) prints money()'s ASCII hyphen for a negative x. Only money(Math.abs(...)) with an explicit sign is safe.
const RAW_BAHT = /฿['"`]?\s*\+\s*money\((?!Math\.abs\()|฿\$\{money\((?!Math\.abs\()|฿\{money\((?!Math\.abs\()/g;
const rawBaht = text => text.match(RAW_BAHT) ?? [];
// Sites that print "฿" + money(x) for an x that cannot be negative, or that are pending in a file owned elsewhere. Counts must match exactly.
const ALLOWED = {
  // Parsed CSV selling prices and unit costs: non-negative by validation.
  'app/components/product-csv-import.tsx': 6,
  'lib/product-csv.ts': 2,
  // money(0) for the zero case inside the helper itself.
  'lib/signed-money.ts': 1
};

test('the scan covers the screens and components that print amounts', () => {
  for (const path of ['app/screens/finance.tsx', 'app/screens/assistant.tsx', 'app/screens/add-product.tsx', 'app/components/finance-chart.tsx', 'app/components/overview-charts.tsx', 'app/components/profit-amount.tsx', 'lib/mock-data.ts']) assert.ok(files.includes(path), path);
});
test('no "฿" + money(x) of a possibly negative value outside the allowlist', () => {
  const found = {};
  for (const path of files) { const hits = rawBaht(read(path)).length; if (hits) found[path] = hits; }
  assert.deepEqual(found, ALLOWED);
});
test('no "฿-" literal and no hand-made money sign in display code', () => {
  for (const path of files) {
    const text = read(path);
    assert.ok(!text.includes('฿-'), path);
    if (path !== 'lib/signed-money.ts') assert.ok(!/\bfunction signedProfit\b|\bconst signedProfit\s*=/.test(text), `${path}: local signedProfit`);
  }
});
test('migrated sites use the helper and no raw toFixed percent or toFixed baht', () => {
  for (const path of ['app/screens/finance.tsx', 'app/components/finance-chart.tsx', 'app/components/overview-charts.tsx', 'app/screens/add-product.tsx', 'lib/mock-data.ts']) {
    const text = read(path);
    assert.ok(!/\.toFixed\(\d\)\s*\+\s*['"`]%/.test(text), `${path}: toFixed + '%'`);
    assert.ok(!/toFixed\(\d\)\}%/.test(text), `${path}: toFixed in a % template`);
    assert.ok(!/฿\$\{\(/.test(text), `${path}: ฿ + computed number`);
    assert.ok(text.includes('lib/signed-money') || text.includes('./signed-money'), `${path}: imports signed-money`);
  }
  assert.ok(!/THB<\/title>/.test(read('app/components/overview-charts.tsx')), 'chart tooltips use the helper, not raw money() + THB');
  const finance = read('app/screens/finance.tsx');
  assert.ok(finance.includes('<Delta '), 'finance KPI deltas render <Delta>');
  const assistant = read('app/screens/assistant.tsx');
  const copyFn = assistant.slice(assistant.indexOf('const copy = async'), assistant.indexOf('navigator.clipboard.writeText'));
  assert.ok(copyFn.includes('profitParts(') && !rawBaht(copyFn).length, 'clipboard text uses profitParts().text');
});
test('ProfitAmount and Delta hide the visible text from screen readers and speak the spoken form', () => {
  const amount = read('app/components/profit-amount.tsx'), delta = read('app/components/delta.tsx');
  for (const text of [amount, delta]) {
    assert.ok(text.includes('aria-hidden="true"'));
    assert.ok(/className="sr-only">\{parts\.spoken\}/.test(text));
  }
  assert.ok(!/var\(--color-(action|link|indicator|brand-bright|focus|accent|positive|negative)/.test(read('app/components/delta.module.css')), 'delta colour is neutral');
});
test('the pattern catches the baseline "฿-" forms and allows the safe one', () => {
  assert.equal(rawBaht(`'฿' + money(value, locale)`).length, 1);
  assert.equal(rawBaht('`${label}: ฿${money(profit, locale)}`').length, 1);
  assert.equal(rawBaht('<span>{sign}฿{money(value, locale)}</span>').length, 1);
  assert.equal(rawBaht(`(v < 0 ? '−' : '') + '฿' + money(Math.abs(v), locale)`).length, 0);
});
