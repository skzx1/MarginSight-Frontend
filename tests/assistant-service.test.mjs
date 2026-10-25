import test from 'node:test';
import assert from 'node:assert/strict';
import {answerQuestion as routeQuestion} from '../web/src/lib/assistant-service.ts';
// Isolate recorded adapters after classification; general-chat.test covers the real preflight.
const answerQuestion=(input,api)=>routeQuestion(input,(path,body,signal)=>body?.mode==='chat'?Promise.resolve({kind:'STORE_DATA'}):api(path,body,signal));
import {isCatalogDiscountQuestion} from '../web/src/lib/assistant-routing.ts';
import {answerReferenceLabel} from '../web/src/lib/assistant-context.ts';
import {createChat,parseArchive} from '../web/src/lib/assistant-sessions.ts';
import {chatMarketplaceDraft} from '../web/src/lib/marketplace-context.ts';
const context={start:'2026-09-01',end:'2026-10-25',sku:'ASAW'};
const input=question=>({base:'/stores/QA',question,context,products:[],locale:'th',signal:new AbortController().signal});
test('discount reads current server catalog without a monthly/order dependency or client-provided money',async()=>{
 const calls=[];const api=async(path,body)=>{calls.push([path,body]);return {answer:'ส่วนต่างก่อนค่าใช้จ่ายอื่น 80.00 บาท ยังไม่ใช่กำไรสุทธิ',catalogScenario:{basis:'CATALOG',at:'2026-10-25T10:00:00.000Z'}};};
 const reply=await answerQuestion(input('ถ้าลดราคา 20% จะเหลือกำไรเท่าไร'),api);
 assert.deepEqual(calls,[['/stores/QA/assistant/catalog-discount',{message:'ถ้าลดราคา 20% จะเหลือกำไรเท่าไร',sku:'ASAW',locale:'th'}]]);
 assert.equal(reply.catalogReferenceAt,'2026-10-25T10:00:00.000Z');assert.equal(reply.result,undefined);assert.equal(reply.calculation,undefined);assert.equal(reply.source,'fallback');assert.match(reply.note,/ไม่ใช่กำไรสุทธิ/);
});

