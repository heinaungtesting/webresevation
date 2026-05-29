import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SettingsPage from '@/app/[locale]/settings/page';
import { useAuth } from '@/app/contexts/AuthContext';
import { csrfPatch } from '@/lib/csrfClient';

// Mock useParams, useRouter
vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>();
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      refresh: vi.fn(),
    }),
    useParams: () => ({ locale: 'en' }),
  };
});

// Mock the AuthContext
vi.mock('@/app/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock csrfPatch
vi.mock('@/lib/csrfClient', () => ({
  csrfPatch: vi.fn(),
}));

describe('SettingsPage Component', () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
  });

  it('renders settings fields and updates successfully', async () => {
    // Arrange: Mock the API response for initial profile load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'user-1',
        language_preference: 'ja',
        notification_email: true,
        notification_push: false,
      }),
    });

    // Act
    render(<SettingsPage />);

    // Assert initial loading and form population
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });

    const emailCheckbox = screen.getByLabelText(/notifications.email.title/i) as HTMLInputElement;
    const pushCheckbox = screen.getByLabelText(/notifications.push.title/i) as HTMLInputElement;

    expect(emailCheckbox.checked).toBe(true);
    expect(pushCheckbox.checked).toBe(false);

    // Arrange: Mock success on csrfPatch
    let resolvePatch: (val: any) => void = () => {};
    const patchPromise = new Promise((resolve) => {
      resolvePatch = resolve;
    });
    (csrfPatch as any).mockReturnValueOnce(patchPromise);

    // Change setting and submit
    fireEvent.click(pushCheckbox);
    expect(pushCheckbox.checked).toBe(true);

    const form = screen.getByRole('button', { name: /saveButton/ }).closest('form')!;
    fireEvent.submit(form);

    // Assert: should call csrfPatch
    expect(csrfPatch).toHaveBeenCalledTimes(1);
    expect(csrfPatch).toHaveBeenCalledWith('/api/users/me', {
      language_preference: 'ja',
      notification_email: true,
      notification_push: true,
    });

    // Assert: button should be in saving state and the Save icon is hidden, while loader is present
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /saving/ });
      expect(button).toBeDisabled();
      expect(button.querySelector('.lucide-save')).toBeNull(); // Save icon should be omitted during loading
      expect(button.querySelector('.lucide-loader-circle')).not.toBeNull(); // Loader should be present
    });

    // Complete patch
    resolvePatch({});

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saveButton/ })).not.toBeDisabled();
    });
  });
});
