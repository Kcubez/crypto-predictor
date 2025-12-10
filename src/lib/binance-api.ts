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
  symbol: string = "BTCUSDT",
  interval: "15m" | "1h" | "1d" = "15m",
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
      throw new Error("Failed to fetch Binance klines");
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
    console.error("Error fetching Binance klines:", error);
    return [];
  }
}

// Map our timeframe to Binance interval
export function mapTimeframeToBinanceInterval(
  timeframe: "1week"
): "1d" {
  return "1d"; // Use 1-day candles for 1-week prediction
}

// Fetch current BTC price from Binance
export async function fetchBinanceCurrentPrice(
  symbol: string = "BTCUSDT"
): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
      {
        next: { revalidate: 5 }, // Cache for 5 seconds (very fresh data)
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch Binance current price");
    }

    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error("Error fetching Binance current price:", error);
    return null;
  }
}

// Fallback BTC price if API fails
export const FALLBACK_BTC_PRICE = 95000;
