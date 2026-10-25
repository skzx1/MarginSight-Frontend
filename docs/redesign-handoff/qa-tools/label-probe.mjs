// SVG chart label probe (C7): for every <text> in the overview and finance charts (all finance modes), checks pairwise
// overlap of rendered boxes, overflow outside the svg box, and records the rendered (scaled) font size.
// Usage: node label-probe.mjs <out.json> [--lang en] [--widths 320,390,...]   (needs serve.mjs on 127.0.0.1:4060)
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const out = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
const LANG = opt('--lang', ''), widths = opt('--widths', '320,390,640,768,900,1024,1280,1440,1920').split(',').map(Number);
const PORT = 9345; const profile = join(HERE, '.chrome-label-' + PORT); rmSync(profile, { recursive: true, force: true });
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
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{ ${LANG ? `localStorage.setItem('marginsight.locale.v1','${LANG}');` : ''} if(location.hash.length>1) sessionStorage.setItem('token','qa-token'); }catch(e){}` });
const READ = `document.fonts.ready.then(() => [...document.querySelectorAll('svg[role=img]')].filter(svg => svg.querySelector('text')).map(svg => {
  const box = svg.getBoundingClientRect(); const texts = [...svg.querySelectorAll('text')].map(t => { const r = t.getBoundingClientRect(); return { s: t.textContent, x: r.left, y: r.top, w: r.width, h: r.height, px: +(parseFloat(getComputedStyle(t).fontSize) * box.width / svg.viewBox.baseVal.width).toFixed(1) }; });
  const overlaps = []; for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) { const a = texts[i], b = texts[j]; const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (ox > 0.5 && oy > 0.5) overlaps.push(a.s + ' x ' + b.s); }
  const outside = texts.filter(t => t.x < box.left - 0.5 || t.x + t.w > box.right + 0.5 || t.y < box.top - 0.5 || t.y + t.h > box.bottom + 0.5).map(t => t.s);
  return { chart: svg.getAttribute('aria-label')?.slice(0, 24), labels: texts.length, overlaps, outside, minRenderedPx: Math.min(...texts.map(t => t.px)), family: getComputedStyle(svg.querySelector('text')).fontFamily.slice(0, 40) };
}))`;
const report = [];
for (const w of widths) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 600 });
  for (const [page, modes] of [['/login/#overview', [null]], ['/login/#finance', [0, 1, 2]]]) {
    await send('Page.navigate', { url: 'about:blank' }); await sleep(100);
    await send('Page.navigate', { url: 'http://127.0.0.1:4060' + page }); await sleep(2600);
    for (const mode of modes) {
      if (mode != null) { await evalv(`document.querySelectorAll('section[aria-labelledby=finance-trend-title] [role=group] button')[${mode}]?.click()`); await sleep(300); }
      for (const c of await evalv(READ)) report.push({ width: w, page: page.replace('/login/#', '') + (mode == null ? '' : ['-profit', '-sales', '-margin'][mode]), ...c });
    }
  }
}
writeFileSync(out, JSON.stringify(report, null, 2));
const bad = report.filter(r => r.overlaps.length || r.outside.length);
console.log(`charts measured ${report.length}; with overlap/overflow ${bad.length}`);
for (const r of bad) console.log(`${r.width} ${r.page} ${r.chart}: overlaps=${JSON.stringify(r.overlaps)} outside=${JSON.stringify(r.outside)}`);
console.log('min rendered label px by width:', JSON.stringify(Object.fromEntries(widths.map(w => [w, Math.min(...report.filter(r => r.width === w).map(r => r.minRenderedPx))]))));
console.log('label family:', report[0]?.family);
sock.close(); proc.kill(); await sleep(400); try { rmSync(profile, { recursive: true, force: true }); } catch {}
