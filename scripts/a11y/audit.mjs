// Accessibility and contrast audit (#29). Renders pages at 375 and 1024 px and fails on
//   - any text/background colour pair under WCAG AA (4.5, or 3 for large text),
//   - any text under 12px,
//   - horizontal page scroll.
// It first proves it can fail (self-test with planted defects).
//
//   npm run audit:a11y              self-test, then every page that can run
//   npm run audit:a11y:selftest     self-test only (needs no server)
//
// Needs a running app: A11Y_BASE_URL (default http://localhost:3000). Signed-in pages
// need the end-to-end stack behind the app and a test-session helper
// (scripts/a11y/session.mjs; README, "Signed-in accessibility audit").
//
//   A11Y_PUBLIC_ONLY=1 npm run audit:a11y   public pages only; signed-in pages are
//                                           skipped by name, with the reason (what CI
//                                           runs, since CI has no database)
import { chromium } from "playwright";
import { auditInPage } from "./in-page.mjs";
import { PAGES, VIEWPORTS } from "./pages.mjs";
import { loadSessionHelper } from "./session.mjs";

const BASE = (process.env.A11Y_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const selftestOnly = process.argv.includes("--selftest");
const publicOnly = /^(1|true|yes)$/i.test(process.env.A11Y_PUBLIC_ONLY ?? "");

const problems = (r) => [
  ...r.fails.map((f) => `contrast ${f.ratio}:1 < ${f.need} (${f.fg} on ${f.bg}, ${f.n}x) "${f.sample}"`),
  ...r.small.map((s) => `text ${s.px}px < 12px "${s.sample}"`),
  ...(r.hscroll > 0 ? [`horizontal scroll by ${r.hscroll}px`] : []),
];

async function selfTest(browser) {
  const doc = (body) => `<!doctype html><meta name=viewport content="width=device-width"><body style="margin:0;font:16px sans-serif;color:#0c173b;background:#fff">${body}`;
  const cases = [
    ["a clean page passes", "<p>Plain navy on white</p>", 0],
    ["a planted low-contrast pair fails", '<p style="color:#9aa0b0">planted bad pair</p>', "contrast"],
    ["planted text under 12px fails", '<p style="font-size:10px">planted tiny text</p>', "text 10px"],
    ["planted horizontal scroll fails", '<div style="width:900px;height:10px;background:#0c173b"></div>', "horizontal scroll"],
  ];
  let ok = true;
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  for (const [label, body, expect] of cases) {
    await page.setContent(doc(body));
    const found = problems(await page.evaluate(auditInPage));
    const pass = expect === 0 ? found.length === 0 : found.some((p) => p.startsWith(expect));
    console.log(`${pass ? "ok  " : "FAIL"} self-test: ${label}`);
    if (!pass) ok = false;
  }
  await page.close();
  return ok;
}

async function main() {
  const browser = await chromium.launch();
  try {
    if (!(await selfTest(browser))) { console.error("Self-test failed: the audit cannot be trusted."); process.exit(2); }
    if (selftestOnly) return;

    const helper = publicOnly ? null : await loadSessionHelper();
    let failed = 0, ran = 0, skipped = 0;
    for (const pg of PAGES) {
      if (pg.auth !== "public" && (publicOnly || !helper)) {
        skipped++;
        const why = publicOnly
          ? "A11Y_PUBLIC_ONLY is set (no database here); audit it locally, see README, Signed-in accessibility audit"
          : "no test-session helper found, see scripts/a11y/session.mjs";
        console.log(`skip ${pg.name} (${pg.path}): signed-in as ${pg.auth}; ${why}`);
        continue;
      }
      for (const vp of VIEWPORTS) {
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        if (pg.auth !== "public") await helper(context, { baseUrl: BASE, role: pg.auth === "admin" ? "admin" : "student" });
        const page = await context.newPage();
        try {
          const res = await page.goto(BASE + pg.path, { waitUntil: "networkidle" });
          if (!res || res.status() >= 400) throw new Error(`HTTP ${res?.status()}`);
          const final = new URL(page.url()).pathname;
          if (pg.auth !== "public" && /^\/(login|enrol)/.test(final)) throw new Error(`redirected to ${final}: the test session did not sign in`);
          await page.evaluate(() => document.fonts.ready);
          const r = await page.evaluate(auditInPage);
          const list = problems(r);
          if (pg.vocabulary) {
            const text = await page.evaluate(() => document.body.innerText);
            for (const m of text.matchAll(/.*\bmodules?\b.*/gi)) list.push(`wording: "module(s)" where Stage applies: "${m[0].trim().slice(0, 60)}"`);
          }
          ran++;
          console.log(`${list.length ? "FAIL" : "ok  "} ${pg.name} @${vp.name} (${r.nodes} text nodes, ${r.pairs} pairs, ${r.unmeasured} on images unmeasured)`);
          for (const p of list) console.log(`       ${p}`);
          if (list.length) failed++;
        } catch (e) {
          failed++;
          console.log(`FAIL ${pg.name} @${vp.name}: ${e.message}`);
        }
        await context.close();
      }
    }
    console.log(`\n${ran} renders, ${failed} failing, ${skipped} signed-in pages skipped${publicOnly ? " (A11Y_PUBLIC_ONLY)" : ""}.`);
    if (failed) process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(2); });
