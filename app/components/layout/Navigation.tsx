'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Button from '../ui/Button';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, UserCircle, Shield, Menu, X, ChevronDown, Heart, Bell } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';
import NotificationBell from '../notifications/NotificationBell';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const t = useTranslations('nav');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

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
    setIsMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-strong shadow-soft py-2'
          : 'bg-transparent py-4'
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
              <div className="w-10 h-10 rounded-xl bg-gradient-ocean flex items-center justify-center text-white font-bold text-lg shadow-colored group-hover:shadow-glow transition-shadow duration-300">
                S
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent-emerald rounded-full border-2 border-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-bold text-slate-900">
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

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-slate-700" />
            ) : (
              <Menu className="w-6 h-6 text-slate-700" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden fixed inset-x-0 top-[65px] bottom-0 bg-white z-50 overflow-y-auto animate-in slide-in-from-top duration-200"
          >
            <div className="flex flex-col p-4 space-y-1">
              {/* Navigation Links */}
              <Link
                href="/"
                className="flex items-center px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('home')}
              </Link>
              <Link
                href="/sessions"
                className="flex items-center px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('sessions')}
              </Link>
              {user && (
                <>
                  <Link
                    href="/my-sessions"
                    className="flex items-center px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('mySessions')}
                  </Link>
                  <Link
                    href="/messages"
                    className="flex items-center px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('messages')}
                  </Link>
                </>
              )}

              <div className="my-2 border-t border-slate-200" />

              {/* User Section */}
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-medium">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserCircle className="w-5 h-5 text-slate-400" />
                    {t('profile')}
                  </Link>
                  <Link
                    href="/favorites"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5 text-slate-400" />
                    Favorites
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Bell className="w-5 h-5 text-slate-400" />
                    Notifications
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5 text-slate-400" />
                    {t('settings')}
                  </Link>
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="w-5 h-5 text-slate-400" />
                    Admin
                  </Link>

                  <div className="my-2 border-t border-slate-200" />

                  <div className="px-4 py-2">
                    <LanguageSwitcher />
                  </div>

                  <div className="px-4 pt-2">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={handleSignOut}
                      className="justify-center"
                    >
                      <LogOut className="w-5 h-5" />
                      {t('signOut')}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-4 py-2">
                    <LanguageSwitcher />
                  </div>
                  <div className="px-4 pt-2 space-y-2">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" fullWidth>
                        {t('login')}
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="gradient" fullWidth>
                        {t('signUp')}
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}