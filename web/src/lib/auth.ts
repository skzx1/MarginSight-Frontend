let api=process.env.NEXT_PUBLIC_API_URL??'http://localhost:4051';
let domain=process.env.NEXT_PUBLIC_COGNITO_DOMAIN??'';
let client=process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID??'';
let configLoaded=false;
export function localMode(){return api.startsWith('http://localhost:')}
export async function loadConfig(){if(configLoaded)return;if(!['localhost','127.0.0.1'].includes(location.hostname)){const response=await fetch('/config.json',{cache:'no-store'});if(!response.ok)throw Error('ยังไม่ได้ตั้งค่าระบบหลัง deploy');const c=await response.json();if(!/^https:\/\/[^/]+\.execute-api\.ap-southeast-1\.amazonaws\.com$/.test(c.apiUrl)||!/^https:\/\/marginsight-109991964227\.auth\.ap-southeast-1\.amazoncognito\.com$/.test(c.authDomain)||!c.clientId)throw Error('ค่าระบบไม่ตรงบัญชี / Region ที่เลือก');api=c.apiUrl;domain=c.authDomain;client=c.clientId}configLoaded=true}
const base64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
export async function login(register=false){clearFullDemo();await loadConfig();const verifier=base64(crypto.getRandomValues(new Uint8Array(48))),state=base64(crypto.getRandomValues(new Uint8Array(24)));sessionStorage.setItem('pkce',verifier);sessionStorage.setItem('oauthState',state);const challenge=base64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));const url=new URL(register?'/signup':'/oauth2/authorize',domain);url.search=new URLSearchParams({client_id:client,response_type:'code',scope:'openid email marginsight/api',redirect_uri:location.origin+'/',state,code_challenge:challenge,code_challenge_method:'S256'}).toString();location.assign(url)}
export async function session(){await loadConfig();const query=new URLSearchParams(location.search),code=query.get('code');if(code){clearFullDemo();const state=sessionStorage.getItem('oauthState'),verifier=sessionStorage.getItem('pkce');if(!state||query.get('state')!==state||!verifier)throw Error('สถานะเข้าสู่ระบบไม่ถูกต้อง กรุณาลองใหม่');history.replaceState({},'',location.pathname);const result=await fetch(domain+'/oauth2/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:client,code,redirect_uri:location.origin+'/',code_verifier:verifier})});if(!result.ok)throw Error('เข้าสู่ระบบไม่สำเร็จ');const tokens=await result.json();sessionStorage.setItem('token',tokens.access_token);sessionStorage.removeItem('pkce');sessionStorage.removeItem('oauthState')}if(fullDemoMode()){if(Number(sessionStorage.getItem('demoExpiresAt'))*1000<=Date.now()){clearFullDemo();return null}return sessionStorage.getItem('demoToken')}return sessionStorage.getItem('token')}
export async function demo(user='demo-a'){if(process.env.NEXT_PUBLIC_AUTH_MODE!=='local'&&!api.startsWith('http://localhost:'))throw Error('บัญชีทดลองใช้ได้เฉพาะเครื่อง');const r=await fetch(api+'/dev/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({user})});const v=await r.json();sessionStorage.setItem('token',v.accessToken);return v.accessToken}
export class ApiError extends Error {
 constructor(public code: string, public statusCode: number) { super(code); this.name = 'ApiError'; }
}
export async function request<T = unknown>(path:string,body?:unknown):Promise<T> {
 await loadConfig();
 const guest=fullDemoMode();
 const r=await fetch(api+(guest?'/demo/api':'')+path,{method:body===undefined?'GET':'POST',headers:{authorization:'Bearer '+activeToken(),...(body===undefined?{}:{'content-type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});
 if(r.status===401){if(guest)clearFullDemo();else sessionStorage.removeItem('token');window.dispatchEvent(new Event('auth-expired'));throw new ApiError('SESSION_EXPIRED',401)}
 const v=await r.json().catch(()=>({error:'INVALID_RESPONSE'}));
 if(!r.ok)throw new ApiError(v.error??'REQUEST_FAILED',r.status);
 return v as T;
}
export async function upload(url:string,file:File,type:string){const r=await fetch(url,{method:'PUT',headers:{'content-type':type,...(url.startsWith(api+'/dev/')?{authorization:'Bearer '+activeToken()}: {})},body:file});if(!r.ok)throw Error('อัปโหลดไม่สำเร็จ')}
export async function download(url:string,fileName?:string){const r=await fetch(url,{headers:url.startsWith(api+'/dev/')?{authorization:'Bearer '+activeToken()}: {}});if(!r.ok)throw Error('ดาวน์โหลดไม่สำเร็จ');const blob=await r.blob(),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=fileName??(url.includes('xlsx')?'marginsight.xlsx':'marginsight.csv');link.click();URL.revokeObjectURL(link.href)}
export function logout(){if(fullDemoMode()){clearFullDemo();location.assign(location.origin+'/');return}sessionStorage.removeItem('token');if(domain)location.assign(domain+'/logout?'+new URLSearchParams({client_id:client,logout_uri:location.origin+'/'}));else location.reload()}

export async function preview(body:{priceSatang:number;program:boolean}){const {demoFixture,calculate,simulate,breakEven}=await import('./domain.generated.js');const input=demoFixture();if(!body.program)input.enrollments=[];return {dataOrigin:'MOCK',mode:'READ_ONLY_SYNTHETIC_PREVIEW',baseline:calculate(input),scenario:simulate(input,body.priceSatang),breakEven:breakEven(input)}}

export function fullDemoMode(){return typeof window!=='undefined'&&sessionStorage.getItem('demoMode')==='1'}
function activeToken(){return sessionStorage.getItem(fullDemoMode()?'demoToken':'token')}
function clearFullDemo(){for(const key of ['demoMode','demoToken','demoExpiresAt'])sessionStorage.removeItem(key)}
export async function fullDemo(){await loadConfig();const response=await fetch(api+'/demo/session',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});const data=await response.json();if(!response.ok)throw Error(data.error==='DEMO_DAILY_LIMIT'?'เดโมวันนี้ครบจำนวนรอบแล้ว ลองใหม่วันถัดไปหรือสมัครร้านของคุณ':'ยังเปิดเดโมไม่ได้ กรุณาลองใหม่ภายหลัง');if(!/^demo\.[A-Za-z0-9_-]{43}$/.test(data.accessToken)||!Number.isSafeInteger(data.expiresAt))throw Error('ข้อมูลรอบเดโมไม่ถูกต้อง');sessionStorage.setItem('demoToken',data.accessToken);sessionStorage.setItem('demoExpiresAt',String(data.expiresAt));sessionStorage.setItem('demoMode','1')}
