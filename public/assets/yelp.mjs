// Fetch E&E's Yelp page with real Chrome (residential IP) and dump review text
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'https://www.yelp.com/biz/e-and-e-home-remodeling-oxnard';
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9335', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1380,2400', 'about:blank'], { windowsHide: true });
await new Promise(r => setTimeout(r, 2500));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 45000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const t = await (await fetch('http://127.0.0.1:9335/json/new?' + encodeURIComponent(URL), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
await wsSend(ws, 1, 'Runtime.enable');
await new Promise(r => setTimeout(r, 12000)); // let anti-bot / page settle
try {
  const r = await wsSend(ws, 2, 'Runtime.evaluate', { expression: `(() => {
    const pick = (sel) => { const e = document.querySelector(sel); return e ? e.innerText.trim() : null; };
    return JSON.stringify({
      title: document.title,
      h1: (document.querySelector('h1')||{}).innerText,
      rating: pick('[class*="stars"]') || pick('[class*="rating"]'),
      head: (document.querySelector('header')||document.body).innerText.slice(0, 400),
      body: document.body.innerText.slice(0, 22000)
    });
  })()`, returnByValue: true });
  fs.writeFileSync('C:/eandeads/assets/yelp-dump.txt', r.result.value);
  const shot = await wsSend(ws, 3, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/eandeads/assets/yelp-shot.png', Buffer.from(shot.data, 'base64'));
  console.log('OK — wrote yelp-dump.txt + yelp-shot.png');
} catch (e) { console.log('EVAL FAIL: ' + e.message); }
await fetch('http://127.0.0.1:9335/json/close/' + t.id, { method: 'PUT' }).catch(() => {});
ws.close();
chrome.kill();
process.exit(0);
