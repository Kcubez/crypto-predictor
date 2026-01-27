// Binance API for historical candlestick data
export interface Candlestick {
  time: number; // Open time (timestamp)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

// Fetch historical candlestick data from Binance
export async function fetchBinanceKlines(
  symbol: string = 'BTCUSDT',
  interval: '15m' | '1h' | '1d' = '15m',
  limit: number = 100
): Promise<Candlestick[]> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Binance klines');
    }

    const data = await response.json();

    // Convert Binance format to our format
    return data.map((kline: any) => ({
      time: kline[0], // Open time
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));
  } catch (error) {
    console.error('Error fetching Binance klines:', error);
    return [];
  }
}

// Map our timeframe to Binance interval
export function mapTimeframeToBinanceInterval(timeframe: '1week'): '1d' {
  return '1d'; // Use 1-day candles for 1-week prediction
}

// Fetch current BTC price from Binance
export async function fetchBinanceCurrentPrice(symbol: string = 'BTCUSDT'): Promise<number | null> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
      next: { revalidate: 5 }, // Cache for 5 seconds (very fresh data)
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Binance current price');
    }

    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('Error fetching Binance current price:', error);
    return null;
  }
}

// Supported trading pairs
export const TRADING_PAIRS = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  GOLD: 'PAXGUSDT', // PAX Gold - gold-backed token (1 PAXG = 1 fine troy ounce of gold)
} as const;

// Asset metadata for display
export interface AssetInfo {
  symbol: string;
  name: string;
  icon: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

export const ASSET_INFO: Record<keyof typeof TRADING_PAIRS, AssetInfo> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    color: '#F7931A',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-yellow-500',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    color: '#627EEA',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-purple-500',
  },
  GOLD: {
    symbol: 'PAXG',
    name: 'Gold (PAXG)',
    icon: '🪙',
    color: '#FFD700',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-amber-600',
  },
};

// Fallback prices if API fails
export const FALLBACK_PRICES = {
  BTC: 95000,
  ETH: 3200,
  GOLD: 2650,
};

export const FALLBACK_BTC_PRICE = FALLBACK_PRICES.BTC;

// Fetch multiple asset prices at once
export interface MultiAssetPrice {
  asset: keyof typeof TRADING_PAIRS;
  price: number;
  change24h?: number;
  timestamp: number;
}

export async function fetchMultipleAssetPrices(
  assets: (keyof typeof TRADING_PAIRS)[] = ['BTC', 'GOLD']
): Promise<MultiAssetPrice[]> {
  try {
    // Fetch all ticker data for 24h change
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      next: { revalidate: 5 },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Binance ticker data');
    }

    const allTickers = await response.json();

    const results: MultiAssetPrice[] = [];

    for (const asset of assets) {
      const symbol = TRADING_PAIRS[asset];
      const ticker = allTickers.find((t: any) => t.symbol === symbol);

      if (ticker) {
        results.push({
          asset,
          price: parseFloat(ticker.lastPrice),
          change24h: parseFloat(ticker.priceChangePercent),
          timestamp: Date.now(),
        });
      } else {
        // Fallback to simple price fetch
        const price = await fetchBinanceCurrentPrice(symbol);
        if (price) {
          results.push({
            asset,
            price,
            timestamp: Date.now(),
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error fetching multiple asset prices:', error);
    // Return fallback prices
    return assets.map(asset => ({
      asset,
      price: FALLBACK_PRICES[asset],
      timestamp: Date.now(),
    }));
  }
}

// Fetch 24h ticker data for an asset (includes price change)
export interface Ticker24h {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
}

export async function fetch24hTicker(symbol: string = 'BTCUSDT'): Promise<Ticker24h | null> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
      next: { revalidate: 5 },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch 24h ticker');
    }

    const data = await response.json();

    return {
      symbol: data.symbol,
      lastPrice: parseFloat(data.lastPrice),
      priceChange: parseFloat(data.priceChange),
      priceChangePercent: parseFloat(data.priceChangePercent),
      highPrice: parseFloat(data.highPrice),
      lowPrice: parseFloat(data.lowPrice),
      volume: parseFloat(data.volume),
      quoteVolume: parseFloat(data.quoteVolume),
    };
  } catch (error) {
    console.error('Error fetching 24h ticker:', error);
    return null;
  }
}
