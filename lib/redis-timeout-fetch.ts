/**
 * Custom fetch wrapper with a strict 1-second timeout.
 * Used to ensure remote Upstash Redis requests fall back quickly
 * to the in-memory cache/rate-limiter rather than blocking the application.
 */
export async function redisTimeoutFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
