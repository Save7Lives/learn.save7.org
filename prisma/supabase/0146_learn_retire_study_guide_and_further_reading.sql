-- Learn: retire the Study guide and Further reading steps.
--
-- Every Stage loses two steps. What only the study guide said moved into the
-- Stage's Learn lesson, and the sources moved to the Stage's Finish step (its
-- `sources.md`, carried in the `complete` lesson's body by the next content
-- migration). A Stage is now: Why this matters, Learn, Key takeaways, Stage Quiz,
-- Finish.
--
-- The content emitter never deletes, by design, so the 22 rows it no longer writes
-- are removed here. Nothing holds a foreign key to a lesson (0094), and no SQL
-- function reads these kinds. Lesson views already recorded in learn_events keep
-- the slug as plain history. A learner whose resume point was one of these steps
-- (three on 2026-11-07) resumes at the start of the Stage, which is what the app
-- does with a lesson slug it cannot find.
--
-- ORDER MATTERS: this must run before the content migration that follows it. That
-- one moves `complete` to position 4 (5 in How donation happens), the position the
-- study guide holds until this runs, and learn_lessons is unique on
-- (module_slug, position).
--
-- Safe to run twice: the second run deletes nothing and the probe still passes.

delete from learn_lessons
where (slug = 'study-guide' and kind = 'STUDY_GUIDE')
   or (slug = 'further-reading' and kind = 'FURTHER_READING');

do $$
declare
  n int;
begin
  select count(*) into n from learn_lessons
  where kind in ('STUDY_GUIDE', 'FURTHER_READING')
     or slug in ('study-guide', 'further-reading');
  if n <> 0 then
    raise exception 'probe: % study guide or further reading lessons remain', n;
  end if;

  /* Every Stage still has its Stage Quiz and its Finish step. */
  select count(*) into n from learn_lessons where kind = 'CHECK';
  if n <> 11 then raise exception 'probe: expected 11 CHECK lessons, found %', n; end if;
  select count(*) into n from learn_lessons where kind = 'COMPLETE';
  if n <> 11 then raise exception 'probe: expected 11 COMPLETE lessons, found %', n; end if;
end
$$;

select verify_learn_isolation();
