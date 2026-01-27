'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  fetchMultipleAssetPrices,
  fetch24hTicker,
  TRADING_PAIRS,
  ASSET_INFO,
  FALLBACK_PRICES,
  MultiAssetPrice,
  Ticker24h,
} from '@/lib/binance-api';
import { LoadingSpinner } from './loading-spinner';

// MMK exchange rate from ExchangeRate API (official rate)

// Fetch MMK rate from ExchangeRate API
async function fetchMMKRate(): Promise<{ rate: number | null; source: string }> {
  try {
    // Using open.er-api.com (free, no API key required)
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

interface AssetPriceCardProps {
  assets?: (keyof typeof TRADING_PAIRS)[];
  showRefreshButton?: boolean;
  compact?: boolean;
  showMMK?: boolean;
}

export function AssetPriceCard({
  assets = ['BTC', 'GOLD'],
  showRefreshButton = true,
  compact = false,
  showMMK = true,
}: AssetPriceCardProps) {
  const [prices, setPrices] = useState<Map<keyof typeof TRADING_PAIRS, MultiAssetPrice>>(new Map());
  const [tickers, setTickers] = useState<Map<string, Ticker24h>>(new Map());
  const [mmkRate, setMmkRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchPrices = async () => {
    setIsLoading(true);
    try {
      const [priceData, mmkRateResult, ...tickerData] = await Promise.all([
        fetchMultipleAssetPrices(assets),
        fetchMMKRate(),
        ...assets.map(asset => fetch24hTicker(TRADING_PAIRS[asset])),
      ]);

      // Update MMK rate from P2P result
      setMmkRate(mmkRateResult.rate);

      // Update prices
      const newPrices = new Map<keyof typeof TRADING_PAIRS, MultiAssetPrice>();
      priceData.forEach((p: MultiAssetPrice) => newPrices.set(p.asset, p));
      setPrices(newPrices);

      // Update tickers
      const newTickers = new Map<string, Ticker24h>();
      tickerData.forEach((ticker: Ticker24h | null, index: number) => {
        if (ticker) {
          newTickers.set(assets[index], ticker);
        }
      });
      setTickers(newTickers);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [assets.join(',')]);

  const formatPrice = (price: number, asset: keyof typeof TRADING_PAIRS) => {
    // Gold typically has 2 decimal places, BTC/ETH more
    const decimals = asset === 'GOLD' ? 2 : 2;
    return price.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatMMK = (usdPrice: number) => {
    if (mmkRate === null) return 'Loading...';
    const mmkPrice = usdPrice * mmkRate;
    if (mmkPrice >= 1000000000) {
      return `${(mmkPrice / 1000000000).toFixed(2)}B`;
    } else if (mmkPrice >= 1000000) {
      return `${(mmkPrice / 1000000).toFixed(2)}M`;
    } else if (mmkPrice >= 1000) {
      return `${(mmkPrice / 1000).toFixed(1)}K`;
    }
    return mmkPrice.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const formatChange = (change: number | undefined) => {
    if (change === undefined) return null;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getChangeColor = (change: number | undefined) => {
    if (change === undefined || Math.abs(change) < 0.01) return 'text-gray-400';
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getChangeIcon = (change: number | undefined) => {
    if (change === undefined || Math.abs(change) < 0.01) {
      return <Minus className="w-4 h-4" />;
    }
    return change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-3">
        {assets.map(asset => {
          const priceData = prices.get(asset);
          const ticker = tickers.get(asset);
          const info = ASSET_INFO[asset];
          const price = priceData?.price || FALLBACK_PRICES[asset];
          const change = ticker?.priceChangePercent ?? priceData?.change24h;

          return (
            <div
              key={asset}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-linear-to-r ${info.gradientFrom} ${info.gradientTo} bg-opacity-10 border border-white/10`}
            >
              <span className="text-lg">{info.icon}</span>
              <div className="flex flex-col">
                <span className="text-xs text-gray-300">{info.symbol}</span>
                <span className="text-sm font-bold text-white">${formatPrice(price, asset)}</span>
              </div>
              {change !== undefined && (
                <span className={`text-xs font-medium ${getChangeColor(change)}`}>
                  {formatChange(change)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm overflow-hidden">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Live Prices from Binance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {lastUpdated.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {showRefreshButton && (
              <Button
                onClick={fetchPrices}
                disabled={isLoading}
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-purple-500/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {/* MMK Exchange Rate Card */}
        {showMMK && (
          <div className="mb-4 p-3 rounded-lg bg-linear-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">K</span>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-300">USD/MMK Rate</h3>
                  <p className="text-[10px] text-gray-500">Official Rate</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-400">
                  {mmkRate !== null ? (
                    <>
                      {mmkRate.toLocaleString()} <span className="text-xs text-gray-400">MMK</span>
                    </>
                  ) : (
                    <span className="text-gray-500">Loading...</span>
                  )}
                </p>
                <p className="text-[10px] text-gray-500">per 1 USDT</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assets.map(asset => {
            const priceData = prices.get(asset);
            const ticker = tickers.get(asset);
            const info = ASSET_INFO[asset];
            const price = priceData?.price || FALLBACK_PRICES[asset];
            const change = ticker?.priceChangePercent ?? priceData?.change24h;
            const high = ticker?.highPrice;
            const low = ticker?.lowPrice;
            const volume = ticker?.quoteVolume;

            return (
              <div
                key={asset}
                className={`relative p-4 rounded-xl bg-linear-to-br ${info.gradientFrom}/10 ${info.gradientTo}/5 border border-white/5 overflow-hidden group hover:border-white/20 transition-all duration-300`}
              >
                {/* Decorative background glow */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${info.gradientFrom}/20 ${info.gradientTo}/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`}
                />

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-full bg-linear-to-br ${info.gradientFrom} ${info.gradientTo} flex items-center justify-center shadow-lg`}
                      >
                        <span className="text-xl text-white">{info.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{info.name}</h3>
                        <p className="text-xs text-gray-400">{info.symbol}/USDT</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 ${getChangeColor(change)}`}>
                      {getChangeIcon(change)}
                      <span className="text-sm font-medium">{formatChange(change)}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span className="text-gray-400">Loading...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-2xl sm:text-3xl font-bold text-white">
                          ${formatPrice(price, asset)}
                        </p>
                        {showMMK && (
                          <p className="text-sm text-emerald-400/80 mt-1">
                            ≈ {formatMMK(price)} MMK
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* 24h Stats */}
                  {ticker && (
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                          24h High
                        </p>
                        <p className="text-xs font-medium text-green-400">
                          ${formatPrice(high || 0, asset)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">24h Low</p>
                        <p className="text-xs font-medium text-red-400">
                          ${formatPrice(low || 0, asset)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Volume</p>
                        <p className="text-xs font-medium text-gray-300">
                          ${((volume || 0) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
