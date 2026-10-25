import test from 'node:test';
import assert from 'node:assert/strict';
import { enterAction, shouldSend } from '../web/src/lib/composer-keys.ts';

const desktop = { composing: false, pending: false, coarse: false };
const enter = { key: 'Enter', shiftKey: false, isComposing: false, keyCode: 13 };

test('desktop: Enter sends, Shift+Enter and other keys keep the default newline/typing', () => {
  assert.equal(shouldSend(enter, desktop), true);
  assert.equal(enterAction({ ...enter, shiftKey: true }, desktop), 'default');
  assert.equal(enterAction({ key: 'a', shiftKey: false, keyCode: 65 }, desktop), 'default');
});
test('IME (A1): the Enter that commits a composition never sends', () => {
  assert.equal(enterAction({ ...enter, isComposing: true }, desktop), 'default');
  // WebKit can report isComposing=false for the committing Enter, with keyCode 229.
  assert.equal(enterAction({ ...enter, keyCode: 229 }, desktop), 'default');
  // compositionstart seen, compositionend not yet settled.
  assert.equal(enterAction(enter, { ...desktop, composing: true }), 'default');
  assert.equal(shouldSend({ ...enter, isComposing: true }, desktop), false);
});
test('while a reply is pending, Enter does nothing (no send, no newline)', () => {
  assert.equal(enterAction(enter, { ...desktop, pending: true }), 'hold');
  assert.equal(shouldSend(enter, { ...desktop, pending: true }), false);
});
test('touch keyboards (A2, pointer: coarse): Enter inserts a newline and never sends', () => {
  const coarse = { ...desktop, coarse: true };
  assert.equal(enterAction(enter, coarse), 'default');
  assert.equal(enterAction(enter, { ...coarse, pending: true }), 'default');
  assert.equal(shouldSend(enter, coarse), false);
});
