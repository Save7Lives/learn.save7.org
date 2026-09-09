# Maintenance mode

The holding page served at learn.save7.org while the course is offline.

## Why it is a separate upload

The app is untouched. This is its own directory, deployed to the same Pages
project, so taking the course down and putting it back are two commands and
neither involves editing the app or reverting a commit.

    # Offline
    npx wrangler pages deploy maintenance --project-name=transplant-alchemy --branch=main

    # Back online
    npm run pages:deploy

Whichever was deployed last is what production serves. Nothing else changes: the
custom domain, the Supabase project, the migrations and the register-learner CORS
allow-list are all unaffected.

## Why 503 and not 200

A 200 tells crawlers "this is the page now", and the course's real pages get
dropped from the index. 503 with `Retry-After` says the absence is temporary,
which is the truth. `x-robots-tag: noindex` and `cache-control: no-store` keep the
holding page itself out of indexes and caches, so restoring the site does not leave
people looking at a cached "under construction".

## Why the HTML is inlined in _worker.js

`env.ASSETS.fetch` returned an empty body under advanced mode (a `_worker.js` at
the deploy root), so the first version rendered a blank ink rectangle. Everything
the page needs — the logo, the favicon, the styles — is now inside the one file. A
holding page that depends on a binding to render is a holding page with a way to
fail.

The fonts are the exception: Anton and Inter come from Google Fonts, with
`Impact` and `system-ui` as fallbacks, so a blocked request costs the typeface and
not the page.

## What this does NOT do

**Certificate verification is down too.** `/certificate/<code>` returns the holding
page, so a printed certificate cannot be checked while this is deployed. That is
fine today because no certificates have been issued, and it is the first thing to
reconsider if any have been.

Sign-in, registration and the admin dashboards are equally offline. The database
keeps running — the OS and the volunteer portal are untouched, since they are
different apps on the same Supabase project.
