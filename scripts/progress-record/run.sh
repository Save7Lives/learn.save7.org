#!/usr/bin/env bash
# Run the Progress Record SQL scenarios against a local Postgres that already has the
# Learn migrations replayed (see README.md). It never touches data: scenarios.sql
# creates its Students inside a rolled-back block and rolls the whole transaction back.
#
#   scripts/progress-record/run.sh postgresql://postgres@127.0.0.1:54617/learn
#   DATABASE_URL=postgresql://... scripts/progress-record/run.sh
#
# Exit status is 0 only if every scenario passed.
set -euo pipefail

url="${1:-${DATABASE_URL:-}}"
if [ -z "$url" ]; then
  echo "usage: $0 <DATABASE_URL>   (or set DATABASE_URL)" >&2
  exit 64
fi

# This is for a scratch replay. Production holds real Students, and the scenarios would
# be running against a database that is not theirs to try things in.
case "$url" in
  *supabase.co*|*supabase.com*|*pooler.*)
    echo "refusing to run against a hosted Supabase database; use a local replay (README.md)" >&2
    exit 65
    ;;
esac

here="$(cd "$(dirname "$0")" && pwd)"
exec psql "$url" --no-psqlrc --quiet --set ON_ERROR_STOP=1 --file "$here/scenarios.sql"
