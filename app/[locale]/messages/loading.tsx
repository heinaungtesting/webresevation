'use client';

import Skeleton from '@/app/components/ui/Skeleton';

export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-6 space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Conversation Items Skeleton */}
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden divide-y divide-slate-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 flex gap-4 items-center animate-pulse">
              {/* Avatar Skeleton */}
              <Skeleton variant="circular" width="48px" height="48px" />
              {/* Details Skeleton */}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-1/4 bg-slate-200 rounded-lg" />
                  <div className="h-3 w-16 bg-slate-200 rounded-lg" />
                </div>
                <div className="h-3 w-3/4 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
