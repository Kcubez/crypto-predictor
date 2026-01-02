// GitHub Actions script to generate daily BTC prediction
// Uses Vercel proxy to bypass Binance IP block

const { GoogleGenAI } = require('@google/genai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Your Vercel app URL (replace with actual URL)
const VERCEL_URL = process.env.VERCEL_URL || 'https://your-app.vercel.app';
const PROXY_API_KEY = process.env.BINANCE_PROXY_KEY || 'default-secret-key';

// Fetch via Vercel proxy
async function fetchViaProxy(endpoint, params = {}) {
  const fetch = (await import('node-fetch')).default;

  const queryParams = new URLSearchParams({
    key: PROXY_API_KEY, // Add API key for security
    endpoint,
    ...params,
  });

  const url = `${VERCEL_URL}/api/binance/proxy?${queryParams}`;
  console.log('Fetching via Vercel proxy:', endpoint);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Proxy error: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Proxy request failed');
  }

  return result.data;
}

// Fetch Bitcoin historical data via Vercel proxy
async function fetchHistoricalData(days = 1000) {
  console.log(`Fetching ${days} days of historical data via Vercel...`);

  const data = await fetchViaProxy('klines', {
    symbol: 'BTCUSDT',
    interval: '1d',
    limit: days.toString(),
  });

  return data.map(candle => ({
    time: candle[0],
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]),
  }));
}

// Fetch yesterday's closing price (for accurate prediction tracking)
async function fetchYesterdayClosingPrice() {
  console.log("Fetching yesterday's closing price via Vercel...");

  // Fetch last 2 days of candles
  const data = await fetchViaProxy('klines', {
    symbol: 'BTCUSDT',
    interval: '1d',
    limit: '2',
  });

  if (!data || data.length < 2) {
    throw new Error('Not enough historical data to get yesterday closing price');
  }

  // Get yesterday's candle (second to last)
  const yesterdayCandle = data[data.length - 2];
  const closingPrice = parseFloat(yesterdayCandle[4]); // Index 4 = close price

  console.log(`✅ Yesterday's closing price: $${closingPrice}`);
  return closingPrice;
}

// Generate prediction using Gemini AI
async function generatePrediction(historicalData) {
  const currentPrice = historicalData[historicalData.length - 1].close;
  const yesterdayPrice = historicalData[historicalData.length - 2].close;
  const priceChange = ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100;

  // Calculate simple moving averages
  const last7Days = historicalData.slice(-7);
  const last20Days = historicalData.slice(-20);
  const sma7 = last7Days.reduce((sum, d) => sum + d.close, 0) / 7;
  const sma20 = last20Days.reduce((sum, d) => sum + d.close, 0) / 20;

  const dataString = historicalData
    .slice(-100)
    .map(
      (c, i) =>
        `Day ${i + 1}: Close=$${c.close}, High=$${c.high}, Low=$${c.low}, Vol=$${c.volume.toFixed(
          2
        )}`
    )
    .join('\n');

  const prompt = `You are a highly experienced cryptocurrency analyst with 20+ years in financial markets and 10+ years specializing in Bitcoin technical analysis. Your predictions have historically achieved 95%+ accuracy by being CONSERVATIVE and data-driven.

CRITICAL INSTRUCTIONS:
1. Be CONSERVATIVE - Don't predict large price swings unless data strongly supports it
2. Focus on REALISTIC next-day movements (typically 1-3% for Bitcoin)
3. Consider market consolidation and mean reversion
4. Avoid overfitting to recent volatility

CURRENT MARKET STATE:
- Current Price: $${currentPrice}
- Yesterday's Price: $${yesterdayPrice}
- 24h Change: ${priceChange.toFixed(2)}%
- 7-Day SMA: $${sma7.toFixed(2)}
- 20-Day SMA: $${sma20.toFixed(2)}

HISTORICAL DATA (Last 100 daily candles, UTC 00:00 close):
${dataString}

REQUIRED TECHNICAL ANALYSIS:
1. **Bollinger Bands (20-day, 2 std dev)**: Calculate upper/lower bands, identify if price is overbought/oversold
2. **RSI (14-day)**: Estimate momentum, check for divergences
3. **Volume Analysis**: Compare recent volume to 20-day average, identify accumulation/distribution
4. **Support/Resistance**: Identify key levels from historical data
5. **Trend Analysis**: Multi-timeframe (7-day, 20-day, 50-day trends)
6. **Mean Reversion**: Consider if price is extended from moving averages

PREDICTION GUIDELINES:
- If price is > 2 std dev from mean → Predict reversion toward mean
- If volume is declining → Predict consolidation (small movement)
- If near strong support/resistance → Predict bounce/rejection
- Default to CONSERVATIVE predictions (1-2% moves) unless strong signals

RESPOND IN THIS EXACT JSON FORMAT (no markdown, just raw JSON):
{
  "predictions": [89500.00],
  "confidence": 75,
  "reasoning": "Detailed technical analysis with specific numbers from Bollinger Bands, RSI, volume, support/resistance levels, and why this prediction is conservative and realistic...",
  "trend": "neutral",
  "recommendation": {
    "action": "HOLD",
    "entryZone": "$88,500 - $89,000",
    "target": "$90,000",
    "stopLoss": "$87,500"
  },
  "marketContext": "Bitcoin is consolidating after recent volatility. Price is testing 20-day SMA support. Volume is below average, suggesting limited conviction. Conservative prediction favors mean reversion..."
}

IMPORTANT: 
- Predicted price should be within 5% of current price unless exceptional circumstances
- Confidence should reflect uncertainty (70-85% is realistic, not 95%+)
- Trend should be "neutral" if no clear direction (most common)
- Be honest about limitations - crypto is volatile and unpredictable`;

  console.log('Calling Gemini AI (this may take 4 minutes)...');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const text = response.text;

  if (!text) {
    throw new Error('Empty response from AI');
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from AI');
  }

  return JSON.parse(jsonMatch[0]);
}

