'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    // If the user is already authenticated, redirect them away from auth pages
    if (!loading && user) {
      router.replace(`/${locale}`);
    }
  }, [user, loading, router, locale]);

  // Optionally, we could return early null if loading or user, to prevent flicker,
  // but just rendering children is usually fine as the redirect happens quickly.
  if (user) {
    return null; // prevent flicker of the login form
  }

  return <>{children}</>;
}
