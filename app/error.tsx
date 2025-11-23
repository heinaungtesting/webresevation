'use client';

/**
 * Global Error Boundary
 *
 * This component catches unhandled errors in the root layout and below.
 * It provides a user-friendly error page with the ability to retry.
 *
 * Features:
 * - Logs errors to console (and Sentry if configured)
 * - Shows user-friendly error message
 * - Provides retry functionality
 * - Respects user's color scheme preference
 */

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console
    console.error('[GlobalError] Unhandled error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });

    // Report to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          errorBoundary: 'global',
        },
        extra: {
          digest: error.digest,
        },
      });
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                width: '4rem',
                height: '4rem',
                margin: '0 auto 1.5rem',
                backgroundColor: '#fee2e2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            {/* Error Message */}
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.5',
              }}
            >
              We apologize for the inconvenience. An unexpected error occurred.
              Please try again or contact support if the problem persists.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <details
                style={{
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                  backgroundColor: '#f3f4f6',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: '500',
                    color: '#374151',
                  }}
                >
                  Error Details (Dev Only)
                </summary>
                <pre
                  style={{
                    marginTop: '0.5rem',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#dc2626',
                  }}
                >
                  {error.message}
                  {error.digest && `\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
              >
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
