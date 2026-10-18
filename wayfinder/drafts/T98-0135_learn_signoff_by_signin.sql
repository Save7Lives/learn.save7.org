-- Record Eligibility Rule saves and review sign-offs against the Admin's sign-in (learn.save7.org T98)
--
-- ── WHAT WAS WRONG ───────────────────────────────────────────────────────────
-- `learn_eligibility_rules.created_by` and `learn_review_items.cleared_by` are
-- `people (id)` references, and the policies required them to be the caller's own
-- people id. 0134 made Learn Admins independent of the ops staff list, so a granted
-- Admin who is only a Student has no `people` row and could read everything but could
-- neither save a rule nor clear a review item. T97 decided the fix: attribute to the
-- sign-in (the auth user), which every Admin, granted or Owner, has.
--
-- ── WHAT CHANGES ─────────────────────────────────────────────────────────────
--   * `learn_eligibility_rules.created_by_user` and `learn_review_items.cleared_by_user`:
--     nullable `uuid` references `auth.users`, `on delete set null`, as the existing
--     columns reference `people`. `created_by` and `cleared_by` stay, for history, and
--     are no longer required or written by the app.
--   * The rule insert policy asks `learn_is_admin() and created_by_user = auth.uid()`;
--     the review update policy asks the same of `cleared_by_user`. An Admin cannot
--     record a decision as someone else, and cannot record one with no name on it.
--   * `learn_actor_names(uuid[])`: who those user ids are, for an Admin. The Student
--     row's name, else the staff row's, else the sign-in address. Security definer,
--     because neither `learners` nor `people` nor `auth.users` is readable to every
--     Admin directly (an Admin who is only a Student has no staff row to read with).
--
-- ── WHAT THIS DOES NOT DO ────────────────────────────────────────────────────
-- No backfill: no rule has been saved and no review item has ever been cleared in
-- production (cleared_by was written with the wrong id until the app fix, so every
-- write failed), so there is no history to carry across. Any old row that does carry a
-- `created_by` / `cleared_by` shows as "Unknown" in the app, as it does today.
--
-- Depends on 0134 (`learn_is_admin()`). Safe to run twice.

begin;

alter table learn_eligibility_rules
  add column if not exists created_by_user uuid references auth.users (id) on delete set null;
alter table learn_review_items
  add column if not exists cleared_by_user uuid references auth.users (id) on delete set null;

comment on column learn_eligibility_rules.created_by_user is
  'The Admin who saved this version, by sign-in. Required by the insert policy. created_by (a people id) is kept for history only.';
comment on column learn_review_items.cleared_by_user is
  'The Admin who recorded this decision, by sign-in. Required by the update policy. cleared_by (a people id) is kept for history only.';

alter policy learn_eligibility_rules_insert on learn_eligibility_rules
  with check (learn_is_admin() and created_by_user = auth.uid());
alter policy learn_review_items_write on learn_review_items
  using (learn_is_admin())
  with check (learn_is_admin() and cleared_by_user = auth.uid());

create or replace function learn_actor_names(ids uuid[])
returns table (user_id uuid, name text)
language sql stable security definer set search_path = public
as $$
  select u.id,
         coalesce(
           (select l.name from learners l where l.user_id = u.id and l.name is not null limit 1),
           (select p.name from people   p where p.user_id = u.id and p.name is not null limit 1),
           u.email::text)
    from auth.users u
   where u.id = any (ids)
     and learn_is_admin()
$$;

revoke all on function learn_actor_names(uuid[]) from public, anon;
grant execute on function learn_actor_names(uuid[]) to authenticated;

-- ── prove the rules, by trying to break them ─────────────────────────────────

do $$
declare
  n int;
  s1 uuid := gen_random_uuid();   -- an Admin with no `people` row
  s2 uuid := gen_random_uuid();   -- a plain Student
  item uuid;
  ok boolean;
  me text := current_user;        -- see 0134: `reset role` would return to the login role
