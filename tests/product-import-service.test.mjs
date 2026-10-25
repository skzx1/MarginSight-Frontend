import test from 'node:test';
import assert from 'node:assert/strict';
import {importProductRows} from '../web/src/lib/product-import-service.ts';
const row=(index=1)=>({index,sku:'CSV-'+index,skuText:'CSV-'+index,name:'สินค้า '+index,unit:'ชิ้น',costSatang:12345,sellingPriceSatang:20000,quantity:100});
const base='/stores/QA',date='2026-10-17T17:00:00.000Z';

test('CSV cost failure reports partial save; retry writes only the missing cost and preserves server evidence',async()=>{
 const checkpoints=new Map();let creates=0,costs=0;
 const api=async(path,body)=>{
  if(path.endsWith('/products')){creates++;assert.equal(body.sellingPriceSatang,20000);assert.equal(body.quantity,100);return {...body,dataOrigin:'MOCK',sourceRef:'server-entry'};}
  costs++;assert.equal(body.unitCostSatang,12345);assert.equal(body.dataOrigin,'MOCK');
  if(costs===1)throw Error('NETWORK_ERROR');
  return {unitCostSatang:12345,version:'SERVER-V1',verifiedBy:'server-subject'};
 };
 const first=await importProductRows(api,base,[row()],[],'skip','MOCK',date,checkpoints);
 assert.equal(first.completed,0);assert.deepEqual(first.failures,[{index:1,code:'NETWORK_ERROR',productSaved:true}]);
 assert.equal(first.products[0].cost,undefined);
 const next=await importProductRows(api,base,[row()],first.products,'skip','MOCK',date,checkpoints);
 assert.equal(next.completed,1);assert.deepEqual(next.failures,[]);assert.equal(creates,1);assert.equal(costs,2);
 assert.equal(next.products[0].cost.version,'SERVER-V1');
 assert.equal(next.products[0].quantity,100);assert.equal(next.products[0].sellingPriceSatang,20000);
 for(const field of ['profitSatang','dateAdded'])assert.equal(next.products[0][field],undefined,field);
 await importProductRows(api,base,[row()],next.products,'skip','MOCK',date,checkpoints);
 assert.equal(creates,1);assert.equal(costs,2);
});

test('CSV update persists zero price and quantity, omits missing fields and retries cost independently',async()=>{
 const old={sku:'CSV-1',name:'สินค้า 1',unit:'ชิ้น',sellingPriceSatang:20000,quantity:100,listingVersion:3};
 const calls=[],checkpoints=new Map();let costs=0;
 const api=async(path,body)=>{calls.push([path,body]);if(path.endsWith('/listing'))return {...old,...body,listingVersion:4};if(++costs===1)throw Error('NETWORK_ERROR');return {version:'COST'};};
 const input={...row(),sellingPriceSatang:0,quantity:0};
 const first=await importProductRows(api,base,[input],[old],'update','REAL',date,checkpoints);
 assert.equal(first.failures[0].productSaved,true);
 const next=await importProductRows(api,base,[input],[old],'update','REAL',date,checkpoints);
 assert.equal(next.completed,1);assert.equal(calls.filter(([p])=>p.endsWith('/listing')).length,1);
 assert.deepEqual(calls[0][1],{sellingPriceSatang:0,quantity:0,expectedListingVersion:3});
 const changed=await importProductRows(api,base,[{...input,quantity:2}],[old],'update','REAL',date,checkpoints);
 assert.equal(changed.failures[0].code,'ROW_CHANGED_AFTER_PARTIAL_SAVE');
 const noFields=[];await importProductRows(async(p,b)=>{noFields.push([p,b]);return b},base,[{...row(2),sellingPriceSatang:null,quantity:null,costSatang:null}],[],'skip','REAL',date,new Map());
 assert.equal(noFields.length,1);assert.equal('quantity' in noFields[0][1],false);assert.equal('sellingPriceSatang' in noFields[0][1],false);
});
test('one failed create never writes its cost and does not prevent another valid row saving',async()=>{
 const calls=[];const api=async(path,body)=>{calls.push([path,body]);if(body.sku==='CSV-1')throw Error('INVALID_PRODUCT');return path.endsWith('/products')?body:{version:'COST-2'};};
 const result=await importProductRows(api,base,[row(),row(2)],[],'skip','REAL',date,new Map());
 assert.equal(result.completed,1);assert.equal(result.failures[0].productSaved,false);
 assert.equal(calls.length,3);assert.equal(calls.filter(([p])=>p.endsWith('/cost-versions')).length,1);
 assert.deepEqual(result.products.map(p=>p.sku),['CSV-2']);
});
test('expired sessions and quota failures stop a large CSV without repeatedly hitting the API',async()=>{
 let calls=0;const result=await importProductRows(async()=>{calls++;throw Error('DEMO_SESSION_LIMIT');},base,Array.from({length:1000},(_,i)=>row(i+1)),[],'skip','MOCK',date,new Map());
 assert.equal(calls,1);assert.equal(result.completed,0);assert.equal(result.failures.length,1000);assert.equal(result.failures[999].code,'NOT_ATTEMPTED:DEMO_SESSION_LIMIT');
});
test('duplicate SKU matching, explicit SKU/name conflicts and cost unit mismatches cannot change the wrong product',async()=>{
 const existing=[{sku:'CSV-1',name:'สินค้า 1',unit:'กล่อง'}];let writes=0;
 const api=async()=>{writes++;throw Error('UNEXPECTED_WRITE');};
 const skip=await importProductRows(api,base,[row()],existing,'skip','REAL',date,new Map());
 assert.equal(skip.skipped,1);assert.equal(writes,0);
 const unit=await importProductRows(api,base,[row()],existing,'update','REAL',date,new Map());
 assert.equal(unit.failures[0].code,'COST_UNIT_MISMATCH');assert.equal(writes,0);
 const conflict=await importProductRows(api,base,[{...row(),sku:'DIFFERENT',skuText:'DIFFERENT'}],existing,'update','REAL',date,new Map());
 assert.equal(conflict.failures[0].code,'SKU_NAME_MISMATCH');assert.equal(writes,0);
});
