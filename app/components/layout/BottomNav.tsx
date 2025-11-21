'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Ticket, User, Plus } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

interface NavItem {
  href: string;
  icon: React.ComponentType<any>;
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
        {/* Glass background with safe area padding */}
        <div className="bg-white/90 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
          <div className="h-[72px] flex items-center justify-around px-2">
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
                    relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl
                    transition-all duration-300 min-w-[64px] min-h-[48px] group
                    ${active
                      ? 'text-primary-600'
                      : 'text-slate-400 hover:text-slate-600'
                    }
                  `}
                >
                  {/* Active indicator background */}
                  {active && (
                    <div className="absolute inset-0 bg-primary-50 rounded-2xl -z-10 animate-scaleIn" />
                  )}

                  <div className={`
                    relative transition-all duration-300
                    ${active ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-110 group-active:scale-95'}
                  `}>
                    <Icon
                      className={`
                        w-6 h-6 transition-all duration-300
                        ${active
                          ? 'fill-primary-600 text-primary-600'
                          : 'fill-transparent'
                        }
                      `}
                      suppressHydrationWarning
                    />
                  </div>
                  <span className={`
                    text-[10px] font-semibold transition-all duration-300
                    ${active ? 'text-primary-600 translate-y-0.5' : 'group-hover:text-slate-600'}
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
                className="relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl
                  transition-all duration-300 min-w-[64px] min-h-[48px] group
                  text-slate-400 hover:text-slate-600"
              >
                <div className="group-hover:scale-110 group-active:scale-95 transition-transform duration-300">
                  <User className="w-6 h-6" suppressHydrationWarning />
                </div>
                <span className="text-[10px] font-semibold group-hover:text-slate-600 transition-colors">Login</span>
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
            fixed bottom-24 right-4 z-50 md:hidden
            w-14 h-14 rounded-full
            bg-gradient-primary shadow-glow
            flex items-center justify-center
            hover:scale-105 active:scale-95
            transition-all duration-200
            animate-scaleIn
          "
          aria-label="Create Session"
        >
          <Plus className="w-6 h-6 text-white" suppressHydrationWarning />
        </Link>
      )}

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-20 md:hidden" />
    </>
  );
}
