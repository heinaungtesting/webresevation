import { SessionCardSkeleton, CompactSessionCardSkeleton } from '../ui/Skeleton';

export default function HomeFeedSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
            {/* Header Skeleton */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
                            <div className="h-4 w-32 bg-slate-200 rounded-lg animate-pulse" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
                            <div className="hidden md:block w-24 h-10 bg-slate-200 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Skeleton */}
            <div className="sticky top-[73px] z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex gap-2 overflow-hidden">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-9 w-24 bg-slate-200 rounded-full animate-pulse flex-shrink-0" />
                        ))}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                {/* Happening Now Skeleton */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-16 bg-slate-200 rounded-lg animate-pulse" />
                    </div>
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex-shrink-0">
                                <CompactSessionCardSkeleton />
                            </div>
                        ))}
                    </div>
                </section>

                {/* For You Feed Skeleton */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-6 w-24 bg-slate-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-16 bg-slate-200 rounded-lg animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <SessionCardSkeleton key={i} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
