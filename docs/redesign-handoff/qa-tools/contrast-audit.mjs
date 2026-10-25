// Computed-style contrast audit via headless Chrome + CDP against the static export served by serve.mjs (127.0.0.1:4060).
// Usage: node contrast-audit.mjs <out.json> [--pages /,/login/] [--widths 390,1440] [--lang en]
// For every visible element with its own text: computed color vs the effective background (ancestor background-colors
// composited in sRGB). Elements whose background chain hits a background-image are reported as 'image' with the best
// solid estimate, so gradients/photos are reviewed by hand, never auto-passed.
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const out = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
const pages = opt('--pages', '/,/login/').split(',');
const widths = opt('--widths', '390,1440').split(',').map(Number);
const LANG = opt('--lang', '');
const PORT = 9337;
const profile = join(HERE, '.chrome-audit-' + PORT); rmSync(profile, { recursive: true, force: true });
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run', '--hide-scrollbars', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets; for (let i = 0; i < 60 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); } }
const sock = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => sock.addEventListener('open', r));
let id = 0; const pending = new Map();
sock.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const evalv = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
// Same QA auth as capture.mjs: hash routes get the mock token, plain pages stay signed out.
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{ if(location.port==='4060'){ ${LANG ? `localStorage.setItem('marginsight.locale.v1','${LANG}');` : ''} if(location.hash.length>1) sessionStorage.setItem('token','qa-token'); else sessionStorage.removeItem('token'); } }catch(e){}` });

const PROBE = `(() => {
  const parse = c => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) { const s = c.match(/srgb ([\\d.]+) ([\\d.]+) ([\\d.]+)(?: \\/ ([\\d.]+))?/); return s ? [s[1]*255, s[2]*255, s[3]*255, s[4] == null ? 1 : +s[4]] : null; } const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; };
  const over = (top, under) => { const a = top[3]; return [0,1,2].map(i => top[i]*a + under[i]*(1-a)).concat(1); };
  const lum = c => { const l = c.slice(0,3).map(v => { v /= 255; return v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4; }); return .2126*l[0] + .7152*l[1] + .0722*l[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
  const hex = c => '#' + c.slice(0,3).map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
  const rows = [];
  for (const el of document.querySelectorAll('body *')) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' ');
    if (!own) continue;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    if (el.closest('[aria-hidden=true]') && !own) continue;
    let layers = [], image = false;
    for (let p = el; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.backgroundImage !== 'none') image = true; const c = parse(s.backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
    let bg = [255,255,255,1]; for (const l of layers.reverse()) bg = over(l, bg);
    const fg = over(parse(cs.color), bg);
    rows.push({ text: own.slice(0, 60), tag: el.tagName.toLowerCase(), cls: (typeof el.className === 'string' ? el.className : '').split(/\\s+/).slice(0,2).join('.'), fg: hex(fg), bg: hex(bg), ratio: +ratio(fg, bg).toFixed(2), size: parseFloat(cs.fontSize), weight: cs.fontWeight, image, hidden: !!el.closest('[aria-hidden=true]') });
  }
  return rows;
})()`;
const report = [];
for (const path of pages) for (const w of widths) {
  await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 600 });
  await send('Page.navigate', { url: 'http://127.0.0.1:4060' + path }); await sleep(2500);
  // Open every <details> so collapsed answers are audited too.
  await evalv(`document.querySelectorAll('details').forEach(d => d.open = true)`); await sleep(300);
  const rows = await evalv(PROBE);
  report.push({ path, width: w, rows });
  const fails = rows.filter(r => r.ratio < 4.5);
  console.log(`${path} @${w}: ${rows.length} text elements, <4.5: ${fails.length} (image-backed among them: ${fails.filter(r => r.image).length}), <12px: ${rows.filter(r => r.size < 12).length}`);
}
writeFileSync(out, JSON.stringify(report, null, 2));
sock.close(); proc.kill(); await sleep(500); try { rmSync(profile, { recursive: true, force: true }); } catch {}