begin
  /* Structure. */
  if exists (select 1 from pg_policies
              where policyname = 'learn_eligibility_rules_insert' and with_check not like '%created_by_user%') then
    raise exception 'the rule insert policy does not ask for the sign-in';
  end if;
  if exists (select 1 from pg_policies
              where policyname = 'learn_review_items_write' and with_check not like '%cleared_by_user%') then
    raise exception 'the review update policy does not ask for the sign-in';
  end if;
  if has_function_privilege('anon', 'learn_actor_names(uuid[])', 'execute') then
    raise exception 'anon can execute learn_actor_names';
  end if;

  /* Behaviour, as people. Everything below rolls back, auth.users included. A rule
     is inserted with an explicit version (-1), so the probe does not burn a number
     from the sequence: the version list the Admin reads must have no gaps. */
  begin
    insert into auth.users (id, email) values (s1, s1::text || '@save7.org') on conflict (id) do nothing;
    insert into auth.users (id, email) values (s2, s2::text || '@save7.org') on conflict (id) do nothing;
    insert into learners (user_id, email, first_name, name) values (s2, s2::text || '@save7.org', 'Probe', 'Probe Student');
    insert into learn_admins (user_id, role) values (s1, 'admin');
    if exists (select 1 from people where user_id = s1) then raise exception 'the probe Admin has a people row'; end if;
    insert into learn_review_items (entity_type, entity_ref, location, claim, category)
      values ('probe', gen_random_uuid()::text, 'probe', 'probe', 'probe') returning id into item;

    /* A plain Student: cannot save a rule, cannot clear an item, even naming themselves. */
    perform set_config('request.jwt.claims', json_build_object('sub', s2, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', s2::text, true);
    set local role authenticated;
    ok := false;
    begin
      insert into learn_eligibility_rules (version, required_flags, created_by_user) values (-1, array['probe'], s2);
    exception when insufficient_privilege then ok := true; end;
    if not ok then raise exception 'a plain Student saved a rule'; end if;
    update learn_review_items set status = 'APPROVED', cleared_by_user = s2, cleared_at = now() where id = item;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'a plain Student cleared a review item'; end if;
    if exists (select 1 from learn_actor_names(array[s1, s2])) then raise exception 'a plain Student read actor names'; end if;
    execute format('set local role %I', me);

    /* An Admin with no people row: can save a rule and clear an item, as themselves. */
    perform set_config('request.jwt.claims', json_build_object('sub', s1, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', s1::text, true);
    set local role authenticated;
    insert into learn_eligibility_rules (version, required_flags, created_by_user) values (-1, array['probe'], s1);
    update learn_review_items set status = 'APPROVED', cleared_by_user = s1, cleared_at = now() where id = item;
    get diagnostics n = row_count;
    if n <> 1 then raise exception 'an Admin with no people row could not clear an item'; end if;

    /* ...and cannot attribute to someone else, or to nobody. */
    ok := false;
    begin
      insert into learn_eligibility_rules (version, required_flags, created_by_user) values (-2, array['probe'], s2);
    exception when insufficient_privilege then ok := true; end;
    if not ok then raise exception 'an Admin saved a rule as someone else'; end if;
    ok := false;
    begin
      insert into learn_eligibility_rules (version, required_flags) values (-2, array['probe']);
    exception when insufficient_privilege then ok := true; end;
    if not ok then raise exception 'an Admin saved a rule with no name on it'; end if;
    ok := false;
    begin
      update learn_review_items set status = 'REJECTED', cleared_by_user = s2 where id = item;
    exception when insufficient_privilege then ok := true; end;
    if not ok then raise exception 'an Admin cleared an item as someone else'; end if;
    /* An item last cleared by someone else cannot be re-decided without taking the
       decision on as oneself: leaving the old name in place is refused. */
    execute format('set local role %I', me);
    update learn_review_items set cleared_by_user = s2 where id = item;
    set local role authenticated;
    ok := false;
    begin
      update learn_review_items set status = 'REJECTED' where id = item;
    exception when insufficient_privilege then ok := true; end;
    if not ok then raise exception 'an Admin cleared an item with someone else''s name still on it'; end if;

    /* Names: the Student row first, else the sign-in address. */
    if (select a.name from learn_actor_names(array[s1, s2]) a where a.user_id = s1) is distinct from s1::text || '@save7.org'
       or (select a.name from learn_actor_names(array[s1, s2]) a where a.user_id = s2) is distinct from 'Probe Student' then
      raise exception 'actor names are wrong';
    end if;
    execute format('set local role %I', me);

    raise exception 'sign-off probe finished' using errcode = 'P0135';
  exception when sqlstate 'P0135' then null;
  end;

  /* Nothing leaked out of the rolled-back block. */
  if exists (select 1 from learn_eligibility_rules where version < 0)
     or exists (select 1 from learn_review_items where entity_type = 'probe')
     or exists (select 1 from learn_admins where user_id in (s1, s2)) then
    raise exception 'the sign-off probe left rows behind';
  end if;
end $$;

commit;
