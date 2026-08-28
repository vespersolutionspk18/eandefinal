// Definitive: scroll whole page, then verify every local image decoded
import { spawn } from 'node:child_process';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const pages = ['file:///C:/eandeads/kitchen-remodeling-santa-barbara.html', 'file:///C:/eandeads/bathroom-remodeling-santa-barbara.html'];
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9334', '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'], { windowsHide: true });
await new Promise(r => setTimeout(r, 2500));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 15000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const out = [];
for (const url of pages) {
  const t = await (await fetch('http://127.0.0.1:9334/json/new?' + encodeURIComponent(url), { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  await wsSend(ws, 1, 'Runtime.enable');
  // scroll in steps to force lazy loads
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    await wsSend(ws, 10 + i, 'Runtime.evaluate', { expression: `window.scrollTo(0, ${i * 900})` });
    await new Promise(r => setTimeout(r, 120));
  }
  await wsSend(ws, 90, 'Runtime.evaluate', { expression: 'window.scrollTo(0,0)' });
  await new Promise(r => setTimeout(r, 1200));
  const r = await wsSend(ws, 91, 'Runtime.evaluate', { expression: `(() => {
    const imgs = [...document.querySelectorAll('img')].filter(i => i.src && !i.src.includes('.html'));
    const bad = imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src'));
    const vidOk = [...document.querySelectorAll('video')].every(v => v.src);
    const ifr = [...document.querySelectorAll('iframe')].map(f => f.src).every(s => s.startsWith('https://'));
    return JSON.stringify({ totalImgs: imgs.length, broken: bad, videos: [...document.querySelectorAll('video')].length, iframes: [...document.querySelectorAll('iframe')].length, allImgsLoaded: bad.length === 0 });
  })()` });
  out.push({ page: url.includes('kitchen') ? 'kitchen' : 'bathroom', ...JSON.parse(r.result.value) });
  await fetch('http://127.0.0.1:9334/json/close/' + t.id, { method: 'PUT' });
  ws.close();
}
console.log(JSON.stringify(out, null, 2));
chrome.kill();
process.exit(0);
