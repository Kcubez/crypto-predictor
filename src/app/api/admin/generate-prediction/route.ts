import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';
import { SupabaseStorage } from '@/lib/supabase-storage';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const storage = new SupabaseStorage();

/**
 * Fetch Bitcoin historical data from Binance
 */
async function fetchHistoricalData(days: number = 1000) {
  const endTime = Date.now();
  const startTime = endTime - days * 24 * 60 * 60 * 1000;

  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=${days}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch historical data');
  }

  const data = await response.json();

  return data.map((candle: any) => ({
    time: candle[0],
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]),
  }));
}

/**
 * Fetch current BTC price
 */
async function fetchCurrentPrice(): Promise<number> {
  const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');

  if (!response.ok) {
    throw new Error('Failed to fetch current price');
  }

  const data = await response.json();
  return parseFloat(data.price);
}

/**
 * Generate prediction using Gemini AI
 */
async function generatePrediction(historicalData: any[]) {
  const currentPrice = historicalData[historicalData.length - 1].close;

  const dataString = historicalData
    .map(
      (c: any, i: number) =>
        `${i + 1}. Close: $${c.close}, High: $${c.high}, Low: $${c.low}, Volume: ${c.volume}`
    )
    .join('\n');

  const prompt = `You are an expert cryptocurrency analyst specializing in Bitcoin price prediction.

Analyze the Bitcoin historical data and predict the NEXT DAY's closing price (UTC 00:00) with MAXIMUM ACCURACY.

HISTORICAL DATA (${historicalData.length} daily candles):
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

  return JSON.parse(jsonMatch[0]);
}

/**
 * POST /api/admin/generate-prediction
 * Admin-only endpoint to manually trigger prediction generation
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getSession();

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    console.log('🔐 Admin user triggering manual prediction generation...');

    // Step 1: Update yesterday's prediction with actual price
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    try {
      const actualPrice = await fetchCurrentPrice();
      await storage.updateWithActualPrice(yesterdayStr, actualPrice);
      console.log(`✅ Updated yesterday's prediction with actual price: $${actualPrice}`);
    } catch (error) {
      console.error("Error updating yesterday's prediction:", error);
      // Continue even if this fails
    }

    // Step 2: Fetch historical data
    console.log('📊 Fetching historical data...');
    const historicalData = await fetchHistoricalData(1000);

    // Step 3: Generate new prediction for tomorrow
    console.log('🔮 Generating prediction for tomorrow...');
    const prediction = await generatePrediction(historicalData);

    // Step 4: Save prediction to database with ALL fields
    const savedPrediction = await storage.savePrediction(
      prediction.predictions[0],
      prediction.confidence,
      prediction.trend,
      prediction.reasoning,
      undefined, // userId (will use admin)
      prediction.recommendation?.action || 'HOLD',
      prediction.recommendation?.entryZone || '',
      prediction.recommendation?.target || '',
      prediction.recommendation?.stopLoss || '',
      prediction.marketContext || ''
    );

    console.log('✅ Manual prediction generation completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Prediction generated successfully',
      prediction: savedPrediction,
    });
  } catch (error: any) {
    console.error('❌ Admin prediction generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate prediction',
      },
      { status: 500 }
    );
  }
}
