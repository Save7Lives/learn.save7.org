-- Learn has its own Admins: an Owner who grants and revokes, and ordinary Admins (learn.save7.org T96)
--
-- ── WHAT WAS WRONG ───────────────────────────────────────────────────────────
-- Every Learn oversight policy asks `app_is_staff()`: "does this account resolve to
-- a `people` row". That is Save7 OS's question, answered for Save7 OS's reasons, so
-- anyone Gilbert adds to the ops and finance app became able to read every Student's
-- Progress Record, and nobody could be given course oversight without also being
-- given a place in the ops app. The Admin decision (T95) separates the two.
--
-- ── WHAT CHANGES ─────────────────────────────────────────────────────────────
--   * `learn_admins`: one row per Learn Admin, keyed on the auth user. Role `owner`
--     or `admin`. At most one Owner (a partial unique index). No client can read or
--     write it directly; the functions below are the only way in.
--   * `learn_admin_role()`, `learn_is_admin()`, `learn_is_owner()`: who the caller is.
--   * `learn_grant_admin(learner)` and `learn_revoke_admin(learner)`: Owner only. The
--     Owner cannot be revoked, and a trigger stops the last Owner being deleted or
--     demoted by any other route, so there is never an Owner-less table after seeding.
--   * `learn_admin_roster()`: who the Admins are, for an Admin. The Students screen
--     marks them and the shell names the Owner from it.
--   * The sixteen policies that said `app_is_staff()` now say `learn_is_admin()`.
--   * Seed: zubayr@save7.org is the Owner. Safe to run twice.
--
-- ── HOW THE OLD STAFF CHECK COMBINES ─────────────────────────────────────────
-- While no Owner exists, `learn_admin_role()` falls back to `app_is_staff()`, so the
-- oversight screens cannot go dark between this migration and the seed. Once an
-- Owner exists, staff status counts for nothing here: Gilbert's ops staff are not
-- Learn Admins unless the Owner grants it. This migration seeds the Owner, so the
-- fallback is dormant the moment it lands. It exists for a database where the
-- Owner's account has not signed in yet.
--
-- ── ONE THING THIS DOES NOT CHANGE ───────────────────────────────────────────
-- Saving an Eligibility Rule and clearing a content-review item are attributed to a
-- `people` row (`created_by` / `cleared_by` reference `people (id)`), and the
-- eligibility insert policy keeps requiring `created_by = app_person_id()`. A
-- granted Admin who is a Student only has no `people` row, so can read everything
-- but cannot record those two decisions until attribution is widened (raised on the
-- ticket). The Owner has one.

begin;

create table if not exists learn_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('owner', 'admin')),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now()
);

create unique index if not exists learn_admins_one_owner
  on learn_admins ((true)) where role = 'owner';

comment on table learn_admins is
  'Who may oversee the Course: one Owner and any number of Admins. Written only by learn_grant_admin() and learn_revoke_admin() (and the seed in the migration that created it). No client role has any privilege on it; the functions are security definer so the policies that call learn_is_admin() cannot recurse.';

alter table learn_admins enable row level security;
revoke all on learn_admins from anon, authenticated;

-- ── never zero Owners ────────────────────────────────────────────────────────
-- Whatever route a delete or a demotion takes (a function, a console, a cascade from
-- auth.users), the Owner row is refused. Removing the Owner is a deliberate act with
-- a new Owner named first, which this version does not offer.

create or replace function learn_admins_keep_owner()
returns trigger
language plpgsql
as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner' or new.user_id <> old.user_id) then
    raise exception 'The Owner cannot be removed or demoted' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists learn_admins_keep_owner on learn_admins;
create trigger learn_admins_keep_owner
  before update or delete on learn_admins
  for each row execute function learn_admins_keep_owner();

-- ── who the caller is ────────────────────────────────────────────────────────

create or replace function learn_admin_role()
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select a.role from learn_admins a where a.user_id = auth.uid()),
    case when not exists (select 1 from learn_admins o where o.role = 'owner')
          and app_is_staff() then 'admin' end
  )
$$;

create or replace function learn_is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select learn_admin_role() is not null $$;

create or replace function learn_is_owner()
returns boolean
language sql stable security definer set search_path = public
as $$ select learn_admin_role() = 'owner' $$;

comment on function learn_is_admin() is
  'True for a Learn Admin or the Owner. While no Owner exists it falls back to app_is_staff(), so oversight cannot go dark before the Owner is seeded; once one exists, staff status counts for nothing here.';

