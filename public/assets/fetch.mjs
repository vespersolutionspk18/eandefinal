// Fetch E&E site assets: logo, 3D image, video embeds, Yelp reviews, form endpoint
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'C:\\eandeads\\assets';
fs.mkdirSync(DIR, { recursive: true });
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' };
const out = { logo: null, threeD: null, videos: [], reviews: [], formAction: null, yelp: [], sbOffice: null };

async function get(url) {
  const r = await fetch(url, { headers: UA, redirect: 'follow' });
  const text = await r.text();
  return { status: r.status, ct: r.headers.get('content-type') || '', text };
}

async function save(url, file) {
  const r = await fetch(url, { headers: UA, redirect: 'follow' });
  if (!r.ok) return { file, ok: false, status: r.status };
  const buf = Buffer.from(await r.arrayBuffer());
  const p = path.join(DIR, file);
  fs.writeFileSync(p, buf);
  const head = buf.slice(0, 8).toString('hex');
  const kind = head.startsWith('89504e47') ? 'PNG' : head.startsWith('ffd8ff') ? 'JPEG' : head.startsWith('474946') ? 'GIF' : head.startsWith('3c737667') || head.startsWith('3c3f786d') ? 'SVG/XML' : 'other';
  return { file: p, ok: true, bytes: buf.length, kind };
}

try {
  const home = await get('https://www.eandehomeremodel.com/');
  fs.writeFileSync(path.join(DIR, 'home.html'), home.text);
  const H = home.text;

  // --- logo candidates ---
  const imgs = [...H.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
  const abs = u => { try { return new URL(u, 'https://www.eandehomeremodel.com/').href; } catch { return u; } };
  const logoCandidates = imgs.filter(u => /logo/i.test(u));
  out.logo = { allImgs: imgs.slice(0, 25), logoCandidates };
  let logoUrl = logoCandidates[0];
  if (!logoUrl && imgs.length) logoUrl = imgs[0];
  if (logoUrl) {
    const ext = (logoUrl.match(/\.(png|jpe?g|svg|webp|gif)(\?|$)/i) || [])[1] || 'png';
    out.logo.download = await save(abs(logoUrl), 'logo.' + ext.toLowerCase());
  }

  // --- 3D section image ---
  const i3d = H.indexOf('See Your New Home');
  if (i3d > -1) {
    const win = H.slice(Math.max(0, i3d - 6000), i3d + 10000);
    const cands = [...win.matchAll(/(?:src|data-src|url\()\s*=?\s*["'( ]*([^"'() ]+\.(?:png|jpe?g|webp|svg))/gi)].map(m => m[1]);
    const uniq = [...new Set(cands)].filter(u => !/logo|icon|favicon|sprite/i.test(u));
    out.threeD = { found: true, candidates: uniq.slice(0, 8) };
    if (uniq[0]) {
      const ext = (uniq[0].match(/\.(png|jpe?g|webp|svg)(\?|$)/i) || [])[1] || 'png';
      out.threeD.download = await save(abs(uniq[0]), '3d-design.' + ext.toLowerCase());
    }
  } else out.threeD = { found: false };

  // --- videos on testimonials + watch ---
  for (const [page, file] of [['testimonials', 'testimonials.html'], ['watch', 'watch.html'], ['kitchen-renovations', 'kitchen.html']]) {
    try {
      const p = await get(`https://www.eandehomeremodel.com/${page}`);
      fs.writeFileSync(path.join(DIR, file), p.text);
      const found = new Set();
      const patterns = [
        /https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/)[A-Za-z0-9_-]{6,}/g,
        /youtu\.be\/[A-Za-z0-9_-]{6,}/g,
        /vimeo\.com\/\d+/g,
        /https?:\/\/[^\s"']+\.(mp4|webm)[^\s"']*/g
      ];
      for (const re of patterns) for (const m of p.text.matchAll(re)) found.add(m[0].trim());
      for (const u of found) out.videos.push({ page, url: u });
    } catch (e) { out.videos.push({ page, error: e.message }); }
  }

  // --- form endpoint on contact-us ---
  const contact = await get('https://www.eandehomeremodel.com/contact-us');
  fs.writeFileSync(path.join(DIR, 'contact.html'), contact.text);
  const fa = contact.text.match(/<form[^>]+action=["']([^"']*)["']/i);
  out.formAction = fa ? fa[1] : null;
  const fetchUrls = [...(contact.text.matchAll(/["'](https?:\/\/[^"']*?(?:form|lead|submit|duda)[^"']*)["']/gi) || [])].map(m => m[1]).slice(0, 10);
  out.formHints = fetchUrls;

  // --- Santa Barbara office block ---
  const m = contact.text.match(/Santa Barbara Office[\s\S]{0,300}/i);
  out.sbOffice = m ? m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 220) : null;

  // --- Yelp attempts ---
  for (const yu of ['https://www.yelp.com/biz/e-and-e-remodeling-los-angeles', 'https://www.yelp.com/biz/energy-green-builders-reseda']) {
    try {
      const y = await get(yu);
      out.yelp.push({ url: yu, status: y.status, bytes: y.text.length });
      if (y.status === 200) {
        fs.writeFileSync(path.join(DIR, 'yelp_' + (yu.includes('los-angeles') ? 'la' : 'reseda') + '.html'), y.text);
        const ld = y.text.match(/<script type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi) || [];
        for (const s of ld) {
          try {
            const j = JSON.parse(s.replace(/<\/?script[^>]*>/g, ''));
            const collect = (o) => {
              if (!o || typeof o !== 'object') return;
              if (o.review) (Array.isArray(o.review) ? o.review : [o.review]).forEach(r => out.reviews.push({ name: r.author?.name, rating: r.ratingValue || r.aggregateRating, text: r.reviewBody || r.description, source: yu }));
              Object.values(o).forEach(v => v && typeof v === 'object' && collect(v));
            };
            collect(j);
          } catch {}
        }
        const revs = [...y.text.matchAll(/"reviewBody"\s*:\s*"((?:[^"\\]|\\.){10,600})"/g)].map(m => ({ text: m[1].replace(/\\u003c[^}]*\\u003e/g, '').slice(0, 400), source: yu }));
        if (revs.length) out.reviews.push(...revs.slice(0, 8));
      }
    } catch (e) { out.yelp.push({ url: yu, error: e.message }); }
  }
} catch (e) {
  out.fatal = e.message;
}

console.log(JSON.stringify(out, null, 2));
