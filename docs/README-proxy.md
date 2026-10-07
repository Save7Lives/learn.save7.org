# Why `src/proxy.ts` was removed

`proxy.ts` (formerly `middleware.ts`) did one thing: if a request for a protected
path arrived without a session cookie *present*, it redirected to `/login` without
loading the page. It never verified the cookie's signature and never looked at
roles — it was a latency optimisation for signed-out visitors on slow connections.

Next.js 16 runs `proxy.ts` in the Node runtime and does not support running it at
the edge (`Proxy does not support Edge runtime`). OpenNext cannot build Node
middleware for Cloudflare Workers. So it had to go.

**Nothing was lost.** Every protected page and route handler already performs the
real check server-side, and every one of them passes its own return path:

    src/app/(site)/dashboard/page.tsx            requireUser("/dashboard")
    src/app/(site)/levels/[level]/page.tsx       requireUser(`/levels/${levelSlug}`)
    src/app/(site)/assessment/pre/page.tsx       requireUser("/assessment/pre")
    src/app/admin/layout.tsx                     requireAdmin()
    ...

So a signed-out visitor still lands on `/login?next=<where they were going>` and
is still returned there after signing in. The only difference is that the redirect
now comes from the page instead of from in front of it.

The original file is kept here as `proxy.ts.removed` for reference. If Next.js
later supports edge proxies, it can be restored unchanged.

## Update: the app now runs on Vercel

The constraint above came from OpenNext on Cloudflare Workers. The course is hosted on
Vercel now, which runs Node proxies, so the reason no longer holds. Nothing was
restored: every protected page still does its own session check, and CLAUDE.md still
says not to reintroduce middleware.
