import test from 'node:test';
import assert from 'node:assert/strict';
import {answerQuestion} from '../web/src/lib/assistant-service.ts';
import {answerReferenceLabel} from '../web/src/lib/assistant-context.ts';
import {createChat,parseArchive} from '../web/src/lib/assistant-sessions.ts';
import {chatMarketplaceDraft} from '../web/src/lib/marketplace-context.ts';
const context={start:'2026-09-01',end:'2026-10-25',sku:'ASAW'};
const input=question=>({base:'/stores/QA',question,context,products:[],locale:'th',signal:new AbortController().signal});
const catalog={answer:'ส่วนต่างก่อนค่าใช้จ่ายอื่น 80.00 บาท ยังไม่ใช่กำไรสุทธิ',provider:'catalog-calculator',decision:{route:'FEE_PIPELINE',confidence:.95},catalogScenario:{basis:'CATALOG',at:'2026-10-25T10:00:00.000Z',discountPct:20,originalPriceSatang:25000,discountedPriceSatang:20000,unitCostSatang:12000,differenceBeforeExpensesSatang:8000,netProfitSatang:null},note:'ใช้สินค้าปัจจุบัน ไม่ใช่กำไรสุทธิ'};
const marketplace={...chatMarketplaceDraft(),platform:'shopee',campaigns:['shopee-prime'],commission:'10',commissionVat:'INCLUDED',payment:'3',confirmed:true};

test('every discount goes through the server router; catalog references never become net profit',async()=>{
 const calls=[];const reply=await answerQuestion(input('ลดราคา 20%'),async(path,body)=>{calls.push([path,body]);return catalog;});
 assert.deepEqual(calls,[['/stores/QA/assistant',{mode:'chat',message:'ลดราคา 20%',history:[],context,locale:'th'}]]);
 assert.equal(reply.catalogReferenceAt,catalog.catalogScenario.at);assert.equal(reply.source,'fallback');assert.equal(reply.result,undefined);assert.equal(reply.calculation,undefined);assert.match(reply.note,/ไม่ใช่กำไรสุทธิ/);
 assert.equal(reply.catalogSummary.discountedPriceSatang,20000);assert.equal(reply.catalogSummary.netProfitSatang,null);
});

test('campaign assumptions are serialized with the routed request; no extra options or financial data request',async()=>{
 const calls=[];const reply=await answerQuestion({...input('แคมเปญนี้เหลือเท่าไร'),context:{...context,marketplace}},async(path,body)=>{calls.push([path,body]);return catalog;});
 assert.equal(calls.length,1);assert.equal(calls[0][0],'/stores/QA/assistant');assert.equal(calls[0][1].mode,'chat');assert.deepEqual(calls[0][1].scenario.campaigns,['shopee-prime']);assert.equal(calls[0][1].scenario.commissionRateBps,1000);assert.equal(calls[0][1].context.marketplace,undefined);assert.equal(reply.context.marketplace.confirmed,true);
});

test('normal chat has the same router entry point and no client tool requests, even with campaign selected',async()=>{
 const calls=[];const reply=await answerQuestion({...input('สวัสดีครับ'),context:{...context,marketplace}},async(path,body)=>{calls.push([path,body]);return {answer:'สวัสดีครับ',provider:'normal-chat',decision:{route:'NORMAL_CHAT',confidence:1}};});
 assert.equal(calls.length,1);assert.equal(calls[0][0],'/stores/QA/assistant');assert.equal(reply.source,'assistant');assert.equal(reply.result,undefined);
});

test('monthly profit displays API-owned recorded results and never derives money from current products',async()=>{
 const calls=[];const reply=await answerQuestion({...input('กำไรเดือนนี้เท่าไร'),products:[{sku:'ASAW',sellingPriceSatang:999999,quantity:1000}]},async(path,body)=>{calls.push([path,body]);return {answer:'กำไรที่บันทึก',provider:'calculator',decision:{route:'FEE_PIPELINE',confidence:.95},result:{profitSatang:3000,revenueSatang:10000,count:1}};});
 assert.equal(calls.length,1);assert.equal(calls[0][0],'/stores/QA/assistant');assert.equal(reply.result.profitSatang,3000);assert.equal(reply.result.revenueSatang,10000);assert.equal(reply.catalogReferenceAt,undefined);
});

test('missing SKU and no orders are clarified by the server, never replaced with zero or a local price calculation',async()=>{
 const calls=[];const reply=await answerQuestion({...input('ลดราคา 20%'),context:{...context,sku:null}},async(path,body)=>{calls.push([path,body]);return {answer:'ต้องการลองกับสินค้า SKU ไหนครับ?',provider:'clarify',decision:{route:'FEE_PIPELINE',confidence:.95}};});
 assert.equal(calls.length,1);assert.equal(reply.source,'notice');assert.equal(reply.result,undefined);
});

test('only last five prior messages go to the router; product prices and quantities never enter the model payload',async()=>{
 let sent;await answerQuestion({...input('แล้ว Lazada ล่ะ'),history:Array.from({length:8},(_,i)=>({role:'user',text:String(i)})),products:[{sku:'ASAW',sellingPriceSatang:999999,quantity:1000}]},async(path,body)=>{sent=body;return {answer:'โปรดระบุหมวด',provider:'fee-reference',decision:{route:'FEE_PIPELINE',confidence:.95}};});
 assert.deepEqual(sent.history.map(m=>m.text),['3','4','5','6','7']);assert.equal(sent.products,undefined);
});

test('campaign assumptions survive history, malformed assumptions are rejected, and catalog uses current reference time',()=>{
 const chat=createChat({...context,marketplace});chat.turns=[{id:'C1',question:'ลดราคา 20%',context:structuredClone(chat.context),createdAt:chat.createdAt,state:'complete',reply:{text:'อิงแคมเปญ',source:'fallback',context:structuredClone(chat.context),catalogReferenceAt:catalog.catalogScenario.at}}];
 const archive={version:1,activeId:chat.id,sessions:[chat]},parsed=parseArchive(JSON.stringify(archive));assert.deepEqual(parsed.sessions[0].turns[0].context.marketplace.campaigns,['shopee-prime']);assert.match(answerReferenceLabel(chat.context,catalog.catalogScenario.at,'th'),/Shopee/);assert.match(answerReferenceLabel(context,catalog.catalogScenario.at,'th'),/ข้อมูลสินค้าปัจจุบัน/);
 chat.context.marketplace={...marketplace,campaigns:Array(20).fill('bad')};assert.throws(()=>parseArchive(JSON.stringify(archive)),/INVALID_CHAT_SESSION/);
});

test('invalid catalog timestamps cannot enter saved chat references',()=>{
 const chat=createChat(context);chat.turns=[{id:'T1',question:'ลดราคา 20%',context,createdAt:chat.createdAt,state:'complete',reply:{text:'ส่วนต่าง',source:'fallback',context,catalogReferenceAt:'not-a-date'}}];
 assert.throws(()=>parseArchive(JSON.stringify({version:1,activeId:chat.id,sessions:[chat]})),/INVALID_CATALOG_REFERENCE/);
});
