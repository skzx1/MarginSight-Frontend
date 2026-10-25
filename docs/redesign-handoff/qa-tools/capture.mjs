// QA capture via headless Chrome + CDP (Node 24 built-in WebSocket/fetch). Localhost only.
// Usage: node capture.mjs <outPngDir> [--only overview,products] [--widths 390,1440] [--reduced-motion] [--zoom] [--no-extra] [--port 9335]
//   default: / and /login/ + 13 app screens @390,1440 (+320,768 for overview/products/finance)
//   --zoom: extra run for overview/products at 1440 window with deviceScaleFactor 2 + CSS zoom-equivalent (720 CSS px viewport)
//   --reduced-motion: emulate prefers-reduced-motion: reduce for all shots
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const out = args[0]; if (!out) { console.error('usage: node capture.mjs <outDir> [...]'); process.exit(1); }
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
const flag = k => args.includes(k);
mkdirSync(out, { recursive: true });
const BASE = opt('--base', 'http://127.0.0.1:4060'); if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)) throw Error('localhost only');
const PORT = Number(opt('--port', '9335'));
const REDUCED = flag('--reduced-motion');
const LANG = opt('--lang', ''); // e.g. --lang en (sets the app's stored locale before load)
const SCREENS = ['overview', 'products', 'addProduct', 'finance', 'assistant', 'playground', 'store', 'orders', 'imports', 'receipts', 'rules', 'line', 'simulation'];
const EXTRA = ['overview', 'products', 'finance'];
const only = opt('--only', '').split(',').filter(Boolean);
const widths = opt('--widths', '390,1440').split(',').map(Number);
const jobs = [];
const pages = [['landing', '/', false], ['login', '/login/', false], ...SCREENS.map(s => [s, '/login/#' + s, true])].filter(([n]) => !only.length || only.includes(n));
for (const [name, path, auth] of pages) {
  const ws = new Set(widths); if (!flag('--no-extra') && EXTRA.includes(name)) { ws.add(320); ws.add(768); }
  for (const w of [...ws].sort((a, b) => a - b)) jobs.push({ name, path, auth, w, h: w < 600 ? 844 : 900, dsf: 1, tag: String(w) });
}
if (flag('--zoom')) for (const name of ['overview', 'products']) if (!only.length || only.includes(name))
  jobs.push({ name, path: '/login/#' + name, auth: true, w: 720, h: 450, dsf: 2, tag: 'zoom200' }); // 1440x900 device px at 200% = 720x450 CSS px

