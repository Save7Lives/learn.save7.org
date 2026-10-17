do $$ begin create role anon nologin; exception when duplicate_object then null; end $$; do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$; do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
do $$ begin create role authenticator login noinherit; exception when duplicate_object then null; end $$;
grant anon, authenticated, service_role to authenticator;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', ''))::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.role() returns text language sql stable as $$ select 'authenticated' $$;
create table people (id text primary key, email text, app_role text default 'member', user_id uuid, branch_id text, name text);
create table branches (id text primary key);
create table volunteers (id uuid primary key default gen_random_uuid(), user_id uuid, email text, login_email text, active boolean not null default true);
create function app_person_id() returns text language sql stable security definer as $$ select id from people where user_id = auth.uid() $$;
create function app_role() returns text language sql stable security definer as $$ select app_role from people where user_id = auth.uid() $$;
create function app_branch_id() returns text language sql stable as $$ select null::text $$;
create function app_volunteer_id() returns uuid language sql stable as $$ select null::uuid $$;
create function app_is_volunteer() returns boolean language sql stable as $$ select false $$;
create function app_is_staff() returns boolean language sql stable security definer as $$ select app_person_id() is not null $$;
create function app_can_read_org() returns boolean language sql stable as $$ select app_is_staff() $$;
create function app_is_finance() returns boolean language sql stable as $$ select false $$;
create type volunteer_quiz as enum ('clinical','basics');

-- Supabase's default privileges: every object a migration creates is reachable by
-- the API roles, and row level security (or an explicit revoke) is the boundary.
grant usage on schema public, auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
