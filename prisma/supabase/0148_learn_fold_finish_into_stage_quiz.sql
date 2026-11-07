-- Learn: fold the Finish step into the Stage Quiz step.
--
-- Every Stage loses its last step, the `complete` lesson (kind COMPLETE). The Stage
-- Quiz is now the last step: under the quiz the app shows what Finish showed (the
-- question the Stage opened with, and what finishing records), then the Stage's
-- sources, which the next content migration moves from the `complete` lesson's body
-- to the `check` lesson's. A Stage is now: Why this matters, Learn, Key takeaways,
-- Stage Quiz.
--
-- The content emitter never deletes, by design, so the 11 rows it no longer writes
-- are removed here. Nothing holds a foreign key to a lesson (0094), and no SQL
-- function reads this kind or slug. Lesson views already recorded in learn_events
-- keep the slug as plain history. A learner whose resume point is `complete` (five
-- on 2026-11-07) resumes at the Stage Quiz: the app maps that slug to the quiz step.
--
-- ORDER MATTERS: this must run before the content migration that follows it, whose
-- probe expects 45 lessons, so the wrong order fails loudly rather than leaving the
-- rows behind. The app already ignores COMPLETE lessons, so it may deploy before or
-- after this runs.
--
-- Safe to run twice: the second run deletes nothing and the probe still passes.

delete from learn_lessons
where slug = 'complete' and kind = 'COMPLETE';

do $$
declare
  n int;
begin
  select count(*) into n from learn_lessons
  where kind = 'COMPLETE' or slug = 'complete';
  if n <> 0 then
    raise exception 'probe: % Finish lessons remain', n;
  end if;

  /* Every Stage still has its Stage Quiz, now its last step. */
  select count(*) into n from learn_lessons where kind = 'CHECK';
  if n <> 11 then raise exception 'probe: expected 11 CHECK lessons, found %', n; end if;

  select count(*) into n
  from learn_lessons c
  where c.kind = 'CHECK'
    and exists (
      select 1 from learn_lessons l
      where l.module_slug = c.module_slug and l.position > c.position
    );
  if n <> 0 then raise exception 'probe: % Stage Quiz step(s) are not their Stage''s last', n; end if;
end
$$;

select verify_learn_isolation();
