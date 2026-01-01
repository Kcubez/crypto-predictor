import { Candlestick } from "./binance-api";

export interface AIPrediction {
  predictions: number[]; // Array of 1 predicted price (tomorrow)
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
