import test from 'node:test';
import assert from 'node:assert/strict';
import { bangkokDayLabel, bangkokHour, greetingBucket } from '../web/src/lib/greeting.ts';
import { assistantCopy } from '../web/src/app/components/assistant-copy.ts';

// Bangkok is UTC+7 all year (no daylight saving), so a Bangkok wall-clock time is a fixed UTC instant.
const bangkok = (h, m = 0) => new Date(Date.UTC(2026, 9, 24, h - 7, m));

test('four Bangkok time-of-day buckets', () => {
  assert.equal(greetingBucket(bangkok(6)), 'morning');
  assert.equal(greetingBucket(bangkok(13)), 'afternoon');
  assert.equal(greetingBucket(bangkok(18)), 'evening');
  assert.equal(greetingBucket(bangkok(23)), 'late');
});
test('bucket edges: 04:59 late, 05:00 morning, 11:59 morning, 12:00 afternoon, 16:59/17:00, 20:59/21:00', () => {
  assert.equal(greetingBucket(bangkok(4, 59)), 'late');
  assert.equal(greetingBucket(bangkok(5)), 'morning');
  assert.equal(greetingBucket(bangkok(11, 59)), 'morning');
  assert.equal(greetingBucket(bangkok(12)), 'afternoon');
  assert.equal(greetingBucket(bangkok(16, 59)), 'afternoon');
  assert.equal(greetingBucket(bangkok(17)), 'evening');
  assert.equal(greetingBucket(bangkok(20, 59)), 'evening');
  assert.equal(greetingBucket(bangkok(21)), 'late');
  assert.equal(greetingBucket(bangkok(0)), 'late');
});
test('a UTC instant uses Bangkok time: 23:30Z is 06:30 the next morning in Bangkok', () => {
  const date = new Date('2026-10-24T23:30:00Z');
  assert.equal(bangkokHour(date), 6);
  assert.equal(greetingBucket(date), 'morning');
  assert.match(bangkokDayLabel(date, 'en'), /25 Oct 2026/);
});
test('the result does not depend on the process time zone', () => {
  const saved = process.env.TZ, instants = [bangkok(6), bangkok(13), bangkok(18), bangkok(23), new Date('2026-10-24T23:30:00Z')];
  try {
    const results = ['UTC', 'America/New_York', 'Asia/Tokyo'].map(zone => { process.env.TZ = zone; return instants.map(greetingBucket); });
    for (const r of results) assert.deepEqual(r, ['morning', 'afternoon', 'evening', 'late', 'morning']);
  } finally { if (saved === undefined) delete process.env.TZ; else process.env.TZ = saved; }
});
test('greeting copy: one entry per bucket, the Thai question has exactly one marked break and no break inside "ยังไง"', () => {
  for (const key of ['greetingMorning', 'greetingAfternoon', 'greetingEvening', 'greetingLate', 'greetingAsk']) assert.equal(assistantCopy[key].length, 2, key);
  const parts = assistantCopy.greetingAsk[0].split('\u200B');
  assert.equal(parts.length, 2);
  assert.ok(parts.some(part => part.includes('ยังไงบ้าง')));
  assert.ok(!assistantCopy.greetingAsk[1].includes('\u200B'));
});
