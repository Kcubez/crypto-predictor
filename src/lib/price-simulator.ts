import { Candlestick } from "./binance-api";
import { generateAIPredictions, generateFallbackPredictions } from "./gemini-ai";

export interface ChartDataPoint {
  time: string;
  price: number;
  isHistorical: boolean; // true = historical, false = predicted
}

export interface SimulationData {
  chartData: ChartDataPoint[];
  predictedPrice: number;
  recommendation: {
    action: "BUY" | "SELL" | "HOLD";
    entryZone: string;
    target: string;
    stopLoss: string;
    reasoning: string;
  };
  marketContext: string;
  aiConfidence?: number;
  aiTrend?: "bullish" | "bearish" | "neutral";
}

// Generate future predictions using Gemini AI
export async function generateFuturePredictions(
  historicalData: Candlestick[],
  timeframe: "1week",
  predictCount?: number,
  forceRefresh: boolean = false
): Promise<{ chartData: ChartDataPoint[]; aiPrediction: any }> {
  if (historicalData.length === 0) {
    return { chartData: [], aiPrediction: null };
  }

  // Set prediction count based on timeframe if not provided
  if (!predictCount) {
    predictCount = 7; // 7 days for 1 week
  }

  const chartData: ChartDataPoint[] = [];
  
  // Show only last 30 days of historical data on chart (for clean visualization)
  // But all data is sent to Gemini for analysis
  const displayHistoricalData = historicalData.slice(-30);
  
  // Add last 30 days to chart
  displayHistoricalData.forEach((candle) => {
    chartData.push({
      time: formatTimestamp(candle.time, timeframe),
      price: candle.close,
      isHistorical: true,
    });
  });

  // Try to get AI predictions (with forceRefresh option)
  const aiPrediction = await generateAIPredictions(historicalData, timeframe, forceRefresh);
  
  let predictions: number[];
  if (aiPrediction && aiPrediction.predictions) {
    predictions = aiPrediction.predictions;
  } else {
    // Fallback to statistical predictions
    predictions = generateFallbackPredictions(historicalData, predictCount);
  }

  // Add predicted data to chart
  const lastTime = historicalData[historicalData.length - 1].time;
  
  // Time interval in milliseconds
  const intervalMs = 24 * 60 * 60 * 1000; // 1 day intervals for 1-week prediction

  predictions.forEach((price, i) => {
    chartData.push({
      time: formatTimestamp(lastTime + (i + 1) * intervalMs, timeframe),
      price: Math.round(price * 100) / 100,
      isHistorical: false,
    });
  });

  return { chartData, aiPrediction };
}

function formatTimestamp(timestamp: number, timeframe: "1week"): string {
  const date = new Date(timestamp);
  
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export async function generatePriceSimulation(
  historicalData: Candlestick[],
  currentPrice: number,
  timeframe: "1week",
  forceRefresh: boolean = false
): Promise<SimulationData> {
  const { chartData, aiPrediction } = await generateFuturePredictions(historicalData, timeframe, undefined, forceRefresh);
  
  const predictedPrice = chartData[chartData.length - 1].price;
  const priceChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
  
  // Use Gemini AI's recommendation and market context directly
  // If AI prediction available, use it; otherwise use fallback
  const baseRecommendation = aiPrediction?.recommendation || generateFallbackRecommendation(currentPrice, predictedPrice, priceChange);
  
  // Add reasoning to recommendation (Gemini returns it separately)
  const recommendation = {
    ...baseRecommendation,
    reasoning: aiPrediction?.reasoning || baseRecommendation.reasoning
  };
  
  const marketContext = aiPrediction?.marketContext || generateFallbackMarketContext(priceChange);
  
  return {
    chartData,
    predictedPrice,
    recommendation,
    marketContext,
    aiConfidence: aiPrediction?.confidence,
    aiTrend: aiPrediction?.trend,
  };
}

// Fallback recommendation if Gemini AI fails
function generateFallbackRecommendation(
  currentPrice: number,
  predictedPrice: number,
  priceChange: number
): SimulationData["recommendation"] {
  if (priceChange < -2) {
    return {
      action: "SELL",
      entryZone: `$${Math.round(currentPrice - 1000).toLocaleString()} – $${Math.round(currentPrice + 1000).toLocaleString()}`,
      target: `$${Math.round(predictedPrice - 3000).toLocaleString()}`,
      stopLoss: `$${Math.round(currentPrice + 3500).toLocaleString()}`,
      reasoning: "Statistical analysis suggests bearish momentum. Consider short positions with tight stop-loss.",
    };
  } else if (priceChange > 2) {
    return {
      action: "BUY",
      entryZone: `$${Math.round(currentPrice - 1500).toLocaleString()} – $${Math.round(currentPrice + 500).toLocaleString()}`,
      target: `$${Math.round(predictedPrice + 3000).toLocaleString()}`,
      stopLoss: `$${Math.round(currentPrice - 3500).toLocaleString()}`,
      reasoning: "Statistical analysis shows bullish momentum. Entry near current levels recommended.",
    };
  } else {
    return {
      action: "HOLD",
      entryZone: `$${Math.round(currentPrice - 1000).toLocaleString()} – $${Math.round(currentPrice + 1000).toLocaleString()}`,
      target: `$${Math.round(predictedPrice).toLocaleString()}`,
      stopLoss: `$${Math.round(currentPrice - 2500).toLocaleString()}`,
      reasoning: "Statistical model suggests market consolidation. Wait for clearer signals.",
    };
  }
}

// Fallback market context if Gemini AI fails
function generateFallbackMarketContext(priceChange: number): string {
  if (priceChange < -2) {
    return "Statistical analysis detects bearish pressure. Historical patterns suggest potential downtrend continuation.";
  } else if (priceChange > 2) {
    return "Statistical analysis shows bullish signals. Historical data indicates potential uptrend continuation.";
  } else {
    return "Statistical model indicates market consolidation. Historical patterns show balanced pressure in a tight range.";
  }
}
