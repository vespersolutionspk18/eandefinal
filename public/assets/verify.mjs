// Verify both landing pages in headless Chrome: assets, JS errors, CTA presence
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const pages = [
  'file:///C:/eandeads/kitchen-remodeling-santa-barbara.html',
  'file:///C:/eandeads/bathroom-remodeling-santa-barbara.html'
];

const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9333', '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'], { windowsHide: true });
await new Promise(r => setTimeout(r, 2500));

async function httpJson(path) { const r = await fetch('http://127.0.0.1:9333' + path); return r.json(); }
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 15000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}

const report = [];
for (const url of pages) {
  const list = await (await fetch('http://127.0.0.1:9333/json/new?' + encodeURIComponent(url), { method: 'PUT' })).json();
  const ws = new WebSocket(list.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const consoleErrs = [];
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrs.push(m.params.args.map(a => a.value).join(' ')); });
  await wsSend(ws, 1, 'Runtime.enable');
  await new Promise(r => setTimeout(r, 3500));
  const CHECK = `(() => {
    const imgs = [...document.querySelectorAll('img')];
    const local = imgs.filter(i => i.src.startsWith('file://'));
    const broken = local.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src);
    const q = s => document.querySelectorAll(s).length;
    return JSON.stringify({
      title: document.title,
      h1: (document.querySelector('h1')||{}).textContent,
      localImgs: local.length, brokenLocalImgs: broken,
      quoteForms: q('.lead-form'), quoteButtons: q('a[href="#quote"], a[href="#quote-final"]'),
      telLinks: q('a[href^="tel:"]'), lightboxFigs: q('#gallery figure'),
      faqItems: q('.faq details'), reviews: q('.rev-card'),
      bodyScrollH: document.body.scrollHeight,
      stickyBar: !!document.querySelector('.mbar'),
      banned: document.body.innerText.match(/(See Your New Home|Where Vision Meets|Elevating Your Home|Designed Around the Way|Transform Your Space|Imagine the Possibilities|Don't Take Our Word|Excellence Redefined|Your Dream Starts Here)/i) ? 'FOUND_BANNED_COPY' : 'clean'
    });
  })()`;
  const r = await wsSend(ws, 2, 'Runtime.evaluate', { expression: CHECK, returnByValue: true });
  const shot = await wsSend(ws, 3, 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const name = url.includes('kitchen') ? 'kitchen' : 'bathroom';
  fs.writeFileSync(`C:/eandeads/assets/verify-${name}-top.png`, Buffer.from(shot.data, 'base64'));
  // scroll to bottom and screenshot final sections
  await wsSend(ws, 4, 'Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight * 0.55)' });
  await new Promise(r2 => setTimeout(r2, 800));
  const shot2 = await wsSend(ws, 5, 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(`C:/eandeads/assets/verify-${name}-mid.png`, Buffer.from(shot2.data, 'base64'));
  report.push({ page: name, ...JSON.parse(r.result.value), consoleErrs });
  await fetch('http://127.0.0.1:9333/json/close/' + list.id, { method: 'PUT' });
}
console.log(JSON.stringify(report, null, 2));
chrome.kill();
process.exit(0);
