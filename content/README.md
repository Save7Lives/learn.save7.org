# Course content

Lesson **prose** lives here, as Markdown. Everything that benefits from being
type-checked — Stage Quiz banks, `verifiedAgainst` sign-offs — stays in
`prisma/content/*.ts`.

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

## The Markdown the app can render

`src/components/lesson/Markdown.tsx` is deliberately tiny — it escapes
everything, then re-allows a fixed set of patterns, because a full Markdown
pipeline plus a sanitiser would be a large XSS surface. Write only:

- paragraphs, `**bold**`, `*italic*`, `` `code` ``
- links as `[text](https://…)` — https only
- `> ` blockquotes
- flat `- ` and `1. ` lists, one item per line
- `##` and `###` headings

Anything else reaches the learner as literal characters: a table becomes rows of
pipes, `---` a line of dashes, `<https://…>` escaped angle brackets, and italics
inside bold break the bold. `loadLesson()` refuses all of these, so a lesson
that uses one fails the generator rather than shipping broken.

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

## Stage Quiz banks

Each Stage's bank lives in `prisma/content/quiz-<level>.ts` — fifteen questions,
four options each, exactly one correct, per the Assessment Blueprint.
`prisma/content/quiz.ts` holds the type (`choices` is a four-tuple, so the
compiler catches the count) and `assertBankIsWellFormed()`, which the generator
runs before emitting anything. A Level's file is registered in
`scripts/emit-supabase-content.ts`.

Stage Quiz items are emitted as `scope = 'POST'` with both `level_slug` and
`module_slug` set — POST because #26/#41 settled that the attempt-shaped scopes
left are Stage Quizzes (POST) and inline checks (CHECK); both keys because
`learn_attempts` is level-keyed today while the Blueprint draws five of fifteen
per Stage.

Authoring keys (`sq-b1-01` and so on) are permanent. Reword a prompt freely;
never renumber a key.

## Publishing

`npx tsx scripts/emit-supabase-content.ts` writes the next numbered migration
into `save7-os` and a copy under `prisma/supabase/`. **A Stage is emitted only
when it is finished** — every prose lesson written and its bank present. An
unfinished Stage is left out rather than shipped as a stub, so finishing a Stage
and re-running the generator is the whole of publishing it. A Stage with only
one half done fails the run.

The generator never deletes. The one exception in the Course's history is
`save7-os` migration 0112, the hand-written #47 content reset, which was safe
only because no learner had yet answered a question.

## Status

| Level | Prose | Stage Quiz banks | Ticket |
|---|---|---|---|
| Beginner | Written | 45 of 45 | [#47](https://github.com/zzubyr7x/learn.save7.org-map/issues/47) |
| Intermediate | Written | 60 of 60 | [#48](https://github.com/zzubyr7x/learn.save7.org-map/issues/48) |
| Advanced | Written | 60 of 60 | [#49](https://github.com/zzubyr7x/learn.save7.org-map/issues/49) |
