-- The Progress Record is read through one SQL module (learn.save7.org, Progress Record read module)
--
-- DRAFT. Not applied, not pushed, and not in any app repo. Named 0138 because 0137 is
-- the head in save7-os today; re-check the head and renumber just before it is copied in.
-- Terms are CONTEXT.md's (Progress Record, Read Mark, Baseline Sitting, Level, Stage,
-- Certificate); the decision is docs/adr/0001-sql-owns-the-progress-record-read.md.
--
-- ── WHAT WAS WRONG ───────────────────────────────────────────────────────────
-- "A Stage is complete when its Stage Quiz is first passed, and a Level when every
-- Stage Quiz in it is" is one predicate in SQL (`learn_level_earned`, 0113), and three
-- callers re-derived it from raw rows: the Student dashboard (`getPathwayForUser`,
-- `getModuleStatuses`, `getStageQuizStates`), the Admin (`mapLearner`, which embeds
-- eight tables, re-filters POST and re-sorts `attempt_no`), and the volunteer portal,
-- which got it wrong from the retired read flag.
--
-- ── WHAT THIS ADDS ───────────────────────────────────────────────────────────
-- Two functions a signed-in caller can run, both returning the same record shape:
--
--   learn_progress_record(p_learner uuid default null) -> jsonb
--       One Student's Progress Record. With no argument it is the caller's own. A
--       Student who names someone else, or a caller with no Student row, gets null
--       (nothing visible, the way row level security answers). An Admin may name
--       any Student.
--
--   learn_progress_records(p_limit int default null, p_offset int default 0)
--       -> table (learner_id uuid, record jsonb)
--       An Admin gets every Student, newest sign-up first, paged. A Student gets
--       their own single row. Anyone else gets none.
--
-- and one internal builder, `learn_progress_records_of`, that no client can call. It
-- takes the learner as an argument, which is exactly why it is not callable: the two
-- public functions decide who the caller may see.
--
-- ── THE RECORD ───────────────────────────────────────────────────────────────
--   learner      { id, name, signed_up_at, last_active_at }
--                last_active_at is the newest of the sign-up, `last_seen_at` and the
--                newest dashboard event; there is no column of its own for it.
--   baseline     { sittings: [ { sitting_no, submitted_at, level_scores, total_score,
--                                total_max } ],   oldest first, never answers
--                  sitting_due: int | null }      the Sitting owed now, see below
--   stages       [ { stage_slug, level_slug, position, is_mandatory,
--                    read, read_at, started, last_lesson_slug,   the Read Mark
--                    complete, completed_at,                     the Stage Quiz first passed
--                    quiz { attempts, latest { attempt_id, attempt_no, score_raw,
--                           score_max, score_pct, passed, submitted_at } | null,
--                           open_attempt_id } } ]                every Stage, Course order
--   levels       [ { level_slug, position, complete, completed_at, stages_total,
--                    stages_passed, stages_read, percent_complete, status,
--                    resume_stage_slug, certificate { code, issued_at } | null } ]
--   certificates [ { code, level_slug, issued_name, award_title, score_pct, issued_at,
--                    revoked_at } ]                    every one, revoked included
--
-- Reads of the rules, in the module's own words:
--   * `complete` on a Stage is the Stage Quiz first passed (`learn_module_progress.
--     quiz_passed_at`, which `learn_mark_attempt` sets once and never clears). `read` is
--     the Read Mark: the stored status COMPLETE, reported as "read" and never as
--     complete, and nothing here reads it to decide a Stage, a Level or a Certificate.
--     Renaming the stored value is a separate, later decision (the ADR says so).
--   * `complete` on a Level is `learn_level_earned()` itself, not a copy of it, so the
--     record and the Certificate gate cannot disagree. `completed_at` is the stamp
--     `learn_refresh_progress()` keeps in `learn_level_progress`, shown only while the
--     Level is earned.
--   * `quiz.latest` and `quiz.attempts` count submitted Stage Quiz (POST) attempts only.
--     Every attempt stays in `learn_attempts`; the record shows the latest.
--   * `sitting_due` is the Baseline Sitting owed: 1 until it is sat; then n + 1 if any
--     earned Level was completed after the last Sitting (once, however many Levels, so
--     two Levels finished between Sittings owe one); null at four. It moves out of
--     `dueSitting()` in TypeScript so the edge case is testable here. A later Sitting is
--     offered, never required, and nothing downstream reads it.
--   * Improvement and the Growth Indicators are NOT here. They are computed from this
--     record at read time, in TypeScript.
--
-- ── WHAT IT DOES NOT TOUCH ───────────────────────────────────────────────────
-- No table, column, view or policy changes. `learn_my_stage_quizzes`, `learn_my_progress`
-- and `vol_my_course_learning` stay as they are; the app stops reading the first, and
-- dropping it is a separate clean-up once nothing does. No email, date of birth or raw
-- answer is in the record (CONTEXT.md: a Sitting is stored without its answers).
--
-- Safe to run twice: every statement is `create or replace` or an idempotent grant, and
-- the probe at the end rolls everything it makes back.