const options={version:'test',reviewedAt:'2026-10-18',platforms:[{id:'shopee',name:'Shopee',categories:[{id:'general',name:'ทั่วไป'}],campaigns:[{id:'shopee-prime',name:'PRIME'}]}]};
const marketplace={...chatMarketplaceDraft(),platform:'shopee',campaigns:['shopee-prime'],commission:'10',commissionVat:'INCLUDED',payment:'3',confirmed:true};
test('chat campaign selection is validated against Playground options and forwarded only to catalog price comparisons',async()=>{
 const calls=[];const reply=await answerQuestion({...input('ลดราคา 20%'),context:{...context,marketplace}},async(path,body)=>{calls.push([path,body]);return path.endsWith('/assistant-options')?options:{answer:'ค่าแคมเปญ',catalogScenario:{basis:'CATALOG',at:'2026-10-25T10:00:00.000Z'}};});
 assert.equal(calls[0][0],'/stores/QA/assistant-options');assert.equal(calls[1][0],'/stores/QA/assistant/catalog-discount');assert.deepEqual(calls[1][1].scenario.campaigns,['shopee-prime']);assert.equal(calls[1][1].scenario.commissionRateBps,1000);assert.equal(reply.context.marketplace.confirmed,true);
 const monthly=[];await answerQuestion({...input('กำไรเดือนนี้เท่าไร'),context:{...context,start:'2026-10-01',marketplace}},async(path,body)=>{monthly.push([path,body]);return {totalOrders:0,results:[]};});assert.deepEqual(monthly,[['/stores/QA/dashboard?month=2026-10',undefined]]);
});
test('a selected campaign can be compared at the current product price without discount wording or orders',async()=>{
 const calls=[];await answerQuestion({...input('แคมเปญนี้เหลือเท่าไร'),context:{...context,marketplace}},async(path,body)=>{calls.push([path,body]);return path.endsWith('/assistant-options')?options:{answer:'ส่วนต่างหลังค่าบริการ',catalogScenario:{basis:'CATALOG',at:'2026-10-25T10:00:00.000Z'}};});assert.equal(calls.at(-1)[0],'/stores/QA/assistant/catalog-discount');
 const absent=await answerQuestion(input('แคมเปญนี้เหลือเท่าไร'),async()=>{throw Error('CAMPAIGN_MUST_BE_SELECTED')});assert.equal(absent.source,'notice');assert.match(absent.text,/เลือกแพลตฟอร์มและแคมเปญ/);
});
test('campaign assumptions survive history with each turn and malformed assumptions are rejected',()=>{
 const chat=createChat({...context,marketplace});chat.turns=[{id:'C1',question:'ลดราคา 20%',context:structuredClone(chat.context),createdAt:chat.createdAt,state:'complete',reply:{text:'อิงแคมเปญ',source:'fallback',context:structuredClone(chat.context),catalogReferenceAt:'2026-10-25T10:00:00.000Z'}}];
 const archive={version:1,activeId:chat.id,sessions:[chat]},parsed=parseArchive(JSON.stringify(archive));assert.deepEqual(parsed.sessions[0].turns[0].context.marketplace.campaigns,['shopee-prime']);
 assert.match(answerReferenceLabel(chat.context,'2026-10-25T10:00:00.000Z','th'),/Shopee/);
 chat.context.marketplace={...marketplace,campaigns:Array(20).fill('bad')};assert.throws(()=>parseArchive(JSON.stringify(archive)),/INVALID_CHAT_SESSION/);
});
test('discount asks for a product, while monthly profit and declining-sales reports remain order questions',async()=>{
 let calls=0;const reply=await answerQuestion({...input('ลดราคา 20%'),context:{...context,sku:null}},async()=>{calls++;throw Error('UNEXPECTED_REQUEST')});
 assert.equal(calls,0);assert.equal(reply.source,'notice');assert.match(reply.text,/ไม่ต้องมีออเดอร์/);
 assert.equal(isCatalogDiscountQuestion('กำไรเดือนนี้เท่าไร'),false);assert.equal(isCatalogDiscountQuestion('ยอดขายเดือนนี้ลดลง 20% หรือเปล่า'),false);assert.equal(isCatalogDiscountQuestion('ลด 20%'),true);
});
test('monthly profit comes from recorded order amounts, not current catalog prices or planned stock',async()=>{
 const calls=[];const order={orderId:'O-1',platform:'merchant',orderAt:'2026-10-10T05:00:00.000Z',items:[{sku:'ASAW'}],revenueSatang:10000,profitSatang:3000,cogsSatang:5000,feeSatang:1000,sellerShippingSatang:0,packagingSatang:500,adsSatang:500,status:'ACTUAL_FEES_CONFIRMED_COST',missingFields:[]};
 const reply=await answerQuestion({...input('กำไรเดือนนี้เท่าไร'),context:{...context,start:'2026-10-01'},products:[{sku:'ASAW',sellingPriceSatang:999999,quantity:1000}]},async(path,body)=>{calls.push([path,body]);return {totalOrders:1,results:[order]};});
 assert.deepEqual(calls,[['/stores/QA/dashboard?month=2026-10',undefined]]);assert.equal(reply.source,'recorded');assert.equal(reply.result.profitSatang,3000);assert.equal(reply.result.revenueSatang,10000);assert.equal(reply.catalogReferenceAt,undefined);
});
test('monthly empty data stays unknown and a loss question uses recorded amounts',async()=>{
 const reply=await answerQuestion({...input('กำไรเดือนนี้เท่าไร'),context:{...context,start:'2026-10-01'}},async()=>({totalOrders:0,results:[],profitSatang:0}));
 assert.equal(reply.source,'notice');assert.equal(reply.result,undefined);assert.match(reply.text,/การเพิ่มสินค้าอย่างเดียวยังไม่ใช่ออเดอร์/);
 const loss=await answerQuestion({...input('เดือนนี้ร้านขาดทุนไหม'),context:{...context,start:'2026-10-01'}},async()=>({totalOrders:1,results:[{orderId:'LOSS',platform:'mock',orderAt:'2026-10-15T05:00:00Z',items:[{sku:'ASAW'}],profitSatang:-500,revenueSatang:10000,cogsSatang:9500,feeSatang:1000,packagingSatang:0,adsSatang:0,sellerShippingSatang:0,missingFields:[]}]}));assert.equal(loss.source,'recorded');assert.equal(loss.result.profitSatang,-500);
});
test('catalog references survive chat history and do not falsely show the selected monthly date range',()=>{
 const chat=createChat(context);chat.turns=[{id:'T1',question:'ลดราคา 20%',context,createdAt:chat.createdAt,state:'complete',reply:{text:'ส่วนต่างก่อนค่าใช้จ่าย',source:'fallback',context,catalogReferenceAt:'2026-10-25T10:00:00.000Z'}}];
 const archive={version:1,activeId:chat.id,sessions:[chat]};const parsed=parseArchive(JSON.stringify(archive));assert.equal(parsed.sessions[0].turns[0].reply.catalogReferenceAt,'2026-10-25T10:00:00.000Z');
 assert.match(answerReferenceLabel(context,'2026-10-25T10:00:00.000Z','th'),/ข้อมูลสินค้าปัจจุบัน/);
 chat.turns[0].reply.catalogReferenceAt='not-a-date';assert.throws(()=>parseArchive(JSON.stringify(archive)),/INVALID_CATALOG_REFERENCE/);
});
