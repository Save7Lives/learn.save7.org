# Course content

Lesson **prose** lives here, as Markdown. Everything that benefits from being
type-checked — question banks, interactive payloads, `verifiedAgainst` sign-offs —
stays in `prisma/content/*.ts`.

That split was settled in wayfinder ticket
[#33](https://github.com/zzubyr7x/learn.save7.org-map/issues/33). Prose in
TypeScript meant 20,800 words inside template literals, which is a poor place to
write and a worse place to review. Questions in Markdown would mean nothing
checking that a bank has exactly one correct answer, which is an expensive thing
to get silently wrong.

## Layout

```
content/<level>/<stage-slug>/<lesson-slug>.md
```

`prisma/content/structure.ts` is the structural source of truth — Stage identity,
order, and Level metadata. A prose lesson there names its `bodyPath`; the file at
that path must exist, and its front matter's `slug` must match. `loadCourseProse()`
in `prisma/content/markdown.ts` enforces both.

## Front matter

```yaml
---
slug: intro           # must match structure.ts
title: Why this matters
kind: INTRO           # INTRO | PRIMARY | TAKEAWAYS | STUDY_GUIDE | FURTHER_READING
stage: why-donation-matters
level: beginner
---
```

`CHECK` and `COMPLETE` lessons have no file here: `CHECK` carries a question bank,
and `COMPLETE` is a shell.

## The seven-part spine

Every Stage follows it, unchanged from the prior build:

`INTRO → PRIMARY (one or two) → TAKEAWAYS → CHECK → STUDY_GUIDE → FURTHER_READING → COMPLETE`

## Drafting briefs

Every Stage's `intro.md` currently carries, inside an HTML comment, that Stage's
bullets from `CURRICULUM-ASSESSMENT-SPEC.md` plus a **salvage note** saying which
of the prior build's prose is reusable, which must be cut, and which must be
written from scratch. Delete the block once the lesson is written. The loader
strips HTML comments anyway, so a brief can never reach a learner — but leaving
one in a finished lesson is still noise.

## Two things that have bitten before

- **Lesson identity is `(stage, slug)`, never `slug` alone.** `intro`,
  `takeaways`, `study-guide` and the rest recur once per Stage by design.
  Treating a lesson slug as globally unique once collapsed 97 lessons into 26
  rows.
- **Never delete and reinsert a question.** A reinserted row inherits every
  answer ever recorded against it, and the improvement figures with them. The
  generated migration upserts on the authoring key and never deletes.

## Status

All 56 files are stubs. They are filled in per Level, by the content tickets that
graduated from #33.
