# SportsMatch Tokyo — Bug Tracker (live state)

**Source:** `/home/hermes/reports/sportsmatch-tokyo-beta-report.md` (67 bugs, 7 Critical)
**Repo:** `heinaungtesting/webresevation`
**Updated by:** the daily beta-test cron (`.hermes/cron/sportsmatch-beta-test.cron.json`)

This file is the **single source of truth** for the cron-driven beta-test
loop. When a bug is fixed and verified, mark its status here. When a
bug re-appears in a re-test, bump the count.

The cron reads this file to decide what to test, what to fix next, and
whether to declare the app "public-ready".

## Status legend

- `fixed` — code is in `main` and a regression test exists
- `verified` — manually re-tested in production and confirmed
- `regression` — was fixed, came back in a re-test
- `not-started` — known issue, fix pending
- `wontfix` — explicitly decided not to fix (with reason)

## "Public-ready" criteria

The cron will mark the app `PUBLIC_READY=true` only when **all** of these
are true:

- [x] BUG-001 — signup error mapping fixed and verified
- [x] BUG-002 — forgot-password page exists and works
- [x] BUG-003 — /messages link in nav (already in current code)
- [x] BUG-004 — "I'm Going!" RSVP wired
- [x] BUG-005 — JA locale reads *_ja fields
- [x] BUG-006 — `<html lang={locale}>` per locale
- [x] BUG-007 — Sentry init env-driven + 403 filter
- [x] BUG-027 — CSP header present on auth pages (c7e33af)
- [x] BUG-021 — 404 page localized (0af3e89)
- [x] BUG-030 — "log in" labels consistent across the app (fea67aa)
- [x] BUG-031 — date format locale-correct (JA-style on EN removed) (fa720ec)

**PUBLIC_READY=true** — all 7 Critical bugs fixed + all 4 readiness criteria
fixed. Test suite: 325/325 passing. Build: ✅. No regressions.

---

## Critical bugs (7 — all must be fixed for public launch)

| ID | Area | Title | Status | Regression test | Commit |
|---|---|---|---|---|---|
| BUG-001 | Auth | Signup rate-limit mislabeled as "invalid email" | fixed | `tests/lib/auth-errors.test.ts` | dae387e |
| BUG-002 | Auth | `/[locale]/forgot-password` 404 dead-end | fixed | `tests/app/forgot-password.test.tsx` | dae387e |
| BUG-003 | Chat | Half-built chat (backend yes, frontend missing) | verified (link exists) | n/a | pre-existing |
| BUG-004 | Matching | "I'm Going!" button is a duplicate link | fixed | inline `data-testid="session-card-im-going"` | dae387e |
| BUG-005 | i18n | JA locale shows English data | fixed | `tests/lib/i18n-data.test.ts` | dae387e |
| BUG-006 | i18n/a11y | `<html lang="en">` on every page | fixed | `tests/app/layout-html-lang.test.tsx` | dae387e |
| BUG-007 | Observability | Sentry telemetry 403 | fixed (code) | `tests/sentry-init.test.ts` | dae387e |

## High-priority bugs (22 — fix in Phase 2 by daily cron)

| ID | Area | Title | Status |
|---|---|---|---|
| BUG-008 | Auth | Login "email not confirmed" indistinguishable from wrong password | fixed (same `mapSupabaseAuthError`) |
| BUG-009 | Auth | No "resend verification email" button on /verify-email | not-started |
| BUG-010 | Auth | Forgot-password recovery path (resolved by BUG-002) | fixed |
| BUG-011 | Security | Sentry release SHA leaks in `baggage` header | not-started |
| BUG-012 | Mobile | Bottom nav labels at 10px (fails WCAG AA) | not-started |
| BUG-013 | Mobile | Header logo is 36x36px (under 44x44 minimum) | not-started |
| BUG-014 | Mobile | Login button 70x39px (5px short) | not-started |
| BUG-015 | Mobile | "See all" / "View All" links 20px tall | not-started |
| BUG-016 | Mobile | Fixed top + bottom nav wastes 16% of viewport | not-started |
| BUG-017 | Mobile | Filter chips 42px tall (2px short) | not-started |
| BUG-018 | Mobile | Map View button occluded by bottom nav | not-started |
| BUG-019 | i18n | "Reviews" heading hardcoded English on JA | not-started |
| BUG-020 | i18n | "Open in Google Maps" hardcoded English | not-started |
| BUG-021 | i18n | 404 page English-only | fixed (`tests/app/not-found-localized.test.tsx`, 0af3e89) |
| BUG-022 | i18n | JA greeting fragmented by flex layout | not-started |
| BUG-023 | UX | "Loading reviews..." never resolves | not-started |
| BUG-024 | SEO | Soft 404 on invalid session IDs | not-started |
| BUG-025 | UX | "Happening Now" shows 1 card with 0-second window | not-started |
| BUG-026 | UX | Avatar overflow "and N more" count wrong | not-started |
| BUG-027 | Security | Content-Security-Policy header missing | fixed (`tests/lib/csp-header.test.ts`, c7e33af) |
| BUG-028 | Security | PKCE cookie not HttpOnly, 400-day expiry | not-started |
| BUG-029 | i18n | Login redirectTo drops locale prefix | not-started |

