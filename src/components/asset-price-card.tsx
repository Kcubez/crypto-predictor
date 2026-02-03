'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Minus, ChevronDown, Check } from 'lucide-react';
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
  const [selectedAsset, setSelectedAsset] = useState<keyof typeof TRADING_PAIRS>(assets[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [prices, setPrices] = useState<Map<keyof typeof TRADING_PAIRS, MultiAssetPrice>>(new Map());
  const [tickers, setTickers] = useState<Map<string, Ticker24h>>(new Map());
  const [mmkRate, setMmkRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPrices = async () => {
    setIsLoading(true);
    try {
      const [priceData, mmkRateResult, ...tickerData] = await Promise.all([
        fetchMultipleAssetPrices(assets),
        fetchMMKRate(),
        ...assets.map(asset => fetch24hTicker(TRADING_PAIRS[asset])),
      ]);

      setMmkRate(mmkRateResult.rate);

      const newPrices = new Map<keyof typeof TRADING_PAIRS, MultiAssetPrice>();
      priceData.forEach((p: MultiAssetPrice) => newPrices.set(p.asset, p));
      setPrices(newPrices);

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
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [assets.join(',')]);

  const formatPrice = (price: number, asset: keyof typeof TRADING_PAIRS) => {
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

  const getChangeBgColor = (change: number | undefined) => {
    if (change === undefined || Math.abs(change) < 0.01) return 'bg-gray-500/10';
    return change >= 0 ? 'bg-green-500/10' : 'bg-red-500/10';
  };

  const getChangeIcon = (change: number | undefined) => {
    if (change === undefined || Math.abs(change) < 0.01) {
      return <Minus className="w-3.5 h-3.5" />;
    }
    return change >= 0 ? (
      <TrendingUp className="w-3.5 h-3.5" />
    ) : (
      <TrendingDown className="w-3.5 h-3.5" />
    );
  };

  // Get current asset data
  const currentPriceData = prices.get(selectedAsset);
  const currentTicker = tickers.get(selectedAsset);
  const currentInfo = ASSET_INFO[selectedAsset];
  const currentPrice = currentPriceData?.price || FALLBACK_PRICES[selectedAsset];
  const currentChange = currentTicker?.priceChangePercent ?? currentPriceData?.change24h;
  const high = currentTicker?.highPrice;
  const low = currentTicker?.lowPrice;
  const volume = currentTicker?.quoteVolume;

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
    <Card className="bg-slate-900/60 border-slate-700/50 backdrop-blur-xl overflow-hidden shadow-2xl">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
            <span className="text-xs sm:text-sm text-slate-400 font-medium">Live Prices</span>
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
                onClick={fetchPrices}
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

        {/* MMK Exchange Rate */}
        {showMMK && (
          <div className="px-4 sm:px-5 py-3 border-b border-slate-700/30 bg-linear-to-r from-emerald-500/5 to-teal-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-xs sm:text-sm font-bold text-white">K</span>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-slate-300">USD/MMK Rate</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500">Official Rate</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base sm:text-lg font-bold text-emerald-400">
                  {mmkRate !== null ? (
                    <>
                      {mmkRate.toLocaleString()} <span className="text-xs text-slate-400">MMK</span>
                    </>
                  ) : (
                    <span className="text-slate-500">Loading...</span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500">per 1 USDT</p>
              </div>
            </div>
          </div>
        )}

        {/* Asset Selector Dropdown */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-700/30">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/70 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br ${currentInfo.gradientFrom} ${currentInfo.gradientTo} flex items-center justify-center shadow-lg transition-transform group-hover:scale-105`}
                >
                  <span className="text-xl sm:text-2xl text-white">{currentInfo.icon}</span>
                </div>
                <div className="text-left">
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    {currentInfo.name}
                  </h3>
                  <p className="text-xs text-slate-400">{currentInfo.symbol}/USDT</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {assets.map(asset => {
                  const info = ASSET_INFO[asset];
                  const priceData = prices.get(asset);
                  const ticker = tickers.get(asset);
                  const price = priceData?.price || FALLBACK_PRICES[asset];
                  const change = ticker?.priceChangePercent ?? priceData?.change24h;
                  const isSelected = asset === selectedAsset;

                  return (
                    <button
                      key={asset}
                      onClick={() => {
                        setSelectedAsset(asset);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 sm:p-4 hover:bg-slate-700/50 transition-colors ${isSelected ? 'bg-slate-700/30' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-linear-to-br ${info.gradientFrom} ${info.gradientTo} flex items-center justify-center`}
                        >
                          <span className="text-lg sm:text-xl text-white">{info.icon}</span>
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-medium text-white">{info.name}</h4>
                          <p className="text-xs text-slate-400">{info.symbol}/USDT</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">
                            ${formatPrice(price, asset)}
                          </p>
                          <p className={`text-xs font-medium ${getChangeColor(change)}`}>
                            {formatChange(change)}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Price Display */}
        <div className="px-4 sm:px-5 py-5 sm:py-6">
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-slate-400">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                    ${formatPrice(currentPrice, selectedAsset)}
                  </p>
                  {showMMK && (
                    <p className="text-xs sm:text-sm text-emerald-400/80 mt-1 sm:mt-2 font-medium">
                      ≈ {formatMMK(currentPrice)} MMK
                    </p>
                  )}
                </>
              )}
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full ${getChangeBgColor(currentChange)} ${getChangeColor(currentChange)}`}
            >
              {getChangeIcon(currentChange)}
              <span className="text-sm sm:text-base font-semibold">
                {formatChange(currentChange)}
              </span>
            </div>
          </div>

          {/* 24h Stats Grid */}
          {currentTicker && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
                  24h High
                </p>
                <p className="text-sm sm:text-base font-bold text-green-400">
                  ${formatPrice(high || 0, selectedAsset)}
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
                  24h Low
                </p>
                <p className="text-sm sm:text-base font-bold text-red-400">
                  ${formatPrice(low || 0, selectedAsset)}
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
                  Volume
                </p>
                <p className="text-sm sm:text-base font-bold text-slate-300">
                  ${((volume || 0) / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
