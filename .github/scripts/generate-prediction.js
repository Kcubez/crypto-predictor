// GitHub Actions script to generate daily BTC prediction
// This runs independently of Vercel, avoiding the 10-second timeout

const { GoogleGenAI } = require('@google/genai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Fetch Bitcoin historical data from Binance
async function fetchHistoricalData(days = 1000) {
  const endTime = Date.now();
  const startTime = endTime - days * 24 * 60 * 60 * 1000;

  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=${days}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch historical data');
  }

  const data = await response.json();

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
  const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');

  if (!response.ok) {
    throw new Error('Failed to fetch current price');
  }

  const data = await response.json();
  return parseFloat(data.price);
}

// Generate prediction using Gemini AI
async function generatePrediction(historicalData) {
  const currentPrice = historicalData[historicalData.length - 1].close;

  const dataString = historicalData
    .map(
      (c, i) =>
        `${i + 1}. Close: $${c.close}, High: $${c.high}, Low: $${c.low}, Volume: $${c.volume}`
    )
    .join('\n');

  const prompt = `You are an expert cryptocurrency analyst specializing in Bitcoin price prediction.

Analyze the Bitcoin historical data and predict the NEXT DAY's closing price (UTC 00:00) with MAXIMUM ACCURACY.

HISTORICAL DATA (${historicalData.length} daily candles):
${dataString}

CURRENT PRICE: $${currentPrice}

[... rest of prompt same as in route.ts ...]

RESPOND IN THIS EXACT JSON FORMAT (no markdown, just raw JSON):
{
  "predictions": [93500.50],
  "confidence": 82,
  "reasoning": "...",
  "trend": "bullish",
  "recommendation": {
    "action": "BUY",
    "entryZone": "$92,000 - $93,000",
    "target": "$94,500",
    "stopLoss": "$91,000"
  },
  "marketContext": "..."
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
      }
    } catch (error) {
      console.error("Error updating yesterday's prediction:", error);
    }

    // Step 2: Fetch historical data
    console.log('📊 Fetching historical data...');
    const historicalData = await fetchHistoricalData(1000);

    // Step 3: Generate new prediction
    console.log('🔮 Generating prediction for tomorrow (this may take 4 minutes)...');
    const prediction = await generatePrediction(historicalData);

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
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
