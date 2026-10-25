import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AXIS_FONT_PX, axisNumber, chartLayout, niceTicks, textWidth, xLabelIndices } from '../web/src/lib/chart-axis.ts';

test('nice ticks are round, cover the range, include zero and respect the tick budget', () => {
  for (const [min, max, budget] of [[0, 1, 5], [0, 1234.5, 5], [-410, 2600, 5], [-4100, -10, 4], [0, 98765432, 6], [-3.2, 41.7, 3], [0, 0, 5]]) {
    const { ticks, lo, hi } = niceTicks(min, max, budget);
    assert.ok(ticks.length >= 2 && ticks.length <= budget, `${min}..${max}: ${ticks}`);
    assert.ok(lo <= min && hi >= Math.max(max, min + (max <= min ? 1 : 0)), `${min}..${max} covered by ${lo}..${hi}`);
    const step = ticks[1] - ticks[0];
    assert.match(String(Number((step / 10 ** Math.floor(Math.log10(step))).toPrecision(6))), /^(1|2|5)$/, `step ${step}`);
    if (min < 0 && max > 0) assert.ok(ticks.includes(0), `${ticks} has 0`);
    assert.ok(ticks.every(t => !Object.is(t, -0)));
  }
  assert.deepEqual(niceTicks(-410, 2600, 5).ticks, [-1000, 0, 1000, 2000, 3000]);
  assert.deepEqual(niceTicks(Number.NaN, 5).ticks, [0, 1]);
});

test('axis numbers use U+2212 for negatives, never an ASCII hyphen, and zero has no sign', () => {
  assert.equal(axisNumber(-410, 'th'), '−410');
  assert.equal(axisNumber(-410, 'en'), '−410');
  assert.equal(axisNumber(-12500, 'en'), '−12.5K');
  assert.equal(axisNumber(12500, 'en'), '12.5K');
  assert.equal(axisNumber(0, 'th'), '0');
  assert.equal(axisNumber(-0, 'th'), '0');
  assert.equal(axisNumber(-0.01, 'th'), '0');
  for (const value of [-0.5, -9, -1000, -2.5e6]) assert.ok(!axisNumber(value, 'th').includes('-'), String(value));
});

test('label width estimate ignores Thai marks and grows with length', () => {
  assert.equal(textWidth(''), 0);
  assert.ok(textWidth('25/10') >= 5 * 0.6 * AXIS_FONT_PX);
  assert.ok(textWidth('−12.5K') > textWidth('410'));
  assert.equal(textWidth('ที่'), textWidth('ท'));
});

test('date labels are thinned so they never overlap, keep the first, and stay within the budget', () => {
  assert.deepEqual(xLabelIndices(0, 10, 40), []);
  assert.deepEqual(xLabelIndices(1, 10, 40), [0]);
  assert.deepEqual(xLabelIndices(5, 200, 40), [0, 1, 2, 3, 4]);
  for (const count of [2, 3, 7, 14, 31, 60]) for (const plot of [120, 200, 400, 900, 1600]) {
    const spacing = plot / (count - 1), indices = xLabelIndices(count, spacing, 37);
    assert.equal(indices[0], 0);
    assert.ok(indices.length <= 8, `${count}@${plot}`);
    for (let i = 1; i < indices.length; i++) assert.ok((indices[i] - indices[i - 1]) * spacing >= 37 + 12, `${count}@${plot}: ${indices}`);
  }
});

test('the layout keeps every label inside the chart without overlap from 320 to 1920 px', () => {
  // Chart widths: the overview/finance card content at viewports 320-1920 (cards are narrower than the viewport).
  for (const width of [240, 260, 288, 320, 358, 480, 600, 648, 760, 980, 1200, 1500, 1880]) for (const count of [1, 2, 5, 12, 31]) {
    for (const [min, max] of [[0, 1], [-410, 2600], [-125000, 9876543], [-3.4, 41.2]]) for (const locale of ['th', 'en']) {
      const height = width < 480 ? 220 : 260;
      const layout = chartLayout({ width, height, min, max, count, xLabelSample: '25/10', locale });
      const where = `${width}px ${count}d ${min}..${max} ${locale}`;
      assert.ok(layout.plotWidth > 0 && layout.plotHeight > 0, where);
      // Y tick labels: right-aligned at left - 8, inside the chart, at least one line + gap apart vertically.
      for (const tick of layout.ticks) assert.ok(layout.left - 8 - textWidth(tick.label) >= 0, `${where}: ${tick.label} clipped`);
      const ys = layout.ticks.map(t => layout.y(t.value));
      for (let i = 1; i < ys.length; i++) assert.ok(ys[i - 1] - ys[i] >= AXIS_FONT_PX + 4, `${where}: ticks too close`);
      assert.ok(Math.min(...ys) - AXIS_FONT_PX >= 0, `${where}: top tick clipped`);
      assert.ok(layout.ticks.every(t => !t.label.includes('-')), `${where}: ASCII hyphen`);
      // Date labels: centred on their point, inside [0, width], below the plot and inside the height.
      const half = textWidth('25/10') / 2;
      for (const i of layout.labels) assert.ok(layout.x(i) - half >= 0 && layout.x(i) + half <= width, `${where}: date label ${i} clipped`);
      assert.ok(layout.xLabelY <= height && layout.xLabelY - AXIS_FONT_PX > layout.plotBottom, where);
      for (const value of [min, max]) assert.ok(layout.y(value) >= layout.top - 0.001 && layout.y(value) <= layout.plotBottom + 0.001, `${where}: ${value} off the plot`);
    }
  }
});

test('both line charts draw at 1 user unit = 1 CSS px with the shared axis layout (F1)', () => {
  for (const file of ['web/src/app/components/overview-charts.tsx', 'web/src/app/components/finance-chart.tsx']) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /lib\/chart-axis/, file);
    assert.match(source, /useChartWidth\(/, file);
    assert.match(source, /viewBox=\{`0 0 \$\{layout\.width\} \$\{layout\.height\}`\}/, file);
    assert.doesNotMatch(source, /viewBox="0 0 (720|680) /, `${file}: fixed viewBox scales 12px text down`);
    assert.doesNotMatch(source, /notation: 'compact'/, `${file}: tick numbers go through axisNumber()`);
  }
  const marks = readFileSync('web/src/app/components/chart-marks.tsx', 'utf8');
  assert.match(marks, /ResizeObserver/);
  assert.match(marks, /Math\.floor\(/, 'the viewBox width rounds down so the drawing never scales below 1:1');
});
