'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LoadingSpinner } from './loading-spinner';

// Fetch MMK rate from ExchangeRate API
async function fetchMMKRate(): Promise<{ rate: number | null; source: string }> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');

    if (!response.ok) {
      console.warn('ExchangeRate API error:', response.status);
      return { rate: null, source: 'error' };
    }

    const data = await response.json();

    if (data.result === 'success' && data.rates?.MMK) {
      const rate = Math.round(data.rates.MMK);
      console.log(`✅ ExchangeRate API MMK: ${rate}`);
      return { rate, source: 'exchangerate_api' };
    }

    return { rate: null, source: 'error' };
  } catch (error) {
    console.error('Error fetching MMK rate:', error);
    return { rate: null, source: 'error' };
  }
}

interface CurrencyRateCardProps {
  showRefreshButton?: boolean;
}

export function CurrencyRateCard({ showRefreshButton = true }: CurrencyRateCardProps) {
  const [mmkRate, setMmkRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchRate = async () => {
    setIsLoading(true);
    try {
      const result = await fetchMMKRate();
      setMmkRate(result.rate);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching rate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
    // Refresh every 5 minutes
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-xl overflow-hidden shadow-2xl">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
            <span className="text-xs sm:text-sm text-slate-400 font-medium">
              Live Exchange Rate
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-slate-500">
              {lastUpdated.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {showRefreshButton && (
              <Button
                onClick={fetchRate}
                disabled={isLoading}
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-slate-700/50 text-slate-400 hover:text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 sm:p-8">
          {/* Title Section */}
          <div className="flex flex-col items-center justify-center text-center mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-4">
              <span className="text-2xl sm:text-3xl font-bold text-white">K</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">
              USD/MMK Exchange Rate
            </h2>
            <p className="text-sm text-slate-400">Official Rate from ExchangeRate API</p>
          </div>

          {/* Main Rate Display */}
          <div className="bg-slate-800/50 rounded-2xl p-6 sm:p-8 border border-slate-700/50 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
              {/* USD Side */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                  <span className="text-3xl sm:text-4xl">💵</span>
                </div>
                <div>
                  <p className="text-sm text-slate-400">US Dollar</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">1 USD</p>
                </div>
              </div>

              {/* Equals Sign */}
              <div className="text-4xl sm:text-5xl text-slate-500 font-light">=</div>

              {/* MMK Side */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-400">K</span>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Myanmar Kyat</p>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-slate-400">Loading...</span>
                    </div>
                  ) : mmkRate !== null ? (
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-400">
                      {mmkRate.toLocaleString()} <span className="text-lg text-slate-400">MMK</span>
                    </p>
                  ) : (
                    <p className="text-xl text-red-400">Error loading rate</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <span className="text-sm">📊</span>
                </div>
                <span className="text-sm font-medium text-white">Data Source</span>
              </div>
              <p className="text-xs text-slate-400">
                Official exchange rate from ExchangeRate API. Data is updated regularly to provide
                accurate rates.
              </p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <span className="text-sm">⚠️</span>
                </div>
                <span className="text-sm font-medium text-white">Note</span>
              </div>
              <p className="text-xs text-slate-400">
                This is the official rate. Actual market rates and informal exchange rates may vary.
              </p>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Last updated:{' '}
              {lastUpdated.toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
