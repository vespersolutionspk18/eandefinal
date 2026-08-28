import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'https://www.yelp.com/biz/e-and-e-home-remodeling-los-angeles';
const chrome = spawn(CHROME, ['--remote-debugging-port=9343', '--no-first-run', '--no-default-browser-check', '--window-size=1380,2600', '--user-data-dir=C:\\eandeads\\assets\\chrome-tmp-profile', 'about:blank'], { windowsHide: false });
await new Promise(r => setTimeout(r, 4000));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 45000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const t = await (await fetch('http://127.0.0.1:9343/json/new?' + encodeURIComponent(URL), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
await wsSend(ws, 1, 'Runtime.enable');
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(16000);
try {
  const r = await wsSend(ws, 2, 'Runtime.evaluate', { expression: `(() => {
    const items = [...document.querySelectorAll('[data-testid="review-item"], li[class*="review"]')].slice(0, 8);
    const out = { title: document.title, count: items.length, reviews: [] };
    items.forEach(it => {
      const pick = (sel) => { const e = it.querySelector(sel); return e ? e.innerText.trim() : null; };
      const nameEl = it.querySelector('a[href*="/user/"]');
      const name = nameEl ? nameEl.innerText.trim() : pick('.c-ac-ProfileCard__username');
      const img = it.querySelector('img[src*="yelpcdn"], img[src*="fl.yelp"], img[class*="photo"], .c-UserProfilePhoto img, a[href*="/user/"] img');
      const stars = pick('[data-testid="stars"]') || (it.querySelector('[aria-label*="stars"]') ? it.querySelector('[aria-label*="stars"]').getAttribute('aria-label') : null);
      out.reviews.push({
        name,
        date: (it.querySelector('time') ? it.querySelector('time').getAttribute('datetime') : null) || pick('.c-ac-ProfileCard__summary'),
        stars,
        photo: img ? img.src : null,
        text: (pick('[data-testid="content"]') || pick('.c-ac-ReviewBody__content') || it.innerText).slice(0, 1400)
      });
    });
    return JSON.stringify(out);
  })()`, returnByValue: true });
  fs.writeFileSync('C:/eandeads/assets/yelp-lag.json', r.result.value);
  console.log('OK len=' + (r.result.value || '').length);
} catch (e) { console.log('EVAL FAIL: ' + e.message); }
await fetch('http://127.0.0.1:9343/json/close/' + t.id, { method: 'PUT' }).catch(() => {});
ws.close();
await sleep(1500);
chrome.kill();
process.exit(0);
