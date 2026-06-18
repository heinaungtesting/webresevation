/**
 * Supabase Auth error → user-friendly message + HTTP status code.
 *
 * BUG-001 regression: previously /api/auth/signup mapped every Supabase
 * error to HTTP 400 with the raw error.message — so a Supabase rate-limit
 * ("email rate limit exceeded") was shown to users as "invalid email".
 * The same risk existed on /api/auth/login.
 *
 * Source: /home/hermes/reports/sportsmatch-tokyo-beta-report.md (BUG-001)
 *
 * This module is the single source of truth for auth error mapping. Both
 * /api/auth/signup and /api/auth/login (and any future auth route) use it.
 */

export type AuthErrorMapping = {
  status: number;
  error: string;
  /** structured code so the client can render i18n or branch on it */
  code: string;
};

const RATE_LIMIT_PATTERNS = [
  /rate.?limit/i,
  /over_email_send/i,
  /over_email_change/i,
  /too many/i,
];

const INVALID_EMAIL_PATTERNS = [
  /invalid email/i,
  /email_address_invalid/i,
];

const WEAK_PASSWORD_PATTERNS = [
  /weak.?password/i,
  /password should be/i,
];

const USER_EXISTS_PATTERNS = [
  /user_already_exists/i,
  /already registered/i,
  /already been registered/i,
];

const EMAIL_NOT_CONFIRMED_PATTERNS = [
  /email_not_confirmed/i,
];

const INVALID_CREDENTIALS_PATTERNS = [
  /invalid.?credentials/i,
  /invalid login/i,
];

const NETWORK_PATTERNS = [
  /network/i,
  /fetch failed/i,
  /econnreset/i,
];

const STATUS_CODE_MAP: Record<string, AuthErrorMapping> = {
  rate_limited: {
    status: 429,
    error: "Too many signups. Please wait 2 minutes and try again.",
    code: "rate_limited",
  },
  invalid_email: {
    status: 422,
    error: "Please enter a valid email address.",
    code: "invalid_email",
  },
  weak_password: {
    status: 422,
    error: "Password is too weak. Use 8+ characters with letters and numbers.",
    code: "weak_password",
  },
  user_exists: {
    status: 409,
    error: "An account with this email already exists.",
    code: "user_exists",
  },
  email_not_confirmed: {
    status: 403,
    error: "Please confirm your email before logging in. Check your inbox for the verification link.",
    code: "email_not_confirmed",
  },
  invalid_credentials: {
    status: 401,
    error: "Invalid email or password.",
    code: "invalid_credentials",
  },
  network: {
    status: 503,
    error: "Network error. Please try again in a moment.",
    code: "network",
  },
  internal: {
    status: 500,
    error: "An unexpected error occurred. Please try again.",
    code: "internal",
  },
};

export interface SupabaseError {
  code?: string;
  status?: number;
  message: string;
  name?: string;
}

function matchesAny(errorMessage: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(errorMessage));
}

/**
 * Map a Supabase auth error to an HTTP status + user-facing message.
 * Pure function — easy to unit test.
 */
export function mapSupabaseAuthError(
  error: SupabaseError | null | undefined,
  context: "signup" | "login" = "signup"
): AuthErrorMapping {
  if (!error || !error.message) {
    return STATUS_CODE_MAP.internal;
  }

  const message = error.message || "";
  const code = error.code || "";

  // 1. Rate limit first — most important to distinguish
  if (matchesAny(message, RATE_LIMIT_PATTERNS) || matchesAny(code, RATE_LIMIT_PATTERNS)) {
    return {
      ...STATUS_CODE_MAP.rate_limited,
      error:
        context === "login"
          ? "Too many login attempts. Please wait 2 minutes and try again."
          : STATUS_CODE_MAP.rate_limited.error,
    };
  }

  // 2. User already exists
  if (matchesAny(message, USER_EXISTS_PATTERNS) || matchesAny(code, USER_EXISTS_PATTERNS)) {
    return STATUS_CODE_MAP.user_exists;
  }

  // 3. Invalid email format
  if (matchesAny(message, INVALID_EMAIL_PATTERNS) || matchesAny(code, INVALID_EMAIL_PATTERNS)) {
    return STATUS_CODE_MAP.invalid_email;
  }

  // 4. Weak password (signup only)
  if (
    context === "signup" &&
    (matchesAny(message, WEAK_PASSWORD_PATTERNS) || matchesAny(code, WEAK_PASSWORD_PATTERNS))
  ) {
    return STATUS_CODE_MAP.weak_password;
  }

  // 5. Email not confirmed (login only) — 403 lets user self-recover
  if (
    context === "login" &&
    (matchesAny(message, EMAIL_NOT_CONFIRMED_PATTERNS) || matchesAny(code, EMAIL_NOT_CONFIRMED_PATTERNS))
  ) {
    return STATUS_CODE_MAP.email_not_confirmed;
  }

  // 6. Wrong credentials (login only)
  if (
    context === "login" &&
    (matchesAny(message, INVALID_CREDENTIALS_PATTERNS) || matchesAny(code, INVALID_CREDENTIALS_PATTERNS))
  ) {
    return STATUS_CODE_MAP.invalid_credentials;
  }

  // 7. Network / transient
  if (matchesAny(message, NETWORK_PATTERNS)) {
    return STATUS_CODE_MAP.network;
  }

  // 8. Default — never leak raw Supabase text
  return STATUS_CODE_MAP.internal;
}
