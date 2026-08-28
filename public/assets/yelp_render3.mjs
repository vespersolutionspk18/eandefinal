import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'https://www.eandehomeremodel.com/';
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9342', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1440,3000', 'about:blank'], { windowsHide: true });
await new Promise(r => setTimeout(r, 2500));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 60000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const t = await (await fetch('http://127.0.0.1:9342/json/new?' + encodeURIComponent(URL), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
await wsSend(ws, 1, 'Runtime.enable');
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Poll until the yelp row has content (imgs or review text) — up to 45s
let result = null;
for (let i = 0; i < 15; i++) {
  await sleep(3000);
  const probe = await wsSend(ws, 10 + i, 'Runtime.evaluate', { expression: `(() => {
    const el = document.querySelector('[data-element-type="yelp"]') || document.querySelector('[dmle_extension="yelp"]');
    if (!el) return JSON.stringify({ ready: false, why: 'no yelp el' });
    let row = el.closest('.dmRespRow') || el.parentElement.parentElement;
    const imgs = row.querySelectorAll('img').length;
    const txt = (row.innerText || '').trim().length;
    return JSON.stringify({ ready: imgs > 0 || txt > 60, imgs, txt });
  })()`, returnByValue: true });
  console.log('poll', i, probe.result.value);
  const p = JSON.parse(probe.result.value);
  if (p.ready) {
    const r = await wsSend(ws, 50 + i, 'Runtime.evaluate', { expression: `(() => {
      const el = document.querySelector('[data-element-type="yelp"]') || document.querySelector('[dmle_extension="yelp"]');
      let row = el.closest('.dmRespRow') || el.parentElement.parentElement;
      const out = { text: row.innerText.slice(0, 14000), imgs: [] };
      row.querySelectorAll('img').forEach(im => out.imgs.push({ src: im.src, alt: im.alt, w: im.naturalWidth }));
      return JSON.stringify(out);
    })()`, returnByValue: true });
    result = r.result.value;
    break;
  }
}
fs.writeFileSync('C:/eandeads/assets/yelp-render.json', result || '{"err":"timeout — content never rendered"}');
console.log('DONE len=' + (result ? result.length : 0));
await fetch('http://127.0.0.1:9342/json/close/' + t.id, { method: 'PUT' }).catch(() => {});
ws.close();
await sleep(1500);
chrome.kill();
process.exit(0);
