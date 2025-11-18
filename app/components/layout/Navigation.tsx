'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '../ui/Button';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, UserCircle, Shield } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const t = useTranslations('nav');

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
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
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">{user.email}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        href="/profile"
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCircle className="w-4 h-4" />
                        {t('profile')}
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
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('home')}
              </Link>
              <Link
                href="/sessions"
                className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('sessions')}
              </Link>
              {user && (
                <>
                  <Link
                    href="/my-sessions"
                    className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('mySessions')}
                  </Link>
                  <Link
                    href="/messages"
                    className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('messages')}
                  </Link>
                </>
              )}
              <div className="flex flex-col space-y-2 pt-2 border-t">
                <div className="px-3">
                  <LanguageSwitcher />
                </div>
                {user ? (
                  <>
                    <div className="px-3 py-2 text-sm text-gray-600">
                      {user.email}
                    </div>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('signOut')}
                    </Button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
