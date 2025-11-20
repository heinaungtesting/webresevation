'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Ticket, User, Plus } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/sessions', icon: Search, label: 'Explore' },
  { href: '/my-sessions', icon: Ticket, label: 'My Sessions', requiresAuth: true },
  { href: '/profile', icon: User, label: 'Profile', requiresAuth: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Extract locale from pathname
  const pathParts = pathname.split('/');
  const locale = pathParts[1] && ['en', 'ja'].includes(pathParts[1]) ? pathParts[1] : 'en';
  const currentPath = '/' + pathParts.slice(2).join('/') || '/';

  const isActive = (href: string) => {
    if (href === '/') {
      return currentPath === '/' || currentPath === '';
    }
    return currentPath.startsWith(href);
  };

  const getHref = (href: string) => `/${locale}${href === '/' ? '' : href}`;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Glass background */}
        <div className="glass-strong border-t border-white/20 pb-safe">
          <div className="h-16 flex items-center justify-around px-2">
            {navItems.map((item) => {
              // Skip auth-required items if not logged in
              if (item.requiresAuth && !user) {
                return null;
              }

              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={getHref(item.href)}
                  className={`
                    flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl
                    transition-all duration-200 min-w-[64px] min-h-[44px]
                    ${active
                      ? 'text-primary-600'
                      : 'text-slate-500 hover:text-slate-700 active:scale-95'
                    }
                  `}
                >
                  <div className={`
                    relative p-1.5 rounded-xl transition-all duration-200
                    ${active
                      ? 'bg-primary-100 shadow-glow-sm'
                      : ''
                    }
                  `}>
                    <Icon
                      className={`
                        w-5 h-5 transition-all duration-200
                        ${active ? 'text-primary-600' : ''}
                      `}
                    />
                    {active && (
                      <div className="absolute inset-0 rounded-xl bg-primary-500/20 blur-md -z-10" />
                    )}
                  </div>
                  <span className={`
                    text-[10px] font-medium transition-all duration-200
                    ${active ? 'text-primary-600' : ''}
                  `}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* Show login button if not authenticated */}
            {!user && (
              <Link
                href={getHref('/login')}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl
                  transition-all duration-200 min-w-[64px] min-h-[44px]
                  text-slate-500 hover:text-slate-700 active:scale-95"
              >
                <div className="p-1.5">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">Login</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Floating Action Button - Create Session */}
      {user && (
        <Link
          href={getHref('/sessions/create')}
          className="
            fixed bottom-20 right-4 z-50 md:hidden
            w-14 h-14 rounded-full
            bg-gradient-primary shadow-glow
            flex items-center justify-center
            hover:scale-105 active:scale-95
            transition-all duration-200
            animate-scaleIn
          "
          aria-label="Create Session"
        >
          <Plus className="w-6 h-6 text-white" />
        </Link>
      )}

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}
