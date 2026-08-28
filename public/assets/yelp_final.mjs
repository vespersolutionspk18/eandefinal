import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9347', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1440,6000', 'about:blank'], { windowsHide: true });
await new Promise(r => setTimeout(r, 2500));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 70000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const newTab = async (url) => (await (await fetch('http://127.0.0.1:9347/json/new?' + encodeURIComponent(url), { method: 'PUT' })).json());
const openWS = async (tab) => { const w = new WebSocket(tab.webSocketDebuggerUrl); await new Promise((res, rej) => { w.addEventListener('open', res); w.addEventListener('error', rej); }); await wsSend(w, 1, 'Runtime.enable'); return w; };
const evalJson = (w, id, expression) => wsSend(w, id, 'Runtime.evaluate', { expression: `try { ${expression} } catch (e) { return JSON.stringify({ err: String(e) }); }`, returnByValue: true }).then(r => r.result && r.result.value);

// ---- Tab A: live site widget (retry loop until reviews render) ----
const tA = await newTab('https://www.eandehomeremodel.com/');
const wA = await openWS(tA);
let siteItems = null;
for (let a = 0; a < 3 && !siteItems; a++) {
  await sleep(12000);
  const v = await evalJson(wA, 10 + a, `(() => {
    const el = document.querySelector('[data-element-type="yelp"]') || document.querySelector('[dmle_extension="yelp"]');
    if (!el) return JSON.stringify({ err: 'no el' });
    const row = el.closest('.dmRespRow') || el.parentElement.parentElement;
    const items = [];
    row.querySelectorAll('img[src*="yelpcdn"]').forEach(im => { let p = im.parentElement; for (let i = 0; i < 6 && p && p.querySelectorAll('img[src*="yelpcdn"]').length > 1; i++) p = p.parentElement; if (p) items.push({ photo: im.src, html: p.innerHTML.slice(0, 7000), text: p.innerText.slice(0, 900) }); });
    return JSON.stringify({ items });
  })()`);
  console.log('site attempt', a, '->', v ? v.slice(0, 120) : 'null');
  if (v) { try { const j = JSON.parse(v); if (j.items && j.items.length) siteItems = v; } catch (e) {} }
}
fs.writeFileSync('C:/eandeads/assets/yelp-site-final.json', siteItems || '{"err":"site widget never rendered"}');
console.log('SITE saved, items=' + (siteItems ? JSON.parse(siteItems).items.length : 0));
wA.close();

// ---- Tab B: Yelp listing page — names/dates/excerpts + avatars ----
const tB = await newTab('https://www.yelp.com/biz/e-and-e-home-remodeling-los-angeles');
const wB = await openWS(tB);
await sleep(16000);
const yv = await evalJson(wB, 20, `(() => {
  const out = { title: document.title, avatars: [], text: '' };
  document.querySelectorAll('img').forEach(im => { if (im.src && /yelpcdn\.com\/photo/.test(im.src)) out.avatars.push(im.src); });
  const body = document.body ? document.body.innerText : '';
  const i = body.search(/\\bReviews\\b/);
  if (i >= 0) out.text = body.slice(i, i + 15000);
  return JSON.stringify(out).slice(0, 20000);
})()`);
fs.writeFileSync('C:/eandeads/assets/yelp-listing-final.json', yv || '{"err":"yelp dump failed"}');
console.log('YELP saved len=' + (yv ? yv.length : 0));
wB.close();
await sleep(1500);
chrome.kill();
process.exit(0);
