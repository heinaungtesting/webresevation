'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Button from '../ui/Button';
import { useAuth } from '@/app/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { LogOut, Settings, UserCircle, Shield, ChevronDown, Heart, Menu, X, MessageSquare, Home, Search, Ticket } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';
import NotificationBell from '../notifications/NotificationBell';

export default function Navigation() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'en';
  const t = useTranslations('nav');
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get display name for avatar fallback
  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'U';

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    setShowMobileMenu(false);
    router.push('/');
    router.refresh();
  };

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showMobileMenu]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled
        ? 'bg-white border-slate-200 shadow-md py-2'
        : 'bg-white border-slate-100 shadow-sm py-3 md:py-4'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-ocean flex items-center justify-center text-white font-bold text-base md:text-lg shadow-colored group-hover:shadow-glow transition-shadow duration-300">
                S
              </div>
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-accent-emerald rounded-full border-2 border-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-base md:text-lg font-bold text-slate-900">
                SportsMatch
              </div>
              <div className="text-xs text-slate-500 -mt-1">Tokyo</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200"
            >
              {t('home')}
            </Link>
            <Link
              href="/sessions"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200"
            >
              {t('sessions')}
            </Link>
            {user && (
              <>
                <Link
                  href="/my-sessions"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200"
                >
                  {t('mySessions')}
                </Link>
                <Link
                  href="/messages"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200"
                >
                  {t('messages')}
                </Link>
              </>
            )}
            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              {user ? (
                <>
                  <NotificationBell />
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all duration-200 group"
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-sm font-medium">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate hidden lg:block">
                        {displayName}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} suppressHydrationWarning />
                    </button>

                    {/* User dropdown menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-large border border-slate-100 py-2 animate-scaleIn origin-top-right z-50">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                          <p className="text-xs text-slate-500">{t('manageAccount')}</p>
                        </div>

                        <div className="py-1">
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <UserCircle className="w-4 h-4 text-slate-400" suppressHydrationWarning />
                            {t('profile')}
                          </Link>
                          <Link
                            href="/favorites"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Heart className="w-4 h-4 text-slate-400" suppressHydrationWarning />
                            {t('favorites')}
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Settings className="w-4 h-4 text-slate-400" suppressHydrationWarning />
                            {t('settings')}
                          </Link>
                          {profile?.is_admin && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <Shield className="w-4 h-4 text-slate-400" suppressHydrationWarning />
                              {t('admin')}
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-1">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" suppressHydrationWarning />
                            {t('signOut')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="gradient" size="sm">
                      {t('signUp')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation controls */}
          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationBell />}
            
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center p-1 rounded-xl hover:bg-slate-100 transition-all duration-200"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-sm font-medium">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {/* Mobile User dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-large border border-slate-100 py-2 animate-scaleIn origin-top-right z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCircle className="w-4 h-4 text-slate-400" suppressHydrationWarning />
                        {t('profile')}
                      </Link>
                      <Link
                        href="/favorites"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart className="w-4 h-4 text-slate-400" suppressHydrationWarning />
                        {t('favorites')}
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4 text-slate-400" suppressHydrationWarning />
                        {t('settings')}
                      </Link>
                      {profile?.is_admin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Shield className="w-4 h-4 text-slate-400" suppressHydrationWarning />
                          {t('admin')}
                        </Link>
                      )}
                    </div>

                    <div className="px-4 py-2 border-t border-slate-100">
                      <LanguageSwitcher />
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" suppressHydrationWarning />
                        {t('signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t('login')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col md:hidden animate-fade-in-up">
          <div className="flex justify-between items-center px-4 py-4 border-b border-slate-100">
            <div className="text-lg font-bold text-slate-900">SportsMatch</div>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pt-4 pb-20 px-4 space-y-6">
            <div className="space-y-1">
              <Link href={`/${locale}`} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                <Home className="w-5 h-5 text-slate-400" />
                {t('home')}
              </Link>
              <Link href={`/${locale}/sessions`} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                <Search className="w-5 h-5 text-slate-400" />
                {t('sessions')}
              </Link>
              {user && (
                <>
                  <Link href={`/${locale}/my-sessions`} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                    <Ticket className="w-5 h-5 text-slate-400" />
                    {t('mySessions')}
                  </Link>
                  <Link href={`/${locale}/messages`} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                    {t('messages')}
                  </Link>
                </>
              )}
            </div>

            {user && (
              <>
                <div className="w-full h-px bg-slate-100" />
                <div className="space-y-1">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {t('manageAccount')}
                  </div>
                  <Link href={`/${locale}/profile`} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                    <UserCircle className="w-5 h-5 text-slate-400" />
                    {t('profile')}
                  </Link>
                  <Link href={`/${locale}/favorites`} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                    <Heart className="w-5 h-5 text-slate-400" />
                    {t('favorites')}
                  </Link>
                  <Link href={`/${locale}/settings`} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                    <Settings className="w-5 h-5 text-slate-400" />
                    {t('settings')}
                  </Link>
                </div>
              </>
            )}

            <div className="w-full h-px bg-slate-100" />
            <div className="px-4 py-2">
              <LanguageSwitcher />
            </div>

            {user && (
              <div className="px-4">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-3 text-base font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  {t('signOut')}
                </button>
              </div>
            )}
            
            {!user && (
              <div className="px-4 space-y-3">
                <Link href={`/${locale}/signup`} onClick={() => setShowMobileMenu(false)} className="flex justify-center w-full py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
                  {t('signUp')}
                </Link>
                <Link href={`/${locale}/login`} onClick={() => setShowMobileMenu(false)} className="flex justify-center w-full py-3 text-base font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  {t('login')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
