// Click-state QA: drives interactive states (dialogs, drawers, detail views) via CDP. Localhost only.
// Usage: node interact.mjs <outDir> [--lang en] [--port 9336] [--only name1,name2]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const out = args[0]; mkdirSync(out, { recursive: true });
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
const LANG = opt('--lang', 'th'), PORT = Number(opt('--port', '9336')), only = opt('--only', '').split(',').filter(Boolean);
const BASE = 'http://127.0.0.1:4060';
const q = sel => `document.querySelector(${JSON.stringify(sel)})`;
const visibleDialogTriggers = `[...document.querySelectorAll('button[aria-haspopup=dialog]')].filter(b=>b.offsetParent&&!b.disabled)`;
// Flows: [name, hash, widths, steps]; step = ['click', expr] | ['key', key] | ['shot', tag] | ['wait', ms] | ['eval', expr]
const FLOWS = [
  ['overview-order', 'overview', [390, 1440, 1920], [['click', q('.order-row-item')], ['wait', 900], ['shot', 'detail'], ['click', q('.back-link')], ['wait', 600], ['shot', 'back']]],
  ['orders-detail', 'orders', [390, 1440, 1920], [['click', q('.list-link')], ['wait', 1200], ['shot', 'detail']]],
  ['products-dialogs', 'products', [390, 1440, 1920], [['click', `${visibleDialogTriggers}[0]`], ['wait', 500], ['shot', 'filter'], ['key', 'Escape'], ['wait', 400], ['eval', 'document.activeElement?.getAttribute("aria-haspopup")'],
    ['click', `${visibleDialogTriggers}[1]`], ['wait', 500], ['shot', 'sort'], ['key', 'Escape'], ['wait', 400],
    ['click', `[...document.querySelectorAll('table tr button, article button')].find(b=>b.offsetParent && /LAMP-06/.test((b.closest('tr')||b).innerText))`], ['wait', 900], ['shot', 'detail'],
    ['click', `[...document.querySelectorAll('.product-detail-view .actions button')][0]`], ['wait', 600], ['shot', 'costform']]],
  ['assistant-panels', 'assistant', [390, 1440], [['eval', `${visibleDialogTriggers}.map(b=>b.getAttribute('aria-label')).join(' | ')`],
    ['click', `${visibleDialogTriggers}.find(b=>/period|date|ช่วง/i.test(b.getAttribute('aria-label')||''))`], ['wait', 600], ['shot', 'period'], ['key', 'Escape'], ['wait', 400],
    ['click', `${visibleDialogTriggers}.find(b=>/product|สินค้า/i.test(b.getAttribute('aria-label')||''))`], ['wait', 900], ['shot', 'products'], ['key', 'Escape'], ['wait', 400],
    ['click', `${visibleDialogTriggers}.find(b=>/histor|ประวัติ/i.test(b.getAttribute('aria-label')||''))`], ['wait', 700], ['shot', 'history'], ['key', 'Escape'], ['wait', 400],
    ['click', `[...document.querySelectorAll('main button')].find(b=>b.offsetParent && /กำไรเดือนนี้|profit this month|How much profit/i.test(b.innerText))`], ['wait', 3000], ['shot', 'answer']]],
  ['tablet-drawer', 'overview', [800, 900], [['shot', 'initial'], ['eval', 'document.querySelector(".drawer-toggle").getAttribute("aria-expanded")+" nav w="+Math.round(document.querySelector(".primary-nav").getBoundingClientRect().width)+" topbar w="+Math.round(document.querySelector(".topbar").getBoundingClientRect().width)'], ['click', q('.drawer-toggle')], ['wait', 500], ['shot', 'expanded'], ['eval', 'document.querySelector(".drawer-toggle").focus(); document.querySelector(".drawer-toggle").getAttribute("aria-expanded")+" topbar w="+Math.round(document.querySelector(".topbar").getBoundingClientRect().width)'], ['key', 'Escape'], ['wait', 300], ['eval', 'document.querySelector(".drawer-toggle").getAttribute("aria-expanded")+" focus="+document.activeElement.className'], ['shot', 'collapsed']]],
  ['playground-sim', 'playground', [390, 1440], [['eval', '[...document.querySelectorAll("main button")].filter(b=>b.offsetParent).map(b=>b.innerText.trim().slice(0,30)).slice(0,14).join(" | ")'], ['shot', 'initial']]],
  ['store-forms', 'store', [390, 1440], [['eval', '[...document.querySelectorAll("main button")].filter(b=>b.offsetParent).map(b=>b.innerText.trim().slice(0,30)).join(" | ")']]],
  ['finance-table', 'finance', [390, 1440], [['eval', `(()=>{const d=[...document.querySelectorAll('details')].find(x=>/daily|รายวัน/i.test(x.innerText)); d.open=true; d.scrollIntoView(); return 'opened'})()`], ['wait', 400], ['eval', `[...document.querySelectorAll('details table tbody tr')].slice(0,40).map(r=>r.innerText.replace(/\s+/g,' ')).filter(t=>/−|-/.test(t)).slice(0,4).join(' || ')`], ['eval', `/฿\s?-/.test(document.querySelector('main').innerText)+' titles:'+[...document.querySelectorAll('svg title')].map(t=>t.textContent).filter(t=>/[-−]/.test(t)).slice(0,2).join(' | ')`], ['shot', 'daily']]],
  ['addproduct-loss', 'addProduct', [390, 1440], [['eval', `(()=>{const set=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}))};const n=[...document.querySelectorAll('main input[type=number]')];set(n[0],'100');set(n[1],'150');if(n[2])set(n[2],'3');return n.length})()`], ['wait', 600], ['eval', `[...document.querySelectorAll('.preview-profit-number,.highlight-result strong,.preview-total-row dd')].map(e=>e.innerText).join(' | ')`], ['shot', 'preview']]],
].filter(f => !only.length || only.includes(f[0]));

