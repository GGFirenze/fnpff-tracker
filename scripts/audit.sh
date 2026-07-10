#!/usr/bin/env bash
#
# Show the Fressnapf tracker audit log, newest first.
#
# Reads FNPFF_API_BASE + APP_PASSWORD from the automation config
# (~/.claude/fnpff-tracker/config.env) unless already set in the environment.
#
# Usage:
#   ./scripts/audit.sh              # all audit entries, newest first
#   ./scripts/audit.sh --automation # only entries written by the automation
#
set -euo pipefail

CONFIG="${FNPFF_CONFIG:-$HOME/.claude/fnpff-tracker/config.env}"
if [[ -z "${FNPFF_API_BASE:-}" || -z "${APP_PASSWORD:-}" ]] && [[ -f "$CONFIG" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$CONFIG"; set +a
fi

: "${FNPFF_API_BASE:?FNPFF_API_BASE not set (check $CONFIG)}"
: "${APP_PASSWORD:?APP_PASSWORD not set (check $CONFIG)}"

ONLY_AUTOMATION="no"
[[ "${1:-}" == "--automation" ]] && ONLY_AUTOMATION="yes"

FNPFF_API_BASE="$FNPFF_API_BASE" APP_PASSWORD="$APP_PASSWORD" \
ONLY_AUTOMATION="$ONLY_AUTOMATION" python3 <<'PY'
import sys, json, os, urllib.request

base = os.environ["FNPFF_API_BASE"].rstrip("/")
pw = os.environ["APP_PASSWORD"]
only_auto = os.environ.get("ONLY_AUTOMATION") == "yes"

try:
    req = urllib.request.Request(base + "/api/audit")
    req.add_header("Authorization", f"Bearer {pw}")
    with urllib.request.urlopen(req, timeout=30) as r:
        rows = json.loads(r.read().decode())
except Exception as e:
    print(f"Could not fetch audit log: {e}")
    sys.exit(1)

if only_auto:
    rows = [r for r in rows if r.get("changed_by") == "automation"]

rows.sort(key=lambda r: r.get("changed_at", ""), reverse=True)

label = "automation" if only_auto else "total"
print(f"{len(rows)} {label} audit entr" + ("y" if len(rows) == 1 else "ies") + "\n")
for r in rows[:40]:
    when = r.get("changed_at", "?")
    who = r.get("changed_by", "?")
    tid = r.get("ticket_id")
    field = r.get("field_changed")
    old = r.get("old_value")
    new = r.get("new_value")
    print(f"{when}  #{tid}  [{who}]  {field}: {old!r} -> {new!r}")
PY
