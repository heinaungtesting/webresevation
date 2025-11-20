'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Session } from '@/types';
import SessionCard from '@/app/components/SessionCard';
import CompactSessionCard from '@/app/components/CompactSessionCard';
import { useAuth } from '@/app/contexts/AuthContext';
import { Bell, Plus, ChevronRight, Sparkles, Calendar, MapPin, Zap, Map, List } from 'lucide-react';
import Button from '@/app/components/ui/Button';

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

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'there';
  const greeting = getGreeting();

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.date_time);

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
  }, [sessions, activeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {greeting}, {displayName.split(' ')[0]}
              </h1>
              <p className="text-sm text-slate-500">Find your next game</p>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <Link
                  href="/notifications"
                  className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-accent-rose rounded-full" />
                </Link>
              )}
              {/* Desktop Create Button */}
              <Link href="/sessions/create" className="hidden md:block">
                <Button variant="gradient" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Create
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Quick Filters with Glass Effect */}
      <div className="sticky top-[73px] z-30 glass-strong border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {sportFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                  whitespace-nowrap transition-all duration-200
                  ${activeFilter === filter.id
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-white text-slate-600 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:text-slate-900'
                  }
                `}
              >
                {filter.icon && <span>{filter.icon}</span>}
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Happening Now Section */}
        {happeningNow.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {/* Pulse animation indicator */}
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-rose opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-rose"></span>
                </span>
                <h2 className="text-lg font-semibold text-slate-900">Happening Now</h2>
                <span className="px-2 py-0.5 rounded-full bg-accent-rose/10 text-accent-rose text-xs font-medium">
                  Live
                </span>
              </div>
              <Link
                href="/sessions?filter=now"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                See all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {/* Horizontal scroll with snap for iOS-like feel */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
              {happeningNow.map((session) => (
                <div key={session.id} className="flex-shrink-0 w-[85vw] sm:w-80 snap-center">
                  <CompactSessionCard session={session} variant="horizontal" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* For You Feed */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-100">
                <Sparkles className="w-4 h-4 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">For You</h2>
            </div>
            <Link
              href="/sessions"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {viewMode === 'map' ? (
            /* Map View Placeholder */
            <div className="h-[60vh] w-full rounded-3xl bg-slate-200 flex items-center justify-center animate-fadeIn">
              <div className="text-center p-6">
                <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-700 mb-1">Map View</h3>
                <p className="text-slate-500 text-sm">
                  See sessions near you visually.
                  <br />
                  <span className="text-xs text-slate-400">(Coming in Phase 3)</span>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Create Session Card */}
              <Link
                href="/sessions/create"
                className="col-span-2 md:col-span-2 p-6 rounded-2xl bg-gradient-ocean text-white hover:shadow-glow transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20">
                    <Plus className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create a Session</h3>
                <p className="text-white/80 text-sm">
                  Be the first to host a game. Set the time, place, and let others join you.
                </p>
              </Link>

              {/* Explore Card */}
              <Link
                href="/sessions"
                className="p-6 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group"
              >
                <div className="p-3 rounded-xl bg-slate-100 w-fit mb-4 group-hover:bg-primary-100 transition-colors">
                  <MapPin className="w-5 h-5 text-slate-600 group-hover:text-primary-600 transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Explore Venues</h3>
                <p className="text-slate-500 text-sm">
                  Discover sport centers near you
                </p>
              </Link>

              {/* Calendar Card */}
              <div className="p-6 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="p-3 rounded-xl bg-slate-100 w-fit mb-4">
                  <Calendar className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">No Sessions Yet</h3>
                <p className="text-slate-500 text-sm">
                  {activeFilter !== 'all'
                    ? `No ${activeFilter} sessions available`
                    : 'Check back soon for new games'
                  }
                </p>
              </div>

              {/* Quick Tip Card */}
              <div className="col-span-2 md:col-span-1 p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-1">Pro Tip</h3>
                    <p className="text-amber-700 text-sm">
                      Sessions fill up fast! Turn on notifications to never miss a game.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Map/List Toggle FAB */}
      <button
        onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        className="
          fixed bottom-28 left-1/2 -translate-x-1/2 z-40 md:hidden
          flex items-center gap-2 px-5 py-3 rounded-full
          bg-slate-900 text-white
          shadow-[0_8px_30px_rgb(0,0,0,0.3)]
          hover:bg-slate-800 active:scale-95
          transition-all duration-200
        "
      >
        {viewMode === 'list' ? (
          <>
            <Map className="w-4 h-4" />
            <span className="text-sm font-medium">Map</span>
          </>
        ) : (
          <>
            <List className="w-4 h-4" />
            <span className="text-sm font-medium">List</span>
          </>
        )}
      </button>
    </div>
  );
}