const profile = join(HERE, '.chrome-profile-' + PORT); rmSync(profile, { recursive: true, force: true });
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--disable-extensions', '--lang=th-TH', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets; for (let i = 0; i < 60 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); } }
const sock = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => sock.addEventListener('open', r));
let id = 0; const pending = new Map(); let logs = [];
sock.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(m.params.type)) logs.push({ type: m.params.type, text: m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 400) });
  if (m.method === 'Runtime.exceptionThrown') logs.push({ type: 'exception', text: (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 400) });
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') logs.push({ type: 'log-' + m.params.entry.source, text: (m.params.entry.text + ' ' + (m.params.entry.url ?? '')).slice(0, 400) });
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const evalv = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
const VISION = opt('--vision', ''); if (VISION) await send('Emulation.setEmulatedVisionDeficiency', { type: VISION });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: REDUCED ? 'reduce' : 'no-preference' }] });
// Auth: the app reads sessionStorage 'token' (lib/auth.ts session()). Set it before any app script runs on hash routes only.
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{ if(location.port==='4060'){ ${LANG ? "localStorage.setItem('marginsight.locale.v1','" + LANG + "');" : ''} if(location.hash.length>1) sessionStorage.setItem('token','qa-token'); else { sessionStorage.removeItem('token'); } } }catch(e){}` });

const report = { base: BASE, reducedMotion: REDUCED, startedAt: new Date().toISOString(), shots: [] };
const PROBE = `(async()=>{
  const d=document.documentElement, b=document.body;
  const vw=d.clientWidth, offenders=[];
  for(const el of document.querySelectorAll('body *')){const r=el.getBoundingClientRect(); if(r.width>0&&(r.right>vw+1||r.left<-1)){ let p=el.parentElement, clipped=false; while(p&&p!==b){const cs=getComputedStyle(p); if(/(auto|scroll|hidden|clip)/.test(cs.overflowX)){const pr=p.getBoundingClientRect(); if(pr.right<=vw+1&&pr.left>=-1){clipped=true;break;}} p=p.parentElement;} if(!clipped&&getComputedStyle(el).position!=='fixed') offenders.push((el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className?'.'+el.className.trim().split(/\\s+/).slice(0,2).join('.'):'')+' ['+Math.round(r.left)+'..'+Math.round(r.right)+']')); if(offenders.length>8)break;}}
  const txt=(b.innerText||'');
  return {scrollW:d.scrollWidth, clientW:vw, bodyScrollW:b.scrollWidth, overflowX:d.scrollWidth>vw+1, h:d.scrollHeight, title:document.title,
    loading:document.querySelectorAll('.loading-state,[aria-busy=true]').length, errors:[...document.querySelectorAll('.error-notice')].map(e=>e.innerText.replace(/\\s+/g,' ').slice(0,160)),
    empties:[...document.querySelectorAll('.empty-state h2')].map(e=>e.innerText.slice(0,80)), h1:(document.querySelector('h1,h2')?.innerText||'').slice(0,80),
    hash:location.hash, landing:!!document.querySelector('.entry-panel'), offenders, textLen:txt.length};
})()`;
for (const j of jobs) {
  logs = [];
  await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
  await send('Emulation.setDeviceMetricsOverride', { width: j.w, height: j.h, deviceScaleFactor: j.dsf, mobile: j.w < 600 });
  await send('Page.navigate', { url: BASE + j.path });
  let m; const t0 = Date.now();
  await sleep(1200);
  for (;;) { m = await evalv(PROBE); if ((m && !m.loading && (!j.auth || !m.landing)) || Date.now() - t0 > 12000) break; await sleep(400); }
  await sleep(REDUCED ? 500 : 1300); // let entrance animations / count-ups settle
  m = await evalv(PROBE);
  const file = `${j.name}-${j.tag}.png`;
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: j.w, height: Math.min(m.h, 12000), scale: 1 } });
  writeFileSync(join(out, file), Buffer.from(shot.result.data, 'base64'));
  // Above-the-fold shot: fixed bars (mobile bottom nav, 100vh sidebar) sit where a user sees them.
  await evalv('window.scrollTo(0,0)');
  const fold = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, `${j.name}-${j.tag}-fold.png`), Buffer.from(fold.result.data, 'base64'));
  const rec = { file, name: j.name, path: j.path, width: j.w, dsf: j.dsf, ...m, console: logs, waitedMs: Date.now() - t0 };
  if (j.auth && m.landing) rec.warning = 'NOT_AUTHENTICATED (landing/login panel shown)';
  report.shots.push(rec);
  console.log(`${file.padEnd(26)} overflow=${m.overflowX ? 'YES ' + m.scrollW + '>' + m.clientW : 'no'} loading=${m.loading} errors=${m.errors.length} empty=${m.empties.length} console=${logs.length}${rec.warning ? ' ' + rec.warning : ''}`);
}
report.summary = { total: report.shots.length, overflow: report.shots.filter(s => s.overflowX).map(s => s.file), withConsoleErrors: report.shots.filter(s => s.console.length).map(s => s.file), errorNotices: report.shots.filter(s => s.errors.length).map(s => s.file), stillLoading: report.shots.filter(s => s.loading).map(s => s.file), unauthenticated: report.shots.filter(s => s.warning).map(s => s.file) };
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
sock.close(); proc.kill(); await sleep(500); try { rmSync(profile, { recursive: true, force: true }); } catch {}
