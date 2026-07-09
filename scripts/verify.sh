#!/usr/bin/env bash
#
# Fressnapf tracker health check.
#
# Reads FNPFF_API_BASE + APP_PASSWORD from the automation config
# (~/.claude/fnpff-tracker/config.env) unless already set in the environment,
# then probes the live API and tells you exactly what's working.
#
# Usage:
#   ./scripts/verify.sh          # check auth + read endpoints
#   ./scripts/verify.sh --seed   # ALSO create tables + load the 12 seed tickets
#                                 # (destructive: /api/seed drops existing tables)
#
set -euo pipefail

CONFIG="${FNPFF_CONFIG:-$HOME/.claude/fnpff-tracker/config.env}"
if [[ -z "${FNPFF_API_BASE:-}" || -z "${APP_PASSWORD:-}" ]] && [[ -f "$CONFIG" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$CONFIG"; set +a
fi

: "${FNPFF_API_BASE:?Set FNPFF_API_BASE (or fill in $CONFIG)}"
: "${APP_PASSWORD:?Set APP_PASSWORD (or fill in $CONFIG)}"

BASE="${FNPFF_API_BASE%/}"
AUTH=(-H "Authorization: Bearer $APP_PASSWORD" -H "Content-Type: application/json")

echo "Base: $BASE"
echo

status() { curl -s -o /tmp/fnpff_body.txt -w "%{http_code}" "$@"; }

# 1) auth (does not touch the DB)
code=$(status -X POST "$BASE/api/auth" -H "Content-Type: application/json" -d "{\"password\":\"$APP_PASSWORD\"}")
if [[ "$code" == "200" ]]; then
  echo "✅ /api/auth        200  — password correct, app deployed"
else
  echo "❌ /api/auth        $code  — $(cat /tmp/fnpff_body.txt)"
  echo "   App is not reachable or the password is wrong. Fix this first."
  exit 1
fi

# 2) tickets (needs Turso env vars)
code=$(status "${AUTH[@]}" "$BASE/api/tickets")
if [[ "$code" == "200" ]]; then
  count=$(grep -o '"id"' /tmp/fnpff_body.txt | wc -l | tr -d ' ')
  echo "✅ /api/tickets     200  — DB reachable, $count ticket(s) on the board"
  TICKETS_OK=1
else
  echo "❌ /api/tickets     $code  — $(head -c 200 /tmp/fnpff_body.txt)"
  echo "   The Turso env vars (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN) are"
  echo "   almost certainly missing or wrong in Vercel. Add them, redeploy, re-run."
  TICKETS_OK=0
  count=0
fi

# 3) audit
code=$(status "${AUTH[@]}" "$BASE/api/audit?limit=1")
[[ "$code" == "200" ]] && echo "✅ /api/audit       200" || echo "❌ /api/audit       $code"

echo
if [[ "${TICKETS_OK:-0}" == "1" && "$count" == "0" ]]; then
  echo "Board is empty. Seed it with:  ./scripts/verify.sh --seed"
fi

# 4) optional seed
if [[ "${1:-}" == "--seed" ]]; then
  if [[ "${TICKETS_OK:-0}" != "1" ]]; then
    echo "Refusing to seed — /api/tickets is not healthy yet."
    exit 1
  fi
  echo
  read -r -p "This DROPS and recreates the tables, loading 12 seed tickets. Continue? [y/N] " yn
  [[ "$yn" == "y" || "$yn" == "Y" ]] || { echo "Aborted."; exit 0; }
  code=$(status -X POST "${AUTH[@]}" "$BASE/api/seed")
  echo "seed → HTTP $code: $(cat /tmp/fnpff_body.txt)"
fi
