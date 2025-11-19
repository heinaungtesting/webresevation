'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Button from '../ui/Button';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, UserCircle, Shield, X, Menu, Heart } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    setIsMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">
              ⚽ SportsMatch
            </div>
            <span className="text-sm text-gray-500 hidden sm:inline">Tokyo</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t('home')}
            </Link>
            <Link href="/sessions" className="text-gray-700 hover:text-blue-600 transition-colors">
              {t('sessions')}
            </Link>
            {user && (
              <>
                <Link href="/my-sessions" className="text-gray-700 hover:text-blue-600 transition-colors">
                  {t('mySessions')}
                </Link>
                <Link href="/messages" className="text-gray-700 hover:text-blue-600 transition-colors">
                  {t('messages')}
                </Link>
              </>
            )}
            <div className="flex items-center space-x-3">
              <LanguageSwitcher />
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px]"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm max-w-[120px] truncate hidden lg:block">{displayName}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <Link
                        href="/profile"
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCircle className="w-4 h-4" />
                        {t('profile')}
                      </Link>
                      <Link
                        href="/favorites"
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart className="w-4 h-4" />
                        Favorites
                      </Link>
                      <Link
                        href="/settings"
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        {t('settings')}
                      </Link>
                      <Link
                        href="/admin"
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Shield className="w-4 h-4" />
                        Admin
                      </Link>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('signOut')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="primary" size="sm">
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
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
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
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('home')}
              </Link>
              <Link
                href="/sessions"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('sessions')}
              </Link>
              {user && (
                <>
                  <Link
                    href="/my-sessions"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('mySessions')}
                  </Link>
                  <Link
                    href="/messages"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('messages')}
                  </Link>
                </>
              )}

              <div className="my-2 border-t border-gray-200" />

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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-medium text-white">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserCircle className="w-5 h-5" />
                    {t('profile')}
                  </Link>
                  <Link
                    href="/favorites"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5" />
                    Favorites
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5" />
                    {t('settings')}
                  </Link>
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="w-5 h-5" />
                    Admin
                  </Link>

                  <div className="my-2 border-t border-gray-200" />

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
                      <LogOut className="w-4 h-4 mr-2" />
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
                      <Button variant="primary" fullWidth>
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
