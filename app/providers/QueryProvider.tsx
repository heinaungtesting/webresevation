'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // Create a new QueryClient instance for each request to avoid shared state
  // between users on the server
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Increase stale time to reduce unnecessary refetches
            staleTime: 5 * 60 * 1000, // 5 minutes (was 1 minute)
            // Reduce retry attempts to fail faster
            retry: 2, // (was 3)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
            // Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            // Increase cache time for better performance
            gcTime: 10 * 60 * 1000, // 10 minutes (was 5 minutes)
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
