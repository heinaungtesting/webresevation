'use client';

import { SessionCardSkeleton } from '@/app/components/ui/Skeleton';

export default function SessionsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-6 sm:mb-8 space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Filter Bar Skeleton */}
        <div className="bg-white p-4 rounded-2xl shadow-soft border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center animate-pulse">
          <div className="h-10 w-full md:w-1/3 bg-slate-200 rounded-xl" />
          <div className="h-10 w-full md:w-1/4 bg-slate-200 rounded-xl" />
          <div className="h-10 w-full md:w-1/4 bg-slate-200 rounded-xl" />
          <div className="h-10 w-24 bg-slate-200 rounded-xl" />
        </div>

        {/* Sessions Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SessionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
