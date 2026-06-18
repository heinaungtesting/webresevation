'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getAppUrl } from '@/lib/env';

/**
 * BUG-002 fix: /[locale]/forgot-password now exists.
 * Before: clicking "Forgot password?" on /login → 404. Auth recovery was dead.
 * After:  User enters email, gets a Supabase password-reset link.
 *
 * Source: /home/hermes/reports/sportsmatch-tokyo-beta-report.md (BUG-002)
 */
export default function ForgotPasswordPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('auth.forgotPassword');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/${locale}/reset-password`
        : `${getAppUrl()}/${locale}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );

      if (resetError) {
        // Don't reveal whether the email exists — show generic success either way
        // to prevent account enumeration. The actual error is logged for ops.
        console.error('resetPasswordForEmail error:', resetError);
      }

      // Always show success (even on Supabase error) to prevent account enumeration
      setSuccess(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      // Still show success to prevent enumeration
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-slate-600">
            {t('subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-large p-8 sm:p-10">
          {success ? (
            <div data-testid="forgot-password-success" className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {t('successTitle')}
              </h2>
              <p className="text-slate-600 text-sm mb-6">
                {t('successMessage', { email })}
              </p>
              <Link
                href={`/${locale}/login`}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
              >
                {t('backToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="email"
                label={t('emailLabel')}
                type="email"
                name="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoComplete="email"
                data-testid="forgot-password-email"
              />

              {error && (
                <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                fullWidth
                loading={loading}
                className="mt-6"
                data-testid="forgot-password-submit"
              >
                {loading ? t('sending') : t('submitButton')}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href={`/${locale}/login`}
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {t('backToLogin')}
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          {t('helpText')}{' '}
          <a href="mailto:support@sportsmatch.tokyo" className="underline hover:text-slate-700">
            support@sportsmatch.tokyo
          </a>
        </p>
      </div>
    </div>
  );
}
