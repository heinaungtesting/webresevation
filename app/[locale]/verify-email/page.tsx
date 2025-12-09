'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Mail, CheckCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const email = searchParams.get('email');
  const t = useTranslations('verifyEmail');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">
            {t('sentTo')}
          </p>
          {email && (
            <p className="text-blue-600 font-semibold mt-2">{email}</p>
          )}
        </div>

        <Card padding="lg">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">{t('checkInbox')}</p>
                <p>{t('clickLink')}</p>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>{t('didntReceive')}</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t('checkSpam')}</li>
                <li>{t('correctEmail')}</li>
                <li>{t('waitMinutes')}</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <Link href={`/${locale}/login`}>
                <Button variant="outline" fullWidth>
                  {t('backToLogin')}
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('alreadyVerified')}{' '}
            <Link href={`/${locale}/login`} className="text-blue-600 hover:text-blue-800 font-medium">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
