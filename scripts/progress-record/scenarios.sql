-- Progress Record scenarios: the behavioural half of save7-os 0138's probe, re-runnable.
--
-- Migration 0138 (learn_progress_record / learn_progress_records) ends in a one-shot
-- probe that runs once, when the migration is applied. This file is the part of that
-- probe that checks BEHAVIOUR (what the record says, for which Student, for which
-- caller), pulled out so it can be run again after any later change to the Progress
-- Record, a Stage Quiz rule or a Level rule. It is only that half. It defines no
-- function and creates no schema; the migration's STRUCTURAL checks (who holds EXECUTE,
-- security definer, the builder out of clients' reach) stay in 0138, and this file
-- never copies the SQL under test. Run it with scripts/progress-record/run.sh.
--
-- Each scenario carries the same name as the fixture of the same name in
-- src/lib/__fixtures__/progress-records.ts, which the TypeScript tests read through
-- the app's mapper. SQL decides the rule here; TypeScript maps it there.
--
--   NEW_STUDENT                  no Sitting, Sitting 1 owed, nothing started
--   READ_MARK_ONLY               a Read Mark with no pass: read, not complete
--   FAIL_THEN_PASS_THEN_FAIL     complete at the first pass; the latest attempt is the failed third
--   TWO_LEVELS_BETWEEN_SITTINGS  two Levels done since Sitting 1: Sitting 2 owed, once
--   TWO_LEVELS_AFTER_SITTING_2   nothing owed once Sitting 2 is in
--   REVOKED_CERTIFICATE          a live Certificate on its Level; a revoked one on none
--   READ_EVERY_STAGE             every Stage read, none passed: the Level is not complete
--   ANOTHER_STUDENTS_RECORD      null for a Student, an outsider and anon; open to an Admin
--
-- Safe to run repeatedly. Everything it creates (learners, auth.users, attempts,
-- Sittings, Certificates) is made inside a sub-block that is rolled back, and the whole
-- script runs in a transaction that is rolled back as well. Its learners carry a date of
-- birth and a consent stamp, as the consent and age gates (0111, 0117) require.
--
-- Needs a database with the Learn migrations replayed, including 0111 and 0117, the
-- Stage Quiz banks (so two Levels can be sat in full), 0134 (Learn Admins) and 0138.
-- See README.md in this folder.

begin;

