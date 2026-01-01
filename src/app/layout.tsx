import type { Metadata } from 'next';
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
  title: 'BTC Predictor - AI-Powered Daily Bitcoin Price Prediction',
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
          <Navigation />
          <div className="pt-16">{children}</div>
        </PredictionProvider>
      </body>
    </html>
  );
}
