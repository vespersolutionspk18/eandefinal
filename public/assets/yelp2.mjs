// Headed Chrome (no headless fingerprint) to pass Yelp anti-bot
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'https://www.yelp.com/biz/e-and-e-home-remodeling-oxnard';
const chrome = spawn(CHROME, ['--remote-debugging-port=9336', '--no-first-run', '--no-default-browser-check', '--window-size=1380,2200', '--user-data-dir=C:\\eandeads\\assets\\chrome-tmp-profile', 'about:blank'], { windowsHide: false });
await new Promise(r => setTimeout(r, 4000));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 45000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const t = await (await fetch('http://127.0.0.1:9336/json/new?' + encodeURIComponent(URL), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
await wsSend(ws, 1, 'Runtime.enable');
await new Promise(r => setTimeout(r, 16000));
try {
  const r = await wsSend(ws, 2, 'Runtime.evaluate', { expression: `(() => {
    const t = document.title;
    const body = document.body ? document.body.innerText : '';
    const stars = [...document.querySelectorAll('[class*="stars"],[class*="rating"],[class*="Rating"]')].slice(0,3).map(e=>e.innerText.trim()).filter(Boolean);
    return JSON.stringify({ title:t, stars, body: body.slice(0, 25000) });
  })()`, returnByValue: true });
  fs.writeFileSync('C:/eandeads/assets/yelp-dump.txt', r.result.value);
  console.log('OK len=' + (r.result.value||'').length);
} catch (e) { console.log('EVAL FAIL: ' + e.message); }
await fetch('http://127.0.0.1:9336/json/close/' + t.id, { method: 'PUT' }).catch(() => {});
ws.close();
await new Promise(r => setTimeout(r, 1500));
chrome.kill();
process.exit(0);