do $$
declare
  me       text := current_user;   -- the role to come back to: `reset role` would go to the login role
  sc       text := 'setup';        -- the scenario running, named in any failure
  passed   text[] := '{}';
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
begin
  /* The replay must carry the consent and age gates. A replay without 0117 once let a
     broken probe pass, so say so up front instead of testing a database that differs
     from production. */
  if to_regprocedure('app_learner_consented()') is null or to_regprocedure('app_learner_of_age()') is null then
    raise exception 'this database lacks the consent and age gates (0111, 0117): replay them first, see README.md';
  end if;
  if to_regprocedure('learn_progress_record(uuid)') is null or to_regprocedure('learn_progress_records(int,int)') is null then
    raise exception 'this database lacks the Progress Record module (0138)';
  end if;
  if to_regclass('learn_admins') is null then
    raise exception 'this database lacks Learn Admins (0134)';
  end if;

  /* Two Levels with a full set of banks to sit, in Course order. Data, not names: a
     scenario that silently skips is not a scenario. */
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
         values (s_a::text   || '@save7.org', 'Scenario', 'Scenario Student A', true, date '1990-01-01', now()) returning id into l_a;
    insert into learners (email, first_name, name, active, date_of_birth, popia_consent_at)
         values (s_b::text   || '@save7.org', 'Scenario', 'Scenario Student B', true, date '1990-01-01', now()) returning id into l_b;
    insert into learners (email, first_name, name, active, date_of_birth, popia_consent_at)
         values (s_adm::text || '@save7.org', 'Scenario', 'Scenario Admin',     true, date '1990-01-01', now()) returning id into l_adm;
    insert into auth.users (id, email) values (s_a,   s_a::text   || '@save7.org') on conflict (id) do nothing;
    insert into auth.users (id, email) values (s_b,   s_b::text   || '@save7.org') on conflict (id) do nothing;
    insert into auth.users (id, email) values (s_adm, s_adm::text || '@save7.org') on conflict (id) do nothing;
    insert into auth.users (id, email) values (s_out, s_out::text || '@save7.org') on conflict (id) do nothing;
    update learners set user_id = s_a   where id = l_a;
    update learners set user_id = s_b   where id = l_b;
    update learners set user_id = s_adm where id = l_adm;
    insert into learn_admins (user_id, role) values (s_adm, 'admin') on conflict (user_id) do nothing;
    select count(*) into v_all from learners;

    -- ── NEW_STUDENT: an empty record of the right shape ──
    sc := 'NEW_STUDENT';
    perform set_config('request.jwt.claims', json_build_object('sub', s_a, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', s_a::text, true);
    set local role authenticated;
    v_rec := learn_progress_record();
    execute format('set local role %I', me);
    if v_rec is null then raise exception 'a Student cannot read their own record'; end if;
    if v_rec #>> '{learner,id}' <> l_a::text or v_rec #>> '{learner,name}' <> 'Scenario Student A' then
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
    passed := passed || sc;

    -- ── READ_MARK_ONLY: a Read Mark with no pass reads as read, not complete ──
    sc := 'READ_MARK_ONLY';
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
    passed := passed || sc;

    -- ── FAIL_THEN_PASS_THEN_FAIL: completion is never cleared ──
    sc := 'FAIL_THEN_PASS_THEN_FAIL';
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
    passed := passed || sc;

    -- ── TWO_LEVELS_BETWEEN_SITTINGS: one Sitting owed, however many Levels ──
    sc := 'TWO_LEVELS_BETWEEN_SITTINGS';
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
    passed := passed || sc;

    -- ── TWO_LEVELS_AFTER_SITTING_2: nothing owed once Sitting 2 is in ──
    sc := 'TWO_LEVELS_AFTER_SITTING_2';
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
    passed := passed || sc;

    -- ── REVOKED_CERTIFICATE: a Certificate is carried; a revoked one is history, not the Level's ──
    sc := 'REVOKED_CERTIFICATE';
    insert into learn_certificates (learner_id, level_slug, code, issued_name, award_title, score_pct)
    values (l_a, v_l1, 'ZZSCEN-' || left(s_a::text, 8), 'Scenario Student A', 'Scenario award', 100);
    insert into learn_certificates (learner_id, level_slug, code, issued_name, award_title, score_pct, revoked_at)
    values (l_a, v_l2, 'ZZSCEN-' || left(s_b::text, 8), 'Scenario Student A', 'Scenario award', 100, now());
    v_rec_a := (select r.record from learn_progress_records_of(l_a) r);
    if jsonb_array_length(v_rec_a -> 'certificates') <> 2 then raise exception 'the Certificates are not all listed'; end if;
    select l into v_err from jsonb_array_elements(v_rec_a -> 'levels') l where l ->> 'level_slug' = v_l1;
    if v_err #>> '{certificate,code}' is distinct from 'ZZSCEN-' || left(s_a::text, 8) then
      raise exception 'the Level does not carry its live Certificate: %', v_err;
    end if;
    select l into v_err from jsonb_array_elements(v_rec_a -> 'levels') l where l ->> 'level_slug' = v_l2;
    if v_err -> 'certificate' <> 'null'::jsonb then
      raise exception 'a revoked Certificate reads as the Level''s live one: %', v_err;
    end if;
    passed := passed || sc;

    -- ── READ_EVERY_STAGE: Student B read every Stage, passed none ──
    sc := 'READ_EVERY_STAGE';
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
    passed := passed || sc;

    -- ── ANOTHER_STUDENTS_RECORD: null for a Student, an outsider and anon; open to an Admin ──
    sc := 'ANOTHER_STUDENTS_RECORD';
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

    /* an Admin can, one or all */
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
      raise exception 'the Admin''s list misses a scenario Student';
    end if;
    execute format('set local role %I', me);

    /* someone signed in who is neither: nothing */
    perform set_config('request.jwt.claims', json_build_object('sub', s_out, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', s_out::text, true);
    set local role authenticated;
    if learn_progress_record() is not null or learn_progress_record(l_a) is not null then
      raise exception 'a caller with no Student row read a record';
    end if;
    select count(*) into n from learn_progress_records();
    if n <> 0 then raise exception 'a caller with no Student row listed % records', n; end if;
    execute format('set local role %I', me);

    /* anon is refused outright */
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
    passed := passed || sc;

    raise exception 'Progress Record scenarios finished' using errcode = 'P0138';
  exception
    when sqlstate 'P0138' then null;
    when others then
      execute format('set local role %I', me);
      raise exception 'SCENARIO % FAILED: %', sc, sqlerrm using errcode = 'P0139';
  end;

  /* Nothing leaked out of the rolled-back block. */
  if exists (select 1 from learners where email like '%@save7.org' and name like 'Scenario %')
     or exists (select 1 from learn_certificates where code like 'ZZSCEN-%') then
    raise exception 'a scenario row survived the rollback';
  end if;

  foreach sc in array passed loop
    raise notice 'PASS  %', sc;
  end loop;
  raise notice '% scenarios passed', cardinality(passed);
end $$;

rollback;
