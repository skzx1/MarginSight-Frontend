// P3 computed semantic probe (L2 rev1) + money text scan + one loss cell accessible name.
// Usage: node semantic-probe.mjs <out.json> [--lang en] [--widths 390,1440] [--pages ...]
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2); const out = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
const SCREENS = ['overview', 'finance', 'products', 'addProduct', 'assistant', 'store', 'imports', 'orders'];
const pages = opt('--pages', ['/', '/login/', ...SCREENS.map(s => '/login/#' + s)].join(',')).split(',');
const widths = opt('--widths', '390,1440').split(',').map(Number), LANG = opt('--lang', '');
const PORT = 9361 + (LANG ? 1 : 0); const profile = join(HERE, '.chrome-sem-' + PORT); rmSync(profile, { recursive: true, force: true });
const proc = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
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
await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable'); await send('Accessibility.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{ if(location.port==='4060'){ ${LANG ? `localStorage.setItem('marginsight.locale.v1','${LANG}');` : ''} if(location.hash.length>1) sessionStorage.setItem('token','qa-token'); else sessionStorage.removeItem('token'); } }catch(e){}` });
const PROBE = String.raw`(() => {
  const probe = document.createElement('i'); document.body.appendChild(probe);
  const resolve = v => { probe.style.color = 'var(' + v + ')'; return getComputedStyle(probe).color; };
  const TOK = ['--color-action','--color-link','--color-indicator','--color-brand-bright','--color-focus','--color-accent','--chart-highlight','--terracotta-400','--terracotta-450','--terracotta-500','--terracotta-600','--terracotta-650','--terracotta-700','--color-focus-on-dark','--color-indicator-on-dark','--color-emphasis-on-dark'];
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; };
  const terra = TOK.map(t => ({ t, c: parse(resolve(t)) })).filter(x => x.c);
  probe.remove();
  const isTerra = c => { const p = parse(c); if (!p || p[3] === 0) return null; const hit = terra.find(x => Math.abs(x.c[0]-p[0]) + Math.abs(x.c[1]-p[1]) + Math.abs(x.c[2]-p[2]) <= 9); return hit ? hit.t : null; };
  const lum = p => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126*f(p[0]) + 0.7152*f(p[1]) + 0.0722*f(p[2]); };
  const effBg = el => { let layers = [], img = false; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.backgroundImage !== 'none') img = true; const p = parse(cs.backgroundColor); if (p && p[3] > 0) { layers.push(p); if (p[3] >= 1) break; } } let c = [255,255,255]; for (const l of layers.reverse()) c = c.map((v, i) => v * (1 - l[3]) + l[i] * l[3]); return { c, img }; };
  const contrast = el => { const cs = getComputedStyle(el); const fg = parse(cs.color); const { c, img } = effBg(el); const a = fg[3]; const f = fg.slice(0,3).map((v, i) => v * a + c[i] * (1 - a)); const L1 = lum(f), L2 = lum(c); return { ratio: +(((Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05)).toFixed(2)), img }; };
  const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('.sr-only'); };
  const ownText = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  const desc = el => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0,2).join('.') : '') + (el.dataset.tone ? '[tone=' + el.dataset.tone + ']' : '');
  const MONEYRE = /฿|%|\d[\d,]*\.\d{2}\b|บาท|baht/i;
  const FINSEL = '.money,[data-tone],.profit-value,.preview-profit-number,.order-profit-sub,[class*=kpi],[class*=Kpi],[class*=_net],[class*=_loss],[class*=_profit],.mark-loss,.mark-profit,.landing-ledger *,.profit-ledger *,.ledger-lines *,[class*=alertCard] *';
  const STSEL = '.badge,[class*=badge],[class*=Badge],.notice,[class*=notice],[class*=Notice],[class*=toast],[class*=Toast],[class*=banner],[class*=Banner],[class*=success],[class*=Success],[class*=alert],[class*=Alert],[role=status],[role=alert],.margin-status-tag,[class*=row-status],[class*=status-tag],[class*=statusCounts] *';
  const fin = new Set(), st = new Set();
  for (const el of document.querySelectorAll(FINSEL)) if (vis(el)) fin.add(el);
  for (const el of document.querySelectorAll('body *')) { if (!vis(el) || ['SCRIPT','STYLE'].includes(el.tagName)) continue; if (MONEYRE.test(ownText(el)) && /\d/.test(ownText(el))) fin.add(el); }
  for (const el of document.querySelectorAll(STSEL)) if (vis(el)) st.add(el);
  const issues = []; let finN = 0, stN = 0, minFin = 99, minSt = 99;
  const check = (el, kind) => {
    const cs = getComputedStyle(el); const text = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!text && kind === 'fin') return;
    const tc = isTerra(cs.color), tb = isTerra(cs.backgroundColor), tbd = kind === 'status' ? isTerra(cs.borderLeftColor) && parseFloat(cs.borderLeftWidth) > 0 ? isTerra(cs.borderLeftColor) : null : null;
    const hasOwn = ownText(el).length > 0;
    let ct = null; if (hasOwn) { ct = contrast(el); }
    if (kind === 'fin') { finN++; if (ct && !ct.img) minFin = Math.min(minFin, ct.ratio); } else { stN++; if (ct && !ct.img) minSt = Math.min(minSt, ct.ratio); }
    if (tc || tb) issues.push({ kind, issue: 'terracotta', el: desc(el), text, color: cs.color, bg: cs.backgroundColor, token: tc || tb });
    if (tbd) issues.push({ kind, issue: 'terracotta-border(info)', el: desc(el), text, token: tbd });
    if (ct && ct.ratio < 4.5) issues.push({ kind, issue: 'contrast', el: desc(el), text, ratio: ct.ratio, img: ct.img, color: cs.color });
    if (kind === 'status') { const icon = el.querySelector('svg,img,[class*=icon],[class*=Icon],[class*=mark]') || /^[✓✕!⚠ℹ●▲▼]/.test(text); if (!icon && !text) issues.push({ kind, issue: 'no-icon-or-label', el: desc(el) }); }
  };
  fin.forEach(el => check(el, 'fin')); st.forEach(el => { if (!fin.has(el)) check(el, 'status'); });
  const root = document.querySelector('main') || document.body; const txt = root.innerText;
  const hy = []; for (const m of txt.matchAll(/(.{0,14})(฿-|-(?=\d))(.{0,10})/g)) hy.push(m[0].replace(/\n/g, '⏎'));
  const plusMinus = (txt.match(/−/g) || []).length;
  // tag one loss ProfitAmount for the AX read
  let lossTagged = false; for (const sr of document.querySelectorAll('.sr-only')) { const t = sr.textContent; if (/ขาดทุน|loss/i.test(t) && sr.parentElement?.querySelector('.money')) { const cell = sr.closest('td,[role=cell],li,dd,div') || sr.parentElement; sr.parentElement.setAttribute('data-qa-loss', '1'); cell.setAttribute('data-qa-losscell', '1'); lossTagged = true; break; } }
  return { finN, stN, minFin, minSt, issues, hyphen: hy, minusCount: plusMinus, lossTagged };
})()`;
const axName = async sel => {
  const doc = await send('DOM.getDocument', { depth: 0 }); const q = await send('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: sel });
  if (!q.result?.nodeId) return null;
  const ax = await send('Accessibility.getPartialAXTree', { nodeId: q.result.nodeId, fetchRelatives: false });
  const nodes = ax.result?.nodes ?? []; const n = nodes[0];
  // collect text the screen reader hears inside the node: walk full AX subtree via queryAXTree is heavy; use getFullAXTree filtered by backendDOMNodeId descendants
  return n ? { role: n.role?.value, name: n.name?.value, ignored: n.ignored } : null;
};
const spokenInside = String.raw`(() => { const el = document.querySelector('[data-qa-losscell]'); if (!el) return null;
  const parts = []; const walk = n => { if (n.nodeType === 3) { parts.push(n.textContent); return; } if (n.nodeType !== 1) return; if (n.getAttribute('aria-hidden') === 'true') return; const cs = getComputedStyle(n); if (cs.display === 'none') return; for (const c of n.childNodes) walk(c); };
  walk(el); return { visible: el.innerText.replace(/\s+/g,' ').trim().slice(0,80), spoken: parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 160) }; })()`;
const report = [];
for (const path of pages) for (const w of widths) {
  await send('Page.navigate', { url: 'about:blank' }); await sleep(100);
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 600 });
  await send('Page.navigate', { url: 'http://127.0.0.1:4060' + path }); await sleep(2600);
  const r = await evaluate(PROBE);
  if (r.lossTagged) { r.lossAx = await axName('[data-qa-loss]'); r.lossCellAx = await axName('[data-qa-losscell]'); r.lossSpoken = await evaluate(spokenInside); }
  report.push({ path, width: w, ...r });
  console.log(path, w, 'fin', r.finN, 'status', r.stN, 'issues', r.issues.length, 'hyphen', r.hyphen.length, 'minFin', r.minFin, 'minSt', r.minSt);
}
writeFileSync(out, JSON.stringify(report, null, 2));
sock.close(); done(); await sleep(400); try { rmSync(profile, { recursive: true, force: true }); } catch {}
