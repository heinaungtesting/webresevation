'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Processing authentication...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      // Check for error in URL params
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setIsError(true);
        setMessage(errorDescription || 'Authentication failed. Please try again.');
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      // Check for code in URL params
      const code = searchParams.get('code');

      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            setIsError(true);
            setMessage(exchangeError.message || 'Failed to verify email. Please try again.');
            setTimeout(() => router.push('/login'), 3000);
            return;
          }

          setMessage('Email verified successfully! Redirecting...');
          setTimeout(() => router.push('/'), 2000);
        } catch (err) {
          setIsError(true);
          setMessage('An unexpected error occurred. Please try again.');
          setTimeout(() => router.push('/login'), 3000);
        }
      } else {
        // No code, just redirect to login
        router.push('/login');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className={`p-8 rounded-2xl shadow-lg ${isError ? 'bg-red-50' : 'bg-white'}`}>
          <div className="text-center">
            {!isError ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <p className={`text-lg ${isError ? 'text-red-700' : 'text-gray-700'}`}>
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