begin;

-- ── the internal builder ─────────────────────────────────────────────────────
-- p_learner null means every Student. p_limit / p_offset page them, newest sign-up
-- first (ties broken on id so the pages are stable).

create or replace function learn_progress_records_of(
  p_learner uuid,
  p_limit   int default null,
  p_offset  int default 0
)
returns table (learner_id uuid, record jsonb)
language sql stable security definer set search_path = public
as $$
  select c.id,
    jsonb_build_object(

      'learner', jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'signed_up_at', c.created_at,
        /* greatest() ignores nulls */
        'last_active_at', greatest(
           c.created_at, c.last_seen_at,
           (select max(e.created_at) from learn_events e where e.learner_id = c.id))
      ),

      'baseline', jsonb_build_object(
        'sittings', coalesce((
          select jsonb_agg(jsonb_build_object(
                   'sitting_no', s.sitting_no,
                   'submitted_at', s.submitted_at,
                   'level_scores', s.level_scores,
                   'total_score', s.total_score,
                   'total_max', s.total_max) order by s.sitting_no)
            from learn_baseline_sittings s
           where s.learner_id = c.id), '[]'::jsonb),
        'sitting_due', (
          select case
                   when x.n >= 4 then null
                   when x.n = 0 then 1
                   when exists (
                     select 1
                       from learn_levels lv
                       join learn_level_progress lp
                         on lp.learner_id = c.id and lp.level_slug = lv.slug
                      where learn_level_earned(c.id, lv.slug)
                        and lp.completed_at > x.last_at) then x.n + 1
                 end
            from (select count(*)::int as n, max(b.submitted_at) as last_at
                    from learn_baseline_sittings b
                   where b.learner_id = c.id) x)
      ),

      'stages', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'stage_slug', m.slug,
                 'level_slug', m.level_slug,
                 'position', m.position,
                 'is_mandatory', m.is_mandatory,
                 /* the Read Mark: reported as read, never as complete */
                 'read', coalesce(p.status = 'COMPLETE', false),
                 'read_at', case when p.status = 'COMPLETE' then p.completed_at end,
                 'started', (p.learner_id is not null or a.n > 0),
                 'last_lesson_slug', p.last_lesson_slug,
                 /* complete: the Stage Quiz first passed, never cleared */
                 'complete', p.quiz_passed_at is not null,
                 'completed_at', p.quiz_passed_at,
                 'quiz', jsonb_build_object(
                   'attempts', a.n,
                   'latest', case when l.id is null then null else jsonb_build_object(
                       'attempt_id', l.id,
                       'attempt_no', l.attempt_no,
                       'score_raw', l.score_raw,
                       'score_max', l.score_max,
                       'score_pct', l.score_pct,
                       'passed', l.passed,
                       'submitted_at', l.submitted_at) end,
                   'open_attempt_id', o.id)
               ) order by lv.position, m.position)
          from learn_modules m
          join learn_levels lv on lv.slug = m.level_slug
          left join learn_module_progress p
                 on p.learner_id = c.id and p.module_slug = m.slug
          cross join lateral (
            select count(*)::int as n
              from learn_attempts t
             where t.learner_id = c.id and t.module_slug = m.slug
               and t.scope = 'POST' and t.submitted_at is not null) a
          left join lateral (
            select t.id, t.attempt_no, t.score_raw, t.score_max, t.score_pct,
                   t.passed, t.submitted_at
              from learn_attempts t
             where t.learner_id = c.id and t.module_slug = m.slug
               and t.scope = 'POST' and t.submitted_at is not null
             order by t.attempt_no desc
             limit 1) l on true
          left join lateral (
            select t.id
              from learn_attempts t
             where t.learner_id = c.id and t.module_slug = m.slug
               and t.scope = 'POST' and t.submitted_at is null
             order by t.attempt_no desc
             limit 1) o on true
        ), '[]'::jsonb),

      'levels', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'level_slug', lv.slug,
                 'position', lv.position,
                 /* the one predicate, not a copy of it */
                 'complete', t.earned,
                 'completed_at', case when t.earned then lp.completed_at end,
                 'stages_total', t.total,
                 'stages_passed', t.passed,
                 'stages_read', t.read,
                 'percent_complete',
                   case when t.total > 0 then round(100.0 * t.passed / t.total)::int else 0 end,
                 'status', case
                             when t.earned then 'COMPLETE'
                             when t.started or lp.learner_id is not null then 'IN_PROGRESS'
                             else 'NOT_STARTED' end,
                 'resume_stage_slug', t.resume,
                 'certificate', (
                   select jsonb_build_object('code', ce.code, 'issued_at', ce.issued_at)
                     from learn_certificates ce
                    where ce.learner_id = c.id and ce.level_slug = lv.slug
                      and ce.revoked_at is null
                    order by ce.issued_at desc
                    limit 1)
               ) order by lv.position)
          from learn_levels lv
          left join learn_level_progress lp
                 on lp.learner_id = c.id and lp.level_slug = lv.slug
          cross join lateral (
            select learn_level_earned(c.id, lv.slug) as earned,
                   count(*) filter (where m.is_mandatory)::int as total,
                   count(*) filter (where m.is_mandatory
                                      and q.quiz_passed_at is not null)::int as passed,
                   count(*) filter (where m.is_mandatory
                                      and q.status = 'COMPLETE')::int as read,
                   coalesce(bool_or(q.learner_id is not null
                                    or exists (select 1 from learn_attempts t
                                                where t.learner_id = c.id
                                                  and t.module_slug = m.slug
                                                  and t.scope = 'POST'
                                                  and t.submitted_at is not null)), false)
                     as started,
                   /* resume at the first mandatory Stage not yet passed; when all are,
                      stay on the last */
                   coalesce(
                     (select m2.slug
                        from learn_modules m2
                        left join learn_module_progress q2
                               on q2.learner_id = c.id and q2.module_slug = m2.slug
                       where m2.level_slug = lv.slug and m2.is_mandatory
                         and q2.quiz_passed_at is null
                       order by m2.position limit 1),
                     (select m3.slug from learn_modules m3
                       where m3.level_slug = lv.slug and m3.is_mandatory
                       order by m3.position desc limit 1)) as resume
              from learn_modules m
              left join learn_module_progress q
                     on q.learner_id = c.id and q.module_slug = m.slug
             where m.level_slug = lv.slug) t
        ), '[]'::jsonb),

      'certificates', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'code', ce.code,
                 'level_slug', ce.level_slug,
                 'issued_name', ce.issued_name,
                 'award_title', ce.award_title,
                 'score_pct', ce.score_pct,
                 'issued_at', ce.issued_at,
                 'revoked_at', ce.revoked_at) order by ce.issued_at desc)
          from learn_certificates ce
         where ce.learner_id = c.id), '[]'::jsonb)
    )
  from (select l0.*
          from learners l0
         where p_learner is null or l0.id = p_learner
         order by l0.created_at desc, l0.id
         limit p_limit offset coalesce(p_offset, 0)) c
  order by c.created_at desc, c.id
