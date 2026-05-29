'use client';

import Skeleton from '@/app/components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-6 md:py-8 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Profile Card Skeleton */}
        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Skeleton */}
            <Skeleton variant="circular" width="96px" height="96px" className="border-4 border-white shadow-soft" />
            
            {/* User Info Skeleton */}
            <div className="flex-1 text-center md:text-left space-y-3 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="h-7 w-48 bg-slate-200 rounded-lg mx-auto md:mx-0" />
                  <div className="h-4 w-32 bg-slate-200 rounded-lg mx-auto md:mx-0 mt-1.5" />
                </div>
                <div className="h-10 w-32 bg-slate-200 rounded-xl mx-auto md:mx-0" />
              </div>
              <div className="h-4 w-full max-w-md bg-slate-200 rounded-lg mx-auto md:mx-0" />
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm pt-2">
                <div className="h-4 w-28 bg-slate-200 rounded-lg" />
                <div className="h-4 w-32 bg-slate-200 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 text-center space-y-2">
              <div className="h-6 w-12 bg-slate-200 rounded mx-auto" />
              <div className="h-3 w-16 bg-slate-200 rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Achievements Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <div className="h-6 w-32 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                <Skeleton variant="circular" width="40px" height="40px" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-1/3 bg-slate-200 rounded" />
                  <div className="h-3 w-2/3 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
