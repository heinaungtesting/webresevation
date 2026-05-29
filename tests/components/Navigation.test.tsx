import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Navigation from '@/app/components/layout/Navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';

// Mock the AuthContext
vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock useParams and useRouter
vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return {
    ...actual,
    useRouter: vi.fn(),
    useParams: vi.fn(),
  };
});

// Mock LanguageSwitcher and NotificationBell since they might have complex logic
vi.mock('@/app/components/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher" />
}));
vi.mock('@/app/components/notifications/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell" />
}));

describe('Navigation', () => {
  const mockSignOut = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { email: 'test@example.com' },
      profile: { display_name: 'Test User' },
      signOut: mockSignOut,
    });
    (useParams as any).mockReturnValue({ locale: 'en' });
    (useRouter as any).mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
    });
  });

  it('should render correct localized links in the desktop user dropdown menu', async () => {
    render(<Navigation />);
    
    // Find the user menu button and click it to open the dropdown
    const userMenuButton = screen.getByText('Test User').closest('button');
    expect(userMenuButton).not.toBeNull();
    fireEvent.click(userMenuButton!);
    
    // Check if the Profile link has the correct href
    // next-intl useTranslations is mocked to return the key, so the text is 'profile'
    const profileLink = screen.getAllByText('profile')[0].closest('a');
    expect(profileLink).toHaveAttribute('href', '/en/profile');

    const settingsLink = screen.getAllByText('settings')[0].closest('a');
    expect(settingsLink).toHaveAttribute('href', '/en/settings');
  });

  it('should render correct localized links in the mobile user dropdown menu', async () => {
    render(<Navigation />);
    
    // Find the mobile user menu avatar button and click it to open the dropdown
    const avatarButtons = screen.getAllByRole('button', { name: /user menu/i });
    expect(avatarButtons.length).toBeGreaterThan(0);
    fireEvent.click(avatarButtons[0]);
    
    // Check if the Profile and Settings links have the correct localized hrefs in the mobile dropdown
    const profileLinks = screen.getAllByText('profile');
    const settingsLinks = screen.getAllByText('settings');
    
    expect(profileLinks[profileLinks.length - 1].closest('a')).toHaveAttribute('href', '/en/profile');
    expect(settingsLinks[settingsLinks.length - 1].closest('a')).toHaveAttribute('href', '/en/settings');
  });

  it('should call signOut and navigate to localized root when sign out is clicked', async () => {
    render(<Navigation />);
    
    // Open user menu
    const userMenuButton = screen.getByText('Test User').closest('button');
    fireEvent.click(userMenuButton!);
    
    // Find Sign Out button
    const signOutButton = screen.getAllByText('signOut')[0].closest('button');
    expect(signOutButton).not.toBeNull();
    
    fireEvent.click(signOutButton!);
    
    expect(mockSignOut).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en');
    });
  });

  it('should show loading spinner and disable sign out button during sign out', async () => {
    let resolveSignOut: () => void = () => {};
    const signOutPromise = new Promise<void>((resolve) => {
      resolveSignOut = resolve;
    });
    mockSignOut.mockReturnValue(signOutPromise);

    render(<Navigation />);
    
    // Open user menu
    const userMenuButton = screen.getByText('Test User').closest('button');
    fireEvent.click(userMenuButton!);
    
    // Click Sign Out
    const signOutButton = screen.getAllByText('signOut')[0].closest('button');
    fireEvent.click(signOutButton!);
    
    // Button should be disabled and show loading state
    expect(signOutButton).toBeDisabled();
    expect(screen.getAllByText(/signingOut/i).length).toBeGreaterThan(0);

    // Complete sign out
    resolveSignOut();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en');
    });
  });
});

