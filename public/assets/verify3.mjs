// Final verification: both LPs — console errors, broken images, duplicate ids, required elements
import { spawn } from 'node:child_process';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PAGES = [
  'file:///C:/eandeads/kitchen-remodeling-santa-barbara.html',
  'file:///C:/eandeads/bathroom-remodeling-santa-barbara.html',
];
const PORT = 9338;
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1440,900', 'about:blank'], { windowsHide: true });
await new Promise(r => setTimeout(r, 2500));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 30000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const results = [];
for (const url of PAGES) {
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?` + encodeURIComponent(url), { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const errors = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push((m.params.args || []).map(a => a.value || a.description || '').join(' '));
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || 'exception');
  });
  await wsSend(ws, 1, 'Runtime.enable');
  await new Promise(r => setTimeout(r, 5000));
  await wsSend(ws, 2, 'Runtime.evaluate', { expression: `window.scrollTo(0, document.body.scrollHeight); 1`, returnByValue: true });
  await new Promise(r => setTimeout(r, 4000));
  const r = await wsSend(ws, 3, 'Runtime.evaluate', { expression: `(() => {
    const imgs = [...document.querySelectorAll('img')].filter(i => i.getAttribute('src'));
    const broken = imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src'));
    const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
    const dup = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
    const q = (s) => document.querySelector(s) ? true : false;
    const btns = [...document.querySelectorAll('.btn-primary')].map(b => b.textContent.trim());
    const footOk = !!document.querySelector('.foot-grid') && (document.querySelector('.foot')?.innerText||'').includes('Santa Barbara');
    const yelp = [...document.querySelectorAll('a')].some(a => a.href.includes('yelp.com/biz/e-and-e-home-remodeling-oxnard'));
    const anims = getComputedStyle(document.querySelector('.btn-primary')||document.body).animationName;
    return JSON.stringify({ broken, dup, title: document.title, hasQuote: q('#quote'), footOk, yelp, btns, anims, sections: document.querySelectorAll('section').length });
  })()`, returnByValue: true });
  results.push({ url, errors, page: JSON.parse(r.result.value) });
  await fetch(`http://127.0.0.1:${PORT}/json/close/` + t.id, { method: 'PUT' }).catch(() => {});
  ws.close();
}
console.log(JSON.stringify(results, null, 1));
chrome.kill();
process.exit(0);
