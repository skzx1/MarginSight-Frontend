// P2 font probe (headless Chrome, CDP): which platform font actually renders each sample, plus a screenshot.
// Usage: node font-probe.mjs <outDir> [--stack "<font-family>"] [--page /] [--app]   (needs serve.mjs on 127.0.0.1:4060)
//   default: injects samples using var(--font-sans) / var(--font-numeric) / var(--font-display) at 400/500/600.
//   --app: instead reports the platform fonts used by real text nodes on the page (headings, body, numbers, buttons, chart axis).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const out = args[0]; mkdirSync(out, { recursive: true });
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
const PAGE = opt('--page', '/'), STACK = opt('--stack', ''), APP = args.includes('--app'), WIDTH = Number(opt('--width', '1440'));
const PORT = 9341; const profile = join(HERE, '.chrome-font-' + PORT); rmSync(profile, { recursive: true, force: true });
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets; for (let i = 0; i < 60 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); } }
const sock = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => sock.addEventListener('open', r));
let id = 0; const pending = new Map(); const failed = [];
sock.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; } if (m.method === 'Network.loadingFailed' || (m.method === 'Network.responseReceived' && m.params.response.status >= 400)) failed.push(m.params.response?.url ?? m.params.errorText); });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const evalv = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable'); await send('CSS.enable'); await send('Network.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{ if(location.hash.length>1) sessionStorage.setItem('token','qa-token'); }catch(e){}` });
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: WIDTH < 600 });
await send('Page.navigate', { url: 'http://127.0.0.1:4060' + PAGE }); await sleep(2500);

const SAMPLE = 'กำไรสุทธิ ฿6,349.15 — ขาดทุน −฿191.00 · ก้ำ ญ ฐ ฎ ฏ ปุ่ ฦ ๙ Profit 0123456789 MarginShot';
if (!APP) {
  const stacks = STACK ? [['custom', STACK]] : [['sans', 'var(--font-sans)'], ['numeric', 'var(--font-numeric)'], ['display', 'var(--font-display)']];
  await evalv(`(() => { const box = document.createElement('div'); box.id = 'font-probe'; box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;color:#141413;padding:16px;overflow:auto';
    for (const [name, stack] of ${JSON.stringify(stacks)}) for (const w of [400, 500, 600]) { const p = document.createElement('p'); p.dataset.probe = name + '-' + w; p.style.cssText = 'margin:0 0 6px;font-size:20px;line-height:1.6;font-family:' + stack + ';font-weight:' + w; p.textContent = name + ' ' + w + ': ' + ${JSON.stringify(SAMPLE)}; box.append(p); }
    document.body.append(box); })()`);
  await evalv('document.fonts.ready.then(() => true)'); await sleep(600);
}
const { root } = (await send('DOM.getDocument', { depth: -1 })).result;
const query = async sel => (await send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: sel })).result.nodeIds;
const report = { page: PAGE, width: WIDTH, rows: [] };
const sels = APP ? ['h1', 'h2', 'h3', 'p', 'button', '.money', 'td', 'th', '.chart-axis', 'svg text', 'label', 'small', 'strong', 'b'] : ['[data-probe]'];
for (const sel of sels) {
  const ids = (await query(sel)).slice(0, APP ? 6 : 50);
  for (const nodeId of ids) {
    const fonts = (await send('CSS.getPlatformFontsForNode', { nodeId })).result?.fonts ?? [];
    const st = (await send('CSS.getComputedStyleForNode', { nodeId })).result?.computedStyle ?? [];
    const v = k => st.find(x => x.name === k)?.value;
    const label = (await send('DOM.describeNode', { nodeId })).result.node.attributes?.join(' ').slice(0, 60);
    if (!fonts.length) continue;
    report.rows.push({ sel, label, weight: v('font-weight'), size: v('font-size'), family: v('font-family'), fonts: fonts.map(f => `${f.familyName}${f.isCustomFont ? '*' : ''}:${f.glyphCount}`) });
  }
}
const loaded = await evalv(`[...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight)`);
const shot = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, `fonts-${APP ? 'app' : 'samples'}-${PAGE.replace(/\W+/g, '_') || 'root'}-${WIDTH}.png`), Buffer.from(shot.result.data, 'base64'));
writeFileSync(join(out, `fonts-${APP ? 'app' : 'samples'}-${PAGE.replace(/\W+/g, '_') || 'root'}-${WIDTH}.json`), JSON.stringify({ ...report, loaded, failed }, null, 2));
for (const r of report.rows) console.log(`${r.sel.padEnd(11)} w=${r.weight} ${r.size} ${r.fonts.join(' + ')}  [${(r.label ?? '').slice(0, 30)}]`);
console.log('loaded faces:', JSON.stringify(loaded)); console.log('failed requests:', failed.length, failed.slice(0, 5).join(' '));
sock.close(); proc.kill(); await sleep(400); try { rmSync(profile, { recursive: true, force: true }); } catch {}
