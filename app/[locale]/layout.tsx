import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import Navigation from '@/app/components/layout/Navigation';
import BottomNav from '@/app/components/layout/BottomNav';
import { AuthProvider } from '@/app/contexts/AuthContext';
import QueryProvider from '@/app/providers/QueryProvider';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <QueryProvider>
        <AuthProvider>
          <Navigation />
          <main className="pt-14 md:pt-16">{children}</main>
          <BottomNav />
        </AuthProvider>
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
