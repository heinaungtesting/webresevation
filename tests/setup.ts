import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn().mockImplementation(({ children, whileHover, whileTap, transition, ...props }) => {
      const React = require('react');
      // Filter out framer-motion specific props
      const { whileHover: _, whileTap: __, transition: ___, ...cleanProps } = props;
      return React.createElement('div', cleanProps, children);
    }),
    button: vi.fn().mockImplementation(({ children, whileHover, whileTap, transition, ...props }) => {
      const React = require('react');
      // Filter out framer-motion specific props
      const { whileHover: _, whileTap: __, transition: ___, ...cleanProps } = props;
      return React.createElement('button', cleanProps, children);
    }),
    span: vi.fn().mockImplementation(({ children, whileHover, whileTap, transition, ...props }) => {
      const React = require('react');
      const { whileHover: _, whileTap: __, transition: ___, ...cleanProps } = props;
      return React.createElement('span', cleanProps, children);
    }),
    form: vi.fn().mockImplementation(({ children, whileHover, whileTap, transition, ...props }) => {
      const React = require('react');
      const { whileHover: _, whileTap: __, transition: ___, ...cleanProps } = props;
      return React.createElement('form', cleanProps, children);
    }),
    section: vi.fn().mockImplementation(({ children, whileHover, whileTap, transition, ...props }) => {
      const React = require('react');
      const { whileHover: _, whileTap: __, transition: ___, ...cleanProps } = props;
      return React.createElement('section', cleanProps, children);
    }),
    nav: vi.fn().mockImplementation(({ children, whileHover, whileTap, transition, ...props }) => {
      const React = require('react');
      const { whileHover: _, whileTap: __, transition: ___, ...cleanProps } = props;
      return React.createElement('nav', cleanProps, children);
    }),
  },
  AnimatePresence: vi.fn().mockImplementation(({ children }) => children),
}));

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({ data: { user: null }, error: null })),
      getSession: vi.fn(() => ({ data: { session: null }, error: null })),
    },
  })),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    sportCenter: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    userSession: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  },
}));

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NODE_ENV: 'test',
    NEXTAUTH_SECRET: 'test-secret',
    DATABASE_URL: 'test-db-url',
    NEXT_PUBLIC_SUPABASE_URL: 'test-supabase-url',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-supabase-key',
  },
}));

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Global test utilities
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});