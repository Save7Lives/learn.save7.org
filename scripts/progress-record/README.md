# Progress Record SQL scenarios

Re-runnable behavioural checks for the Progress Record read module
(`learn_progress_record` / `learn_progress_records`, ADR 0001). The TypeScript half is
`npm run test` (vitest); this is the SQL half. Both name the same cases, the
`CASE_NAME`s in `src/lib/__fixtures__/progress-records.ts` and in `scenarios.sql`.

`scenarios.sql` is the behavioural part of the probe at the end of migration 0138, kept
so it can be run again after a later change. It does not define or copy any function, and
the migration's structural checks (who holds EXECUTE, security definer) stay in 0138.

## Run

```sh
scripts/progress-record/run.sh postgresql://postgres@127.0.0.1:54617/learn
```

Safe to repeat. It makes its Students, attempts, Sittings and Certificates in a rolled-back
block inside a transaction that is rolled back too, and fails if any row survives. It prints
one `PASS` line per scenario and exits non-zero on the first failure, naming the scenario.
It refuses a hosted Supabase URL.

## The database it needs

A local Postgres with the Learn migrations replayed from the save7-os repo:
`/Users/zubayrparak/Desktop/Save7 Course/save7-os/supabase/migrations/`. There is no local
Supabase; Homebrew Postgres 17 does, with stubs.

1. `export LC_ALL=C`, or `pg_ctl start` dies with "postmaster became multithreaded".
2. `initdb -D <dir> -U postgres -A trust`, then start it TCP-only:
   `pg_ctl -D <dir> -o "-p <port> -k '' -c listen_addresses=127.0.0.1" start`. The `-k ''`
   matters when `<dir>` is a long path (the Unix socket path would exceed 103 bytes).
3. Load a stubs file first: the `anon`, `authenticated` and `service_role` roles; an `auth`
   schema with `auth.users` and `auth.uid()` / `auth.jwt()` / `auth.role()` reading
   `request.jwt.claim.sub` and `request.jwt.claims`; minimal `people`, `branches` and
   `volunteers` tables; the `app_*` helpers the ops migrations define
   (`app_person_id`, `app_role`, `app_is_finance`, `app_is_staff`, `app_volunteer_id`,
   `app_is_volunteer`); the `volunteer_quiz` enum; and Supabase's default privileges
   (`alter default privileges in schema public grant all on tables, sequences, functions to
   anon, authenticated, service_role`), which a plain Postgres lacks.
4. Replay in order: 0091 0092 0093 0094 0095 0096 0097 0098 0101 0109 0110 0111 0112 0113
   0114 0115 0116 0117 0118 0120 0121 0122 0126 0127 0128 0129 0130 0131 0132 0133 0134
   0135 0136 0137 0138.
   - Skip the ops migrations (0088, 0099, 0100, 0102 to 0108, 0123 to 0125); they need ops
     tables.
   - Leave out 0119, which does not replay.
   - Comment out `select verify_vol_views();` in any migration that has it.
   - **Include 0111 and 0117, the consent and age gates.** Leaving 0117 out once made a
     broken probe pass. `scenarios.sql` checks for both gates and refuses to run without
     them.
   - The content migrations are needed too: the scenarios sit two whole Levels, so they
     need Stage Quiz banks of ten or more questions.

Roles are cluster-wide, so a second database in the same cluster cannot be re-stubbed; start
a fresh `initdb` per replay.
