'use client';

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-6 md:py-8 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Skeleton */}
        <div className="mb-6 space-y-1">
          <div className="h-8 w-32 bg-slate-200 rounded-lg" />
          <div className="h-4 w-48 bg-slate-200 rounded-lg" />
        </div>

        {/* Language Section Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <div className="h-5 w-40 bg-slate-200 rounded-lg" />
          <div className="h-10 w-full bg-slate-200 rounded-xl" />
        </div>

        {/* Notifications Section Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6">
          <div className="h-5 w-32 bg-slate-200 rounded-lg" />
          
          <div className="space-y-4 divide-y divide-slate-100">
            <div className="pt-2 flex justify-between items-center">
              <div className="space-y-1.5 flex-1 pr-4">
                <div className="h-4 w-1/3 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 rounded" />
              </div>
              <div className="h-6 w-11 bg-slate-200 rounded-full" />
            </div>

            <div className="pt-4 flex justify-between items-center">
              <div className="space-y-1.5 flex-1 pr-4">
                <div className="h-4 w-1/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 rounded" />
              </div>
              <div className="h-6 w-11 bg-slate-200 rounded-full" />
            </div>
          </div>
        </div>

        {/* Save Button Skeleton */}
        <div className="flex justify-end pt-2">
          <div className="h-11 w-32 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
