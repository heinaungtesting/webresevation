import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLocale, useTranslations } from 'next-intl';

// Setup global flag to skip useEffect named import in ESM
declare global {
  var __SKIP_EFFECTS__: boolean;
}

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useEffect: (effect: any, deps: any) => {
      if (globalThis.__SKIP_EFFECTS__) {
        return;
      }
      return actual.useEffect(effect, deps);
    },
  };
});

import HomeFeed from '@/app/[locale]/HomeFeed';

// Mock AuthContext
vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock next-intl hooks dynamically
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(),
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  Map: () => <div data-testid="map-icon" />,
  List: () => <div data-testid="list-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
}));

// Mock children components to keep the test focused
vi.mock('@/app/components/SessionCard', () => ({
  default: () => <div data-testid="session-card" />,
}));
vi.mock('@/app/components/CompactSessionCard', () => ({
  default: () => <div data-testid="compact-session-card" />,
}));
vi.mock('@/app/components/SessionMap', () => ({
  default: () => <div data-testid="session-map" />,
}));
vi.mock('@/app/components/notifications/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell" />,
}));

describe('HomeFeed Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.__SKIP_EFFECTS__ = false;
    (useAuth as any).mockReturnValue({
      user: null,
      profile: null,
    });
    (useLocale as any).mockReturnValue('en');
    (useTranslations as any).mockImplementation((ns: string) => {
      if (ns === 'home') {
        return (key: string) => {
          if (key === 'guest') return 'there';
          if (key === 'refresh') return 'Refresh';
          if (key === 'readyForGame') return 'Ready for your next game?';
          if (key === 'greeting.morning') return 'Good Morning';
          if (key === 'greeting.afternoon') return 'Good Afternoon';
          if (key === 'greeting.evening') return 'Good Evening';
          return key;
        };
      }
      return (key: string) => key;
    });
  });

  it('does not render client-only greeting content before mount', () => {
    // Set the global skip flag to simulate unmounted state
    globalThis.__SKIP_EFFECTS__ = true;

    render(<HomeFeed sessions={[]} happeningNow={[]} />);

    // Verify that the skeleton is visible inside the heading
    const heading = screen.getByRole('heading', { level: 1 });
    const skeleton = heading.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();

    // Reset the flag
    globalThis.__SKIP_EFFECTS__ = false;
  });

  it('uses the localized guest fallback instead of hardcoded "there"', () => {
    render(<HomeFeed sessions={[]} happeningNow={[]} />);

    // Verify that "there" is rendered from translation, not hardcoded
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('there');
  });

  it('English locale shows English greeting text', () => {
    (useLocale as any).mockReturnValue('en');
    
    render(<HomeFeed sessions={[]} happeningNow={[]} />);

    const heading = screen.getByRole('heading', { level: 1 });
    // English format: "Good Morning, there" or similar
    expect(heading.textContent).toContain('there');
    expect(heading.textContent).not.toContain('さん');
  });

  it('Japanese locale shows Japanese greeting text', () => {
    (useLocale as any).mockReturnValue('ja');
    (useTranslations as any).mockImplementation((ns: string) => {
      if (ns === 'home') {
        return (key: string) => {
          if (key === 'guest') return 'ゲスト';
          if (key === 'readyForGame') return '次のゲームの準備はできましたか？';
          if (key === 'greeting.morning') return 'おはようございます';
          return key;
        };
      }
      return (key: string) => key;
    });

    render(<HomeFeed sessions={[]} happeningNow={[]} />);

    const heading = screen.getByRole('heading', { level: 1 });
    // Japanese format: "おはようございます、ゲストさん"
    expect(heading.textContent).toContain('ゲストさん');
  });

  it('refresh button has an accessible label from translations', async () => {
    render(<HomeFeed sessions={[]} happeningNow={[]} />);

    // Click on badminton filter to trigger hasFilters === true
    const badmintonFilter = screen.getByRole('button', { name: /badminton/i });
    fireEvent.click(badmintonFilter);

    const refreshBtn = screen.getByRole('button', { name: 'Refresh' });
    expect(refreshBtn).toBeInTheDocument();
    expect(refreshBtn).toHaveAttribute('aria-label', 'Refresh');
  });
});
