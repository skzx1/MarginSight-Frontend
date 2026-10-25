// Usage: node focusclip.mjs <out.png> <path> <width> <cssSelector> <index> — keyboard-focus element[index] (focus element[index-1], press Tab) and screenshot it at 2x.
import { spawn } from 'node:child_process'; import { writeFileSync, rmSync } from 'node:fs';
const [out, path, w, sel, idx] = process.argv.slice(2); const PORT = 9340, prof = new URL('./.chrome-profile-fclip', import.meta.url).pathname;
rmSync(prof, { recursive: true, force: true });
const proc = spawn(process.env.CHROME_PATH || '/opt/pw-browsers/chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=' + PORT, '--user-data-dir=' + prof, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let t; for (let i = 0; i < 60 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); } }
const s = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => s.addEventListener('open', r));
let id = 0; const p = new Map(); s.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; p.set(i, r); s.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => (await send('Runtime.evaluate', { returnByValue: true, expression: x })).result.result.value;
await send('Page.enable'); await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{ if(location.hash.length>1) sessionStorage.setItem('token','qa-token'); }catch(e){}` });
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: 844, deviceScaleFactor: 1, mobile: +w < 600 });
await send('Page.navigate', { url: 'http://127.0.0.1:4060' + path }); await sleep(4000);
await ev(`(()=>{const l=[...document.querySelectorAll(${JSON.stringify(sel)})];l[${idx}-1].focus();})()`);
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await sleep(300);
const r = await ev(`(()=>{const e=document.activeElement;const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return {r:[r.x,r.y,r.width,r.height],txt:e.innerText,fv:e.matches(':focus-visible'),outline:cs.outlineStyle+' '+cs.outlineWidth+' '+cs.outlineColor+' '+cs.outlineOffset}})()`);
const [x, y, ww, hh] = r.r; const sh = await send('Page.captureScreenshot', { format: 'png', clip: { x: Math.max(0, x - 12), y: Math.max(0, y - 12), width: Math.min(+w - Math.max(0, x - 12), ww + 24), height: hh + 24, scale: 2 } });
writeFileSync(out, Buffer.from(sh.result.data, 'base64')); console.log(JSON.stringify(r));
s.close(); proc.kill();
