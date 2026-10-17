// Runs inside the page (via page.evaluate), so it must be self-contained.
// Derived from the re-cut audit harness (wayfinder T89-audit.js): contrast of every
// text node against its resolved background, nothing under 12px, no horizontal scroll.
export function auditInPage() {
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const toHex = (rgb) => "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  // Any CSS colour syntax the browser computes (rgb, oklab, color(srgb ...)) is resolved
  // to 8-bit rgba by painting it on a canvas, so no format is silently read as black.
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  ctx.canvas.width = ctx.canvas.height = 1;
  const cache = new Map();
  const parseCSS = (s) => {
    if (cache.has(s)) return cache.get(s);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const out = a === 0 ? { rgb: [0, 0, 0], a: 0 } : { rgb: [r, g, b], a: a / 255 };
    cache.set(s, out);
    return out;
  };
  function bgOf(el) {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== "none" && e.tagName !== "HTML" && e.tagName !== "BODY") return { unmeasurable: true };
      const c = parseCSS(cs.backgroundColor);
      if (c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let out = [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i--) { const L = layers[i]; out = out.map((v, k) => L.rgb[k] * L.a + v * (1 - L.a)); }
    return { rgb: out };
  }
  const root = document.body;
  const pairs = new Map(); const small = []; let unmeasured = 0, nodes = 0;
  for (const el of root.querySelectorAll("*")) {
    if (el.closest("svg,video,script,style,noscript")) continue;
    let own = "";
    el.childNodes.forEach((n) => { if (n.nodeType === 3) own += n.textContent; });
    own = own.replace(/\s+/g, " ").trim();
    if (!own) continue;
    if (!el.getClientRects().length) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden") continue;
    const r0 = el.getBoundingClientRect();
    if (r0.width <= 1 && r0.height <= 1) continue; // sr-only
    const bg = bgOf(el);
    if (bg.unmeasurable) { unmeasured++; continue; }
    let fg = parseCSS(cs.color);
    if (fg.a < 1) fg = { rgb: fg.rgb.map((v, k) => v * fg.a + bg.rgb[k] * (1 - fg.a)), a: 1 };
    const px = parseFloat(cs.fontSize), w = parseInt(cs.fontWeight, 10);
    const large = px >= 24 || (px >= 18.66 && w >= 700);
    const need = large ? 3 : 4.5;
    const r = ratio(fg.rgb, bg.rgb);
    const key = [toHex(fg.rgb), toHex(bg.rgb), large ? "L" : "N"].join("|");
    const rec = pairs.get(key) || { fg: toHex(fg.rgb), bg: toHex(bg.rgb), large, need, ratio: +r.toFixed(2), n: 0, sample: own.slice(0, 50) };
    rec.n++; pairs.set(key, rec); nodes++;
    if (px < 12) small.push({ px, sample: own.slice(0, 50) });
  }
  const fails = [...pairs.values()].filter((p) => p.ratio < p.need);
  const hscroll = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return { fails, small, hscroll, pairs: pairs.size, nodes, unmeasured };
}
