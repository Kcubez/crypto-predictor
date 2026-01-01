'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PredictionTracking, DailyPrediction } from '@/lib/prediction-tracker';
import { Target, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface PredictionTrackingCardProps {
  tracking: PredictionTracking;
  overallAccuracy: number;
  completionStatus: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export function PredictionTrackingCard({
  tracking,
  overallAccuracy,
  completionStatus,
}: PredictionTrackingCardProps) {
  const getErrorColor = (error: number) => {
    const absError = Math.abs(error);
    if (absError < 2) return 'text-green-400';
    if (absError < 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getErrorBgColor = (error: number) => {
    const absError = Math.abs(error);
    if (absError < 2) return 'bg-green-500/10 border-green-500/30';
    if (absError < 5) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <Card className="bg-linear-to-br from-slate-900/80 to-blue-900/30 border-blue-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="w-5 h-5" />
          AI Prediction Tracking
        </CardTitle>
        <p className="text-sm text-gray-400">Monitoring prediction accuracy in real-time</p>
      </CardHeader>
      <CardContent>
        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-xs text-gray-400 mb-1">Overall Accuracy</p>
            <p className="text-3xl font-bold text-green-400">{overallAccuracy.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              Based on {completionStatus.completed} completed predictions
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-xs text-gray-400 mb-1">Progress</p>
            <p className="text-3xl font-bold text-blue-400">
              {completionStatus.completed}/{completionStatus.total}
            </p>
            <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${completionStatus.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Prediction Info */}
        <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-gray-400">Prediction Made</p>
              <p className="text-white font-semibold">
                {new Date(tracking.timestamp).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400">AI Confidence</p>
              <p className="text-white font-semibold">{tracking.aiConfidence}%</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400">Trend</p>
              <div className="flex items-center gap-1">
                {tracking.trend === 'bullish' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : tracking.trend === 'bearish' ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : null}
                <p className="text-white font-semibold capitalize">{tracking.trend}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Predictions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Today Prediction</h3>
          {tracking.predictions.map(pred => (
            <div
              key={pred.day}
              className={`p-3 rounded-lg border transition-all ${
                pred.status === 'completed'
                  ? getErrorBgColor(pred.percentageError!)
                  : 'bg-slate-800/30 border-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {new Date(pred.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    Predicted: ${pred.predictedPrice.toLocaleString()}
                  </p>
                </div>
                {pred.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
              </div>

              {pred.status === 'completed' && pred.actualPrice ? (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">Actual Price</p>
                    <p className="text-white font-semibold">${pred.actualPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Difference</p>
                    <p className={`font-semibold ${getErrorColor(pred.percentageError!)}`}>
                      {pred.difference! > 0 ? '+' : ''}$
                      {Math.abs(pred.difference!).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Error</p>
                    <p className={`font-semibold ${getErrorColor(pred.percentageError!)}`}>
                      {pred.percentageError! > 0 ? '+' : ''}
                      {pred.percentageError!.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Waiting for {new Date(pred.date).toLocaleDateString()}...
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-gray-500 mb-2">Accuracy Legend:</p>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-400">&lt; 2% error (Excellent)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-400">2-5% error (Good)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-400">&gt; 5% error (Needs Improvement)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
