'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PriceChart } from './price-chart';
import { AIRecommendation } from './ai-recommendation';
import { MarketContext } from './market-context';
import { LoadingSpinner } from './loading-spinner';
import { generatePriceSimulation, SimulationData } from '@/lib/price-simulator';
// Using Binance API for everything (current price + historical data)
import {
  fetchBinanceKlines,
  mapTimeframeToBinanceInterval,
  fetchBinanceCurrentPrice,
  FALLBACK_BTC_PRICE,
  Candlestick,
} from '@/lib/binance-api';
// CoinGecko API (not used anymore)
// import { fetchBTCPrice, FALLBACK_BTC_PRICE } from "@/lib/btc-api";
// CoinMarketCap API (free tier doesn't support historical endpoint)
// import { fetchBTCHistoricalFromCMC, Candlestick } from "@/lib/coinmarketcap-api";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  ArrowLeft,
  Settings,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { PredictionTracker, PredictionTracking } from '@/lib/prediction-tracker';
import { PredictionTrackingCard } from './prediction-tracking-card';
import { usePrediction } from '@/contexts/prediction-context';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function BTCPredictor() {
  const { setIsPredicting } = usePrediction();
  const [timeframe] = useState<'1week'>('1week'); // Fixed to 1 day prediction for better accuracy
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(FALLBACK_BTC_PRICE);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [historicalData, setHistoricalData] = useState<Candlestick[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false); // Track if prediction was generated
  const [trackingData, setTrackingData] = useState<PredictionTracking | null>(null);
  const [countdown, setCountdown] = useState(240); // 4 minutes = 240 seconds
  const [aiOverloadError, setAiOverloadError] = useState(false); // Track AI overload
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // Check if user is admin

  const tracker = new PredictionTracker();

  // Load latest prediction from DATABASE on mount (not localStorage)
  useEffect(() => {
    fetchUserRole();
  }, []);

  // Load prediction after historical data is loaded
  useEffect(() => {
    if (historicalData.length > 0) {
      loadLatestPrediction();
    }
  }, [historicalData]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.user) {
        setIsAdmin(data.user.role === 'admin');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const loadLatestPrediction = async () => {
    try {
      const response = await fetch('/api/predictions/latest');
      const data = await response.json();

      if (data.success && data.prediction) {
        // Convert database prediction to simulation data format
        const pred = data.prediction;

        // Build chart data from historical data + prediction
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const chartData = [
          // Historical data (will be populated from historicalData state)
          ...historicalData.slice(-30).map(candle => ({
            time: new Date(candle.time).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            price: candle.close,
            isHistorical: true,
          })),
          // Predicted price for tomorrow
          {
            time: tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: pred.predictedPrice,
            isHistorical: false,
            isPrediction: true,
          },
        ];

        // Build simulation data from database prediction
        const simulationData = {
          predictedPrice: pred.predictedPrice,
          aiConfidence: pred.confidence,
          aiTrend: pred.trend,
          aiReasoning: pred.reasoning,
          recommendation: {
            action: (pred.trend === 'bullish'
              ? 'BUY'
              : pred.trend === 'bearish'
              ? 'SELL'
              : 'HOLD') as 'BUY' | 'SELL' | 'HOLD',
            entryZone: pred.entryZone || '',
            target: pred.target || '',
            stopLoss: pred.stopLoss || '',
            reasoning: pred.reasoning,
          },
          marketContext: pred.marketContext || pred.reasoning,
          chartData,
        };

        setSimulationData(simulationData);
        setHasGenerated(true);

        // Build tracking data from database prediction
        const trackingData: PredictionTracking = {
          id: pred.id,
          timestamp: new Date(pred.createdAt).getTime(),
          predictionDate: pred.date,
          predictions: [
            {
              day: 1,
              date: pred.targetDate,
              predictedPrice: pred.predictedPrice,
              actualPrice: pred.actualPrice || undefined,
              difference: pred.difference || undefined,
              percentageError: pred.percentageError || undefined,
              status: pred.status as 'pending' | 'completed',
            },
          ],
          aiConfidence: pred.confidence,
          trend: pred.trend as 'bullish' | 'bearish' | 'neutral',
        };

        setTrackingData(trackingData);
        console.log('✅ Built tracking data from database prediction');

        console.log('✅ Loaded latest prediction from database with chart data');
      } else {
        console.log('ℹ️ No prediction available yet');
      }
    } catch (error) {
      console.error('Error loading latest prediction:', error);
    }
  };

  // Fetch real-time BTC price from Binance
  const fetchPrice = async () => {
    setIsLoadingPrice(true);
    const price = await fetchBinanceCurrentPrice('BTCUSDT');
    if (price) {
      setCurrentPrice(price);
      setLastUpdated(new Date());
    }
    setIsLoadingPrice(false);
  };

  // Fetch historical data from Binance
  const fetchHistoricalData = async () => {
    setIsLoadingHistory(true);
    const interval = mapTimeframeToBinanceInterval(timeframe);
    console.log(`📊 Fetching Binance data: interval=${interval}, limit=1000`);

    // Fetch maximum available data for backend AI analysis
    // Binance API limit: 1000 candles per request
    const data = await fetchBinanceKlines('BTCUSDT', interval, 1000);

    if (data.length > 0) {
      const firstCandle = data[0];
      const lastCandle = data[data.length - 1];
      const firstDate = new Date(firstCandle.time).toISOString().split('T')[0];
      const lastDate = new Date(lastCandle.time).toISOString().split('T')[0];
      const daysDiff = Math.round((lastCandle.time - firstCandle.time) / (1000 * 60 * 60 * 24));

      console.log(`✅ Received ${data.length} candles`);
      console.log(`📅 Date range: ${firstDate} to ${lastDate}`);
      console.log(`⏱️  Total days: ${daysDiff} days`);
      console.log(`💰 First price: $${firstCandle.close.toLocaleString()}`);
      console.log(`💰 Last price: $${lastCandle.close.toLocaleString()}`);
    }

    setHistoricalData(data);
    setIsLoadingHistory(false);

    // Update chart if simulation data exists
    if (simulationData) {
      updateChartWithLatestData(data);
    }
  };

  // Update chart data with latest historical data
  const updateChartWithLatestData = (data: Candlestick[]) => {
    if (!simulationData) return;

    // Rebuild chart data with latest historical data (last 30 days)
    const displayHistoricalData = data.slice(-30);
    const updatedChartData = displayHistoricalData.map(candle => ({
      time: new Date(candle.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: candle.close,
      isHistorical: true,
    }));

    // Update simulation data with new chart data
    setSimulationData({
      ...simulationData,
      chartData: updatedChartData,
    });

    console.log('✅ Chart updated with latest historical data');
  };

  // Initial price fetch and periodic updates
  useEffect(() => {
    fetchPrice();

    // Refresh price every 60 seconds
    const interval = setInterval(fetchPrice, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch historical data when timeframe changes AND refresh daily after closing time
  useEffect(() => {
    fetchHistoricalData();

    let lastRefreshDate = new Date().toDateString();

    // Check every hour if we need to refresh
    const historicalInterval = setInterval(() => {
      const now = new Date();
      const currentDate = now.toDateString();

      // Get Myanmar time (UTC+6:30)
      const myanmarHour = (now.getUTCHours() + 6) % 24;
      const myanmarMinute = now.getUTCMinutes() + 30;

      // If it's past 6:30 AM Myanmar time AND we haven't refreshed today
      if (currentDate !== lastRefreshDate && myanmarHour >= 6 && myanmarMinute >= 30) {
        console.log('🔄 Daily auto-refresh: New day detected, updating historical data...');
        fetchHistoricalData();
        lastRefreshDate = currentDate;
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(historicalInterval);
  }, [timeframe]);

  // DON'T auto-run simulation - wait for user to click button
  // Remove the auto-run useEffect

  const runSimulation = async () => {
    if (historicalData.length === 0) return;

    // Clear existing data first (like page refresh)
    setSimulationData(null);
    setIsSimulating(true);
    setIsPredicting(true); // Disable navigation
    setCountdown(240); // Reset countdown to 4 minutes

    // Start countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      // Force refresh to get new AI predictions from Gemini
      const data = await generatePriceSimulation(historicalData, currentPrice, timeframe, true);

      // Clear countdown when done
      clearInterval(countdownInterval);
      setCountdown(240);

      setSimulationData(data);

      // Save to localStorage for persistence
      localStorage.setItem('btc_prediction', JSON.stringify(data));
      setHasGenerated(true); // Hide button after generation
      setAiOverloadError(false); // Clear any previous error

      console.log('✅ Prediction generated and saved to localStorage');

      // Debug: Check what data we have
      console.log('🔍 Full simulation data:', data);
      console.log('🔍 Recommendation object:', data.recommendation);
      console.log('🔍 Entry Zone:', data.recommendation?.entryZone);
      console.log('🔍 Target:', data.recommendation?.target);
      console.log('🔍 Stop Loss:', data.recommendation?.stopLoss);

      // Save to DATABASE so all users can see it
      try {
        const savePayload = {
          predictedPrice: data.predictedPrice,
          confidence: data.aiConfidence,
          trend: data.aiTrend || 'neutral',
          reasoning: data.recommendation?.reasoning || data.marketContext || '',
          // Add recommendation fields
          action: data.recommendation?.action || 'HOLD',
          entryZone: data.recommendation?.entryZone || '',
          target: data.recommendation?.target || '',
          stopLoss: data.recommendation?.stopLoss || '',
          marketContext: data.marketContext || data.recommendation?.reasoning || '',
        };

        console.log('📤 Sending to database:', savePayload);
        console.log('📤 Entry Zone value:', savePayload.entryZone);
        console.log('📤 Target value:', savePayload.target);
        console.log('📤 Stop Loss value:', savePayload.stopLoss);

        const saveResponse = await fetch('/api/predictions/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savePayload),
        });

        if (saveResponse.ok) {
          console.log('✅ Prediction also saved to database for all users');
        } else {
          console.warn('⚠️ Failed to save to database, but localStorage saved');
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Continue anyway - localStorage save succeeded
      }

      // Save prediction tracking
      if (data.chartData && data.aiConfidence) {
        const predictions = data.chartData.filter(d => !d.isHistorical).map(d => d.price);

        if (predictions.length === 1) {
          const tracking = tracker.savePrediction(
            predictions,
            data.aiConfidence,
            data.aiTrend || 'neutral'
          );
          setTrackingData(tracking);
          console.log('✅ Prediction tracking saved');
        }
      }
    } catch (error) {
      console.error('Simulation error:', error);
      clearInterval(countdownInterval);
      setCountdown(240);
      setAiOverloadError(true); // Show overload error
    } finally {
      setIsSimulating(false);
      setIsPredicting(false); // Re-enable navigation
    }
  };

  const clearPrediction = () => {
    // Clear localStorage
    localStorage.removeItem('btc_prediction');
    localStorage.removeItem('btc_prediction_tracking');

    // Reset state
    setSimulationData(null);
    setTrackingData(null);
    setHasGenerated(false);

    console.log('✅ Prediction data cleared');
  };

  const priceChange = simulationData
    ? ((simulationData.predictedPrice - currentPrice) / currentPrice) * 100
    : 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 p-4 sm:p-6 md:p-8">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                BTC Predictor
              </h1>
              <p className="text-xs sm:text-sm text-purple-300">Powered by MOT</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Last Updated</p>
              <p className="text-sm text-purple-300">
                {lastUpdated.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/history">
                <Button
                  variant="outline"
                  className="border-purple-500/30 hover:bg-purple-500/10 text-purple-300 hover:text-purple-200"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View History
                </Button>
              </Link>
              <Button
                onClick={() => setShowApiKeyModal(true)}
                variant="outline"
                size="icon"
                className="border-purple-500/30 hover:bg-purple-500/10"
                title="API Key Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                onClick={fetchPrice}
                disabled={isLoadingPrice}
                variant="outline"
                size="icon"
                className="border-purple-500/30 hover:bg-purple-500/10"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingPrice ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Current Price Display */}
        <Card className="mb-6 bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs sm:text-sm text-gray-400">Current BTC Price</p>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-500">Live</span>
                  </div>
                </div>
                {isLoadingPrice ? (
                  <div className="flex items-center gap-3">
                    <LoadingSpinner size="sm" />
                    <p className="text-xl text-gray-400">Loading...</p>
                  </div>
                ) : (
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    $
                    {currentPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Chart - Only show when prediction exists */}
        {simulationData && (
          <Card className="mb-6 bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Historical Price Data</CardTitle>
                <Button
                  onClick={fetchHistoricalData}
                  disabled={isLoadingHistory}
                  variant="outline"
                  size="icon"
                  className="border-purple-500/30 hover:bg-purple-500/10"
                  title="Refresh Historical Data"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PriceChart data={simulationData.chartData} timeframe={timeframe} />
            </CardContent>
          </Card>
        )}

        {/* AI Recommendation */}
        {simulationData && (
          <AIRecommendation
            recommendation={simulationData.recommendation}
            priceChange={priceChange}
          />
        )}

        {/* Market Context */}
        {simulationData && <MarketContext context={simulationData.marketContext} />}

        {/* AI Overload Error Message */}
        {aiOverloadError && (
          <Card className="mb-6 bg-red-900/20 border-red-500/30 backdrop-blur-sm">
            <CardContent className="py-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-red-400 mb-2">⚠️ AI Service Overloaded</h3>
                <p className="text-gray-300 mb-4">
                  The Gemini AI service is currently experiencing high demand or your API key quota
                  is exceeded.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    Option 1: Click "Clear Price Prediction" below, wait 30 seconds, then try again.
                  </p>
                  <p className="text-sm text-gray-400">
                    Option 2: Change your API key by clicking the ⚙️ settings button above.
                  </p>
                  <Button
                    onClick={() => setShowApiKeyModal(true)}
                    className="mt-4 bg-purple-600 hover:bg-purple-700"
                  >
                    ⚙️ Change API Key
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prediction Tracking Card */}
        {trackingData && (
          <div className="mt-8 mb-6">
            <PredictionTrackingCard
              tracking={trackingData}
              overallAccuracy={tracker.calculateOverallAccuracy(trackingData)}
              completionStatus={tracker.getCompletionStatus(trackingData)}
            />
          </div>
        )}
      </div>

      {/* API Key Settings Modal */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚙️ API Key Settings</DialogTitle>
            <DialogDescription>
              Enter your Gemini API key to use for predictions. This will be stored in your
              browser's localStorage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Gemini API Key</label>
              <Input
                type="password"
                placeholder="Enter your API key..."
                value={tempApiKey}
                onChange={e => setTempApiKey(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApiKeyModal(false);
                  setTempApiKey('');
                }}
                className="border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (tempApiKey.trim()) {
                    localStorage.setItem('gemini_api_key', tempApiKey.trim());
                    setApiKey(tempApiKey.trim());
                    setShowApiKeyModal(false);
                    setTempApiKey('');
                    setAiOverloadError(false);
                    alert('API Key saved successfully! You can now run predictions.');
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Save API Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
