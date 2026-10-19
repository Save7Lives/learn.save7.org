// Probe routes in one call (#51). A signed-in pass on production used to cost one browser
// call per page. This prints status, final path, <title>, first <h1> and any "Stage N of M"
// eyebrow for each route, so a pass reads as one table.
//
//   npm run probe -- /levels/beginner /levels/beginner/modules/why-donation-matters
//   COOKIE='sb-...=...' LIVE_URL=https://learn.save7.org npm run probe -- /dashboard
//
// COOKIE is the signed-in browser's Cookie header (copy it from DevTools); without it the
// signed-out view is what you see. Read-only: it only issues GET requests.
const base = (process.env.LIVE_URL ?? "https://learn.save7.org").replace(/\/$/, "");
const headers = process.env.COOKIE ? { cookie: process.env.COOKIE } : {};
const routes = process.argv.slice(2);
if (routes.length === 0) {
  console.error("Usage: npm run probe -- /route [/route ...]");
  process.exit(2);
}

const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
for (const route of routes) {
  const res = await fetch(base + route, { headers, redirect: "follow" });
  const html = await res.text();
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? "";
  const eyebrow = /(\w+ Level,? )?Stage \d+ of \d+/i.exec(text(html))?.[0] ?? "";
  console.log([res.status, route, "->", new URL(res.url).pathname, "|", text(title), "|", text(h1), eyebrow && `| ${eyebrow}`].filter(Boolean).join(" "));
}
