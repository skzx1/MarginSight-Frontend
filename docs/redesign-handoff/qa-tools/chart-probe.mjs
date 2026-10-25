// P1b chart probe: reads the rendered charts on overview and finance (all three finance modes) and screenshots each chart.
// Usage: node chart-probe.mjs <outDir> [--lang en] [--vision <mode>] [--widths 390,1440]   (needs serve.mjs on 127.0.0.1:4060)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const out = args[0]; mkdirSync(out, { recursive: true });
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
const LANG = opt('--lang', ''), VISION = opt('--vision', ''), widths = opt('--widths', '390,1440').split(',').map(Number);
const PORT = 9339; const profile = join(HERE, '.chrome-chart-' + PORT); rmSync(profile, { recursive: true, force: true });
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets; for (let i = 0; i < 60 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); } }
const sock = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => sock.addEventListener('open', r));
let id = 0; const pending = new Map(); const logs = [];
sock.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; } if (m.method === 'Runtime.exceptionThrown' || (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')) logs.push(JSON.stringify(m.params).slice(0, 300)); });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
const evalv = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
if (VISION) await send('Emulation.setEmulatedVisionDeficiency', { type: VISION });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{ if(location.port==='4060'){ ${LANG ? `localStorage.setItem('marginsight.locale.v1','${LANG}');` : ''} if(location.hash.length>1) sessionStorage.setItem('token','qa-token'); } }catch(e){}` });

const READ = `(() => {
  const svgOf = el => el?.closest('section')?.querySelector('svg[role=img]');
  const cs = el => getComputedStyle(el);
  const series = sel => [...document.querySelectorAll(sel)].map(p => ({ cls: p.getAttribute('class'), stroke: cs(p).stroke, dash: cs(p).strokeDasharray, width: cs(p).strokeWidth }));
  const marks = [...document.querySelectorAll('svg[role=img] .series-mark')].reduce((a, m) => { const k = m.tagName + '.' + m.getAttribute('class').split(' ')[1] + ':' + cs(m).fill; a[k] = (a[k] || 0) + 1; return a; }, {});
  const donut = [...document.querySelectorAll('.channel-donut circle[class^=channel-color]')].map(c => c.getAttribute('class') + ':' + cs(c).stroke);
  const key = [...document.querySelectorAll('.channel-key li')].map(li => li.querySelector('span').childNodes[1]?.textContent + '→' + li.querySelector('i').className + ':' + cs(li.querySelector('i')).backgroundColor);
  const swatches = [...document.querySelectorAll('.series-swatch')].length;
  return { lines: series('svg[role=img] .series-line'), marks, zero: document.querySelectorAll('svg[role=img] .chart-zero').length, rings: [...document.querySelectorAll('.chart-highlight-ring')].map(r => cs(r).stroke + ' fill=' + cs(r).fill), donut, key, swatches, legacy: document.querySelectorAll('[class*=channel-color-0],[class*=channel-color-1],.sales-line,.profit-line').length };
})()`;
const shot = async (sel, file) => {
  const r = await evalv(`(() => { const el = document.querySelector('${sel}'); if (!el) return null; el.scrollIntoView({ block: 'start' }); const b = el.getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height }; })()`);
  if (!r) return false; await sleep(250);
  const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
  writeFileSync(join(out, file), Buffer.from(s.result.data, 'base64')); return true;
};
const report = [];
for (const w of widths) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 600 });
  await send('Page.navigate', { url: 'about:blank' }); await sleep(100);
  await send('Page.navigate', { url: 'http://127.0.0.1:4060/login/#overview' }); await sleep(3000);
  const ov = await evalv(READ); await shot('.performance-panel', `overview-trend-${w}.png`); await shot('.channel-panel', `overview-channels-${w}.png`);
  report.push({ page: 'overview', width: w, ...ov });
  await send('Page.navigate', { url: 'about:blank' }); await sleep(100);
  await send('Page.navigate', { url: 'http://127.0.0.1:4060/login/#finance' }); await sleep(3000);
  for (const [i, mode] of ['profit', 'sales', 'margin'].entries()) {
    await evalv(`document.querySelectorAll('section[aria-labelledby=finance-trend-title] [role=group] button')[${i}]?.click()`); await sleep(400);
    const fi = await evalv(READ); report.push({ page: 'finance-' + mode, width: w, ...fi });
    await shot('section[aria-labelledby=finance-trend-title]', `finance-${mode}-${w}.png`);
  }
}
writeFileSync(join(out, 'chart-report.json'), JSON.stringify({ report, console: logs }, null, 2));
for (const r of report) console.log(`${r.page}@${r.width} lines=${r.lines.map(l => l.cls.replace('series-line ', '') + '[' + l.dash + ']').join(',')} marks=${JSON.stringify(r.marks)} zero=${r.zero} rings=${r.rings.length} donut=${r.donut.length} key=${r.key.length} swatches=${r.swatches} legacy=${r.legacy}`);
console.log('console errors:', logs.length);
sock.close(); proc.kill(); await sleep(400); try { rmSync(profile, { recursive: true, force: true }); } catch {}
