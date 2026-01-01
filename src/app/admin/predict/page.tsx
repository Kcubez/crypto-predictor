'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { fetchBinanceCurrentPrice, FALLBACK_BTC_PRICE } from '@/lib/binance-api';
import { RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPredictPage() {
  const router = useRouter();
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(FALLBACK_BTC_PRICE);
  const [countdown, setCountdown] = useState(240);
  const [latestPrediction, setLatestPrediction] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!data.user || data.user.role !== 'admin') {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      await Promise.all([fetchPrice(), loadLatestPrediction()]);
    } catch (error) {
      console.error('Error checking admin:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrice = async () => {
    const price = await fetchBinanceCurrentPrice('BTCUSDT');
    if (price) {
      setCurrentPrice(price);
    }
  };

  const loadLatestPrediction = async () => {
    try {
      const response = await fetch('/api/predictions/latest');
      const data = await response.json();
      if (data.success && data.prediction) {
        setLatestPrediction(data.prediction);
      }
    } catch (error) {
      console.error('Error loading prediction:', error);
    }
  };

  const runPrediction = async () => {
    if (!confirm('Generate a new prediction for tomorrow? This will be visible to all users.')) {
      return;
    }

    setIsSimulating(true);
    setCountdown(240);

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
      // Call admin API endpoint (session-based auth, no secret needed)
      const response = await fetch('/api/admin/generate-prediction', {
        method: 'POST',
      });

      clearInterval(countdownInterval);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Prediction generated:', data);
        await loadLatestPrediction();
        alert('✅ Prediction generated successfully and visible to all users!');
      } else {
        const error = await response.json();
        console.error('❌ Prediction failed:', error);
        alert(`❌ Failed to generate prediction: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Prediction error:', error);
      alert('❌ Failed to generate prediction. Check console for details.');
      clearInterval(countdownInterval);
    } finally {
      setIsSimulating(false);
      setCountdown(240);
    }
  };

  const clearPrediction = async () => {
    if (!confirm('Clear the current prediction?')) return;

    try {
      const response = await fetch('/api/predictions/clear-latest', {
        method: 'DELETE',
      });

      if (response.ok) {
        setLatestPrediction(null);
        alert('✅ Prediction cleared!');
      }
    } catch (error) {
      console.error('Error clearing prediction:', error);
      alert('❌ Failed to clear prediction');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 p-4 sm:p-6 md:p-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin: Manage Predictions</h1>
          <p className="text-gray-400">Generate and manage BTC price predictions for all users</p>
        </div>

        {/* Current Price */}
        <Card className="mb-6 bg-slate-900/50 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Current BTC Price</p>
                <p className="text-3xl font-bold text-white">
                  $
                  {currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <Button onClick={fetchPrice} variant="outline" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Latest Prediction */}
        {latestPrediction && (
          <Card className="mb-6 bg-slate-900/50 border-green-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  Current Active Prediction
                </CardTitle>
                <Button
                  onClick={clearPrediction}
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400">Predicted Price</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${latestPrediction.predictedPrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Confidence</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {latestPrediction.confidence}%
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Target Date</p>
                <p className="text-white">{latestPrediction.targetDate}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Prediction Button */}
        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardContent className="pt-6">
            <Button
              onClick={runPrediction}
              disabled={isSimulating}
              className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg"
            >
              {isSimulating ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>
                    Generating Prediction... {Math.floor(countdown / 60)}:
                    {String(countdown % 60).padStart(2, '0')}
                  </span>
                </span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate New Prediction
                </>
              )}
            </Button>
            <p className="text-sm text-gray-400 mt-4 text-center">
              This will generate a new prediction and make it visible to all users
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