// Main function
async function main() {
  try {
    console.log('🤖 Starting daily prediction via Vercel proxy...');

    // Step 1: Update yesterday's completed prediction
    // We're looking for the prediction that was made FOR today
    // (because today's candle just closed)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    try {
      const actualPrice = await fetchYesterdayClosingPrice();
      console.log(`📅 Today: ${todayStr}, Looking for prediction with targetDate: ${todayStr}`);

      // Find prediction that was made FOR today
      const prediction = await prisma.prediction.findFirst({
        where: {
          targetDate: todayStr, // Prediction FOR today
          status: 'pending',
        },
      });

      if (prediction) {
        console.log(
          `📍 Found prediction: targetDate=${prediction.targetDate}, predicted=$${prediction.predictedPrice}`
        );

        const difference = Math.round((actualPrice - prediction.predictedPrice) * 100) / 100;
        const percentageError =
          ((actualPrice - prediction.predictedPrice) / prediction.predictedPrice) * 100;

        await prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            actualPrice: Math.round(actualPrice * 100) / 100,
            difference,
            percentageError,
            status: 'completed',
          },
        });

        console.log(
          `✅ Updated prediction for ${prediction.targetDate} with actual price: $${actualPrice}`
        );
        console.log(`   Difference: $${difference}, Error: ${percentageError.toFixed(2)}%`);
      } else {
        console.log(`⚠️ No pending prediction found for today (${todayStr})`);
      }
    } catch (error) {
      console.error('❌ Error updating prediction:', error.message);
      console.error(error.stack);
    }

    // Step 2: Fetch historical data via Vercel
    console.log('📊 Fetching historical data via Vercel proxy...');
    const historicalData = await fetchHistoricalData(1000);
    console.log(`✅ Fetched ${historicalData.length} candles`);

    // Step 3: Generate new prediction
    console.log('🔮 Generating prediction for tomorrow...');
    const prediction = await generatePrediction(historicalData);
    console.log('✅ AI prediction generated');

    // Step 4: Get admin user for automated predictions
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@crypto.com' },
    });

    if (!adminUser) {
      throw new Error('Admin user not found! Please create admin@crypto.com account first.');
    }

    console.log('✅ Using admin user for prediction:', adminUser.email);

    // Step 5: Save to database (check for duplicates first)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Check if prediction for tomorrow already exists
    const existingPrediction = await prisma.prediction.findFirst({
      where: {
        targetDate: tomorrowStr,
        status: 'pending',
      },
    });

    if (existingPrediction) {
      console.log(`⚠️ Prediction for ${tomorrowStr} already exists (ID: ${existingPrediction.id})`);
      console.log('✅ Daily prediction completed (skipped duplicate)!');
      return;
    }

    const saved = await prisma.prediction.create({
      data: {
        userId: adminUser.id,
        date: new Date().toISOString().split('T')[0],
        targetDate: tomorrowStr,
        predictedPrice: prediction.predictions[0],
        confidence: prediction.confidence,
        trend: prediction.trend,
        reasoning: prediction.reasoning,
        status: 'pending',
        action: prediction.recommendation?.action || 'HOLD',
        entryZone: prediction.recommendation?.entryZone || '',
        target: prediction.recommendation?.target || '',
        stopLoss: prediction.recommendation?.stopLoss || '',
        marketContext: prediction.marketContext || '',
      },
    });

    console.log('✅ Prediction saved to database:', saved.id);
    console.log('✅ Daily prediction completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
