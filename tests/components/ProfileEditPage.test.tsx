import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ProfileEditPage from '@/app/[locale]/profile/edit/page';
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

// Mock AvatarUpload to prevent rendering complex components
vi.mock('@/app/components/profile/AvatarUpload', () => ({
  default: () => <div data-testid="avatar-upload" />,
}));

describe('ProfileEditPage Component', () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { id: 'user-1', email: 'user@example.com' },
      refreshProfile: vi.fn(),
    });
  });

  it('renders edit profile fields and saves successfully', async () => {
    // Arrange: Mock the API response for initial profile load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'user-1',
        username: 'testuser',
        display_name: 'Test Name',
        bio: 'Hello world',
        location: 'Tokyo',
        sport_preferences: ['soccer'],
      }),
    });

    // Act
    render(<ProfileEditPage />);

    // Assert initial loading and form population
    await waitFor(() => {
      expect(screen.getByText('edit.title')).toBeInTheDocument();
    });

    const displayNameInput = screen.getByPlaceholderText('edit.displayNamePlaceholder') as HTMLInputElement;
    const bioTextarea = screen.getByPlaceholderText('edit.bioPlaceholder') as HTMLTextAreaElement;

    expect(displayNameInput.value).toBe('Test Name');
    expect(bioTextarea.value).toBe('Hello world');

    // Arrange: Mock success on csrfPatch
    let resolvePatch: (val: any) => void = () => {};
    const patchPromise = new Promise((resolve) => {
      resolvePatch = resolve;
    });
    (csrfPatch as any).mockReturnValueOnce(patchPromise);

    // Change display name and submit
    fireEvent.change(displayNameInput, { target: { value: 'New Test Name' } });
    expect(displayNameInput.value).toBe('New Test Name');

    const form = screen.getByRole('button', { name: /edit.saveChanges/ }).closest('form')!;
    fireEvent.submit(form);

    // Assert: should call csrfPatch
    expect(csrfPatch).toHaveBeenCalledTimes(1);
    expect(csrfPatch).toHaveBeenCalledWith('/api/users/me', {
      username: 'testuser',
      display_name: 'New Test Name',
      bio: 'Hello world',
      location: 'Tokyo',
      sport_preferences: ['soccer'],
    });

    // Assert: button should be in saving state and the Save icon is hidden, while loader is present
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /edit.saving/ });
      expect(button).toBeDisabled();
      expect(button.querySelector('.lucide-save')).toBeNull(); // Save icon should be omitted during loading
      expect(button.querySelector('.lucide-loader-circle')).not.toBeNull(); // Loader should be present
    });

    // Complete patch
    resolvePatch({});

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit.saveChanges/ })).not.toBeDisabled();
    });
  });
});
