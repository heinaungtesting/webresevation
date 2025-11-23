/**
 * Client-side CSRF utilities
 * Provides helper functions to include CSRF tokens in fetch requests
 */

/**
 * Gets the CSRF token from cookies
 */
export function getCsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrf_token') {
            return decodeURIComponent(value);
        }
    }
    return null;
}

/**
 * Creates headers object with CSRF token included
 */
export function getCsrfHeaders(additionalHeaders: HeadersInit = {}): HeadersInit {
    const token = getCsrfTokenFromCookie();
    const headers: HeadersInit = {
        ...additionalHeaders,
    };

    if (token) {
        (headers as Record<string, string>)['x-csrf-token'] = token;
    }

    return headers;
}

/**
 * Wrapper around fetch that automatically includes CSRF token
 * Use this for all mutation requests (POST, PUT, PATCH, DELETE)
 */
export async function csrfFetch(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    const headers = getCsrfHeaders(init?.headers);

    return fetch(input, {
        ...init,
        headers,
    });
}

/**
 * Helper for JSON POST requests with CSRF protection
 */
export async function csrfPost<T = any>(
    url: string,
    data: any,
    options?: Omit<RequestInit, 'method' | 'body'>
): Promise<T> {
    const response = await csrfFetch(url, {
        ...options,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Helper for JSON PUT requests with CSRF protection
 */
export async function csrfPut<T = any>(
    url: string,
    data: any,
    options?: Omit<RequestInit, 'method' | 'body'>
): Promise<T> {
    const response = await csrfFetch(url, {
        ...options,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Helper for JSON PATCH requests with CSRF protection
 */
export async function csrfPatch<T = any>(
    url: string,
    data: any,
    options?: Omit<RequestInit, 'method' | 'body'>
): Promise<T> {
    const response = await csrfFetch(url, {
        ...options,
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Helper for DELETE requests with CSRF protection
 */
export async function csrfDelete<T = any>(
    url: string,
    options?: Omit<RequestInit, 'method'>
): Promise<T> {
    const response = await csrfFetch(url, {
        ...options,
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}
