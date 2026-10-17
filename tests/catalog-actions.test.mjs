import test from 'node:test';
import assert from 'node:assert/strict';
import {recordedProducts,productDraftPreview,saveProductAndCost} from '../web/src/lib/catalog-actions.ts';

test('empty and real catalogs never receive invented products, prices, stock or profit',()=>{
  assert.deepEqual(recordedProducts([]),[]);
  const product={sku:'TSHIRT-01',name:'Actual merchant entry',unit:'piece',dataOrigin:'REAL',sourceRef:'merchant-entry',cost:{unitCostSatang:13000}};
  const [result]=recordedProducts([product]);
  for(const field of ['quantity','sellingPriceSatang','profitSatang','dateAdded'])assert.equal(result[field],undefined,field);
  assert.equal(result.cost.unitCostSatang,13000);
});

test('pre-expense draft uses exact satang and the canonical engine; absent or malformed values remain unknown',()=>{
  const result=productDraftPreview('0.30','0.10','3');
  assert.equal(result.differenceSatang,20);assert.equal(result.totalDifferenceSatang,60);assert.equal(result.totalValueSatang,90);
  assert.equal(result.marginPct,66.67);
  for(const price of ['', '1e3','1.005','-1','10000000000000'])assert.equal(productDraftPreview(price,'1.00','3').differenceSatang,null);
  for(const quantity of ['1.5','1e3','-1'])assert.equal(productDraftPreview('2','1',quantity).count,null);
});

const details={sku:'SAVE-1',name:'A product',unit:'piece',costSatang:15450,effectiveFrom:'2026-10-16T17:00:00.000Z',origin:'REAL'};
test('failed catalog create stays an error and never attempts a cost or reports success',async()=>{
  let calls=0,created=false;
  await assert.rejects(()=>saveProductAndCost(async()=>{calls++;throw new Error('FORBIDDEN')},'/stores/SHOP-1',details,()=>{created=true}),/FORBIDDEN/);
  assert.equal(calls,1);assert.equal(created,false);
});

test('partial cost save remains retryable without a second product creation or invented metadata',async()=>{
  let product,creates=0,saveCosts=0;
  const confirmed={sku:'SAVE-1',name:'A product',unit:'piece',dataOrigin:'REAL',sourceRef:'merchant-entry'};
  const api=async(path,body)=>{
    if(path.endsWith('/products')){creates++;assert.deepEqual(Object.keys(body).sort(),['name','sku','unit']);return confirmed}
    saveCosts++;assert.equal(body.unitCostSatang,15450);assert.equal(body.dataOrigin,'REAL');
    if(saveCosts===1)throw new Error('NETWORK_ERROR');
    return {unitCostSatang:15450,version:'SERVER-COST-V2',verifiedBy:'server-subject'};
  };
  await assert.rejects(()=>saveProductAndCost(api,'/stores/SHOP-1',details,p=>{product=p}),/NETWORK_ERROR/);
  assert.equal(product,confirmed);
  const saved=await saveProductAndCost(api,'/stores/SHOP-1',details,()=>{},product);
  assert.equal(creates,1);assert.equal(saveCosts,2);assert.equal(saved.cost.version,'SERVER-COST-V2');
  for(const key of ['quantity','sellingPriceSatang','profitSatang'])assert.equal(saved[key],undefined);
});
