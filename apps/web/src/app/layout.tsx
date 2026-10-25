import type { Metadata } from 'next';
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google';
import { Suspense } from 'react';
import { Providers } from './Providers';
import { SessionBoundary } from './SessionBoundary';
import { Header } from './Header';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair-display',
  weight: ['700', '900'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Communauté Le Revenu',
  description: 'Forum-style community space for Le Revenu readers.',
};

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
        </Providers>
      </body>
    </html>
  );
}
