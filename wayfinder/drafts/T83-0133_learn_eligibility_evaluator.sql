-- Somebody finally writes the Nerve Center Eligibility Signal (learn.save7.org #83)
--
-- ── WHAT THIS IS ─────────────────────────────────────────────────────────────
-- 0110 made `learn_eligibility_rules` (versioned, never edited) and
-- `learn_eligibility_signals` (one current answer per learner) and said, in so
-- many words, that no evaluator was built. Nothing has written a signal since, so
-- the Admin's eligible pill, its "evaluated under version N" line and its
-- "N of M Students read as eligible" count would show nothing, or go stale the day
-- a rule changes. This migration is that evaluator.
--
-- ── WHAT A FLAG IS ───────────────────────────────────────────────────────────
-- 0110 left "what a flag means" to the evaluator. One family exists so far:
--
--     level_complete:<level slug>   learn_level_progress.completed_at is set
--
-- e.g. `level_complete:beginner`. That is all the Admin rule editor offers (#72).
-- Any other string is a flag nobody holds, so a rule that names one reads as
-- nobody eligible rather than raising. Stage and Certificate flags (#16 lists
-- them) join by adding a branch to learn_holds_flag(), not by changing a table.
-- Only the Progress Record's completion state is read: never Baseline scores,
-- never engagement (#16).
--
-- ── WHEN IT RUNS (triggers, not calls from the progress functions) ───────────
-- Three events, three triggers:
--   * a Level is completed: AFTER INSERT/UPDATE on learn_level_progress, in the
--     same transaction that sets completed_at (learn_refresh_progress writes it
--     and is not touched here, so 0113's big functions are not re-created and
--     cannot drift from this one). Fires only when completed_at newly gets a value:
--     learn_refresh_progress re-upserts the row on every Stage Quiz pass, keeping
--     the old timestamp, and that is not an event.
--   * a rule version is saved: AFTER INSERT on learn_eligibility_rules re-evaluates
--     every learner under it, so every signal carries the new rule_version.
--   * a learner is created: AFTER INSERT on learners gives them a row (not eligible)
--     under the current rule, so there is one signal per Student and the Admin
--     count has a denominator without a null case.
--
-- ── DECISIONS WORTH KNOWING ──────────────────────────────────────────────────
--   * The current rule is the highest version. No rule yet: nothing is written
--     (a signal must name a rule_version, and there is none).
--   * An empty required_flags list reads as nobody eligible. An AND of nothing
--     would make everyone eligible; the Admin screen refuses to save one (#72), and
--     this is the safe answer if one arrives some other way.
--   * Nothing here ever clears a Level complete: learn_refresh_progress keeps
--     completed_at once set. A signal can fall from true to false only because a
--     newer rule asks for more, and then rule_version moves with it.
--
-- ── WHO MAY CALL ─────────────────────────────────────────────────────────────
-- Nobody. The signal's insert and update policies admit staff only, so the
-- Student's completion path cannot write through them; the functions are security
-- definer, like the grading functions, execute is revoked from every client role,
-- and each call writes only the row it was asked about. Triggers still fire them.
-- `learn_evaluate_all_eligibility()` is the backfill and is run once at the end.

begin;

/* The one definition of "holds this flag". */
create or replace function learn_holds_flag(p_learner uuid, p_flag text)
returns boolean
language sql stable set search_path = public
as $$
  select case split_part(p_flag, ':', 1)
    when 'level_complete' then exists (
      select 1 from learn_level_progress p
       where p.learner_id = p_learner
         and p.level_slug = split_part(p_flag, ':', 2)
         and p.completed_at is not null)
    else false
  end
$$;

/* One learner against the current rule version, written in place. */
create or replace function learn_evaluate_eligibility(p_learner uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_version  int;
  v_flags    text[];
  v_eligible boolean;
begin
  select version, required_flags into v_version, v_flags
    from learn_eligibility_rules
   order by version desc limit 1;
  if not found then
    return;
  end if;

  v_eligible := cardinality(v_flags) > 0
    and not exists (select 1 from unnest(v_flags) f
                     where not learn_holds_flag(p_learner, f));

  insert into learn_eligibility_signals (learner_id, eligible, evaluated_at, rule_version)
  values (p_learner, v_eligible, now(), v_version)
  on conflict (learner_id) do update set
    eligible = excluded.eligible,
    evaluated_at = excluded.evaluated_at,
    rule_version = excluded.rule_version;
end;
$$;

/* Everyone: the backfill, and what a new rule version triggers. */
create or replace function learn_evaluate_all_eligibility()
returns int
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  n int := 0;
begin
  for r in select id from learners loop
    perform learn_evaluate_eligibility(r.id);
    n := n + 1;
  end loop;
  return n;
end;
$$;

create or replace function learn_eligibility_on_level_complete()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform learn_evaluate_eligibility(new.learner_id);
  return null;
end;
$$;

create or replace function learn_eligibility_on_learner_created()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform learn_evaluate_eligibility(new.id);
  return null;
end;
$$;

create or replace function learn_eligibility_on_rule_saved()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform learn_evaluate_all_eligibility();
  return null;
end;
$$;

revoke all on function learn_holds_flag(uuid, text)         from public, anon, authenticated;
revoke all on function learn_evaluate_eligibility(uuid)     from public, anon, authenticated;
revoke all on function learn_evaluate_all_eligibility()     from public, anon, authenticated;
revoke all on function learn_eligibility_on_level_complete() from public, anon, authenticated;
revoke all on function learn_eligibility_on_learner_created() from public, anon, authenticated;
revoke all on function learn_eligibility_on_rule_saved()    from public, anon, authenticated;

drop trigger if exists learn_eligibility_level_inserted on learn_level_progress;
create trigger learn_eligibility_level_inserted
  after insert on learn_level_progress
  for each row when (new.completed_at is not null)
  execute function learn_eligibility_on_level_complete();

drop trigger if exists learn_eligibility_level_completed on learn_level_progress;
create trigger learn_eligibility_level_completed
  after update of completed_at on learn_level_progress
  for each row when (new.completed_at is not null and old.completed_at is distinct from new.completed_at)
  execute function learn_eligibility_on_level_complete();

drop trigger if exists learn_eligibility_learner_created on learners;
create trigger learn_eligibility_learner_created
  after insert on learners
  for each row execute function learn_eligibility_on_learner_created();

drop trigger if exists learn_eligibility_rule_saved on learn_eligibility_rules;
create trigger learn_eligibility_rule_saved
  after insert on learn_eligibility_rules
  for each row execute function learn_eligibility_on_rule_saved();

comment on table learn_eligibility_signals is
  'One row per learner: whether they currently read as eligible, when that was last evaluated, and which learn_eligibility_rules version produced it. Re-evaluated in place, unlike the rules themselves — this is the current answer, not a log of every answer ever given. Written only by learn_evaluate_eligibility() (since 0133), fired when a Level completes, a rule version is saved or a learner is created; no client role can call it. No signal exists until a first rule does.';

-- ── prove it, by driving the real paths and rolling everything back ───────────
-- Rules are inserted with explicit, very high versions so that the probe does not
-- spend numbers from learn_eligibility_rules_version_seq (a sequence is not rolled
-- back) and so that they are the current rule whatever real rules exist.

do $$
declare
  v1 constant int := 2000000001;
  a uuid; b uuid; c uuid;
  v_level text; v_mods text[];
  s learn_eligibility_signals;
  t0 timestamptz;
  n int;
begin
  begin
    insert into learners (email, first_name, name, date_of_birth)
      values ('probe-a@save7.org', 'A', 'A', date '1990-01-01') returning id into a;
    insert into learners (email, first_name, name, date_of_birth)
      values ('probe-b@save7.org', 'B', 'B', date '1990-01-01') returning id into b;

    select l.slug into v_level
      from learn_levels l
     where exists (select 1 from learn_modules m where m.level_slug = l.slug and m.is_mandatory)
     order by l.slug limit 1;
    if v_level is null then
      raise exception 'probe: no Level with a mandatory Stage to complete';
    end if;
    select array_agg(slug) into v_mods
      from learn_modules where level_slug = v_level and is_mandatory;

    -- ── 1. a rule is saved: every learner gets a signal under it, not eligible ──
    insert into learn_eligibility_rules (version, required_flags)
      values (v1, array['level_complete:' || v_level]);
    select count(*) into n from learners l
     where not exists (select 1 from learn_eligibility_signals g
                        where g.learner_id = l.id and g.rule_version = v1 and not g.eligible);
    if n <> 0 then
      raise exception 'probe 1: % learner(s) have no not-eligible signal under the new rule', n;
    end if;

    -- ── 2. completing a Level flips that learner, in the same call ──
    insert into learn_module_progress (learner_id, module_slug, quiz_passed_at)
      select a, unnest(v_mods), now();
    perform learn_refresh_progress(a, v_level);
    select * into s from learn_eligibility_signals where learner_id = a;
    if not s.eligible or s.rule_version <> v1 then
      raise exception 'probe 2: completing % did not flip the signal (eligible=%, version=%)',
        v_level, s.eligible, s.rule_version;
    end if;
    select * into s from learn_eligibility_signals where learner_id = b;
    if s.eligible then
      raise exception 'probe 2: a learner who completed nothing reads as eligible';
    end if;

    -- ── 3. nothing clears a Level complete: evaluating again, or another Stage pass, keeps it ──
    t0 := clock_timestamp();
    perform learn_evaluate_eligibility(a);
    perform learn_evaluate_eligibility(a);
    perform learn_refresh_progress(a, v_level);
    select * into s from learn_eligibility_signals where learner_id = a;
    if not s.eligible then
      raise exception 'probe 3: a Student who lost nothing flipped back';
    end if;
    select count(*) into n from learn_eligibility_signals where learner_id = a;
    if n <> 1 then raise exception 'probe 3: % signal rows for one learner', n; end if;

    -- ── 4. a stricter rule version re-evaluates everyone and moves rule_version ──
    insert into learn_eligibility_rules (version, required_flags)
      values (v1 + 1, array['level_complete:' || v_level, 'level_complete:no-such-level']);
    select count(*) into n from learn_eligibility_signals where rule_version <> v1 + 1;
    if n <> 0 then
      raise exception 'probe 4: % signal(s) did not take the new rule_version', n;
    end if;
    select * into s from learn_eligibility_signals where learner_id = a;
    if s.eligible then
      raise exception 'probe 4: a flag nobody holds still reads eligible';
    end if;

    -- ── 5. a looser one reads the same Level complete again, as eligible ──
    insert into learn_eligibility_rules (version, required_flags)
      values (v1 + 2, array['level_complete:' || v_level]);
    select * into s from learn_eligibility_signals where learner_id = a;
    if not s.eligible or s.rule_version <> v1 + 2 then
      raise exception 'probe 5: loosening the rule did not restore the signal';
    end if;

    -- ── 6. an empty rule makes nobody eligible ──
    insert into learn_eligibility_rules (version, required_flags) values (v1 + 3, '{}');
    select count(*) into n from learn_eligibility_signals where eligible;
    if n <> 0 then
      raise exception 'probe 6: an empty required_flags list made % learner(s) eligible', n;
    end if;

    -- ── 7. a new learner gets a signal under the current rule ──
    insert into learners (email, first_name, name, date_of_birth)
      values ('probe-c@save7.org', 'C', 'C', date '1990-01-01') returning id into c;
    select * into s from learn_eligibility_signals where learner_id = c;
    if not found or s.eligible or s.rule_version <> v1 + 3 then
      raise exception 'probe 7: a new learner has no not-eligible signal under the current rule';
    end if;

    -- ── 8. no client can call it, and every piece is security definer ──
    if exists (
      select 1 from pg_proc p
       where p.pronamespace = 'public'::regnamespace
         and p.proname in ('learn_holds_flag', 'learn_evaluate_eligibility', 'learn_evaluate_all_eligibility',
                           'learn_eligibility_on_level_complete', 'learn_eligibility_on_learner_created',
                           'learn_eligibility_on_rule_saved')
         and (has_function_privilege('anon', p.oid, 'execute')
              or has_function_privilege('authenticated', p.oid, 'execute')))
    then
      raise exception 'probe 8: an evaluator function is executable by a client role';
    end if;
    if exists (
      select 1 from pg_proc p
       where p.pronamespace = 'public'::regnamespace
         and p.proname in ('learn_evaluate_eligibility', 'learn_evaluate_all_eligibility',
                           'learn_eligibility_on_level_complete', 'learn_eligibility_on_learner_created',
                           'learn_eligibility_on_rule_saved')
         and not p.prosecdef)
    then
      raise exception 'probe 8: an evaluator that writes the signal is not security definer';
    end if;

    raise exception 'probe done' using errcode = 'P0133';
  exception when sqlstate 'P0133' then
    null;  -- everything above rolled back
  end;
end $$;

-- ── backfill ─────────────────────────────────────────────────────────────────
-- Evaluates every learner under the current rule. With no rule saved yet this
-- writes nothing; the first rule version does the same job through its trigger.
select learn_evaluate_all_eligibility();

commit;
