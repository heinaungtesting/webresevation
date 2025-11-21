'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Button from '@/app/components/ui/Button';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
  backHref = '/',
  backLabel = 'Back',
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <Link href={backHref}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <article className="prose prose-slate max-w-none">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            {title}
          </h1>

          {/* Last Updated */}
          <p className="text-sm text-slate-500 mb-8 not-prose">
            Last updated: {lastUpdated}
          </p>

          {/* Legal Content */}
          <div className="space-y-8 text-slate-700 leading-relaxed">
            {children}
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>SportsMatch Tokyo</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-slate-700 transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-slate-700 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Reusable section component for legal pages
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 border-b border-slate-200 pb-2">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

// Disclaimer banner component
export function DisclaimerBanner({ locale }: { locale: string }) {
  const content = locale === 'ja' ? {
    text: 'SportsMatch Tokyoは大学生によって開発されたベータ版プロジェクトです。サービスは現状有姿で提供され、いかなる保証もありません。自己責任でスポーツを楽しんでください。',
  } : {
    text: 'SportsMatch Tokyo is a beta project developed by university students. The service is provided "as-is" without any guarantees. Please play sports responsibly.',
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 not-prose">
      <p className="text-amber-800 text-sm font-medium">
        {content.text}
      </p>
    </div>
  );
}
