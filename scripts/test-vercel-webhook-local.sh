#!/usr/bin/env bash
#
# test-vercel-webhook-local.sh
#
# Fires a signed sample Vercel deployment event at /api/vercel-webhook
# and prints the response. Use this to verify the bridge works end-to-end
# without waiting for a real Vercel deployment.
#
# Usage:
#   ./scripts/test-vercel-webhook-local.sh                  # success event
#   ./scripts/test-vercel-webhook-local.sh failure          # failed event
#   ./scripts/test-vercel-webhook-local.sh wrong-project    # other-project filter test
#   ./scripts/test-vercel-webhook-local.sh boring           # deployment.created (skipped)
#   ./scripts/test-vercel-webhook-local.sh bad-sig          # 401 test
#   TARGET=http://localhost:3000 ./scripts/test-vercel-webhook-local.sh
#

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

ENV_FILE="${ENV_FILE:-.env.local}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

TARGET="${TARGET:-http://localhost:3000}"
SCENARIO="${1:-success}"

SECRET="${VERCEL_WEBHOOK_SECRET:-test-webhook-secret}"
PROJECT="${VERCEL_PROJECT_NAME:-sportsmatch-tokyo}"

case "$SCENARIO" in
  failure)
    EVENT_TYPE="deployment.failed"
    STATE="ERROR"
    URL_SUFFIX="sportsmatch-tokyo-FAIL.vercel.app"
    ERROR_MSG="Build failed: missing env var DATABASE_URL"
    COMMIT_MSG="feat: new feature that breaks the build"
    ;;
  wrong-project)
    EVENT_TYPE="deployment.succeeded"
    STATE="READY"
    URL_SUFFIX="some-other-project-xyz.vercel.app"
    ERROR_MSG=""
    COMMIT_MSG="fix: typo"
    PROJECT_OVERRIDE="some-other-project"
    ;;
  boring)
    EVENT_TYPE="deployment.created"
    STATE="BUILDING"
    URL_SUFFIX="sportsmatch-tokyo-boring.vercel.app"
    ERROR_MSG=""
    COMMIT_MSG="boring build event"
    ;;
  bad-sig)
    EVENT_TYPE="deployment.succeeded"
    STATE="READY"
    URL_SUFFIX="sportsmatch-tokyo-badsig.vercel.app"
    ERROR_MSG=""
    COMMIT_MSG="this should be rejected"
    BAD_SIG=1
    ;;
  success|*)
    EVENT_TYPE="deployment.succeeded"
    STATE="READY"
    URL_SUFFIX="sportsmatch-tokyo-test.vercel.app"
    ERROR_MSG=""
    COMMIT_MSG="fix: BUG-001 (smoke test from test-vercel-webhook-local.sh)"
    ;;
esac

PROJECT_NAME="${PROJECT_OVERRIDE:-$PROJECT}"

PAYLOAD=$(cat <<JSON
{
  "type": "${EVENT_TYPE}",
  "payload": {
    "deployment": {
      "id": "dpl_test_$(date +%s)",
      "url": "${URL_SUFFIX}",
      "state": "${STATE}",
      "meta": {
        "githubCommitSha": "abc1234567890abcdef",
        "githubCommitRef": "main",
        "githubCommitMessage": "${COMMIT_MSG}"
      },
      "creator": { "username": "heinaungtesting" }$( [[ -n "$ERROR_MSG" ]] && printf ',\n      "errorMessage": "%s"' "$ERROR_MSG" )
    },
    "project": { "name": "${PROJECT_NAME}" }
  }
}
JSON
)

SIG=$(printf '%s' "$PAYLOAD" | openssl dgst -sha1 -hmac "$SECRET" -hex | awk '{print $2}')

if [[ "${BAD_SIG:-0}" == "1" ]]; then
  SIG="0000000000000000000000000000000000000000"
fi

echo "→ Target:  $TARGET/api/vercel-webhook"
echo "→ Scenario: $SCENARIO"
echo "→ Event:   $EVENT_TYPE  project=$PROJECT_NAME  state=$STATE"
echo "→ Sig:     ${SIG:0:16}..."
echo

HTTP_CODE=$(curl -s -o /tmp/vercel-webhook-resp.json -w "%{http_code}" \
  -X POST "$TARGET/api/vercel-webhook" \
  -H "Content-Type: application/json" \
  -H "x-vercel-signature: $SIG" \
  --data "$PAYLOAD")

echo "← HTTP $HTTP_CODE"
python3 -m json.tool < /tmp/vercel-webhook-resp.json 2>/dev/null || cat /tmp/vercel-webhook-resp.json
echo
