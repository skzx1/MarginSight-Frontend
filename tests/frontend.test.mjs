import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBaht, bangkokDate, dateAt, money } from '../web/src/lib/format.ts';
import { copy } from '../web/src/lib/copy.ts';

test('THB form input preserves satang and rejects ambiguous amounts', () => {
  assert.equal(parseBaht('154.50'), 15450);
  assert.equal(parseBaht('0.01'), 1);
  assert.equal(parseBaht('0'), 0);
  for (const input of ['', '1.005', '-1', '1e3', '1,000', 'NaN', '9007199254740992']) {
    assert.throws(() => parseBaht(input), /MONEY_INPUT/);
  }
});
test('effective dates use the Bangkok calendar on both sides of midnight', () => {
  assert.equal(bangkokDate('2026-10-15T16:59:59Z'), '2026-10-15');
  assert.equal(bangkokDate('2026-10-15T17:00:00Z'), '2026-10-16');
  assert.equal(dateAt('2026-10-16'), '2026-10-15T17:00:00.000Z');
});
test('missing money stays distinct from confirmed zero', () => {
  assert.equal(money(null), '—');
  assert.equal(money(undefined), '—');
  assert.equal(money(0), '0.00');
  assert.equal(money(-1410, 'en'), '-14.10');
});
test('every UI message has a Thai and English entry', () => {
  for (const [key, pair] of Object.entries(copy)) {
    assert.equal(pair.length, 2, key);
    assert.ok(pair.every(text => typeof text === 'string' && text.trim().length), key);
  }
});
