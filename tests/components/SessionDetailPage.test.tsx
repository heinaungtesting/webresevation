import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SessionDetailPage from '@/app/[locale]/sessions/[id]/page';
import { useAuth } from '@/app/contexts/AuthContext';
import { csrfDelete, csrfPost } from '@/lib/csrfClient';

// Mock useParams, useRouter
vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      refresh: vi.fn(),
    }),
    useParams: () => ({ id: 'session-123', locale: 'en' }),
  };
});

// Mock the AuthContext
vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock csrfClient operations
vi.mock('@/lib/csrfClient', () => ({
  csrfPost: vi.fn(),
  csrfDelete: vi.fn(),
}));

describe('SessionDetailPage Component - Button Animation Isolation', () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
  });

  it('isolates the loading spinner to the message button when clicked, without affecting the cancel button', async () => {
    // Arrange: Mock fetching the session where the user is an active participant
    const mockSession = {
      id: 'session-123',
      sport_type: 'futsal',
      title: 'Futsal Game',
      skill_level: 'intermediate',
      date_time: new Date().toISOString(),
      max_participants: 10,
      current_participants: 2,
      participants: [{ id: 'user-1', email: 'user@example.com' }],
      sport_center: { id: 'center-1', name_en: 'Center' },
      host: { id: 'user-2', username: 'host' },
    };

    // Return the appropriate mock responses for each URL
    let resolveOpenChat: (val: any) => void = () => {};
    const openChatPromise = new Promise((resolve) => {
      resolveOpenChat = resolve;
    });

    mockFetch.mockImplementation(async (url: any) => {
      const urlStr = typeof url === 'string' ? url : url.url || String(url);
      if (urlStr.includes('/conversation')) {
        return {
          ok: true,
          json: async () => await openChatPromise,
        };
      }
      if (urlStr.includes('/reviews')) {
        return {
          ok: true,
          json: async () => ({ reviews: [], averageRating: 0, totalReviews: 0 }),
        };
      }
      if (urlStr.includes('/api/sessions/session-123')) {
        return {
          ok: true,
          json: async () => mockSession,
        };
      }
      // Safe fallback for other sub-fetches
      return {
        ok: true,
        json: async () => ({}),
      };
    });

    // Act
    render(<SessionDetailPage />);

    // Wait for the session to load and render
    await waitFor(() => {
      expect(screen.getByText('futsal')).toBeInTheDocument();
    });

    const messageButton = screen.getByRole('button', { name: /openChatRoom/i });

    // Act: Click on the message button
    fireEvent.click(messageButton);

    // Assert: Message button is loading and has loading spinner, while cancel button is disabled but NOT loading
    // We dynamically query in waitFor to avoid React unmounting detached node issues
    await waitFor(() => {
      const activeMessageButton = screen.getByRole('button', { name: /loading/i });
      expect(activeMessageButton).toBeDisabled();
      expect(activeMessageButton.querySelector('.lucide-loader-circle')).not.toBeNull();
      
      const activeCancelButton = screen.getByRole('button', { name: /cancelAttendance/i });
      expect(activeCancelButton).toBeDisabled();
      expect(activeCancelButton.querySelector('.lucide-loader-circle')).toBeNull(); // Cancel should NOT have spinner
    });

    // Complete action
    resolveOpenChat({ id: 'conv-123' });
  });

  it('isolates the loading spinner to the cancel button when clicked, without affecting the message button', async () => {
    // Arrange: Mock fetching the session where the user is an active participant
    const mockSession = {
      id: 'session-123',
      sport_type: 'futsal',
      title: 'Futsal Game',
      skill_level: 'intermediate',
      date_time: new Date().toISOString(),
      max_participants: 10,
      current_participants: 2,
      participants: [{ id: 'user-1', email: 'user@example.com' }],
      sport_center: { id: 'center-1', name_en: 'Center' },
      host: { id: 'user-2', username: 'host' },
    };

    mockFetch.mockImplementation(async (url: any) => {
      const urlStr = typeof url === 'string' ? url : url.url || String(url);
      if (urlStr.includes('/reviews')) {
        return {
          ok: true,
          json: async () => ({ reviews: [], averageRating: 0, totalReviews: 0 }),
        };
      }
      if (urlStr.includes('/api/sessions/session-123')) {
        return {
          ok: true,
          json: async () => mockSession,
        };
      }
      return {
        ok: true,
        json: async () => ({}),
      };
    });

    // Act
    render(<SessionDetailPage />);

    // Wait for the session to load and render
    await waitFor(() => {
      expect(screen.getByText('futsal')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancelAttendance/i });

    // Mock csrfDelete call to remain pending
    let resolveDelete: (val: any) => void = () => {};
    const deletePromise = new Promise((resolve) => {
      resolveDelete = resolve;
    });
    (csrfDelete as any).mockReturnValueOnce(deletePromise);

    // Act: Click Cancel Attendance
    fireEvent.click(cancelButton);

    // Assert: Cancel button is in loading state, message button is disabled but NOT loading
    // We dynamically query in waitFor to avoid React unmounting detached node issues
    await waitFor(() => {
      const activeCancelButton = screen.getByRole('button', { name: /canceling/i });
      expect(activeCancelButton).toBeDisabled();
      expect(activeCancelButton.querySelector('.lucide-loader-circle')).not.toBeNull();

      const activeMessageButton = screen.getByRole('button', { name: /openChatRoom/i });
      expect(activeMessageButton).toBeDisabled();
      expect(activeMessageButton.querySelector('.lucide-loader-circle')).toBeNull(); // Message should NOT have spinner
    });

    // Complete action
    resolveDelete({});
  });
});
