import test from 'node:test';
import assert from 'node:assert/strict';
import { money } from '../web/src/lib/format.ts';
import { copy } from '../web/src/lib/copy.ts';
import { baht, deltaParts, percent, plKind, profitParts, signedBaht, signedPercent } from '../web/src/lib/signed-money.ts';

const MINUS = '−';

test('profit and loss levels carry a label and a sign in Thai and English', () => {
  assert.equal(profitParts(11830, 'th').text, 'กำไร +฿118.30');
  assert.equal(profitParts(11830, 'en').text, 'Profit +฿118.30');
  assert.equal(profitParts(-5300, 'th').text, 'ขาดทุน −฿53.00');
  assert.equal(profitParts(-5300, 'en').text, 'Loss −฿53.00');
  assert.equal(profitParts(-40, 'th').text, 'ขาดทุน −฿0.40');
  assert.equal(profitParts(-123456789, 'en').text, 'Loss −฿1,234,567.89');
  assert.equal(profitParts(-123456789, 'th').text, 'ขาดทุน −฿1,234,567.89');
  const loss = profitParts(-5300, 'th');
  assert.deepEqual([loss.kind, loss.label, loss.amount], ['loss', 'ขาดทุน', '−฿53.00']);
});
test('zero, negative zero and missing values', () => {
  const zero = profitParts(0);
  assert.equal(zero.text, '฿0.00'); assert.equal(zero.label, null); assert.equal(zero.kind, 'zero');
  const negativeZero = profitParts(-0);
  assert.equal(negativeZero.kind, 'zero'); assert.equal(negativeZero.text, '฿0.00');
  assert.equal(money(-0), '-0.00', 'documented fact: money() itself is unchanged and still prints -0.00');
  assert.equal(signedBaht(-0), '฿0.00'); assert.equal(baht(-0), '฿0.00');
  for (const value of [null, undefined, Number.NaN]) {
    const missing = profitParts(value);
    assert.equal(missing.text, '—'); assert.equal(missing.kind, 'missing'); assert.equal(missing.label, null);
    assert.equal(signedBaht(value), '—'); assert.equal(baht(value), '—');
  }
  assert.equal(profitParts(null, 'th').spoken, copy.profitUnavailable[0]);
  assert.equal(profitParts(null, 'en').spoken, copy.profitUnavailable[1]);
  assert.equal(plKind(-0.4), 'zero');
});
test('spoken and phrase forms', () => {
  assert.equal(profitParts(-5300, 'th').spoken, 'ขาดทุน 53.00 บาท');
  assert.equal(profitParts(-5300, 'en').spoken, 'Loss of 53.00 baht');
  assert.equal(profitParts(11830, 'th').spoken, 'กำไร 118.30 บาท');
  assert.equal(profitParts(11830, 'en').spoken, 'Profit of 118.30 baht');
  assert.equal(profitParts(0, 'en').spoken, '0.00 baht');
  for (const locale of ['th', 'en']) assert.ok(!profitParts(-5300, locale).spoken.includes(MINUS) && !profitParts(-5300, locale).spoken.includes('-'));
  assert.equal(profitParts(-5300, 'th').phrase, 'ขาดทุน ฿53.00');
  assert.equal(profitParts(11830, 'th').phrase, 'กำไร ฿118.30');
  assert.equal(profitParts(-5300, 'en').phrase, 'Loss of ฿53.00');
});
test('signed and plain amounts', () => {
  assert.equal(signedBaht(11830), '+฿118.30');
  assert.equal(signedBaht(-5300, 'en'), '−฿53.00');
  assert.equal(baht(11830), '฿118.30');
  assert.equal(baht(-5300), '−฿53.00');
});
test('every negative amount uses U+2212 and no hyphen; positives keep money() digits', () => {
  let seed = 20261025;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648);
  for (let i = 0; i < 200; i++) {
    const value = -(1 + next() % 1e11);
    for (const locale of ['th', 'en']) {
      for (const output of [profitParts(value, locale).text, profitParts(value, locale).amount, signedBaht(value, locale), baht(value, locale)]) {
        assert.ok(output.includes(MINUS), output);
        assert.ok(!output.includes('-'), output);
      }
      const positive = -value;
      assert.equal(profitParts(positive, locale).amount, '+฿' + money(positive, locale));
      assert.equal(signedBaht(positive, locale), '+฿' + money(positive, locale));
    }
  }
});
test('percentages round first and only non-zero values carry a sign', () => {
  assert.equal(signedPercent(12.44), '+12.4%');
  assert.equal(signedPercent(-3.21), '−3.2%');
  assert.equal(signedPercent(-0.04), '0.0%');
  assert.equal(signedPercent(0.04), '0.0%');
  assert.equal(signedPercent(-0), '0.0%');
  assert.equal(signedPercent(null), '—');
  assert.equal(signedPercent(undefined), '—');
  assert.equal(percent(12.44), '12.4%');
  assert.equal(percent(-3.21), '−3.2%');
  assert.equal(percent(-0.04), '0.0%');
});
test('deltas: direction on the rounded value, neutral when flat, baseline text when missing', () => {
  assert.deepEqual(deltaParts(12.44, 'pct', 'th'), { dir: 'up', text: '+12.4% · เทียบช่วงก่อนหน้า', spoken: 'เพิ่มขึ้น 12.4% เทียบช่วงก่อนหน้า' });
  assert.deepEqual(deltaParts(-3.21, 'pct', 'en'), { dir: 'down', text: '−3.2% · vs previous period', spoken: 'down 3.2% vs previous period' });
  assert.equal(deltaParts(-3.21, 'pct', 'th').spoken, 'ลดลง 3.2% เทียบช่วงก่อนหน้า');
  assert.equal(deltaParts(1.26, 'pp', 'th').text, '+1.3 จุด · เทียบช่วงก่อนหน้า');
  assert.equal(deltaParts(-1.26, 'pp', 'en').text, '−1.3 pp · vs previous period');
  for (const value of [0, -0, -0.04, 0.04]) {
    for (const [locale, flat] of [['th', 'ไม่เปลี่ยนแปลง'], ['en', 'no change']]) {
      const parts = deltaParts(value, 'pct', locale);
      assert.equal(parts.dir, 'flat');
      assert.equal(parts.spoken, flat);
      assert.equal(parts.text, '0.0% · ' + flat);
      assert.ok(!/[▲▼+\-−]/.test(parts.text), parts.text);
    }
  }
  for (const [locale, index] of [['th', 0], ['en', 1]]) {
    assert.deepEqual(deltaParts(null, 'pct', locale), { dir: 'none', text: copy.noBaseline[index], spoken: copy.noBaseline[index] });
  }
  for (const value of [-0.06, -5, -123.45]) assert.ok(!deltaParts(value, 'pct', 'en').text.includes('-'));
});
test('the assistant clipboard line for a loss is the visible level text', () => {
  // assistant.tsx copy(): `${label}: ${profitParts(profit, locale).text}`
  assert.equal(`Net profit / loss: ${profitParts(-5300, 'en').text}`, 'Net profit / loss: Loss −฿53.00');
  assert.ok(profitParts(-5300, 'th').text.startsWith('ขาดทุน −฿'));
});