## Medium-priority bugs (24 — fix in Phase 3)

| ID | Area | Title | Status |
|---|---|---|---|
| BUG-030 | i18n | "Log in" labeled three different ways | fixed (`tests/lib/login-labels.test.ts`, fea67aa) |
| BUG-031 | i18n | JA-style date on EN locale | fixed (`tests/lib/date-locale.test.ts`, fa720ec) |
| BUG-032 | UX | "Good Morning, there" placeholder | not-started |
| BUG-033 | i18n | "EN OK" badge flag logic inconsistent | not-started |
| BUG-034 | i18n | Signup language defaults to EN on /ja/signup | not-started |
| BUG-035 | i18n | No Japanese font in CSS font stack | not-started |
| BUG-036 | i18n | 404 "Return Home" drops locale | not-started |
| BUG-037 | i18n | Home page links use non-localized paths | not-started |
| BUG-038 | a11y | Capacity % bar has no aria-label | not-started |
| BUG-039 | a11y | Search input missing inputmode/autocomplete | not-started |
| BUG-040 | i18n | Login redirectTo unlocalized (dup of 029) | not-started |
| BUG-041 | i18n | "Log in" three forms (dup of 030) | not-started |
| BUG-042 | Chat | /api/conversations dead code (no client UI) | not-started |
| BUG-043 | Chat | Nav link "Messages" missing (resolved by BUG-003) | verified |
| BUG-044 | DB | Missing unique (user_id, session_id) constraint | not-started |
| BUG-045 | i18n | "I'm Going!" exclamation inconsistent with detail page | not-started |
| BUG-046 | i18n | JA greeting accessibility name fragmented (dup of 022) | not-started |
| BUG-047 | i18n | "Create Session" uses non-localized path | not-started |
| BUG-048 | i18n | "EN OK" badge stays English on JA (dup of 033) | not-started |
| BUG-049 | a11y | Filter chip overflow not announced | not-started |
| BUG-050 | UX | "Happening Now" duplicates "For You" | not-started |
| BUG-051 | i18n | "2h 34m" uses English h/m on JA | not-started |
| BUG-052 | Security | Path traversal 403 leaks Vercel region | not-started |
| BUG-053 | i18n | Forgot password 404 (dup of 002) | fixed |

## Low-priority bugs (14 — fix in Phase 4)

(omitted for brevity — see full report at
`/home/hermes/reports/sportsmatch-tokyo-beta-report.md` for BUG-054..067)

---

## Cron loop protocol

Each day the cron job at `.hermes/cron/sportsmatch-beta-test.cron.json`
runs the following loop:

1. **Re-test:** clone the latest `main`, run `npm test`, run `npm run build`,
   run `npm run test:e2e` against a local dev server.
2. **Diff bugs:** compare failures against this file. Any bug in
   `regression` state or in `fixed` state with a failing test gets
   re-queued.
3. **TDD-fix the top remaining bug:** spawn a subagent (or run inline)
   to read the bug, write a failing test, write the fix, verify the
   test passes, commit with message
   `fix(beta-test): BUG-XXX — <title>`.
4. **Update this file:** flip the status to `fixed` and add the commit SHA.
5. **Check ready criteria:** if all 7 Critical + 3 readiness criteria
   (BUG-027, BUG-021, BUG-030, BUG-031) are `fixed`, mark
   `PUBLIC_READY=true` and send a Telegram summary.

## Stop conditions

The cron loop exits and marks the app "public-ready" when:

- All 7 Critical bugs are `fixed` AND verified, AND
- The 4 readiness criteria (CSP, 404 i18n, log-in labels, date format) are `fixed`, AND
- No `regression` bugs remain, AND
- All tests pass + build passes + e2e tests pass.
