'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Brain,
  BarChart3,
} from 'lucide-react';

interface PredictionRecord {
  id: string;
  date: string;
  targetDate: string;
  predictedPrice: number;
  actualPrice?: number;
  difference?: number;
  percentageError?: number;
  confidence: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  reasoning: string;
  status: 'pending' | 'completed';
  createdAt: number;
  updatedAt?: number;
}

interface AccuracyStats {
  totalPredictions: number;
  completedPredictions: number;
  averageError: number;
  accuracy: number;
}

export default function PredictionHistory() {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [stats, setStats] = useState<AccuracyStats | null>(null);
  const [filter, setFilter] = useState<'7days' | '1month' | 'all'>('7days');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/predictions/history?filter=${filter}`);
      const data = await response.json();

      if (data.success) {
        setPredictions(data.predictions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'bearish':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'completed' ? (
      <CheckCircle2 className="w-5 h-5 text-green-400" />
    ) : (
      <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
    );
  };

  const getAccuracyColor = (error: number) => {
    const absError = Math.abs(error);
    if (absError < 1) return 'text-green-400';
    if (absError < 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="container mx-auto px-2 sm:px-4 pt-4 sm:pt-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Prediction History
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 mt-0.5 sm:mt-1">
                Track daily predictions vs actual prices
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <Card className="bg-linear-to-br from-slate-900/80 to-purple-900/30 border-purple-500/30 hover:border-purple-500/50 transition-all hover:scale-[1.02]">
              <CardContent className="pt-4 sm:pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1">Total</p>
                    <p className="text-xl sm:text-3xl font-bold text-white">
                      {stats.totalPredictions}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-slate-900/80 to-green-900/30 border-green-500/30 hover:border-green-500/50 transition-all hover:scale-[1.02]">
              <CardContent className="pt-4 sm:pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1">Completed</p>
                    <p className="text-xl sm:text-3xl font-bold text-white">
                      {stats.completedPredictions}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-slate-900/80 to-blue-900/30 border-blue-500/30 hover:border-blue-500/50 transition-all hover:scale-[1.02]">
              <CardContent className="pt-4 sm:pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1">Avg Error</p>
                    <p className="text-xl sm:text-3xl font-bold text-white">
                      {stats.averageError.toFixed(2)}%
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-slate-900/80 to-yellow-900/30 border-yellow-500/30 hover:border-yellow-500/50 transition-all hover:scale-[1.02]">
              <CardContent className="pt-4 sm:pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1">Accuracy</p>
                    <p className="text-xl sm:text-3xl font-bold text-white">
                      {stats.accuracy.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Tabs */}
        <Card className="bg-linear-to-br from-slate-900/80 to-purple-900/20 border-purple-500/30 mb-6">
          <CardContent className="pt-6">
            <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
                <TabsTrigger
                  value="7days"
                  className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600"
                >
                  Last 7 Days
                </TabsTrigger>
                <TabsTrigger
                  value="1month"
                  className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600"
                >
                  Last Month
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600"
                >
                  All Time
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Predictions List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-r from-purple-600 to-pink-600 mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <p className="text-xl text-gray-300 font-medium">Loading predictions...</p>
            <p className="text-sm text-gray-500 mt-2">Fetching your prediction history</p>
          </div>
        ) : predictions.length === 0 ? (
          <Card className="bg-linear-to-br from-slate-900/80 to-purple-900/20 border-purple-500/30">
            <CardContent className="pt-16 pb-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-r from-purple-600/20 to-pink-600/20 mb-6">
                <AlertCircle className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No Predictions Yet</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Predictions will appear here after the auto daily prediction runs at 6:30 AM Myanmar
                time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {predictions.map((pred, index) => (
              <Card
                key={pred.id}
                className="bg-linear-to-br from-slate-900/80 to-purple-900/20 border-purple-500/30 hover:border-purple-500/50 transition-all hover:scale-[1.02] animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(pred.status)}
                      <div>
                        <CardTitle className="text-white text-xl flex flex-wrap items-center gap-2">
                          {formatDate(pred.targetDate)}
                          <span
                            className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap inline-flex items-center gap-1 ${getTrendColor(
                              pred.trend
                            )}`}
                          >
                            {getTrendIcon(pred.trend)}
                            <span className="capitalize">{pred.trend}</span>
                          </span>
                        </CardTitle>
                        <p className="text-sm text-gray-400 mt-1">
                          Predicted on {formatDate(pred.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Confidence</p>
                      <p className="text-2xl font-bold text-purple-400">{pred.confidence}%</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <p className="text-xs text-gray-400 mb-1">Predicted Price</p>
                      <p className="text-2xl font-bold text-white">
                        {formatPrice(pred.predictedPrice)}
                      </p>
                    </div>

                    {pred.actualPrice ? (
                      <>
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                          <p className="text-xs text-gray-400 mb-1">Actual Price</p>
                          <p className="text-2xl font-bold text-white">
                            {formatPrice(pred.actualPrice)}
                          </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                          <p className="text-xs text-gray-400 mb-1">Difference</p>
                          <p
                            className={`text-2xl font-bold ${
                              pred.difference! >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {pred.difference! >= 0 ? '+' : ''}
                            {formatPrice(pred.difference!)}
                          </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                          <p className="text-xs text-gray-400 mb-1">Error</p>
                          <p
                            className={`text-2xl font-bold ${getAccuracyColor(
                              pred.percentageError!
                            )}`}
                          >
                            {pred.percentageError! >= 0 ? '+' : ''}
                            {pred.percentageError!.toFixed(2)}%
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="col-span-3 bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
                        <p className="text-sm text-yellow-300">
                          Waiting for closing price on {formatDate(pred.targetDate)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Only show AI Reasoning for the most recent prediction */}
                  {index === 0 && (
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <p className="text-sm font-medium text-purple-300">AI Reasoning</p>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{pred.reasoning}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Professional Footer */}
        <div className="mt-16 pt-6 border-t border-slate-800">
          {/* Feature Highlights - Compact */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>AI-Powered Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Technical Indicators</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Target className="w-4 h-4 text-green-400" />
              <span>Trading Signals</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-center pb-2">
            <p className="text-xs sm:text-sm text-gray-500">
              Disclaimer: This tool is for educational purposes only. Always do your own research
              before making investment decisions.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Powered by Gemini 2.5 Flash & Advanced Technical Analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
