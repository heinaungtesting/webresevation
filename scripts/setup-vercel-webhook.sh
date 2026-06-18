#!/usr/bin/env bash
#
# setup-vercel-webhook.sh
#
# Validates the environment variables required by the
# /api/vercel-webhook route and (optionally) registers the webhook
# with Vercel via the Vercel REST API.
#
# Usage:
#   ./scripts/setup-vercel-webhook.sh                  # validate only
#   ./scripts/setup-vercel-webhook.sh --register       # also call Vercel API
#   ./scripts/setup-vercel-webhook.sh --generate-secret # generate a fresh secret
#
# Required env vars (in .env.local or exported in shell):
#   VERCEL_WEBHOOK_SECRET    HMAC-SHA1 secret (use --generate-secret)
#   VERCEL_PROJECT_NAME      e.g. sportsmatch-tokyo
#   TELEGRAM_BOT_TOKEN       from @BotFather
#   TELEGRAM_CHAT_ID         destination chat id
#   NEXT_PUBLIC_APP_URL      base URL the webhook will be exposed at
#
# Optional:
#   VERCEL_API_TOKEN         if --register, your Vercel personal token
#   VERCEL_TEAM_ID           if part of a team, the team id

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.local}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Load .env.local if it exists (without exporting comments / blank lines)
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

color() { printf "\033[%sm%s\033[0m\n" "$1" "$2"; }
ok()    { color "0;32" "  ✓ $1"; }
warn()  { color "0;33" "  ⚠ $1"; }
err()   { color "0;31" "  ✗ $1"; }
step()  { color "1;36" ""; color "1;36" "▶ $1"; }

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    err "Missing required env var: $name"
    MISSING=1
  else
    ok "$name is set"
  fi
}

MISSING=0
step "Checking required env vars"
require_env VERCEL_WEBHOOK_SECRET
require_env VERCEL_PROJECT_NAME
require_env TELEGRAM_BOT_TOKEN
require_env TELEGRAM_CHAT_ID
require_env NEXT_PUBLIC_APP_URL

if [[ "$MISSING" -eq 1 ]]; then
  err "Add the missing vars to $ENV_FILE and re-run."
  exit 1
fi

# Optionally generate a fresh secret
if [[ "${1:-}" == "--generate-secret" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    NEW_SECRET="$(openssl rand -hex 32)"
  else
    NEW_SECRET="$(head -c 32 /dev/urandom | xxd -p -c 32)"
  fi
  step "Generated new VERCEL_WEBHOOK_SECRET"
  echo "  $NEW_SECRET"
  echo
  echo "Add this to $ENV_FILE:"
  echo "  VERCEL_WEBHOOK_SECRET=$NEW_SECRET"
  echo
  echo "Then re-run without --generate-secret to continue setup."
  exit 0
fi

# Compute the webhook URL
WEBHOOK_URL="${NEXT_PUBLIC_APP_URL%/}/api/vercel-webhook"
step "Computed webhook URL"
echo "  $WEBHOOK_URL"
echo

# If --register is passed and VERCEL_API_TOKEN is set, register via API
if [[ "${1:-}" == "--register" ]]; then
  if [[ -z "${VERCEL_API_TOKEN:-}" ]]; then
    err "--register requires VERCEL_API_TOKEN (Vercel personal access token)"
    echo "  Get one at: https://vercel.com/account/tokens"
    exit 1
  fi

  step "Registering webhook with Vercel"

  TEAM_QS=""
  if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
    TEAM_QS="?teamId=${VERCEL_TEAM_ID}"
  fi

  # Vercel API: POST /v1/projects/{id}/webhooks
  # Project id can be looked up by name; for simplicity we accept VERCEL_PROJECT_ID.
  PROJECT_ID="${VERCEL_PROJECT_ID:-}"
  if [[ -z "$PROJECT_ID" ]]; then
    err "Set VERCEL_PROJECT_ID in $ENV_FILE (the project's id, not the name)."
    echo "  Find it: vercel projects ls, or look in Vercel dashboard → Settings → General"
    exit 1
  fi

  PAYLOAD=$(cat <<JSON
{
  "url": "${WEBHOOK_URL}",
  "events": [
    "deployment.succeeded",
    "deployment.failed",
    "deployment.canceled",
    "deployment.error"
  ],
  "secret": "${VERCEL_WEBHOOK_SECRET}"
}
JSON
)

  HTTP_CODE=$(curl -s -o /tmp/vercel-webhook-resp.json -w "%{http_code}" \
    -X POST "https://api.vercel.com/v1/projects/${PROJECT_ID}/webhooks${TEAM_QS}" \
    -H "Authorization: Bearer ${VERCEL_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

  if [[ "$HTTP_CODE" =~ ^2 ]]; then
    ok "Webhook registered with Vercel (HTTP $HTTP_CODE)"
    cat /tmp/vercel-webhook-resp.json | python3 -m json.tool 2>/dev/null | head -20 || cat /tmp/vercel-webhook-resp.json
  else
    err "Vercel API returned HTTP $HTTP_CODE"
    cat /tmp/vercel-webhook-resp.json
    exit 1
  fi
else
  step "Manual setup (no --register)"
  echo "  1. Open https://vercel.com/dashboard → your project → Settings → Git → Deploy Hooks (or Webhooks)"
  echo "  2. Click 'Create Webhook'"
  echo "  3. Set the URL:           $WEBHOOK_URL"
  echo "  4. Set the secret:        (value of VERCEL_WEBHOOK_SECRET above)"
  echo "  5. Subscribe to events:   deployment.succeeded, deployment.failed, deployment.canceled, deployment.error"
fi

step "Smoke test"
echo "  Run this to fire a signed sample payload at your local dev server:"
echo "    ./scripts/test-vercel-webhook-local.sh"
echo
echo "  Then watch Telegram for the deployment message."
