export type MarketplacePlatform='recorded'|'shopee'|'lazada'|'tiktok';
export type MarketplaceOptions={version:string;reviewedAt:string;platforms:{id:string;name:string;categories:{id:string;name:string}[];campaigns:{id:string;name:string;sourceUrl:string;note:string;effectiveFrom:string}[]}[]};
export type MarketplaceDraft={platform:MarketplacePlatform;category:string;sellerType:'NON_MALL'|'MALL';campaigns:string[];commission:string;commissionVat:'INCLUDED'|'EXCLUDED'|'UNKNOWN';payment:string;paymentBase:'REVENUE'|'BUYER_PLUS_PLATFORM'|'BUYER_PLUS_PLATFORM_PLUS_SHIPPING';buyerShipping:string;fixedFeeExempt:boolean;growthTier:'STANDARD'|'SMALL'|'WAIVED';primeElectronics:string;liveRate:string;confirmed:boolean};
export const initialMarketplaceDraft:MarketplaceDraft={platform:'recorded',category:'general',sellerType:'NON_MALL',campaigns:[],commission:'',commissionVat:'UNKNOWN',payment:'3.21',paymentBase:'BUYER_PLUS_PLATFORM_PLUS_SHIPPING',buyerShipping:'0',fixedFeeExempt:false,growthTier:'STANDARD',primeElectronics:'',liveRate:'',confirmed:false};
// Parse percentages and money to integer units only; calculations remain at API.
function hundredths(value:string,max:number):number|null{
 if(!value.trim())return null;
 if(!/^\d+(?:\.\d{1,2})?$/.test(value.trim()))throw Error('INVALID_SCENARIO_INPUT');
 const [whole,fraction='']=value.trim().split('.'),n=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(n)||n>max)throw Error('INVALID_SCENARIO_INPUT');return n;
}
export function marketplaceRequest(d:MarketplaceDraft,options:MarketplaceOptions|undefined){
 if(d.platform==='recorded')return undefined;
 const p=options?.platforms.find(p=>p.id===d.platform);
 if(!p||!p.categories.some(c=>c.id===d.category)||d.campaigns.some(id=>!p.campaigns.some(c=>c.id===id)))throw Error('INVALID_SCENARIO_CONTEXT');
 if(!d.confirmed)throw Error('SCENARIO_ACKNOWLEDGEMENT_REQUIRED');
 if(new Set(d.campaigns).size!==d.campaigns.length||d.campaigns.includes('tiktok-bcd')&&d.campaigns.includes('tiktok-flash'))throw Error('INVALID_SCENARIO_CONTEXT');
 if(d.sellerType==='MALL'&&d.growthTier==='SMALL')throw Error('INVALID_SCENARIO_CONTEXT');
 const buyerShippingSatang=hundredths(d.buyerShipping,10000000);if(buyerShippingSatang===null)throw Error('INVALID_SCENARIO_INPUT');
 const primeElectronicsRateBps=hundredths(d.primeElectronics,10000),liveRateBps=hundredths(d.liveRate,10000);
 if(primeElectronicsRateBps!==null&&![700,800].includes(primeElectronicsRateBps)||liveRateBps!==null&&![200,300].includes(liveRateBps))throw Error('INVALID_SCENARIO_INPUT');
 return {platform:d.platform,category:d.category,sellerType:d.sellerType,campaigns:[...d.campaigns],commissionRateBps:hundredths(d.commission,10000),commissionVat:d.commissionVat,paymentRateBps:hundredths(d.payment,10000),paymentBase:d.paymentBase,buyerShippingSatang,fixedFeeExempt:d.fixedFeeExempt,growthTier:d.growthTier,primeElectronicsRateBps,liveRateBps,confirmed:true as const};
}
