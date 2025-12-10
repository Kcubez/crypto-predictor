import { Candlestick } from "./binance-api";

export interface AIPrediction {
  predictions: number[]; // Array of 7 predicted prices
  confidence: number; // 0-100
  reasoning: string;
  trend: "bullish" | "bearish" | "neutral";
  recommendation: {
    action: "BUY" | "SELL" | "HOLD";
    entryZone: string;
    target: string;
    stopLoss: string;
  };
  marketContext: string;
}

export async function generateAIPredictions(
  historicalData: Candlestick[],
  timeframe: "1week",
  forceRefresh: boolean = false
): Promise<AIPrediction | null> {
  try {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        historicalData,
        timeframe,
        forceRefresh, // Tell server to bypass cache
      }),
    });

    const data = await response.json();

    // If quota exceeded or error, return null to use fallback
    if (!response.ok || data.useFallback) {
      console.log("Using fallback predictions:", data.error || "API unavailable");
      return null;
    }

    return data as AIPrediction;
  } catch (error) {
    console.error("Error generating AI predictions:", error);
    return null;
  }
}

// Fallback predictions using statistical methods (if AI fails)
export function generateFallbackPredictions(
  historicalData: Candlestick[],
  count: number = 7
): number[] {
  const prices = historicalData.map((c) => c.close);
  const lastPrice = prices[prices.length - 1];

  // Calculate volatility
  let totalChange = 0;
  for (let i = 1; i < prices.length; i++) {
    totalChange += Math.abs((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  const avgVolatility = totalChange / (prices.length - 1);

  // Calculate trend
  const recentPrices = prices.slice(-10);
  const olderPrices = prices.slice(-20, -10);
  const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
  const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length;
  const trend = (recentAvg - olderAvg) / olderAvg;

  // Generate predictions
  const predictions: number[] = [];
  let currentPrice = lastPrice;

  for (let i = 0; i < count; i++) {
    const randomFactor = (Math.random() - 0.5) * 2;
    const trendFactor = trend * 0.3;
    const volatilityFactor = avgVolatility * randomFactor;
    const meanReversion = -((currentPrice - lastPrice) / lastPrice) * 0.1;

    const priceChange = currentPrice * (trendFactor + volatilityFactor + meanReversion);
    currentPrice = currentPrice + priceChange;
    predictions.push(Math.round(currentPrice * 100) / 100);
  }

  return predictions;
}
