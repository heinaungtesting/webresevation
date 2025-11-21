'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Session } from '@/types';
import SessionCard from '@/app/components/SessionCard';
import CompactSessionCard from '@/app/components/CompactSessionCard';
import { useAuth } from '@/app/contexts/AuthContext';
import { Bell, Plus, ChevronRight, Sparkles, Calendar, MapPin, Zap, Map, List, Search, Filter } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { cn } from '@/lib/utils';

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

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isThisWeekend(date: Date): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + (6 - dayOfWeek));
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  return (
    (date.getDate() === saturday.getDate() && date.getMonth() === saturday.getMonth()) ||
    (date.getDate() === sunday.getDate() && date.getMonth() === sunday.getMonth())
  );
}

export default function HomeFeed({ sessions, happeningNow }: HomeFeedProps) {
  const { user, profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'there';
  const greeting = getGreeting();

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.date_time);
      const matchesSearch = searchQuery === '' ||
        session.sport_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.sport_center?.name_en?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case 'badminton':
        case 'tennis':
        case 'basketball':
        case 'soccer':
          return session.sport_type === activeFilter;
        case 'today':
          return isToday(sessionDate);
        case 'weekend':
          return isThisWeekend(sessionDate);
        default:
          return true;
      }
    });
  }, [sessions, activeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-10">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-200">
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
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                onClick={() => setActiveFilter(filter.id)}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Happening Now Section */}
        {happeningNow.length > 0 && (
          <section className="animate-fadeIn">
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
            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide px-1 snap-x snap-mandatory -mx-1">
              {happeningNow.map((session) => (
                <div key={session.id} className="flex-shrink-0 w-[85vw] sm:w-80 snap-center">
                  <CompactSessionCard session={session} variant="horizontal" className="h-full" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* For You Feed */}
        <section className="animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-100 text-primary-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">For You</h2>
            </div>
            <Link
              href="/sessions"
              className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 group"
            >
              View all
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {viewMode === 'map' ? (
            /* Map View Placeholder */
            <div className="h-[60vh] w-full rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center animate-fadeIn relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5" />
              <div className="text-center p-6 relative z-10">
                <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Map View</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  Visualize sessions near you on an interactive map.
                  <br />
                  <span className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
                    Coming Soon
                  </span>
                </p>
              </div>
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredSessions.map((session, index) => (
                <div
                  key={session.id}
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <SessionCard session={session} />
                </div>
              ))}
            </div>
          ) : (
            /* Empty State - Bento Grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
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
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilter('all');
                    }}
                    className="mt-4 text-primary-600 font-medium hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Map/List Toggle FAB */}
      <button
        onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        className="
          fixed bottom-24 left-1/2 -translate-x-1/2 z-40 md:hidden
          flex items-center gap-2 px-6 py-3.5 rounded-full
          bg-slate-900 text-white
          shadow-lg shadow-slate-900/20
          hover:bg-slate-800 active:scale-95
          transition-all duration-200
        "
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
      </button>
    </div>
  );
}
