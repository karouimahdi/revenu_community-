import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { Suspense } from 'react';
import { Providers } from './Providers';
import { SessionBoundary } from './SessionBoundary';
import { Header } from './Header';
import { Toaster } from '@/components/Toaster';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Self-hosted, not next/font/google — fetching Playfair Display from
// Google's CDN at build time was flaky (Turbopack's font loader surfaces a
// failed/odd fetch as a confusing "Module not found" rather than a network
// error). Files are the same latin-subset woff2 Google itself serves,
// downloaded once from fonts.gstatic.com.
const playfairDisplay = localFont({
  variable: '--font-playfair-display',
  src: [
    { path: '../fonts/playfair-display-700.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/playfair-display-900.woff2', weight: '900', style: 'normal' },
  ],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Communauté Le Revenu',
  description: 'Forum-style community space for Le Revenu readers.',
};

export const instant = false;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-2 text-ink">
        <Providers>
          <Suspense fallback={null}>
            <SessionBoundary />
          </Suspense>
          <Header />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
