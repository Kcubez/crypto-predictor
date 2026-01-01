import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { SupabaseStorage } from '@/lib/supabase-storage';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const storage = new SupabaseStorage();

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 30000; // 30 seconds between requests (increased to avoid overload)

export async function POST(request: NextRequest) {
  try {
    const { historicalData, timeframe, forceRefresh } = await request.json();

    if (!historicalData || !Array.isArray(historicalData)) {
      return NextResponse.json({ error: 'Invalid historical data' }, { status: 400 });
    }

    // Create cache key
    const currentPrice = historicalData[historicalData.length - 1].close;
    const cacheKey = `${timeframe}-${Math.round(currentPrice)}`;

    // Check cache first (skip if forceRefresh is true)
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Returning cached prediction');
        return NextResponse.json(cached.data);
      }
    } else {
      console.log('Force refresh: bypassing cache');
    }

    // Rate limiting check
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      console.log('Rate limit hit, using fallback');
      return NextResponse.json({ error: 'Rate limit', useFallback: true }, { status: 429 });
    }

    lastRequestTime = now;

    // Prepare ALL historical data for AI analysis
    // Send everything to Gemini for comprehensive pattern recognition
    const dataString = historicalData
      .map(
        (c: any, i: number) =>
          `${i + 1}. Close: $${c.close}, High: $${c.high}, Low: $${c.low}, Volume: ${c.volume}`
      )
      .join('\n');

    const totalCandles = historicalData.length;

    // Fixed to 1 day prediction for better accuracy
    const predictionCount = 1;
    const predictionInterval = 'daily';

    const prompt = `You are an expert cryptocurrency analyst specializing in Bitcoin price prediction.

Analyze the Bitcoin historical data and predict the NEXT DAY's closing price (UTC 00:00) with MAXIMUM ACCURACY.

HISTORICAL DATA (${totalCandles} daily candles):
${dataString}

CURRENT PRICE: $${currentPrice}

CRITICAL ANALYSIS (Must Calculate):
1. **Bollinger Bands (20-day, 2 std dev)**
   - Upper band = resistance level
   - Lower band = support level
   - Current position relative to bands
   
2. **Multi-Timeframe Trend**
   - Last 7 days: Calculate % change and direction
   - Last 30 days: Calculate % change and direction
   - Full dataset: Overall trend strength
   
3. **Volume Confirmation**
   - Recent volume vs average volume
   - Volume trend (increasing/decreasing)
   - Price-volume correlation
   
4. **Key Technical Indicators**
   - RSI (14-day): Overbought (>70) or Oversold (<30)
   - MACD: Bullish/Bearish crossover
   - Moving Averages: 7-day, 20-day crossovers

PRICE CALCULATION REQUIREMENTS:
- Calculate EXACT support and resistance levels from historical data
- Use Fibonacci retracement levels (23.6%, 38.2%, 50%, 61.8%)
- Apply mean reversion: if price deviates >5% from 20-day MA, expect pullback
- Prediction must be SPECIFIC NUMBER, not range
- Show mathematical reasoning for the price level

PREDICTION RULES:
- Daily volatility: Typically 1-3% (max 5% unless major breakout)
- If price at upper Bollinger: Expect resistance/pullback
- If price at lower Bollinger: Expect support/bounce
- Strong volume + price move = sustainable trend
- Weak volume + price move = likely reversal

TASK:
1. Calculate all indicators above
2. Identify exact support/resistance levels
3. Predict EXACTLY 1 daily closing price (tomorrow) with specific number
4. Price must have mathematical justification
5. Confidence based on indicator alignment (all agree = high confidence)

RESPOND IN THIS EXACT JSON FORMAT (no markdown, just raw JSON):
{
  "predictions": [93500.50],
  "confidence": 82,
  "reasoning": "Bollinger upper band at $95K acts as resistance. RSI at 62 (neutral-bullish). MACD bullish crossover. 7-day trend +2.5%, 30-day trend +8%. Volume increasing 15% confirms uptrend. Tomorrow's target: $93,500 based on Fibonacci 38.2% retracement.",
  "trend": "bullish",
  "recommendation": {
    "action": "BUY",
    "entryZone": "$92,000 - $93,000",
    "target": "$94,500",
    "stopLoss": "$91,000"
  },
  "marketContext": "Bitcoin showing short-term bullish momentum with strong volume support. Bollinger Bands neutral. Key resistance at $94K-95K zone for tomorrow."
}

CRITICAL:
- Prediction will be tracked against actual price tomorrow
- Use EXACT calculations, not guesses
- Price must be mathematically justified
- Return ONLY valid JSON`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text;

    if (!text) {
      throw new Error('Empty response from AI');
    }

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const prediction = JSON.parse(jsonMatch[0]);

    // Validate predictions - expecting only 1 prediction now
    if (!Array.isArray(prediction.predictions) || prediction.predictions.length !== 1) {
      throw new Error(
        `Invalid predictions array: expected 1, got ${prediction.predictions?.length || 0}`
      );
    }

    // Cache the result
    cache.set(cacheKey, { data: prediction, timestamp: Date.now() });

    // Clean old cache entries
    for (const [key, value] of cache.entries()) {
      if (Date.now() - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    }

    // Save to JSON storage for history tracking
    try {
      await storage.savePrediction(
        prediction.predictions[0],
        prediction.confidence,
        prediction.trend || 'neutral',
        prediction.reasoning || 'Manual prediction',
        undefined, // userId (will use admin)
        prediction.recommendation?.action || 'HOLD',
        prediction.recommendation?.entryZone || '',
        prediction.recommendation?.target || '',
        prediction.recommendation?.stopLoss || '',
        prediction.marketContext || ''
      );
      console.log('✅ Prediction saved to history with recommendation fields');
    } catch (storageError) {
      console.error('Failed to save prediction to history:', storageError);
      // Don't fail the request if storage fails
    }

    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error('AI prediction error:', error);

    // If quota exceeded, tell client to use fallback
    if (error.status === 429 || error.message?.includes('quota')) {
      return NextResponse.json({ error: 'Quota exceeded', useFallback: true }, { status: 429 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate predictions', useFallback: true },
      { status: 500 }
    );
  }
}