const profile = join(HERE, '.chrome-profile-' + PORT); rmSync(profile, { recursive: true, force: true });
const proc = spawn(process.env.CHROME_PATH || '/opt/pw-browsers/chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets; for (let i = 0; i < 60 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); } }
const sock = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => sock.addEventListener('open', r));
let id = 0; const pending = new Map(); let logs = [];
sock.addEventListener('message', e => { const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(m.params.type)) logs.push(m.params.type + ': ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300));
  if (m.method === 'Runtime.exceptionThrown') logs.push('exception: ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 300)); });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const evalv = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r.result?.exceptionDetails ? 'EVAL_ERROR ' + r.result.exceptionDetails.text : r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable');
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{ if(location.port==='4060'){ localStorage.setItem('marginsight.locale.v1','${LANG}'); if(location.hash.length>1) sessionStorage.setItem('token','qa-token'); } }catch(e){}` });
// Probe: page overflow, open dialog geometry, small text, sign-less money, clipped text, focus.
const PROBE = `(()=>{const d=document.documentElement,vw=d.clientWidth,vh=innerHeight;
 const dlg=[...document.querySelectorAll('dialog[open]')].map(x=>{const r=x.getBoundingClientRect();return {cls:String(x.className).slice(0,40),x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),inView:r.left>=0&&r.top>=0&&r.right<=vw+1&&r.bottom<=vh+1}});
 const root=document.querySelector('dialog[open]')||document.querySelector('main')||document.body; const small=new Set(), ovf=[];
 for(const el of root.querySelectorAll('*')){ if(!el.getClientRects().length)continue; const own=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()); if(!own)continue; const cs=getComputedStyle(el); if(cs.visibility==='hidden')continue; const fs=parseFloat(cs.fontSize); if(fs<12&&!el.closest('.sr-only'))small.add(el.tagName+':'+fs+':'+el.textContent.trim().slice(0,20));
  if(el.scrollWidth>el.clientWidth+1&&cs.overflowX!=='visible'&&!/auto|scroll/.test(cs.overflowX)&&el.clientWidth>0)ovf.push(el.tagName+'.'+String(el.className).slice(0,30)+':'+el.textContent.trim().slice(0,25)); }
 const m=(root.innerText||'').match(/฿\\s?-|-\\s?฿/g);
 return {overflowX:d.scrollWidth>vw+1, scrollW:d.scrollWidth, vw, dialogs:dlg, small:[...small].slice(0,8), signBad:m||[], textClipped:ovf.slice(0,8), active:(document.activeElement?.tagName+' '+(document.activeElement?.getAttribute('aria-label')||document.activeElement?.innerText||'').trim().slice(0,30))};})()`;
const results = [];
for (const [name, hash, widths, steps] of FLOWS) for (const w of widths) {
  logs = []; const rec = { flow: name, width: w, lang: LANG, steps: [] };
  await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 600 });
  await send('Page.navigate', { url: BASE + '/login/#' + hash });
  for (let t = 0; t < 30; t++) { await sleep(400); if (await evalv(`!document.querySelector('.loading-state,[aria-busy=true]') && !document.querySelector('.entry-panel') && (document.querySelector('main')?.innerText.length||0)>50`)) break; }
  await sleep(1300);
  for (const [kind, arg] of steps) {
    if (kind === 'wait') await sleep(arg);
    else if (kind === 'click') { const r = await evalv(`(()=>{const e=${arg}; if(!e) return 'NOT_FOUND'; e.scrollIntoView({block:'center'}); e.click(); return 'ok '+(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,40)})()`); rec.steps.push(['click', r]); }
    else if (kind === 'key') { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: arg, code: arg, windowsVirtualKeyCode: arg === 'Escape' ? 27 : 0 }); rec.steps.push(['key', arg]); }
    else if (kind === 'eval') rec.steps.push(['eval', await evalv(arg)]);
    else if (kind === 'shot') { const p = await evalv(PROBE); const file = `${name}-${w}-${arg}.png`; const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, file), Buffer.from(s.result.data, 'base64')); rec.steps.push(['shot', file, p]); }
  }
  rec.console = logs; results.push(rec);
  console.log(name, w, LANG, JSON.stringify(rec.steps.map(s => s[0] === 'shot' ? [s[1], { ovf: s[2]?.overflowX, dlg: s[2]?.dialogs, small: s[2]?.small, sign: s[2]?.signBad, clip: s[2]?.textClipped, active: s[2]?.active }] : s)), 'console=' + JSON.stringify(logs));
}
writeFileSync(join(out, 'interact.json'), JSON.stringify(results, null, 2));
sock.close(); proc.kill(); await sleep(400); try { rmSync(profile, { recursive: true, force: true }); } catch {}
