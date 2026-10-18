import test from 'node:test';
import assert from 'node:assert/strict';
import { historySessions } from '../web/src/lib/assistant-history.ts';

const chat = (id, title, date, turns = [], draft = '') => ({ id, title, createdAt: date, updatedAt: date, turns, draft });
test('history hides untouched empty chats and sorts saved conversations without mutating them', () => {
  const items = [chat('empty', '', '2026-10-18'), chat('old','ยอดขาย','2026-10-16'), chat('new','กำไร','2026-10-18'), chat('draft','','2026-10-17',[],'ร่างคำถาม')];
  const original = structuredClone(items);
  assert.deepEqual(historySessions(items).map(s => s.id), ['new','draft','old']);
  assert.deepEqual(items, original);
});
test('history search matches Thai/English titles, questions, replies and drafts literally', () => {
  const items = [chat('a','Cotton [15%]','2026-10-18',[{question:'ลดราคาสินค้า',reply:{text:'กำไรที่ตรวจแล้ว'}}]),chat('b','ยอดขาย','2026-10-17',[],'ร่างคำถาม')];
  for (const query of [' cotton ', '[15%]', 'ลดราคา', 'กำไรที่ตรวจ']) assert.deepEqual(historySessions(items, query).map(s => s.id), ['a']);
  assert.deepEqual(historySessions(items,'ร่าง').map(s => s.id), ['b']);
  assert.deepEqual(historySessions(items,'<script>'), []);
});
