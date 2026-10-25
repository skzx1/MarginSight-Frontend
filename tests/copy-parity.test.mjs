import test from 'node:test';
import assert from 'node:assert/strict';
import { assistantCopy } from '../web/src/app/components/assistant-copy.ts';
import { catalogCopy } from '../web/src/app/components/product-catalog-copy.ts';

const filled = text => typeof text === 'string' && text.trim().length > 0;

test('every assistant message has a Thai and English entry', () => {
  assert.ok(Object.keys(assistantCopy).length > 0);
  for (const [key, pair] of Object.entries(assistantCopy)) {
    assert.ok(Array.isArray(pair), key);
    assert.equal(pair.length, 2, key);
    assert.ok(pair.every(filled), key);
  }
});
test('product catalog copy has the same keys in Thai and English, all filled', () => {
  const th = Object.keys(catalogCopy.th).sort();
  const en = Object.keys(catalogCopy.en).sort();
  assert.ok(th.length > 0);
  assert.deepEqual(th, en);
  for (const locale of ['th', 'en']) {
    for (const [key, text] of Object.entries(catalogCopy[locale])) assert.ok(filled(text), `${locale}.${key}`);
  }
  assert.deepEqual(Object.keys(catalogCopy).sort(), ['en', 'th']);
});
