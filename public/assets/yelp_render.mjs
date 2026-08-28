import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'https://www.eandehomeremodel.com/';
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9340', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1440,5000', 'about:blank'], { windowsHide: true });
await new Promise(r => setTimeout(r, 2500));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 60000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const t = await (await fetch('http://127.0.0.1:9340/json/new?' + encodeURIComponent(URL), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
await wsSend(ws, 1, 'Runtime.enable');
await new Promise(r => setTimeout(r, 22000));
try {
  const r = await wsSend(ws, 2, 'Runtime.evaluate', { expression: `(() => {
    const out = { reviews: [], imgs: [], text: '' };
    const span = document.querySelector('span[data-element-type="yelp"]');
    if (!span) { out.err = 'no yelp span'; }
    else {
      let row = span.closest('.dmRespRow') || span.parentElement.parentElement;
      out.text = row.innerText.slice(0, 12000);
      row.querySelectorAll('img').forEach(im => out.imgs.push(im.src));
      const items = row.querySelectorAll('li, [class*="review"], article');
      items.forEach(it => { const txt = it.innerText.trim(); if (txt && txt.length > 20 && txt.length < 2000) out.reviews.push(txt); });
    }
    return JSON.stringify(out);
  })()`, returnByValue: true });
  fs.writeFileSync('C:/eandeads/assets/yelp-render.json', r.result.value);
  console.log('OK len=' + (r.result.value || '').length);
} catch (e) { console.log('EVAL FAIL: ' + e.message); }
await fetch('http://127.0.0.1:9340/json/close/' + t.id, { method: 'PUT' }).catch(() => {});
ws.close();
await new Promise(r => setTimeout(r, 1500));
chrome.kill();
process.exit(0);
