import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9346', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1440,4200', 'about:blank'], { windowsHide: true });
await new Promise(r => setTimeout(r, 2500));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 60000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const newTab = async (url) => (await (await fetch('http://127.0.0.1:9346/json/new?' + encodeURIComponent(url), { method: 'PUT' })).json());
const openWS = async (tab) => { const w = new WebSocket(tab.webSocketDebuggerUrl); await new Promise((res, rej) => { w.addEventListener('open', res); w.addEventListener('error', rej); }); await wsSend(w, 1, 'Runtime.enable'); return w; };

// ---- Tab 1: live site — review item HTML (full text incl. readmore hidden part) ----
const t1 = await newTab('https://www.eandehomeremodel.com/');
const w1 = await openWS(t1);
await sleep(20000);
try {
  const r = await wsSend(w1, 2, 'Runtime.evaluate', { expression: `(() => {
    const el = document.querySelector('[data-element-type="yelp"]') || document.querySelector('[dmle_extension="yelp"]');
    if (!el) return JSON.stringify({ err: 'no el' });
    const row = el.closest('.dmRespRow') || el.parentElement.parentElement;
    const nodes = row.querySelectorAll('li, div[class*="review"], article');
    const items = [];
    nodes.forEach(n => { const im = n.querySelector('img[src*="yelpcdn"]'); if (im) items.push({ html: n.innerHTML.slice(0, 6000), photo: im.src }); });
    return JSON.stringify({ items, rowLen: row.outerHTML.length });
  })()`, returnByValue: true });
  fs.writeFileSync('C:/eandeads/assets/yelp-site-items.json', r.result.value);
  console.log('SITE OK len=' + (r.result.value || '').length);
} catch (e) { console.log('SITE FAIL: ' + e.message); }
w1.close();

// ---- Tab 2: Yelp listing — review section text ----
const t2 = await newTab('https://www.yelp.com/biz/e-and-e-home-remodeling-los-angeles');
const w2 = await openWS(t2);
await sleep(16000);
try {
  const r = await wsSend(w2, 2, 'Runtime.evaluate', { expression: `(() => {
    const out = { title: document.title, text: '' };
    const hs = [...document.querySelectorAll('h2, h3, [class*="Heading"]')];
    const h = hs.find(e => /\\breviews?\\b/i.test((e.innerText||'').trim()));
    if (h) { let p = h.parentElement; for (let i = 0; i < 4 && p && p.innerText.length < 900; i++) p = p.parentElement; out.text = (p ? p.innerText : '').slice(0, 15000); }
    document.querySelectorAll('img').forEach(im => { if (im.src && /yelpcdn\.com\/photo/.test(im.src)) (out.avatars = out.avatars || []).push(im.src); });
    return JSON.stringify(out).slice(0, 18000);
  })()`, returnByValue: true });
  fs.writeFileSync('C:/eandeads/assets/yelp-listing-text.json', r.result.value);
  console.log('YELP OK len=' + (r.result.value || '').length);
} catch (e) { console.log('YELP FAIL: ' + e.message); }
w2.close();
await sleep(1500);
chrome.kill();
process.exit(0);
