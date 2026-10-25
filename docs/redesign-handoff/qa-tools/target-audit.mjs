// Target-size audit (criteria F4, R43): visible interactive elements smaller than 44x44 CSS px, per page and width.
// Inline text links inside sentences and native checkboxes/radios are exempt (WCAG 2.5.8 inline exception).
// Usage: node target-audit.mjs <out.json> [--lang en] [--widths 390,1440] [--pages ...]   (serve.mjs on 127.0.0.1:4060)
// A page-side exception aborts the run with its message instead of producing an empty report.
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const out = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
const SCREENS = ['overview', 'products', 'addProduct', 'finance', 'assistant', 'playground', 'store', 'orders', 'imports', 'receipts', 'rules', 'line', 'simulation'];
const pages = opt('--pages', ['/', '/login/', ...SCREENS.map(s => '/login/#' + s)].join(',')).split(',');
const widths = opt('--widths', '390,1440').split(',').map(Number), LANG = opt('--lang', '');
const PORT = 9347; const profile = join(HERE, '.chrome-target-' + PORT); rmSync(profile, { recursive: true, force: true });
const proc = spawn(process.env.CHROME_PATH || '/opt/pw-browsers/chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const done = () => { try { proc.kill(); } catch {} };
process.on('exit', done);
let targets; for (let i = 0; i < 60 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); } }
const sock = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => sock.addEventListener('open', r));
let id = 0; const pending = new Map();
sock.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async expr => {
  const res = (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result;
  if (res?.exceptionDetails) throw new Error('page evaluation failed: ' + (res.exceptionDetails.exception?.description ?? res.exceptionDetails.text));
  return res?.result?.value;
};
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{ if(location.port==='4060'){ ${LANG ? `localStorage.setItem('marginsight.locale.v1','${LANG}');` : ''} if(location.hash.length>1) sessionStorage.setItem('token','qa-token'); else sessionStorage.removeItem('token'); } }catch(e){}` });
const PROBE = String.raw`(() => {
  const rows = [];
  for (const el of document.querySelectorAll('a[href],button,input,select,textarea,summary,[role=button],[tabindex="0"]')) {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    if (!r.width || !r.height || cs.visibility === 'hidden' || el.closest('[aria-hidden=true]')) continue;
    if (el.tagName === 'A' && cs.display === 'inline' && el.closest('p,li,td,small,dd')) continue;
    if (el.type === 'checkbox' || el.type === 'radio') continue;
    if (r.width < 44 || r.height < 44) rows.push({ el: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : ''), text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 24), size: Math.round(r.width) + 'x' + Math.round(r.height) });
  }
  return rows;
})()`;
const report = [];
for (const path of pages) for (const w of widths) {
  await send('Page.navigate', { url: 'about:blank' }); await sleep(100);
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 600 });
  await send('Page.navigate', { url: 'http://127.0.0.1:4060' + path }); await sleep(2200);
  const rows = await evaluate(PROBE);
  if (!Array.isArray(rows)) throw new Error(`no result for ${path} @${w}`);
  report.push({ path, width: w, rows });
}
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`pages ${report.length}; small targets ${report.reduce((n, p) => n + p.rows.length, 0)}`);
sock.close(); done(); await sleep(400); try { rmSync(profile, { recursive: true, force: true }); } catch {}
