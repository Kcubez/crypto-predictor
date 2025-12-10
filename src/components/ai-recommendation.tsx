"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface AIRecommendationProps {
  recommendation: {
    action: "BUY" | "SELL" | "HOLD";
    entryZone: string;
    target: string;
    stopLoss: string;
    reasoning: string;
  };
  priceChange: number;
}

export function AIRecommendation({
  recommendation,
  priceChange,
}: AIRecommendationProps) {
  const actionColor =
    recommendation.action === "BUY"
      ? "text-green-500"
      : recommendation.action === "SELL"
      ? "text-red-500"
      : "text-yellow-500";

  const actionBg =
    recommendation.action === "BUY"
      ? "bg-green-500/10 border-green-500/30"
      : recommendation.action === "SELL"
      ? "bg-red-500/10 border-red-500/30"
      : "bg-yellow-500/10 border-yellow-500/30";

  return (
    <Card className="mb-6 bg-gradient-to-br from-slate-900/80 to-purple-900/30 border-purple-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          AI RECOMMENDATION
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Action */}
          <div className="flex items-center gap-3">
            {recommendation.action === "SELL" ? (
              <TrendingDown className="w-8 h-8 text-red-500" />
            ) : (
              <TrendingUp className="w-8 h-8 text-green-500" />
            )}
            <span className={`text-4xl font-bold ${actionColor}`}>
              {recommendation.action}
            </span>
          </div>

          {/* Trading Zones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className={`p-4 rounded-lg border ${actionBg}`}>
              <p className="text-sm text-gray-400 mb-1">ENTRY ZONE</p>
              <p className="text-xl font-bold text-white">
                {recommendation.entryZone}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/30">
              <p className="text-sm text-gray-400 mb-1">TARGET (TP)</p>
              <p className="text-xl font-bold text-green-500">
                {recommendation.target}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/30">
              <p className="text-sm text-gray-400 mb-1">STOP LOSS</p>
              <p className="text-xl font-bold text-red-500">
                {recommendation.stopLoss}
              </p>
            </div>
          </div>

          {/* Reasoning */}
          <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-sm font-semibold text-purple-300 mb-2">
              Reasoning:
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">
              {recommendation.reasoning}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
