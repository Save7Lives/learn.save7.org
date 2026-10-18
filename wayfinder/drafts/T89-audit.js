/* Scratch audit for #89: contrast of every text node on the page against its resolved
   background, nothing under 12px, no horizontal page scroll, and the Baseline art kept
   clear of text. window.__t89.run() returns a report; window.__t89.planted() proves it can fail. */
(() => {
  const TOKENS = { navy: '#0c173b', grey: '#585858', pink: '#df0e62', 'pink-50': '#fff7f9', 'pink-100': '#fce8f0', 'pink-line': '#fcd9e5', teal: '#16b9b4', 'teal-ink': '#00807b', 'teal-50': '#f3fbfb', 'teal-100': '#e6f7f7', 'teal-line': '#c9eeee', amber: '#ffab40', white: '#ffffff', line: '#e3e6ee', 'line-strong': '#7d8294', correct: '#0b6f6c', incorrect: '#a3341c' };
  const hexToRGB = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const toHex = rgb => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const NAMES = {}; Object.entries(TOKENS).forEach(([n, h]) => { NAMES[h] = n; });
  const nameOf = h => NAMES[h] || h;
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const parseCSS = s => { const m = s.match(/rgba?\(([^)]+)\)/) || s.match(/color\(srgb ([^)]+)\)/); if (!m) return { rgb: [0, 0, 0], a: 0 }; let p = m[1].split(/[,\/\s]+/).filter(Boolean).map(Number); if (/srgb/.test(s)) p = p.map((v, i) => i < 3 ? v * 255 : v); return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
  function bgOf(el) {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none' && e.tagName !== 'HTML' && e.tagName !== 'BODY') return { unmeasurable: true, why: e.className };
      const c = parseCSS(cs.backgroundColor);
      if (c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let out = [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i--) { const L = layers[i]; out = out.map((v, k) => L.rgb[k] * L.a + v * (1 - L.a)); }
    return { rgb: out };
  }
  function run(root) {
    root = root || document.querySelector('main') || document.body;
    const pairs = new Map(); const small = []; let unmeasured = 0, nodes = 0;
    for (const el of root.querySelectorAll('*')) {
      if (el.closest('svg') || el.closest('video') || el.closest('script,style')) continue;
      let own = ''; el.childNodes.forEach(n => { if (n.nodeType === 3) own += n.textContent; });
      own = own.replace(/\s+/g, ' ').trim(); if (!own) continue;
      if (!el.getClientRects().length) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
      const r0 = el.getBoundingClientRect(); if (r0.width <= 1 && r0.height <= 1) continue; /* sr-only */
      const bg = bgOf(el); if (bg.unmeasurable) { unmeasured++; continue; }
      let fg = parseCSS(cs.color); if (fg.a < 1) fg = { rgb: fg.rgb.map((v, k) => v * fg.a + bg.rgb[k] * (1 - fg.a)), a: 1 };
      const px = parseFloat(cs.fontSize), w = parseInt(cs.fontWeight, 10);
      const large = px >= 24 || (px >= 18.66 && w >= 700); const need = large ? 3 : 4.5;
      const r = ratio(fg.rgb, bg.rgb);
      const key = [toHex(fg.rgb), toHex(bg.rgb), large ? 'L' : 'N'].join('|');
      const rec = pairs.get(key) || { fg: nameOf(toHex(fg.rgb)), bg: nameOf(toHex(bg.rgb)), large, need, r: +r.toFixed(2), n: 0, sample: own.slice(0, 40) };
      rec.n++; pairs.set(key, rec); nodes++;
      if (px < 12) small.push({ px, sample: own.slice(0, 40) });
    }
    const fails = [...pairs.values()].filter(p => p.r < p.need);
    const hs = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return { fails, small, pairs: pairs.size, nodes, unmeasured, hscroll: hs, innerWidth: innerWidth, art: art(root) };
  }
  /* the corner blob and circle pair must not sit behind any text */
  function art() {
    const hits = [];
    const arts = document.querySelectorAll('[data-hero-art] span.rounded-full');
    if (!arts.length) return { circles: 0, hits };
    const circles = [...arts].map(a => { const r = a.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, rad: r.width / 2, w: r.width }; }).filter(c => c.w > 0);
    const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (!n.textContent.trim()) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) {
        if (r.width < 2) continue;
        for (const c of circles) {
          const nx = Math.max(r.left, Math.min(c.cx, r.right)), ny = Math.max(r.top, Math.min(c.cy, r.bottom));
          if (Math.hypot(nx - c.cx, ny - c.cy) < c.rad) hits.push({ text: n.textContent.trim().slice(0, 30), circle: Math.round(c.rad * 2) });
        }
      }
    }
    return { circles: circles.length, hits };
  }
  function planted() {
    const d = document.createElement('p'); d.textContent = 'planted bad pair'; d.style.cssText = 'color:#9aa0b0;background:#ffffff;font-size:16px;position:relative';
    (document.querySelector('main') || document.body).appendChild(d);
    const bad = run(); d.remove();
    const s = document.createElement('p'); s.textContent = 'planted tiny text'; s.style.cssText = 'color:#0c173b;font-size:10px';
    (document.querySelector('main') || document.body).appendChild(s);
    const tiny = run(); s.remove();
    return { badPairFails: bad.fails.length > 0, tinyFound: tiny.small.length > 0 };
  }
  window.__t89 = { run, planted };
})();
