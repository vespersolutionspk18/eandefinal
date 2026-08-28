// Grab the live site footer computed colors (background, headings, links, big phone)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'https://www.eandehomeremodel.com/';
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9337', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--window-size=1440,900', 'about:blank'], { windowsHide: true });
await new Promise(r => setTimeout(r, 2500));
function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout ' + method)), 30000);
    const h = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { clearTimeout(t); ws.removeEventListener('message', h); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
    ws.addEventListener('message', h); ws.send(JSON.stringify({ id, method, params }));
  });
}
const t = await (await fetch('http://127.0.0.1:9337/json/new?' + encodeURIComponent(URL), { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
await wsSend(ws, 1, 'Runtime.enable');
await new Promise(r => setTimeout(r, 6000));
const r = await wsSend(ws, 2, 'Runtime.evaluate', { expression: `(() => {
  const foot = document.querySelector('.dmFooter, .dmFooterContainer, footer, [class*="Footer"]');
  const col = (el) => el ? getComputedStyle(el).backgroundColor : null;
  // walk up to find the element with a non-transparent bg
  let bg = null, node = foot;
  while (node && (!bg || bg === 'rgba(0, 0, 0, 0)')) { bg = getComputedStyle(node).backgroundColor; node = node.parentElement; }
  const phone = document.querySelector('a[type="call"], .dmFooter a[href^="tel:"]');
  const h5 = document.querySelector('.dmFooter h5, [class*="Footer"] h5');
  const link = document.querySelector('.dmFooter a, [class*="Footer"] a');
  const j = (el) => el ? { text: el.innerText.trim().slice(0,40), color: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor, font: getComputedStyle(el).fontFamily, size: getComputedStyle(el).fontSize, weight: getComputedStyle(el).fontWeight } : null;
  return JSON.stringify({ footerBg: bg, phone: j(phone), heading: j(h5), link: j(link), footExists: !!foot, footerClass: foot ? foot.className : null });
})()`, returnByValue: true });
console.log(r.result.value);
await fetch('http://127.0.0.1:9337/json/close/' + t.id, { method: 'PUT' }).catch(() => {});
ws.close();
chrome.kill();
process.exit(0);
