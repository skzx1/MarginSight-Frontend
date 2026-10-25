// Display only backend-calculated satang amounts; never calculate money in this adapter.
export type CatalogSummary={basis:'CATALOG';discountPct:number;originalPriceSatang:number;discountedPriceSatang:number;unitCostSatang:number|null;differenceBeforeExpensesSatang:number|null;netProfitSatang:null;platform?:string;knownPlatformFeeSatang?:number;knownCampaignFeeSatang?:number;platformFeeSatang?:number|null;differenceAfterKnownFeesBeforeOtherExpensesSatang?:number|null};
const amount=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&Math.abs(v)<=1e15;
export function catalogSummary(value:unknown):CatalogSummary|undefined{
 if(!value||typeof value!=='object')return;
 const v=value as Record<string,unknown>;
 if(v.basis!=='CATALOG'||v.netProfitSatang!==null||typeof v.discountPct!=='number'||!Number.isFinite(v.discountPct)||v.discountPct<0||v.discountPct>100)return;
 if(!['originalPriceSatang','discountedPriceSatang'].every(k=>amount(v[k])&&(v[k] as number)>=0)||!['unitCostSatang','differenceBeforeExpensesSatang'].every(k=>v[k]===null||amount(v[k])))return;
 if(v.unitCostSatang!==null&&(v.unitCostSatang as number)<0)return;
 const keys=['knownPlatformFeeSatang','knownCampaignFeeSatang','platformFeeSatang','differenceAfterKnownFeesBeforeOtherExpensesSatang'] as const;
 if(keys.some(k=>v[k]!==undefined&&v[k]!==null&&!amount(v[k]))||v.platform!==undefined&&(typeof v.platform!=='string'||v.platform.length>30))return;
 return {basis:'CATALOG',netProfitSatang:null,discountPct:v.discountPct,originalPriceSatang:v.originalPriceSatang as number,discountedPriceSatang:v.discountedPriceSatang as number,unitCostSatang:v.unitCostSatang as number|null,differenceBeforeExpensesSatang:v.differenceBeforeExpensesSatang as number|null,...(v.platform?{platform:v.platform as string}:{}),...Object.fromEntries(keys.filter(k=>v[k]!==undefined).map(k=>[k,v[k]]))};
}
