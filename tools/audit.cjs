#!/usr/bin/env node
/*
 * Audit of the deck, in both languages, at every step of every page.
 *
 * Fails on: an element outside its page, text spilling out of its panel,
 * text drawn over other text, graph nodes / labels / badges colliding,
 * text below the 12.5px floor of the 1600px design, and Vietnamese left on
 * an English page. Low contrast is reported as a warning only: several
 * pages fade things on purpose (a person who left, a node not reached yet).
 *
 *   npm run audit            both languages
 *   npm run audit -- en      English only
 */
const path = require('path');
const { chromium } = require('playwright');

const FILE = path.resolve(__dirname, '..', 'index.html');
const LANGS = process.argv.slice(2).filter((a) => a === 'en' || a === 'vi');
const NAMES_KEPT_IN_ENGLISH = ['Hà', 'HÀ']; // sample people keep their names

function check(names) {
  const slide = document.querySelector('.slide.on');
  const K = parseFloat(getComputedStyle(document.getElementById('stage')).getPropertyValue('--k'));
  const sr = slide.getBoundingClientRect();
  const out = { fail: [], warn: [] };
  const opacity = (e) => { let o = 1; for (let x = e; x && x !== document.body; x = x.parentElement) o *= parseFloat(getComputedStyle(x).opacity); return o; };
  const visible = (e) => { const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && opacity(e) > 0.08; };
  const textRect = (e) => { const r = document.createRange(); r.selectNodeContents(e); const b = r.getBoundingClientRect(); return b.width ? b : e.getBoundingClientRect(); };
  const label = (e) => `"${e.textContent.replace(/\s+/g, ' ').trim().slice(0, 32)}"`;
  const local = (r) => [(r.left - sr.left) / K, (r.top - sr.top) / K, (r.right - sr.left) / K, (r.bottom - sr.top) / K].map(Math.round);
  const leaves = [...slide.querySelectorAll('*')]
    .filter((e) => [...e.childNodes].some((c) => c.nodeType === 3 && c.nodeValue.trim()))
    .filter((e) => !e.closest('.pageno') && visible(e));

  // 1. nothing outside the page
  slide.querySelectorAll('*').forEach((e) => {
    if (e.closest('svg') || !visible(e)) return;
    const r = e.getBoundingClientRect(); if (!r.width) return;
    const [x0, y0, x1, y1] = local(r);
    if (x0 < -1 || y0 < -1 || x1 > 1601 || y1 > 789) out.fail.push(`outside the page ${[x0, y0, x1, y1]}: ${e.className.baseVal ?? e.className} ${label(e)}`);
  });
  // 2. text stays inside the panel that holds it
  const PANELS = '.cd,.lrow,.card,.pan,.why > div,.prin > div,.feed,.ev,.qa,.ans,.hist,.pkg,.pi,.out,.prop,.cmp > div,.silo,.it,.glass,.nums button,.narr,.n';
  leaves.forEach((e) => {
    const p = e.parentElement.closest(PANELS); if (!p) return;
    const t = textRect(e), b = p.getBoundingClientRect();
    if (t.left < b.left - 1 || t.right > b.right + 1 || t.top < b.top - 1 || t.bottom > b.bottom + 1) out.fail.push(`text spills out of ${p.className.split(' ')[0]}: ${label(e)}`);
  });
  // 3. text over text
  const rects = leaves.map((e) => ({ e, r: textRect(e) }));
  for (let a = 0; a < rects.length; a++) for (let c = a + 1; c < rects.length; c++) {
    const A = rects[a], B = rects[c]; if (A.e.contains(B.e) || B.e.contains(A.e)) continue;
    const ox = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left), oy = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
    if (ox > 2 && oy > 2) out.fail.push(`text over text: ${label(A.e)} × ${label(B.e)}`);
  }
  // 4. graph nodes, edge labels, badges and questions do not collide
  const boxes = [...slide.querySelectorAll('.gn,.el,.q,.thought,.badge,.chips,.status')].filter(visible).map((e) => ({ e, r: e.getBoundingClientRect() }));
  for (let a = 0; a < boxes.length; a++) for (let c = a + 1; c < boxes.length; c++) {
    const A = boxes[a], B = boxes[c]; if (A.e.contains(B.e) || B.e.contains(A.e)) continue;
    const ox = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left), oy = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
    if (ox > 3 && oy > 3) out.fail.push(`collision: ${A.e.className} ${label(A.e)} × ${B.e.className} ${label(B.e)}`);
  }
  // 5. type floor, 6. English pages carry no Vietnamese, 7. contrast (warning)
  const vi = /[ăâđêôơưạảãáàặẳẵắằậẩẫấầẹẻẽéèệểễếềịỉĩíìọỏõóòộổỗốồợởỡớờụủũúùựửữứừỵỷỹýỳ]/i;
  const rgba = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; };
  const lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ground = (e) => { for (let x = e; x && x !== document.body; x = x.parentElement) { const c = rgba(getComputedStyle(x).backgroundColor); if (c && c[3] >= 0.5) return c; } return [7, 21, 32, 1]; };
  leaves.forEach((e) => {
    const cs = getComputedStyle(e), size = parseFloat(cs.fontSize);
    if (size < 12.5) out.fail.push(`text below 12.5px (${size}px): ${label(e)}`);
    if (document.documentElement.lang === 'en') {
      const own = [...e.childNodes].filter((c) => c.nodeType === 3).map((c) => c.nodeValue).join(' ');
      const rest = names.reduce((t, n) => t.split(n).join(''), own);
      if (vi.test(rest)) out.fail.push(`Vietnamese on an English page: "${own.trim().slice(0, 50)}"`);
    }
    if (cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)' || e.closest('.btn.pri,.nb.pri')) return;
    const fg = rgba(e.tagName === 'text' ? cs.fill : cs.color); if (!fg) return;
    const bg = ground(e), a = fg[3] * opacity(e), mix = [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
    const ratio = (Math.max(lum(mix), lum(bg)) + 0.05) / (Math.min(lum(mix), lum(bg)) + 0.05);
    if (ratio < (size >= 18 && parseInt(cs.fontWeight, 10) >= 600 ? 3 : 4.5)) out.warn.push(`contrast ${ratio.toFixed(2)}: ${label(e)}`);
  });
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1060 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + FILE, { waitUntil: 'load' });
  await page.addStyleTag({ content: '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important}' });
  await page.evaluate(() => document.fonts.ready);
  const pages = await page.evaluate(() => document.querySelectorAll('.slide').length);
  let failures = 0;
  for (const lang of LANGS.length ? LANGS : ['en', 'vi']) {
    await page.click(`.lang button[data-lang="${lang}"]`);
    for (let i = 1; i <= pages; i++) {
      await page.click(`#dots button:nth-child(${i})`);
      await page.waitForTimeout(150);
      const steps = await page.evaluate(() => (document.getElementById('narr').hidden ? 0 : document.querySelectorAll('#narrSeg button').length));
      const fail = new Set(), warn = new Set();
      for (let s = 1; s <= Math.max(steps, 1); s++) {
        if (steps) await page.click(`#narrSeg button:nth-child(${s})`);
        await page.waitForTimeout(250);
        const r = await page.evaluate(check, NAMES_KEPT_IN_ENGLISH);
        r.fail.forEach((x) => fail.add(steps ? `step ${s}: ${x}` : x));
        r.warn.forEach((x) => warn.add(x));
      }
      const head = `[${lang}] page ${String(i).padStart(2, '0')}${steps ? ` (${steps} steps)` : ''}`;
      console.log(`${fail.size ? '✗' : '✓'} ${head}${warn.size ? `  · ${warn.size} contrast warning(s)` : ''}`);
      fail.forEach((x) => console.log('    ' + x));
      if (process.env.VERBOSE) warn.forEach((x) => console.log('    warn ' + x));
      failures += fail.size;
    }
  }
  if (errors.length) { console.log('script errors:\n  ' + errors.join('\n  ')); failures += errors.length; }
  await browser.close();
  console.log(failures ? `\n${failures} problem(s)` : '\nall clear');
  process.exit(failures ? 1 : 0);
})();
