# Maintenance mode

The holding page served while the course is offline.

## Status: needs re-proving on Workers before anyone relies on it

**Read this before an incident, not during one.** This directory was written
against Cloudflare **Pages** advanced mode, where a `_worker.js` at the deploy root
is picked up automatically and a separate `wrangler pages deploy` of this folder
replaces what the project serves. The app has since been ported back to Cloudflare
**Workers**, and:

- there is no Pages project any more, so
  `npx wrangler pages deploy maintenance --project-name=transplant-alchemy --branch=main`
  — the command this file used to give — **no longer works**;
- `npm run pages:deploy`, the restore command it paired with, does not exist either;
- "advanced mode" is a Pages concept. Workers has no equivalent convention: a
  script is deployed because a `wrangler` configuration names it as `main`, not
  because of where it sits.

`_worker.js` itself is a plain module Worker — a default export with a `fetch`
handler — so the *shape* is already right for Workers. What is missing is the
configuration and, more importantly, the proof.

**The take-down and restore procedure below has not been run on Workers.** It is
what the port implies, not what was observed. Prove it on a throwaway Worker before
the first time you need it under pressure.

## What the equivalent looks like on Workers

There is one Worker, `learn`, on the `admin@save7.org` Cloudflare account. Taking
the course down means deploying this script *as that Worker* — same name, so the
same hostname answers — and restoring means deploying the app over it again with
`npm run deploy`. Whichever was deployed last is what production serves.

That needs a minimal `wrangler` configuration of its own rather than the app's: the
app's config sets `main` to `.open-next/worker.js` and binds `.open-next/assets`,
neither of which applies here. Expect something along the lines of a config naming
`learn`, pointing `main` at `_worker.js`, carrying a `compatibility_date`, and
binding nothing at all.

Two things to settle while proving it:

- **The rollback is a redeploy, not a revert.** `wrangler rollback` and the version
  list are worth checking as the faster restore path, since the app's last good
  version is still on the account.
- **Whatever the app's config declares, this one must not contradict.** When the
  custom domain is eventually attached (DEPLOY.md and DNS-MIGRATION.md own that
  question — as of now `https://learn.save7.workers.dev` is what resolves), a
  holding-page deploy that drops a route would take the hostname with it.

## Why the HTML is inlined in _worker.js

`env.ASSETS.fetch` returned an empty body under Pages advanced mode, so the first
version rendered a blank ink rectangle. Everything the page needs — the logo, the
favicon, the styles — is now inside the one file. **A holding page that depends on
a binding to render is a holding page with a way to fail**, and that reasoning
survives the platform change intact: the point was never Pages, it was that the
fallback should not have moving parts.

The fonts are the exception: Anton and Inter come from Google Fonts, with `Impact`
and `system-ui` as fallbacks, so a blocked request costs the typeface and not the
page.

## Why 503 and not 200

A 200 tells crawlers "this is the page now", and the course's real pages get
dropped from the index. 503 with `Retry-After` says the absence is temporary, which
is the truth. `x-robots-tag: noindex` and `cache-control: no-store` keep the holding
page itself out of indexes and caches, so restoring the site does not leave people
looking at a cached "under construction".

## What this does NOT do

**Certificate verification is down too.** `/certificate/<code>` returns the holding
page, so a printed certificate cannot be checked while this is deployed. That is
fine today because no certificates have been issued, and it is the first thing to
reconsider if any have been.

Sign-in, registration and the admin dashboards are equally offline. The database
keeps running — the OS and the volunteer portal are untouched, since they are
different apps on the same Supabase project. The Supabase project, the migrations
and the `register-learner` CORS allow-list are all unaffected by a holding-page
deploy.

Note that the comment block at the top of `_worker.js` still describes the Pages
arrangement ("a separate upload to the same Pages project", restore via
`npm run pages:deploy`). It is stale for the same reason this file was, and should
be corrected when the Workers procedure is proved.
