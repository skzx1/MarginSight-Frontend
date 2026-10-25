// P1a-I1 probe: measure the hero pill and the scene footer caption as built (A) and with a 12px override (B), without touching the repo.
// Usage: node i1-probe.mjs <out.json> [--lang en]   (needs serve.mjs on 127.0.0.1:4060)
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const out = args[0];
const LANG = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : '';
const PORT = 9338; const profile = join(HERE, '.chrome-i1-' + PORT); rmSync(profile, { recursive: true, force: true });
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets; for (let i = 0; i < 60 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); } }
const sock = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => sock.addEventListener('open', r));
let id = 0; const pending = new Map();
sock.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const evalv = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
if (LANG) await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('marginsight.locale.v1','${LANG}')}catch(e){}` });
const MEASURE = `(() => {
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), font: cs.fontSize, lh: cs.lineHeight, display: cs.display }; };
  const pill = document.querySelector('[class*=heroCopy] > p'); const copy = document.querySelector('[class*=heroCopy]');
  const actions = document.querySelector('[class*=heroCopy] [class*=actions]');
  const foot = document.querySelector('[class*=sceneFooter]'); const span = foot?.querySelector('span'); const tag = foot?.querySelector('p');
  const lines = el => { if (!el) return 0; const r = document.createRange(); r.selectNodeContents(el); return new Set([...r.getClientRects()].map(x => Math.round(x.top))).size; };
  const hit = (a, b) => a && b && a.w && b.w && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const P = box(pill), C = box(copy), A = box(actions), F = box(foot), S = box(span);
  return { pill: P, pillLines: lines(pill), copy: C, footer: F, span: S, spanLines: lines(span), footerHitsCopy: hit(F, C), footerHitsActions: hit(F, A), docScrollW: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth, heroH: Math.round(document.querySelector('[class*=depthHero]').getBoundingClientRect().height) };
})()`;
const OVERRIDE = `(() => { const s = document.createElement('style'); s.textContent = '[class*=heroCopy] > p{font-size:12px!important} [class*=sceneFooter] > span{font-size:12px!important}'; document.head.append(s); })()`;
const report = [];
for (const w of [320, 360, 390, 414, 600, 601, 640, 768, 900, 1024, 1280, 1440, 1920]) {
  await send('Page.navigate', { url: 'about:blank' }); await sleep(100);
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 600 });
  await send('Page.navigate', { url: 'http://127.0.0.1:4060/' }); await sleep(1800);
  const a = await evalv(MEASURE); await evalv(OVERRIDE); await sleep(200); const b = await evalv(MEASURE);
  report.push({ width: w, current: a, at12: b });
  const f = x => `pill ${x.pill.font} ${x.pill.w}x${x.pill.h} lines=${x.pillLines} | caption ${x.span?.font ?? '-'} ${x.span?.display === 'none' || !x.span?.w ? 'hidden' : x.span.w + 'w lines=' + x.spanLines} hitsCopy=${x.footerHitsCopy} hitsActions=${x.footerHitsActions} | heroH=${x.heroH} overflow=${x.docScrollW > x.vw}`;
  console.log(String(w).padStart(4), 'NOW ', f(a)); console.log(String(w).padStart(4), '12px', f(b));
}
writeFileSync(out, JSON.stringify(report, null, 2));
sock.close(); proc.kill(); await sleep(400); try { rmSync(profile, { recursive: true, force: true }); } catch {}
