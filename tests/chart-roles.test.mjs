import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHANNEL_ROLES, channelColorClass, channelRole } from '../web/src/lib/chart-roles.ts';
import { FINANCE_CHANNELS } from '../web/src/lib/finance-data.ts';
import { OVERVIEW_CHANNELS } from '../web/src/lib/overview-data.ts';
import { readRootProperties } from './lib/css.mjs';

test('every recorded sales channel has its own colour role', () => {
  const channels = [...new Set([...FINANCE_CHANNELS, ...OVERVIEW_CHANNELS])];
  const roles = channels.map(channelRole);
  assert.deepEqual(Object.fromEntries(channels.map((c, i) => [c, roles[i]])), { Shopee: 'shopee', Lazada: 'lazada', TikTok: 'tiktok', 'LINE Shop': 'line', 'In-store': 'store' });
  assert.equal(new Set(roles).size, channels.length);
});
test('platform names normalise case, spacing and display variants', () => {
  for (const [name, role] of [[' Shopee ', 'shopee'], ['SHOPEE', 'shopee'], ['tiktok shop', 'tiktok'], ['TikTok Shop', 'tiktok'], ['LINE  Shop', 'line'], ['LINE', 'line'], ['in store', 'store'], ['หน้าร้าน', 'store']]) {
    assert.equal(channelRole(name), role, name);
  }
});
test('unknown or missing platforms fall back to other, never to a position', () => {
  for (const name of ['', '   ', 'Facebook', 'draft', 'example', null, undefined]) assert.equal(channelRole(name), 'other', String(name));
  assert.equal(channelColorClass('Lazada'), 'channel-color-lazada');
  assert.equal(channelColorClass('Unknown shop'), 'channel-color-other');
});
// Measure series keep the criteria C5/C7 encodings, so colour is never the only key.
const rule = (css, selector) => css.match(new RegExp(`(?:^|[}\\s])${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\{([^}]*)\\}`))?.[1] ?? '';
test('series keep their dash, width and marker, and the highlight is a ring', () => {
  const globals = readFileSync('web/src/app/globals.css', 'utf8');
  assert.match(rule(globals, '.series-revenue'), /stroke:var\(--chart-revenue\);stroke-width:2\.5/);
  assert.doesNotMatch(rule(globals, '.series-revenue'), /dasharray/);
  assert.match(rule(globals, '.series-cost'), /stroke:var\(--chart-cost\);stroke-width:2;stroke-dasharray:7 4/);
  assert.match(rule(globals, '.series-profit'), /stroke:var\(--chart-profit\);stroke-width:2\.5;stroke-dasharray:2 3/);
  assert.match(rule(globals, '.mark-loss'), /fill:var\(--chart-loss\)/);
  assert.match(rule(globals, '.chart-highlight-ring'), /^fill:none;stroke:var\(--chart-highlight\);stroke-width:3$/);
  const marks = readFileSync('web/src/app/components/chart-marks.tsx', 'utf8');
  assert.match(marks, /SHAPE[^=]*=\s*\{ revenue: 'circle', cost: 'square', profit: 'triangle' \}/);
  // One highlight per chart: the finance ring is drawn for the first metric only.
  const finance = readFileSync('web/src/app/components/finance-chart.tsx', 'utf8');
  assert.equal(finance.match(/chart-highlight-ring/g)?.length, 1);
  assert.match(finance, /active\?\.\[metrics\[0\]\] != null && <circle/);
});
test('chart styles never use the info status colour (C9)', () => {
  for (const file of ['web/src/app/globals.css', 'web/src/app/components/finance.module.css']) {
    const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/series|mark-|channel-color|chart|spark|allocation|meter|donut/.test(selector)) assert.doesNotMatch(body, /--color-info/, `${file}: ${selector.trim()}`);
    }
  }
});
test('each role has a colour token and a class, and index colours are gone', () => {
  const props = readRootProperties('web/src/app/tokens.css');
  const globals = readFileSync('web/src/app/globals.css', 'utf8');
  for (const role of CHANNEL_ROLES) {
    assert.ok(props.has(`--chart-ch-${role}`), role);
    assert.match(globals, new RegExp(`\\.channel-color-${role}\\{stroke:var\\(--chart-ch-${role}\\);background:var\\(--chart-ch-${role}\\)\\}`), role);
  }
  assert.doesNotMatch(globals, /\.channel-color-\d/);
  for (const file of ['web/src/app/components/overview-charts.tsx', 'web/src/app/components/finance-chart.tsx']) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /channel-color-\$\{|%\s*5\b/, file);
    assert.doesNotMatch(source, /var\(--chart-[1-5]\)/, file);
  }
});