$$;

-- ── the two functions a client can run ───────────────────────────────────────

create or replace function learn_progress_record(p_learner uuid default null)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_me     uuid := app_learner_id();
  v_target uuid;
begin
  v_target := coalesce(p_learner, v_me);
  if v_target is null then return null; end if;
  /* Someone else's record is visible to an Admin and to nobody else, and a refusal
     looks like an absence, as row level security's does. */
  if v_target is distinct from v_me and not learn_is_admin() then return null; end if;
  return (select r.record from learn_progress_records_of(v_target) r);
end;
$$;

create or replace function learn_progress_records(p_limit int default null, p_offset int default 0)
returns table (learner_id uuid, record jsonb)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_me uuid := app_learner_id();
begin
  if learn_is_admin() then
    return query select r.learner_id, r.record
                   from learn_progress_records_of(null, p_limit, p_offset) r;
  elsif v_me is not null then
    return query select r.learner_id, r.record
                   from learn_progress_records_of(v_me) r;
  end if;
end;
$$;

comment on function learn_progress_record(uuid) is
  'One Student''s Progress Record as jsonb: Baseline Sittings, Stage Quiz state and the Read Mark per Stage, Stage and Level completion with timestamps, Certificates. A Student reads their own (no argument); an Admin may name any Student; anyone else gets null. See 0138 for the shape.';
