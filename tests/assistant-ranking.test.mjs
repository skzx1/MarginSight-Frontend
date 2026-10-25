import test from 'node:test';
import assert from 'node:assert/strict';
import {requestedRank,rankingFollowup} from '../web/src/lib/assistant-ranking.ts';
import {answerQuestion} from '../web/src/lib/assistant-service.ts';
const context={start:'2026-10-01',end:'2026-10-25',sku:'CUP-003'};
const values=[['BAG-001',900],['BAG-002',5420],['CUP-003',7720],['CASE-004',5020],['CAP-005',4720],['BOOK-006',3020]];
const rows=values.map(([sku,profitSatang])=>({orderId:sku,platform:'mock',orderAt:'2026-10-15T05:00:00Z',items:[{sku}],revenueSatang:20000,profitSatang,cogsSatang:10000,feeSatang:2000,sellerShippingSatang:0,packagingSatang:0,adsSatang:0,status:'COMPLETE',missingFields:[]}));
function ask(question,results=rows){return answerQuestion({base:'/stores/Q',question,context,products:[],locale:'th',signal:new AbortController().signal},async(path,body)=>body?.mode==='chat'?{kind:'STORE_DATA'}:{totalOrders:results.length,results});}
test('ordinal parsing accepts Thai digits/words and uses the last explicit requested rank',()=>{
 for(const q of ['อันดับ 2','อันดับที่ 2','อันดับที่สอง','อันดับ ๒','rank 2','second highest'])assert.equal(requestedRank(q),2,q);
 assert.equal(requestedRank('อันดับ 2\nแล้วอันดับ 3 ล่ะ'),3);
});
test('merchant second/third-highest questions select the requested engine result, never first place',async()=>{
 const second=await ask('สินค้าไหนกำไรมากสุดในร้านอันดับ 2');assert.equal(second.result.profitSatang,5420);assert.match(second.result.label,/อันดับ 2.*BAG-002/);assert.equal(second.context.sku,null);
 const third=await ask('สินค้าตัวไหนกำไรมากที่สุดอันดับ 3');assert.equal(third.result.profitSatang,5020);assert.match(third.text,/ลำดับ 3/);
});
test('second-lowest sorts ascending and still excludes unknown profit',async()=>{
 const reply=await ask('สินค้าไหนกำไรน้อยที่สุดอันดับ 2',[...rows,{...rows[0],items:[{sku:'UNKNOWN'}],profitSatang:null,missingFields:['cost:UNKNOWN']}]);assert.equal(reply.result.profitSatang,3020);assert.match(reply.result.label,/BOOK-006/);
});
test('out-of-range and zero ranks ask for a valid rank without substituting first place',async()=>{
 for(const rank of [0,99]){const reply=await ask('สินค้าไหนกำไรมากที่สุดอันดับ '+rank);assert.equal(reply.source,'notice');assert.equal(reply.result,undefined);assert.match(reply.text,/6 รายการ/);}
});
test('ties have stable SKU ordering and mixed baskets are not mislabeled as product profit',async()=>{
 const a={...rows[0],items:[{sku:'A'}],profitSatang:1000},b={...rows[0],items:[{sku:'B'}],profitSatang:1000},mixed={...rows[0],items:[{sku:'X'},{sku:'Y'}],profitSatang:99999};const reply=await ask('สินค้าไหนกำไรมากที่สุดอันดับ 2',[b,mixed,a]);assert.match(reply.result.label,/B$/);assert.equal(reply.result.profitSatang,1000);
});
test('rank follow-ups retain the prior ranking scope and ignore a new general topic',()=>{
 const prior='สินค้าไหนกำไรมากสุดอันดับ 2';assert.equal(requestedRank(rankingFollowup('แล้วอันดับ 3 ล่ะ',prior)),3);assert.equal(requestedRank(rankingFollowup('รองลงมาล่ะ',prior)),3);assert.equal(rankingFollowup('อันดับทีมฟุตบอลโลก',prior),undefined);assert.equal(rankingFollowup('แล้วอันดับ 3','ช่วยเขียนแคปชั่น'),undefined);let repeated=prior;for(let i=0;i<250;i++)repeated=rankingFollowup('รองลงมาล่ะ',repeated);assert.ok(repeated.length<200);assert.equal(requestedRank(repeated),252);
});
