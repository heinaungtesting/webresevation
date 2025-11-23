'use client';

/**
 * Locale-Level Error Boundary
 *
 * Catches errors within the locale layout while preserving the app shell.
 * Provides internationalized error messages and retry functionality.
 */

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Error messages by locale
const errorMessages = {
  en: {
    title: 'Something went wrong',
    description: 'We apologize for the inconvenience. An unexpected error occurred.',
    tryAgain: 'Try Again',
    goHome: 'Go Home',
    goBack: 'Go Back',
    errorDetails: 'Error Details (Dev Only)',
  },
  ja: {
    title: '問題が発生しました',
    description: '予期せぬエラーが発生しました。ご不便をおかけして申し訳ございません。',
    tryAgain: '再試行',
    goHome: 'ホームへ',
    goBack: '戻る',
    errorDetails: 'エラー詳細（開発者向け）',
  },
};

export default function LocaleError({ error, reset }: ErrorProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = errorMessages[locale as keyof typeof errorMessages] || errorMessages.en;

  useEffect(() => {
    // Log error with context
    console.error('[LocaleError] Unhandled error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      locale,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    });

    // Report to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          errorBoundary: 'locale',
          locale,
        },
        extra: {
          digest: error.digest,
          url: window.location.href,
        },
      });
    }
  }, [error, locale]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {t.title}
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          {t.description}
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm">
            <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-200">
              {t.errorDetails}
            </summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-red-600 dark:text-red-400">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {t.tryAgain}
          </button>

          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
          >
            {t.goBack}
          </button>

          <a
            href={`/${locale}`}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
          >
            {t.goHome}
          </a>
        </div>
      </div>
    </div>
  );
}
