const thaiDigits='๐๑๒๓๔๕๖๗๘๙';
const normalize=(text:string)=>text.replace(/[๐-๙]/g,c=>String(thaiDigits.indexOf(c)));
const words:Record<string,number>={หนึ่ง:1,สอง:2,สาม:3,สี่:4,ห้า:5,หก:6,เจ็ด:7,แปด:8,เก้า:9,สิบ:10,first:1,second:2,third:3,fourth:4,fifth:5};
export function requestedRank(question:string){
 const q=normalize(question);const matches=[...q.matchAll(/(?:อันดับ|ลำดับ|rank)\s*(?:ที่)?\s*(\d+|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ)/ig)];
 const token=matches.at(-1)?.[1]??q.match(/\b(first|second|third|fourth|fifth)\s+(?:highest|lowest|most|least)/i)?.[1];
 return token===undefined?1:words[token.toLowerCase()]??Number(token);
}
export const isRankingQuestion=(q:string)=>/สินค้าไหน|สินค้าตัวไหน|which product|most profit|least profit|กำไรดี|กำไรน้อย|กำไร.*(?:อันดับ|ลำดับ)|(?:อันดับ|ลำดับ).*กำไร/i.test(q);
export function rankingFollowup(question:string,previous:string|undefined){
 if(!previous||!isRankingQuestion(previous)||isRankingQuestion(question))return;
 const short=normalize(question).replace(/[?!.,？]/g,'');
 if(!/^(?:(?:แล้ว|ขอ|ดู|เอา|อันดับ|ลำดับ|ที่|ล่ะ|ครับ|ค่ะ|นะ|หน่อย|ที|ตัว|สินค้า|รองลงมา|ถัดไป|next|one|and|rank|first|second|third|fourth|fifth|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|\d+)|\s)+$/i.test(short))return;
 const base=previous.split('\n')[0];
 if(/รองลงมา|ถัดไป|ตัวถัด|next one/i.test(question))return base+'\nขออันดับ '+(requestedRank(previous)+1);
 if(/อันดับ|ลำดับ|rank|second|third|fourth|fifth/i.test(question))return base+'\n'+question;
}
