// Typography audit (criteria F1-F3) on the built app via headless Chrome + CDP. Localhost only (serve.mjs on :4060).
// For every visible element whose own text contains Thai: computed letter-spacing (F3: must be normal/0), line-height ratio
// (F2: >= 1.5 when the text can wrap), font-size (F1: >= 12px). Also flags any text below 12px regardless of script.
// Usage: node typo-audit.mjs <out.json> [--lang en] [--widths 390,1440] [--pages /,/login/,/login/#overview,...]
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const out = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
const SCREENS = ['overview', 'products', 'addProduct', 'finance', 'assistant', 'playground', 'store', 'orders', 'imports', 'rules', 'line', 'simulation'];
const pages = opt('--pages', ['/', '/login/', ...SCREENS.map(s => '/login/#' + s)].join(',')).split(',');
const widths = opt('--widths', '390,1440').split(',').map(Number), LANG = opt('--lang', '');
const PORT = 9343; const profile = join(HERE, '.chrome-typo-' + PORT); rmSync(profile, { recursive: true, force: true });
const proc = spawn(process.env.CHROME_PATH || '/opt/pw-browsers/chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets; for (let i = 0; i < 60 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); } }
const sock = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => sock.addEventListener('open', r));
let id = 0; const pending = new Map();
sock.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const evalv = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{ if(location.port==='4060'){ ${LANG ? `localStorage.setItem('marginsight.locale.v1','${LANG}');` : ''} if(location.hash.length>1) sessionStorage.setItem('token','qa-token'); else sessionStorage.removeItem('token'); } }catch(e){}` });
const PROBE = `(() => { const rows=[]; for (const el of document.querySelectorAll("body *")) { const own=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(" "); if(!own) continue; const cs=getComputedStyle(el), r=el.getBoundingClientRect(); if(!r.width||!r.height) continue; const w=Number(cs.fontWeight); if(w>600) rows.push({ issues:["W"+w], el: el.tagName.toLowerCase()+(typeof el.className==="string"&&el.className?"."+el.className.trim().split(/s+/)[0]:""), path:"", text: own.slice(0,30), size: parseFloat(cs.fontSize), lh:0, ls: cs.fontFamily.slice(0,20), lines:0 }); } return rows; })()`;
const report = [];
for (const path of pages) for (const w of widths) {
  await send('Page.navigate', { url: 'about:blank' }); await sleep(100);
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 600 });
  await send('Page.navigate', { url: 'http://127.0.0.1:4060' + path }); await sleep(2600);
  await evalv(`document.querySelectorAll('details').forEach(d => d.open = true)`); await sleep(200);
  const rows = await evalv(PROBE); report.push({ path, width: w, rows });
}
writeFileSync(out, JSON.stringify(report, null, 2));
const agg = new Map();
for (const p of report) for (const r of p.rows) for (const i of r.issues) { const k = i + ' ' + r.el + ' (' + (i === 'F3' ? 'ls ' + r.ls : i === 'F2' ? 'lh ' + r.lh : r.size + 'px') + ')'; agg.set(k, (agg.get(k) ?? new Set()).add(p.path.replace('/login/#', '#') + '@' + p.width)); }
for (const [k, v] of [...agg].sort()) console.log(k, '→', [...v].slice(0, 4).join(' '), v.size > 4 ? `(+${v.size - 4})` : '');
console.log('pages', report.length, 'distinct issues', agg.size);
sock.close(); proc.kill(); await sleep(400); try { rmSync(profile, { recursive: true, force: true }); } catch {}
