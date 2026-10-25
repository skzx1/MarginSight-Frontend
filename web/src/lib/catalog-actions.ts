import {calculate,demoFixture} from './domain.generated.js';
import {parseBaht} from './format.ts';
import type {CatalogProduct} from './types';
import type {Cost} from './domain-types/model';

// Product metadata is not a statement of stock, sale price or net profit.
export function recordedProducts(products:CatalogProduct[]):CatalogProduct[]{
  return products.map(product=>({...product,dateAdded:product.dateAdded??product.createdAt?.slice(0,10)}));
}

export function productDraftPreview(price:string,cost:string,quantity:string){
  const amount=(text:string)=>{try{const value=parseBaht(text);return value<=1e12?value:null}catch{return null}};
  const priceSatang=amount(price),costSatang=amount(cost);
  const count=/^\d+$/.test(quantity)&&Number.isSafeInteger(Number(quantity))&&Number(quantity)<=1e6?Number(quantity):null;
  if(priceSatang===null||costSatang===null)return {priceSatang,costSatang,count,differenceSatang:null,marginPct:null,totalValueSatang:null,totalDifferenceSatang:null};
  const input=demoFixture();
  // Explicit hypothetical comparison: exclude all fees/ads/packaging/shipping.
  // This uses the generated canonical engine and never writes store data.
  input.order={...input.order,orderId:'UNSAVED-DRAFT',platform:'draft',feesConfirmed:false};
  input.items=[{...input.items[0],revenueSatang:priceSatang,buyerPaymentSatang:priceSatang,adsSatang:0,packagingSatang:0,sellerShippingSatang:0}];
  input.costs=[{...input.costs[0],unitCostSatang:costSatang,sourceRef:'unsaved-input'}];
  input.rules=[{...input.rules[0],id:'EXCLUDED_FEES_FOR_DRAFT_ONLY',rateBps:0,fixedSatang:0,sourceRef:'explicit-draft-assumption:all-fees-excluded'}];
  input.enrollments=[];
  const result=calculate(input);
  const totalValueSatang=count===null?null:priceSatang*count;
  const totalDifferenceSatang=count===null||result.profitSatang===null?null:result.profitSatang*count;
  return {priceSatang,costSatang,count,differenceSatang:result.profitSatang,marginPct:result.marginPct,totalValueSatang:totalValueSatang!==null&&Number.isSafeInteger(totalValueSatang)?totalValueSatang:null,totalDifferenceSatang:totalDifferenceSatang!==null&&Number.isSafeInteger(totalDifferenceSatang)?totalDifferenceSatang:null};
}

type Requester=<T>(path:string,body:unknown)=>Promise<T>;
export async function saveProductListing(api:Requester,base:string,product:CatalogProduct,fields:{sellingPriceSatang?:number;quantity?:number}){
  const saved=await api<CatalogProduct>(base+'/products/'+encodeURIComponent(product.sku)+'/listing',{...fields,expectedListingVersion:product.listingVersion??0});
  return {...saved,cost:product.cost};
}
export async function saveProductAndCost(api:Requester,base:string,details:{sku:string;name:string;unit:string;sellingPriceSatang:number;quantity:number;costSatang:number;effectiveFrom:string;origin:'MOCK'|'REAL'},onCreated:(product:CatalogProduct)=>void,existing?:CatalogProduct){
  const fields={sellingPriceSatang:details.sellingPriceSatang,quantity:details.quantity};
  let product=existing??await api<CatalogProduct>(base+'/products',{sku:details.sku,name:details.name,unit:details.unit,...fields});
  if(existing&&(existing.sellingPriceSatang!==fields.sellingPriceSatang||existing.quantity!==fields.quantity))product=await saveProductListing(api,base,existing,fields);
  onCreated(product); // Keep a confirmed partial save so retry never creates the product twice.
  const cost=await api<Cost>(base+'/products/'+encodeURIComponent(product.sku)+'/cost-versions',{
    sku:product.sku,unitCostSatang:details.costSatang,effectiveFrom:details.effectiveFrom,
    sourceRef:'merchant-input:'+details.effectiveFrom,dataOrigin:details.origin,method:'MERCHANT_CONFIRMED_UNIT_COST'
  });
  return {...product,cost};
}
