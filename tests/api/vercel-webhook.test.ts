/**
 * Vercel webhook → Telegram bridge — regression test.
 *
 * Source: Hein's Vercel integration request (Part B: webhooks).
 *
 * Tests cover:
 *  - 401 on missing or wrong HMAC-SHA1 signature
 *  - 200 on valid signature + parseable JSON
 *  - Filter: events for OTHER projects are skipped
 *  - Filter: boring event types (deployment.created, etc.) are skipped
 *  - Telegram POST happens on interesting events with correct payload
 *  - Missing TELEGRAM_BOT_TOKEN: handler still returns 200 (don't crash, just log)
 *  - The formatted message includes branch, commit, URL, state emoji
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "node:crypto";

// Set env BEFORE importing the route
const WEBHOOK_SECRET = "test-webhook-secret-abc";
const TELEGRAM_BOT_TOKEN = "test-tg-token-123";
const TELEGRAM_CHAT_ID = "8130111030";
process.env.VERCEL_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.TELEGRAM_BOT_TOKEN = TELEGRAM_BOT_TOKEN;
process.env.TELEGRAM_CHAT_ID = TELEGRAM_CHAT_ID;
process.env.VERCEL_PROJECT_NAME = "sportsmatch-tokyo";

// Mock fetch so we can assert the Telegram call
const fetchMock = vi.fn();
global.fetch = fetchMock as any;

import { POST } from "@/app/api/vercel-webhook/route";

function makeSignature(body: string, secret = WEBHOOK_SECRET): string {
  return crypto.createHmac("sha1", secret).update(body).digest("hex");
}

function makeRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/vercel-webhook", {
    method: "POST",
    headers,
    body,
  });
}

const baseDeployment = {
  id: "dpl_abc123",
  url: "sportsmatch-tokyo-abc123.vercel.app",
  state: "READY",
  meta: {
    githubCommitSha: "abc1234567890",
    githubCommitRef: "main",
    githubCommitMessage: "fix: BUG-001",
  },
  creator: { username: "heinaungtesting" },
  project: "sportsmatch-tokyo",
};

describe("POST /api/vercel-webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({ ok: true, text: async () => "ok" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when signature header is missing", async () => {
    const body = JSON.stringify({ type: "deployment.succeeded" });
    const res = await POST(makeRequest(body) as any);
    expect(res.status).toBe(401);
  });

  it("returns 401 when signature is wrong", async () => {
    const body = JSON.stringify({ type: "deployment.succeeded" });
    const res = await POST(
      makeRequest(body, { "x-vercel-signature": "deadbeef" }) as any
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 on valid signature + deployment.succeeded", async () => {
    const event = {
      type: "deployment.succeeded",
      payload: { deployment: baseDeployment, project: { name: "sportsmatch-tokyo" } },
    };
    const body = JSON.stringify(event);
    const sig = makeSignature(body);
    const res = await POST(
      makeRequest(body, { "x-vercel-signature": sig }) as any
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
    expect(data.telegramSent).toBe(true);
  });

  it("skips events for OTHER projects", async () => {
    const event = {
      type: "deployment.succeeded",
      payload: { deployment: baseDeployment, project: { name: "some-other-project" } },
    };
    const body = JSON.stringify(event);
    const res = await POST(
      makeRequest(body, { "x-vercel-signature": makeSignature(body) }) as any
    );
    const data = await res.json();
    expect(data.skipped).toBe(true);
    expect(data.reason).toMatch(/project/i);
    expect(fetchMock).not.toHaveBeenCalled(); // no Telegram POST
  });

  it("skips boring event types (deployment.created, etc.)", async () => {
    const event = {
      type: "deployment.created",
      payload: { deployment: baseDeployment, project: { name: "sportsmatch-tokyo" } },
    };
    const body = JSON.stringify(event);
    const res = await POST(
      makeRequest(body, { "x-vercel-signature": makeSignature(body) }) as any
    );
    const data = await res.json();
    expect(data.skipped).toBe(true);
    expect(data.reason).toMatch(/event type/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to Telegram with the formatted message for deployment.failed", async () => {
    const event = {
      type: "deployment.failed",
      payload: {
        deployment: { ...baseDeployment, state: "ERROR", errorMessage: "Build failed: missing env var FOO" },
        project: { name: "sportsmatch-tokyo" },
      },
    };
    const body = JSON.stringify(event);
    const res = await POST(
      makeRequest(body, { "x-vercel-signature": makeSignature(body) }) as any
    );
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain("api.telegram.org");
    expect(url).toContain(TELEGRAM_BOT_TOKEN);
    const sentBody = JSON.parse(opts.body);
    expect(sentBody.chat_id).toBe(TELEGRAM_CHAT_ID);
    expect(sentBody.text).toMatch(/❌/); // failure emoji
    expect(sentBody.text).toMatch(/main/); // branch
    expect(sentBody.text).toMatch(/abc1234/); // short SHA
    expect(sentBody.text).toMatch(/missing env var FOO/); // error message
  });

  it("includes commit short SHA, branch, and URL in the message", async () => {
    const event = {
      type: "deployment.succeeded",
      payload: { deployment: baseDeployment, project: { name: "sportsmatch-tokyo" } },
    };
    const body = JSON.stringify(event);
    const res = await POST(
      makeRequest(body, { "x-vercel-signature": makeSignature(body) }) as any
    );
    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.text).toContain("✅");
    expect(sentBody.text).toContain("`main`");
    expect(sentBody.text).toContain("`abc1234`");
    expect(sentBody.text).toContain("sportsmatch-tokyo-abc123.vercel.app");
  });

  it("handles missing TELEGRAM_BOT_TOKEN gracefully (returns 200, no fetch)", async () => {
    const savedToken = process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_BOT_TOKEN;
    // Re-import the route with the env unset — easier: just test the existing
    // route still returns 200 (it should, but skip the Telegram call).
    // We mock console.warn to avoid noise.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const event = {
      type: "deployment.succeeded",
      payload: { deployment: baseDeployment, project: { name: "sportsmatch-tokyo" } },
    };
    const body = JSON.stringify(event);
    const res = await POST(
      makeRequest(body, { "x-vercel-signature": makeSignature(body) }) as any
    );
    process.env.TELEGRAM_BOT_TOKEN = savedToken;
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.telegramSent).toBe(false);
    warn.mockRestore();
  });

  it("returns 400 on invalid JSON", async () => {
    const body = "{not json";
    const res = await POST(
      makeRequest(body, { "x-vercel-signature": makeSignature(body) }) as any
    );
    expect(res.status).toBe(400);
  });
});
