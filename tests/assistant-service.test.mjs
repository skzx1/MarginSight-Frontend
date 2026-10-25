import test from 'node:test';
import assert from 'node:assert/strict';
import {answerQuestion} from '../web/src/lib/assistant-service.ts';
import {isCatalogDiscountQuestion} from '../web/src/lib/assistant-routing.ts';
import {answerReferenceLabel} from '../web/src/lib/assistant-context.ts';
import {createChat,parseArchive} from '../web/src/lib/assistant-sessions.ts';
const context={start:'2026-09-01',end:'2026-10-25',sku:'ASAW'};
const input=question=>({base:'/stores/QA',question,context,products:[],locale:'th',signal:new AbortController().signal});
test('discount reads current server catalog without a monthly/order dependency or client-provided money',async()=>{
 const calls=[];const api=async(path,body)=>{calls.push([path,body]);return {answer:'ส่วนต่างก่อนค่าใช้จ่ายอื่น 80.00 บาท ยังไม่ใช่กำไรสุทธิ',catalogScenario:{basis:'CATALOG',at:'2026-10-25T10:00:00.000Z'}};};
 const reply=await answerQuestion(input('ถ้าลดราคา 20% จะเหลือกำไรเท่าไร'),api);
 assert.deepEqual(calls,[['/stores/QA/assistant/catalog-discount',{message:'ถ้าลดราคา 20% จะเหลือกำไรเท่าไร',sku:'ASAW',locale:'th'}]]);
 assert.equal(reply.catalogReferenceAt,'2026-10-25T10:00:00.000Z');assert.equal(reply.result,undefined);assert.equal(reply.calculation,undefined);assert.equal(reply.source,'fallback');assert.match(reply.note,/ไม่ใช่กำไรสุทธิ/);
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
test('no sales gives a monthly-data notice rather than invented zero profit or a catalog simulation',async()=>{
 const reply=await answerQuestion({...input('กำไรเดือนนี้เท่าไร'),context:{...context,start:'2026-10-01'}},async()=>({totalOrders:0,results:[],profitSatang:0}));
 assert.equal(reply.source,'notice');assert.equal(reply.result,undefined);assert.match(reply.text,/การเพิ่มสินค้าอย่างเดียวยังไม่ใช่ออเดอร์/);
});
test('catalog references survive chat history and do not falsely show the selected monthly date range',()=>{
 const chat=createChat(context);chat.turns=[{id:'T1',question:'ลดราคา 20%',context,createdAt:chat.createdAt,state:'complete',reply:{text:'ส่วนต่างก่อนค่าใช้จ่าย',source:'fallback',context,catalogReferenceAt:'2026-10-25T10:00:00.000Z'}}];
 const archive={version:1,activeId:chat.id,sessions:[chat]};const parsed=parseArchive(JSON.stringify(archive));assert.equal(parsed.sessions[0].turns[0].reply.catalogReferenceAt,'2026-10-25T10:00:00.000Z');
 assert.match(answerReferenceLabel(context,'2026-10-25T10:00:00.000Z','th'),/ข้อมูลสินค้าปัจจุบัน/);
 chat.turns[0].reply.catalogReferenceAt='not-a-date';assert.throws(()=>parseArchive(JSON.stringify(archive)),/INVALID_CATALOG_REFERENCE/);
});
