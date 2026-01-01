// GitHub Actions script to generate daily BTC prediction
// This runs independently of Vercel, avoiding the 10-second timeout

const { GoogleGenAI } = require('@google/genai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Fetch with retry logic
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // Use dynamic import for node-fetch
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.log(`Attempt ${i + 1}/${retries} failed:`, error.message);
      if (i === retries - 1) throw error;
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Fetch Bitcoin historical data from Binance
async function fetchHistoricalData(days = 1000) {
  const endTime = Date.now();
  const startTime = endTime - days * 24 * 60 * 60 * 1000;

  console.log('Fetching from Binance API...');
  const data = await fetchWithRetry(
    `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=${days}`
  );

  return data.map(candle => ({
    time: candle[0],
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]),
  }));
}

// Fetch current BTC price
async function fetchCurrentPrice() {
  console.log('Fetching current BTC price...');
  const data = await fetchWithRetry('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
  return parseFloat(data.price);
}

// Generate prediction using Gemini AI
async function generatePrediction(historicalData) {
  const currentPrice = historicalData[historicalData.length - 1].close;

  const dataString = historicalData
    .slice(-100) // Only use last 100 candles for prompt (to avoid token limit)
    .map(
      (c, i) =>
        `${i + 1}. Close: $${c.close}, High: $${c.high}, Low: $${c.low}, Volume: $${c.volume}`
    )
    .join('\n');

  const prompt = `You are an expert cryptocurrency analyst specializing in Bitcoin price prediction.

Analyze the Bitcoin historical data and predict the NEXT DAY's closing price (UTC 00:00) with MAXIMUM ACCURACY.

HISTORICAL DATA (last 100 daily candles):
${dataString}

CURRENT PRICE: $${currentPrice}

CRITICAL ANALYSIS (Must Calculate):
1. **Bollinger Bands (20-day, 2 std dev)**
2. **Multi-Timeframe Trend**
3. **Volume Confirmation**
4. **Key Technical Indicators**

RESPOND IN THIS EXACT JSON FORMAT (no markdown, just raw JSON):
{
  "predictions": [93500.50],
  "confidence": 82,
  "reasoning": "Detailed technical analysis...",
  "trend": "bullish",
  "recommendation": {
    "action": "BUY",
    "entryZone": "$92,000 - $93,000",
    "target": "$94,500",
    "stopLoss": "$91,000"
  },
  "marketContext": "Market analysis summary..."
}`;

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
    console.log('🤖 Starting daily prediction...');

    // Step 1: Update yesterday's prediction
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    try {
      const actualPrice = await fetchCurrentPrice();

      const prediction = await prisma.prediction.findFirst({
        where: {
          targetDate: yesterdayStr,
          status: 'pending',
        },
      });

      if (prediction) {
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

        console.log(`✅ Updated yesterday's prediction with actual price: $${actualPrice}`);
      } else {
        console.log('No pending prediction found for yesterday');
      }
    } catch (error) {
      console.error("Error updating yesterday's prediction:", error.message);
      // Continue even if this fails
    }

    // Step 2: Fetch historical data
    console.log('📊 Fetching historical data...');
    const historicalData = await fetchHistoricalData(1000);
    console.log(`✅ Fetched ${historicalData.length} candles`);

    // Step 3: Generate new prediction
    console.log('🔮 Generating prediction for tomorrow (this may take 4 minutes)...');
    const prediction = await generatePrediction(historicalData);
    console.log('✅ AI prediction generated');

    // Step 4: Save to database
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const saved = await prisma.prediction.create({
      data: {
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
