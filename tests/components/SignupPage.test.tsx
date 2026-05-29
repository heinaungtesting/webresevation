import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SignupPage from '@/app/[locale]/(auth)/signup/page';
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

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders signup form items', () => {
    render(<SignupPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmPassword/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /createAccountButton/i })).toBeInTheDocument();
  });

  it('triggers form loading feedback on submission and prevents double submissions', async () => {
    let resolveSubmit: (val: any) => void = () => {};
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });
    (csrfPost as any).mockReturnValue(submitPromise);

    render(<SignupPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmPassword/i);
    const agreeCheckbox = screen.getByRole('checkbox');
    const signupButton = screen.getByRole('button', { name: /createAccountButton/i });

    // Fill in credentials
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(agreeCheckbox);

    // Submit form
    const form = signupButton.closest('form')!;
    fireEvent.submit(form);

    // Should call csrfPost once
    expect(csrfPost).toHaveBeenCalledTimes(1);

    // Check loading indicator and that button is disabled
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /signingUp/i });
      expect(button).toBeDisabled();
    });

    // Submit again - should NOT call csrfPost again
    fireEvent.submit(form);
    expect(csrfPost).toHaveBeenCalledTimes(1);

    // Complete the submission
    resolveSubmit({ user: {}, requiresEmailVerification: false });
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /createAccountButton/i });
      expect(button).not.toBeDisabled();
    });
  });
});
