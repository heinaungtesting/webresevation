'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Session } from '@/types';
import SessionCard from '@/app/components/SessionCard';
import CompactSessionCard from '@/app/components/CompactSessionCard';
import SessionMap from '@/app/components/SessionMap';
import { useAuth } from '@/app/contexts/AuthContext';
import { Bell, Plus, ChevronRight, Sparkles, MapPin, Map, List, Search, Filter, Loader2, RefreshCw } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';
import { motion } from 'framer-motion';

interface HomeFeedProps {
  sessions: Session[];
  happeningNow: Session[];
}

type FilterType = 'all' | 'badminton' | 'tennis' | 'basketball' | 'soccer' | 'today' | 'weekend';
type ViewMode = 'list' | 'map';

const sportFilters: { id: FilterType; label: string; icon?: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'badminton', label: 'Badminton', icon: '🏸' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'basketball', label: 'Basketball', icon: '🏀' },
  { id: 'soccer', label: 'Soccer', icon: '⚽' },
  { id: 'today', label: 'Today' },
  { id: 'weekend', label: 'This Weekend' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Fetch sessions from the API with filters
 */
async function fetchSessions(params: {
  sportType?: string;
  date?: string;
  search?: string;
}): Promise<Session[]> {
  const searchParams = new URLSearchParams();

  // Add sport type filter (for specific sports)
  if (params.sportType && params.sportType !== 'all' && params.sportType !== 'today' && params.sportType !== 'weekend') {
    searchParams.set('sport_type', params.sportType);
  }

  // Add date filter
  if (params.date === 'today' || params.date === 'weekend') {
    searchParams.set('date', params.date);
  }

  // Add search query
  if (params.search && params.search.trim()) {
    searchParams.set('search', params.search.trim());
  }

  const url = `/api/sessions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }

  return response.json();
}

export default function HomeFeed({ sessions: initialSessions, happeningNow }: HomeFeedProps) {
  const { user, profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'there';
  const greeting = getGreeting();

  // Debounce search input to prevent API spamming (300ms delay)
  const handleSearchChange = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
  }, 300);

  // Determine if we should fetch from API (filters are applied)
  const hasFilters = activeFilter !== 'all' || debouncedSearch.trim() !== '';

  // Build query parameters based on active filter
  const getQueryParams = () => {
    const params: { sportType?: string; date?: string; search?: string } = {};

    // Handle sport type vs date filters
    if (['badminton', 'tennis', 'basketball', 'soccer'].includes(activeFilter)) {
      params.sportType = activeFilter;
    } else if (activeFilter === 'today' || activeFilter === 'weekend') {
      params.date = activeFilter;
    }

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    return params;
  };

  // Use React Query for data fetching with automatic caching and revalidation
  const {
    data: filteredSessions,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['sessions', activeFilter, debouncedSearch],
    queryFn: () => fetchSessions(getQueryParams()),
    // Use initial server-rendered data when no filters are applied
    initialData: hasFilters ? undefined : initialSessions,
    // Only fetch when filters change (not on mount if no filters)
    enabled: hasFilters,
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
    // Stale time: 30 seconds (data considered fresh)
    staleTime: 30 * 1000,
    // Cache time: 5 minutes
    gcTime: 5 * 60 * 1000,
    // Retry configuration
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Use initial sessions if no filters, otherwise use query data
  const sessionsToDisplay = hasFilters ? (filteredSessions ?? []) : initialSessions;

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleSearchChange(value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setActiveFilter('all');
  };

  // Animation variants for staggered list
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <motion.div
      className="min-h-screen bg-slate-50 pb-24 md:pb-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-200" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight" suppressHydrationWarning>
                  {greeting}, <span className="text-primary-600">{displayName.split(' ')[0]}</span>
                </h1>
                <p className="text-sm text-slate-500 font-medium">Ready for your next game?</p>
              </div>
              <div className="flex items-center gap-3">
                {user && (
                  <Link
                    href="/notifications"
                    className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors group"
                  >
                    <Bell className="w-5 h-5 text-slate-600 group-hover:text-primary-600 transition-colors" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
                  </Link>
                )}
                {/* Desktop Create Button */}
                <Link href="/sessions/create" className="hidden md:block">
                  <Button variant="gradient" size="sm" className="shadow-md hover:shadow-lg">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create Session
                  </Button>
                </Link>
              </div>
            </div>

            {/* Search Bar (Mobile/Desktop) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search sports, venues..."
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 sm:text-sm"
                value={searchQuery}
                onChange={handleSearchInputChange}
                suppressHydrationWarning
              />
              {/* Loading indicator in search bar */}
              {isFetching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Quick Filters */}
      <div className="sticky top-[130px] md:top-[130px] z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide mask-linear-fade">
            {sportFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterChange(filter.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border",
                  activeFilter === filter.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {filter.icon && <span className="text-base">{filter.icon}</span>}
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8" suppressHydrationWarning>
        {/* Happening Now Section */}
        {happeningNow.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <h2 className="text-lg font-bold text-slate-900">Happening Now</h2>
              </div>
              <Link
                href="/sessions?filter=now"
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 group"
              >
                See all
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            {/* Horizontal scroll with snap */}
            <motion.div
              className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide px-1 snap-x snap-mandatory -mx-1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {happeningNow.map((session, index) => (
                <motion.div
                  key={session.id}
                  className="flex-shrink-0 w-[85vw] sm:w-80 snap-center"
                  variants={cardVariants}
                >
                  <CompactSessionCard session={session} variant="horizontal" className="h-full" />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* For You Feed */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-100 text-primary-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">For You</h2>
              {isFetching && !isLoading && (
                <Loader2 className="w-4 h-4 text-primary-500 animate-spin ml-2" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasFilters && (
                <button
                  onClick={() => refetch()}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  title="Refresh"
                >
                  <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
                </button>
              )}
              <Link
                href="/sessions"
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 group"
              >
                View all
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-500">Loading sessions...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-flex p-4 rounded-full bg-red-50 mb-4">
                  <Filter className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Failed to load sessions</h3>
                <p className="text-slate-500 mb-4">
                  {error instanceof Error ? error.message : 'An error occurred'}
                </p>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !isError && (
            <>
              {viewMode === 'map' ? (
                /* Interactive Session Map */
                <div className="relative animate-fadeIn">
                  <SessionMap sessions={sessionsToDisplay} />
                </div>
              ) : sessionsToDisplay.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  key={`${activeFilter}-${debouncedSearch}`} // Re-animate when filters change
                >
                  {sessionsToDisplay.map((session) => (
                    <motion.div
                      key={session.id}
                      variants={cardVariants}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                      <SessionCard session={session} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                /* Empty State - Bento Grid */
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Create Session Card */}
                  <Link
                    href="/sessions/create"
                    className="col-span-1 md:col-span-2 p-8 rounded-3xl bg-gradient-ocean text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl -ml-12 -mb-12" />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                          <Plus className="w-8 h-8" />
                        </div>
                        <div className="p-2 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Create a Session</h3>
                      <p className="text-white/90 text-base max-w-md">
                        Be the first to host a game. Set the time, place, and let others join you.
                      </p>
                    </div>
                  </Link>

                  {/* Explore Card */}
                  <Link
                    href="/sessions"
                    className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="p-3 rounded-2xl bg-primary-50 w-fit mb-6 group-hover:bg-primary-100 transition-colors">
                      <MapPin className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Explore Venues</h3>
                    <p className="text-slate-500">
                      Discover sport centers near you
                    </p>
                  </Link>

                  {/* Status Card */}
                  <div className="md:col-span-3 p-8 rounded-3xl bg-slate-50 border border-slate-100 text-center">
                    <div className="inline-flex p-4 rounded-full bg-white shadow-sm mb-4">
                      <Filter className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">No matches found</h3>
                    <p className="text-slate-500">
                      {searchQuery
                        ? `No results for "${searchQuery}"`
                        : activeFilter !== 'all'
                          ? `No ${activeFilter} sessions available right now`
                          : 'Check back soon for new games'
                      }
                    </p>
                    {(searchQuery || activeFilter !== 'all') && (
                      <button
                        onClick={clearFilters}
                        className="mt-4 text-primary-600 font-medium hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.section>
      </div>

      {/* Map/List Toggle FAB */}
      <motion.button
        onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        className="
          fixed bottom-24 left-1/2 -translate-x-1/2 z-40 md:hidden
          flex items-center gap-2 px-6 py-3.5 rounded-full
          bg-slate-900 text-white
          shadow-lg shadow-slate-900/20
          hover:bg-slate-800
          transition-all duration-200
        "
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {viewMode === 'list' ? (
          <>
            <Map className="w-5 h-5" />
            <span className="text-sm font-semibold">Map View</span>
          </>
        ) : (
          <>
            <List className="w-5 h-5" />
            <span className="text-sm font-semibold">List View</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
