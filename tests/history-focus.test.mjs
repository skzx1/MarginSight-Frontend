import test from 'node:test';
import assert from 'node:assert/strict';
import { focusAfterDelete } from '../web/src/lib/history-focus.ts';

test('R2 §D: after a delete, focus moves to the row at the same index (the next one)', () => {
  assert.equal(focusAfterDelete(['a', 'b', 'c'], 'b', ['a', 'c']), 'c');
  assert.equal(focusAfterDelete(['a', 'b', 'c'], 'a', ['b', 'c']), 'b');
});
test('R2 §D: deleting the last row focuses the previous one; deleting the only row returns null (New chat)', () => {
  assert.equal(focusAfterDelete(['a', 'b', 'c'], 'c', ['a', 'b']), 'b');
  assert.equal(focusAfterDelete(['a'], 'a', []), null);
  assert.equal(focusAfterDelete([], 'a', ['b']), null);
  assert.equal(focusAfterDelete(['a', 'b'], 'x', ['a', 'b']), null);
});
test('R2 §D: neighbours missing from the rendered list are skipped (filtered list, re-opened sheet)', () => {
  assert.equal(focusAfterDelete(['a', 'b', 'c', 'd'], 'b', ['a', 'd']), 'd');
  assert.equal(focusAfterDelete(['a', 'b', 'c', 'd'], 'c', ['a']), 'a');
  assert.equal(focusAfterDelete(['a', 'b', 'c'], 'b', ['z']), null);
});
