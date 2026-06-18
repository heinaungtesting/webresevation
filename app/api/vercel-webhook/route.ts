/**
 * Vercel deployment webhook → Telegram bridge.
 *
 * Configure this URL in your Vercel project:
 *   https://<your-domain>/api/vercel-webhook
 *
 * Required env vars:
 *   VERCEL_WEBHOOK_SECRET  — HMAC-SHA1 secret set when creating the webhook
 *   VERCEL_PROJECT_NAME    — only forward events for this project name
 *   TELEGRAM_BOT_TOKEN     — your Telegram bot token (from @BotFather)
 *   TELEGRAM_CHAT_ID       — destination chat id (numeric, can be negative for groups)
 *
 * Behaviour:
 *   - Verifies `x-vercel-signature` HMAC-SHA1 of the raw body
 *   - 401 on missing/wrong signature
 *   - 400 on unparseable JSON
 *   - Skips events for OTHER projects (returns {skipped:true, reason: "project ..."})
 *   - Skips boring event types (deployment.created, etc.)
 *   - Forwards deployment.succeeded / deployment.failed / deployment.canceled to Telegram
 *   - Missing TELEGRAM_BOT_TOKEN: still returns 200 (no Telegram call, logs warning)
 */

import { NextResponse } from "next/server";
import crypto from "node:crypto";

// Run on the Node.js runtime — we need node:crypto and a stable fetch.
export const runtime = "nodejs";
// Always read the raw body fresh — never cache.
export const dynamic = "force-dynamic";

const INTERESTING_EVENTS = new Set<string>([
  "deployment.succeeded",
  "deployment.failed",
  "deployment.canceled",
  "deployment.error",
]);

const FAILURE_STATES = new Set<string>([
  "ERROR",
  "FAILED",
  "CANCELED",
  "CANCELLED",
]);

/**
 * Constant-time HMAC-SHA1 verification of the Vercel webhook signature.
 *
 * Vercel sends `x-vercel-signature: <hex>` computed as HMAC-SHA1(secret, rawBody).
 * We compare in constant time to avoid timing attacks, and we require both
 * buffers to be the same length before comparing.
 */
function verifySignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const expectedHex = crypto
    .createHmac("sha1", secret)
    .update(rawBody)
    .digest("hex");

  let sigBuf: Buffer;
  let expBuf: Buffer;
  try {
    sigBuf = Buffer.from(signature, "hex");
    expBuf = Buffer.from(expectedHex, "hex");
  } catch {
    return false;
  }
  if (sigBuf.length !== expBuf.length) return false;
  try {
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

interface VercelDeploymentMeta {
  githubCommitSha?: string;
  githubCommitRef?: string;
  githubCommitMessage?: string;
}

interface VercelDeployment {
  id?: string;
  url?: string;
  state?: string;
  meta?: VercelDeploymentMeta;
  errorMessage?: string;
  creator?: { username?: string };
}

interface VercelEventPayload {
  deployment?: VercelDeployment;
  project?: { name?: string };
}

interface VercelEvent {
  type?: string;
  payload?: VercelEventPayload;
}

function shortSha(sha: string | undefined): string {
  if (!sha) return "unknown";
  return sha.slice(0, 7);
}

/**
 * Format the deployment event as a Telegram-friendly Markdown message.
 * Emoji: ✅ on success, ❌ on failure/cancel.
 */
function formatDeploymentMessage(
  type: string,
  payload: VercelEventPayload | undefined,
  projectName: string | undefined,
): string {
  const dep = payload?.deployment ?? {};
  const meta = dep.meta ?? {};
  const sha = shortSha(meta.githubCommitSha);
  const branch = meta.githubCommitRef ?? "unknown";
  const url = dep.url ?? "";
  const state = (dep.state ?? "").toUpperCase();
  const commitMsg = meta.githubCommitMessage ?? "";
  const errorMsg = dep.errorMessage;
  const project = projectName ?? payload?.project?.name ?? "unknown";

  const isFailure = FAILURE_STATES.has(state);
  const emoji = isFailure ? "❌" : "✅";
  const statusText = state || (isFailure ? "FAILED" : "READY");

  const lines: string[] = [
    `${emoji} *Vercel ${type}* — \`${project}\``,
    `State: *${statusText}*`,
    `Branch: \`${branch}\` • Commit: \`${sha}\``,
  ];
  if (commitMsg) lines.push(`> ${commitMsg}`);
  if (url) lines.push(`URL: ${url}`);
  if (errorMsg) lines.push(`*Error:* ${errorMsg}`);

  return lines.join("\n");
}

async function postTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token) {
    console.warn(
      "[vercel-webhook] TELEGRAM_BOT_TOKEN not set — skipping Telegram post",
    );
    return false;
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "<no body>");
      console.error(
        `[vercel-webhook] Telegram POST failed status=${res.status} body=${body}`,
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[vercel-webhook] Telegram POST threw:", err);
    return false;
  }
}

export async function POST(req: Request) {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[vercel-webhook] VERCEL_WEBHOOK_SECRET not set — refusing request",
    );
    return NextResponse.json(
      { error: "webhook not configured" },
      { status: 500 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-vercel-signature");

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json(
      { error: "invalid signature" },
      { status: 401 },
    );
  }

  let event: VercelEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const expectedProject = process.env.VERCEL_PROJECT_NAME;
  const projectName = event.payload?.project?.name;
  if (expectedProject && projectName !== expectedProject) {
    return NextResponse.json(
      {
        received: true,
        skipped: true,
        reason: `project mismatch: got "${projectName ?? "<missing>"}", expected "${expectedProject}"`,
      },
      { status: 200 },
    );
  }

  if (!event.type || !INTERESTING_EVENTS.has(event.type)) {
    return NextResponse.json(
      {
        received: true,
        skipped: true,
        reason: `event type "${event.type ?? "<missing>"}" not in interesting set`,
      },
      { status: 200 },
    );
  }

  const text = formatDeploymentMessage(event.type, event.payload, projectName);
  const telegramSent = await postTelegram(text);

  return NextResponse.json(
    {
      received: true,
      telegramSent,
      type: event.type,
      project: projectName,
    },
    { status: 200 },
  );
}
