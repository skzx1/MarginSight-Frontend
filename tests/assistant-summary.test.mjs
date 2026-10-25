import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogSummary} from '../web/src/lib/assistant-summary.ts';
import {answerQuestion as routeQuestion} from '../web/src/lib/assistant-service.ts';
const answerQuestion=(input,api)=>routeQuestion(input,async(path,body,signal)=>({provider:'catalog-calculator',decision:{route:'FEE_PIPELINE'},...await api(path,body,signal)}));
import {createChat,parseArchive} from '../web/src/lib/assistant-sessions.ts';
const c={start:'2026-10-01',end:'2026-10-25',sku:'ASAW'};
const summary={basis:'CATALOG',netProfitSatang:null,discountPct:20,originalPriceSatang:25000,discountedPriceSatang:20000,unitCostSatang:12000,differenceBeforeExpensesSatang:8000,platform:'shopee',knownPlatformFeeSatang:2419,knownCampaignFeeSatang:1712,platformFeeSatang:null,differenceAfterKnownFeesBeforeOtherExpensesSatang:5581};
test('catalog reply carries server-calculated summary separately from recorded/net profit',async()=>{
 const reply=await answerQuestion({base:'/stores/Q',question:'ลดราคา 20%',context:c,products:[],locale:'th',signal:new AbortController().signal},async()=>({answer:'เหลือ 55.81 ก่อนค่าใช้จ่ายอื่น',catalogScenario:{...summary,at:'2026-10-25T10:00:00Z'}}));
 assert.deepEqual(reply.catalogSummary,summary);assert.equal(reply.result,undefined);assert.equal(reply.catalogSummary.netProfitSatang,null);assert.equal(reply.catalogSummary.platformFeeSatang,null);
});
test('summary preserves known zero, unknown cost and losses rather than inventing profit',()=>{
 const zero=catalogSummary({...summary,originalPriceSatang:0,discountedPriceSatang:0,unitCostSatang:0,differenceBeforeExpensesSatang:0,knownPlatformFeeSatang:0,differenceAfterKnownFeesBeforeOtherExpensesSatang:0});assert.equal(zero.unitCostSatang,0);assert.equal(zero.differenceAfterKnownFeesBeforeOtherExpensesSatang,0);
 assert.equal(catalogSummary({...summary,unitCostSatang:null,differenceBeforeExpensesSatang:null,differenceAfterKnownFeesBeforeOtherExpensesSatang:null}).unitCostSatang,null);
 assert.equal(catalogSummary({...summary,differenceAfterKnownFeesBeforeOtherExpensesSatang:-100}).differenceAfterKnownFeesBeforeOtherExpensesSatang,-100);
});
test('invalid and ambiguous money summaries cannot render as financial result cards',()=>{
 for(const invalid of [{...summary,netProfitSatang:5581},{...summary,originalPriceSatang:'25000'},{...summary,knownPlatformFeeSatang:1.005},{...summary,discountPct:101},{...summary,unitCostSatang:-1},{basis:'CATALOG'}])assert.equal(catalogSummary(invalid),undefined);
});
test('catalog summary survives history and malformed stored summaries are rejected',()=>{
 const chat=createChat(c);chat.turns=[{id:'t',question:'ลดราคา 20%',context:c,createdAt:chat.createdAt,state:'complete',reply:{text:'คงเหลือ',context:c,source:'fallback',catalogSummary:summary}}];
 const archive={version:1,activeId:chat.id,sessions:[chat]};assert.deepEqual(parseArchive(JSON.stringify(archive)).sessions[0].turns[0].reply.catalogSummary,summary);
 chat.turns[0].reply.catalogSummary={...summary,knownPlatformFeeSatang:'invented'};assert.throws(()=>parseArchive(JSON.stringify(archive)),/INVALID_CATALOG_SUMMARY/);
});
