import test from 'node:test';
import assert from 'node:assert/strict';
import {marketplaceRequest,initialMarketplaceDraft,chatMarketplaceDraft,checkboxMarketplaceDraft,changeChatPlatform,toggleChatCampaign,validMarketplaceDraft,chatCampaignLabel} from '../web/src/lib/marketplace-context.ts';
const options={version:'test',reviewedAt:'2026-10-18',platforms:[{id:'shopee',categories:[{id:'general'},{id:'electronics'}],campaigns:[{id:'shopee-prime'}]},{id:'tiktok',categories:[{id:'general'}],campaigns:[{id:'tiktok-bcd'},{id:'tiktok-flash'}]}]};
test('recorded mode sends no platform override and merchant unknown is distinct from confirmed zero',()=>{
 assert.equal(marketplaceRequest(initialMarketplaceDraft,undefined),undefined);
 const draft={...initialMarketplaceDraft,platform:'shopee',confirmed:true};
 assert.equal(marketplaceRequest(draft,options).commissionRateBps,null);
 assert.equal(marketplaceRequest({...draft,commission:'0'},options).commissionRateBps,0);
 assert.equal(marketplaceRequest({...draft,commission:'12.50',buyerShipping:'35.25'},options).commissionRateBps,1250);
 assert.equal(marketplaceRequest({...draft,buyerShipping:'35.25'},options).buyerShippingSatang,3525);
});

test('chat campaign choices start with unknown rates, clear incompatible platform assumptions and exclude mutually exclusive programs',()=>{
 const initial=chatMarketplaceDraft();assert.equal(initial.payment,'');assert.equal(initial.commission,'');assert.equal(initial.confirmed,false);
 const preset=checkboxMarketplaceDraft({...changeChatPlatform('shopee'),commission:'10',commissionVat:'INCLUDED',payment:'3',confirmed:true});assert.equal(preset.commission,'');assert.equal(preset.payment,'');assert.equal(marketplaceRequest({...preset,confirmed:true},options).commissionRateBps,null);
 let d={...changeChatPlatform('shopee'),commission:'12',campaigns:['shopee-prime'],confirmed:true};
 d=changeChatPlatform('tiktok');assert.equal(d.commission,'');assert.deepEqual(d.campaigns,[]);assert.equal(d.confirmed,false);
 d=toggleChatCampaign(d,'tiktok-bcd',true);d=toggleChatCampaign(d,'tiktok-flash',true);assert.deepEqual(d.campaigns,['tiktok-flash']);
 d=toggleChatCampaign(d,'tiktok-flash',true);assert.deepEqual(d.campaigns,['tiktok-flash']);
 assert.equal(validMarketplaceDraft(d),true);assert.equal(validMarketplaceDraft({...d,campaigns:['x'.repeat(100)]}),false);
 assert.equal(chatCampaignLabel(undefined,'th'),'แคมเปญ');assert.match(chatCampaignLabel(d,'th'),/TikTok.*1 แคมเปญ/);
});
test('switching platform cannot carry another campaign, conflicting BCD/FS or unconfirmed assumptions',()=>{
 const draft={...initialMarketplaceDraft,platform:'shopee',confirmed:true,campaigns:['shopee-prime']};
 assert.throws(()=>marketplaceRequest({...draft,platform:'tiktok'},options));
 assert.throws(()=>marketplaceRequest({...draft,confirmed:false},options));
 assert.throws(()=>marketplaceRequest({...draft,platform:'tiktok',campaigns:['tiktok-bcd','tiktok-flash']},options));
 assert.throws(()=>marketplaceRequest({...draft,commission:'8.123'},options));
 assert.throws(()=>marketplaceRequest({...draft,buyerShipping:''},options));
});
