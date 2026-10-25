import test from 'node:test';
import assert from 'node:assert/strict';
import { createChat, historyGroup, localChatStorage, parseArchive, sessionTitle, validContext } from '../web/src/lib/assistant-sessions.ts';
import { contextPreset, monthContext, resolveChatContext } from '../web/src/lib/assistant-context.ts';

const context = { start: '2026-10-01', end: '2026-10-17', sku: null };
test('chat archive saves, restores, deletes and isolates storage keys', () => {
  const map = new Map(), storage = { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
  const a = localChatStorage('account-a/store-a', storage), b = localChatStorage('account-b/store-a', storage);
  const chat = createChat(context, '2026-10-17T00:00:00Z'); chat.title = 'กำไรเดือนนี้'; chat.draft = 'ถามต่อ';
  chat.turns.push({ id: 'turn', question: 'กำไร', context, createdAt: chat.createdAt, state: 'pending' });
  a.save({ version: 1, activeId: chat.id, sessions: [chat] });
  assert.equal(a.load().activeId, chat.id); assert.equal(a.load().sessions[0].draft, 'ถามต่อ');
  assert.equal(a.load().sessions[0].turns[0].state, 'stopped');
  assert.equal(b.load().sessions.length, 0); assert.equal(a.delete(chat.id).sessions.length, 0);
});
test('invalid storage is rejected rather than silently overwriting history', () => {
  assert.throws(() => parseArchive('{bad'));
  assert.throws(() => parseArchive('{"version":2,"sessions":[]}'));
  assert.equal(validContext({ ...context, start: '2026-02-30' }), false);
  assert.equal(validContext({ ...context, end: '2026-09-30' }), false);
  const storage = { getItem: () => null, setItem() { throw Error('quota'); } };
  assert.throws(() => localChatStorage('a', storage).save({ version: 1, activeId: null, sessions: [] }), /quota/);
});
test('Thai titles shorten by Unicode code point and groups use Bangkok dates', () => {
  assert.equal(sessionTitle('  กำไร   เดือนนี้  '), 'กำไร เดือนนี้');
  assert.ok(sessionTitle('กำไร'.repeat(30)).endsWith('…'));
  assert.equal(historyGroup('2026-10-16T18:00:00Z', '2026-10-17'), 'today');
  assert.equal(historyGroup('2026-10-16T00:00:00Z', '2026-10-17'), 'yesterday');
  assert.equal(historyGroup('2026-10-12T00:00:00Z', '2026-10-17'), 'week');
  assert.equal(historyGroup('2026-10-01T00:00:00Z', '2026-10-17'), 'older');
});
test('date and product defaults resolve without choosing a random first product', () => {
  assert.deepEqual(monthContext('2024-02'), { start: '2024-02-01', end: '2024-02-29', sku: null });
  assert.deepEqual(contextPreset('lastWeek', '2026-10-17'), { start: '2026-10-05', end: '2026-10-11', sku: null });
  const products = [{ sku: 'TEE-01', name: 'เสื้อคอตตอน' }, { sku: 'BAG-02', name: 'กระเป๋าผ้า' }];
  const result = resolveChatContext('กำไรเสื้อคอตตอนสัปดาห์ที่แล้ว', context, products, '2026-10-17');
  assert.deepEqual(result, { start: '2026-10-05', end: '2026-10-11', sku: 'TEE-01' });
  assert.equal(resolveChatContext('กำไรทุกสินค้าเดือนนี้', result, products, '2026-10-17').sku, null);
  assert.deepEqual(resolveChatContext('profit 2026-09', context, products, '2026-10-17'), { start: '2026-09-01', end: '2026-09-30', sku: null });
  assert.deepEqual(context, { start: '2026-10-01', end: '2026-10-17', sku: null });
});

test('history restores more than 100 chats and 200 turns without an application quota',()=>{
 const sessions=Array.from({length:101},()=>createChat(context,'2026-10-25T00:00:00Z'));
 sessions[0].turns=Array.from({length:201},(_,i)=>({id:String(i),question:'กำไร',context,createdAt:sessions[0].createdAt,state:'complete'}));
 const restored=parseArchive(JSON.stringify({version:1,activeId:sessions[0].id,sessions}));
 assert.equal(restored.sessions.length,101);assert.equal(restored.sessions[0].turns.length,201);
});
