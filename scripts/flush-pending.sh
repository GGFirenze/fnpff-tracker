#!/usr/bin/env bash
#
# Replay the Fressnapf pending-sync queue against the live tracker API.
#
# The scheduled automation appends one JSON line per change it could NOT push
# (API down / write failed) to ~/.claude/fnpff-tracker/pending-sync.jsonl.
# This script replays those changes once the API is healthy again, with dedup
# so it never re-creates a ticket the automation already back-filled.
#
# Reads FNPFF_API_BASE + APP_PASSWORD from the automation config
# (~/.claude/fnpff-tracker/config.env) unless already set in the environment.
#
# Usage:
#   ./scripts/flush-pending.sh            # replay the queue
#   ./scripts/flush-pending.sh --dry-run  # show what WOULD happen, write nothing
#
# Queue line formats (one JSON object per line):
#   {"op":"create","payload":{...POST body...},"slack_permalink":"<optional>"}
#   {"op":"update","id":<id>,"updates":{...},"audit":[{"field_changed":..,"old_value":..,"new_value":..}]}
#
set -euo pipefail

CONFIG="${FNPFF_CONFIG:-$HOME/.claude/fnpff-tracker/config.env}"
if [[ -z "${FNPFF_API_BASE:-}" || -z "${APP_PASSWORD:-}" ]] && [[ -f "$CONFIG" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$CONFIG"; set +a
fi

: "${FNPFF_API_BASE:?FNPFF_API_BASE not set (check $CONFIG)}"
: "${APP_PASSWORD:?APP_PASSWORD not set (check $CONFIG)}"

QUEUE_PATH="${FNPFF_QUEUE:-$HOME/.claude/fnpff-tracker/pending-sync.jsonl}"
DRY_RUN="no"
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN="yes"

FNPFF_API_BASE="$FNPFF_API_BASE" APP_PASSWORD="$APP_PASSWORD" \
QUEUE_PATH="$QUEUE_PATH" DRY_RUN="$DRY_RUN" python3 <<'PY'
import os, sys, json, urllib.request, urllib.error, datetime

base = os.environ["FNPFF_API_BASE"].rstrip("/")
pw = os.environ["APP_PASSWORD"]
queue_path = os.environ["QUEUE_PATH"]
dry = os.environ.get("DRY_RUN") == "yes"

def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method)
    req.add_header("Authorization", f"Bearer {pw}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read().decode()
        return r.status, (json.loads(raw) if raw.strip() else None)

# 1. Health check — never touch the queue if the API is unhealthy.
try:
    status, board = api("GET", "/api/tickets")
except Exception as e:
    print(f"API unreachable ({e}). Nothing flushed; queue left intact.")
    sys.exit(1)
if status >= 300:
    print(f"API unhealthy (HTTP {status}). Nothing flushed; queue left intact.")
    sys.exit(1)

board = board or []
by_zd = {str(t["zendesk_ticket_id"]): t for t in board if t.get("zendesk_ticket_id")}
def on_board_by_slack(perma):
    return any(perma and perma in (t.get("notes") or "") for t in board)

# 2. Load the queue.
if not os.path.exists(queue_path):
    print("No pending-sync queue found. Nothing to flush.")
    sys.exit(0)
lines = [l for l in open(queue_path).read().splitlines() if l.strip()]
if not lines:
    print("Pending-sync queue is empty. Nothing to flush.")
    sys.exit(0)

print(f"{len(lines)} queued item(s){'  [DRY RUN]' if dry else ''}\n")

remaining, archive = [], []
applied = skipped = failed = 0

for raw in lines:
    try:
        item = json.loads(raw)
    except Exception:
        print("  ! unparseable line — left in queue")
        remaining.append(raw); failed += 1; continue

    op = item.get("op")
    try:
        if op == "create":
            payload = item.get("payload", {})
            topic = payload.get("topic", "(no topic)")
            zd = payload.get("zendesk_ticket_id")
            perma = item.get("slack_permalink")
            if zd and str(zd) in by_zd:
                print(f"  = skip (already on board via #{zd}): {topic}")
                skipped += 1; archive.append({**item, "_result": "skipped_dup_zd"}); continue
            if perma and on_board_by_slack(perma):
                print(f"  = skip (already on board via Slack link): {topic}")
                skipped += 1; archive.append({**item, "_result": "skipped_dup_slack"}); continue
            if dry:
                print(f"  + WOULD create: {topic}")
            else:
                st, resp = api("POST", "/api/tickets", payload)
                if st >= 300:
                    raise RuntimeError(f"POST HTTP {st}: {resp}")
                print(f"  + created: {topic}")
                if isinstance(resp, dict):
                    board.append(resp)
                    if resp.get("zendesk_ticket_id"):
                        by_zd[str(resp["zendesk_ticket_id"])] = resp
                archive.append({**item, "_result": "created"})
            applied += 1

        elif op == "update":
            tid = item.get("id")
            updates = item.get("updates", {})
            if dry:
                print(f"  ~ WOULD update #{tid}: {list(updates.keys())}")
            else:
                st, resp = api("PATCH", "/api/tickets", {"id": tid, "updates": updates})
                if st >= 300:
                    raise RuntimeError(f"PATCH HTTP {st}: {resp}")
                for a in item.get("audit", []):
                    api("POST", "/api/audit", {
                        "ticket_id": tid,
                        "field_changed": a.get("field_changed"),
                        "old_value": a.get("old_value"),
                        "new_value": a.get("new_value"),
                        "changed_by": a.get("changed_by", "automation"),
                    })
                print(f"  ~ updated #{tid}: {list(updates.keys())}")
                archive.append({**item, "_result": "updated"})
            applied += 1

        else:
            print(f"  ! unknown op {op!r} — left in queue")
            remaining.append(raw); failed += 1

    except Exception as e:
        print(f"  ! failed ({op}): {e} — left in queue")
        remaining.append(raw); failed += 1

# 3. Persist results (unless dry run).
if not dry:
    with open(queue_path, "w") as f:
        if remaining:
            f.write("\n".join(remaining) + "\n")
    if archive:
        apath = queue_path[:-6] + ".archive.jsonl" if queue_path.endswith(".jsonl") else queue_path + ".archive"
        stamp = datetime.datetime.now().isoformat(timespec="seconds")
        with open(apath, "a") as f:
            for a in archive:
                f.write(json.dumps({**a, "_flushed_at": stamp}) + "\n")

print(f"\nApplied {applied}, skipped {skipped} (already on board), {failed} left in queue.")
PY
