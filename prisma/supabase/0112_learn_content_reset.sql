-- The course content reset: thirteen modules out, Beginner Level's three Stages in
--
-- ── WHAT THIS DOES ───────────────────────────────────────────────────────────
-- #33 settled the Course as three Levels and eleven Stages, replacing the prior
-- build's thirteen-module outline — a different curriculum, not a relabelling
-- (#26), so none of the old module slugs survive. #47 wrote Beginner Level. This
-- migration takes production from the old outline straight to the finished
-- Stages, in one step:
--
--   1. Sweep every course question of the old outline (POST and CHECK), every
--      reading-list entry keyed to an old module, the thirteen modules themselves
--      (cascading their 97 lessons and any module progress), and the review
--      register's rows for content that no longer exists.
--   2. Upsert the three Levels at their #33 values — title and certificate_title
--      both the Level name, pass_mark_pct 70 → 80.
--   3. Insert Beginner Level's three Stages, their 21 lessons, and their 45 Stage
--      Quiz questions (scope POST, keyed to both level and Stage).
--
-- Intermediate and Advanced are written as Levels but carry no Stages yet. That is
-- deliberate: an unfinished Stage is absent rather than shipped as a stub, and
-- learn_issue_certificate() already refuses a Level with no mandatory modules
-- (`v_total = 0`), so an empty Level cannot mint a certificate. #48 and #49 add
-- their Stages through the ordinary generator, which never deletes.
--
-- ── WHAT THIS DOES NOT TOUCH ─────────────────────────────────────────────────
--   - The 12 PRE rows. They are the baseline bank, and
--     learn_submit_baseline_sitting() (0110) reads them by scope. #50 owns them.
--   - The 40 GATE rows. They belong to the volunteer portal, and applying their
--     corrected text is #45's job, not this one's.
--   - The four course-wide reading-list entries (module_slug null). They are
--     re-upserted below unchanged.
--
-- ── WHY THIS ONE IS HAND-WRITTEN, AND SAFE EXACTLY ONCE ──────────────────────
-- scripts/emit-supabase-content.ts never deletes, and that is kept permanently: a
-- question row deleted and reinserted takes every answer ever recorded against it,
-- and the knowledge-improvement figures with them. So the sweep below is written by
-- hand, here, once — and the body after it is that generator's output, unedited.
--
-- It is safe only because there is nothing to lose. 0110's `delete from learners`
-- (#41, 2026-09-22) cascaded through learn_attempts to every learn_answers row, and
-- through learn_module_progress and learn_certificates with them. That was checked
-- by hand when #33 planned this; the guard below re-checks it at apply time and
-- refuses to run if any learner activity has appeared since. The moment a real
-- learner sits a quiz, this migration is wrong and must not be re-used as a
-- pattern — content changes from then on are upserts on the authoring key only.

begin;

-- ── the guard ─────────────────────────────────────────────────────────────────
-- Runs before anything is deleted. Each table here is one the sweep would destroy
-- or invalidate; any row in any of them means the free window has closed.
do $$
declare n int;
begin
  select count(*) into n from learn_answers;
  if n <> 0 then
    raise exception 'learn_answers holds % row(s): a learner has answered a question, so deleting questions now would destroy their record. Do not apply this reset.', n;
  end if;
  select count(*) into n from learn_module_progress;
  if n <> 0 then
    raise exception 'learn_module_progress holds % row(s): deleting the modules would erase real progress. Do not apply this reset.', n;
  end if;
  select count(*) into n from learn_certificates;
  if n <> 0 then
    raise exception 'learn_certificates holds % row(s): a certificate has been issued against the old outline. Do not apply this reset.', n;
  end if;
end $$;

-- ── what the sweep promises to leave alone, counted before it runs ────────────
-- Compared again in the closing probe. Counting here rather than asserting a
-- number keeps this honest: it proves "untouched" without this file claiming to
-- know production's row counts.
create temporary table _reset_untouched on commit drop as
  select scope::text as scope, count(*) as n
    from learn_questions
   where scope in ('PRE', 'GATE')
   group by scope;

-- ── the sweep ─────────────────────────────────────────────────────────────────
do $$
declare n int;
begin
  /* Every course question of the old outline, and through learn_choices' cascade
     their options. PRE and GATE are named out, not left to chance. */
  delete from learn_questions where scope in ('POST', 'CHECK');
  get diagnostics n = row_count;
  raise notice 'swept % POST/CHECK question(s) of the old outline', n;

  /* Before the modules, not after: learn_resources.module_slug is ON DELETE SET
     NULL (0091), so deleting the modules first would quietly turn every one of
     these into a course-wide entry. */
  delete from learn_resources where module_slug is not null;
  get diagnostics n = row_count;
  raise notice 'swept % module-keyed reading-list entr(ies)', n;

  /* Cascades learn_lessons and learn_module_progress (0091, 0094). */
  delete from learn_modules;
  get diagnostics n = row_count;
  raise notice 'swept % module(s) of the old outline', n;

  /* Review rows for content that no longer exists. entity_ref is text, not a
     foreign key, so nothing cascades here. Lesson and module rows all go — every
     old lesson and module is gone. Question and resource rows go only where their
     entity went; the PRE, GATE and course-wide rows keep their sign-offs. Gate
     rows use the bare authoring key, unprefixed, and so never match 'question:%'. */
  delete from learn_review_items r
   where r.entity_type in ('LESSON', 'MODULE')
      or (r.entity_type = 'QUESTION' and r.entity_ref like 'question:%'
          and not exists (select 1 from learn_questions q
                           where 'question:' || q.authoring_key = r.entity_ref))
      or (r.entity_type = 'RESOURCE' and r.entity_ref like 'resource:%'
          and not exists (select 1 from learn_resources x
                           where 'resource:' || x.slug = r.entity_ref));
  get diagnostics n = row_count;
  raise notice 'swept % review row(s) for content that no longer exists', n;
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- Everything below is scripts/emit-supabase-content.ts --only=course, unedited
-- apart from its own header and transaction markers, which this file supplies.
-- ════════════════════════════════════════════════════════════════════════════


insert into learn_levels (
  slug, position, title, tier, strapline, goal, est_min_minutes, est_max_minutes,
  accent_token, certificate_title, certificate_code, pass_mark_pct
) values (
  'beginner', 0, 'Beginner', 'BEGINNER',
  'For anyone who wants to understand the basics of organ donation.', 'Understand why donation matters, which common beliefs about it are false, and how it actually works.', 30, 45,
  'beginner', 'Beginner', 'B',
  80
) on conflict (slug) do update set
  position = excluded.position, title = excluded.title, tier = excluded.tier,
  strapline = excluded.strapline, goal = excluded.goal,
  est_min_minutes = excluded.est_min_minutes, est_max_minutes = excluded.est_max_minutes,
  accent_token = excluded.accent_token, certificate_title = excluded.certificate_title,
  certificate_code = excluded.certificate_code, pass_mark_pct = excluded.pass_mark_pct,
  updated_at = now();

insert into learn_levels (
  slug, position, title, tier, strapline, goal, est_min_minutes, est_max_minutes,
  accent_token, certificate_title, certificate_code, pass_mark_pct
) values (
  'intermediate', 1, 'Intermediate', 'INTERMEDIATE',
  'For learners who want to understand how donation and transplantation actually work.', 'Move beyond basic awareness and understand how organ donation actually works in South Africa.', 45, 60,
  'intermediate', 'Intermediate', 'I',
  80
) on conflict (slug) do update set
  position = excluded.position, title = excluded.title, tier = excluded.tier,
  strapline = excluded.strapline, goal = excluded.goal,
  est_min_minutes = excluded.est_min_minutes, est_max_minutes = excluded.est_max_minutes,
  accent_token = excluded.accent_token, certificate_title = excluded.certificate_title,
  certificate_code = excluded.certificate_code, pass_mark_pct = excluded.pass_mark_pct,
  updated_at = now();

insert into learn_levels (
  slug, position, title, tier, strapline, goal, est_min_minutes, est_max_minutes,
  accent_token, certificate_title, certificate_code, pass_mark_pct
) values (
  'advanced', 2, 'Advanced', 'ADVANCED',
  'For healthcare-adjacent learners who advocate for donation in practice.', 'Work confidently with the donation conversation, the consent framework, and public advocacy.', 55, 75,
  'advanced', 'Advanced', 'A',
  80
) on conflict (slug) do update set
  position = excluded.position, title = excluded.title, tier = excluded.tier,
  strapline = excluded.strapline, goal = excluded.goal,
  est_min_minutes = excluded.est_min_minutes, est_max_minutes = excluded.est_max_minutes,
  accent_token = excluded.accent_token, certificate_title = excluded.certificate_title,
  certificate_code = excluded.certificate_code, pass_mark_pct = excluded.pass_mark_pct,
  updated_at = now();

insert into learn_modules (
  slug, level_slug, position, title, number, core_question, intro_markdown,
  est_minutes, is_mandatory
) values (
  'why-donation-matters', 'beginner', 0, 'Why Donation Matters', 1,
  'Why do people need donated organs and tissues, and how short is South Africa?', '', 8, true
) on conflict (slug) do update set
  level_slug = excluded.level_slug, position = excluded.position,
  title = excluded.title, number = excluded.number,
  core_question = excluded.core_question, intro_markdown = excluded.intro_markdown,
  est_minutes = excluded.est_minutes, is_mandatory = excluded.is_mandatory,
  updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'intro', 'why-donation-matters', 0, 'Why this matters', 'INTRO',
  'Most conversations about organ donation start in the wrong place — with death. This one starts with the people who are still alive, and waiting.

Organ and tissue transplantation is what remains for patients in **end-stage organ failure**. When an organ fails completely there is usually no way to repair it. Treatment can buy time, sometimes a great deal of it, but for some conditions a transplant is the only option left.

South Africa has those patients, and it has the surgeons and the hospitals to treat them. What it does not have is donors. The national deceased-donation rate fell by **two thirds between 2017 and 2021**, and it has not recovered.

This Stage is about who is waiting, what one donor can actually do for them, and how far short the country currently falls.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'who-is-waiting', 'why-donation-matters', 1, 'Who is waiting', 'PRIMARY',
  '## The people, not the procedures

Donation is easy to think about in the abstract. It is much harder to ignore once you know who is actually on the other end of it.

**Someone in end-stage kidney failure.** Their kidneys can no longer filter their blood well enough to keep them alive, so a machine does it for them, several times a week, indefinitely. A transplant ends that. Kidneys are the most transplanted organ in South Africa by a wide margin.

**Someone with advanced lung disease** — severe COPD, or cystic fibrosis — for whom breathing has become the hardest thing they do. A transplant gives them back air.

**Someone with end-stage heart failure**, whose heart can no longer pump enough blood to get them across a room. Outcomes here are genuinely good: one year after a heart transplant, survival approaches **90%**, and half of recipients live more than **eleven years**.

**Someone with liver failure** — cirrhosis that has passed the point of recovery, or liver failure that came on in days. For them a transplant is not an improvement in quality of life. It is life.

**Someone who has been badly burned.** Donated skin is what keeps a severely burned patient alive while their own body tries to heal. Most people have never heard this, because tissue donation is almost entirely absent from the public conversation.

**Someone who cannot see.** A damaged or diseased cornea causes blindness that a corneal transplant can reverse. Poor eyesight in the donor makes no difference at all — a person who wore glasses their whole life can still restore someone else''s sight.

## What one donor can do

The published South African figures are the ones Save7 is named after:

> **One donor can save seven lives through organ donation, and improve up to fifty more through tissue donation.**

Seven, because a single donor may provide two kidneys, a liver, a heart, two lungs and a pancreas. Fifty, because tissue — corneas, bone, ligaments, skin, heart valves — goes further and helps more people than the organs do. By volume, tissue is the largest part of what donation achieves.

Those are the Organ Donor Foundation''s published figures. You will sometimes see a larger tissue number quoted; this course uses fifty, because fifty is the figure that can be sourced.

## How short is South Africa?

Short enough that the numbers are worth learning properly.

The most recent verified national data comes from the South African Transplant Society and the South African Transplant Coordinators Society, in their five-year report to the World Health Organization''s Global Observatory on Donation and Transplantation, covering **2017 to 2021**.

- **Deceased donors per million people:** 1.60 in 2017, down to **0.48** in 2021
- **Consented deceased donors:** 91 in 2017, down to **38** in 2021
- **Solid organ transplants performed:** 358 in 2017, down to **229** in 2021

The donation rate fell by roughly **two thirds in five years**. Activity dropped during the COVID-19 pandemic and, on the report''s own assessment, has not since recovered.

**At the end of 2021, 2,586 people were on the national transplant waiting list** — 2,382 waiting for a kidney, 108 for a heart, 52 for a liver, 44 for lungs. That year, 189 of them died waiting.

To see how far that is from what is achievable, compare it with a country that made donation work. 📌 **Spain''s deceased-donor rate was 47.05 per million in 2017** — close to thirty times South Africa''s rate in the same year. Spain is not a South African source and its health system is not ours, but it establishes something important: 0.48 is not a natural floor. It is a result.

### A note on how current these numbers are

The 2021 figures above are the **most recent verified national data**, not this year''s. South Africa has no single, centralised register of everyone waiting for a transplant; the data is fragmented across provinces and between the public and private sectors.

More recent figures do circulate. In August 2026, the Gauteng Department of Health was reported as saying that around **6,500 South Africans are waiting for an organ or tissue transplant**, and that only **317 organ transplants were performed nationally in 2024**. Those numbers are consistent with everything above, and this course repeats them with an explicit caveat: they come from news coverage attributing figures to a provincial health department, and no primary document behind them has been located.

When you quote a statistic, quote its date with it. An undated statistic quietly becomes a wrong one.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'takeaways', 'why-donation-matters', 2, 'Key takeaways', 'TAKEAWAYS',
  '- **Transplantation is not an enhancement.** For people in end-stage organ failure it saves or significantly improves life, and for some conditions it is the only option that remains.

- **One donor can save seven lives through organ donation and improve up to fifty more through tissue donation.** That is where Save7''s name comes from, and the tissue half is the part most people have never heard.

- **Donation is far wider than hearts.** Kidneys, liver, heart, lungs and pancreas — plus corneas, bone, ligaments, skin and heart valves. By volume, tissue is the largest part of what donation achieves.

- **South Africa''s deceased-donation rate fell from 1.60 to 0.48 per million people between 2017 and 2021** — roughly two thirds, in five years, and no recovery since.

- **2,586 people were on the national waiting list at the end of 2021**, and 189 of them died that year while waiting. These are the most recent verified national figures, not this year''s.

- **0.48 per million is not a natural floor.** 📌 Spain reached 47.05 per million in 2017. The gap is a result of how a country organises donation, not of what is medically possible.

- **Always quote the date with the statistic.** South Africa has no single national transplant register, the published data is fragmented, and an undated number quietly becomes a wrong one.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'check', 'why-donation-matters', 3, 'Check your understanding', 'CHECK',
  NULL, NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'study-guide', 'why-donation-matters', 4, 'Study guide', 'STUDY_GUIDE',
  '## Who needs a transplant

Organ and tissue transplantation is required by patients with end-stage organ failure, to save their lives or significantly improve them.

- **Kidney** — end-stage renal disease: the kidneys can no longer filter the blood well enough to sustain life
- **Liver** — cirrhosis past the point of recovery, liver cancer, or acute liver failure
- **Heart** — end-stage heart failure: the heart cannot pump enough blood to sustain ordinary activity
- **Lungs** — advanced lung disease such as COPD or cystic fibrosis
- **Pancreas** — diabetes that insulin can no longer manage well, often alongside kidney failure

Tissue transplants restore sight (corneas), restore mobility and relieve pain (bone and ligaments), keep severely burned patients alive (skin), and repair heart function, including in children born with heart defects (heart valves).

## The impact of one donor

One donor can save **seven** lives through organ donation and improve up to **fifty** more through tissue donation — the figures published by the Organ Donor Foundation, and the origin of Save7''s name.

You may see "65 or more" quoted for tissue. That figure cannot be traced to a source; the published South African figure is fifty, and it is the one to use.

## The South African picture

**Most recent verified national data.** SATS/SATCS, *5-Year National Organ Transplant Activity, South Africa 2017–2021*, reported to the WHO Global Observatory on Donation and Transplantation (published 2024).

- Deceased-donor rate per million population: 1.60 (2017) · 1.59 (2018) · 1.16 (2019) · 0.76 (2020) · **0.48 (2021)**
- Consented deceased donors: 91 · 92 · 68 · 45 · **38**
- Solid organ transplants performed, living and deceased donors combined: 358 · 391 · 356 · 200 · **229**
- National waiting list at 31 December 2021 (the first year it was collected): renal 2,382 · heart 108 · liver 52 · lung 44 · **total 2,586**
- Waiting-list deaths in 2021: renal 162 · heart 11 · liver 8 · lung 8 · **total 189**

The report''s own summary is that donation and transplantation activity in South Africa is alarmingly low, deteriorated over the five years, and has not recovered since the COVID-19 pandemic.

**📌 International comparator (not a South African source).** Spain''s deceased-donor rate was 47.05 per million in 2017 — approximately thirty times South Africa''s rate in the same year. Source: Global Observatory data, cited in a 2020 *South African Medical Journal* study.

**Reported but not independently verified.** Around 6,500 South Africans awaiting an organ or tissue transplant, and 317 organ transplants performed nationally in 2024 — attributed to the Gauteng Department of Health in August 2026 news coverage, with no primary document located.

**Historical decade totals — Organ Donor Foundation, 2010–2019**, retained for scale and explicitly dated. The ODF no longer publishes these and now refers enquiries to SATS.

- 2,416 kidney transplants
- 1,911 patients had sight restored by corneal transplants
- 593 patients helped with liver transplants
- 292 hearts transplanted
- 101 lungs transplanted
- In excess of 150,000 South Africans received tissue transplants

## Outcomes

One year after cardiac transplantation, survival approaches 90%, and half of recipients survive beyond eleven years. Good outcomes are the reason the shortage matters; they are not a promise that a transplant is a cure, which this course is careful never to claim.

## Where the numbers come from

The Organ Donor Foundation is South Africa''s awareness and registration body. **SATS is the statistics authority** — the ODF''s own statistics page now defers to it. For a current national figure, go to SATS, not the ODF.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'further-reading', 'why-donation-matters', 5, 'Further reading', 'FURTHER_READING',
  'Optional. This Stage is complete without any of these — they are here for anyone who wants to see the numbers in their original form.

**The national statistics, in full.**
SATS / SATCS, *5-Year National Organ Transplant Activity, South Africa 2017–2021*, the joint report to the WHO Global Observatory on Donation and Transplantation. Twenty-two pages, published 2024, and the source of every verified national figure in this Stage. Available from the [South African Transplant Society](https://sats.org.za/).

**Who is waiting, and why the data is so hard to assemble.**
Spotlight, *"SA has very low organ donation rates — how can we fix it?"* (29 September 2025). Independent journalism that reaches the same 2021 waiting-list total from its own reporting, and explains clearly why South Africa has no single national register. Published by [Spotlight](https://www.spotlightnsp.co.za/).

**The registration body.**
The [Organ Donor Foundation of South Africa](https://odf.org.za/) — donor information, frequently asked questions, and the online donor register.

**The video.**
*The Journey of a Gift* — Save7''s explainer, following a donation from the hospital bedside through to the recipient. Assigned in Stage 3, and worth watching at any point in this Level.

**A word about statistics on the open web.** Figures for South African donation circulate widely and disagree with each other — waiting-list totals of 2,780 and 4,300 have both been published, and neither is the figure this course uses. When you find a number, find its date and its source before you repeat it.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'complete', 'why-donation-matters', 6, 'Complete Stage', 'COMPLETE',
  NULL, NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_modules (
  slug, level_slug, position, title, number, core_question, intro_markdown,
  est_minutes, is_mandatory
) values (
  'busting-the-myths', 'beginner', 1, 'Busting the Myths', 2,
  'Which widely-held beliefs about donation are false, and what is actually true?', '', 15, true
) on conflict (slug) do update set
  level_slug = excluded.level_slug, position = excluded.position,
  title = excluded.title, number = excluded.number,
  core_question = excluded.core_question, intro_markdown = excluded.intro_markdown,
  est_minutes = excluded.est_minutes, is_mandatory = excluded.is_mandatory,
  updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'intro', 'busting-the-myths', 0, 'Why this matters', 'INTRO',
  'South Africa does not have an organ shortage because donation is impossible. It has one because the path from a potential donor to a transplanted patient breaks at several points — and most of those points are human rather than medical.

The largest of them is the conversation with the family. Families refuse, very often, not because they are against donation but because nobody ever gave them factual information, or because what they had heard about donation was untrue.

So this Stage is not a list of corrections to win arguments with. It is the twelve beliefs that most often end a donation conversation in this country, what is actually true, and — just as important — **why each one is persuasive in the first place**.

That last part matters more than it sounds. Almost none of these beliefs are stupid. Most of them are a reasonable fear wearing a factual disguise, and a person who feels dismissed stops listening long before they stop believing. Knowing why a myth persists is what lets you answer the real concern instead of the sentence.

One rule before you start. **You are not here to overrule anyone.** Someone who considers donation carefully, decides against it, and tells their family clearly is a success for Save7, not a failure — because their family will not have to guess.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'the-twelve-myths', 'busting-the-myths', 1, 'The twelve myths', 'PRIMARY',
  'Each myth below comes in three parts: what people say, what is actually true, and why the belief persists. Read the third part as carefully as the second. It is the part that tells you what the person in front of you is actually worried about.

## 1. "If I''m a registered donor, doctors won''t try as hard to save me."

**What is true.** The doctors caring for you and the team that would recover organs are separate, and the rules make them so. Death is certified by at least two doctors, at least one of them registered for five years or more, and **none of them may take part in the transplant**. The people deciding whether you have died have nothing to gain from the answer. Every effort in that room is aimed at keeping you alive, because that is the only job anyone in it has.

**Why it persists.** It taps a real and reasonable fear: that someone else''s interests could outweigh your own at the moment you cannot speak for yourself. The honest answer is not "doctors are good people". It is that the system was built so that nobody has to trust that they are.

## 2. "Donation will disfigure the body."

**What is true.** Recovery is a surgical procedure, carried out in an operating theatre with the same care as any other operation, and the body is restored afterwards. Great care is taken to preserve the donor''s appearance, and **an open-casket funeral remains possible**. Donation does not delay a funeral in any way the family would notice.

**Why it persists.** This is rarely a factual objection. It is about dignity, and about protecting the body of someone loved. If you answer only the facts, you may miss the actual question — which is often about a specific rite, a viewing, or what a family will see.

## 3. "My family will be billed for it."

**What is true.** **The family does not pay for the donation.** The costs of recovering organs and tissue are carried by the hospital or the tissue bank from the point consent is given. That is the stated position of the Organ Donor Foundation and the tissue banks, and it is what happens in practice. The family still pays for the care their relative received *before* death, as they would for any hospital stay; donation neither adds to that nor takes it away.

Say it as practice, not as law. You may hear that "the National Health Act says the family cannot be charged". It does not — neither the Act nor its regulations allocate donation costs — and saying so from a platform invites a correction you cannot answer.

**Why it persists.** Families facing a sudden death are often frightened about money already, and nobody has told them otherwise. It is a fear that grows in silence.

## 4. "Organs are bought and sold."

**What is true.** Donation in South Africa is a voluntary gift. **Trading in human tissue is a criminal offence**, and it is an offence for a donor or their family to receive any reward for a donation beyond reimbursement of costs actually incurred. Organs are allocated to recipients according to prescribed rules — not to whoever can pay, and not at any one doctor''s discretion. An organ may not even be transplanted into someone who is not a South African citizen or permanent resident without the Minister''s written authorisation.

**Why it persists.** Organ trafficking is real in parts of the world, and it is reported vividly. People reasonably ask whether it happens here. The answer is that the law treats it as a crime and allocation is regulated, not left to the market.

## 5. "My religion forbids donation."

**What is true.** Most religions support organ and tissue donation, as consistent with the preservation of life, and donation takes place from every community and culture in South Africa. In hospital, a faith representative or chaplain can be included to support a family through the decision.

What is not true is that *you* should settle it. Positions differ between and within traditions, and the person best placed to say what a faith permits is someone inside it.

**Why it persists.** Assumptions about a faith''s position are often inherited rather than checked. The respectful response is to help someone find out from their own faith leader — not to tell them what their faith says, and not to assume, because of where someone comes from, that the subject should not be raised at all.

## 6. "I''m too old, too unhealthy, or I wear glasses."

**What is true.** There is **no strict upper age limit** for organ donation. Whether a particular organ or tissue can be used is assessed by clinicians at the time of death, organ by organ — not decided in advance by a rule anyone could look up. Donors with conditions such as high blood pressure or diabetes may still be able to donate. And glasses make no difference at all to corneal donation: poor eyesight and cataracts do not disqualify a cornea.

Be careful not to overcorrect. Age and health *are* assessed; they are just not automatic exclusions. "It makes no difference at all" is as wrong as "you''d be turned down anyway", and less forgivable, because it sounds authoritative.

**Why it persists.** People rule themselves out privately and never mention it — so nobody ever gets the chance to correct them. This myth costs donors silently.

## 7. "Registering is enough."

**What is true.** Registering records what you want. It is not the decision itself. In South African practice, **the family is approached in every case, and a family''s refusal is respected**. A registration nobody in your family knows about leaves them guessing, at the worst hour of their lives.

**Register, and then tell your family.** The register records your wish; the conversation is what your family will actually be asked to act on.

**Why it persists.** Registration feels like a completed act — you fill in a form, you get a card, it feels done. And the belief is comforting, which makes it hard to question.

## 8. "If my family agreed once, donation will go ahead."

**What is true.** Agreement given months or years earlier can still change at the bedside. The Gauteng Department of Health has described exactly this: a family agrees, and then, when the time comes, says that culturally they do not believe in it.

The law and the practice pull in different directions here, and both halves are worth knowing. On the face of the National Health Act, a donation a person validly made stands, and relatives acquire the power to decide only where the person made none. In practice, hospitals approach the family every time and respect a refusal. South African legal scholarship treats that gap as a real weakness in how a donor''s own choice is protected.

So neither "your family can''t override you" nor "registering is pointless" is accurate. The first is wrong about what will happen; the second is wrong about the law, and it throws away the most useful thing registering does — telling your family what you wanted.

**Why it persists.** People assume a family decision, once made, stays made. But a family meeting that decision again in acute grief is a different family from the one that agreed calmly over dinner. That is why the conversation is worth having more than once.

## 9. "South Africa''s shortage isn''t really that bad."

**What is true.** It is severe, and it has got worse. South Africa''s deceased-donation rate fell from **1.60 to 0.48 per million people between 2017 and 2021** — roughly two thirds in five years — and at the end of 2021, 2,586 people were on the national waiting list. The national report behind those figures describes activity as alarmingly low.

📌 For scale: Spain''s rate was **47.05 per million** in 2017, close to thirty times South Africa''s in the same year. That is not a South African figure, and Spain''s system is not ours — but it shows that a rate this low is a result, not a limit.

**Why it persists.** The shortage is invisible. Nobody announces the people who die waiting, and "thousands" is too abstract to feel. Stage 1 has the full figures and their dates.

## 10. Tissue donation: "you need a perfect body", "it''s too late once someone has died", "it rules out funeral rites"

**What is true.** None of the three.

- **Far more people can donate tissue than organs.** Tissue is assessed tissue by tissue, and the criteria differ between them. Poor eyesight and cataracts do not stop cornea donation; neither, as myth 11 explains, do most cancers. Most people who die could be tissue donors.
- **It is possible after death has already happened.** Unlike organ donation, tissue donation does not depend on circulation being maintained in an intensive care unit. It can take place irrespective of the manner of death — including for the many people who die at work or on the road and never reach a hospital — and tissue can still be recovered several hours, and even days, after death.
- **It does not preclude funeral rites.** Retrieval teams use prostheses where needed so the body is not disfigured, and it is restored afterwards. When skin is donated, only a very thin layer is taken, and the area looks like a light graze. An open-casket funeral is possible, any funeral option remains open, and because tissue is recovered within hours, the funeral is not delayed.

**Why it persists.** Tissue donation is almost absent from public conversation, so people apply what they have heard about organ donation — the intensive care unit, the ventilator, the race against time — to tissue as well. Most of it does not apply.

## 11. "I''ve had cancer, or a serious illness, so I can''t donate."

**What is true.** It is not an automatic exclusion. The Organ Donor Foundation is plain that a medical condition does not necessarily prevent someone from donating, and that **nothing is decided in advance**: which organs and tissue can be used is established at the time of death. Nobody needs medical tests to register. At the time, the transplant coordinator and transplant team — who know which patients are waiting and what can be safely used — assess suitability from the person''s medical and social history, blood tests and an examination.

Some specifics worth knowing:

- **Donors with conditions such as high blood pressure, diabetes or HIV can still be considered**, because each organ is assessed on its own.
- **South Africa led the world on HIV.** In 2008, Groote Schuur Hospital in Cape Town began transplanting kidneys from HIV-positive donors into HIV-positive recipients — the first programme of its kind. Five years on, about three in four of those recipients were alive.
**With cancer, the answer depends on what is being donated.**

- *Corneas:* most cancers do not prevent cornea donation, because the cornea has no blood vessels to carry cancer cells. Leukaemia and lymphoma do.
- *Skin, bone and heart valves:* a history of cancer rules these out.
- *Organs:* assessed case by case. A primary brain tumour can even be the cause of death of an organ donor. 📌 UK clinical guidance — South Africa has no national guideline of its own on this — sorts cancers by how likely they are to pass to a recipient, from minimal risk to unacceptable. Active cancer that has spread beyond its organ rules donation out. Many small, low-grade or long-treated cancers do not. Anything not listed is decided case by case, and always weighed against the risk of a patient dying while they wait.

Why are the rules for tissue stricter than for organs, when you might expect the reverse? 📌 Because the calculation is different. A donated liver may be the only thing standing between a recipient and death, so a small risk can be worth taking. A tissue graft usually improves someone''s life rather than saving it, so the acceptable risk is lower.

**Why it persists.** People assume a medical history is a disqualification and rule themselves out — the same silent self-exclusion as myth 6. The decision was never theirs to make in advance, and it is not yours either. The honest answer to "would I be accepted?" is almost always *"it would be assessed at the time — register, tell your family, and let the doctors decide."*

## 12. "Living donation is unsafe for the donor."

**What is true.** Living donation — giving a kidney, or part of a liver, while you are alive — is **not risk-free, and it is not reckless either.** It is major surgery on a healthy person, and every operation carries some risk. What makes it acceptably safe is how carefully donors are chosen.

**Screening is the safety.** Every potential living donor in South Africa goes through a full medical assessment, blood-group and tissue typing, and a social-work assessment, with a psychological evaluation where needed to check that the decision is informed and free of pressure. Donor and recipient are counselled separately. Most people who come forward are turned away: at one Johannesburg hospital, over more than thirty years, **fewer than a quarter of the people assessed went on to donate.** A donor can withdraw at any point, right up to the anaesthetic.

**Kidney.** South African transplant clinicians describe the operation to donors as safe and low-risk, while being clear it is not risk-free. The numbers behind that come from large foreign registries, since South Africa has no national living-donor register:

- 📌 Death from the operation is rare — historically about 3 in every 10,000 donors, and under 1 in 10,000 in the most recent decade of US data.
- 📌 Minor complications affect between one donor in ten and one in five; major complications, fewer than 3 in 100.
- 📌 Over a lifetime, a donor''s risk of kidney failure is higher than that of an equally healthy person who did not donate — but lower than the general population''s, because donors are screened so carefully.

**Liver.** Donating part of a liver carries more risk than donating a kidney, and it is honest to say so. 📌 A worldwide survey of more than 11,000 donor operations found that about 1 in 500 donors died. In South Africa, the first 65 living liver donors at Wits Donald Gordon Medical Centre in Johannesburg — all giving a small segment of liver to a child — all survived; five had a major complication.

**Safeguards around the donor.** Every living-donor transplant needs written authorisation from the hospital''s head of clinical services, who may not take part in it. Paying a donor is a criminal offence. A child cannot donate a kidney without the Minister''s authorisation. And where donor and recipient are not blood relatives — which includes a husband or wife — South African practice requires the Minister of Health''s approval, on the advice of an expert committee. (That requirement is how transplant units work today; draft regulations that would write it into law were published for comment in September 2026.)

Living donation is not a fringe practice here. In 2021, South Africa performed 57 living-donor kidney transplants and 33 living-donor liver transplants — and in both 2020 and 2021, living donors made more liver transplants possible than deceased donors did.

**What not to say.** Not "it''s completely safe", and not "it''s dangerous". Also avoid claiming either that donation shortens a donor''s life or that it doesn''t — the long-term studies genuinely disagree, and this course does not pretend otherwise.

**Why it persists.** Living donation is often mentioned and its risks are rarely explained — even the Organ Donor Foundation''s own FAQ describes living donation without a word on donor safety. Silence about risk makes people suspect the worst. The honest answer is the reassuring one: small, real risks, explained in full, taken on only by carefully screened people who chose it for themselves.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'takeaways', 'busting-the-myths', 2, 'Key takeaways', 'TAKEAWAYS',
  '- **Most myths are a reasonable fear in a factual disguise.** Answer the fear, not just the sentence. People who feel dismissed stop listening long before they stop believing.

- **The doctors who certify death may not take part in the transplant.** That structural separation — not an appeal to good intentions — is the answer to "they won''t try as hard".

- **The body is restored and an open casket remains possible.** Objections about disfigurement are usually about dignity; ask what specifically worries someone before you answer.

- **The family does not pay for the donation** — in practice, because the hospital or tissue bank carries the cost. Never say "the law guarantees it": it doesn''t, and you will be corrected.

- **Trading in human tissue is a crime, and organs are allocated by prescribed rules.** Nobody is paid and nobody can buy their way up a list.

- **Most religions support donation, and it is not yours to settle.** Point people to their own faith leader. Never assume someone''s background rules the subject out.

- **Nobody should rule themselves out.** There is no strict upper age limit, glasses make no difference to corneal donation, and suitability is decided by clinicians at the time. Don''t overcorrect either — factors are assessed, not ignored.

- **Registering is not enough, and a family''s earlier agreement is not a guarantee.** The family is asked in every case and a refusal is respected. Register, tell your family — and have the conversation more than once.

- **The shortage is severe:** 0.48 donors per million people in 2021, down from 1.60 in 2017.

- **Tissue donation is open to far more people than organ donation, can happen hours or even days after death, and does not rule out funeral rites** — including an open casket.

- **A medical history, even cancer, is not an automatic exclusion.** Suitability is assessed at the time of death by the transplant team, and it depends on what is donated: most cancers do not stop cornea donation, for example. Nobody needs tests to register.

- **Living donation is low-risk, not no-risk.** Screening is the safety: every donor is fully assessed and most who come forward are turned away. Donating part of a liver carries more risk than donating a kidney, and it is honest to say so.

- **Someone who decides against donation and tells their family is a success, not a failure.** Save7''s goal is a family that knows, not a family that agrees.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'check', 'busting-the-myths', 3, 'Check your understanding', 'CHECK',
  NULL, NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'study-guide', 'busting-the-myths', 4, 'Study guide', 'STUDY_GUIDE',
  '## The twelve myths at a glance

1. **Registered donors get less effort from doctors.** The doctors certifying death may not take part in the transplant. *Source:* Regulation 9, GN R180 of 2012, under the National Health Act.
2. **Donation disfigures the body.** Appearance is preserved and an open casket remains possible. *Source:* Organ Donor Foundation FAQs.
3. **The family gets billed.** The hospital or tissue bank carries the cost — practice, not statute. *Source:* Organ Donor Foundation FAQs; the Act allocates no costs.
4. **Organs are bought and sold.** Trading in tissue is a criminal offence and allocation is prescribed. *Source:* National Health Act ss 60–61.
5. **Religion forbids donation.** Most religions support it; ask your own faith leader. *Source:* Organ Donor Foundation FAQs.
6. **Too old, unhealthy, or wears glasses.** No strict upper age limit; assessed at the time; glasses make no difference to corneas. *Source:* Organ Donor Foundation FAQs; SATCS Red File p.20.
7. **Registering alone is enough.** The family is asked in every case and a refusal is respected. *Source:* Transplant Alchemy 101, Objective 2; South African legal scholarship.
8. **Family agreement once guarantees donation.** A family can decline at the bedside. *Source:* Gauteng Department of Health, 2026; National Health Act s 62.
9. **The shortage isn''t severe.** 1.60 → 0.48 per million people, 2017–2021; 📌 Spain 47.05 in 2017. *Source:* SATS/SATCS 5-year report.
10. **Tissue myths.** Far more people can donate tissue; possible hours or days after death; funeral rites and an open casket are unaffected. *Source:* Organ Donor Foundation FAQ and cornea FAQ; SATCS Red File pp.15–16, 21.
11. **Past illness or cancer excludes you.** Not automatically; assessed at the time of death, and it depends on what is donated. *Source:* Organ Donor Foundation FAQ; SATCS Red File pp.20–21, 41–42; 📌 UK SaBTO guidance on donor cancer.
12. **Living donation is unsafe for the donor.** Low-risk, not no-risk, for carefully screened donors; liver carries more risk than kidney. *Source:* Groote Schuur donor brochure (via SATS); Dayal 2022; Botha 2019; 📌 US registry data.

## Points that are easy to get wrong

**Costs (myth 3).** Checked to conclusion: neither the National Health Act 61 of 2003 nor its 2012 regulations allocate the costs of donation. The bill-free position is the practice stated by the Organ Donor Foundation and the tissue banks. What the Act does say is separate — section 60 prohibits trading in tissue and makes it an offence for a donor to receive a reward beyond reimbursement of reasonable costs actually incurred. The family remains responsible for the cost of the care received before death.

**The family and the law (myths 7 and 8).** Section 62 of the Act puts the person''s own donation first; relatives may decide only where the person made no donation and gave no contrary direction while alive. In practice, hospitals approach the family in every case and respect a refusal. Both halves must be said together — see the lesson for why each on its own is wrong.

**Eligibility (myth 6).** Say "assessed, not excluded". Claiming a factor makes no difference is an overcorrection that will not survive someone checking.

**Cancer and illness (myth 11).** The answer depends on what is being donated, and the rules are set out in the SATCS Red File:

- **Solid organs.** A cancer history is assessed case by case, and a primary brain tumour can be the cause of death of an organ donor. HIV is assessed organ by organ — HIV-positive to HIV-positive kidney transplantation began at Groote Schuur in 2008.
- **Corneas.** Most cancers are acceptable, because the cornea has no blood vessels; leukaemia and lymphoma exclude. HIV and hepatitis B or C exclude.
- **Skin, bone and heart valves.** A history of cancer excludes, as do HIV and hepatitis B or C.

South Africa has no national guideline on organ donors with a cancer history. The 📌 UK guidance (SaBTO) grades cancers from minimal to unacceptable transmission risk, excludes active cancer that has spread, and considers anything outside its tables case by case — always against the risk of a patient dying on the waiting list. Tissue rules are stricter because a tissue graft usually improves life rather than saving it (📌 SaBTO microbiology guidance).

Avoid the phrase *extended criteria donor* as a label: in its technical sense it is a narrow US kidney-allocation category. Say instead that donors with conditions such as high blood pressure, diabetes or HIV can still be considered, because each organ is assessed individually (Red File p.20).

**Living donation (myth 12).**

- *In South Africa:* living donors give a kidney or a segment of liver. 57 living-donor kidney and 33 living-donor liver transplants in 2021 (SATS 5-year report). At Charlotte Maxeke Johannesburg Academic Hospital, 1981–2015, 298 of 1,208 potential donors — fewer than a quarter — went on to donate (Dayal et al., *PLoS ONE* 2022). Wits Donald Gordon''s 65 living liver donors, 2013–2018, all survived (Botha et al., *S Afr J Surg* 2019).
- 📌 *Kidney, US registry data:* perioperative death about 3 per 10,000 (1994–2009), falling to 0.9 per 10,000 (2013–2022); major complications under 3%; lifetime risk of kidney failure 90 per 10,000 donors, against 14 for equally healthy non-donors and 326 for the general population.
- 📌 *Liver:* about 0.2% donor mortality in a worldwide survey of 11,553 operations (Cheah 2013).
- *Safeguards in force:* written authority from the hospital''s head of clinical services, who may not take part (National Health Act s 58); paying a donor is an offence punishable by up to five years (s 60); a person under 18 may not donate tissue the body cannot replace naturally, such as a kidney, without the Minister''s authorisation (s 56).
- *Unrelated donors, spouses included:* South African practice requires the Minister of Health''s approval, advised by the Ministerial Advisory Committee for Organ Transplants (MACOT). **This is practice, not yet law in force** — draft *Regulations on Organ Transplantation* that would codify it were published for comment on 4 September 2026 (Government Gazette 55299). Do not say "the law requires it" until they are promulgated.
- *Do not claim* that donating a kidney shortens life, or that it does not. The US and Norwegian long-term studies disagree.

**Religion (myth 5).** This course deliberately does not set out the positions of individual South African faith traditions. The general reassurance is accurate, and a detailed account should come from within each tradition, not from an advocate.

## Why myths persist

Each myth, and the fear usually underneath it:

- *Less effort from doctors* — being abandoned while unable to speak for yourself
- *Disfigurement* — dignity, and the body of someone loved
- *Being billed* — money, at a moment of shock
- *Organ trade* — exploitation, reported vividly elsewhere
- *Religion* — inherited assumptions, rarely checked
- *Too old or unwell* — quiet self-exclusion nobody hears about
- *Registering is enough* — a form that feels like a completed act
- *Earlier agreement holds* — assuming a calm decision survives acute grief
- *Shortage isn''t severe* — a problem nobody sees
- *Tissue myths* — organ-donation facts applied where they don''t fit
- *A medical history excludes you* — the same quiet self-exclusion as age
- *Living donation is unsafe* — risks that are rarely explained, so people assume the worst', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'further-reading', 'busting-the-myths', 5, 'Further reading', 'FURTHER_READING',
  'Optional. This Stage is complete without these.

**The answers, from the source.**
The [Organ Donor Foundation''s FAQs](https://odf.org.za/faqs/) — the general FAQ and the cornea FAQ answer most of the myths in this Stage directly, in the words of the body that runs the donor register.

**The shortage in numbers.**
SATS / SATCS, *5-Year National Organ Transplant Activity, South Africa 2017–2021*, from the [South African Transplant Society](https://sats.org.za/). The source behind myth 9, and behind every verified figure in Stage 1.

**The law and the family, for anyone who wants depth.**
Slabbert M and Venter B, *"Autonomy in organ donations v family consent: A South African legislative context"*, De Jure, 2019. The scholarly treatment of myths 7 and 8 — the gap between what the National Health Act says about a donor''s own decision and what hospitals actually do. Well beyond Beginner Level; Intermediate Level covers the legal framework properly.

**South Africa''s HIV first.**
Muller E, Barday Z, Mendelson M, Kahn D, *"HIV-positive-to-HIV-positive kidney transplantation — results at 3 to 5 years"*, New England Journal of Medicine 2015;372:613–620. The Groote Schuur programme behind myth 11, and one of the clearest examples anywhere of donation rules changing because clinicians looked at the evidence instead of the assumption.

**What living kidney donors are actually told.**
Groote Schuur Hospital''s living kidney donor information brochure, published with the [SATS position statements](https://sats.org.za/position-statements/) as part of its kidney exchange programme documents. Plain-language, South African, and honest about risk.

**The video.**
*The Journey of a Gift* — Save7''s explainer. Several of the myths in this Stage are answered, without being named, simply by watching what actually happens.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'complete', 'busting-the-myths', 6, 'Complete Stage', 'COMPLETE',
  NULL, NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_modules (
  slug, level_slug, position, title, number, core_question, intro_markdown,
  est_minutes, is_mandatory
) values (
  'how-donation-works', 'beginner', 2, 'How Donation Actually Works', 3,
  'In plain language, how does donation actually happen?', '', 8, true
) on conflict (slug) do update set
  level_slug = excluded.level_slug, position = excluded.position,
  title = excluded.title, number = excluded.number,
  core_question = excluded.core_question, intro_markdown = excluded.intro_markdown,
  est_minutes = excluded.est_minutes, is_mandatory = excluded.is_mandatory,
  updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'intro', 'how-donation-works', 0, 'Why this matters', 'INTRO',
  'People do not usually ask advocates technical questions. They ask practical ones.

*How does it actually work? Do you have to be dead? Can you donate while you''re alive? What''s the difference between organs and tissue? Who decides?*

This Stage answers exactly those questions, in plain language and no further. The clinical and legal depth — how death is determined, what the National Health Act says, who may consent and in what order — belongs to Intermediate Level, and this Stage deliberately stops short of it.

Two facts frame everything that follows. **Organ donation can only happen in a clinical setting**, in practice an intensive care unit. And **donation is not a single decision at a single moment** — it is a process that has to be supported from the beginning, which is why so much of it depends on people knowing what to do before anything happens.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'routes-to-donation', 'how-donation-works', 1, 'Routes to donation', 'PRIMARY',
  '## Organs and tissue are not the same thing

Almost every confusion about donation starts here, so it is worth getting straight first.

**Organs** — kidneys, liver, heart, lungs, pancreas — have to keep working. They can only be recovered in a hospital, from a patient whose circulation has been maintained, and they must be transplanted within hours. This is why organ donation is only possible from a small number of deaths, in a small number of places.

**Tissue** — corneas, bone, ligaments, skin, heart valves — does not have to keep working in the same way. It can be recovered irrespective of the manner of death, in a far wider range of settings, and even after the body has been moved to a mortuary. Tissue can be stored, so it does not have to be matched to a waiting recipient the same day.

That difference is why tissue donation is possible for far more people than most of the public assumes, and why a tissue donation coordinator is a distinct role, specifically trained to counsel next of kin about tissue-only donation.

## The four routes

**After brain death (DBD).** A patient on a ventilator is certified brain dead by two independent doctors. Heart, lungs, liver, kidneys and pancreas can be donated, plus tissue. Next of kin give consent.

**After circulatory death (DCD).** Treatment is withdrawn where death is expected, and the heart stops. What can be donated depends on the circumstances and on how quickly recovery can follow. Next of kin give consent.

**Living donation.** While the donor is alive and well, by their own decision: a kidney, or a segment of liver. The donor consents for themselves — the only route where they do.

**Tissue donation.** Irrespective of the manner of death, and much later than organ donation: corneas, bone and ligaments, skin, heart valves. Next of kin give consent.

Most deceased organ donation in South Africa follows one of the first two routes, and **both require consent from next of kin**.

## The two teams are separate, and that is the point

This is the single most useful fact in the Stage, because it answers the fear people raise most often.

The doctors and nurses treating a patient are not the doctors who would recover or transplant organs. Certifying death is done by **at least two medical practitioners**, at least one of whom has been registered as a doctor for **five years or more**, and **none of them may be involved in transplanting the tissue**. Each tests independently, using an established, repeatable set of tests.

That separation is written into the rules for establishing death. It is not a matter of professional good intentions, and it is not something a hospital can choose to waive. Everyone who cares for the patient is working on keeping that patient alive; nobody in that room has anything to gain from the answer going the other way.

Intermediate Level covers what the tests actually are and where the requirement comes from. For an ordinary conversation, the fact above is enough, and it is strong.

**One more authority, in one specific case.** Where a death is unnatural — a road accident, for example — it must be referred for a forensic post-mortem, and donation then also needs the authorisation of the **Forensic Pathology Service**, which decides what may be recovered without compromising the examination. Donation is still possible; it simply involves one more person saying yes. (Older material calls this office the *district surgeon* or *state pathologist*. It no longer performs the function, and using those terms in public dates you.)

## It is free, and it is voluntary

**Free.** A donor''s family does not pay for the donation. The costs of recovering organs and tissue are carried by the hospital or the tissue bank from the point consent is given. The family still pays for the care the patient received *before* death, exactly as they would for any hospital admission — donation neither adds to that bill nor removes it.

**Voluntary.** Donation is a gift. Trading in human tissue is a criminal offence in South Africa, and it is an offence for a donor or their family to receive any reward for a donation beyond reimbursement of costs actually incurred. Nobody is paid, and nobody can be.

## Register *and* tell your family

Registering with the Organ Donor Foundation records what you want. It takes a few minutes and costs nothing.

It is not, by itself, enough.

In South African practice, hospitals approach the family in every case, and a family''s refusal is respected. So the question your family will actually be asked, at the worst hour of their lives, is *"what would they have wanted?"* — and the only thing that lets them answer it is having heard you say so.

**Register, and then tell your family.** Both halves. The register records the decision; the conversation is what your family will be asked to act on.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'takeaways', 'how-donation-works', 2, 'Key takeaways', 'TAKEAWAYS',
  '- **Organs must keep working; tissue does not.** Organs can only be recovered in hospital and transplanted within hours. Tissue can be recovered irrespective of the manner of death, in far more settings, and stored — which is why tissue donation is possible for many more people.

- **There are four routes:** donation after brain death, donation after circulatory death, living donation of a kidney or a segment of liver, and tissue donation.

- **Every deceased donation route requires consent from next of kin.** Living donation is the only route where the donor consents for themselves.

- **The treating team and the transplant team are separate.** At least two doctors certify death, at least one registered for five or more years, and none of them may be involved in the transplant. Each tests independently.

- **An unnatural death adds one authority, not a refusal.** The Forensic Pathology Service must authorise what may be recovered. Donation is still possible.

- **It costs the family nothing, and nobody is paid.** Recovery costs are carried by the hospital or tissue bank from the point consent is given, and trading in human tissue is a criminal offence.

- **Registering records your wishes; telling your family is what makes them actionable.** Do both. Your family is the one who will be asked.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'check', 'how-donation-works', 3, 'Check your understanding', 'CHECK',
  NULL, NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'study-guide', 'how-donation-works', 4, 'Study guide', 'STUDY_GUIDE',
  '## Organ versus tissue

**Organs** — kidneys, liver, heart, lungs, pancreas.

- Recovered in a clinical setting only, in practice an intensive care unit
- Circulation must have been maintained, and transplantation follows within hours
- Not stored: matched and transplanted immediately

**Tissue** — corneas, bone and ligaments, skin, heart valves.

- Recovered in a far wider range of settings, including after transfer to a mortuary
- Possible irrespective of the manner of death, and considerably later — hours or even days
- Can be stored and used later

## The four routes to donation

**Donation after brain death (DBD).** A patient on a mechanical ventilator is certified brain dead. Any patient so certified — irreversible structural brain damage with total loss of brainstem function — is a potential organ donor.

**Donation after circulatory death (DCD).** Possible where a decision has been taken to withdraw life-sustaining treatment and death is expected to follow. What can be recovered depends on the circumstances and on how quickly recovery can follow death.

**Living donation.** A living donor may donate a kidney or a segment of liver, by their own conscious and informed decision, after full assessment.

**Tissue donation.** Broader eligibility than organ donation. A tissue donation coordinator is trained specifically to counsel next of kin and obtain consent for tissue-only donation.

## Separation of the teams

Death is established by **at least two medical practitioners**. At least one must have been practising as a registered medical practitioner for **at least five years**. **None of them may transplant tissue removed from that person, or take part in such a transplantation.** Each doctor performs the tests independently.

The requirement is set out in the regulations made under the National Health Act 61 of 2003. Intermediate Level covers the regulation itself, the preconditions that must be met before testing can begin, and the tests in detail; this Stage teaches only the safeguard.

## Unnatural deaths

Where death is due to unnatural causes, the death must be referred for a medico-legal post-mortem, and donation requires the authorisation of the **Forensic Pathology Service**, which determines what may be recovered without compromising the examination. Family consent alone is not sufficient in these cases.

The terms *district surgeon* and *state pathologist* appear in older donation material. That office no longer performs this function.

## Costs and payment

A donor family does not pay for the donation. Recovery costs are carried by the hospital or the tissue bank from the point consent is given — this is the position stated by the Organ Donor Foundation and the tissue banks, and it is what happens in practice.

State it as practice, not as statute. Neither the National Health Act nor its regulations allocate the costs of donation. What the Act does say is separate: trading in human tissue is prohibited, and it is an offence for a donor to receive any reward for a donation beyond reimbursement of costs actually incurred.

The family remains responsible for the cost of the care the patient received before death, as with any admission.

## Registering and telling

Registration with the Organ Donor Foundation is free, takes minutes, and records a person''s wishes.

In South African practice, hospitals approach the family in every case and respect a refusal. A registration the family has never heard about therefore leaves them guessing. The advocacy line is **register, and then tell your family** — because the conversation, not the register, is what the family will be asked to act on.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'further-reading', 'how-donation-works', 5, 'Further reading', 'FURTHER_READING',
  '**Watch this one.** *The Journey of a Gift* — Save7''s explainer, following a donation from the hospital bedside through to the recipient. It is the single most useful thing to watch on this Level, and it reinforces all three Stages rather than only this one.

Everything below is optional, for anyone who wants more.

**The donor register itself.**
The [Organ Donor Foundation of South Africa](https://odf.org.za/). Registration is free and takes a few minutes. The site''s FAQ pages also answer most of the questions in Stage 2 directly from the source.

**What the law actually says.**
National Health Act 61 of 2003, Chapter 8, and the regulations gazetted under it in March 2012. Worth knowing they exist; Intermediate Level reads them properly, and Advanced Level quotes the relevant regulation verbatim. Do not attempt to summarise them from memory in public.

**The determination of death, in the medical literature.**
Thomson D, et al., *South African guidelines on the determination of death*, Southern African Journal of Critical Care 2021;37(1):466. Peer-reviewed and specific to South Africa. Well beyond Beginner Level, and the place to go if someone asks you a question this Stage cannot answer.

**What not to reach for.** *7 Lives in 7 Steps* is a clinical decision algorithm written for ICU and hospital staff — referral triggers, brainstem testing protocol, forensic forms. It is excellent, and it is not general-public material. Its title is the only part of it this Level uses.', NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_lessons (
  slug, module_slug, position, title, kind, body_markdown, component_key, payload
) values (
  'complete', 'how-donation-works', 6, 'Complete Stage', 'COMPLETE',
  NULL, NULL, NULL
) on conflict (module_slug, slug) do update set
  position = excluded.position, title = excluded.title, kind = excluded.kind,
  body_markdown = excluded.body_markdown, component_key = excluded.component_key,
  payload = excluded.payload, updated_at = now();

insert into learn_resources (
  slug, module_slug, title, description, kind, is_required, source, author,
  external_url, file_path, licence_note, is_stub, position
) values (
  'save7', NULL, 'Save7', 'Save7''s own site: donor registration, the LifePod project, and current campaigns.', 'WEBSITE',
  false, 'Save7', NULL, 'https://save7.org',
  NULL, NULL, false, 0
) on conflict (slug) do update set
  module_slug = excluded.module_slug, title = excluded.title,
  description = excluded.description, kind = excluded.kind,
  is_required = excluded.is_required, source = excluded.source,
  author = excluded.author, external_url = excluded.external_url,
  file_path = excluded.file_path, licence_note = excluded.licence_note,
  is_stub = excluded.is_stub, position = excluded.position;

insert into learn_resources (
  slug, module_slug, title, description, kind, is_required, source, author,
  external_url, file_path, licence_note, is_stub, position
) values (
  'organ-donor-foundation-of-south-africa', NULL, 'Organ Donor Foundation of South Africa', 'The national umbrella body for promoting awareness and managing the donor database. The right place to send anyone who wants to register, or who asks for current South African figures.', 'WEBSITE',
  false, 'Organ Donor Foundation of South Africa', NULL, 'https://odf.org.za',
  NULL, NULL, false, 1
) on conflict (slug) do update set
  module_slug = excluded.module_slug, title = excluded.title,
  description = excluded.description, kind = excluded.kind,
  is_required = excluded.is_required, source = excluded.source,
  author = excluded.author, external_url = excluded.external_url,
  file_path = excluded.file_path, licence_note = excluded.licence_note,
  is_stub = excluded.is_stub, position = excluded.position;

insert into learn_resources (
  slug, module_slug, title, description, kind, is_required, source, author,
  external_url, file_path, licence_note, is_stub, position
) values (
  'transplant-alchemy-101-study-guide', NULL, 'Transplant Alchemy 101 — Study Guide', 'Save7''s own study guide, structured around five learning objectives: who needs organs, where and why organs are lost, the transplant team, the legislation, and donor eligibility. This is the source of truth for the course.', 'PDF',
  true, 'Save7', NULL, NULL,
  '/resources/transplant-alchemy-101-study-guide.pdf', NULL, false, 2
) on conflict (slug) do update set
  module_slug = excluded.module_slug, title = excluded.title,
  description = excluded.description, kind = excluded.kind,
  is_required = excluded.is_required, source = excluded.source,
  author = excluded.author, external_url = excluded.external_url,
  file_path = excluded.file_path, licence_note = excluded.licence_note,
  is_stub = excluded.is_stub, position = excluded.position;

insert into learn_resources (
  slug, module_slug, title, description, kind, is_required, source, author,
  external_url, file_path, licence_note, is_stub, position
) values (
  'amboss-transplantation', NULL, 'Transplantation — AMBOSS Knowledge Library', 'General clinical reference on transplantation, cited by the study guide.', 'WEBSITE',
  false, 'AMBOSS GmbH', NULL, 'https://next.amboss.com/us/article/gn0Fsg',
  NULL, 'Cited by the Save7 study guide, accessed 10 February 2026. Requires an AMBOSS subscription.', false, 3
) on conflict (slug) do update set
  module_slug = excluded.module_slug, title = excluded.title,
  description = excluded.description, kind = excluded.kind,
  is_required = excluded.is_required, source = excluded.source,
  author = excluded.author, external_url = excluded.external_url,
  file_path = excluded.file_path, licence_note = excluded.licence_note,
  is_stub = excluded.is_stub, position = excluded.position;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-01', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'What does end-stage organ failure mean?',
  NULL, 'The organ has failed to the point where it can no longer sustain its function, and it cannot be repaired. For some conditions transplantation is the only option that remains.', 'who-is-waiting',
  1, NULL, 0
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'The organ is working at reduced capacity but is stable', false, 'Reduced but stable function is not end-stage; it is usually managed with treatment.'
  from learn_questions where authoring_key = 'sq-b1-01'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'The organ has already been surgically removed', false, 'End-stage failure describes an organ still in the body that no longer works.'
  from learn_questions where authoring_key = 'sq-b1-01'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'The organ can no longer sustain its function and cannot be repaired', true, NULL
  from learn_questions where authoring_key = 'sq-b1-01'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'The organ is failing but will recover with medication', false, 'If medication can restore the organ, it has not reached end-stage failure.'
  from learn_questions where authoring_key = 'sq-b1-01'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-02', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'Which of these is transplanted as tissue rather than as a solid organ?',
  NULL, 'Corneas, bone and ligaments, skin and heart valves are tissue. Kidneys, liver, heart, lungs and pancreas are solid organs.', 'what-can-be-donated',
  1, NULL, 1
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'A kidney', false, 'A kidney is a solid organ.'
  from learn_questions where authoring_key = 'sq-b1-02'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'The pancreas', false, 'The pancreas is a solid organ.'
  from learn_questions where authoring_key = 'sq-b1-02'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'A lung', false, 'Lungs are solid organs.'
  from learn_questions where authoring_key = 'sq-b1-02'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Heart valves', true, NULL
  from learn_questions where authoring_key = 'sq-b1-02'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-03', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'Where does Save7''s name come from?',
  NULL, 'One donor can save seven lives through organ donation. Tissue donation from the same donor can improve up to fifty more.', 'what-can-be-donated',
  1, NULL, 2
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Seven organs are recovered in every donation', false, 'What can be recovered varies with the circumstances of each death.'
  from learn_questions where authoring_key = 'sq-b1-03'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'One decision can save seven lives', true, NULL
  from learn_questions where authoring_key = 'sq-b1-03'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'The organisation was founded by seven people', false, 'The name refers to what one donor can do, not to the founders.'
  from learn_questions where authoring_key = 'sq-b1-03'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Seven hospitals in South Africa perform transplants', false, 'The name is not a count of transplant centres.'
  from learn_questions where authoring_key = 'sq-b1-03'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-04', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'How many people can one donor help through tissue donation?',
  NULL, 'Up to fifty. Tissue — corneas, bone, ligaments, skin, heart valves — goes further and reaches more people than the solid organs do. By volume it is the largest part of what donation achieves.', 'what-can-be-donated',
  1, NULL, 3
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Up to fifty', true, NULL
  from learn_questions where authoring_key = 'sq-b1-04'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Up to seven', false, 'Seven is the organ figure. Tissue reaches many more people than that.'
  from learn_questions where authoring_key = 'sq-b1-04'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'One, because tissue is matched to a single recipient', false, 'Tissue from one donor is divided among many recipients.'
  from learn_questions where authoring_key = 'sq-b1-04'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Up to two hundred', false, 'Larger figures circulate but cannot be sourced. This course uses the published figure of fifty.'
  from learn_questions where authoring_key = 'sq-b1-04'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-05', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'What happened to South Africa''s deceased-donation rate between 2017 and 2021?',
  NULL, 'It fell from 1.60 to 0.48 donors per million people — roughly two thirds in five years. Activity dropped during the COVID-19 pandemic and has not recovered since.', 'sa-shortage',
  1, NULL, 4
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'It roughly doubled, from 0.48 to 1.60 per million people', false, 'The direction is the wrong way round. The rate fell.'
  from learn_questions where authoring_key = 'sq-b1-05'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'It fell by roughly two thirds, from 1.60 to 0.48 per million people', true, NULL
  from learn_questions where authoring_key = 'sq-b1-05'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'It stayed broadly flat', false, 'It fell in every one of the five years reported.'
  from learn_questions where authoring_key = 'sq-b1-05'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'It fell during 2020 and recovered fully by 2021', false, '2021 was the lowest year of the five, not a recovery.'
  from learn_questions where authoring_key = 'sq-b1-05'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-06', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'How many people were on South Africa''s national transplant waiting list at the end of 2021, the most recent verified figure?',
  NULL, '2,586 — of whom 2,382 were waiting for a kidney. 189 people on the list died that year.', 'sa-shortage',
  2, NULL, 5
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, '258', false, 'Too low by a factor of ten. 2,586 people were waiting.'
  from learn_questions where authoring_key = 'sq-b1-06'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, '25,860', false, 'Too high by a factor of ten.'
  from learn_questions where authoring_key = 'sq-b1-06'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Nobody knows, because no figure has ever been collected', false, '2021 was the first year the waiting list was collected nationally, and the figure is 2,586.'
  from learn_questions where authoring_key = 'sq-b1-06'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, '2,586', true, NULL
  from learn_questions where authoring_key = 'sq-b1-06'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-07', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'Spain''s deceased-donor rate was 47.05 per million in 2017, against South Africa''s 1.60. What does that comparison establish?',
  NULL, 'That South Africa''s rate is a result rather than a limit. Spain''s health system is not ours and the figure is not a South African one, but it shows that a low donation rate is something a country''s organisation of donation produces, not a natural floor.', 'sa-shortage',
  2, NULL, 6
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'That South African doctors are less skilled than Spanish ones', false, 'South Africa has a long and distinguished transplant history. Surgical capability is not the constraint.'
  from learn_questions where authoring_key = 'sq-b1-07'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'That South Africa should adopt Spanish law exactly', false, 'The comparison establishes what is achievable, not which policy achieves it.'
  from learn_questions where authoring_key = 'sq-b1-07'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'That a low donation rate is a result of how donation is organised, not a natural limit', true, NULL
  from learn_questions where authoring_key = 'sq-b1-07'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Nothing, because the two countries cannot be compared at all', false, 'The comparison has real limits, and it still shows the gap is not medically fixed.'
  from learn_questions where authoring_key = 'sq-b1-07'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-08', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'What is donated skin used for?',
  NULL, 'Keeping severely burned patients alive. It is one of the clearest examples of tissue donation saving a life outright, and one of the least known.', 'who-is-waiting',
  1, NULL, 7
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Cosmetic surgery', false, 'Donated skin is a treatment for severe burn injury, not a cosmetic material.'
  from learn_questions where authoring_key = 'sq-b1-08'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Treating patients with severe burns', true, NULL
  from learn_questions where authoring_key = 'sq-b1-08'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Replacing a damaged cornea', false, 'Corneal damage is treated with a donated cornea.'
  from learn_questions where authoring_key = 'sq-b1-08'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Repairing damaged ligaments', false, 'Ligament damage is repaired with donated bone and ligament tissue.'
  from learn_questions where authoring_key = 'sq-b1-08'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-09', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'Can someone who wore glasses all their life donate their corneas?',
  NULL, 'Yes. Poor eyesight and cataracts do not disqualify a cornea donor — the cornea is the clear front surface of the eye, and the reasons most people wear glasses have nothing to do with it.', 'eligibility',
  1, NULL, 8
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Yes — wearing glasses does not disqualify a cornea donor', true, NULL
  from learn_questions where authoring_key = 'sq-b1-09'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'No — donated corneas must have had perfect vision', false, 'This is one of the most common reasons people wrongly rule themselves out.'
  from learn_questions where authoring_key = 'sq-b1-09'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Only if the glasses were for reading', false, 'The reason for the glasses makes no difference.'
  from learn_questions where authoring_key = 'sq-b1-09'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Only if they had laser surgery to correct their vision first', false, 'No such requirement exists.'
  from learn_questions where authoring_key = 'sq-b1-09'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-10', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'You need a current national figure for transplants performed in South Africa. Where should you look?',
  NULL, 'The South African Transplant Society. The Organ Donor Foundation is the awareness and registration body and its own statistics page now refers enquiries to SATS.', 'sa-shortage',
  2, NULL, 9
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'The Organ Donor Foundation', false, 'The ODF is the registration and awareness body; its statistics page now points to SATS.'
  from learn_questions where authoring_key = 'sq-b1-10'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Whichever news article was published most recently', false, 'News coverage often repeats figures without a primary source or a date.'
  from learn_questions where authoring_key = 'sq-b1-10'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'The hospital where the transplant was performed', false, 'A single hospital cannot give you a national figure.'
  from learn_questions where authoring_key = 'sq-b1-10'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'The South African Transplant Society (SATS)', true, NULL
  from learn_questions where authoring_key = 'sq-b1-10'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-11', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'Why does this course insist you quote the date alongside any donation statistic?',
  NULL, 'Because an undated statistic quietly becomes a wrong one. South Africa has no single national transplant register, published figures disagree with each other, and the most recent verified national data is from 2021.', 'sa-shortage',
  2, NULL, 10
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Because the figures change and an undated number eventually becomes a wrong one', true, NULL
  from learn_questions where authoring_key = 'sq-b1-11'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Because it makes the statistic sound more authoritative', false, 'The reason is accuracy, not presentation.'
  from learn_questions where authoring_key = 'sq-b1-11'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Because the law requires statistics to be dated', false, 'No such requirement exists. The reason is that the figures genuinely change.'
  from learn_questions where authoring_key = 'sq-b1-11'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'It does not really matter, as long as the figure was accurate once', false, 'A figure that was accurate in 2017 is misleading if quoted as current.'
  from learn_questions where authoring_key = 'sq-b1-11'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-12', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'By the number of people helped, which part of donation is the largest?',
  NULL, 'Tissue. It is almost absent from public conversation about donation, and it reaches far more people than solid organs do.', 'what-can-be-donated',
  1, NULL, 11
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Heart transplantation', false, 'Hearts are what most people picture, and they are among the rarest transplants.'
  from learn_questions where authoring_key = 'sq-b1-12'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Lung transplantation', false, 'Lung transplantation remains rare in South Africa.'
  from learn_questions where authoring_key = 'sq-b1-12'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Living donation', false, 'Living donation matters, but tissue reaches far more people.'
  from learn_questions where authoring_key = 'sq-b1-12'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Tissue donation', true, NULL
  from learn_questions where authoring_key = 'sq-b1-12'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-13', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'Which statement about outcomes after a heart transplant is most accurate?',
  NULL, 'One-year survival approaches 90% and half of recipients live beyond eleven years. Those are good outcomes, and a transplant is still not a cure — it trades one serious medical situation for a much better one that involves daily medication and lifelong monitoring.', 'who-is-waiting',
  2, NULL, 12
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'A transplant restores the recipient completely, with no further treatment needed', false, 'Overselling transplantation does the cause no favours. Recipients take medication and are monitored for life.'
  from learn_questions where authoring_key = 'sq-b1-13'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Most recipients survive less than a year', false, 'Outcomes are far better than this. One-year survival approaches 90%.'
  from learn_questions where authoring_key = 'sq-b1-13'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Outcomes are unknown because too few transplants are performed', false, 'Outcomes after cardiac transplantation are well documented.'
  from learn_questions where authoring_key = 'sq-b1-13'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'One-year survival approaches 90%, and half of recipients live beyond eleven years', true, NULL
  from learn_questions where authoring_key = 'sq-b1-13'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-14', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'How should an advocate use those figures?',
  'A 2026 news article reports the Gauteng Department of Health as saying around 6,500 South Africans are waiting for a transplant, and that 317 organ transplants were performed nationally in 2024.', 'Use them, and say where they come from. They are consistent with the verified data and no primary document behind them has been located, so they are quoted as reported rather than as established.', 'sa-shortage',
  2, NULL, 13
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Quote them as the current official national statistics', false, 'No primary document behind them has been located. Presenting them as official overstates what is known.'
  from learn_questions where authoring_key = 'sq-b1-14'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Refuse to use them at all', false, 'They are consistent with the verified data and genuinely useful. The answer is to caveat them, not to drop them.'
  from learn_questions where authoring_key = 'sq-b1-14'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Quote them and attribute them to the South African Transplant Society', false, 'Attributing a figure to a source that did not publish it is worse than not using it.'
  from learn_questions where authoring_key = 'sq-b1-14'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Quote them with an explicit note that they are reported, not independently verified', true, NULL
  from learn_questions where authoring_key = 'sq-b1-14'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b1-15', 'POST', 'SINGLE', NULL,
  'beginner', 'why-donation-matters', 'Why do people need organ transplants?',
  NULL, 'Because their organ has failed completely and cannot be repaired. Transplantation is not an enhancement and it is not usually a preference — it is what remains when other treatment can no longer sustain the organ''s function.', 'who-is-waiting',
  1, NULL, 14
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'To improve the performance of a healthy organ', false, 'Transplantation treats organs that have failed; it is not an enhancement.'
  from learn_questions where authoring_key = 'sq-b1-15'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Because they have chosen a transplant instead of taking medication', false, 'Transplantation is not usually an alternative someone simply prefers.'
  from learn_questions where authoring_key = 'sq-b1-15'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Only after a serious accident', false, 'Accidents are one route to organ failure, but most recipients have a chronic disease.'
  from learn_questions where authoring_key = 'sq-b1-15'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Their organ has failed completely and cannot be repaired', true, NULL
  from learn_questions where authoring_key = 'sq-b1-15'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-01', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'What actually answers the fear that doctors won''t try as hard to save a registered donor?',
  NULL, 'The doctors who certify death are independent of the transplant team, and none of them may take part in the transplant. Pointing to that structural separation is far stronger than an assurance about professional character.', 'myths',
  2, NULL, 0
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'The doctors who certify death may not take part in the transplant', true, NULL
  from learn_questions where authoring_key = 'sq-b2-01'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Doctors take an oath, so they would never do that', false, 'An appeal to character asks the person to trust. The separation of teams means they do not have to.'
  from learn_questions where authoring_key = 'sq-b2-01'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Hospitals are never told who is a registered donor', false, 'Not the safeguard. The protection is who may certify death, not who knows about the registration.'
  from learn_questions where authoring_key = 'sq-b2-01'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'It would be illegal, so it cannot happen', false, 'Vague. The specific safeguard — separate teams — is what reassures.'
  from learn_questions where authoring_key = 'sq-b2-01'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-02', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'A family worries that donation will mean they cannot have an open-casket funeral. What is true?',
  NULL, 'Recovery is carried out with surgical care, the donor''s appearance is preserved, and an open-casket funeral remains possible.', 'myths',
  1, NULL, 1
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'An open casket is not possible after any donation', false, 'This is the myth. Great care is taken to preserve the donor''s appearance.'
  from learn_questions where authoring_key = 'sq-b2-02'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Only a closed casket is allowed after organ donation, but not after tissue donation', false, 'Neither form of donation rules out an open casket.'
  from learn_questions where authoring_key = 'sq-b2-02'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'The funeral must be delayed by several weeks', false, 'Donation does not delay a funeral in any way the family would notice.'
  from learn_questions where authoring_key = 'sq-b2-02'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'The body is restored and an open-casket funeral remains possible', true, NULL
  from learn_questions where authoring_key = 'sq-b2-02'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-03', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'What is the most accurate way to tell a family that donation will not cost them anything?',
  NULL, 'State it as practice. The hospital or tissue bank carries the costs of the donation from the point consent is given — that is the stated position of the Organ Donor Foundation and the tissue banks. Neither the National Health Act nor its regulations allocate donation costs, so claiming the law guarantees it is an error.', 'costs',
  2, NULL, 2
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'The National Health Act prohibits anyone from charging the family', false, 'Neither the Act nor its regulations allocate donation costs. This course corrected exactly this claim.'
  from learn_questions where authoring_key = 'sq-b2-03'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'The hospital or tissue bank carries the costs of the donation from the point consent is given', true, NULL
  from learn_questions where authoring_key = 'sq-b2-03'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'The family''s medical aid pays, so there is nothing out of pocket', false, 'The donation is not billed to the donor''s cover at all.'
  from learn_questions where authoring_key = 'sq-b2-03'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'The recipient pays the donor''s family''s costs', false, 'Any payment from a recipient to a donor''s family would be a criminal offence.'
  from learn_questions where authoring_key = 'sq-b2-03'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-04', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'Someone asks whether organs in South Africa go to whoever can pay. What is true?',
  NULL, 'No. Trading in human tissue is a criminal offence, and organs are allocated according to prescribed rules rather than by payment or any single doctor''s discretion.', 'law',
  1, NULL, 3
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'No — trading in human tissue is a crime and organs are allocated by prescribed rules', true, NULL
  from learn_questions where authoring_key = 'sq-b2-04'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Yes, private patients can pay to move up the list', false, 'Allocation is regulated, not sold.'
  from learn_questions where authoring_key = 'sq-b2-04'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Only for organs from living donors', false, 'The prohibition on trading applies to living and deceased donation alike.'
  from learn_questions where authoring_key = 'sq-b2-04'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Only when the organ is transplanted outside South Africa', false, 'Trading is prohibited, and transplanting into a non-resident needs the Minister''s written authorisation.'
  from learn_questions where authoring_key = 'sq-b2-04'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-05', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'Which response best reflects what this Stage teaches?',
  'Someone at a community event tells you their religion does not allow organ donation.', 'Accept their position and point them to the right authority. Most religions support donation, but positions differ and it is not yours to settle. A clearly communicated ''no'' that their family has heard is a good outcome, not a failure.', 'myths',
  2, NULL, 4
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Tell them most religions actually permit it, so they are probably mistaken', false, 'Even where broadly true, telling someone what their own faith permits oversteps — and loses their trust.'
  from learn_questions where authoring_key = 'sq-b2-05'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Respect it, suggest they ask their own faith leader, and ask whether their family knows their wishes', true, NULL
  from learn_questions where authoring_key = 'sq-b2-05'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Look up their religion''s position for them on the spot', false, 'Well-meant, but it makes you the interpreter of their faith. Point them to someone inside it.'
  from learn_questions where authoring_key = 'sq-b2-05'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Drop the subject and move on to someone more likely to register', false, 'Their family still needs to know their wishes. That conversation is worth having whatever they decide.'
  from learn_questions where authoring_key = 'sq-b2-05'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-06', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'What is the best response?',
  'A colleague says: "I''m in my sixties and on blood pressure medication — I''d be turned down anyway."', 'Do not let anyone rule themselves out, and do not overcorrect by claiming the factor is irrelevant. There is no strict upper age limit, and suitability is assessed organ by organ by clinicians at the time.', 'eligibility',
  1, NULL, 5
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'You''re right, that combination would exclude you', false, 'A confident exclusion can permanently remove a potential donor. There is no strict upper age limit.'
  from learn_questions where authoring_key = 'sq-b2-06'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Don''t rule yourself out — suitability is assessed individually by doctors at the time', true, NULL
  from learn_questions where authoring_key = 'sq-b2-06'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Age and blood pressure make no difference at all to donation', false, 'Overcorrection. These factors are assessed rather than ignored, and the claim will not survive someone checking.'
  from learn_questions where authoring_key = 'sq-b2-06'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'You could only donate your corneas', false, 'Speculation about a specific outcome. Keep it general and let the assessment decide.'
  from learn_questions where authoring_key = 'sq-b2-06'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-07', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'Why is registering as a donor not enough on its own?',
  NULL, 'Because in South African practice the family is approached in every case and a refusal is respected. A registration the family has never heard about leaves them guessing.', 'family-conversation',
  1, NULL, 6
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'The family is always asked, so they need to know what you want', true, NULL
  from learn_questions where authoring_key = 'sq-b2-07'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'The register is often lost or out of date', false, 'The reason is not the register''s reliability. It is that the family is asked in every case.'
  from learn_questions where authoring_key = 'sq-b2-07'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Registration expires after five years', false, 'It does not expire. It is simply not the decision the family will be asked to make.'
  from learn_questions where authoring_key = 'sq-b2-07'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'It is enough — hospitals follow the register without asking the family', false, 'This is the myth. Hospitals approach the family in every case.'
  from learn_questions where authoring_key = 'sq-b2-07'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-08', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'A family agreed to donation some years ago. Why might donation still not go ahead?',
  NULL, 'A family meeting the decision again in acute grief can change its mind at the bedside, and in practice a family''s refusal is respected. That is why the conversation is worth having more than once.', 'family-conversation',
  2, NULL, 7
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Earlier agreement is legally void after one year', false, 'There is no such rule. The issue is that families are asked again at the time.'
  from learn_questions where authoring_key = 'sq-b2-08'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Agreement only counts if it was given in writing to a hospital', false, 'The form of the earlier agreement is not the issue. The family is asked again at the time.'
  from learn_questions where authoring_key = 'sq-b2-08'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'The family can change its mind at the bedside, and a refusal is respected in practice', true, NULL
  from learn_questions where authoring_key = 'sq-b2-08'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'It will always go ahead — earlier agreement binds the family', false, 'This is the myth. Agreement given calmly years ago can change in acute grief.'
  from learn_questions where authoring_key = 'sq-b2-08'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-09', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'Someone says South Africa''s organ shortage isn''t really that serious. Which fact best answers them?',
  NULL, 'The deceased-donation rate fell by roughly two thirds between 2017 and 2021, to 0.48 per million people, and 2,586 people were on the national waiting list at the end of 2021.', 'sa-shortage',
  1, NULL, 8
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'South Africa has the highest donation rate in Africa', false, 'That would not answer the concern, and it is not what this course teaches.'
  from learn_questions where authoring_key = 'sq-b2-09'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'The donation rate fell by about two thirds in five years, to 0.48 per million', true, NULL
  from learn_questions where authoring_key = 'sq-b2-09'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Most people on the waiting list receive a transplant within a year', false, 'Nothing in the national data supports this. 189 people died waiting in 2021.'
  from learn_questions where authoring_key = 'sq-b2-09'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'The shortage is mainly caused by a lack of surgeons', false, 'South Africa has the surgical capability. The shortage is in donors.'
  from learn_questions where authoring_key = 'sq-b2-09'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-10', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'Which statement about tissue donation is true?',
  NULL, 'Tissue donation does not need a ''perfect body'' and does not depend on circulation being maintained in intensive care. It can happen irrespective of the manner of death, even after the body has been moved to a mortuary, and it does not rule out funeral rites.', 'what-can-be-donated',
  2, NULL, 9
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'It needs a donor in perfect health with no medical history', false, 'Each tissue is assessed on its own criteria. No ''perfect body'' is needed.'
  from learn_questions where authoring_key = 'sq-b2-10'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'It must happen in intensive care, like organ donation', false, 'That applies to organs. Tissue does not depend on circulation being maintained.'
  from learn_questions where authoring_key = 'sq-b2-10'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'It can take place after death has occurred, even after the body has gone to a mortuary', true, NULL
  from learn_questions where authoring_key = 'sq-b2-10'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'It rules out a traditional funeral', false, 'The donor''s appearance is preserved and funeral rites go ahead.'
  from learn_questions where authoring_key = 'sq-b2-10'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-11', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'What is the most accurate thing to tell them?',
  'A friend had cancer ten years ago and says there is no point registering as a donor.', 'A medical history is not an automatic exclusion. Suitability is assessed at the time of death, by the transplant team, and the answer depends on what is being donated — most cancers do not prevent cornea donation, for example, and organs are assessed case by case.', 'eligibility',
  2, NULL, 10
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Any history of cancer rules out every kind of donation', false, 'Not true. Most cancers do not prevent cornea donation, and organs are assessed case by case.'
  from learn_questions where authoring_key = 'sq-b2-11'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'It isn''t an automatic exclusion — it would be assessed at the time, and depends on what is donated', true, NULL
  from learn_questions where authoring_key = 'sq-b2-11'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'A cancer history makes no difference to donation at all', false, 'Overcorrection. A cancer history is assessed carefully — it rules out skin, bone and heart-valve donation, for example.'
  from learn_questions where authoring_key = 'sq-b2-11'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'They need medical clearance before they are allowed to register', false, 'No medical tests are needed to register. Suitability is assessed only at the time of death.'
  from learn_questions where authoring_key = 'sq-b2-11'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-12', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'Which statement best describes the safety of donating a kidney while you are alive?',
  NULL, 'Not risk-free, but low-risk for carefully screened donors. Screening is the safety: every potential donor is fully assessed, and most people who come forward are turned away. Donating part of a liver carries more risk than donating a kidney.', 'living-donation',
  2, NULL, 11
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Completely safe, with no risk to the donor at all', false, 'Overcorrection. It is major surgery and every operation carries some risk.'
  from learn_questions where authoring_key = 'sq-b2-12'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'So dangerous that it is only permitted in emergencies', false, 'Living kidney donation is a planned, routine operation in South Africa — 57 were performed in 2021.'
  from learn_questions where authoring_key = 'sq-b2-12'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Acceptable because the donor is paid for taking the risk', false, 'Paying a donor is a criminal offence in South Africa.'
  from learn_questions where authoring_key = 'sq-b2-12'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Low-risk but not risk-free, because donors are carefully screened and most are turned away', true, NULL
  from learn_questions where authoring_key = 'sq-b2-12'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-13', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'Why is it useful to understand why a myth persists, rather than only knowing that it is false?',
  NULL, 'Because most myths are a reasonable fear wearing a factual disguise. Knowing why a belief is persuasive is what lets you answer the real concern. People who feel dismissed stop listening long before they stop believing.', 'myths',
  2, NULL, 12
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'It lets you answer the real concern instead of dismissing the person', true, NULL
  from learn_questions where authoring_key = 'sq-b2-13'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'It makes the myth easier to memorise', false, 'The point is the conversation, not recall.'
  from learn_questions where authoring_key = 'sq-b2-13'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'It proves the person is being unreasonable', false, 'The opposite. Most of these beliefs are reasonable fears.'
  from learn_questions where authoring_key = 'sq-b2-13'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'It is not useful — correcting the fact is enough', false, 'A correction that ignores the fear behind it rarely changes anyone''s mind.'
  from learn_questions where authoring_key = 'sq-b2-13'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-14', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'Which loss point on the way from a potential donor to a transplant is most directly changed by a family having talked about donation beforehand?',
  NULL, 'Family refusal at the consent stage. A family that already knows what their relative wanted is not being asked to guess.', 'loss-points',
  1, NULL, 13
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Family refusal at the consent stage', true, NULL
  from learn_questions where authoring_key = 'sq-b2-14'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Surgical complications during recovery', false, 'Not something a family conversation affects.'
  from learn_questions where authoring_key = 'sq-b2-14'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'A shortage of transplant surgeons', false, 'Surgical capability is not the constraint, and a family conversation would not change it.'
  from learn_questions where authoring_key = 'sq-b2-14'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Organs being damaged in transit', false, 'A logistics problem, not one a family conversation changes.'
  from learn_questions where authoring_key = 'sq-b2-14'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b2-15', 'POST', 'SINGLE', NULL,
  'beginner', 'busting-the-myths', 'Where are most potential donations in South Africa lost?',
  NULL, 'At human points rather than medical ones — awareness, myths, fear, and families who have never discussed donation. That is why busting myths and starting conversations matters.', 'loss-points',
  1, NULL, 14
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'At human points, such as myths, fear and families who never discussed it', true, NULL
  from learn_questions where authoring_key = 'sq-b2-15'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'In the operating theatre, through surgical failure', false, 'Surgical capability is not the main constraint.'
  from learn_questions where authoring_key = 'sq-b2-15'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'In transport between hospitals', false, 'Logistics matter, but most losses are human.'
  from learn_questions where authoring_key = 'sq-b2-15'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Through laws that prohibit most donation', false, 'Donation is lawful in South Africa.'
  from learn_questions where authoring_key = 'sq-b2-15'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-01', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'What are the two routes to deceased organ donation?',
  NULL, 'Donation after brain death, and donation after circulatory death. Both require consent from next of kin.', 'routes-to-donation',
  1, NULL, 0
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Living donation, and tissue donation', false, 'Living donation is not deceased donation, and tissue donation is a separate category again.'
  from learn_questions where authoring_key = 'sq-b3-01'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Voluntary donation, and involuntary donation', false, 'All donation in South Africa is voluntary. There is no involuntary route.'
  from learn_questions where authoring_key = 'sq-b3-01'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'After brain death, and after circulatory death', true, NULL
  from learn_questions where authoring_key = 'sq-b3-01'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Hospital donation, and community donation', false, 'Organ donation only happens in a clinical setting; there is no community route.'
  from learn_questions where authoring_key = 'sq-b3-01'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-02', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'What can a living donor donate?',
  NULL, 'A kidney, or a segment of liver. Both are possible because the donor can live well with what remains.', 'routes-to-donation',
  1, NULL, 1
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'A kidney, or a segment of liver', true, NULL
  from learn_questions where authoring_key = 'sq-b3-02'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'A heart', false, 'A heart cannot come from a living donor.'
  from learn_questions where authoring_key = 'sq-b3-02'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Corneas', false, 'Corneas are recovered after death.'
  from learn_questions where authoring_key = 'sq-b3-02'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Any organ, provided the donor consents', false, 'Living donation is limited to organs the donor can live without — in practice a kidney or part of a liver.'
  from learn_questions where authoring_key = 'sq-b3-02'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-03', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'You have registered as an organ donor. What most improves the chance your wishes are followed?',
  NULL, 'Your family knowing what you want. In South African practice hospitals approach the family in every case, so the conversation — not the register — is what your family will be asked to act on.', 'family-conversation',
  1, NULL, 2
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Registering a second time to be sure', false, 'Registering twice changes nothing. Telling your family changes everything.'
  from learn_questions where authoring_key = 'sq-b3-03'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Carrying a donor card in your wallet', false, 'A card in a wallet is unlikely to be found in time, and the family will still be asked.'
  from learn_questions where authoring_key = 'sq-b3-03'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Telling your family what you have decided', true, NULL
  from learn_questions where authoring_key = 'sq-b3-03'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Nothing further — registration is sufficient on its own', false, 'This is the single most consequential misunderstanding in South African donation.'
  from learn_questions where authoring_key = 'sq-b3-03'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-04', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'What is the main practical difference between organ and tissue donation?',
  NULL, 'Organs must keep working, so they can only be recovered in hospital and must be transplanted within hours. Tissue can be recovered irrespective of the manner of death, in far more settings, and stored for later use.', 'routes-to-donation',
  1, NULL, 3
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Tissue can be recovered in far more settings and much later; organs cannot', true, NULL
  from learn_questions where authoring_key = 'sq-b3-04'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Tissue donation requires a court order and organ donation does not', false, 'Neither requires a court order. Both require consent from next of kin.'
  from learn_questions where authoring_key = 'sq-b3-04'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Organs can be stored for months; tissue cannot', false, 'It is the other way round. Tissue can be stored; organs must be transplanted within hours.'
  from learn_questions where authoring_key = 'sq-b3-04'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'There is no practical difference — the rules are identical', false, 'The differences in timing and setting are what make tissue donation possible for many more people.'
  from learn_questions where authoring_key = 'sq-b3-04'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-05', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'Who may certify that a potential donor has died?',
  NULL, 'At least two medical practitioners, at least one of them registered as a doctor for five years or more, and none of them involved in transplanting the tissue. Each tests independently.', 'determination-of-death',
  2, NULL, 4
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'The transplant surgeon who will perform the recovery', false, 'This is precisely what the rule forbids. The people who establish death may have nothing to gain from the organs.'
  from learn_questions where authoring_key = 'sq-b3-05'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Any one doctor on duty', false, 'One doctor is not enough. At least two are required, each testing independently.'
  from learn_questions where authoring_key = 'sq-b3-05'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'At least two doctors, one registered five years or more, none of them on the transplant team', true, NULL
  from learn_questions where authoring_key = 'sq-b3-05'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'The transplant coordinator', false, 'A coordinator organises the process but does not certify death.'
  from learn_questions where authoring_key = 'sq-b3-05'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-06', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'Why are the doctors who certify death kept separate from the transplant team?',
  NULL, 'So that nobody deciding whether a patient has died has anything to gain from the answer. It is a structural safeguard written into the rules, not a matter of professional good intentions.', 'myths',
  2, NULL, 5
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Because transplant surgeons are not qualified to certify death', false, 'Many are perfectly qualified. They are excluded because of the conflict, not the competence.'
  from learn_questions where authoring_key = 'sq-b3-06'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'To save the transplant team''s time', false, 'The separation is a safeguard, not a scheduling convenience.'
  from learn_questions where authoring_key = 'sq-b3-06'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'So that nobody who decides whether a patient has died has anything to gain from the organs', true, NULL
  from learn_questions where authoring_key = 'sq-b3-06'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Because the treating team knows the patient better', false, 'Familiarity is not the reason. Independence is.'
  from learn_questions where authoring_key = 'sq-b3-06'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-07', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'What does donation after brain death (DBD) describe?',
  NULL, 'A patient on a mechanical ventilator who has been certified brain dead. Circulation is maintained, which is why the organs remain transplantable.', 'routes-to-donation',
  1, NULL, 6
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'A patient who died at home and was brought to hospital', false, 'Organ donation requires a clinical setting with circulation maintained.'
  from learn_questions where authoring_key = 'sq-b3-07'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'A donor who chose to donate before they became ill', false, 'That describes registering, which can precede either route or neither.'
  from learn_questions where authoring_key = 'sq-b3-07'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'A patient on a ventilator who has been certified brain dead by two independent doctors', true, NULL
  from learn_questions where authoring_key = 'sq-b3-07'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Any patient in a coma', false, 'A coma is not death, and a patient in a coma is not a donor.'
  from learn_questions where authoring_key = 'sq-b3-07'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-08', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'What does donation after circulatory death (DCD) describe?',
  NULL, 'Donation where a decision has been taken to withdraw life-sustaining treatment and death is expected to follow. What can be recovered depends on the circumstances and on how quickly recovery can follow death.', 'routes-to-donation',
  2, NULL, 7
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Donation from a donor whose heart was transplanted', false, 'This describes the recipient, not the donor''s route.'
  from learn_questions where authoring_key = 'sq-b3-08'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Donation after treatment is withdrawn and the heart stops', true, NULL
  from learn_questions where authoring_key = 'sq-b3-08'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Donation that takes place at a mortuary', false, 'Tissue donation can happen after transfer to a mortuary; DCD happens in hospital.'
  from learn_questions where authoring_key = 'sq-b3-08'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Donation by a living donor with a heart condition', false, 'DCD is a deceased-donation route.'
  from learn_questions where authoring_key = 'sq-b3-08'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-09', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'Which route to donation is the only one where the donor consents for themselves?',
  NULL, 'Living donation. Every deceased route — after brain death, after circulatory death, and tissue donation — requires consent from next of kin.', 'consent',
  1, NULL, 8
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Donation after brain death', false, 'Next of kin are asked in every deceased donation.'
  from learn_questions where authoring_key = 'sq-b3-09'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Living donation', true, NULL
  from learn_questions where authoring_key = 'sq-b3-09'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Tissue donation', false, 'Tissue donation requires consent from next of kin, obtained by a tissue donation coordinator.'
  from learn_questions where authoring_key = 'sq-b3-09'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'All of them, if the person registered as a donor', false, 'Registration records your wishes; in practice the family is still asked.'
  from learn_questions where authoring_key = 'sq-b3-09'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-10', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'What does an unnatural death add to the process?',
  'Someone dies in a road accident and their family wants to donate.', 'One more authority. The death must be referred for a forensic post-mortem, and recovery needs the Forensic Pathology Service''s authorisation for what may be taken without compromising the examination. Donation is still possible.', 'law',
  2, NULL, 9
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Donation becomes impossible', false, 'Donation after an unnatural death is possible; it simply involves one more authorisation.'
  from learn_questions where authoring_key = 'sq-b3-10'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'The family''s consent is no longer needed', false, 'Family consent is still required — it is just no longer sufficient on its own.'
  from learn_questions where authoring_key = 'sq-b3-10'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'The police decide which organs may be donated', false, 'The forensic pathologist decides. The police may be involved in liaison, not in the decision.'
  from learn_questions where authoring_key = 'sq-b3-10'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'The Forensic Pathology Service must also authorise what may be recovered', true, NULL
  from learn_questions where authoring_key = 'sq-b3-10'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-11', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'Who pays for recovering the organs and tissue from a donor?',
  NULL, 'The hospital or the tissue bank, from the point consent is given. The family still pays for the care the patient received before death, exactly as they would for any admission — donation neither adds to that bill nor removes it.', 'costs',
  2, NULL, 10
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'The donor''s family, out of the estate', false, 'The family does not pay for the donation. This fear is one of the commonest reasons people hesitate.'
  from learn_questions where authoring_key = 'sq-b3-11'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'The recipient, directly to the donor''s family', false, 'Any payment to a donor or their family is a criminal offence.'
  from learn_questions where authoring_key = 'sq-b3-11'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'The hospital or the tissue bank, from the point consent is given', true, NULL
  from learn_questions where authoring_key = 'sq-b3-11'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'The donor''s medical aid, which is billed for the recovery surgery', false, 'The donation costs are carried by the hospital or tissue bank, not billed to the donor''s cover.'
  from learn_questions where authoring_key = 'sq-b3-11'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-12', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'Can a family be paid for donating a relative''s organs in South Africa?',
  NULL, 'No. Trading in human tissue is a criminal offence, and it is an offence for a donor to receive any reward beyond reimbursement of costs actually incurred. Donation is a gift.', 'law',
  1, NULL, 11
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Yes, a standard fee is paid to the family', false, 'No such fee exists, and paying one would be a crime.'
  from learn_questions where authoring_key = 'sq-b3-12'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Yes, but only for tissue rather than organs', false, 'The prohibition covers human tissue generally.'
  from learn_questions where authoring_key = 'sq-b3-12'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Only if the recipient offers the payment voluntarily', false, 'Who offers it makes no difference. Payment for tissue is prohibited.'
  from learn_questions where authoring_key = 'sq-b3-12'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'No — trading in human tissue is a criminal offence', true, NULL
  from learn_questions where authoring_key = 'sq-b3-12'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-13', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'When can tissue donation take place?',
  NULL, 'Irrespective of the manner of death, and considerably later than organ donation — including after the body has been moved to a mortuary. This is why tissue donation is possible for far more people than the public assumes.', 'routes-to-donation',
  2, NULL, 12
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Only in an intensive care unit, like organ donation', false, 'That restriction applies to organs, which must keep working. Tissue does not.'
  from learn_questions where authoring_key = 'sq-b3-13'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Only where the person died of natural causes', false, 'Tissue donation is possible irrespective of the manner of death.'
  from learn_questions where authoring_key = 'sq-b3-13'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Irrespective of the manner of death, including after transfer to a mortuary', true, NULL
  from learn_questions where authoring_key = 'sq-b3-13'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Only within one hour of death', false, 'Tissue has a far longer window than organs do.'
  from learn_questions where authoring_key = 'sq-b3-13'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-14', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'Why can solid organs only be recovered in a clinical setting?',
  NULL, 'Because they have to keep working. Organ donation depends on circulation having been maintained up to recovery, and on the organ reaching a recipient within hours — neither of which is possible outside a hospital.', 'routes-to-donation',
  2, NULL, 13
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'Because the organs must keep working, which depends on circulation being maintained', true, NULL
  from learn_questions where authoring_key = 'sq-b3-14'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'Because the law only permits donation inside a hospital building', false, 'The constraint is biological rather than legal — tissue donation happens outside intensive care routinely.'
  from learn_questions where authoring_key = 'sq-b3-14'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'Because the family can only give consent at a hospital', false, 'Consent can be obtained wherever the family is; the constraint is on the organs.'
  from learn_questions where authoring_key = 'sq-b3-14'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'Because transplant surgeons are not allowed to travel', false, 'Recovery teams do travel. The organs are what cannot wait.'
  from learn_questions where authoring_key = 'sq-b3-14'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_questions (
  authoring_key, scope, kind, gate, level_slug, module_slug, prompt, scenario,
  explanation, topic_tag, difficulty, pair_key, position
) values (
  'sq-b3-15', 'POST', 'SINGLE', NULL,
  'beginner', 'how-donation-works', 'Older donation material refers to the ''district surgeon'' or ''state pathologist''. Why should an advocate not use those terms?',
  NULL, 'Because that office no longer performs the function. Medico-legal post-mortems moved to the Forensic Pathology Service under the Department of Health. Using the old term dates the speaker and invites correction.', 'law',
  2, NULL, 14
) on conflict (authoring_key) do update set
  scope = excluded.scope, kind = excluded.kind, gate = excluded.gate,
  level_slug = excluded.level_slug, module_slug = excluded.module_slug,
  prompt = excluded.prompt, scenario = excluded.scenario,
  explanation = excluded.explanation, topic_tag = excluded.topic_tag,
  difficulty = excluded.difficulty, pair_key = excluded.pair_key,
  position = excluded.position, updated_at = now();

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'a', 0, 'The terms are legally accurate but considered impolite', false, 'The problem is accuracy, not tone.'
  from learn_questions where authoring_key = 'sq-b3-15'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'b', 1, 'The office no longer performs the function — it is now the Forensic Pathology Service', true, NULL
  from learn_questions where authoring_key = 'sq-b3-15'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'c', 2, 'They refer to a role that only exists in the private sector', false, 'The function moved to the Forensic Pathology Service, which is a state service.'
  from learn_questions where authoring_key = 'sq-b3-15'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_choices (question_id, option_key, position, text, is_correct, feedback)
select id, 'd', 3, 'They are correct, and this course prefers them', false, 'They are out of date. The course uses Forensic Pathology Service.'
  from learn_questions where authoring_key = 'sq-b3-15'
 on conflict (question_id, option_key) do update set
  position = excluded.position, text = excluded.text,
  is_correct = excluded.is_correct, feedback = excluded.feedback;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-01', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'What does end-stage organ failure mean?',
  'MEDICAL', 2, 'APPROVED',
  'Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body''s appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation', 'Keyed answer and explanation checked against: Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body''s appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-02', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'Which of these is transplanted as tissue rather than as a solid organ?',
  'MEDICAL', 2, 'APPROVED',
  'SATCS, ''The Organ and Tissue Donation Reference File'' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5', 'Keyed answer and explanation checked against: SATCS, ''The Organ and Tissue Donation Reference File'' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-03', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'Where does Save7''s name come from?',
  'MEDICAL', 2, 'APPROVED',
  'Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body''s appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation', 'Keyed answer and explanation checked against: Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body''s appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-04', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'How many people can one donor help through tissue donation?',
  'MEDICAL', 2, 'APPROVED',
  'Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body''s appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation', 'Keyed answer and explanation checked against: Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body''s appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-05', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'What happened to South Africa''s deceased-donation rate between 2017 and 2021?',
  'STATISTIC', 2, 'APPROVED',
  'SATS/SATCS, ''5-Year National Organ Transplant Activity, South Africa 2017-2021'', the joint report to the WHO-ONT Global Observatory on Donation and Transplantation (published 2024): donation rate 1.60 pmp in 2017 falling to 0.48 pmp in 2021; waiting list at 31 December 2021 of 2,586 (renal 2,382, heart 108, liver 52, lung 44); 189 waiting-list deaths in 2021', 'Keyed answer and explanation checked against: SATS/SATCS, ''5-Year National Organ Transplant Activity, South Africa 2017-2021'', the joint report to the WHO-ONT Global Observatory on Donation and Transplantation (published 2024): donation rate 1.60 pmp in 2017 falling to 0.48 pmp in 2021; waiting list at 31 December 2021 of 2,586 (renal 2,382, heart 108, liver 52, lung 44); 189 waiting-list deaths in 2021'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-06', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'How many people were on South Africa''s national transplant waiting list at the end of 2021, the most recent verified figure?',
  'STATISTIC', 2, 'APPROVED',
  'SATS/SATCS, ''5-Year National Organ Transplant Activity, South Africa 2017-2021'', the joint report to the WHO-ONT Global Observatory on Donation and Transplantation (published 2024): donation rate 1.60 pmp in 2017 falling to 0.48 pmp in 2021; waiting list at 31 December 2021 of 2,586 (renal 2,382, heart 108, liver 52, lung 44); 189 waiting-list deaths in 2021', 'Keyed answer and explanation checked against: SATS/SATCS, ''5-Year National Organ Transplant Activity, South Africa 2017-2021'', the joint report to the WHO-ONT Global Observatory on Donation and Transplantation (published 2024): donation rate 1.60 pmp in 2017 falling to 0.48 pmp in 2021; waiting list at 31 December 2021 of 2,586 (renal 2,382, heart 108, liver 52, lung 44); 189 waiting-list deaths in 2021'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-07', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'Spain''s deceased-donor rate was 47.05 per million in 2017, against South Africa''s 1.60. What does that comparison establish?',
  'STATISTIC', 2, 'APPROVED',
  '📌 Non-South African comparator. Spain''s deceased-donor rate of 47.05 pmp in 2017 (2,183 deceased donors), from Global Observatory data cited in a 2020 South African Medical Journal study and reported in Spotlight, 29 September 2025', 'Keyed answer and explanation checked against: 📌 Non-South African comparator. Spain''s deceased-donor rate of 47.05 pmp in 2017 (2,183 deceased donors), from Global Observatory data cited in a 2020 South African Medical Journal study and reported in Spotlight, 29 September 2025'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-08', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'What is donated skin used for?',
  'MEDICAL', 2, 'APPROVED',
  'SATCS, ''The Organ and Tissue Donation Reference File'' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5', 'Keyed answer and explanation checked against: SATCS, ''The Organ and Tissue Donation Reference File'' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-09', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'Can someone who wore glasses all their life donate their corneas?',
  'MEDICAL', 2, 'APPROVED',
  'SATCS, ''The Organ and Tissue Donation Reference File'' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5', 'Keyed answer and explanation checked against: SATCS, ''The Organ and Tissue Donation Reference File'' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-10', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'You need a current national figure for transplants performed in South Africa. Where should you look?',
  'STATISTIC', 2, 'APPROVED',
  'The Organ Donor Foundation''s statistics page (odf.org.za/statistics/) carries no independent figures and defers to the South African Transplant Society for comprehensive transplant statistics', 'Keyed answer and explanation checked against: The Organ Donor Foundation''s statistics page (odf.org.za/statistics/) carries no independent figures and defers to the South African Transplant Society for comprehensive transplant statistics'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-11', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'Why does this course insist you quote the date alongside any donation statistic?',
  'STATISTIC', 2, 'APPROVED',
  'SATS/SATCS, ''5-Year National Organ Transplant Activity, South Africa 2017-2021'', the joint report to the WHO-ONT Global Observatory on Donation and Transplantation (published 2024): donation rate 1.60 pmp in 2017 falling to 0.48 pmp in 2021; waiting list at 31 December 2021 of 2,586 (renal 2,382, heart 108, liver 52, lung 44); 189 waiting-list deaths in 2021', 'Keyed answer and explanation checked against: SATS/SATCS, ''5-Year National Organ Transplant Activity, South Africa 2017-2021'', the joint report to the WHO-ONT Global Observatory on Donation and Transplantation (published 2024): donation rate 1.60 pmp in 2017 falling to 0.48 pmp in 2021; waiting list at 31 December 2021 of 2,586 (renal 2,382, heart 108, liver 52, lung 44); 189 waiting-list deaths in 2021'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-12', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'By the number of people helped, which part of donation is the largest?',
  'MEDICAL', 2, 'APPROVED',
  'Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body''s appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation', 'Keyed answer and explanation checked against: Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body''s appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-13', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'Which statement about outcomes after a heart transplant is most accurate?',
  'MEDICAL', 2, 'APPROVED',
  'One-year survival after cardiac transplantation approaches 90%, with 50% of recipients surviving beyond 11 years — carried over from the prior build''s sourced advanced-heart-failure material', 'Keyed answer and explanation checked against: One-year survival after cardiac transplantation approaches 90%, with 50% of recipients surviving beyond 11 years — carried over from the prior build''s sourced advanced-heart-failure material'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-14', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'How should an advocate use those figures?',
  'STATISTIC', 2, 'APPROVED',
  'Channel Africa (26 August 2026) and allAfrica (27 August 2026), both attributing the ~6,500 waiting and 317 transplants in 2024 figures to the Gauteng Department of Health without a linked primary document. Flagged as unverified in T01 research findings, Gap G5', 'Keyed answer and explanation checked against: Channel Africa (26 August 2026) and allAfrica (27 August 2026), both attributing the ~6,500 waiting and 317 transplants in 2024 figures to the Gauteng Department of Health without a linked primary document. Flagged as unverified in T01 research findings, Gap G5'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b1-15', 'Beginner · Stage 1, Why Donation Matters · Stage Quiz', 'Why do people need organ transplants?',
  'MEDICAL', 2, 'APPROVED',
  'Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body''s appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation', 'Keyed answer and explanation checked against: Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body''s appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-01', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'What actually answers the fear that doctors won''t try as hard to save a registered donor?',
  'MEDICAL', 2, 'APPROVED',
  'Regulation 9 (''Establishment of death'') of GN R180, Government Gazette 35099 of 2 March 2012, made under the National Health Act 61 of 2003: death shall be established by at least two medical practitioners, one of whom shall have been practising for at least five years after registration, and none of whom shall transplant tissue removed from that person or take part in such transplantation', 'Keyed answer and explanation checked against: Regulation 9 (''Establishment of death'') of GN R180, Government Gazette 35099 of 2 March 2012, made under the National Health Act 61 of 2003: death shall be established by at least two medical practitioners, one of whom shall have been practising for at least five years after registration, and none of whom shall transplant tissue removed from that person or take part in such transplantation'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-02', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'A family worries that donation will mean they cannot have an open-casket funeral. What is true?',
  'MEDICAL', 2, 'APPROVED',
  'Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body''s appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation', 'Keyed answer and explanation checked against: Organ Donor Foundation of South Africa, donor information and FAQ pages (odf.org.za/faqs/, /cornea-faqs/): one donor can save seven lives and improve up to fifty more through tissue donation; no strict upper age limit; recovery does not change the body''s appearance; donation is a voluntary gift and trading organs is illegal; the family is not billed for the donation'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-03', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'What is the most accurate way to tell a family that donation will not cost them anything?',
  'LEGAL', 2, 'APPROVED',
  'Checked to conclusion against the National Health Act 61 of 2003 (consolidated) and GN R180 of 2 March 2012: neither allocates the costs of donation. The Act''s money provisions are s 60 (prohibition on trading in tissue; reimbursement of a donor''s reasonable expenses). The bill-free position is the Organ Donor Foundation''s stated practice, quoted from its FAQs — the hospital or tissue bank carries the medical expenses of the donation from the moment consent is given', 'Keyed answer and explanation checked against: Checked to conclusion against the National Health Act 61 of 2003 (consolidated) and GN R180 of 2 March 2012: neither allocates the costs of donation. The Act''s money provisions are s 60 (prohibition on trading in tissue; reimbursement of a donor''s reasonable expenses). The bill-free position is the Organ Donor Foundation''s stated practice, quoted from its FAQs — the hospital or tissue bank carries the medical expenses of the donation from the moment consent is given'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-04', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'Someone asks whether organs in South Africa go to whoever can pay. What is true?',
  'LEGAL', 2, 'APPROVED',
  'National Health Act 61 of 2003 s 60 (prohibition on trading in human tissue; reward beyond reasonable costs is an offence) and s 61(1)-(3) (organs to be allocated in the prescribed manner; transplant into a non-citizen or non-permanent-resident requires the Minister''s written authorisation)', 'Keyed answer and explanation checked against: National Health Act 61 of 2003 s 60 (prohibition on trading in human tissue; reward beyond reasonable costs is an offence) and s 61(1)-(3) (organs to be allocated in the prescribed manner; transplant into a non-citizen or non-permanent-resident requires the Minister''s written authorisation)'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-05', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'Which response best reflects what this Stage teaches?',
  'MEDICAL', 2, 'APPROVED',
  'Organ Donor Foundation FAQ: most religions support organ and tissue donation as consistent with the preservation of life; the prior build''s sourced guidance that a faith representative or chaplain may be included in hospital, and that no one''s background should be assumed to rule donation out', 'Keyed answer and explanation checked against: Organ Donor Foundation FAQ: most religions support organ and tissue donation as consistent with the preservation of life; the prior build''s sourced guidance that a faith representative or chaplain may be included in hospital, and that no one''s background should be assumed to rule donation out'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-06', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'What is the best response?',
  'MEDICAL', 2, 'APPROVED',
  'Organ Donor Foundation FAQ: having a medical condition does not necessarily prevent a person from becoming an organ or tissue donor, and suitability is established at the time of death. SATCS Red File p.20: no age restriction for organ donation; the transplant coordinator and team discuss and document donor suitability; individual organs are assessed for transplantability in donors with comorbidities such as hypertension, diabetes and HIV. Red File pp.21, 41-42: most cancers do not exclude cornea donation (leukaemia and lymphoma do); cancer excludes skin, bone and heart-valve donation. 📌 UK: SaBTO, ''Transplantation of organs from deceased donors with cancer or a history of cancer'' v2.1 — cancers not in its tables are considered case by case. Checked in T47 research findings, section 4', 'Keyed answer and explanation checked against: Organ Donor Foundation FAQ: having a medical condition does not necessarily prevent a person from becoming an organ or tissue donor, and suitability is established at the time of death. SATCS Red File p.20: no age restriction for organ donation; the transplant coordinator and team discuss and document donor suitability; individual organs are assessed for transplantability in donors with comorbidities such as hypertension, diabetes and HIV. Red File pp.21, 41-42: most cancers do not exclude cornea donation (leukaemia and lymphoma do); cancer excludes skin, bone and heart-valve donation. 📌 UK: SaBTO, ''Transplantation of organs from deceased donors with cancer or a history of cancer'' v2.1 — cancers not in its tables are considered case by case. Checked in T47 research findings, section 4'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-07', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'Why is registering as a donor not enough on its own?',
  'MEDICAL', 2, 'APPROVED',
  'National Health Act s 62(1)-(2): relatives may donate only in the absence of a donation by the person, or of a contrary direction given while alive. The gap between that and hospital practice — families are approached in every case and a refusal is respected — is documented in Slabbert & Venter, ''Autonomy in organ donations v family consent: A South African legislative context'', De Jure, 2019', 'Keyed answer and explanation checked against: National Health Act s 62(1)-(2): relatives may donate only in the absence of a donation by the person, or of a contrary direction given while alive. The gap between that and hospital practice — families are approached in every case and a refusal is respected — is documented in Slabbert & Venter, ''Autonomy in organ donations v family consent: A South African legislative context'', De Jure, 2019'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-08', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'A family agreed to donation some years ago. Why might donation still not go ahead?',
  'MEDICAL', 2, 'APPROVED',
  'Gauteng Department of Health spokesperson Steve Mabona, quoted in Channel Africa (26 August 2026), on families who agreed and then declined at the time on cultural grounds; hospital practice of respecting a family refusal per Slabbert & Venter, De Jure, 2019', 'Keyed answer and explanation checked against: Gauteng Department of Health spokesperson Steve Mabona, quoted in Channel Africa (26 August 2026), on families who agreed and then declined at the time on cultural grounds; hospital practice of respecting a family refusal per Slabbert & Venter, De Jure, 2019'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-09', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'Someone says South Africa''s organ shortage isn''t really that serious. Which fact best answers them?',
  'STATISTIC', 2, 'APPROVED',
  'SATS/SATCS, ''5-Year National Organ Transplant Activity, South Africa 2017-2021'', the joint report to the WHO-ONT Global Observatory on Donation and Transplantation (published 2024): donation rate 1.60 pmp in 2017 falling to 0.48 pmp in 2021; waiting list at 31 December 2021 of 2,586 (renal 2,382, heart 108, liver 52, lung 44); 189 waiting-list deaths in 2021', 'Keyed answer and explanation checked against: SATS/SATCS, ''5-Year National Organ Transplant Activity, South Africa 2017-2021'', the joint report to the WHO-ONT Global Observatory on Donation and Transplantation (published 2024): donation rate 1.60 pmp in 2017 falling to 0.48 pmp in 2021; waiting list at 31 December 2021 of 2,586 (renal 2,382, heart 108, liver 52, lung 44); 189 waiting-list deaths in 2021'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-10', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'Which statement about tissue donation is true?',
  'MEDICAL', 2, 'APPROVED',
  'SATCS, ''The Organ and Tissue Donation Reference File'' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5', 'Keyed answer and explanation checked against: SATCS, ''The Organ and Tissue Donation Reference File'' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-11', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'What is the most accurate thing to tell them?',
  'MEDICAL', 2, 'APPROVED',
  'Organ Donor Foundation FAQ: having a medical condition does not necessarily prevent a person from becoming an organ or tissue donor, and suitability is established at the time of death. SATCS Red File p.20: no age restriction for organ donation; the transplant coordinator and team discuss and document donor suitability; individual organs are assessed for transplantability in donors with comorbidities such as hypertension, diabetes and HIV. Red File pp.21, 41-42: most cancers do not exclude cornea donation (leukaemia and lymphoma do); cancer excludes skin, bone and heart-valve donation. 📌 UK: SaBTO, ''Transplantation of organs from deceased donors with cancer or a history of cancer'' v2.1 — cancers not in its tables are considered case by case. Checked in T47 research findings, section 4', 'Keyed answer and explanation checked against: Organ Donor Foundation FAQ: having a medical condition does not necessarily prevent a person from becoming an organ or tissue donor, and suitability is established at the time of death. SATCS Red File p.20: no age restriction for organ donation; the transplant coordinator and team discuss and document donor suitability; individual organs are assessed for transplantability in donors with comorbidities such as hypertension, diabetes and HIV. Red File pp.21, 41-42: most cancers do not exclude cornea donation (leukaemia and lymphoma do); cancer excludes skin, bone and heart-valve donation. 📌 UK: SaBTO, ''Transplantation of organs from deceased donors with cancer or a history of cancer'' v2.1 — cancers not in its tables are considered case by case. Checked in T47 research findings, section 4'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-12', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'Which statement best describes the safety of donating a kidney while you are alive?',
  'MEDICAL', 2, 'APPROVED',
  'SA: Groote Schuur Hospital Kidney Paired Donation SOP (23 May 2025, via sats.org.za), Annexure G donor brochure — the operation is safe and low-risk but not risk-free; workup includes clinical suitability, blood group and tissue typing, social-work and where needed psychological assessment. Dayal C et al., PLoS ONE 2022;17(5):e0268183 — Charlotte Maxeke Johannesburg Academic Hospital 1981-2015, 298 of 1,208 potential donors (24.7%) donated. Botha J et al., S Afr J Surg 2019;57(3):11-16 — 65 living liver donors at Wits Donald Gordon, 0 deaths. National Health Act ss 58, 60(4). 📌 US: Massie AB et al., JAMA 2024;332(12):1015-1017 (0.9 per 10,000 perioperative mortality, 2013-2022); Segev DL et al., JAMA 2010 (3.1 per 10,000, 1994-2009); Lentine KL et al., CJASN 2019 (major complications <3%); Muzaale AD et al., JAMA 2014 (lifetime ESRD risk 90 per 10,000 donors vs 14 healthy non-donors vs 326 general population). Checked in T47 research findings, section 2 and section 3', 'Keyed answer and explanation checked against: SA: Groote Schuur Hospital Kidney Paired Donation SOP (23 May 2025, via sats.org.za), Annexure G donor brochure — the operation is safe and low-risk but not risk-free; workup includes clinical suitability, blood group and tissue typing, social-work and where needed psychological assessment. Dayal C et al., PLoS ONE 2022;17(5):e0268183 — Charlotte Maxeke Johannesburg Academic Hospital 1981-2015, 298 of 1,208 potential donors (24.7%) donated. Botha J et al., S Afr J Surg 2019;57(3):11-16 — 65 living liver donors at Wits Donald Gordon, 0 deaths. National Health Act ss 58, 60(4). 📌 US: Massie AB et al., JAMA 2024;332(12):1015-1017 (0.9 per 10,000 perioperative mortality, 2013-2022); Segev DL et al., JAMA 2010 (3.1 per 10,000, 1994-2009); Lentine KL et al., CJASN 2019 (major complications <3%); Muzaale AD et al., JAMA 2014 (lifetime ESRD risk 90 per 10,000 donors vs 14 healthy non-donors vs 326 general population). Checked in T47 research findings, section 2 and section 3'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-13', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'Why is it useful to understand why a myth persists, rather than only knowing that it is false?',
  'MEDICAL', 2, 'APPROVED',
  'Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2', 'Keyed answer and explanation checked against: Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-14', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'Which loss point on the way from a potential donor to a transplant is most directly changed by a family having talked about donation beforehand?',
  'MEDICAL', 2, 'APPROVED',
  'Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2', 'Keyed answer and explanation checked against: Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b2-15', 'Beginner · Stage 2, Busting the Myths · Stage Quiz', 'Where are most potential donations in South Africa lost?',
  'MEDICAL', 2, 'APPROVED',
  'Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2', 'Keyed answer and explanation checked against: Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-01', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'What are the two routes to deceased organ donation?',
  'MEDICAL', 2, 'APPROVED',
  'Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2', 'Keyed answer and explanation checked against: Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-02', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'What can a living donor donate?',
  'MEDICAL', 2, 'APPROVED',
  'Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2', 'Keyed answer and explanation checked against: Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-03', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'You have registered as an organ donor. What most improves the chance your wishes are followed?',
  'MEDICAL', 2, 'APPROVED',
  'National Health Act s 62(1)-(2): relatives may donate only in the absence of a donation by the person, or of a contrary direction given while alive. The gap between that and hospital practice — families are approached in every case and a refusal is respected — is documented in Slabbert & Venter, ''Autonomy in organ donations v family consent: A South African legislative context'', De Jure, 2019', 'Keyed answer and explanation checked against: National Health Act s 62(1)-(2): relatives may donate only in the absence of a donation by the person, or of a contrary direction given while alive. The gap between that and hospital practice — families are approached in every case and a refusal is respected — is documented in Slabbert & Venter, ''Autonomy in organ donations v family consent: A South African legislative context'', De Jure, 2019'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-04', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'What is the main practical difference between organ and tissue donation?',
  'MEDICAL', 2, 'APPROVED',
  'SATCS, ''The Organ and Tissue Donation Reference File'' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5', 'Keyed answer and explanation checked against: SATCS, ''The Organ and Tissue Donation Reference File'' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-05', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'Who may certify that a potential donor has died?',
  'LEGAL', 2, 'APPROVED',
  'Regulation 9 (''Establishment of death'') of GN R180, Government Gazette 35099 of 2 March 2012, made under the National Health Act 61 of 2003: death shall be established by at least two medical practitioners, one of whom shall have been practising for at least five years after registration, and none of whom shall transplant tissue removed from that person or take part in such transplantation', 'Keyed answer and explanation checked against: Regulation 9 (''Establishment of death'') of GN R180, Government Gazette 35099 of 2 March 2012, made under the National Health Act 61 of 2003: death shall be established by at least two medical practitioners, one of whom shall have been practising for at least five years after registration, and none of whom shall transplant tissue removed from that person or take part in such transplantation'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-06', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'Why are the doctors who certify death kept separate from the transplant team?',
  'MEDICAL', 2, 'APPROVED',
  'Regulation 9 (''Establishment of death'') of GN R180, Government Gazette 35099 of 2 March 2012, made under the National Health Act 61 of 2003: death shall be established by at least two medical practitioners, one of whom shall have been practising for at least five years after registration, and none of whom shall transplant tissue removed from that person or take part in such transplantation', 'Keyed answer and explanation checked against: Regulation 9 (''Establishment of death'') of GN R180, Government Gazette 35099 of 2 March 2012, made under the National Health Act 61 of 2003: death shall be established by at least two medical practitioners, one of whom shall have been practising for at least five years after registration, and none of whom shall transplant tissue removed from that person or take part in such transplantation'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-07', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'What does donation after brain death (DBD) describe?',
  'MEDICAL', 2, 'APPROVED',
  'Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2', 'Keyed answer and explanation checked against: Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-08', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'What does donation after circulatory death (DCD) describe?',
  'MEDICAL', 2, 'APPROVED',
  'Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2', 'Keyed answer and explanation checked against: Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-09', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'Which route to donation is the only one where the donor consents for themselves?',
  'LEGAL', 2, 'APPROVED',
  'National Health Act s 62(1)-(2): relatives may donate only in the absence of a donation by the person, or of a contrary direction given while alive. The gap between that and hospital practice — families are approached in every case and a refusal is respected — is documented in Slabbert & Venter, ''Autonomy in organ donations v family consent: A South African legislative context'', De Jure, 2019', 'Keyed answer and explanation checked against: National Health Act s 62(1)-(2): relatives may donate only in the absence of a donation by the person, or of a contrary direction given while alive. The gap between that and hospital practice — families are approached in every case and a refusal is respected — is documented in Slabbert & Venter, ''Autonomy in organ donations v family consent: A South African legislative context'', De Jure, 2019'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-10', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'What does an unnatural death add to the process?',
  'LEGAL', 2, 'APPROVED',
  'National Health Act s 66(1)(c) with s 3 of the Inquests Act 58 of 1959: an unnatural death must be referred for a medico-legal post-mortem, and recovery requires the forensic pathologist''s authorisation. Medico-legal post-mortems are performed by the Forensic Pathology Service under the Department of Health; the district surgeon''s office no longer performs this function', 'Keyed answer and explanation checked against: National Health Act s 66(1)(c) with s 3 of the Inquests Act 58 of 1959: an unnatural death must be referred for a medico-legal post-mortem, and recovery requires the forensic pathologist''s authorisation. Medico-legal post-mortems are performed by the Forensic Pathology Service under the Department of Health; the district surgeon''s office no longer performs this function'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-11', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'Who pays for recovering the organs and tissue from a donor?',
  'LEGAL', 2, 'APPROVED',
  'Checked to conclusion against the National Health Act 61 of 2003 (consolidated) and GN R180 of 2 March 2012: neither allocates the costs of donation. The Act''s money provisions are s 60 (prohibition on trading in tissue; reimbursement of a donor''s reasonable expenses). The bill-free position is the Organ Donor Foundation''s stated practice, quoted from its FAQs — the hospital or tissue bank carries the medical expenses of the donation from the moment consent is given', 'Keyed answer and explanation checked against: Checked to conclusion against the National Health Act 61 of 2003 (consolidated) and GN R180 of 2 March 2012: neither allocates the costs of donation. The Act''s money provisions are s 60 (prohibition on trading in tissue; reimbursement of a donor''s reasonable expenses). The bill-free position is the Organ Donor Foundation''s stated practice, quoted from its FAQs — the hospital or tissue bank carries the medical expenses of the donation from the moment consent is given'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-12', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'Can a family be paid for donating a relative''s organs in South Africa?',
  'LEGAL', 2, 'APPROVED',
  'Checked to conclusion against the National Health Act 61 of 2003 (consolidated) and GN R180 of 2 March 2012: neither allocates the costs of donation. The Act''s money provisions are s 60 (prohibition on trading in tissue; reimbursement of a donor''s reasonable expenses). The bill-free position is the Organ Donor Foundation''s stated practice, quoted from its FAQs — the hospital or tissue bank carries the medical expenses of the donation from the moment consent is given', 'Keyed answer and explanation checked against: Checked to conclusion against the National Health Act 61 of 2003 (consolidated) and GN R180 of 2 March 2012: neither allocates the costs of donation. The Act''s money provisions are s 60 (prohibition on trading in tissue; reimbursement of a donor''s reasonable expenses). The bill-free position is the Organ Donor Foundation''s stated practice, quoted from its FAQs — the hospital or tissue bank carries the medical expenses of the donation from the moment consent is given'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-13', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'When can tissue donation take place?',
  'MEDICAL', 2, 'APPROVED',
  'SATCS, ''The Organ and Tissue Donation Reference File'' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5', 'Keyed answer and explanation checked against: SATCS, ''The Organ and Tissue Donation Reference File'' (the Red File), pp.15-16, 21, 41-43: tissue donation can take place irrespective of the manner of death; the body is restored with prostheses and an open-casket funeral is possible after tissue recovery; cataracts and poor eyesight do not prevent cornea donation; per-tissue age windows and exclusions. Organ Donor Foundation FAQ and cornea FAQ: tissue retrieval can take place several hours and even days after death; corneas can be used even if the donor wore glasses. Checked in T47 research findings, section 1 and section 5'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-14', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'Why can solid organs only be recovered in a clinical setting?',
  'MEDICAL', 2, 'APPROVED',
  'Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2', 'Keyed answer and explanation checked against: Donation pathway and its loss points per de Jager et al., SAMJ 2019;109(9):626-631; consent from next of kin is always required per Save7, ''Transplant Alchemy 101 - Study Guide'', Objective 2'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

insert into learn_review_items (
  entity_type, entity_ref, location, claim, category, severity, status, source_hint, notes
) values (
  'QUESTION', 'question:sq-b3-15', 'Beginner · Stage 3, How Donation Actually Works · Stage Quiz', 'Older donation material refers to the ''district surgeon'' or ''state pathologist''. Why should an advocate not use those terms?',
  'LEGAL', 2, 'APPROVED',
  'National Health Act s 66(1)(c) with s 3 of the Inquests Act 58 of 1959: an unnatural death must be referred for a medico-legal post-mortem, and recovery requires the forensic pathologist''s authorisation. Medico-legal post-mortems are performed by the Forensic Pathology Service under the Department of Health; the district surgeon''s office no longer performs this function', 'Keyed answer and explanation checked against: National Health Act s 66(1)(c) with s 3 of the Inquests Act 58 of 1959: an unnatural death must be referred for a medico-legal post-mortem, and recovery requires the forensic pathologist''s authorisation. Medico-legal post-mortems are performed by the Forensic Pathology Service under the Department of Health; the district surgeon''s office no longer performs this function'
) on conflict (entity_type, entity_ref, claim) do update set
  location = excluded.location, category = excluded.category,
  severity = excluded.severity, source_hint = excluded.source_hint,
  notes = excluded.notes,
  -- Only ever promotes an item that is still outstanding. A decision a human has
  -- already recorded -- approved, or rejected -- survives every regeneration,
  -- because silently reverting somebody's sign-off is worse than leaving a stale
  -- row behind.
  status = case
    when learn_review_items.status = 'NEEDS_VERIFICATION' then excluded.status
    else learn_review_items.status
  end;

do $$
declare n int;
begin
  select count(*) into n from learn_levels;
  if n <> 3 then raise exception 'expected 3 levels, found %', n; end if;

  /* Exactly the finished Stages, and nothing else. A module left over from an
     earlier outline would still be navigable, and still gate its Level's
     certificate, so its presence is a failure rather than a curiosity. */
  select count(*) into n from learn_modules;
  if n <> 3 then raise exception 'expected 3 Stages, found %', n; end if;
  select count(*) into n from learn_modules where slug not in ('why-donation-matters', 'busting-the-myths', 'how-donation-works');
  if n <> 0 then raise exception '% module(s) are not finished Stages', n; end if;

  select count(*) into n from learn_lessons;
  if n <> 21 then raise exception 'expected 21 lessons, found %', n; end if;

  /* No drafting brief and no stub text reaches a learner. markdown.ts strips
     comments before emitting; this is the check that it did. */
  select count(*) into n from learn_lessons
   where strpos(body_markdown, '<!--') > 0 or strpos(body_markdown, '_Not yet written._') > 0;
  if n <> 0 then raise exception '% lesson(s) carry a drafting brief or stub text', n; end if;

  /* Fifteen per Stage, per the Blueprint — and no POST item outside a finished
     Stage, since a level-keyed POST attempt marks every POST row in its level. */
  select count(*) into n from learn_questions where scope = 'POST';
  if n <> 45 then raise exception 'expected 45 Stage Quiz questions, found %', n; end if;
  select count(*) into n from (
    select module_slug from learn_questions where scope = 'POST'
     group by module_slug having count(*) <> 15 or module_slug is null
  ) bad;
  if n <> 0 then raise exception '% Stage Quiz bank(s) do not hold exactly 15 questions', n; end if;

  /* Every question must have exactly one right answer, except a MULTI, which has
     more than one. A question with none is unanswerable and a SINGLE with two is
     unmarkable — and learn_submit_attempt() compares sets, so it would simply mark
     everyone wrong rather than fail loudly. */
  select count(*) into n
    from learn_questions q
    left join learn_choices c on c.question_id = q.id and c.is_correct
   where q.kind <> 'MULTI'
   group by q.id having count(c.id) <> 1
   limit 1;
  if n is not null then raise exception 'a non-MULTI question does not have exactly one correct answer'; end if;
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- End of generated content. The reset's own probe follows.
-- ════════════════════════════════════════════════════════════════════════════

-- ── the reset's probe ─────────────────────────────────────────────────────────
-- The generator's probe above checks what was loaded. This one checks what the
-- sweep promised: that it removed the old outline completely, and touched nothing
-- it named as out of bounds.
do $$
declare
  n    int;
  kept record;
begin
  for kept in select * from _reset_untouched loop
    select count(*) into n from learn_questions where scope::text = kept.scope;
    if n <> kept.n then
      raise exception '% rows changed from % to % — the sweep touched a scope it promised to leave alone',
        kept.scope, kept.n, n;
    end if;
  end loop;

  select count(*) into n from learn_questions where scope = 'CHECK';
  if n <> 0 then raise exception '% CHECK question(s) of the old outline survived the sweep', n; end if;

  select count(*) into n from learn_resources where module_slug is not null
     and module_slug not in (select slug from learn_modules);
  if n <> 0 then raise exception '% reading-list entr(ies) keyed to a module that does not exist', n; end if;

  select count(*) into n from learn_review_items where entity_type in ('LESSON', 'MODULE');
  if n <> 0 then raise exception '% review row(s) still describe lessons or modules of the old outline', n; end if;

  select count(*) into n from learn_levels
   where pass_mark_pct <> 80 or title <> certificate_title;
  if n <> 0 then raise exception '% level(s) not at the #33 values (pass mark 80, title = certificate_title)', n; end if;

  /* The guard's premise, re-checked at the end of the same transaction. */
  select count(*) into n from learn_answers;
  if n <> 0 then raise exception 'learn_answers is no longer empty'; end if;
end $$;

select verify_learn_isolation();

commit;
