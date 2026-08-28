import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'https://www.eandehomeremodel.com/';
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9341', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1440,4000', 'about:blank'], { windowsHide: true });
await new Promise(r => setTimeout(r, 2500));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 60000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const t = await (await fetch('http://127.0.0.1:9341/json/new?' + encodeURIComponent(URL), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
await wsSend(ws, 1, 'Runtime.enable');
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 6; i++) {
  await sleep(8000);
  const r = await wsSend(ws, 2 + i, 'Runtime.evaluate', { expression: `JSON.stringify({ title: document.title, ready: document.readyState, h: document.body ? document.body.scrollHeight : 0, spans: document.querySelectorAll('span[data-element-type]').length, yelpSpan: !!document.querySelector('[data-element-type="yelp"]'), dmle: !!document.querySelector('[dmle_extension="yelp"]') })`, returnByValue: true });
  console.log('poll', i, r.result.value);
  if ('"yelpSpan":true' in r.result.value) break;
}
const final = await wsSend(ws, 20, 'Runtime.evaluate', { expression: `(() => {
  const out = { reviews: [], imgs: [], text: '' };
  const el = document.querySelector('[data-element-type="yelp"]') || document.querySelector('[dmle_extension="yelp"]');
  if (!el) { out.err = 'not found'; out.bodySample = (document.body ? document.body.innerText : '').slice(0, 500); }
  else {
    let row = el.closest('.dmRespRow') || el.parentElement.parentElement;
    out.text = row.innerText.slice(0, 12000);
    row.querySelectorAll('img').forEach(im => out.imgs.push(im.src));
  }
  return JSON.stringify(out);
})()`, returnByValue: true });
fs.writeFileSync('C:/eandeads/assets/yelp-render.json', final.result.value);
console.log('OK len=' + (final.result.value || '').length);
await fetch('http://127.0.0.1:9341/json/close/' + t.id, { method: 'PUT' }).catch(() => {});
ws.close();
await sleep(1500);
chrome.kill();
process.exit(0);
