import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LoginPage from '@/app/[locale]/(auth)/login/page';
import { csrfPost } from '@/lib/csrfClient';

// Mock useParams, useRouter, useSearchParams
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

// Mock csrfPost
vi.mock('@/lib/csrfClient', () => ({
  csrfPost: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: vi.fn(),
    },
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form items', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('triggers form loading feedback on submission and prevents double submissions', async () => {
    let resolveSubmit: (val: any) => void = () => {};
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });
    (csrfPost as any).mockReturnValue(submitPromise);

    render(<LoginPage />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    // Fill in credentials
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit form
    const form = loginButton.closest('form')!;
    fireEvent.submit(form);

    // Should call csrfPost once
    expect(csrfPost).toHaveBeenCalledTimes(1);
    expect(csrfPost).toHaveBeenCalledWith('/api/auth/login', {
      email: 'user@example.com',
      password: 'password123',
    });

    // Check loading indicator and that button is disabled
    await waitFor(() => {
      const button = screen.getByTestId('login-button');
      expect(button).toBeDisabled();
      expect(screen.getByText(/loggingIn/i)).toBeInTheDocument();
    });

    // Click again - should NOT call csrfPost again
    fireEvent.submit(form);
    expect(csrfPost).toHaveBeenCalledTimes(1);

    // Complete the submission
    resolveSubmit({});
    await waitFor(() => {
      const button = screen.getByTestId('login-button');
      expect(button).not.toBeDisabled();
    });
  });
});
