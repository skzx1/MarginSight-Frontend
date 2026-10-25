import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('question picker ships exactly 100 distinct reviewed questions in 10 usable categories',async()=>{
 const bank=JSON.parse(await readFile(new URL('../web/src/lib/merchant-questions.json',import.meta.url),'utf8'));assert.equal(bank.version,'merchant-questions-v1');assert.equal(bank.questions.length,100);assert.equal(new Set(bank.questions.map(q=>q.id)).size,100);assert.equal(new Set(bank.questions.map(q=>q.text)).size,100);const groups=new Map();for(const q of bank.questions){groups.set(q.category,(groups.get(q.category)??0)+1);assert.ok(q.categoryLabel&&q.text.length<1500);assert.equal(typeof q.requiresProduct,'boolean');}assert.equal(groups.size,10);for(const n of groups.values())assert.equal(n,10);
});
