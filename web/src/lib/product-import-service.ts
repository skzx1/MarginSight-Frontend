import type {CatalogProduct} from './types';
import type {Cost} from './domain-types/model';
import type {CsvProductRow,DuplicatePolicy} from './product-csv';
import {saveProductListing} from './catalog-actions.ts';

type Requester=<T>(path:string,body:unknown)=>Promise<T>;
export type ImportCheckpoint={fingerprint:string;sku:string;product?:CatalogProduct;complete?:boolean};

/** Confirm merchant catalog metadata and costs independently; never invent transaction profit. */
export async function importProductRows(api:Requester,base:string,rows:CsvProductRow[],existing:CatalogProduct[],policy:DuplicatePolicy,origin:'MOCK'|'REAL',effectiveFrom:string,checkpoints:Map<number,ImportCheckpoint>,progress?:(current:number)=>void){
 const failures:{index:number;code:string;productSaved:boolean}[]=[];
 let completed=0,skipped=0;
 for(const [index,row] of rows.entries()){
  progress?.(index+1);
  let state=checkpoints.get(row.index);
  try{
   const fingerprint=JSON.stringify([row.sku,row.name,row.unit,row.costSatang,row.sellingPriceSatang,row.quantity]);
   if(state&&state.fingerprint!==fingerprint)throw Error('ROW_CHANGED_AFTER_PARTIAL_SAVE');
   if(state?.complete){completed++;continue;}
   const known=[...existing,...[...checkpoints.values()].flatMap(s=>s.product?[s.product]:[])];
   const bySku=known.find(p=>p.sku===row.sku);
   const byName=known.find(p=>p.name.trim().toLocaleLowerCase()===row.name.trim().toLocaleLowerCase());
   if(!state?.product&&policy==='skip'&&(row.isShopDuplicate||row.isInFileDuplicate||bySku||byName)){skipped++;continue;}
   if(!state){state={fingerprint,sku:row.sku||'SKU-'+crypto.randomUUID().slice(0,8).toUpperCase()};checkpoints.set(row.index,state);}
   const fields={...(row.sellingPriceSatang===null?{}:{sellingPriceSatang:row.sellingPriceSatang}),...(row.quantity===null?{}:{quantity:row.quantity})};
   if(!state.product){
    if(policy==='update'&&(bySku||byName)){
     if(row.skuText&&byName&&byName.sku!==row.sku)throw Error('SKU_NAME_MISMATCH');
     state.product=bySku??byName;
    }else state.product=await api<CatalogProduct>(base+'/products',{sku:state.sku,name:row.name,unit:row.unit,...fields});
   }
   if(state.product!.unit!==row.unit)throw Error('COST_UNIT_MISMATCH');
   if(Object.entries(fields).some(([key,value])=>state!.product![key as 'quantity'|'sellingPriceSatang']!==value))state.product=await saveProductListing(api,base,state.product!,fields);
   const product=state.product!;
   if(row.costSatang!==null){
    if(product.unit!==row.unit)throw Error('COST_UNIT_MISMATCH');
    const cost=await api<Cost>(base+'/products/'+encodeURIComponent(product.sku)+'/cost-versions',{sku:product.sku,unitCostSatang:row.costSatang,effectiveFrom,sourceRef:'merchant-csv-import:'+effectiveFrom,dataOrigin:origin,method:'MERCHANT_CONFIRMED_UNIT_COST'});
    state.product={...product,cost};
   }
   state.complete=true;completed++;
  }catch(error){
   const code=error instanceof Error?error.message:'IMPORT_FAILED';
   failures.push({index:row.index,code,productSaved:!!state?.product});
   if(['SESSION_EXPIRED','FORBIDDEN','DEMO_SESSION_LIMIT','DEMO_EXPIRED','RATE_LIMITED'].includes(code)){
    for(const pending of rows.slice(index+1))failures.push({index:pending.index,code:'NOT_ATTEMPTED:'+code,productSaved:!!checkpoints.get(pending.index)?.product});
    break;
   }
  }
 }
 const products=[...new Map([...checkpoints.values()].flatMap(s=>s.product?[[s.product.sku,s.product] as const]:[])).values()];
 return {products,completed,skipped,failures};
}
