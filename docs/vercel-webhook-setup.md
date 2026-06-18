# Vercel → Telegram Webhook Bridge

This document explains how to wire Vercel deployment events into a Telegram
chat via the `/api/vercel-webhook` route.

## What it does

When Vercel finishes (or fails) a deployment of the configured project, it
POSTs a signed event to `/api/vercel-webhook`. The route:

1. Verifies the `x-vercel-signature` HMAC-SHA1 against `VERCEL_WEBHOOK_SECRET`
2. Filters out events for other projects (only forwards if the project name
   matches `VERCEL_PROJECT_NAME`)
3. Filters out boring event types (only forwards `deployment.succeeded`,
   `deployment.failed`, `deployment.canceled`, `deployment.error`)
4. Formats a Markdown summary and sends it to the configured Telegram chat

If any step fails the route returns an appropriate HTTP status and a JSON
body — see [Behaviour](#behaviour) below.

## Environment variables

Add these to `.env.local` (and to your Vercel project's env settings):

| Variable                | Required | Example                              | Notes                                                                |
| ----------------------- | -------- | ------------------------------------ | -------------------------------------------------------------------- |
| `VERCEL_WEBHOOK_SECRET` | yes      | `openssl rand -hex 32` output        | HMAC-SHA1 secret. The script `--generate-secret` makes one for you.  |
| `VERCEL_PROJECT_NAME`   | yes      | `sportsmatch-tokyo`                  | Only events for this exact project name are forwarded.               |
| `TELEGRAM_BOT_TOKEN`    | yes      | from `@BotFather`                    | If missing, the route still 200s but logs a warning and skips send.  |
| `TELEGRAM_CHAT_ID`      | yes      | `8130111030`                         | Destination chat id. Can be negative for groups.                     |
| `NEXT_PUBLIC_APP_URL`   | yes      | `https://sportsmatch.tokyo`          | Used to compute the webhook URL the Vercel dashboard will show.       |
| `VERCEL_API_TOKEN`      | only with `--register` | from vercel.com/account/tokens | Personal access token. Required scope: `Full Account` or webhook write on the project. |
| `VERCEL_PROJECT_ID`     | only with `--register` | `prj_abc123`                  | The project's id, not its name.                                      |
| `VERCEL_TEAM_ID`        | optional | `team_abc123`                        | Only if the project lives under a team.                              |

## Setup

### 1. Validate (dry run)

```bash
./scripts/setup-vercel-webhook.sh
```

This checks that all required env vars are present, prints the webhook URL,
and gives you manual-setup steps. No API calls.

### 2. Generate a fresh secret (optional)

```bash
./scripts/setup-vercel-webhook.sh --generate-secret
```

This prints a fresh 64-char hex secret and tells you where to put it.

### 3. Register the webhook with Vercel

Two ways:

**A. Let the script do it (recommended)**

```bash
# Add to .env.local:
#   VERCEL_API_TOKEN=...
#   VERCEL_PROJECT_ID=prj_abc123
#   VERCEL_TEAM_ID=team_abc123   # if applicable

./scripts/setup-vercel-webhook.sh --register
```

This calls `POST https://api.vercel.com/v1/projects/{id}/webhooks` with the
right URL, secret, and event list.

**B. Manual setup**

1. Open the Vercel dashboard → your project → Settings → Webhooks
2. Click **Create Webhook**
3. URL: `${NEXT_PUBLIC_APP_URL}/api/vercel-webhook`
4. Secret: the value of `VERCEL_WEBHOOK_SECRET`
5. Events: `deployment.succeeded`, `deployment.failed`,
   `deployment.canceled`, `deployment.error`

## Local smoke test

After `next dev` is running on `localhost:3000`:

```bash
# Successful deploy
./scripts/test-vercel-webhook-local.sh

# Failed deploy
./scripts/test-vercel-webhook-local.sh failure

# Filter tests
./scripts/test-vercel-webhook-local.sh wrong-project
./scripts/test-vercel-webhook-local.sh boring

# Auth test (must return 401)
./scripts/test-vercel-webhook-local.sh bad-sig
```

Each fires a signed payload at the local dev server and prints the JSON
response. A successful deploy should also produce a Telegram message.

## Behaviour

| Condition                                | Status | Body                                                                          |
| ---------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Missing or wrong `x-vercel-signature`    | `401`  | `{ "error": "invalid signature" }`                                            |
| Request body is not JSON                 | `400`  | `{ "error": "invalid JSON" }`                                                 |
| `VERCEL_WEBHOOK_SECRET` not configured   | `500`  | `{ "error": "webhook not configured" }`                                       |
| Event is for another project             | `200`  | `{ "received": true, "skipped": true, "reason": "project mismatch: ..." }`    |
| Event type not interesting               | `200`  | `{ "received": true, "skipped": true, "reason": "event type ... not in ..." }` |
| `TELEGRAM_BOT_TOKEN` missing             | `200`  | `{ "received": true, "telegramSent": false, ... }` (warns to server logs)     |
| Telegram returns non-2xx                 | `200`  | `{ "received": true, "telegramSent": false, ... }` (logs the failure)         |
| Everything OK                            | `200`  | `{ "received": true, "telegramSent": true, "type": ..., "project": ... }`      |

We return `200` for "expected" no-ops (skipped event, missing Telegram token)
so Vercel's retry logic doesn't fire on our own filter decisions. Only auth
failures and parsing errors return non-2xx.

## Message format

For a successful deployment:

```
✅ *Vercel deployment.succeeded* — `sportsmatch-tokyo`
State: *READY*
Branch: `main` • Commit: `abc1234`
> fix: BUG-001
URL: sportsmatch-tokyo-abc123.vercel.app
```

For a failed deployment:

```
❌ *Vercel deployment.failed* — `sportsmatch-tokyo`
State: *ERROR*
Branch: `main` • Commit: `abc1234`
> feat: new feature that breaks the build
URL: sportsmatch-tokyo-fail.vercel.app
*Error:* Build failed: missing env var DATABASE_URL
```

## Tests

```bash
./node_modules/.bin/vitest run tests/api/vercel-webhook.test.ts
```

9 tests, covering signature verification (missing/wrong), JSON parsing,
project filter, event-type filter, message formatting for success and
failure, and graceful behaviour when `TELEGRAM_BOT_TOKEN` is unset.

## Troubleshooting

**Telegram message never arrives.**

- Check server logs: `[vercel-webhook] Telegram POST failed status=...`
- Verify the bot is in the chat: open the chat, send `/start@your_bot`
- Confirm `TELEGRAM_CHAT_ID` matches. Use `getUpdates` to find it:
  ```bash
  curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates"
  ```

**Vercel returns 401.**

- The secret in `VERCEL_WEBHOOK_SECRET` must exactly match the secret set
  on the webhook in the Vercel dashboard. No whitespace, no trailing newline.

**Events for other projects get forwarded.**

- Confirm `VERCEL_PROJECT_NAME` matches the Vercel project name exactly
  (case-sensitive). The dashboard's project name is what's in
  `payload.project.name`.

**Vercel shows "we couldn't reach your webhook".**

- The URL must be reachable from the public internet. If you're behind a
  VPN, expose it via a tunnel or deploy to a public host first.
