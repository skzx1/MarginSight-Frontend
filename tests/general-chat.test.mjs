import test from 'node:test';
import assert from 'node:assert/strict';
import {answerQuestion} from '../web/src/lib/assistant-service.ts';
import {createChat,parseArchive} from '../web/src/lib/assistant-sessions.ts';
const context={start:'2026-10-01',end:'2026-10-25',sku:'BAG-001'};
const input=question=>({base:'/stores/Q',question,context,products:[],locale:'th',signal:new AbortController().signal});
test('a general question bypasses catalog/monthly data even when a product is selected',async()=>{
 const calls=[];const reply=await answerQuestion(input('เขียนโปรแกรม Python ให้หน่อย'),async(path,body)=>{calls.push([path,body]);return {kind:'GENERAL',provider:'bedrock-chat',answer:'print("hello")'};});
 assert.equal(calls.length,1);assert.deepEqual(calls[0],['/stores/Q/assistant',{mode:'chat',message:'เขียนโปรแกรม Python ให้หน่อย',locale:'th',history:[]}]);assert.equal(reply.conversation,'general');assert.equal(reply.source,'assistant');assert.equal(reply.result,undefined);assert.equal(reply.catalogSummary,undefined);
});
test('server routing keeps current product discount separate from generated answers',async()=>{
 const calls=[];const reply=await answerQuestion(input('ลดราคา 20%'),async(path,body)=>{calls.push([path,body]);return body?.mode==='chat'?{kind:'STORE_DATA'}:{answer:'ส่วนต่าง',catalogScenario:{basis:'CATALOG',at:'2026-10-25T10:00:00Z'}};});assert.equal(calls.length,2);assert.equal(calls[1][0],'/stores/Q/assistant/catalog-discount');assert.equal(reply.conversation,undefined);
});
test('general follow-up forwards only bounded conversation text without store selectors',async()=>{
 let sent;const history=Array.from({length:10},(_,i)=>({role:i%2?'assistant':'user',text:'คำก่อนหน้า '+i}));await answerQuestion({...input('ขออีกแบบ'),history},async(path,body)=>{sent=body;return {kind:'GENERAL',provider:'bedrock-chat',answer:'ได้ครับ'};});assert.equal(sent.history.length,8);assert.equal(sent.history[0].text,'คำก่อนหน้า 2');assert.equal(sent.sku,undefined);assert.equal(sent.month,undefined);
});
test('unavailable model is a notice and malformed routing never becomes fabricated financial output',async()=>{
 const reply=await answerQuestion(input('สวัสดี'),async()=>({kind:'GENERAL',provider:'unavailable',answer:'เชื่อมต่อ AI ไม่สำเร็จ'}));assert.equal(reply.source,'notice');assert.equal(reply.result,undefined);await assert.rejects(()=>answerQuestion(input('สวัสดี'),async()=>({answer:'fake'})),/INVALID_CHAT_ROUTING_RESPONSE/);
});
test('general conversation provenance survives history and invalid provenance is rejected',()=>{
 const chat=createChat(context);chat.turns=[{id:'g',question:'สวัสดี',context,createdAt:chat.createdAt,state:'complete',reply:{text:'สวัสดีครับ',context,source:'assistant',conversation:'general'}}];const archive={version:1,activeId:chat.id,sessions:[chat]};assert.equal(parseArchive(JSON.stringify(archive)).sessions[0].turns[0].reply.conversation,'general');chat.turns[0].reply.conversation='fake';assert.throws(()=>parseArchive(JSON.stringify(archive)),/INVALID_CHAT_CONVERSATION/);
});
