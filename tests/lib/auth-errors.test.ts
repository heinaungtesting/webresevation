/**
 * BUG-001 regression: /api/auth/signup and /api/auth/login must return
 * distinct, user-friendly HTTP statuses for distinct Supabase errors.
 *
 * Before fix: every Supabase error became HTTP 400 + raw error.message,
 * so a Supabase rate-limit ("email rate limit exceeded") was rendered
 * to the user as "invalid email".
 *
 * Source: /home/hermes/reports/sportsmatch-tokyo-beta-report.md (BUG-001)
 */

import { describe, it, expect } from "vitest";
import { mapSupabaseAuthError } from "@/lib/auth-errors";

describe("mapSupabaseAuthError — signup context", () => {
  it("returns 429 for Supabase rate-limit on signup", () => {
    const result = mapSupabaseAuthError(
      { message: "email rate limit exceeded", code: "over_email_send_rate_limit" },
      "signup"
    );
    expect(result.status).toBe(429);
    expect(result.code).toBe("rate_limited");
    expect(result.error).toMatch(/wait/i);
  });

  it("returns 422 for invalid email on signup", () => {
    const result = mapSupabaseAuthError(
      { message: "Invalid email format", code: "email_address_invalid" },
      "signup"
    );
    expect(result.status).toBe(422);
    expect(result.code).toBe("invalid_email");
  });

  it("returns 409 when user already exists on signup", () => {
    const result = mapSupabaseAuthError(
      { message: "User already registered", code: "user_already_exists" },
      "signup"
    );
    expect(result.status).toBe(409);
    expect(result.code).toBe("user_exists");
  });

  it("returns 422 for weak password on signup", () => {
    const result = mapSupabaseAuthError(
      { message: "Password should be at least 8 characters", code: "weak_password" },
      "signup"
    );
    expect(result.status).toBe(422);
    expect(result.code).toBe("weak_password");
  });

  it("returns 500 (NOT 400) for unknown errors — never leaks raw text", () => {
    const result = mapSupabaseAuthError(
      { message: "Internal server error" },
      "signup"
    );
    expect(result.status).toBe(500);
    expect(result.error).not.toContain("Internal server error");
  });
});

describe("mapSupabaseAuthError — login context", () => {
  it("returns 429 for rate-limit on login (different copy from signup)", () => {
    const result = mapSupabaseAuthError(
      { message: "rate limit exceeded" },
      "login"
    );
    expect(result.status).toBe(429);
    expect(result.error).toMatch(/login/i);
  });

  it("returns 401 for wrong password", () => {
    const result = mapSupabaseAuthError(
      { message: "Invalid login credentials", code: "invalid_credentials" },
      "login"
    );
    expect(result.status).toBe(401);
    expect(result.code).toBe("invalid_credentials");
  });

  it("returns 403 (not 401) for unconfirmed email so the user can self-recover", () => {
    const result = mapSupabaseAuthError(
      { message: "Email not confirmed", code: "email_not_confirmed" },
      "login"
    );
    expect(result.status).toBe(403);
    expect(result.code).toBe("email_not_confirmed");
    expect(result.error).toMatch(/confirm your email/i);
  });
});

describe("mapSupabaseAuthError — resilience", () => {
  it("returns 500 for null error", () => {
    expect(mapSupabaseAuthError(null, "signup").status).toBe(500);
  });

  it("returns 500 for error with no message", () => {
    expect(mapSupabaseAuthError({}, "signup").status).toBe(500);
  });

  it("matches by code, not just message (Supabase sometimes returns code only)", () => {
    const result = mapSupabaseAuthError(
      { message: "Some other text", code: "email_address_invalid" },
      "signup"
    );
    expect(result.status).toBe(422);
  });
});