comment on function learn_progress_records(int, int) is
  'Every Student''s Progress Record for an Admin (newest sign-up first, paged); the caller''s own single record for a Student; nothing for anyone else.';

revoke all on function learn_progress_records_of(uuid, int, int) from public, anon, authenticated;
revoke all on function learn_progress_record(uuid)               from public, anon;
revoke all on function learn_progress_records(int, int)          from public, anon;
grant execute on function learn_progress_record(uuid)            to authenticated;
grant execute on function learn_progress_records(int, int)       to authenticated;

-- ── prove the rules, by trying to break them ─────────────────────────────────
-- Run for real against the live banks, as the `authenticated` role the app uses, for
-- Students this block creates and rolls back (auth.users included). Student quizzes are
-- sat through the internal marking functions, as 0113's probe does, because the public
-- wrappers need a consent and a sign-in this block should not have to fake.

do $$
declare
  me       text := current_user;   -- the role to come back to: `reset role` would go to the login role
  s_a      uuid := gen_random_uuid();
  s_b      uuid := gen_random_uuid();
  s_adm    uuid := gen_random_uuid();
  s_out    uuid := gen_random_uuid();   -- signed in, not a Student, not an Admin
  l_a      uuid;
  l_b      uuid;
  l_adm    uuid;
  v_levels text[];
  v_l1     text;
  v_l2     text;
  v_l3     text;
  v_stages1 text[];
  v_stages2 text[];
  v_s1     text;
  v_att    learn_attempts;
  v_err    jsonb;
  v_rec    jsonb;
  v_rec_a  jsonb;
  v_first  timestamptz;
  v_all    int;
  n        int;
  ok       boolean;
  st       text;
  fn       text;