-- ── granting and revoking ────────────────────────────────────────────────────

create or replace function learn_grant_admin(p_learner_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  target uuid;
begin
  if learn_admin_role() is distinct from 'owner' then
    raise exception 'Only the Owner can make an Admin' using errcode = '42501';
  end if;

  select l.user_id into target from learners l where l.id = p_learner_id;
  if not found then
    raise exception 'No such Student' using errcode = 'P0002';
  end if;
  if target is null then
    raise exception 'That Student has no sign-in to make an Admin' using errcode = '23514';
  end if;
  if target = auth.uid() then
    raise exception 'The Owner is already an Admin' using errcode = '23514';
  end if;

  insert into learn_admins (user_id, role, granted_by)
  values (target, 'admin', auth.uid())
  on conflict (user_id) do nothing;
end $$;

create or replace function learn_revoke_admin(p_learner_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  target uuid;
  target_role text;
begin
  if learn_admin_role() is distinct from 'owner' then
    raise exception 'Only the Owner can remove an Admin' using errcode = '42501';
  end if;

  select l.user_id into target from learners l where l.id = p_learner_id;
  if not found then
    raise exception 'No such Student' using errcode = 'P0002';
  end if;

  select a.role into target_role from learn_admins a where a.user_id = target;
  if target_role = 'owner' then
    raise exception 'The Owner cannot be removed' using errcode = '23514';
  end if;

  delete from learn_admins where user_id = target and role = 'admin';
end $$;

/* Who the Admins are, for an Admin. Name and email come from where they exist: the
   Student row, else the staff row, else the sign-in. The Owner may be nobody's Student
   (never enrolled), so the roster is keyed on the sign-in and carries the Student id
   only when there is one. */
create or replace function learn_admin_roster()
returns table (user_id uuid, learner_id uuid, role text, name text, email text, granted_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select a.user_id,
         l.id,
         a.role,
         coalesce(l.name, p.name, u.email::text),
         coalesce(l.email, u.email::text),
         a.granted_at
    from learn_admins a
    join auth.users u on u.id = a.user_id
    left join learners l on l.user_id = a.user_id
    left join people   p on p.user_id = a.user_id
   where learn_is_admin()
   order by (a.role = 'owner') desc, a.granted_at
$$;

revoke all on function learn_admin_role(), learn_is_admin(), learn_is_owner(),
                       learn_grant_admin(uuid), learn_revoke_admin(uuid),
                       learn_admin_roster() from public, anon;
grant execute on function learn_admin_role(), learn_is_admin(), learn_is_owner(),
                          learn_admin_roster() to authenticated;
grant execute on function learn_grant_admin(uuid), learn_revoke_admin(uuid) to authenticated;
-- A policy that calls learn_is_admin() is evaluated for `anon` too, and must answer
-- false rather than fail with "permission denied for function".
grant execute on function learn_is_admin() to anon;

-- ── the Owner ────────────────────────────────────────────────────────────────

insert into learn_admins (user_id, role)
select u.id, 'owner'
  from auth.users u
 where lower(u.email) = 'zubayr@save7.org'
   and not exists (select 1 from learn_admins o where o.role = 'owner')
on conflict (user_id) do nothing;

-- ── the oversight policies, repointed ────────────────────────────────────────

alter policy learners_read_self on learners
  using (user_id = auth.uid() or learn_is_admin());
alter policy learn_attempts_own on learn_attempts
  using (learner_id = app_learner_id() or learn_is_admin());
alter policy learn_answers_own on learn_answers
  using (
    learn_is_admin()
    or exists (select 1 from learn_attempts a
                where a.id = attempt_id and a.learner_id = app_learner_id()));
alter policy learn_module_progress_own on learn_module_progress
  using (learner_id = app_learner_id() or learn_is_admin());
alter policy learn_level_progress_own on learn_level_progress
  using (learner_id = app_learner_id() or learn_is_admin());
alter policy learn_course_progress_own on learn_course_progress
  using (learner_id = app_learner_id() or learn_is_admin());
alter policy learn_certificates_own on learn_certificates
  using (learner_id = app_learner_id() or learn_is_admin());
alter policy learn_review_items_staff on learn_review_items
  using (learn_is_admin());
alter policy learn_review_items_write on learn_review_items
  using (learn_is_admin()) with check (learn_is_admin());
alter policy learn_events_read_staff on learn_events
  using (learn_is_admin());
alter policy learn_baseline_sittings_own on learn_baseline_sittings
  using (learner_id = app_learner_id() or learn_is_admin());
alter policy learn_eligibility_rules_read on learn_eligibility_rules
  using (learn_is_admin());
alter policy learn_eligibility_rules_insert on learn_eligibility_rules
  with check (learn_is_admin() and created_by = app_person_id());
alter policy learn_eligibility_signals_read on learn_eligibility_signals
  using (learner_id = app_learner_id() or learn_is_admin());
alter policy learn_eligibility_signals_insert on learn_eligibility_signals
  with check (learn_is_admin());
alter policy learn_eligibility_signals_update on learn_eligibility_signals
  using (learn_is_admin()) with check (learn_is_admin());

-- ── prove the rules, by trying to break them ─────────────────────────────────

do $$
declare
  n int;
  owner_id uuid;
  s1 uuid := gen_random_uuid();   -- a Student who will be granted
  s2 uuid := gen_random_uuid();   -- a Student who will not
  l1 uuid;
  l2 uuid;
  lnull uuid;
  lo uuid;
  total int;
  seen int;
  ok boolean;
begin
  /* Structure. */
  if not (select relrowsecurity from pg_class where oid = 'learn_admins'::regclass) then
    raise exception 'learn_admins has no row level security';
  end if;
  if has_table_privilege('anon', 'learn_admins', 'select')
     or has_table_privilege('authenticated', 'learn_admins', 'select')
     or has_table_privilege('authenticated', 'learn_admins', 'insert')
     or has_table_privilege('authenticated', 'learn_admins', 'update')
     or has_table_privilege('authenticated', 'learn_admins', 'delete') then
    raise exception 'a client role holds a privilege on learn_admins';
  end if;
  if has_function_privilege('anon', 'learn_grant_admin(uuid)', 'execute')
     or has_function_privilege('anon', 'learn_revoke_admin(uuid)', 'execute')
     or has_function_privilege('anon', 'learn_admin_roster()', 'execute') then
    raise exception 'anon can execute an Admin function';
  end if;

  select count(*) into n from pg_policies
   where (tablename like 'learn\_%' or tablename = 'learners')
     and (coalesce(qual, '') like '%app_is_staff%' or coalesce(with_check, '') like '%app_is_staff%');
  if n <> 0 then raise exception '% Learn polic(ies) still ask app_is_staff()', n; end if;

  select count(*) into n from learn_admins where role = 'owner';
  if n > 1 then raise exception 'more than one Owner'; end if;
  select a.user_id into owner_id from learn_admins a where a.role = 'owner';
  if owner_id is null then
    raise notice 'learn_admins has no Owner: zubayr@save7.org has no sign-in yet. Oversight falls back to app_is_staff() until the Owner exists. After the first sign-in, insert the Owner: insert into learn_admins (user_id, role) select id, ''owner'' from auth.users where lower(email) = ''zubayr@save7.org''.';
    return;
  end if;

  /* The trigger holds even for a role that bypasses nothing: no route empties the Owner. */
  begin
    delete from learn_admins where role = 'owner';
    raise exception 'the Owner row was deleted';
  exception when check_violation then null; end;
  begin
    update learn_admins set role = 'admin' where role = 'owner';
    raise exception 'the Owner was demoted';
  exception when check_violation then null; end;

  /* Behaviour, as people. Everything below rolls back, auth.users included. Each
     person is played as the `authenticated` role, which is how the app reaches the
     functions: the role that runs a migration is not one of the roles the grants
     above were written for, so calling them as it would test the wrong thing. The
     table itself is read back as the migration role, since no client may read it. */
  begin
    insert into learners (email, first_name, name) values (s1::text || '@save7.org', 'Probe', 'Probe One') returning id into l1;
    insert into learners (email, first_name, name) values (s2::text || '@save7.org', 'Probe', 'Probe Two') returning id into l2;
    insert into learners (email, first_name, name) values (gen_random_uuid()::text || '@save7.org', 'Probe', 'No Sign-in') returning id into lnull;
    insert into auth.users (id, email) values (s1, s1::text || '@save7.org') on conflict (id) do nothing;
    insert into auth.users (id, email) values (s2, s2::text || '@save7.org') on conflict (id) do nothing;
    update learners set user_id = s1 where id = l1;
    update learners set user_id = s2 where id = l2;
    select id into lo from learners where user_id = owner_id;
    if lo is null then
      insert into learners (email, first_name, name) values (owner_id::text || '@save7.org', 'Probe', 'Owner Student') returning id into lo;
      update learners set user_id = owner_id where id = lo;
    end if;
    select count(*) into total from learners;

    /* A plain Student: not an Admin, cannot grant, sees only their own row. */
    perform set_config('request.jwt.claims', json_build_object('sub', s2, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', s2::text, true);
    set local role authenticated;
    if learn_is_admin() or learn_is_owner() or learn_admin_role() is not null then
      raise exception 'a plain Student reads as an Admin';
    end if;
    ok := false;
    begin perform learn_grant_admin(l1); exception when insufficient_privilege then ok := sqlerrm like 'Only the Owner%'; end;
    if not ok then raise exception 'a plain Student granted Admin'; end if;
    select count(*) into seen from learners;
    if seen <> 1 then raise exception 'a plain Student sees % Students, not 1', seen; end if;
    reset role;

    /* The Owner grants. */
    perform set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', owner_id::text, true);
    set local role authenticated;
    if not learn_is_owner() or not learn_is_admin() then raise exception 'the Owner does not read as Owner'; end if;
    perform learn_grant_admin(l1);
    perform learn_grant_admin(l1);                       -- twice is a no-op
    ok := false;
    begin perform learn_grant_admin(lnull); exception when check_violation then ok := true; end;
    if not ok then raise exception 'granted Admin to a Student with no sign-in'; end if;
    ok := false;
    begin perform learn_grant_admin(gen_random_uuid()); exception when no_data_found then ok := true; end;
    if not ok then raise exception 'granted Admin to nobody'; end if;
    reset role;
    select count(*) into n from learn_admins where user_id = s1 and role = 'admin';
    if n <> 1 then raise exception 'the grant did not land once'; end if;

    /* The Admin: reads everyone, grants no one, cannot touch the Owner. */
    perform set_config('request.jwt.claims', json_build_object('sub', s1, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', s1::text, true);
    set local role authenticated;
    if not learn_is_admin() or learn_is_owner() then raise exception 'a granted Admin reads wrongly'; end if;
    select count(*) into seen from learners;
    if seen <> total then raise exception 'an Admin sees % of % Students', seen, total; end if;
    select count(*) into seen from learn_admin_roster();
    if seen < 2 then raise exception 'the roster misses an Admin'; end if;
    ok := false;
    begin perform learn_grant_admin(l2); exception when insufficient_privilege then ok := sqlerrm like 'Only the Owner%'; end;
    if not ok then raise exception 'an Admin granted Admin'; end if;
    ok := false;
    begin perform learn_revoke_admin(l2); exception when insufficient_privilege then ok := sqlerrm like 'Only the Owner%'; end;
    if not ok then raise exception 'an Admin revoked Admin'; end if;

    /* A client cannot reach the table at all. */
    ok := false;
    begin perform 1 from learn_admins; exception when insufficient_privilege then ok := sqlerrm like '%learn_admins%'; end;
    if not ok then raise exception 'a client read learn_admins'; end if;
    ok := false;
    begin insert into learn_admins (user_id, role) values (s2, 'admin'); exception when insufficient_privilege then ok := sqlerrm like '%learn_admins%'; end;
    if not ok then raise exception 'a client wrote learn_admins'; end if;
    reset role;

    /* The Owner revokes the Admin, and cannot revoke the Owner. */
    perform set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', owner_id::text, true);
    set local role authenticated;
    ok := false;
    begin perform learn_grant_admin(lo); exception when check_violation then ok := true; end;
    if not ok then raise exception 'the Owner granted themselves Admin'; end if;
    ok := false;
    begin perform learn_revoke_admin(lo); exception when check_violation then ok := true; end;
    if not ok then raise exception 'the Owner was revoked'; end if;
    perform learn_revoke_admin(l1);
    reset role;
    select count(*) into n from learn_admins where user_id = s1;
    if n <> 0 then raise exception 'the revoke did not remove the Admin'; end if;

    /* A second Owner cannot exist. */
    ok := false;
    begin insert into learn_admins (user_id, role) values (s2, 'owner'); exception when unique_violation then ok := true; end;
    if not ok then raise exception 'a second Owner was created'; end if;

    raise exception 'learn_admins probe finished' using errcode = 'P0134';
  exception when sqlstate 'P0134' then null;
  end;

  /* Nothing leaked out of the rolled-back block. */
  select count(*) into n from learn_admins where role = 'owner';
  if n <> 1 then raise exception 'the Owner count changed during the probe'; end if;
  if exists (select 1 from learn_admins where role = 'admin' and user_id in (s1, s2)) then
    raise exception 'a probe Admin survived the rollback';
  end if;
end $$;

select verify_learn_isolation();

commit;
