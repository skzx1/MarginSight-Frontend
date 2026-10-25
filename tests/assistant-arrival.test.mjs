import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createChat } from '../web/src/lib/assistant-sessions.ts';
import { recentChats, SESSION_LIMIT, startAskChat } from '../web/src/lib/assistant-arrival.ts';
import { assistantCopy } from '../web/src/app/components/assistant-copy.ts';

const context = { start: '2026-10-01', end: '2026-10-24', sku: null };
const used = (i, at = `2026-10-${String(1 + (i % 24)).padStart(2, '0')}T0${i % 10}:00:00Z`) => {
  const chat = createChat(context, at); chat.title = `chat ${i}`;
  chat.turns.push({ id: `t${i}`, question: 'q', context, createdAt: at, state: 'complete' });
  return chat;
};
const ask = () => { const chat = createChat({ ...context, sku: 'SKU-1' }); chat.draft = 'สินค้านี้เหลือกำไรเท่าไร?'; return chat; };

test('ask from a product opens a new prepared chat below the limit', () => {
  const archive = { version: 1, activeId: null, sessions: [used(1)] }, chat = ask();
  const next = startAskChat(archive, chat);
  assert.equal(next.activeId, chat.id);
  assert.equal(next.sessions.length, 2);
  assert.equal(next.sessions[0].draft, chat.draft);
});
test('A12: at 100 saved chats the ask is not silently dropped; null tells the screen to show the notice and open history', () => {
  const full = { version: 1, activeId: 'x', sessions: Array.from({ length: SESSION_LIMIT }, (_, i) => used(i)) };
  assert.equal(SESSION_LIMIT, 100);
  assert.equal(startAskChat(full, ask()), null);
  const screen = readFileSync('web/src/app/screens/assistant.tsx', 'utf8');
  assert.match(screen, /if \(!startAskChat\(archive, chat\)\) \{ setNotice\('askLimit'\); setPanel\('sheet'\); return; \}/);
  assert.equal(assistantCopy.askLimit.length, 2);
});
test('A12: at the limit an unused empty chat is reused for the ask instead', () => {
  const sessions = Array.from({ length: SESSION_LIMIT }, (_, i) => used(i)), empty = createChat(context);
  sessions[40] = empty;
  const chat = ask(), next = startAskChat({ version: 1, activeId: sessions[0].id, sessions }, chat);
  assert.equal(next.sessions.length, SESSION_LIMIT);
  assert.equal(next.activeId, empty.id);
  assert.equal(next.sessions[40].draft, chat.draft);
  assert.equal(next.sessions[40].context.sku, 'SKU-1');
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