begin
  /* Structure: who may call what. */
  if has_function_privilege('anon', 'learn_progress_record(uuid)', 'execute')
     or has_function_privilege('anon', 'learn_progress_records(int,int)', 'execute') then
    raise exception 'anon can execute a Progress Record function';
  end if;
  if not has_function_privilege('authenticated', 'learn_progress_record(uuid)', 'execute')
     or not has_function_privilege('authenticated', 'learn_progress_records(int,int)', 'execute') then
    raise exception 'authenticated cannot execute a Progress Record function';
  end if;
  if has_function_privilege('anon', 'learn_progress_records_of(uuid,int,int)', 'execute')
     or has_function_privilege('authenticated', 'learn_progress_records_of(uuid,int,int)', 'execute') then
    raise exception 'the internal Progress Record builder is callable by a client; it trusts its learner argument';
  end if;
  foreach fn in array array['learn_progress_record', 'learn_progress_records'] loop
    if not exists (select 1 from pg_proc where proname = fn and prosecdef) then
      raise exception '% is not security definer', fn;
    end if;
  end loop;

  /* Two Levels with a full set of banks to sit, in Course order. Data, not names: a
     probe that silently skips is not a probe. */
  select array_agg(x.slug order by x.position) into v_levels
    from (select l.slug, l.position
            from learn_levels l
            join learn_modules m on m.level_slug = l.slug and m.is_mandatory
           group by l.slug, l.position
          having bool_and((select count(*) from learn_questions q
                            where q.scope = 'POST' and q.module_slug = m.slug) >= 10)) x;
  if coalesce(cardinality(v_levels), 0) < 2 then
    raise exception 'fewer than two Levels have Stage Quiz banks of ten or more, so two completed Levels cannot be tested';
  end if;
  v_l1 := v_levels[1];
  v_l2 := v_levels[2];
  select slug into v_l3
    from learn_levels where slug <> all (array[v_l1, v_l2]) order by position limit 1;
  select array_agg(m.slug order by m.position) into v_stages1
    from learn_modules m where m.level_slug = v_l1 and m.is_mandatory;
  select array_agg(m.slug order by m.position) into v_stages2
    from learn_modules m where m.level_slug = v_l2 and m.is_mandatory;
  v_s1 := v_stages1[1];

  /* Everything below rolls back. */
  begin
    insert into learners (email, first_name, name, active, date_of_birth, popia_consent_at)
         values (s_a::text   || '@save7.org', 'Probe', 'Probe Student A', true, date '1990-01-01', now()) returning id into l_a;
    insert into learners (email, first_name, name, active, date_of_birth, popia_consent_at)
         values (s_b::text   || '@save7.org', 'Probe', 'Probe Student B', true, date '1990-01-01', now()) returning id into l_b;
    insert into learners (email, first_name, name, active, date_of_birth, popia_consent_at)
         values (s_adm::text || '@save7.org', 'Probe', 'Probe Admin',     true, date '1990-01-01', now()) returning id into l_adm;
    insert into auth.users (id, email) values (s_a,   s_a::text   || '@save7.org') on conflict (id) do nothing;
    insert into auth.users (id, email) values (s_b,   s_b::text   || '@save7.org') on conflict (id) do nothing;
    insert into auth.users (id, email) values (s_adm, s_adm::text || '@save7.org') on conflict (id) do nothing;
    insert into auth.users (id, email) values (s_out, s_out::text || '@save7.org') on conflict (id) do nothing;
    update learners set user_id = s_a   where id = l_a;
    update learners set user_id = s_b   where id = l_b;
    update learners set user_id = s_adm where id = l_adm;
    insert into learn_admins (user_id, role) values (s_adm, 'admin') on conflict (user_id) do nothing;
    select count(*) into v_all from learners;

    -- ── Student A, before anything: an empty record of the right shape ──
    perform set_config('request.jwt.claims', json_build_object('sub', s_a, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', s_a::text, true);
    set local role authenticated;
    v_rec := learn_progress_record();
    execute format('set local role %I', me);
    if v_rec is null then raise exception 'a Student cannot read their own record'; end if;
    if v_rec #>> '{learner,id}' <> l_a::text or v_rec #>> '{learner,name}' <> 'Probe Student A' then
      raise exception 'the record is not the caller''s';
    end if;
    if jsonb_array_length(v_rec #> '{baseline,sittings}') <> 0 or (v_rec #>> '{baseline,sitting_due}') <> '1' then
      raise exception 'a new Student should owe Sitting 1 and hold none, got %', v_rec -> 'baseline';
    end if;
    if jsonb_array_length(v_rec -> 'levels') <> (select count(*) from learn_levels)
       or jsonb_array_length(v_rec -> 'stages') <> (select count(*) from learn_modules) then
      raise exception 'the record does not list every Level and every Stage';
    end if;
    if exists (select 1 from jsonb_array_elements(v_rec -> 'levels') l
                where l ->> 'status' <> 'NOT_STARTED' or (l ->> 'complete')::boolean) then
      raise exception 'a new Student has a Level started or complete';
    end if;
    if jsonb_array_length(v_rec -> 'certificates') <> 0 then raise exception 'a new Student holds a Certificate'; end if;
    /* No answers, ever: a Sitting is its scores, a Stage Quiz is its score. */
    if v_rec::text ~ '"(chosen|is_correct|answers|free_text|email|date_of_birth)"' then
      raise exception 'the record carries an answer, an email or a date of birth';
    end if;

    -- ── a Read Mark with no pass reads as read, not complete ──
    perform set_config('request.jwt.claims', json_build_object('sub', s_a, 'role', 'authenticated')::text, true);
    set local role authenticated;
    perform learn_complete_module(v_s1);       -- the real Read Mark write, as the Student
    v_rec := learn_progress_record();
    execute format('set local role %I', me);
    select s into v_err from jsonb_array_elements(v_rec -> 'stages') s where s ->> 'stage_slug' = v_s1;
    if not (v_err ->> 'read')::boolean or v_err ->> 'read_at' is null then
      raise exception 'a Read Mark does not read as read: %', v_err;
    end if;
    if (v_err ->> 'complete')::boolean or v_err ->> 'completed_at' is not null then
      raise exception 'a Read Mark reads as complete: %', v_err;
    end if;
    select l into v_err from jsonb_array_elements(v_rec -> 'levels') l where l ->> 'level_slug' = v_l1;
    if (v_err ->> 'complete')::boolean or (v_err ->> 'stages_passed')::int <> 0
       or (v_err ->> 'stages_read')::int <> 1 or v_err ->> 'status' <> 'IN_PROGRESS' then
      raise exception 'one Read Mark moved the Level: %', v_err;
    end if;
    if v_err ->> 'resume_stage_slug' <> v_s1 then
      raise exception 'resume is % not the first unpassed Stage %', v_err ->> 'resume_stage_slug', v_s1;
    end if;

    -- ── a fail, a pass, then a later fail: completion is never cleared ──
    v_att := learn_stage_quiz_attempt(l_a, v_s1);
    v_err := learn_mark_attempt(v_att.id, (
      select jsonb_object_agg(q.id::text, jsonb_build_object('chosen', jsonb_build_array(
               (select c.option_key from learn_choices c
                 where c.question_id = q.id and c.is_correct = (q.ord <= 3)
                 order by c.position limit 1))))
        from (select x as id, o as ord from unnest(v_att.question_ids) with ordinality u(x, o)) q));
    if v_err is not null then raise exception 'marking refused a valid paper: %', v_err; end if;

    v_rec := (select r.record from learn_progress_records_of(l_a) r);
    select s into v_err from jsonb_array_elements(v_rec -> 'stages') s where s ->> 'stage_slug' = v_s1;
    if (v_err ->> 'complete')::boolean then raise exception '3 of 5 reads as complete'; end if;
    if v_err #>> '{quiz,latest,passed}' <> 'false' or (v_err #>> '{quiz,attempts}')::int <> 1 then
      raise exception 'a failed first attempt is not the latest: %', v_err -> 'quiz';
    end if;

    v_att := learn_stage_quiz_attempt(l_a, v_s1);
    v_err := learn_mark_attempt(v_att.id, (
      select jsonb_object_agg(q.id::text, jsonb_build_object('chosen', jsonb_build_array(
               (select c.option_key from learn_choices c
                 where c.question_id = q.id and c.is_correct = (q.ord <= 4)
                 order by c.position limit 1))))
        from (select x as id, o as ord from unnest(v_att.question_ids) with ordinality u(x, o)) q));
    /* Backdated, so a later write that moved the stamp could not hide behind one
       transaction's single now(). */
    update learn_module_progress
       set quiz_passed_at = quiz_passed_at - interval '2 days'
     where learner_id = l_a and module_slug = v_s1;
    select quiz_passed_at into v_first from learn_module_progress
     where learner_id = l_a and module_slug = v_s1;

    v_rec := (select r.record from learn_progress_records_of(l_a) r);
    select s into v_err from jsonb_array_elements(v_rec -> 'stages') s where s ->> 'stage_slug' = v_s1;
    if not (v_err ->> 'complete')::boolean or (v_err ->> 'completed_at')::timestamptz <> v_first then
      raise exception '4 of 5 did not read as complete at its first pass: %', v_err;
    end if;
    if not (v_err ->> 'read')::boolean then raise exception 'a pass cleared the Read Mark'; end if;

    v_att := learn_stage_quiz_attempt(l_a, v_s1);
    perform learn_mark_attempt(v_att.id, '{}'::jsonb);        -- a practice attempt that fails

    v_rec := (select r.record from learn_progress_records_of(l_a) r);
    select s into v_err from jsonb_array_elements(v_rec -> 'stages') s where s ->> 'stage_slug' = v_s1;
    if not (v_err ->> 'complete')::boolean or (v_err ->> 'completed_at')::timestamptz <> v_first then
      raise exception 'a later attempt cleared or moved the completion: %', v_err;
    end if;
    if v_err #>> '{quiz,latest,passed}' <> 'false' or (v_err #>> '{quiz,latest,attempt_no}')::int <> 3
       or (v_err #>> '{quiz,attempts}')::int <> 3 or (v_err #>> '{quiz,latest,score_raw}')::int <> 0 then
      raise exception 'the latest attempt is not the third, failed one: %', v_err -> 'quiz';
    end if;

    /* One Stage Quiz passed in a Level of several is a Level started, not complete. */
    select l into v_err from jsonb_array_elements(v_rec -> 'levels') l where l ->> 'level_slug' = v_l1;
    if cardinality(v_stages1) > 1
       and ((v_err ->> 'complete')::boolean or v_err ->> 'completed_at' is not null
            or (v_err ->> 'stages_passed')::int <> 1 or v_err ->> 'status' <> 'IN_PROGRESS') then
      raise exception 'one Stage Quiz passed completed the Level: %', v_err;
    end if;

    -- ── two Levels completed between Sittings: one Sitting owed, then none ──
    insert into learn_baseline_sittings (learner_id, sitting_no, submitted_at, level_scores, total_score, total_max)
    values (l_a, 1, now() - interval '30 days',
            jsonb_build_object(v_l1, jsonb_build_object('score', 1, 'max', 4),
                               v_l2, jsonb_build_object('score', 2, 'max', 4)), 3, 20);

    foreach st in array v_stages1[2:] || v_stages2 loop
      v_att := learn_stage_quiz_attempt(l_a, st);
      perform learn_mark_attempt(v_att.id, (
        select jsonb_object_agg(x::text, jsonb_build_object('chosen', (
                 select jsonb_agg(c.option_key) from learn_choices c
                  where c.question_id = x and c.is_correct)))
          from unnest(v_att.question_ids) x));
    end loop;

    v_rec := (select r.record from learn_progress_records_of(l_a) r);
    n := 0;
    for st in select l ->> 'level_slug' from jsonb_array_elements(v_rec -> 'levels') l
               where (l ->> 'complete')::boolean and l ->> 'completed_at' is not null loop
      n := n + 1;
    end loop;
    if n <> 2 or not exists (select 1 from jsonb_array_elements(v_rec -> 'levels') l
                              where l ->> 'level_slug' = v_l1 and (l ->> 'complete')::boolean)
              or not exists (select 1 from jsonb_array_elements(v_rec -> 'levels') l
                              where l ->> 'level_slug' = v_l2 and (l ->> 'complete')::boolean) then
      raise exception 'expected exactly the two Levels sat to be complete, found %', n;
    end if;
    if v_l3 is not null and exists (select 1 from jsonb_array_elements(v_rec -> 'levels') l
                                     where l ->> 'level_slug' = v_l3 and (l ->> 'complete')::boolean) then
      raise exception 'a Level nobody sat reads as complete';
    end if;
    if (v_rec #>> '{baseline,sitting_due}') is distinct from '2' then
      raise exception 'two Levels finished since Sitting 1 should owe Sitting 2 once, got %',
        v_rec #>> '{baseline,sitting_due}';
    end if;

    insert into learn_baseline_sittings (learner_id, sitting_no, submitted_at, level_scores, total_score, total_max)
    values (l_a, 2, now() + interval '1 minute',
            jsonb_build_object(v_l1, jsonb_build_object('score', 3, 'max', 4),
                               v_l2, jsonb_build_object('score', 3, 'max', 4)), 12, 20);
    v_rec := (select r.record from learn_progress_records_of(l_a) r);
    if (v_rec #>> '{baseline,sitting_due}') is not null then
      raise exception 'Sitting 2 is not owed twice for two Levels, got %', v_rec #>> '{baseline,sitting_due}';
    end if;
    if jsonb_array_length(v_rec #> '{baseline,sittings}') <> 2
       or (v_rec #>> '{baseline,sittings,0,sitting_no}') <> '1' then
      raise exception 'the Sittings are not listed oldest first';
    end if;

    -- ── a Certificate is carried; a revoked one is history, not the Level's ──
    insert into learn_certificates (learner_id, level_slug, code, issued_name, award_title, score_pct)
    values (l_a, v_l1, 'ZZPROBE-' || left(s_a::text, 8), 'Probe Student A', 'Probe award', 100);
    insert into learn_certificates (learner_id, level_slug, code, issued_name, award_title, score_pct, revoked_at)
    values (l_a, v_l2, 'ZZPROBE-' || left(s_b::text, 8), 'Probe Student A', 'Probe award', 100, now());
    v_rec_a := (select r.record from learn_progress_records_of(l_a) r);
    if jsonb_array_length(v_rec_a -> 'certificates') <> 2 then raise exception 'the Certificates are not all listed'; end if;
    select l into v_err from jsonb_array_elements(v_rec_a -> 'levels') l where l ->> 'level_slug' = v_l1;
    if v_err #>> '{certificate,code}' is distinct from 'ZZPROBE-' || left(s_a::text, 8) then
      raise exception 'the Level does not carry its live Certificate: %', v_err;
    end if;
    select l into v_err from jsonb_array_elements(v_rec_a -> 'levels') l where l ->> 'level_slug' = v_l2;
    if v_err -> 'certificate' <> 'null'::jsonb then
      raise exception 'a revoked Certificate reads as the Level''s live one: %', v_err;
    end if;

    -- ── Student B: every Stage read, none passed ──
    insert into learn_module_progress (learner_id, module_slug, status, completed_at)
    select l_b, x, 'COMPLETE', now() from unnest(v_stages1) x;
    perform learn_refresh_progress(l_b, v_l1);
    v_rec := (select r.record from learn_progress_records_of(l_b) r);
    select l into v_err from jsonb_array_elements(v_rec -> 'levels') l where l ->> 'level_slug' = v_l1;
    if (v_err ->> 'complete')::boolean or v_err ->> 'completed_at' is not null
       or (v_err ->> 'stages_passed')::int <> 0
       or (v_err ->> 'stages_read')::int <> cardinality(v_stages1)
       or v_err ->> 'status' <> 'IN_PROGRESS' then
      raise exception 'reading every Stage completed or advanced the Level: %', v_err;
    end if;
    if exists (select 1 from jsonb_array_elements(v_rec -> 'stages') s
                where s ->> 'level_slug' = v_l1
                  and (not (s ->> 'read')::boolean or (s ->> 'complete')::boolean)) then
      raise exception 'a read Stage reads as complete, or an unread one as read';
    end if;
    if jsonb_array_length(v_rec -> 'certificates') <> 0
       or (v_rec #>> '{baseline,sitting_due}') <> '1' then
      raise exception 'a Student who only read holds a Certificate or owes the wrong Sitting';
    end if;

    -- ── a Student cannot read another Student ──
    perform set_config('request.jwt.claims', json_build_object('sub', s_b, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', s_b::text, true);
    set local role authenticated;
    if learn_progress_record(l_a) is not null then
      raise exception 'a Student read another Student''s record';
    end if;
    if learn_progress_record() #>> '{learner,id}' <> l_b::text
       or learn_progress_record(l_b) #>> '{learner,id}' <> l_b::text then
      raise exception 'a Student cannot read their own record';
    end if;
    select count(*) into n from learn_progress_records();
    if n <> 1 then raise exception 'a Student listed % records, not their own one', n; end if;
    if (select r.learner_id from learn_progress_records() r) <> l_b then
      raise exception 'a Student''s list holds someone else';
    end if;
    execute format('set local role %I', me);

    -- ── an Admin can, one or all ──
    perform set_config('request.jwt.claims', json_build_object('sub', s_adm, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', s_adm::text, true);
    set local role authenticated;
    if learn_progress_record(l_a) is distinct from v_rec_a then
      raise exception 'an Admin reads a different record of Student A than the one built for them';
    end if;
    if learn_progress_record(l_b) is null then raise exception 'an Admin cannot read Student B'; end if;
    if learn_progress_record(gen_random_uuid()) is not null then raise exception 'an Admin read a Student who is not there'; end if;
    if learn_progress_record() #>> '{learner,id}' <> l_adm::text then
      raise exception 'an Admin is not a Student first: their own record is missing';
    end if;
    select count(*) into n from learn_progress_records();
    if n <> v_all then raise exception 'an Admin lists % of % Students', n, v_all; end if;
    select count(*) into n from learn_progress_records(2, 0);
    if n <> least(2, v_all) then raise exception 'a page of two returned %', n; end if;
    if exists (select 1 from learn_progress_records(1, 0) a join learn_progress_records(1, 1) b
                 on a.learner_id = b.learner_id) then
      raise exception 'two pages of one overlap';
    end if;
    if not exists (select 1 from learn_progress_records() r where r.learner_id in (l_a, l_b, l_adm)
                   having count(*) = 3) then
      raise exception 'the Admin''s list misses a probe Student';
    end if;
    execute format('set local role %I', me);

    -- ── someone signed in who is neither: nothing ──
    perform set_config('request.jwt.claims', json_build_object('sub', s_out, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', s_out::text, true);
    set local role authenticated;
    if learn_progress_record() is not null or learn_progress_record(l_a) is not null then
      raise exception 'a caller with no Student row read a record';
    end if;
    select count(*) into n from learn_progress_records();
    if n <> 0 then raise exception 'a caller with no Student row listed % records', n; end if;
    -- and the builder is out of reach, even to an Admin's role
    ok := false;
    begin perform learn_progress_records_of(l_a); exception when insufficient_privilege then ok := true; end;
    if not ok then raise exception 'an authenticated caller ran the internal builder'; end if;
    execute format('set local role %I', me);

    -- ── anon cannot ──
    perform set_config('request.jwt.claims', '{}', true);
    perform set_config('request.jwt.claim.sub', '', true);
    set local role anon;
    ok := false;
    begin perform learn_progress_record(l_a); exception when insufficient_privilege then ok := true; end;
    if not ok then raise exception 'anon read a Progress Record'; end if;
    ok := false;
    begin perform learn_progress_records(); exception when insufficient_privilege then ok := true; end;
    if not ok then raise exception 'anon listed Progress Records'; end if;
    execute format('set local role %I', me);

    raise exception 'Progress Record probe finished' using errcode = 'P0138';
  exception when sqlstate 'P0138' then null;
  end;

  /* Nothing leaked out of the rolled-back block. */
  if exists (select 1 from learners where email like '%@save7.org' and name like 'Probe %')
     or exists (select 1 from learn_certificates where code like 'ZZPROBE-%') then
    raise exception 'a probe row survived the rollback';
  end if;
end $$;

select verify_learn_isolation();

commit;
