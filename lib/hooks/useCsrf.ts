'use client';

import { useEffect, useState, useCallback } from 'react';
import { CSRF_CONSTANTS } from '@/lib/csrf';

/**
 * Custom hook for CSRF protection in React components
 *
 * Usage:
 * ```tsx
 * const { csrfToken, csrfHeaders, fetchWithCsrf } = useCsrf();
 *
 * // Option 1: Use csrfHeaders with fetch
 * await fetch('/api/endpoint', {
 *   method: 'POST',
 *   headers: { ...csrfHeaders, 'Content-Type': 'application/json' },
 *   body: JSON.stringify(data),
 * });
 *
 * // Option 2: Use fetchWithCsrf helper
 * await fetchWithCsrf('/api/endpoint', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    // Try to read from cookie first
    const cookieToken = getCsrfTokenFromCookie();
    if (cookieToken) {
      setCsrfToken(cookieToken);
    } else {
      // Fetch from API if not in cookie
      fetchCsrfToken();
    }
  }, []);

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch('/api/csrf');
      const data = await response.json();
      setCsrfToken(data.csrfToken);
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  };

  const csrfHeaders = csrfToken
    ? { [CSRF_CONSTANTS.HEADER_NAME]: csrfToken }
    : {};

  const fetchWithCsrf = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);

      if (csrfToken) {
        headers.set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);
      }

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [csrfToken]
  );

  return {
    csrfToken,
    csrfHeaders,
    fetchWithCsrf,
    refreshToken: fetchCsrfToken,
  };
}

/**
 * Read CSRF token from cookie
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_CONSTANTS.COOKIE_NAME) {
      return value;
    }
  }
  return null;
}

/**
 * Utility function to get CSRF token for non-hook contexts
 */
export function getCsrfToken(): string | null {
  return getCsrfTokenFromCookie();
}

/**
 * Add CSRF token to fetch options
 */
export function addCsrfToFetch(options: RequestInit = {}): RequestInit {
  const token = getCsrfTokenFromCookie();
  if (!token) return options;

  const headers = new Headers(options.headers);
  headers.set(CSRF_CONSTANTS.HEADER_NAME, token);

  return {
    ...options,
    headers,
  };
}
