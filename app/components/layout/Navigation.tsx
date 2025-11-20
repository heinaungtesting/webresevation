'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Button from '../ui/Button';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, UserCircle, Shield, ChevronDown, Heart } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';
import NotificationBell from '../notifications/NotificationBell';

export default function Navigation() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
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
    router.push('/');
    router.refresh();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-strong shadow-soft py-2'
          : 'bg-transparent py-3 md:py-4'
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
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* User dropdown menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-large border border-slate-100 py-2 animate-scaleIn origin-top-right z-50">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                          <p className="text-xs text-slate-500">Manage your account</p>
                        </div>

                        <div className="py-1">
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <UserCircle className="w-4 h-4 text-slate-400" />
                            {t('profile')}
                          </Link>
                          <Link
                            href="/favorites"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Heart className="w-4 h-4 text-slate-400" />
                            Favorites
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Settings className="w-4 h-4 text-slate-400" />
                            {t('settings')}
                          </Link>
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Shield className="w-4 h-4 text-slate-400" />
                            Admin
                          </Link>
                        </div>

                        <div className="border-t border-slate-100 pt-1">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
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

          {/* Mobile - User Avatar Only (Navigation moved to BottomNav) */}
          <div className="flex md:hidden items-center gap-2">
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
                        <UserCircle className="w-4 h-4 text-slate-400" />
                        {t('profile')}
                      </Link>
                      <Link
                        href="/favorites"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        Favorites
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        {t('settings')}
                      </Link>
                    </div>

                    <div className="px-4 py-2 border-t border-slate-100">
                      <LanguageSwitcher />
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
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
    </nav>
  );
}
