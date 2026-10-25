import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createChat } from '../web/src/lib/assistant-sessions.ts';
import { recentChats } from '../web/src/lib/assistant-arrival.ts';

const context = { start: '2026-10-01', end: '2026-10-24', sku: null };
const used = (i, at = `2026-10-${String(1 + (i % 24)).padStart(2, '0')}T0${i % 10}:00:00Z`) => {
  const chat = createChat(context, at); chat.title = `chat ${i}`;
  chat.turns.push({ id: `t${i}`, question: 'q', context, createdAt: at, state: 'complete' });
  return chat;
};

test('ask from a product always opens a new prepared chat (no saved-chat limit since a8bcfa0)', () => {
  const screen = readFileSync('web/src/app/screens/assistant.tsx', 'utf8');
  const ask = screen.slice(screen.indexOf("chat.draft = locale === 'th' ? 'สินค้านี้"), screen.indexOf('onDraftHandled();'));
  assert.match(ask, /setArchive\(old => \(\{ \.\.\.old, activeId: chat\.id, sessions: \[chat, \.\.\.old\.sessions\] \}\)\)/);
  assert.doesNotMatch(screen, /askLimit|SESSION_LIMIT|>= 100/);
});
test('A7: recent chats are at most six saved chats, newest first, without the open one or empty chats', () => {
  const sessions = Array.from({ length: 9 }, (_, i) => used(i, `2026-10-0${i + 1}T00:00:00Z`));
  sessions.push(createChat(context));
  const open = sessions[8].id, recent = recentChats(sessions, open);
  assert.equal(recent.length, 6);
  assert.ok(!recent.some(chat => chat.id === open));
  assert.deepEqual(recent.map(chat => chat.title), ['chat 7', 'chat 6', 'chat 5', 'chat 4', 'chat 3', 'chat 2']);
  assert.deepEqual(recentChats([], null), []);
});
test('A4: a suggested question fills the composer and focuses it; it never sends', () => {
  const screen = readFileSync('web/src/app/screens/assistant.tsx', 'utf8');
  const welcome = screen.slice(screen.indexOf('const renderWelcome'), screen.indexOf('return <div className={s.root}'));
  assert.ok(welcome.length > 0);
  assert.match(welcome, /onClick=\{\(\) => fillDraft\(t\(key\)\)\}/);
  assert.doesNotMatch(welcome, /\bsend\(/);
  const fill = screen.slice(screen.indexOf('const fillDraft'), screen.indexOf('const recentTime'));
  assert.match(fill, /draft: text/);
  assert.match(fill, /focusComposer\(\)/);
  assert.doesNotMatch(fill, /\bsend\(|\brun\(/);
});
