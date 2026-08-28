import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'https://www.yelp.com/biz/e-and-e-home-remodeling-los-angeles';
const chrome = spawn(CHROME, ['--remote-debugging-port=9344', '--no-first-run', '--no-default-browser-check', '--window-size=1380,3200', '--user-data-dir=C:\\eandeads\\assets\\chrome-tmp-profile', 'about:blank'], { windowsHide: false });
await new Promise(r => setTimeout(r, 4000));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 45000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const t = await (await fetch('http://127.0.0.1:9344/json/new?' + encodeURIComponent(URL), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
await wsSend(ws, 1, 'Runtime.enable');
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(6000);
// scroll to reviews to force render
await wsSend(ws, 2, 'Runtime.evaluate', { expression: `(() => { const h = [...document.querySelectorAll('h2,h3')].find(e => /review/i.test(e.innerText)); if (h) h.scrollIntoView(); window.scrollBy(0, 400); return 'ok'; })()` });
await sleep(9000);
try {
  const r = await wsSend(ws, 3, 'Runtime.evaluate', { expression: `(() => {
    const out = { avatars: [], text: '' };
    document.querySelectorAll('img').forEach(im => { if (im.src && /yelpcdn\.com\/photo|fl\.yelp/i.test(im.src)) out.avatars.push(im.src); });
    const h = [...document.querySelectorAll('h2,h3')].find(e => /review/i.test(e.innerText));
    if (h) { let sec = h.closest('section') || h.parentElement.parentElement; out.text = sec.innerText.slice(0, 14000); }
    return JSON.stringify(out);
  })()`, returnByValue: true });
  fs.writeFileSync('C:/eandeads/assets/yelp-lag2.json', r.result.value);
  console.log('OK len=' + (r.result.value || '').length);
} catch (e) { console.log('EVAL FAIL: ' + e.message); }
await fetch('http://127.0.0.1:9344/json/close/' + t.id, { method: 'PUT' }).catch(() => {});
ws.close();
await sleep(1500);
chrome.kill();
process.exit(0);
