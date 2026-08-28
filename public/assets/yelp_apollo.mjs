import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'https://www.yelp.com/biz/e-and-e-home-remodeling-los-angeles';
const chrome = spawn(CHROME, ['--remote-debugging-port=9345', '--no-first-run', '--no-default-browser-check', '--window-size=1380,3200', '--user-data-dir=C:\\eandeads\\assets\\chrome-tmp-profile', 'about:blank'], { windowsHide: false });
await new Promise(r => setTimeout(r, 4000));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 45000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const t = await (await fetch('http://127.0.0.1:9345/json/new?' + encodeURIComponent(URL), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
await wsSend(ws, 1, 'Runtime.enable');
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(9000);
try {
  const r = await wsSend(ws, 2, 'Runtime.evaluate', { expression: `(() => {
    const out = { reviews: [], other: [] };
    // Apollo state has reviews array
    try {
      const ap = window.__APOLLO_STATE__;
      if (ap) {
        for (const k of Object.keys(ap)) {
          if (k.endsWith(':reviews') || /review/i.test(k)) {
            const v = ap[k];
            if (v && v.edges) { v.edges.forEach(e => { const n = e.node; if (n) out.reviews.push({ id: n.id, rating: n.rating, excerpt: n.excerpt, content: n.content, time: n.timeCreated }); }); }
            else if (v && v.reviews) { v.reviews.forEach(n => out.reviews.push({ id: n.id, rating: n.rating, excerpt: n.excerpt, content: n.content, time: n.timeCreated })); }
          }
        }
      }
    } catch (e) { out.apolloErr = e.message; }
    // users with photos
    try {
      const ap = window.__APOLLO_STATE__;
      if (ap) for (const k of Object.keys(ap)) { if (/user/i.test(k)) { const v = ap[k]; if (v && v.profilePhotoUrl) out.other.push({ k, name: v.firstName + ' ' + (v.lastName ? v.lastName[0] + '.' : ''), photo: v.profilePhotoUrl }); } }
    } catch (e) {}
    return JSON.stringify(out).slice(0, 20000);
  })()`, returnByValue: true });
  fs.writeFileSync('C:/eandeads/assets/yelp-apollo.json', r.result.value);
  console.log('OK len=' + (r.result.value || '').length);
} catch (e) { console.log('EVAL FAIL: ' + e.message); }
await fetch('http://127.0.0.1:9345/json/close/' + t.id, { method: 'PUT' }).catch(() => {});
ws.close();
await sleep(1500);
chrome.kill();
process.exit(0);
