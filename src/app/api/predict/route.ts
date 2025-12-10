import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 15000; // 15 seconds between requests

export async function POST(request: NextRequest) {
  try {
    const { historicalData, timeframe, forceRefresh } = await request.json();

    if (!historicalData || !Array.isArray(historicalData)) {
      return NextResponse.json(
        { error: "Invalid historical data" },
        { status: 400 }
      );
    }

    // Create cache key
    const currentPrice = historicalData[historicalData.length - 1].close;
    const cacheKey = `${timeframe}-${Math.round(currentPrice)}`;

    // Check cache first (skip if forceRefresh is true)
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log("Returning cached prediction");
        return NextResponse.json(cached.data);
      }
    } else {
      console.log("Force refresh: bypassing cache");
    }

    // Rate limiting check
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      console.log("Rate limit hit, using fallback");
      return NextResponse.json(
        { error: "Rate limit", useFallback: true },
        { status: 429 }
      );
    }

    lastRequestTime = now;

    // Prepare ALL historical data for AI analysis
    // Send everything to Gemini for comprehensive pattern recognition
    const dataString = historicalData
      .map((c: any, i: number) => 
        `${i + 1}. Close: $${c.close}, High: $${c.high}, Low: $${c.low}, Volume: ${c.volume}`
      )
      .join("\n");
    
    const totalCandles = historicalData.length;

    // Fixed to 1 week prediction with 7 daily forecasts
    const predictionCount = 7;
    const predictionInterval = "daily";

    const prompt = `You are an expert cryptocurrency analyst specializing in Bitcoin price prediction.

Analyze the following Bitcoin historical data and predict the next 7 daily closing prices for the next 7 days.

HISTORICAL DATA (${totalCandles} daily candles - approximately ${Math.round(totalCandles / 30)} months of data):
${dataString}

CURRENT PRICE: $${currentPrice}

TASK:
1. Analyze the trend, volatility, support/resistance levels, and volume patterns
2. Predict the next 7 closing prices at daily intervals
3. Provide your confidence level (0-100)
4. Explain your reasoning in 2-3 sentences
5. Classify the overall trend as bullish, bearish, or neutral
6. Provide a trading recommendation (BUY/SELL/HOLD) with entry zone, target price, and stop loss
7. Provide market context analysis

RESPOND IN THIS EXACT JSON FORMAT (no markdown, just raw JSON):
{
  "predictions": [price1, price2, price3, price4, price5, price6, price7],
  "confidence": 85,
  "reasoning": "Your analysis here",
  "trend": "bullish",
  "recommendation": {
    "action": "BUY",
    "entryZone": "$90,000 - $92,000",
    "target": "$95,000",
    "stopLoss": "$88,000"
  },
  "marketContext": "Detailed market analysis here"
}

IMPORTANT: 
- Predictions should be realistic and consider multi-day trends
- Consider market volatility and historical patterns
- Be conservative with predictions
- Entry zone should be a price range around current price
- Target should be based on your 7th prediction
- Stop loss should protect against significant losses
- Market context should explain overall market conditions
- Return ONLY valid JSON, no other text`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text;

    if (!text) {
      throw new Error("Empty response from AI");
    }

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from AI");
    }

    const prediction = JSON.parse(jsonMatch[0]);

    // Validate predictions
    if (!Array.isArray(prediction.predictions) || prediction.predictions.length !== 7) {
      throw new Error(`Invalid predictions array: expected 7, got ${prediction.predictions?.length || 0}`);
    }

    // Cache the result
    cache.set(cacheKey, { data: prediction, timestamp: Date.now() });

    // Clean old cache entries
    for (const [key, value] of cache.entries()) {
      if (Date.now() - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    }

    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error("AI prediction error:", error);
    
    // If quota exceeded, tell client to use fallback
    if (error.status === 429 || error.message?.includes("quota")) {
      return NextResponse.json(
        { error: "Quota exceeded", useFallback: true },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to generate predictions", useFallback: true },
      { status: 500 }
    );
  }
}
