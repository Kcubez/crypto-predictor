import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/navigation';
import { PredictionProvider } from '@/contexts/prediction-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Business Dashboard - AI-Powered Daily Bitcoin Price Prediction',
  description:
    'Automated daily Bitcoin price predictions using Gemini AI and advanced technical analysis',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PredictionProvider>
          <Suspense
            fallback={
              <nav className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800" />
            }
          >
            <Navigation />
          </Suspense>
          <div className="pt-16">{children}</div>
        </PredictionProvider>
      </body>
    </html>
  );
}
